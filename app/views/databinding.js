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

    /**
      Utility method to filter down our list of bindings
      based on optional list of bound model attributes
      that we have change indications on. If no keys
      are specified all  bindings are updated.

      @method deltaFromChange
    */
    function deltaFromChange(modelChangeKeys) {
      /*jshint validthis:true */
      var self = this;
      if (modelChangeKeys === undefined) {
        return this._bindings;
      }
      return Y.Array.filter(this._bindings, function(binding) {
          if (modelChangeKeys.indexOf(binding.name) > -1) {
            return binding;
          }
      });
    }

    function BindingEngine() {
      this.model = null;
      this._viewlets = {};   // {viewlet.name, viewlet}
      this._events = [];    // [event handle]
      this._bindings = [];  // [binding, ...]
      this._fieldHandlers = DEFAULT_FIELD_HANDLERS;
      this.deltaFromChange = deltaFromChange;
    }

    /**
     * @method addBinding
     * @param {Object} config A bindings Object, see description.
     * @chainable
     */
    BindingEngine.prototype.addBinding = function(config) {
      var defaultBinding = {};
      defaultBinding.get = function(model) { return model.get(this.name);};
      var binding = Y.mix(defaultBinding, config);
      this._bindings.push(binding);
      return this;
    };

    /**
     * Bind a model or modellist to one or more viewlets.
     *
      @method bind
      @param {Object} model || model list
      @param {Object||Array} viewlet or array of viewlets.
      @chainable
     */
    BindingEngine.prototype.bind = function(model, viewlet) {
      if (!Y.Lang.isArray(viewlet)) { viewlet = [viewlet]; }
      Y.each(viewlet, function(v) { this._bind(model, v);}, this);
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
     * @method _bind
     * @param {Object} model
     * @param {Object} viewlet
     * @chainable
     */
   BindingEngine.prototype._bind = function (model, viewlet) {
      if (!viewlet) {
        throw new Error('Unable to bind, invalid Viewlet');
      }
      var key = model.id || model.get('id');
      // If we have a model, unbind it.
      if (this.model) {this.unbind();}
      this.model = model;
      this._viewlets[viewlet.name] = viewlet;

      // Check model or modellist?
      if (!Y.Lang.isFunction(model.size)) {
        // Bind and listen for model changes.
        if (viewlet.bindings) {
          Y.each(viewlet.bindings, function(b) {this.addBinding(b);}, this);
        }
        this._events.push(model.on('change', this._modelChangeHandler, this));
        this._updateDOM(this.deltaFromChange());
      } else {
        // Model list
        // TODO: If this is a lazy model list then the models contained are
        // POJOs and won't fire attr change events. In that case we can
        // use a Object.observe polyfill to get notice on model change.
        // We don't do data-binding on child elements, the viewlet will be
        // triggered to re-render its contents. All our collection views
        // are currently read-only so this work ok.
        this._events.push(model.after(['add', 'remove', '*:change'],
                                   this._modelListChange, this));
        this._modelListChange();
      }
     return this;
    };

    /**
     Unbind all event listeners

     @method unbind
    */
    BindingEngine.prototype.unbind = function() {
      Y.Array.each(this._events, function(handle) {
        handle.detach();
      });
      this._events = [];
    };

    BindingEngine.prototype._modelListChange = function(evt) {
      var self = this;
      var list = this.model;
      // Force an update to each viewlet registered to the
      // ModelList.
      Y.each(this._viewlets, function(viewlet) {
        if (viewlet.update) {
          viewlet.update.call(viewlet, list);
        } else {
          viewlet.container.setHTML(viewlet.generateDOM(list));
        }
      }, this);
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
      var keys = Y.Object.keys(evt.changed);
     this._updateDOM(this.deltaFromChange(keys));
    };

    /**
     * Mutate the DOM according to model changes. Designed to
     * be called from both model and modellist contexts so
     * we need to be able to track change/new/removed elements.
     *
     * @method _updateDOM
     * @param {Array} delta Those bindings which should be updated.
     *                When omitted defaults to all bindings.
     */
    BindingEngine.prototype._updateDOM = function(delta) {
      var self = this;
      var model = this.model;
      if (delta === undefined) {
        delta = this.deltaFromChange();
      }

      Y.each(delta, function(binding) {
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
    };

    return BindingEngine;
  })();
  views.BindingEngine = BindingEngine;

}, '0.1.0', {
  requires: ['juju-view-utils',
             'juju-models',
             'node']
});
