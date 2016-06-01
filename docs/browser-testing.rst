.. _browser-testing:

===============
Browser Testing
===============

The Juju GUI project uses browser testing to make sure that the Juju GUI works
when run against real Juju models across multiple scenarios, for instance GUI
deployed using the charm, GUI in Juju and so on.

These functional tests are provided by the juju-uitest project
(https://github.com/CanonicalLtd/juju-uitest). For more information on how
ui-tests are organized and run, see
https://github.com/CanonicalLtd/juju-uitest/blob/master/README.md

Setting up
==========

Building
--------

The testing has the same system dependencies as development. Make sure to
follow the HACKING doc for instructions on setting up your environment.

Running the browser tests
=========================

To start the Juju GUI related subset of the uitest suite, run the following::

  make uitest

The above will automatically build a release tarball from the current branch to
be used by the uitest executable as the Juju GUI version to be exercised when
running the suite. In this process, the current master version of Juju is
downloaded, installed and used to bootstrap lxd controllers in which the GUI is
exercised. This process usually takes minutes: see below the customization
paragraph for hints on how to speed up the suite when multiple runs are needed.

Requirements
------------

Running Juju GUI functional tests requires:

- some time to complete its execution: do not expect it to be blazing fast;
- SSH keys already generated for the user running the tests;
- a working Internet connection.

Providing customized uitest options
-----------------------------------

It's possible to provide customized options to the uitest command by using
the ARGS environment variable, for instance::

  make uitest ARGS="--debug --show-browser"

As mentioned, the suite builds Juju from scratch every time. It is possible to
prevent that by providing a gopath parameter, for instance::

  make uitest ARGS="--gopath /tmp/uitest-gopath"

With the above, the first time the suite is run Juju is compiled using the
given GOPATH as usual, but in subsequent runs the ``/tmp/uitest-gopath``
directory is reused and Juju is not rebuilt from scratch, significantly
speeding up the process.

Parameters used by default are only overridden if specified in ARGS.
To see all possible uitest parameters, run the following::

  make uitest ARGS="--help"
