import base64
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


def set_test_result(jobid, passed):
    headers = {'Authorization': 'Basic ' + encoded_credentials}
    url = '/rest/v1/%s/jobs/%s' % (config['username'], jobid)
    body = json.dumps({'passed': passed})
    connection = httplib.HTTPConnection('saucelabs.com')
    connection.request('PUT', url, body, headers=headers)
    if connection.getresponse().status != 200:
        raise RuntimeError('Unable to send test result to saucelabs.com')


class TestCase(unittest.TestCase):

    def setUp(self):
        # We sometimes run the tests under different browsers, if none is
        # specified, use Chrome.
        browser_name = os.environ.get('JUJU_GUI_TEST_BROWSER', 'chrome')
        self.capabilities = browser_capabilities[browser_name].copy()
        self.capabilities['name'] = 'Juju GUI'
        self.driver = selenium.webdriver.Remote(
            desired_capabilities=self.capabilities,
            command_executor=command_executor)

    def run(self, result=None):
        self.last_result = result
        super(TestCase, self).run(result)

    def tearDown(self):
        set_test_result(self.driver.session_id,
            self.last_result.wasSuccessful())
        self.driver.quit()
