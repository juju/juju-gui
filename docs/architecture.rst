============
Architecture
============

Overview
========

MVC YUI
-------

Juju-gui is based on yui's backbone style app framework. The official docs
for this are highly recommended for developers:
http://yuilibrary.com/yui/docs/app/

An overview of the individual pieces.

- Router - Route dispatch by url, saves and restores url state.
  http://yuilibrary.com/yui/docs/router/

- Views - Rendering of a view
  http://yuilibrary.com/yui/docs/view/index.html

- Model - Domain objects with change events
  http://yuilibrary.com/yui/docs/model/
  http://yuilibrary.com/yui/docs/model-list/

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

Model Composition and relations.

relations by id

We have multiple object states for a given.

Inline combo handler for yui: https://github.com/rgrove/combohandler

More complicated but similiar: https://github.com/jafl/YUI-3-Stockpile
