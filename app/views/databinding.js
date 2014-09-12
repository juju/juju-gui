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
      // Handle wildcards.
      result.wildcards = indexBindings(bindings, function(binding) {
        if (binding.name !== '*' && binding.name !== '+') {
          return;
        }
        return binding.name;
      }, true);

      var filteredBindings = bindings;
      if (modelChangeKeys !== undefined && modelChangeKeys.length !== 0) {
        // In this branch of the the conditional, we only have a specific set
        // of keys that have changed, so we may want to limit the resulting
        // bindings appropriately.

        // Find the bindings that match the modelChangeKeys.
        filteredBindings = bindings.filter(function(binding) {
          // Change events don't honor nested key paths. This means
          // we may update bindings that impact multiple DOM nodes
          // (our granularity is too low).
          return (modelChangeKeys.indexOf(binding.name.split('.')[0]) > -1);
        });
      }

      // Add dependents.
      // We make an index of all bindings to help with this.
      var index = indexBindings(bindings, null, true);
      var added = {};

      filteredBindings.forEach(function(binding) {
        if (binding.name === '*' ||
            binding.name === '+') {
          return;
        }
        result.bindings.push(binding);
        if (binding.dependents) {
          binding.dependents.forEach(function(dep) {
            if (!added[dep]) {
              added[dep] = true;
              var depends = index[dep];
              if (depends) {
                result.bindings.push.apply(result.bindings, depends);
              }
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
      Add a binding from a configuration and a viewlet.

      A binding has the following attributes.

       * name: A string that is the binding name.  It references a (possibly
               nested) attribute of the associated viewlet's model.
       * annotations: A hash on which viewlets can scribble whatever they want
                      to.
       * formattedValue: The formatted version of the model value, as of the
                         time the last edit was started.  If an edit of the
                         field is not in progress, this will be up-to-date.
       * values: A hash of the model values currently being used by the
                 binding. Keys are binding.name plus the dependents, if any.
                 Read-only.
       * conflicted: true if the binding is currently conflicted (the input
                     changed and then the model changed).  Otherwise false or
                     undefined.  Read-only.
       * viewlet: (optional) The viewlet that is matched with this binding.
       * target: (optional) Associated DOM node.  If this exists, then it is
                 unique: no other binding in this engine shares it.
       * field: (optional) Associated NodeHandler, typically used to connect
                           values with nodes.
       * dependents: (optional) Array of binding names that should be updated
                     when this one is.

      Note that there is no completely unique key for a binding.  As described
      above, if a binding has a target, that should be unique.  If it does not,
      the combination of the name and the viewlet should be unique.  The
      uniqueness guarantees here are not high at the moment.

      A binding has the following methods.

       * get(model): Get the value of the associated attribute for this
                     binding from the model.
       * format(value): (optional) Format the value before passing it to the
                        binding.field.set method (or binding.update, below).
       * update(node, value): (optional) If this is included, it is used
                              instead of the binding.field.set method to set
                              the value on the node.
       * resolve(value): This method is only present if the binding is
                         "conflicted" (see attribute above).  It resolves
                         the conflict in favor of the given value.  Viewlets
                         may attach a "cleanup" attribute to the method and
                         it will be called initially to let the viewlet clean
                         up any conflict UX.  The viewlet's "changed" method
                         will later receive the selected value, after the
                         binding engine sets the selected value on the bound
                         node.

      @method addBinding
      @param {Object} config A bindings Object, see description in `bind`.
      @param {Object} viewlet A reference to the viewlet being bound.
      @return {Object} binding.
     */
    BindingEngine.prototype.addBinding = function(config, viewlet) {
      var defaultBinding = {};
      defaultBinding.get = function(model) {
        return model.get(this.name);
      };
      var binding = Y.mix(defaultBinding, config);
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
      if (binding.annotations === undefined) {
        binding.annotations = {};
      }
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
      trying to use YUI to select a dotted path name, make sure to quote the
      entire path. For example Y.one('[data-bind="a.b.c"]').

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
      this._setupHeirarchicalBindings();
      this._setupDependencies();
      // Initialize viewlets with starting values.
      this._modelChangeHandler();
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
      modelEventHandles.push(
          model.on('change', this._modelChangeHandler, this));

      // Bind and listen for model changes.
      var viewletContainer = viewlet.container || viewlet.get('container');
      viewletContainer.all('[data-bind]').each(function(node) {
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

      this._setupWildcarding(viewlet);
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
              index[dep] = source;
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
      // Make sure we don't try to update the DOM after everything has been
      // unbound.
      this._updateTimeout.cancel();
      // Unbind each model
      Y.each(this._models, function(handles) {
        handles.forEach(function(handle) {
          if (handle.detach) {
            handle.detach();
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
        if (handle.model) {
          // We don't just need to detach the events we also need to remove them
          // from the bindings list entirely. This loops through each property
          // on the POJO model and then loops through the current bindings to
          // find the bindings associated with the model and key then splices
          // it from the array.
          Object.keys(handle.model).forEach(function(key) {
            this._bindings.forEach(function(binding, index) {
              // Some keys have .'s to allow for nested bindings. This makes
              // sure we remove all of the bindings associated with the top
              // level key.
              if (binding.name.split('.')[0] === key) {
                if (binding.viewlet.model.id === mID) {
                  this._bindings.splice(index, 1);
                }
              }
            }, this);
          }, this);
        }
        if (handle.detach) {
          handle.detach();
        }
      }, this);
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
      var delta, viewlets;
      if (name && name in this._viewlets) {
        var viewlet = this._viewlets[name];
        delta = deltaForViewlet.call(this, viewlet);
        viewlets = [viewlet];
      } else {
        delta = deltaFromChange.call(this);
        viewlets = Y.Object.values(this._viewlets);
      }
      this._updateDOM(delta, true);
      viewlets.forEach(function(viewlet) {
        viewlet.syncedFields();
      });
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
      // views don't necessarily have the _eventHandles property.
      if (events) {
        events.forEach(function(handle) {
          handle.detach();
        });
        events.splice(0, events.length);
      }
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
      Find the binding for the given node.

      @method _getBindingForNode
      @param {Y.Node} node The binding's target node.
      @return {Binding} Binding reference.
    */
    BindingEngine.prototype._getBindingForNode = function(node) {
      var binding;
      if ( // Find the binding for the node, and break when found.
          !this._bindings.some(function(b) {
            if (b.target === node) {
              binding = b;
              return true;
            }})) {
        // We don't expect this to ever happen.  We should only be asking for
        // a key that has been bound.  If this does fail, let's be loud about
        // it ASAP so that we can fix it.
        throw 'Programmer error: no binding found for node';
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
      // This assumes that each viewlet will only have one binding with an
      // input node per model attribute.  If that's ever not the case, this
      // will have problems.
      var key = node.getData('bind');
      var nodeHandler = this.getNodeHandler(node.getDOMNode());
      var binding = this._getBindingForNode(node);
      if (nodeHandler.eq(node, binding.formattedValue)) {
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
      var keys, delta, unappliedChanges = [];
      var initialize = !evt; // If there is no event, this is an initialization.

      // If this is an initialization then we want to force all
      // changes not just the unapplied changes.
      if (!initialize) {
        keys = evt && Y.Object.keys(evt.changed);
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
        unappliedChanges = this._unappliedChanges;
      }

      delta = deltaFromChange.call(this, unappliedChanges);

      if (this._updateTimeout) {
        this._updateTimeout.cancel();
        this._updateTimeout = null;
      }

      if (this.interval && !initialize) {
        this._updateTimeout = Y.later(
            this.interval,
            this,
            this._updateDOM,
            [delta]);
      } else {
        this._updateDOM(delta, initialize);
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
      @param {Boolean} initialize If true, then _updateDOM should clear and
          set all fields, not just those that have changed values.  This
          is useful for initializing and resetting.
     */
    BindingEngine.prototype._updateDOM = function(delta, initialize) {
      // _updateDOM is called in three situations.  First, it is called to
      // initialize the viewlets with bound values.  If initialize is true,
      // that might be the case, or the second scenario might be in play: the
      // user requested that some or all of the viewets be reset (see
      // resetDOMToModel).  This is just a re-initialization.  The third
      // possibility is that one of our models has changed, and we need to
      // tell the viewlet what to do.
      //
      // For the first two options, we just want to show the model's values,
      // and make old conflicts disappear.
      //
      // For the third option, we have an additional wrinkle: we have to
      // identify conflicts and handle them.
      //
      // This is all done per-binding in the forEach loop below.
      var bindingEngine = this;

      // updateDOM applies all the changes clearing the buffer.
      this._unappliedChanges = [];

      if (delta.bindings.length === 0 &&
          !Object.keys(delta.wildcards).length) {
        return;
      }

      // We'll use this to calculate dependent bindings.
      var index = indexBindings(this._bindings);

      // Iterate bindings and updating each element as needed.
      delta.bindings.forEach(function(binding) {
        // With the introduction of dependencies in the binding
        // layer, its possible to depend on a dependent value
        // but not on its trigger (which in turn might have no
        // binding target in the DOM)
        if (!binding.target) {
          return;
        }
        // We have to double check that the new value is actually different
        // than the previousValue, because of indirect bindings.  For instance,
        // some of our bindings are triggered from parent objects, so all
        // children of the parent will be included in this delta, and
        // conflicts will be reported incorrectly.
        //
        // In some cases, both the value and the previousValue will be
        // undefined.  If this is an initial update (initialize) then
        // we still need to update the DOM, even though the values are the
        // same.
        //
        // We have to compare dependencies too.
        var viewlet = binding.viewlet;
        var model = viewlet.model;
        if (!binding.values) {
          binding.values = {};
        }
        var previousValue = binding.values[binding.name];
        var value = binding.values[binding.name] = binding.get(model);
        var dependenciesDiffer = false;
        if (binding.depends) {
          binding.depends.forEach(function(depName) {
            var previous = binding.values[depName];
            var current = index[depName].get(model);
            dependenciesDiffer = dependenciesDiffer || (previous !== current);
            binding.values[depName] = current;
          });
        }
        if (value === previousValue && !dependenciesDiffer && !initialize) {
          // We have nothing to do.
          return;
        }
        // We have reached this part of the code because we are supposed to
        // initialize, reinitialize, or handle a change to the model. Now it
        // is time to figure out what to do.  These are the basic options.

        // 1. The field has never been edited, or we are supposed to
        // initialize or reinitialize.  In these cases, if there are any
        // conflicts, resolve them (this should only be the reinitialization
        // case), and then set the value to the current formattedValue.

        // 2. The field has been edited, and the model's value has changed
        // from what it was.  If there was a previous conflict, resolve it.
        // Either way, we make a conflict reflecting the change.

        // First, we can resolve any pre-existing conflicts, because both paths
        // do that.  We prefer the user's value, because the conflict path
        // wants to keep it and the set/initialize path will overwrite it.
        var node = binding.target;
        var nodeValue = binding.field.get(node);
        if (binding.conflicted) {
          binding.resolve(nodeValue, true);
        }

        // Now get and normalize some state that we will need...
        var formattedValue = value;
        if (binding.format) {
          formattedValue = binding.format.call(binding, value);
        }
        var edited = viewlet.changedValues[binding.name];
        var changed = false;
        if (initialize && edited) {
          edited = false;
          changed = true;
          delete viewlet.changedValues[binding.name];
        }
        // ...and our paths diverge: pristine (not edited) or edited.
        if (!edited) {
          // The user has not edited the field and we should set the value.
          binding.formattedValue = formattedValue;
          optionalCallback(binding,
                           'beforeUpdate', node, binding.formattedValue);
          optionalCallbacks(delta.wildcards['+'],
                            'beforeUpdate', node, binding.formattedValue);

          // If an apply callback was provided use it to update
          // the DOM otherwise used the field type default.
          if (binding.update) {
            binding.update.call(binding, node, binding.formattedValue);
          } else {
            binding.field.set(node, binding.formattedValue);
          }
          if (changed) {
            bindingEngine._nodeChanged(node, viewlet);
          }
          optionalCallbacks(delta.wildcards['+'],
                            'update', node, binding.formattedValue);
          optionalCallback(binding,
                           'afterUpdate', node, binding.formattedValue);
          optionalCallbacks(delta.wildcards['+'],
                            'afterUpdate', node, binding.formattedValue);
        } else {
          // The user has edited the field, and the value has changed.  This
          // is a conflict of one sort or another--that is, it is conceivable
          // that the value has changed to what the user selected, but we will
          // still ask the viewlet to resolve the issue, one way or another.
          binding.conflicted = true;
          viewlet.unsyncedFields();
          // This closure lets viewlets attach a cleanup function to it.
          // This is a hook point that lets viewlets define what should
          // happen when either participant (user or engine) resolves the
          // conflict.
          binding.resolve = function(selectedValue, cleanupOnly) {
            if (binding.resolve.cleanup) {
              binding.resolve.cleanup();
            }
            if (!cleanupOnly) {
              binding.formattedValue = formattedValue;
              bindingEngine._resolve(
                  node, binding.viewlet.name, selectedValue);
            }
            delete binding.resolve;
            delete binding.conflicted;
          };
          binding.viewlet.conflict(
              node, nodeValue, formattedValue, binding.resolve,
              binding);
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
      Called internally after the user has chosen to resolve a conflict.

      @method _resolve
      @param {Y.Node} node that the model is bound to.
      @param {String} viewletName of the viewlet.
      @param {Any} value that the user has accepted to resolve with.
    */
    BindingEngine.prototype._resolve = function(
        node, viewletName, selectedValue) {
      var nodeHandler = this.getNodeHandler(node.getDOMNode());
      // The selectedValue should already be formatted.
      if (!nodeHandler.eq(node, selectedValue)) {
        nodeHandler.set(node, selectedValue);
      }
      // Case 1:
      // The user chose the node value. It is still modified, so let the
      // viewlet have a chance to reflect this again, using _nodeChanged.
      // Case 2:
      // The user chose the model value, or some other value.  Let
      // _nodeChanged have a chance to update changedValues and possibly call
      // syncedFields.
      var viewlet = this._viewlets[viewletName];
      this._nodeChanged(node, viewlet);
    };

    return BindingEngine;
  })();

}, '0.1.0', {
  requires: ['juju-view-utils',
             'juju-models',
             'yui-later',
             'node',
             'event-valuechange']
});
