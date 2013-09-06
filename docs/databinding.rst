===========
Databinding
===========


The Juju GUI includes a set of tools for ensuring that changes to objects
can automatically update the DOM elements used to render or visualize 
these objects. DOM Elements which are bound to Y.Model objects can
automatically update forms when new delta events manipulate those objects over
the websocket.

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
    A Native Javascript Object instance. Modern browsers provide an
    Object.observe call which is use to observe such object independent of
    Y.Model support. Today this is provided by a polyfill of Object.observe
    which we hope to remove in the near future.
Databinding Engine 
    Manages the connection between an Object and DOM representing it. It is
    configured by viewlets.
Viewlet
    Configuration and code used in the context of a model and some DOM (usually
    a template) that manages the relationship between the model, the DOM 
    and the databinding engine.
ViewletManager
    A container class implementing policy around a collection of viewlets usually
    associated with a single model or highly coupled set of models.


Overview
========

Given a DOM fragment and a model the binding engine will scan the DOM fragment
looking for data-bind attributes. Each of these attributes will internally be
translated into a Binding instance. Binding instances are largely transparent
at the level that one uses the system but are a useful way to understand how
certain configuration choices work. These will be covered later in some detail.

Once the DOM fragment has been parsed and the bindings array is generated, the 
configuration is used to optionally supplement the bindings. When this is done
events are bound and the connection between the model and the DOM is active.

Various databinding engines provide different styles of bindings, from Models
to DOM, from DOM typical to Models and some offer bi-directional binding. While
our use cases didn't require bi-directional binding at the time of authoring
this library we do provide some features related to bi-directional bindings as
well the Model to DOM style bindings discussed. This will be covered in the
section on conflict resolution.


Basic Databinding
=================

Example::

  var model = new Y.Model({alpha: 'beta'});
  var dom = new Y.Node.create('<input type="text" data-bind="alpha"/>');
  var b = new BindingEngine().bind(model, {container: dom});

At this point changes to the models 'alpha' value will appear in that DOM Node.


Advanced Usage
==============

Example::

   var model = new Y.Model({constraints: {cpu: '3Ghz'}});
   var dom = new Y.Node.create('<input type="text" data-bind="constraints.cpu"/>');
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
   };
   b.bind(model, viewlet);

This example introduces a number of new concepts. The model introduces
'constraints' which is itself a mapping object. The DOM fragment sets up a
single binding to a nested property within that model ('cpu'). Bindings
automatically follow dotted paths for attribute names.

Another important concept in this example is extending the implicit binding
objects generated from parsing the DOM object. The 'bindings' mapping includes
keys referencing model attribute names and can contain a number of methods that
add more explicit behavior. See bindings below.

The final concept of this example is support for hierarchical bindings. The
'constraints' object as noted is a mapping with many possible keys and dotted
path access. When defining binding methods such as 'format' or 'update' we can
apply them to the top level model key and they will apply to all dotted path
properties under that key. In this example bindings on 'contraints' will apply
to
constrants.cpu and for example constraints.mem or other keys.


Viewlets
========

See the viewlets documentation.



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

selectBindModel
===============

Sometimes it is convenient to pass a model to bind() when the real intention 
is to have a particular viewlet depend on some related (or child) model. Prior
to the event listener(s) being bound to bind()'s model argument we see if the 
viewlet provides a 'selectBindModel' function. This will be called with the 
passed in model and can then return a new model to which databindings will 
actually bind. If this method fails to return a model nothing will 
be bound for that particular viewlet.

Example::

  var model = new Y.Model({units: new models.LazyModelList()});
  var dom = new Y.Node.create(...);
  var b = new BindingEngine().bind(model, {
  container: dom,
  selectBindModel: function(model) {
    return model.get('units');
  }});

This minimal example indicates that we wish to bind to the units model list.



Before/After Methods
====================

The 'update' callback allows for 'beforeUpdate' and 'afterUpdate' methods to
trigger as well. These will optionally be called when present with the same
arguments.

Binding Dependencies
====================

Bindings allow for triggering of other bindings when they change. This tool is
used when we trigger bindings to update even though the bound model element
might not fire change notifications as expected. For example, Juju GUI service
models include a LazyModelList of units belonging to that service.  Changes to
service.units.item(n) don't trigger the binding 'units' to update.  By adding a
'depends' binding entry we can ask that changes to another field trigger this
binding.

Example::
  
  bindings: {
    units: {
        depends: ['aggregated_status'],
        update: function() {}
    }
  }

In this example, when the property aggregated_status is set() we will also call
the update method of units.



Method Wildcarding
==================

The databinding library support triggering two classes of method when other
binding updates are triggered. This is handled as binding wildcarding. To
define a wildcard you use one of the two possible matching patterns and define a
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

Example::

   var model = new Y.Model({a: 'alpha', b: 'beta'}});
   var dom = new Y.Node.create('<input type="text" data-bind="a"/>' + 
                               '<input type="text" data-bind="b"/>)');
   var b = new BindingEngine();
   var viewlet = {
       container: dom,
       bindings: {
        '+' : { 
            beforeUpdate: function(node, value) {
                this._changing = [];
            },
            update: function(node, value) {
                this._changing.push(node.getData('bind'));
            },
            afterUpdate: function() {
                console.log("this._changing", this._changing);
            }
        }
     }
   };
   b.bind(model, viewlet);

In this example we suppose that we want to record the keys that have changed
on any given update cycle. Here we create a list before doing updates, add the
name of the bound key (extracted from the DOM in this case) and log these when
the update is complete. If only the key 'a' changed on a delta update this 
example will only log that 'a' has changed as we used a '+' pattern match.


ModelList Rendering
===================

Example::

   var model = new Y.Model({title; 'Sir'}});
   var dom = new Y.Node.create('<input type="text" data-bind="first_name"/>);
   var b = new BindingEngine();
   var viewlet = {
       container: dom,
       update: function(modellist) {
            this.container.setHTML(Templates['renderList'](modellist));
       }
     }
   };
   b.bind(model, viewlet);

In this example we take advantage of the viewlets ability to specify an
'update' method for handling model lists. We assume there is a compiled
template under a Templates object (not shown) which can render itself with the
model list when the list has changed. In this case it would fully re-render itself
when anything in the ModelList has changed. 'this' is the viewlet for this call
and we are able to extract the template and populate it.


