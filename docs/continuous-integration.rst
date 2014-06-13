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
that Selenium is accessing. Typically it'll be `http://ci.jujugui.org:8888` or
`http://ci.jujugui.org:8889` It runs in all three browsers and the console
will log helpful debug information to let you know what browser it's starting
to test against. The console output also provides links directly to the Sauce
Labs test run. It is very useful to see if the page loaded, if the url was the
correct one, or if there was an actual failure introduced. You must debug this
from the Sauce Labs information as there's not much to look at from the CI
end.

Attempting to land a branch fails
---------------------------------

If the CI run does not complete successfully, you retrigger the build by
deleting the comment in the pull request from the bot that states "Status:
merge request accepted". Once that is removed, the bot will attempt to land
the branch again.


Access to CI
============

Check the canoniocal wiki for `CDO/Juju/GUI/CI` to find the shared credentials
for access to Azure and the CI instance.
