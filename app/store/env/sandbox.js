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

  var sandboxModule = Y.namespace('juju.environments.sandbox');
  var models = Y.namespace('juju.models');
  var CLOSEDERROR = 'INVALID_STATE_ERR : Connection is closed.';

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

  /**
  A sandbox Juju environment using the Go API.

  @class GoJujuAPI
  */
  function GoJujuAPI(config) {
    GoJujuAPI.superclass.constructor.apply(this, arguments);
  }

  GoJujuAPI.NAME = 'sandbox-go-juju-api';
  GoJujuAPI.ATTRS = {
    state: {},
    socket_url: {},
    client: {},
    nextRequestId: {}, // The current outstanding "Next" RPC call ID.
    deltaInterval: {value: 1000} // In milliseconds.
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
        this['handle' + data.Type + data.Request](data,
            client, this.get('state'));
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
      data.Error = !state.login(data.Params.AuthTag, data.Params.Password);
      client.receive(data);
    },

    /**
    Handle GUIToken Login messages to the state object.

    @method handleGUITokenLogin
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleGUITokenLogin: function(data, client, state) {
      var response = state.tokenlogin(data.Params.Token);
      if (response) {
        client.receive({
          RequestId: data.RequestId,
          Response: {AuthTag: response[0], Password: response[1]}
        });
      } else {
        client.receive({
          RequestId: data.RequestId,
          Error: 'unknown, fulfilled, or expired token',
          ErrorCode: 'unauthorized access',
          Response: {}
        });
      }
    },

    /**
    Handle EnvironmentInfo messages.

    @method handleClientEnvironmentInfo
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientEnvironmentInfo: function(data, client, state) {
      client.receive({
        RequestId: data.RequestId,
        Response: {
          ProviderType: state.get('providerType'),
          DefaultSeries: state.get('defaultSeries'),
          Name: 'Sandbox'
        }
      });
    },

    /**
    Handle EnvironmentGet messages.

    @method handleClientEnvironmentGet
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    */
    handleClientEnvironmentGet: function(data, client, state) {
      client.receive({
        RequestId: data.RequestId,
        Response: {
          // For now only the MAAS server is required by the GUI.
          Config: {'maas-server': state.get('maasServer')}
        }
      });
    },

    /**
    A white-list for model attributes.  This translates them from the raw ATTRS
    to the format expected by the environment's delta handling.

    @property _deltaWhitelist
    @type {Object}
    */
    _deltaWhitelist: {
      service: {
        Name: 'id',
        Exposed: 'exposed',
        CharmURL: 'charm',
        Life: 'life',
        'Constraints': function(attrs) {
          var constraints = attrs.constraints || {};
          // Since juju-core sends the tags constraint as a list of strings,
          // we need to convert the value to an array.
          var tags = constraints.tags;
          if (tags) {
            constraints.tags = tags.split(',');
          }
          return constraints;
        },
        Config: 'config',
        Subordinate: 'subordinate'
      },
      machine: {
        Id: 'id',
        Addresses: 'addresses',
        InstanceId: 'instance_id',
        Status: 'agent_state',
        StateInfo: 'agent_status_info',
        StatusData: 'agent_state_data',
        'HardwareCharacteristics': function(attrs) {
          var hardware = attrs.hardware || {};
          return {
            Arch: hardware.arch,
            CpuCores: hardware.cpuCores,
            CpuPower: hardware.cpuPower,
            Mem: hardware.mem,
            RootDisk: hardware.disk
          };
        },
        Jobs: 'jobs',
        Life: 'life',
        Series: 'series',
        SupportedContainers: 'supportedContainers',
        'SupportedContainersKnown': function() {
          return true;
        }
      },
      unit: {
        Name: 'id',
        'Service': 'service',
        'Series': function(attrs, self) {
          var db = self.get('state').db;
          var service = db.services.getById(attrs.service);
          if (service) {
            var charm = db.charms.getById(service.get('charm'));
            return charm.get('series');
          } else {
            return null; // Probably unit/service was deleted.
          }
        },
        'CharmURL': function(attrs, self) {
          var db = self.get('state').db;
          var service = db.services.getById(attrs.service);
          if (service) {
            return service.get('charm');
          } else {
            return null; // Probably unit/service was deleted.
          }
        },
        PublicAddress: 'public_address',
        PrivateAddress: 'private_address',
        MachineId: 'machine',
        Ports: 'open_ports',
        Status: 'agent_state',
        StatusInfo: 'agent_state_info',
        StatusData: 'agent_state_data',
        Subordinate: 'subordinate'
      },
      relation: {
        Key: 'relation_id',
        'Endpoints': function(relation, goAPI) {
          var result = [];
          if (relation.endpoints.length === 1) {
            return;
          }
          relation.endpoints.forEach(function(endpoint, index) {
            result.push({
              Relation: {
                Name: endpoint[1].name,
                Role: (index) ? 'server' : 'client',
                Interface: relation.type,
                Scope: relation.scope
              },
              ServiceName: endpoint[0]
            });
          });
          return result;
        }
      },
      annotation: {
        'Tag': function(entity) {
          return entity.id;
        },
        'Annotations': function(entity) {
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
      Y.each(whitelist, function(value, key) {
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
        Y.each(this._deltaWhitelist, function(whitelist, changeType) {
          var collectionName = changeType + 's';
          if (changes) {
            Y.each(changes[collectionName], function(change) {
              var attrs = self._getDeltaAttrs(change[0], whitelist);
              var action = change[1] ? 'change' : 'remove';
              // The unit changeType is actually "serviceUnit" in the Python
              // stream.  Our model code handles either, so we're not modifying
              // it for now.
              var delta = [changeType, action, attrs];
              deltas.push(delta);
            });
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
        Y.each(this._deltaWhitelist, function(whitelist, changeType) {
          Y.each(annotations[changeType + 's'], function(model, key) {
            var attrs = models.getAnnotations(model);
            var tag = this.modelToTag(model);
            // This form will trigger the annotationInfo handler.
            deltas.push(['annotation', 'change', {
              Tag: tag, Annotations: attrs}]);
          }, this);
        }, this);
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
      } else if (name === 'environment') {
        return 'env';
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
            RequestId: this.get('nextRequestId'),
            Response: {Deltas: deltas.concat(annotations)}
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
        RequestId: data.RequestId,
        Response: {AllWatcherId: 42}
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
      this.set('nextRequestId', data.RequestId);
      clearInterval(this.deltaIntervalId);
      this.deltaIntervalId = setInterval(
          this.sendDelta.bind(this), this.get('deltaInterval'));
    },

    /**
    Receive a basic response. Several API calls simply return a request ID
    and an error (if there is one); this utility method handles those cases.

    @method _basicReceive
    @private
    @param {Object} client The active ClientConnection.
    @param {Object} request The initial request with a RequestId.
    @param {Object} result The result of the call with an optional error.
    */
    _basicReceive: function(request, client, result) {
      var response = {
        RequestId: request.RequestId,
        Response: {}
      };
      if (result.error) {
        response.Error = result.error;
      }
      client.receive(response);
    },

    /**
    Handle ServiceDeploy messages

    @method handleClientServiceDeploy
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceDeploy: function(data, client, state) {
      var callback = Y.bind(function(result) {
        this._basicReceive(data, client, result);
      }, this);

      state.deploy(data.Params.CharmUrl, callback, {
        name: data.Params.ServiceName,
        config: data.Params.Config,
        configYAML: data.Params.ConfigYAML,
        constraints: data.Params.Constraints,
        unitCount: data.Params.NumUnits,
        toMachine: data.Params.ToMachineSpec
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
      var params = data.Params.MachineParams.map(function(machineParam) {
        return {
          jobs: machineParam.Jobs,
          series: machineParam.Series,
          parentId: machineParam.ParentId,
          containerType: machineParam.ContainerType,
          constraints: machineParam.Constraints
        };
      });
      var response = state.addMachines(params);
      var machines = response.machines.map(function(data) {
        var error = null;
        if (data.error) {
          // There is no need for the sandbox to simulate the juju-core error
          // code machinery. Most of the times this is an empty string in real
          // environments. The message can always be found in Error.Message.
          error = {Code: '', Message: data.error};
        }
        return {Machine: data.name || '', Error: error};
      });
      client.receive({
        RequestId: data.RequestId,
        Error: response.error,
        Response: {Machines: machines}
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
      var params = data.Params;
      var response = state.destroyMachines(params.MachineNames, params.Force);
      this._basicReceive(data, client, response);
    },

    /**
    Handle ServiceDestroy messages

    @method handleClientServiceDestroy
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceDestroy: function(data, client, state) {
      var result = state.destroyService(data.Params.ServiceName);
      this._basicReceive(data, client, result);
    },

    /**
      Handle DestroyServiceUnits messages

      @method handleClientDestroyServiceUnits
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
      @return {undefined} Side effects only.
     */
    handleClientDestroyServiceUnits: function(data, client, state) {
      var res = state.removeUnits(data.Params.UnitNames);
      this._basicReceive(data, client, res);
    },

    /**
    Handle CharmInfo messages

    @method handleClientCharmInfo
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientCharmInfo: function(data, client, state) {
      state.getCharm(data.Params.CharmURL, Y.bind(function(result) {
        if (result.error) {
          this._basicReceive(data, client, result);
        } else {
          result = result.result;
          // Convert the charm into the Go format, so it can be converted
          // back into the provided format.
          var convertedData = {
            RequestId: data.RequestId,
            Response: {
              Config: {
                Options: result.options
              },
              Meta: {
                Description: result.description,
                Format: result.format,
                Name: result.name,
                Peers: result.peers,
                Provides: result.provides,
                Requires: result.requires,
                Subordinate: result.is_subordinate,
                Summary: result.summary
              },
              URL: result.url,
              Revision: result.revision
            }
          };
          client.receive(convertedData);
        }
      }, this));
    },

    /**
    Handle SetServiceConstraints messages

    @method handleClientSetServiceConstraints
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientSetServiceConstraints: function(data, client, state) {
      var result = state.setConstraints(data.Params.ServiceName,
          data.Params.Constraints);
      this._basicReceive(data, client, result);
    },

    /**
    Handle ServiceSet messages

    @method handleClientServiceSet
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceSet: function(data, client, state) {
      var result = state.setConfig(
          data.Params.ServiceName, data.Params.Options);
      this._basicReceive(data, client, result);
    },

    /**
    Handle ServiceSetYAML messages

    @method handleClientServiceSetYAML
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceSetYAML: function(data, client, state) {
      var config = {};
      try {
        config = jsyaml.safeLoad(data.Params.Config);
      } catch (e) {
        if (e instanceof jsyaml.YAMLException) {
          this._basicReceive(data, client,
              {error: 'Error parsing YAML.\n' + e});
          return;
        }
        throw e;
      }
      var serviceName = data.Params.ServiceName;
      var result = state.setConfig(serviceName, config[serviceName]);
      this._basicReceive(data, client, result);
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
      var result = state.resolved(data.Params.UnitName);
      this._basicReceive(data, client, result);
    },

    /**
    Handle ServiceSetCharm messages

    @method handleClientServiceSetCharm
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceSetCharm: function(data, client, state) {
      var callback = Y.bind(function(result) {
        this._basicReceive(data, client, result);
      }, this);
      state.setCharm(data.Params.ServiceName, data.Params.CharmUrl,
          data.Params.Force, callback);
    },

    /**
    Handle SetAnnotations messages

    @method handleClientSetAnnotations
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientSetAnnotations: function(data, client, state) {
      var entityId = /^(service|unit|machine|environment)-([^ ]*)$/.
          exec(data.Params.Tag)[2];
      var result = state.updateAnnotations(entityId, data.Params.Pairs);
      this._basicReceive(data, client, result);
    },

    /**
    Handle ServiceGet messages

    @method handleClientServiceGet
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceGet: function(data, client, state) {
      var reply = state.getService(data.Params.ServiceName);
      var response = {
        RequestId: data.RequestId
      };
      if (reply.error) {
        response.Error = reply.error;
        client.receive(response);
      } else {
        var charmName = reply.result.charm;

        // Get the charm to load the full options data as the service config
        // format.
        state.getCharm(charmName, function(payload) {
          var charmData = payload.result;
          var formattedConfig = {};
          var backendConfig = reply.result.options || reply.result.config;

          Y.Object.each(charmData.options, function(value, key) {
            formattedConfig[key] = charmData.options[key];
            if (backendConfig[key]) {
              formattedConfig[key].value = backendConfig[key];
            } else {
              formattedConfig[key].value = charmData.options[key]['default'];
            }
          });

          response.Response = {
            Service: data.Params.ServiceName,
            Charm: charmName,
            Config: formattedConfig,
            Constraints: reply.result.constraints
          };
          client.receiveNow(response);
        });
      }

    },

    /**
    Handle AddServiceUnits messages

    @method handleClientAddServiceUnits
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientAddServiceUnits: function(data, client, state) {
      var reply = state.addUnit(data.Params.ServiceName, data.Params.NumUnits,
          data.Params.ToMachineSpec);
      var units = [];
      if (!reply.error) {
        units = reply.units.map(function(u) {return u.id;});
      }
      client.receive({
        RequestId: data.RequestId,
        Error: reply.error,
        Response: {Units: units}
      });
    },

    /**
    Handle ServiceExpose messages

    @method handleClientServiceExpose
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceExpose: function(data, client, state) {
      var result = state.expose(data.Params.ServiceName);
      this._basicReceive(data, client, result);
    },

    /**
    Handle ServiceUnexpose messages

    @method handleClientServiceUnexpose
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientServiceUnexpose: function(data, client, state) {
      var result = state.unexpose(data.Params.ServiceName);
      this._basicReceive(data, client, result);
    },

    /**
    Handle AddRelation messages

    @method handleClientAddRelation
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientAddRelation: function(data, client, state) {
      var stateData = state.addRelation(
          data.Params.Endpoints[0], data.Params.Endpoints[1], false);
      var resp = {RequestId: data.RequestId};
      if (stateData === false) {
        // Everything checks out but could not create a new relation model.
        resp.Error = 'Unable to create relation';
        client.receive(resp);
        return;
      }
      if (stateData.error) {
        resp.Error = stateData.error;
        client.receive(resp);
        return;
      }
      var respEndpoints = {},
          stateEpA = stateData.endpoints[0],
          stateEpB = stateData.endpoints[1],
          epA = {
            Name: stateEpA[1].name,
            Role: 'requirer',
            Scope: stateData.scope,
            Interface: stateData['interface']
          },
          epB = {
            Name: stateEpB[1].name,
            Role: 'provider',
            Scope: stateData.scope,
            Interface: stateData['interface']
          };
      respEndpoints[stateEpA[0]] = epA;
      respEndpoints[stateEpB[0]] = epB;
      resp.Response = {
        Endpoints: respEndpoints
      };
      client.receive(resp);
    },

    /**
    Handle DestroyRelation messages

    @method handleClientDestroyRelation
    @param {Object} data The contents of the API arguments.
    @param {Object} client The active ClientConnection.
    @param {Object} state An instance of FakeBackend.
    @return {undefined} Side effects only.
    */
    handleClientDestroyRelation: function(data, client, state) {
      var result = state.removeRelation(data.Params.Endpoints[0],
          data.Params.Endpoints[1]);
      this._basicReceive(data, client, result);
    },

    /**
      Makes a request using a real websocket to get the bundle changeSet data.

      @method handleChangeSetGetChanges
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} state An instance of FakeBackend.
    */
    handleChangeSetGetChanges: function(data, client, state) {
      // The getChangeSet functionality still needs to be possible when
      // deployed via charm and in sandbox mode.
      var ws = new Y.ReconnectingWebSocket(this.get('socket_url'));
      ws.onopen = this._changeSetWsOnOpen.bind(this, ws, data);
      ws.onmessage = this._changeSetWsOnMessage.bind(this, data, client);
      // Because it's possible (and likely) that a user will drop a charm while
      // the GUI is not deployed with a reference to the bundle lib we need to
      // bail and throw an error after trying a few times. We try a few times
      // in the event of a poor connection.
      ws.onerror = this._changeSetWsOnError.bind(this, data, client);
    },

    /**
      Websocket on open handler.

      @method _changeSetWsOnOpen
      @param {Object} ws Reference to the websocket instance.
      @param {Object} data The contents of the API arguments.
    */
    _changeSetWsOnOpen: function(ws, data) {
      ws.send(JSON.stringify(data));
    },

    /**
      Track the failure times so that we can notify to the user that we cannot
      connect to the charm or bundle lib.

      @method _changeSetWsOnError
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} response The websocket response.
    */
    _changeSetWsOnError: function(data, client, response) {
      this.wsFailureCount += 1;
      if (this.wsFailureCount === 3) {
        // Disconnect and bail if we have had three failures.
        response.currentTarget.close();
        this._basicReceive(data, client, {
          error: 'Unable to connect to bundle processor.'
        });
      }
    },

    /**
      Websocket on message handler.

      @method _changeSetWsOnMessage
      @param {Object} data The contents of the API arguments.
      @param {Object} client The active ClientConnection.
      @param {Object} response The websocket response.
    */
    _changeSetWsOnMessage: function(data, client, response) {
      client.receive({
        RequestId: data.RequestId,
        Response: JSON.parse(response.data).Response
      });
      response.currentTarget.close();
    }

  });

  sandboxModule.GoJujuAPI = GoJujuAPI;
}, '0.1.0', {
  requires: [
    'base',
    'js-yaml',
    'json-parse',
    'juju-env-go',
    'reconnecting-websocket',
    'timers'
  ]
});
