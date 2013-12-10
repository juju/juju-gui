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
                    timeout=600)
            except exceptions.TimeoutException:
                msg = "Tests did not complete. Check video and timeout value"
                browser.printerr(msg)
                browser.printerr("Test Runner Stats:")
                browser.printerr(
                    self.driver.execute_script('return testRunner.stats;'))
                browser.printerr("Re-raising TimeoutException")
                raise
            return total, failures
        self.load('/test/')
        for i in range(5):
            total, failures = run_tests()
            if failures and i < 4 and total < 100:
                # XXX bug 1161937 gary 2013-03-29
                # We sometimes see initial failures and we don't know why :-(.
                # Reload and retry.
                msg = '{} failure(s) running {} tests.  Retrying.'.format(
                    failures, total)
                browser.printerr(msg)
                self.driver.refresh()
            else:
                break
        if failures:
            msg = '{} failure(s) running {} tests.'.format(failures, total)
            self.fail(msg)


class DeployTestMixin(object):
    """Mixin exposing a deploy method."""

    def get_service_names(self):
        """Return the set of services' names displayed in the current page."""
        def services_found(driver):
            services = driver.find_elements_by_css_selector('.service .name')
            try:
                return set([element.text for element in services])
            except exceptions.StaleElementReferenceException:
                # One or more elements are no longer attached to the DOM.
                return False
        return self.wait_for(services_found, 'Services not displayed.')

    def deploy(self, charm_name):
        """Deploy a charm.

        This method only starts the deployment process. If waiting for the
        newly created service to be ready is required, use
        self.assert_deployed(service_name) right after the deploy() call.
        """
        # Warning!
        # This depends on manage.jujucharms.com being up and working properly.
        # For many reasons, hopefully this is not an issue :-) but if
        # some inexplicable failure is going on here, you may want to
        # investigate in that direction.
        def get_search_box(driver):
            # The charm browser sidebar should be open by default.
            return driver.find_element_by_css_selector('[name=bws-search]')

        def get_charm_token(driver):
            # See http://www.w3.org/TR/css3-selectors/#attribute-substrings .
            return driver.find_element_by_css_selector(
                '.yui3-token-content '
                '.token[data-charmid*={}]'.format(charm_name))

        def get_add_button(driver):
            return driver.find_element_by_css_selector('.bws-view-data .add')

        def get_deploy_button(driver):
            return driver.find_element_by_css_selector(
                '.viewlet-manager-wrapper .confirm')

        # Search for the charm
        search_box = self.wait_for(
            get_search_box, error='Charm search box is not visible')
        search_box.send_keys(charm_name)
        search_box.send_keys('\n')
        # The search autocomplete does not always close in time to click on
        # the charm token. This attempt to force it to be closed by moving
        # focus to another node first, then trying to click on the selected
        # charm token.
        self.driver.find_element_by_css_selector(
            '#zoom-out-btn').click()

        # Open details page
        charm_token = self.wait_for(
            get_charm_token, error='Charm sidebar is not visible.')
        charm_token.click()

        # Create Ghost
        add_button = self.wait_for(
            get_add_button, error='Charm details page is not visible.')
        add_button.click()

        # Deploy a charm.
        deploy_button = self.wait_for(
            get_deploy_button, error='Charm config panel is not visible.')
        deploy_button.click()

    def assert_deployed(self, service_name):
        """Ensure the given service is actually present in the environment."""
        # Close, if displayed, the cookie policy message box, so that it does
        # not hide the zoom control widgets.
        cookie_msg_close_link = self.driver.find_element_by_css_selector(
            '.cookie-policy a')
        self.click(cookie_msg_close_link)
        # Zoom out so that it is possible to see the deployed service in
        # Saucelabs.  This also seems to fix a Firefox bug preventing the name
        # of the service to be retrieved if the associated element is not
        # displayed.
        zoom_out = self.driver.find_element_by_id('zoom-out-btn')
        for _ in range(2):
            self.click(zoom_out)

        def service_deployed(driver):
            return service_name in self.get_service_names()
        self.wait_for(
            service_deployed,
            error='Service {} not deployed.'.format(service_name))


