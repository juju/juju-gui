===========
Databinding
===========


The Juju GUI includes a set of tools for ensuring that changes to objects
can automatically update the DOM elements used to render or visualize 
these objects. Concretely changes to Y.Model objects can automatically
update forms when new delta events manipulate those objects over the 
websocket.

This document explains how to use the databinding service and enumerates
its feature set.

Terms
=====

Binding
    An object defining the interaction between a model value and
    a single DOM element.
Model
    A Y.Model instance.
POJO
    A Native Javascript Object instance. Modern browser provide an
    Object.observe call which is use to observe such object independent of
    Y.Model support.
Databinding Engine 
    Manages the connection between an Object and DOM representing it. Configured
    by viewlets.
Viewlet
    Configuration and code used in the context of a model and some DOM (usually
    from a Template) that manages the relationship between the model, the DOM 
    and the databinding engine.
ViewletManager
    A container class implementing policy around a collection of viewlets usually
    associated with a single model or highly coupled set of models.


Overview
===================

The best way to use the databinding library depends on what you need to do with
it. There are a number of ways to interact with it. Understanding that the
ViewletManager layer is a way of selecting which configuration to include when
setting up the binding engine means that we can focus on the features of the 
lower levels first.

Given a DOM fragment and a model the binding engine will scan the DOM fragment
looking for data-bind attributes. Each of these attributes will internally be
translated into a Binding instance. Binding instances are largely transparent
at the level that one uses the system but are a useful way to understand how
certain configuration choices work. These will be covered later in some detail.

Once the DOM fragment has been parsed and the bindings array is generated the 
configuration is used to optionally supplement the bindings. When this is done
events are bound and the connection between the model and the DOM is active.

Various databinding engines provide different styles of bindings, from Models
to DOM, from DOM (typicall forms) to Models and some offer bi-directional
binding. While our use cases didn't require bi-directional binding at the time 
of authoring this library we do provide some features related to bi-directional
bindings as well the Model to DOM style bindings discussed. This will be
covered in the section on conflict resolution.


A Simple Viewlet
================

Example::

  var model = new Y.Model({alpha: 'beta'});
  var dom = new Y.Node.create('<input type="text" data-bind="alpha"/>);
  var b = new BindingEngine().bind(model, {conatiner: dom});

At this point changes to the models 'alpha' value will appear in that DOM Node.


More complex interactions
=========================

Example::

   var model = new Y.Model({constraints: {cpu: '3Ghz'}});
   var dom = new Y.Node.create('<input type="text" data-bind="constraints.cpu"/>);
   var b = new BindingEngine();
   var viewlet = {
       name: 'constraintsViewlet',
       container: dom,
       bindings: {
           constraints: {
               format: function(value) {
               return value || '';
               }
           }
       }
   }).bind(model, viewlet);

This example introduces a number of new concepts. The model introduces
'constraints' which is itself a mapping object. The DOM fragment sets up a
single binding to a nested element within that model ('cpu'). Bindings
automatically follow dotted paths for attribute names.

Another important concept in this example is extending the implicit binding
objects generated from parsing the DOM object. The 'bindings' mapping includes
keys referencing model attribute names and can contain a number of methods that
add more explicit behavior. See bindings below.

The final concept of this example is support for hierarchical bindings. The
'constraints' object as noted is a mapping with many possible keys and dotted
path access. When defining binding methods such as 'format' or 'update' we can
apply them to the top level model key and they will apply to all dotted path
elements under that key. In this example bindings on 'contraints' will apply to
constrants.cpu and for example constraints.mem or other keys.

Viewlets
========

Viewlets 



Bindings
========

The bindings element to configuration allows for the definition of a number
of additional methods for controlling the relationship between model changes and
the resulting impact on the DOM. 

'format': A method for transforming the model value to the intended output
format. For example this can map timestamps to a particular date/time
representation. 'format' doesn't handle updating the DOM directly but does
change the value used to update the DOM. Called as format(oldValue) with the 
context of the binding object. Should return the formatted value.

'update': A method for directly updating the DOM. Called with the context of
the binding and with the bound DOM node and a Y.Node as the first argument and
the new value (after the optional formatting step above). This method should
update the value by manipulating its first argument. To aid in this the binding
object (context) will have a 'field' property which has both 'get' and 'set'
methods. Calling this.field.set(node, value) should properly set the value
based on the type the node.

Before/After Methods
====================

The 'update' callback allows for 'beforeUpdate' and 'afterUpdate' methods to
trigger as well. These will optionally be called when present with the same
arguments.


Method Wildcarding
==================

The databinding library support triggering two classes of method when other
binding updates are triggered. This is handled as binding wildcarding. To
define a wildcard you use on of the two possible matching patterns and define a
beforeUpdate/update/afterUpdate method. The two possible matching patterns and their 
semantics are:

+
    Triggered for any binding run in the current update. For example if a
    model key is changed and the DOM is about to be updated each binding
    with a '+' match will run. This is called with the context of the 
    wildcard binding and the update value.

*
    Triggered on any update these methods are triggered without the 
    node or the value that changed as they related only to the fact that 
    an update is running.


ModelList binding
=================

Databinding allows for passing a model list directly as the 'model' argument of
bind(). The handling of this is quite limited. The default is to re-render the
the template used to produce the DOM with the new modellist in place. If an
'update' method is provided on the viewlet (not the binding) it will be used to
produce changes within the viewlet.container directly.

If complex updates relating to the singular elements in the model list are 
required we've used D3 in the update method of the viewlet todo render the 
elements in the list with proper enter/update/exit sections.
