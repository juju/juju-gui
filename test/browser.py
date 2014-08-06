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

import base64
from functools import (
    partial,
    wraps,
)
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
from selenium.common.exceptions import (
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.support import ui
import shelltoolbox


# Utility function to print to stderr.
printerr = partial(print, file=sys.stderr)

# Add ../lib to sys.path to get the retry module.
root_path = os.path.dirname(os.path.dirname(os.path.normpath(__file__)))
lib_path = os.path.join(root_path, 'lib')
if lib_path not in sys.path:
    sys.path.append(lib_path)

from retry import retry


juju = shelltoolbox.command('juju')
ssh = shelltoolbox.command('ssh')

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
internal_ip = None
if os.path.exists('juju-internal-ip'):
    with open('juju-internal-ip') as fp:
        internal_ip = fp.read().strip()

# We sometimes run the tests under different browsers, if none is
# specified, use Chrome.
browser_name = os.getenv('JUJU_GUI_TEST_BROWSER', 'chrome')

SELENIUM_VERSION = "2.35.0"

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
    response = connection.getresponse()
    status = response.status
    if status != 200:
        print('Error connecting to saucelabs.com.  Status: {}'.format(status))
        print(response.reason)
        print(response.read())
        raise RuntimeError('Unable to send test result to saucelabs.com')


def get_capabilities(browser_name):
    """Return the Selenium driver capabilities for the given browser_name."""
    common = {
        'command-timeout': 300,
        'idle-timeout': 100,
        'selenium-version': SELENIUM_VERSION,
    }
    desired = selenium.webdriver.DesiredCapabilities
    choices = {
        'chrome': (
            desired.CHROME,
            # The saucelabs.com folks recommend using the latest version of
            # Chrome because new versions come out so quickly.
            # Therefore, there is no version specified here.
            {'platform': 'Linux'},
        ),
        'firefox': (
            desired.FIREFOX,
            # Juju GUI supports Firefox >= 16 (quantal base).  At the time of
            # this comment the default version used in Saucelabs, if none is
            # specified, is 11.
            {'platform': 'Linux', 'version': '25'},
        ),
        'ie': (
            desired.INTERNETEXPLORER,
            # Internet Explorer version must be >= 10.
            {'platform': 'Windows 7', 'version': '10'},
        ),
        'safari': (
            desired.SAFARI,
            {'platform': 'OS X 10.9', 'version': '7'},
        ),
    }
    if browser_name in choices:
        base, updates = choices[browser_name]
        capabilities = dict(base)
        capabilities.update(common)
        capabilities.update(updates)
        return capabilities
    sys.exit('No such web driver: {}'.format(browser_name))


def make_local_driver(browser_name, capabilities):
    """Return a local Selenium driver instance.

    The driver will be set up using the given capabilities.
    """
    choices = {
        'chrome': (
            selenium.webdriver.Chrome,
            {'desired_capabilities': capabilities},
        ),
        'firefox': (
            selenium.webdriver.Firefox,
            {'capabilities': capabilities},
        ),
        'ie': (
            selenium.webdriver.Ie,
            {'capabilities': capabilities},
        ),
    }
    driver_class, kwargs = choices[browser_name]
    return driver_class(**kwargs)


def get_platform(driver):
    """Return info about the platform used by the given driver."""
    name = driver.name.title()
    caps = driver.capabilities
    return '{} {} ({})'.format(name, caps['version'], caps['platform'].title())


def format_subprocess_error(error):
    """Return an error message string including the subprocess output."""
    return '{}: {}'.format(error, error.output)


retry_process_error = retry(
    subprocess.CalledProcessError, tries=2,
    format_error=format_subprocess_error)


class TestCase(unittest.TestCase):
    """Helper base class that supports running browser tests."""

    @classmethod
    def setUpClass(cls):
        # The Selenium web driver is instantiated here for each test case.
        # This way the suite should be more reliable, especially when running
        # Firefox tests, in which cases the GUI WebSocket connection is often
        # problematic (i.e. connection errors) when switching from the sandbox
        # mode back to the staging backend.
        local_prefix = 'local-'
        if browser_name.startswith(local_prefix):
            # If the browser name has the "local-" prefix, i.e. "local-chrome',
            # "local-firefox" or "local-ie", start the associated local driver.
            name = browser_name[len(local_prefix):]
            capabilities = get_capabilities(name)
            driver = make_local_driver(name, capabilities)
            cls.remote_driver = False
        else:
            # Otherwise, set up a Saucelabs remote driver.
            capabilities = get_capabilities(browser_name)
            user = getpass.getuser()
            capabilities.update({'name': 'Juju GUI', 'tags': user})

            driver = selenium.webdriver.Remote(
                desired_capabilities=capabilities,
                command_executor=command_executor)
            cls.remote_driver = True
            details = 'https://saucelabs.com/jobs/' + driver.session_id
            printerr(
                '* Platform: {}'.format(get_platform(driver)),
                '* Testcase: {}'.format(cls.__name__),
                '* Details: {}'.format(details),
                sep='\n',
            )
        # Enable implicit waits for all browsers (DOM polling behavior)
        driver.implicitly_wait(20)
        driver.set_script_timeout(30)
        # We want to tell saucelabs when all the tests are done.
        cls.app_url = os.environ.get('APP_URL', 'http://localhost:8888')
        cls.driver = driver

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def run(self, result=None):
        self.last_result = result
        super(TestCase, self).run(result)

    def tearDown(self):
        if self.remote_driver:
            successful = self.last_result.wasSuccessful()
            set_test_result(self.driver.session_id, successful)

    def load(self, path='/'):
        """Load a page using the current Selenium driver."""
        url = urlparse.urljoin(self.app_url, path)
        self.driver.get(url)

    def click(self, element):
        """Click on the given element in a cross-browser compatible way.

        The element argument is the element object returned by driver.find*
        methods.
        """
        if browser_name in ('ie', 'local-ie'):
            # For some reason, the Internet Explorer web driver disconnects if
            # the usual element.click() is used here.
            # As a workaround, use native JavaScript instead.
            self.driver.execute_script('arguments[0].click()', element)
        else:
            element.click()

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

    def wait_for_provider_type(self, error=None, timeout=60):
        """Wait for a connection using a CSS selector."""
        # IE is very sensitive to asking for javascript before it is
        # ready, so we look at a related document element instead.
        def provider_type(driver):
            els = driver.find_elements_by_css_selector('#provider-type')
            if els:
                return els[0].text
        return self.wait_for(provider_type, error=error, timeout=timeout)

    def login(self, password='admin'):
        """Log in into the application.

        Assume the currently displayed view is the login page.
        """
        # For some reason, the login form is considered not visible to the
        # user by Selenium, which consequently denies clicking or sending
        # keys to form fields. This behavior is overridden using JavaScript.
        script = """
            var loginForm = document.querySelector('#login-form form');
            loginForm.querySelector('input[type=password]').value = '{}';
            loginForm.querySelector('input[type=submit]').click();
        """.format(password)
        self.driver.execute_script(script)

    def logout(self):
        """Log out from the application, clicking the "logout" link."""
        logout_link = self.driver.find_element_by_id('logout-trigger')
        self.click(logout_link)

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
    def wait_for_path(cls, path, error=None, timeout=30):
        """Wait for the given path to be the current one.

        Fail printing the provided error if timeout is exceeded.
        """
        url = urlparse.urljoin(cls.app_url, path)
        condition = lambda driver: driver.current_url == url
        try:
            cls.wait_for(condition, error=error, timeout=timeout)
        except TimeoutException:
            current = cls.driver.current_url
            printerr('Expected: {}\nCurrent: {}'.format(url, current))
            raise

    @classmethod
    @retry_process_error
    def change_options(cls, options):
        """Change the charm config options."""
        args = ['{}={}'.format(key, value) for key, value in options.items()]
        printerr('- setting new options:', ', '.join(args))
        juju('set', '-e', 'juju-gui-testing', 'juju-gui', *args)

    @retry_process_error
    def restart_api(self):
        """Restart the staging API backend.

        Wait for the pristine environment to be available.

        Restarting the API backend allows for full test isolation even if tests
        change the internal Juju environment. Such tests should add this
        function as part of their own clean up process.
        """
        if internal_ip:
            printerr(
                '\n- restarting API backend with ip:{}...'.format(internal_ip))
            # When an internal ip address is set directly contract
            # the machine in question. This can help route around
            # firewalls and provider issues in some cases.
            ssh('ubuntu@%s' % internal_ip,
                'sudo', 'service', 'juju-api-improv', 'restart')
        else:
            printerr('\n- restarting API backend using juju ssh...')
            juju('ssh', '-e', 'juju-gui-testing', 'juju-gui/0',
                 'sudo', 'service', 'juju-api-improv', 'restart')
        self.load()
        self.handle_browser_warning()
        self.wait_for_script(
            'return app && app.env.get("connected");',
            error='Impossible to connect to the API backend after restart.',
            timeout=30)
        printerr('- done')
