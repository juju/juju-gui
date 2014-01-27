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
 * The Go store environment.
 *
 * @module env
 * @submodule env.go
 */

YUI.add('juju-env-go', function(Y) {

  var environments = Y.namespace('juju.environments');
  var utils = Y.namespace('juju.views.utils');

  var endpointToName = function(endpoint) {
    return endpoint[0] + ':' + endpoint[1].name;
  };

  /**
     Return the relation key corresponding to the given juju-core endpoints.

     @method createRelationKey
     @static
     @param {Object} endpoints The endpoints returned by juju-core API server.
     @return {String} The resulting relation key.
   */
  var createRelationKey = function(endpoints) {
    var roles = Object.create(null);
    Y.each(endpoints, function(value, key) {
      roles[value.Role] = key + ':' + value.Name;
    });
    return roles.requirer + ' ' + roles.provider;
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

  Y.extend(GoEnvironment, environments.BaseEnvironment, {

    /**
      A list of the valid constraints for all providers. Required
      because we cannot request these constraints from Juju yet.

      @property genericConstraints
      @default ['cpu-power', 'cpu-cores', 'mem', 'arch']
      @type {Array}
    */
    genericConstraints: ['cpu-power', 'cpu-cores', 'mem', 'arch'],

    /**
      A list of the constraints that need to be integers. We require
      this list because we cannot request the valid constraints from
      Juju.

      @property integerConstraints
      @default ['cpu-power', 'cpu-cores', 'mem']
      @type {Array}
    */
    integerConstraints: ['cpu-power', 'cpu-cores', 'mem'],

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
      // data.Deltas has our stuff.  We need to translate the kind of each
      // change in delta events based on the deltas we got.  This needs to be
      // handled in a hierarchical fashion; cmp stores the comparison values
      // for the sort function below.
      var deltas = [],
          cmp = {
            serviceInfo: 1,
            relationInfo: 2,
            unitInfo: 3,
            machineInfo: 4,
            annotationInfo: 5
          };
      data.Response.Deltas.forEach(function(delta) {
        var kind = delta[0],
            operation = delta[1],
            entityInfo = delta[2];
        deltas.push([kind + 'Info', operation, entityInfo]);
      });
      deltas.sort(function(a, b) {
        // Sort items not in our hierarchy last.
        if (!cmp[a[0]]) {
          return 1;
        }
        if (!cmp[b[0]]) {
          return -1;
        }
        var scoreA = cmp[a[0]];
        var scoreB = cmp[b[0]];
        // Reverse the sort order for removes.
        if (a[1] === 'remove') { scoreA = -scoreA; }
        if (b[1] === 'remove') { scoreB = -scoreB; }
        return scoreA - scoreB;
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
      Utility method for filtering the constraint data and removing constraints
      which do not have valid values.

      @method filterConstraints
      @param {Object} constraints key:value pairs.
      @return {Object} an object of valid constraint values.
    */
    filterConstraints: function(constraints) {
      // Some of the constraints have to be integers.
      this.integerConstraints.forEach(function(key) {
        constraints[key] = parseInt(constraints[key], 10) || undefined;
      });
      // Remove all constraint options which don't have values
      // else the go back end has issues.
      Object.keys(constraints).forEach(function(key) {
        if (constraints[key] === undefined ||
            (constraints[key].trim && constraints[key].trim() === '')) {
          delete constraints[key];
        }
      });
      return constraints;
    },

    /**
     * React to the results of sending a login message to the server.
     *
     * @method handleLogin
     * @param {Object} data The response returned by the server.
     * param {Bool} fromToken Whether the login request was via a token.
     * @return {undefined} Nothing.
     */
    handleLogin: function(data, fromToken) {
      fromToken = !!fromToken; // Normalize.
      this.pendingLoginResponse = false;
      this.userIsAuthenticated = !data.Error;
      if (this.userIsAuthenticated) {
        // If this is a token login, set the credentials.
        var response = data.Response;
        if (response && response.AuthTag && response.Password) {
          this.setCredentials({
            user: response.AuthTag, password: response.Password});
        }
        // If login succeeded retrieve the environment info.
        this.environmentInfo();
        this._watchAll();
        // Clean up for log out text.
        this.failedAuthentication = this.failedTokenAuthentication = false;
      } else {
        // If the credentials were rejected remove them.
        this.setCredentials(null);
        // Indicate if the authentication was from a token.
        this.failedAuthentication = !fromToken;
        this.failedTokenAuthentication = fromToken;
      }
      this.fire(
          'login',
          {data: {result: this.userIsAuthenticated,
                  fromToken: fromToken}});
    },

    /**
     * React to the results of sending a token login message to the server.
     *
     * @method handleTokenLogin
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleTokenLogin: function(data) {
      this.handleLogin(data, true);
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
        this.fire('login', {data: {result: true}});
        return;
      }
      if (this.pendingLoginResponse) {
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
     * Attempt to log the user in with a token.
     *
     * @method tokenLogin
     * @return {undefined} Nothing.
     */
    tokenLogin: function(token) {
      // If the user is already authenticated there is nothing to do.
      if (this.userIsAuthenticated) {
        this.fire('login', {data: {result: true}});
        return;
      }
      if (this.pendingLoginResponse) {
        return;
      }
      this._send_rpc({
        Type: 'GUIToken',
        Request: 'Login',
        Params: {Token: token}
      }, this.handleTokenLogin);
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
        this.set('environmentName', response.Name);
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
      Handles uploading a local charm to Juju

      @method uploadLocalCharm
      @param {Object} file The file object from the fileSources event object.
      @param {String} series The series to deploy this local charm into.
      @param {Function} progress The callback to handle xhr progress events.
      @param {Function} callback The callback to call after the upload returns
        success or failure.
    */
    uploadLocalCharm: function(file, series, progress, callback) {
      // Ensure that they are logged in and authenticated before uploading.
      if (!this.userIsAuthenticated) {
        console.warn('Attempted upload files without providing credentials.');
        this.fire('login', {data: {result: false}});
        return;
      }

      var credentials = this.getCredentials();
      var authHeader = this._createAuthorizationHeader(
          credentials.user, credentials.password);
      var xhr = this._generateXHRRequest();
      var eventHandler =
          this._xhrEventHandler.bind(this, callback, progress, xhr);

      xhr.addEventListener('progress', eventHandler, false);
      xhr.addEventListener('load', eventHandler, false);

      // we store this handler so that we can detach the events later.
      this.set('xhrEventHandler', eventHandler);

      xhr.open('POST', '/juju-core/charms?series=' + series, true);

      xhr.setRequestHeader('Authorization', authHeader);
      xhr.setRequestHeader('Content-Type', 'application/zip');
      xhr.send(file);
    },

    /**
      Create and return a value for the HTTP "Authorization" header.
      The resulting value includes the given credentials.

      @method _createAuthorizationHeader
      @param {String} username The user name.
      @param {String} password The password associated to the user name.
      @return {String} The resulting "Authorization" header value.
    */
    _createAuthorizationHeader: function(username, password) {
      var hash = btoa(username + ':' + password);
      return 'Basic ' + hash;
    },

    /**
      Generates a new XMLHttpRequest instance using
      the passed in configuration object.

      XMLHttpRequest is read-only so we need a method
      to stub out while testing.

      @method _generateXHRRequest
      @param {Object} [config] The configuration object for XMLHttpRequest.
      @return {Object} A new XMLHttpRequest instance.
    */
    _generateXHRRequest: function(config) {
      config = config || {};
      return new XMLHttpRequest(config);
    },

    /**
      The callback from the xhr progress and load events.

      @method _xhrEventHandler
      @param {Function} callback The uploadLocalCharm callback.
      @param {Function} progress The uploadLocalCharm progress event callback.
      @param {Object} xhr Reference to the XHR intance.
      @param {Object} e The event object from either of the events.
    */
    _xhrEventHandler: function(callback, progress, xhr, e) {
      if (e.type === 'progress' && typeof progress === 'function') {
        progress(e);
        return; // explicit return on progress
      } else if (e.type === 'load' && typeof callback === 'function') {
        // if it's not a progress event it's a load event which is fired when
        // it's finished the transmission for whatever reason.
        var eventHandler = this.get('eventHandler');
        xhr.removeEventListener('progress', eventHandler);
        xhr.removeEventListener('load', eventHandler);
        callback(e);
      }
    },

    /*
    Deployer support

    The deployer integration introduces a number of calls,

    Deployer:Import takes a YAML blob and returns a import request Id.
    Deployer:Watch can watch a request Id returning status information
    Deployer:Status asks for status information across all running and queued
    imports.
    */
    /**
     * Send a request for details about the current Juju environment: default
     * series and provider type.
     *
     * @method deployerImport
     * @param {String} yamlData to import.
     * @param {Object} bundleData Object describing the bundle.  Has name and
     *     id.  May be null.
     * @param {Function} callback to trigger.
     * @return {Number} Request Id.
     */
    deployerImport: function(yamlData, bundleData, callback) {
      var intermediateCallback;
      var name, id;

      if (callback) {
        intermediateCallback = Y.bind(this.handleDeployerImport,
                                      this, callback);
      }
      if (Y.Lang.isValue(bundleData)) {
        name = bundleData.name;
        id = bundleData.id;
      }

      this._send_rpc({
        Type: 'Deployer',
        Request: 'Import',
        Params: {
          YAML: yamlData,
          Name: name,
          BundleID: id
        }
      }, intermediateCallback);
    },

    /**
     Callback to map data from deployerImport back to caller.

     @method handleDeployerImport
     @param {Function} userCallback to trigger.
     @param {Object} data from backend to transform.
    */
    handleDeployerImport: function(userCallback, data) {
      var transformedData = {
        err: data.Error,
        DeploymentId: data.Response.DeploymentId
      };
      userCallback(transformedData);
    },

    /**
     Gather the status of all changes, the callback will be triggered
     with LastChanges in the response which will be an Array of
     {DeploymentId: ...,
      Status: 'status string',
      Time: timestamp,
      Error: 'optional error',
      Queue: optional depth in queue
     }

     @method deployerStatus
     @param {Function} callback to trigger.
    */
    deployerStatus: function(callback) {
      var intermediateCallback;
      if (callback) {
        intermediateCallback = Y.bind(this.handleDeployerStatus,
                                      this, callback);
      }
      this._send_rpc({
        Type: 'Deployer',
        Request: 'Status'
      }, intermediateCallback);
    },

    /**
     Callback to map data from deployerStatus back to caller.

     @method handleDeployerStatus
     @param {Function} userCallback to trigger.
     @param {Object} data from backend to transform.
    */
    handleDeployerStatus: function(userCallback, data) {
      var transformedData = {
        err: data.Error,
        DeploymentId: data.Response.LastChanges
      };
      userCallback(transformedData);
    },

    /**
      Register a Watch with the deployment specified.

      The callback will receive an {Object} An object with err, and the
      generated WatchId.  .

      @method deployerWatch
      @param {Integer} deploymentId The ID of the deployment from the
      original deployment call.
      @param {Function} callback A user callback to return the response data
      to.
     */
    deployerWatch: function(deploymentId, callback) {
      var intermediateCallback;
      if (callback) {
        intermediateCallback = Y.bind(this.handleDeployerWatch,
                                      this, callback);
      }
      this._send_rpc({
        Type: 'Deployer',
        Request: 'Watch',
        Params: {
          DeploymentId: deploymentId
        }
      }, intermediateCallback);

    },

    /**
      Callback to process the environments response to requested a watcher for
      the deployment specified above.

      @method handleDeployerWatch
      @param {Function} userCallback The original callback to the
      deployerWatch function.
      @param {Object} data The servers response to the deployerWatch call.
     */
    handleDeployerWatch: function(userCallback, data) {
      var transformedData = {
        err: data.Error,
        WatchId: data.Response.WatcherId
      };
      userCallback(transformedData);
    },

    /**
      Wait for an update to a deployer watch created earlier.

      Note: This returns once the server has something to update on. It might
      wait a while.

      The callback will receive an {Object} An object with err, and the
      list of Changes.

      @method deployerNext
      @param {Integer} watchId The ID of the watcher created in depployWatch.
      @param {Function} callback The caller's callback function to process
      the response.
     */
    deployerNext: function(watchId, callback) {
      var intermediateCallback;
      if (callback) {
        intermediateCallback = Y.bind(this.handleDeployerNext,
                                      this, callback);
      }

      this._send_rpc({
        Type: 'Deployer',
        Request: 'Next',
        Params: {
          WatcherId: watchId
        }
      }, intermediateCallback);
    },

    /**
      Wrapper for the deployerNext call.

      @method handleDeployerNext
      @param {Function} userCallback The original callback to the
      deployerNext function.
      @param {Object} data The servers response to the deployerNext
      call.
     */
    handleDeployerNext: function(userCallback, data) {
      var transformedData = {
        err: data.Error,
        Changes: data.Response.Changes
      };
      userCallback(transformedData);
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
       @param {Object} constraints The machine constraints to use in the
         object format key: value.
       @param {Function} callback A callable that must be called once the
         operation is performed.
       @return {undefined} Sends a message to the server only.
     */
    deploy: function(charm_url, service_name, config, config_raw, num_units,
                     constraints, callback) {
      var intermediateCallback = null;
      if (callback) {
        intermediateCallback = Y.bind(this.handleDeploy, this,
            callback, service_name, charm_url);
      }

      if (constraints) {
        // If the constraints is a function (this arg position used to be a
        // callback) then log it out to the console to fix it.
        if (typeof constraints === 'function') {
          console.error('Constraints need to be an object not a function');
          console.warn(constraints);
        }

        constraints = this.filterConstraints(constraints);
      } else {
        constraints = {};
      }

      this._send_rpc(
          { Type: 'Client',
            Request: 'ServiceDeploy',
            Params: {
              ServiceName: service_name,
              Config: stringifyObjectValues(config),
              ConfigYAML: config_raw,
              Constraints: constraints,
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
       Set a service's charm.

       @method setCharm
       @param {String} service_name The name of the service to be upgraded.
       @param {String} charm_url The URL of the charm.
       @param {Boolean} force Force upgrading machines in error.
       @param {Function} callback A callable that must be called once the
         operation is performed.
       @return {undefined} Sends a message to the server only.
     */
    setCharm: function(service_name, charm_url, force, callback) {
      var intermediateCallback = null;
      if (callback) {
        intermediateCallback = Y.bind(this.handleSetCharm, this,
            callback, service_name, charm_url);
      }
      this._send_rpc(
          { Type: 'Client',
            Request: 'ServiceSetCharm',
            Params: {
              ServiceName: service_name,
              CharmUrl: charm_url,
              Force: force
            }
          },
          intermediateCallback
      );
    },

    /**
       Transform the data returned from juju-core 'setCharm' into a form which
       is suitable for the user callback.

       @method handleSetCharm
       @param {Function} userCallback The callback originally submitted by the
         call site.
       @param {String} service_name The name of the service.  Passed in since
         it is not part of the response.
       @param {String} charm_url The URL of the charm.  Passed in since
         it is not part of the response.
       @param {Object} data The response returned by the server.
       @return {undefined} Nothing.
     */
    handleSetCharm: function(userCallback, service_name, charm_url, data) {
      var transformedData = {
        err: data.Error,
        service_name: service_name,
        charm_url: charm_url
      };
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
     * Add units to the provided service.
     *
     * @method add_unit
     * @param {String} service The service to be scaled up.
     * @param {Integer} numUnits The number of units to be added.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), or with the following attributes if everything went well:
     *    - service_name: the name of the service;
     *    - num_units: the number of units added;
     *    - result: a list containing the names of the added units.
     * @return {undefined} Sends a message to the server only.
     */
    add_unit: function(service, numUnits, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback, service and numUnits.  No context is passed.
        intermediateCallback = Y.bind(this.handleAddUnit, null,
            callback, service, numUnits);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'AddServiceUnits',
        Params: {ServiceName: service, NumUnits: numUnits}
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from the juju-core add_unit call into that
     * suitable for the user callback.
     *
     * @method handleAddUnit
     * @static
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {String} service The name of the service.  Passed in since it
     * is not part of the response.
     * @param {Integer} numUnits The number of added units.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleAddUnit: function(userCallback, service, numUnits, data) {
      var transformedData = {
        err: data.Error,
        service_name: service
      };
      if (data.Error) {
        transformedData.num_units = numUnits;
      } else {
        var units = data.Response.Units;
        transformedData.result = units;
        transformedData.num_units = units.length;
      }
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
     * Remove units from a service.
     *
     * @method remove_units
     * @param {Array} unit_names The units to be removed.
     * @param {Function} callback A callable that must be called once the
     *   operation is performed. Normalized data, including the unit_names
     *   is passed to the callback.
     */
    remove_units: function(unit_names, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and unit_names.  No context is passed.
        intermediateCallback = Y.bind(this.handleRemoveUnits, null,
            callback, unit_names);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'DestroyServiceUnits',
        Params: {UnitNames: unit_names}
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from the juju-core remove_units call into
     * that suitable for the user callback.
     *
     * @method handleRemoveUnits
     * @static
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {Array} unitNames The names of the removed units.  Passed in
     * since it is not part of the response.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleRemoveUnits: function(userCallback, unitNames, data) {
      var transformedData = {
        err: data.Error,
        unit_names: unitNames
      };
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
        // Capture the callback and service.  No context is passed.
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
        // Capture the callback and service.  No context is passed.
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
     * Transform the data returned from the set_config call into that suitable
     * for the user callback.
     *
     * @method handleSetConfig
     * @param {Function} userCallback The callback originally submitted by the
     * call site.
     * @param {String} service The name of the service.  Passed in since it
     * is not part of the response.
     * @param {Object} newValues The modified config options.
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    handleSetConfig: function(userCallback, serviceName, newValues, data) {
      var transformedData = {
        err: data.Error,
        service_name: serviceName,
        newValues: newValues
      };
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
     * Update the annotations for an entity by name.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. '0', 'mysql-0', or 'mysql'.
     * @param {String} type The type of entity that is being annotated
     *   (e.g.: 'service', 'unit', 'machine', 'environment').
     * @param {Object} data A dictionary of key, value pairs.
     * @return {undefined} Nothing.
     * @method update_annotations
     */
    update_annotations: function(entity, type, data, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and entity.  No context is passed.
        intermediateCallback = Y.bind(this.handleSetAnnotations, null,
            callback, entity);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'SetAnnotations',
        Params: {
          Tag: type + '-' + entity,
          Pairs: stringifyObjectValues(data)
        }
      }, intermediateCallback);
    },

    /**
     * Remove the annotations for an entity by name.
     *
     * @param {Object} entity The name of a machine, unit, service, or
     *   environment, e.g. '0', 'mysql-0', or 'mysql'.
     * @param {String} type The type of entity that is being annotated
     *   (e.g.: 'service', 'unit', 'machine', 'environment').
     * @param {Object} keys A list of annotation key names for the
     *   annotations to be deleted.
     * @return {undefined} Nothing.
     * @method remove_annotations
     */
    remove_annotations: function(entity, type, keys, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and entity.  No context is passed.
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
          Tag: type + '-' + entity,
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
     *   environment, e.g. '0', 'mysql-0', or 'mysql'.
     * @param {String} type The type of entity that is being annotated
     *   (e.g.: 'service', 'unit', 'machine', 'environment').
     * @return {Object} A dictionary of key,value pairs is returned in the
     *   callback.  The invocation of this command returns nothing.
     * @method get_annotations
     */
    get_annotations: function(entity, type, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and entity.  No context is passed.
        intermediateCallback = Y.bind(this.handleGetAnnotations, null,
            callback, entity);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'GetAnnotations',
        Params: {
          Tag: type + '-' + entity
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
     *    result: an object containing all of the configuration data for
     *      the service.
     * @return {undefined} Sends a message to the server only.
     */
    get_service: function(serviceName, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and serviceName.  No context is passed.
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
      // Set the service name to 'name' for compatibility with other
      // Juju environments.
      data.Response.name = data.Response.Service;
      var config = (data.Response || {}).Config;
      var transformedConfig = {};
      Y.each(config, function(value, key) {
        transformedConfig[key] = value.value;
      });
      userCallback({
        err: data.Error,
        service_name: serviceName,
        result: {
          config: transformedConfig,
          constraints: (data.Response || {}).Constraints
        }
      });
    },

    /**
       Change the configuration of the given service.

       @method set_config
       @param {String} serviceName The service name.
       @param {Object} config The charm configuration options.
       @param {String} data The YAML representation of the charm
         configuration options. Only one of `config` and `data` should be
         provided, though `data` takes precedence if it is given.
       @param {Object} serviceConfig the current configuration object
                       of the service.
       @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object containing:
          err - a string describing the problem (if an error occurred),
          service_name - the name of the service.
       @return {undefined} Sends a message to the server only.
     */
    set_config: function(serviceName, config, data, serviceConfig, callback) {
      if ((Y.Lang.isValue(config) && Y.Lang.isValue(data)) ||
          (!Y.Lang.isValue(config) && !Y.Lang.isValue(data))) {
        throw 'Exactly one of config and data must be provided';
      }
      var intermediateCallback, newValues, request;
      request = {
        Type: 'Client',
        Params: {ServiceName: serviceName}
      };
      if (data) {
        request.Request = 'ServiceSetYAML';
        request.Params.Config = data;
      } else {
        // Only the modified options are sent to the API backend.
        newValues = utils.getChangedConfigOptions(config, serviceConfig);
        request.Request = 'ServiceSet';
        request.Params.Options = stringifyObjectValues(newValues);
      }
      if (callback) {
        // Capture the callback, serviceName and newValues.
        // No context is passed.
        intermediateCallback = Y.bind(this.handleSetConfig, null,
            callback, serviceName, newValues);
      }
      this._send_rpc(request, intermediateCallback);
    },

    /**
       Destroy the given service.

       @method destroy_service
       @param {String} serviceName The service name.
       @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object containing:
          err - a string describing the problem (if an error occurred),
          service_name - the name of the service.
       @return {undefined} Sends a message to the server only.
     */
    destroy_service: function(service, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and service.  No context is passed.
        intermediateCallback = Y.bind(this.handleServiceCalls, null,
            callback, service);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'ServiceDestroy',
        Params: {ServiceName: service}
      }, intermediateCallback);
    },

    /**
       Change the constraints of the given service.

       @method set_constraints
       @param {String} serviceName The service name.
       @param {Object} constraints The new service constraints.
       @param {Function} callback A callable that must be called once the
        operation is performed.
       @return {undefined} Sends a message to the server only.
    */
    set_constraints: function(serviceName, constraints, callback) {
      var intermediateCallback, sendData;
      if (callback) {
        // Capture the callback and serviceName.  No context is passed.
        intermediateCallback = Y.bind(this.handleSetConstraints, null,
            callback, serviceName);
      }
      constraints = this.filterConstraints(constraints);
      sendData = {
        Type: 'Client',
        Request: 'SetServiceConstraints',
        Params: {
          ServiceName: serviceName,
          Constraints: constraints
        }
      };
      this._send_rpc(sendData, intermediateCallback);
    },

    /**
       Transform the data returned from juju-core call to
       SetServiceConstraints into that suitable for the user callback.

       @method handleSetConstraints
       @static
       @param {Function} userCallback The callback originally submitted by
         the call site.
       @param {String} serviceName The name of the service.  Passed in since
         it is not part of the response.
       @param {Object} data The response returned by the server.
       @return {undefined} Nothing.
    */
    handleSetConstraints: function(userCallback, serviceName, data) {
      var transformedData = {
        err: data.Error,
        service_name: serviceName
      };
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
      Mark the given unit or relation problem as resolved.

      @method resolved
      @param {String} unitName The unit name.
      @param {String} relationName The relation name (ignored).
      @param {Boolean} retry Whether or not to retry the unit/relation.
      @param {Function} callback A callable that must be called once the
        operation is performed.
      @return {undefined} Sends a message to the server only.
    */
    resolved: function(unitName, relationName, retry, callback) {
      // unitName must be a string value.
      if (typeof unitName !== 'string') {
        console.error('unitName must be a string value to resolve.');
      }
      // Resolving a unit/relation pair is not supported by the Go back-end, so
      // relationName is ignored here.
      var intermediateCallback, sendData;
      if (callback) {
        // Capture the callback and relationName.  No context is passed.
        intermediateCallback = Y.bind(this.handleResolved, null, callback,
            unitName);
      }
      sendData = {
        Type: 'Client',
        Request: 'Resolved',
        Params: {
          UnitName: unitName,
          Retry: !!retry
        }
      };
      this._send_rpc(sendData, intermediateCallback);
    },

    /**
      Transform the data returned from juju-core call to Resolved into that
      suitable for the user callback.

      @method handleResolved
      @static
      @param {Function} userCallback The callback originally submitted by the
        call site.
      @param {String} unitName The name of the unit.  Passed in since it is not
        part of the response.
      @param {Object} data The response returned by the server.
      @return {undefined} Nothing.
    */
    handleResolved: function(userCallback, unitName, data) {
      // Translate the callback data and call the user's callback.
      userCallback({
        op: 'resolved',
        err: data.Error,
        unit_name: unitName
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
      if (response) {
        var serviceNameA = endpoint_a.split(':')[0];
        var serviceNameB = endpoint_b.split(':')[0];
        result.endpoints = [];
        Y.each([serviceNameA, serviceNameB], function(serviceName) {
          var jujuEndpoint = response.Endpoints[serviceName];
          var guiEndpoint = {};
          guiEndpoint[serviceName] = {'name': jujuEndpoint.Name};
          result.endpoints.push(guiEndpoint);
        });
        result.id = createRelationKey(response.Endpoints);
        // The interface and scope should be the same for both endpoints.
        result['interface'] = response.Endpoints[serviceNameA].Interface;
        result.scope = response.Endpoints[serviceNameA].Scope;
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
        // Capture the endpoints.  No context is passed.
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
        // Capture the callback and service.  No context is passed.
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



  environments.createRelationKey = createRelationKey;
  environments.GoEnvironment = GoEnvironment;
  environments.lowerObjectKeys = lowerObjectKeys;
  environments.stringifyObjectValues = stringifyObjectValues;
  environments.cleanUpJSON = cleanUpJSON;

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify',
    'juju-env-base'
  ]
});
