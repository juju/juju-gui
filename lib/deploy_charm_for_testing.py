# This file is part of the Juju GUI, which lets users view and manage Juju
# environments within a graphical interface (https://launchpad.net/juju-gui).
# Copyright (C) 2012-2013 Canonical Ltd.
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License version 3, as published by
# the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
# SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from __future__ import print_function

import argparse
import json
from shelltoolbox import (
    command,
    run,
)
import sys
import time
import tempfile
import yaml
import subprocess
import os
import os.path
import re

from retry import retry

juju_command = command('juju', '-v')

DEFAULT_ORIGIN = 'lp:juju-gui'
DEFAULT_CHARM = 'cs:~juju-gui/precise/juju-gui'


def juju(s):
    try:
        return juju_command(*s.split())
    except subprocess.CalledProcessError as err:
        print("Error running", repr(s))
        print(err.output)
        raise


# We found that the juju status call fails intermittently in
# canonistack. This works around that particular fragility.
@retry(subprocess.CalledProcessError, tries=3)
def get_status():
    """Get the current status info as a JSON document."""
    return juju('status --environment juju-gui-testing --format json')


def get_state(get_status=get_status):
    status = json.loads(get_status())
    unit = status['services']['juju-gui']['units']['juju-gui/0']
    return unit['agent-state']


def get_machine_state(get_status=get_status):
    status = json.loads(get_status())
    machine = status['machines']['1']['instance-state']
    return machine


def make_config_file(options):
    """Create a Juju GUI charm config file. Return the config file object.

    This function can also be used as a context manager.
    """
    config = {'juju-gui': options}
    config_file = tempfile.NamedTemporaryFile()
    config_file.write(yaml.dump(config))
    config_file.flush()
    # The NamedTemporaryFile instance is returned instead of just the name
    # because we want to take advantage of garbage collection-triggered
    # deletion of the temp file when it goes out of scope in the caller.
    return config_file


def wait_for_service(get_state=get_state, sleep=time.sleep):
    """Wait for the service to start or for it to enter an error state."""
    while True:
        state = get_state()
        if 'error' in state:
            raise RuntimeError('error deploying service')
        if state == 'started':
            break
        sleep(10)


def wait_for_machine(get_state=get_state, sleep=time.sleep):
    while True:
        state = get_machine_state()
        if state == 'running':
            break
        sleep(5)


def make_parser():
    parser = argparse.ArgumentParser(
        description='Deploy juju-gui for testing')
    parser.add_argument('--origin', default=DEFAULT_ORIGIN)
    parser.add_argument('--charm', default=DEFAULT_CHARM)
    return parser


def parse():
    p = make_parser()
    return p.parse_args()


def parse_image_data(data):
    """Parse the image data from nova image-list."""
    img_regex = re.compile(
        '^\| ([0-9a-f\-]+) \| ' +
        '(ubuntu\-released\/ubuntu\-precise\-12\.04\-amd64[\w\-\.\/]+)\s+\|' +
        ' ACTIVE \|.*$',
        flags=re.MULTILINE)
    matches = img_regex.findall(data)
    if len(matches):
        return matches[-1]
    return None, None


def get_image_id():
    """Get the most recent image (ubuntu released, precise, amd64)."""
    image_data = run(*'nova --no-cache image-list'.split())
    if not image_data:
        return None
    image_id, description = parse_image_data(image_data)
    print("Using image {} ({})".format(image_id, description))
    return image_id


def make_environments_yaml():
    juju_dir = os.path.expanduser("~/.juju")
    template_fn = os.path.join(juju_dir, "environments.yaml.template")
    if not os.path.exists(template_fn):
        # The template file does not exist, so just use the existing
        # environments.yaml file.
        print('Using existing environments.yaml '
              'file since no template was found.')
        return
    image_id = get_image_id()
    if image_id is None:
        raise Exception("No matching image found.")
    with open(template_fn) as f:
        template = f.read()
    with open(os.path.join(juju_dir, "environments.yaml"), "w") as f:
        f.write(template.format(image_id=image_id))


def main(options=parse, print=print, juju=juju,
        wait_for_service=wait_for_service, make_config_file=make_config_file,
        wait_for_machine=wait_for_machine,
        make_environments_yaml=make_environments_yaml):
    """Deploy the Juju GUI service and wait for it to become available."""
    args = options()

    # Create a new environments.yaml file but only if an appropriate template
    # is found.
    make_environments_yaml()

    # Get the IP that we should associate with the charm.  This is only used
    # by Canonistack, and is effectively our flag for that environment.
    instance_ip = os.environ.get("JUJU_INSTANCE_IP")
    try:
        print('Bootstrapping...')
        if instance_ip:
            # We are deploying in Canonistack.
            # The default m1.tiny was so small that the improv server would
            # sometimes fail to start. The m1.medium is more difficult to
            # obtain on canonistack than m1.small, so m1.small seems to be
            # "just right."
            juju('bootstrap --environment juju-gui-testing '
                 '--constraints instance-type=m1.small')
        else:
            juju('bootstrap --environment juju-gui-testing')
        print('Deploying service...')
        options = {'serve-tests': True, 'staging': True, 'secure': False,
                   'juju-gui-source': args.origin}
        print('Setting origin for charm to deploy %s' % args.origin)
        with make_config_file(options) as config_file:
            juju('deploy --environment juju-gui-testing --config {} {}'.format(
                config_file.name, args.charm))

        print('Waiting for service to start...')
        wait_for_machine()
        if instance_ip:
            print('Assigning JUJU_INSTANCE_IP %s' % instance_ip)
            instance_id = subprocess.check_output(
                "euca-describe-instances | grep INSTANCE | "
                "grep juju-juju-gui-testing-instance-1 | awk '{print $2;}'",
                shell=True).strip()
            internal_ip = subprocess.check_output(
                "euca-describe-instances | grep INSTANCE | "
                "grep juju-juju-gui-testing-instance-1 | awk '{print $12;}'",
                shell=True).strip()
            with open('juju-internal-ip', 'w') as fp:
                fp.write(internal_ip)
            print ('Storing Internal IP as %s' % internal_ip)
            subprocess.check_call("euca-associate-address -i %s %s" % (
                instance_id, instance_ip), shell=True)
            print('Assigned IP to %s' % instance_id)

        wait_for_service()
        print('Exposing the service...')
        juju('expose juju-gui --environment juju-gui-testing')
        return 0
    except RuntimeError, e:
        print("Execution failure, unable to continue")
        print(e)
    return 1

if __name__ == '__main__':
    sys.exit(main())
