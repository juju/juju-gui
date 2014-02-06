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
 * The base store environment.
 *
 * @module env
 * @submodule env.base
 */

YUI.add('juju-env-base', function(Y) {

  var module = Y.namespace('juju.environments');
  var _sessionStorageData = {};
  module.stubSessionStorage = {
    /**
     * Implement simple sessionStorage getItem work-alike.
     *
     * @method getItem
     * @param {String} key The key to be used.
     * @return {Object} String on null; the value for the key.
     */
    getItem: function(key) {
      // sessionStorage returns null, not undefined, for missing keys.
      // This actually makes a difference for the JSON parsing.
      return _sessionStorageData[key] || null;
    },
    /**
     * Implement simple sessionStorage setItem work-alike.
     *
     * @method setItem
     * @param {String} key The key to be used.
     * @param {String} value The value to be set.
     * @return {undefined} side effects only.
     */
    setItem: function(key, value) {
      _sessionStorageData[key] = value;
    }
  };

  /**
   * Set local sessionStorage for module, handling possible security issues.
   *
   * @method verifySessionStorage
   * @return {undefined} side effects only.
   */
  module.verifySessionStorage = function() {
    try {
      // Any manipulation of the sessionStorage that might actually fail
      // because cookies are turned off needs to be in this try/catch block.
      if (!module.sessionStorage) {
        // The conditional is to allow for test manipulation.
        module.sessionStorage = window.sessionStorage;
      }
      module.sessionStorage.getItem('credentials');
    } catch (e) {
      module.sessionStorage = module.stubSessionStorage;
    }
  };
  module.verifySessionStorage();

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
    /**
      The websocket URL to connect to.

      @attribute socket_url
      @type {string}
    */
    'socket_url': {},
    /**
      The connection object.

      @attribute conn
      @type {object}
    */
    'conn': {},
    /**
      The username used to connect.

      @attribute user
      @type {string}
    */
    'user': {},
    /**
      The password used to connect.

      @attribute password
      @type {string}
    */
    'password': {},
    /**
      Whether or not the connection is open.

      @attribute connected
      @type {boolean}
    */
    'connected': {value: false},
    /**
      Whether or not to run in debug mode.

      @attribute debug
      @type {boolean}
    */
    'debug': {value: false},
    /**
      Whether or not to run in read-only mode

      @attribute readOnly
      @type {boolean}
    */
    'readOnly': {value: false},
    /**
      The default series (e.g.: precise) as provided by juju.

      @attribute defaultSeries
      @type {string}
    */
    'defaultSeries': {},
    /**
      The provider type (e.g.: ec2) as provided by juju.

      @attribute providerType
      @type {string}
    */
    'providerType': {},
    /**
      The environment name as provided by juju.

      @attribute environmentName
      @type {string}
    */
    'environmentName': {},

    /**
      The object handling Web requests to external APIs.
      This is usually an instance of app/store/web-handler.js:WebHandler when
      the GUI is connected to a real Juju environment, or
      app/store/web-sandbox.js:WebSandbox if the GUI is in sandbox mode.

      @attribute webHandler
      @type {Object}
    */
    'webHandler': {},

    /**
      Operations that are prohibited in read-only mode, but which should fail
      silently because the failure message is not important to the user.

      @attribute _silentFailureOps
      @type {array}
    */
    '_silentFailureOps': {
      value: [
        'update_annotations'
      ]
    }

  };

  Y.extend(BaseEnvironment, Y.Base, {

    initializer: function() {
      // Define custom events.
      this.publish('msg', {
        emitFacade: true,
        defaultFn: this.dispatch_result
      });
      // txn-id sequence.
      this._counter = 0;
      // mapping txn-id callback if any.
      this._txn_callbacks = {};
      // Consider the user unauthenticated until proven otherwise.
      this.userIsAuthenticated = false;
      this.failedAuthentication = false;
      // Populate our credentials if they don't already exist.
      var credentials = this.getCredentials() || {};
      if (Y.Lang.isValue(this.get('user'))) {
        credentials.user = credentials.user ||
            this.get('user');
        if (Y.Lang.isValue(this.get('password'))) {
          credentials.password = credentials.password ||
              this.get('password');
        }
      }
      this.setCredentials(credentials);
    },

    destructor: function() {
      // Close the socket, if we have connected.
      if (this.ws) {
        this.ws.close();
      }
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
      // Our fake backends have "open" methods.  Call them, now that we have
      // set our listeners up.
      if (this.ws.open) {
        this.ws.open();
      }
      return this;
    },

    on_open: function(data) {
      this.set('connected', true);
    },

    on_close: function(data) {
      this.set('connected', false);
    },

    /**
     * Fire a "msg" event when a message is received from the WebSocket.
     *
     * @method on_message
     * @param {Object} evt The event triggered by the WebSocket.
     * @return {undefined} Fire an event only.
     */
    on_message: function(evt) {
      this.fire('msg', Y.JSON.parse(evt.data));
    },

    /**
     * Dispatch the results returned by the API backend.
     * Take care of calling attached callbacks and firing events.
     * Subclasses must implement the "_dispatch_rpc_result" and
     * "_dispatch_event" methods or override this method directly.
     *
     * This method is overridden in go.js
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
      var silent = Y.Array.some(this.get('_silentFailureOps'), function(v) {
        return v === op.op;
      });
      console.warn(title + ': ' + message + '. Attempted operation: ', op);
      if (!silent) {
        this.fire('permissionDenied', {title: title, message: message, op: op});
      }
    },

    /**
     * Store the user's credentials in session storage.
     *
     * @method setCredentials
     * @param {Object} The credentials to store, with a 'user' and a 'password'
     *                 attribute included.
     * @return {undefined} Stores data only.
     */
    setCredentials: function(credentials) {
      module.sessionStorage.setItem(
          'credentials', Y.JSON.stringify(credentials));
    },

    /**
     * Retrieve the stored user credentials.
     *
     * @method getCredentials
     * @return {Object} The stored user credentials with a 'user' and a
     *                   'password' attribute.
     */
    getCredentials: function() {
      var credentials = Y.JSON.parse(
          module.sessionStorage.getItem('credentials'));
      if (credentials) {
        Object.defineProperties(credentials, {
          areAvailable: {
            /**
             * Returns whether or not credentials are populated.
             *
             * @method get
             * @return {Boolean} Whether or not user and password are set.
             */
            get: function() {
              return Y.Lang.isValue(this.user) &&
                  Y.Lang.isValue(this.password);
            }
          }
        });
      }
      return credentials;
    },

    /**
     * Clear login information.
     *
     * @method logout
     * @return {undefined} Nothing.
     */
    logout: function() {
      this.userIsAuthenticated = false;
      this.setCredentials(null);
      this.ws.close();
      this.connect();
    }

  });

  module.BaseEnvironment = BaseEnvironment;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify',
    'reconnecting-websocket'
  ]
});
