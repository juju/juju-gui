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

  // Define the Admin API facade versions for Juju 1 and 2.
  var ADMIN_FACADE_VERSION_JUJU1 = 0;
  var ADMIN_FACADE_VERSION_JUJU2 = 3;

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

  // Define the special machine scope used to specify unit placements.
  var MACHINE_SCOPE = '#';

  /**
    Attempt to parse the specified string and create a corresponding placement
    structure, with Scope and Directive fields.

    @method parsePlacement
    @param {String} toMachine The string placement.
    @return {Object} A structure including Scope and Directive fields, or
      null if no placement is specified.
  */
  var parsePlacement = function(toMachine) {
    if (!toMachine) {
      return null;
    }
    var parts = toMachine.split(':');
    if (parts.length === 2) {
      return {Scope: parts[0], Directive: parts[1]};
    }
    var part = parts[0];
    if (part === LXC.value || part === KVM.value) {
      return {Scope: part, Directive: ''};
    }
    return {Scope: MACHINE_SCOPE, Directive: part};
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
      Some default facades are always assumed to be present, even in old
      versions of Juju not returning facades on login. Base client, watcher and
      pinger facades are part of this list. Also facades historically
      implemented by the GUI server are included.

      @property defaultFacades
      @type {Object}
    */
    defaultFacades: {
      // Default Juju API facades.
      AllWatcher: [0],
      Client: [0],
      Pinger: [0],
      // Custom GUI server types.
      ChangeSet: [0],
      GUIToken: [0]
    },

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
      this._allWatcherId = null;
      this._pinger = null;
      // pendingLoginResponse is set to true when the login process is running.
      this.pendingLoginResponse = false;
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
      var facade = op.Type;
      // The facades info is only available after logging in (as the facades
      // are sent as part of the login response). For this reason, do not
      // check if the "Admin" facade is supported, but just assume it is,
      // otherwise even logging in ("Admin.Login") would be impossible.
      var version = op.Version;
      if (facade !== 'Admin') {
        version = this.findFacadeVersion(facade, version);
      }
      if (version === null) {
        callback({
          Error: 'operation not supported by API server: ' + JSON.stringify(op)
        });
        return;
      }
      if (this.ws.readyState !== 1) {
        console.log(
          'Websocket is not open, dropping request. ' +
          'readyState: ' + this.ws.readyState, msg);
        return;
      }
      op.Version = version;
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
            annotationInfo: 5,
            remoteserviceInfo: 100
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
      Stop the Juju mega-watcher currently in use.

      @method _stopWatching
      @param {Function} callback A callable that must be called once the
        operation is performed.
      @private
    */
    _stopWatching: function(callback) {
      var cb = function() {
        this._allWatcherId = null;
        callback();
      }.bind(this);
      this._send_rpc({
        Type: 'AllWatcher',
        Request: 'Stop',
        Id: this._allWatcherId,
        Params: {}
      }, cb);
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
        // Starting from Juju 2.0, "Facades" is spelled "facades".
        var facadeList = response.facades || response.Facades || [];
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
        if (!this._pinger) {
          this._pinger = setInterval(
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
      this.fire('login', {data: {
        result: this.userIsAuthenticated,
        error: data.Error || null,
        fromToken: fromToken
      }});
    },

    /**
      Return a version for the given facade name which is supported by the
      current Juju controller. If a version is provided, return the version
      number itself if supported, or null if that specific version is not
      served by the controller. Otherwise, if no version is specified, return
      the most recent supported version or null if the facade is not found.

      @method findFacadeVersion
      @param {String} name The facade name (for instance "Service").
      @param {Int} version The optional facade version (for instance 1 or 2).
      @return {Int} The facade version or null if facade is not supported.
    */
    findFacadeVersion: function(name, version) {
      var facades = this.get('facades') || {};
      var versions = facades[name] || this.defaultFacades[name] || [];
      if (!versions.length) {
        return null;
      }
      if (version === undefined || version === null) {
        return versions[versions.length - 1];
      }
      if (versions.indexOf(version) > -1) {
        return version;
      }
      return null;
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
      if (!credentials.user || !credentials.password) {
        console.warn('attempted login without providing credentials');
        this.fire('login', {data: {result: false}});
        return;
      }
      var version = ADMIN_FACADE_VERSION_JUJU1;
      var params = {
        AuthTag: credentials.user,
        Password: credentials.password
      };
      // If the user is connecting to juju-core 2.0 or higher then we need
      // to use the new params arguments. This is comparing against '2'
      // because Juju doesn't properly stick to semver and sometimes returns
      // versions that do not properly validate as semver.
      if (utils.compareSemver(this.get('jujuCoreVersion'), '2') > -1) {
        version = ADMIN_FACADE_VERSION_JUJU2;
        params = {
          'auth-tag': credentials.user,
          credentials: credentials.password
        };
      }
      this._send_rpc({
        Type: 'Admin',
        Request: 'Login',
        Params: params,
        Version: version
      }, this.handleLogin);
      this.pendingLoginResponse = true;
    },

    /**
      Log into the Juju API using macaroon authentication if provided.

      @method loginWithMacaroon
      @param {Object} bakery The bakery client to use to handle macaroons.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error string if an error
        occurred or null if authentication succeeded.
      @return {undefined} Sends a message to the server only.
    */
    loginWithMacaroon: function(bakery, callback) {
      if (this.pendingLoginResponse) {
        return;
      }

      // Ensure we always have a callback.
      var cback = function(err, response) {
        this.handleLogin({Error: err, Response: response});
        if (callback) {
          callback(err);
          return;
        }
        if (err) {
          console.warn('macaroon authentication failed:', err);
          return;
        }
        console.debug('macaroon authentication succeeded');
      }.bind(this);

      // Ensure this type of login is supported.
      if (utils.compareSemver(this.get('jujuCoreVersion'), '2') === -1) {
        cback('macaroon auth requires Juju 2');
        return;
      }

      // Define the handler reacting to Juju controller login responses.
      var handleResponse = function(bakery, macaroons, cback, data) {
        if (data.Error) {
          // Macaroon authentication failed or macaroons based authentication
          // not supported by this controller. In the latter case, the
          // controller was probably not bootstrapped with an identity manager,
          // for instance by providing the following parameter to bootstrap:
          // "--config identity-url=https://api.jujucharms.com/identity".
          cback('authentication failed: ' + data.Error);
          return;
        }

        var response = data.Response;
        var macaroon = response['discharge-required'];
        if (macaroon) {
          // This is a discharge required response.
          bakery.discharge(macaroon, (macaroons) => {
            // Send the login request again including the discharge macaroon.
            sendLoginRequest(
              macaroons, handleResponse.bind(this, bakery, macaroons, cback));
          }, (msg) => {
            cback('macaroon discharge failed: ' + msg);
          });
          return;
        }

        // Macaroon authentication succeeded!
        var user = response['user-info'] && response['user-info'].identity;
        if (!user) {
          // This is a beta version of Juju 2 which does not include user info
          // in the macaroons based login response. Unfortunately, we did all
          // of this for nothing.
          cback('authentication failed: use a proper Juju 2 release');
          return;
        }
        this.setCredentials({macaroons: macaroons, user: user});
        cback(null, response);
      };


      // Define the function used to send the login request.
      var sendLoginRequest = function(macaroons, callback) {
        var request = {
          Type: 'Admin',
          Request: 'Login',
          Version: ADMIN_FACADE_VERSION_JUJU2
        };
        if (macaroons) {
          request.Params = {macaroons: [macaroons]};
        }
        this._send_rpc(request, callback);
      }.bind(this);

      // Perform the API call.
      var macaroons = this.getCredentials().macaroons;
      sendLoginRequest(
        macaroons,
        handleResponse.bind(this, bakery, macaroons, cback)
      );
      this.pendingLoginResponse = true;
    },

    /**
      Define optional operations to be performed before closing the WebSocket
      connection. Operations performed:
        - the pinger interval is stopped;
        - the mega-watcher is stopped.
      Note that not stopping the mega-watcher before disconnecting causes
      server side disconnection to take a while, therefore preventing new
      connections from being established (for instance when switching between
      models in  controller).

      @method beforeClose
      @param {Function} callback A callable that must be called by the
        function and that actually closes the connection.
    */
    beforeClose: function(callback) {
      if (this._pinger) {
        clearInterval(this._pinger);
        this._pinger = null;
      }
      this._stopWatching(callback);
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
     * @method _handleEnvironmentInfo
     * @param {Object} data The response returned by the server.
     * @return {undefined} Nothing.
     */
    _handleEnvironmentInfo: function(data) {
      if (data.Error) {
        console.warn('Error retrieving model information.');
        return;
      }
      // Store default series and provider type in the env.
      var response = data.Response;
      this.set('defaultSeries', response.DefaultSeries);
      this.set('providerType', response.ProviderType);
      this.set('environmentName', response.Name);
      // For now we only need to call environmentGet if the provider is MAAS.
      if (response.ProviderType !== 'maas') {
        // Set the MAAS server to null, so that subscribers waiting for this
        // attribute to be set can be released.
        this.set('maasServer', null);
        return;
      }
      this.environmentGet(data => {
        if (data.err) {
          console.warn('error calling ModelGet API: ' + data.err);
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
      var request = 'ModelInfo';
      if (this.findFacadeVersion('Client') === 0) {
        request = 'EnvironmentInfo';
      }
      this._send_rpc({
        Type: 'Client',
        Request: request
      }, this._handleEnvironmentInfo);
    },

    /**
      Return information about Juju models, such as their names, series, and
      provider types, by performing a ModelManager.ModelInfo Juju API request.

      @method modelInfo
      @param {Array} tags The Juju tags of the models, each one being a string,
        for instance "model-5bea955d-7a43-47d3-89dd-b02c923e2447".
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred). Otherwise, if everything went well, it will receive an
        object with a "models" attribute containing an array of model info,
        each one with the following fields :
        - tag: the original Juju model tag;
        - name: the model name, like "admin" or "mymodel";
        - series: the model default series, like "trusty" or "xenial";
        - provider: the provider type, like "lxd" or "aws";
        - uuid: the model unique identifier;
        - serverUuid: the corresponding controller unique identifier;
        - ownerTag: the Juju tag of the user owning the model;
        - life: the lifecycle status of the model: "alive", "dying" or "dead";
        - isAlive: whether the model is alive or dying/dead;
        - isAdmin: whether the model is an admin model;
        - err: a message describing a specific model error, or undefined.
      @return {undefined} Sends a message to the server only.
    */
    modelInfo: function(tags, callback) {
      // Decorate the user supplied callback.
      var handler = function(userCallback, tags, data) {
        if (!userCallback) {
          console.log('data returned by model info API call:', data);
          return;
        }
        var err = data.Error && data.Error.Message;
        if (err) {
          userCallback({err: err});
          return;
        }
        var results = data.Response.results;
        if (results.length !== tags.length) {
          // Sanity check: this should never happen.
          userCallback({
            err: 'unexpected results: ' + JSON.stringify(results)
          });
          return;
        }
        var models = results.map(function(result, index) {
          err = result.error && result.error.Message;
          if (err) {
            return {tag: tags[index], err: err};
          }
          result = result.result;
          return {
            tag: tags[index],
            name: result.Name,
            series: result.DefaultSeries,
            provider: result.ProviderType,
            uuid: result.UUID,
            serverUuid: result.ServerUUID,
            ownerTag: result.OwnerTag,
            life: result.Life,
            isAlive: result.Life === 'alive',
            isAdmin: result.UUID === result.ServerUUID
          };
        });
        userCallback({models: models});
      }.bind(this, callback, tags);

      // Send the API request.
      var entities = tags.map(function(tag) {
        return {Tag: tag};
      });
      this._send_rpc({
        Type: 'ModelManager',
        Request: 'ModelInfo',
        Params: {Entities: entities}
      }, handler);
    },

    /**
      Return detailed information about Juju models available for current user.
      Under the hood, this call leverages the ModelManager ListModels and
      ModelInfo endpoints.

      @method listModelsWithInfo
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments, the first
        an error or null and the second an object with a "models" attribute
        containing an array of model info, each one with the following fields:
        - tag: the original Juju model tag;
        - name: the model name, like "admin" or "mymodel";
        - series: the model default series, like "trusty" or "xenial";
        - provider: the provider type, like "lxd" or "aws";
        - uuid: the model unique identifier;
        - serverUuid: the corresponding controller unique identifier;
        - ownerTag: the Juju tag of the user owning the model;
        - life: the lifecycle status of the model: "alive", "dying" or "dead";
        - isAlive: whether the model is alive or dying/dead;
        - isAdmin: whether the model is an admin model;
        - lastConnection: the date of the last connection as a string, e.g.:
          '2015-09-24T10:08:50Z' or null if the model was never connected to;
        - err: a message describing a specific model error, or undefined.
      @return {undefined} Sends a message to the server only.
    */
    listModelsWithInfo: function(callback) {
      // Ensure we always have a callback.
      if (!callback) {
        callback = function(err, data) {
          console.log('listModelsWithInfo: No callback provided');
          if (err) {
            console.log('listModelsWithInfo: API call error:', err);
          } else {
            console.log('listModelsWithInfo: API call data:', data);
          }
        };
      }

      // Retrieve the current user tag.
      var credentials = this.getCredentials();
      if (!credentials.user) {
        callback('called without credentials', null);
        return;
      }

      // Perform the API calls.
      this.listModels(credentials.user, (listData) => {
        if (listData.err) {
          callback(listData.err, null);
          return;
        }
        var tags = listData.envs.map(function(model) {
          return model.tag;
        });
        this.modelInfo(tags, (infoData) => {
          if (infoData.err) {
            callback(infoData.err, null);
            return;
          }
          var models = infoData.models.map(function(model, index) {
            if (model.err) {
              return {tag: model.tag, err: model.err};
            }
            return {
              tag: model.tag,
              name: model.name,
              series: model.series,
              provider: model.provider,
              uuid: model.uuid,
              serverUuid: model.serverUuid,
              ownerTag: model.ownerTag,
              life: model.life,
              isAlive: model.isAlive,
              isAdmin: model.isAdmin,
              lastConnection: listData.envs[index].lastConnection
            };
          });
          callback(null, {models: models});
        });
      });
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
      var facade = 'Client';
      var version = this.findFacadeVersion(facade);
      var request = version === 0 ? 'EnvironmentGet' : 'ModelGet';
      this._send_rpc({
        Type: facade,
        Request: request
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
      // TODO frankban: allow macaroons based auth here.
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
      // TODO frankban: allow macaroons based auth here.
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
      // TODO frankban: allow macaroons based auth here.
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
      Calls the environment's _addCharm method or creates a new addCharm record
      in the ECS queue.

      Parameters match the parameters for the _addCharm method below.
      The only new parameter is the last one (ECS options).

      @method addCharm
    */
    addCharm: function(url, macaroon, callback, options) {
      var ecs = this.get('ecs');
      var args = ecs._getArgs(arguments);
      if (options && options.immediate) {
        // Call the _addCharm method right away bypassing the queue.
        this._addCharm.apply(this, args);
      } else {
        // XXX frankban: ecs._lazyAddCharm is not yet implemented.
        ecs._lazyAddCharm(arguments);
      }
    },

    /**
      Add a charm to the Juju state server.

      @method _addCharm
      @param {String} url The URL of the charm. It must include the revision.
      @param {Object} macaroon The optional JSON encoded delegatable macaroon
        to use in order to authorize access to a non-public charm. This is only
        required when adding non-public charms.
      @param {Function} callback A callable that must be called once the
        operation is performed. The callback is called passing an object like
        the following:
          {
            err: 'optional error',
            url: 'provided charm URL'
          }
      @return {undefined} Sends a message to the server only.
    */
    _addCharm: function(url, macaroon, callback) {
      // Define the API callback.
      var handleAddCharm = function(userCallback, url, data) {
        if (!userCallback) {
          console.log('data returned by addCharm API call:', data);
          return;
        }
        userCallback({err: data.Error, url: url});
      }.bind(this, callback, url);

      // Build the API call parameters.
      var request = {
        Type: 'Client',
        Request: 'AddCharm',
        Params: {URL: url}
      };
      if (macaroon) {
        request.Request = 'AddCharmWithAuthorization';
        request.Params.CharmStoreMacaroon = macaroon;
      }

      // Perform the API call.
      this._send_rpc(request, handleAddCharm);
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
      var serviceFacadeVersion = this.findFacadeVersion('Service');

      // Define the API callback.
      var handleDeploy = function(userCallback, serviceName, charmUrl, data) {
        if (!userCallback) {
          console.log('data returned by deploy API call:', data);
          return;
        }
        if (serviceFacadeVersion !== null) {
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
      switch (serviceFacadeVersion) {
        case 0:
        case 1:
        // Intentionally falling through.
        case 2:
          this._send_rpc({
            Type: 'Service',
            Request: 'ServicesDeploy',
            Params: {Services: [serviceParams]}
          }, handleDeploy);
          break;
        case 3:
          this._send_rpc({
            Type: 'Service',
            Request: 'Deploy',
            Params: {Services: [serviceParams]}
          }, handleDeploy);
          break;
        default:
          // Fall back to legacy deployment.
          this._send_rpc({
            Type: 'Client',
            Request: 'ServiceDeploy',
            Params: serviceParams
          }, handleDeploy);
      }
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
    destroyMachines: function(names, force, callback, options) {
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
      Update an existing service in the Juju model.
      By using this API call, it is possible to update any or all of the
      following service attributes:
        - its charm URL;
        - its settings (charm configuration options);
        - its constraints;
        - its minimum number of units.

      @method updateService
      @param {String} service The name of the service to be updated.
      @param {Object} args An object with any or all of the following fields:
        - url (String): the charm URL;
        - forceUnits (Bool): whether to force units when upgrading the URL;
        - forceSeries (Bool): whether to force series when upgrading the URL;
        - settings (Object): the configuration key/value pairs;
        - constraints (Object): the constraints;
        - minUnits (Integer): the minimum number of units for this service.
      @param {Function} callback A callable that must be called once the
        operation is performed. The callback receives an object with all the
        attributes in args with two additional fields:
        - service: the name of the service;
        - err: optional error encountered in the process.
    */
    updateService: function(service, args, callback) {
      // Decorate the user supplied callback.
      var handler = function(userCallback, service, args, data) {
        if (!userCallback) {
          console.log('data returned by service update API call:', data);
          return;
        }
        var response = {service: service, err: data.Error};
        Object.keys(args).forEach((key) => {
          response[key] = args[key];
        });
        userCallback(response);
      }.bind(this, callback, service, args);

      // Prepare the request parameters.
      var version = this.findFacadeVersion('Service') || 0;
      var params = {ServiceName: service};
      if (args.url) {
        params.CharmUrl = args.url;
        var forceUnits = !!args.forceUnits;
        var forceSeries = !!args.forceSeries;
        if (version >= 3) {
          params.ForceCharmUrl = forceUnits;
          params.ForceSeries = forceSeries;
        } else {
          // Because the call signature has changed a bit to properly set
          // force on the old facade we will force if either of the forced
          // values are truthy.
          params.ForceCharmUrl = forceUnits || forceSeries;
        }
      }
      if (args.settings) {
        params.SettingsStrings = stringifyObjectValues(args.settings);
      }
      if (args.constraints) {
        params.Constraints = this.prepareConstraints(args.constraints);
      }
      if (args.minUnits)  {
        params.MinUnits = args.minUnits;
      }

      // Perform the API call.
      var request = {Type: 'Service', Request: 'Update', Params: params};
      if (version < 3) {
        // Use legacy Juju API on the CLient facade for updating services.
        request = {Type: 'Client', Request: 'ServiceUpdate', Params: params};
      }
      this._send_rpc(request, handler);
    },

    /**
       Set a service's charm.

       @method setCharm
       @param {String} service The name of the service to be upgraded.
       @param {String} url The URL of the charm.
       @param {Boolean} forceUnits Force the units when upgrading.
       @param {Boolean} forceSeries Force the series when upgrading.
       @param {Function} callback A callable that must be called once the
         operation is performed.
       @return {undefined} Sends a message to the server only.
    */
    setCharm: function(service, url, forceUnits, forceSeries, callback) {
      var args = {url: url, forceUnits: forceUnits, forceSeries: forceSeries};
      this.updateService(service, args, function(data) {
        if (!callback) {
          return;
        }
        callback({
          err: data.err,
          service_name: data.service,
          charm_url: data.url
        });
      });
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
      // Define the API callback.
      var handleAddUnit = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by addUnit API call:', data);
          return;
        }
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
      }.bind(this, callback);

      // Make the call.
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use legacy Juju API for adding units.
        this._send_rpc({
          Type: 'Client',
          Request: 'AddServiceUnits',
          Params: {
            ServiceName: service,
            NumUnits: numUnits,
            ToMachineSpec: toMachine
          }
        }, handleAddUnit);
        return;
      }
      this._send_rpc({
        Type: 'Service',
        Request: 'AddUnits',
        Params: {
          ServiceName: service,
          NumUnits: numUnits,
          Placement: [parsePlacement(toMachine)]
        }
      }, handleAddUnit);
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
    remove_units: function(unitNames, callback, options) {
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
     * @param {Array} unitNames The units to be removed.
     * @param {Function} callback A callable that must be called once the
     *   operation is performed. Normalized data, including the unitNames
     *   is passed to the callback.
     */
    _remove_units: function(unitNames, callback) {
      // Define the API callback.
      var handleRemoveUnits = function(userCallback, unitNames, data) {
        if (!userCallback) {
          console.log('data returned by DestroyUnits API call:', data);
          return;
        }
        userCallback({err: data.Error, unit_names: unitNames});
      }.bind(this, callback, unitNames);

      // Perform the API call.
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use legacy Juju API for destroying units.
        this._send_rpc({
          Type: 'Client',
          Request: 'DestroyServiceUnits',
          Params: {UnitNames: unitNames}
        }, handleRemoveUnits);
        return;
      }
      this._send_rpc({
        Type: 'Service',
        Request: 'DestroyUnits',
        Params: {UnitNames: unitNames}
      }, handleRemoveUnits);
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
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use the legacy API call (Juju < 2.0).
        this._send_rpc({
          Type: 'Client',
          Request: 'ServiceExpose',
          Params: {ServiceName: service}
        }, intermediateCallback);
        return;
      }
      this._send_rpc({
        Type: 'Service',
        Request: 'Expose',
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
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use the legacy API call (Juju < 2.0).
        this._send_rpc({
          Type: 'Client',
          Request: 'ServiceUnexpose',
          Params: {ServiceName: service}
        }, intermediateCallback);
        return;
      }
      this._send_rpc({
        Type: 'Service',
        Request: 'Unexpose',
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
     *   environment, e.g. '0', 'mysql-0', or 'mysql'.
     * @param {String} type The type of entity that is being annotated
     *   (e.g.: 'service', 'unit', 'machine', 'environment').
     * @param {Object} data A dictionary of key, value pairs.
     * @return {undefined} Nothing.
     * @method update_annotations
     */
    update_annotations: function(entity, type, data, callback) {
      var version = this.findFacadeVersion('Annotations') || 0;

      // Decorate the user supplied callback.
      var handler = function(userCallback, entity, data) {
        if (!userCallback) {
          return;
        }
        var response = {entity: entity};
        if (data.Error) {
          response.err = data.Error;
          userCallback(response);
          return;
        }
        if (version >= 2) {
          // New API allows setting annotations in bulk, so we can have an
          // error for each entity result.
          var result = data.Response.Results[0];
          if (result.Error) {
            response.err = result.Error;
          }
        }
        userCallback(response);
      }.bind(this, callback, entity);

      // Prepare the API request.
      var tag = type + '-' + entity;
      data = stringifyObjectValues(data);

      // Perform the request to set annotations.
      if (version < 2) {
        // Use legacy Juju API on the Client facade for setting annotations.
        this._send_rpc({
          Type: 'Client',
          Request: 'SetAnnotations',
          Params: {Tag: tag, Pairs: data}
        }, handler);
        return;
      }
      this._send_rpc({
        Type: 'Annotations',
        Request: 'Set',
        Params: {
          Annotations: [{EntityTag: tag, Annotations: data}]
        }
      }, handler);
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
      var data = keys.reduce(function(collected, key) {
        collected[key] = '';
        return collected;
      }, {});
      this.update_annotations(entity, type, data, callback);
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
      var handler;
      var tag = type + '-' + entity;
      var version = this.findFacadeVersion('Annotations');

      if (version === null || version < 2) {
        // Use legacy Juju API on the Client facade for getting annotations.
        handler = function(userCallback, entity, data) {
          if (!userCallback) {
            console.log('data returned by GetAnnotations API call:', data);
            return;
          }
          userCallback({
            err: data.Error,
            entity: entity,
            results: data.Response && data.Response.Annotations
          });
        }.bind(this, callback, entity);
        this._send_rpc({
          Type: 'Client',
          Request: 'GetAnnotations',
          Params: {Tag: tag}
        }, handler);
        return;
      }

      handler = function(userCallback, entity, data) {
        if (!userCallback) {
          console.log('data returned by Annotations.Get API call:', data);
          return;
        }
        var response = {entity: entity};
        if (data.Error) {
          response.err = data.Error;
          userCallback(response);
          return;
        }
        var result = data.Response.Results[0];
        if (result.Error) {
          response.err = result.Error;
          userCallback(response);
          return;
        }
        response.results = result.Annotations;
        userCallback(response);
      }.bind(this, callback, entity);
      this._send_rpc({
        Type: 'Annotations',
        Request: 'Get',
        Params: {Entities: [{Tag: tag}]}
      }, handler);
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
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use legacy call on the Client facade.
        this._send_rpc({
          Type: 'Client',
          Request: 'ServiceGet',
          Params: {ServiceName: serviceName}
        }, intermediateCallback);
        return;
      }
      this._send_rpc({
        Type: 'Service',
        Request: 'Get',
        Params: {ServiceName: serviceName}
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

      @method set_config
    */
    set_config: function(serviceName, config, callback, options) {
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
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object containing:
        - err: a string describing the problem (if an error occurred);
        - service_name: the name of the service;
        - newValues: the new configuration options.
    */
    _set_config: function(serviceName, config, callback) {
      this.updateService(serviceName, {settings: config}, function(data) {
        if (!callback) {
          return;
        }
        callback({
          err: data.err,
          service_name: serviceName,
          newValues: config
        });
      });
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
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use legacy Juju API for destroying services.
        this._send_rpc({
          Type: 'Client',
          Request: 'ServiceDestroy',
          Params: {ServiceName: service}
        }, intermediateCallback);
        return;
      }
      this._send_rpc({
        Type: 'Service',
        Request: 'Destroy',
        Params: {ServiceName: service}
      }, intermediateCallback);
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
      // Define relation endpoints.
      var epA = endpointToName(endpointA);
      var epB = endpointToName(endpointB);

      // Define the API callback.
      var handleAddRelation = function(userCallback, epA, epB, data) {
        if (!userCallback) {
          console.log('data returned by AddRelation API call:', data);
          return;
        }
        var result = {};
        var response = data.Response;
        if (response && response.Endpoints) {
          var serviceNameA = epA.split(':')[0];
          var serviceNameB = epB.split(':')[0];
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
          endpoint_a: epA,
          endpoint_b: epB,
          err: data.Error,
          result: result
        });
      }.bind(this, callback, epA, epB);

      // Send the API request.
      var request = {
        Type: 'Service',
        Request: 'AddRelation',
        Params: {
          Endpoints: [epA, epB]
        }
      };
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use legacy Juju API for adding relations.
        request.Type = 'Client';
      }
      this._send_rpc(request, handleAddRelation);
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
      // Define relation endpoints.
      var epA = endpointToName(endpointA);
      var epB = endpointToName(endpointB);

      // Define the API callback.
      var handleRemoveRelation = function(userCallback, epA, epB, data) {
        if (!userCallback) {
          console.log('data returned by DestroyRelation API call:', data);
          return;
        }
        userCallback({err: data.Error, endpoint_a: epA, endpoint_b: epB});
      }.bind(this, callback, epA, epB);

      // Send the API request.
      var request = {
        Type: 'Service',
        Request: 'DestroyRelation',
        Params: {
          Endpoints: [epA, epB]
        }
      };
      var version = this.findFacadeVersion('Service');
      if (version === null || version < 3) {
        // Use legacy Juju API for removing relations.
        request.Type = 'Client';
      }
      this._send_rpc(request, handleRemoveRelation);
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

    /**
      Make service endpoints available for consumption.

      @method offer
      @param {String} service The name of the service being offered.
      @param {Array of strings} endpoints The offered endpoint names.
      @param {String} url The URL to use to reference the resulting remote
        service. For instance "local:/u/admin/ec2/django".
        If empty, a URL is automatically generated using the
        "local:/u/$user/$env-name/$service" pattern.
      @param {Array of strings} users Users that these endpoints are offered
        to. If left empty, the offer is considered public.
      @param {String} description Description for the offered service. It
        defaults to the description provided in the charm.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with the following
        attributes:
        - err: optional error, only defined if something went wrong;
        - service: the provided name of the offered service;
        - endpoints: the provided offered endpoints;
        - url: the offered service URL.
    */
    offer: function(service, endpoints, url, users, description, callback) {
      // Generate the URL if an empty one has been provided.
      // XXX frankban 2015/12/15: this will be done automatically by the
      // server, and the URL will be returned as part of the API response.
      if (!url) {
        var user = this.getCredentials().user.replace(/^user-/, '');
        var envName = this.get('environmentName');
        url = 'local:/u/' + user + '/' + envName + '/' + service;
      }

      // Define the API callback.
      var handleOffer = function(userCallback, service, endpoints, url, data) {
        if (!userCallback) {
          console.log('data returned by offer API call:', data);
          return;
        }
        var err = data.Error;
        if (!err) {
          var errResponse = data.Response.Results[0].Error;
          err = errResponse && errResponse.Message;
        }
        userCallback({
          err: err,
          service: service,
          endpoints: endpoints,
          url: url
        });
      }.bind(this, callback, service, endpoints, url);

      // Build the API call parameters.
      if (users && users.length) {
        users = users.map(function(user) {
          return 'user-' + user;
        });
      } else {
        users = ['user-public'];
      }
      var offer = {
        servicename: service,
        endpoints: endpoints,
        serviceurl: url,
        allowedusers: users,
        servicedescription: description
      };

      // Perform the API call.
      this._send_rpc({
        Type: 'CrossModelRelations',
        Request: 'Offer',
        Params: {Offers: [offer]}
      }, handleOffer);
    },

    /**
      Get all remote services that have been offered from this Juju model.
      Each returned service satisfies at least one of the the specified
      filters.

      @method listOffers
      @param {Object} filters Not implemented.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with the following
        attributes:
        - err: optional error, only defined if something went wrong;
        - results: an array of objects representing a remote service, only
          present if the request succeeded.
          Each result has the following attributes:
          - err: possible error occurred while retrieving offer;
          - service: the offered service name;
          - url: the URL used to reference the remote service;
          - charm: the charm name;
          - endpoints: the list of offered endpoints.
          Each endpoint has the following attributes:
          - name: the endpoint name (e.g. "db" or "website");
          - interface: the endpoint interface (e.g. "http" or "mysql");
          - role: the role for the endpoint ("requirer" or "provider").
    */
    listOffers: function(filters, callback) {
      // Define the API callback.
      var handleListOffers = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by listOffers API call:', data);
          return;
        }
        if (data.Error) {
          userCallback({err: data.Error, results: []});
          return;
        }
        // XXX frankban 2015/12/15: really?
        var apiResults = data.Response.results[0].result;
        var results = apiResults.map(function(apiResult) {
          if (apiResult.error) {
            return {err: apiResult.error};
          }
          var result = apiResult.result;
          return {
            service: result.servicename,
            url: result.serviceurl,
            charm: result.charmname,
            endpoints: result.endpoints.map(function(endpoint) {
              // Note that we are not really changing values or field names
              // here, we are just excluding limit and scope attributes. The
              // map method is mostly used in order to decouple API response
              // structures from internal GUI objects.
              return {
                name: endpoint.name,
                interface: endpoint.interface,
                role: endpoint.role
              };
            })
          };
        });
        userCallback({results: results});
      }.bind(this, callback);

      // Build the API call parameters.
      // XXX frankban 2015/12/15: add support for specifying filters.
      var filter = {FilterTerms: []};

      // Perform the API call.
      this._send_rpc({
        Type: 'CrossModelRelations',
        Request: 'ListOffers',
        Params: {Filters: [filter]}
      }, handleListOffers);
    },

    /**
      Retrieve offered remote service details for a given URL.

      @method getOffer
      @param {String} url The URL to the remote service.
        For instance "local:/u/admin/ec2/django".
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with the following
        attributes:
        - err: optional error, only defined if something went wrong;
        - service: the offered service name;
        - url: the URL used to reference the remote service;
        - description: the human friendly description for the remote service;
        - sourceName: the label assigned to the source Juju model;
        - sourceId: the UUID of the source Juju model;
        - endpoints: the list of offered endpoints.
          Each endpoint has the following attributes:
          - name: the endpoint name (e.g. "db" or "website");
          - interface: the endpoint interface (e.g. "http" or "mysql");
          - role: the role for the endpoint ("requirer" or "provider").
    */
    getOffer: function(url, callback) {
      // Define the API callback.
      var handleGetOffer = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by getOffer API call:', data);
          return;
        }
        var err = data.Error,
            response = {};
        if (!err) {
          response = data.Response.results[0];
          err = response.error && response.error.Message;
        }
        if (err) {
          userCallback({err: err});
          return;
        }
        var result = response.result;
        userCallback({
          service: result.servicename,
          url: result.serviceurl,
          description: result.servicedescription,
          sourceName: result.sourcelabel,
          sourceId: result.sourceenviron.replace(/^environment-/, ''),
          endpoints: result.endpoints.map(function(endpoint) {
            // Note that we are not really changing values or field names
            // here, we are just excluding limit and scope attributes. The
            // map method is mostly used in order to decouple API response
            // structures from internal GUI objects.
            return {
              name: endpoint.name,
              interface: endpoint.interface,
              role: endpoint.role
            };
          })
        });
      }.bind(this, callback);

      // Perform the API call.
      this._send_rpc({
        Type: 'CrossModelRelations',
        Request: 'ServiceOffers',
        Params: {serviceurls: [url]}
      }, handleGetOffer);
    },

    /**
      Create a new model within this controller, using the given name.

      @method createModel
      @param {String} name The name of the new model.
      @param {String} userTag The name of the new model owner, including the
        "user-" prefix.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the following attributes if everything went well:
        - name: the name of the new model;
        - owner: the model owner tag;
        - uuid: the unique identifier of the new model.
      @return {undefined} Sends a message to the server only.
    */
    createModel: function(name, userTag, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback. No context is passed.
        intermediateCallback = this._handleCreateModel.bind(null, callback);
      } else {
        intermediateCallback = function(callback, data) {
          console.log('createModel done: err:', data.Error);
        };
      }
      var facade = 'ModelManager';
      var request = 'CreateModel';
      if (this.findFacadeVersion(facade) === null) {
        // Legacy version of Juju in which "model" was called "environment".
        facade = 'EnvironmentManager';
        request = 'CreateEnvironment';
      }
      // In order to create a new model, we first need to retrieve the
      // configuration skeleton for this provider.
      this._send_rpc({
        Type: facade,
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
        // options for this specific model.
        this.environmentGet(data => {
          if (data.err) {
            intermediateCallback({
              Error: 'cannot get model configuration: ' + data.err
            });
            return;
          }
          config.name = name;
          // XXX frankban: juju-core should not require clients to provide SSH
          // keys at this point, but only when strictly necessary. Provide an
          // invalid one for now.
          config['authorized-keys'] = 'ssh-rsa INVALID';
          Object.keys(data.config).forEach((attr) => {
            // Juju returns an error if a uuid key is included in the request.
            if (attr !== 'uuid' && config[attr] === undefined) {
              config[attr] = data.config[attr];
            }
          });
          // At this point, having both skeleton and model options, we
          // are ready to create the new model in this system.
          this._send_rpc({
            Type: facade,
            Request: request,
            Params: {OwnerTag: userTag, Config: config}
          }, intermediateCallback);
        });
      });
    },

    /**
      Transform the data returned from the juju-core createModel call into that
      suitable for the user callback.

      @method _handleCreateModel
      @static
      @param {Function} callback The originally submitted callback.
      @param {Object} data The response returned by the server.
    */
    _handleCreateModel: function(callback, data) {
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
      Destroy the current connected model.

      Callers should switch the WebSocket connection to an alive model after
      receiving a successful response in the provided callback. Keeping a
      WebSocket connection to a zombie model could lead to a broken GUI state
      and exotic errors difficult to debug.
      Note that at the time the callback is called the destroyed model may
      still be included in the list of models returned by listModels or
      listModelsWithInfo calls. In the latter call, the model "isAlive"
      attribute will be false.

      @method destroyModel
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error string if an error
        occurred or null if the model deletion succeeded.
      @return {undefined} Sends a message to the server only.
    */
    destroyModel: function(callback) {
      // Decorate the user supplied callback.
      var handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by destroy model API call:', data);
          return;
        }
        userCallback(data.Error || null);
      }.bind(this, callback);

      // Send the API request.
      this._send_rpc({
        Type: 'Client',
        Request: 'DestroyModel'
      }, handler);
    },

  /**
      List all models the user can access on the current controller.

      @method listModels
      @param {String} userTag The name of the new model owner, including the
        "user-" prefix.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the "envs" attribute if everything went well. The
        "envs" field will contain a list of objects, each one representing a
        model with the following attributes:
        - name: the name of the model;
        - tag: the model tag, like "model-de1b2c16-0151-4e63-87e9-9f0950a";
        - owner: the model owner tag;
        - uuid: the unique identifier of the model;
        - lastConnection: the date of the last connection as a string, e.g.:
          '2015-09-24T10:08:50Z' or null if the model has been never
          connected to;
      @return {undefined} Sends a message to the server only.
    */
    listModels: function(userTag, callback) {
      var facade = 'ModelManager';
      var request = 'ListModels';
      var results = 'UserModels';
      if (this.findFacadeVersion(facade) === null) {
        facade = 'EnvironmentManager';
        request = 'ListEnvironments';
        results = 'UserEnvironments';
      }

      var handleListModels = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by listModels API call:', data);
          return;
        }
        var transformedData = {
          err: data.Error,
        };
        if (!data.Error) {
          var response = data.Response;
          transformedData.envs = response[results].map(function(value) {
            return {
              name: value.Name,
              tag: 'model-' + value.UUID,
              owner: value.OwnerTag,
              uuid: value.UUID,
              lastConnection: value.LastConnection
            };
          });
        }
        // Call the original user callback.
        userCallback(transformedData);
      }.bind(this, callback);

      this._send_rpc({
        Type: facade,
        Request: request,
        Params: {Tag: userTag}
      }, handleListModels);
    }

  });


  environments.endpointToName = endpointToName;
  environments.createRelationKey = createRelationKey;
  environments.GoEnvironment = GoEnvironment;
  environments.lowerObjectKeys = lowerObjectKeys;
  environments.parsePlacement = parsePlacement;
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
