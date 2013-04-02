'use strict';

/**
 * The Go store environment.
 *
 * @module env
 * @submodule env.go
 */

YUI.add('juju-env-go', function(Y) {

  var environments = Y.namespace('juju.environments');

  var endpointToName = function(endpoint) {
    return endpoint[0] + ':' + endpoint[1].name;
  };

  /**
     Return an object containing all the key/value pairs of the given "obj",
     turning all the keys to lower case.

     @method lowerObjectKeys
     @static
     @param {Object} obj The input object.
     @return {Object} The output object, containing lowercased keys.
   */
  var lowerObjectKeys = function(obj) {
    var newObj = Object.create(null);
    Y.each(obj, function(value, key) {
      newObj[key.toLowerCase()] = value;
    });
    return newObj;
  };

  /**
     Return an object containing all the key/value pairs of the given "obj",
     converting all the values to strings.

     @method stringifyObjectValues
     @static
     @param {Object} obj The input object.
     @return {Object} The output object, containing values as strings.
   */
  var stringifyObjectValues = function(obj) {
    var newObj = Object.create(null);
    Y.each(obj, function(value, key) {
      newObj[key] = value + '';
    });
    return newObj;
  };

  /**
     JSON replacer converting values to be serialized into that suitable
     to be sent to the juju-core API server. This function can be passed to
     Y.JSON.stringify in order to clean up data before serialization.

     @method cleanUpJSON
     @static
     @param {Object} key The key in the key/value pair passed by
      Y.JSON.stringify.
     @param {Object} value The value corresponding to the provided key.
     @return {Object} A value that will be serialized in place of the raw value.
   */
  var cleanUpJSON = function(key, value) {
    // Blacklist null values.
    if (value === null) {
      return undefined;
    }
    return value;
  };

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

  var entityInfoConverters = {
    /**
      Convert a Go style entity info into the expected legacy format.

      @param {Object} entityInfo The JSON entity information from Go.
      @return {Object} The legacy JSON data that the GUI expects.
     */
    service: function(entityInfo) {
      return {
        id: entityInfo.Name,
        exposed: entityInfo.Exposed // XXX and more stuff
      };
    },
    /**
      Convert a Go style entity info into the expected legacy format.

      @param {Object} entityInfo The JSON entity information from Go.
      @return {Object} The legacy JSON data that the GUI expects.
     */
    unit: function(entityInfo) {
      return {
        id: entityInfo.Name,
        service: entityInfo.Service // XXX and more stuff
      };
    },
    /**
      Convert a Go style entity info into the expected legacy format.

      @param {Object} entityInfo The JSON entity information from Go.
      @return {Object} The legacy JSON data that the GUI expects.
     */
    relation: function(entityInfo) {
      return {
        id: entityInfo.Key // XXX and more stuff
      };
    },
    /**
      Convert a Go style entity info into the expected legacy format.

      @param {Object} entityInfo The JSON entity information from Go.
      @return {Object} The legacy JSON data that the GUI expects.
     */
    machine: function(entityInfo) {
      return {
        id: entityInfo.Id,
        instance_id: entityInfo.InstanceId // XXX and more stuff
      };
    }
  };

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
      this.on('_rpc_response', this._handleRpcResponse);
    },

    /**
      XXX FAKE FAKE FAKE, does not do anything.

      Get the available endpoints (by interface) for a collection of
      services.

      @method get_endpoints
      @param {Array} services Zero or more currently deployed services for
          which the endpoints should be collected.  Specifying an empty array
          indicates that all deployed services should be analyzed.
      @param {Function} callback A callable that must be called once the
         operation is performed.
      @return {undefined} Sends a message to the server only.
     */
    get_endpoints: function(services, callback) {
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
      if (!op.Params) {
        op.Params = {};
      }
      // Serialize the operation using the cleanUpJSON replacer function.
      var msg = Y.JSON.stringify(op, cleanUpJSON);
      this.ws.send(msg);
    },

    /**
      Begin watching all Juju status.

      @method _watchAll
      @private
      @return {undefined} Sends a message to the server only.
     */
    _watchAll: function() {
      this._send_rpc(
          {
            Type: 'Client',
            Request: 'WatchAll'
          },
          function(data) {
            if (data.Error) {
              console.log('aiiiiie!'); // retry and eventually alert user XXX
            } else {
              this._allWatcherId = data.Response.AllWatcherId;
              this._next();
            }
          }
      );
    },

    /**
      Process an incoming response to an RPC request.

      @method _handleRpcResponse
      @param {Object} data The data returned by the server.
      @return {undefined} Nothing.
     */
    _handleRpcResponse: function(data) {
      // We do this early to get a response back fast.  Might be a bad
      // idea. :-)
      this._next();
      // data.Deltas has our stuff.  We need to translate delta
      // events based on the deltas we got.
      var deltas = [];
      data.Response.Deltas.forEach(function(delta) {
        var kind = delta[0], operation = delta[1], entityInfo = delta[2];
        var converter = entityInfoConverters[kind];
        deltas.push([kind, operation, converter(entityInfo)]);
      });
      this.fire('delta', {data: {result: deltas}});
    },

    /**
      Get the next batch of deltas from the Juju status.

      @method _next
      @private
      @return {undefined} Sends a message to the server only.
     */
    _next: function() {
      this._send_rpc({
        Type: 'AllWatcher',
        Request: 'Next',
        Id: this._allWatcherId,
        Params: {}
      }, function(data) {
        if (data.Error) {
          console.log('aiiiiie!'); // XXX
        } else {
          this.fire('_rpc_response', data);
        }
      });
    },

    /**
     * React to the results of sending a login message to the server.
     *
     * @method handleLoginEvent
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleLogin: function(data) {
      this.pendingLoginResponse = false;
      this.userIsAuthenticated = !data.Error;
      if (this.userIsAuthenticated) {
        // If login succeeded retrieve the environment info.
        this.environmentInfo();
        this._watchAll();
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
      if (this.userIsAuthenticated || this.pendingLoginResponse) {
        return;
      }
      var credentials = this.getCredentials();
      if (credentials && credentials.areAvailable) {
        this._send_rpc({
          Type: 'Admin',
          Request: 'Login',
          Params: {
            AuthTag: credentials.user,
            Password: credentials.password
          }
        }, this.handleLogin);
        this.pendingLoginResponse = true;
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
        Request: 'EnvironmentInfo'
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
              Config: stringifyObjectValues(config),
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
          Tag: entity,
          Pairs: stringifyObjectValues(data)
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
          Tag: entity,
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
          Tag: entity
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
       Add a relation between two services.

       @method add_relation
       @param {Object} endpointA An array of [service, interface]
         representing one of the endpoints to connect.
       @param {Object} endpointB An array of [service, interface]
         representing the other endpoint to connect.
       @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), and with a "endpoint_a" and "endpoint_b" attributes
        containing the names of the endpoints.
       @return {undefined} Nothing.
     */
    add_relation: function(endpointA, endpointB, callback) {
      var endpoint_a = endpointToName(endpointA);
      var endpoint_b = endpointToName(endpointB);
      var intermediateCallback;
      if (callback) {
        intermediateCallback = Y.bind(this.handleAddRelation, null,
            callback, endpoint_a, endpoint_b);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'AddRelation',
        Params: {
          Endpoints: [endpoint_a, endpoint_b]
        }
      }, intermediateCallback);
    },

    /**
       Transform the data returned from juju-core call to AddRelation
       to that suitable for the user callback.

       @method handleAddRelation
       @param {Function} userCallback The callback originally submitted by
         the call site.
       @param {string} endpoint_a Name of one of the services in the relation.
       @param {string} endpoint_b Name of the other service in the relation.
       @param {Object} data The response returned by the server.
       @return {undefined} Nothing.
     */
    handleAddRelation: function(userCallback, endpoint_a, endpoint_b, data) {
      var result = {};
      var response = data.Response;
      if (response !== undefined) {
        var epGuiA = {};
        var epGuiB = {};
        var epJujuA = response.Endpoints[endpoint_a];
        var epJujuB = response.Endpoints[endpoint_b];
        var svcNameA = endpoint_a.split(':')[0];
        var svcNameB = endpoint_b.split(':')[0];
        epGuiA[svcNameA] = {'name': epJujuA.Name};
        epGuiB[svcNameB] = {'name': epJujuB.Name};
        result = {
          'id': endpoint_a + '-' + endpoint_b,
          // interface and scope should be the same for both endpoints
          'interface': epJujuA.Interface,
          'scope': epJujuA.Scope,
          'endpoints': [epGuiA, epGuiB]
        };
      }
      userCallback({
        request_id: data.RequestId,
        endpoint_a: endpoint_a,
        endpoint_b: endpoint_b,
        err: data.Error,
        result: result
      });
    },

    /**
     * Remove the relationship between two services.
     *
     * @param {Object} endpointA An array of [service, interface]
     *   representing one of the endpoints to connect.
     * @param {Object} endpointB An array of [service, interface]
     *   representing the other endpoint to connect.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), and with a "endpoint_a" and "endpoint_b" attributes
     *  containing the names of the endpoints.
     * @return {undefined} Nothing.
     * @method remove_relation
     */
    remove_relation: function(endpointA, endpointB, callback) {
      var endpoint_a = endpointToName(endpointA);
      var endpoint_b = endpointToName(endpointB);
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
     * @param {string} endpoint_a Name of one of the services in the relation.
     * @param {string} endpoint_b Name of the other service in the relation.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleRemoveRelation: function(userCallback, endpoint_a, endpoint_b, data) {
      userCallback({
        err: data.Error,
        endpoint_a: endpoint_a,
        endpoint_b: endpoint_b
      });
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
      // Since the callback argument of this._send_rpc is optional, if a
      // callback is not provided, we can leave intermediateCallback undefined.
      var intermediateCallback;
      if (callback) {
        // Curry the callback and service.  No context is passed.
        intermediateCallback = Y.bind(this.handleCharmInfo, null, callback);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'CharmInfo',
        Params: {CharmURL: charmURL}
      }, intermediateCallback);
    },

    /**
       Transform the data returned from juju-core 'CharmInfo' into that
       suitable for the user callback.

       @method handleCharmInfo
       @param {Function} userCallback The callback originally submitted by the
       call site.
       @param {Object} data The response returned by the server. An example of
        the "data.Response" returned by juju-core follows:
          {
            'Config': {
              'Options': {
                'debug': {
                  'Default': 'no',
                  'Description': 'Setting this option to "yes" will ...',
                  'Title': '',
                  'Type': 'string'
                },
                'engine': {
                  'Default': 'nginx',
                  'Description': 'Two web server engines are supported...',
                  'Title': '',
                  'Type': 'string'
                }
              }
            },
            'Meta': {
              'Categories': null,
              'Description': 'This will install and setup WordPress...',
              'Format': 1,
              'Name': 'wordpress',
              'OldRevision': 0,
              'Peers': {
                'loadbalancer': {
                  'Interface': 'reversenginx',
                  'Limit': 1,
                  'Optional': false,
                  'Scope': 'global'
                }
              },
              'Provides': {
                'website': {
                  'Interface': 'http',
                  'Limit': 0,
                  'Optional': false,
                  'Scope': 'global'
                }
              },
              'Requires': {
                'cache': {
                  'Interface': 'memcache',
                  'Limit': 1,
                  'Optional': false,
                  'Scope': 'global'
                },
                'db': {
                  'Interface': 'mysql',
                  'Limit': 1,
                  'Optional': false,
                  'Scope': 'global'
                }
              },
              'Subordinate': false,
              'Summary': 'WordPress is a full featured web blogging tool...'
            },
            'Revision': 10,
            'URL': 'cs:precise/wordpress-10'
          }
        This data will be parsed and transformed before sending the final
        result to the callback.
       @return {undefined} Nothing.
     */
    handleCharmInfo: function(userCallback, data) {
      // Transform subsets of data (config options, peers, provides, requires)
      // returned by juju-core into that suitable for the user callback.
      var parseItems = function(items) {
        var result = {};
        Y.each(items, function(value, key) {
          result[key] = lowerObjectKeys(value);
        });
        return result;
      };
      // Build the transformed data structure.
      var result,
          response = data.Response;
      if (!Y.Object.isEmpty(response)) {
        var meta = response.Meta;
        result = {
          config: {options: parseItems(response.Config.Options)},
          peers: parseItems(meta.Peers),
          provides: parseItems(meta.Provides),
          requires: parseItems(meta.Requires),
          url: response.URL,
          revision: response.Revision,
          description: meta.Description,
          format: meta.Format,
          name: meta.Name,
          subordinate: meta.Subordinate,
          summary: meta.Summary
        };
      }
      var transformedData = {
        err: data.Error,
        result: result
      };
      // Call the original user callback.
      userCallback(transformedData);
    }

  });

  environments.GoEnvironment = GoEnvironment;
  environments.lowerObjectKeys = lowerObjectKeys;
  environments.stringifyObjectValues = stringifyObjectValues;
  environments.entityInfoConverters = entityInfoConverters;
  environments.cleanUpJSON = cleanUpJSON;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify',
    'juju-env-base'
  ]
});
