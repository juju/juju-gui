'use strict';

/**
 * Provides a declarative structure around interactive D3
 * applications.
 *
 * @module d3-components
 **/

YUI.add('d3-components', function(Y) {
  var ns = Y.namespace('d3'),
      L = Y.Lang;

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
    },

    /**
     * @method addModule
     * @chainable
     * @param {Module} a Module class. Will be created and bound to Component internally.
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
      module = new module();
      module.setAttrs({component: this,
                      options: options});

      this.modules[module.NAME] = module;

      var modEvents = module.events;
      this.events[module.NAME] = Y.mix(modEvents);
      this.bind(module.NAME);
    },

    removeModule: function(moduleName) {
      this.unbind(moduleName);
      delete this.events[moduleName];
      delete this.modules[moduleName];
    },

    /**
     * @method bind
     *
     * Internal. Called automatically by addModule.
     **/
    bind: function(moduleName) {
      var eventSet = this.events;
      if (!arguments.length) {
        eventSet = Y.filter(this.events, function(v, k) {return k === name;});
      }

      Y.each(Y.Object.keys(eventSet), function _bind(name) {
        this.events[name].subscriptions = this._bindEvents(name);
      }, this);
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
      name,
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

      this.unbind(name);

      // Bind 'scene' events
      if (modEvents.scene) {
        for (selector in modEvents.scene) {
          if (owns(modEvents.scene, selector)) {
            handlers = modEvents.scene[selector];
            for (name in handlers) {
              if (owns(handlers, name)) {
                handler = handlers[name];
                if (typeof handler === 'string') {
                  handler = module[handler];
                }
                if (!handler) {
                  console.error('No Event handler for', selector, name);
                  continue;
                }
                _bindEvent(name, handler, this.get('container'), selector, this);
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
        Y.each(modEvents.yui, function(v, k) {
          if (typeof v === 'string') {
            v = module[v];
          }
          if (!handler) {
            console.error('No Event handler for', selector, k);
            return;
          }
          resolvedHandler[k] = v;
        }, this);
        // Bind resolved event handlers as a group.
        subscriptions.push(Y.on(resolvedHandler));
      }
      return subscriptions;

    },

    /**
     * @method unbind
     * Internal. Called automatically by removeModule.
     **/
    unbind: function(moduleName) {
      var eventSet = this.events;
      function _unbind(modEvents) {
        Y.each(modEvents.subscriptions, function(handler) {
          handler && handler.detach();
        })
        delete modEvents.handlers;
      }

      if (!arguments.length) {
        eventSet = Y.filter(eventSet, function(v, k) {return k === name;});
      }
      Y.each(Y.Object.values(eventSet), _unbind, this);
      return this;
    },

    ATTRS: {
      container: {}
    }

  });
  ns.Component = Component;

  var Module = Y.Base.create('Module', Y.Base, [], {
    events: {
      scene: {},
      d3: {},
      yui: {}
    },

    ATTRS: {
      component: {},
      options: {default: {}},
      container: {get: function() {
        return this.get('component').get('container');}}
    }
  });
  ns.Module = Module;

},'0.1', {
  'requires': ['d3',
              'base-build',
              'event']});
