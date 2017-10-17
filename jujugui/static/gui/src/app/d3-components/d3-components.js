/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const d3 = require('d3');

const viewUtils = require('../views/utils');

class Component {
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
   **/
  constructor(options={}) {
    this.container = options.container;
    this.modules = {};
    this.events = {};
    // Used to track the renderOnce invocation.
    this._rendered = false;
  }

  /**
   * Add a Module to this Component. This will bind its events and set up all
   * needed event subscriptions.  Modules can return three sets of events
   * that will be bound in different ways
   *
   *   - scene: {selector: event-type: handlerName} -> YUI styled event
   *            delegation
   *   - d3 {selector: event-type: handlerName} -> Bound using
   *          specialized d3 event handling
   *   - topo {event-type: handlerName} -> collection of global and custom
   *          events the module reacts to.
   *
   * @method addModule
   * @chainable
   * @param {Module} ModClassOrInstance bound will be to this.
   * @param {Object} options dict of options set as options attribute on
   * module.
   **/

  addModule(ModClassOrInstance, options) {
    if (ModClassOrInstance === undefined) {
      throw 'undefined Module in addModule call';
    }
    let module = new ModClassOrInstance(options);
    module.topo = this;

    this.modules[module.name] = module;

    // The events object may contain functions so can't JSON.stringify here.
    this.events[module.name] = Object.assign({}, module.events);

    this.bind(module.name);
    if (module.componentBound) {
      module.componentBound();
    }
    return this;
  }

  /**
   * Remove a module and unbind its handlers.
   *
   * @method removeModule
   * @param {String} moduleName Module name to remove.
   * @chainable
   **/
  removeModule(moduleName) {
    this.unbind(moduleName);
    delete this.events[moduleName];
    delete this.modules[moduleName];
    return this;
  }

  /**
    Remove and unbind all modules.
  */
  removeModules() {
    Object.keys(this.modules).forEach(module => this.removeModule(module));
  }

