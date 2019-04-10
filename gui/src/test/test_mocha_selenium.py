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

import os
from selenium.common import exceptions
import unittest

import browser

# This timeout only effects how lone selenium waits. Test runs also are
# effected by a Mocha timeout in the test/index.html setup.
TIMEOUT = 10000


class TestTests(browser.TestCase):

    def test_gui_unit_tests(self):
        # Ensure Juju GUI unit tests pass.
        def tests_completed(driver):
            stats = driver.execute_script('return testRunner.stats;')
            # Return when tests completed or a failure occurred.
            # The duration and end values are only specified after the tests
            # complete. Sometimes only one or the other are available, for
            # reasons yet to be determined.
            if stats.get('duration') or stats.get('end') or stats['failures']:
                return stats['tests'], stats['failures']

        def run_tests():
            # Ensure the window receives focus. In Firefox, blur/focus unit
            # tests fail if the window in which they are running is not
            # focused. See https://bugzilla.mozilla.org/show_bug.cgi?id=566671
            self.driver.execute_script('window.focus();')
            self.wait_for_css_selector('#mocha-stats')
            try:
                total, failures = self.wait_for(
                    tests_completed, 'Unable to complete test run.',
                    timeout=TIMEOUT)
            except exceptions.TimeoutException:
                msg = "Tests did not complete. Check video and timeout value"
                browser.printerr(msg)
                browser.printerr("Test Runner Stats:")
                browser.printerr(
                    self.driver.execute_script('return testRunner.stats;'))
                browser.printerr("Re-raising TimeoutException")
                raise
            return total, failures

        self.load('/test/index.html')
        total, failures = run_tests()

        if failures:
            msg = '{} failure(s) running {} tests.'.format(failures, total)
            self.fail(msg)


if __name__ == '__main__':
    browser.browser_name = os.getenv('JUJU_GUI_TEST_BROWSER', 'local-firefox')
    unittest.main()
