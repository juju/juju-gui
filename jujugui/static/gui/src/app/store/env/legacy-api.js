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
 * @submodule legacy-api.go
 */

YUI.add('juju-env-legacy-api', function(Y) {
  const module = Y.namespace('juju.environments');
  const tags = module.tags;
  const utils = Y.namespace('juju.views.utils');

  // Define the Admin API facade versions for Juju 1.
  var ADMIN_FACADE_VERSION = 0;

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
   * The Go Juju environment.
   *
   * This class handles the websocket connection to the GoJuju API backend.
   *
   * @class GoLegacyEnvironment
   */
  function GoLegacyEnvironment(config) {
    // Invoke Base constructor, passing through arguments.
    GoLegacyEnvironment.superclass.constructor.apply(this, arguments);
  }

  GoLegacyEnvironment.NAME = 'legacy-api';

  Y.extend(GoLegacyEnvironment, module.BaseEnvironment, {

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
            serviceLegacyInfo: 1,
            relationLegacyInfo: 2,
            unitLegacyInfo: 3,
            machineLegacyInfo: 4,
            annotationLegacyInfo: 5,
          };
      data.Response.Deltas.forEach(function(delta) {
        var kind = delta[0],
            operation = delta[1],
            entityInfo = delta[2];
        deltas.push([kind + 'LegacyInfo', operation, entityInfo]);
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
      this._send_rpc({
        Type: 'AllWatcher',
        Request: 'Stop',
        Id: this._allWatcherId,
        Params: {}
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
      const tagConstraints = result.tags;
      if (tagConstraints) {
        result.tags = tagConstraints.split(',').reduce((collected, value) => {
          const tag = value.trim().split(/\s+/).join('-');
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
            user: tags.parse(tags.USER, response.AuthTag),
            password: response.Password
          });
        }
        // If login succeeded store the facades and retrieve environment info.
        // Starting from Juju 2.0, "Facades" is spelled "facades".
        var facadeList = response.facades || response.Facades || [];
        var facades = facadeList.reduce(function(previous, current) {
          previous[current.Name] = current.Versions;
          return previous;
        }, {});
        this.setConnectedAttr('facades', facades);
        this.environmentInfo();
        this._watchAll();
        // Start pinging the server.
        // XXX frankban: this is only required as a temporary workaround to
        // prevent Apache to disconnect the WebSocket in the embedded Juju.
        if (!this._pinger) {
          this._pinger = setInterval(
            this.ping.bind(this), module.PING_INTERVAL * 1000);
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
      this.fire('login', {
        err: data.Error || null,
        fromToken: fromToken
      });
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
        this.fire('login', {err: null});
        return;
      }
      if (this.pendingLoginResponse) {
        return;
      }
      var credentials = this.getCredentials();
      if (!credentials.user || !credentials.password) {
        this.fire('login', {err: 'invalid credentials provided'});
        return;
      }
      var params = {
        AuthTag: tags.build(tags.USER, credentials.user),
        Password: credentials.password
      };
      this._send_rpc({
        Type: 'Admin',
        Request: 'Login',
        Params: params,
        Version: ADMIN_FACADE_VERSION
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
      cback('macaroon auth requires Juju 2');
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
      console.log('cleaning up the legacy model API connection');
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
        this.fire('login', {err: null});
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
      this.setConnectedAttr('defaultSeries', response.DefaultSeries);
      this.setConnectedAttr('providerType', response.ProviderType);
      this.setConnectedAttr('environmentName', response.Name);
      // For now we only need to call environmentGet if the provider is MAAS.
      if (response.ProviderType !== 'maas') {
        // Set the MAAS server to null, so that subscribers waiting for this
        // attribute to be set can be released.
        this.setConnectedAttr('maasServer', null);
        return;
      }
      this.environmentGet(data => {
        if (data.err) {
          console.warn('error calling ModelGet API: ' + data.err);
          return;
        }
        this.setConnectedAttr('maasServer', data.config['maas-server']);
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
      var request = 'EnvironmentInfo';
      this._send_rpc({
        Type: 'Client',
        Request: request
      }, this._handleEnvironmentInfo);
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
        intermediateCallback = this._handleEnvironmentGet.bind(null, callback);
      }
      var facade = 'Client';
      var request = 'EnvironmentGet';
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
        this.fire('login', {err: 'cannot upload files anonymously'});
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
      var credentials = this.getCredentials();
      var path = '/juju-core/charms?url=' + charmUrl + '&file=' + filename;
      var webHandler = this.get('webHandler');
      // TODO frankban: allow macaroons based auth here.
      return webHandler.getUrl(
        path, tags.build(tags.USER, credentials.user), credentials.password);
    },

    /**
      Return the full URL to a local charm icon.

      @method getLocalCharmIcon
      @param {String} charmUrl The local charm URL, for instance
        "local:trusty/django-42".
      @return {String} The full URL to the icon, including auth credentials.
    */
    getLocalCharmIcon: function(charmUrl) {
      return this.getLocalCharmFileUrl(charmUrl, 'icon.svg');
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
        intermediateCallback = this._handleDeployerStatus.bind(this, callback);
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
        intermediateCallback = this.handleDeployerWatch.bind(this, callback);
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
        intermediateCallback = this.handleDeployerNext.bind(this, callback);
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
      if (options && options.immediate) {
        this._addCharm(url, macaroon, callback);
        return;
      }
      this.get('ecs').lazyAddCharm([url, macaroon, callback], options);
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
    deploy: function(args, callback, options) {
      if (options && options.immediate) {
        this._deploy(args, callback);
        return;
      }
      this.get('ecs').lazyDeploy([args, callback], options);
    },

    /**
      Deploy a charm.

      @method _deploy
      @param {Object} args The arguments required to execute the call to deploy
        the charm, including:
        - {String} charmURL: the URL of the charm;
        - {String} applicationName: the name of the resulting application;
        - {Integer} numUnits: the number of units to be added, defaulting to 0;
        - {Object} config: the optional charm configuration options;
        - {String} configRaw: the optional YAML representation of the charm
          configuration options. Only one of `config` and `configRaw` should be
          provided, though `configRaw` takes precedence if it is given;
        - {Object} constraints: the optional machine constraints to use in the
          object format key: value;
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
        if (data.Error) {
          callback(data.Error, '', '');
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
        ServiceName: args.applicationName,
        Config: stringifyObjectValues(args.config || {}),
        ConfigYAML: args.configRaw || '',
        Constraints: constraints,
        CharmUrl: args.charmURL,
        NumUnits: args.numUnits || 0
      };

      // Perform the API call.
      this._send_rpc({
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: params
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
        var response = {applicationName: applicationName, err: data.Error};
        Object.keys(args).forEach((key) => {
          response[key] = args[key];
        });
        userCallback(response);
      }.bind(this, callback, applicationName, args);

      // Prepare the request parameters.
      var params = {};
      if (args.url) {
        params.CharmUrl = args.url;
        var forceUnits = !!args.forceUnits;
        var forceSeries = !!args.forceSeries;
        // Because the call signature has changed a bit to properly set
        // force on the old facade we will force if either of the forced
        // values are truthy.
        params.ForceCharmUrl = forceUnits || forceSeries;
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

      // Prepare the request and perform the API call.
      var request;
      params.ServiceName = applicationName;
      request = {Type: 'Client', Request: 'ServiceUpdate', Params: params};
      this._send_rpc(request, handler);
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
    setCharm: function(applicationName, url, forceUnits, forceSeries,
                       callback) {
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
          err: data.Error,
          applicationName: applicationName
        };
        if (data.Error) {
          transformedData.numUnits = numUnits;
        } else {
          var units = data.Response.Units;
          transformedData.result = units;
          transformedData.numUnits = units.length;
        }
        // Call the original user callback.
        userCallback(transformedData);
      }.bind(this, callback);

      // Make the call.
      this._send_rpc({
        Type: 'Client',
        Request: 'AddServiceUnits',
        Params: {
          ServiceName: applicationName,
          NumUnits: numUnits,
          ToMachineSpec: toMachine
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
        userCallback({err: data.Error, unit_names: unitNames});
      }.bind(this, callback, unitNames);

      // Perform the API call.
      this._send_rpc({
        Type: 'Client',
        Request: 'DestroyServiceUnits',
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
        Type: 'Client',
        Request: 'ServiceExpose',
        Params: {ServiceName: applicationName}
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
        Type: 'Client',
        Request: 'ServiceUnexpose',
        Params: {ServiceName: applicationName}
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
      callback({err: data.Error, applicationName: applicationName});
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
        if (data.Error) {
          response.err = data.Error;
          userCallback(response);
          return;
        }
        userCallback(response);
      }.bind(this, callback, entity);

      // Prepare the API request.
      var tag = this.generateTag(entity, type);
      data = stringifyObjectValues(data);

      // Perform the request to set annotations.
      this._send_rpc({
        Type: 'Client',
        Request: 'SetAnnotations',
        Params: {Tag: tag, Pairs: data}
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
      var handler;
      var tag = this.generateTag(entity, type);
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
    },

    /**
      Generate the tag for the given entity and entity type.

      @method generateTag
      @param {String} entity The name of a machine, unit, application, or
        model, e.g. '0', 'mysql-0', or 'mysql'.
      @param {String} type The type of entity that is being annotated
        (e.g.: 'application', 'unit', 'machine', 'model').
      @return {String} The entity tag.
    */
    generateTag: function(entity, type) {
      // The GUI is connected to an old Juju 1 environment. So we need to
      // convert entity types to legacy ones.
      if (type === 'application') {
        type = 'service';
      }
      if (type === 'model') {
        type = 'environment';
      }
      return type + '-' + entity;
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
        Type: 'Client',
        Request: 'ServiceGet',
        Params: {ServiceName: applicationName}
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
      var config = (data.Response || {}).Config;
      var transformedConfig = {};
      Object.keys(config).forEach(key => {
        const value = config[key];
        transformedConfig[key] = value.value;
      });
      callback({
        err: data.Error,
        applicationName: applicationName,
        result: {
          config: transformedConfig,
          constraints: (data.Response || {}).Constraints
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
        // Need to check that the applicationName is a real application name
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
        Type: 'Client',
        Request: 'ServiceDestroy',
        Params: {ServiceName: applicationName}
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
        intermediateCallback = this.handleResolved.bind(
          null, callback, unitName);
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
        var response = data.Response;
        if (response && response.Endpoints) {
          var applicationNameA = epA.split(':')[0];
          var applicationNameB = epB.split(':')[0];
          result.endpoints = [];
          [applicationNameA, applicationNameB].forEach(name => {
            var jujuEndpoint = response.Endpoints[name];
            var guiEndpoint = {};
            guiEndpoint[name] = {'name': jujuEndpoint.Name};
            result.endpoints.push(guiEndpoint);
          });
          result.id = createRelationKey(response.Endpoints);
          // The interface and scope should be the same for both endpoints.
          result['interface'] = response.Endpoints[applicationNameA].Interface;
          result.scope = response.Endpoints[applicationNameA].Scope;
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
        Type: 'Client',
        Request: 'AddRelation',
        Params: {
          Endpoints: [epA, epB]
        }
      };
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
        userCallback({err: data.Error, endpoint_a: epA, endpoint_b: epB});
      }.bind(this, callback, epA, epB);

      // Send the API request.
      var request = {
        Type: 'Client',
        Request: 'DestroyRelation',
        Params: {Endpoints: [epA, epB]}
      };
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
        // Capture the callback. No context is passed.
        intermediateCallback = this.handleCharmInfo.bind(null, callback);
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
        Object.keys(items).forEach(key => {
          result[key] = lowerObjectKeys(items[key]);
        });
        return result;
      };
      // Build the transformed data structure.
      var result,
          response = data.Response || {};
      if (Object.keys(response).length > 0) {
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
        a list of errors (each one being a string describing a possible error)
        and a list of bundle changes.
        Detailed responses for the legacy GUI server calls can be found at
        http://bazaar.launchpad.net/~juju-gui/charms/trusty/juju-gui/trunk/
                      view/head:/server/guiserver/bundles/__init__.py#L322
    */
    getBundleChanges: function(bundleYAML, changesToken, callback) {
      const handle = data => {
        if (!callback) {
          console.log('data returned by ChangeSet.GetChanges:', data);
          return;
        }
        if (data.Error) {
          callback([data.Error], []);
          return;
        }
        const response = data.Response;
        if (response.Errors && response.Errors.length) {
          callback(response.Errors, []);
          return;
        }
        callback([], response.Changes);
      };
      // Prepare the request parameters.
      const params = Object.create(null);
      if (bundleYAML !== null) {
        params.YAML = bundleYAML;
      } else {
        params.Token = changesToken;
      }
      this._send_rpc({
        Type: 'ChangeSet',
        Request: 'GetChanges',
        Params: params
      }, handle);
    },

    /**
      Create a new model within this controller, using the given name.

      @method createModel
      @param {String} name The name of the new model.
      @param {String} user The name of the new model owner.
      @param {Object} args Ignored and only present for forward compatibility
        with the new Juju API.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error (as a string
        describing the problem if any occurred, or null) and an object with the
        following attributes:
        - name: the name of the new model;
        - uuid: the unique identifier of the new model;
        - owner: the name of the model owner.
      @return {undefined} Sends a message to the server only.
    */
    createModel: function(name, user, args, callback) {
      const handler = data => {
        if (!callback) {
          console.log('data returned by CreateModel API call:', data);
          return;
        }
        if (data.Error) {
          callback(data.Error, {});
          return;
        }
        const response = data.Response;
        callback(null, {
          name: response.Name,
          uuid: response.UUID,
          owner: tags.parse(tags.USER, response.OwnerTag)
        });
      };
      // In order to create a new model, we first need to retrieve the
      // configuration skeleton for this provider.
      this._send_rpc({
        Type: 'EnvironmentManager',
        Request: 'ConfigSkeleton',
      }, data => {
        if (data.Error) {
          handler({Error: 'cannot get configuration skeleton: ' + data.Error});
          return;
        };
        const config = data.Response.Config;
        // Then, having the configuration skeleton, we need configuration
        // options for this specific model.
        this.environmentGet(data => {
          if (data.err) {
            handler({Error: 'cannot get model configuration: ' + data.err});
            return;
          }
          config.name = name;
          // juju 1 required clients to provide SSH keys at this point when
          // creating models. This is fixed starting from Juju 2.
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
            Type: 'EnvironmentManager',
            Request: 'CreateEnvironment',
            Params: {
              OwnerTag: tags.build(tags.USER, user),
              Config: config
            }
          }, handler);
        });
      });
    },

  /**
      List all models the user can access on the current controller.

      @method listModels
      @param {String} user The user name.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error string and a list of
        models. If an error occurs, the error string will describe the error
        and the second argument will be an empty list. Otherwise, the error
        will be null and the model list will be an array of objects, each one
        with the following fields:
        - name: the name of the model;
        - id: the identifier for the model, like "de1b2c16-0151-4e63-87e9";
        - owner: the model owner;
        - uuid: the unique identifier of the model (same as id);
        - lastConnection: the date of the last connection as a string, e.g.:
          '2015-09-24T10:08:50Z' or null if the model has been never
          connected to;
      @return {undefined} Sends a message to the server only.
    */
    listModels: function(user, callback) {
      const handleListModels = data => {
        if (!callback) {
          console.log('data returned by ListEnvironments API call:', data);
          return;
        }
        if (data.Error) {
          callback(data.Error, []);
          return;
        }
        const results = data.Response.UserEnvironments || [];
        const models = results.map(value => {
          return {
            name: value.Name,
            id: value.UUID,
            owner: tags.parse(tags.USER, value.OwnerTag),
            uuid: value.UUID,
            lastConnection: value.LastConnection
          };
        });
        callback(null, models);
      };
      // Send the API request.
      this._send_rpc({
        Type: 'EnvironmentManager',
        Request: 'ListEnvironments',
        Params: {Tag: tags.build(tags.USER, user)}
      }, handleListModels);
    },

    /**
      Return detailed information about Juju models available for current user.
      Under the hood, this call leverages the ModelManager ListModels and
      ModelInfo endpoints.

      @method listModelsWithInfo
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments, the first
        an error or null and the second a list of model objects.
    */
    listModelsWithInfo: function(callback) {
      // TODO frankban: implement by only using listModels.
      callback('not implemented', []);
    },

    /**
      Return the authorized SSH keys for the specified user.
      Only defined for API compatibility, but not implemented for legacy Juju.

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
      callback('not implemented', []);
    }

  });

  module.legacyCreateRelationKey = createRelationKey;
  module.GoLegacyEnvironment = GoLegacyEnvironment;
  module.legacyParsePlacement = parsePlacement;

  var KVM = {label: 'KVM', value: 'kvm'},
      LXC = {label: 'LXC', value: 'lxc'};

}, '0.1.0', {
  requires: [
    'base',
    'json-parse',
    'json-stringify',
    'juju-env-base',
    'juju-view-utils'
  ]
});
