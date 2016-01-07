=======
HACKING
=======

Building
--------

Building the GUI
~~~~~~~~~~~~~~~~

The GUI can be built in both a development and production form. In development,
the files are not minified. In production, the files are minified with
uglifyJS.

To build the GUI mode, run:

::

    make gui

You can clear away the built files by running:

::

   make clean-gui

Running the GUI
~~~~~~~~~~~~~~~

You can run the GUI with the makefile:

::

   make run

This will spin up a python development server listening on `0.0.0.0:6543`.
Changes to relevant files will cause the server to automatically reload them.

You can also run the server without the watcher using

::

   make server

To run the server with production settings use

::

   make qa-server

Configuration
~~~~~~~~~~~~~

The gui has several configuration options that can be set in its ini file
which effect its running.

* jujugui.raw -- Setting to true sets the combo loader to load the unminified
    files.
* jujugui.combo -- Setting to false causes the combo loader to serve files
    separately, rather than loading them altogther.
* jujugui.socketTemplate -- Sets the template for creating new websocket urls.
    Defaults to /environment/$uuid/api.


Running tests
~~~~~~~~~~~~~

The test suite can be run using

::

   make test

Testing the GUI via the charm
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The most realistic way to test the GUI is to deploy the Juju GUI charm after
including any changes you've made to the GUI.

Assuming ``$GUI`` is your GUI repo and ``$CHARM`` is your charm repo, do the following:

::

   cd $CHARM
   JUJU_GUI_BRANCH=$GUI make package
   juju switch <your preferred provider>
   juju bootstrap
   make deploy

Optionally you can enable debug mode in the GUI service so that the unit serves the unminified static files:

::

   juju set juju-gui juju-gui-debug=true

At this point it is possible to manually hack on the unit files: the GUI lives
at ``/usr/local/lib/python2.7/dist-packages/jujugui/static/gui/build/app/``

When the above is already set up, you have some local changes and you want to
test them live, you can quickly just upload and install the new resulting
release, like the following:

1. Create a new release:

::

   cd $GUI && make dist

2. Upload the resulting archive (this assumes the unit is juju-gui/0):

::

   juju ssh juju-gui/0 mkdir /tmp/release
   juju scp $GUI/dist/*.bz2 juju-gui/0:/tmp/release

3. Install the new release in the GUI unit:

::

   juju ssh juju-gui/0 "sudo pip install --no-index --no-dependencies -U /tmp/release/*.bz2”
