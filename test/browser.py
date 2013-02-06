from __future__ import print_function

import atexit
import base64
import getpass
import httplib
import json
import os
import selenium
import selenium.webdriver
import unittest


ie = dict(selenium.webdriver.DesiredCapabilities.INTERNETEXPLORER)
ie['platform'] = 'Windows 2012'
ie['version'] = '10'

chrome = dict(selenium.webdriver.DesiredCapabilities.CHROME)
chrome['platform'] = 'Linux'
# The saucelabs.com folks recommend using the latest version of Chrome because
# new versions come out so quickly, therefore there is no version specified
# here.

firefox = dict(selenium.webdriver.DesiredCapabilities.FIREFOX)
firefox['platform'] = 'Linux'
firefox['version'] = '18'

browser_capabilities = dict(ie=ie, chrome=chrome, firefox=firefox)

# Given the limited capabilities that the credentials impart (primarily the
# ability to run a web browser via Sauce Labs) and that anyone can sign up for
# their own credentials at no cost, it seems like an appropriate handling of
# the credentials to just include them here.
config = {
    'username': 'juju-gui',
    'access-key': '0a3b7821-93ed-4a2d-abdb-f34854eeaba3',
    }

credentials = ':'.join([config['username'], config['access-key']])
encoded_credentials = base64.encodestring(credentials)[:-1]
# This is saucelabs.com credentials and API endpoint rolled into a URL.
command_executor = 'http://%s@ondemand.saucelabs.com:80/wd/hub' % credentials
driver = None


def set_test_result(jobid, passed):
    headers = {'Authorization': 'Basic ' + encoded_credentials}
    url = '/rest/v1/%s/jobs/%s' % (config['username'], jobid)
    body = json.dumps({'passed': passed})
    connection = httplib.HTTPConnection('saucelabs.com')
    connection.request('PUT', url, body, headers=headers)
    if connection.getresponse().status != 200:
        raise RuntimeError('Unable to send test result to saucelabs.com')


class TestCase(unittest.TestCase):
    """Helper base class that supports runing browser tests."""

    @classmethod
    def setUpClass(cls):
        global driver # We only want one because they are expensive to set up.
        if driver is None:
            # We sometimes run the tests under different browsers, if none is
            # specified, use Chrome.
            browser_name = os.environ.get('JUJU_GUI_TEST_BROWSER', 'chrome')
            capabilities = browser_capabilities[browser_name].copy()
            capabilities['name'] = 'Juju GUI'
            user = getpass.getuser()
            capabilities['tags'] = [user]
            driver = selenium.webdriver.Remote(
                desired_capabilities=capabilities,
                command_executor=command_executor)
            print('Test run details at https://saucelabs.com/jobs/' +
                driver.session_id)
            # We want to tell saucelabs when all the tests are done.
            atexit.register(driver.quit)

    def setUp(self):
        self.driver = driver

    def run(self, result=None):
        self.last_result = result
        super(TestCase, self).run(result)

    def tearDown(self):
        successful = self.last_result.wasSuccessful()
        set_test_result(driver.session_id, successful)
