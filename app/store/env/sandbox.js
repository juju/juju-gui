'use strict';

/**
Sandbox APIs mimicking communications with the Go and Juju backends.

@module env
@submodule env.sandbox
**/

YUI.add('juju-env-sandbox', function(Y) {

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
        // 4 milliseconds is the smallest effective time available to wait.  See
        // http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#timers
        setTimeout(this.receiveNow.bind(this, data, true), 4);
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
    Handles get_endpoints operations from client.  Called by receive.
    PLACEHOLDER.  This exists to demo existing functionality.
    **/
    performOp_get_endpoints: function(data) {
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
    */
    performOp_add_unit: function(data) {
      this.get('state').addUnit(data.serviceName, data.numUnits);
    }

  });

  sandboxModule.PyJujuAPI = PyJujuAPI;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse'
  ]
});
