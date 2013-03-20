'use strict';

/**
  Sandbox APIs mimicking communications with the Go and Juju backends.

  @module env
  @submodule env.sandbox
 */

YUI.add('juju-env-sandbox', function(Y) {

  var sandboxModule = Y.namespace('juju.environments.sandbox');
  var CLOSEDERROR = 'INVALID_STATE_ERR : Connection is closed.';

  /**
   * A client connection for interacting with a sandbox environment.
   *
   * @class ClientConnection
   */
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
     */
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
     */
    onmessage: function(event) {},

    /**
      Immediately give message to listener (contrast with receive).
      Uses onmessage to deliver message, as with websockets.

      @method receiveNow
      @param {Object} data An object to be sent as JSON to the listener.
      @return {undefined} Nothing.
     */
    receiveNow: function(data) {
      if (this.connected) {
        this.onmessage({data: Y.JSON.stringify(data)});
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
      Give message to listener asynchronously (contrast with receiveNow).
      Uses onmessage to deliver message, as with websockets.

      @method receive
      @param {Object} data An object to be sent as JSON to the listener.
      @return {undefined} Nothing.
     */
    receive: function(data) {
      if (this.connected) {
        // 4 milliseconds is the smallest effective time available to wait.  See
        // http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#timers
        setTimeout(this.receiveNow.bind(this, data), 4);
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
      Send a JSON string to the API.

      @method send
      @param {String} data A JSON string of the data to be sent.
      @return {undefined} Nothing.
     */
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
     */
    onopen: function() {},

    /**
      Explicitly open the connection.
      This does not have an analog with websockets, but requiring an explicit
      "open" means less magic is necessary.  It is responsible for changing
      the "connected" state, for calling the onopen hook, and for calling
      the sandbox juju.open with itself.

      @method open
      @return {undefined} Nothing.
     */
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
     */
    onclose: function() {},

    /**
      Close the connection.
      This is responsible for changing the "connected" state, for calling the
      onclosed hook, and for calling the sandbox juju.close.

      @method close
      @return {undefined} Nothing.
     */
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
   * A sandbox Juju environment using the Python API.
   *
   * @class PyJujuAPI
   */
  function PyJujuAPI(config) {
    PyJujuAPI.superclass.constructor.apply(this, arguments);
  }

  PyJujuAPI.NAME = 'sandbox-py-juju-api';
  PyJujuAPI.ATTRS = {
    state: {}, // Required.
    client: {} // Set in the "open" method.
  };

  Y.extend(PyJujuAPI, Y.Base, {

    /**
      Initializes.

      @method initializer
      @return {undefined} Nothing.
     */
    initializer: function() {
      this.connected = false;
    },

    /**
      Opens the connection to the sandbox Juju environment.
      Called by ClientConnection, which sends itself.

      @method open
      @param {Object} client A ClientConnection.
      @return {undefined} Nothing.
     */
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
      } else if (this.get('client') !== client) {
        throw 'INVALID_STATE_ERR : Connection is open to another client.';
      }
    },

    /**
      Closes the connection to the sandbox Juju environment.
      Called by ClientConnection.

      @method close
      @return {undefined} Nothing.
     */
    close: function() {
      this.connected = false;
      this.set('client', undefined);
    },

    /**
      Receives messages from the client and dispatches them.

      @method receive
      @param {Object} data A hash of data sent from the client.
      @return {undefined} Nothing.
     */
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
      @return {undfefined} Nothing.
     */
    performOp_login: function(data) {
      data.result = this.get('state').login(data.user, data.password);
      this.get('client').receive(data);
    }
  });

  sandboxModule.PyJujuAPI = PyJujuAPI;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse'
  ]
});
