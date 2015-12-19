.. Run "make view-main-doc" to render this file and read it in the browser
   alongside the whole project documentation. To do this, you need the
   dependencies described in the "Documentation" section of the HACKING
   file.

======
README
======

Welcome. Juju-GUI is a web-based GUI for `Juju <https://jujucharms.com/>`_.
Juju lets you deploy connected services to the cloud in a convenient,
vendor-neutral, and powerful way. The GUI lets you visualize and manage
your work more intuitively from a web browser.

Juju-GUI code is hosted `on Github`_

Juju-GUI bugs are tracked on `on Github Issues
<https://github.com/juju/juju-gui/issues>`_.

See also:

- a `stable demo <http://jujucharms.com/>`_,
- the `juju quickstart plugin`_,
- our `blog <http://jujugui.wordpress.com/>`_, and
- the `official documentation <https://jujucharms.com/docs/stable/juju-gui-management>`_.

Deploy
======

Deploying the GUI is easiest with the `juju quickstart plugin`_
or the `Juju GUI charm`_.  If you
want to simply use the GUI, please try those.

If you want to develop the GUI, or you have a deployment goal that the charm
does not and cannot support, you can try the Makefile commands.  The most
useful available commands are shown by the ``make help`` command.  If you've
never run the GUI locally you'll want to start by executing ``make sysdeps``
to install some required system-wide dependencies.  If you don't want those
dependencies installed on your machine you may want to do the development work
in a virtual machine or LXC.

To deploy a local environment you can run ``make server``, which will launch
with appropriate development settings.  To mimic a production server run
``make qa-server``.

See the `HACKING`_  file for more details on developing and contributing to
the project.

Configure
=========

Some configurable parameters may be found in three files:

- ``config.js``
- ``app/config-debug.js``
- ``app/config-prod.js``

If you are using the `Juju GUI charm`_, the end-user configuration is
available from the charm configuration.


.. _HACKING: https://github.com/juju/juju-gui/blob/develop/HACKING.rst
.. _on Github: https://github.com/juju/juju-gui
.. _juju quickstart plugin: https://launchpad.net/juju-quickstart
.. _Juju GUI charm: https://jujucharms.com/trusty/juju-gui
