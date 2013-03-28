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
            self.wait_for_css_selector('#mocha-stats')
            try:
                total, failures = self.wait_for(
                    tests_completed, 'Unable to complete test run.', timeout=90)
            except exceptions.TimeoutException:
                print(self.driver.execute_script('return testRunner.stats;'))
                raise
            return total, failures
        self.load('/test/')
        total, failures = run_tests()
        if failures:
            # We sometimes see initial failures and we don't know why :-(.
            # Reload and retry.
            print(
                '{} failure(s) running {} tests.  Retrying.'.format(
                    failures, total))
            self.driver.refresh()
            total, failures = run_tests()
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
        # The unit tests log us out so we want to make sure we log back in
        self.handle_login()

        def charm_panel_loaded(driver):
            """Wait for the charm panel to be ready and displayed."""
            charm_search = driver.find_element_by_id('charm-search-trigger')
            # Click to open the charm panel.
            # Implicit wait should let this resolve.
            charm_search.click()
            return driver.find_element_by_id('juju-search-charm-panel')

        charm_panel = self.wait_for(charm_panel_loaded)
        # Deploy appflower.
        deploy_button = charm_panel.find_element_by_css_selector(
            # See http://www.w3.org/TR/css3-selectors/#attribute-substrings
            'button.deploy[data-url*=appflower]')
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
        self.handle_login()
        expected = ('haproxy', 'mediawiki', 'memcached', 'mysql', 'wordpress')
        self.assertSetEqual(set(expected), self.get_service_names())


if __name__ == '__main__':
    unittest.main()