  // Return a resolved handler object in the form
  // {phase: str, callback: function}
  _normalizeHandler(handler, module, selector) {
    var result = {};

    if (typeof(handler) === 'string') {
      result.callback = module[handler];
      result.phase = 'on';
    }

    if (viewUtils.isObject(handler)) {
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
        result.context = window;
      }
    }
    return result;
  }

  /**
    Handle delegated events.

    @method _delegate
    @param {String} event The event to attach.
    @param {Function} handler The function to call when the event fires.
    @param {Function} target The class to use for the delegated events.
    @returns {Function} The function called by the listener.
  */
  _delegate(event, handler, target, context) {
    const container = this.container;
    const callable = e => {
      const selector = target.replace('.', '');
      if (e.target.classList.contains(selector) || e.target.closest(target)) {
        handler.call(context, e);
      }
    };
    container.addEventListener(event, callable);
    return callable;
  }

  /**
   * Internal implementation of binding both Module.events.scene and
   * Module.events.topo.
   **/
  _bindEvents(modName) {
    const self = this,
        modEvents = this.events[modName],
        module = this.modules[modName];
    let subscriptions = [];

    const _bindEvent = (name, handler, selector, context) => {
      // Adapt between d3 events and delegates.
      const d3Adapter = evt => {
        const selection = d3.select(evt.target),
            d = selection.data()[0];
        // This is a minor violation (extension)
        // of the interface, but suits us well.
        d3.event = evt;
        return handler.call(evt.target, d, context);
      };
      subscriptions.push({
        event: name,
        callable: this._delegate(name, d3Adapter, selector, context)
      });
    };

    this.unbind(modName);

    // Bind 'scene' events
    if (modEvents.scene) {
      Object.keys(modEvents.scene).forEach(selector => {
        const handlers = modEvents.scene[selector];
        Object.keys(handlers).forEach(trigger => {
          const handler = self._normalizeHandler(
            handlers[trigger], module, selector);
          if (viewUtils.isValue(handler)) {
            _bindEvent(trigger, handler.callback, selector, handler.context);
          }
        });
      });
    }
    if (modEvents.topo) {
      subscriptions = subscriptions.concat(
        this._attachEvents(module, modEvents.topo, 'topo'));
    }
    if (modEvents.window) {
      subscriptions = subscriptions.concat(
        this._attachEvents(module, modEvents.window, null, window));
    }
    return subscriptions;
  }

  /*
    Attach the events for a module.

    @method _attachEvents
    @param module {Object} The module the events are for.
    @param group {Object} The collection of events.
    @param prefix {String} The event prefix to attach.
    @param parent {String} The parent to attach to.
    @returns {Array} The subscriptions added.
  */
  _attachEvents(module, group, prefix, parent=document) {
    let subscriptions = [];
    let resolvedHandler = {};
    Object.keys(group).forEach(name => {
      const handler = this._normalizeHandler(group[name], module, name);
      resolvedHandler[name] = handler;
    });
    // Bind resolved event handlers as a group.
    if (Object.keys(resolvedHandler).length) {
      Object.keys(resolvedHandler).forEach(name => {
        // All events are fired from the document or window so scope the
        // events to avoid conflicts.
        const event = prefix ? `${prefix}.${name}` : name;
        const handler = resolvedHandler[name];
        const callable = e => {
          // Pass the extra parameters supplied to the event as parameters to
          // the callback.
          let detail = e.detail || [];
          if (e.detail && !Array.isArray(detail)) {
            detail = [detail];
          }
          handler.callback.apply(handler.context, detail);
        };
        parent.addEventListener(event, callable);
        subscriptions.push({
          event: event,
          callable: callable,
          parent: parent
        });
      });
      return subscriptions;
    }
  }

  /**
   * Internal. Called automatically by addModule.
   *
   * @method bind
   **/
  bind(moduleName) {
    if (this.interactive === false) { return; }
    var eventSet = this.events,
        filtered = {};

    if (moduleName) {
      filtered[moduleName] = eventSet[moduleName];
      eventSet = filtered;
    }

    Object.keys(eventSet).forEach(name => {
      this.events[name].subscriptions = this._bindEvents(name);
    });
    return this;
  }

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
  _bindD3Events(modName) {
    // Walk each selector for a given module 'name', doing a
    // d3 selection and an 'on' binding.
    var self = this,
        modEvents = this.events[modName],
        module;

    if (this.interactive === false) { return; }
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
  }

  /**
   * Allow d3 event rebinding after rendering. The component
   * can trigger this after it is sure relevant elements
   * are in the bound DOM.
   *
   **/
  bindAllD3Events() {
    var self = this;
    Object.keys(this.modules).forEach(name => {
      self._bindD3Events(name);
    });
  }

  /**
   * Register a manual event subscription on
   * behalf of a module.
   *
   * @method recordSubscription
   * @param {Module} module to record relative to.
   * @param {Object} YUI event subscription.
   * @chainable
   **/
  recordSubscription(module, subscription) {
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
  }

  /**
    Internal Detail. Called by unbind automatically.
   * D3 events follow a 'slot' like system. Setting the
   * event to null unbinds existing handlers.
   *
   * @method _unbindD3Events
   *
   **/
  _unbindD3Events(modName) {
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
  }

  /**
  * Internal. Called automatically by removeModule.
   * @method unbind
   **/
  unbind(moduleName) {
    var eventSet = this.events,
        filtered = {};

    const _unbind = modEvents => {
      Object.keys(modEvents.subscriptions || {}).forEach(key => {
        const handler = modEvents.subscriptions[key];
        if (handler) {
          if (handler.detach) {
            handler.detach();
          } else if (handler.event) {
            parent = handler.parent ? handler.parent : document;
            parent.removeEventListener(handler.event, handler.callable);
          }
        }
      });
      delete modEvents.subscriptions;
    };

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
  }
  /**
   * @method renderOnce
   *
   * Called the first time render is invoked. See {render}.
   **/
  renderOnce() {
    this.all('renderOnce');
  }
  /**
   * Render each module bound to the canvas. The first call to
   * render() will automatically call renderOnce (a noop by default)
   * and update(). If update requires some render state to operate on
   *
   * @method render
   * @chainable
   * renderOnce is the place to include that setup code.
   */
  render() {
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
  }

  /**
   * Called by render, conditionally attach container to the DOM if
   * it isn't already. The framework calls this before module
   * rendering so that d3 Events will have attached DOM elements. If
   * your application doesn't need this behavior feel free to override.
   *
   * @method attachContainer
   * @chainable
   **/
  attachContainer() {
    var container = this.container;
    if (container && !document.body.contains(container)) {
      document.body.appendChild(container);
    }
    return this;
  }

  /**
   * Remove container from DOM returning container. This
   * is explicitly not chainable.
   *
   * @method detachContainer
   **/
  detachContainer() {
    var container = this.container;
    if (document.body.contains(container)) {
      container.remove();
    }
    return container;
  }

  /**
   * Update the data for each module
   * see also the dataBinding event hookup
   *
   * @method update
   * @chainable
   */
  update() {
    this.all('update');
    return this;
  }

  all(methodName) {
    Object.keys(this.modules).forEach(name => {
      const mod = this.modules[name];
      if (methodName in mod) {
        mod[methodName]();
      }
    });
  }

  destructor() {
    this.removeModules();
  }
};

module.exports = Component;
