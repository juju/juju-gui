.. Run "make view-main-doc" to render this file and read it in the browser
   alongside the whole project documentation. To do this, you need the
   dependencies described in the "Documentation" section below.

=======
HACKING
=======

Here is how to develop on this code base.

Developer Install
=================

Before you get the GUI you need to get Juju. We use the fresh one from the Juju
PPA.

::

  sudo add-apt-repository ppa:juju/pkgs
  sudo apt-get update
  sudo apt-get install juju


Now it is time to actually get the GUI itself set up.  Juju GUI uses
nodejs-based development tools, so you will need ``nodejs`` from Chris
Lea's node PPA. You also need ImageMagick for sprite generation, python-sphinx
and python-yaml to build docs, PyTZ to make releases, python-shelltoolbox and
python-selenium for browser tests, and python-virtualenv to build the Google
Closure linter tools locally, and g++ for contextify::

  sudo add-apt-repository ppa:chris-lea/node.js
  sudo add-apt-repository ppa:gophers/go
  sudo apt-get update
  sudo apt-get install nodejs imagemagick python-sphinx python-yaml \
    python-tz python-virtualenv python-shelltoolbox python-selenium \
    python-tornado python-gflags g++ xvfb

See :ref:`Browser Testing <browser-testing>` if you are curious about the
reason for ``python-shelltoolbox`` and ``python-selenium``.

The jshint linter will be installed locally per branch, but if you want editor
integration, you may want to install ``jshint`` globally in your system.  More
importantly, to support testing from the command line, ``phantomjs`` and
``mocha-phantomjs`` should be installed globally.

::

  sudo npm install -g jshint@2.1.3 mocha-phantomjs@3.2.0 phantomjs@1.9.1-0

Note: Make sure to get the latest phantomjs from npm and not rely on an older
.deb packaged version. mocha-phantomjs will fail silently when running.

If you receive an error installing phantomjs, you can manually download and
unpack the archive and then arrange for the ``phantomjs`` executable to be
located on your path (e.g., by linking it into ``~/bin``).

The Juju GUI can now be installed and run with:

::

  git clone https://github.com/juju/juju-gui.git


However, if you plan on hacking on the Gui, fork the repository on Github and
pull your clone down to work on.

::

  git clone git@github.com:{yourusername}/juju-gui.git


If you are working on an operating system other than Ubuntu or simply do not
want global installs for your development environment, a vagrant image is
provided. This will use VirtualBox to run a development environment in an Ubuntu
virtual machine, installing all the dependencies and setting up networking such
that you can modify files locally but run the development server from the VM.

After getting `Vagrant <http://vagrantup.com>`_ and the latest version of
`VirtualBox <http://virtualbox.org>`_ (at least 4.3), simply run the following
from your working directory:

::

  vagrant up

You may see a warning about guest additions not matching the version of
VirtualBox, but this does not affect our development environment. After the
machine builds, boots, and provisions, you can ssh using the following:

::

  vagrant ssh

If provisioning fails for any reason, you can reprovision with the following:

::

  vagrant reload --provision

From the vagrant, you can run all of the make targets in ``/vagrant`` and
access the GUI or test servers from the host using the IP address
``192.168.33.10``. Once you are done, you can either ``vagrant suspend``,
``vagrant halt``, or ``vagrant destroy`` the machine from your host.

Once you've pulled down the code you can start running it with

::

  cd juju-gui
  make devel

It may take a while for the server to start the first time as npm will
need to download packages.  When ready, the server will print::

  Server listening on http://<local ip>:8888

You can then access the GUI at <http://<local ip>:8888/>.

If you receive an error like::

  fs.js:837
     throw errnoException(errno, 'watch');
           ^
  Error: watch ENOSPC

You can increase your watch limit by creating or editing::

  /etc/sysctl.d/10-inotify.conf

Add in the following::

  # expand inotify limit
  fs.inotify.max_user_watches=16384

Then::

  sudo sysctl -p
  cat /proc/sys/fs/inotify/max_user_watches

If it does not echo ``16384`` then you will need to restart.

Note that the Makefile supports ``make help`` to try to introduce some of the
more important targets.  Also note that if you use the "make prod" target
while using the PyJuju ``rapi-rollup`` improv script, the password you should
use is "admin," despite the help text you see.


Typical Github workflow
=======================

Git allows you to work in a lot of different work flows. Here is one that
works well for our environment, if you are not already familiar with git.

To set up the environment, first fork the repository. Once the fork is
complete, create a local copy and work on a feature branch.

