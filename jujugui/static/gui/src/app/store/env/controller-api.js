/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://github.com/juju/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('juju-controller-api', function(Y) {

  // Define the pinger interval in seconds.
  var PING_INTERVAL = 10;

  // Define the Admin API facade version.
  var ADMIN_FACADE_VERSION = 3;

  /**
   * The Go Juju environment.
   *
   * This class handles the WebSocket connection to the GoJuju API backend.
   *
   * @class ControllerAPI
   */
  function ControllerAPI(config) {
    // Invoke Base constructor, passing through arguments.
    ControllerAPI.superclass.constructor.apply(this, arguments);
  }

  ControllerAPI.NAME = 'controller-api';

  Y.extend(ControllerAPI, Y.juju.environments.BaseEnvironment, {

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
      this._pinger = null;
      // pendingLoginResponse is set to true when the login process is running.
      this.pendingLoginResponse = false;
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
        this.set('facades', facades);
        var userInfo = response['user-info'];
        this.set('controllerAccess', userInfo['controller-access']);
        this.set('serverTag', response['server-tag']);
        // Start pinging the server.
        // XXX frankban: this is only required as a temporary workaround to
        // prevent Apache to disconnect the WebSocket in the embedded Juju.
        if (!this._pinger) {
          this._pinger = setInterval(
            this.ping.bind(this), PING_INTERVAL * 1000);
        }
        // Clean up for log out text.
        this.failedAuthentication = false;
      } else {
        // If the credentials were rejected remove them.
        this.setCredentials(null);
        this.failedAuthentication = true;
      }
      this.fire('login', {err: data.error || null});
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
        this.fire('login', {err: 'invalid username or password'});
        return;
      }
      this._send_rpc({
        type: 'Admin',
        request: 'Login',
        params: {
          'auth-tag': credentials.user,
          credentials: credentials.password
        },
        version: ADMIN_FACADE_VERSION
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
          type: 'Admin',
          request: 'Login',
          version: ADMIN_FACADE_VERSION
        };
        if (macaroons) {
          request.params = {macaroons: [macaroons]};
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

      @method beforeClose
      @param {Function} callback A callable that must be called by the
        function and that actually closes the connection.
    */
    beforeClose: function(callback) {
      if (this._pinger) {
        clearInterval(this._pinger);
        this._pinger = null;
      }
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
        var err = data.error && data.error.message;
        if (err) {
          userCallback({err: err});
          return;
        }
        var results = data.response.results;
        if (results.length !== tags.length) {
          // Sanity check: this should never happen.
          userCallback({
            err: 'unexpected results: ' + JSON.stringify(results)
          });
          return;
        }
        var models = results.map(function(result, index) {
          err = result.error && result.error.message;
          if (err) {
            return {tag: tags[index], err: err};
          }
          result = result.result;
          return {
            tag: tags[index],
            name: result.name,
            series: result['default-series'],
            provider: result['provider-type'],
            uuid: result.uuid,
            serverUuid: result['controller-uuid'],
            ownerTag: result['owner-tag'],
            life: result.life,
            isAlive: result.life === 'alive',
            isAdmin: result.uuid === result['controller-uuid']
          };
        });
        userCallback({models: models});
      }.bind(this, callback, tags);

      // Send the API request.
      var entities = tags.map(function(tag) {
        return {tag: tag};
      });
      this._send_rpc({
        type: 'ModelManager',
        request: 'ModelInfo',
        params: {entities: entities}
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
      Create a new model within this controller, using the given name, account
      and config.

      @method createModel
      @param {String} name The name of the new model.
      @param {String} userTag The name of the new model owner, including the
        "user-" prefix. If the user tag represents a local user, that user must
        exist.
      @param {Object} args Any other optional argument that can be provided
        when creating a new model. This includes the following fields:
        - config: the optional model config;
        - cloudTag: the tag of the cloud to create the model in. If this is
          empty/undefined the model will be created in the same cloud as the
          controller model. A cloud tag is a cloud name prefixed with "cloud-";
        - region: the name of the cloud region to create the model in. If the
          cloud does not support regions, this must be empty/undefined. If this
          is empty/undefined, and cloudTag is empty/undefined, the model will
          be created in the same region as the controller model;
        - credentialTag: the tag of the cloud credential to use for managing
          the model's resources. If the cloud does not require credentials
          this may be empty/undefined. If this is empty/undefined and the
          owner is the controller owner then the same credential used for the
          controller model will be used. A credential tag is a credential name
          prefixed with "cloudcred-".
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error (as a string
        describing the problem if any occurred, or null) and an object with the
        following attributes:
        - name: the name of the new model;
        - uuid: the unique identifier of the new model;
        - ownerTag: the model owner tag (prefixed with "user-");
        - owner: the name of the user owning the model;
        - provider: the model provider type;
        - series: the model default series;
        - cloudTag: the cloud tag (prefixed with "cloud-");
        - cloud: the name of the cloud;
        - region: the cloud region;
        - credentialTag: the tag of the cloud credential used to create the
          model (prefixed with "cloudcred-");
        - credential: the name of the credential used to create the model;
      @return {undefined} Sends a message to the server only.
    */
    createModel: function(name, userTag, args, callback) {
      // Define the API callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by CreateModel API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error, {});
          return;
        }
        const response = data.response;
        userCallback(null, {
          name: response.name,
          uuid: response.uuid,
          ownerTag: response['owner-tag'],
          owner: response['owner-tag'].replace(/^user-/, ''),
          provider: response['provider-type'],
          series: response['default-series'],
          cloudTag: response['cloud-tag'],
          cloud: response['cloud-tag'].replace(/^cloud-/, ''),
          region: response['cloud-region'],
          credentialTag: response['cloud-credential-tag'],
          credential: response['cloud-credential-tag'].replace(
            /^cloudcred-/, '')
        });
      }.bind(this, callback);

      // Prepare API call params.
      if (userTag.indexOf('@') === -1) {
        userTag += '@local';
      }

      // Send the API call.
      this._send_rpc({
        type: 'ModelManager',
        request: 'CreateModel',
        params: {
          name: name,
          'owner-tag': userTag,
          config: args.config || undefined,
          'cloud-tag': args.cloudTag || undefined,
          region: args.region || undefined,
          credential: args.credentialTag || undefined
        }
      }, handler);
    },

    /**
      Destroy the models with the given tags.

      This method will try to destroy the specified models.
      It is possible to destroy either other models in the same controller or
      the current connected model, in which case clients, sooner or later after
      the server response is received, will likely want to switch to another
      model not being killed.

      Note that all applications withing the specified models will be destroyed
      as well, and it's not possible to recover from model's removal.
      Also note that currently (2016-08-16) nothing prevents this call from
      destroying the controller model, therefore also disconnecting or even
      auto-destroying the GUI itself, for instance in the GUI in Juju scenario.
      For this reason callers are responsible of checking whether a model tag
      identifies a controller model before calling this method.

      @method destroyModels
      @param {Array} tags The Juju tags of the models, each one being a string,
        for instance "model-5bea955d-7a43-47d3-89dd-b02c923e2447".
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an object with an "err" field
        if a global API error occurred. Otherwise, the returned object will
        have a "results" field as an object mapping model tags to possible
        error strings, or to null if the deletion of that model succeeded.
      @return {undefined} Sends a message to the server only.
    */
    destroyModels: function(tags, callback) {
      // Decorate the user supplied callback.
      var handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by destroy models API call:', data);
          return;
        }
        if (data.error) {
          userCallback({err: data.error});
          return;
        }
        var results = data.response.results.reduce((prev, result, index) => {
          var tag = tags[index];
          prev[tag] = result.error ? result.error.message : null;
          return prev;
        }, {});
        userCallback({results: results});
      }.bind(this, callback);

      // Send the API request.
      var entities = tags.map(function(tag) {
        return {tag: tag};
      });
      this._send_rpc({
        type: 'ModelManager',
        request: 'DestroyModels',
        params: {entities: entities}
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
      var handleListModels = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by listModels API call:', data);
          return;
        }
        var transformedData = {
          err: data.error,
        };
        if (!data.error) {
          var response = data.response;
          transformedData.envs = response['user-models'].map(function(value) {
            var model = value.model;
            return {
              name: model.name,
              owner: model['owner-tag'],
              tag: 'model-' + model.uuid,
              uuid: model.uuid,
              lastConnection: value['last-connection']
            };
          });
        }
        // Call the original user callback.
        userCallback(transformedData);
      }.bind(this, callback);

      this._send_rpc({
        type: 'ModelManager',
        request: 'ListModels',
        params: {tag: userTag}
      }, handleListModels);
    },

    /**
      Return the definitions of all clouds supported by the controller.

      @method listClouds
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and an object mapping cloud tags to
        cloud attributes. If no errors occur, the error parameter is null.
        Otherwise, in case of errors, the second argument is an empty object.
        Cloud attributes are returned as an object with the following fields:
        - name: the cloud name, like "lxd" or "google";
        - cloudType: the cloud type, like "lxd" or "gce";
        - authTypes: optional supported authentication systems, like "jsonfile"
          or "oauth2" in the google compute example;
        - endpoint: optional cloud endpoint, like "https://www.googleapis.com";
        - identityEndpoint: optional URL of the identity manager;
        - storageEndpoint: optional storage endpoint;
        - regions: the list of regions supported by the cloud, each one being
          an object with the following fields: name, endpoint, identityEndpoint
          and storageEndpoint.
      A cloud tag is a cloud name prefixed with "cloud-", like "cloud-lxd" or
      "cloud-google".
    */
    listClouds: function(callback) {
      // Decorate the user supplied callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by Cloud.Clouds API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error, {});
          return;
        }
        const results = data.response.clouds;
        const clouds = Object.keys(results).reduce((prev, tag) => {
          prev[tag] = this._parseCloudResult(tag, results[tag]);
          return prev;
        }, {});
        userCallback(null, clouds);
      }.bind(this, callback);
      // Send the API request.
      this._send_rpc({type: 'Cloud', request: 'Clouds'}, handler);
    },

    /**
      Return the definitions of the clouds with the given tags.

      @method getClouds
      @param {Array} tags The Juju tags of the clouds, each one being a string,
        for instance "cloud-lxd" or "cloud-google.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and an object mapping cloud tags to
        cloud attributes. If no errors occur, the error parameter is null.
        Otherwise, in case of errors, the second argument is an empty object.
        Cloud attributes are returned as an object with the following fields:
        - err: a possible cloud specific error, in which case all subsequent
          fields are omitted;
        - name: the cloud name, like "lxd" or "google";
        - cloudType: the cloud type, like "lxd" or "gce";
        - authTypes: optional supported authentication systems, like "jsonfile"
          or "oauth2" in the google compute example;
        - endpoint: optional cloud endpoint, like "https://www.googleapis.com";
        - identityEndpoint: optional URL of the identity manager;
        - storageEndpoint: optional storage endpoint;
        - regions: the list of regions supported by the cloud, each one being
          an object with the following fields: name, endpoint, identityEndpoint
          and storageEndpoint.
      A cloud tag is a cloud name prefixed with "cloud-", like "cloud-lxd" or
      "cloud-google".
    */
    getClouds: function(tags, callback) {
      // Decorate the user supplied callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by Cloud.Cloud API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error, {});
          return;
        }
        const results = data.response.results;
        if (!results) {
          userCallback(null, {});
          return;
        }
        const clouds = results.reduce((prev, result, index) => {
          const tag = tags[index];
          const err = result.error && result.error.message;
          if (err) {
            prev[tag] = {err: err};
            return prev;
          }
          prev[tag] = this._parseCloudResult(tag, result.cloud);
          return prev;
        }, {});
        userCallback(null, clouds);
      }.bind(this, callback);
      // Send the API request.
      if (!tags.length) {
        tags = [];
      }
      const entities = tags.map(function(tag) {
        return {tag: tag};
      });
      this._send_rpc({
        type: 'Cloud',
        request: 'Cloud',
        params: {entities: entities}
      }, handler);
    },

    /**
      Return the tag of the cloud that models will be created in by default in
      this controller.

      @method getDefaultCloudTag
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error and the cloud tag,
        for instance (null, 'cloud-google') when the operation succeeds or
        ('error message', '') in case of errors.
      A cloud tag is a cloud name prefixed with "cloud-", like "cloud-lxd" or
      "cloud-google".
    */
    getDefaultCloudTag: function(callback) {
      // Decorate the user supplied callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by Cloud.DefaultCloud API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error, '');
          return;
        }
        const response = data.response;
        const error = response.error && response.error.message;
        if (error) {
          userCallback(error , '');
          return;
        }
        userCallback(null, response.result);
      }.bind(this, callback);
      // Send the API request.
      this._send_rpc({type: 'Cloud', request: 'DefaultCloud'}, handler);
    },

    /**
      Parse a single cloud result retrieved by requesting endpoints on the
      Cloud facade.

      @method _parseCloudResult
      @param {String} tag The cloud tag identifying the result.
      @param {Object} result The cloud result.
      @returns {Object} the parsed/modified result.
    */
    _parseCloudResult: function(tag, result) {
      const regions = result.regions.map(region => {
        return {
          name: region.name,
          endpoint: region.endpoint || '',
          identityEndpoint: region['identity-endpoint'] || '',
          storageEndpoint: region['storage-endpoint'] || ''
        };
      });
      return {
        name: tag.slice('cloud-'.length),
        cloudType: result.type,
        authTypes: result['auth-types'] || [],
        endpoint: result.endpoint || '',
        identityEndpoint: result['identity-endpoint'] || '',
        storageEndpoint: result['storage-endpoint'] || '',
        regions: regions
      };
    },

    /**
      Returns the tags of cloud credentials for a set of users.

      @method getTagsForCloudCredentials
      @param {Array} userCloudPairs A list of (user-tag, cloud-tag) pairs for
        which to retrieve the credentials, like
        [['user-admin', 'cloud-google'], ['user-who@external', 'cloud-lxd']].
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and a sequence of results. In the
        sequence of results each result refers to the corresponding provided
        user/cloud pair and holds an object with the following fields:
        - err: a possible result specific error, in which case all subsequent
          fields are omitted;
        - tags: the list of tags that identify cloud credentials corresponding
          to the user/cloud pair provided as input.
        If no errors occur, error parameters are null. Otherwise, in case of
        errors, the second argument is an empty array.
    */
    getTagsForCloudCredentials: function(userCloudPairs, callback) {
      // Decorate the user supplied callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log(
            'data returned by Cloud.UserCredentials API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error, []);
          return;
        }
        const results = data.response.results;
        if (!results) {
          userCallback(null, []);
          return;
        }
        const credentials = results.map(result => {
          const err = result.error && result.error.message;
          if (err) {
            return {err: err};
          }
          return {tags: result.result || []};
        });
        userCallback(null, credentials);
      }.bind(this, callback);
      // Send the API request.
      if (!userCloudPairs.length) {
        userCloudPairs = [];
      }
      const userClouds = userCloudPairs.map(userCloud => {
        return {'user-tag': userCloud[0], 'cloud-tag': userCloud[1]};
      });
      this._send_rpc({
        type: 'Cloud',
        request: 'UserCredentials',
        params: {'user-clouds': userClouds}
      }, handler);
    },

    /**
      Return the specified cloud credentials for each tag, minus secrets.

      @method getCloudCredentials
      @param {Array} tags The Juju tags of the credentials, each one being a
        string, for instance "cloudcred-google_dalek@local_google". Tags for
        credentials are usually retrieved by calling the
        getTagsForCloudCredentials method (see above).
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and an object mapping credentials tags
        to corresponding cloud credentials info. If no errors occur, the error
        parameter is null. Otherwise, in case of errors, the second argument is
        an empty object. Credentials info is returned as objects with the
        following fields:
        - err: a possible credentials specific error, in which case all
          subsequent fields are omitted;
        - name: the cloud credentials name, like "google_dalek@local_google";
        - authType: the authentication type (as a string, like 'jsonfile');
        - attrs: non-secret credential values as an object mapping strings to
          strings. Keys there are based on the cloud type;
        - redacted: a list of names of redacted attributes.
        If no errors occur, error parameters are null. Otherwise, in case of
        errors, the second argument is an empty object.
    */
    getCloudCredentials: function(tags, callback) {
      // Decorate the user supplied callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log('data returned by Cloud.Credential API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error, {});
          return;
        }
        const results = data.response.results;
        if (!results) {
          userCallback(null, {});
          return;
        }
        const credentials = results.reduce((prev, result, index) => {
          const tag = tags[index];
          const err = result.error && result.error.message;
          if (err) {
            prev[tag] = {err: err};
            return prev;
          }
          const entry = result.result;
          prev[tag] = {
            name: tag.slice('cloudcred-'.length),
            authType: entry['auth-type'] || '',
            attrs: entry.attrs || {},
            redacted: entry.redacted || []
          };
          return prev;
        }, {});
        userCallback(null, credentials);
      }.bind(this, callback);
      // Send the API request.
      if (!tags.length) {
        tags = [];
      }
      const entities = tags.map(tag => {
        return {tag: tag};
      });
      this._send_rpc({
        type: 'Cloud',
        request: 'Credential',
        params: {entities: entities}
      }, handler);
    },

    /**
      Create or update a single cloud credential.

      @method updateCloudCredential
      @param {String} tag The Juju tag of the credential as a string, for
        instance "cloudcred-google_dalek@local_google". Tags for credentials
        are usually retrieved by calling the getTagsForCloudCredentials method.
      @params {String} authType The authentication type, like "userpass",
        "oauth2" or just "empty".
      @params {Object} attrs Attributes containing credential values, as an
        object mapping strings to strings.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error message or null if the
        credential creation/update succeeded.
    */
    updateCloudCredential: function(tag, authType, attrs, callback) {
      // Decorate the user supplied callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log(
            'data returned by Cloud.UpdateCredentials API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error);
          return;
        }
        const results = data.response.results;
        if (!results || results.length !== 1) {
          // This should never happen.
          userCallback(
            'invalid results returned by Juju: ' + JSON.stringify(results));
          return;
        }
        const err = results[0].error && results[0].error.message;
        if (err) {
          userCallback(err);
          return;
        }
        userCallback(null);
      }.bind(this, callback);
      // Send the API request.
      const credentials = [{
        tag: tag,
        credential: {'auth-type': authType || '', attrs: attrs || {}}
      }];
      this._send_rpc({
        type: 'Cloud',
        request: 'UpdateCredentials',
        params: {credentials: credentials}
      }, handler);
    },

    /**
      Revoke the cloud credential with the given tag.

      @method revokeCloudCredential
      @param {String} tag The Juju tag of the credential as a string, for
        instance "cloudcred-google_dalek@local_google". Tags for credentials
        are usually retrieved by calling the getTagsForCloudCredentials method.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error message or null if the
        credential revocation succeeded.
    */
    revokeCloudCredential: function(tag, callback) {
      // Decorate the user supplied callback.
      const handler = function(userCallback, data) {
        if (!userCallback) {
          console.log(
            'data returned by Cloud.RevokeCredentials API call:', data);
          return;
        }
        if (data.error) {
          userCallback(data.error);
          return;
        }
        const results = data.response.results;
        if (!results || results.length !== 1) {
          // This should never happen.
          userCallback(
            'invalid results returned by Juju: ' + JSON.stringify(results));
          return;
        }
        const err = results[0].error && results[0].error.message;
        if (err) {
          userCallback(err);
          return;
        }
        userCallback(null);
      }.bind(this, callback);
      // Send the API request.
      this._send_rpc({
        type: 'Cloud',
        request: 'RevokeCredentials',
        params: {entities: [{tag: tag}]}
      }, handler);
    }

  });

  Y.namespace('juju').ControllerAPI = ControllerAPI;

}, '0.1.0', {
  requires: [
    'base',
    'juju-env-base'
  ]
});
