from __future__ import print_function

import atexit
import base64
from functools import wraps
import getpass
import httplib
import json
import os
import subprocess
import sys
import unittest
import urllib2
import urlparse

import selenium
import selenium.webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support import ui
import shelltoolbox

# Add ../lib to sys.path to get the retry module.
root_path = os.path.dirname(os.path.dirname(os.path.normpath(__file__)))
lib_path = os.path.join(root_path, 'lib')
if lib_path not in sys.path:
    sys.path.append(lib_path)

from retry import retry


juju = shelltoolbox.command('juju')
ssh = shelltoolbox.command('ssh')

common = {
    'command-timeout': 300,
    'idle-timeout': 100,
}

ie = dict(selenium.webdriver.DesiredCapabilities.INTERNETEXPLORER)
ie['platform'] = 'Windows 2012'
ie['version'] = '10'
ie.update(common)

chrome = dict(selenium.webdriver.DesiredCapabilities.CHROME)
chrome['platform'] = 'Linux'
chrome.update(common)
# The saucelabs.com folks recommend using the latest version of Chrome because
# new versions come out so quickly, therefore there is no version specified
# here.

firefox = dict(selenium.webdriver.DesiredCapabilities.FIREFOX)
firefox['platform'] = 'Linux'
# Removing this version causes the FireFox CI deployment tests to fail
firefox['version'] = '20'
firefox.update(common)

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
internal_ip = None
if os.path.exists('juju-internal-ip'):
    with open('juju-internal-ip') as fp:
        internal_ip = fp.read().strip()


def formatWebDriverError(error):
    msg = []
    msg.append(str(error))
    if error.stacktrace:
        msg.append(str(error.stacktrace))
    return '\n'.join(msg)


def webdriverError():
    """Decorator for formatting web driver exceptions"""
    def decorator(f):
        @wraps(f)
        def format_error(*args, **kwargs):
            try:
                return f(*args, **kwargs)
            except WebDriverException as e:
                print(formatWebDriverError(e))
                raise e
        return format_error
    return decorator


def set_test_result(jobid, passed):
    headers = {'Authorization': 'Basic ' + encoded_credentials}
    url = '/rest/v1/%s/jobs/%s' % (config['username'], jobid)
    body = json.dumps({'passed': passed})
    connection = httplib.HTTPConnection('saucelabs.com')
    connection.request('PUT', url, body, headers=headers)
    if connection.getresponse().status != 200:
        raise RuntimeError('Unable to send test result to saucelabs.com')