::

  git clone git@github.com:{yourusername}/juju-gui.git
  cd juju-gui
  # Add a second remote to the upstream Juju repository your fork came from.
  # This lets you use commands such as `git pull juju develop` to update a
  # branch from the original trunk, as you'll see below.
  git remote add juju git@github.com:juju/juju-gui.git
  # Create a feature branch to work on.
  git checkout -b {featureBranchName}
  # Hacky hacky hacky


To push code for review, cleanup the commit history.

::

  # Optional: rebase your commit history into one or more meaningful commits.
  git rebase -i --autosquash
  # And push your feature branch up to your fork on Github.
  git push origin {featureBranchName}:{featureBranchName}


In order to submit your code for review, you need to generate a pull request.
Go to your github repository and generate a pull request to the `juju:develop`
branch.

After review has been signed off on and the test run has updated the pull
request, a member of the `juju` organization can submit the branch for landing
with a new comment on the pull request including the string `:shipit:` (yes,
that's a squirrel with a gray fedora).

Once the code has been landed you can remove your feature branch from both the
remote and your local fork. Github provides a button to do so in the bottom of
the pull request, or you can use git to remove the branch. Removing from your
local fork is listed below.

::

  git push origin :{featureBranchName}
  # And to remove your local branch
  git branch -D {featureBranchName}

Before creating another feature branch, make sure you update your fork's code
by pulling from the original Juju repository.

::

  # Using the alias from the Helpful aliases section, update your fork with
  # the latest code in the juju develop branch.
  git sync-juju

  # And start your second feature branch.
  git checkout -b {featureBranch2}


Syncing your feature branch with develop (trunk)
-------------------------------------------------

Time to time you have a feature branch you've been working on for several days
while other branches have landed in trunk. To make sure you resolve any
conflicts before submitting your branch, it's often wise to sync your feature
branch with the latest from develop. You can do this by rebasing your branch
with develop.

The recommended pattern would be to

::

  # Update your local copy of develop with the latest from the juju branch.
  git sync-juju

  # Then check back out your feature branch and sync it with your new local
  # develop.
  git checkout {featureBranch}
  git sync-trunk

You should see messages for each landed branch getting rebased into your work.

::

    First, rewinding head to replay your work on top of it...
    Applying: Created local charm new or upgrade inspector.
    Applying: Refactored local charm upload helpers to support multiple service upgrades


Helpful Git tools and aliases
=============================

Tools
-----

`Git Remote Branch
<https://github.com/webmat/git_remote_branch>`_ - A tool to simplify working
with remote branches (Detailed installation instructions are in their readme).

Aliases
-------

Git provides a mechanism for creating aliases for complex or multi-step
commands. These are located in your ``.gitconfig`` file under the
``[alias]`` section.

If you would like more details on Git aliases, You can find out more
information here: `How to add Git aliases
<https://git.wiki.kernel.org/index.php/Aliases>`_

Below are a few helpful aliases we'll refer to in other parts of the
documentation to make working with the Juju Gui easier.

::

  ###
  ### QA a pull request branch on a remote e.g. juju
  ###

  # Bring down the pull request number from the remote specified.
  # Note, the remote that the pull request is merging into may not be your
  # origin (your github fork).
  fetch-pr = "!f() { git fetch $1 +refs/pull/$2/head:refs/remotes/pr/$2; }; f"

  # Make a branch that merges a pull request into the most recent version of the
  # trunk (the "juju" remote's develop branch). To do this, it also updates your
  # local develop branch with the newest code from trunk.
  # In the example below, "juju" is the name of your remote, "6" is the pull
  # request number, and "qa-sticky-headers" is whatever branch name you want
  # for the pull request.
  # git qa-pr juju 6 qa-sticky-headers
  qa-pr = "!sh -c 'git checkout develop; git pull $0 develop; git checkout -b $2; git fetch-pr $0 $1; git merge pr/$1'"

  # Update your local develop branch with the latest from the juju remote.
  # Then make sure to push that back up to your fork on github to keep
  # everything in sync.
  sync-juju = "!f() { git checkout develop && git pull juju develop && git push origin develop; }; f"

  # Rebase develop (trunk) into the current feature branch.
  sync-trunk = rebase develop

Working with a Real Juju
========================

The easiest way to work with a real Juju installation, See
<http://jujucharms.com/~juju-gui/precise/juju-gui> or
<http://jujucharms.com/charms/precise/juju-gui> for details.

Alternatively, you can try the instructions below, but be warned that they
have bit-rotted and we have not felt the need to update them.  If you get them
to work, please update the docs and submit a branch for review (see below).

Bit-Rotted Instructions
-----------------------

You can use the GUI with any environment, but for development purposes, a
local environment works well. One environment option specific to this branch
is the ``api-port``. An appropriate sample configuration::

  default: dev
  environments:
    dev:
      type: local
      data-dir: /home/kapil/.juju/local
      admin-secret: b3a5dee4fb8c4fc9a4db04751e5936f4
      default-series: precise
      juju-origin: ppa
      api-port: 8081

Note that ``juju-origin`` is set to the PPA, the API server runs outside of
the container, and it is launched using whichever branch you are using.

Also note that the ``api-port`` should be set at ``8081``, which the GUI's
initial environment connection currently defaults to.

You will need to bootstrap the local environment, and deploy one service.
The API server needs access to the provisioning credentials which are
lazily initialized in Juju upon usage.

``Juju-gui`` and ``rapi-rollup`` can communicate via an encrypted WebSocket
connection: to enable it, add the following line to the config above::

  api-secure: true

You will also need to edit ``app/config-debug.js`` and ``app/config-prod.js``
replacing ``ws://localhost:8081/ws`` with ``wss://localhost:8081/ws``.

By default, ``rapi-rollup`` uses a self-signed certificate; because of that you
will need to visit the <https://localhost:8081/ws> WebSocket URL with your
browser and accept the included self-signed certificate, or the WebSocket
encrypted connection will not work.

In order to use a different certificate you add an ``api-keys`` option to the
config above: its value will be the path of the directory containing the
certificate and the private key, whose filenames will have to be respectively
``juju.crt`` and ``juju.key``.

After this, the GUI should be functional (it automatically polls the
API server for establishing a websocket).

Running Unit Tests
==================

``make test-prod`` or ``make test-debug`` will run the CLI based test
runner. If you need to debug a test in the browser, use ``make test-server``.

To run the test server on a specific port use the ENV variable `TEST_PORT`.

::

    TEST_PORT=9000 make test-server

Running Lint
============

Run the linters with ``make lint``.  ``make beautify`` will use the Google
Closure tools to try and force the code to conform to some of the guidelines,
with variable success.  It can help, but we suggest you first commit your code
to your branch and only then run make beautify, so you can easily see and
evaluate the changes it made.

If you have done a large refactoring and the yuidoc linter complains about a
lot of code that no longer exists or has been moved or renamed, note that
``make undocumented`` can reproduce the undocumented file so as to quiet the
linter. If you need to do this, please make sure that the length (``wc -l``)
of the new "undocumented" file is the same or smaller than it was before.

.. _all-docs:

Documentation
=============

The ``make docs`` command generates the code and the project documentation
together. The ``make view-docs`` command does the above and also opens both
docs in the browser.

Code Documentation
------------------

Generated documentation for the JavaScript code is available in the ``yuidoc/``
directory.  You can build and view the docs by running::

  make view-code-doc

See the :ref:`style guide <embedded-docs>` document for details on how to
write the embedded documentation.

Project Documentation
---------------------

The project documentation is available in the ``docs/`` directory. As already
mentioned in the developer installation instructions above, it needs Sphinx
and Python-yaml.  To build and view the documentation, use these commands::

  make view-main-doc

Filing Bugs
===========

Please file bugs here:

https://bugs.launchpad.net/juju-gui/+filebug

Proposing Branches
==================

We use ``lbox`` to propose branches for review and submit them to the trunk.
Gustavo Niemeyer has `a helpful blogpost`_ about this tool.  See the
:ref:`Process document <preparing-reviews>` for a step-by-step checklist on how
to prepare branches for review.

.. _`a helpful blogpost`:
    http://blog.labix.org/2011/11/17/launchpad-rietveld-happycodereviews

Making Targets Quickly Without Bazaar
=====================================

Within a checkout, a lightweight checkout, or a branch, you may run make as
``NO_BZR=1 make [target]`` in order to prevent the Makefile from running any
Bazaar commands, all of which access the parent branch over the network. Where
Bazaar may have provided information such as the revno, sensible defaults are
used instead.  Because many of these Bazaar commands are used to populate
variables regardless of the target, defining NO_BZR will have an effect on all
targets, except ``dist``, which will refuse to complete.

Note that this allows one to run any make target from the working copy, even
if it is a lightweight checkout, by skipping steps that involve network access
through Bazaar.  Because of this, make will assume that the revno is
0 and that the branch is clean and up to date without checking that it is a
checkout of trunk.  The resulting tarball or build may be used to test
releases by hand or in the charm.

Making Releases
===============

See the :ref:`Process document <make-releases>` for step-by-step checklists to
make developer and stable releases.  The following is additional detail and an
overview.

To make a release, you must either be in a checkout of ``lp:juju-gui``
without uncommitted changes, or you must override one of the
`pertinent variable names`_ to force a release.

.. _`pertinent variable names`:
    `Potentially Useful Release-Oriented Makefile Variables`_

To make the release tarball use ``make distfile``.

In order to make and upload the release (``make dist``), you also need to have
a GPG key, and the ``python-pytz`` package installed (as well as
``launchpadlib``, but that is installed by default in Ubuntu).

Potentially Useful Release-Oriented Makefile Variables
------------------------------------------------------

The following is a list of pertinent Makefile variables.

``FINAL``
  Set ``FINAL`` to any non-empty value to make a final release. This will cause
  the ``bzr revno`` to be omitted from the tarball name, and (if you use the
  release target) will cause the release to be uploaded to the stable series
  rather than the trunk series. Example usage::

    FINAL=1 make dist

``PROD``
  By default, releases will be uploaded to ``staging.launchpad.net``, which is
  a separate version of Launchpad that uses a temporary database.  This can be
  convenient for trying out the release process in the Makefile without
  affecting our actual production releases.  Set ``PROD`` to any non-empty
  value to send uploads to ``launchpad.net``, the production version of
  Launchpad, when you are ready to make a real release.

  Note that you may need to ask the webops to turn off the two-factor
  authentication on your Launchpad staging account in order for the staging to
  work. Go to the ``#launchpad-ops`` channel on the Canonical IRC server and
  ask something like "webops, could you disable 2FA on my staging account?".

  Example usage::

    PROD=1 make dist

``IS_TRUNK_BRANCH``
  Set this to any non-empty value to force the Makefile to believe it is
  working with a trunk checkout. Example usage::

    IS_TRUNK_BRANCH=0 make dist

``BRANCH_IS_CLEAN``
  Set this to any non-empty value to force the Makefile to believe that the
  current code tree has no changes. Example usage::

    BRANCH_IS_CLEAN=0 make dist

``BRANCH_IS_GOOD``
  Set this to any non-empty value to force the Makefile to bypass checks of
  ``IS_TRUNK_BRANCH`` and ``BRANCH_IS_CLEAN``. Example usage::

    BRANCH_IS_GOOD=0 make dist

Updating the ``nodejs`` dependencies
====================================

The ranges of allowed versions for the ``nodejs`` dependency packages are
specified in the top-level ``package.json`` file. However, the actual installed
versions are frozen in the top-level ``npm-shrinkwap.json`` file, which
overrides the former.

The ``npm-shrinkwap.json`` file is generated by the ``npm shrinkwrap`` command
(see `shrinkwrap - Lock down dependency versions`_) on the basis of the
packages currently installed by any of the ``make build-[something]`` commands.

The procedure for updating the dependency versions is described in the
`Building shrinkwrapped packages`_ section of the aforementioned document. In
a nutshell:

1) review the ``package.json`` file and see whether any constraints may be
   updated, in order to allow using newer package versions;
