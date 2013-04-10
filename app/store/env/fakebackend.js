'use strict';

/**
An in-memory fake Juju backend and supporting elements.

@module env
@submodule env.fakebackend
*/

YUI.add('juju-env-fakebackend', function(Y) {

  var models = Y.namespace('juju.models');
  var UNAUTHENTICATEDERROR = {error: 'Please log in.'};

  /**
    Takes a string endpoint and splits it into usable parts.
    @method endpointSplit
    @param {String} endpoint the endpoint to split in the format
      wordpress:db.
  */
  function endpointSplit(endpoint) {
    var epData = endpoint.split(':');
    return { name: epData[0], type: epData[1] };
  }

  /**
    Loops through the charm endpoint data to determine the interface
    and scope of the relationship.

    @method getCharmInterfaceAndScope
    @param {Array} charmEndpoints Array of charm object 'requires' endpoint
      types ie) { db: { interface: 'mysql' }} .
    @param {Array} charmDatas Array of charm data objects from splitting
      endpoint string above.
  */
  function getCharmInterfaceAndScope(charmEndpoints, charmDatas) {
    var sharedInterface, sharedScope;
    Y.Array.some(charmEndpoints, function(charmEndpoint, index) {
      var charmInterface = charmEndpoint['interface'];
      // If the interfaces match or if it is a juju-info relationship
      if ((charmInterface === charmDatas[index].name) ||
          (charmInterface === 'juju-info')) {
        sharedInterface = charmDatas[index].name;
        if (charmEndpoint.scope !== undefined) {
          sharedScope = charmEndpoint.scope;
        }
      }
      if (sharedInterface) { return true; }
    });
    if (sharedInterface) {
      return {
        sharedInterface: sharedInterface,
        sharedScope: sharedScope
      };
    }
  }

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
    authenticated: {value: false},
    charmStore: {}, // Required.
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
        return UNAUTHENTICATEDERROR;
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
      Return all of the recently anotated objects.

      @method nextAnnotations
      @return {Object} A hash of the keys 'services', 'machines', 'units',
      'relations' and 'annotations'.  Each of those are hashes from entity
      identifier to [entity, boolean] where the boolean means either active
      (true) or removed (false).
    */
    nextAnnotations: function() {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATEDERROR;
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
    Log out.  If already logged out, no error is raised.
    */
    logout: function() {
      this.set('authenticated', false);
    },

    /**
    Deploy a charm.  Uses a callback for response!

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
    @return {undefined} Get the result from the callback.
    */
    deploy: function(charmId, callback, options) {
      if (!this.get('authenticated')) {
        return callback(UNAUTHENTICATEDERROR);
      }
      if (!options) {
        options = {};
      }
      var self = this;
      this._loadCharm(
          charmId,
          {
            /**
              Deploy the successfully-obtained charm.
            */
            success: function(charm) {
              self._deployFromCharm(charm, callback, options);
            },
            failure: callback
          }
      );
    },

    /**
    Get a charm from a URL, via charmStore and/or db.  Uses callbacks.

    @method _loadCharm
    @param {String} charmUrl The URL of the charm.
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
            callbacks.failure({error: 'Invalid charm id.'}));
      }
      var charm = this.db.charms.getById(charmId);
      if (charm) {
        callbacks.success(charm);
      } else {
        // Get the charm data.
        var self = this;
        this.get('charmStore').loadByPath(
            charmIdParts.charm_store_path,
            {
              /**
                Convert the charm data to a charm and use the success callback.
              */
              success: function(data) {
                var charm = self._getCharmFromData(data);
                if (callbacks.success) {
                  callbacks.success(charm);
                }
              },
              /**
                Inform the caller of an error using the charm store.
              */
              failure: function(e) {
                if (callbacks.failure) {
                  callbacks.failure({error: 'Could not contact charm store.'});
                }
              }
            }
        );
      }

    },

    /**
    Convert charm data as returned by the charmStore into a charm.
    The charm might be pre-existing or might need to be created, but
    after this method it will be within the db.

    @method _getCharmFromData
    @param {Object} data The raw charm information as delivered by the
      charmStore's loadByPath method.
    @return {Object} A matching charm from the db.
    */
    _getCharmFromData: function(data) {
      var charm = this.db.charms.getById(data.store_url);
      if (!charm) {
        delete data.store_revision;
        delete data.bzr_branch;
        delete data.last_change;
        data.id = data.store_url;
        charm = this.db.charms.add(data);
      }
      return charm;
    },

    /**
    Deploy a charm, given the charm, a callback, and options.

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
      if (!options.name) {
        options.name = charm.get('package_name');
      }
      if (this.db.services.getById(options.name)) {
        return callback({error: 'A service with this name already exists.'});
      }
      if (options.configYAML) {
        if (!Y.Lang.isString(options.configYAML)) {
          return callback(
              {error: 'Developer error: configYAML is not a string.'});
        }
        try {
          // options.configYAML overrides options.config in Go and Python
          // implementations, so we do that here too.
          options.config = jsyaml.safeLoad(options.configYAML);
        } catch (e) {
          if (e instanceof jsyaml.YAMLException) {
            return callback({error: 'Error parsing YAML.\n' + e});
          }
          throw e;
        }
      }
      var service = this.db.services.add({
        id: options.name,
        name: options.name,
        charm: charm.get('id'),
        constraints: {},
        exposed: false,
        subordinate: charm.get('is_subordinate'),
        config: options.config
      });
      this.changes.services[service.get('id')] = [service, true];
      var response = this.addUnit(options.name, options.unitCount);
      response.service = service;
      callback(response);
    },

    // destroyService: function() {

    // },

    /**
     * Get service attributes.
     *
     * @method getService
     * @param {String} serviceId to get.
     * @return {Object} Service Attributes..
     */
    getService: function(serviceName) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATEDERROR;
      }
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return {error: 'Invalid service id.'};
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
        return callback(UNAUTHENTICATEDERROR);
      }
      var formatCharm = function(charm) {
        callback({result: charm.getAttrs()});
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
        return UNAUTHENTICATEDERROR;
      }
      if (Y.Lang.isUndefined(numUnits)) {
        numUnits = 1;
      }
      if (!Y.Lang.isNumber(numUnits) || numUnits < 1) {
        return {error: 'Invalid number of units.'};
      }
      var service = this.db.services.getById(serviceName);
      if (!service) {
        return {error: 'Service "' + serviceName + '" does not exist.'};
      }
      if (!Y.Lang.isValue(service.unitSequence)) {
        service.unitSequence = 0;
      }
      var unit, machine;
      var units = [];
      var machines = this._getUnitMachines(numUnits);

      for (var i = 0; i < numUnits; i += 1) {
        var unitId = service.unitSequence;
        machine = machines[i];
        unit = this.db.units.add({
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
      this.db.units.each(function(unit) {
        if (unit.machine) {
          usedMachineIds[unit.machine] = true;
        }
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
          error = [],
          warning = [];

      Y.Array.each(unitNames, function(unitName) {
        service = this.db.services.getById(unitName.split('/')[0]);
        if (service && service.get('is_subordinate')) {
          error.push(unitName + ' is a subordinate, cannot remove.');
        }
        removedUnit = this.db.units.some(function(unit, index) {
          if (unit.displayName === unitName) {
            this.db.units.remove(index);
            return true;
          }
        }, this);
        if (!removedUnit) {
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
        return UNAUTHENTICATEDERROR;
      }

      if (service) {
        if (!service.get('exposed')) {
          service.set('exposed', true);
          this.changes.services[service.get('id')] = [service, true];
        } else {
          warning = 'Service `' + serviceName + '` was already exposed.';
        }
      } else {
        error = '`' + serviceName + '` is an invalid service name.';
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
        return UNAUTHENTICATEDERROR;
      }
      if (service) {
        if (service.get('exposed')) {
          service.set('exposed', false);
          this.changes.services[service.get('id')] = [service, true];
        } else {
          warning = 'Service `' + serviceName + '` is not exposed.';
        }
      } else {
        error = '`' + serviceName + '` is an invalid service name.';
      }

      return {
        error: error,
        warning: warning
      };
    },

    /**
      Add a relation between two services.

      @method add_relation
      @param {String} endpointA A string representation of the service name
        and endpoint connection type ie) wordpress:db.
      @param {String} endpointB A string representation of the service name
        and endpoint connection type ie) wordpress:db.
    */
    addRelation: function(endpointA, endpointB) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATEDERROR;
      }
      if ((typeof endpointA !== 'string') ||
          (typeof endpointB !== 'string')) {
        return {error: 'Two string endpoint names' +
              ' required to establish a relation'};
      }

      var endpointData = Y.Array.map([endpointA, endpointB], endpointSplit);

      if (endpointData[0].type !== endpointData[1].type) {
        return {error: 'Endpoints need to match.'};
      }

      var charmAId, charmBId;

      // Because the service name and charm name might not match we first need
      // to find the charm that relates to the service name and use that charmid
      var charms = Y.Array.map(endpointData, function(endpoint) {
        var service = this.db.services.getById(endpoint.name);
        if (service) {
          return this.db.charms.getById(service.get('charm'));
        }
      }, this);
      // This error should never be hit but it's here JIC
      if (!charms[0] || !charms[1]) { return {error: 'Charm not loaded.'}; }

      /**
        Pushes juju-info onto the charm's 'provides' to allow for subordination
        @method addJujuInfo
        @param {Object} charm a charm model instance.
      */
      // TODO - do this during the interface and scope check don't attach it
      // to the charms.
      function addJujuInfo(charm) {
        var req = charm.get('requires');
        if (req['juju-info'] === undefined) {
          req['juju-info'] = {'interface': 'juju-info', 'scope': 'container'};
          charm.set('requires', req);
        }
      }
      Y.Array.each(charms, addJujuInfo);

      var charmEndpoints = [
        charms[0].get('requires')[endpointData[0].type],
        charms[1].get('requires')[endpointData[1].type]
      ];

      // If there are matching interfaces this will contain an object of the
      // charm interface type and scope (if supplied).
      var cics = getCharmInterfaceAndScope(
          // The reverse order of the second param is intentional
          charmEndpoints, [endpointData[1], endpointData[0]]);

      if (!cics) { return {error: 'No matching interfaces.'}; }

      // Assign a unique realtion id which is incremented after every
      // successful relation.
      var relationId = 'relation-' + this._relationCount;
      var relation = this.db.relations.create({
        relation_id: relationId,
        type: cics.sharedInterface,
        endpoints: [endpointA, endpointB],
        pending: false,
        scope: cics.sharedScope || 'global',
        display_name: endpointData[0].type
      });

      if (relation) {
        this._relationCount += 1;
        // Add the relation to the change delta
        this.changes.relations[relationId] = [relation, true];
        // Because the sandbox can either be passed a string or an object
        // we need to return as much information as possible to be able
        // to rebuild the expected object for both situations.
        return {
          relationId: relationId,
          type: cics.sharedInterface,
          endpoints: [endpointA, endpointB],
          scope: cics.sharedScope || 'global',
          displayName: endpointData[0].type,
          relation: relation
        };
      }

      // Fallback error If the relation was not able to be created
      // for any reason other than what has already been checked for.
      return false;
    }

    // updateAnnotations: function() {

    // },

    // getAnnotations: function() {

    // },

    // removeAnnotations: function() {

    // },
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
        return UNAUTHENTICATEDERROR;
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

      annotations = Y.merge(existing, annotations, true, 0, null, true);
      models.setAnnotations(entity, annotations);

      // Arrange delta stream updates.
      var annotationGroup = this._getAnnotationGroup(entity);
      this.annotations[annotationGroup][entityName] = [entity, true];
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
        return UNAUTHENTICATEDERROR;
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
        return UNAUTHENTICATEDERROR;
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
      // Note that we pass true here, even removing an annotation
      // is recorded as an object change/update.
      this.annotations[annotationGroup][entityName] = [entity, true];
      return {result: true};
    },

    // removeRelation: function() {

    // },

    setConfig: function(serviceName, config) {
      if (!this.get('authenticated')) {
        return UNAUTHENTICATEDERROR;
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
      // Merge new constraints in.
      existing = Y.mix(existing, config, true, undefined, 0, true);
      //TODO: validate the config.
      // Reassign the attr.
      service.set('config', existing);
      // The callback indicates done, we can pass anything back.
      this.changes.services[service.get('id')] = [service, true];
      return {result: existing};
    },

    setConstraints: function(serviceName, data) {
      var constraints = {};

      if (!this.get('authenticated')) {
        return UNAUTHENTICATEDERROR;
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
          if (kv[1]) {
            constraints[kv[0]] = kv[1];
          }
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
        return UNAUTHENTICATEDERROR;
      }
      var unit = this.db.units.getById(unitName);
      if (!unit) {
        return {error: 'Unit "' + unitName + '" does not exist.'};
      }

      if (relationName) {
        var service = this.db.services.getById(unit.service);
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
    }


  });

  Y.namespace('juju.environments').FakeBackend = FakeBackend;

}, '0.1.0', {
  requires: [
    'base',
    'js-yaml',
    'juju-models'
  ]
});
