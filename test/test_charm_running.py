import browser
import unittest


class TestBasics(browser.TestCase):

    def test_title(self):
        self.load()
        self.assertTrue('Juju Admin' in self.driver.title)

    def test_environment_name(self):
        self.load()
        body = self.driver.find_element_by_xpath('//body')
        self.assertTrue('Environment on ' in body.text)

    def test_environment_connection(self):
        # The GUI connects to the API backend.
        self.load()

        def connected(driver):
            return driver.execute_script('return app.env.get("connected");')
        self.wait_for(connected, 'Environment not connected.')

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
            tests_completed, 'Unable to complete test run.', timeout=30)
        if failures:
            msg = '{} failure(s) running {} tests.'.format(failures, total)
            self.fail(msg)


if __name__ == '__main__':
    unittest.main()
