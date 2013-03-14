import browser
import unittest

from selenium.common import exceptions


class TestBasics(browser.TestCase):

    def test_title(self):
        self.load()
        self.assertTrue('Juju Admin' in self.driver.title)

    def test_environment_name(self):
        self.load()
        self.handle_browser_warning()
        body = self.driver.find_element_by_xpath('//body')
        self.assertTrue('Environment on ' in body.text)

    def test_environment_connection(self):
        # The GUI connects to the API backend.
        self.load()
        self.handle_browser_warning()
        script = 'return app.env.get("connected");'
        self.wait_for_script(script, 'Environment not connected.')

    def test_gui_unit_tests(self):
        # Ensure Juju GUI unit tests pass.
        self.load('/test/')
        script = """
            var stats = testRunner.stats;
            return [testRunner.total, stats.tests, stats.failures];
        """

        def tests_completed(driver):
            total, done, failures = driver.execute_script(script)
            # Return when tests completed or a failure occurred.
            if (done == total) or failures:
                return total, failures

        total, failures = self.wait_for(
            tests_completed, 'Unable to complete test run.', timeout=60)
        if failures:
            msg = '{} failure(s) running {} tests.'.format(failures, total)
            self.fail(msg)


class TestDeploy(browser.TestCase):

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

    def test_charm_deploy(self):
        # A charm can be deployed using the GUI.
        self.addCleanup(self.restart_api)
        self.load()
        self.handle_browser_warning()

        def charm_panel_loaded(driver):
            """Wait for the charm panel to be ready and displayed."""
            charm_search = driver.find_element_by_id('charm-search-trigger')
            # Click to open the charm panel.
            # Implicit wait should let this resolve.
            charm_search.click()
            return driver.find_element_by_id('juju-search-charm-panel')

        charm_panel = self.wait_for(charm_panel_loaded)
        print "Charm panel", charm_panel
        # Deploy appflower.
        deploy_button = charm_panel.find_element_by_css_selector(
            # See http://www.w3.org/TR/css3-selectors/#attribute-substrings
            'button.deploy[data-url*=appflower]')
        print "Deploy Button", deploy_button
        deploy_button.click()
        # Click to confirm deployment.
        charm_panel.find_element_by_id('charm-deploy').click()

        def service_deployed(driver):
            return 'appflower' in self.get_service_names()
        self.wait_for(service_deployed, 'Service not deployed.')

    def test_staging_services(self):
        # The staging API backend contains already deployed services.
        self.load()
        self.handle_browser_warning()
        expected = ('haproxy', 'mediawiki', 'memcached', 'mysql', 'wordpress')
        self.assertSetEqual(set(expected), self.get_service_names())


if __name__ == '__main__':
    unittest.main()
