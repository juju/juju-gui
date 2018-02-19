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
  const module = Y.juju.environments;
  const tags = module.tags;

  /**
   * The API connection to the Juju controller.
   *
   * This class handles the WebSocket connection to the controller API backend.
   *
   * @class ControllerAPI
   */
  function ControllerAPI(config) {
    // Invoke Base constructor, passing through arguments.
    ControllerAPI.superclass.constructor.apply(this, arguments);
  }

  ControllerAPI.NAME = 'controller-api';

  Y.extend(ControllerAPI, module.BaseEnvironment, {

    /**
      Juju controller API client constructor.

      @method initializer
    */
    initializer: function() {
      // Define the default user name for this environment. It will appear as
      // predefined value in the login mask.
      this.defaultUser = 'admin';
      // pendingLoginResponse is set to true when the login process is running.
      this.pendingLoginResponse = false;

      this._pinger = null;
      this.after('connectedChange', evt => {
        if (evt.newVal) {
          console.log('starting controller pinger');
          this._pinger = setInterval(
            this.ping.bind(this), module.PING_INTERVAL * 1000);
          return;
        }
        console.log('stopping controller pinger');
        clearInterval(this._pinger);
        this._pinger = null;
      });
    },

    /**
      Juju controller API client destructor.

      @method destructor
    */
    destructor: function() {
      if (this._pinger) {
        clearInterval(this._pinger);
      }
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
      if (version === null && facade === 'Pinger') {
        // Note that, even if we don't have an available Pinger (which can
        // happen for instance if the user is not logged in yet) we still need
        // to ping, in order to avoid disconnections. We don't really care if
        // the server returns an error: an error it is still WebSocket traffic.
        version = 1;
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
        this.setConnectedAttr('facades', facades);
        var userInfo = response['user-info'];
        let controllerAccess = userInfo['controller-access'];
        // This permission's name changed between versions of Juju 2.
        // The most recent incarnation is "add-model".
        if (controllerAccess === 'addmodel') {
          controllerAccess = 'add-model';
        }
        this.setConnectedAttr('controllerAccess', controllerAccess);
        this.setConnectedAttr(
          'controllerId',
          tags.parse(tags.CONTROLLER, response['controller-tag']));
        // Clean up for log out text.
        this.failedAuthentication = false;
        // Retrieve maas credentials should they exist.
        // NB: this assumes that a maas cloud cannot be added to a multi-cloud
        // controller. If this changes in the future, this code will need to be
        // called somewhere else. - Makyo 2017-02-16
        this.getDefaultCloudName((error, name) => {
          if (error) {
            console.log('cannot retrieve default cloud name:', error);
            return;
          }
          if (name !== 'maas') {
            return;
          }
          this.getClouds([name], (error, clouds) => {
            const err = error || clouds[name].err;
            if (err) {
              console.log('cannot retrieve cloud info:', err);
              return;
            }
            this.set('maasServer', clouds[name].endpoint);
          });
        });
      } else {
        // If the credentials were rejected remove them.
        this.get('user').controller = null;
        this.failedAuthentication = true;
      }
      document.dispatchEvent(new CustomEvent('login', {
        detail: {err: data.error || null}
      }));
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
        document.dispatchEvent(new CustomEvent('login', {
          detail: {err: null}
        }));
        return;
      }
      if (this.pendingLoginResponse) {
        return;
      }
      var credentials = this.get('user').controller;
      if (!credentials.user || !credentials.password) {
        document.dispatchEvent(new CustomEvent('login', {
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
        this.get('user').controller = {
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
      var macaroons = this.get('user').controller.macaroons;
      sendLoginRequest(
        macaroons,
        handleResponse.bind(this, bakery, macaroons, cback)
      );
    },

    /**
      Define optional operations to be performed before logging out.
      Operations performed:
        - the pinger interval is stopped;
        - connection attributes are reset.

      Note that this function is intended to be idempotent: clients must be
      free to call this multiple times even on an already closed connection.

      @method cleanup
      @param {Function} done A callable that must be called by the function and
        that actually closes the connection.
    */
    cleanup: function(done) {
      console.log('cleaning up the controller API connection');
      this.resetConnectedAttrs();
      done();
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
      Make a WebSocket request to retrieve the list of changes required to
      deploy a bundle, given the bundle YAML content. If the current connection
      is not authenticated, fall back to using the restful bundle service API.

      @method getBundleChanges
      @param {String} bundleYAML The bundle YAML file contents.
      @param {String} _ The token identifying a bundle change set
        (ignored on juju >= 2, only present for API compatibility).
      @param {Function} callback The user supplied callback to send the bundle
        changes response to after proper post processing. The callback receives
        a list of errors (each one being a string describing a possible error)
        and a list of bundle changes.
    */
    getBundleChanges: function(bundleYAML, _, callback) {
      if (!this.userIsAuthenticated) {
        console.log('using bundle service to retrieve bundle changes');
        this._getBundleChangesFromBundleService(bundleYAML, callback);
        return;
      }
      const handle = data => {
        if (!callback) {
          console.log('data returned by Bundle.GetChanges:', data);
          return;
        }
        if (data.error) {
          callback([data.error], []);
          return;
        }
        const response = data.response;
        if (response.errors && response.errors.length) {
          callback(response.errors, []);
          return;
        }
        callback([], response.changes);
      };
      // Send the request to retrieve bundle changes from Juju.
      this._send_rpc({
        type: 'Bundle',
        request: 'GetChanges',
        params: {yaml: bundleYAML}
      }, handle);
    },

    /**
      Retrieve bundle changes from the bundle service.

      @method _getBundleChangesFromBundleService
      @param {String} bundleYAML The bundle YAML file contents.
      @param {Function} callback The user supplied callback to send the bundle
        changes response to after proper post processing. The callback receives
        a list of errors (each one being a string describing a possible error)
        and a list of bundle changes.
    */
    _getBundleChangesFromBundleService: function(bundleYAML, callback) {
      this.get('bundleService').getBundleChangesFromYAML(
        bundleYAML, (error, changes) => {
          if (error) {
            callback([error], []);
            return;
          }
          callback([], changes);
        }
      );
    },

    /**
      Return information about Juju models, such as their names, series, and
      provider types, by performing a ModelManager.ModelInfo Juju API request.

      @param {Array} ids The Juju unique identifiers of the models, each one
        being a string, for instance "5bea955d-7a43-47d3-89dd-b02c923e2447".
      @param {Function} callback A callable that must be called once the
        operation is performed. In case of errors, it will receive an error
        containing a string describing the problem and an empty list of models.
        Otherwise, if everything went well, it will receive null as first
        argument and a list of model info objects, each one with the following
        fields:
        - id: the model unique identifier;
        - name: the model name, like "admin" or "mymodel";
        - series: the model default series, like "trusty" or "xenial";
        - provider: the provider type, like "lxd" or "aws";
        - uuid: the model unique identifier (usually the same as id);
        - agentVersion: the version of the Juju agent managing the model;
        - sla: the level of the SLA, "unsupported", "essential", standard" or
          "advanced";
        - slaOwner: the name of the user who set the SLA initially, or an empty
          string if the current SLA is "unsupported";
        - status: the status of the model as a string, for instance "available"
          or "error";
        - statusInfo: additional status information as a string if pertinent;
        - controllerUUID: the corresponding controller unique identifier;
        - owner: the name of the user owning the model;
        - credential: the name of the credential used to create the model;
        - credentialName: the readable credential name extracted from the id;
        - region: the model region (or null if no regions apply);
        - cloud: the cloud used to deploy the model, as a string;
        - numMachines: the number of machines in the model;
        - users: a list of users with access to the model, in which each user
          is an object with the following fields:
          - name: the username like "who@external" or "admin";
          - displayName: the user's display name, without the "@" part;
          - domain: the user domain, like "local" or "Ubuntu SSO";
          - lastConnection: the last time the user connected to the model as a
            Date object, or null if the user has never connected;
          - access: the type of access the user has as a string, like "read" or
            "admin";
          - err: a message describing a specific user error, or undefined;
        - life: the lifecycle status of the model: "alive", "dying" or "dead";
        - isAlive: whether the model is alive or dying/dead;
        - isController: whether the model is a controller model;
        - err: a message describing a specific model error, or undefined.
      @return {undefined} Sends a message to the server only.
    */
    modelInfo: function(ids, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by model info API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, []);
          return;
        }
        const results = data.response.results;
        if (results.length !== ids.length) {
          // Sanity check: this should never happen.
          callback('unexpected results: ' + JSON.stringify(results), []);
          return;
        }
        const models = results.map((result, index) => {
          const err = result.error && result.error.message;
          const id = ids[index];
          if (err) {
            return {id: id, err: err};
          }
          result = result.result;
          let credential = '';
          const credentialTag = result['cloud-credential-tag'];
          if (credentialTag) {
            credential = tags.parse(tags.CREDENTIAL, credentialTag);
          }
          const machines = result.machines || [];
          const users = (result.users || []).map(userResult => {
            const err = userResult.error;
            if (err) {
              return {err: err.message};
            }
            let fullName = userResult.user;
            const parts = fullName.split('@');
            let domain = 'local';
            if (parts.length === 2) {
              domain = parts[1] === 'external' ? 'Ubuntu SSO' : parts[1];
            } else {
              fullName = parts[0] + '@' + domain;
            }
            const displayName = userResult['display-name'] || parts[0];
            let lastConnection = null;
            if (userResult['last-connection']) {
              lastConnection = new Date(userResult['last-connection']);
            }
            return {
              name: fullName,
              displayName: displayName,
              domain: domain,
              lastConnection: lastConnection,
              access: userResult.access
            };
          });
          const cloudTag = result['cloud-tag'];
          const cloud = cloudTag ? tags.parse(tags.CLOUD, cloudTag) : '';
          const sla = result.sla || {};
          const status = result.status || {};
          return {
            id: id,
            name: result.name,
            series: result['default-series'],
            provider: result['provider-type'],
            uuid: result.uuid,
            agentVersion: result['agent-version'] || '',
            sla: sla.level || '',
            slaOwner: sla.owner || '',
            status: status.status || '',
            statusInfo: status.info || '',
            controllerUUID: result['controller-uuid'],
            owner: tags.parse(tags.USER, result['owner-tag']),
            credential: credential,
            credentialName: this._parseCredentialName(credential),
            region: result['cloud-region'] || null,
            cloud: cloud,
            numMachines: machines.length,
            users: users,
            life: result.life,
            isAlive: result.life === 'alive',
            isController: result.name === 'controller'
          };
        });
        callback(null, models);
      };

      // Send the API request.
      const entities = ids.map(id => {
        return {tag: tags.build(tags.MODEL, id)};
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

      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments, the first
        an error (null for no errors, a string describing the error otherwise),
        and the second an array of model info (or an empty array if an error
        occurred), each one with the following fields:
        - id: the model unique identifier;
        - name: the model name, like "admin" or "mymodel";
        - series: the model default series, like "trusty" or "xenial";
        - provider: the provider type, like "lxd" or "aws";
        - uuid: the model unique identifier (usually the same as id);
        - agentVersion: the version of the Juju agent managing the model;
        - sla: the level of the SLA, "unsupported", "essential", standard" or
          "advanced";
        - slaOwner: the name of the user who set the SLA initially, or an empty
          string if the current SLA is "unsupported";
        - status: the status of the model as a string, for instance "available"
          or "error";
        - statusInfo: additional status information as a string if pertinent;
        - controllerUUID: the corresponding controller unique identifier;
        - owner: the name of the user owning the model;
        - credential: the name of the credential used to create the model;
        - credentialName: the readable credential name extracted from the id;
        - region: the model region (or null if no regions apply);
        - cloud: the cloud used to deploy the model, as a string;
        - numMachines: the number of machines in the model;
        - users: a list of users with access to the model, in which each user
          is an object with the following fields:
          - name: the username like "who@external" or "admin";
          - displayName: the user's display name, without the "@" part;
          - domain: the user domain, like "local" or "Ubuntu SSO";
          - lastConnection: the last time the user connected to the model as a
            Date object, or null if the user has never connected;
          - access: the type of access the user has as a string, like "read" or
            "admin";
          - err: a message describing a specific user error, or undefined;
        - life: the lifecycle status of the model: "alive", "dying" or "dead";
        - isAlive: whether the model is alive or dying/dead;
        - isController: whether the model is a controller model;
        - lastConnection: the date of the last connection of the current user
          as a Date object, or null if the model was never connected to;
        - err: a message describing a specific model error, or undefined.
      @return {undefined} Sends a message to the server only.
    */
    listModelsWithInfo: function(callback) {
      // Ensure we always have a callback.
      if (!callback) {
        callback = function(err, models) {
          console.log('listModelsWithInfo: no callback provided');
          if (err) {
            console.log('listModelsWithInfo: API call error:', err);
          } else {
            console.log('listModelsWithInfo: API call results:', models);
          }
        };
      }
      // Retrieve the current user.
      const credentials = this.get('user').controller;
      if (!credentials.user) {
        callback('called without credentials', []);
        return;
      }
      // Perform the API calls.
      this.listModels(credentials.user, (err, listedModels) => {
        if (err) {
          callback(err, []);
          return;
        }
        const ids = listedModels.map(model => model.id);
        this.modelInfo(ids, (err, infoModels) => {
          if (err) {
            callback(err, []);
            return;
          }
          const models = infoModels.map(model => {
            if (model.err) {
              return {id: model.id, err: model.err};
            }
            let lastConnection = null;
            for (let i = 0; i < model.users.length; i++) {
              const user = model.users[i];
              if (user.name === credentials.user) {
                lastConnection = user.lastConnection;
                break;
              }
            }
            return {
              id: model.id,
              name: model.name,
              series: model.series,
              provider: model.provider,
              uuid: model.uuid,
              agentVersion: model.agentVersion,
              sla: model.sla,
              slaOwner: model.slaOwner,
              status: model.status,
              statusInfo: model.statusInfo,
              controllerUUID: model.controllerUUID,
              owner: model.owner,
              credential: model.credential,
              credentialName: this._parseCredentialName(model.credential),
              region: model.region,
              cloud: model.cloud,
              numMachines: model.numMachines,
              users: model.users,
              life: model.life,
              isAlive: model.isAlive,
              isController: model.isController,
              lastConnection: lastConnection
            };
          });
          callback(null, models);
        });
      });
    },

    /**
      Create a new model within this controller, using the given name, account
      and config.

      @method createModel
      @param {String} name The name of the new model.
      @param {String} user The name of the new model owner. If the name
        represents a local user, that user must exist.
      @param {Object} args Any other optional argument that can be provided
        when creating a new model. This includes the following fields:
        - config: the optional model config;
        - cloud: the name of the cloud to create the model in. If this is
          empty/undefined the model will be created in the same cloud as the
          controller model;
        - region: the name of the cloud region to create the model in. If the
          cloud does not support regions, this must be empty/undefined. If this
          is empty/undefined, and cloud is empty/undefined, the model will be
          created in the same region as the controller model;
        - credential: the name of the cloud credential to use for managing the
          model's resources. If the cloud does not require credentials this may
          be empty/undefined. If this is empty/undefined and the owner is the
          controller owner then the same credential used for the controller
          model will be used.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error (as a string
        describing the problem if any occurred, or null) and an object with the
        following attributes:
        - name: the name of the new model;
        - uuid: the unique identifier of the new model;
        - owner: the name of the user owning the model;
        - provider: the model provider type;
        - series: the model default series;
        - cloud: the name of the cloud;
        - region: the cloud region;
        - credential: the name of the credential used to create the model.
      @return {undefined} Sends a message to the server only.
    */
    createModel: function(name, user, args, callback) {
      // Define the API callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by CreateModel API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const response = data.response;
        // Credentials are not required/returned by all clouds.
        let credential = '';
        const credentialTag = response['cloud-credential-tag'];
        if (credentialTag) {
          credential = tags.parse(tags.CREDENTIAL, credentialTag);
        }
        callback(null, {
          name: response.name,
          uuid: response.uuid,
          owner: tags.parse(tags.USER, response['owner-tag']),
          provider: response['provider-type'],
          series: response['default-series'],
          cloud: tags.parse(tags.CLOUD, response['cloud-tag']),
          region: response['cloud-region'],
          credential: credential
        });
      };

      // Prepare API call params.
      if (user.indexOf('@') === -1) {
        user += '@local';
      }
      let cloudTag;
      if (args.cloud) {
        cloudTag = tags.build(tags.CLOUD, args.cloud);
      }
      let credentialTag;
      if (args.credential) {
        credentialTag = tags.build(tags.CREDENTIAL, args.credential);
      }
      // Send the API call.
      this._send_rpc({
        type: 'ModelManager',
        request: 'CreateModel',
        params: {
          name: name,
          'owner-tag': tags.build(tags.USER, user),
          config: args.config || undefined,
          'cloud-tag': cloudTag,
          region: args.region || undefined,
          credential: credentialTag
        }
      }, handler);
    },

    /**
      Destroy the models with the given identifiers.

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
      @param {Array} ids The unique identifiers of the models, each one being a
        string, for instance "5bea955d-7a43-47d3-89dd-b02c923e2447".
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two arguments:
        - in case of global errors, it will receive an error message and an
          empty object;
        - otherwise, it will receive null and an object mapping the provided
          model identifiers to possible error strings, or to null if the
          deletion of that model succeeded.
      @return {undefined} Sends a message to the server only.
    */
    destroyModels: function(ids, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by destroy models API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const results = data.response.results.reduce((prev, result, index) => {
          const id = ids[index];
          prev[id] = result.error ? result.error.message : null;
          return prev;
        }, {});
        callback(null, results);
      };

      // Prepare the API request. The keys used in this API call changed from
      // facade version 3 to 4.
      let modelsKey = 'models';
      let tagKey = 'model-tag';
      const lastFacadeVersion = this.findFacadeVersion('ModelManager');
      if (lastFacadeVersion !== null && lastFacadeVersion < 4) {
        modelsKey = 'entities';
        tagKey = 'tag';
      }
      const entities = ids.map(function(id) {
        return {[tagKey]: tags.build(tags.MODEL, id)};
      });
      // Send the API request.
      this._send_rpc({
        type: 'ModelManager',
        request: 'DestroyModels',
        params: {[modelsKey]: entities}
      }, handler);
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
        - id: the model unique identifier, like "de1b2c16-0151-4e63-87e9";
        - name: the name of the model;
        - owner: the model owner;
        - uuid: the unique identifier of the model (usually the same as id);
        - lastConnection: the date of the last connection as a string, e.g.:
          '2015-09-24T10:08:50Z' or null if the model has been never
          connected to;
      @return {undefined} Sends a message to the server only.
    */
    listModels: function(user, callback) {
      const handleListModels = data => {
        if (!callback) {
          console.log('data returned by ListModels API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, []);
          return;
        }
        const userModels = data.response['user-models'];
        if (!userModels || !userModels.length) {
          callback(null, []);
          return;
        }
        const models = userModels.map(value => {
          const model = value.model;
          return {
            id: model.uuid,
            name: model.name,
            owner: tags.parse(tags.USER, model['owner-tag']),
            uuid: model.uuid,
            lastConnection: value['last-connection']
          };
        });
        callback(null, models);
      };

      this._send_rpc({
        type: 'ModelManager',
        request: 'ListModels',
        params: {tag: tags.build(tags.USER, user)}
      }, handleListModels);
    },

    /**
      Return the definitions of all clouds supported by the controller.

      @method listClouds
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and an object mapping cloud names (for
        instance "lxd" or "google") to cloud attributes. If no errors occur,
        the error parameter is null. Otherwise, in case of errors, the second
        argument is an empty object. Cloud attributes are returned as an object
        with the following fields:
        - cloudType: the cloud type, like "lxd" or "gce";
        - authTypes: optional supported authentication systems, like "jsonfile"
          or "oauth2" in the google compute example;
        - endpoint: optional cloud endpoint, like "https://www.googleapis.com";
        - identityEndpoint: optional URL of the identity manager;
        - storageEndpoint: optional storage endpoint;
        - regions: the list of regions supported by the cloud, each one being
          an object with the following fields: name, endpoint, identityEndpoint
          and storageEndpoint.
    */
    listClouds: function(callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by Cloud.Clouds API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const results = data.response.clouds || {};
        const clouds = Object.keys(results).reduce((prev, tag) => {
          const name = tags.parse(tags.CLOUD, tag);
          prev[name] = this._parseCloudResult(results[tag]);
          return prev;
        }, {});
        callback(null, clouds);
      };
      // Send the API request.
      this._send_rpc({type: 'Cloud', request: 'Clouds'}, handler);
    },

    /**
      Return the definitions of the clouds with the given names.

      @method getClouds
      @param {Array} names The names of the clouds, each one being a string,
        for instance "lxd" or "google.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and an object mapping the provided cloud
        names to cloud attributes. If no errors occur, the error parameter is
        null. Otherwise, in case of errors, the second argument is an empty
        object. Attributes are returned as an object with the following fields:
        - err: a possible cloud specific error, in which case all subsequent
          fields are omitted;
        - cloudType: the cloud type, like "lxd" or "gce";
        - authTypes: optional supported authentication systems, like "jsonfile"
          or "oauth2" in the google compute example;
        - endpoint: optional cloud endpoint, like "https://www.googleapis.com";
        - identityEndpoint: optional URL of the identity manager;
        - storageEndpoint: optional storage endpoint;
        - regions: the list of regions supported by the cloud, each one being
          an object with the following fields: name, endpoint, identityEndpoint
          and storageEndpoint.
    */
    getClouds: function(names, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by Cloud.Cloud API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const results = data.response.results;
        if (!results) {
          callback(null, {});
          return;
        }
        const clouds = results.reduce((prev, result, index) => {
          const name = names[index];
          const err = result.error && result.error.message;
          if (err) {
            prev[name] = {err: err};
            return prev;
          }
          prev[name] = this._parseCloudResult(result.cloud);
          return prev;
        }, {});
        callback(null, clouds);
      };
      // Send the API request.
      if (!names.length) {
        names = [];
      }
      const entities = names.map(function(name) {
        return {tag: tags.build(tags.CLOUD, name)};
      });
      this._send_rpc({
        type: 'Cloud',
        request: 'Cloud',
        params: {entities: entities}
      }, handler);
    },

    /**
      Return the name of the cloud that models will be created in by default in
      this controller.

      @method getDefaultCloudName
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error and the cloud name,
        for instance (null, 'google') when the operation succeeds or
        ('error message', '') in case of errors.
    */
    getDefaultCloudName: function(callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by Cloud.DefaultCloud API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, '');
          return;
        }
        const response = data.response;
        const error = response.error && response.error.message;
        if (error) {
          callback(error, '');
          return;
        }
        const name = tags.parse(tags.CLOUD, response.result);
        callback(null, name);
      };
      // Send the API request.
      this._send_rpc({type: 'Cloud', request: 'DefaultCloud'}, handler);
    },

    /**
      Parse a single cloud result retrieved by requesting endpoints on the
      Cloud facade.

      @method _parseCloudResult
      @param {Object} result The cloud result.
      @returns {Object} the parsed/modified result.
    */
    _parseCloudResult: result => {
      let regions = null;
      if (result.regions) {
        regions = result.regions.map(region => {
          return {
            name: region.name,
            endpoint: region.endpoint || '',
            identityEndpoint: region['identity-endpoint'] || '',
            storageEndpoint: region['storage-endpoint'] || ''
          };
        });
      }
      return {
        cloudType: result.type,
        authTypes: result['auth-types'] || [],
        endpoint: result.endpoint || '',
        identityEndpoint: result['identity-endpoint'] || '',
        storageEndpoint: result['storage-endpoint'] || '',
        regions: regions
      };
    },

    /**
      Get the credential name for display from the credential id.

      @method _parseCredentialName
      @param {String} id The id of a could credential in the form
        cloud_user@scope_name.
      @returns {String} the credential display name.
    */
    _parseCredentialName: id => {
      const parts = id.split('_');
      if (parts.length === 3) {
        return parts[2];
      }
      return id;
    },

    /**
      Returns the names of cloud credentials for a set of users.

      @method getCloudCredentialNames
      @param {Array} userCloudPairs A list of (user, cloud) pairs for which to
        retrieve the credentials, like:
        [['admin', 'google'], ['who@external', 'lxd']].
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and a sequence of results. In the
        sequence of results each result refers to the corresponding provided
        user/cloud pair and holds an object with the following fields:
        - err: a possible result specific error, in which case all subsequent
          fields are omitted;
        - names: the list of names that identify cloud credentials
        - displayNames: the list of credential names extracted from the full id
          corresponding to the user/cloud pair provided as input.
        If no errors occur, error parameters are null. Otherwise, in case of
        errors, the second argument is an empty array.
    */
    getCloudCredentialNames: function(userCloudPairs, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log(
            'data returned by Cloud.UserCredentials API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, []);
          return;
        }
        const results = data.response.results;
        if (!results) {
          callback(null, []);
          return;
        }
        const credentials = results.map(result => {
          const err = result.error && result.error.message;
          if (err) {
            return {err: err};
          }
          const credentialTags = result.result || [];
          const names = credentialTags.map(credentialTag => {
            return tags.parse(tags.CREDENTIAL, credentialTag);
          });
          const displayNames = names.map(
            name => this._parseCredentialName(name));
          return {
            names: names,
            displayNames: displayNames
          };
        });
        callback(null, credentials);
      };
      // Send the API request.
      if (!userCloudPairs.length) {
        userCloudPairs = [];
      }
      const userClouds = userCloudPairs.map(userCloud => {
        return {
          'user-tag': tags.build(tags.USER, userCloud[0]),
          'cloud-tag': tags.build(tags.CLOUD, userCloud[1])
        };
      });
      this._send_rpc({
        type: 'Cloud',
        request: 'UserCredentials',
        params: {'user-clouds': userClouds}
      }, handler);
    },

    /**
      Return the specified cloud credentials for each name, minus secrets.

      @method getCloudCredentials
      @param {Array} names The names of the cloud credentials, each one being a
        string, for instance "google_dalek@local_google". Names for credentials
        are usually retrieved by calling the getCloudCredentialNames method.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive two parameters: an error (as a
        string describing the problem) and an object mapping credential names
        to corresponding cloud credential info. If no errors occur, the error
        parameter is null. Otherwise, in case of errors, the second argument is
        an empty object. Credentials info is returned as objects with the
        following fields:
        - err: a possible credentials specific error or `undefined`.
        - authType: the authentication type (as a string, like 'jsonfile');
        - attrs: non-secret credential values as an object mapping strings to
          strings. Keys there are based on the cloud type;
       - displayName: the credential name extracted from the full id;
        - redacted: a list of names of redacted attributes.
        If no errors occur, error parameters are null. Otherwise, in case of
        errors, the second argument is an empty object.
    */
    getCloudCredentials: function(names, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log('data returned by Cloud.Credential API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error, {});
          return;
        }
        const results = data.response.results;
        if (!results) {
          callback(null, {});
          return;
        }
        const credentials = results.reduce((prev, result, index) => {
          const name = names[index];
          const entry = result.result || {};
          prev[name] = {
            authType: entry['auth-type'] || '',
            attrs: entry.attrs || {},
            displayName: this._parseCredentialName(name),
            redacted: entry.redacted || [],
            err: result.error && result.error.message
          };
          return prev;
        }, {});
        callback(null, credentials);
      };
      // Send the API request.
      if (!names.length) {
        names = [];
      }
      const entities = names.map(name => {
        return {tag: tags.build(tags.CREDENTIAL, name)};
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
      @param {String} name The cloud credential name as a string, for instance
        "google_dalek@local_google". Credential names are usually retrieved by
        calling the getCloudCredentialNames method.
      @param {String} authType The authentication type, like "userpass",
        "oauth2" or just "empty". The full AuthType definition list can be
        found: https://github.com/juju/juju/blob/master/cloud/clouds.go
      @param {Object} attrs Attributes containing credential values, as an
        object mapping strings to strings.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error message or null if the
        credential creation/update succeeded.
    */
    updateCloudCredential: function(name, authType, attrs, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log(
            'data returned by Cloud.UpdateCredentials API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error);
          return;
        }
        const results = data.response.results;
        if (!results || results.length !== 1) {
          // This should never happen.
          callback('invalid results from Juju: ' + JSON.stringify(results));
          return;
        }
        const err = results[0].error && results[0].error.message;
        if (err) {
          callback(err);
          return;
        }
        callback(null);
      };
      // Send the API request.
      const credentials = [{
        tag: tags.build(tags.CREDENTIAL, name),
        credential: {'auth-type': authType || '', attrs: attrs || {}}
      }];
      this._send_rpc({
        type: 'Cloud',
        request: 'UpdateCredentials',
        params: {credentials: credentials}
      }, handler);
    },

    /**
      Revoke the cloud credential with the given name.

      @method revokeCloudCredential
      @param {String} name The cloud credential name as a string, for instance
        "google_dalek@local_google". Credential names are usually retrieved by
        calling the getCloudCredentialNames method.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error message or null if the
        credential revocation succeeded.
    */
    revokeCloudCredential: function(name, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log(
            'data returned by Cloud.RevokeCredentials API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error);
          return;
        }
        const results = data.response.results;
        if (!results || results.length !== 1) {
          // This should never happen.
          callback('invalid results from Juju: ' + JSON.stringify(results));
          return;
        }
        const err = results[0].error && results[0].error.message;
        if (err) {
          callback(err);
          return;
        }
        callback(null);
      };
      // Send the API request.
      this._send_rpc({
        type: 'Cloud',
        request: 'RevokeCredentials',
        params: {entities: [{tag: tags.build(tags.CREDENTIAL, name)}]}
      }, handler);
    },

    /**
      Modify (grant or revoke) user access to the specified model.

      @method _modifyModelAccess
      @param {String} modelId The UUID for the model on which the access is
                              being changed.
      @param {Array} users The usernames of the users who need modified access.
      @param {String} action Either 'revoke' or 'grant'.
      @param {String} access The level of access to grant the users; can be
                             'read', 'write', or 'admin'.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error message or null if the
        access modification succeeded.
    */
    _modifyModelAccess: function(modelId, users, action, access, callback) {
      // Decorate the user supplied callback.
      const handler = data => {
        if (!callback) {
          console.log(
            'Data returned by ModelManager.ModifyModelAccess API call:', data);
          return;
        }
        if (data.error) {
          callback(data.error);
          return;
        }
        const results = data.response.results;
        if (!results || results.length !== 1) {
          // This should never happen.
          callback('invalid results from Juju: ' + JSON.stringify(results));
          return;
        }
        const err = results[0].error && results[0].error.message;
        if (err) {
          callback(err);
          return;
        }
        callback(null);
      };
      const modelTag = tags.build(tags.MODEL, modelId);
      const changes = users.map(username => {
        return {
          access: access,
          action: action,
          'model-tag': modelTag,
          'user-tag': tags.build(tags.USER, username)
        };
      });
      // Send the API request.
      this._send_rpc({
        type: 'ModelManager',
        request: 'ModifyModelAccess',
        params: {changes: changes}
      }, handler);
    },

    /**
      Grant users access to the current model.

      @method grantModelAccess
      @param {String} modelId The UUID for the model on which the access is
                              being changed.
      @param {Array} users The usernames of the users who need modified access.
      @param {String} access The level of access to grant the users; can be
                             'read', 'write', or 'admin'.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error message or null if the
        access grant succeeded.
    */
    grantModelAccess: function(modelId, users, access, callback) {
      this._modifyModelAccess(modelId, users, 'grant', access, callback);
    },

    /**
      Revoke users access to the current model.

      @method revokeModelAccess
      @param {String} modelId The UUID for the model on which the access is
                              being changed.
      @param {Array} users The usernames of the users who need modified access.
      @param {String} access The level of access to grant the users; can be
                             'read', 'write', or 'admin'.
      @param {Function} callback A callable that must be called once the
        operation is performed. It will receive an error message or null if the
        access revocation succeeded.
    */
    revokeModelAccess: function(modelId, users, access, callback) {
      this._modifyModelAccess(modelId, users, 'revoke', access, callback);
    }

  });

  Y.namespace('juju').ControllerAPI = ControllerAPI;

}, '0.1.0', {
  requires: [
    'base',
    'juju-env-base'
  ]
});
