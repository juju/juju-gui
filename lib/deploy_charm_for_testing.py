from __future__ import print_function

import argparse
import json
import shelltoolbox
import sys
import time
import tempfile
import yaml
import subprocess
import os

from retry import retry

juju_command = shelltoolbox.command('juju', '-v')

DEFAULT_ORIGIN = 'lp:juju-gui'
DEFAULT_CHARM = 'cs:~juju-gui/precise/juju-gui'


def juju(s):
    try:
        return juju_command(*s.split())
    except subprocess.CalledProcessError as err:
        print("Error running", repr(s))
        print(err.output)
        raise


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
            print(get_status())
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


def main(options=parse, print=print, juju=juju,
        wait_for_service=wait_for_service, make_config_file=make_config_file,
        wait_for_machine=wait_for_machine):
    """Deploy the Juju GUI service and wait for it to become available."""
    args = options()
    try:
        print('Bootstrapping...')
        juju('bootstrap --environment juju-gui-testing '
             '--constraints instance-type=m1.small')
        print('Deploying service...')
        options = {'serve-tests': True, 'staging': True, 'secure': False,
                   'juju-gui-source': args.origin}
        print('Setting origin for charm to deploy %s' % args.origin)
        with make_config_file(options) as config_file:
            juju('deploy --environment juju-gui-testing --config {} {}'.format(
                config_file.name, args.charm))

        print('Waiting for service to start...')
        wait_for_machine()
        # Fetches the instance ID from the testing instances to apply an IP to
        instance_ip = os.environ.get("JUJU_INSTANCE_IP")
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