class TestCase(unittest.TestCase):
    """Helper base class that supports running browser tests."""

    @classmethod
    def setUpClass(cls):
        global driver  # We only want one because they are expensive to set up.
        if driver is None:
            # We sometimes run the tests under different browsers, if none is
            # specified, use Chrome.
            browser_name = os.getenv('JUJU_GUI_TEST_BROWSER', 'chrome')
            capabilities = browser_capabilities[browser_name].copy()
            capabilities['name'] = 'Juju GUI'
            user = getpass.getuser()
            capabilities['tags'] = [user]
            driver = selenium.webdriver.Remote(
                desired_capabilities=capabilities,
                command_executor=command_executor)
            # Enable implicit waits for all browsers (DOM polling behavior)
            driver.implicitly_wait(20)
            driver.set_script_timeout(30)

            print('Browser:', browser_name)
            print('Test run details at https://saucelabs.com/jobs/' +
                driver.session_id)
            # We want to tell saucelabs when all the tests are done.
            atexit.register(driver.quit)
        cls.app_url = os.environ['APP_URL']
        cls.driver = driver

    def run(self, result=None):
        self.last_result = result
        super(TestCase, self).run(result)

    def tearDown(self):
        successful = self.last_result.wasSuccessful()
        set_test_result(driver.session_id, successful)

    def load(self, path='/'):
        """Load a page using the current Selenium driver."""
        url = urlparse.urljoin(self.app_url, path)
        self.driver.get(url)

    def handle_browser_warning(self):
        """Overstep the browser warning dialog if required."""
        self.wait_for_script(
            'return window.isBrowserSupported',
            error='Function isBrowserSupported not found.')
        script = 'return window.isBrowserSupported(navigator.userAgent)'
        supported = self.driver.execute_script(script)
        if not supported:
            continue_button = self.wait_for_css_selector(
                '#browser-warning input',
                error='Browser warning dialog not found.')
            continue_button.click()

    def wait_for_provider_type(self, error=None, timeout=10):
        """Wait for a connection using a CSS selector."""
        # IE is very sensitive to asking for javascript before it is
        # ready, so we look at a related document element instead.
        def provider_type(driver):
            els = driver.find_elements_by_css_selector('#provider-type')
            if els:
                return els[0].text
        return self.wait_for(provider_type, error=error, timeout=timeout)

    def handle_login(self):
        """Log in."""
        self.wait_for_provider_type(error='Provider type not found.')
        check_script = (
            'return app && app.env && app.env.get("connected") && ('
            'app.env.failedAuthentication || '
            'app.env.userIsAuthenticated || '
            '!app.env.getCredentials() ||'
            '!app.env.getCredentials().areAvailable);'
        )
        self.wait_for_script(check_script)
        exe = self.driver.execute_script
        if exe('return app.env.userIsAuthenticated;'):
            return
        # For some unknown reason in Chrome the crosshatch background does not
        # allow styles to be set to it after a successfull log in so we need
        # to destroy that mask manually prior to us logging in so that the
        # following tests can access the other elements
        exe('document.getElementsByTagName("body")[0]'
            '.removeChild(document.getElementById("full-screen-mask"));'
            'app.env.setCredentials({user: "admin", password: "admin"});'
            'app.env.login();')
        self.wait_for_script('return app.env.userIsAuthenticated;')

    @classmethod
    @webdriverError()
    def wait_for(cls, condition, error=None, timeout=30):
        """Wait for condition to be True.

        The argument condition is a callable accepting a driver object.
        Fail printing the provided error if timeout is exceeded.
        Otherwise, return the value returned by the condition call.
        """
        wait = ui.WebDriverWait(cls.driver, timeout)
        return wait.until(condition, error)

    @classmethod
    def wait_for_css_selector(cls, selector, error=None, timeout=10):
        """Wait until the provided CSS selector is found.

        Fail printing the provided error if timeout is exceeded.
        Otherwise, return the value returned by the script.
        """
        condition = lambda driver: driver.find_elements_by_css_selector(
            selector)
        elements = cls.wait_for(condition, error=error, timeout=timeout)
        return elements[0]

    @classmethod
    def wait_for_script(cls, script, error=None, timeout=20):
        """Wait for the given JavaScript snippet to return a True value.

        Fail printing the provided error if timeout is exceeded.
        Otherwise, return the value returned by the script.
        """
        condition = lambda driver: driver.execute_script(script)
        return cls.wait_for(condition, error=error, timeout=timeout)

    @classmethod
    def wait_for_config(cls, contents, error=None, timeout=200):
        """Wait for the given contents to be present in the GUI config.

        Fail printing the provided error if timeout is exceeded.
        Otherwise, return the value returned by the script.
        """
        config_url = urlparse.urljoin(cls.app_url, '/juju-ui/assets/config.js')

        def condition(driver):
            """Return True if contents are found in the given URL."""
            try:
                response = urllib2.urlopen(config_url)
            except IOError:
                return False
            return contents in response.read()
        return cls.wait_for(condition, error=error, timeout=timeout)

    @classmethod
    @retry(subprocess.CalledProcessError, tries=2)
    def change_options(cls, options):
        """Change the charm config options."""
        args = ['{}={}'.format(key, value) for key, value in options.items()]
        print('setting new options:', ', '.join(args))
        juju('set', '-e', 'juju-gui-testing', 'juju-gui', *args)

    @retry(subprocess.CalledProcessError, tries=2)
    def restart_api(self):
        """Restart the staging API backend.

        Wait for the pristine environment to be available.

        Restarting the API backend allows for full test isolation even if tests
        change the internal Juju environment. Such tests should add this
        function as part of their own clean up process.
        """
        if internal_ip:
            print('restarting API backend with ip:%s' % internal_ip)
            # When an internal ip address is set directly contract
            # the machine in question. This can help route around
            # firewalls and provider issues in some cases.
            ssh('ubuntu@%s' % internal_ip,
                'sudo', 'service', 'juju-api-improv', 'restart')
        else:
            print('restarting API backend using juju ssh')
            juju('ssh', '-e', 'juju-gui-testing', 'juju-gui/0',
                 'sudo', 'service', 'juju-api-improv', 'restart')
        self.load()
        self.handle_browser_warning()
        self.wait_for_script(
            'return app.env.get("connected");',
            error='Impossible to connect to the API backend after restart.',
            timeout=30)
