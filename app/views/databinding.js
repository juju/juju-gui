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
      if (modelChangeKeys === undefined) {
        return this._bindings;
      }
      return this._bindings.filter(function(binding) {
        // This is to support binding on sub properties
        // It's pretty ugly we can probably find a cleaner way.
        return (modelChangeKeys.indexOf(binding.name.split('.')[0]) > -1);
      });
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
     */
    function BindingEngine() {
      this.model = null;
      this._viewlets = {};  // {viewlet.name: viewlet}
      this._events = [];    // [event handle]
      this._bindings = [];  // [binding, ...]
      this._fieldHandlers = DEFAULT_FIELD_HANDLERS;
    }

    /**
     * @method addBinding
     * @param {Object} config A bindings Object, see description in `bind`.
     * @param {Object} viewlet A reference to the viewlet being bound.
     * @chainable
     */
    BindingEngine.prototype.addBinding = function(config, viewlet) {
      var defaultBinding = {};
      defaultBinding.get = function(model) { return model.get(this.name);};
      var binding = Y.mix(defaultBinding, config);
      // Ensure 'target' is an Array.
      if (typeof binding.target === 'string') {
        binding.target = [binding.target];
      }
      binding.viewlet = viewlet;
      this._bindings.push(binding);
      return this;
    };

    /**
      Bind a model or modellist to one or more viewlets.  This is a one-way
      binding from the model to the DOM. Model changes are automatically made
      in the DOM. Special handling is provided to detect conflicts and indicate
      when form values differ from the model.


      Viewlets can provide a number of configuration options
      for use here:

        - name {String}: A unique (within this engine) key to
            index a viewlet by. (required)

        - container {Y.Node} The container into which the viewlet renders.

        - bindings {Array}: An array of binding descriptors. These
            take the following form:
              name: {String} Name of Attribute on model,
              target: {String || Array of String} CSS selectors to
                      elements bound to this model attribute.
              get: {Function} (optional) method to override
                  default attr access pattern. get(model) -> value.

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
      @param {Object||Array} viewlet or array of viewlets.
      @chainable
    */
    BindingEngine.prototype.bind = function(model, viewlet) {
      this._events.push(
          model.on('change', this._modelChangeHandler, this));
      if (!Y.Lang.isArray(viewlet)) { viewlet = [viewlet]; }
      Y.each(viewlet, function(v) { this._bind(model, v);}, this);
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

      this.model = model;
      this._viewlets[viewlet.name] = viewlet;

      if (viewlet.rebind) {
        viewletModel = viewlet.rebind(model);
      }

      // When rebind doesn't return a valid target, skip the binding.
      if (!viewletModel) {
        return this;
      }

      // Check model or modellist?
      if (checkClassImplements(viewletModel, 'model')) {
        // Bind and listen for model changes.
        viewlet.container.all('[data-bind]').each(function(node) {
          // Add the binding for each element
          this.addBinding({
            name: node.getData('bind'),
            target: node
          }, viewlet);
          // Add listeners for model cloning for conflict resolution
          this._events.push(
              node.on(
                  'valueChange', this._storeChanged, this, viewlet));
        }, this);
        this._updateDOM();
      } else {
        // Model list
        // TODO: If this is a lazy model list then the models contained are
        // POJOs and won't fire attr change events. In that case we can
        // use a Object.observe polyfill to get notice on model change.
        // We don't do data-binding on child elements, the viewlet will be
        // triggered to re-render its contents. All our collection views
        // are currently read-only so this work ok.
        this._events.push(viewletModel.after(['add', 'remove', 'change'],
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
      this._events.forEach(function(handle) {
        handle.detach();
      });
      this._events = [];
    };

    BindingEngine.prototype._modelListChange = function(evt) {
      var list = this.model;
      // Force an update to each viewlet registered to the
      // ModelList.
      Y.each(this._viewlets, function(viewlet) {
        if (viewlet.rebind) {
          list = viewlet.rebind(list);
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

      @method _modelChangeHandler
      @param {Event} evt Y.Model change event.
     */
    BindingEngine.prototype._modelChangeHandler = function(evt) {
      var keys = Y.Object.keys(evt.changed);
      this._updateDOM(deltaFromChange.call(this, keys));
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
      var model = this.model;
      var resolve = self.resolve;
      if (delta === undefined) {
        delta = deltaFromChange.call(this);
      }

      Y.each(delta, function(binding) {
        var viewlet = binding.viewlet;
        var viewletModel = viewlet.rebind && viewlet.rebind(model) || model;
        var conflicted;

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
            binding.viewlet.conflict(
                binding.target, viewletModel, binding.viewlet.name,
                Y.bind(resolve, self));
          }
        });

        // Do conflict detection
        if (binding.target !== conflicted) {
          field.set.call(binding, binding.target, binding.get(viewletModel));
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
      var key = node.getData('bind');
      var changedValues = Y.Array.filter(
          this._viewlets[viewletName]._changedValues, function(value) {
            if (value !== key) {
              return true;
            }
            return false;
          });
      this._viewlets[viewletName]._changedValues = changedValues;
      var elementKind = node.getDOMNode().tagName.toLowerCase();
      var field = this._fieldHandlers[elementKind];
      if (!field) {
        field = this._fieldHandlers['default'];
      }
      field.set.call(this, node, value);
    };

    return BindingEngine;
  })();

}, '0.1.0', {
  requires: ['juju-view-utils',
             'juju-models',
             'observe',
             'node']
});
