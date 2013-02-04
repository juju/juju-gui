from __future__ import print_function

import unittest
import sys
from deploy_charm_for_testing import (
    get_branch_url,
    get_state,
    main,
    wait_for_service,
    )


def noop(*args, **kws):
    pass


class TestArgumentParsing(unittest.TestCase):
    """The get_branch_url function does simple argument parsing."""

    def test_no_branch_given(self):
        # If there is no branch given, None is returned.
        branch = get_branch_url(['script-name'])
        self.assertIs(branch, None)

    def test_branch_given(self):
        # If a branch is given, the branch's URL is returned.
        branch = get_branch_url(['script-name', 'lp:foo'])
        self.assertEqual(branch, 'lp:foo')


class TestWaitingForService(unittest.TestCase):
    """The wait_for_service function does what it says."""

    def test_service_started(self):
        # If the service has already started, the function returns immediately.
        def get_service_state():
            return 'started'
        # The fact that no exception is raised shows that no unexpected
        # sleeping was done.
        def sleep(seconds):
            raise RuntimeError('narcolepsy')
        wait_for_service(get_service_state, sleep)

    def test_sleep_if_service_not_started(self):
        # If the service has not started, the sleep function is called.
        def get_service_state():
            return 'not started'
        class ZZZZ(Exception):
            pass
        def sleep(seconds):
            raise ZZZZ
        with self.assertRaises(ZZZZ):
            wait_for_service(get_service_state, sleep)

    def test_exception_on_error(self):
        # If the service is in an error state, an exception is raised.
        def get_service_state():
            return 'error: unnecessary zebra'
        with self.assertRaises(Exception):
            wait_for_service(get_service_state)

    def test_returns_when_transitions_to_started(self):
        # get_service_state and sleep are called repeatedly until the service
        # is started.
        statuses = ['installing', 'pending', 'pending', 'started']
        def get_service_state():
            return statuses[0]
        def sleep(seconds):
            statuses.pop(0)
        wait_for_service(get_service_state, sleep)


class TestParsingStatus(unittest.TestCase):
    """The Juju status is parsed from the output of --format json."""

    def test_state_is_extracted(self):
        # The "get_state" function pulls the juju-gui service state out of the
        # JSON document produced by "juju status --format json".
        def get_status():
            return ('{"services": {"juju-gui": {"units": {"juju-gui/0":'
                '{"agent-state": "started"}}}}}')
        self.assertEqual(get_state(get_status), 'started')


class TestScript(unittest.TestCase):
    """The main() function is the entry point when run as a script."""

    def test_status_messages_are_displayed(self):
        # While running, the script tells the user what is happening.
        printed = []
        main(argv=[], print=printed.append, juju=noop, wait_for_service=noop)
        self.assertSequenceEqual(
            printed,
            ['Bootstrapping...',
             'Deploying service...',
             'Waiting for service to start...',
             'Exposing the service...'])

    def test_providing_a_branch(self):
        # If the user provides a branch name on the command line, it will be
        # passed to the charm.
        printed = []
        juju_commands = []
        def juju(s):
            juju_commands.append(s)
        main(argv=['', 'lp:foo'], print=printed.append, juju=juju,
            wait_for_service=noop)
        self.assertSequenceEqual(
            printed,
            ['Bootstrapping...',
             'Deploying service...',
             'Setting branch for charm to deploy...',
             'Waiting for service to start...',
             'Exposing the service...'])
        self.assertIn(
            ('set juju-gui juju-gui-source=lp:foo --environment juju-gui-testing'),
            juju_commands)


if __name__ == '__main__':
    unittest.main()
