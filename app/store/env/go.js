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
     * Go environment constructor.
     *
     * @method initializer
     * @return {undefined} Nothing.
     */
    initializer: function() {
      // Define the default user name for this environment. It will appear as
      // predefined value in the login mask.
      this.defaultUser = 'user-admin';
    },

    /**
     * See "app.store.env.base.BaseEnvironment.dispatch_result".
     *
     * @method dispatch_result
     * @param {Object} data The JSON contents returned by the API backend.
     * @return {undefined} Dispatches only.
     */
    dispatch_result: function(data) {
      var tid = data.RequestId;
      if (tid in this._txn_callbacks) {
        this._txn_callbacks[tid].call(this, data);
        delete this._txn_callbacks[tid];
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

    /**
     * React to the results of sending a login message to the server.
     *
     * @method handleLoginEvent
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleLogin: function(data) {
      this.userIsAuthenticated = !data.Error;
      if (this.userIsAuthenticated) {
        // If login succeeded retrieve the environment info.
        this.environmentInfo();
      } else {
        // If the credentials were rejected remove them.
        this.setCredentials(null);
        this.failedAuthentication = true;
      }
      this.fire('login', {data: {result: this.userIsAuthenticated}});
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
        return;
      }
      var credentials = this.getCredentials();
      if (credentials && credentials.areAvailable) {
        this._send_rpc({
          Type: 'Admin',
          Request: 'Login',
          Params: {
            EntityName: credentials.user,
            Password: credentials.password
          }
        }, this.handleLogin);
      } else {
        console.warn('Attempted login without providing credentials.');
        this.fire('login', {data: {result: false}});
      }
    },

    /**
     * Store the environment info coming from the server.
     *
     * @method handleEnvironmentInfo
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleEnvironmentInfo: function(data) {
      if (data.Error) {
        console.warn('Error retrieving environment information.');
      } else {
        // Store default series and provider type in the env.
        var response = data.Response;
        this.set('defaultSeries', response.DefaultSeries);
        this.set('providerType', response.ProviderType);
      }
    },

    /**
     * Send a request for details about the current Juju environment: default
     * series and provider type.
     *
     * @method environmentInfo
     * @return {undefined} Nothing.
     */
    environmentInfo: function() {
      this._send_rpc({
        Type: 'Client',
        Request: 'EnvironmentInfo',
        Params: {}
      }, this.handleEnvironmentInfo);
    },

    /**
       Deploy a charm.

       @method deploy
       @param {String} charm_url The URL of the charm.
       @param {String} service_name The name of the service to be deployed.
       @param {Object} config The charm configuration options.
       @param {String} config_raw The YAML representation of the charm
         configuration options. Only one of `config` and `config_raw` should be
         provided, though `config_raw` takes precedence if it is given.
       @param {Integer} num_units The number of units to be deployed.
       @param {Function} callback A callable that must be called once the
         operation is performed.
       @return {undefined} Sends a message to the server only.
     */
    deploy: function(charm_url, service_name, config, config_raw, num_units,
                     callback) {
      var intermediateCallback = null;
      if (callback) {
        intermediateCallback = Y.bind(this.handleDeploy, this,
            callback, service_name, charm_url);
      }
      this._send_rpc(
          { Type: 'Client',
            Request: 'ServiceDeploy',
            Params: {
              ServiceName: service_name,
              Config: config,
              ConfigYAML: config_raw,
              CharmUrl: charm_url,
              NumUnits: num_units
            }
          },
          intermediateCallback
      );
    },

    /**
       Transform the data returned from juju-core 'deploy' into that suitable
       for the user callback.

       @method handleDeploy
       @param {Function} userCallback The callback originally submitted by the
       call site.
       @param {String} service_name The name of the service.  Passed in since
         it is not part of the response.
       @param {String} charm_url The URL of the charm.  Passed in since
         it is not part of the response.
       @param {Object} data The response returned by the server.
       @return {undefined} Nothing.
     */
    handleDeploy: function(userCallback, service_name, charm_url, data) {
      var transformedData = {
        err: data.Error,
        service_name: service_name,
        charm_url: charm_url
      };
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
     * Expose the given service.
     *
     * @method expose
     * @param {String} service The service name.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), and with a "service_name" attribute containing the name of
     *  the service.
     * @return {undefined} Sends a message to the server only.
     */
    expose: function(service, callback) {
      var intermediateCallback;
      if (callback) {
        // Curry the callback and service.  No context is passed.
        intermediateCallback = Y.bind(this.handleServiceCalls, null,
            callback, service);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'ServiceExpose',
        Params: {ServiceName: service}
      }, intermediateCallback);
    },

    /**
     * Unexpose the given service.
     *
     * @method unexpose
     * @param {String} service The service name.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), and with a "service_name" attribute containing the name of
     *  the service.
     * @return {undefined} Sends a message to the server only.
     */
    unexpose: function(service, callback) {
      var intermediateCallback;
      if (callback) {
        // Curry the callback and service.  No context is passed.
        intermediateCallback = Y.bind(
            this.handleServiceCalls, null, callback, service);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'ServiceUnexpose',
        Params: {ServiceName: service}
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from juju-core calls related to a service
     * (e.g. 'ServiceExpose', 'ServiceUnexpose') into that suitable for the
     * user callback.
     *
     * @method handleServiceCalls
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {String} service The name of the service.  Passed in since it
     * is not part of the response.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleServiceCalls: function(userCallback, service, data) {
      var transformedData = {
        err: data.Error,
        service_name: service
      };
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
     * Update the annotations for an entity by name.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. 'machine-0', 'unit-mysql-0', or 'service-mysql'.
     *   To specify the environment as the entity the magic string
     *   'environment' is used.
     * @param {Object} data A dictionary of key, value pairs.
     * @return {undefined} Nothing.
     * @method update_annotations
     */
    update_annotations: function(entity, data, callback) {
      var intermediateCallback;
      if (callback) {
        // Curry the callback and entity.  No context is passed.
        intermediateCallback = Y.bind(this.handleSetAnnotations, null,
            callback, entity);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'SetAnnotations',
        Params: {
          EntityId: entity,
          Pairs: data
        }
      }, intermediateCallback);
    },

    /**
     * Remove the annotations for an entity by name.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. 'machine-0', 'unit-mysql-0', or 'service-mysql'.
     *   To specify the environment as the entity the magic string
     *   'environment' is used.
     * @param {Object} keys A list of annotation key names for the
     *   annotations to be deleted.
     * @return {undefined} Nothing.
     * @method remove_annotations
     */
    remove_annotations: function(entity, keys, callback) {
      var intermediateCallback;
      if (callback) {
        // Curry the callback and entity.  No context is passed.
        intermediateCallback = Y.bind(this.handleSetAnnotations, null,
            callback, entity);
      }
      var data = {};
      Y.each(keys, function(key) {
        data[key] = '';
      });
      this._send_rpc({
        Type: 'Client',
        Request: 'SetAnnotations',
        Params: {
          EntityId: entity,
          Pairs: data
        }
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from juju-core 'SetAnnotations' into that
     * suitable for the user callback.
     *
     * @method handleSetAnnotations
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleSetAnnotations: function(userCallback, entity, data) {
      // Call the original user callback.
      userCallback({err: data.Error, entity: entity});
    },

    /**
     * Get the annotations for an entity by name.
     *
     * Note that the annotations are returned as part of the delta stream, so
     * the explicit use of this command should rarely be needed.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. 'machine-0', 'unit-mysql-0', or 'service-mysql'.
     *   To specify the environment as the entity the magic string
     *   'environment' is used.
     * @return {Object} A dictionary of key,value pairs is returned in the
     *   callback.  The invocation of this command returns nothing.
     * @method get_annotations
     */
    get_annotations: function(entity, callback) {
      var intermediateCallback;
      if (callback) {
        // Curry the callback and entity.  No context is passed.
        intermediateCallback = Y.bind(this.handleGetAnnotations, null,
            callback, entity);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'GetAnnotations',
        Params: {
          EntityId: entity
        }
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from juju-core 'GetAnnotations' into that
     * suitable for the user callback.
     *
     * @method handleGetAnnotations
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleGetAnnotations: function(userCallback, entity, data) {
      // Call the original user callback.
      userCallback({
        err: data.Error,
        entity: entity,
        results: data.Response && data.Response.Annotations
      });
    },

    /**
     * Get the configuration for the given service.
     *
     * @method get_service
     * @param {String} serviceName The service name.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object containing:
     *    err - a string describing the problem (if an error occurred),
     *    service_name - the name of the service,
     *    results: an object containing all of the configuration data for
     *      the service.
     * @return {undefined} Sends a message to the server only.
     */
    get_service: function(serviceName, callback) {
      var intermediateCallback;
      if (callback) {
        // Curry the callback and serviceName.  No context is passed.
        intermediateCallback = Y.bind(this.handleGetService, null,
            callback, serviceName);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'ServiceGet',
        Params: {
          ServiceName: serviceName
        }
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from juju-core call to get_service into
     * that suitable for the user callback.
     *
     * @method handleGetService
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {String} serviceName The name of the service.  Passed in since it
     * is not part of the response.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleGetService: function(userCallback, serviceName, data) {
      userCallback({
        err: data.Error,
        service_name: serviceName,
        result: data.Response
      });
    },

    /**
     * Remove the relationship between two services.
     *
     * @param {string} endpoint_a The name of one of the services in the relation.
     * @param {string} endpoint_b The name of the other service in the relation.
     * @return {undefined} Nothing.
     * @method remove_relation
     */
    remove_relation: function(endpoint_a, endpoint_b, callback) {
      var intermediateCallback;
      if (callback) {
        // Curry the endpoints.  No context is passed.
        intermediateCallback = Y.bind(this.handleRemoveRelation, null,
                                      callback, endpoint_a, endpoint_b);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'DestroyRelation',
        Params: {
          Endpoints: [endpoint_a, endpoint_b]
        }
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from juju-core call to DestroyRelation
     * to that suitable for the user callback.
     *
     * @method handleRemoveRelation
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {string} endpoint_a The name of one of the services in the relation.
     * @param {string} endpoint_b The name of the other service in the relation.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleRemoveRelation: function(userCallback, endpoint_a, endpoint_b, data) {
      userCallback({
        err: data.Error,
        endpoint_a: endpoint_a,
        endpoint_b: endpoint_b
      });
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
