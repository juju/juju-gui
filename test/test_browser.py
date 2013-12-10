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
import unittest

from selenium.common import exceptions

import browser


class TestBasics(browser.TestCase):

    def test_title(self):
        self.load()
        self.assertTrue('Juju Admin' in self.driver.title)

    def test_environment_name(self):
        self.load()
        self.handle_browser_warning()
        # The next line attempts to work around an IE 10 fragility.
        # The symptom we are trying to avoid is an error as follows:
        # "JavaScript error (WARNING: The server did not provide any stacktrace
        # information)""
        self.wait_for_css_selector('svg')
        body = self.driver.find_element_by_xpath('//body')
        self.assertTrue('Environment on ' in body.text)

    def test_environment_connection(self):
        # The GUI connects to the API backend.
        self.load()
        self.handle_browser_warning()
        # The next line attempts to work around an IE 10 fragility.
        # The symptom we are trying to avoid is an error as follows:
        # "JavaScript error (WARNING: The server did not provide any stacktrace
        # information)""
        self.wait_for_css_selector('svg')
        script = 'return app && app.env && app.env.get("connected");'
        self.wait_for_script(script, 'Environment not connected.')


class TestAuthentication(browser.TestCase):

    def is_authenticated(self):
        """Return True if the user is authenticated, False otherwise."""
        script = 'return app.env.userIsAuthenticated;'
        return self.driver.execute_script(script)

    def process_path(self, path):
        """Load the given path, log out, log in again."""
        self.load(path)
        self.handle_browser_warning()
        self.handle_login()
        # Check the initial URL.
        self.wait_for_path(path, error='Not in the initial path.')
        self.assertTrue(self.is_authenticated(), 'initial state')
        # Logout.
        self.logout()
        # Check redirection to /login/.
        self.wait_for_path('/login/', error='Redirection to /login/ failed.')
        self.assertFalse(self.is_authenticated(), 'after logging out')
        # Login.
        self.login()
        # Ensure we are in the initial URL again.
        self.wait_for_path(path, error='Post login redirection failed.')
        self.assertTrue(self.is_authenticated(), 'after logging in again')

    def test_root_page(self):
        # It is possible to login to and logout from the root page.
        self.process_path('/')

    def test_service_page(self):
        # It is possible to login to and logout from the service detail view.
        self.process_path('/:gui:/service/haproxy/')

    def test_unit_page(self):
        # It is possible to login to and logout from the unit detail view.
        self.process_path('/:gui:/unit/haproxy-0/')

if __name__ == '__main__':
    browser.browser_name = 'local-firefox'
    unittest.main()
