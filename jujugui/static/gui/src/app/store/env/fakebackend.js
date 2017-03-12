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
  var relationUtils = window.juju.utils.RelationUtils;
  var utils = Y.namespace('juju.views.utils');

  var UNAUTHENTICATED_ERROR = {error: 'Please log in.'};

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
    authenticated: {value: false},
    authorizedUsers: {
      value: {
        'user-admin@local': 'password',
        'user-test@local': 'test'
      }
    },
    defaultSeries: {value: 'trusty'},
    name: {value: 'Model'},
    maasServer: {value: null},
    providerType: {value: 'demonstration'},
    charmstore: {},
    token: {value: 'demoToken'}
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
        applications: {},
        machines: {},
        units: {},
        relations: {}
      };
    },

    /**
    Return all of the recently changed objects.

    @method nextChanges
    @return {Object} A hash of the keys 'applications', 'machines', 'units' and
      'relations'.  Each of those are hashes from entity identifier to
      [entity, boolean] where the boolean means either active (true) or
      removed (false).
    */
    nextChanges: function() {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var result;
      if (Object.keys(this.changes.applications).length === 0 &&
          Object.keys(this.changes.machines).length === 0 &&
          Object.keys(this.changes.units).length === 0 &&
          Object.keys(this.changes.relations).length === 0) {
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
        applications: {},
        machines: {},
        units: {},
        relations: {},
        annotations: {}
      };
    },

    /**
      Return all of the recently annotated objects.

      @method nextAnnotations
      @return {Object} A hash of the keys 'applications', 'machines', 'units',
      'relations' and 'annotations'.  Each of those are hashes from entity
      identifier to entity.
    */
    nextAnnotations: function() {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var result;
      if (Object.keys(this.annotations.applications).length === 0 &&
          Object.keys(this.annotations.machines).length === 0 &&
          Object.keys(this.annotations.units).length === 0 &&
          Object.keys(this.annotations.relations).length === 0 &&
          Object.keys(this.annotations.annotations).length === 0) {
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
      if (username.indexOf('@') === -1) {
        username += '@local';
      }
      const password = this.get('authorizedUsers')[username];
      const authenticated = password === submittedPassword;
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
    Deploy an application from a charm.  Uses a callback for response!

    @method deploy
    @param {String} charmUrl The URL of the charm.
    @param {Function} callback A call that will receive an object either
      with an "error" attribute containing a string describing the problem,
      or with a "application" attribute containing the new application, a
      "charm" attribute containing the charm used, and a "units" attribute
      containing a list of the added units.  This is asynchronous because we
      often must go over the network to the charm store.
    @param {Object} options An options object.
      name: The name of the application to be deployed, defaulting to the charm
        name.
      config: The charm configuration options, defaulting to none.
      configYAML: The charm configuration options, expressed as a YAML
        string.  You may provide only one of config or configYAML.
      unitCount: The number of units to be deployed.
      toMachine: The machine/container specification to which the application
        should be deployed.
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
    Set the given application to use the given charm, optionally forcing units
    in error state to use the charm.

    @method setCharm
    @param {String} applicationName The name of the application to set.
    @param {String} charmId The charm to use.
    @param {Boolean} forceUnits Whether or not to force the issue.
    @param {Boolean} forceSeries Whether or not to force the issue.
    @param {Function} callback A call that will receive an object, potentially
      with an "error" attribute containing a string describing the problem.
    @return {undefined} All results are passed to the callback.
    */
    setCharm: function(applicationName, charmId, forceUnits, forceSeries, cb) {
      if (!this.get('authenticated')) {
        return cb(UNAUTHENTICATED_ERROR);
      }
      var self = this;
      var application = this.db.services.getById(applicationName);
      if (!application) {
        return cb({error: 'Application "' + applicationName + '" not found.'});
      }
      var unitsInError = application.get('units')
        .some(function(unit) {
          return (/error/).test(unit.agent_state);
        });
      if (unitsInError && (!forceUnits || !forceSeries)) {
        return cb({error: 'Cannot set charm on an application with units in ' +
              'error without the force flag.'});
      }
      this._loadCharm(charmId, {
        success: function(charm) {
          application.set('charm', charm.get('id'));
          self.changes.applications[
            application.get('id')] = [application, true];
          cb({});
        },
        failure: cb
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
        this.get('charmstore').getEntity(
            charmIdParts.storeId,
            function(error, charm) {
              if (error) {
                console.warn('error loading charm: ', error);
                if (callbacks.failure) {
                  callbacks.failure(
                      {error: 'Error interacting with the charmstore API.'});
                }
              } else {
                var charm = Y.juju.makeEntityModel(charm[0]);
                this._saveCharmModel(charm);
                if (callbacks.success) {
                  callbacks.success(charm);
                }
              }
            }.bind(this));
      }
    },

    /**
    If the charm doesn't exist in the database already then add it.

    @method _saveCharmModel
    @param {Object} charm The charm model as delivered by the apiv4 charmstore.
    @return {Object} The passed in charm model.
    */
    _saveCharmModel: function(charm) {
      var storedCharm = this.db.charms.getById(charm.id);
      if (!storedCharm) {
        this.db.charms.add(charm);
      }
      return charm;
    },

    /**
    Deploy a charm, given the charm, a callback, and options.

    @method _deployFromCharm
    @param {Object} charm The charm to be deployed, from the db.
    @param {Function} callback A call that will receive an object either
      with an "error" attribute containing a string describing the problem,
      or with a "application" attribute containing the new application, a
      "charm" attribute containing the charm used, and a "units" attribute
      containing a list of the added units.  This is asynchronous because we
      often must go over the network to the charm store.
    @param {Object} options An options object.
      name: The name of the application to be deployed, defaulting to the charm
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
        return callback({
          error: 'An application with this name already exists (' +
          options.name + ').'});
      }
      if (options.configYAML) {
        if (typeof options.configYAML !== 'string') {
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
        // Determine the number of key-value pairs and try the old-style comma
        // separator if not the same as the constraints length.
        var numPairs = constraints.match(/=/g).length;
        // Although comma-separation is deprecated, check it first as it
        // allows easier parsing if a mix of commas and spaces is used.
        var pairs = constraints.split(',');
        if (numPairs !== pairs.length) {
          pairs = constraints.split(' ');
        }
        constraints = pairs;
      }
      if (Array.isArray(constraints)) {
        constraints.forEach(function(cons) {
          vals = cons.split('=');
          constraintsMap[vals[0].trim()] = vals[1].trim();
        });
      } else {
        constraintsMap = constraints;
      }

      // We need to set charm default values for the options that have not
      // been explicitly provided.
      var charmOptions = charm.get('options') || {};
      // "config" will hold the application's config values--it will be the
      // result of this processing.
      var config = {};
      var explicitConfig = options.config || {};
      for (var key in charmOptions) {
        var opt = charmOptions[key],
            value = explicitConfig[key] || opt['default'],
            type = opt.type;
        // Need to cast string config values to their proper type.
        if (typeof value === 'string' && type !== 'string') {
          if (type === 'int') {
            config[key] = parseInt(value, 10);
          } else if (type === 'boolean') {
            config[key] = (value.toLowerCase() === 'true');
          } else if (type === 'float') {
            config[key] = parseFloat(value);
          }
        } else {
          config[key] = value;
        }
      };

      var application = this.db.services.add({
        id: options.name,
        name: options.name,
        charm: charm.get('id'),
        constraints: constraintsMap,
        exposed: false,
        subordinate: charm.get('is_subordinate'),
        annotations: annotations,
        config: config
      });
      this.changes.applications[application.get('id')] = [application, true];
      if (Object.keys(annotations).length) {
        this.annotations.applications[application.get('id')] = application;
      }

      var unitCount = options.unitCount;
      if (!utils.isValue(unitCount) && !charm.get('is_subordinate')) {
        // This is the current behavior in both implementations.
        unitCount = 1;
      }
      var response = {};
      // Add units if requested.
      if (unitCount !== 0) {
        response = this.addUnit(options.name, unitCount, null);
      }
      response.application = application;
      callback(response);
    },

    /**
      Add machines/containers to the environment.

      @method addMachines
      @param {Array} params A list of parameters for each machine/container
        to be added. Each item in the list must be an object containing the
        following keys (all optional):
          - constraints {Object}: the machine constraints;
          - jobs {Array}: the juju-core jobs to associate with the new machine
            (defaults to env.machineJobs.HOST_UNITS, which enables unit hosting
            capabilities to new machines);
          - series {String}: the machine series (the juju-core default series
            is used if none is specified);
          - parentId {String}: when adding a new container, this parameter can
            be used to place it into a specific machine, in which case the
            containerType must also be specified (see below). If parentId is
            not set when adding a container, a new top level machine will be
            created to hold the container with given series, constraints, jobs;
          - containerType {String}: the container type of the new machine
            (e.g. "lxc").
      @return {Object} Returns an object either with an "error" attribute
        containing a string describing the problem, or with a "machines"
        attribute containing a list of the added machines. Each added machine
        is an object including the machine "name" and an optional "error".
    */
    addMachines: function(params) {
      // Only proceed if the user is authenticated.
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      // A global error is only returned if an internal juju problem occurs.
      // The fake backend actually never set the value.
      return {
        machines: params.map(function(param) {

          return this._addMachine(
              param.parentId, param.containerType, param.series || 'precise',
              param.constraints, param.jobs);
        }, this)
      };
    },

    /**
      Add a machine.

      Used internally by addMachines.

      @method _addMachine
      @param {String} parentId The name of the parent machine (optional).
      @param {String} containerType The container type of the new machine
        (e.g. "lxc", optional).
      @param {String} series The machine OS version.
      @param {Object} constraints The machine constraints.
      @param {Array} jobs The juju-core jobs to associate with the new machine.
      @return {Object} Returns an object either with an "error" attribute
        containing a string describing the problem, or with a "name"
        attribute representing the newly created machine name.
    */
    _addMachine: function(parentId, containerType, series, constraints, jobs) {
      var machines = this.db.machines;
      var parent;
      if (parentId) {
        // The container type must be specified when adding containers.
        if (!containerType) {
          return {error: 'parent machine specified without container type'};
        }
        // Ensure the parent machine exists.
        parent = machines.getById(parentId);
        if (!parent) {
          return {error: 'cannot add a new machine: machine ' + parentId +
                ' not found'};
        }
      }
      if (containerType) {
        // Ensure the parent machine supports the requested container type.
        // For the fake backend purposes, just checking it's either "lxc" or
        // "kvm" is sufficient.
        if (containerType !== 'lxc' && containerType !== 'kvm') {
          return {error: 'cannot add a new machine: machine ' + parentId +
                ' cannot host ' + containerType + ' containers'};
        }
        // If the parent id is not explicitly passed, create a new machine to
        // host the requested container.
        if (!parent) {
          parentId = this._getNextMachineName();
          parent = machines.add({
            id: parentId,
            agent_state: 'started',
            // In the fake backend machines have no addresses.
            addresses: [],
            instance_id: 'fake-instance',
            // Give to the parent machine the default hardware characteristics.
            hardware: this._getHardwareCharacteristics(false),
            jobs: ['JobHostUnits'],
            life: 'alive',
            series: series,
            // For the fake backend purposes, each machine supports LXC and KVM
            // containers.
            supportedContainers: ['lxc', 'kvm']
          });
          this.changes.machines[parentId] = [parent, true];
        }
      }
      // Create the new machine/container.
      var name = this._getNextMachineName(parentId, containerType);
      var machine = machines.add({
        id: name,
        agent_state: 'started',
        // In the fake backend machines have no addresses.
        addresses: [],
        instance_id: 'fake-instance',
        hardware: this._getHardwareCharacteristics(!!parentId, constraints),
        jobs: jobs,
        life: 'alive',
        series: series,
        // For the fake backend purposes, each machine supports LXC and KVM
        // containers.
        supportedContainers: ['lxc', 'kvm']
      });
      this.changes.machines[name] = [machine, true];
      return {name: name};
    },

    /**
      Return hardware characteristics suitable for the given constraints.

      @method _getHardwareCharacteristics
      @param {Bool} isContainer Whether to return hardware characteristics for
        a container or a top level machine.
      @param {Object} constraints The machine constraints (optional).
      @return {Object} The hardware characteristics represented by an object
        with the following fields: arch, cpuCores, cpuPower, mem and disk.
    */
    _getHardwareCharacteristics: function(isContainer, constraints) {
      var defaults = {
        arch: 'amd64',
        cpuCores: 1,
        cpuPower: 100,
        mem: 1740,
        disk: 8192
      };
      constraints = constraints || {};
      if (isContainer) {
        // Containers' hardware characteristics only include the architecture.
        return {arch: constraints.arch || defaults.arch};
      }
      if (Object.keys(constraints).length === 0) {
        // Return the default hardware characteristics.
        return defaults;
      }
      return {
        arch: constraints.arch || defaults.arch,
        cpuCores: constraints['cpu-cores'] || defaults.cpuCores,
        cpuPower: constraints['cpu-power'] || defaults.cpuPower,
        mem: constraints.mem || defaults.mem,
        disk: constraints.disk || defaults.disk
      };
    },

    /**
      Return the next available machine/container name.

      @method _getNextMachineName
      @param {String} parentId The name of the parent machine (optional).
      @param {String} containerType the container type of the new machine
        (e.g. "lxc", optional).
      @return {String} The name of the machine/container.
    */
    _getNextMachineName: function(parentId, containerType) {
      var parts = [];
      if (parentId) {
        parts.push(parentId);
      } else {
        parentId = null;
      }
      if (containerType) {
        parts.push(containerType);
      } else {
        containerType = null;
      }
      var numbers = this.db.machines.filter(function(machine) {
        return (machine.parentId === parentId &&
                machine.containerType === containerType);
      }).map(function(machine) {
        return machine.number;
      });
      // If no machines are already present, add machine/container number 0.
      var nextNumber = 0;
      if (numbers.length) {
        nextNumber = Math.max.apply(Math, numbers) + 1;
      }
      parts.push(nextNumber);
      return parts.join('/');
    },

    /**
      Remove existing machines/containers.

      @method destroyMachines
      @param {Array} names The names of the machines/containers to be removed.
        Each name is a string: machine names are numbers, e.g. "1" or "42";
        containers have the [machine name]/[container type]/[container number]
        form, e.g. "2/lxc/0" or "1/kvm/42".
      @param {Boolean} force Whether to force machines removal even if they
        host units or containers.
      @return {Object} A response including an "error" attribute if any
        problems occurred.
    */
    destroyMachines: function(names, force) {
      var self = this;
      // Only proceed if the user is authenticated.
      if (!self.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      // Define an object mapping machine names to units they contain.
      // This is done once here in order to avoid looping through the units
      // model lists multiple times.
      var machineUnitsMap = self.db.services.filterUnits(function(unit) {
        return names.indexOf(unit.machine) !== -1;
      }).reduce(function(result, unit) {
        var machine = unit.machine;
        if (result[machine]) {
          result[machine].push(unit);
        } else {
          result[machine] = [unit];
        }
        return result;
      }, Object.create(null));
      var errors = [];
      var destroyed = false;
      names.forEach(function(name) {
        var error = self._destroyMachine(name, force, machineUnitsMap);
        if (error === null) {
          destroyed = true;
        } else {
          errors.push(error);
        }
      });
      var response = {};
      if (errors.length) {
        var msg;
        if (destroyed) {
          msg = 'some machines were not destroyed: ';
        } else {
          msg = 'no machines were destroyed: ';
        }
        response.error = msg + errors.join('; ');
      }
      return response;
    },

    /**
      Remove a machine given its name.

      Used internally by destroyMachines.

      @method _destroyMachine
      @param {Array} name The name of the machines/containers to be removed.
      @param {Boolean} force Whether to force machine removal.
      @param {Object} machineUnitsMap Key/value pairs mapping machine names to
        assigned unit objects.
      @return {String|Null} An error if the machine cannot be removed, or null
        if the removal succeeded.
    */
    _destroyMachine: function(name, force, machineUnitsMap) {
      var machines = this.db.machines;
      var machine = machines.getById(name);
      // Ensure the machine to be destroyed exists in the database.
      if (!machine) {
        return 'machine ' + name + ' does not exist';
      }
      // Check if the machine hosts containers.
      var descendants = machines.filterByAncestor(name);
      if (descendants.length) {
        if (!force) {
          var descendantNames = descendants.map(function(descendant) {
            return descendant.id;
          });
          return ('machine ' + name + ' is hosting containers ' +
                  descendantNames.join(', '));
        }
        // Remove all descendants from the database.
        machines.remove(descendants);
        descendants.forEach(function(descendant) {
          this.changes.machines[descendant.id] = [descendant, false];
        }, this);
      }
      // Check if the machine has assigned units.
      var units = machineUnitsMap[name];
      if (units) {
        if (!force) {
          var unitNames = units.map(function(unit) {
            return unit.id;
          });
          return ('machine ' + name + ' has unit(s) ' + unitNames.join(', ') +
                  ' assigned');
        }
        // Remove all units assigned to this machine.
        units.forEach(function(unit) {
          this.db.removeUnits(unit);
          this.changes.units[unit.id] = [unit, false];
        }, this);
      }
      // Everything went well for this machine, remove it from the database.
      machines.remove(machine);
      this.changes.machines[machine.id] = [machine, false];
      return null;
    },

    /**
     Destroy the named application.

     @method destroyApplication
     @param {String} applicationName to destroy.
     @return {Object} results With err and applicationName.
     */
    destroyApplication: function(applicationName) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var application = this.db.services.getById(applicationName);
      if (!application) {
        return {error: 'Invalid application id: ' + applicationName};
      }
      // Remove all relations for this application.
      var relations = this.db.relations.get_relations_for_service(application);
      relations.forEach(rel => {
        this.db.relations.remove(rel);
        this.changes.relations[rel.get('relation_id')] = [rel, false];
      }, this);
      // Remove units for this application.
      // get() on modelList returns the array of values for all children by
      // default.
      var unitNames = application.get('units').get('id');
      var result = this.removeUnits(unitNames);
      if (result.error && result.error.length > 0) {
        console.log(result, result.error);
        return {
          error: 'Error removing units [' + unitNames.join(', ') +
              '] of ' + applicationName
        };
      } else if (result.warning && result.warning.length > 0) {
        console.log(result, result.warning);
        return {
          error: 'Warning removing units [' + unitNames.join(', ') +
              '] of ' + applicationName
        };
      }
      // And finally destroy and remove the application.
      this.db.services.remove(application);
      this.changes.applications[applicationName] = [application, false];
      application.destroy();
      return {result: applicationName};
    },

    /**
     * Get application attributes.
     *
     * @method getApplication
     * @param {String} applicationName to get.
     * @return {Object} Application Attributes..
     */
    getApplication: function(applicationName) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var application = this.db.services.getById(applicationName);
      if (!application) {
        return {error: 'Invalid application id: ' + applicationName};
      }
      var applicationData = application.getAttrs();
      if (!applicationData.constraints) {
        applicationData.constraints = {};
      }

      var relations = this.db.relations.get_relations_for_service(application);
      var rels = relations.map(function(r) {return r.getAttrs();});
      // TODO: properly map relations to expected format rather
      // than this passthrough. Pending on the add/remove relations
      // branches that will need the same helper code.
      applicationData.rels = rels;
      return {result: applicationData};
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
    Add units to the given application.

    @method addUnit
    @param {String} applicationName The name of the app to be scaled up.
    @param {Integer} numUnits The number of units to be added, defaulting
      to 1.
    @param {String} toMachine The machine/container where the unit will be
      placed, or null/undefined to create a top level machine.
    @return {Object} Returns an object either with an "error" attribute
      containing a string describing the problem, or with a "units"
      attribute containing a list of the added units.
    */
    addUnit: function(applicationName, numUnits, toMachine) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var application = this.db.services.getById(applicationName);
      if (!application) {
        return {
          error: 'Application "' + applicationName + '" does not exist.'};
      }
      var isSubordinate = application.get('subordinate');
      if (numUnits === undefined) {
        numUnits = isSubordinate ? 0 : 1;
      }
      if (isNaN(numUnits) ||
          (!isSubordinate && numUnits < 1 ||
          (isSubordinate && numUnits !== 0))) {
        return {
          error: 'Invalid number of units [' + numUnits +
              '] for application: ' + applicationName
        };
      }
      if (!utils.isValue(application.unitSequence)) {
        application.unitSequence = 0;
      }
      var unit, machine, machines;
      if (utils.isValue(toMachine)) {
        if (numUnits > 1) {
          return {error: 'When deploying to a specific machine, the ' +
                'number of units requested must be 1.'};
        }
        // A specific machine is being targeted for the deploy.
        var targetMachine = this.db.machines.getById(toMachine);
        if (targetMachine === null) {
          return {error: 'no machine matching ' + toMachine + ' found'};
        }
        machines = [targetMachine];
      } else {
        // Any machine will do; find or create one.
        // Required machine changes are added by _getUnitMachines.
        machines = this._getUnitMachines(numUnits);
      }
      var units = [];

      for (var i = 0; i < numUnits; i += 1) {
        var unitId = application.unitSequence;
        machine = machines[i];
        unit = this.db.addUnits({
          'id': applicationName + '/' + unitId,
          'machine': machine.id,
          // The models use underlines, not hyphens (see
          // app/models/models.js in _process_delta.)
          'agent_state': 'started',
          subordinate: isSubordinate
        });
        units.push(unit);
        application.unitSequence += 1;
        this.changes.units[unit.id] = [unit, true];
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
      this.db.services.each(function(application) {
        application.get('units').each(function(unit) {
          if (unit.machine) {
            usedMachineIds[unit.machine] = true;
          }
        });
      });
      this.db.machines.each(function(machine) {
        if (!usedMachineIds[machine.id]) {
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
      if (!utils.isValue(this.db.machines.sequence)) {
        this.db.machines.sequence = 0;
      }
      for (var i = 0; i < count; i += 1) {
        if (i < availableMachines.length) {
          // Reuse existing clean machines when possible.
          machines.push(availableMachines[i]);
        } else {
          // Create new machines for the units.
          var result = this._addMachine(
              null, null, 'precise', null, ['JobHostUnits']);
          machines.push(this.db.machines.getById(result.name));
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
      var application,
          warning, error;

      // XXX: BradCrittenden 2013-04-15: Remove units should optionally remove
      // the corresponding machines.
      if (typeof unitNames === 'string') {
        unitNames = [unitNames];
      }
      unitNames.forEach(unitName => {
        application = this.db.services.getById(unitName.split('/')[0]);
        if (application && application.get('subordinate')) {
          if (!Array.isArray(error)) { error = []; }
          error.push(unitName + ' is a subordinate, cannot remove.');
        } else {
          // For now we also need to clean up the applications unit list but
          // the above should go away soon when below becomes the default.
          if (application) {
            var unit = this.db.units.getById(unitName);
            if (unit) {
              this.db.removeUnits(unit);
              this.changes.units[unitName] = [unit, false];
              return;
            }
          }
          if (!Array.isArray(warning)) { warning = []; }
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
      Exposes an application from the supplied string.

      @method expose
      @param {String} applicationName The application name.
      @return {Object} An object containing an `error` and `warning` properties
        which will be undefined if there were no warnings or errors.
    */
    expose: function(applicationName) {
      var application = this.db.services.getById(applicationName),
          warning, error;

      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }

      if (application) {
        if (!application.get('exposed')) {
          application.set('exposed', true);
          this.changes.applications[application.get('id')] = [
            application, true];
        } else {
          warning = 'Application "' + applicationName + '" already exposed.';
        }
      } else {
        error = '"' + applicationName + '" is an invalid application name.';
      }

      return {
        error: error,
        warning: warning
      };
    },

    /**
      Unexposes an application from the supplied string.

      @method unexpose
      @param {String} applicationName The application name.
      @return {Object} An object containing an `error` and `warning` properties
        which will be undefined if there were no warnings or errors.
    */
    unexpose: function(applicationName) {
      var application = this.db.services.getById(applicationName),
          warning, error;

      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      if (application) {
        if (application.get('exposed')) {
          application.set('exposed', false);
          this.changes.applications[application.get('id')] = [
            application, true];
        } else {
          warning = 'Application "' + applicationName + '" is not exposed.';
        }
      } else {
        error = '"' + applicationName + '" is an invalid application name.';
      }

      return {
        error: error,
        warning: warning
      };
    },

    /**
      Adds all relations outlined in the imported bundle YAML file. Some bundles
      contain a list of relations from a single endpoint instead of just a
      single relation.

      @method addRelations
      @param {String} endpointA The relation endpoint name.
      @param {String|Array} endpoints Depending on the bundle the relation(s)
        to add may be a single endpoint string or a list of endpoints.
      @param {Boolean} useRelationCount whether or not to generate an
        incremented relation id or to just use the name and types of the
        endpoint.
    */
    addRelations: function(endpointA, endpoints, useRelationCount) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      if (typeof endpointA !== 'string') {
        return {error: 'Relation source not a string'};
      }
      // If the endpoints provided is just a string then there is only a single
      // remote endpoint.
      if (typeof endpoints === 'string') {
        return this.addRelation(endpointA, endpoints, useRelationCount);
      }
      // If the endpoints provided is an array then loop through them creating
      // the relations.
      if (Array.isArray(endpoints) === true) {
        var result = [];
        endpoints.forEach(function(ep) {
          result.push(this.addRelation(endpointA, ep, useRelationCount));
        }, this);
        return result;
      }
      // We should never hit here but if we do it's because the endpoint format
      // provided is invalid.
      return {error: 'Relations in unexpected format'};
    },

    /**
      Add a relation between two applications.

      @method addRelation
      @param {String} endpointA A string representation of the application name
        and endpoint connection type ie) wordpress:db.
      @param {String} endpointB A string representation of the application name
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
      var endpointData = relationUtils.parseEndpointStrings(this.db,
                                                        [endpointA, endpointB]);

      // This error should never be hit but it's here JIC
      if (!endpointData[0].charm || !endpointData[1].charm) {
        return {error: 'Charm not loaded.'};
      }
      // If there are matching interfaces this will contain an object of the
      // charm interface type and scope (if supplied).
      var match = relationUtils.findEndpointMatch(endpointData);

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
      var endpoints = [match.requires, match.provides].map(endpoint => {
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
      Removes a relation between two applications.

      @method removeRelation
      @param {String} endpointA A string representation of the application name
        and endpoint connection type ie) wordpress:db.
      @param {String} endpointB A string representation of the application name
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
      var endpointData = relationUtils.parseEndpointStrings(
          this.db, [endpointA, endpointB]);

      // This error should never be hit but it's here JIC
      if (!endpointData[0].charm || !endpointData[1].charm) {
        return {error: 'Charm not loaded.'};
      }

      var relation;
      this.db.relations.some(function(rel) {
        var endpoints = rel.getAttrs().endpoints;
        return [0, 1].some(function(index) {
          // Check to see if the application names match an existing relation.
          if ((endpoints[index][0] === endpointData[0].name) &&
              (endpoints[!index + 0][0] === endpointData[1].name)) {
            // Check to see if the interface names match.
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
        environment: 'annotations',
        service: 'applications',
        serviceUnit: 'units'
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
      // If this is a unit, also update annotations in the unit instance
      // included in the service model list.
      if (entity.name === 'serviceUnit') {
        var applicationUnits = this.db.services.getById(
            entity.service).get('units');
        var nestedEntity = applicationUnits.getById(entityName);
        models.setAnnotations(nestedEntity, annotations, true);
      }
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
        keys.forEach(key => {
          if (annotations.hasOwnProperty(key)) {
            delete annotations[key];
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
      Sets the configuration settings on the supplied application to the
      supplied config object while leaving the settings untouched if they are
      not in the supplied config.

      @method setConfig
      @param {String} applicationName the application id.
      @param {Object} config properties to set.
    */
    setConfig: function(applicationName, config) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      var application = this.db.services.getById(applicationName);
      if (!application) {
        return {
          error: 'Application "' + applicationName + '" does not exist.'};
      }

      var existing = application.get('config');
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
      application.set('config', existing);
      // The callback indicates done, we can pass anything back.
      this.changes.applications[application.get('id')] = [application, true];
      return {result: existing};
    },

    /**
      Sets the constraints on an application to restrict the type of machine to
      be used for the application.

      @method setConstraints
      @param {String} applicationName the application id.
      @param {Object | Array} data either an array of strings "foo=bar" or an
      object {foo: 'bar'}.
    */
    setConstraints: function(applicationName, data) {
      var constraints = {};
      // Do not allow calls for unauthenticated users.
      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }
      // Retrieve the application.
      var application = this.db.services.getById(applicationName);
      if (!application) {
        return {
          error: 'Application "' + applicationName + '" does not exist.'};
      }
      // Retrieve the application constraints.
      if (Array.isArray(data)) {
        data.forEach(i => {
          var kv = i.split('=');
          constraints[kv[0]] = kv[1];
        });
      } else if (data) {
        constraints = data;
      }
      // Convert the tags constraints into a comma separated string.
      var tags = constraints.tags;
      if (tags) {
        constraints.tags = tags.join(',');
      }
      // For the fakebackend purposes, there is no need to validate the
      // constraints. Moreover, since we are always setting all the constraints
      // from the application inspector, merging existing and new constraints
      // is not necessary.
      application.set('constraints', constraints);
      this.changes.applications[application.get('id')] = [application, true];
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
      var applicationName = unitName.split('/', 1)[0];
      var application = this.db.services.getById(applicationName);
      var unit;
      if (application) {
        unit = application.get('units').getById(unitName);
      }
      if (!application || !unit) {
        return {error: 'Unit "' + unitName + '" does not exist.'};
      }

      if (relationName) {
        var relation = this.db.relations.get_relations_for_service(
            application).filter(function(rel) {
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
     * Utility to promise to load a charm for applicationData.
     * @method _promiseCharmForApplication
     * @param {Object} applicationData to load charm for. applicationData is
     *        the imported application attributes, so .charm should be the
     *        charm url.
     * @return {Promise} resolving with [charm model, applicationData].
     */
    _promiseCharmForApplication: function(applicationData) {
      var self = this,
          charmId = applicationData.charm;

      return Y.Promise(function(resolve, reject) {
        self._loadCharm(charmId, {
          /**
           * Callback to return resolved charm
           * as associated applicationData (so it can
           * be updated if version changed).
           *
           * @method success
           */
          success: function(charm) {
            resolve([charm, applicationData]);
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
      var applicationList = this.db.services,
          relationList = this.db.relations,
          result = {meta: {
            exportFormat: 1.0
          },
          applications: [], relations: []},
          blackLists = {
            application: ['id', 'aggregated_status', 'clientId', 'initialized',
              'constraintsStr', 'destroyed', 'pending'],
            relation: ['id', 'relation_id', 'clientId', 'initialized',
              'destroyed', 'pending']
          };

      if (!this.get('authenticated')) {
        return UNAUTHENTICATED_ERROR;
      }

      applicationList.each(function(s) {
        var applicationData = s.getAttrs();
        if (applicationData.pending === true) {
          return;
        }
        blackLists.application.forEach(key => {
          if (key in applicationData) {
            delete applicationData[key];
          }
          // Add in initial unit count.
          var units = s.get('units');
          applicationData.unit_count = units.size() || 1;
        });
        result.applications.push(applicationData);
      });

      relationList.each(function(r) {
        var relationData = r.getAttrs();
        if (relationData.pending === true) {
          return;
        }
        blackLists.relation.forEach(key => {
          if (key in relationData) {
            delete relationData[key];
          }
        });
        result.relations.push(relationData);
      });

      return {result: result};
    },

    /**
      Create and return an event including an error simulating an error
      response as returned by the juju-core HTTPS API.

      @method _createErrorEvent
      @param {String} message The error message.
      @param {String} type The response type
        (defaulting to "error" if null/undefined is provided).
      @param {Int} status The response status
        (defaulting to 400 if null/undefined is provided).
      @return {Obejct} The resulting response.
    */
    _createErrorEvent: function(message, type, status) {
      return {
        type: type || 'error',
        target: {responseText: {Error: message}, status: status || 400}
      };
    },

    /**
      Create and return a successful event including the given responseText
      and a 200 status code. This can be used to simulate a response as
      returned by the juju-core HTTPS API.

      @method _createSuccessEvent
      @param {String} responseText The text contents included in the response.
    */
    _createSuccessEvent: function(responseText) {
      return {target: {responseText: responseText, status: 200}};
    },

    /**
      Populate the local database with charm data reading the information
      contained in contents. This way it is possible to store at least a
      subset of the charm data provided by juju-core or the charm store.

      @method _handleLocalCharmEntries
      @param {Object} contents Maps names to contents. This usually
        includes at least the "metadata" key, and one or more of the following
        keys: "config", "revision" and "readme".
      @param {String} series The Ubuntu series for this charm.
      @param {Function} callback A function to be called to return the charm
        information back to the original caller (see _uploadLocalCharm in
        local-charm-import-helpers.js).
      @param {Function} errback A function to be called to notify an error
        occurred during the process. The errback callable receives an error
        message.
    */
    _handleLocalCharmEntries: function(contents, series, callback, errback) {
      var metadata, config, options;
      // Parse the charm's metadata.
      try {
        metadata = jsyaml.safeLoad(contents.metadata);
      } catch (err) {
        if (err instanceof jsyaml.YAMLException) {
          errback('Invalid charm archive: invalid metadata: ' + err);
          return;
        }
      }
      // Validate the metadata: it must contain at least the name, summary and
      // description fields.
      var errors = models.validateCharmMetadata(metadata);
      if (errors.length) {
        errback(
            'Invalid charm archive: invalid metadata: ' + errors.join(', '));
        return;
      }
      // Parse charm's options.
      if (contents.config) {
        try {
          config = jsyaml.safeLoad(contents.config);
        } catch (err) {
          if (err instanceof jsyaml.YAMLException) {
            errback('Invalid charm archive: invalid options: ' + err);
            return;
          }
        }
        options = config.options;
      }
      // Parse charm's revision.
      // XXX frankban 2014-02-13: improve revision handling. Check if a related
      // charm already exists in the db and increment the revision accordingly.
      var revision = parseInt(contents.revision, 10) || 0;
      // We are uploading a local charm.
      var scheme = 'local';
      // XXX frankban 2014-02-13: handle contents.readme. It can contain the
      // documentation about the charm, and we should display it in the charm
      // panel in some way.
      var charm = this.db.charms.addFromCharmData(
          metadata, series, revision, scheme, options);
      // Create the load response expected by the caller.
      var evt = this._createSuccessEvent(
          JSON.stringify({CharmURL: charm.get('url')}));
      callback(evt);
    },

    /**
      Simulate uploading a local charm.
      Read the given zip file, validate it, parse charm's metadata and populate
      the database with the required info before invoking the given callback.

      @method handleUploadLocalCharm
      @param {Object} file The zip file object containing the charm.
      @param {String} series The Ubuntu series for this charm.
      @param {Function} completedCallback The load event callback.
    */
    handleUploadLocalCharm: function(file, series, completedCallback) {
      var self = this;
      // Define a function to be called when something goes wrong. Since this
      // function is passed to ziputils.getEntries, it is used to handle
      // errors globally during the whole zip parsing process.
      var errback = function(error) {
        completedCallback(self._createErrorEvent(error));
      };
      // Define a function to be called when zip entries are available and
      // ready to be parsed. Here we filter the entries we are interested in,
      // and we fetch their contents. The real parsing is done in
      // _handleLocalCharmEntries (see above).
      var callback = function(allEntries) {
        var entries = ziputils.findCharmEntries(allEntries);
        // We strictly need only the charm's metadata: see
        // juju-core/state/apiserver/charms.go:findArchiveRootDir.
        if (!entries.metadata) {
          errback('Invalid charm archive: missing metadata.yaml');
          return;
        }
        // Aggregate the entries' contents and then call the
        // _handleLocalCharmEntries method.
        ziputils.readCharmEntries(
            entries,
            Y.rbind(self._handleLocalCharmEntries, self, series,
                    completedCallback, errback)
        );
      };
      ziputils.getEntries(file, callback, errback);
    },

    /**
      Simulate retrieving the list of files included in a local charm, or
      a specific file content.

      @method handleLocalCharmFileRequest
      @param {String} charmUrl The local charm URL,
        e.g. "local:strusty/django-42".
      @param {String} filename The file name/path or null/undefined if the list
        of charm files must be returned.
      @param {Function} completedCallback The load event callback.
    */
    handleLocalCharmFileRequest: function(charmUrl, filename,
                                          completedCallback) {
      var evt;
      var charm = this.db.charms.getById(charmUrl);
      if (!charm) {
        // The local charm has not been uploaded, return a 400 bad request.
        evt = this._createErrorEvent(
            'unable to retrieve and save the charm: ' +
            'charm not found in the provider storage',
            'load', 400);
        completedCallback(evt);
        return;
      }
      // XXX frankban 2014-04-11: handle real local charm file
      // listing/retrieval in sandbox mode.
      if (filename) {
        // This is a request for a specific file content: for now just return
        // a 404 not found response.
        evt = this._createErrorEvent('page not found', 'load', 404);
        completedCallback(evt);
        return;
      }
      // This is a request for the file list: for now just return an empty
      // list.
      var files = [];
      evt = this._createSuccessEvent(JSON.stringify({Files: files}));
      completedCallback(evt);
    },

    /**
      Return the URL to a local charm file.

      @method getLocalCharmFileUrl
      @param {String} charmUrl The local charm URL, for instance
        local:trusty/django-42".
      @param {String} filename The file name/path, for instance "icon.svg" or
        "hooks/install".
      @return {String} The full URL to the charm file.
    */
    getLocalCharmFileUrl: function(charmUrl, filename) {
      if (!filename || filename === 'icon.svg') {
        // This is a request for a local charm icon URL. Just return the
        // fallback icon.
        return '/static/gui/build/app/assets/images/non-sprites/charm_160.svg';
      }
      // This is in theory unreachable: with the exception of the icon, other
      // file URLs are not currently requested.
      console.error('unexpected getLocalCharmFileUrl request for ' + filename);
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
    }

  });

  Y.namespace('juju.environments').FakeBackend = FakeBackend;

}, '0.1.0', {
  requires: [
    'base',
    'js-yaml',
    'juju-models',
    'juju-view-utils',
    'promise',
    'relation-utils',
    'zip-utils',
    'jujulib-utils'
  ]
});
