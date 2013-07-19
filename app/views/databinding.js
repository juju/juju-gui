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
      Templates = views.Templates;

  views.BindingEngine = (function() {
    var DEFAULT_FIELD_HANDLERS = {
      input: {
        'get': function(node) { return node.get('value');},
        'set': function(node, value) { node.set('value', value);}
      },
      textarea: {
        'get': function(node) { return node.get('value');},
        'set': function(node, value) { node.set('value', value);}
      },
      'default': {
        'get': function(node) { return node.get('text');},
        'set': function(node, value) { node.setHTML(value);}
      }
    };

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
      /*jshint validthis:true */
      var self = this;
      var bindings = Y.Object.values(this._bindings);
      var result = [];
      if (modelChangeKeys === undefined) {
        return bindings;
      }
      bindings.filter(function(binding) {
        // Change events don't honor nested key paths. This means
        // we may update bindings that impact multiple DOM nodes
        // (our granularity is too low).
        return (modelChangeKeys.indexOf(binding.name.split('.')[0]) > -1);
      }).forEach(function(binding) {
        result.push(binding);
        if (binding.dependents) {
          binding.dependents.forEach(function(dep) {
            var depends = self._bindings[dep];
            if (depends) {
              result.push(depends);
            }
          });
        }
      });

      return result;
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
      this._bindings = {};  // {modelName: binding Object}
      this._fieldHandlers = DEFAULT_FIELD_HANDLERS;
      this._models = {}; // {ModelName: [Event Handles]}
    }

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
      // Ensure 'target' is an Array.
      if (typeof binding.target === 'string') {
        binding.target = [binding.target];
      }
      binding.viewlet = viewlet;
      this._bindings[config.name] = binding;
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
      debugger;
      if (checkClassImplements(viewletModel, 'model')) {
        debugger;
        modelEventHandles.push(
            model.on('change', this._modelChangeHandler, this));
      } else {
        // Pojo support
        // This typically depends on an Object.observe polyfill being
        // in place (which it is). As browsers natively support this
        // we can one day drop the polyfill.
        debugger;
        modelEventHandles.push(
            Object.observe(model, Y.bind(this._modelChangeHandler, this)));
      }

      debugger;
      // Bind and listen for model changes.
      viewlet.container.all('[data-bind]').each(function(node) {
        // Add the binding for each element
        this.addBinding({
          name: node.getData('bind'),
          target: node
        }, viewlet);
        // Add listeners for model cloning for conflict resolution
        viewlet._eventHandles.push(
            node.on(
            'valueChange', this._storeChanged, this, viewlet));
      }, this);
      this._setupHeirarchicalBindings();
      this._setupDependencies();
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
      Y.each(this._bindings, function(binding) {
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
      var bindings = Y.Object.values(this._bindings);
      bindings.forEach(function(binding) {
        if (binding.depends) {
          binding.depends.forEach(function(dep) {
            var source = self._bindings[dep];
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
     Unbind all event listeners

     @method unbind
    */
    BindingEngine.prototype.unbind = function() {
      debugger;
      var self = this;
      // Unbind each model
      Y.each(this._models, function(handles) {
        handles.forEach(function(handle) {
          if (handle.detach) {
            handle.detach();
          } else {
            Object.unobserve(handle, self._modelChangeHandler);
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
        handle.detach();
      });
      // Empty the list
      modelEventHandles.splice(0, modelEventHandles.length);
      this._models[mID] = modelEventHandles;
      return modelEventHandles;
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
      Called on valueChange on a bound input to store dirty input references

      @method _storeChanged
      @param {Event} e event object.
      @param {Object} viewlet reference.
    */
    BindingEngine.prototype._storeChanged = function(e, viewlet) {
      var key = e.currentTarget.getData('bind'),
          save = true;

      viewlet._changedValues.forEach(function(value) {
        if (value === key) {
          save = false;
        }
      });
      if (save) {
        viewlet._changedValues.push(key);
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
      delta = keys && deltaFromChange.call(this, keys);
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
      @param {Array} delta Those bindings which should be updated.
                     When omitted defaults to all bindings.
     */
    BindingEngine.prototype._updateDOM = function(delta) {
      var self = this;
      var resolve = self.resolve;
      if (delta === undefined || (delta.length && delta.length === 0)) {
        delta = deltaFromChange.call(this);
      }

      Y.each(delta, function(binding) {
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

        // This could be done ahead of time, but by doing this at runtime
        // we allow very flexible DOM mutation out of band. Revisit if
        // this shows up on a profile.
        var elementKind = binding.target.getDOMNode().tagName.toLowerCase();
        var field = self._fieldHandlers[elementKind];
        if (!field) {
          field = self._fieldHandlers['default'];
        }
        var dataKey = binding.target.getData('bind');

        // If the field has been changed while the user was editing it
        viewlet._changedValues.forEach(function(value) {
          if (value === dataKey) {
            conflicted = binding.target;
            viewlet.unsyncedFields();
            binding.viewlet.conflict(
                binding.target, viewletModel, binding.viewlet.name,
                Y.bind(resolve, self));
          }
        });

        // Do conflict detection
        if (binding.target !== conflicted) {
          var value = binding.get(viewletModel);
          if (binding.format) {
            value = binding.format.call(binding, value);
          }
          // If an apply callback was provided use it to update
          // the DOM otherwise used the field type default.
          if (binding.update) {
            binding.update.call(binding, binding.target, value);
          } else {
            field.set.call(binding, binding.target, value);
          }
        }
      });
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
      var changedValues = Y.Array.filter(
          viewlet._changedValues, function(value) {
            if (value !== key) {
              return true;
            }
            return false;
          });
      viewlet._changedValues = changedValues;
      var elementKind = node.getDOMNode().tagName.toLowerCase();
      var field = this._fieldHandlers[elementKind];
      if (!field) {
        field = this._fieldHandlers['default'];
      }
      field.set.call(this, node, value);
      // If there are no more changed values then tell the
      // the viewlet to update accordingly
      if (viewlet._changedValues.length === 0) {
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
      viewlet._changedValues = [];
      viewlet.syncedFields();
    };

    return BindingEngine;
  })();

}, '0.1.0', {
  requires: ['juju-view-utils',
             'juju-models',
             'yui-later',
             'observe',
             'node']
});
