============
Datasources
============


Upstream Charm Store
====================

The charm store data is pulled from an upstream API provided by the
`Charmworld`_ application. It provides two sets of API's used by the Juju Gui
currently. The first is an unversioned basic API used to get started.

The second API is represented in the Juju Gui by the store class Charmworld0.
It's the version 0 of the Charmworld API. It provides end points for fetching
information about charms, searches for charms, content for files in charms, as
well as QA data. This data feeds the updated Juju Gui Browser UX.

Configuration
-------------
Specify the url of the Charmworld instance in the config setting
`charmworldURL`.

About Charmworld
-----------------
Charmworld is a pyramid web application and is `Charm`_ 'd to run on OpenStack. Documentation for hacking on Charmworld can be found in it's `working tree`_.





.. _Charmworld: http://launchpad.net/charmworld
.. _Charm: http://jujucharms.com/~juju-jitsu/precise/charmworld
.. _working tree: http://bazaar.launchpad.net/~juju-jitsu/charmworld/trunk/view/head:/docs/index.rst
