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

  const module = Y.namespace('juju.environments');
  // Define a Juju tags management object.
  module.tags = {
    /**
      Build a tag with the given type and entity name.

      @method build
      @param {String} type The tag type (for instance tags.USER or tags.CLOUD).
      @param {String} name The name of the Juju entity.
      @return {String} The resulting Juju tag.
    */
    build: (type, name) => {
      return `${type}-${name}`;
    },
    /**
      Parse a Juju entity name from the given tag.

      @method parse
      @param {String} tag The tag associated with the Juju entity.
      @param {String} prefix The Juju prefix (see module.prefixes).
      @return {String} The resulting name of the entity (without the prefix).
    */
    parse: (type, tag) => {
      const prefix = `${type}-`;
      if (tag.substr(0, prefix.length) === prefix) {
        return tag.slice(prefix.length);
      }
      throw new Error(`invalid tag of type ${type}: ${tag}`);
    },
    APPLICATION: 'application',
    CLOUD: 'cloud',
    CONTROLLER: 'controller',
    CREDENTIAL: 'cloudcred',
    MACHINE: 'machine',
    MODEL: 'model',
    UNIT: 'unit',
    USER: 'user'
  };
  // Define the pinger interval in seconds.
  module.PING_INTERVAL = 10;
  // Define the Admin API facade version for Juju >= 2.
  module.ADMIN_FACADE_VERSION = 3;

  /**
    Create and return an attribute setter and resetter for the given object.
    The given object must implement the attribute interface:
      - get(name: string) -> string;
      - set(name: string, value: <T>).
    The returned object has two methods:
      - set(name: string, value: <T>) which sets an attribute to the input
        object (just like obj.set() would do);
      - reset() which can be used to reset all values set with the set method
        above to their original values.
  */
  const attrResetter = obj => {
    let initial = {};
    return {
      // Set the object attribute with the given name to the given value.
      set: (name, value) => {
        if (initial[name] === undefined) {
          let val = obj.get(name);
          // The undefined value is used to check whether this attribute has
          // been already set.
          if (val === undefined) {
            val = null;
          }
          initial[name] = val;
        }
        obj.set(name, value);
      },
      // Reset initial values for all previously set attributes.
      reset: () => {
        Object.keys(initial).forEach(name => {
          const value = initial[name];
          obj.set(name, value);
        });
      }
    };
  };

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
      The version of Juju core.

      @attribute jujuCoreVersion
      @type {String}
    */
    'jujuCoreVersion': {
      value: ''
    },
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
      Environment change set object.

      @attribute ecs
      @type {object}
    */
    'ecs': {},
    /**
      The user authorization object.

      @attribute user
      @type {Object}
    */
    'user': {},
    /**
      Whether or not the connection is open.

      @attribute connected
      @type {boolean}
    */
    'connected': {value: false},
    /**
      Whether or not a connection is being attempted.
      @attribute connecting
      @type {Boolean}
    */
    connecting: {value: false},
    /**
      Whether or not to run in debug mode.

      @attribute debug
      @type {boolean}
    */
    'debug': {value: false},
    /**
      The controller access level (see "app/store/env/acl.js").

      @attribute controllerAccess
      @type {String}
    */
    'controllerAccess': {value: ''},
    /**
      The model access level (see "app/store/env/acl.js").

      @attribute modelAccess
      @type {String}
    */
    'modelAccess': {value: ''},
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
      The model's uuid.

      @attribute modelUUID
      @type {string}
    */
    'modelUUID': {},

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
    },

    /**
      Instance of the bundleService class which provides convenience methods to
      interact with the remove bundle service.

      @attribute bundleService
      @type {Object}
    */
    'bundleService': {}

  };

  Y.extend(BaseEnvironment, Y.Base, {

    initializer: function() {
      // Define custom events.
      this.publish('msg', {
        emitFacade: true,
        defaultFn: this.dispatch_result
      });
      // Set up the attribute resetter.
      const resetter = attrResetter(this);
      this.setConnectedAttr = resetter.set.bind(resetter);
      this.resetConnectedAttrs = resetter.reset.bind(resetter);
      // txn-id sequence. This is used in order to keep track of "request-id"
      // in the WebSocket API requests to Juju. Note that Juju requires the
      // "request-id" to be >= 1, as a 0 valued "request-id" would result in
      // Juju assuming a legacy client to be connected, and therefore falling
      // back to legacy mode, in which top level request and response fields
      // are CamelCased (for instance "Request", "Params", "Version", etc.).
      this._counter = 0;
      // mapping txn-id callback if any.
      this._txn_callbacks = {};
      // Consider the user unauthenticated until proven otherwise.
      this.userIsAuthenticated = false;
      this.failedAuthentication = false;
      const credentials = this.get('user').controller;
      if (!credentials.areAvailable) {
        credentials.user = '';
        credentials.password = '';
        this.get('user').controller = credentials;
      }
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
        // This is only used for testing purposes.
        this.ws = conn;
      } else {
        const url = this.get('socket_url');
        console.log('connecting to ' + url);
        this.set('connecting', true);
        this.ws = new jujulib.ReconnectingWebSocket(url);
        this._txn_callbacks = {};
      }
      this.ws.debug = this.get('debug');
      this.ws.onmessage = this.on_message.bind(this);
      this.ws.onopen = this.on_open.bind(this);
      this.ws.onclose = this.on_close.bind(this);
      // Our fake backends have "open" methods.  Call them, now that we have
      // set our listeners up.
      if (this.ws.open) {
        this.ws.open();
      }
      return this;
    },

    on_open: function(data) {
      this.set('connected', true);
      this.set('connecting', false);
    },

    on_close: function(data) {
      this.set('connected', false);
      this.set('connecting', false);
    },

    /**
      Close the WebSocket connection to the Juju API server.

      @method close
      @param callback Optional callback called once the connection has been
        closed and the API cleaned up.
    */
    close: function(callback) {
      if (this.socket_url) {
        console.log(`closing the ${this.name} connection: ${this.socket_url}`);
      } else {
        console.log(`closing the ${this.name} inactive connection`);
      }
      this.set('connecting', false);
      if (!callback) {
        callback = () => {};
      }
      if (!this.ws) {
        callback();
        return;
      }
      this.cleanup(() => {
        this.userIsAuthenticated = false;
        this.get('user').controller = null;
        this.ws.close();
        callback();
      });
    },

    /**
      Define optional operations to be performed before logging out. This
      method, as defined here, only calls the given callback as it is intended
      to be overridden by subclasses. Implementations are responsible of
      calling the given callback that effectively closes the WebSocket
      connection. Concrete implementations are assumed to be idempotent.

      @method cleanup
      @param {Function} done A callable that must be called by the function and
        that actually closes the connection.
    */
    cleanup: function(done) {
      done();
    },

    /**
     * Fire a "msg" event when a message is received from the WebSocket.
     *
     * @method on_message
     * @param {Object} evt The event triggered by the WebSocket.
     * @return {undefined} Fire an event only.
     */
    on_message: function(evt) {
      this.fire('msg', JSON.parse(evt.data));
    },

    /**
     * Dispatch the results returned by the API backend.
     * Take care of calling attached callbacks and firing events.
     * Subclasses must implement the "_dispatch_rpc_result" and
     * "_dispatch_event" methods or override this method directly.
     *
     * This method is overridden in api.js.
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
          'requires a model modification');
      var silent = this.get('_silentFailureOps').some(v => {
        return v === op.op;
      });
      console.warn(title + ': ' + message + '. Attempted operation: ', op);
      if (!silent) {
        this.fire('permissionDenied', {title: title, message: message, op: op});
      }
    }
  });

  module.BaseEnvironment = BaseEnvironment;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify'
  ]
});
