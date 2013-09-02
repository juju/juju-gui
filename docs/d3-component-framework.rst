======================
D3 Component Framework
======================

The D3 Component codebase is a small framework with the following goals:

- Support clear separation of concerns among various sections of application
  logic.
- Support incremental updates of the D3 scene.
- Allow simple configuration of features to aid in the reusability of D3
  application logic.

It accomplishes this through a number of declarative tools and suggested
patterns around application development. The document below attempts to
explain this usage as it exists today.

The framework only models two high level objects, Component and Module. A
Component is a top level container around Module objects. The Component
provides the implementation of the declarative behavior provided by the
framework. The Module(s) implement the logical sections of the application. In
the YUI world it might be common to expect each Module to be the application's
rendering and interactive behavior around a single YUI App.Model or
App.ModelList.

Module Writers Guide
====================

Using the component framework means taking advantage of the tools offered
through its module system. Components manage one or more modules, each of which
models one concern of the resultant scene.

Modules declare events using structures dictated by the framework. Event
bindings allow the module to respond to both changes in its underlying data and
to changes in application state (through things like user interaction). It is
through these bound events that most rendering and interaction with the scene
are performed. Rendering becomes a rarely invoked complete redraw of the scene
while the modules themselves handle incremental updates via their event
handlers.

Component API
=============

Components support few actions (as most of the non-declarative work happens in
Modules).  Components are containers for modules and have support functions for
adding and removing modules from their management. In addition, when modules
are added options can be passed that will be made available in the Module's
run time.  Modules added via the ``addModule`` method automatically have a
reference to the component via an YUI Attribute named ``component``, and any
options passed to the ``addModule`` call result in an Attribute called
``options``, which will default to an empty object.

::

  comp = new Component();
  comp.addModule(MyModule, {foo: bar})

This example would create a new component and, then using the ``MyModule``
constructor, create an instance of this module (or use an instance if directly
passed) and set the ``component`` and ``options`` Attributes. In this example
the Module would have its ``foo`` option set to ``bar`` such that::

  modInstance.get('options.foo') === 'bar'

where ``modInstance`` is the instance created by the above example's
``addModule`` call.

Components then support rendering, which draws the scene described by any data
the modules reference. This is done in a number of phases.

The first (and often only) time ``render`` is called, a special ``renderOnce``
is called. This allows the component to do any necessary setup work. Typically
this will be to create some SVG element and retain a reference to it.

In the context of ``renderOnce``, ``render`` will call ``update`` on each of
its modules in the order they were added. The ``update`` method is used to
recalculate any intermediate state associated with rendering the various data
objects. This includes things like position information.

Once ``update`` has been called, each module's ``render`` method is invoked.
This performs the actual drawing work. It is at this point that any D3
synthetic events are bound to the canvas (see the section on events below).

This separation of phases exists to make the life of the Module writer simpler.
They can rely on whatever elements they'll be drawing (adding children to an
SVG object for example) will already have its container properly available due
to the ``renderOnce`` setup. They can also be sure that any ``update`` driven
intermediate data will be computed and available for use in ``render``. This
reduces the need for checks in each module to assert the most basic DOM state.

After the initial render, it is expected that updates to the scene occur via
the event handlers in the various modules. ``render`` will not usually need to
be called more than once unless the entire Component rendering is removed from
the DOM and then later re-attached.

The most important aspect of ``addModule`` (and its inverse ``removeModule``)
is that they properly support adding and removing event listeners. When a
component's addModule method is triggered, it will bind all the declarative
events of the module, and when ``removeModule`` is called it will properly
clean up event subscriptions. Properly defining and using events is the core
of the component system, and this is described in its own section.

As a final step, if the module has a ``componentBound`` callback it will be
invoked after successfully binding the module. This gives the module a
chance to initialize any data that depends on component state (which can
be obtained through ``.get('component')``).

Events
======

Events are the heart of the component system, and can be defined in a number of
ways. Understanding how to take advantage of the binding features will greatly
aid in producing a system which allows for clean, clear, well separated
concerns, and which in turn supports incremental rendering and data updates.

There are three categories of events supported by the component framework. They
each have their purpose and share some common syntax around expression in the
module declaration, but a module writer must understand them all to properly use
the framework.

When a Component is created it can be in either an interactive or
non-interactive state. This is controlled through a Boolean 'interactive'
attribute which defaults to true. When false, events will not be bound and this
section can be skipped.

When modules are added, three sets of declarative events are bound. This is
done by including in the module an events object with the following (each
optional) sections::

  events = {scene: {},
            d3: {}
            yui: {}
            };

