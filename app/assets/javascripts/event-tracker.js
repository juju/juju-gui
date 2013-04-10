'use strict';


/**
 * Extension for Base to provide a single evt() method to use for all event
 * bindings. These are then auto detached on destroy().
 *
 * Usage:
 * var XX = Y.Base.create('xxx', Y.Base, [Y.Event.EventTracker]...)
 * this.evt(node.on('click', ...);
 *
 * @module event
 *
 */
YUI.add('event-tracker', function(Y) {
  var ns = Y.Event;

  /**
   * Manage event handlers and make sure they're destroyed.
   *
   * @class EventTracker
   *
   */
  ns.EventTracker = function() {
    this._initEventTracker();
  };

  ns.EventTracker.prototype = {
    /**
     * Init during class initialization. Add _events and catch destroy
     * event to clean up indicator instances.
     *
     * @method _initEventTracker
     * @private
     *
     */
    _initEventTracker: function() {
      this._events = [];
      this.__event = this.on('destroy', function(ev) {
        this._detachEvents(true);
      }, this);
    },

    /**
     * On destroy, run destroy on any indicator instances we have. This is a
     * method so we can hook up and test that it's called vs a closure in the
     * init.
     *
     * @method _detachEvents
     * @param {Boolean} complete remove even the destroy event binding.
     * @private
     *
     */
    _detachEvents: function(complete) {
      Y.Array.each(this._events, function(ev) {
        ev.detach();
      });

      if (complete) {
        this.__event.detach();
      }
    },

    /**
     * Track a new event for detaching/destroying later on.
     *
     * @method addEvent
     * @param {EventHandle} handler the event handler to detach later on.
     *
     */
    addEvent: function(handler) {
      this._events.push(handler);
    }
  };


}, '0.1', {
  requires: ['base', 'event']
});
