import browser
import os
import unittest


class TestBasics(browser.TestCase):

    def setUp(self):
        super(TestBasics, self).setUp()
        self.app_url = os.environ['APP_URL']

    def test_title(self):
        self.driver.get(self.app_url)
        self.assertTrue('Juju Admin' in self.driver.title)

    def test_environment_name(self):
        self.driver.get(self.app_url)
        body = self.driver.find_element_by_xpath('//body')
        self.assertTrue('Environment on ' in body.text)


if __name__ == '__main__':
    unittest.main()