Most commonly there are ``scene`` events. Scene events describe YUI style event
delegation. This has advantages in that it scales well and these events can be
bound once to the top level container object of a component, and will work for
a DOM element matching its selector. Scene events are defined in one of two
ways: the first is a shorthand, the second is the more complete definition
(you will see this in the other events types as well).

::

  scene: { selector: 'callback name on module'}

also supported is::

  scene: {selector: function() {...}}

However, the string name of a callback is preferred, as this makes the whole
set of events more easily readable. The final form is::

  scene: {selector: {callback: 'callbackName'}}

This expanded format is common to the other types of event declarations, as
well as supporting options available to the other types of bindings.

Regardless of form, ``selector`` is a CSS selector, typically either a
``.class`` or an ``#id``, though pseudo-selectors work as well. With scene
events, these selectors are relative to whatever container was established on
initialization of the Component. A concrete example might be::

  scene: {'.person': {click: 'personClick'}}

Which says that whenever an object in the scene with a ``person`` class is
clicked, invoke the ``personClick`` handler.

Handlers all have a common signature. To understand the calling convention you
must understand a bit about how D3 data bindings work. If you're not familiar
with that, please read the D3 documents related to data binding.

The short version is that each DOM element can have data associated with it
through D3's sophisticated data binding model. In the YUI world it might be
common that rendered DOM elements have D3 bound data coming from a YUI App
Model. Knowing this we can understand the calling convention::

  callback(D3Data, component)

Where ``this`` is the DOM element that triggered the selection. Any return is
ignored.

In the near future, scene events will support an additional context attribute
in their handler definition which can either be ``component`` or ``module``,
and will default to module.

.. note::

  At the time of this writing this is currently ``component`` and does not
  support context selection. This is addressed in a branch, and when landed
  this note can be removed. It is worth noting now as the default will change.

The second type of event are D3 specific bindings. While declared in a style
similar to scene events, D3 events are bound after the module's ``render``
method is triggered, as DOM elements must be present to be bound. There are
very few cases to prefer this style of event binding over normal scene events;
however, there are legitimate uses.

If the event is a D3 synthetic event such as zoom or drag, using D3 event
bindings make sense as these cannot be delegated to using scene events. The
second case we are aware of at the time of this writing is that certain mouse
events are dealt with more easily using D3 events, as D3 uses a well documented
system of x, y position coordinates which the mouse events map cleanly. This
is a possible area for future expansion both in terms of cleaner mouse
handling and creating a possible mapping of D3 synthetics to YUI custom
events. An example of D3 events follows::

  d3: {dragstart: 'beginDrag',
       drag: 'redrawConnectors',
       dragend: 'savePosition'}

The calling convention is as above::

  callback(D3Data, component)

``this`` is the DOMElement triggering the event. Return value is ignored.

The final type of event is called ``yui`` events. This classification does not
depend on DOM selection or delegation, and is designed to provide simple
handling; its use case is YUI custom events. A common pattern for
usage might be to emit events of interest (or possible interest) from one
module and listen for those events in another. By subscribing to custom events
across modules, it is reasonably easy to extend functionality with only a loose
coupling of the modules themselves (through event names only as an example).

YUI events are defined similarly to the others but differ in some key ways.
First, they do not depend on a DOM selector, they depend on a YUI styled event
name (prefixed or otherwise). Secondly, they support a traditional YUI notion
of event phases: ``before``, ``on`` and ``after``. For additional details on
how those work, refer to the YUI event docs.

::

  yui: {'cancelAction': {callback: 'closeMenu',
                         phase: 'before',
                         context: 'module'
                         }
       }

In this example another module might fire a ``cancelAction`` event; our module
wants to respond to this by closing its menu before the triggering event is
handled, and the context (``this``) of the callback should be this module.

Context can either be ``component`` or ``module``, with module being the
default ``this`` for handlers. Phase can be ``before``, ``on``, or ``after``,
with ``on`` being the default.

Complete Example
================

Here is a complete example of a module, with some description. The tests for
this framework also can be used to learn about the capabilities and expected
usage of the system.

::

  TestModule = Y.Base.create('TestModule', Module, [], {
    events: {
      scene: { '.thing': {click: 'decorateThing'}},
      d3: {drag: 'dragObject'},
      yui: { cancel: 'cancelHandler'}
      },

    decorateThing: function(data, context) {
      // this is a DOM .thing element that was clicked
      // data is D3 bound data, context will be the module.
    },

    dragObject: function(data, context) {
      // this is a DOM element that had the D3.behavior.drag applied
      // and was then dragged with a mouse event.
      // data is D3 bound data, context will be the module.
    },

    cancelHandler: function(evt) {
      // this is the module
      // evt is the YUI event object
    }
  });
