.. Run "make view-main-doc" to render this file and read it in the browser
   alongside the whole project documentation. To do this, you need the
   dependencies described in the "Documentation" section of the HACKING
   file.

======
README
======

Welcome. Juju-GUI is a web-based GUI for `Juju <https://juju.ubuntu.com/>`_.
Juju lets you deploy connected services to the cloud in a convenient,
vendor-neutral, and powerful way. The GUI lets you visualize and manage
your work more intuitively from a web browser.

Juju-GUI code is hosted `on Github`_

Juju-GUI bugs are tracked on `on Launchpad
<https://bugs.launchpad.net/juju-gui>`_.

See also:

- a `stable demo <http://jujucharms.com/>`_,
- a `demo of trunk <http://comingsoon.jujucharms.com/>`_,
- the `juju quickstart plugin
  <http://jujugui.wordpress.com/2013/11/07/juju-quickstart-plugin-alpha-but-useful/>`_,
- our `blog <http://jujugui.wordpress.com/>`_, and
- the `user-facing docs <https://juju.ubuntu.com/docs/howto-gui-management.html>`_.

This branch in particular is for a networking prototype.

Deploy
======

Deploying the GUI is easiest with the `juju quickstart plugin
<http://jujugui.wordpress.com/2013/11/07/juju-quickstart-plugin-alpha-but-useful/>`_
or `the Juju GUI charm <https://jujucharms.com/precise/juju-gui>`_.  If you
want to simply use the GUI, please try those.

If you want to develop the GUI, or you have a deployment goal that the charm
does not and cannot support, you can try the Makefile commands.  The most
useful available commands are shown by the ``make help`` command.

You will typically want to run one of ``make prod``,  ``make debug`` or ``make
devel`` to deploy an environment. You might also run ``make test-debug`` and
``make test-prod`` to check that everything is ok, and ``make docs`` to
generate the available documentation for both project and code. See the
`HACKING`_  file for details.

Configure
=========

Some configurable parameters may be found in three files:

- ``config.js``
- ``app/config-debug.js``
- ``app/config-prod.js``

If you are using `the charm <https://jujucharms.com/precise/juju-gui>`_, the
end-user configuration is available from the charm configuration.


.. _HACKING: https://github.com/juju/juju-gui/blob/develop/HACKING.rst
.. _on Github: https://github.com/juju/juju-gui
