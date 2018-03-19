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
 * The Go model API connection.
 *
 * @module api
 * @submodule api.go
 */

YUI.add('juju-env-api', function(Y) {
  const module = Y.juju.environments;
  const tags = module.tags;
  const utils = Y.namespace('juju.views.utils');

  // Define the error returned by Juju when the mega-watcher is stopped and
  // clients make a "Next" request.
  const ERR_STOP_WATCHER = 'watcher was stopped';

  /**
    Return a proper local charm endpoint for both the GUI in
    Juju and the GUI charm.

    @method _getCharmAPIPath
    @param {String} The model uuid for the endpoint.
    @param {String} A path fragment to update to the full path.
    @return {String} Returns the proper full path.
  */
  var _getCharmAPIPath = function(uuid, query) {
    var prefix = '/model/' + uuid + '/charms?';
    if (!window.juju_config || !window.juju_config.staticURL) {
      // We are in the GUI charm, not Juju itself.
      prefix = '/juju-core' + prefix;
    }
    return prefix + query;
  };

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
    Object.keys(endpoints).forEach(key => {
      const value = endpoints[key];
      roles[value.role] = key + ':' + value.name;
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
    Object.keys(obj).forEach(key => {
      newObj[key.toLowerCase()] = obj[key];
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
      return {scope: parts[0], directive: parts[1]};
    }
    var part = parts[0];
    if (part === LXC.value || part === LXD.value || part === KVM.value) {
      return {scope: part, directive: ''};
    }
    return {scope: MACHINE_SCOPE, directive: part};
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
    Object.keys(obj).forEach(key => {
      const value = obj[key];
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
   * The API connection to the Juju model.
   *
   * This class handles the WebSocket connection to the model API backend.
   *
   * @class GoEnvironment
   */
  function GoEnvironment(config) {
    // Invoke Base constructor, passing through arguments.
    GoEnvironment.superclass.constructor.apply(this, arguments);
  }

  GoEnvironment.NAME = 'model-api';

  Y.extend(GoEnvironment, module.BaseEnvironment, {

    /**
      A list of the valid constraints for all providers. Required
      because we cannot request these constraints from Juju yet.

      @property genericConstraints
      @type {Array}
    */
    genericConstraints: [
      'cpu-power', 'cores', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'],

    /**
      A list of the constraints that need to be integers. We require
      this list because we cannot request the valid constraints from
      Juju.

      @property integerConstraints
      @type {Array}
    */
    integerConstraints: ['cpu-power', 'cores', 'cpu-cores', 'mem', 'root-disk'],

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
      // Define the default user name for connecting to this model. It will
      // appear as predefined value in the login mask.
      this.defaultUser = 'admin';
      this._allWatcherId = null;
      this._pinger = null;
      // pendingLoginResponse is set to true when the login process is running.
      this.pendingLoginResponse = false;
      this._handleRpcResponseBound = this._handleRpcResponse.bind(this);
      document.addEventListener('_rpc_response', this._handleRpcResponseBound);
      this._allWatcherBeingStopped = false;
      // When using GISF and switching between models or going from the
      // unconnected state to a model the env properties are reset, but only
      // those that were previously set. This meant that the environmentName
      // would not be updated as when the model disconnected then the value was
      // not reset. The reason we need the value to be reset is so that when it
      // is set to the new value it fires a value change event, which in turn
      // updates the name set in the db. See onEnvironmentNameChange. For some
      // reason this can't be set to null as then it displays the name as null
      // instead of picking up that the name has not been set.
      this.setConnectedAttr('environmentName', undefined);
      // The 'loading' flag signifies if a model is fully loaded or not. Fully
      // loaded means that the connection is established, authentication is
      // finished, and the model is ready for API calls. It differs from the
      // loading/loaded and isUserAuthenticated flags because it is larger in
      // scope than either of those. Parts of the UI hide/display based on this
      // flag; for example, we don't show the sharing button while it's false.
      this.loading = false;
    },

    destructor: function() {
      document.removeEventListener(
        '_rpc_response', this._handleRpcResponseBound);
    },

    /**
     * See "app.store.env.base.BaseEnvironment.dispatch_result".
     *
     * @method dispatch_result
     * @param {Object} data The JSON contents returned by the API backend.
     * @return {undefined} Dispatches only.
     */
    dispatch_result: function(data) {
      var tid = data['request-id'];
      if (tid in this._txn_callbacks) {
        this._txn_callbacks[tid].call(this, data);
        delete this._txn_callbacks[tid];
      }
    },

    /**
     * Send a message to the server using the WebSocket connection.
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
      var facade = op.type;
      // The facades info is only available after logging in (as the facades
      // are sent as part of the login response). For this reason, do not
      // check if the "Admin" facade is supported, but just assume it is,
      // otherwise even logging in ("Admin.Login") would be impossible.
      var version = op.version;
      if (facade !== 'Admin') {
        version = this.findFacadeVersion(facade, version);
      }
      if (version === null) {
        var err = 'api client: operation not supported: ' + JSON.stringify(op);
        console.error(err);
        if (callback) {
          callback({error: err});
        }
        return;
      }
      if (this.ws.readyState !== 1) {
        console.log(
          'Websocket is not open, dropping request. ' +
          'readyState: ' + this.ws.readyState, op);
        return;
      }
      op.version = version;
      var tid = this._counter += 1;
      if (callback) {
        this._txn_callbacks[tid] = callback;
      }
      op['request-id'] = tid;
      if (!op.params) {
        op.params = {};
      }
      var msg = JSON.stringify(op);
      this.ws.send(msg);
    },

    /**
      Begin watching all Juju status.

      @method _watchAll
      @private
      @return {undefined} Sends a message to the server only.
     */
    _watchAll: function() {
      this._send_rpc({
        type: 'Client',
        request: 'WatchAll'
      }, function(data) {
        if (data.error) {
          // TODO: retry and eventually alert the user.
          console.error('cannot start the mega-watcher');
          return;
        }
        this._allWatcherId = data.response['watcher-id'];
        this._next();
      });
    },

    /**
      Process an incoming response to an RPC request.

      @method _handleRpcResponse
      @param {Object} evt The event from the RPC listener.
      @return {undefined} Nothing.
     */
    _handleRpcResponse: function(evt) {
      const data = evt.detail;
      // We do this early to get a response back fast.  Might be a bad
      // idea. :-)
      this._next();
      // data.Deltas has our stuff.  We need to translate the kind of each
      // change in delta events based on the deltas we got.  This needs to be
      // handled in a hierarchical fashion; cmp stores the comparison values
      // for the sort function below.
      var deltas = [],
          cmp = {
            applicationInfo: 1,
            relationInfo: 2,
            unitInfo: 3,
            machineInfo: 4,
            annotationInfo: 5,
            remoteapplicationInfo: 100
          };
      data.response.deltas.forEach(function(delta) {
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
      document.dispatchEvent(new CustomEvent('delta', {
        detail: {data: {result: deltas}}
      }));
    },

    /**
      Get the next batch of deltas from the Juju status.

      @method _next
      @private
      @return {undefined} Sends a message to the server only.
     */
    _next: function() {
      this._send_rpc({
        type: 'AllWatcher',
        request: 'Next',
        id: this._allWatcherId
      }, function(data) {
        if (!data.error) {
          document.dispatchEvent(new CustomEvent('_rpc_response', {
            detail: data
          }));
          return;
        }
        if (this._allWatcherBeingStopped && data.error === ERR_STOP_WATCHER) {
          // This is an expected "Next" error: we are switching from one model
          // connection to another.
          this._allWatcherBeingStopped = false;
          return;
        }
        console.error(
          'cannot get next changes from the mega-watcher:', data.error);
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
      this._allWatcherBeingStopped = true;
      this._send_rpc({
        type: 'AllWatcher',
        request: 'Stop',
        id: this._allWatcherId
      }, callback);
      this._allWatcherId = null;
    },

    /**
      Prepare the application constraints by type converting integer
      constraints, removing the ones which do not have valid values, and
      turning tags into an array as expected by the juju-core API backend.

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
        const constraint = constraints[key];
        if (this.integerConstraints.indexOf(key) !== -1) {
          // Some of the constraints have to be integers.
          // Some of the integers need to be converted to a base unit, e.g.,
          // Mebibytes. See:
          // github.com/juju/juju/blob/staging/constraints/constraints.go#L666
          let multiplier;
          if (constraint && constraint.slice) {
            const unit = constraint.slice(-1).toLowerCase();
            if (unit === 'g') {
              multiplier = 1024;
            } else if (unit === 't') {
              multiplier = 1024 * 1024;
            } else if (unit === 'p') {
              multiplier = 1024 * 1024 * 1024;
            } else {
              multiplier = 1;
            }
          } else {
            multiplier = 1;
          }
          value = parseInt(constraint, 10) * multiplier;
        } else if (this.genericConstraints.indexOf(key) !== -1) {
          // Trim string constraints.
          value = (constraint || '').trim();
        }
        if (value || value === 0) {
          // The following conditional is a workaround for a bug in Juju core
          // not correctly supporting the 'cpu-cores' key.
          // https://bugs.launchpad.net/juju/+bug/1755580
          // When that issue is resolved, then these lines can be removed.
          // Changing this caused a number of tests to fail because of the name
          // change, these tests were simply updated to the new key. When this
          // is removed then those changes will have to be reverted.
          if (key === 'cpu-cores') {
            key = 'cores';
          }
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
     * @return {undefined} Nothing.
     */
    handleLogin: function(data) {
      this.pendingLoginResponse = false;
      this.userIsAuthenticated = !data.error;
      if (this.userIsAuthenticated) {
        var response = data.response;
        // If login succeeded store the facades and user information, and
        // retrieve model info.
        var facadeList = response.facades || [];
        var facades = facadeList.reduce(function(previous, current) {
          previous[current.name] = current.versions;
          return previous;
        }, {});
        this.setConnectedAttr('facades', facades);
        var userInfo = response['user-info'];
        this.setConnectedAttr('modelAccess', userInfo['model-access']);
        let controllerAccess = userInfo['controller-access'];
        // This permission's name changed between versions of Juju 2.
        // The most recent incarnation is "add-model".
        if (controllerAccess === 'addmodel') {
          controllerAccess = 'add-model';
        }
        this.setConnectedAttr('controllerAccess', controllerAccess);
        if (response['controller-tag']) {
          this.setConnectedAttr(
            'controllerId',
            tags.parse(tags.CONTROLLER, response['controller-tag']));
        }
        this.setConnectedAttr(
          'modelId', tags.parse(tags.MODEL, response['model-tag']));
        this.currentModelInfo(this._handleCurrentModelInfo.bind(this));
        this._watchAll();
        // Start pinging the server.
        // XXX frankban: this is only required as a temporary workaround to
        // prevent Apache to disconnect the WebSocket in the embedded Juju.
        if (!this._pinger) {
          this._pinger = setInterval(
            this.ping.bind(this), module.PING_INTERVAL * 1000);
        }
        // Clean up for log out text.
        this.failedAuthentication = false;
      } else if (
        !data.error || !utils.isRedirectError(data.error)) {
        // If we are requiring to do a redirect to properly connect to the
        // model then do not reset credentials or the failed authentication
        // flags yet.
        // If the credentials were rejected remove them.
        this.get('user').model = null;
        this.failedAuthentication = true;
      }
      // Only fire login if this is not a redirect error as we will come back
      // here once the redirection is made.
      if (!utils.isRedirectError(data.error)) {
        document.dispatchEvent(new CustomEvent('model.login', {
          detail: {err: data.error || null}
        }));
      }
    },

    /**
      Return a version for the given facade name which is supported by the
      current Juju controller. If a version is provided, return the version
      number itself if supported, or null if that specific version is not
      served by the controller. Otherwise, if no version is specified, return
      the most recent supported version or null if the facade is not found.

      @method findFacadeVersion
      @param {String} name The facade name (for instance "Application").
      @param {Int} version The optional facade version (for instance 1 or 2).
      @return {Int} The facade version or null if facade is not supported.
    */
    findFacadeVersion: function(name, version) {
      var facades = this.get('facades') || {};
      var versions = facades[name] || [];
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
     * Attempt to log the user in.  Credentials must have been previously
     * stored on the model object.
     *
     * @method login
     * @return {undefined} Nothing.
     */
    login: function() {
      // If the user is already authenticated there is nothing to do.
      if (this.userIsAuthenticated) {
        document.dispatchEvent(new CustomEvent('model.login', {
          detail: {err: null}
        }));
        return;
      }
      if (this.pendingLoginResponse) {
        return;
      }
      const credentials = this.get('user').model;
      if (!credentials.user || !credentials.password) {
        document.dispatchEvent(new CustomEvent('model.login', {
          detail: {err: 'invalid username or password'}
        }));
        return;
      }
      this._send_rpc({
        type: 'Admin',
        request: 'Login',
        params: {
          'auth-tag': tags.build(tags.USER, credentials.user),
          credentials: credentials.password
        },
        version: module.ADMIN_FACADE_VERSION
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
      // Ensure we always have a callback.
      var cback = function(err, response) {
        this.handleLogin({error: err, response: response});
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

      // Define the handler reacting to Juju controller login responses.
      var handleResponse = function(bakery, macaroons, cback, data) {
        if (data.error) {
          // Macaroon authentication failed or macaroons based authentication
          // not supported by this controller. In the latter case, the
          // controller was probably not bootstrapped with an identity manager,
          // for instance by providing the following parameter to bootstrap:
          // "--config identity-url=https://api.jujucharms.com/identity".
          cback('authentication failed: ' + data.error);
          return;
        }

        var response = data.response;
        var macaroon = response['discharge-required'];
        if (macaroon) {
          // This is a discharge required response.
          bakery.discharge(macaroon, macaroons => {
            // Send the login request again including the discharge macaroon.
            sendLoginRequest(
              macaroons, handleResponse.bind(this, bakery, macaroons, cback));
          }, msg => {
            cback('macaroon discharge failed: ' + msg);
          });
          return;
        }

        // Macaroon authentication succeeded!
        const userInfo = response['user-info'];
        const userTag = userInfo && userInfo.identity;
        if (!userTag) {
          // This is a beta version of Juju 2 which does not include user info
          // in the macaroons based login response. Unfortunately, we did all
          // of this for nothing.
          cback('authentication failed: use a proper Juju 2 release');
          return;
        }
        this.get('user').model = {
          macaroons: macaroons,
          user: tags.parse(tags.USER, userTag)
        };
        cback(null, response);
      };


      // Define the function used to send the login request.
      var sendLoginRequest = function(macaroons, callback) {
        var request = {
          type: 'Admin',
          request: 'Login',
          version: module.ADMIN_FACADE_VERSION
        };
        if (macaroons) {
          request.params = {macaroons: [macaroons]};
        }
        this._send_rpc(request, callback);
      }.bind(this);

      // Perform the API call.
      var macaroons = this.get('user').model.macaroons;
      sendLoginRequest(
        macaroons,
        handleResponse.bind(this, bakery, macaroons, cback)
      );
    },

    /**
      Performs the RedirectInfo request.

      @method redirectInfo
      @param {Function} callback The callback to call with the response. It
        is called with the error string as the first parameter or null if there
        is no error. The second parameter is either the full error response or
        the list of servers.
    */
    redirectInfo: function(callback) {
      this._send_rpc({
        type: 'Admin',
        request: 'RedirectInfo',
        version: module.ADMIN_FACADE_VERSION
      }, resp => {
        if (!callback) {
          console.log('data returned by Admin.RedirectInfo API call:', resp);
          return;
        }
        const error = resp.response.error;
        if (error) {
          callback(error, resp);
          return;
        }
        callback(null, resp.response.servers);
      });
    },

    /**
      Define optional operations to be performed before logging out.
      Operations performed:
        - the pinger interval is stopped;
        - connection attributes are reset;
        - the mega-watcher is stopped.
      Note that not stopping the mega-watcher before disconnecting causes
      server side disconnection to take a while, therefore preventing new
      connections from being established (for instance when switching between
      models in  controller).
      Also note that this function is intended to be idempotent: clients must
      be free to call this multiple times even on an already closed connection.

      @method cleanup
      @param {Function} done A callable that must be called by the function and
        that actually closes the connection.
    */
    cleanup: function(done) {
      console.log('cleaning up the model API connection');
      if (this._pinger) {
        clearInterval(this._pinger);
        this._pinger = null;
      }
      const callback = () => {
        this.resetConnectedAttrs();
        done();
      };
      if (!this._allWatcherId) {
        callback();
        return;
      }
      this._stopWatching(() => {
        console.log('mega-watcher stopped');
        callback();
      });
    },

    /**
      Send a ping request to the server. The response is ignored.

      @method ping
      @return {undefined} Sends a message to the server only.
    */
    ping: function() {
      this._send_rpc({type: 'Pinger', request: 'Ping'});
    },

    /**
      Store the model info coming from the server.

      @method _handleCurrentModelInfo
      @param {Object} data The response returned by the server
        (see the currentModelInfo method below).
      @return {undefined} Nothing.
    */
    _handleCurrentModelInfo: function(err, data) {
      if (err) {
        console.error('error retrieving current model information: ' + err);
        return;
      }
      // Store received model information on the model.
      this.setConnectedAttr('cloud', data.cloud);
      this.setConnectedAttr('credential', data.credential);
      this.setConnectedAttr('defaultSeries', data.series);
      this.setConnectedAttr('environmentName', data.name);
      this.setConnectedAttr('modelOwner', data.owner);
      this.setConnectedAttr('modelUUID', data.uuid);
      this.setConnectedAttr('providerType', data.provider);
      this.setConnectedAttr('region', data.region);
      this.setConnectedAttr('sla', data.sla);
      this.setConnectedAttr('version', data.version);


      // For now we only need to call modelGet if the provider is MAAS.
      if (data.provider !== 'maas') {
        // Set the MAAS server to null, so that subscribers waiting for this
        // attribute to be set can be released.
        this.setConnectedAttr('maasServer', null);
        return;
      }
      this.modelGet(data => {
        if (data.err) {
          console.warn('error calling ModelGet API: ' + data.err);
          return;
        }
        const maasServer = data.config['maas-server'];
        let value;
        if (maasServer) {
          value = maasServer.value;
        } else {
          value = null;
          console.log('cannot retrieve maas-server from ModelGet call');
        }
        this.setConnectedAttr('maasServer', value);
      });
    },

    /**
      Send a request for base details about the current Juju model, for
      instance default series and provider type.

      @method currentModelInfo
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error containing a string
        describing the problem (if an error occurred) and an object with the
        following fields:
        - name: the model name, like "admin" or "mymodel";
        - series: the model default series, like "trusty" or "xenial";
        - provider: the provider type, like "lxd" or "aws";
        - uuid: the model unique identifier;
        - owner: the name of the user owning the model;
        - cloud: the model cloud;
        - region: the cloud region in which the model is placed;
        - credential: the cloud credential name;
        - sla: the level of the SLA, "unsupported", "essential", standard" or
          "advanced";
        - slaOwner: the name of the user who set the SLA initially, or an empty
          string if the current SLA is "unsupported";
        - version: the current agent version;
        - life: the lifecycle status of the model: "alive", "dying" or "dead";
        - isAlive: whether the model is alive or dying/dead.
     @return {undefined} Nothing.
    */
    currentModelInfo: function(callback) {
      // Decorate the user supplied callback.
      var handler = data => {
        if (!callback) {
          console.log('data returned by Client.ModelInfo API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        var response = data.response;
        // Credentials are not required/returned by all clouds.
        let credential = '';
        if (response['cloud-credential-tag']) {
          credential = tags.parse(
            tags.CREDENTIAL, response['cloud-credential-tag']);
        }
        const sla = response.sla || {};
        callback(null, {
          name: response.name,
          series: response['default-series'],
          provider: response['provider-type'],
          uuid: response.uuid,
          owner: tags.parse(tags.USER, response['owner-tag']),
          cloud: tags.parse(tags.CLOUD, response['cloud-tag']),
          region: response['cloud-region'],
          credential: credential,
          sla: sla.level || '',
          slaOwner: sla.owner || '',
          version: response['agent-version'],
          life: response.life,
          isAlive: response.life === 'alive'
        });
      };
      // Send the API request.
      this._send_rpc({type: 'Client', request: 'ModelInfo'}, handler);
    },

    /**
      Send a ModelConfig.ModelGet request to retrieve info about the model.

      @method modelGet
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the "config" attribute if everything went well.
        Every config value is an object composed of two fields:
        - source indicating the source for the config value;
        - value with the actual config value.
      @return {undefined} Sends a message to the server only.
    */
    modelGet: function(callback) {
      // Define the API request callback wrapper.
      var handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by model get API call:', data);
          return;
        }
        if (data.error) {
          userCallback({err: data.error});
          return;
        }
        userCallback({config: data.response.config});
      }.bind(this, callback);

      // Send the API request.
      this._send_rpc({
        type: 'ModelConfig',
        request: 'ModelGet'
      }, handler);
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
        document.dispatchEvent(new CustomEvent('model.login', {
          detail: {err: 'cannot upload files anonymously'}
        }));
        return;
      }
      var credentials = this.get('user').model;
      var path = _getCharmAPIPath(this.get('modelUUID'), 'series=' + series);
      var headers = {'Content-Type': 'application/zip'};
      // Use a web handler to communicate to the Juju HTTPS API. The web
      // handler takes care of setting up asynchronous requests with basic
      // HTTP authentication, and of subscribing/invoking the given callbacks.
      // The web handler is stored as an environment attribute: it is
      // an instance of app/store/web-handler.js:WebHandler.
      var webHandler = this.get('webHandler');
      // TODO frankban: allow macaroons based auth here.
      webHandler.sendPostRequest(
        path, headers, file, tags.build(tags.USER, credentials.user),
        credentials.password, progress, callback);
    },

    /**
      Return the full URL to the Juju HTTPS API serving a local charm file.

      @method getLocalCharmFileUrl
      @param {String} charmUrl The local charm URL, for instance
        local:trusty/django-42".
      @param {String} filename The file name/path, for instance "icon.svg" or
        "hooks/install".
      @return {String} The full URL to the file contents, including auth
        credentials.
    */
    getLocalCharmFileUrl: function(charmUrl, filename) {
      const credentials = this.get('user').model;
      const path = _getCharmAPIPath(
        this.get('modelUUID'), 'url=' + charmUrl + '&file=' + filename);
      const webHandler = this.get('webHandler');
      // TODO frankban: allow macaroons based auth here.
      return webHandler.getUrl(
        path, tags.build(tags.USER, credentials.user), credentials.password);
    },

    /**
      Return the full URL to a local charm icon.

      If the local charm has no icon, a default icon is served.

      @method getLocalCharmIcon
      @param {String} charmUrl The local charm URL, for instance
        "local:trusty/django-42".
      @return {String} The full URL to the icon, including auth credentials.
    */
    getLocalCharmIcon: function(charmUrl) {
      const credentials = this.get('user').model;
      const uuid = this.get('modelUUID');
      const path = _getCharmAPIPath(uuid, 'url=' + charmUrl + '&icon=1');
      const webHandler = this.get('webHandler');
      // TODO frankban: allow macaroons based auth here.
      return webHandler.getUrl(
        path, tags.build(tags.USER, credentials.user), credentials.password);
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
      var credentials = this.get('user').model;
      var webHandler = this.get('webHandler');
      var headers = Object.create(null);
      // TODO frankban: allow macaroons based auth here.
      webHandler.sendGetRequest(
        path, headers, tags.build(tags.USER, credentials.user),
        credentials.password, progress, callback);
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
      var path = _getCharmAPIPath(this.get('modelUUID'), 'url=' + charmUrl);
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
    getLocalCharmFileContents: function(
      charmUrl, filename, progress, callback) {
      var path = _getCharmAPIPath(
        this.get('modelUUID'), 'url=' + charmUrl + '&file=' + filename);
      this._jujuHttpGet(path, progress, callback);
    },

    /**
      Calls the environment's _addCharm method or creates a new addCharm record
      in the ECS queue.

      Parameters match the parameters for the _addCharm method below.
      The only new parameter is the last one (ECS options).

      @method addCharm
    */
    addCharm: function(url, charmstore, callback, options) {
      if (options && options.immediate) {
        this._addCharm(url, charmstore, callback);
        return;
      }
      this.get('ecs').lazyAddCharm([url, charmstore, callback], options);
    },

    /**
      Add a charm to the Juju state server.

      @method _addCharm
      @param {String} url The URL of the charm. It must include the revision.
      @param {Object} charmstore The charm store API client instance, used in
        case a delegatable macaroon must be retrieved for adding the charm.
      @param {Function} callback A callable that must be called once the
        operation is performed. The callback is called passing an object like
        the following:
          {
            err: 'optional error',
            url: 'provided charm URL'
          }
      @return {undefined} Sends a message to the server only.
    */
    _addCharm: function(url, charmstore, callback) {
      if (!callback) {
        callback = resp => {
          console.log('data returned by addCharm API call:', resp);
        };
      }
      let authAttempted = false;

      // Define the API callback.
      const handler = data => {
        if (!data.error) {
          callback({url: url});
          return;
        }
        // If the error is not related to authorization, then just notify
        // callers about the failure. Same if the macaroon was already included
        // in the request.
        if (authAttempted || (data['error-code'] !== 'unauthorized access')) {
          callback({err: data.error, url: url});
          return;
        }
        authAttempted = true;
        // If the user is not authorized then it probably means that agreement
        // to terms is required in order to add this charm. Retry again with
        // a delegatable macaroon obtained from the charm store.
        charmstore.getDelegatableMacaroon(url, (err, macaroon) => {
          if (err) {
            callback({err: err, url: url});
            return;
          }
          sendRequest(macaroon);
        });
      };

      // Define a function to send the request.
      const sendRequest = macaroon => {
        const request = {
          type: 'Client',
          request: 'AddCharm',
          params: {url: url}
        };
        if (macaroon) {
          request.request = 'AddCharmWithAuthorization';
          request.params.macaroon = macaroon;
        }
        this._send_rpc(request, handler);
      };

      // Perform the API call.
      sendRequest(null);
    },

    /**
      Calls the environment's _addPendingResources method or creates a
      new addPendingResources record in the ECS queue.

      Parameters match the parameters for the _addPendingResources method
      below. The only new parameter is the last one (ECS options).
    */
    addPendingResources: function(args, callback, options) {
      if (options && options.immediate) {
        this._addPendingResources(args, callback);
        return;
      }
      this.get('ecs').lazyAddPendingResources([args, callback], options);
    },

    /**
      Sends the provided resource info up to Juju without making it available
      yet.

      This is required to be called before deploying charms requiring
      resources. The resource identifiers passed to the callback must then be
      used when calling deploy. Like this:

        const resources = [
          // Retrieve resources from charmstore, for instance from
          // https://api.jujucharms.com/charmstore/v5/$id/meta/resources
        ];
        model.addPendingResources({
          applicationName: 'wordpress',
          charmURL: 'wordpress-42',
          channel: 'stable',
          resources: resources
        }, (err, ids) => {
          if (err) {
            // Handle error.
            return;
          }
          model.deploy({
            applicationName: 'wordpress',
            charmURL: 'wordpress-42',
            resources: ids
          }, deployCallback);
        });

      @param {Object} args The arguments required to make the call, including:
        - applicationName: the name of the application to be associated with
          the resources;
        - charmURL: the URL of the charm, as a string;
        - resources: an array of resources, for instance as returned by the
          "$id/meta.resources" charm store endpoint;
        - channel: optional charm store channel name, defaulting to "stable".
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments:
        - an error message if an error occurred in the process, or null if
          everything went well;
        - an object mapping resource names with pending resource identifiers,
          or an empty object if the operation failed. The returned map can be
          used as is in the "resources" argument of the deploy call.
    */
    _addPendingResources: function(args, callback) {
      // Validate the arguments.
      const resources = args.resources;
      if (!(
        args.applicationName &&
        args.charmURL &&
        resources &&
        resources.length
      )) {
        callback('invalid arguments: ' + JSON.stringify(args), {});
        return;
      }
      for (let i = 0; i < resources.length; i++) {
        let resource = resources[i];
        if (!resource.Name) {
          callback('resource without name: ' + JSON.stringify(resources), {});
          return;
        }
        if (!resource.Origin) {
          resource.Origin = 'store';
        }
      }

      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by addPendingResources API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const response = data.response;
        if (response.error) {
          callback(response.error.message, {});
          return;
        }
        if (response['pending-ids'].length !== resources.length) {
          // This should never happen.
          callback('unexpected response: ' + JSON.stringify(response), {});
          return;
        }
        const ids = response['pending-ids'].reduce((prev, curr, index) => {
          const resource = resources[index];
          prev[resource.Name] = curr;
          return prev;
        }, {});
        callback(null, ids);
      };

      // Send the API request.
      this._send_rpc({
        type: 'Resources',
        request: 'AddPendingResources',
        params: {
          tag: tags.build(tags.APPLICATION, args.applicationName),
          url: args.charmURL,
          channel: args.channel || 'stable',
          resources: resources
        }
      }, handler);
    },

    /**
      Calls the environment's _deploy method or creates a new deploy record in
      the ECS queue.

      Parameters match the parameters for the _deploy method below.
      The only new parameter is the last one (ECS options).

      @method deploy
    */
    deploy: function(args, callback, options) {
      if (options && options.immediate) {
        this._deploy(args, callback);
        return;
      }
      this.get('ecs').lazyDeploy([args, callback], options);
    },

    /**
      Deploy a charm.

      The charm is assumed to be already included in the model (see addCharm).

      @method _deploy
      @param {Object} args The arguments required to execute the call to deploy
        the charm, including:
        - {String} charmURL: the URL of the charm;
        - {String} applicationName: the name of the resulting application;
        - {String} series: the optional series to use in a multi-series charm;
        - {Integer} numUnits: the number of units to be added, defaulting to 0;
        - {Object} config: the optional charm configuration options;
        - {String} configRaw: the optional YAML representation of the charm
          configuration options. Only one of `config` and `configRaw` should be
          provided, though `configRaw` takes precedence if it is given;
        - {Object} constraints: the optional machine constraints to use in the
          object format key: value;
        - {Object} resources: optional pending resources to use when deploying
          the charm. It is ok to use the result of the addPendingResources call
          in this case. Note that charms requiring resources cannot be deployed
          before adding the corresponding pending resources to Juju.
      @param {Function} callback A callable that must be called once the
        operation is performed. It receives an error with a message describing
        the problem if a problem occurred (or null if the operation succeeded),
        the application name as second argument and the charm URL as third.
    */
    _deploy: function(args, callback) {
      // Define the API callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by deploy API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, '', '');
          return;
        }
        const response = data.response || {};
        if (!response.results || response.results.length !== 1) {
          // This should never happen.
          callback('unexpected response: ' + JSON.stringify(response), '', '');
          return;
        }
        const error = response.results[0].error;
        if (error) {
          callback(error.message, '', '');
          return;
        }
        callback(null, args.applicationName, args.charmURL);
      };

      // Build the API call parameters.
      let constraints = {};
      if (args.constraints) {
        constraints = this.prepareConstraints(args.constraints);
      }
      const params = {
        application: args.applicationName,
        'charm-url': args.charmURL,
        constraints: constraints,
        'num-units': args.numUnits || 0,
        resources: args.resources || {}
      };
      if (args.configRaw) {
        params['config-yaml'] = args.configRaw;
      } else if (args.config) {
        params.config = stringifyObjectValues(args.config);
      }
      if (args.series) {
        // If series is defined then set it, do not send an undefined series
        // field as Juju core will not successfully deploy the application.
        params.series = args.series;
      }

      // Perform the API call.
      this._send_rpc({
        type: 'Application',
        request: 'Deploy',
        params: {applications: [params]}
      }, handler);
    },

    /**
      Set metric credentials on the application with the given name.

      @method setMetricCredentials
      @param {String} applicationName the name of the application.
      @param {String} macaroon the serialized macaroon resulting from
        authorizing a plan for the application.
      @param {Function} callback An optional callable that must be called once
        the operation is performed. It will receive an error string if an error
        occurred or null otherwise.
    */
    setMetricCredentials: function(applicationName, macaroon, callback) {
      // Decorate the user supplied callback.
      var handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by SetMetricCredentials API call:', data);
          return;
        }
        userCallback(data.error || null);
      }.bind(this, callback);

      // Send the API request.
      this._send_rpc({
        type: 'Application',
        request: 'SetMetricCredentials',
        params: {creds: [{
          application: applicationName,
          'metrics-credentials': macaroon
        }]}
      }, handler);
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
    the Application.Deploy and Application.AddUnits API calls: in both cases,
    if a machine/container name is specified, then the unit(s) will be deployed
    in the specified machine/container.
    */

    /**
      Calls the environment's _addMachines method or creates a new addMachines
      record in the ECS queue.

      Parameters match the parameters for the _addMachines method below.
      The only new parameter is the last one (ECS options).

      @method addMachines
    */
    addMachines: function(params, callback, options) {
      if (options && options.immediate) {
        this._addMachines(params, callback);
        return;
      }
      this.get('ecs').lazyAddMachines([params, callback], options);
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
        intermediateCallback = self._handleAddMachines.bind(self, callback);
      }
      var machineParams = params.map(function(param) {
        var machineParam = {
          // By default the new machines we add are suitable for storing units.
          jobs: param.jobs || [machineJobs.HOST_UNITS],
          series: param.series,
          'parent-id': param.parentId,
          'container-type': param.containerType
        };
        if (param.constraints) {
          machineParam.constraints = self.prepareConstraints(
            param.constraints);
        }
        return machineParam;
      });
      var request = {
        type: 'Client',
        request: 'AddMachines',
        params: {params: machineParams}
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
          request-id: 1,
          error: 'only defined if a global error occurred',
          response: {
            machines: [
              {machine: '2', error: {code: "code", message: "error message"}},
              {machine: '2/lxc/1', error: null}
            ]
          }
        }
     */
    _handleAddMachines: function(userCallback, data) {
      var machines = data.response.machines || [];
      var transformedData = {
        err: data.error,
        machines: machines.map(function(machine) {
          var error = null;
          var machineError = machine.error;
          if (machineError) {
            error = machineError.message;
            if (machineError.code) {
              error += ' (code ' + machineError.code + ')';
            }
          }
          return {
            err: error,
            name: machine.machine
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
      if (options && options.immediate) {
        this._destroyMachines(names, force, callback);
        return;
      }
      this.get('ecs').lazyDestroyMachines([names, force, callback], options);
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
        intermediateCallback = this._handleDestroyMachines.bind(
          this, callback, names);
      }
      var request = {
        type: 'Client',
        request: 'DestroyMachines',
        params: {'machine-names': names, force: !!force}
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
        {request-id: 1, error: 'an error occurred', response: {}}
    */
    _handleDestroyMachines: function(userCallback, names, data) {
      var transformedData = {
        err: data.error,
        names: names
      };
      // Call the original user callback.
      userCallback(transformedData);
    },

    /**
      Update an existing application in the Juju model.
      By using this API call, it is possible to update any or all of the
      following application attributes:
        - its charm URL;
        - its settings (charm configuration options);
        - its constraints;
        - its minimum number of units.

      @method updateApplication
      @param {String} applicationName The name of the Juju app to be updated.
      @param {Object} args An object with any or all of the following fields:
        - url (String): the charm URL;
        - forceUnits (Bool): whether to force units when upgrading the URL;
        - forceSeries (Bool): whether to force series when upgrading the URL;
        - settings (Object): the configuration key/value pairs;
        - constraints (Object): the constraints;
        - minUnits (Integer): the minimum number of units for this application.
      @param {Function} callback A callable that must be called once the
        operation is performed. The callback receives an object with all the
        attributes in args with two additional fields:
        - applicationName: the name of the application;
        - err: optional error encountered in the process.
    */
    updateApplication: function(applicationName, args, callback) {
      // Decorate the user supplied callback.
      var handler = function(userCallback, applicationName, args, data) {
        if (!userCallback) {
          console.log('data returned by application update API call:', data);
          return;
        }
        var response = {applicationName: applicationName, err: data.error};
        Object.keys(args).forEach(key => {
          response[key] = args[key];
        });
        userCallback(response);
      }.bind(this, callback, applicationName, args);

      // Prepare the request parameters.
      var params = {application: applicationName};
      if (args.url) {
        params['charm-url'] = args.url;
        params['force-charm-url'] = !!args.forceUnits;
        params['force-series'] = !!args.forceSeries;
      }
      if (args.settings) {
        params.settings = stringifyObjectValues(args.settings);
      }
      if (args.constraints) {
        params.constraints = this.prepareConstraints(args.constraints);
      }
      if (args.minUnits) {
        params['min-units'] = args.minUnits;
      }

      // Perform the API call.
      this._send_rpc({
        type: 'Application',
        request: 'Update',
        params: params
      }, handler);
    },

    /**
      Set an application's charm.

      @method setCharm
      @param {String} applicationName The name of the application whose charm
        must be updated.
      @param {String} url The URL of the charm.
      @param {Boolean} forceUnits Force the units when upgrading.
      @param {Boolean} forceSeries Force the series when upgrading.
      @param {Function} callback A callable that must be called once the
        operation is performed.
      @return {undefined} Sends a message to the server only.
    */
    setCharm: function(
      applicationName, url, forceUnits, forceSeries, callback) {
      var args = {url: url, forceUnits: forceUnits, forceSeries: forceSeries};
      this.updateApplication(applicationName, args, function(data) {
        if (!callback) {
          return;
        }
        callback({
          err: data.err,
          applicationName: data.applicationName,
          charmUrl: data.url
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
    add_unit: function(
      applicationName, numUnits, toMachine, callback, options) {
      if (options && options.immediate) {
        this._add_unit(applicationName, numUnits, toMachine, callback);
        return;
      }
      this.get('ecs').lazyAddUnits(
        [applicationName, numUnits, toMachine, callback], options);
    },

    /**
      Add units to the provided application.

      @method _add_unit
      @param {String} applicationName The name of the app to be scaled up.
      @param {Integer} numUnits The number of units to be added.
      @param {String} toMachine The machine/container name where to deploy the
        application unit (e.g. top level machine "42" or container "2/lxc/0").
        If the value is null or undefined, the default juju-core unit placement
        policy is used. This currently means that clean and empty machines are
        used if available, otherwise new top level machines are created.
        If the value is set, numUnits must be 1: i.e. it is not possible to add
        multiple units to a single machine/container.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), or with the following attributes if everything went well:
        - applicationName: the name of the application;
        - numUnits: the number of units added;
        - result: a list containing the names of the added units.
      @return {undefined} Sends a message to the server only.
    */
    _add_unit: function(applicationName, numUnits, toMachine, callback) {
      // Define the API callback.
      var handleAddUnit = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by addUnit API call:', data);
          return;
        }
        var transformedData = {
          err: data.error,
          applicationName: applicationName
        };
        if (data.error) {
          transformedData.numUnits = numUnits;
        } else {
          var units = data.response.units;
          transformedData.result = units;
          transformedData.numUnits = units.length;
        }
        // Call the original user callback.
        userCallback(transformedData);
      }.bind(this, callback);

      // Make the call.
      this._send_rpc({
        type: 'Application',
        request: 'AddUnits',
        params: {
          application: applicationName,
          'num-units': numUnits,
          placement: [parsePlacement(toMachine)]
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
      if (options && options.immediate) {
        this._remove_units(unitNames, callback);
        return;
      }
      this.get('ecs').lazyRemoveUnit([unitNames, callback], options);
    },

    /**
     * Remove units from an application.
     *
     * @method _remove_units
     * @param {Array} unitNames The units to be removed.
     * @param {Function} callback A callable that must be called once the
     *   operation is performed. Normalized data, including the unit_names
     *   is passed to the callback.
     */
    _remove_units: function(unitNames, callback) {
      // Define the API callback.
      var handleRemoveUnits = function(userCallback, unitNames, data) {
        if (!userCallback) {
          console.log('data returned by DestroyUnits API call:', data);
          return;
        }
        userCallback({err: data.error, unit_names: unitNames});
      }.bind(this, callback, unitNames);

      // Perform the API call.
      this._send_rpc({
        type: 'Application',
        request: 'DestroyUnits',
        params: {'unit-names': unitNames}
      }, handleRemoveUnits);
    },

    /**
      Calls the environment's _expose method or adds an expose record to
      the ECS.

      Parameters match the parameters for the _expose method below.
      The only new parameter is the last one (ECS options).

      @method expose
    */
    expose: function(applicationName, callback, options) {
      if (options && options.immediate) {
        this._expose(applicationName, callback);
        return;
      }
      this.get('ecs').lazyExpose([applicationName, callback], options);
    },

    /**
     * Expose the application with the given name.
     *
     * @method _expose
     * @param {String} applicationName The application name.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), and with a "applicationName" attribute containing the name
     *  of the application.
     * @return {undefined} Sends a message to the server only.
     */
    _expose: function(applicationName, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and applicationName. No context is passed.
        intermediateCallback = this.handleSimpleApplicationCalls.bind(
          null, callback, applicationName);
      }
      this._send_rpc({
        type: 'Application',
        request: 'Expose',
        params: {application: applicationName}
      }, intermediateCallback);
    },

    /**
      Calls the environment's _unexpose method or adds an unexpose record to
      the ECS.

      Parameters match the parameters for the _unexpose method below.
      The only new parameter is the last one (ECS options).

      @method unexpose
    */
    unexpose: function(applicationName, callback, options) {
      if (options && options.immediate) {
        this._unexpose(applicationName, callback);
        return;
      }
      this.get('ecs').lazyUnexpose([applicationName, callback], options);
    },

    /**
      Unexpose the application with the given name.

      @method _unexpose
      @param {String} applicationName The application name.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err"
        attribute containing a string describing the problem (if an error
        occurred), and with a "applicationName" attribute containing the name
        of the application.
      @return {undefined} Sends a message to the server only.
    */
    _unexpose: function(applicationName, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and applicationName. No context is passed.
        intermediateCallback = this.handleSimpleApplicationCalls.bind(
          null, callback, applicationName);
      }
      this._send_rpc({
        type: 'Application',
        request: 'Unexpose',
        params: {application: applicationName}
      }, intermediateCallback);
    },

    /**
      Transform the data returned from juju-core calls related to an
      application (e.g. 'Application.Expose', 'Application.Unexpose' or
      'Application.Destroy') into that suitable for the user callback.

      @method handleSimpleApplicationCalls
      @param {Function} callback The callback originally submitted by the
        call site.
      @param {String} applicationName The name of the application.
      @param {Object} data The response returned by the server.
    */
    handleSimpleApplicationCalls: function(callback, applicationName, data) {
      callback({err: data.error, applicationName: applicationName});
    },

    /**
     * Update the annotations for an entity by name.
     *
     * @method update_annotations
     * @param {String} entity The name of a machine, unit, application, or
     *   model, e.g. '0', 'mysql-0', or 'mysql'.
     * @param {String} type The type of entity that is being annotated
     *   (e.g.: 'application', 'unit', 'machine', 'model').
     * @param {Object} data A dictionary of key, value pairs.
     */
    update_annotations: function(entity, type, data, callback) {
      // Decorate the user supplied callback.
      var handler = function(userCallback, entity, data) {
        if (!userCallback) {
          return;
        }
        var response = {entity: entity};
        if (data.error) {
          response.err = data.error;
          userCallback(response);
          return;
        }
        // New API allows setting annotations in bulk, so we can have an
        // error for each entity result.
        var result = data.response.results[0];
        if (result.error) {
          response.err = result.error;
        }
        userCallback(response);
      }.bind(this, callback, entity);

      // Perform the request to set annotations.
      this._send_rpc({
        type: 'Annotations',
        request: 'Set',
        params: {annotations: [{
          entity: tags.build(tags[type.toUpperCase()], entity),
          annotations: stringifyObjectValues(data)
        }]}
      }, handler);
    },

    /**
     * Remove the annotations for an entity by name.
     *
     * @method remove_annotations
     * @param {String} entity The name of a machine, unit, application, or
     *   model, e.g. '0', 'mysql-0', or 'mysql'.
     * @param {String} type The type of entity that is being annotated
     *   (e.g.: 'application', 'unit', 'machine', 'model').
     * @param {Object} keys A list of annotation key names for the
     *   annotations to be deleted.
     * @return {undefined} Nothing.
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
     * @method get_annotations
     * @param {String} entity The name of a machine, unit, application, or
     *   model, e.g. '0', 'mysql-0', or 'mysql'.
     * @param {String} type The type of entity that is being annotated
     *   (e.g.: 'application', 'unit', 'machine', 'model').
     * @return {Object} A dictionary of key,value pairs is returned in the
     *   callback.  The invocation of this command returns nothing.
     */
    get_annotations: function(entity, type, callback) {
      var handler = function(userCallback, entity, data) {
        if (!userCallback) {
          console.log('data returned by Annotations.Get API call:', data);
          return;
        }
        var response = {entity: entity};
        if (data.error) {
          response.err = data.error;
          userCallback(response);
          return;
        }
        var result = data.response.results[0];
        if (result.error) {
          response.err = result.error;
          userCallback(response);
          return;
        }
        response.results = result.annotations;
        userCallback(response);
      }.bind(this, callback, entity);
      this._send_rpc({
        type: 'Annotations',
        request: 'Get',
        params: {entities: [{
          tag: tags.build(tags[type.toUpperCase()], entity)
        }]}
      }, handler);
    },

    /**
     * Get the configuration for the given application.
     *
     * @method getApplicationConfig
     * @param {String} applicationName The application name.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object containing:
     *    err - a string describing the problem (if an error occurred);
     *    applicationName - the name of the application;
     *    result: an object containing all of the app configuration data.
     * @return {undefined} Sends a message to the server only.
     */
    getApplicationConfig: function(applicationName, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and applicationName. No context is passed.
        intermediateCallback = this._handleGetApplicationConfig.bind(
          null, callback, applicationName);
      }
      this._send_rpc({
        type: 'Application',
        request: 'Get',
        params: {application: applicationName}
      }, intermediateCallback);
    },

    /**
     * Transform the data returned from juju-core call to Application.Get into
     * that suitable for the user callback.
     *
     * @method _handleGetApplicationConfig
     * @param {Function} callback The originally submitted callback.
     * @param {String} applicationName The name of the application.
     * @param {Object} data The response returned by the server.
     */
    _handleGetApplicationConfig: function(callback, applicationName, data) {
      var config = (data.response || {}).config || {};
      var transformedConfig = {};
      Object.keys(config).forEach(key => {
        const value = config[key];
        transformedConfig[key] = value.value;
      });
      callback({
        err: data.error,
        applicationName: applicationName,
        result: {
          config: transformedConfig,
          constraints: (data.response || {}).constraints,
          series: (data.response || {}).series
        }
      });
    },

    /**
      Calls the environments set_config method or creates a new set_config
      record in the queue.

      The parameters match the parameters for the _set_config method below.

      @method set_config
    */
    set_config: function(applicationName, config, callback, options) {
      const ecs = this.get('ecs');
      if (options && options.immediate) {
        // We need to check that the applicationName is a real application name
        // and not a queued application id before allowing immediate or not.
        if (ecs.changeSet[applicationName]) {
          throw new Error(
            'You cannot immediately set config on a queued application');
        }
        this._set_config(applicationName, config, callback);
        return;
      }
      ecs.lazySetConfig([applicationName, config, callback], options);
    },

    /**
      Change the configuration of the application with the given name.

      @method _set_config
      @param {String} applicationName The application name.
      @param {Object} config The charm configuration options.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object containing:
        - err: a string describing the problem (if an error occurred);
        - applicationName: the name of the application;
        - newValues: the new configuration options.
    */
    _set_config: function(applicationName, config, callback) {
      var args = {settings: config};
      this.updateApplication(applicationName, args, function(data) {
        if (!callback) {
          return;
        }
        callback({
          err: data.err,
          applicationName: applicationName,
          newValues: config
        });
      });
    },

    /**
      Calls the environments _destroyApplication method or creates a new
      destroyApplication record in the queue.

      The parameters match the parameters for the _destroyApplication method
      below.

      @method destroyApplication
    */
    destroyApplication: function(applicationName, callback, options) {
      if (options && options.immediate) {
        this._destroyApplication(applicationName, callback);
        return;
      }
      this.get('ecs').lazyDestroyApplication(
        [applicationName, callback], options);
    },

    /**
       Destroy the application with the given name.

       @method _destroyApplication
       @param {String} applicationName The application name.
       @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object containing:
          err - a string describing the problem (if an error occurred);
          applicationName - the name of the application.
       @return {undefined} Sends a message to the server only.
     */
    _destroyApplication: function(applicationName, callback) {
      var intermediateCallback;
      if (callback) {
        // Capture the callback and applicationName. No context is passed.
        intermediateCallback = this.handleSimpleApplicationCalls.bind(
          null, callback, applicationName);
      }
      this._send_rpc({
        type: 'Application',
        request: 'Destroy',
        params: {application: applicationName}
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
      var intermediateCallback;
      if (callback) {
        // Capture the callback and relationName.  No context is passed.
        intermediateCallback = this.handleResolved.bind(
          null, callback, unitName);
      }
      this._send_rpc({
        type: 'Client',
        request: 'Resolved',
        params: {'unit-name': unitName, retry: !!retry}
      }, intermediateCallback);
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
        err: data.error,
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
      if (options && options.immediate) {
        this._add_relation(endpointA, endpointB, callback);
        return;
      }
      this.get('ecs').lazyAddRelation(
        [endpointA, endpointB, callback], options);
    },

    /**
       Add a relation between two applications.

       @method _add_relation
       @param {Object} endpointA An array of [application, interface]
         representing one of the endpoints to connect.
       @param {Object} endpointB An array of [application, interface]
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
        var response = data.response;
        if (response && response.endpoints) {
          var endpoints = response.endpoints;
          var applicationNameA = epA.split(':')[0];
          var applicationNameB = epB.split(':')[0];
          result.endpoints = [];
          [applicationNameA, applicationNameB].forEach(name => {
            var jujuEndpoint = endpoints[name];
            var guiEndpoint = {};
            guiEndpoint[name] = {'name': jujuEndpoint.name};
            result.endpoints.push(guiEndpoint);
          });
          result.id = createRelationKey(endpoints);
          // The interface and scope should be the same for both endpoints.
          result['interface'] = endpoints[applicationNameA].interface;
          result.scope = endpoints[applicationNameA].scope;
        }
        userCallback({
          request_id: data['request-id'],
          endpoint_a: epA,
          endpoint_b: epB,
          err: data.error,
          result: result
        });
      }.bind(this, callback, epA, epB);

      // Send the API request.
      this._send_rpc({
        type: 'Application',
        request: 'AddRelation',
        params: {endpoints: [epA, epB]}
      }, handleAddRelation);
    },

    /**
      Calls the environment's _remove_relation method or removes a
      remove_relation record in the ECS queue.

      Parameters match the parameters for the _remove_relation method below.
      The only new parameter is the last one (ECS options).

      @method remove_relation
    */
    remove_relation: function(endpointA, endpointB, callback, options) {
      if (options && options.immediate) {
        this._remove_relation(endpointA, endpointB, callback);
        return;
      }
      this.get('ecs').lazyRemoveRelation(
        [endpointA, endpointB, callback], options);
    },

    /**
     * Remove the relationship between two applications.
     *
     * @method _remove_relation
     * @param {Object} endpointA An array of [application, interface]
     *   representing one of the endpoints to connect.
     * @param {Object} endpointB An array of [application, interface]
     *   representing the other endpoint to connect.
     * @param {Function} callback A callable that must be called once the
     *  operation is performed. It will receive an object with an "err"
     *  attribute containing a string describing the problem (if an error
     *  occurred), and with a "endpoint_a" and "endpoint_b" attributes
     *  containing the names of the endpoints.
     * @return {undefined} Nothing.

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
        userCallback({err: data.error, endpoint_a: epA, endpoint_b: epB});
      }.bind(this, callback, epA, epB);

      // Send the API request.
      this._send_rpc({
        type: 'Application',
        request: 'DestroyRelation',
        params: {endpoints: [epA, epB]}
      }, handleRemoveRelation);
    },

    /**
      Retrieve charm info by sending the Charms.CharmInfo API call.
      An example of the "data.response" returned by juju-core follows:

        {
          'config': {
            'debug': {
              'default': 'no',
              'description': 'Setting this option to "yes" will ...',
              'type': 'string'
            },
            'engine': {
              'default': 'nginx',
              'description': 'Two web server engines are supported...',
              'type': 'string'
            }
          },
          'meta': {
            'description': 'This will install and setup WordPress...',
            'name': 'wordpress',
            'min-juju-version': '0.0.0',
            'peers': {
              'loadbalancer': {
                'interface': 'reversenginx',
                'limit': 1,
                'name': 'loadbalancer',
                'optional': false,
                'role': 'peer',
                'scope': 'global'
              }
            },
            'provides': {
              'website': {
                'interface': 'http',
                'limit': 0,
                'name': 'website',
                'optional': false,
                'role': 'provider',
                'scope': 'global'
              }
            },
            'requires': {
              'cache': {
                'interface': 'memcache',
                'limit': 1,
                'name': 'cache',
                'optional': false,
                'role': 'requirer',
                'scope': 'global'
              },
              'db': {
                'interface': 'mysql',
                'limit': 1,
                'name': 'db',
                'optional': false,
                'role': 'requirer',
                'scope': 'global'
              }
            },
            'subordinate': false,
            'summary': 'WordPress is a full featured web blogging tool...',
            'tags': ['applications', 'blog']
          },
          'revision': 10,
          'url': 'cs:precise/wordpress-10'
        }

      The example above is not exhaustive. For a more complete description,
      check the CharmInfo response type at
      <https://github.com/juju/juju/blob/master/apiserver/params/charms.go>.

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
      // Define a charm relation helper.
      var handleRelations = function(relations) {
        relations = relations || {};
        return Object.keys(relations).reduce((prev, curr) => {
          var values = relations[curr];
          prev[curr] = {
            interface: values.interface,
            name: values.name,
            role: values.role,
            scope: values.scope,
            limit: values.limit,
            optional: values.optional
          };
          return prev;
        }, {});
      };

      // Define the API callback.
      var handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by CharmInfo API call:', data);
          return;
        }
        // Handle possible errors.
        if (data.error) {
          userCallback({err: data.error});
          return;
        }
        var response = data.response;
        // Handle charm options.
        var config = response.config || {};
        var options = Object.keys(config).reduce((prev, curr) => {
          var values = config[curr];
          prev[curr] = {
            type: values.type,
            description: values.description,
            default: values.default
          };
          return prev;
        }, {});
        var meta = response.meta;
        var result = {
          config: {options: options},
          peers: handleRelations(meta.peers),
          provides: handleRelations(meta.provides),
          requires: handleRelations(meta.requires),
          url: response.url,
          revision: response.revision,
          description: meta.description,
          minJujuVersion: meta['min-juju-version'],
          name: meta.name,
          subordinate: meta.subordinate,
          summary: meta.summary,
          tags: meta.tags || [],
          series: meta.series || [],
          terms: meta.terms || [],
          // TODO frankban: convert metrics to a JS friendly object.
          metrics: response.metrics
        };
        userCallback({result: result});
      }.bind(this, callback);

      // Send the API request.
      this._send_rpc({
        type: 'Charms',
        request: 'CharmInfo',
        params: {'url': charmURL}
      }, handler);
    },

    /**
      Add an addKeys item to the ECS to allow adding SSH keys to a model.

      @param {String} user The user for whom the keys must be added.
      @param {Array} keys The SSH keys, like ["ssh-rsa ...", ...].
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments:
          - a global error string, in the case an API/connection error is
            encountered, or null otherwise;
          - a list of possible errors encountered when adding keys, with
            indexes corresponding to the indexes in the keys argument.
          For instance, given a call to add key1 and key2, if it succeeds the
          callback is called with (null, [null, null]) while if key1 fails the
          callback is called with (null, ["some error", null]).
      @param {Object} options Options to pass to the ECS.
    */
    addKeys: function(user, keys, callback, options) {
      if (options && options.immediate) {
        this._addKeys(user, keys, callback);
        return;
      }
      this.get('ecs').lazyAddSSHKeys(
        [user, keys, callback], options);
    },

    /**
      Add new authorized SSH keys for the specified user.

      @param {String} user The user for whom the keys must be added.
      @param {Array} keys The SSH keys, like ["ssh-rsa ...", ...].
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments:
          - a global error string, in the case an API/connection error is
            encountered, or null otherwise;
          - a list of possible errors encountered when adding keys, with
            indexes corresponding to the indexes in the keys argument.
          For instance, given a call to add key1 and key2, if it succeeds the
          callback is called with (null, [null, null]) while if key1 fails the
          callback is called with (null, ["some error", null]).
    */
    _addKeys: function(user, keys, callback) {
      this._addOrImportKeys('AddKeys', user, keys, callback);
    },

    /**
      Add an importKeys item to the ECS to allow importing SSH keys into a
      model.

      @param {String} user The user for whom the keys must be imported.
      @param {Array} ids The list of sources from which to import SSH keys,
        with "gh:" (github) or "lp:" (launchpad) prefixes, for instance
        ["gh:who", "lp:dalek"].
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments:
          - a global error string, in the case an API/connection error is
            encountered, or null otherwise;
          - a list of possible errors encountered when importing keys, with
            indexes corresponding to the indexes in the ids argument.
          For instance, given a call to import id1 and id2, if it succeeds the
          callback is called with (null, [null, null]) while if id1 fails the
          callback is called with (null, ["some error", null]).
    */
    importKeys: function(user, keys, callback, options) {
      if (options && options.immediate) {
        this._importKeys(user, keys, callback);
        return;
      }
      this.get('ecs').lazyImportSSHKeys(
        [user, keys, callback], options);
    },

    /**
      Import new authorized SSH keys from the given key ids for the given user.

      @param {String} user The user for whom the keys must be imported.
      @param {Array} ids The list of sources from which to import SSH keys,
        with "gh:" (github) or "lp:" (launchpad) prefixes, for instance
        ["gh:who", "lp:dalek"].
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments:
          - a global error string, in the case an API/connection error is
            encountered, or null otherwise;
          - a list of possible errors encountered when importing keys, with
            indexes corresponding to the indexes in the ids argument.
          For instance, given a call to import id1 and id2, if it succeeds the
          callback is called with (null, [null, null]) while if id1 fails the
          callback is called with (null, ["some error", null]).
    */
    _importKeys: function(user, ids, callback) {
      this._addOrImportKeys('ImportKeys', user, ids, callback);
    },

    /**
      Used by addKeys and importKeys to either add the specified keys or import
      the specified ids.

      The request argument is either "AddKeys" or "ImportKeys"; all other
      arguments are described in the callers' docstrings.
    */
    _addOrImportKeys: function(request, user, keysOrIds, callback) {
      // Perform some client side validation.
      if (!user) {
        callback('no user provided', []);
        return;
      }
      if (!keysOrIds || !keysOrIds.length) {
        callback(null, []);
        return;
      }

      // Define the response handler.
      const handler = data => {
        if (!callback) {
          console.log(`data returned by KeyManager.${request} API:`, data);
          return;
        }
        if (data.error) {
          callback(data.error, []);
          return;
        }
        const results = data.response && data.response.results;
        if (!results || results.length !== keysOrIds.length) {
          // This should never happen.
          callback('unexpected results: ' + JSON.stringify(results), []);
          return;
        }
        callback(null, results.map(result => {
          return result.error ? result.error.message : null;
        }));
      };

      // Send the API call.
      this._send_rpc({
        type: 'KeyManager',
        request: request,
        params: {user: user, 'ssh-keys': keysOrIds}
      }, handler);
    },

    /**
      Return the authorized SSH keys for the specified user.

      @method listKeys
      @param {String} user The user for whom the keys must be listed.
      @param {Boolean} requestFullKeys Whether to request full keys or just the
        SSH key fingerprints to be returned and passed to the callback.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments: an error string
        and the list of keys as strings. If the operation succeeds, the error
        is null.
    */
    listKeys: function(user, requestFullKeys, callback) {
      if (!user) {
        callback('no user provided', []);
        return;
      }
      const handler = data => {
        if (!callback) {
          console.log('data returned by KeyManager.ListKeys API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, []);
          return;
        }
        const results = data.response && data.response.results;
        if (!results || results.length !== 1) {
          // This should never happen.
          callback('unexpected results: ' + JSON.stringify(results), []);
          return;
        }
        const result = results[0];
        const err = result.error && result.error.message;
        if (err) {
          callback('cannot list keys: ' + err, []);
          return;
        }
        callback(null, result.result);
      };

      // Send the API call.
      const entityTag = tags.build(tags.USER, user);
      this._send_rpc({
        type: 'KeyManager',
        request: 'ListKeys',
        params: {
          entities: {entities: [{tag: entityTag}]},
          mode: !!requestFullKeys
        }
      }, handler);
    },

    /**
      Return information about all entities in this model.

      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments: an error string
        and an empty object if an error occurred, null and the status result
        otherwise. The status result is an object similar to the following:

          {
            // Information about this model.
            model: {
              // The model name.
              name: "default",
              // The cloud in which the model lives.
              cloud: "aws",
              // The region for model machines.
              region: "eu-central-1",
              // The current version of the agents running on the model.
              version: "2.3-alpha1.1",
              // The optional version available for a model upgrade.
              availableVersion: "",
              // The level of the SLA, "unsupported", "essential", standard"
              // or "advanced";
              sla: "unsupported",
              // Information about model status.
              status: {
                // The agent status, like "available" or "error".
                status: "available",
                // Additional status info if relevant.
                info: "",
                // A date object with the datetime of latest status change.
                since: "2017-07-24T17:35:58.284859958Z",
                // Agent life cycle info.
                life: ""
              }
            },
            // An object mapping machine identifiers to machine status.
            machines: {
              "1": {
                // The machine identifier (again).
                id: "1",
                // The instance identifier.
                instanceID: "juju-39bb4b-1",
                // The machine series.
                series: "xenial",
                // The DNS name for the instance.
                dnsName: "10.56.39.236",
                // An array of IP addresses assigned to the instance.
                ipAddresses: ["10.56.39.236"],
                // The network interfaces for this machine as an object mapping
                // interface names to values.
                networkInterfaces: {
                  eth0: {
                    // An array of IP addresses assigned to the interface.
                    ipAddresses: ["10.56.39.236"],
                    // The interface MAC address.
                    macAddress: "00:16:3e:f8:e2:66",
                    // Whether the interface is up and running.
                    isUp: true
                  },
                },
                // Constraints used when provisioning this machine.
                constraints: "",
                // Hardware characteristics for the provisioned machine.
                hardware: "arch=amd64 cores=0 mem=0M",
                // A list of Juju jobs this machine is responsible for.
                jobs: ["JobHostUnits"],
                // Whether this machine is involved in leader election.
                hasVote: false,
                wantsVote: false,
                // The machine agent status.
                agent: {
                  // The agent status, like "started" or "error".
                  status: "started",
                  // Additional status info if relevant.
                  info: "",
                  // A date object with the datetime of latest status change.
                  since: "2017-07-27T09:06:38.403313203Z",
                  // Life cycle info.
                  life: ""
                },
                // The machine instance status.
                instance: {
                  // The agent status, like "running" or "allocating".
                  status: "running",
                  // Additional status info if relevant.
                  info: "Running",
                  // A date object with the datetime of latest status change.
                  since: "2017-07-27T09:05:31.888249394Z",
                  // Life cycle info.
                  life: ""
                },
                // A map of container identifiers to container properties.
                containers: {
                  "1/lxd/0": {
                    // This object basically includes all the fields already
                    // described for a machine entry, including the
                    // "containers" field itself, so that we can have multiple
                    // levels of container nesting.
                  }
                }
              }
            },
            // An object mapping app names with application status.
            applications: {
              mysql: {
                // The jujulib.URL object representing the charm URL.
                charm: URL("cs:mysql-57"),
                // The application series.
                series: "xenial",
                // Whether the application is exposed.
                exposed: false,
                // App life cycle.
                life: "",
                // Relations with other apps, as an object mapping endpoint
                // names to target applications.
                relations: {
                   cluster: ["mysql"],
                   db: ["wordpress"]
                },
                // A URL of the charm if an upgrade if possible, or null.
                canUpgradeTo: URL("cs:mysql-58"),
                // An array of application names this application is
                // subordinate to.
                subordinateTo: [],
                // The version of the workload provided by the application
                // (for instance, the MySQL version).
                workloadVersion: "5.7.19",
                // An object mapping unit names with unit status.
                units: {
                  "mysql/0":{
                    // The workload version (this time where it belongs, at the
                    // unit level.)
                    workloadVersion: "5.7.19",
                    // The machine where this unit is located.
                    machine: "1",
                    // A list of opened ports in the unit.
                    ports: ["3306/tcp"],
                    // The unit public address.
                    publicAddress: "10.56.39.236",
                    // Whether this unit is the leader.
                    isLeader: true,
                    // The unit agent status.
                    agent: {
                      // The agent status, like "idle" or "error".
                      status: "idle",
                      // Additional status info if relevant.
                      info: "",
                      // A date object with the datetime of latest change.
                      since: "2017-07-27T09:09:27.266603201Z",
                      // Life cycle info.
                      life: ""
                    },
                    // The unit workload status.
                    workload: {
                      // The workload status, like "active" or "error".
                      status: "active",
                      // Additional status info if relevant.
                      info: "Ready",
                      // A date object with the datetime of latest change.
                      since: "2017-07-27T09:09:26.605041846Z",
                      // Life cycle info.
                      life: ""
                    }
                  }
                },
                // The workload status of the leader unit.
                leaderStatus: {
                  // The workload status, like "active" or "error".
                  status: "active",
                  // Additional status info if relevant.
                  info: "Ready",
                  // A date object with the datetime of latest change.
                  since: "2017-07-27T09:09:26.605041846Z",
                  // Life cycle info.
                  life: ""
                }
             },
            },
            // An object mapping remote application names to their statuses.
            remoteApplications: {
              haproxy: {
                // The URL where the remote app can be found.
                url: "local:admin/controller.haproxy",
                // The name of the remote application (again).
                name: "haproxy",
                // A list of the endpoints offered by the remote application.
                endpoints: [{
                  name: "reverseproxy",
                  role: "requirer",
                  interface: "http",
                  limit: 0,
                  scope: "global"
                }],
                // Life cycle for the remote application.
                life: "",
                // Relations with other apps, as an object mapping endpoint
                // names to target applications.
                relations: {
                   reverseproxy: ["wordpress"]
                },
                // The remote application status.
                status: {
                  // The status, like "active" or "unknown".
                  status: "unknown",
                  // Additional status info if relevant.
                  info: "waiting for remote connection",
                  // A date object with the datetime of latest change.
                  since: "2017-07-27T10:55:55.481908354Z",
                  // Life cycle info.
                  life: ""
                }
              }
            },
            // A list of relations established in this model.
            relations: [
              {
                id: 1,
                key: "mysql:cluster",
                interface: "mysql-ha",
                scope: "global",
                endpoints: [{
                  application: "mysql",
                  name: "cluster",
                  role: "peer",
                  subordinate: false
                }]
              },
              {
                id: 3,
                key: "wordpress:db mysql:db",
                interface: "mysql",
                scope: "global",
                endpoints: [{
                  application: "mysql",
                  name: "db",
                  role: "provider",
                  subordinate: false
                }, {
                  application: "wordpress",
                  name: "db",
                  role: "requirer",
                  subordinate: false
                }]
              },
              {
                id: 4,
                key: "haproxy:reverseproxy wordpress:website",
                interface: "http",
                scope: "global",
                endpoints: [{
                  application: "wordpress",
                  name: "website",
                  role: "provider",
                  subordinate: false
                }, {
                  application: "haproxy",
                  name: "reverseproxy",
                  role: "requirer",
                  subordinate: false
                }]
              }
            ]
          }
    */
    fullStatus: function(callback) {
      // Define the callback handler.
      const handler = data => {
        if (!callback) {
          console.log('data returned by Client.FullStatus API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const resp = data.response;
        if (typeof resp !== 'object' || !Object.keys(resp).length) {
          callback('unexpected response: ' + JSON.stringify(resp), {});
          return;
        }
        // Define some reusable helpers.
        const URL = window.jujulib.URL;
        const objMap = (obj, func) => {
          if (!obj) {
            return {};
          }
          return Object.keys(obj).reduce((collected, key) => {
            const value = obj[key];
            collected[key] = func(value);
            return collected;
          }, {});
        };
        const makeStatus = data => ({
          status: data.status,
          info: data.info,
          life: data.life,
          since: new Date(data.since)
        });
        const makeMachine = data => ({
          id: data.id,
          instanceID: data['instance-id'],
          series: data.series,
          dnsName: data['dns-name'],
          ipAddresses: data['ip-addresses'],
          networkInterfaces: objMap(data['network-interfaces'], value => ({
            ipAddresses: value['ip-addresses'],
            macAddress: value['mac-address'],
            isUp: value['is-up']
          })),
          constraints: data.constraints,
          hardware: data.hardware,
          jobs: data.jobs,
          hasVote: data['has-vote'],
          wantsVote: data['wants-vote'],
          agent: makeStatus(data['agent-status']),
          instance: makeStatus(data['instance-status']),
          containers: objMap(data.containers, makeMachine)
        });
        const model = resp.model;
        const relations = resp.relations || [];
        // Call the callback with the retrieved status info.
        callback(null, {
          model: {
            name: model.name,
            cloud: tags.parse(tags.CLOUD, model['cloud-tag']),
            region: model.region,
            version: model.version,
            availableVersion: model['available-version'],
            sla: model.sla || '',
            status: makeStatus(model['model-status'])
          },
          machines: objMap(resp.machines, makeMachine),
          applications: objMap(resp.applications, app => ({
            charm: URL.fromLegacyString(app.charm),
            series: app.series,
            exposed: app.exposed,
            life: app.life,
            relations: app.relations,
            canUpgradeTo: (app['can-upgrade-to'] ?
              URL.fromLegacyString(app['can-upgrade-to']) : null),
            subordinateTo: app['subordinate-to'],
            workloadVersion: app['workload-version'],
            units: objMap(app.units, unit => ({
              workloadVersion: unit['workload-version'],
              machine: unit.machine,
              ports: unit['opened-ports'] || [],
              publicAddress: unit['public-address'],
              isLeader: unit.leader,
              agent: makeStatus(unit['agent-status']),
              workload: makeStatus(unit['workload-status'])
            })),
            leaderStatus: makeStatus(app.status)
          })),
          remoteApplications: objMap(resp['remote-applications'], app => ({
            url: app['application-url'],
            name: app['application-name'],
            endpoints: app.endpoints.map(endpoint => ({
              name: endpoint.name,
              role: endpoint.role,
              interface: endpoint.interface,
              limit: endpoint.limit,
              scope: endpoint.scope
            })),
            life: app.life,
            relations: app.relations,
            status: makeStatus(app.status)
          })),
          relations: relations.map(relation => ({
            id: relation.id,
            key: relation.key,
            interface: relation.interface,
            scope: relation.scope,
            endpoints: relation.endpoints.map(endpoint => ({
              application: endpoint.application,
              name: endpoint.name,
              role: endpoint.role,
              subordinate: endpoint.subordinate
            }))
          }))
        });
      };

      // Send the API call.
      this._send_rpc({
        type: 'Client',
        request: 'FullStatus',
        params: {}
      }, handler);
    },

    /**
      Make application endpoints available for consumption.

      @method offer
      @param {String} applicationName The name of the application being
        offered.
      @param {Array of strings} endpoints The offered endpoint names.
      @param {String} url The URL to use to reference the resulting remote
        application. For instance "local:/u/admin/ec2/django".
        If empty, a URL is automatically generated using the
        "local:/u/$user/$model-name/$application" pattern.
      @param {Array of strings} users Users that these endpoints are offered
        to. If left empty, the offer is considered public.
      @param {String} description Description for the offered application. It
        defaults to the description provided in the charm.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with the following
        attributes:
        - err: optional error, only defined if something went wrong;
        - applicationName: the provided name of the offered application;
        - endpoints: the provided offered endpoints;
        - url: the offered application URL.
    */
    offer: function(
      applicationName, endpoints, url, users, description, callback) {
      // Generate the URL if an empty one has been provided.
      // XXX frankban 2015/12/15: this will be done automatically by the
      // server, and the URL will be returned as part of the API response.
      if (!url) {
        var user = this.get('user').model.user;
        var envName = this.get('environmentName');
        url = 'local:/u/' + user + '/' + envName + '/' + applicationName;
      }

      // Define the API callback.
      var handleOffer = function(
        userCallback, applicationName, endpoints, url, data) {
        if (!userCallback) {
          console.log('data returned by offer API call:', data);
          return;
        }
        var err = data.error;
        if (!err) {
          var errResponse = data.response.results[0].error;
          err = errResponse && errResponse.message;
        }
        userCallback({
          err: err,
          applicationName: applicationName,
          endpoints: endpoints,
          url: url
        });
      }.bind(this, callback, applicationName, endpoints, url);

      // Build the API call parameters.
      if (users && users.length) {
        users = users.map(function(user) {
          return tags.build(tags.USER, user);
        });
      } else {
        users = ['user-public'];
      }
      var offer = {
        applicationname: applicationName,
        endpoints: endpoints,
        applicationurl: url,
        allowedusers: users,
        applicationdescription: description
      };

      // Perform the API call.
      this._send_rpc({
        type: 'CrossModelRelations',
        request: 'Offer',
        params: {offers: [offer]}
      }, handleOffer);
    },

    /**
      Return information about the requested remote application.

      @method remoteApplicationInfo
      @param {String} url The remote application URL, usually retrieved via the
        mega-watcher.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments: an error string
        and the requested information. If the operation succeeds, the error is
        null and the information is an object with the following fields:
          - modelTag: the tag of the model where the application lives;
          - modelId: the UUID of the model where the application lives;
          - name: the remote application name;
          - description: a description for the remote application;
          - url: the remote application URL;
          - sourceModel: only populated if the application originates from
            another model on the same controller rather than via an offer URL;
          - endpoints: each one having the name, role, interface, limit and
            scope fields;
          - icon: the remote application icon contents. Note that this is not a
            URL, this is the actual icon bytes.
    */
    remoteApplicationInfo: function(url, callback) {
      if (!url) {
        callback('no remote application URL provided', {});
        return;
      }
      const handler = data => {
        if (!callback) {
          console.log('data returned by RemoteApplicationInfo call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const results = data.response && data.response.results;
        if (!results || results.length !== 1) {
          // This should never happen.
          callback('unexpected results: ' + JSON.stringify(results), {});
          return;
        }
        const result = results[0];
        const err = result.error && result.error.message;
        if (err) {
          callback('cannot get remote application info: ' + err, {});
          return;
        }
        const info = result.result;
        let icon = '';
        if (info.icon) {
          icon = atob(info.icon);
        }
        callback(null, {
          modelTag: info['model-tag'],
          modelId: tags.parse(tags.MODEL, info['model-tag']),
          name: info.name,
          description: info.description,
          url: info['application-url'],
          sourceModel: info['source-model-label'],
          endpoints: info.endpoints.map(endpoint => {
            return {
              name: endpoint.name,
              role: endpoint.role,
              interface: endpoint.interface,
              limit: endpoint.limit,
              scope: endpoint.scope
            };
          }),
          icon: icon
        });
      };

      // Send the API call.
      this._send_rpc({
        type: 'Application',
        request: 'RemoteApplicationInfo',
        params: {'application-urls': [url]}
      }, handler);
    },

    /**
      Get all remote applications that have been offered from this Juju model.
      Each returned application satisfies at least one of the the specified
      filters.

      @method listOffers
      @param {Object} filters Not implemented.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with the following
        attributes:
        - err: optional error, only defined if something went wrong;
        - results: an array of objects representing a remote application, only
          present if the request succeeded.
          Each result has the following attributes:
          - err: possible error occurred while retrieving offer;
          - applicationName: the offered application name;
          - url: the URL used to reference the remote application;
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
        if (data.error) {
          userCallback({err: data.error, results: []});
          return;
        }
        // XXX frankban 2015/12/15: really?
        var apiResults = data.response.results[0].result;
        var results = apiResults.map(function(apiResult) {
          if (apiResult.error) {
            return {err: apiResult.error};
          }
          var result = apiResult.result;
          return {
            applicationName: result.applicationname,
            url: result.applicationurl,
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
      var filter = {'filter-terms': []};

      // Perform the API call.
      this._send_rpc({
        type: 'CrossModelRelations',
        request: 'ListOffers',
        params: {filters: [filter]}
      }, handleListOffers);
    },

    /**
      Retrieve offered remote application details for a given URL.

      @method getOffer
      @param {String} url The URL to the remote application.
        For instance "local:/u/admin/ec2/django".
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with the following
        attributes:
        - err: optional error, only defined if something went wrong;
        - applicationName: the offered application name;
        - url: the URL used to reference the remote application;
        - description: the human friendly description for the application;
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
        var err = data.error,
            response = {};
        if (!err) {
          response = data.response.results[0];
          err = response.error && response.error.message;
        }
        if (err) {
          userCallback({err: err});
          return;
        }
        var result = response.result;
        userCallback({
          applicationName: result.applicationname,
          url: result.applicationurl,
          description: result.applicationdescription,
          sourceName: result.sourcelabel,
          sourceId: tags.parse(tags.MODEL, result.sourceenviron),
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
        type: 'CrossModelRelations',
        request: 'ApplicationOffers',
        params: {applicationurls: [url]}
      }, handleGetOffer);
    },

    /**
      Lists users who have access to a Juju model by performing a
      Client.ModelUserInfo Juju API request.

      @method modelUserInfo
      @param {Function} callback A callable that must be called once the
        operation is performed. In case of errors, it will receive an error
        containing a string describing the problem and an empty list of users.
        Otherwise, if everything went well, it will receive null as first
        argument and a list of user objects, each one with the following
        fields:
        - name: the username like "who@external" or "admin";
        - displayName: the user's display name, without the "@" part;
        - domain: the user domain, like "local" or "Ubuntu SSO";
        - lastConnection: the last time the user connected to the model as a
          Date object, or null if the user has never connected;
        - access: the type of access the user has as a string, like "read" or
          "admin";
        - err: a message describing a specific user error, or undefined.
      @return {undefined} Sends a message to the server only.
    */
    modelUserInfo: function(callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by model user info API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, []);
          return;
        }
        const results = data.response.results;
        const users = results.map((result, index) => {
          const err = result.error && result.error.message;
          result = result.result || {};
          const parts = result.user ? result.user.split('@') : [''];
          let domain = 'local';
          if (parts.length === 2) {
            domain = parts[1] === 'external' ? 'Ubuntu SSO' : parts[1];
          }
          const displayName = result['display-name'] || parts[0];
          let lastConnection = null;
          if (result['last-connection']) {
            lastConnection = new Date(result['last-connection']);
          }
          return {
            name: result.user,
            displayName: displayName,
            domain: domain,
            lastConnection: lastConnection,
            access: result.access,
            err: err
          };
        });
        callback(null, users);
      };

      // Send the API request.
      this._send_rpc({
        type: 'Client',
        request: 'ModelUserInfo',
        params: {}
      }, handler);
    }

  }, {
    ATTRS: {
      maasServer: {
        value: null
      }
    }
  });


  module.endpointToName = endpointToName;
  module.createRelationKey = createRelationKey;
  module.GoEnvironment = GoEnvironment;
  module.lowerObjectKeys = lowerObjectKeys;
  module.parsePlacement = parsePlacement;
  module.stringifyObjectValues = stringifyObjectValues;
  module.machineJobs = machineJobs;

  var KVM = {label: 'KVM', value: 'kvm'},
      LXC = {label: 'LXC', value: 'lxc'},
      LXD = {label: 'LXD', value: 'lxd'};

  // Define features exposed by each Juju provider type.
  // To enable/disable containerization in the machine view, just add/remove
  // supportedContainerTypes to the provider types below.
  // TODO frankban: is this still used in the machine view? Or somewhere?
  module.providerFeatures = {
    // All container types (used when the "containers" feature flags is set).
    all: {
      supportedContainerTypes: [KVM, LXC, LXD]
    },
    // Microsoft Azure.
    azure: {
      supportedContainerTypes: []
    },
    // Amazon EC2.
    ec2: {
      supportedContainerTypes: [KVM, LXC, LXD]
    },
    // Joyent Cloud.
    joyent: {
      supportedContainerTypes: [KVM, LXC, LXD]
    },
    // Local (LXD).
    lxd: {
      supportedContainerTypes: []
    },
    // Canonical MAAS.
    maas: {
      supportedContainerTypes: [KVM, LXC, LXD]
    },
    // OpenStack or HP Public Cloud.
    openstack: {
      supportedContainerTypes: [KVM, LXC, LXD]
    },
    // Manual provider.
    manual: {
      supportedContainerTypes: []
    }
  };

}, '0.1.0', {
  requires: [
    'base',
    'juju-env-base',
    'juju-view-utils'
  ]
});
