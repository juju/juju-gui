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
 * The Python store environment.
 *
 * @module env
 * @submodule env.python
 */

YUI.add('juju-env-python', function(Y) {

  var environments = Y.namespace('juju.environments');
  var utils = Y.namespace('juju.views.utils');

  var endpointToName = function(endpoint) {
    return endpoint[0] + ':' + endpoint[1].name;
  };

  /**
   * The Python Juju environment.
   *
   * This class handles the websocket connection to the PyJuju API backend.
   *
   * @class PythonEnvironment
   */
  function PythonEnvironment(config) {
    // Invoke Base constructor, passing through arguments.
    PythonEnvironment.superclass.constructor.apply(this, arguments);
  }

  PythonEnvironment.NAME = 'python-env';

  Y.extend(PythonEnvironment, environments.BaseEnvironment, {

    /**
     * Python environment constructor.
     *
     * @method initializer
     * @return {undefined} Nothing.
     */
    initializer: function() {
      // When the server tells us the outcome of a login attempt we record
      // the result.
      this.on('login', this.handleLoginEvent, this);
      // Define the default user name for this environment. It will appear as
      // predefined value in the login mask.
      this.defaultUser = 'admin';
    },

    /**
     * Fire a "msg" event when a message is received from the WebSocket.
     * Handle the initial handshake with the server.
     * The "evt.data.ready" attribute indicates the server's initial greeting.
     * It provides a few initial values that we care about.
     *
     * @method on_message
     * @param {Object} evt The event triggered by the WebSocket.
     * @return {undefined} Side effects only.
     */
    on_message: function(evt) {
      var msg = Y.JSON.parse(evt.data);
      if (msg.ready) {
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
      this.userIsAuthenticated = !!evt.data.result;
      // If the credentials were rejected remove them.
      if (!this.userIsAuthenticated) {
        this.setCredentials(null);
        this.failedAuthentication = true;
      }
    },

    _dispatch_event: function(evt) {
      if (!('op' in evt)) {
        console.warn('Env: Unknown evt kind', evt);
        return;
      }
      this.fire(evt.op, {data: evt});
    },

    _dispatch_rpc_result: function(msg) {
      if ('request_id' in msg) {
        var tid = msg.request_id;
        if (tid in this._txn_callbacks) {
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
    },

    // PythonEnvironment API

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
     * @param {Object} endpointA An array of [service, interface] representing
         the first endpoint to connect.
     * @param {Object} endpointB An array of [service, interface] representing
         the second endpoint to connect.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    add_relation: function(endpointA, endpointB, callback) {
      this._send_rpc({
        'op': 'add_relation',
        'endpoint_a': endpointToName(endpointA),
        'endpoint_b': endpointToName(endpointB)}, callback, true);
    },

    /**
       Retrieve charm info.

       @method get_charm
       @param {String} charmURL The URL of the charm.
       @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), and with a "result" attribute containing information
        about the charm. The "result" object includes "config" options, a list
        of "peers", "provides" and "requires", and the charm URL.
       @return {undefined} Sends a message to the server only.
     */
    get_charm: function(charmURL, callback) {
      this._send_rpc({op: 'get_charm', charm_url: charmURL}, callback);
    },

    /**
       Get the configuration for the given service.

       @method get_service
       @param {String} service_name The service name.
       @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object containing:
          err - a string describing the problem (if an error occurred),
          service_name - the name of the service,
          result: an object containing all of the configuration data for
            the service.
       @return {undefined} Sends a message to the server only.
     */
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
     * @param {Object} constraintMap The constraints object.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    deploy: function(charm_url, service_name, config, config_raw, num_units,
                     constraintMap, callback) {

      if (!constraintMap) { constraintMap = {}; }
      // Format the constraints properly for the pyjuju backend
      var constraints = [];
      /* jshint -W089 */
      // Tell jshint to ignore the lack of hasOwnProperty in forloops
      for (var constr in constraintMap) {
        constraints.push(constr + '=' + constraintMap[constr]);
      }

      this._send_rpc(
          { op: 'deploy',
            service_name: service_name,
            config: config,
            config_raw: config_raw,
            charm_url: charm_url,
            constraints: constraints,
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
     * Export data from the environment.
     *
     * @method exportEnvironment
     * @return {undefined} Sends a message to the server only.
     */
    exportEnvironment: function(callback) {
      this._send_rpc(
          {'op': 'exportEnvironment'}, callback, true);
    },

    /**
     * Import data to the environment.
     *
     * @method importEnvironment
     * @param {String} envData JSON blob to import.
     * @return {undefined} Sends a message to the server only.
     */
    importEnvironment: function(envData, callback) {
      this._send_rpc(
          {'op': 'importEnvironment', envData: envData}, callback, true);
    },

    /**
     * Attempt to log the user in.  Credentials must have been previously
     * stored on the environment.
     *
     * @method login
     * @return {undefined} Nothing.
     */
    login: function() {
      // If the user is already authenticated there is nothing to do.
      if (this.userIsAuthenticated) {
        this.fire('login', { data: { result: true }});
        return;
      }
      var credentials = this.getCredentials();
      if (credentials && credentials.areAvailable) {
        this._send_rpc({
          op: 'login',
          user: credentials.user,
          password: credentials.password
        });
      } else {
        console.warn('Attempted login without providing credentials.');
        this.fire('login', { data: { result: false } });
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

    /**
     * Remove a relation between two services.
     *
     * @method remove_relation
     * @param {Object} endpointA An array of [service, interface] representing
         the first endpoint to disconnect.
     * @param {Object} endpointB An array of [service, interface] representing
         the second endpoint to disconnect.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    remove_relation: function(endpointA, endpointB, callback) {
      this._send_rpc({
        'op': 'remove_relation',
        'endpoint_a': endpointToName(endpointA),
        'endpoint_b': endpointToName(endpointB)}, callback, true);
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
     * @param {Object} serviceConfig the current configuration object
                       of the service.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    set_config: function(service, config, data, serviceConfig, callback) {
      if ((Y.Lang.isValue(config) && Y.Lang.isValue(data)) ||
          (!Y.Lang.isValue(config) && !Y.Lang.isValue(data))) {
        throw 'Exactly one of config and data must be provided';
      }
      config = utils.getChangedConfigOptions(config, serviceConfig);

      this._send_rpc({
        op: 'set_config',
        service_name: service,
        config: config,
        data: data
      }, callback, true);
    },

    // The constraints that the backend understands.  Used to generate forms.
    genericConstraints: ['cpu', 'mem', 'arch'],

    /**
     * Change the constraints of the given service.
     *
     * @method set_constraints
     * @param {String} service The service name.
     * @param {Object} constraints A hash of charm constraints.
     * @param {Function} callback A callable that must be called once the
         operation is performed.
     * @return {undefined} Sends a message to the server only.
     */
    set_constraints: function(service, constraints, callback) {
      // Transform the constraints mapping into a string the backend
      // understands.
      var values = [];
      Y.Object.each(constraints, function(value, name) {
        values.push(name + '=' + value);
      });

      this._send_rpc({
        op: 'set_constraints',
        service_name: service,
        constraints: values}, callback, true);
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

    /**
     * Update the annotations for an entity by name.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. '0', 'mysql/0', or 'mysql'.  To specify the
     *   environment as the entity the magic string 'env' is used.
     * @param {String} type The type of the entity; not used, but required
     *   for Go compatibility.
     * @param {Object} data A dictionary of key, value pairs.
     * @return {undefined} Nothing.
     * @method update_annotations
     */
    update_annotations: function(entity, type, data, callback) {
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
     * @param {String} type The type of the entity; not used, but required
     *   for Go compatibility.
     * @return {Object} A dictionary of key,value pairs is returned in the
     *   callback.  The invocation of this command returns nothing.
     * @method get_annotations
     */
    get_annotations: function(entity, type, callback) {
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
     * @param {String} type The type of the entity; not used, but required
     *   for Go compatibility.
     * @param {Object} keys An optional list of annotation key names for the
     *   annotations to be deleted.  If no keys are passed, all annotations
     *   for the entity will be removed.
     * @return {undefined} Nothing.
     * @method remove_annotations
     */
    remove_annotations: function(entity, type, keys, callback) {
      this._send_rpc({
        op: 'remove_annotations',
        entity: entity,
        keys: keys || []}, callback, true);
    }

  });

  environments.PythonEnvironment = PythonEnvironment;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify',
    'juju-env-base'
  ]
});
