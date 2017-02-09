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
Sandbox APIs mimicking communications with the Go and Python backends.
@module env
@submodule env.sandbox
*/

YUI.add('juju-env-sandbox', function(Y) {

  const sandboxModule = Y.namespace('juju.environments.sandbox');
  const models = Y.namespace('juju.models');
  const CLOSEDERROR = 'INVALID_STATE_ERR : Connection is closed.';

  /**
  A client connection for interacting with a sandbox environment.

  @class ClientConnection
  */
  function ClientConnection(config) {
    ClientConnection.superclass.constructor.apply(this, arguments);
  }

  ClientConnection.NAME = 'sandbox-client-connection';
  ClientConnection.ATTRS = {
    juju: {}, // Required.
    socket_url: {}
  };

  Y.extend(ClientConnection, Y.Base, {

    /**
    Initialize.

    @method initializer
    @return {undefined} Nothing.
    */
    initializer: function() {
      this.connected = false;
      // The readyState needs to be defined because we check for its value
      // before sending any requests to avoid errors.
      this.readyState = 1;
    },

    /**
    React to a new message from Juju.
    You are expected to monkeypatch this method, as with websockets.

    @method onmessage
    @param {Object} event An object with a JSON string on the "data"
      attribute.
    @return {undefined} Nothing.
    */
    onmessage: function(event) {},

    /**
    Immediately give message to listener (contrast with receive).
    Uses onmessage to deliver message, as with websockets.

    @method receiveNow
    @param {Object} data An object to be sent as JSON to the listener.
    @param {Boolean} failSilently A flag to turn off the error when the
      connection is closed.  This exists to handle a race condition between
      receiveNow and receive, when the connection closes between the two.
    @return {undefined} Nothing.
    */
    receiveNow: function(data, failSilently) {
      if (this.connected) {
        this.onmessage({data: Y.JSON.stringify(data)});
      } else if (!failSilently) {
        throw CLOSEDERROR;
      }
    },

    /**
    Give message to listener asynchronously (contrast with receiveNow).
    Uses onmessage to deliver message, as with websockets.

    @method receive
    @param {Object} data An object to be sent as JSON to the listener.
    @return {undefined} Nothing.
    */
    receive: function(data) {
      if (this.connected) {
        Y.soon(this.receiveNow.bind(this, data, true));
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
    Send a JSON string to the API.

    @method send
    @param {String} data A JSON string of the data to be sent.
    @return {undefined} Nothing.
    */
    send: function(data) {
      if (this.connected) {
        this.get('juju').receive(Y.JSON.parse(data));
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
    React to an opening connection.
    You are expected to monkeypatch this method, as with websockets.

    @method onopen
    @return {undefined} Nothing.
    */
    onopen: function() {},

    /**
    Explicitly open the connection.
    This does not have an analog with websockets, but requiring an explicit
    "open" means less magic is necessary.  It is responsible for changing
    the "connected" state, for calling the onopen hook, and for calling
    the sandbox juju.open with itself.

    @method open
    @return {undefined} Nothing.
    */
    open: function() {
      if (!this.connected) {
        this.connected = true;
        this.get('juju').open(this);
        this.onopen();
      }
    },

    /**
    React to a closing connection.
    You are expected to monkeypatch this method, as with websockets.

    @method onclose
    @return {undefined} Nothing.
    */
    onclose: function() {},

    /**
    Close the connection.
    This is responsible for changing the "connected" state, for calling the
    onclosed hook, and for calling the sandbox juju.close.

    @method close
    @return {undefined} Nothing.
    */
    close: function() {
      if (this.connected) {
        this.connected = false;
        this.get('juju').close();
        this.onclose();
      }
    }

  });

  sandboxModule.ClientConnection = ClientConnection;
  // Define sandbox API facades: please keep these in alphabetical order.
  sandboxModule.facades = [
    {name: 'AllWatcher', versions: [1]},
    {name: 'Annotations', versions: [2]},
    {name: 'Application', versions: [1]},
    {name: 'Bundle', versions: [1]},
    {name: 'Charms', versions: [2]},
    {name: 'Client', versions: [1]},
    {name: 'Cloud', versions: [1]},
    {name: 'KeyManager', versions: [1]},
    {name: 'ModelManager', versions: [2]},
    {name: 'Pinger', versions: [1]},
    {name: 'Resources', versions: [1]}
  ];

  /**
  A sandbox Juju environment using the Go API.

  @class GoJujuAPI
  */
  function GoJujuAPI(config) {
    GoJujuAPI.superclass.constructor.apply(this, arguments);
  }

  GoJujuAPI.NAME = 'sandbox-go-juju-api';
  GoJujuAPI.ATTRS = {
    bundleService: {},
    client: {},
    deltaInterval: {value: 1000}, // In milliseconds.
    nextRequestId: {}, // The current outstanding "Next" RPC call ID.
    socket_url: {},
    state: {}
  };

  Y.extend(GoJujuAPI, Y.Base, {

    /**
    Initializes.

    @method initializer
    @return {undefined} Nothing.
    */
    initializer: function() {
      this.connected = false;
      this.wsFailureCount = 0;
      // Define an in-memory storage for cloud credentials. When the storage is
      // initialized it holds an object mapping credential tags with the
      // corresponding credential info. Do not access this attribute directly,
      // use the _getCredentialsStorage method below.
      this._cloudCredentialsStorage = null;
    },

    /**
    Opens the connection to the sandbox Juju environment.
    Called by ClientConnection, which sends itself.

    @method open
    @param {Object} client A ClientConnection.
    @return {undefined} Nothing.
    */
    open: function(client) {
      if (!this.connected) {
        this.connected = true;
        this.set('client', client);
      } else if (this.get('client') !== client) {
        throw 'INVALID_STATE_ERR : Connection is open to another client.';
      }
    },

    /**
    Closes the connection to the sandbox Juju environment.
    Called by ClientConnection.

    @method close
    @return {undefined} Nothing.
    */
    close: function() {
      if (this.connected) {
        this.connected = false;
        this.set('client', undefined);
      }
    },

    /**
    Do any extra work to destroy the object.

    @method destructor
    @return {undefined} Nothing.
    */
    destructor: function() {
      this.close();
    },

    /**
    Receives messages from the client and dispatches them.

    @method receive
    @param {Object} data A hash of data sent from the client.
    @return {undefined} Nothing.
    */
    receive: function(data) {
      if (this.connected) {
        var client = this.get('client');
        var key = 'handle' + data.type + data.request;
        if (!this[key]) {
          // If the sandbox method has not been implemented show a helpful
          // message to the poor developer who has to figure out why things are
          // not working.
          console.error(`${key} has not yet been implemented in the sandbox.
            You can add the method in sandbox.js.`);
          return;
        }
        this[key](data, client, this.get('state'));
      } else {
        throw CLOSEDERROR;
      }
    },

    /**
    Handle Login messages to the state object.

    @method handleAdminLogin
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleAdminLogin: function(data, client, state) {
      const username = data.params['auth-tag'];
      const password = data.params.credentials;
      const response = {'request-id': data['request-id']};
      if (state.login(username, password)) {
        response.response = {
          facades: sandboxModule.facades,
          'controller-tag': 'controller-demonstration-controller-uuid',
          'model-tag': 'model-demonstration-model-uuid',
          'user-info': {
            'controller-access': 'superuser',
            'model-access': 'admin'
          }
        };
      } else {
        response.error = 'invalid username or password';
      }
      client.receive(response);
    },

    /**
    Handle Ping messages.

    @method handlePingerPing
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handlePingerPing: function(data, client, state) {
      client.receive({'request-id': data['request-id'], response: {}});
    },

    /**
    Handle Client.ModelInfo messages.

    @method handleClientModelInfo
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientModelInfo: function(data, client, state) {
      client.receive({
        'request-id': data['request-id'],
        response: {
          'provider-type': state.get('providerType'),
          'default-series': state.get('defaultSeries'),
          name: 'sandbox',
          'owner-tag': 'user-admin@local',
          'cloud-tag': 'cloud-demonstration',
          'cloud-credential-tag':
            'cloudcred-demonstration_admin@local_demonstration',
          'cloud-region': 'demo-west'
        }
      });
    },

    /**
    Handle ModelManager.ModelInfo messages.

    @method handleModelManagerModelInfo
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleModelManagerModelInfo: function(data, client, state) {
      client.receive({
        'request-id': data['request-id'],
        response: {
          results: [{
            result: {
              name: 'sandbox',
              'default-series': state.get('defaultSeries'),
              'provider-type': state.get('providerType'),
              uuid: 'sandbox',
              'controller-uuid': 'controlleruuid1',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }]
        }
      });
    },

    /**
    Handle Client.ModelUserInfo messages.

    @method handleClientModelUserInfo
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientModelUserInfo: function(data, client, state) {
      client.receive({
        'request-id': data['request-id'],
        response: {
          results: [{
            result: {
              user: 'admin@sandbox',
              'last-connection': new Date().toString(),
              access: 'admin'
            }
          }, {
            result: {
              user: 'dalek@skaro',
              'last-connection': '',
              access: 'read'
            }
          }]
        }
      });
    },

    /**
    Handle ModelGet messages.

    @method handleClientModelGet
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    */
    handleClientModelGet: function(data, client, state) {
      client.receive({
        'request-id': data['request-id'],
        response: {
          // For now only the MAAS server is required by the GUI.
          config: {'maas-server': state.get('maasServer')}
        }
      });
    },

    /**
      Handle CreateModel messages.

      @method handleModelManagerCreateModel
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleModelManagerCreateModel: function(data, client, state) {
      console.log('Creating models is not supported in the sandbox.');
    },

    /**
    Handle DestroyModel messages.

    @method handleClientDestroyModel
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientDestroyModel: function(data, client, state) {
      console.log('Destroying models is not supported in the sandbox.');
    },

    /**
    Handle ListModels.

    @method handleModelManagerListModels
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleModelManagerListModels: function(data, client, state) {
      client.receive({
        'request-id': data['request-id'],
        response: {
          'user-models': [{
            model: {
              name: 'sandbox',
              uuid: 'sandbox1',
              'owner-tag': 'user-admin'
            },
            'last-connection': 'today'
          }]
        }
      });
    },

    /**
    Handle ConfigSkeleton.

    @method handleModelManagerConfigSkeleton
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleModelManagerConfigSkeleton: function(data, client, state) {
      client.receive({
        'request-id': data['request-id'],
        response: {
          'owner-tag': 'user-admin',
          config: {
            attr1: 'value1',
            attr2: 'value2',
            name: 'sandbox',
            'authorized-keys': 'ssh-rsa INVALID',
            'access-key': 'access!',
            'secret-key': 'secret!'
          }
        },
      });
    },

    /**
    A white-list for model attributes.  This translates them from the raw ATTRS
    to the format expected by the environment's delta handling.

    @property _deltaWhitelist
    @type {Object}
    */
    _deltaWhitelist: {
      application: {
        name: 'id',
        exposed: 'exposed',
        'charm-url': 'charm',
        life: 'life',
        'constraints': function(attrs) {
          var constraints = attrs.constraints || {};
          // Since juju-core sends the tags constraint as a list of strings,
          // we need to convert the value to an array.
          var tags = constraints.tags;
          if (tags) {
            constraints.tags = tags.split(',');
          }
          return constraints;
        },
        config: 'config',
        subordinate: 'subordinate'
      },
      machine: {
        id: 'id',
        addresses: 'addresses',
        'instance-id': 'instance_id',
        'agent-status': function(attrs) {
          return {
            current: attrs.agent_state,
            message: attrs.agent_state_info,
            data: attrs.agent_state_data
          };
        },
        'hardware-characteristics': function(attrs) {
          var hardware = attrs.hardware || {};
          return {
            arch: hardware.arch,
            'cpu-cores': hardware.cpuCores,
            'cpu-power': hardware.cpuPower,
            mem: hardware.mem,
            'root-disk': hardware.disk
          };
        },
        jobs: 'jobs',
        life: 'life',
        series: 'series',
        'supported-containers': 'supportedContainers',
        'supported-containers-known': function() {
          return true;
        }
      },
      unit: {
        name: 'id',
        application: 'service',
        'series': function(attrs, self) {
          var db = self.get('state').db;
          var application = db.services.getById(attrs.service);
          if (application) {
            var charm = db.charms.getById(application.get('charm'));
            return charm.get('series');
          } else {
            return null; // Probably unit/application was deleted.
          }
        },
        'charm-url': function(attrs, self) {
          var db = self.get('state').db;
          var application = db.services.getById(attrs.service);
          if (application) {
            return application.get('charm');
          } else {
            return null; // Probably unit/application was deleted.
          }
        },
        'public-address': 'public_address',
        'private-address': 'private_address',
        'machine-id': 'machine',
        ports: 'open_ports',
        'agent-status': function(attrs) {
          // TODO frankban: handle unit agent status.
          return {
            current: 'idle',
            message: '',
            data: {}
          };
        },
        'workload-status': function(attrs) {
          // TODO frankban: handle unit workload status.
          return {
            current: 'idle',
            message: '',
            data: {}
          };
        },
        subordinate: 'subordinate'
      },
      relation: {
        key: 'relation_id',
        'endpoints': function(relation, goAPI) {
          var result = [];
          if (relation.endpoints.length === 1) {
            return;
          }
          relation.endpoints.forEach(function(endpoint, index) {
            result.push({
              relation: {
                name: endpoint[1].name,
                role: (index) ? 'server' : 'client',
                interface: relation.type,
                scope: relation.scope
              },
              'application-name': endpoint[0]
            });
          });
          return result;
        }
      },
      annotation: {
        'tag': function(entity) {
          return entity.id;
        },
        'annotations': function(entity) {
          return entity.annotations;
        }
      }
    },

    /**
    Given attrs or a model object and a whitelist of desired attributes,
    return an attrs hash of only the desired attributes.

    @method _getDeltaAttrs
    @private
    @param {Object} attrs A models or attrs hash.
    @param {Object} whitelist A list of desired attributes and means for
      generating them.
    @return {Object} A hash of the whitelisted attributes of the attrs object.
    */
    _getDeltaAttrs: function(attrs, whitelist) {
      if (attrs.getAttrs) {
        attrs = attrs.getAttrs();
      }
      var filtered = {},
          self = this;
      Object.keys(whitelist).forEach(key => {
        const value = whitelist[key];
        if (typeof value === 'string') {
          filtered[key] = attrs[value];
        } else if (typeof value === 'function') {
          filtered[key] = value(attrs, self);
        }
      });
      return filtered;
    },

    /**
      Prepare a delta of events to send to the client since the last time they
      asked.  The deltas list is prepared nearly the same way depending on Py
      or Go implentation, but the data within the individual deltas must be
      structured dependent on the backend.  This method is called using `apply`
      from within the appropriate sandbox so that `this._deltaWhitelist` and
      `self._getDeltaAttrs` can structure the delta according to the juju type.

      @method _prepareDelta
      @return {Array} An array of deltas events.
      */
    _prepareDelta: function() {
      var self = this;
      var state = this.get('state');
      var deltas = [];
      var changes = state.nextChanges();
      if (changes && changes.error) {
        changes = null;
      }
      if (changes) {
        Object.keys(this._deltaWhitelist).forEach(changeType => {
          const whitelist = this._deltaWhitelist[changeType];
          var collectionChanges = changes[changeType + 's'];
          for (var key in collectionChanges) {
            var change = collectionChanges[key];
            var attrs = self._getDeltaAttrs(change[0], whitelist);
            var action = change[1] ? 'change' : 'remove';
            var delta = [changeType, action, attrs];
            deltas.push(delta);
          }
        });
      }
      return deltas;
    },

    /**

      Prepare the juju-core specific version of annotation information.
      This has its own (core styled) formatting. This is different from
      the Python version which includes annotations in the normal object
      change stream.

      @method _prepareAnnotations
      @return [ {Object} ] Array of annotation deltas.
    */
    _prepareAnnotations: function() {
      var state = this.get('state');
      var deltas = [];
      var annotations = state.nextAnnotations();
      if (annotations && annotations.error) {
        annotations = null;
      }
      if (annotations) {
        Object.keys(this._deltaWhitelist).forEach(changeType => {
          const changeTypes = annotations[changeType + 's'];
          Object.keys(changeTypes).forEach(key => {
            const model = changeTypes[key];
            var attrs = models.getAnnotations(model);
            var tag = this.modelToTag(model);
            // This form will trigger the annotationInfo handler.
            deltas.push(['annotation', 'change', {
              tag: tag, annotations: attrs}]);
          });
        });
      }
      return deltas;
    },

    /**
     Map from a model to a Tag name as used in juju-core

     @method modelToTag
     @param {Object} model
     @return {String} tag.
    */
    modelToTag: function(model) {
      var name = model.name;
      if (name === 'serviceUnit') {
        name = 'unit';
      } else if (name === 'service') {
        name = 'application';
      } else if (name === 'environment') {
        return 'model';
      }
      return name + '-' + (model.id || model.get('id'));
    },



    /**
    Send a delta of events to the client from since the last time they asked.

    @method sendDelta
    @return {undefined} Nothing.
    */
    sendDelta: function() {
      var nextRequestId = this.get('nextRequestId');
      if (nextRequestId) {
        var deltas = this._prepareDelta();
        var annotations = this._prepareAnnotations();
        if (deltas.length || annotations.length) {
          this.get('client').receive({
            'request-id': this.get('nextRequestId'),
            response: {deltas: deltas.concat(annotations)}
          });
          // Prevent sending additional deltas until the Go environment is
          // ready for them (when the next `Next` message is sent).
          this.set('nextRequestId', undefined);
        }
      }
    },

    /**
    Handle WatchAll messages.

    @method handleClientWatchAll
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientWatchAll: function(data, client, state) {
      // AllWatcherId can be hard-coded because we will only ever have one
      // client listening to the environment with the sandbox environment.
      client.receive({
        'request-id': data['request-id'],
        response: {AllWatcherId: 42}
      });
    },

    /**
    Handle AllWatcher Next messages.

    @method handleAllWatcherNext
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    */
    handleAllWatcherNext: function(data, client, state) {
      this.set('nextRequestId', data['request-id']);
      clearInterval(this.deltaIntervalId);
      this.deltaIntervalId = setInterval(
          this.sendDelta.bind(this), this.get('deltaInterval'));
    },

    /**
    Handle AllWatcher Stop messages.

    @method handleAllWatcherStop
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    */
    handleAllWatcherStop: function(data, client, state) {
      clearInterval(this.deltaIntervalId);
      client.receive({'request-id': data['request-id'], response: {}});
    },

    /**
    Receive a basic response. Several API calls simply return a request ID
    and an error (if there is one); this utility method handles those cases.

    @method _basicReceive
    @private
    @param {Object} client The active ClientConnection.
    @param {Object} request The initial request with a 'request-id'.
    @param {Object} result The result of the call with an optional error.
    */
    _basicReceive: function(request, client, result) {
      var response = {
        'request-id': request['request-id'],
        response: {}
      };
      if (result.error) {
        response.error = result.error;
      }
      client.receive(response);
    },

    /**
    Handle Client.AddCharm messages.

    @method handleClientAddCharm
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientAddCharm: function(data, client, state) {
      // In sandbox mode there is no need for adding a charm before simulating
      // its deployment.
      client.receive({'request-id': data['request-id'], response: {}});
    },

    /**
    Handle Client.AddCharmWithAuthorization messages.

    @method handleClientAddCharmWithAuthorization
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientAddCharmWithAuthorization: function(data, client, state) {
      this.handleClientAddCharm(data, client, state);
    },

    /**
    Handle Resources.AddPendingResources messages.

    @method handleApplicationDeploy
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleResourcesAddPendingResources: function(data, client, state) {
      // In sandbox mode there is no need for adding charm resources before
      // simulating charm deployments.
      const ids = data.params.resources.map(resource => {
        return resource.Name + '-pending-id';
      });
      client.receive({
        'request-id': data['request-id'],
        response: {'pending-ids': ids}
      });
    },

    /**
    Handle Application.Deploy messages.

    @method handleApplicationDeploy
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationDeploy: function(data, client, state) {
      const callback = function(result) {
        const res = {};
        if (result.error) {
          res.error = {message: result.error};
        }
        client.receive({
          'request-id': data['request-id'],
          response: {results: [res]}
        });
      };
      const params = data.params.applications[0];
      state.deploy(params['charm-url'], callback, {
        name: params.application,
        config: params.config,
        configYAML: params['config-yaml'],
        constraints: params.constraints,
        unitCount: params['num-units']
      });
    },

    /**
      Handle AddMachines messages.

      @method handleClientAddMachines
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleClientAddMachines: function(data, client, state) {
      var params = data.params.params.map(function(machineParam) {
        return {
          jobs: machineParam.jobs,
          series: machineParam.series,
          parentId: machineParam['parent-id'],
          containerType: machineParam['container-type'],
          constraints: machineParam.constraints
        };
      });
      var response = state.addMachines(params);
      var machines = response.machines.map(function(data) {
        var error = null;
        if (data.error) {
          // There is no need for the sandbox to simulate the juju-core error
          // code machinery. Most of the times this is an empty string in real
          // environments. The message can always be found in error.message.
          error = {code: '', message: data.error};
        }
        return {machine: data.name || '', error: error};
      });
      client.receive({
        'request-id': data['request-id'],
        error: response.error,
        response: {machines: machines}
      });
    },

    /**
      Handle DestroyMachines messages.

      @method handleClientDestroyMachines
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleClientDestroyMachines: function(data, client, state) {
      var params = data.params;
      var response = state.destroyMachines(
        params['machine-names'], params.force);
      this._basicReceive(data, client, response);
    },

    /**
    Handle Application.Destroy messages

    @method handleApplicationDestroy
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationDestroy: function(data, client, state) {
      var result = state.destroyApplication(data.params.application);
      this._basicReceive(data, client, result);
    },

    /**
      Handle Application.DestroyUnits messages

      @method handleApplicationDestroyUnits
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
      @return {undefined} Side effects only.
     */
    handleApplicationDestroyUnits: function(data, client, state) {
      var res = state.removeUnits(data.params['unit-names']);
      this._basicReceive(data, client, res);
    },

    /**
    Handle Charms.CharmInfo messages

    @method handleCharmsCharmInfo
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleCharmsCharmInfo: function(data, client, state) {
      state.getCharm(data.params.url, function(result) {
        if (result.error) {
          this._basicReceive(data, client, result);
        } else {
          result = result.result;
          // Convert the charm into the Go format, so it can be converted
          // back into the provided format.
          var convertedData = {
            'request-id': data['request-id'],
            response: {
              config: result.options,
              meta: {
                description: result.description,
                format: result.format,
                name: result.name,
                oeers: result.peers,
                provides: result.provides,
                requires: result.requires,
                subordinate: result.is_subordinate,
                summary: result.summary
              },
              url: result.url,
              revision: result.revision
            }
          };
          client.receive(convertedData);
        }
      }.bind(this));
    },

    /**
      Handle Application.Update messages

      @method handleApplicationUpdate
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
      @return {undefined} Side effects only.
    */
    handleApplicationUpdate: function(data, client, state) {
      var result;
      var params = data.params;
      var application = params.application;
      var callback = function(result) {
        this._basicReceive(data, client, result);
      }.bind(this);

      // Handle application settings.
      if (params.settings) {
        result = state.setConfig(application, params.settings);
        if (result.error) {
          callback(result);
        }
      }

      // Handle application constraints.
      if (params.constraints) {
        result = state.setConstraints(application, params.constraints);
        if (result.error) {
          callback(result);
        }
      }
      // XXX frankban: handle MinUnits when/if required.

      // Handle charm URL changes.
      // This is kept as last step as it is asynchronous.
      if (params['charm-url']) {
        state.setCharm(
          application, params['charm-url'], params['force-charm-url'],
          params['force-series'], callback);
        return;
      }
      callback({});
    },

    /**
    Handle Resolved messages

    @method handleClientResolved
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientResolved: function(data, client, state) {
      // Resolving a unit/relation pair is not supported by the Go back-end,
      // so relationName is ignored.
      var result = state.resolved(data.params['unit-name']);
      this._basicReceive(data, client, result);
    },

    /**
    Handle Annotations.Set messages

    @method handleAnnotationsSet
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleAnnotationsSet: function(data, client, state) {
      var args = data.params.annotations[0];
      var entityId = /^(application|unit|machine|model)-([^ ]*)$/.
          exec(args.entity)[2];
      var result = state.updateAnnotations(entityId, args.annotations);
      this._basicReceive(data, client, result);
    },

    /**
    Handle Application Get messages

    @method handleApplicationGet
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationGet: function(data, client, state) {
      var reply = state.getApplication(data.params.application);
      var response = {
        'request-id': data['request-id']
      };
      if (reply.error) {
        response.error = reply.error;
        client.receive(response);
      } else {
        var charmName = reply.result.charm;

        // Get the charm to load the full options data as the application
        // config format.
        state.getCharm(charmName, function(payload) {
          var charmData = payload.result;
          var formattedConfig = {};
          var backendConfig = reply.result.options || reply.result.config;

          Object.keys(charmData.options).forEach(key => {
            formattedConfig[key] = charmData.options[key];
            if (backendConfig[key]) {
              formattedConfig[key].value = backendConfig[key];
            } else {
              formattedConfig[key].value = charmData.options[key]['default'];
            }
          });

          response.response = {
            application: data.params.application,
            charm: charmName,
            config: formattedConfig,
            constraints: reply.result.constraints
          };
          client.receiveNow(response);
        });
      }

    },

    /**
    Handle Application.AddUnits messages

    @method handleApplicationAddUnits
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationAddUnits: function(data, client, state) {
      var args = data.params;
      var toMachine;
      if (args.placement && args.placement[0]) {
        toMachine = args.placement[0].Directive;
      }
      var reply = state.addUnit(
        args.application, args['num-units'], toMachine);
      var units = [];
      if (!reply.error) {
        units = reply.units.map(function(u) {return u.id;});
      }
      client.receive({
        'request-id': data['request-id'],
        error: reply.error,
        response: {units: units}
      });
    },

    /**
    Handle Application.Expose messages

    @method handleApplicationExpose
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationExpose: function(data, client, state) {
      var result = state.expose(data.params.application);
      this._basicReceive(data, client, result);
    },

    /**
    Handle Application.Unexpose messages

    @method handleApplicationUnexpose
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationUnexpose: function(data, client, state) {
      var result = state.unexpose(data.params.application);
      this._basicReceive(data, client, result);
    },

    /**
    Handle AddRelation messages

    @method handleApplicationAddRelation
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationAddRelation: function(data, client, state) {
      var stateData = state.addRelation(
          data.params.endpoints[0], data.params.endpoints[1], false);
      var resp = {'request-id': data['request-id']};
      if (stateData === false) {
        // Everything checks out but could not create a new relation model.
        resp.error = 'Unable to create relation';
        client.receive(resp);
        return;
      }
      if (stateData.error) {
        resp.error = stateData.error;
        client.receive(resp);
        return;
      }
      var respEndpoints = {},
          stateEpA = stateData.endpoints[0],
          stateEpB = stateData.endpoints[1],
          epA = {
            name: stateEpA[1].name,
            role: 'requirer',
            scope: stateData.scope,
            interface: stateData['interface']
          },
          epB = {
            name: stateEpB[1].name,
            role: 'provider',
            scope: stateData.scope,
            interface: stateData['interface']
          };
      respEndpoints[stateEpA[0]] = epA;
      respEndpoints[stateEpB[0]] = epB;
      resp.response = {
        endpoints: respEndpoints
      };
      client.receive(resp);
    },

    /**
    Handle DestroyRelation messages

    @method handleApplicationDestroyRelation
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleApplicationDestroyRelation: function(data, client, state) {
      var result = state.removeRelation(data.params.endpoints[0],
          data.params.endpoints[1]);
      this._basicReceive(data, client, result);
    },

    /**
      Handle Cloud.Clouds messages.

      @method handleCloudClouds
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleCloudClouds: function(data, client, state) {
      const info = this._getCloudInfo(state);
      const clouds = {};
      clouds[info.cloudTag] = info.cloud;
      client.receive({
        'request-id': data['request-id'],
        response: {clouds: clouds}
      });
    },

    /**
      Handle Cloud.Cloud messages.

      @method handleCloudCloud
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleCloudCloud: function(data, client, state) {
      const entities = data.params.entities;
      if (!entities.length) {
        client.receive({
          'request-id': data['request-id'],
          response: {results: []}
        });
        return;
      }
      const info = this._getCloudInfo(state);
      const results = entities.map(entity => {
        if (entity.tag === info.cloudTag) {
          return {cloud: info.cloud};
        }
        return {error: {message: 'cloud ' + entity.tag + ' not found'}};
      });
      client.receive({
        'request-id': data['request-id'],
        response: {results: results}
      });
    },

    /**
      Handle Cloud.DefaultCloud messages.

      @method this
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleCloudDefaultCloud: function(data, client, state) {
      const info = this._getCloudInfo(state);
      client.receive({
        'request-id': data['request-id'],
        response: {result: info.cloudTag}
      });
    },

    /**
      Handle Cloud.UserCredentials messages.

      @method handleCloudUserCredentials
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleCloudUserCredentials: function(data, client, state) {
      const userClouds = data.params['user-clouds'];
      if (!userClouds.length) {
        client.receive({
          'request-id': data['request-id'],
          response: {results: []}
        });
        return;
      }
      const cloudCredentialsStorage = this._getCredentialsStorage(state);
      const info = this._getCloudInfo(state);
      const results = userClouds.map(userCloud => {
        const userTag = userCloud['user-tag'];
        if (userTag !== 'user-admin@local' && userTag !== 'user-admin') {
          return {error: {
            message: 'invalid user tag provided: ' + userTag}
          };
        }
        if (userCloud['cloud-tag'] !== info.cloudTag) {
          return {error: {
            message: 'invalid cloud tag provided: ' + userCloud['cloud-tag']}
          };
        }
        return {result: Object.keys(cloudCredentialsStorage)};
      });
      client.receive({
        'request-id': data['request-id'],
        response: {results: results}
      });
    },

    /**
      Handle Cloud.Credential messages.

      @method handleCloudCredential
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleCloudCredential: function(data, client, state) {
      const entities = data.params.entities;
      if (!entities.length) {
        client.receive({
          'request-id': data['request-id'],
          response: {results: []}
        });
        return;
      }
      const cloudCredentialsStorage = this._getCredentialsStorage(state);
      const results = entities.map(entity => {
        const credentials = cloudCredentialsStorage[entity.tag];
        if (credentials) {
          return {result: credentials};
        }
        return {error: {message: 'credentials ' + entity.tag + ' not found'}};
      });
      client.receive({
        'request-id': data['request-id'],
        response: {results: results}
      });
    },

    /**
      Handle Cloud.UpdateCredentials messages.

      @method handleCloudUpdateCredentials
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleCloudUpdateCredentials: function(data, client, state) {
      const entries = data.params.credentials;
      if (!entries.length) {
        client.receive({
          'request-id': data['request-id'],
          response: {results: []}
        });
        return;
      }
      const cloudCredentialsStorage = this._getCredentialsStorage(state);
      const prefix = 'cloudcred-';
      const results = entries.map(entry => {
        if (entry.tag.substr(0, prefix.length) !== prefix) {
          return {error: {message: entry.tag + ' is not a valid tag'}};
        }
        cloudCredentialsStorage[entry.tag] = entry.credential;
        return {};
      });
      client.receive({
        'request-id': data['request-id'],
        response: {results: results}
      });
    },

    /**
      Handle Cloud.RevokeCredentials messages.

      @method handleCloudRevokeCredentials
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleCloudRevokeCredentials: function(data, client, state) {
      const entities = data.params.entities;
      if (!entities.length) {
        client.receive({
          'request-id': data['request-id'],
          response: {results: []}
        });
        return;
      }
      const cloudCredentialsStorage = this._getCredentialsStorage(state);
      const prefix = 'cloudcred-';
      const results = entities.map(entity => {
        if (entity.tag.substr(0, prefix.length) !== prefix) {
          return {error: {message: entity.tag + ' is not a valid tag'}};
        }
        delete cloudCredentialsStorage[entity.tag];
        return {};
      });
      client.receive({
        'request-id': data['request-id'],
        response: {results: results}
      });
    },

    /**
      Initialize and return the in-memory credentials storage.

      @method _getCredentialsStorage
      @param {Object} state An instance of FakeBackend.
      @return {Object} The in-memory cloud credentials storage, mapping
        credential tags to credential info.
    */
    _getCredentialsStorage: function(state) {
      if (this._cloudCredentialsStorage !== null) {
        // The-in memory credentials storage is already initialized.
        return this._cloudCredentialsStorage;
      }
      this._cloudCredentialsStorage = {};
      const provider = state.get('providerType');
      const tag = 'cloudcred-' + provider + '_admin@local_' + provider;
      this._cloudCredentialsStorage[tag] = {
        'auth-type': 'empty',
        attrs: {engine: 'JavaScript'},
        redacted: ['bad-parts']
      };
      return this._cloudCredentialsStorage;
    },

    /**
      Return information about the current sandbox cloud.

      @method _getCloudInfo
      @param {Object} state An instance of FakeBackend.
      @return {Object} An object with the following fields:
        - cloudTag holding the cloud tag;
        - cloud with the cloud information returned by the simulated server.
    */
    _getCloudInfo: function(state) {
      const provider = state.get('providerType');
      return {
        cloudTag: 'cloud-' + provider,
        cloud: {
          'auth-types': ['empty'],
          regions: [{name: 'localhost'}],
          type: provider
        }
      };
    },

    /**
      Handle Application.RemoteApplicationInfo messages.

      @method handleApplicationRemoteApplicationInfo
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleApplicationRemoteApplicationInfo: function(data, client, state) {
      console.log('remote applications are not supported in sandbox mode');
    },

    /**
      Handle KeyManager.ListKeys messages.

      @method handleKeyManagerListKeys
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleKeyManagerListKeys: function(data, client, state) {
      client.receive({
        'request-id': data['request-id'],
        response: {results: [{
          result: ['sandbox SSH key']
        }]}
      });
    },

    /**
      Makes a request using a real WebSocket to get the bundle changeSet data.

      @method handleBundleGetChanges
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleBundleGetChanges: function(data, client, state) {
      this.get('bundleService').getBundleChangesFromYAML(
        data.params.yaml, (error, changes) => {
          client.receive({
            'request-id': data['request-id'],
            error: error,
            response: {changes: changes}
          });
        }
      );
    }

  });

  sandboxModule.GoJujuAPI = GoJujuAPI;
}, '0.1.0', {
  requires: [
    'base',
    'js-yaml',
    'json-parse',
    'juju-env-api',
    'timers'
  ]
});
