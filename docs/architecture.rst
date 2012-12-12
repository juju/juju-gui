============
Architecture
============

Overview
========

MVC YUI
-------

Juju-gui is based on yui's backbone style app framework. The `official docs
<http://yuilibrary.com/yui/docs/app/>`_ are highly recommended for developers.

An overview of the individual pieces.

- `Router <http://yuilibrary.com/yui/docs/router/>`_ - Route dispatch by url,
  saves and restores url state.

- `Views <http://yuilibrary.com/yui/docs/view/index.html>`_ - Rendering of a
  view.

- `Model <http://yuilibrary.com/yui/docs/model/>`_,
  `ModelList <http://yuilibrary.com/yui/docs/model-list/>`_ - Domain objects
  with change events.

Environment Integration
-----------------------

The gui connects and communicates to the environment over a web socket
connection.

RPC Calls
---------

Completion callbacks can be used with any of the methods on the environment.
Multiple calls are done in parallel.

RPC Events
----------

Messages from the backend for known rpc operation results are messaged out as
Environment events.

Delta Stream
------------

A stream of object changes, used to update models.

Scenarios
~~~~~~~~~

- new client
- existing client disconnects and reconnects

Requirements
~~~~~~~~~~~~

::

  connect  sync disconnect
     |       |        |

  api
  -- sync (ids+hashes)
  -- subscribe()
  -- delta

Questions
---------

- Model Composition and relations.

- relations by id

- We have multiple object states for a given.

- Inline combo handler for YUI: <https://github.com/rgrove/combohandler>.

- More complicated but similiar: <https://github.com/jafl/YUI-3-Stockpile>.
