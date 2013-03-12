=========================
Juju GUI CI Documentation
=========================
The Juju GUI CI runs our unit and Selenium tests across multiple browsers using
`Sauce Labs`__. It will check the gui repository for changes every hour and if
there has been a change it will run our tets across Win 8 IE10, Linux Chrome
(latest), and Linux FireFox (latest).

__ https://saucelabs.com/

Our CI setup is run on the Canonical `QA labs Jenkins server`__ beind the QA
VPN. In order to access the Jenkins server you will need VPN access, need to
create an account in Jenkins, and have that account approved by the
administrator.

__ http://10.189.74.2:8080/job/jujugui-test-charm/

How it works
------------
When Jenkins detects a change it first attempts to destroy any lagging
canonistack instances to avoid stale code hanging around which could cause
instability in the tests. It then does a lightweight checkout of the lp:juju-gui
repository and runs bin/test-charm.

bin/test-charm runs lib/deploy_charm_for_testing.py and, if the deployment is
successful, executes test/test_charm_running.py for each of the specified
browsers; finishing it up by destroying the juju test environment.

Charm testing configuration and setup
-------------------------------------
The Juju GUI charm has a few important configuration properties to enable its
testing setup::

  serve-tests: False {Boolean} Exposes the tests for browser access at host/test
  staging: False {Boolean} Connects the GUI to the staging backend
  secure: True {Boolean} Allows the GUI to operate over a non-https connection
  juju-gui-source: lp:juju-gui {String} Where to pull the GUI from

A complete listing of its configuration properties can be found in the
config.yaml file in the charm's root directory.

Running the tests on Canonistack
--------------------------------
The Jenkins slave which runs our CI has a Juju environments.yaml file with
juju-testing-gui defined::

  /home/jujugui-merger/.juju/environments.yaml

After bootstrapping the juju environment it deploys the Juju GUI charm with the
following configuration properties::

  { 'serve-tests': True,
    'staging': True,
    'secure': False,
    'juju-gui-source': args.branch } // uses default - only change for devel

After the instances have started, but before the charm has been installed, it
assigns an external IP address to our charm instance. External IP's are
hard to come by on Canonistack and as such we need to be sure this one is used
at least once every 7 days to avoid it being released from our user.

Once the charm comes online the instance is then exposed and the tests are run.

Running the tests on EC2
-----------------------
If you want to run the unit and Selenium tests on EC2 you simply need to
configure your juju environments file by following the `getting started`__
guide for EC2.

__ https://juju.ubuntu.com/docs/getting-started.html

Rename your newly configured EC2 juju config to be `juju-gui-testing` and run::

  bin/test-charm

Running the tests locally
-------------------------
Coming soon...
