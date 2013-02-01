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