class TestNotifications(browser.TestCase, DeployTestMixin):

    def setUp(self):
        super(TestNotifications, self).setUp()
        self.load()
        self.handle_browser_warning()
        self.handle_login()

    def get_notifications(self):
        """Return the contents of currently displayed notifications."""
        notifier_box = self.wait_for_css_selector('.notifier-box')
        notifications = notifier_box.find_elements_by_xpath('./*')
        return [notification.text for notification in notifications]

    def test_initial(self):
        # No error notifications are displayed when the page is loaded.
        notifications = self.get_notifications()
        self.assertEqual(0, len(notifications))

    def test_error(self):
        # An error notification is created when attempting to deploy a service
        # with an already used name.
        # The service name is arbitrary, and connected to the charm name only
        # by default/convention. Since charms are deployed using the default
        # name, it is safe to reuse one of the service names here.
        self.deploy('mysql')
        service = self.get_service_names().pop()
        self.deploy(service)
        notifications = self.get_notifications()
        self.assertEqual(1, len(notifications))
        expected = (
            'Attempting to deploy service {}\n'
            'A service with that name already exists.'
        ).format(service)
        self.assertEqual(expected, notifications[0])


class TestStaging(browser.TestCase, DeployTestMixin):

    def test_charm_deploy(self):
        # A charm can be deployed using the GUI.
        self.addCleanup(self.restart_api)
        self.load()
        self.handle_browser_warning()
        # The unit tests log us out so we want to make sure we log back in.
        self.handle_login()
        self.deploy('appflower')
        self.assert_deployed('appflower')

    def test_initial_services(self):
        # The staging API backend contains already deployed services.
        self.load()
        self.handle_browser_warning()
        self.handle_login()
        expected = ('haproxy', 'mediawiki', 'memcached', 'mysql', 'wordpress')
        self.assertEqual(set(expected), self.get_service_names())

    def test_service_view(self):
        # The service detail page is correctly displayed.
        self.load('/:gui:/service/haproxy/')  # Navigate to service details.
        self.handle_browser_warning()
        self.handle_login()

        def service_name_displayed(driver):
            node = driver.find_element_by_id('service-display-name')
            try:
                return node.text
            except exceptions.StaleElementReferenceException:
                # Perhaps the page has changed since it was looked up.
                return False

        service_name = self.wait_for(
            service_name_displayed, error='Service name not displayed.')
        self.assertEqual('haproxy', service_name)

    def test_unit_view(self):
        # The unit detail page is correctly displayed.
        self.load('/:gui:/unit/haproxy-0/')  # Navigate to unit details.
        self.handle_browser_warning()
        self.handle_login()
        unit_name = self.driver.find_element_by_tag_name('h1').text
        self.assertEqual('haproxy/0', unit_name)


class TestSandbox(browser.TestCase, DeployTestMixin):

    @classmethod
    def setUpClass(cls):
        super(TestSandbox, cls).setUpClass()
        # Switch to sandbox mode.
        cls.change_options({'sandbox': True})
        cls.wait_for_config(
            'sandbox: true', error='Unable to switch to sandbox mode.')

    @classmethod
    def tearDownClass(cls):
        # Restore staging mode.
        cls.change_options({'sandbox': False})
        cls.wait_for_config(
            'sandbox: false', error='Unable to restore staging mode.')
        super(TestSandbox, cls).tearDownClass()

    def test_charm_deploy(self):
        # The sandbox mode is able to deploy a charm.
        self.load()
        self.handle_browser_warning()
        self.handle_login()
        self.deploy('appflower')
        self.assert_deployed('appflower')


if __name__ == '__main__':
    unittest.main()
