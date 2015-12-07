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

  // Define the pinger interval in seconds.
  var PING_INTERVAL = 10;

  var environments = Y.namespace('juju.environments');
  var utils = Y.namespace('juju.views.utils');

  /**
    Return a normalized name from an endpoint object.

    @method endpointToName
    @static
    @param {Object} endpoint The endpoint to name.
    @return {String} The resulting name.
  */
  var endpointToName = function(endpoint) {
    // In the case of hand-crafted bundles, the endpoint object may be
    // simplified to leave off the name portion of the endpoint; in this
    // case, simply return the text of the endpoint.
    if (!endpoint[1].name) {
      return endpoint[0];
    }
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
      if (value === null) {
        newObj[key] = value;
      } else {
        newObj[key] = value + '';
      }
    });
    return newObj;
  };

  // The jobs that can be associated to a machine.
  // See state/api/params/constants.go.
  var machineJobs = {
    // The machine can host units.
    HOST_UNITS: 'JobHostUnits',
    // The machine manages the environment: i.e. it is a state server.
    MANAGE_ENVIRON: 'JobManageEnviron'
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
      @type {Array}
    */
    genericConstraints: [
      'cpu-power', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'],

    /**
      A list of the constraints that need to be integers. We require
      this list because we cannot request the valid constraints from
      Juju.

      @property integerConstraints
      @type {Array}
    */
    integerConstraints: ['cpu-power', 'cpu-cores', 'mem', 'root-disk'],

    /**
      A list of valid Ubuntu series.

      @property series
      @default all series since precise through current pre-release series.
        To be updated as necessary.
      @type {Array}
    */
    series: Object.keys(utils.getSeriesList()),

    /**
     * Go environment constructor.
     *
     * @method initializer
     * @return {undefined} Nothing.
     */
    initializer: function() {
      // Define the default user name for this environment. It will appear as
      // predefined value in the login mask.
      this.defaultUser = 'admin';
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
      var msg = Y.JSON.stringify(op);
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
      Prepare the service constraints by type converting integer constraints,
      removing the ones which do not have valid values, and turning tags into
      an array as expected by the juju-core API backend.

      @method prepareConstraints
      @param {Object} constraints key:value pairs.
      @return {Object} an object of valid constraint values.
    */
    prepareConstraints: function(constraints) {
      if (typeof constraints === 'string') {
        var constraintsObj = {};
        constraints.trim()
          .split(/\s+/).forEach(function(constraint) {
            var constraintParts = constraint.trim().split('=');
            if (constraintParts.length !== 2) {
              console.error('Got unexpected malformed constraint', constraint);
              return;
            }
            constraintsObj[constraintParts[0].trim()] =
              constraintParts[1].trim();
          });
        constraints = constraintsObj;
      }
      var result = Object.create(null);
      Object.keys(constraints).forEach(function(key) {
        var value;
        if (this.integerConstraints.indexOf(key) !== -1) {
          // Some of the constraints have to be integers.
          value = parseInt(constraints[key], 10);
        } else if (this.genericConstraints.indexOf(key) !== -1) {
          // Trim string constraints.
          value = (constraints[key] || '').trim();
        }
        if (value || value === 0) {
          result[key] = value;
        }
      }, this);
      // Turn the tags constraint (a comma separated list of strings) into an
      // array. If a tag contains spaces, they are turned into a single dash.
      // This is required so that, when exporting the environment as a deployer
      // bundle, the tags=... part does not include spaces, which are the
      // delimiter used by the deployer to separate different constraints,
      // e.g.: constraints: mem=2000 tags=foo,bar cpu-cores=4.
      var tags = result.tags;
      if (tags) {
        result.tags = tags.split(',').reduce(function(collected, value) {
          var tag = value.trim().split(/\s+/).join('-');
          if (tag) {
            collected.push(tag);
          }
          return collected;
        }, []);
      }
      return result;
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
        // If login succeeded store the facades and retrieve environment info.
        var facadeList = response.Facades || [];
        var facades = facadeList.reduce(function(previous, current) {
          previous[current.Name] = current.Versions;
          return previous;
        }, {});
        this.set('facades', facades);
        this.environmentInfo();
        this._watchAll();
        // Start pinging the server.
        // XXX frankban: this is only required as a temporary workaround to
        // prevent Apache to disconnect the WebSocket in the embedded Juju.
        if (!this.pinger) {
          this.pinger = setInterval(
            this.ping.bind(this), PING_INTERVAL * 1000);
        }
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
      Return the last supported version number for the given API facade name.

      @method supportedFacade
      @param {String} name The facade name (for instance "Environment").
      @return {Integer} The version number (for instance 0 or 1), or null if
        the facade is not supported.
    */
    supportedFacade: function(name) {
      var facades = this.get('facades') || {};
      var versions = facades[name];
      if (!versions) {
        return null;
      };
      return versions[versions.length-1];
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
      Send a ping request to the server. The response is ignored.

      @method ping
      @return {undefined} Sends a message to the server only.
    */
    ping: function() {
      this._send_rpc({Type: 'Pinger', Request: 'Ping'});
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
        return;
      }
      // Store default series and provider type in the env.
      var response = data.Response;
      this.set('defaultSeries', response.DefaultSeries);
      this.set('providerType', response.ProviderType);
      if (localStorage.getItem('environmentName')) {
        this.set('environmentName', localStorage.getItem('environmentName'));
      } else {
        this.set('environmentName', response.Name);
      }
      // For now we only need to call environmentGet if the provider is MAAS.
      if (response.ProviderType !== 'maas') {
        // Set the MAAS server to null, so that subscribers waiting for this
        // attribute to be set can be released.
        this.set('maasServer', null);
        return;
      }
      this.environmentGet(data => {
        if (data.err) {
          console.warn('error calling EnvironmentGet API: ' + data.err);
          return;
        }
        this.set('maasServer', data.config['maas-server']);
      });
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
      Send a client EnvironmentGet request to retrieve info about the
      environment definition.

      @method environmentGet
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the "config" attribute if everything went well.
      @return {undefined} Sends a message to the server only.
    */
    environmentGet: function(callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback. No context is passed.
        intermediateCallback = Y.bind(
            this._handleEnvironmentGet, null, callback);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'EnvironmentGet'
      }, intermediateCallback);
    },

    /**
      Handle the results of calling the EnvironmentGet API endpoint.
      Specifically, if the current provider is MAAS, store the MAAS
      controller address as an attribute of this environment.

      @method _handleEnvironmentGet
      @param {Function} callback The originally submitted callback.
      @param {Object} data The response returned by the server.
    */
    _handleEnvironmentGet: function(callback, data) {
      var transformedData = {
        err: data.Error,
      };
      if (!data.Error) {
        transformedData.config = data.Response.Config;
      }
      // Call the original user callback.
      callback(transformedData);
    },

    /**
      Handles uploading a local charm to Juju.

      @method uploadLocalCharm
      @param {Object} file The file object from the fileSources event object.
      @param {String} series The series to deploy this local charm into.
      @param {Function} progress The callback to handle progress events.
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
      var path = '/juju-core/charms?series=' + series;
      var headers = {'Content-Type': 'application/zip'};
      // Use a web handler to communicate to the Juju HTTPS API. The web
      // handler takes care of setting up asynchronous requests with basic
      // HTTP authentication, and of subscribing/invoking the given callbacks.
      // The web handler is stored as an environment attribute: it is usually
      // an instance of app/store/web-handler.js:WebHandler when the GUI is
      // connected to a real Juju environment. When instead the GUI is run in
      // sandbox mode, a fake handler is used, in which no HTTP requests are
      // involved: see app/store/web-sandbox.js:WebSandbox.
      var webHandler = this.get('webHandler');
      webHandler.sendPostRequest(
          path, headers, file, credentials.user, credentials.password,
          progress, callback);
    },

    /**
      Return the full URL to the Juju HTTPS API serving a local charm file.

      @method getLocalCharmFileUrl
      @param {String} charmUrl The local charm URL,
        e.g. "local:strusty/django-42".
      @param {String} filename The file name/path.
        e.g. "icon.svg" or "hooks/install".
      @return {String} The full URL to the file contents, including auth
        credentials.
    */
    getLocalCharmFileUrl: function(charmUrl, filename) {
      var credentials = this.getCredentials();
      var path = '/juju-core/charms?url=' + charmUrl + '&file=' + filename;
      var webHandler = this.get('webHandler');
      return webHandler.getUrl(path, credentials.user, credentials.password);
    },

    /**
      Make a GET request to the Juju HTTPS API.

      @method _jujuHttpGet
      @param {String} path The remote path.
      @param {Function} progress The callback to handle progress events.
      @param {Function} callback The callback to call after the Juju API
        response is returned.
    */
    _jujuHttpGet: function(path, progress, callback) {
      var credentials = this.getCredentials();
      var webHandler = this.get('webHandler');
      var headers = Object.create(null);
      webHandler.sendGetRequest(
          path, headers, credentials.user, credentials.password,
          progress, callback);
    },

    /**
      Handle retrieving the list of local charm files.

      @method listLocalCharmFiles
      @param {String} charmUrl The local charm URL,
        e.g. "local:strusty/django-42".
      @param {Function} progress The callback to handle progress events.
      @param {Function} callback The callback to call after the list has been
        retrieved.
    */
    listLocalCharmFiles: function(charmUrl, progress, callback) {
      var path = '/juju-core/charms?url=' + charmUrl;
      this._jujuHttpGet(path, progress, callback);
    },

    /**
      Handle retrieving the contents of a local charm file.

      @method getLocalCharmFileContents
      @param {String} charmUrl The local charm URL,
        e.g. "local:strusty/django-42".
      @param {String} filename The file name/path.
        e.g. "readme.md" or "hooks/install".
      @param {Function} progress The callback to handle progress events.
      @param {Function} callback The callback to call after the file contents
        have been retrieved.
    */
    getLocalCharmFileContents: function(charmUrl, filename,
                                        progress, callback) {
      var path = '/juju-core/charms?url=' + charmUrl + '&file=' + filename;
      this._jujuHttpGet(path, progress, callback);
    },

    /*
    Deployer support

    The deployer integration introduces a number of calls,

    Deployer:Watch can watch a request Id returning status information
    Deployer:Status asks for status information across all running and queued
    imports.
    */
    /**
      Retrieve the current status of all the bundle deployments.

      @method deployerStatus
      @param {Function} callback A callable that must be called once the
        operation is performed. The callback is called passing an object
        including either an "err" property if an error occurred, or a "changes"
        list of bundle deployment statuses.
        A deployment status object looks like the following:
          {
            deploymentId: <the deployment id as a positive integer>,
            status: 'scheduled' || 'started' || 'completed' || 'cancelled',
            time: <the number of seconds since the epoch as an integer>,
            queue: <the position of the bundle deployment in the queue>,
            err: 'only defined if an error occurred'
          }
    */
    deployerStatus: function(callback) {
      var intermediateCallback;
      if (callback) {
        intermediateCallback = Y.bind(
            this._handleDeployerStatus, this, callback);
      }
      this._send_rpc({
        Type: 'Deployer',
        Request: 'Status'
      }, intermediateCallback);
    },

    /**
     Callback to map data from deployerStatus back to caller.

     @method _handleDeployerStatus
     @param {Function} userCallback to trigger.
     @param {Object} data from backend to transform.
    */
    _handleDeployerStatus: function(userCallback, data) {
      var lastChanges = data.Response.LastChanges || [];
      var transformedData = {
        err: data.Error,
        changes: lastChanges.map(function(change) {
          return {
            deploymentId: change.DeploymentId,
            status: change.Status,
            time: change.Time,
            queue: change.Queue,
            err: change.Error
          };
        })
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
      Calls the environment's _deploy method or creates a new deploy record in
      the ECS queue.

      Parameters match the parameters for the _deploy method below.
      The only new parameter is the last one (ECS options).

      @method deploy
    */
    deploy: function(charmUrl, serviceName, config, configRaw, numUnits,
                     constraints, toMachine, callback, options) {
      var ecs = this.get('ecs');
      var args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        // Call the deploy method right away bypassing the queue.
        this._deploy.apply(this, args);
      } else {
        ecs._lazyDeploy(arguments);
      }
    },

    /**
      Deploy a charm.

      @method _deploy
      @param {String} charmUrl The URL of the charm.
      @param {String} serviceName The name of the service to be deployed.
      @param {Object} config The charm configuration options.
      @param {String} configRaw The YAML representation of the charm
        configuration options. Only one of `config` and `configRaw` should be
        provided, though `configRaw` takes precedence if it is given.
      @param {Integer} numUnits The number of units to be deployed.
      @param {Object} constraints The machine constraints to use in the
        object format key: value.
      @param {String} toMachine The machine/container name where to deploy the
        service unit (e.g. top level machine "42" or container "2/lxc/0").
        If the value is null or undefined, the default juju-core unit placement
        policy is used. This currently means that clean and empty machines are
        used if available, otherwise new top level machines are created.
        If the value is set, numUnits must be 1: i.e. it is not possible to add
        multiple units to a single machine/container.
      @param {Function} callback A callable that must be called once the
        operation is performed.
      @return {undefined} Sends a message to the server only.
    */
    _deploy: function(charmUrl, serviceName, config, configRaw, numUnits,
        constraints, toMachine, callback) {
      var version = this.supportedFacade('Service');

      // Define the API callback.
      var handleDeploy = function(userCallback, serviceName, charmUrl, data) {
        if (!userCallback) {
          console.log('data returned by deploy API call:', data);
          return;
        }
        if (version !== null) {
          data = data.Response.Results[0];
        }
        userCallback({
          err: data.Error,
          service_name: serviceName,
          charm_url: charmUrl
        });
      }.bind(this, callback, serviceName, charmUrl);

      // Build the API call parameters.
      if (constraints) {
        // If the constraints is a function (this arg position used to be a
        // callback) then log it out to the console to fix it.
        if (typeof constraints === 'function') {
          console.error('Constraints need to be an object not a function');
          console.warn(constraints);
        }
        constraints = this.prepareConstraints(constraints);
      } else {
        constraints = {};
      }
      var serviceParams = {
        ServiceName: serviceName,
        Config: stringifyObjectValues(config),
        ConfigYAML: configRaw,
        Constraints: constraints,
        CharmUrl: charmUrl,
        NumUnits: numUnits,
        ToMachineSpec: toMachine
      };

      // Perform the API call.
      if (version !== null) {
        this._send_rpc({
          Type: 'Service',
          Request: 'ServicesDeploy',
          Version: version,
          Params: {Services: [serviceParams]}
        }, handleDeploy);
        return;
      };

      // Fall back to legacy deployment.
      this._send_rpc({
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: serviceParams
      }, handleDeploy);
    },

    /*
    Add/destroy machines support.

    The machines API introduces the following calls:
      - Client:AddMachines adds new machines/containers. The call takes a list
        of AddMachineParams, each one including the following optional fields:
        Series, Constraints, Jobs, ParentId, ContainerType. Other parameters
        (including InstanceId, HardwareCharacteristics and Addrs) are not used
        for now by the Juju GUI client API call implementation.
      - Client:DestroyMachines removes a given set of machines/containers. The
        call takes a list of MachineNames to be removed and a Force flag, which
        forces the machine removal even if it contains units or containers.
    See the API call implementations below for a better description of the
    parameters and return values.

    The API is completed by the ToMachineSpec parameter that can be passed to
    the ServiceDeploy and AddServiceUnits API calls: in both cases, if a
    machine/container name is specified, then the unit(s) will be deployed in
    the specified machine/container.
    */

    /**
      Calls the environment's _addMachines method or creates a new addMachines
      record in the ECS queue.

      Parameters match the parameters for the _addMachines method below.
      The only new parameter is the last one (ECS options).

      @method addMachines
    */
    addMachines: function(params, callback, options) {
      var ecs = this.get('ecs');
      var args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        return this._addMachines.apply(this, args);
      } else {
        return ecs.lazyAddMachines(args, options);
      }
    },

    /**
      Add new machines and/or containers.

      @method _addMachines
      @param {Array} params A list of parameters for each machine/container
        to be added. Each item in the list must be an object containing the
        following keys (all optional):
          - constraints {Object}: the machine constraints;
          - jobs {Array}: the juju-core jobs to associate with the new machine.
          - series {String}: the machine series (the juju-core default series
            is used if none is specified);
          - parentId {String}: when adding a new container, this parameter can
            be used to place it into a specific machine, in which case the
            containerType must also be specified (see below). If parentId is
            not set when adding a container, a new top level machine will be
            created to hold the container with given series, constraints, jobs;
          - containerType {String}: the container type of the new machine
            (e.g. "lxc").
        Usage example:
          var params = [
            // Add a new machine with the default series/constraints.
            {},
            // Add a new saucy machine with four cores.
            {series: 'saucy', constraints: {'cpu-cores': 4}},
            // Add a new LXC in machine 2.
            {containerType: 'lxc', parentId: '2'},
            // Add a new LXC in a new machine.
            {containerType: 'lxc'}
          ];
        Note: This is not guaranteed to be executed in order or synchronous,
        so adding containers to machines should wait until after the machines
        have been created, successfully.
      @param {Function} callback A callable that must be called once the
        operation is performed. The callback is called passing an object like
        the following:
          {
            err: 'only defined if a global error occurred'
            machines: [
              {name: '1', err: 'a machine error occurred'},
              {name: '2/lxc/1', err: null}
              // One entry for each machine/container added.
            ]
          }
    */
    _addMachines: function(params, callback) {
      var self = this;
      // Avoid calling the server if the API call parameters are not valid.
      if (!params.length) {
        console.log('addMachines called without machines to add');
        return;
      }
      var intermediateCallback = null;
      if (callback) {
        intermediateCallback = Y.bind(self._handleAddMachines, self, callback);
      }
      var machineParams = params.map(function(param) {
        var machineParam = {
          // By default the new machines we add are suitable for storing units.
          Jobs: param.jobs || [machineJobs.HOST_UNITS],
          Series: param.series,
          ParentId: param.parentId,
          ContainerType: param.containerType
        };
        if (param.constraints) {
          machineParam.Constraints = self.prepareConstraints(param.constraints);
        }
        return machineParam;
      });
      var request = {
        Type: 'Client',
        Request: 'AddMachines',
        Params: {MachineParams: machineParams}
      };
      self._send_rpc(request, intermediateCallback);
    },

    /**
      Transform the data returned from juju-core 'addMachines' into that
      suitable for the user callback.

      @method _handleAddMachines
      @param {Function} userCallback The callback originally submitted by the
        call site. See addMachines above for a description of what is passed
        to the original callback.
      @param {Object} data The response returned by the server, e.g.:
        {
          RequestId: 1,
          Error: 'only defined if a global error occurred',
          Response: {
            Machines: [
              {Machine: '2', Error: {Code: "code", Message: "error message"}},
              {Machine: '2/lxc/1', Error: null}
            ]
          }
        }
     */
    _handleAddMachines: function(userCallback, data) {
      var machines = data.Response.Machines || [];
      var transformedData = {
        err: data.Error,
        machines: machines.map(function(machine) {
          var error = null;
          var machineError = machine.Error;
          if (machineError) {
            error = machineError.Message;
            if (machineError.Code) {
              error += ' (code ' + machineError.Code + ')';
            }
          }
          return {
            err: error,
            name: machine.Machine
          };
        })
      };
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
      Calls the environment's _destroyMachines method or creates a new
      destroyMachines record in the ECS queue.

      Parameters match the parameters for the _destroyMachines method below.
      The only new parameter is the last one (ECS options).

      @method destroyMachines
    */
    destroyMachines: function(params, force, callback, options) {
      var ecs = this.get('ecs');
      var args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        return this._destroyMachines.apply(this, args);
      } else {
        return ecs._lazyDestroyMachines(args, options);
      }
    },

    /**
      Remove machines and/or containers.

      @method _destroyMachines
      @param {Array} names The names of the machines/containers to be removed.
        Each name is a string: machine names are numbers, e.g. "1" or "42";
        containers have the [machine name]/[container type]/[container number]
        form, e.g. "2/lxc/0" or "1/kvm/42".
      @param {Boolean} force Whether to force machines removal even if they
        host units or containers.
      @param {Function} callback A callable that must be called once the
        operation is performed. The callback is called passing an object like
        the following:
          {
            err: 'only defined if an error occurred'
            names: [] // The list of machine/container names passed to this
                      // call (propagated to provide some context).
          }
    */
    _destroyMachines: function(names, force, callback) {
      // Avoid calling the server if the API call parameters are not valid.
      if (!names.length) {
        console.log('destroyMachines called without machines to remove');
        return;
      }
      var intermediateCallback = null;
      if (callback) {
        intermediateCallback = Y.bind(
            this._handleDestroyMachines, this, callback, names);
      }
      var request = {
        Type: 'Client',
        Request: 'DestroyMachines',
        Params: {MachineNames: names, Force: !!force}
      };
      this._send_rpc(request, intermediateCallback);
    },

    /**
      Transform the data returned from juju-core 'destroyMachines' into that
      suitable for the user callback.

      @method _handleDestroyMachines
      @param {Function} userCallback The callback originally submitted by the
        call site. See destroyMachines above for a description of what is
        passed to the original callback.
      @param {Array} names The names of the removed machines/containers.
        Each name is a string: machine names are numbers, e.g. "1" or "42";
        containers have the [machine name]/[container type]/[container number]
        form, e.g. "2/lxc/0" or "1/kvm/42".
      @param {Object} data The response returned by the server, e.g.:
        {RequestId: 1, Error: 'an error occurred', Response: {}}
     */
    _handleDestroyMachines: function(userCallback, names, data) {
      var transformedData = {
        err: data.Error,
        names: names
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
      Calls the environment's _add_unit method or creates a new add_unit record
      in the ECS queue.

      Parameters match the parameters for the _add_unit method below.
      The only new parameter is the last one (ECS options).

      @method add_unit
    */
    add_unit: function(service, numUnits, toMachine, callback, options) {
      var ecs = this.get('ecs');
      var args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        this._add_unit.apply(this, args);
      } else {
        ecs.lazyAddUnits(args, options);
      }
    },

    /**
      Add units to the provided service.

      @method _add_unit
      @param {String} service The service to be scaled up.
      @param {Integer} numUnits The number of units to be added.
      @param {String} toMachine The machine/container name where to deploy the
        service unit (e.g. top level machine "42" or container "2/lxc/0").
        If the value is null or undefined, the default juju-core unit placement
        policy is used. This currently means that clean and empty machines are
        used if available, otherwise new top level machines are created.
        If the value is set, numUnits must be 1: i.e. it is not possible to add
        multiple units to a single machine/container.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the following attributes if everything went well:
        - service_name: the name of the service;
        - num_units: the number of units added;
        - result: a list containing the names of the added units.
      @return {undefined} Sends a message to the server only.
    */
    _add_unit: function(service, numUnits, toMachine, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback, service and numUnits.  No context is passed.
        intermediateCallback = Y.bind(
            this._handleAddUnit, null, callback, service, numUnits);
      }
      this._send_rpc({
        Type: 'Client',
        Request: 'AddServiceUnits',
        Params: {
          ServiceName: service,
          NumUnits: numUnits,
          ToMachineSpec: toMachine
        }
      }, intermediateCallback);
    },

    /**
      Transform the data returned from the juju-core add_unit call into that
      suitable for the user callback.

      @method _handleAddUnit
      @static
      @param {Function} userCallback The callback originally submitted by the
        call site.
      @param {String} service The name of the service.  Passed in since it
        is not part of the response.
      @param {Integer} numUnits The number of added units.
      @param {Object} data The response returned by the server.
    */
    _handleAddUnit: function(userCallback, service, numUnits, data) {
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
      Place the given ghost unit to the given machine or container.

      This is just a wrapper around the ECS placeUnit method.

      @method placeUnit
      @static
      @param {Object} unit The ghost unit model instance.
      @param {String} machineId The name of the machine/container where the
        unit must be placed. This can be either a ghost machine or a real one.
      @return {String} An error if the unit is not present in the changeset or
        if its placement is not valid. Null if the placement succeeds.
    */
    placeUnit: function(unit, machineId) {
      return this.get('ecs').placeUnit(unit, machineId);
    },

    /**
      Calls the environment's _remove_units method or removes an
      add_unit record in the ECS queue.

      Parameters match the parameters for the _remove_units method below.
      The only new parameter is the last one (ECS options).

      @method remove_units
    */
    remove_units: function(unit_names, callback, options) {
      var ecs = this.get('ecs'),
          args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        this._remove_units.apply(this, args);
      } else {
        ecs._lazyRemoveUnit(args);
      }
    },

    /**
     * Remove units from a service.
     *
     * @method _remove_units
     * @param {Array} unit_names The units to be removed.
     * @param {Function} callback A callable that must be called once the
     *   operation is performed. Normalized data, including the unit_names
     *   is passed to the callback.
     */
    _remove_units: function(unit_names, callback) {
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
      Calls the environment's _expose method or adds an expose record to
      the ECS.

      Parameters match the parameters for the _expose method below.
      The only new parameter is the last one (ECS options).

      @method expose
    */
    expose: function(service, callback, options) {
      var ecs = this.get('ecs'),
          args = ecs._getArgs(arguments);
      if (options.immediate) {
        this._expose.apply(this, args);
      } else {
        ecs.lazyExpose(args);
      }
    },

    /**
     * Expose the given service.
     *
     * @method _expose
     * @param {String} service The service name.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), and with a "service_name" attribute containing the name of
     *  the service.
     * @return {undefined} Sends a message to the server only.
     */
    _expose: function(service, callback) {
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
      Calls the environment's _unexpose method or adds an unexpose record to
      the ECS.

      Parameters match the parameters for the _unexpose method below.
      The only new parameter is the last one (ECS options).

      @method unexpose
    */
    unexpose: function(service, callback, options) {
      var ecs = this.get('ecs'),
          args = ecs._getArgs(arguments);
      if (options.immediate) {
        this._unexpose.apply(this, args);
      } else {
        ecs.lazyUnexpose(args);
      }
    },

    /**
     * Unexpose the given service.
     *
     * @method _unexpose
     * @param {String} service The service name.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), and with a "service_name" attribute containing the name of
     *  the service.
     * @return {undefined} Sends a message to the server only.
     */
    _unexpose: function(service, callback) {
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
      Calls the environments set_config method or creates a new set_config
      record in the queue.

      The parameters match the parameters for the public env deploy method in
      go.js.

      @method setConfig
    */
    set_config: function(serviceName, config, data, serviceConfig, callback,
        options) {
      var ecs = this.get('ecs');
      var args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        // Need to check that the serviceName is a real service name and not
        // a queued service id before allowing immediate or not.
        if (ecs.changeSet[serviceName]) {
          throw 'You cannot immediately setConfig on a queued service';
        } else {
          this._set_config.apply(this, args);
        }
      } else {
        ecs._lazySetConfig(args);
      }
    },

    /**
       Change the configuration of the given service.

       @method _set_config
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
    _set_config: function(serviceName, config, data, serviceConfig, callback) {
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
        // Only the modified options are sent to the API backend. With the
        // new React configuration system the modified values is determined
        // in the view and set in the service model so we can faithfully
        // take what it says to set as correct.
        newValues = config;

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
      Calls the environments destroyService method or creates a new
      destroyService record in the queue.

      The parameters match the parameters for the public env destroy_service
      method in go.js.

      @method destroy_service
    */
    destroy_service: function(service, callback, options) {
      var ecs = this.get('ecs');
      var args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        this._destroyService.apply(this, args);
      } else {
        ecs._lazyDestroyService(args);
      }
    },

    /**
       Destroy the given service.

       @method _destroyService
       @param {String} serviceName The service name.
       @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object containing:
          err - a string describing the problem (if an error occurred),
          service_name - the name of the service.
       @return {undefined} Sends a message to the server only.
     */
    _destroyService: function(service, callback) {
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
      constraints = this.prepareConstraints(constraints);
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
      Calls the environment's _add_relation method or creates a new
      add_relation record in the ECS queue.

      Parameters match the parameters for the _add_relation method below.
      The only new parameter is the last one (ECS options).

      @method add_relation
    */
    add_relation: function(endpointA, endpointB, callback, options) {
      var ecs = this.get('ecs'),
          args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        this._add_relation.apply(this, args);
      } else {
        ecs._lazyAddRelation(args, options);
      }
    },

    /**
       Add a relation between two services.

       @method _add_relation
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
    _add_relation: function(endpointA, endpointB, callback) {
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
      if (response && response.Endpoints) {
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
      Calls the environment's _remove_relation method or removes a
      remove_relation record in the ECS queue.

      Parameters match the parameters for the _remove_relation method below.
      The only new parameter is the last one (ECS options).

      @method remove_relation
    */
    remove_relation: function(endpointA, endpointB, callback, options) {
      var ecs = this.get('ecs'),
          args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        this._remove_relation.apply(this, args);
      } else {
        ecs._lazyRemoveRelation(args);
      }
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
     * @method _remove_relation
     */
    _remove_relation: function(endpointA, endpointB, callback) {
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
    },

    /**
      Make a WebSocket request to retrieve the list of changes required to
      deploy a bundle, given the bundle YAML contents or token.

      @method getBundleChanges
      @param {String} bundleYAML The bundle YAML file contents.
      @param {String} changesToken The token identifying a bundle change set
        (ignored if bundleYAML is provided).
      @param {Function} callback The user supplied callback to send the bundle
        changes response to after proper post processing. The callback receives
        an object with an "errors" attribute containing possible errors and
        with a "changes" attribute with the list of bundle changes.
        Detailed responses for the legacy GUI server calls can be found at
        http://bazaar.launchpad.net/~juju-gui/charms/trusty/juju-gui/trunk/
                      view/head:/server/guiserver/bundles/__init__.py#L322
    */
    getBundleChanges: function(bundleYAML, changesToken, callback) {
      self = this;
      // Define callbacks for both legacy and new Juju API calls.
      var handleLegacy = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by ChangeSet.GetChanges:', data);
          return;
        }
        userCallback({
          errors: data.Error && [data.Error] || data.Response.Errors,
          changes: data.Response && data.Response.Changes
        });
      };
      var handle = function(userCallback, data) {
        if (data.ErrorCode === 'not implemented') {
          // The current Juju API server does not support
          // Client.GetBundleChanges calls. Fall back to the GUI server call.
          self._send_rpc({
            Type: 'ChangeSet',
            Request: 'GetChanges',
            Params: params
          }, handleLegacy.bind(self, userCallback));
          return;
        }
        if (!userCallback) {
          console.log('data returned by Client.GetBundleChanges:', data);
          return;
        }
        userCallback({
          errors: data.Error && [data.Error] || data.Response.errors,
          changes: data.Response && data.Response.changes
        });
      };
      // Prepare the request parameters.
      var params = Object.create(null);
      if (bundleYAML !== null) {
        params.YAML = bundleYAML;
      } else {
        params.Token = changesToken;
      }
      // Send the request to retrieve bundle changes from Juju.
      self._send_rpc({
        Type: 'Client',
        Request: 'GetBundleChanges',
        Params: params
      }, handle.bind(self, callback));
    },

    // EnvironmentManager facade API endpoints.
    // XXX frankban: facade management should be improved. We should store
    // the list of facades and their corresponding available versions upon
    // login, and then activate/deactivate the ability to perform specific
    // API calls based on the server capabilities. Also, facades could help
    // namespacing client functions, so that we don't store all the API calls
    // inside a common namespace, resulting in a more organized code. Perhaps
    // this can be done as part of creating an external JavaScript API library.
    environmentManagerFacadeVersion: 1,

    /**
      Create an environment within this system, using the given name.

      @method createEnv
      @param {String} envName The name of the new environment.
      @param {String} userTag The name of the new environment owner, including
        the "user-" prefix.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the following attributes if everything went well:
        - name: the name of the new environment;
        - owner: the environment owner tag;
        - uuid: the unique identifier of the new environment.
      @return {undefined} Sends a message to the server only.
    */
    createEnv: function(envName, userTag, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback. No context is passed.
        intermediateCallback = this._handleCreateEnv.bind(null, callback);
      } else {
        intermediateCallback = function(callback, data) {
          console.log('createEnv done: err:', data.Error);
        };
      }
      // In order to create a new environment, we first need to retrieve the
      // configuration skeleton for this provider.
      this._send_rpc({
        Type: 'EnvironmentManager',
        Version: this.environmentManagerFacadeVersion,
        Request: 'ConfigSkeleton',
      }, data => {
        if (data.Error) {
          intermediateCallback({
            Error: 'cannot get configuration skeleton: ' + data.Error
          });
          return;
        };
        var config = data.Response.Config;
        // Then, having the configuration skeleton, we need configuration
        // options for this specific environment.
        this.environmentGet(data => {
          if (data.err) {
            intermediateCallback({
              Error: 'cannot get environment configuration: ' + data.err
            });
            return;
          }
          config.name = envName;
          // XXX frankban: juju-core should not require clients to provide SSH
          // keys at this point, but only when strictly necessary. Provide an
          // invalid one for now.
          config['authorized-keys'] = 'ssh-rsa INVALID';
          var ptype = this.get('providerType');
          switch(ptype) {
            case 'local':
              config.namespace = data.config.namespace;
              break;
            case 'ec2':
              config['access-key'] = data.config['access-key'];
              config['secret-key'] = data.config['secret-key'];
              break;
            case 'openstack':
              config['tenant-name'] = data.config['tenant-name'];
              config.username = data.config.username;
              config.password = data.config.password;
              break;
            case 'maas':
              config['maas-server'] = data.config['maas-server'];
              config['maas-oauth'] = data.config['maas-oauth'];
              config['maas-agent-name'] = data.config['maas-agent-name'];
              break;
            default:
              // XXX frankban: add support for the remaining Juju providers.
              intermediateCallback({
                Error: ptype + ' provider is not supported yet'
              });
              return;
          }
          // At this point, having both skeleton and environment options, we
          // are ready to create the new environment in this system.
          this._send_rpc({
            Type: 'EnvironmentManager',
            Version: this.environmentManagerFacadeVersion,
            Request: 'CreateEnvironment',
            Params: {OwnerTag: userTag, Config: config}
          }, intermediateCallback);
        });
      });
    },

    /**
      Transform the data returned from the juju-core createEnv call into that
      suitable for the user callback.

      @method _handleCreateEnv
      @static
      @param {Function} callback The originally submitted callback.
      @param {Object} data The response returned by the server.
    */
    _handleCreateEnv: function(callback, data) {
      var transformedData = {
        err: data.Error,
      };
      if (!data.Error) {
        var response = data.Response;
        transformedData.name = response.Name;
        transformedData.owner = response.OwnerTag;
        transformedData.uuid = response.UUID;
      }
      // Call the original user callback.
      callback(transformedData);
    },

  /**
      List all environments the user can access on the current system.

      @method listEnvs
      @param {String} userTag The name of the new environments owner, including
        the "user-" prefix.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the "envs" attribute if everything went well. The
        "envs" field will contain a list of objects, each one representing an
        environment with the following attributes:
        - name: the name of the environment;
        - owner: the environment owner tag;
        - uuid: the unique identifier of the environment;
        - lastConnection: the date of the last connection as a string, e.g.:
          '2015-09-24T10:08:50Z' or null if the environment has been never
          connected to;
      @return {undefined} Sends a message to the server only.
    */
    listEnvs: function(userTag, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback. No context is passed.
        intermediateCallback = this._handleListEnvs.bind(null, callback);
      }
      this._send_rpc({
        Type: 'EnvironmentManager',
        Version: this.environmentManagerFacadeVersion,
        Request: 'ListEnvironments',
        Params: {Tag: userTag}
      }, intermediateCallback);
    },

    /**
      Transform the data returned from the juju-core listEnvs call into that
      suitable for the user callback.

      @method _handleListEnvs
      @static
      @param {Function} callback The originally submitted callback.
      @param {Object} data The response returned by the server.
    */
    _handleListEnvs: function(callback, data) {
      var transformedData = {
        err: data.Error,
      };
      if (!data.Error) {
        var response = data.Response;
        transformedData.envs = response.UserEnvironments.map(function(value) {
          return {
            name: value.Name,
            owner: value.OwnerTag,
            uuid: value.UUID,
            lastConnection: value.LastConnection
          };
        });
      }
      // Call the original user callback.
      callback(transformedData);
    }

  });


  environments.endpointToName = endpointToName;
  environments.createRelationKey = createRelationKey;
  environments.GoEnvironment = GoEnvironment;
  environments.lowerObjectKeys = lowerObjectKeys;
  environments.stringifyObjectValues = stringifyObjectValues;
  environments.machineJobs = machineJobs;

  var KVM = {label: 'LXC', value: 'lxc'},
      LXC = {label: 'KVM', value: 'kvm'};

  // Define features exposed by each Juju provider type.
  // To enable/disable containerization in the machine view, just add/remove
  // supportedContainerTypes to the provider types below.
  environments.providerFeatures = {
    // All container types (used when the "containers" feature flags is set).
    all: {
      supportedContainerTypes: [KVM, LXC]
    },
    // Microsoft Azure.
    azure: {
      supportedContainerTypes: []
    },
    // Sandbox mode.
    demonstration: {
      supportedContainerTypes: [KVM, LXC]
    },
    // Amazon EC2.
    ec2: {
      supportedContainerTypes: []
    },
    // Joyent Cloud.
    joyent: {
      supportedContainerTypes: []
    },
    // Local (LXC).
    local: {
      supportedContainerTypes: []
    },
    // Canonical MAAS.
    maas: {
      supportedContainerTypes: [KVM, LXC]
    },
    // OpenStack or HP Public Cloud.
    openstack: {
      supportedContainerTypes: []
    },
    // Manual provider.
    manual: {
      supportedContainerTypes: []
    }
  };

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify',
    'juju-env-base',
    'juju-view-utils'
  ]
});
