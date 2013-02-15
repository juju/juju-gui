'use strict';

/**
 * The Go store environment.
 *
 * @module env
 * @submodule env.go
 */

YUI.add('juju-env-go', function(Y) {

  /**
   * The Go Juju environment.
   *
   * This class handles the websocket connection to the GoJuju API backend.
   *
   * @class GoEnvironment
   */
  var environments = Y.namespace('juju.environments');

  function GoEnvironment(config) {
    // Invoke Base constructor, passing through arguments.
    GoEnvironment.superclass.constructor.apply(this, arguments);
  }

  GoEnvironment.NAME = 'go-env';
  // FIXME: remove ATTRS?
  GoEnvironment.ATTRS = {
    'socket_url': {},
    'conn': {},
    'user': {},
    'password': {},
    'connected': {value: false},
    'debug': {value: false},
    'readOnly': {value: false}
  };

  Y.extend(GoEnvironment, environments.BaseEnvironment, {

    initializer: function() {
    },

    /**
     * Send a message to the server using the websocket connection.
     *
     * @method _send_rpc
     * @private
     * @param {Object} op The operation to perform (with an "op" attr).
     * @param {Function} callback A callable that must be called once the
         backend returns results.
     * @param {Boolean} writePermissionRequired Whether the requested
         operation requires write permission, i.e. it modifies the env.
     * @return {undefined} Sends a message to the server only.
     */
    _send_rpc: function(op, callback, writePermissionRequired) {
      // Avoid sending remote messages if the operation requires writing
      // and the GUI is in read-only mode.
      if (writePermissionRequired && this.get('readOnly')) {
        this._firePermissionDenied(op);
        // Execute the callback passing an event-like object containing an
        // error.
        if (callback) {
          callback(Y.merge(op, {err: true}));
        }
        return;
      }
      var tid = this._counter += 1;
      if (callback) {
        this._txn_callbacks[tid] = callback;
      }
      op.request_id = tid;
      var msg = Y.JSON.stringify(op);
      this.ws.send(msg);
    }

    // GoEnvironment API


  });

  environments.GoEnvironment = GoEnvironment;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify',
    'juju-env-base'
  ]
});
