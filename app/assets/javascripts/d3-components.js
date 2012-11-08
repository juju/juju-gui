'use strict';

/**
 * Provides a declarative structure around interactive D3
 * applications.
 *
 * @module d3-components
 **/

YUI.add('d3-components', function(Y) {
  var ns = Y.namespace('d3'),
      L = Y.Lang,
      Module = Y.Base.create('Module', Y.Base, [], {
        /**
         * @property events
         * @type {object}
         **/
        events: {
          scene: {},
          d3: {},
          yui: {}
        },

        initializer: function(options) {
          options = options || {};
          this.events = options.events ?
              Y.merge(this.events, options.events) :
              this.events;
        }
      }, {
        ATTRS: {
          component: {},
          container: {getter: function() {
            return this.get('component').get('container');}}
        }
      });
  ns.Module = Module;


  var Component = Y.Base.create('Component', Y.Base, [], {
    /**
     * @class Component
     *
     * Component collections modules implementing various portions
     * of an applications functionality in a declarative way. It
     * is designed to allow both a cleaner separation of concerns
     * and the ability to reuse the component in different ways.
     *
     * Component accomplishes these goals by:
     *    - Control how events are bound and unbound.
     *    - Providing patterns for update data cleanly.
     *    - Providing suggestions around updating the interactive portions
     *      of the application.
     *
     * @constructor
     **/
    initializer: function() {
      this.modules = {};
      this.events = {};

      // If container is changed, rebind events.
      // this.after('containerChange', this.bind());
    },

    /**
     * @method addModule
     * @chainable
     * @param {Module} a Module class. Will be created and bound to Component
     * internally.
     *
     * Add a Module to this Component. This will bind its events and set up all
     * needed event subscriptions.
     * Modules can return three sets of events that will be bound in
     * different ways
     *
     *   - scene: {selector: event-type: handlerName} -> YUI styled event
     *            delegation
     *   - d3 {selector: event-type: handlerName} -> Bound using
     *          specialized d3 event handling
     *   - yui {event-type: handlerName} -> collection of global and custom
     *          events the module reacts to.
     **/

    addModule: function(module, options) {
      options = options || {};
      if (!(module instanceof Module)) {
        module = new module();
      }
      module.setAttrs({component: this,
        options: options});

                      this.modules[module.name] = module;

                      var modEvents = module.events;
                      this.events[module.name] = Y.clone(modEvents);
                      this.bind(module.name);
                      return this;
    },

    /**
     * @method removeModule
     * @param {String} moduleName Module name to remove.
     * @chainable
     **/
    removeModule: function(moduleName) {
      this.unbind(moduleName);
      delete this.events[moduleName];
      delete this.modules[moduleName];
      return this;
    },

    /**
     * Internal implementation of
     * binding both
     * Module.events.scene and
     * Module.events.yui.
     **/
    _bindEvents: function(name) {
      var self = this,
          modEvents = this.events[name],
          module = this.modules[name],
          owns = Y.Object.owns,
          selector,
          phase = 'on',
          subscriptions = [],
          handlers,
          handler;

      function _bindEvent(name, handler, container, selector, context) {
        // Adapt between d3 events and YUI delegates.
        var d3Adaptor = function(evt) {
          var selection = d3.select(evt.currentTarget.getDOMNode()),
              d = selection.data()[0];
          // This is a minor violation (extension)
          // of the interface, but suits us well.
          d3.event = evt;
          return handler.call(
              evt.currentTarget.getDOMNode(), d, context);
        };

        subscriptions.push(
            Y.delegate(name, d3Adaptor, container, selector, context));
      }

      function _normalizeHandler(handler, module) {
        if (typeof handler === 'object') {
          phase = handler.phase || 'on';
          handler = handler.callback;
        }
        if (typeof handler === 'string') {
          handler = module[handler];
        }
        if (!handler) {
          console.error('No Event handler for', selector, name);
          return;
        }
        if (!L.isFunction(handler)) {
          console.error('Unable to resolve a proper callback for',
                        selector, name);
          return;
        }
        return handler;
      }

      this.unbind(name);

      // Bind 'scene' events
      if (modEvents.scene) {
        for (selector in modEvents.scene) {
          if (owns(modEvents.scene, selector)) {
            handlers = modEvents.scene[selector];
            for (name in handlers) {
              if (owns(handlers, name)) {
                handler = _normalizeHandler(handlers[name], module);
                if (!handler) {
                  continue;
                }
                _bindEvent(name, handler,
                           this.get('container'), selector, this);
              }
            }
          }
        }
      }

      // Bind 'yui' custom/global subscriptions
      // yui: {str: str_or_function}
      // TODO {str: str/func/obj}
      //       where object includes phase (before, on, after)
      if (modEvents.yui) {
        var resolvedHandler = {};

        // Resolve any 'string' handlers to methods on module.
        Y.each(modEvents.yui, function(handler, name) {
          handler = _normalizeHandler(handler, module);
          if (!handler) {
            return;
          }
          resolvedHandler[name] = handler;
        }, this);
        // Bind resolved event handlers as a group.
        subscriptions.push(Y.on(resolvedHandler));
      }
      return subscriptions;
    },

    /**
     * @method bind
     *
     * Internal. Called automatically by addModule.
     **/
    bind: function(moduleName) {
      var eventSet = this.events;
      if (moduleName) {
        var filtered = {};
        filtered[moduleName] = eventSet[moduleName];
        eventSet = filtered;
      }

      Y.each(Y.Object.keys(eventSet), function _bind(name) {
        this.events[name].subscriptions = this._bindEvents(name);
      }, this);
      return this;
    },

    /**
     * Specialized handling of events only found in d3.
     * This is again an internal implementation detail.
     *
     * Its worth noting that d3 events don't use a delegate pattern
     * and thus must be bound to nodes present in a selection.
     * For this reason binding d3 events happens after render cycles.
     *
     * @method _bindD3Events
     * @param {String} modName Module name.
     **/
    _bindD3Events: function(modName) {
      // Walk each selector for a given module 'name', doing a
      // d3 selection and an 'on' binding.
      var modEvents = this.events[modName];

      if (!modEvents || modEvents.d3 === undefined) {
        return;
      }

      modEvents = modEvents.d3;
      var module = this.modules[modName],
          owns = Y.Object.owns;

      var selector, kind, handler,
          handlers, name;

      for (selector in modEvents) {
        if (owns(modEvents, selector)) {
          handlers = modEvents[selector];
          for (name in handlers) {
            if (owns(handlers, name)) {
              handler = handlers[name];
              if (typeof handler === 'string') {
                handler = module[handler];
              }
              d3.selectAll(selector).on(name, handler);
            }
          }
        }
      }
    },

    /**
     * @method _unbindD3Events
     *
     * Internal Detail. Called by unbind automatically.
     * D3 events follow a 'slot' like system. Setting the
     * event to null unbinds existing handlers.
     **/
    _unbindD3Events: function(modName) {
      var modEvents = this.events[modName];

      if (!modEvents || !modEvents.d3) {
        return;
      }
      modEvents = modEvents.d3;
      var module = this.modules[modName],
          owns = Y.Object.owns;

      var selector, kind, handler,
          handlers, name;

      for (selector in modEvents) {
        if (owns(modEvents, selector)) {
          handlers = modEvents[selector];
          for (name in handlers) {
            if (owns(handlers, name)) {
              d3.selectAll(selector).on(name, null);
            }
          }
        }
      }
    },

    /**
     * @method unbind
     * Internal. Called automatically by removeModule.
     **/
    unbind: function(moduleName) {
      var eventSet = this.events;
      function _unbind(modEvents) {
        Y.each(modEvents.subscriptions, function(handler) {
          if (handler) {
            handler.detach();
          }
        });
        delete modEvents.subscriptions;
      }

      if (moduleName) {
        var filtered = {};
        filtered[moduleName] = eventSet[moduleName];
        eventSet = filtered;
      }
      Y.each(Y.Object.values(eventSet), _unbind, this);
      // Remove any d3 subscriptions as well.
      this._unbindD3Events();

      return this;
    },

    /**
     * @method render
     * @chainable
     *
     * Render each module bound to the canvas
     */
    render: function() {
      function renderAndBind(module, name) {
        if (module && module.render) {
          module.render();
        }
        this._bindD3Events(name);
      }

      // If the container isn't bound to the DOM
      // do so now.
      this.attachContainer();
      // Render modules.
      Y.each(this.modules, renderAndBind, this);
      return this;
    },

    /**
     * @method attachContainer
     * @chainable
     *
     * Called by render, conditionally attach container to the DOM if
     * it isn't already. The framework calls this before module
     * rendering so that d3 Events will have attached DOM elements. If
     * your application doesn't need this behavior feel free to override.
     **/
    attachContainer: function() {
      var container = this.get('container');
      if (container && !container.inDoc()) {
        Y.one('body').append(container);
      }
      return this;
    },

    /**
     * @method detachContainer
     *
     * Remove container from DOM returning container. This
     * is explicitly not chainable.
     **/
    detachContainer: function() {
      var container = this.get('container');
      if (container.inDoc()) {
        container.remove();
      }
      return container;
    },

    /**
     *
     * @method update
     * @chainable
     *
     * Update the data for each module
     * see also the dataBinding event hookup
     */
    update: function() {
      Y.each(Y.Object.values(this.modules), function(mod) {
        mod.update();
      });
      return this;
    }
  }, {
    ATTRS: {
      container: {}
    }

  });
  ns.Component = Component;
}, '0.1', {
  'requires': ['d3',
    'base',
    'array-extras',
    'event']});
