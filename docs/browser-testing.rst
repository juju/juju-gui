.. _browser-testing:

===============
Browser Testing
===============

The Juju GUI project uses browser testing to assure compatibility with a
range of browsers.  The testing involves launching a copy of the Juju
GUI charm and then running tests against it.


Setting up
==========

Environment
-----------

In order to run the tests you must have a Juju environment named
"juju-gui-testing".  Consult the Juju documentation for how to set up
an environment.

Building
--------

The test script has a few system dependencies::

    sudo apt-get install python-shelltoolbox python-selenium python-yaml juju

It does not require that the Makefile be run.

Note: ``python-selenium`` is not available on Ubuntu 12.04 so it is included in
the Juju-GUI repository in ``/archives/selenium-2.39.0.tar.gz``.


Running the tests
=================

First, ensure that the juju-gui-testing environment is not running (has
been destroyed and not bootstrapped).  Then run the all-in-one script::

    bin/test-charm

The script will deploy the charm, wait until the charm's unit has
entered a "running" state, and then run the tests against the charm.

By default the tests will run against the most recent release of Juju
GUI.  To specify another branch to test against, pass it in like so::

    bin/test-charm lp:~user/juju-gui/my-great-branch

Note that only "lp:" and "http:" URLs are accepted by the charm at the
time of this writing.


Specifying the browser
======================

You can choose which browser(s) will be used to run the tests by setting
the JUJU_GUI_TEST_BROWSERS environment variable.  It is possible to run the
tests on multiple browsers by specifying a space separated list of browser
names, e.g.::

    JUJU_GUI_TEST_BROWSERS="chrome firefox" bin/test-charm

If JUJU_GUI_TEST_BROWSERS is empty or unset, the "chrome", "firefox" and "ie"
browsers are used by default.  See ``test/browser.py`` for the available
options.

If the FAIL_FAST Environment variable is set to 1 tests are aborted on the first
browser failure rather than attempting them all.


Running an individual test
==========================

If there is a particular browser test you want to run in isolation or
against an already-running copy of the application.  You can also
specify the browser to use as above.  For example, this command will run
the given test against the UI stage using IE::

    $ APP_URL=http://uistage.jujucharms.com:8080/ \
    JUJU_GUI_TEST_BROWSERS=ie bin/py test/test_charm_running.py


Writing tests
=============

The base test case ``test.browser.TestCase`` takes care of the necessary
driver set up.  Tests defined in subclasses can take advantage of several
already defined attributes and methods, including:

- ``self.driver``: the active Selenium web driver;
- ``self.app_url``: the Juju GUI URL;
- ``self.load(path='/')``: ask the web driver to load the given page;
- ``self.wait_for(condition, error, timeout)``: wait for some condition to
    become true;
- ``self.handle_browser_warning()``: overstep the browser warning dialog if the
  current browser is not supported;
- ``self.restart_api()``: restart the staging API backend, so that the default
  environment is restored.

The last of the methods above is particularly important: tests modifying the
environment are responsible of restoring it by restarting the API backend, e.g.
including this line at the beginning of their body::

    self.addCleanup(self.restart_api)

See ``test/browser.py`` for more details.
