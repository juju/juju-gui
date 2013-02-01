#!/usr/bin/env python2

from __future__ import print_function

import json
import shelltoolbox
import sys
import time


juju = shelltoolbox.command('juju')

def get_branch_url(argv):
    """Extract the requested branch URL (if any)."""
    if len(argv) > 1:
        branch = argv[1]
    else:
        branch = None # trunk

    return branch


def get_status():
    """Get the current status info as a JSON document."""
    return juju(*'status --environment juju-gui-testing --format json'.split())


def get_state(get_status=get_status):
    status = json.loads(get_status())
    unit = status['services']['juju-gui']['units']['juju-gui/0']
    state = unit['agent-state']
    return state


def wait_for_service(get_state=get_state, sleep=time.sleep):
    """Wait for the service to start or for it to enter an error state."""
    while True:
        state = get_state()
        if 'error' in state:
            raise RuntimeError('error deploying service')
        if state == 'started':
            break
        sleep(10)


def main(argv, print=print, juju=juju, wait_for_service=wait_for_service):
    """Deploy the Juju GUI service and wait for it to become available."""
    branch = get_branch_url(argv)
    print('Bootstrapping...')
    juju(*'bootstrap --environment juju-gui-testing'.split())
    print('Deploying service...')
    juju(*'deploy juju-gui --environment juju-gui-testing'.split())
    if branch is not None:
        print('Setting branch for charm to deploy...')
        juju(*'set juju-gui juju-gui-source={} --environment juju-gui-testing'
            .format(branch).split())
    print('Waiting for service to start...')
    wait_for_service()
    print('Exposing the service...')
    juju(*'expose juju-gui --environment juju-gui-testing'.split())


if __name__ == '__main__':
    sys.exit(main(sys.argv))
