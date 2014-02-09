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
An in-memory fake Juju backend and supporting elements.

@module env
@submodule env.fakebackend
*/

YUI.add('juju-env-fakebackend', function(Y) {

  var models = Y.namespace('juju.models');
  var ziputils = Y.namespace('juju.ziputils');
  var UNAUTHENTICATED_ERROR = {error: 'Please log in.'};
  var VALUE_ERROR = {error: 'Unparsable environment data.'};

  /**
  An in-memory fake Juju backend.

  @class FakeBackend
  */
  function FakeBackend(config) {
    // Invoke Base constructor, passing through arguments.
    FakeBackend.superclass.constructor.apply(this, arguments);
  }

  FakeBackend.NAME = 'fake-backend';
  FakeBackend.ATTRS = {
    authorizedUsers: {value: {'admin': 'password'}},
    token: {value: 'demoToken'},
    authenticated: {value: false},
    store: {required: true},
    defaultSeries: {value: 'precise'},
    providerType: {value: 'demonstration'}
  };

  Y.extend(FakeBackend, Y.Base, {

    /**
    Initializes.

    @method initializer
    @return {undefined} Nothing.
    */
    initializer: function() {
      this.db = new models.Database();
      this._resetChanges();
      this._resetAnnotations();
      // used for relation id's
      this._relationCount = 0;
      // used for deployer import tracking
      this._importId = 0;
      this._importChanges = [];
      this._deploymentId = 0;
    },

    /**
    Reset the database for reporting object changes.

    @method _resetChanges
    @return {undefined} Nothing.
    */
    _resetChanges: function() {
      this.changes = {
        // These are hashes of identifier: [object, boolean], where a true
        // boolean means added or changed and a false value means removed.
        services: {},
        machines: {},
        units: {},
        relations: {}
      };
    },

    /**
    Return all of the recently changed objects.

    @method nextChanges
    @return {Object} A hash of the keys 'services', 'machines', 'units' and
      'relations'.  Each of those are hashes from entity identifier to
      [entity, boolean] where the boolean means either active (true) or
      removed (false).
    */
    nextChanges: function() {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var result;
      if (Y.Object.isEmpty(this.changes.services) &&
          Y.Object.isEmpty(this.changes.machines) &&
          Y.Object.isEmpty(this.changes.units) &&
          Y.Object.isEmpty(this.changes.relations)) {
        result = null;
      } else {
        result = this.changes;
        this._resetChanges();
      }
      return result;
    },

    /**
    Reset the database for reporting object annotation changes.

    @method _resetAnnotations
    @return {undefined} Nothing.
    */
    _resetAnnotations: function() {
      this.annotations = {
        // These are hashes of identifier: object.
        services: {},
        machines: {},
        units: {},
        relations: {},
        annotations: {}
      };
    },

    /**
      Return all of the recently annotated objects.

      @method nextAnnotations
      @return {Object} A hash of the keys 'services', 'machines', 'units',
      'relations' and 'annotations'.  Each of those are hashes from entity
      identifier to entity.
    */
    nextAnnotations: function() {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var result;
      if (Y.Object.isEmpty(this.annotations.services) &&
          Y.Object.isEmpty(this.annotations.machines) &&
          Y.Object.isEmpty(this.annotations.units) &&
          Y.Object.isEmpty(this.annotations.relations) &&
          Y.Object.isEmpty(this.annotations.annotations)) {
        result = null;
      } else {
        result = this.annotations;
        this._resetAnnotations();
      }
      return result;
    },

    /**
    Attempt to log a user in.

    @method login
    @param {String} username The id of the user.
    @param {String} submittedPassword The user-submitted password.
    @return {Bool} True if the authentication was successful.
    */
    login: function(username, submittedPassword) {
      var password = this.get('authorizedUsers')[username],
          authenticated = password === submittedPassword;
      this.set('authenticated', authenticated);
      return authenticated;
    },


    /**
    Attempt to log a user in with a token.

    @method tokenlogin
    @param {String} submittedToken The authentication token.
    @return {Array} [username, password] if successful, or else undefined.
    */
    tokenlogin: function(submittedToken) {
      var token = this.get('token'),
          authorizedUsers = this.get('authorizedUsers'),
          authenticated = token === submittedToken;
      this.set('authenticated', authenticated);
      if (authenticated) {
        var username = Object.keys(authorizedUsers)[0];
        var password = authorizedUsers[username];
        return [username, password];
      }
    },

    /**
      Log out.  If already logged out, no error is raised.
      @method logout
      @return {undefined} Nothing.
    */
    logout: function() {
      this.set('authenticated', false);
    },

    /**
    Deploy a service from a charm.  Uses a callback for response!

    @method deploy
    @param {String} charmUrl The URL of the charm.
    @param {Function} callback A call that will receive an object either
      with an "error" attribute containing a string describing the problem,
      or with a "service" attribute containing the new service, a "charm"
      attribute containing the charm used, and a "units" attribute
      containing a list of the added units.  This is asynchronous because we
      often must go over the network to the charm store.
    @param {Object} options An options object.
      name: The name of the service to be deployed, defaulting to the charm
        name.
      config: The charm configuration options, defaulting to none.
      configYAML: The charm configuration options, expressed as a YAML
        string.  You may provide only one of config or configYAML.
      unitCount: The number of units to be deployed.
    @return {undefined} All results are passed to the callback.
    */
    deploy: function(charmId, callback, options) {
      if (!this.get('authenticated')) {
        return callback(UNAUTHENTICATED_ERROR);
      }
      if (!options) {
        options = {};
      }
      var self = this;
      this._loadCharm(charmId, {
        // On success deploy the successfully-obtained charm.
        success: function(charm) {
          self._deployFromCharm(charm, callback, options);
        },
        failure: callback
      });
    },


    /**
     Return a promise to deploy a charm. On failure the promise will be
     rejected.

     @method promiseDeploy
     @param {String} charmId Charm to deploy.
     @param {Object} [options] See deploy.
     @return {Promise} Resolving to the results of the deploy call.
    */
    promiseDeploy: function(charmId, options) {
      var self = this;
      return new Y.Promise(function(resolve, reject) {
        var intermediateCallback = function(result) {
          if (result.error) {
            reject(result);
          } else {
            resolve(result);
          }
        };
        self.deploy(charmId, intermediateCallback, options);
      });
    },

    /**
    Set the given service to use the given charm, optionally forcing units in
    error state to use the charm.

    @method setCharm
    @param {String} serviceName The name of the service to set.
    @param {String} charmId The charm to use.
    @param {Boolean} force Whether or not to force the issue.
    @param {Function} callback A call that will receive an object, potentially
      with an "error" attribute containing a string describing the problem.
    @return {undefined} All results are passed to the callback.
    */
    setCharm: function(serviceName, charmId, force, callback) {
      if (!this.get('authenticated')) {
        return callback(UNAUTHENTICATED_ERROR);
      }
      var self = this;
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return callback({error: 'Service "' + serviceName + '" not found.'});
      }
      var unitsInError = service.get('units')
        .some(function(unit) {
            return (/error/).test(unit.agent_state);
          });
      if (unitsInError && !force) {
        return callback({error: 'Cannot set charm on a service with units in ' +
              'error without the force flag.'});
      }
      this._loadCharm(charmId, {
        success: function(charm) {
          service.set('charm', charm.get('id'));
          self.changes.services[service.get('id')] = [service, true];
          callback({});
        },
        failure: callback
      });
    },

    /**
    Get a charm from a URL, via the charmworld API and/or db.  Uses callbacks.

    @method _loadCharm
    @param {String} charmId The URL of the charm.
    @param {Function} callbacks An optional object with optional success and
      failure callables.  This is asynchronous because we
      often must go over the network to the charm store.  The success
      callable receives the fully loaded charm, and the failure callable
      receives an object with an explanatory "error" attribute.
    @return {undefined} Use the callbacks to handle success or failure.
    */
    _loadCharm: function(charmId, callbacks) {
      var charmIdParts = models.parseCharmId(
          charmId, this.get('defaultSeries'));
      if (!callbacks) {
        callbacks = {};
      }
      if (!charmIdParts) {
        return (
            callbacks.failure &&
            callbacks.failure({error: 'Invalid charm id: ' + charmId}));
      }
      var charm = this.db.charms.getById(charmId);
      if (charm) {
        callbacks.success(charm);
      } else {
        // Get the charm data.
        var self = this;
        this.get('store').charm(charmIdParts.storeId, {
          // Convert the charm data to a charm and use the success
          // callback.
          success: function(data) {
            var charm = self._getCharmFromData(data.charm || data);
            if (callbacks.success) {
              callbacks.success(charm);
            }
          },
          // Inform the caller of an error using the charm store.
          failure: function(e) {
            // This is most likely an IOError stemming from an
            // invalid charm pointing to a bad URL and a read of a
            // 404 giving an error at this level. IOError isn't user
            // facing so we log the warning.
            console.warn('error loading charm: ', e);
            if (callbacks.failure) {
              callbacks.failure(
                  {error: 'Error interacting with the charmworld API.'});
            }
          }
        });
      }
    },

    /**
    Convert charm data as returned by the charmworld API into a charm.
    The charm might be pre-existing or might need to be created, but
    after this method it will be within the db.

    @method _getCharmFromData
    @param {Object} charmData The raw charm information as delivered by the
      charmworld API.
    @return {Object} A matching charm from the db.
    */
    _getCharmFromData: function(charmData) {
      var charm = this.db.charms.getById(charmData.store_url || charmData.url);
      if (!charm) {
        charmData.id = charmData.store_url || charmData.url;
        charm = this.db.charms.add(charmData);
      }
      return charm;
    },

    /**
    Deploy a charm, given the charm, a callback, and options.

    @method _deployFromCharm
    @param {Object} charm The charm to be deployed, from the db.
    @param {Function} callback A call that will receive an object either
      with an "error" attribute containing a string describing the problem,
      or with a "service" attribute containing the new service, a "charm"
      attribute containing the charm used, and a "units" attribute
      containing a list of the added units.  This is asynchronous because we
      often must go over the network to the charm store.
    @param {Object} options An options object.
      name: The name of the service to be deployed, defaulting to the charm
        name.
      config: The charm configuration options, defaulting to none.
      configYAML: The charm configuration options, expressed as a YAML
        string.  You may provide only one of config or configYAML.
      unitCount: The number of units to be deployed.
    @return {undefined} Get the result from the callback.
    */
    _deployFromCharm: function(charm, callback, options) {
      if (!options) {
        options = {};
      }
      if (!options.name) {
        options.name = charm.get('package_name');
      }
      if (this.db.services.getById(options.name)) {
        console.log(options);
        return callback({error: 'A service with this name already exists (' +
              options.name + ').'});
      }
      if (options.configYAML) {
        if (!Y.Lang.isString(options.configYAML)) {
          console.log(options);
          return callback(
              {error: 'Developer error: configYAML is not a string.'});
        }
        try {
          // options.configYAML overrides options.config in Go and Python
          // implementations, so we do that here too.
          options.config = jsyaml.safeLoad(options.configYAML);
        } catch (e) {
          if (e instanceof jsyaml.YAMLException) {
            console.log(options, e);
            return callback({error: 'Error parsing YAML.\n' + e});
          }
          throw e;
        }
      }

      var constraints = {};
      if (options.constraints) {
        constraints = options.constraints;
      }

      var annotations = options.annotations || {};

      // In order for the constraints to support the python back end this
      // needs to be an array, so we are converting it back to an object
      // here so that the GUI displays it properly.
      var constraintsMap = {}, vals;
      if (typeof constraints === 'string') {
        constraints = constraints.split(',');
      }
      if (Y.Lang.isArray(constraints)) {
        constraints.forEach(function(cons) {
          vals = cons.split('=');
          constraintsMap[vals[0]] = vals[1];
        });
      } else {
        constraintsMap = constraints;
      }

      // We need to set charm default values for the options that have not
      // been explicitly provided.
      var charmOptions = charm.get('options') || {};
      // "config" will hold the service's config values--it will be the
      // result of this processing.
      var config = {};
      var explicitConfig = options.config || {};
      Object.keys(charmOptions).forEach(function(key) {
        config[key] = explicitConfig[key] || charmOptions[key]['default'];
      });

      var service = this.db.services.add({
        id: options.name,
        name: options.name,
        charm: charm.get('id'),
        constraints: constraintsMap,
        exposed: false,
        subordinate: charm.get('is_subordinate'),
        annotations: annotations,
        config: config
      });
      this.changes.services[service.get('id')] = [service, true];
      if (Object.keys(annotations).length) {
        this.annotations.services[service.get('id')] = service;
      }

      var unitCount = options.unitCount;
      if (!Y.Lang.isValue(unitCount) && !charm.get('is_subordinate')) {
        // This is the current behavior in both implementations.
        unitCount = 1;
      }
      var response = this.addUnit(options.name, unitCount);
      response.service = service;
      callback(response);
    },

    /**
     Destroy the named service.

     @method destroyService
     @param {String} serviceName to destroy.
     @return {Object} results With err and service_name.
     */
    destroyService: function(serviceName) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return {error: 'Invalid service id: ' + serviceName};
      }
      // Remove all relations for this service.
      var relations = this.db.relations.get_relations_for_service(service);
      Y.Array.each(relations, function(rel) {
        this.db.relations.remove(rel);
        this.changes.relations[rel.get('relation_id')] = [rel, false];
      }, this);
      // Remove units for this service.
      // get() on modelList returns the array of values for all children by
      // default.
      var unitNames = service.get('units').get('id');
      var result = this.removeUnits(unitNames);
      if (result.error && result.error.length > 0) {
        console.log(result, result.error);
        return {
          error: 'Error removing units [' + unitNames.join(', ') +
              '] of ' + serviceName
        };
      } else if (result.warning && result.warning.length > 0) {
        console.log(result, result.warning);
        return {
          error: 'Warning removing units [' + unitNames.join(', ') +
              '] of ' + serviceName
        };
      }
      // And finally destroy and remove the service.
      this.db.services.remove(service);
      this.changes.services[serviceName] = [service, false];
      service.destroy();
      return {result: serviceName};
    },

    /**
     * Get service attributes.
     *
     * @method getService
     * @param {String} serviceName to get.
     * @return {Object} Service Attributes..
     */
    getService: function(serviceName) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return {error: 'Invalid service id: ' + serviceName};
      }
      var serviceData = service.getAttrs();
      if (!serviceData.constraints) {
        serviceData.constraints = {};
      }

      var relations = this.db.relations.get_relations_for_service(service);
      var rels = relations.map(function(r) {return r.getAttrs();});
      // TODO: properly map relations to expected format rather
      // than this passthrough. Pending on the add/remove relations
      // branches that will need the same helper code.
      serviceData.rels = rels;
      return {result: serviceData};
    },

    /**
     * Get Charm data.
     *
     * @method getCharm
     * @param {String} charmName to get.
     * @return {Object} charm attrs..
     */
    getCharm: function(charmName, callback) {
      if (!this.get('authenticated')) {
        return callback(UNAUTHENTICATED_ERROR);
      }
      var formatCharm = function(charm) {
        // Simulate a delay in the charm loading for testing.
        var charmLoadDelay = 0;
        if (window.flags.charmLoadDelay) {
          charmLoadDelay = parseInt(window.flags.charmLoadDelay, 10);
        }
        setTimeout(function() {
          callback({result: charm.getAttrs()});
        }, charmLoadDelay);
      };
      this._loadCharm(charmName, {
        success: formatCharm,
        failure: callback});
    },

    /**
    Add units to the given service.

    @method addUnit
    @param {String} serviceName The name of the service to be scaled up.
    @param {Integer} numUnits The number of units to be added, defaulting
      to 1.
    @return {Object} Returns an object either with an "error" attribute
      containing a string describing the problem, or with a "units"
      attribute containing a list of the added units.
    */
    addUnit: function(serviceName, numUnits) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return {error: 'Service "' + serviceName + '" does not exist.'};
      }
      var is_subordinate = service.get('subordinate');
      if (Y.Lang.isUndefined(numUnits)) {
        numUnits = is_subordinate ? 0 : 1;
      }
      if (!Y.Lang.isNumber(numUnits) ||
          (!is_subordinate && numUnits < 1 ||
          (is_subordinate && numUnits !== 0))) {
        return {
          error: 'Invalid number of units [' + numUnits +
              '] for service: ' + serviceName
        };
      }
      if (!Y.Lang.isValue(service.unitSequence)) {
        service.unitSequence = 0;
      }
      var unit, machine;
      var machines = this._getUnitMachines(numUnits);
      var unitList = service.get('units');
      var units = [];

      for (var i = 0; i < numUnits; i += 1) {
        var unitId = service.unitSequence;
        machine = machines[i];
        unit = unitList.add({
          'id': serviceName + '/' + unitId,
          'machine': machine.machine_id,
          // The models use underlines, not hyphens (see
          // app/models/models.js in _process_delta.)
          'agent_state': 'started'
        });
        units.push(unit);
        service.unitSequence += 1;
        this.changes.units[unit.id] = [unit, true];
        this.changes.machines[machine.machine_id] = [machine, true];
      }
      return {units: units, machines: machines};
    },

    /**
    Find machines without any units currently assigned.

    @method _getAvailableMachines
    @return {Array} An array of zero or more machines that have been
      previously allocated but that are not currently in use by a unit.
    */
    _getAvailableMachines: function() {
      var machines = [];
      var usedMachineIds = {};
      this.db.services.each(function(service) {
        service.get('units').each(function(unit) {
          if (unit.machine) {
            usedMachineIds[unit.machine] = true;
          }
        });
      });
      this.db.machines.each(function(machine) {
        if (!usedMachineIds[machine.machine_id]) {
          machines.push(machine);
        }
      });
      return machines;
    },

    /**
    Find or allocate machines for the requested number of units.

    @method _getUnitMachines
    @param {Integer} count The number of units that need machines.
    @return {Array} An array of [count] machines.
    */
    _getUnitMachines: function(count) {
      var machines = [];
      var availableMachines = this._getAvailableMachines();
      var machineId;
      if (!Y.Lang.isValue(this.db.machines.sequence)) {
        this.db.machines.sequence = 0;
      }
      for (var i = 0; i < count; i += 1) {
        if (i < availableMachines.length) {
          machines.push(availableMachines[i]);
        } else {
          machineId = this.db.machines.sequence += 1;
          machines.push(
              this.db.machines.add({
                'machine_id': machineId.toString(),
                'public_address':
                    'addr-' + machineId.toString() + '.example.com',
                'agent_state': 'running'}));
        }
      }
      return machines;
    },

    /**
      Removes the supplied units

      @method removeUnits
      @param {Array} unitNames a list of unit names to be removed.
    */
    removeUnits: function(unitNames) {
      var service, removedUnit,
          warning, error;

      // XXX: BradCrittenden 2013-04-15: Remove units should optionally remove
      // the corresponding machines.
      if (typeof unitNames === 'string') {
        unitNames = [unitNames];
      }
      Y.Array.each(unitNames, function(unitName) {
        service = this.db.services.getById(unitName.split('/')[0]);
        if (service && service.get('is_subordinate')) {
          if (!Y.Lang.isArray(error)) { error = []; }
          error.push(unitName + ' is a subordinate, cannot remove.');
        } else {
          // For now we also need to clean up the services unit list but the
          // above should go away soon when below becomes the default.
          if (service) {
            var units = service.get('units');
            var unit = units.getById(unitName);
            if (unit) {
              units.remove(unit);
              this.changes.units[unitName] = [unit, false];
              return;
            }
          }
          if (!Y.Lang.isArray(warning)) { warning = []; }
          warning.push(unitName + ' does not exist, cannot remove.');
        }
      }, this);

      // Return the errors and warnings
      return {
        error: error,
        warning: warning
      };
    },

    /**
      Exposes a service from the supplied string.

      @method expose
      @param {String} serviceName The service name.
      @return {Object} An object containing an `error` and `warning` properties
        which will be undefined if there were no warnings or errors.
    */
    expose: function(serviceName) {
      var service = this.db.services.getById(serviceName),
          warning, error;

      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }

      if (service) {
        if (!service.get('exposed')) {
          service.set('exposed', true);
          this.changes.services[service.get('id')] = [service, true];
        } else {
          warning = 'Service "' + serviceName + '" was already exposed.';
        }
      } else {
        error = '"' + serviceName + '" is an invalid service name.';
      }

      return {
        error: error,
        warning: warning
      };
    },

    /**
      Unexposes a service from the supplied string.

      @method unexpose
      @param {String} serviceName The service name.
      @return {Object} An object containing an `error` and `warning` properties
        which will be undefined if there were no warnings or errors.
    */
    unexpose: function(serviceName) {
      var service = this.db.services.getById(serviceName),
          warning, error;

      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      if (service) {
        if (service.get('exposed')) {
          service.set('exposed', false);
          this.changes.services[service.get('id')] = [service, true];
        } else {
          warning = 'Service "' + serviceName + '" is not exposed.';
        }
      } else {
        error = '"' + serviceName + '" is an invalid service name.';
      }

      return {
        error: error,
        warning: warning
      };
    },

    /**
      Takes two string endpoints and splits it into usable parts.

      @method parseEndpointStrings
      @param {Database} db to resolve charms/services on.
      @param {Array} endpoints an array of endpoint strings
        to split in the format wordpress:db.
      @return {Object} An Array of parsed endpoints, each containing name, type
      and the related charm. Name is the user defined service name and type is
      the charms authors name for the relation type.
     */
    parseEndpointStrings: function(db, endpoints) {
      return Y.Array.map(endpoints, function(endpoint) {
        var epData = endpoint.split(':');
        var result = {};
        if (epData.length > 1) {
          result.name = epData[0];
          result.type = epData[1];
        } else {
          result.name = epData[0];
        }
        result.service = db.services.getById(result.name);
        if (result.service) {
          result.charm = db.charms.getById(
              result.service.get('charm'));
          if (!result.charm) {
            console.warn('Failed to load charm',
                         result.charm, db.charms.size(), db.charms.get('id'));
          }
        } else {
          console.warn('failed to resolve service', result.name);
        }
        return result;
      }, this);
    },

    /**
      Loops through the charm endpoint data to determine whether we have a
      relationship match. The result is either an object with an error
      attribute, or an object giving the interface, scope, providing endpoint,
      and requiring endpoint.

      @method findEndpointMatch
      @param {Array} endpoints Pair of two endpoint data objects.  Each
      endpoint data object has name, charm, service, and scope.
      @return {Object} A hash with the keys 'interface', 'scope', 'provides',
      and 'requires'.
     */
    findEndpointMatch: function(endpoints) {
      var matches = [], result;
      Y.each([0, 1], function(providedIndex) {
        // Identify the candidates.
        var providingEndpoint = endpoints[providedIndex];
        // The merges here result in a shallow copy.
        var provides = Y.merge(providingEndpoint.charm.get('provides') || {}),
            requiringEndpoint = endpoints[!providedIndex + 0],
            requires = Y.merge(requiringEndpoint.charm.get('requires') || {});
        if (!provides['juju-info']) {
          provides['juju-info'] = {'interface': 'juju-info',
                                    scope: 'container'};
        }
        // Restrict candidate types as tightly as possible.
        var candidateProvideTypes, candidateRequireTypes;
        if (providingEndpoint.type) {
          candidateProvideTypes = [providingEndpoint.type];
        } else {
          candidateProvideTypes = Y.Object.keys(provides);
        }
        if (requiringEndpoint.type) {
          candidateRequireTypes = [requiringEndpoint.type];
        } else {
          candidateRequireTypes = Y.Object.keys(requires);
        }
        // Find matches for candidates and evaluate them.
        Y.each(candidateProvideTypes, function(provideType) {
          Y.each(candidateRequireTypes, function(requireType) {
            var provideMatch = provides[provideType],
                requireMatch = requires[requireType];
            if (provideMatch &&
                requireMatch &&
                provideMatch['interface'] === requireMatch['interface']) {
              matches.push({
                'interface': provideMatch['interface'],
                scope: provideMatch.scope || requireMatch.scope,
                provides: providingEndpoint,
                requires: requiringEndpoint,
                provideType: provideType,
                requireType: requireType
              });
            }
          });
        });
      });
      if (matches.length === 0) {
        console.log(endpoints);
        result = {error: 'Specified relation is unavailable.'};
      } else if (matches.length > 1) {
        console.log(endpoints);
        result = {error: 'Ambiguous relationship is not allowed.'};
      } else {
        result = matches[0];
        // Specify the type for implicit relations.
        result.provides = Y.merge(result.provides);
        result.requires = Y.merge(result.requires);
        result.provides.type = result.provideType;
        result.requires.type = result.requireType;
      }
      return result;
    },

    /**
      Add a relation between two services.

      @method addRelation
      @param {String} endpointA A string representation of the service name
        and endpoint connection type ie) wordpress:db.
      @param {String} endpointB A string representation of the service name
        and endpoint connection type ie) wordpress:db.
      @param {Boolean} useRelationCount whether or not to generate and
        incremented relation id or to just use the name and types of the
        endpoints.
    */
    addRelation: function(endpointA, endpointB, useRelationCount) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      if ((typeof endpointA !== 'string') ||
          (typeof endpointB !== 'string')) {
        return {error: 'Two string endpoint names' +
              ' required to establish a relation'};
      }

      // Parses the endpoint strings to extract all required data.
      var endpointData = this.parseEndpointStrings(this.db,
                                                   [endpointA, endpointB]);

      // This error should never be hit but it's here JIC
      if (!endpointData[0].charm || !endpointData[1].charm) {
        return {error: 'Charm not loaded.'};
      }
      // If there are matching interfaces this will contain an object of the
      // charm interface type and scope (if supplied).
      var match = this.findEndpointMatch(endpointData);

      // If there is an error fetching a valid interface and scope
      if (match.error) { return match; }

      // Assign a unique relation id which is incremented after every
      // successful relation if useRelationCount is set to true.  If not, then
      // it will be set with the requires/provides endpoint names.
      var relationId = '';
      if (useRelationCount) {
        relationId = 'relation-' + this._relationCount;
      } else {
        relationId = [
          match.requires.name + ':' + match.requires.type,
          match.provides.name + ':' + match.provides.type
        ].join(' ');
      }
      // The ordering of requires and provides is stable in Juju Core, and not
      // specified in PyJuju.
      var endpoints = Y.Array.map(
          [match.requires, match.provides],
          function(endpoint) {
            return [endpoint.name, {name: endpoint.type}];
          });
      // Explicit Role labelling.
      endpoints[0][1].role = 'client';
      endpoints[1][1].role = 'server';

      var relation = this.db.relations.create({
        relation_id: relationId,
        type: match['interface'],
        endpoints: endpoints,
        pending: false,
        scope: match.scope || 'global',
        display_name: endpointData[0].type
      });

      if (relation) {
        this._relationCount += 1;
        // Add the relation to the change delta
        this.changes.relations[relationId] = [relation, true];
        // Because the sandbox can either be passed a string or an object
        // we need to return as much information as possible to be able
        // to rebuild the expected object for both situations.
        // The only difference between this and the relation creation hash,
        // above, is camelCase versus underlines.  When we normalize on
        // camelCase, we can simplify.
        return {
          relationId: relationId,
          type: match['interface'],
          endpoints: endpoints,
          scope: match.scope || 'global',
          displayName: endpointData[0].type,
          relation: relation
        };
      }

      // Fallback error If the relation was not able to be created
      // for any reason other than what has already been checked for.
      return false;
    },

    /**
      Removes a relation between two services.

      @method removeRelation
      @param {String} endpointA A string representation of the service name
        and endpoint connection type ie) wordpress:db.
      @param {String} endpointB A string representation of the service name
        and endpoint connection type ie) wordpress:db.
    */
    removeRelation: function(endpointA, endpointB) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      if ((typeof endpointA !== 'string') ||
          (typeof endpointB !== 'string')) {
        return {error: 'Two string endpoint names' +
              ' required to establish a relation'};
      }

      // Parses the endpoint strings to extract all required data.
      var endpointData = this.parseEndpointStrings(
          this.db, [endpointA, endpointB]);

      // This error should never be hit but it's here JIC
      if (!endpointData[0].charm || !endpointData[1].charm) {
        return {error: 'Charm not loaded.'};
      }

      var relation;
      this.db.relations.some(function(rel) {
        var endpoints = rel.getAttrs().endpoints;
        return [0, 1].some(function(index) {
          // Check to see if the service names match an existing relation
          if ((endpoints[index][0] === endpointData[0].name) &&
              (endpoints[!index + 0][0] === endpointData[1].name)) {
            // Check to see if the interface names match
            if ((endpoints[index][1].name === endpointData[0].type) &&
                (endpoints[!index + 0][1].name === endpointData[1].type)) {
              relation = rel;
              return true;
            }
          }
        });
      });

      if (relation) {
        // remove the relation from the relation db model list
        var result = this.db.relations.remove(relation);
        // add this change to the delta
        this.changes.relations[relation.get('id')] = [relation, false];
        return result;
      } else {
        return {error: 'Relationship does not exist'};
      }
    },

    /**
     * Helper method to determine where to log annotation
     * changes relative to a given entity.
     *
     * @method _getAnnotationGroup
     * @param {Object} entity to track.
     * @return {String} Annotation group name (index into this.annotations).
     */
    _getAnnotationGroup: function(entity) {
      var annotationGroup = {
        serviceUnit: 'units',
        environment: 'annotations'
      }[entity.name];
      if (!annotationGroup) {
        annotationGroup = entity.name + 's';
      }
      return annotationGroup;
    },

    /**
     * Update annotations for a given entity. This performs a merge of existing
     * annotations with any new data.
     *
     * @method updateAnnotations
     * @param {String} entityName to update.
     * @param {Object} annotations key/value map.
     * @return {Object} either result or error property.
     */
    updateAnnotations: function(entityName, annotations) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var entity = this.db.resolveModelByName(entityName);
      var existing;
      if (!entity) {
        return {error: 'Unable to resolve entity: ' + entityName};
      }

      existing = models.getAnnotations(entity);
      if (existing === undefined) {
        existing = {};
      }

      models.setAnnotations(entity, annotations, true);
      // Arrange delta stream updates.
      var annotationGroup = this._getAnnotationGroup(entity);
      this.annotations[annotationGroup][entityName] = entity;
      return {result: true};
    },

    /**
     * getAnnotations from an object. This uses standard name resolution (see
     * db.resolveModelByName) to determine which object to return annotations
     * for.
     *
     * @method getAnnotations
     * @param {String} entityName to get annotations for.
     * @return {Object} annotations as key/value map.
     */
    getAnnotations: function(entityName) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var entity = this.db.resolveModelByName(entityName);

      if (!entity) {
        return {error: 'Unable to resolve entity: ' + entityName};
      }

      return {result: models.getAnnotations(entity)};
    },

    /**
     * Remove annotations (optional by key) from an entity.
     *
     * @method removeAnnotations
     * @param {String} entityName to remove annotations from.
     * @param {Array} keys (optional) array of {String} keys to remove. If this
     *                is falsey all annotations are removed.
     * @return {undefined} side effects only.
     */
    removeAnnotations: function(entityName, keys) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var entity = this.db.resolveModelByName(entityName);
      var annotations;
      if (!entity) {
        return {error: 'Unable to resolve entity: ' + entityName};
      }

      annotations = models.getAnnotations(entity);
      if (annotations === undefined) {
        annotations = {};
      }

      if (keys) {
        Y.each(keys, function(k) {
          if (Y.Object.owns(annotations, k)) {
            delete annotations[k];
          }
        });
      } else {
        annotations = {};
      }

      // Apply merged annotations.
      models.setAnnotations(entity, annotations);

      // Arrange delta stream updates.
      var annotationGroup = this._getAnnotationGroup(entity);
      this.annotations[annotationGroup][entityName] = entity;
      return {result: true};
    },

    /**
      Sets the configuration settings on the supplied service to the supplied
      config object while leaving the settings untouched if they are not in the
      supplied config.

      @method setConfig
      @param {String} serviceName the service id.
      @param {Object} config properties to set.
    */
    setConfig: function(serviceName, config) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return {error: 'Service "' + serviceName + '" does not exist.'};
      }

      var existing = service.get('config');
      if (!existing) {
        existing = {};
      }

      if (!config) {
        config = {};
      }
      // Merge new config in.
      existing = Y.mix(existing, config, true, undefined, 0, true);
      //TODO: validate the config.
      // Reassign the attr.
      service.set('config', existing);
      // The callback indicates done, we can pass anything back.
      this.changes.services[service.get('id')] = [service, true];
      return {result: existing};
    },

    /**
      Sets the constraints on a service to restrict the type of machine to be
      used for the service.

      @method setConstraints
      @param {String} serviceName the service id.
      @param {Object | Array} data either an array of strings "foo=bar" or an
      object {foo: 'bar'}.
    */
    setConstraints: function(serviceName, data) {
      var constraints = {};

      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return {error: 'Service "' + serviceName + '" does not exist.'};
      }

      var existing = service.get('constraints');
      if (!existing) {
        existing = {};
      }

      if (Y.Lang.isArray(data)) {
        Y.Array.each(data, function(i) {
          var kv = i.split('=');
          constraints[kv[0]] = kv[1];
        });
      } else if (data) {
        constraints = data;
      }
      // Merge new constraints in.
      existing = Y.mix(existing, constraints, true, undefined, 0, true);
      // TODO: Validate the constraints.
      // Reassign the attr.
      service.set('constraints', existing);
      this.changes.services[service.get('id')] = [service, true];
      return {result: true};
    },

    /**
     * Mark a unit or a unit relation as resolved. In the fakebackend
     * this validates arguments but doesn't take any real action.
     *
     * @method resolved
     * @param {String} unitName tp resp;ve.
     * @param {String} (optional) relationName to resolve for unit.
     * @return {Object} with result or error.
     */
    resolved: function(unitName, relationName) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var serviceName = unitName.split('/', 1)[0];
      var service = this.db.services.getById(serviceName);
      var unit;
      if (service) {
        unit = service.get('units').getById(unitName);
      }
      if (!service || !unit) {
        return {error: 'Unit "' + unitName + '" does not exist.'};
      }

      if (relationName) {
        var relation = this.db.relations.get_relations_for_service(
            service).filter(function(rel) {
          return (rel.endpoints[0].name === relationName ||
                  rel.endpoints[1].name === relationName);
        });
        if (relation.length === 0) {
          return {error: 'Relation ' + relationName +
                ' not found for ' + unitName};
        }
      }

      // No hooks are run in the fakebackend so at this time resolve does
      // nothing. We could make it clear error status but that isn't what
      // resolved actually does. We could additionally push the unit into
      // the change set but no change currently takes place.
      return {result: true};
    },

    /**
     * Utility to promise to load a charm for serviceData.
     * @method _promiseCharmForService
     * @param {Object} serviceData to load charm for. seviceData is the
     *        imported service attributes, so .charm should be the charm
     *        url.
     * @return {Promise} resolving with [charm model, serviceData].
     */
    _promiseCharmForService: function(serviceData) {
      var self = this,
          charmId = serviceData.charm;

      return Y.Promise(function(resolve, reject) {
        self._loadCharm(charmId, {
          /**
           * Callback to return resolved charm
           * as associated serviceData (so it can
           * be updated if version changed).
           *
           * @method success
           */
          success: function(charm) {
            resolve([charm, serviceData]);
          },
          failure: reject
        });
      });
    },


    /**
     * Export environment state
     *
     * @method exportEnvironment
     * @return {String} JSON description of env data.
     */
    exportEnvironment: function() {
      var serviceList = this.db.services,
          relationList = this.db.relations,
          result = {meta: {
            exportFormat: 1.0
          },
          services: [], relations: []},
          blackLists = {
            service: ['id', 'aggregated_status', 'clientId', 'initialized',
              'constraintsStr', 'destroyed', 'pending'],
            relation: ['id', 'relation_id', 'clientId', 'initialized',
              'destroyed', 'pending']
          };

      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }

      serviceList.each(function(s) {
        var serviceData = s.getAttrs();
        if (serviceData.pending === true) {
          return;
        }
        Y.each(blackLists.service, function(key) {
          if (key in serviceData) {
            delete serviceData[key];
          }
          // Add in initial unit count.
          var units = s.get('units');
          serviceData.unit_count = units.size() || 1;
        });
        result.services.push(serviceData);
      });

      relationList.each(function(r) {
        var relationData = r.getAttrs();
        if (relationData.pending === true) {
          return;
        }
        Y.each(blackLists.relation, function(key) {
          if (key in relationData) {
            delete relationData[key];
          }
        });
        result.relations.push(relationData);
      });

      return {result: result};
    },


    /**
     Single atomic, non-mutating parse of a bundle
     followed by things like id assignment, this
     returns a complex data structure which is used
     by importDeployer to enact the deploy.

     @method ingestDeployer
    */
    ingestDeployer: function(data, options) {
      if (!data) {return;}
      options = options || {};
      var db = this.db;
      var targetBundle = options.targetBundle;
      var useGhost = options.useGhost;
      if (useGhost === undefined) {
        useGhost = true;
      }
      if (!targetBundle && Object.keys(data).length > 1) {
        throw new Error('Import target ambigious, aborting.');
      }

      // Builds out a object with inherited properties.
      var source = targetBundle && data[targetBundle] ||
          data[Object.keys(data)[0]];
      var ancestors = [];
      var seen = [];

      /**
        Helper to build out an inheritance chain

        @method setupInheritance
        @param {Object} base object currently being inspected.
        @param {Array} baseList chain of ancestors to later inherit.
        @param {Object} bundleData import data used to resolve ancestors.
        @param {Array} seen list used to track objects already in inheritence
        chain.  @return {Array} of all inherited objects ordered from most base
        to most specialized.
      */
      function setupInheritance(base, baseList, bundleData, seen) {
        // local alias for internal function.
        var sourceData = bundleData;
        var seenList = seen;

        baseList.unshift(base);
        // Normalize to array when present.
        if (!base.inherits) { return; }
        if (base.inherits && !Y.Lang.isArray(base.inherits)) {
          base.inherits = [base.inherits];
        }

        base.inherits.forEach(function(ancestor) {
          var baseDeploy = sourceData[ancestor];
          if (baseDeploy === undefined) {
            throw new Error('Unable to resolve bundle inheritence.');
          }
          if (seenList.indexOf(ancestor) === -1) {
            seenList.push(ancestor);
            setupInheritance(baseDeploy, baseList, bundleData, seenList);
          }
        });

      }
      setupInheritance(source, ancestors, data, seen);
      // Source now merges it all.
      source = {};
      ancestors.forEach(function(ancestor) {
        // Mix Merge and overwrite in order of inheritance
        Y.mix(source, ancestor, true, undefined, 0, true);
      });

      var error = '';
      Object.keys(source.services).forEach(function(serviceName) {
        var existing = db.services.getById(serviceName);
        if (existing) {
          console.log(source);
          error = serviceName + ' is already present in the database.' +
              ' Change service name and try again.';
        }
        source.services[serviceName].name = serviceName;
      });

      if (error) {
        return { error: error };
      } else {
        return {
          services: source.services,
          relations: source.relations
        };
      }
    },

    /**
     Import Deployer from YAML files

     @method importDeployer
     @param {String} YAMLData YAML string data to import.
     @param {String} [name] Name of bundle within deployer file to import.
     @param {Function} callback Triggered on completion of the import.
     @return {undefined} Callback only.
     */
    importDeployer: function(YAMLData, name, callback) {
      var self = this;
      if (!this.get('authenticated')) {
        return callback(UNAUTHENTICATED_ERROR);
      }
      var data;
      if (typeof YAMLData === 'string') {
        try {
          data = jsyaml.safeLoad(YAMLData);
        } catch (e) {
          console.log('error parsing deployer bundle');
          return callback(VALUE_ERROR);
        }
      } else {
        // Allow passing in Objects directly to ease testing.
        data = YAMLData;
      }
      // XXX: The proper API doesn't allow options for the level
      // of control that ingest allows. This should be addressed
      // in the future.
      var options = {};
      if (name) {
        options.targetBundle = name;
      }
      var ingestedData = this.ingestDeployer(data, options);
      var servicePromises = [];
      // If there is an error in the ingestedData then return with the error.
      if (ingestedData.error) {
        callback(ingestedData);
        return;
      }
      Y.each(ingestedData.services, function(serviceData) {
        // Map the argument name from the deployer format
        // name for unit count.
        if (!serviceData.unitCount) {
          serviceData.unitCount = serviceData.num_units;
        }
        if (serviceData.options) {
          serviceData.config = serviceData.options;
          delete serviceData.options;
        }
        servicePromises.push(
            self.promiseDeploy(serviceData.charm, serviceData));
      });


      self._deploymentId += 1;
      var deployStatus = {
        DeploymentId: self._deploymentId,
        Status: 'started',
        Timestamp: Date.now()
      };
      self._importChanges.push(deployStatus);
      // Keep the list limited to the last 5
      if (self._importChanges.length > 5) {
        self._importChanges = self._importChanges.slice(-5);
      }

      Y.batch.apply(this, servicePromises)
      .then(function(serviceDeployResult) {
            // Expose, if requested.
            serviceDeployResult.forEach(function(sdr) {
              var serviceId = sdr.service.get('id');
              var serviceData = ingestedData.services[serviceId];
              if (serviceData.expose) {
                self.expose(serviceId);
              }
            });

            // Create requested relations.
            ingestedData.relations.forEach(function(relationData) {
              var relResult = self.addRelation(
                  relationData[0], relationData[1], true);
              self.changes.relations[relResult.relation.get('id')] = [
                relResult.relation, true];
            });
          })
      .then(function() {
            deployStatus.Status = 'completed';
            callback({DeploymentId: self._deploymentId});
          }, function(err) {
            deployStatus.Status = 'failed';
            console.log(err);
            callback({Error: err.error});
          });
    },

    /**
     Promise the result of an importDeployer call. This method
     exists to aid tests which use the import system to quickly
     generate fixtures.

     @method promiseImport
     @param {String} YAMLData YAML data to import.
     @param {String} [name] Bundle name to import.
     @return {Promise} After the import is run.
    */
    promiseImport: function(YAMLData, name) {
      var self = this;
      return new Y.Promise(function(resolve) {
        self.importDeployer(YAMLData, name, resolve);
      });
    },

    /**
     Query the deployer import code for global status of the last 5 imports. We
     don't currently queue but a real impl would need to always include every
     pending import regardless of queue length

     @method statusDeployer
     @param {Function} callback Triggered with completion information.
     @return {undefined} Callback only.
    */
    statusDeployer: function(callback) {
      if (!this.get('authenticated')) {
        return callback(UNAUTHENTICATED_ERROR);
      }
      callback({LastChanges: this._importChanges});
    },

    /**
      *no op* Create a watcher for the deployment specified.

      This method is a no op in the fakebackend. We've already sent the user a
      notification that things are complete in the normal deployer call.
      There's no time to get a watcher and send/sync the watch update down
      the road.

      @method deployerWatch
      @param {Integer} deploymentId The id of the deployment the watch is
      for.
      @param {Function} callback The callback to send the watcherId to.

     */
    deployerWatch: function(deploymentId, callback) {
      // No op in the fakebackend. Just return and ignore the callback.
      return;
    },

    /**
      *no op* Perform a check for updates of a given deployment watcher.

      This should never be called and is provided just to aid in grep-ability
      of the codebase. Typically this is called via the callback in the
      deployerWatch function.


      @method deployerNext
      @param {Integer} watcherId The id of the watcher from deployerWatch
      @param {Function} callback The callback to handle the update response
      from the deployer information.

     */
    deployerNext: function(watcherId, callback) {
      // No op in the fakebackend. Just return and ignore the callback.
      return;
    },

    /**
      Create and return an event including an error simulating an error
      response as returned by the juju-core HTTPS API.

      @method _createErrorEvent
      @param {String} message The error message.
    */
    _createErrorEvent: function(message) {
      return {
        type: 'error',
        target: {responseText: {Error: message}}
      };
    },

    /**
      Populate the local database with charm data reading the information
      contained in entries. This way it is possible to store at least a
      subset of the charm data provided by juju-core or the charm store.

      @method _handleLocalCharmEntries
      @param {Object} entries A dictionary mapping file names to entry objects
        (see http://gildas-lormeau.github.io/zip.js/core-api.html#zip-entry).
        This usually includes at least the metadata.yaml and the config.yaml
        entries.
      @param {Function} callback A function to be called to return the charm
        information back to the original caller (see _uploadLocalCharm in
        app/assets/javascripts/local-charm-import-helpers).
      @param {Function} errback A function to be called to notify an error
        occurred during the process. The errback callable receives an error
        message.
    */
    _handleLocalCharmEntries: function(entries, callback, errback) {
      // Check if all the required entries are present in the zip.
      var configEntry = entries['config.yaml'];
      if (!configEntry) {
        return errback('unable to find the charm configuration file');
      }
      var metadataEntry = entries['metadata.yaml'];
      if (!metadataEntry) {
        return errback('unable to find the charm metadata file');
      }
      // We can still continue the process even if the readme is missing.
      var readmeEntry = entries['readme.md'];
      // XXX frankban 2014-02-07: read the entries and populate the database
      // as required. Call the callback in order to return the required data
      // to the original caller. Remove the lines below.
      console.log('config:', configEntry.filename);
      console.log('metadata:', metadataEntry.filename);
      if (readmeEntry) {
        console.log('readme:', readmeEntry.filename);
      }
      errback('charm upload in sandbox mode is not yet implemented');
    },

    /**
      Simulate uploading a local charm.
      Read the given zip file, validate it, parse charm's metadata and populate
      the database with the required info before invoking the given callback.

      @method handleUploadLocalCharm
      @param {Object} file The zip file object containing the charm.
      @param {Function} completedCallback The load event callback.
    */
    handleUploadLocalCharm: function(file, completedCallback) {
      var self = this;
      // Define a function to be called when something goes wrong. Since this
      // function is passed to ziputils.readEntries, it is used to handle
      // errors globally during the whole zip parsing process.
      var errback = function(error) {
        completedCallback(self._createErrorEvent(error));
      };
      // Define a function to be called when zip entries are available and
      // ready to be parsed. Here we just filter the entries we are interested
      // in, the real parsing is done in _handleLocalCharmEntries (see above).
      var callback = function(allEntries) {
        var filenames = ['config.yaml', 'metadata.yaml', 'readme.md'];
        var entries = ziputils.getEntriesByNames(allEntries, filenames);
        self._handleLocalCharmEntries(entries, completedCallback, errback);
      };
      ziputils.readEntries(file, callback, errback);
    }

  });

  Y.namespace('juju.environments').FakeBackend = FakeBackend;

}, '0.1.0', {
  requires: [
    'base',
    'js-yaml',
    'juju-models',
    'promise',
    'zip-utils'
  ]
});
