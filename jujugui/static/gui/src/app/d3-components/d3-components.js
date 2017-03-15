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
 * Provides a declarative structure around interactive D3
 * applications.
 *
 * @module d3-components
 **/

YUI.add('d3-components', function(Y) {
  var d3 = Y.namespace('d3'),
      ns = Y.namespace('d3-components'),
      utils = Y.namespace('juju.views.utils');

  var Module = Y.Base.create('Module', Y.Base, [], {
    _defaultEvents: {
      scene: {},
      d3: {},
      yui: {}
    },

    /**
     * Declarative events include
     *    scene
     *    d3
     *    yui
     *
     * See Component below for a description of these elements.
     *
     * @property events
     * @type {object}
     **/
    events: {},

    initializer: function() {
      this.events = Y.mix(this.events, this._defaultEvents,
                          false, undefined, 0, true);

    },

    componentBound: function() {},
    render: function() {},
    update: function() {}
  }, {
    ATTRS: {
      component: {},
      options: {},
      container: {
        getter: function() {
          var component = this.get('component');
          return component && component.get('container') || undefined;
        }
      }
    }});
  ns.Module = Module;


  var Component = Y.Base.create('Component', Y.Base, [], {
    /**
     * Component collects modules implementing various portions of an
     * applications functionality in a declarative way. It is designed to allow
     * both a cleaner separation of concerns and the ability to reuse the
     * component in different ways.
     *
     * Component accomplishes these goals by:
     *    - Control how events are bound and unbound.
     *    - Providing patterns for update data cleanly.
     *    - Providing suggestions around updating the interactive portions
     *      of the application.
     *
     * @class Component
     * @constructor
     **/
    initializer: function() {
      this.modules = {};
      this.events = {};
      // Used to track the renderOnce invocation.
      this._rendered = false;
    },

    /**
     * Add a Module to this Component. This will bind its events and set up all
     * needed event subscriptions.  Modules can return three sets of events
     * that will be bound in different ways
     *
     *   - scene: {selector: event-type: handlerName} -> YUI styled event
     *            delegation
     *   - d3 {selector: event-type: handlerName} -> Bound using
     *          specialized d3 event handling
     *   - yui {event-type: handlerName} -> collection of global and custom
     *          events the module reacts to.
     *
     * @method addModule
     * @chainable
     * @param {Module} ModClassOrInstance bound will be to this.
     * @param {Object} options dict of options set as options attribute on
     * module.
     **/

    addModule: function(ModClassOrInstance, options) {
      var config = options || {},
          module = ModClassOrInstance,
          modEvents;

      if (ModClassOrInstance === undefined) {
        throw 'undefined Module in addModule call';
      }
      if (!(ModClassOrInstance instanceof Module)) {
        module = new ModClassOrInstance();
      }
      config.component = this;
      module.setAttrs(config);

      this.modules[module.name] = module;

      modEvents = Y.merge(module.events);
      this.events[module.name] = modEvents;

      this.bind(module.name);
      module.componentBound();

      // Add Module as an event target of Component
      this.addTarget(module);
      return this;
    },

    /**
     * Remove a module and unbind its handlers.
     *
     * @method removeModule
     * @param {String} moduleName Module name to remove.
     * @chainable
     **/
    removeModule: function(moduleName) {
      this.unbind(moduleName);
      delete this.events[moduleName];
      this.removeTarget(this.modules[moduleName]);
      delete this.modules[moduleName];
      return this;
    },

    // Return a resolved handler object in the form
    // {phase: str, callback: function}
    _normalizeHandler: function(handler, module, selector) {
      var result = {};

      if (typeof(handler) === 'string') {
        result.callback = module[handler];
        result.phase = 'on';
      }

      if (utils.isObject(handler)) {
        result.phase = handler.phase || 'on';
        result.callback = handler.callback;
      }

      if (typeof(result.callback) === 'string') {
        result.callback = module[result.callback];
      }

      if (!result.callback) {
        //console.error('No Event handler for', selector, module.name);
        return;
      }
      if (typeof(result.callback) !== 'function') {
        console.error('Unable to resolve a proper callback for',
                      selector, handler, module.name, result);
        return;
      }
      // Set up binding context for callback.
      result.context = module;
      if (handler.context) {
        if (handler.context === 'component') {
          result.context = this;
        } else if (handler.context === 'window') {
          result.context = Y.one('window');
        }
      }
      return result;
    },

    /**
     * Internal implementation of binding both Module.events.scene and
     * Module.events.yui.
     **/
    _bindEvents: function(modName) {
      var self = this,
          modEvents = this.events[modName],
          module = this.modules[modName],
          container = this.get('container'),
          subscriptions = [];

      function _bindEvent(name, handler, container, selector, context) {
        // Adapt between d3 events and YUI delegates.
        var d3Adapter = function(evt) {
          var selection = d3.select(evt.currentTarget.getDOMNode()),
              d = selection.data()[0];
          // This is a minor violation (extension)
          // of the interface, but suits us well.
          d3.event = evt;
          //console.debug('Handler for', name, selector, d3.event);
          return handler.call(
              evt.currentTarget.getDOMNode(), d, context);
        };

        subscriptions.push(
            Y.delegate(name, d3Adapter, container, selector, context));
      }

      this.unbind(modName);

      // Bind 'scene' events
      Object.keys(modEvents.scene).forEach(selector => {
        const handlers = modEvents.scene[selector];
        Object.keys(handlers).forEach(trigger => {
          const handler = self._normalizeHandler(
            handlers[trigger], module, selector);
          if (utils.isValue(handler)) {
            _bindEvent(trigger, handler.callback,
                       container, selector, handler.context);
          }
        });
      });

      // Bind 'yui' custom/global subscriptions
      // yui: {str: str_or_function}
      // TODO {str: str/func/obj}
      //       where object includes phase (before, on, after)
      if (modEvents.yui) {
        // Resolve any 'string' handlers to methods on module.
        ['after', 'before', 'on'].forEach(eventPhase => {
          var resolvedHandler = {};
          Object.keys(modEvents.yui).forEach(name => {
            const handler = self._normalizeHandler(
              modEvents.yui[name], module, name);
            if (!handler || handler.phase !== eventPhase) {
              return;
            }
            resolvedHandler[name] = handler;
          }, this);
          // Bind resolved event handlers as a group.
          if (Object.keys(resolvedHandler).length) {
            Object.keys(resolvedHandler).forEach(name => {
              const handler = resolvedHandler[name];
              // DOM and synthetic events are subscribed using Y.on with
              // this signature: Y.on(event, callback, target, context).
              // For this reason, it is not possible here to just pass the
              // context as third argument.
              var target = self,
                  callback = Y.bind(handler.callback, handler.context);
              if (['windowresize'].indexOf(name) !== -1) {
                target = Y;
                handler.context = null;
              } else {
                // (re)Register the event to bubble.
                self.publish(name, {emitFacade: true});
              }
              subscriptions.push(
                  target[eventPhase](
                  name, callback, handler.context));
            });
          }
        });
      }
      return subscriptions;
    },

    /**
     * Internal. Called automatically by addModule.
     *
     * @method bind
     **/
    bind: function(moduleName) {
      if (this.get('interactive') === false) { return; }
      var eventSet = this.events,
          filtered = {};

      if (moduleName) {
        filtered[moduleName] = eventSet[moduleName];
        eventSet = filtered;
      }

      Object.keys(eventSet).forEach(name => {
        this.events[name].subscriptions = this._bindEvents(name);
      }, this);
      return this;
    },

    /**
     * Specialized handling of events only found in d3.
     * This is again an internal implementation detail.
     *
     * It is worth noting that d3 events don't use a delegate pattern
     * and thus must be bound to nodes present in a selection.
     * For this reason binding d3 events happens after render cycles.
     *
     * @method _bindD3Events
     * @param {String} modName Module name.
     **/
    _bindD3Events: function(modName) {
      // Walk each selector for a given module 'name', doing a
      // d3 selection and an 'on' binding.
      var self = this,
          modEvents = this.events[modName],
          module;

      if (this.get('interactive') === false) { return; }
      if (!modEvents || !modEvents.d3) {
        return;
      }
      modEvents = modEvents.d3;
      module = this.modules[modName];
      Object.keys(modEvents).forEach(selector => {
        const handlers = modEvents[selector];
        Object.keys(handlers).forEach(trigger => {
          var adapter;
          const handler = self._normalizeHandler(handlers[trigger], module);
          // Create an adapter
          adapter = function() {
            var selection = d3.select(this),
                d = selection.data()[0];
            //console.debug('D3 Handler for', selector, trigger);
            return handler.callback.call(this, d, handler.context);
          };
          d3.selectAll(selector).on(trigger, adapter);
        });
      });
    },

    /**
     * Allow d3 event rebinding after rendering. The component
     * can trigger this after it is sure relevant elements
     * are in the bound DOM.
     *
     **/
    bindAllD3Events: function() {
      var self = this;
      Object.keys(this.modules).forEach(name => {
        self._bindD3Events(name);
      });
    },

    /**
     * Register a manual event subscription on
     * behalf of a module.
     *
     * @method recordSubscription
     * @param {Module} module to record relative to.
     * @param {Object} YUI event subscription.
     * @chainable
     **/
    recordSubscription: function(module, subscription) {
      if (typeof module === 'string') {
        module = this.modules[module];
      }
      if (!(module.name in this.events)) {
        throw 'Unable able to recordSubscription, module not added.';
      }
      if (!subscription) {
        throw 'Invalid/undefined subscription object cannot be recorded.';
      }
      this.events[module.name].subscriptions.push(subscription);
    },

    /**
      Internal Detail. Called by unbind automatically.
     * D3 events follow a 'slot' like system. Setting the
     * event to null unbinds existing handlers.
     *
     * @method _unbindD3Events
     *
     **/
    _unbindD3Events: function(modName) {
      var modEvents = this.events[modName];

      if (!modEvents || !modEvents.d3) {
        return;
      }
      modEvents = modEvents.d3;

      Object.keys(modEvents).forEach(selector => {
        Object.keys(modEvents[selector]).forEach(trigger => {
          d3.selectAll(selector).on(trigger, null);
        });
      });
    },

    /**
    * Internal. Called automatically by removeModule.
     * @method unbind
     **/
    unbind: function(moduleName) {
      var eventSet = this.events,
          filtered = {};

      function _unbind(modEvents) {
        Object.keys(modEvents.subscriptions || {}).forEach(key => {
          const handler = modEvents.subscriptions[key];
          if (handler) {
            handler.detach();
          }
        });
        delete modEvents.subscriptions;
      }

      if (moduleName) {
        filtered[moduleName] = eventSet[moduleName];
        eventSet = filtered;
      }
      Object.keys(eventSet).forEach(key => {
        _unbind(eventSet[key]);
      });
      // Remove any d3 subscriptions as well.
      this._unbindD3Events();

      return this;
    },
    /**
     * @method renderOnce
     *
     * Called the first time render is invoked. See {render}.
     **/
    renderOnce: function() {
      this.all('renderOnce');
    },
    /**
     * Render each module bound to the canvas. The first call to
     * render() will automatically call renderOnce (a noop by default)
     * and update(). If update requires some render state to operate on
     *
     * @method render
     * @chainable
     * renderOnce is the place to include that setup code.
     */
    render: function() {
      var self = this;
      function renderAndBind(module, name) {
        if (module && module.render) {
          module.render();
        }
        self._bindD3Events(name);
      }

      // If the container isn't bound to the DOM
      // do so now.
      this.attachContainer();
      if (!this._rendered) {
        this.renderOnce();
        this.update();
        this._rendered = true;
      }
      // Render modules.
      Object.keys(this.modules).forEach(key => {
        renderAndBind(this.modules[key], key);
      });
      return this;
    },

    /**
     * Called by render, conditionally attach container to the DOM if
     * it isn't already. The framework calls this before module
     * rendering so that d3 Events will have attached DOM elements. If
     * your application doesn't need this behavior feel free to override.
     *
     * @method attachContainer
     * @chainable
     **/
    attachContainer: function() {
      var container = this.get('container');
      if (container && !container.inDoc()) {
        Y.one('body').append(container);
      }
      return this;
    },

    /**
     * Remove container from DOM returning container. This
     * is explicitly not chainable.
     *
     * @method detachContainer
     **/
    detachContainer: function() {
      var container = this.get('container');
      if (container.inDoc()) {
        container.remove();
      }
      return container;
    },

    /**
     * Update the data for each module
     * see also the dataBinding event hookup
     *
     * @method update
     * @chainable
     */
    update: function() {
      this.all('update');
      return this;
    },

    all: function(methodName) {
      Object.keys(this.modules).forEach(name => {
        const mod = this.modules[name];
        if (methodName in mod) {
          mod[methodName]();
        }
      });
    }
  }, {
    ATTRS: {
      container: {},
      /**
       Boolean indicating if bind should be allowed to actually
       bind events for the component.

       @property {Boolean} interactive
       @default true
       */
      interactive: {value: true}
    }

  });
  ns.Component = Component;
}, '0.1', {
  'requires': ['d3',
    'base',
    'array-extras',
    'event',
    'event-resize',
    'juju-view-utils'
]});
