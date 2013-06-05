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
 * Provide the DataBinding library.
 *
 * @module views
 * @submodule views.databinding
 */

YUI.add('juju-databinding', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      Templates = views.Templates,
      BindingEngine;

  BindingEngine = (function() {
    var DEFAULT_MODEL = 'model';
    var DEFAULT_FIELD_HANDLERS = {
        input: {
          get: function(node) { return node.get('value');},
          set: function(node, value) { node.set('value', value);}
        },
        textarea: {
          get: function(node) { return node.get('text');},
          set: function(node, value) { node.set('text', value);}
        }
      };

    function computeDeltaForBindings(bindings) {
      var self = this;
      var delta = [];
      var modelSet = {};

      Y.each(bindings, function(binding) {
        var model = self.getModelForBinding(binding);
        var modelId = model.get('id');
        if (modelSet[modelId] === undefined) {
          modelSet[modelId] = [model];
        }
        modelSet[modelId].push(binding);
      });

      Y.Object.each(modelSet, function(bindings) {
        delta.push([bindings[0], bindings.slice(1)]);
      });
      return delta;
    }


    function BindingEngine() {
      this._events = [];    // [model key, event handle]
      this._models = {};    // {modelKey: model}
      this._bindings = [];  // [binding, ...]
      this._fieldHandlers = DEFAULT_FIELD_HANDLERS;
      this.computeDeltaForBindings = computeDeltaForBindings;
      this._domManipulators = {}; // model.name, {
                                  //  add: DOM mutation function
                                  //  remove: DOM mutation function
    }

    /**
     * @method getModelForBinding
     * @param {Object} binding.
     * @return {Model} model || undefined.
     */
    BindingEngine.prototype.getModelForBinding = function(binding) {
      // Our copy of the binding is annotated with the key of the
      return this._models[binding.model];
    };

    /**
     * @method addBinding
     * @param {Object} config A bindings Object, see description.
     * @chainable
     */
    BindingEngine.prototype.addBinding = function(config, modelKey) {
      var defaultBinding = {};
      defaultBinding.get = function(model) { return model.get(this.name);};
      defaultBinding.add = function(model, container) {};
      defaultBinding.remove = function(model, container) {};

      // Copy so we can annotate safely.
      // Create a default model association with the default model.
      var binding = Y.mix(defaultBinding, config);
      binding.model = modelKey || DEFAULT_MODEL;
     // TODO: object with get/set?
      this._bindings.push(binding);
      return this;
    };

    /**
     * Bind a model to a DOM tree. This is a one-way
     * binding from the model to the DOM. Model changes
     * are automatically made in the DOM. Special
     * handling is provided to detect conflicts and
     * indicate when form values differ from the model.
     *
     * Options can include:
     *    - key: {String} name to index the model under. This
     *    allows the engine to associate multiple models with
     *    a single DOM tree. This can be done by passing a new
     *    key name on subsequent bind calls.
     *    - bindings: {Object} Bindings array, see addBinding
     *
     * @method bind
     * @param {Object} model
     * @param {Object} dom
     * @param {Object} options
     * @chainable
     */
    BindingEngine.prototype.bind = function (model, dom, options) {
      if (!dom) {
        throw new Error('Unable to bind, invalid DOM');
      }
      options = options || {};
      var key = options.key || DEFAULT_MODEL;
      this.unbind(key);
      this._models[key] = model;
      // Watch this reference as possible leak.
      this._dom = dom;

      if (options.bindings) {
        Y.each(options.bindings, function(b) { this.addBinding(b, key);}, this);
      }

      // Check model or modellist?
      if (!Y.Lang.isFunction(model.size)) {
        this._events.push([key, model.on('change', this._modelChangeHandler, this)]);
      } else {
        // Model list
       this._events.push([key, model.on('add'. this._modellistAddHandler, this)]);
       this._events.push([key, model.on('remove'. this._modellistRemoveHandler, this)]);
       this._events.push([key, model.on('*:change'. this._modelChangeHandler, this)]);
      }

      // Update the DOM on bind
      // TODO: figure out how to handle model lists
      // here, in that case we almost certainly
      // are calling 'add' rather than change
      // for the deltaType
      this._updateDOM(this.computeDeltaForBindings(this._bindings));
      return this;
    };

    BindingEngine.prototype.unbind = function(key) {
      this._events = Y.Array.filter(this._events, function(handle) {
        if (key !== undefined &&
            handle[0] !== key) {
          return handle;
        }
        // On a match we detach and return nothing.
        handle[1].detach();
      });
    };

    BindingEngine.prototype._modellistAddHandler = function(evt) {
      var self = this;
      // New elements will have the binding 'add' called and then
      // normal update proceed.
      var model = evt.model;
      var adder = this._domManipulators[model.name].add
      // The adder method can produce a new node in the DOM.
      var node = adder(model, this._dom);
      // If it does then we run the normal update cycle
      // manually once, it will react to change in the future normally.
      this._updateDOM(this.computeDeltaForBindings(this._bindings))

    };

    /**
     * Handle for Y.Model change event. Here we can choose
     * which bindings to change based on the change event.
     * This is called automatically by the framework.
     *
     * @method _modelChangeHandler
     * @param {Event} evt Y.Model change event.
     */
    BindingEngine.prototype._modelChangeHandler = function(evt) {
      var self = this;
      var keys = Y.Object.keys(evt.changed);
      var bindings = Y.Array.filter(this._bindings, function(b) {
          // if b.name in keys.
          if (keys.indexOf(b.name) > -1) { return b;}
      });

     var delta = computeDeltaForBindings.call(this, bindings);
     this._updateDOM(delta);
    };

    /**
     * Mutate the DOM according to model changes. Designed to
     * be called from both model and modellist contexts so
     * we need to be able to track change/new/removed elements.
     *
     * @method _updateDOM
     * @param {Object} delta. [model, bindings array, 'add'|'change'|'remove']
     */
    BindingEngine.prototype._updateDOM = function(deltas, model) {
      var self = this;

      Y.each(deltas, function(delta) {
        var model = delta[0];
        var bindings = delta[1];
        Y.each(bindings, function(binding) {
          Y.each(binding.target, function(target) {
            var selection = Y.all(target);
           Y.each(selection, function(node) {
             // This could be done ahead of time, but by doing this at runtime
             // we allow very flexible DOM mutation out of band. Revisit if
             // this shows up on a profile.
             var elementKind = node.getDOMNode().tagName.toLowerCase();
             var field = self._fieldHandlers[elementKind];

             // Do conflict detection
             // Do data-field
             field.set.call(binding, node, binding.get(model));
            });
          });
        });
      });
    };


    return BindingEngine;
  })();
  views.BindingEngine = BindingEngine;

}, '0.1.0', {
  requires: ['juju-view-utils',
             'juju-models',
             'node']
});
