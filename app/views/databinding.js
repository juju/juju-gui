/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
   Provide the DataBinding library.

   @module views
   @submodule views.databinding
 */

YUI.add('juju-databinding', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      Templates = views.Templates,
      slice = [].slice;

  views.BindingEngine = (function() {
    var textEq = function(node, value) {
      var currentValue = this.get(node);
      var normalizedValue = value ? value.toString() : '';
      return (normalizedValue === currentValue);
    };
    var textInputFieldHandler = Object.create({
      'get': function(node) { return node.get('value');},
      'set': function(node, value) { node.set('value', value || '');},
      'eq': textEq
    });
    var DEFAULT_FIELD_HANDLERS = {
      'input[type=checkbox]': Object.create({
        'get': function(node) {
          return node.get('checked');
        },
        '_normalizeValue': function(value) {
          if (value === 'false') {
            return false;
          }
          return !!value;
        },
        'set': function(node, value) {
          node.set('checked', this._normalizeValue(value));
        },
        'eq': function(node, value) {
          var currentValue = !!this.get(node);
          return (this._normalizeValue(value) === currentValue);
        }
      }),
      // The textInputFieldHandler is good for input[type=text], textareas,
      // and many other HTML5 inputs.
      input: textInputFieldHandler,
      textarea: textInputFieldHandler,
      // This is good for non-form-field HTML nodes (e.g. span).
      'default': Object.create({
        'get': function(node) { return node.get('text');},
        'set': function(node, value) { node.setHTML(value);},
        'eq': textEq
      })
    };

    var indexBindings = function(bindings, keyfunc, multiple) {
      var index = {};
      if (!keyfunc) {
        keyfunc = function(b) {
          if (b.name === '*' || b.name === '+') {
            // Our wildcards are handled in a different path.
            return;
          }
          return b.name.split('.')[0];
        };
      }

      bindings.forEach(function(binding) {
        var key = keyfunc(binding);
        if (!key) {
          return;
        }
        if (multiple) {
          if (!index[key]) {
            index[key] = [];
          }
          index[key].push(binding);
        } else {
          index[key] = binding;
        }
      });
      return index;
    };

    /**
      Trigger callback when present on context. Passes additional arguments to
      its callback.

      @method optionalCallback
      @param {Object} context of both call and callback.
      @param {String} callbackName to resolve and if present invoke.
      @return {Object} return value of callback.
    */
    function optionalCallback(context, callbackName) {
      var callback = context[callbackName];
      if (callback) {
        return callback.apply(context, slice.call(arguments, 2));
      }
      return undefined;
    }

    /**
      Trigger callback when present on context

      @method optionalCallbacks
      @param {Array} Array of context objects to invoke optionalCallback on.
      @param {String} callbackName to resolve and if present invoke.
      @param {Arguments} arguments passed to callback.
      @return {Boolean} return if any callbacks returned any value.
    */
    function optionalCallbacks(contextArray, callbackName, target, value) {
      //Alias to preserve in scope.
      var name = callbackName,
          tgt = target,
          val = value,
          result = true;

      if (!contextArray) {return;}
      contextArray.forEach(function(context) {
        var retval = optionalCallback(context, name, tgt, val);
        if (retval !== undefined) {
          result = result && retval;
        }
      });
      return result;
    }

    /**
      Utility method to filter down our list of bindings
      based on optional list of bound model attributes
      that we have change indications on. If no keys
      are specified, all bindings are updated.

      @method deltaFromChange
      @param {Array} modelChangeKeys array of {String} keys that have changed.
      @return {Array} bindings array filtered by keys when present.
    */
    function deltaFromChange(modelChangeKeys) {
      /* jshint -W040 */
      // Ignore 'possible strict violation'
      var bindings = this._bindings;
      var result = {bindings: [], wildcards: {}};
      var index = indexBindings(bindings);
      // Handle wildcards (before we filter down bindings)
      result.wildcards = indexBindings(bindings, function(binding) {
        if (binding.name !== '*' && binding.name !== '+') {
          return;
        }
        return binding.name;
      }, true);

      if (modelChangeKeys !== undefined && modelChangeKeys.length !== 0) {
        bindings = bindings.filter(function(binding) {
          // Change events don't honor nested key paths. This means
          // we may update bindings that impact multiple DOM nodes
          // (our granularity is too low).
          return (modelChangeKeys.indexOf(binding.name.split('.')[0]) > -1);
        });
      }

      // Handle deps
      bindings.forEach(function(binding) {
        if (binding.name === '*' ||
            binding.name === '+') {
          return;
        }
        result.bindings.push(binding);
        if (binding.dependents) {
          binding.dependents.forEach(function(dep) {
            var depends = index[dep];
            if (depends) {
              result.bindings.push(depends);
            }
          });
        }
      });

      return result;
    }

    /**
      Return only those bindings that apply to a single viewlet.

     @method deltaForViewlet
     @param {Object} viewlet The viewlet for which a delta will be generated.
     @return {Object} delta.
    */
    function deltaForViewlet(viewlet) {
      /* jshint -W040 */
      // Ignore 'possible strict violation'
      var delta = deltaFromChange.call(this, Object.keys(
          viewlet.model.getAttrs()));
      delta.bindings = delta.bindings.filter(function(b) {
        return b.viewlet === viewlet;
      });
      return delta;
    }

    /**
     * Check if a target name is in classes bases
     *
     * @method checkClassImplements
     * @param {Object} obj to check.
     * @param {String} target class name, (ex. modelList).
     * @return {Boolean} target in bases.
     */
    function checkClassImplements(obj, target) {
      if (typeof obj !== 'object') {
        return false;
      }

      if (obj._getClasses) {
        var classNames = obj._getClasses().map(function(c) { return c.NAME;});
        return classNames.indexOf(target) > -1;
      }
      return false;
    }

    /**
     * Class which manages the relationship between
     * a model and its viewlet(s).
     *
     * @class BindingEngine
     * @param {Object} options taking:
     *          interval: ms window to restrict multiple DOM udpates.250ms
     *          default.
     */
    function BindingEngine(options) {
      this.options = options || {};
      this.interval = this.options.interval !== undefined ?
          this.options.interval : 250;
      this._viewlets = {};  // {viewlet.name: viewlet}
      this._bindings = [];  // [Binding,...]
      this._unappliedChanges = []; // Model keys having changes we've buffered.
      this._fieldHandlers = DEFAULT_FIELD_HANDLERS;
      this._models = {}; // {ModelName: [Event Handles]}
    }

    /**
     Get the node handler for a given node with a fallback.

     @method getNodeHandler
     @param {Object} node A DOM node (not a YUI node).
     @return {Object} An associated node handler for the node.
     */
    BindingEngine.prototype.getNodeHandler = function(node) {
      var field;
      /* jshint -W040 */
      // Ignore 'possible strict violation'
      if (node.getAttribute('type') === 'checkbox') {
        field = this._fieldHandlers['input[type=checkbox]'];
      } else {
        field = this._fieldHandlers[node.tagName.toLowerCase()];
      }
      if (!field) {
        field = this._fieldHandlers['default'];
      }
      return field;
    };

    /**
     * @method addBinding
     * @param {Object} config A bindings Object, see description in `bind`.
     * @param {Object} viewlet A reference to the viewlet being bound.
     * @return {Object} binding.
     */
    BindingEngine.prototype.addBinding = function(config, viewlet) {
      var defaultBinding = {};
      defaultBinding.get = function(model) { return model.get(this.name);};
      var binding = Y.mix(defaultBinding, config);
      if (viewlet.get) {
        binding.get = viewlet.get;
      }
      // Explicitly allow additional binding information to
      // be passed in the viewlet config. From this we can
      // resolve formatters and update callbacks.
      if (viewlet.bindings && viewlet.bindings[config.name]) {
        binding = Y.mix(binding, viewlet.bindings[config.name], true);
      }

      // This could be done ahead of time, but by doing this at runtime
      // we allow very flexible DOM mutation out of band. Revisit if
      // this shows up on a profile.
      if (binding.target) {
        binding.field = this.getNodeHandler(binding.target.getDOMNode());
      }

      binding.viewlet = viewlet;
      this._bindings.push(binding);
      return binding;
    };

    /**
      Bind a model or modellist to one or more viewlets.  This is a one-way
      binding from the model to the DOM. Model changes are automatically made
      in the DOM. Special handling is provided to detect conflicts and indicate
      when form values differ from the model.

      From within the DOM, data-bind='model key' attributes can be used to
      associate bindings from the model into the DOM. Nested keys are supported
      by using '.' (dotted) paths. As an important development/debug tip when
      trying to use YUI to select a dotted path name make sure to quote the
      entire path. For example Y.one('[data-bind="a.b.c."]').

      Viewlets can provide a number of configuration options
      for use here:

        - name {String}: A unique (within this engine) key to
            index a viewlet by. (required)

        - container {Y.Node} The container into which the viewlet renders.

        - bindings {Object}: A mapping from model property names
              to additional properties available to the binding.
              Currently we support the following callbacks on
              a per binding name basis:
                format(value) -> {New Value}
                update(node, value) -> Mutate DOM directly. If
                   format was provided as well the formatted
                   value will be used.

            Bindings is optional in the case of ModelLists as the
            pattern is to re-render children.

        - update {Function}: Optional function used by ModelLists
            to update its container on add/remove/change. If no
            update method is passed in as configuration then
            the original render method is called and its result
            is set into container. Either way 'this' is the viewlet
            and its called with the modellist as its argument.

      @method bind
      @param {Object} model || model list.
      @param {Object||Array} viewlets or array of viewlets.
      @chainable
    */
    BindingEngine.prototype.bind = function(model, viewlets) {
      if (!Y.Lang.isArray(viewlets)) { viewlets = [viewlets]; }
      Y.each(viewlets, function(v) {
        this._bind(model, v);}, this);
      return this;
    };

    /**
      Bind a model to a viewlet.

      @method _bind
      @param {Object} model to bind.
      @param {Object} viewlet to prepare for updates.
      @chainable
    */
    BindingEngine.prototype._bind = function(model, viewlet) {
      var viewletModel = model;
      if (!viewlet) {
        throw new Error('Unable to bind, invalid Viewlet');
      }

      // Push a bound remove callback the viewlet can use.
      viewlet.remove = Y.bind(function() {
        this.resetModelChangeEvents(model);
        this.resetViewletDOMEvents(viewlet);
        viewlet.model = null;
      }, this);

      this._viewlets[viewlet.name] = viewlet;

      if (viewlet.selectBindModel) {
        viewletModel = viewlet.selectBindModel(model);
      }

      // When selectBindModel doesn't return a valid target, skip the binding.
      if (!viewletModel) {
        return this;
      }
      viewlet.model = viewletModel;

      if (checkClassImplements(viewletModel, 'modelList')) {
        // Model list
        viewlet._eventHandles.push(
            viewletModel.after(['add', 'remove', 'change'],
                              this._modelListChange, this));

        this._modelListChange();
        return this;
      }

      var modelEventHandles = this.resetModelChangeEvents(model);
      if (checkClassImplements(viewletModel, 'model')) {
        modelEventHandles.push(
            model.on('change', this._modelChangeHandler, this));
      } else {
        // Pojo support
        // This typically depends on an Object.observe polyfill being
        // in place (which it is). As browsers natively support this
        // we can one day drop the polyfill.
        var callback = Y.bind(this._modelChangeHandler, this);
        Object.observe(model, callback);
        modelEventHandles.push({model: model, callback: callback});
      }

      // Bind and listen for model changes.
      viewlet.container.all('[data-bind]').each(function(node) {
        // Add the binding for each element
        this.addBinding({
          name: node.getData('bind'),
          target: node
        }, viewlet);
        // Checkboxes are not supported in a valueChange event.
        if (node.getAttribute('type') === 'checkbox') {
          viewlet._eventHandles.push(
              node.on('change', this._nodeChangeHandler, this, viewlet));
        } else {
          // The other elements (input, textarea) are supported in valueChange
          // YUI event.
          viewlet._eventHandles.push(
              node.on('valueChange', this._nodeChangeHandler, this, viewlet));
        }

      }, this);

      this._setupHeirarchicalBindings();
      this._setupDependencies();
      this._setupWildcarding(viewlet);
      this._modelChangeHandler();

      return this;
    };

    /**
     Specialize bindings related to dotted key paths to look for higher
     level objects and mix in their methods when present. This is called
     automatically during the binding process.

     @method _setupHeirarchicalBindings
    */
    BindingEngine.prototype._setupHeirarchicalBindings = function() {
      this._bindings.forEach(function(binding) {
        if (binding.name.indexOf('.') === -1) {
          // The path isn't dotted so nothing to
          // inherit.
          return;
        }
        if (!binding.viewlet.bindings) {
          // There are not bindings so nothing to
          // inherit.
          return;
        }
        // We have a nested path, see if there is a bindings
        // entry under the viewlet and use its methods where
        // present in parent and not present in the child.
        var parentName = binding.name.split('.')[0];
        var parentBinding = binding.viewlet.bindings[parentName];
        if (!parentBinding) {
          return;
        }
        // Non-overwriting mix into binding.
        Y.mix(binding, parentBinding, false);
      });
    };

    /**
     Setup an inverted mapping from the optional binding.depends list
     such that we can directly translate from a change event on a
     dependency to the bindings it should trigger. Called automatically.

     @method _setupDependencies
     */
    BindingEngine.prototype._setupDependencies = function() {
      var self = this;
      var bindings = this._bindings;
      var index = indexBindings(bindings);

      bindings.forEach(function(binding) {
        if (binding.depends) {
          binding.depends.forEach(function(dep) {
            var source = index[dep];
            if (!source) {
              // This can indicate we depend on an implicit binding (one only
              // referenced in the DOM). At this point we must create a binding
              // object to satisfy dependency.
              source = self.addBinding({
                name: dep,
                dependents: []}, binding.viewlet);
            }
            if (source.dependents === undefined) {
              source.dependents = [];
            }
            if (source.dependents.indexOf(binding.name) === -1) {
              source.dependents.push(binding.name);
            }
          });
        }
      });
    };

    /**
     Process a viewlet searching for wildcard bindings and
     roll those into a consumable form.

     @method _setupWildcarding
     @param {Viewlet} viewlet to setup for wildcarding.
     */
    BindingEngine.prototype._setupWildcarding = function(viewlet) {
      if (!viewlet.bindings) {
        return;
      }
      var self = this;
      Object.keys(viewlet.bindings).forEach(function(name) {
        if (name !== '*' && name !== '+') {
          return;
        }
        // This works because bindings is an array, we can
        // register more than one wildcard.
        var binding = viewlet.bindings[name];
        if (!binding.name) {
          binding.name = name;
        }
        self.addBinding(binding, viewlet);
      });
    };

    /**
     Unbind all event listeners

     @method unbind
    */
    BindingEngine.prototype.unbind = function() {
      var self = this;
      // Unbind each model
      Y.each(this._models, function(handles) {
        handles.forEach(function(handle) {
          if (handle.detach) {
            handle.detach();
          } else {
            Object.unobserve(handle.model, handle.callback);
          }
        });
        handles.splice(0, handles.length);
      });

      Y.Object.values(this._viewlets).forEach(function(viewlet) {
        self.resetViewletDOMEvents(viewlet);
      });
    };

    /**
      Unbind model change events from a given model.
      This shouldn't be called as a client of the framework
      unless you are sure what you're doing. See viewlet.remove


      @method resetModelChangeEvents
      @param {Model} to unbind.
      @return {Array} modelEventHandles (empty but appendable).
     */
    BindingEngine.prototype.resetModelChangeEvents = function(model) {
      var mID = model.id || model.get('id');
      var modelEventHandles = this._models[mID] || [];
      modelEventHandles.forEach(function(handle) {
        if (handle.detach) {
          handle.detach();
        } else {
          Object.unobserve(handle.model, handle.callback);
        }
      });
      // Empty the list
      modelEventHandles.splice(0, modelEventHandles.length);
      this._models[mID] = modelEventHandles;
      return modelEventHandles;
    };

    /**
      Reset the bound view to the _current_ values of the model.  Resets all
      viewlets to the contents of their bound model. If a name is provided
      only the bindings of that viewlet will reset.

      @method resetDOMToModel
      @param {String} name (optional) viewlet name to reset.
      @chainable
    */
    BindingEngine.prototype.resetDOMToModel = function(name) {
      // Construct an explicit update of everything.
      var delta;
      if (name && name in this._viewlets) {
        delta = deltaForViewlet.call(this, this._viewlets[name]);
      } else {
        delta = deltaFromChange.call(this);
      }
      this._updateDOM(delta);
      return this;
    };

    /**
      Unbind DOM events created for a given viewlet.

      @method resetViewletDOMEvents
      @param {Viewlet} viewlet to unbind.
      @return {Array} (empty) of DOM event handles.
     */
    BindingEngine.prototype.resetViewletDOMEvents = function(viewlet) {
      var events = viewlet._eventHandles;
      events.forEach(function(handle) {
        handle.detach();
      });
      events.splice(0, events.length);

      // TODO: Filter bindings removing any where viewlet === binding.viewlet.
      return events;
    };

    /**
      Return the viewlet, given `name`.

      @method getViewlet
      @param {String} name to lookup.
      @return {Viewlet} viewlet object.
    */
    BindingEngine.prototype.getViewlet = function(name) {
      // We need the resolved, annotated viewlet.
      return this._viewlets[name];
    };


    BindingEngine.prototype._modelListChange = function(evt) {
      // Force an update to each viewlet registered to the
      // ModelList.
      Y.each(this._viewlets, function(viewlet) {
        var list = viewlet.model;
        // Only update when list is evt target (if we can know this).
        if (!checkClassImplements(list, 'modelList')) {
          return;
        }
        if (viewlet.update) {
          viewlet.update.call(viewlet, list);
        } else {
          viewlet.container.setHTML(viewlet.render(list));
        }
      }, this);
    };

    /**
      Find the binding for the given key (binding name).

      @method _getBinding
      @param {String} key Binding key
      @return {Binding} Binding reference.
    */
    BindingEngine.prototype._getBinding = function(key) {
      var binding;
      if ( // Find the binding for the key, and break when found.
          !this._bindings.some(function(b) {
            if (b.name === key) {
              binding = b;
              return true;
            }})) {
        // We don't expect this to ever happen.  We should only be asking for
        // a key that has been bound.  If this does fail, let's be loud about
        // it ASAP so that we can fix it.
        throw 'Programmer error: no binding found for ' + key;
      }
      return binding;
    };

    /**
      Called on valueChange on a bound input to store dirty input references

      @method _nodeChangeHandler
      @param {Event} e event object.
      @param {Object} viewlet reference.
    */
    BindingEngine.prototype._nodeChangeHandler = function(e, viewlet) {
      this._nodeChanged(e.target, viewlet);
    };

    /**
      Update data structures and call viewlet hooks after a DOM node changes.
      The source of the change might be user input or the BindingEngine
      itself.

      @method _nodeChanged
      @param {Y.Node} node The node that changed.
      @param {Object} viewlet The node's associated viewlet.
    */
    BindingEngine.prototype._nodeChanged = function(node, viewlet) {
      var key = node.getData('bind');
      var nodeHandler = this.getNodeHandler(node.getDOMNode());
      var model = viewlet.model;
      var binding = this._getBinding(key);
      if (nodeHandler.eq(node, binding.get(model))) {
        delete viewlet.changedValues[key];
      } else {
        viewlet.changedValues[key] = true;
      }
      if (viewlet.changed) {
        viewlet.changed(node, key, nodeHandler);
      }
      // If there are no more changes, the viewlet has been synced manually.
      if (Object.keys(viewlet.changedValues).length === 0) {
        viewlet.syncedFields();
      }
    };

    /**
      Handle for Y.Model change event. Here we can choose
      which bindings to change based on the change event.
      This is called automatically by the framework.

      This introduces threshold of 250ms without trigger before
      an actual update will occur.

      @method _modelChangeHandler
      @param {Event} evt Y.Model change event.
     */
    BindingEngine.prototype._modelChangeHandler = function(evt) {
      var keys, delta;
      if (Y.Lang.isArray(evt)) {
        // Object.observe updates
        keys = evt.map(function(update) { return update.name; });
      } else {
        keys = evt && Y.Object.keys(evt.changed);
      }

      // Mix any unapplied changes into the key set
      // updating this list. We then use that combined
      // list to generate the binding set.
      if (keys) {
        keys.forEach(function(k) {
          if (this._unappliedChanges.indexOf(k) === -1) {
            this._unappliedChanges.push(k);
          }
        }, this);
      }
      delta = deltaFromChange.call(this, this._unappliedChanges, evt);

      if (this._updateTimeout) {
        this._updateTimeout.cancel();
        this._updateTimeout = null;
      }

      if (this.interval) {
        this._updateTimeout = Y.later(
            this.interval,
            this,
            this._updateDOM,
            [delta]);
      } else {
        this._updateDOM(delta);
      }
    };

    /**
      Mutate the DOM according to model changes. Designed to
      be called from both model and modellist contexts so
      we need to be able to track change/new/removed elements.

      @method _updateDOM
      @param {Object} delta Those bindings which should be updated.
                     When omitted defaults to all bindings. See
                     deltaFromChange.
     */
    BindingEngine.prototype._updateDOM = function(delta) {
      var self = this;
      var resolve = self.resolve;

      // updateDOM applies all the changes clearing the buffer.
      this._unappliedChanges = [];

      if (delta.bindings.length === 0 &&
          !Object.keys(delta.wildcards).length) {
        return;
      }

      // Iterate bindings and updating each element as needed.
      delta.bindings.forEach(function(binding) {
        var viewlet = binding.viewlet;
        var viewletModel = viewlet.model;
        var conflicted;
        // With the introduction of dependencies in the binding
        // layer, its possible to depend on a dependent value
        // but not on its trigger (which in turn might have no
        // binding target in the DOM)
        if (!binding.target) {
          return;
        }

        // If the field has been changed while the user was editing it
        if (viewlet.changedValues[binding.name]) {
          conflicted = binding.target;
          viewlet.unsyncedFields();
          binding.viewlet.conflict(
              binding.target, viewletModel, binding.viewlet.name,
              Y.bind(resolve, self), binding);
        }

        var value = binding.get(viewletModel);

        if (binding.format) {
          value = binding.format.call(binding, value);
        }

        // Do conflict detection
        if (binding.target !== conflicted) {
          optionalCallback(binding,
                           'beforeUpdate', binding.target, value);
          optionalCallbacks(delta.wildcards['+'],
                            'beforeUpdate', binding.target, value);

          // If an apply callback was provided use it to update
          // the DOM otherwise used the field type default.
          if (binding.update) {
            binding.update.call(binding, binding.target, value);
          } else {
            binding.field.set(binding.target, value);
          }
          optionalCallbacks(delta.wildcards['+'],
                            'update', binding.target, value);
          optionalCallback(binding,
                           'afterUpdate', binding.target, value);
          optionalCallbacks(delta.wildcards['+'],
                            'afterUpdate', binding.target, value);
        }
      });

      // Run Once, Any update.
      // The design of this calling convention is strange, this is basically
      // just an event, it doesn't have the value, though it could get it
      // from this.viewlet.model.
      optionalCallbacks(delta.wildcards['*'], 'beforeUpdate');
      optionalCallbacks(delta.wildcards['*'], 'update');
      optionalCallbacks(delta.wildcards['*'], 'afterUpdate');
    };

    /**
      Called by the viewlets conflict method after the user has chosen
      to resolve the conflict

      @method resolve
      @param {Y.Node} node that the model is bound to.
      @param {String} viewletName of the viewlet.
      @param {Any} value that the user has accepted to resolve with.
    */
    BindingEngine.prototype.resolve = function(node, viewletName, value) {
      var key = node.getData('bind'),
          viewlet = this._viewlets[viewletName];

      delete viewlet.changedValues[key];
      var field = this.getNodeHandler(node.getDOMNode());
      field.set.call(this, node, value);
      // If there are no more changed values then tell the
      // the viewlet to update accordingly
      if (Object.keys(viewlet.changedValues).length === 0) {
        viewlet.syncedFields();
      }
    };

    /**
      Clears the changed values array.

      This is called on 'saving' the config values as we overwrite the Juju
      defined values with the user's values.

      @method clearChangedValues
      @param {String} viewletName viewlet name to clear the changed values.
    */
    BindingEngine.prototype.clearChangedValues = function(viewletName) {
      var viewlet = this._viewlets[viewletName];
      viewlet.changedValues = {};
      viewlet.syncedFields();
    };

    return BindingEngine;
  })();

}, '0.1.0', {
  requires: ['juju-view-utils',
             'juju-models',
             'yui-later',
             'observe',
             'node',
             'event-valuechange']
});
