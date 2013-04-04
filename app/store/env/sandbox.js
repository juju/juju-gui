'use strict';

/**
Sandbox APIs mimicking communications with the Go and Juju backends.

@module env
@submodule env.sandbox
**/

YUI.add('juju-env-sandbox', function(Y) {

  var environments = Y.namespace('juju.environments');
  var sandboxModule = Y.namespace('juju.environments.sandbox');
  var CLOSEDERROR = 'INVALID_STATE_ERR : Connection is closed.';

  /**
  A client connection for interacting with a sandbox environment.

  @class ClientConnection
  **/
  function ClientConnection(config) {
    ClientConnection.superclass.constructor.apply(this, arguments);
  }

  ClientConnection.NAME = 'sandbox-client-connection';
  ClientConnection.ATTRS = {
    juju: {} // Required.
  };

  Y.extend(ClientConnection, Y.Base, {

    /**
    Initialize.

    @method initializer
    @return {undefined} Nothing.
    **/
    initializer: function() {
      this.connected = false;
    },

    /**
    React to a new message from Juju.
    You are expected to monkeypatch this method, as with websockets.

    @method onmessage
    @param {Object} event An object with a JSON string on the "data"
      attribute.
    @return {undefined} Nothing.
    **/
    onmessage: function(event) {},

    /**
    Immediately give message to listener (contrast with receive).
    Uses onmessage to deliver message, as with websockets.

    @method receiveNow
    @param {Object} data An object to be sent as JSON to the listener.
    @param {Boolean} failSilently A flag to turn off the error when the
      connection is closed.  This exists to handle a race condition between
      receiveNow and receive, when the connection closes between the two.
    @return {undefined} Nothing.
    **/
    receiveNow: function(data, failSilently) {
      if (this.connected) {
        this.onmessage({data: Y.JSON.stringify(data)});
      } else if (!failSilently) {
        throw CLOSEDERROR;
      }
    },

    /**
    Give message to listener asynchronously (contrast with receiveNow).
    Uses onmessage to deliver message, as with websockets.

    @method receive
    @param {Object} data An object to be sent as JSON to the listener.
    @return {undefined} Nothing.
    **/
    receive: function(data) {
      if (this.connected) {
        Y.soon(this.receiveNow.bind(this, data, true));
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
    Send a JSON string to the API.

    @method send
    @param {String} data A JSON string of the data to be sent.
    @return {undefined} Nothing.
    **/
    send: function(data) {
      if (this.connected) {
        this.get('juju').receive(Y.JSON.parse(data));
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
    React to an opening connection.
    You are expected to monkeypatch this method, as with websockets.

    @method onopen
    @return {undefined} Nothing.
    **/
    onopen: function() {},

    /**
    Explicitly open the connection.
    This does not have an analog with websockets, but requiring an explicit
    "open" means less magic is necessary.  It is responsible for changing
    the "connected" state, for calling the onopen hook, and for calling
    the sandbox juju.open with itself.

    @method open
    @return {undefined} Nothing.
    **/
    open: function() {
      if (!this.connected) {
        this.connected = true;
        this.get('juju').open(this);
        this.onopen();
      }
    },

    /**
    React to a closing connection.
    You are expected to monkeypatch this method, as with websockets.

    @method onclose
    @return {undefined} Nothing.
    **/
    onclose: function() {},

    /**
    Close the connection.
    This is responsible for changing the "connected" state, for calling the
    onclosed hook, and for calling the sandbox juju.close.

    @method close
    @return {undefined} Nothing.
    **/
    close: function() {
      if (this.connected) {
        this.connected = false;
        this.get('juju').close();
        this.onclose();
      }
    }

  });

  sandboxModule.ClientConnection = ClientConnection;

  /** Helper function method for generating operation methods
     * with a callback.
    */
  var ASYNC_OP = function(context, rpcName, args) {
    return Y.bind(function(data) {
      var state = this.get('state');
      var client = this.get('client');
      var vargs = Y.Array.map(args, function(i) {
        return data[i];
      });
      var callback = function(reply) {
        if (reply.error) {
          data.error = reply.error;
          data.err = reply.error;
        } else {
          data.result = reply.result;
        }
        client.receiveNow(data);
      };
      // Add our generated callback to arguments.
      vargs.push(callback);
      state[rpcName].apply(state, vargs);
    }, context);
  };

  var OP = function(context, rpcName, args, data) {
    var state = context.get('state');
    var client = context.get('client');
    var vargs = Y.Array.map(args, function(i) {
      return data[i];
    });
    var reply = state[rpcName].apply(state, vargs);
    if (reply.error) {
      data.error = reply.error;
      data.err = reply.error;
    } else {
      data.result = reply.result;
    }
    client.receiveNow(data);
  };


  /**
  A sandbox Juju environment using the Python API.

  @class PyJujuAPI
  **/
  function PyJujuAPI(config) {
    PyJujuAPI.superclass.constructor.apply(this, arguments);
  }

  PyJujuAPI.NAME = 'sandbox-py-juju-api';
  PyJujuAPI.ATTRS = {
    state: {}, // Required.
    client: {}, // Set in the "open" method.
    deltaInterval: {value: 1000} // In milliseconds.
  };

  Y.extend(PyJujuAPI, Y.Base, {

    /**
    Initializes.

    @method initializer
    @return {undefined} Nothing.
    **/
    initializer: function() {
      this.connected = false;
    },


    /**
    Opens the connection to the sandbox Juju environment.
    Called by ClientConnection, which sends itself.

    @method open
    @param {Object} client A ClientConnection.
    @return {undefined} Nothing.
    **/
    open: function(client) {
      if (!this.connected) {
        this.connected = true;
        this.set('client', client);
        var state = this.get('state');
        client.receive({
          ready: true,
          provider_type: state.get('providerType'),
          default_series: state.get('defaultSeries')
        });
        this.deltaIntervalId = setInterval(
            this.sendDelta.bind(this), this.get('deltaInterval'));
      } else if (this.get('client') !== client) {
        throw 'INVALID_STATE_ERR : Connection is open to another client.';
      }
    },

    _deltaWhitelist: {
      service: ['charm', 'config', 'constraints', 'exposed', 'id', 'name',
                'subordinate'],
      machine: ['agent_state', 'instance_state', 'public_address',
                'machine_id'],
      unit: ['agent_state', 'machine', 'number', 'service', 'id'],
      relation: ['relation_id', 'type', 'endpoints', 'scope']
    },

    /**
    Send a delta of events to the client from since the last time they asked.

    @method sendDelta
    @return {undefined} Nothing.
    **/
    sendDelta: function() {
      var changes = this.get('state').nextChanges();
      // TODO: Add annotations when we have them.
      if (changes && !changes.error) {
        var deltas = [];
        var response = {op: 'delta', result: deltas};
        Y.each(this._deltaWhitelist, function(whitelist, changeType) {
          Y.each(changes[changeType + 's'], function(change) {
            var attrs = change[0];
            if (attrs.getAttrs) {
              attrs = attrs.getAttrs();
            }
            var filtered = {};
            Y.each(whitelist, function(name) {
              filtered[name] = attrs[name];
            });
            // For fuller verisimilitude, we could convert some of the
            // underlines in the attribute names to dashes.  That is currently
            // unnecessary.
            var action = change[1] ? 'change' : 'remove';
            // The unit changeType is actually "serviceUnit" in the Python
            // stream.  Our model code handles either, so we're not modifying
            // it for now.
            deltas.push([changeType, action, filtered]);
          });
        });
        this.get('client').receiveNow(response);
      }
    },

    /**
    Closes the connection to the sandbox Juju environment.
    Called by ClientConnection.

    @method close
    @return {undefined} Nothing.
    **/
    close: function() {
      if (this.connected) {
        this.connected = false;
        clearInterval(this.deltaIntervalId);
        delete this.deltaIntervalId;
        this.set('client', undefined);
      }
    },

    /**
    Do any extra work to destroy the object.

    @method destructor
    @return {undefined} Nothing.
    **/
    destructor: function() {
      this.close(); // Make sure the setInterval is cleared!
    },

    /**
    Receives messages from the client and dispatches them.

    @method receive
    @param {Object} data A hash of data sent from the client.
    @return {undefined} Nothing.
    **/
    receive: function(data) {
      // Make a shallow copy of the received data because handlers will mutate
      // it to add an "err" or "result".
      if (this.connected) {
        this['performOp_' + data.op](Y.merge(data));
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
    Handles login operations from the client.  Called by "receive".
    client.receive will receive all sent values back, transparently,
    plus a "result" value that will be true or false, representing whether
    the authentication succeeded or failed.

    @method performOp_login
    @param {Object} data A hash minimally of user and password.
    @return {undefined} Nothing.
    **/
    performOp_login: function(data) {
      data.result = this.get('state').login(data.user, data.password);
      this.get('client').receive(data);
    },

    /**
    Handles deploy operations from client.  Called by receive.
    client.receive will receive all sent values back, transparently.
    If there is an error, the reply will also have an "err" with a string
    describing the error.

    @method performOp_deploy
    @param {Object} data A hash minimally of charm_url, and optionally also
      service_name, config, config_raw, and num_units.
    @return {undefined} Nothing.
    **/
    performOp_deploy: function(data) {
      var client = this.get('client');
      var callback = function(result) {
        if (result.error) {
          data.err = result.error;
        }
        client.receiveNow(data);
      };
      this.get('state').deploy(data.charm_url, callback, {
        name: data.service_name,
        config: data.config,
        configYAML: data.config_raw,
        unitCount: data.num_units
      });
    },

    /**
    Handles update_annotations operations from client.  Called by receive.
    PLACEHOLDER.  This exists to demo existing functionality.
    **/
    performOp_update_annotations: function(data) {
    },

    /**
      Handles add unit operations from the client.

      @method performOp_add_unit
      @param {Object} data Contains service_name and num_units required for
        adding additional units.
    */
    performOp_add_unit: function(data) {
      var res = this.get('state').addUnit(data.service_name, data.num_units);
      if (res.error) {
        data.err = res.error;
      } else {
        data.result = Y.Array.map(res.units, function(unit) {
          return unit.id;
        });
      }
      // respond with the new data or error
      this.get('client').receiveNow(data);
    },

    performOp_get_service: function(data) {
      OP(this, 'getService', ['service_name'], data);
    },

    performOp_get_charm: function(data) {
      ASYNC_OP(this, 'getCharm', ['charm_url'])(data);
    },

    performOp_set_constraints: function(data) {
      OP(this, 'setConstraints', ['service_name', 'constraints'], data);
    },

    performOp_set_config: function(data) {
      ASYNC_OP(this, 'set_config', ['service_name', 'config'])(data);
    },

    /**
      Handles the remove unit operations from the client

      @method performOp_remove_unit
      @param {Object} data Contains unit_names to remove and a calback.
    */
    performOp_remove_units: function(data) {
      var res = this.get('state').removeUnits(data.unit_names);
      if (res.error.length > 0) {
        data.err = res.error;
        data.result = false;
      } else {
        data.result = true;
      }
      // respond with the new data or error
      this.get('client').receiveNow(data);
    },

    /**
      Handles exposing a service request from the client.

      @method performOp_expose
      @param {Object} data Contains service_name to expose and a callback.
    */
    performOp_expose: function(data) {
      var res = this.get('state').expose(data.service_name);

      data.err = res.error;
      data.result = (res.error === undefined);

      this.get('client').receiveNow(data);
    },

    /**
      Handles unexposing a service request from the client.

      @method performOp_unexpose
      @param {Object} data contains service_name to unexpose and a callback.
    */
    performOp_unexpose: function(data) {
      var res = this.get('state').unexpose(data.service_name);

      data.err = res.error;
      data.result = (res.error === undefined);

      this.get('client').receiveNow(data);
    }
  });

  sandboxModule.PyJujuAPI = PyJujuAPI;
}, '0.1.0', {
  requires: [
    'base',
    'timers',
    'json-parse'
  ]
});
