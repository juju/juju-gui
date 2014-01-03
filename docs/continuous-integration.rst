=========================
Juju GUI CI Documentation
=========================

The Juju GUI CI runs our unit and Selenium tests across multiple browsers using
`Sauce Labs`_. It will run these tests on every pull request from a user in
the `Juju` Github organization. Only pull requests from those users are
tested and are able to land through CI. These tests will be run locally (on
the CI server itself), across Win8 IE10, Linux Chrome (latest), and Linux
Firefox (latest).

.. _Sauce Labs: https://saucelabs.com/

Our CI uses team credentials and runs on Azure using a Jenkins instance
deployed via Juju using the charm from the charm store.  Please ask Rick for
credentials if you need to access the Juju environment. The credentials will
find a better shared home in the future.

CI is located at http://ci.jujugui.org:8080

How it works
============

There are two jobs in Jenkins to perform a CI test run. Each one will start a
local webserver that serves the GUI out for tests to hit. Tests are run
against phantomjs as well as through Selenium so that all unit tests are run
in all supported browsers.

The CI run will also start a web server and serve out the GUI to functional
Selenium tests that can perform actual actions on the GUI and verify they work
correctly, again, in each browser. Currently, an example of this can be seen
in the file `test_browser.py`.

juju-gui
---------

This job uses a Jenkins plugin that is notified whenever a user issues a pull
request against the main repository in Github. This notification triggers a
build based on that pull request and will mark the pull request as safe once
it completes. Until the pull request is marked "safe", code reviews can still
occur, but no request to land should be performed until the test run
completes. When the test run is finished the bot will comment on the pull
request indicating the test status.

juju-gui-merge
----------------

A pull request that has been reviewed, gotten the required `:+1:` comment, and
has passed the above test run, may be submitted for landing into the trunk
branch called `develop` by adding a comment that contains the `:shipit:`
phrase in the comment. It does not need to be the only text in the comment,
just within it.

The developer should usually be the person to adding the `:shipit:` comment to
give the developer of the pull request a last chance to respond to any
comments or questions raised during review. It is not the reviewer's duty to
land the branch unless requested due to special circumstances by the developer
of the branch.

This will then rerun the tests one at a time, in order, to assure each is safe
to land with respect to the current state of the `develop` branch.  If the CI
run completes successfully the pull request will be automatically merged into
`develop`.


Helpful tips
============

Manually running a build
-------------------------

Both of the Jenkins jobs can be triggered manually via the webui. You must log
into an account on the Jenkins server and select the build you wish to
perform. On the left is a link for "Build with parameters". The sha1 parameter
will allow you to specify which commit you'd like to run. Example sha1 values
include:

  - develop
  - origin/pr/34/merge
  - 8b3f1be29c

Things went horribly wrong
---------------------------

There's a chance that something will break the current workspace in the job. A
conflict merging trunk into the branch to be tested might be an example case.
In order to recover from that, you need to wipe the workspace. To do this, go
go the job in question, click on the "Workspace" link on the left, and select
the "Wipe out the Current Workspace".

After wiping the workspace, force a manual build with the instructions above.
This should re-clone the codebase and build the working environment. It is a
good idea to start with building the `develop` branch as a solid starting
point.

How do I debug test failures?
------------------------------

Debugging a test failure will depend on the test that failed. Note that the
first failure in the `make ci-check` process will stop all others from
running.

The first step to understanding any test issues is to go and look at the
console output for the build. Each job keeps a running list of the builds on
the left side and you need to find the one associated with your failure.
Comments in your pull request should help provide direct links to your build
run.

Once you've located the build, click on the "Console Output" to see what has
transpired. Note that the default view is truncated. You might need to view
the "raw" version to see all of what occurred during the build. We've got a
lot of output for a completed CI run.

Git issues
.............

If there is an issue fetching the commit in question, or merging with develop,
the console should show the issue fairly immediately and at the very start of
the build. Potential issues to look for are network connectivity issues,
conflicts in merging trunk into the branch to be tested, or perhaps some
corruption of the workspace itself.

If the issue is in the git pull itself it should be obvious. A corrupt
workspace might not be as clear and would require wiping the workspace as
explained above.

Lint issues
............

CI runs lint which must pass before tests are run. Make sure that you run
this before submitting your merge proposal. If you have an issue, simply fix
the lint issue, rebase your branch, and force push it. CI will re-test the
updated branch automatically.

phantomjs test failures
.......................

These are locally running tests against a local test server. Issues here
should be clear and if tests pass locally, mean that there's some build step
or change in your system vs the CI system. Please bring these up to be
addressed.

Sauce Labs test failures
.........................

