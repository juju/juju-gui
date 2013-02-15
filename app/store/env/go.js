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
  function Environment(config) {
    // Invoke Base constructor, passing through arguments
    Environment.superclass.constructor.apply(this, arguments);
  }

  var endpointToName = function(endpoint) {
    return endpoint[0] + ':' + endpoint[1].name;
  };

  Environment.NAME = 'go-env';
  Environment.ATTRS = {
    'socket_url': {},
    'conn': {},
    'user': {},
    'password': {},
    'connected': {value: false},
    'debug': {value: false},
    'readOnly': {value: false}
  };

  Y.extend(Environment, Y.Base, {
    // Prototype methods for your new class

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
      // When the server tells us the outcome of a login attempt we record
      // the result.
      this.on('login', this.handleLoginEvent, this);
    }

  });

  Y.namespace('juju.environments').GoEnvironment = Environment;

}, '0.1.0', {
  requires: [
    'io',
    'json-parse',
    'json-stringify',
    'base',
    'reconnecting-websocket'
  ]
});
