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

If JUJU_GUI_TEST_BROWSERS is empty or unset, the "chrome" browser is used by
default.  See ``test/browser.py`` for the available options.


Running an individual test
==========================

If there is a particular browser test you want to run in isolation or
against an already-running copy of the application.  You can also
specify the browser to use as above.  For example, this command will run
the given test against the UI stage using IE::

    $ APP_URL=http://uistage.jujucharms.com:8080/ \
    JUJU_GUI_TEST_BROWSER=ie bin/py test/test_charm_running.py