2) delete the ``npm-shrinkwrap.json`` file;
3) run ``make``, getting all new dependencies;
4) check that everything works well;

If everything is fine, regenerate the ``npm-shrinkwap.json`` file by running
the ``npm shrinkwrap`` command.

If something is broken find the culprit, adjust the ``package.json`` file
accordingly, and go back to step #3.

Alternatively, you might use the ``npm outdated`` command to get the update
candidates, and do the job one step at a time rather than all at once.

.. _`shrinkwrap - Lock down dependency versions`:
    https://npmjs.org/doc/shrinkwrap.html
.. _`Building shrinkwrapped packages`:
    https://npmjs.org/doc/shrinkwrap.html#Building-shrinkwrapped-packages

Introducing third-party JavaScript libraries
============================================

Do the following in order to add external non-YUI JavaScript libraries:

1) copy the file(s) to ``app/assets/javascripts/``;
2) add them to app/modules-debug.js (look for "jsyaml" for an example of how to
   do it). Whatever name you choose for the module ('js-yaml' in the given
   example) is the name you should put in the "requires" section of the code
   that needs it.
3) reference the new file(s) in ``bin/merge-files``: this file includes a list
   of third-party JavaScript libraries (``filesToLoad.js``) in which the new
   file(s) must be pushed.

Third-party libraries might not conform to our code style. If ``make lint``
outputs errors for the libraries you added, do the following:

1) exclude those file from the ``JSFILES`` list in the Makefile;
2) if the new libraries define globals, and you want lint to be aware and
   ignore the new global names, add those to the ``predef`` list in
   ``.jshintrc``.
