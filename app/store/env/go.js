'use strict';

/**
 * The Go store environment.
 *
 * @module env
 * @submodule env.go
 */

YUI.add('juju-env-go', function(Y) {

  var environments = Y.namespace('juju.environments');

  /**
   * The Go Juju environment.
   *
   * This class handles the websocket connection to the GoJuju API backend.
   *
   * @class GoEnvironment
   */
  function GoEnvironment(config) {
    // Invoke Base constructor, passing through arguments.
    GoEnvironment.superclass.constructor.apply(this, arguments);
  }

  GoEnvironment.NAME = 'go-env';

  Y.extend(GoEnvironment, environments.BaseEnvironment, {

    /**
     * See "app.store.env.base.BaseEnvironment.dispatch_result".
     *
     * @method dispatch_result
     * @param {Object} data The JSON contents returned by the API backend.
     * @return {undefined} Dispatches only.
     */
    dispatch_result: function(data) {
      this.set('connected', true);
      if ('RequestId' in data) {
        var tid = data.RequestId;
        if (tid in this._txn_callbacks) {
          this._txn_callbacks[tid].call(this, data);
          delete this._txn_callbacks[tid];
        }
      }
    },

    /**
     * Send a message to the server using the websocket connection.
     *
     * @method _send_rpc
     * @private
     * @param {Object} op The operation to perform (compatible with the
         juju-core format specification, see "/doc/draft/api.txt" in
         lp:~rogpeppe/juju-core/212-api-doc).
     * @param {Function} callback A callable that must be called once the
         backend returns results.
     * @return {undefined} Sends a message to the server only.
     */
    _send_rpc: function(op, callback) {
      var tid = this._counter += 1;
      if (callback) {
        this._txn_callbacks[tid] = callback;
      }
      op.RequestId = tid;
      var msg = Y.JSON.stringify(op);
      this.ws.send(msg);
    },

    handleLogin: function(data) {
      this.userIsAuthenticated = !data.Error;
      // If the credentials were rejected remove them.
      if (!this.userIsAuthenticated) {
        // Do not reset the user name so that it's still displayed in the login
        // mask.
        this.set('password', undefined);
        this.failedAuthentication = true;
      }
      this.fire('login');
    },

    /**
     * Attempt to log the user in.  Credentials must have been previously
     * stored on the environment.
     *
     * @return {undefined} Nothing.
     * @method login
     */
    login: function() {
      // If the user is already authenticated there is nothing to do.
      if (this.userIsAuthenticated) {
        return;
      }
      var user = this.get('user');
      var password = this.get('password');
      if (Y.Lang.isValue(user) && Y.Lang.isValue(password)) {
        this._send_rpc({
          Type: 'Admin',
          Request: 'Login',
          Params: {EntityName: user, Password: password}
        }, this.handleLogin);
      } else {
        console.warn('Attempted login without providing credentials.');
      }
    }

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
