'use strict';

/**
 * The base store environment.
 *
 * @module env
 * @submodule env.base
 */

YUI.add('juju-env-base', function(Y) {

  /**
   * The Base Juju environment.
   *
   * This class is intended to be subclassed by real environment
   * implementations.
   *
   * @class BaseEnvironment
   */
  function BaseEnvironment(config) {
    // Invoke Base constructor, passing through arguments.
    BaseEnvironment.superclass.constructor.apply(this, arguments);
  }

  BaseEnvironment.NAME = 'base-env';
  BaseEnvironment.ATTRS = {
    'socket_url': {},
    'conn': {},
    'user': {},
    'password': {},
    'connected': {value: false},
    'debug': {value: false},
    'readOnly': {value: false}
  };

  Y.extend(BaseEnvironment, Y.Base, {

    initializer: function() {
      // Define custom events
      this.publish('msg', {
        emitFacade: true,
        defaultFn: this.dispatch_result
      });
      // txn-id sequence
      this._counter = 0;
      // mapping txn-id callback if any.
      this._txn_callbacks = {};
      // Consider the user unauthenticated until proven otherwise.
      this.userIsAuthenticated = false;
      this.failedAuthentication = false;
    },

    destructor: function() {
      this.ws.close();
      this._txn_callbacks = {};
    },

    connect: function() {
      // Allow an external websocket to be passed in.
      var conn = this.get('conn');
      if (conn) {
        this.ws = conn;
      } else {
        this.ws = new Y.ReconnectingWebSocket(this.get('socket_url'));
      }
      this.ws.debug = this.get('debug');
      this.ws.onmessage = Y.bind(this.on_message, this);
      this.ws.onopen = Y.bind(this.on_open, this);
      this.ws.onclose = Y.bind(this.on_close, this);
      this.on('msg', this.dispatch_event);
      return this;
    },

    on_open: function(data) {},

    on_close: function(data) {
      this.set('connected', false);
    },

    /**
     * Dispatch the results returned by the API backend.
     * Take care of calling attached callbacks and firing events.
     * Subclasses must implement the "_dispatch_rpc_result" and
     * "_dispatch_event" methods.
     *
     * @method dispatch_result
     * @param {Object} data The JSON contents returned by the API backend.
     * @return {undefined} Dispatches only.
     */
    dispatch_result: function(data) {
      this._dispatch_rpc_result(data);
      this._dispatch_event(data);
    },

    /**
     * Fire a "permissionDenied" event passing the attempted operation.
     *
     * @method _firePermissionDenied
     * @private
     * @param {Object} op The attempted operation (with an "op" attr).
     * @return {undefined} Fires an event only.
     */
    _firePermissionDenied: function(op) {
      var title = 'Permission denied';
      var message = ('GUI is in read-only mode and this operation ' +
          'requires an environment modification');
      console.warn(title + ': ' + message + '. Attempted operation: ', op);
      this.fire('permissionDenied', {title: title, message: message, op: op});
    }

  });


  Y.namespace('juju.environments').BaseEnvironment = BaseEnvironment;

}, '0.1.0', {
  requires: [
    'base',
    'reconnecting-websocket'
  ]
});
