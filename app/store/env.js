'use strict';

YUI.add('juju-env', function(Y) {

  /**
   * The Juju environment.
   * This class handles the websocket connection to the Juju API backend.
   *
   * @class Environment
   */
  function Environment(config) {
    // Invoke Base constructor, passing through arguments
    Environment.superclass.constructor.apply(this, arguments);
  }


  Environment.NAME = 'env';
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
      //console.log('Env Init');
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
    },

    destructor: function() {
      this.ws.close();
      this._txn_callbacks = {};
    },

    connect: function() {
      //console.log('Env Connect');
      // Allow an external websocket to be passed in.
      var conn = this.get('conn');
      //console.log('ext ws', conn);
      if (conn) {
        this.ws = conn;
      } else {
        console.log('Creating new websocket', this.get('socket_url'));
        this.ws = new Y.ReconnectingWebSocket(this.get('socket_url'));
      }
      this.ws.debug = this.get('debug');
      this.ws.onmessage = Y.bind(this.on_message, this);
      this.ws.onopen = Y.bind(this.on_open, this);
      this.ws.onclose = Y.bind(this.on_close, this);
      this.on('msg', this.dispatch_event);
      return this;
    },

    on_open: function(data) {
      //console.log('Env: Connected');
    },

    on_close: function(data) {
      //console.log('Env: Disconnect');
      this.set('connected', false);
    },

    on_message: function(evt) {
      //console.log('Env: Receive', evt.data);
      var msg = Y.JSON.parse(evt.data);
      // The "ready" attribute indicates that this is a server's initial
      // greeting.  It provides a few initial values that we care about.
      if (msg.ready) {
        //console.log('Env: Handshake Complete');
        this.set('connected', true);
        this.set('providerType', msg.provider_type);
        this.set('defaultSeries', msg.default_series);
        return;
      }
      this.fire('msg', msg);
    },

    /**
     * React to the results of sending a login message to the server.
     *
     * @method handleLoginEvent
     * @param {Object} evt The event to which we are responding.
     * @return {undefined} Nothing.
     */
    handleLoginEvent: function(evt) {
      // We are only interested in the responses to login events.
      this.userIsAuthenticated = !!evt.data.result;
      // If the credentials were rejected remove them.
      if (!this.userIsAuthenticated) {
        this.set('user', undefined);
        this.set('password', undefined);
        this.failedAuthentication = true;
      }
    },

    dispatch_result: function(data) {
      //console.log('Env: Dispatch Result', data);
      this._dispatch_rpc_result(data);
      this._dispatch_event(data);
    },

    _dispatch_event: function(evt) {
      if (!('op' in evt)) {
        console.warn('Env: Unknown evt kind', evt);
        return;
      }
      //console.log('Env: Dispatch Evt', evt.op);
      this.fire(evt.op, {data: evt});
    },

    _dispatch_rpc_result: function(msg) {
      if ('request_id' in msg) {
        var tid = msg.request_id;
        if (tid in this._txn_callbacks) {
          //console.log('Env: Dispatch Rpc');
          this._txn_callbacks[tid].apply(this, [msg]);
          delete this._txn_callbacks[tid];
        }
      }
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
        var title = 'Permission denied';
        var message = ('GUI is in read-only mode and this operation ' +
            'requires an environment modification');
        console.warn(title + ': ' + message + '. Attempted operation: ', op);
        this.fire(
            'permissionDenied', {title: title, message: message, op: op});
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
      //console.log('Env: send msg', tid, msg, op);
      this.ws.send(msg);
    },

    // Environment API

    /**
     * Add units to the provided service.
     *
     * @method add_unit
     * @param {String} service The service to be scaled up.
     * @param {Integer} num_units The number of units to be added.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    add_unit: function(service, num_units, callback) {
      this._send_rpc({
        'op': 'add_unit',
        'service_name': service,
        'num_units': num_units}, callback, true);
    },

    /**
     * Remove units from a service.
     *
     * @method remove_units
     * @param {Array} unit_names The units to be removed.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    remove_units: function(unit_names, callback) {
      this._send_rpc({
        'op': 'remove_units',
        'unit_names': unit_names}, callback, true);

    },

    /**
     * Add a relation between two services.
     *
     * @method add_relation
     * @param {String} endpoint_a A string `service:interface` representing
         the first endpoint to connect.
     * @param {String} endpoint_b A string `service:interface` representing
         the second endpoint to connect.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    add_relation: function(endpoint_a, endpoint_b, callback) {
      this._send_rpc({
        'op': 'add_relation',
        'endpoint_a': endpoint_a,
        'endpoint_b': endpoint_b}, callback, true);
    },

    get_charm: function(charm_url, callback) {
      this._send_rpc({'op': 'get_charm', 'charm_url': charm_url}, callback);
    },

    get_service: function(service_name, callback) {
      this._send_rpc(
          {'op': 'get_service', 'service_name': service_name}, callback);
    },

    /**
     * Deploy a charm.
     *
     * @method deploy
     * @param {String} charm_url The URL of the charm.
     * @param {String} service_name The name of the service to be deployed.
     * @param {Object} config The charm configuration options.
     * @param {String} config_raw The YAML representation of the charm
         configuration options. Only one of `config` and `config_raw` should be
         provided, though `config_raw` takes precedence if it is given.
     * @param {Integer} num_units The number of units to be deployed.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    deploy: function(charm_url, service_name, config, config_raw, num_units,
                     callback) {
      //console.log(charm_url, service_name, config, config_raw, num_units);
      this._send_rpc(
          { op: 'deploy',
            service_name: service_name,
            config: config,
            config_raw: config_raw,
            charm_url: charm_url,
            num_units: num_units},
          callback, true);
    },

    /**
     * Expose the given service.
     *
     * @method expose
     * @param {String} service The service name.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    expose: function(service, callback) {
      this._send_rpc(
          {'op': 'expose', 'service_name': service}, callback, true);
    },

    /**
     * Attempt to log the user in.  Credentials must have been previously
     * stored on the environment.
     *
     * @return {undefined} Nothing.
     */
    login: function() {
      // If the user is already authenticated there is nothing to do.
      if (this.userIsAuthenticated) {
        return;
      }
      var user = this.get('user');
      var password = this.get('password');
      if (Y.Lang.isValue(user) && Y.Lang.isValue(password)) {
        this._send_rpc({op: 'login', user: user, password: password});
      } else {
        console.warn('Attempted login without providing credentials.');
      }
    },

    /**
     * Un-expose the given service.
     *
     * @method unexpose
     * @param {String} service The service name.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    unexpose: function(service, callback) {
      this._send_rpc(
          {'op': 'unexpose', 'service_name': service}, callback, true);
    },

    status: function(callback) {
      this._send_rpc({'op': 'status'}, callback);
    },

    /**
     * Remove a relation between two services.
     *
     * @method remove_relation
     * @param {String} endpoint_a A string `service:interface` representing
         the first endpoint to disconnect.
     * @param {String} endpoint_b A string `service:interface` representing
         the second endpoint to disconnect.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    remove_relation: function(endpoint_a, endpoint_b, callback) {
      this._send_rpc({
        'op': 'remove_relation',
        'endpoint_a': endpoint_a,
        'endpoint_b': endpoint_b}, callback, true);
    },

    /**
     * Destroy the given service.
     *
     * @method destroy_service
     * @param {String} service The service name.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    destroy_service: function(service, callback) {
      this._send_rpc({
        'op': 'destroy_service',
        'service_name': service}, callback, true);
    },

    /**
     * Change the configuration of the given service.
     *
     * @method set_config
     * @param {String} service The service name.
     * @param {Object} config The charm configuration options.
     * @param {String} data The YAML representation of the charm
         configuration options. Only one of `config` and `data` should be
         provided, though `data` takes precedence if it is given.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    set_config: function(service, config, data, callback) {
      this._send_rpc({
        op: 'set_config',
        service_name: service,
        config: config,
        data: data}, callback, true);
    },

    /**
     * Change the constraints of the given service.
     *
     * @method set_constraints
     * @param {String} service The service name.
     * @param {Object} constraints The charm constraints.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    set_constraints: function(service, constraints, callback) {
      this._send_rpc({
        op: 'set_constraints',
        service_name: service,
        constraints: constraints}, callback, true);
    },

    /**
     * Mark the given unit or relation problem as resolved.
     *
     * @method resolved
     * @param {String} unit_name The unit name.
     * @param {String} relation_name The relation name.
     * @param {Boolean} retry Whether or not to retry the unit/relation.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    resolved: function(unit_name, relation_name, retry, callback) {
      this._send_rpc({
        op: 'resolved',
        unit_name: unit_name,
        relation_name: relation_name || null,
        retry: retry || false}, callback, true);
    },

    get_endpoints: function(services, callback) {
      this._send_rpc({'op': 'get_endpoints', 'service_names': services},
                     callback);
    },

    /**
     * Update the annotations for an entity by name.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. '0', 'mysql/0', or 'mysql'.  To specify the
     *   environment as the entity the magic string 'env' is used.
     * @param {Object} data A dictionary of key, value pairs.
     * @return {undefined} Nothing.
     */
    update_annotations: function(entity, data, callback) {
      this._send_rpc({
        op: 'update_annotations',
        entity: entity,
        data: data}, callback, true);
    },

    /**
     * Get the annotations for an entity by name.
     *
     * Note that the annotations are returned as part of the delta stream, so
     * the explicit use of this command should rarely be needed.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. '0', 'mysql/0', or 'mysql'.  To specify the
     *   environment as the entity the magic string 'env' is used.
     * @return {Object} A dictionary of key,value pairs is returned in the
     *   callback.  The invocation of this command returns nothing.
     */
    get_annotations: function(entity, callback) {
      this._send_rpc({
        op: 'get_annotations',
        entity: entity}, callback);
    },

    /**
     * Remove the annotations for an entity by name.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. '0', 'mysql/0', or 'mysql'.  To specify the
     *   environment as the entity the magic string 'env' is used.
     * @param {Object} keys An optional list of annotation key names for the
     *   annotations to be deleted.  If no keys are passed, all annotations
     *   for the entity will be removed.
     * @return {undefined} Nothing.
     */
    remove_annotations: function(entity, keys, callback) {
      this._send_rpc({
        op: 'remove_annotations',
        entity: entity,
        keys: keys || []}, callback, true);
    }

  });


  Y.namespace('juju').Environment = Environment;

}, '0.1.0', {
  requires: [
    'io',
    'json-parse',
    'json-stringify',
    'base',
    'reconnecting-websocket'
  ]
});
