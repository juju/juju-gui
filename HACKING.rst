=======
HACKING
=======

Building
--------

Get the GUI source
~~~~~~~~~~~~~~~~~~

In order to run pyramid GUI, you need to import the juju-gui source. You can use
either a gui tarball (e.g. a release tarball) from Launchpad_ or use the jujugui source on
disk (e.g. the checked out source).

You can then import the source using the source script:

::

   python scripts/source.py /path/to/tarball/or/source/directory

If you choose source on disk, `scripts/source.py` creates a symlink to the source. This
makes development in the gui source relatively easy to integrate with this pyramid
application.

If you would rather use make, there's a make target to set up the source as
well. It requires you to provide the path to the src as an environment variable.

::

   SRC=/path/to/tarball/or/source/directory make src


If for any reason you need to remove the source files, you can clear them with:

::

   make clean-gui-src
Or clear them along with the built gui using:

::

   make clean-gui-all


.. _Launchpad: https://launchpad.net/juju-gui/+download

Building the GUI
~~~~~~~~~~~~~~~~

The gui can be built in both a development and production form. In development,
the files are not minified. In production, the files are minified with
uglifyJS.

To build the gui in dev mode, run:

::

    make gui-dev

For production:

::

   make gui-prod

You can clear away the built files by running:

::

   make clean-gui

Running the GUI
~~~~~~~~~~~~~~~

You can run the gui with the makefile:

::

   make run

This will spin up a python development server listening on `0.0.0.0:6543`