The Selenium tests are run via Sauacelabs by starting up a web server instance
visible to the internet. You can view the GUI yourself by going to the url
that Selenium is accessing. Typically it'll be `http://ci.jujugui.org:8888`.
It runs in all three browsers and the console will log helpful debug
information to let you know what browser it's starting to test against. The
console output also provides links directly to the Sauce Labs test run. It is
very useful to see if the page loaded, if the url was the correct one, or if
there was an actual failure introduced. You must debug this from the Sauce
Labs information as there's not much to look at from the CI end.



Bitrotten Instructions
======================

Leaving as these might prove useful when we get a juju environment based test
setup again.


.. How it works
.. ------------
.. 
.. When Jenkins detects a change it first attempts to destroy any lagging
.. canonistack instances to avoid stale code hanging around which could cause
.. instability in the tests. It then does a lightweight checkout of the
.. ``lp:juju-gui`` repository and runs ``bin/test-charm``.
.. 
.. ``bin/test-charm`` runs ``lib/deploy_charm_for_testing.py`` and, if the
.. deployment is successful, executes ``test/test_charm_running.py`` for each of
.. the specified browsers; finishing it up by destroying the juju test
.. environment.
.. 
.. Charm testing configuration and setup
.. -------------------------------------
.. 
.. The ``bin/test-charm`` script relies on a few environment variables for
.. configuration:
.. 
..   bin/test-charm
..   JUJU_GUI_TEST_BROWSERS: "chrome firefox ie" {String} The browsers to run the
..   test suite on.  Tests are run remotely using Saucelabs by default.  If you
..   want to use a local web driver instead, add the "local-" prefix to the
..   browser name(s) in JUJU_GUI_TEST_BROWSERS, e.g.:
..   ``JUJU_GUI_TEST_BROWSERS="local-firefox local-chrome" bin/test-charm``.
..   FAIL_FAST: 0 {Integer} Set to 1 to exit when first browser returns a failure
..   rather than completing all of the tests.
..   NO_DESTROY: unset Set to 1 to prevent the juju environment to be destroyed
..   at the end of the test run.
..   APP_URL: unset Set to a Juju GUI URL to force the suite to use that location
..   rather than creating/destroying a juju environment where to deploy the Juju
..   GUI.  The value must be a valid location where the Juju GUI is deployed using
..   the charm in a "juju-gui-testing" environment, and properly set up using
..   the following charm options: serve-tests=true staging=true secure=false.
.. 
.. Combining NO_DESTROY and APP_URL could help while debugging CI tests, and it
.. allows for running the suite multiple times using the same Juju environment.
.. A typical workflow follows
.. 
.. ::
.. 
..   # Run tests without destroying the environment. The APP_URL will be
..   # displayed in the command output.
..   NO_DESTROY=1 bin/test-charm
..   # Grab the APP_URL to run the suite again, reusing the juju environment.
..   APP_URL="http://ec2-xxx-yyy.example.com" bin/test-charm
..   # When coding/debugging is done, destroy the juju environment.
..   juju destroy-environment -e juju-gui-testing
.. 
.. The ``bin/test-charm`` script relies on ``lib/deploy_charm_for_testing.py`` to
.. actually deploy the charm. You can use it in a variant of the above workflow to
.. test specific GUI sources and charms. The ``deploy_charm_for_testing.py`` has
.. the following flags
.. 
.. ::
.. 
..   --origin: "lp:juju-gui" {String} Location of the GUI code
..   --charm: "cs:~juju-gui/precise/juju-gui" {String} Location of the charm code
..   JUJU_INSTANCE_IP: {String} Public IP address to assign to GUI test instance
..   used only for Canonistack deployments.
.. 
.. The ``lib/deploy_charm_for_testing.py`` relies on some charm options to do its
.. job. These are the configuration options it uses
.. 
.. ::
.. 
..   serve-tests: False {Boolean} Exposes the tests for browser access at host/test
..   staging: False {Boolean} Connects the GUI to the staging backend
..   secure: True {Boolean} Allows the GUI to operate over a non-https connection
..   juju-gui-source: "lp:juju-gui" {String} Where to pull the GUI from
.. 
.. A complete listing of its configuration properties can be found in the
.. ``config.yaml`` file in the charm's root directory.
.. 
.. Running the tests on Canonistack
.. --------------------------------
.. 
.. The Jenkins slave which runs our CI creates a Juju ``environments.yaml`` file
.. with ``juju-testing-gui`` defined based on a template file
.. 
.. ::
.. 
..   /home/jujugui-merger/.juju/environments.yaml.template
.. 
.. The template has one slot, which is populated with the most current machine
.. image that matches our needs (ubuntu-released, precise, amd64).  The template
.. is processed by the ``lib/deploy_charm_for_testing.py`` script.  If the
.. template does not exist then an ``environments.yaml`` must be present and it
.. will be used.
.. 
.. After bootstrapping the Juju environment it deploys the Juju GUI charm with the
.. following configuration properties
.. 
.. ::
.. 
..   { 'serve-tests': True,
..     'staging': True,
..     'secure': False,
..     'juju-gui-source': args.branch } // uses default - only change for devel
.. 
.. After the instances have started, but before the charm has been installed, it
.. assigns an external IP address to our charm instance. External IPs are
.. hard to come by on Canonistack, and as such we need to be sure this one is used
.. at least once every 7 days to avoid it being released from our user.
.. 
.. Once the charm comes online the instance is then exposed and the tests are run.
.. 
.. How do I run the tests on EC2?
.. ------------------------------
.. 
.. If you want to run the unit and Selenium tests on EC2, you simply need to
.. configure your Juju environments file by following the `getting started`_
.. guide for EC2.
.. 
.. .. _getting started: https://juju.ubuntu.com/docs/getting-started.html
.. 
.. Rename your newly configured EC2 Juju config to be ``juju-gui-testing`` and
.. run
.. 
.. ::
.. 
..   bin/test-charm
.. 
.. How do I view and edit the Jenkins results and configuration?
.. -------------------------------------------------------------
.. 
.. You will need to log into the `QA labs Jenkins server`_ which requires
.. `VPN access`_ and a Jenkins account.
.. 
.. .. _QA labs Jenkins server: http://10.189.74.2:8080/job/jujugui-test-charm/
.. .. _VPN access: https://wiki.canonical.com/UbuntuEngineering/QA/VPN
.. 
.. How do I debug test failures?
.. -----------------------------
.. 
.. While the tests are running and after they are complete, the Jenkins control
.. panel will show you the console output of the results. If there are failures in
.. this list, you will need to use the debug information that was output to track
.. down the failure. Look in particular for the links to the videos.
.. 
.. If the failure is with a unit test, it will be much faster to run those locally
.. in the failing browser to determine the issue. Make sure that locally you start
.. with a clean checkout of the code that the CI will be running
.. 
.. ::
.. 
..   bzr branch lp:juju-gui
..   make clean-all
..   make build-prod
..   sh test-server.sh prod true
.. 
.. If the issue only appears during testing, you will find spinning up EC2
.. instances to be much faster for debugging.
.. 
.. What files are involved in the Selenium and unit tests?
.. -------------------------------------------------------
.. 
.. There are quite a number of files which are involved in the CI process
.. 
.. ::
.. 
..   Makefile
..   test-server.js
..   bin/test-charm
..   lib/deploy_charm_for_testing.py
..   test/browser.py
..   test/test_charm_running.py
.. 
.. Known issues
.. ------------
.. 
.. Image Ids Change
.. ..................
.. 
.. (This issue should be deprecated but is left here for reference.)
.. 
.. If the chosen image that we are using becomes unusable or is removed, the CI
.. will fail almost instantly with the error
.. 
.. ::
.. 
..   ERROR Unexpected 400:
..   '{"badRequest": {"message": "Can not find requested image", "code": 400}}'
.. 
.. To fix this you need to change the ``default-image-id`` in the
.. ``environments.yaml`` file for the ``jujugui-merger`` account on Jenkins.
.. 
.. The documentation says to use ``euca-describe-images``, but canonistack does
.. not accept those ids so you need to run ``nova image-list`` and choose one of
.. the hash style ids.
.. 
.. The current image name that we use is
.. 
.. ::
.. 
..   ubuntu-released/ubuntu-precise-12.04-amd64-server-<date>-disk1.img
.. 
.. If this one is not available, pick the closest one which represents a public
.. release image on precise (12.04) 64bit.
.. 
.. You can run ``bin/find-latest-image.sh`` to get a machine id to use.  It is
.. entered as the ``default-image-id`` in ``environments.yaml`` if you are not
.. allowing it to be update automatically as described previously.
.. 
.. Unit tests fail
.. ................
.. 
.. In reviewing the CI logs you might notice that it says
.. 
.. ::
.. 
..   {} failure(s) running {} tests.  Retrying.
.. 
.. This is necessary because periodically a large number of the tests will fail
.. claiming an error in the ``test_charm_configuration.js`` suite. The workaround
.. we found was to refresh the browser and re-run the tests.
.. 
.. Fragile IE
.. ...........
.. 
.. IE throws an error without a stacktrace if you attempt to access any javascript
.. before it is ready, or if you try to use xpath to find elements. To remedy this
.. we wait for css elements to be ready before accessing the javascript. Two
.. methods, ``handle_login()`` and ``wait_for_provider_type()``, can help you with
.. this.
.. 
.. Unit tests log us out
.. ......................
.. 
.. The unit tests log us out of the application, requiring us to log back in
.. before we try to execute any further tests
.. 
.. Crosshatch background won't hide in Chrome
.. ...........................................
.. 
.. After the unit tests have logged us out, the ``handle_login()`` method logs us
.. back in in every browser except Chrome. In Chrome any attempts to set a style
.. on the crosshatch background results in only the ``style`` tag being added to
.. the element. Right now we are destroying that crosshatch node before we attempt
.. to log in, to allow the tests to continue successfully.
