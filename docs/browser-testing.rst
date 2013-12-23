.. _browser-testing:

===============
Browser Testing
===============

The Juju GUI project uses browser testing to assure compatibility with a
range of browsers.  The testing involves launching a copy of the Juju
GUI charm and then running tests against it.


Setting up
==========

Building
--------

The testing has the same system dependencies as development. Make sure to
follow the HACKING doc for instructions on setting up your environment.


Manually running the browser tests
===================================

Note that there are four valid browser targets currently.

  - chrome
  - ie
  - firefox
  - local-firefox

These are set in the below commands via an ENV variable
`JUJU_GUI_TEST_BROWSER`. The `PORT` ENV variable is also important to help
start the web server that serves out the test files.

The commands below also mention a `[whatismyip]`. In order for SauceLabs to
run the tests the server needs to be exposed externally via the port
specified. In one use case, you can port forward from your router to your
local computer and then update the `[whatismyip]` to be the actual external
address of your home network.

You can also setup things through external server with handy tactics such as
ssh tunnels, but direct exposure is noted below as the simplest use case.


Running Functional Tests
------------------------

There are a series of functional tests that use Selenium in the Gui. They are
run via the Python API to Selenium and may be run against any local browser as
well as remote browsers provided by SauceLabs.

Below is a sample command to run the functional tests against the SauceLabs
Firefox browser. If you wanted to run it against a local Firefox instance, you
could change the `JUJU_GUI_TEST_BROWSER` to be `local-firefox`.

::

    APP_URL=http://[whatismyip]:8889 PORT=8889 JUJU_GUI_TEST_BROWSER="firefox" make test-browser


Running the unit test suite a browser
-------------------------------------

You can run the prod tests in any browser locally by running the test server.

::

    PORT=8889 node ./test-server.js prod $(PORT)

At this point you will get a url that you can point your browser to and it'll
run against the `build-prod` version of the Gui source.


You can also run these in SauceLabs manually by using the following:

::

    APP_URL=http://[whatismyip]:8889 PORT=8889 JUJU_GUI_TEST_BROWSER="chrome" make test-browser-mocha



===================================================================
BitRotted Instructions that require updating into the new CI world.
===================================================================


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
