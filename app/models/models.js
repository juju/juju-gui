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
 * The database models.
 *
 * @module models
 */

YUI.add('juju-models', function(Y) {

  var models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils'),
      environments = Y.namespace('juju.environments'),
      handlers = models.handlers;

  // The string representing juju-core entities' alive Life state.
  var ALIVE = 'alive';
  // The default Juju GUI service name.
  var JUJU_GUI_SERVICE_NAME = 'juju-gui';

  // This is a helper function used by all of the process_delta methods.
  var _process_delta = function(list, action, change_data, change_base) {
    var instanceId;
    if (Y.Lang.isObject(change_data)) {
      if ('id' in change_data) {
        instanceId = change_data.id;
      } else {
        console.warn('Invalid change data in _process_delta:', change_data);
        return;
      }
    } else if (action === 'remove') {
      // This is a removal request coming from the Python delta stream.
      // In this case, the change_data is the instance id.
      instanceId = change_data;
    } else {
      console.warn('Invalid change data in _process_delta:', change_data);
      return;
    }
    var instance = list.getById(instanceId),
        exists = Y.Lang.isValue(instance);

    if (action === 'add' || action === 'change') {
      // Client-side requests may create temporary objects in the
      // database in order to give the user more immediate feedback.
      // The temporary objects are created after the ACK message from
      // the server that contains their actual names.  When the delta
      // arrives for those objects, they already exist in a skeleton
      // form that needs to be fleshed out.  So, the existing objects
      // are kept and re-used.
      var data = Y.merge(change_base || {}, change_data);
      if (!exists) {
        if (list.name === 'serviceUnitList') {
          // Allow direct changes to units when data arrives from the delta.
          instance = list.add(data, true);
        } else {
          instance = list.add(data);
        }
      } else {
        if (instance instanceof Y.Model) {
          instance.setAttrs(data);
        } else {
          // This must be from a LazyModelList.
          Y.each(data, function(value, key) {
            instance[key] = value;
          });
          // Lazy model lists don't fire change events
          list.fire('change');
        }
      }
    }
    else if (action === 'remove') {
      if (exists) {
        if (list.name === 'serviceUnitList') {
          // Allow direct changes to units when data arrives from the delta.
          list.remove(instance, true);
        } else {
          list.remove(instance);
        }
        if (list.name === 'serviceList') {
          instance.destroy();
        }
      }
    } else {
      console.warn('Unknown change kind in _process_delta:', action);
    }
    return instance;
  };

  /**
    Utility method to return the services involved in the delta.

    @method getServicesfromDelta
    @param {Object | null} modelInstance a reference to the model instance
      to use to extract the service information from.
    @param {Object | String} data The delta data.
    @param {Object} db A reference to the database Model.
    @return {Object | Array | undefined} A reference to a service instance
      or an array of service instances in the case where it is a
      relation delta or undefined if there is no service in the system.
  */
  var getServicesfromDelta = function(modelInstance, data, db) {
    var services;
    if (modelInstance && modelInstance.service) {
      services = db.services.getById(modelInstance.service);
    } else if (typeof data === 'string') {
      services = db.services.getById(data.split('/')[0]);
    } else if (data.service) {
      services = db.services.getById(data.service);
    } else if (data.endpoints) {
      // It is a relation delta
      services = [];
      services.push(db.services.getById(data.endpoints[0][0]));
      if (data.endpoints[1]) {
        // Peer relationships only have a single endpoint
        services.push(db.services.getById(data.endpoints[1][0]));
      }
    }

    if (!services) { return; }
    return services;
  };

  /**
   * Model a single Environment. Serves as a place to collect
   * Environment level annotations.
   *
   * @class Environment
   */
  var Environment = Y.Base.create('environment', Y.Model, [], {
    /**
     * Update the annotations on delta events.
     * We don't support removal of the Environment model.
     *
     * @method process_delta
     */
    process_delta: function(action, data) {
      this.set('annotations', data);
    }
  }, {
    ATTRS: {
      name: {},
      provider: {},
      defaultSeries: {},
      annotations: {
        valueFn: function() {return {};}
      }
    }
  });
  models.Environment = Environment;

  var Service = Y.Base.create('service', Y.Model, [], {

    /**
      Adds a new instance of a relations list to the services attributes and
      creates a holder for this services event listeners.

      @method initializer
      @private
    */
    initializer: function() {
      // We create the relation model list here so that the databinding
      // engine can bind to it and react on changes which may come in
      // on the deltas.
      // The units model list is also created here to avoid having to check
      // for it's existence in multiple places in the app.
      this.setAttrs({
        units: new models.ServiceUnitList({preventDirectChanges: true}),
        relations: new models.RelationList()
      });
      this._events = [];
      this._bindAttributes();
    },

    /**
      Sets up the attribute event listeners

      @method _bindAttributes
    */
    _bindAttributes: function() {
      // This allows the databinding engine to react to a relation change on
      // any of this services relations.
      this._events.push(
          this.get('relations').on(
              ['*:change', '*:add', '*:remove'], function(e) {
                this.set('relationChangeTrigger', e);
              }, this));
    },

    /**
      Return true if this service life is 'alive' or 'dying', false otherwise.

      A model instance is alive if its life cycle (i.e. the "life" attribute)
      is set to 'alive' or 'dying'. The other possible value, as they arrive
      from the juju-core delta stream is 'dead'.

      @method isAlive
      @return {Boolean} Whether this service is alive.
     */
    isAlive: function() {
      var life = this.get('life');
      if (life === ALIVE || life === 'dying') {
        return true;
      }
      return false;
    },

    /**
      Return true if one or more units in this service are in an error state.

      Return false otherwise.

      @method hasErrors
      @return {Boolean} Whether one or more unit are in an error state.
     */
    hasErrors: function() {
      var aggregates = this.get('aggregated_status') || {},
          errors = aggregates.error || false;
      return errors && errors >= 1;
    },

    /**
      Removes a relation from the internal relation model list
      using the supplied relationId.

      @method removeRelations
      @param {String} relationId The id of the relation to remove.
    */
    removeRelations: function(relationId) {
      var relations = this.get('relations');
      relations.some(function(rel) {
        if (rel.get('relation_id') === relationId) {
          relations.remove(rel);
          return true;
        }
      });
    },

    /**
      Detaches all of the events in the models _event property

      @method destructor
    */
    destructor: function() {
      this._events.forEach(function(event) {
        event.detach();
      });
    }

  }, {
    ATTRS: {
      /**
        Stores the fields changed by the ECS system. It is set and cleared by
        the environment-change-set.

        @attribute _dirtyFields
        @type {Array}
        @default []
      */
      _dirtyFields: {
        value: []
      },
      displayName: {
        'getter': function(value) {
          var name;
          if (value) {
            name = value;
          } else {
            name = this.get('id').replace('service-', '');
          }

          // truncate if required
          function truncate(str, max) {
            var fill = '…';
            if (str.length > max) {
              str = str.substr(0, max - fill.length) + fill;
            }
            return str;
          }

          // add indicators for uncommitted state
          if (this.get('pending')) {
            name = '(' + truncate(name, 10) + ')';
          } else {
            name = truncate(name, 18);
          }

          return name;
        }
      },
      /**
        The name of the service.
        If not set, the charm name is returned.

        @attribute name
        @type {String}
      */
      name: {
        'getter': function(value) {
          if (value) {
            return value;
          }
          return this.get('packageName');
        }
      },
      charm: {},
      /**
        If the Service has been marked for deletion via the ECS.

        @attribute deleted
        @type {Boolean}
      */
      deleted: {},
      icon: {},
      config: {},
      /**
        The environment configuration is kept in sync with what juju believes is
        the real configuration values for this service. You should treat this as
        a read only attribute as it's to be modified only by the delta stream.

        @attribute environmentConfig
        @type {Object}
        @default {}
      */
      environmentConfig: {
        value: {}
      },
      // Annotations on service are an empty dict
      // rather than undefined. This helps make
      // some checks in the code simpler to write.
      // Units still default to undefined as a way
      // to help support scale.
      annotations: {value: {}},
      /**
        Whether or not the service's charm has changed recently.

        @attribute charmChanged
        @type {Boolean}
        @default false
      */
      charmChanged: {
        value: false
      },
      constraints: {
        'setter': function(value) {
          if (typeof value === 'string') {
            var output = {};
            value.split(' ').map(function(pair) {
              var kv = pair.split('=');
              output[kv[0]] = kv[1];
            });
            value = output;
          }
          return value;
        }
      },
      constraintsStr: {
        'getter': function() {
          var result = [];
          Y.each(this.get('constraints'), function(v, k) {
            if (v !== undefined) {
              result.push(k + '=' + v);
            }
          });
          if (result.length) {
            return result.join(' ');
          }
          return undefined;
        }
      },
      exposed: {
        value: false
      },
      subordinate: {
        value: false
      },
      pending: {
        value: false
      },
      life: {
        value: ALIVE
      },
      unit_count: {},

      /**
        The services current units.
        modellist

        @attribute units
        @default {}
        @type {ServiceUnitList}
      */
      units: {},

      /**
        The services current relations. This is kept in sync with the
        db.relations modellist

        @attribute relations
        @default {}
        @type {RelationList}
      */
      relations: {},

      /**
        When there is a change to the relation or to any units in the relation
        this value is changed to trigger changes in the inspector.

        @attribute relationChangeTrigger
        @default {}
        @type {Object}
      */
      relationChangeTrigger: {
        value: {}
      },

      /**
        An aggregate of the relation errors that we use to trigger
        databinding changes

        @attribute aggregateRelationError
        @default {}
        @type {Object}
      */
      aggregateRelationError: {},

      /**
        Whether or not an upgrade is available.

        @attribute upgrade_available
        @type {boolean}
        @default false
      */
      upgrade_available: {
        value: false
      },

      /**
        Whether or not the upgrade availablility has been loaded.

        @attribute upgrade_loaded
        @type {boolean}
        @default false
      */
      upgrade_loaded: {
        value: false
      },

      /**
        The latest charm URL that the service can be upgraded to.

        @attribute upgrade_to
        @type {string}
      */
      upgrade_to: {},
      aggregated_status: {},
      /**
        The original name from the Charm

        @attribute packageName
        @type {String}
      */
      packageName: {
        'getter': function(value) {
          if (value) {
            return value;
          } else {
            // Because the packageName is not set if the
            // model was created from the core delta.
            var charmUrl = this.get('charm'),
                charmName;
            // If there is no charm as well, well you have bigger problems :)
            // but this helps so that we don't need to provide charm data
            // for every test suite.
            if (charmUrl) {
              var urlParts = charmUrl.split('/');
              var nameParts = urlParts[urlParts.length - 1].split('-');
              var possibleVersion = nameParts[nameParts.length - 1];
              // Expected === and instead saw ==
              /* jshint -W116 */
              if (possibleVersion == parseInt(possibleVersion, 10)) {
                // The charmUrl contains the version so we can drop that and
                // reconstruct the name.
                nameParts.pop();
              }
              charmName = nameParts.join('-');
            }
            return charmName;
          }
        }
      }
    }
  });
  models.Service = Service;

  var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service,

    /**
      Return a list of visible model instances. A model instance is visible
      when it is alive or dying, or when it includes units in an error state.

      @method visible
      @return {Y.ModelList} The resulting visible model instances.
    */
    visible: function() {
      return this.filter({asList: true}, function(model) {
        return model.isAlive() || model.hasErrors();
      });
    },

    /**
      Filter units based on a predicate.

      @method filterUnits
      @param {Function} predicate The function used to filter units.
      @return {Array} A list of matching units.
    */
    filterUnits: function(predicate) {
      var units = [];
      this.each(function(service) {
        service.get('units').filter(predicate).forEach(function(unit) {
          units.push(unit);
        });
      });
      return units;
    },

    /**
      Fetches the services which were deployed with a charm matching
      a supplied charm name.

      @method getServicesFromCharmName
      @param {String} charmName The charmname you would like to match.
      @return {Array} A list of matching services.
    */
    getServicesFromCharmName: function(charmName) {
      return this.filter(function(service) {
        var charm = service.get('charm');
        if (charm) { // In tests charm can be undefined
          return charm.indexOf(charmName) > 0;
        }
      }, this);
    },

    /**
     Add a ghost (pending) service to the
     database. The canvas should pick this up
     independently.

     @method ghostService
     @param {Model} charm to add.
     @return {Model} Ghosted Service model.
   */
    ghostService: function(charm) {
      var config = charm && charm.get('config');
      var randomId, invalid = true;

      do {
        // The $ appended to the end is to guarantee that an id coming from Juju
        // will never clash with the randomly generated ghost id's in the GUI.
        randomId = Math.floor(Math.random() * 100000000) + '$';
        // Don't make functions within a loop
        /* jshint -W083 */
        invalid = this.some(function(service) {
          if (service.get('id') === randomId) {
            return true;
          }
        });
      } while (invalid);

      var ghostService = this.create({
        // Creating a temporary id because it's undefined by default.
        id: randomId,
        displayName: charm.get('package_name'),
        annotations: {},
        pending: true,
        charm: charm.get('id'),
        unit_count: 0,  // No units yet.
        loaded: false,
        subordinate: charm.get('is_subordinate'),
        config: config
      });
      return ghostService;
    },

    process_delta: function(action, data) {
      _process_delta(this, action, data, {exposed: false});
    }
  });

  models.ServiceList = ServiceList;

  // This model is barely used.  Units are in a lazy model list, so we
  // usually only use objects.  However, the model is used to generate ids, and
  // can be expected by some code.  The thing to be most wary of is the
  // attributes.  There is nothing keeping them in sync with reality other than
  // human maintenance, so verify your assumptions before proceeding from
  // reading this code.
  var ServiceUnit = Y.Base.create('serviceUnit', Y.Model, [], {},
      {
        ATTRS: {
          displayName: {},
          charmUrl: {},
          machine: {},
          agent_state: {},
          agent_state_info: {},
          agent_state_data: {},
          // This is empty if there are no relation errors, and otherwise
          // shows only the relations with errors.  The data structure in that
          // case is a hash mapping a local relation name to a list of services
          // on the other end, like {'cache': ['memcached']}.
          relation_errors: {},
          /**
            If the unit has been marked for deletion via the ECS.

            @attribute deleted
            @type {Boolean}
          */
          deleted: {},
          config: {},
          is_subordinate: {},
          open_ports: {},
          public_address: {},
          private_address: {}
        }
      });
  models.ServiceUnit = ServiceUnit;

  /**
    A lazy model list including service units.

    This model list is used in two ways:
      - as first class object in the db (db.units), in which case the list
        includes all known units;
      - as a service model attribute (service.get('units')), in which case
        the list only includes units belonging to the service.
    This means each time a unit is added or removed, we usually want to update
    both the global db.units and the model list in the service.

    The different instances are automatically kept in sync when reacting to
    changes arriving from the Juju API backend.
    When adding/removing units from the GUI code, db.addUnits() and
    db.removeUnits() must be used (rather than units.add/remove):
    those methods automatically update all the corresponding model lists.

    To enforce the rule above, ServiceUnitList can be instantiated passing
    {preventDirectChanges: true}. This make units.add/remove raise an error
    which prevents the list to be directly manipulated.

    @class ServiceUnitList
  */
  var ServiceUnitList = Y.Base.create('serviceUnitList', Y.LazyModelList, [], {
    model: ServiceUnit,
    /**
     * Create a display name that can be used in the views as an entity label
     * agnostic from juju type.
     *
     * @method createDisplayName
     * @param {String} name The name to modify.
     * @return {String} A display name.
     */
    createDisplayName: function(name) {
      // The following is needed to allow '.' to be allowed in RegExps by
      // JSLint.
      /*jslint regexp: true*/
      return name.replace('unit-', '').replace(/^(.+)-(\d+)$/, '$1/$2');
    },

    process_delta: function(action, data, db) {
      // If a charm_url is included in the data (that is, the Go backend
      // provides it), get the old charm so that we can compare charm URLs
      // in the future.
      var existingCharmUrl;
      if (action === 'change' && data.charmUrl) {
        var existingUnit = db.units.getById(data.id);
        if (existingUnit) {
          existingCharmUrl = existingUnit.charmUrl;
        }
      }
      // Include the new change in the global units model list.
      var instance = _process_delta(this, action, data, {});
      // The service should always be included in the delta change.
      // The getServicesfromDelta helper is used so that we can retrieve the
      // unit service even when data is just a string (and not an object
      // including a service field). This happens in pyJuju unit removals.
      var service = getServicesfromDelta(instance, data, db);
      if (!service) {
        console.error('Units added without matching Service');
        return;
      }
      // If the charm has changed on this unit in the delta, inform the service
      // of the change (but only if it doesn't already know, so as not to fire
      // a change event).  This is required because the two instances of a)
      // someone watching the GUI after setting a charm on a service, and b)
      // someone else watching the GUI as a service's charm changes, differ in
      // the amount of information the GUI has originally.  By setting this
      // flag, both cases can react in the same way.
      if (existingCharmUrl && existingCharmUrl !== instance.charmUrl &&
          !service.get('charmChanged')) {
        service.set('charmChanged', true);
      }
      // Include the new change in the service own units model list.
      _process_delta(service.get('units'), action, data, {});
    },

    _setDefaultsAndCalculatedValues: function(obj) {
      var raw = obj.id.split('/');
      obj.service = raw[0];
      obj.number = parseInt(raw[1], 10);
      obj.urlName = obj.id.replace('/', '-');
      obj.name = 'serviceUnit'; // This lets us more easily mimic models.
      if (!obj.displayName) {
        // The display name can be provided by callers, e.g. in the case a
        // ghost unit is being added to a ghost service.
        obj.displayName = this.createDisplayName(obj.id);
      }
    },

    /**
      Add the specified model or array of models to this list.
      This is overridden to allow customized attributes to be set up at
      creation time.

      Note: use db.addUnits to add units to the model list, so that different
      instances of ServiceUnitList are kept in sync.
      In case the above is not clear enough: DO NOT USE THIS METHOD directly!

      @method add
      @param {Object|Object[]} models See YUI LazyModelList.
      @return {Object|Object[]} The newly created model instance(s).
    */
    add: function(models, allowed) {
      if (!allowed && this.get('preventDirectChanges')) {
        throw new Error(
            'direct calls to units.add() are not allowed: ' +
            'use db.addUnits() instead'
        );
      }
      if (Y.Lang.isArray(models)) {
        models.forEach(this._setDefaultsAndCalculatedValues, this);
      } else {
        this._setDefaultsAndCalculatedValues(models);
      }
      return ServiceUnitList.superclass.add.call(this, models);
    },

    /**
      Remove the specified model or array of models from this list.

      Note: use db.removeUnits to remove units from the model list, so that
      different instances of ServiceUnitList are kept in sync.
      In case the above is not clear enough: DO NOT USE THIS METHOD directly!

      @method remove
      @param {Object|Object[]} models See YUI LazyModelList.
      @return {Object|Object[]} The removed model instance(s).
    */
    remove: function(models, allowed) {
      if (!allowed && this.get('preventDirectChanges')) {
        throw new Error(
            'direct calls to units.remove() are not allowed: ' +
            'use db.removeUnits() instead'
        );
      }
      return ServiceUnitList.superclass.remove.call(this, models);
    },

    /**
      Return a list of all the units placed in the given machine/container.
      If includeChildren is set to true, also return the units hosted in the
      sub-containers of the given machine.

      This method can also used to return unplaced units:
        units.filterByMachine(null);
      In this case the includeChildren argument is ignored.

      @method filterByMachine
      @param {String} machine The machine/container name.
      @param {Boolean} includeChildren Whether to include units hosted in
        sub-containers.
      @return {Array} The matching units as a list of objects.
    */
    filterByMachine: function(machine, includeChildren) {
      var predicate;
      if (machine) {
        if (includeChildren) {
          // Filter by machine and the containers hosted by the machine.
          predicate = function(unit) {
            if (machine && machine.toString().indexOf('/') >= 0) {
              // If this is a container then match the entire string.
              return unit.machine && unit.machine.indexOf(machine) === 0;
            }
            else {
              // If this is a machine then match against the first token
              // in the id. This prevents against '1' matching '15/lxc/5'.
              return unit.machine && unit.machine.split('/')[0] === machine;
            }
          };
        } else {
          // Filter by exact machine.
          predicate = function(unit) {
            return unit.machine === machine;
          };
        }
      } else {
        // Return the unplaced units.
        predicate = function(unit) {
          return !unit.machine;
        };
      }
      machine = machine || null;
      return this.filter(predicate);
    },

    /**
      Returns information about the state of the set of units for a given
      service in the form of a map of agent states.

      @method get_informative_states_for_service
      @param {Object} service The service model.
      @return {Array} An array of the aggregate map and relation errors
    */
    get_informative_states_for_service: function(service) {
      var aggregate_map = {},
          relationError = {},
          units_for_service = service.get('units'),
          serviceLife = service.get('life');

      units_for_service.each(function(unit) {
        var state = utils.determineCategoryType(
                              utils.simplifyState(unit, serviceLife));
        if (aggregate_map[state] === undefined) {
          aggregate_map[state] = 1;
        } else {
          aggregate_map[state] += 1;
        }
        if (state === 'error') {
          // If in error status then we need to parse out why it's in error.
          var info = unit.agent_state_info;
          if (info !== undefined && info.indexOf('failed') > -1) {
            // If we parse more than the relation info then split this out
            if (info.indexOf('relation') > -1) {
              var stateData = unit.agent_state_data;
              if (stateData) {
                var farService = stateData['remote-unit'].split('/')[0];
                if (farService) {
                  relationError[farService] = stateData.hook;
                }
              }
            }
          }
        }
      });
      return [aggregate_map, relationError];
    },

    /*
     * Updates a service's unit count and aggregate state map during a
     * delta, ensuring that they're up to date.
     */
    update_service_unit_aggregates: function(service) {
      var aggregate = this.get_informative_states_for_service(service);
      var sum = Y.Array.reduce(
          Y.Object.values(aggregate[0]), 0, function(a, b) {return a + b;});
      var previous_unit_count = service.get('unit_count');
      service.set('unit_count', sum);
      service.set('aggregated_status', aggregate[0]);
      service.set('relationChangeTrigger', { error: aggregate[1] });
      // Set Google Analytics tracking event.
      if (previous_unit_count !== sum && window._gaq) {
        window._gaq.push(['_trackEvent', 'Service Stats', 'Update',
          service.get('id'), sum]);
      }
    }

  }, {
    ATTRS: {
      /**
        Whether to prevent direct use of add/remove methods on this list.

        @attribute preventDirectChanges
        @type {Boolean}
      */
      preventDirectChanges: {value: false, writeOnce: 'initOnly'}
    }
  });
  models.ServiceUnitList = ServiceUnitList;

  // This model is barely used.  Machines are in a lazy model list, so we
  // usually only use objects.  However, the model is used to generate ids, and
  // can be expected by some code.  The thing to be most wary of is the
  // attributes.  There is nothing keeping them in sync with reality other than
  // human maintenance, so verify your assumptions before proceeding from
  // reading this code.
  var Machine = Y.Base.create('machine', Y.Model, [], {
    idAttribute: 'machine_id'
  }, {
    // Since MachineList is a lazy model list, the attributes below are rarely
    // used, and real object properties are created instead. That said, the
    // comments below are useful since they also provide a description of
    // machine lazy instances' properties.
    ATTRS: {
      /**
        The machine display name (e.g. "1" or "2/lxc/0"), automatically
        generated when a machine is added to the model list.

        @attribute displayName
        @type {String}
      */
      displayName: {},
      /**
        If the machine has been marked for deletion via the ECS.

        @attribute deleted
        @type {Boolean}
      */
      deleted: {},
      /**
        The parent machine name (e.g. "1" or "2/lxc/0"), automatically
        generated when a machine is added to the model list. For top level
        machines, this value is null.

        @attribute parentId
        @type {String}
      */
      parentId: {},
      /**
        The machine container type (e.g. "lxc" or "kvm"), or null if this is a
        top level machine. This attribute is automatically generated when a
        machine is added to the model list.

        @attribute containerType
        @type {String}
      */
      containerType: {},
      /**
        The machine or container number, automatically generated when a machine
        is added to the model list.

        @attribute number
        @type {Int}
      */
      number: {},
      /**
        The machine id, usually provided by the pyJuju stream.

        @attribute machine_id
        @type {String}
      */
      machine_id: {},
      /**
        The machine public address. This is set by the pyJuju machine stream,
        or by the juju-core mega-watcher for units, when the unit is hosted by
        this machine. When using juju-core, this is only set if the machine
        hosts a unit. Also see the addresses property below.

        @attribute public_address
        @type {String}
      */
      public_address: {},
      /**
        The machine addresses. Each address is an object including the
        following string fields:
          - name: the network name to which the address is associated;
          - scope: "public" for exposed addresses or "local-cloud" for local
            ones;
          - type: the address type (e.g. "hostname" or "ipv4");
          - value: the actual address.
        This info is included in the juju-core mega-watcher for machines.

        @attribute addresses
        @type {Array}
      */
      addresses: {},
      /**
        The machine instance id assigned by the cloud provider.
        This info is included in the juju-core mega-watcher for machines.

        @attribute instance_id
        @type {String}
      */
      instance_id: {},
      /**
        The machine status (e.g. "pending", "started" or "error").
        This info is included in the juju-core mega-watcher for machines.

        @attribute instance_id
        @type {String}
      */
      agent_state: {},
      /**
        Additional information for a machine status.
        For a more detailed info use the agent_state_data property below.
        This info is included in the juju-core mega-watcher for machines.

        @attribute agent_state_info
        @type {String}
      */
      agent_state_info: {},
      /**
        Additional information for a machine status.
        This info is included in the juju-core mega-watcher for machines.

        @attribute agent_state_data
        @type {Object}
      */
      agent_state_data: {},
      /**
        The machine hardware characteristics as an object including the
        following fields:
          - arch {String}: the hardware architecture (e.g. "amd64");
          - cpuCores {Int}: the number of CPU cores (e.g. 1 or 4);
          - cpuPower {Int}: the CPU power (e.g. 100);
          - mem {Int}: the machine memory in MB (e.g. 2048);
          - disk {Int}: the root disk storage in MB (e.g. 8192).
        This info is included in the juju-core mega-watcher for machines.

        @attribute hardware
        @type {Object}
      */
      hardware: {},
      /**
        The jobs this machine can be used for (e.g. "JobHostUnits").
        This info is included in the juju-core mega-watcher for machines.

        @attribute jobs
        @type {Array}
      */
      jobs: {},
      /**
        Whether this machine is a state server node.

        @attribute isStateServer
        @type {Boolean}
      */
      isStateServer: {},
      /**
        The machine life cycle status ("alive", "dying" or "dead").
        This info is included in the juju-core mega-watcher for machines.

        @attribute life
        @type {String}
      */
      life: {},
      /**
        The machine OS version (e.g. "precise" or "trusty").
        This info is included in the juju-core mega-watcher for machines.

        @attribute series
        @type {String}
      */
      series: {},
      /**
        The container types that can be created in this machine (e.g. "lxc").
        This info is only available when a machine is fully provisioned. The
        attribute is set to null until the information is known, i.e.:
        when supportedContainers is null this machine CAN support containers;
        when supportedContainers is [] this machine DO NOT support containers.
        This info is included in the juju-core mega-watcher for machines.

        @attribute supportedContainers
        @type {Array}
      */
      supportedContainers: {}
    }
  });
  models.Machine = Machine;

  var MachineList = Y.Base.create('machineList', Y.LazyModelList, [], {
    model: Machine,
    _ghostCounter: 0,

    /**
     * Create a display name that can be used in the views as an entity label
     * agnostic from juju type.
     *
     * @method createDisplayName
     * @param {String} name The name to modify.
     * @return {String} A display name.
     */
    createDisplayName: function(name) {
      return (name + '').replace('machine-', '');
    },

    /**
      Given a machine name, return the name of its parent, its container type
      and its number.

      @method parseMachineName
      @param {String} name The machine/container name.
      @return {Object} An object containing the following keys:
        - parentId {String|Null}: the container parent id or null if the given
          name refers to a top level machine.
          E.g. the parent of "2/lxc/0" is "2", the parent of "42" is null.
        - containerType {String|Null}: the container type or null if the given
          name refers to a top level machine.
          E.g. the container type of "2/lxc/0" is "lxc", the container type of
          "42" is null.
        - number {Int}: the machine or container number.
          E.g. the number of container "2/lxc/0" is 0, the number of machine
          "42" is 42.
    */
    parseMachineName: function(name) {
      // XXX frankban 2014-03-04: PYJUJU DEPRECATION. The single line below
      // can be safely removed once we remove pyJuju code. The machine names
      // are always strings in juju-core.
      name = name + '';
      var parts = name.split('/');
      var partsLength = parts.length;
      if (partsLength < 3) {
        // This is a top level machine.
        return {
          parentId: null,
          containerType: null,
          number: parseInt(name, 10)
        };
      }
      // This is a container.
      return {
        parentId: parts.slice(0, partsLength - 2).join('/'),
        containerType: parts[partsLength - 2],
        number: parseInt(parts[partsLength - 1], 10)
      };
    },

    /**
      Overrides the LazyModelList method to force an id attribute on.
      LazyModelList wants an "id" to index on.  It's not configurable.

      @method _modelToObject
      @param {Model|Object|Model[]|Object[]} model Instance(s) to convert.
      @return {Object|Object[]} Resulting plain object(s).
      @protected
    */
    _modelToObject: function(model) {
      var result = MachineList.superclass._modelToObject.call(this, model);
      // XXX frankban 2014-03-04: PYJUJU DEPRECATION.
      // I suspect machine_id is something pyJuju used to provide. If this is
      // the case, we should remove this function when dropping pyJuju support.
      // Using Y.Lang.isValue so that machine 0 is considered a good value.
      if (!Y.Lang.isValue(result.id)) {
        // machine_id shouldn't change, so this should be safe.
        result.id = result.machine_id;
      }
      return result;
    },

    /**
      Set default attributes on a new instance.

      @method _setDefaultsAndCalculatedValues
      @param {Object} obj The newly added model instance.
      @return {undefined} The given object is modified in place.
      @protected
    */
    _setDefaultsAndCalculatedValues: function(obj) {
      obj.name = 'machine';
      obj.displayName = this.createDisplayName(obj.id);
      var info = this.parseMachineName(obj.id);
      obj.parentId = info.parentId;
      obj.containerType = info.containerType;
      obj.number = info.number;
      if (obj.jobs) {
        var MANAGE_ENVIRON = environments.machineJobs.MANAGE_ENVIRON;
        obj.isStateServer = obj.jobs.indexOf(MANAGE_ENVIRON) !== -1;
      } else {
        // If jobs is undefined, then we are in a sandbox environment.
        // In this case, assume all machines to be able to host units.
        // Also, no state servers in sandbox mode.
        obj.jobs = [environments.machineJobs.HOST_UNITS];
        obj.isStateServer = false;
      }
    },

    /**
      Adds the specified model or array of models to this list.
      This is overridden to allow customized attributes to be set up at
      creation time.

      @method add
      @param {Object|Object[]} models See YUI LazyModelList.
      @return {Object|Object[]} The newly created model instance(s).
    */
    add: function(models, options) {
      if (Y.Lang.isArray(models)) {
        models.forEach(this._setDefaultsAndCalculatedValues, this);
      } else {
        this._setDefaultsAndCalculatedValues(models);
      }
      var result = MachineList.superclass.add.apply(this, arguments);
      return result;
    },

    /**
      Adds a ghost machine to this list.

      @method addGhost
      @param {String} parentId When adding a new container, this parameter can
        be used to place it into a specific machine, in which case the
        containerType must also be specified.
      @param {String} containerType The container type of the new machine
        (e.g. "lxc").
      @param {Object} attrs The initial machine attributes.
      @return {Object} The newly created model instance.
    */
    addGhost: function(parentId, containerType, attrs) {
      var obj = attrs ? Y.clone(attrs) : {};
      // Define the fully qualified ghost machine identifier.
      obj.id = 'new' + this._ghostCounter;
      this._ghostCounter += 1;
      if (parentId) {
        if (!containerType) {
          throw new Error('parent id specified without a container type');
        }
        obj.id = parentId + '/' + containerType + '/' + obj.id;
      }
      // Add the new machine to the database.
      return this.add(obj);
    },

    /**
      Return a list of all the machines having the given parent id.

      Assuming the db includes machines "1", "2", "2/kvm/0", "2/lxc/42" and
      "2/kvm/0/lxc/1" the `machines.filterByParent('2')` call would return
      machines "2/kvm/0" and "2/lxc/42". Note that "2/kvm/0/lxc/1" is excluded
      because its parent is "2/kvm/0". See filterByAncestor below if you need
      to include all the descendants.

      This function can also be used to retrieve all the top level machines:
      in the example above `machines.filterByParent(null)` would return
      machines "1" and "2".

      @method filterByParent
      @param {String} parentId The machine parent's name.
      @return {Array} The matching machines as a list of objects.
    */
    filterByParent: function(parentId) {
      return this.filter(function(item) {
        if (!parentId) {
          return item.parentId === null || item.parentId === undefined;
        }
        return item.parentId === parentId;
      });
    },

    /**
      Return a list of all the machines contained in the given ancestor.

      Assuming the db includes machines "1", "2", "2/kvm/0", "2/lxc/42" and
      "2/kvm/0/lxc/1" the `machines.filterByAncestor('2')` call would return
      machines "2/kvm/0", "2/lxc/42" and "2/kvm/0/lxc/1".

      Note that, for consistency with filterByParent, calling
      `machines.filterByAncestor(null)` returns an array of all the machines
      in the database.

      @method filterByAncestor
      @param {String} ancestorId The machine ancestor's name.
      @return {Array} The matching machines as a list of objects.
    */
    filterByAncestor: function(ancestorId) {
      if (ancestorId === null) {
        return this._items;
      }
      var prefix = ancestorId + '/';
      return this.filter(function(item) {
        return item.id.indexOf(prefix) === 0;
      });
    },

    process_delta: function(action, data) {
      _process_delta(this, action, data, {});
    },

    /**
      Set the sorting method for the list of machines.

      @method filterByAncestor
      @param {String} model What to sort the machines by.
      @return {Function} The sorting method function.
    */
    comparator: function(model) {
      return this._getSortMethod(this.get('sortMethod'))(model);
    },

    /**
       Get the sort method for the given sort type.

       @method _getSortMethod
       @param {String} sort The sort type.
     */
    _getSortMethod: function(sort) {
      var sortMethod;
      var weight = 0;
      switch (sort) {
        case 'units':
          sortMethod = function(model) {
            if (model.units) {
              weight = model.units.length;
            }
            return -weight;
          };
          break;
        case 'name':
          sortMethod = function(model) {
            return model.displayName;
          };
          break;
        case 'disk':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.disk;
            }
            return -weight;
          };
          break;
        case 'ram':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.mem;
            }
            return -weight;
          };
          break;
        case 'cpu':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.cpuPower;
            }
            return -weight;
          };
          break;
        case 'service':
          sortMethod = function(model) {
            if (model.units) {
              var services = {};
              model.units.forEach(function(unit) {
                services[unit.service] = true;
              });
              weight = Object.keys(services);
            }
            return weight;
          };
          break;
        case 'services':
          sortMethod = function(model) {
            if (model.units) {
              var services = {};
              model.units.forEach(function(unit) {
                services[unit.service] = true;
              });
              weight = Object.keys(services).length;
            }
            return -weight;
          };
          break;
        case 'size':
          sortMethod = function(model) {
            if (model.hardware) {
              weight = model.hardware.mem + model.hardware.disk;
            }
            return -weight;
          };
          break;
      }
      return sortMethod;
    }
  }, {
    ATTRS: {
      /**
        The method for sorting the list of machines.

        @attribute sortMethod
        @default 'name'
        @type {String}
       */
      sortMethod: {
        value: 'name'
      }
    }
  });
  models.MachineList = MachineList;

  var Relation = Y.Base.create('relation', Y.Model, [], {
    idAttribute: 'relation_id'

  }, {
    ATTRS: {
      relation_id: {},
      type: {},
      endpoints: {},
      pending: {
        value: false
      },
      scope: {},
      /**
        If the relation has been marked for deletion via the ECS.

        @attribute deleted
        @type {Boolean}
      */
      deleted: {},
      display_name: {
        'getter': function(value) {
          if (value) { return value;}
          var names = [];
          this.get('endpoints').forEach(function(endpoint) {
            names.push(endpoint[1].name);
          });
          return names.join(':');
        }
      }
    }
  });
  models.Relation = Relation;

  var RelationList = Y.Base.create('relationList', Y.ModelList, [], {
    model: Relation,

    process_delta: function(action, data, db) {
      // If the action is remove we need to parse the models before they are
      // removed from the db so that we can remove them from the relation
      // models that are cloned in each of the services.
      if (action === 'remove') {
        var endpoints;
        // PyJuju returns a single string as data to remove relations
        if (Y.Lang.isString(data)) {
          db.relations.each(function(relation) {
            if (relation.get('id') === data) {
              endpoints = relation.get('endpoints');
            }
          });
        } else {
          // juju-core returns an object
          endpoints = data.endpoints;
        }

        // Because we keep a copy of the relation models on each service we
        // also need to remove the relation from those models.
        // If the user adds then removes an endpoint before the deltas return
        // then the db's will be out of sync so this check is necessary.
        if (endpoints) {
          var service, serviceRelations;
          endpoints.forEach(function(endpoint) {
            service = db.services.getById(endpoint[0]);
            // The tests don't always add services so we check if they exist
            // first before trying to remove them
            if (service) {
              service.removeRelations(data);
            } else {
              // fixTests
              console.error('Relation added without matching service');
            }
          });
        }
        _process_delta(this, action, data, {});
      } else {
        // When removing a relation instance is null
        var instance = _process_delta(this, action, data, {});
        var services = getServicesfromDelta(instance, data, db);
        services.forEach(function(service) {
          // Because some of the tests add relations without services
          // it's possible that a service will be null
          if (service) {
            _process_delta(service.get('relations'), action, data, {});
          } else {
            // fixTests
            console.error('Relation added without matching service');
          }
        });
      }

    },

    /**
      Returns the relation which matches the provided endpoints.

      @method getRelationFromEndpoints.
      @param {Array} endpoints A 2 record array of endpoint objects.
      @return {Object} The relation model associated with the endpoints or
        undefined.
    */
    getRelationFromEndpoints: function(endpoints) {
      var relationModel, matching;
      this.some(function(relation) {
        matching = this.compareRelationEndpoints(
                               relation.get('endpoints'), endpoints);
        if (matching) {
          relationModel = relation;
          return true;
        }
      }, this);
      return relationModel;
    },

    /**
      Compares two relation endpoint objects to see if they are the same.

      @method compareRelationEndpoints
      @param {Array} endpointSetA A set of endpoint objects.
      @param {Array} endpointSetB A set of endpoint objects.
      @return {Boolean} If the endpoint sets match.
    */
    compareRelationEndpoints: function(endpointSetA, endpointSetB) {
      return endpointSetA.some(function(endpointA) {
        return endpointSetB.some(function(endpointB) {
          return this._compareEndpoints(endpointA, endpointB);
        }, this);
      }, this);
    },

    /**
      Recursive function to compare two endpoints forwards and backwards.

      @method _compareEndpoints
      @param {Object} endpointA An endpoint object.
      @param {Object} endpointB An endpoint object.
      @param {Boolean} done Pass true if it's done comparing and can return.
      @return {Boolean} If the endpoints match.
    */
    _compareEndpoints: function(endpointA, endpointB, done) {
      if (endpointA[0] === endpointB[0] &&
          endpointA[1].name === endpointB[1].name) {
        return true;
      } else if (!done) {
        return this._compareEndpoints(endpointB, endpointA, true);
      }
      return false;
    },

    /* Return true if a relation exists for the given endpoint.

       Optionally the relation must also match include the given
       service name.
     */
    has_relation_for_endpoint: function(ep, svc_name) {
      var svc_matched = false,
          ep_matched = false;

      return this.some(
          function(rel) {
            svc_matched = ep_matched = false;

            // Match endpoint and svc name across endpoints of a relation.
            Y.Array.each(
                rel.get('endpoints'),
                function(rep) {
                  if (ep.type !== rel.get('interface')) {
                    return;
                  }
                  if (!ep_matched) {
                    ep_matched = (ep.service === rep[0] &&
                        ep.name === rep[1].name);
                  }
                  if (svc_name && !svc_matched && rep[0] === svc_name) {
                    svc_matched = true;
                  }
                });

            if (!svc_name && ep_matched) {
              return true;
            } else if (svc_name && ep_matched && svc_matched) {
              return true;
            }
            return false;
          });
    },

    get_relations_for_service: function(service, asList) {
      var service_id = service.get('id');
      return this.filter({asList: Boolean(asList)}, function(relation) {
        return Y.Array.some(
            relation.get('endpoints'),
            function(endpoint) {
              return endpoint[0] === service_id;
            });
      });
    }
  }, {
    ATTRS: {}
  });
  models.RelationList = RelationList;


  var Notification = Y.Base.create('notification', Y.Model, [], {}, {
    ATTRS: {
      title: {},
      message: {},
      level: {
        value: 'info'
      },
      kind: {},
      seen: {value: false},
      timestamp: {
        valueFn: function() {
          return Y.Lang.now();
        }
      },

      // when a model id is set we can infer link (but only in the
      // context of app's routing table)
      modelId: {
        setter: function(model) {
          if (!model) {return null;}
          if (Y.Lang.isArray(model)) {return model;}
          return Y.mix(
              [model.name,
               (model instanceof Y.Model) ? model.get('id') : model.id]);
        }},
      // Whether or not the notification is related to the delta stream.
      isDelta: {value: false},
      link: {},
      link_title: {
        value: 'View Details'
      }
    }
  });
  models.Notification = Notification;

  var NotificationList = Y.Base.create('notificationList', Y.ModelList, [], {
    model: Notification,

    add: function() {
      this.trim();
      return NotificationList.superclass.add.apply(this, arguments);
    },

    comparator: function(model) {
      // timestamp desc
      return -model.get('timestamp');
    },

    /*
     * Trim the list removing oldest elements till we are
     * below max_size
     */
    trim: function(e) {
      while (this.size() >= this.get('max_size')) {
        this.removeOldest();
      }
    },

    removeOldest: function() {
      // The list is maintained in sorted order due to this.comparator
      // handle zero based index
      this.remove(this.size() - 1);
    },

    /*
     * Get Notifications relative to a given model.
     * Currently this depends on a mapping between the model
     * class as encoded by its clientId (see Database.getByModelId)
     *
     * [model_list_name, id]
     */
    getNotificationsForModel: function(model) {
      var modelKey = (model instanceof Y.Model) ? model.get('id') : model.id;
      return this.filter(function(notification) {
        var modelId = notification.get('modelId'),
            modelList;
        if (modelId) {
          modelList = modelId[0];
          modelId = modelId[1];
          return (modelList === model.name) && (
              modelId === modelKey);
        }
        return false;
      });
    }

  }, {
    ATTRS: {
      max_size: {
        value: 150,
        writeOnce: 'initOnly'
      }
    }
  });
  models.NotificationList = NotificationList;


  /*
   * Helper methods for interacting with annotations on
   * entities.
   *
   * _annotationProperty is a private mapping indicating
   * if annotations are store as an attribute or as a
   * property. A value of true indicates that property
   * style access should be used.
   */
  var _annotationProperty = {
    serviceUnit: true,
    machine: true
  };

  /**
   * Get annotations for an entity.
   * @method getAnnotations
   * @param {Object} Model (or ModelList managed object).
   * @return {Object} Annotations.
   */
  models.getAnnotations = function(entity) {
    if (!entity) {
      return undefined;
    }
    if (_annotationProperty[entity.name]) {
      return entity.annotations;
    }
    return entity.get('annotations');
  };

  models.setAnnotations = function(entity, annotations, merge) {
    if (!entity) {
      return;
    }
    if (merge) {
      var existing = models.getAnnotations(entity) || {};
      annotations = Y.mix(existing, annotations, true);
    }
    if (_annotationProperty[entity.name]) {
      entity.annotations = annotations;
    } else {
      entity.set('annotations', annotations);
    }
  };

  var Database = Y.Base.create('database', Y.Base, [], {
    initializer: function() {
      // Single model for environment database is bound to.
      this.environment = new Environment();
      this.services = new ServiceList();
      this.charms = new models.CharmList();
      this.relations = new RelationList();
      this.notifications = new NotificationList();
      this.machines = new MachineList();
      this.units = new ServiceUnitList({preventDirectChanges: true});
    },

    /**
     * Nicely clean up.
     *
     * @method destructor
     */
    destructor: function() {
      var modelLists = [
        this.environment, this.services, this.charms, this.relations,
        this.notifications, this.machines, this.units];
      modelLists.forEach(function(modelList) {
        modelList.detachAll();
        modelList.destroy();
      });
    },

    /**
     * Resolve from an id to a Database entity. The lookup pattern is such that
     * "env" -> environment model
     * <int> -> machine
     * <name>/<int> -> unit
     * <name> -> service
     *
     * @method resolveModelByName
     * @param {Object} Entity name, usually {String}, {Int} possible for
     *                 machine.
     * @return {Model} resolved by call.
     */
    resolveModelByName: function(entityName) {
      if (!entityName) {
        return undefined;
      }
      // Handle the environment entity.
      if (entityName === 'env') {
        return this.environment;
      }
      // Handle machines.
      if (/^\d+$/.test(entityName)) {
        return this.machines.getById(entityName);
      }
      // Handle units.
      if (/^\S+\/\d+$/.test(entityName)) {
        return this.units.getById(entityName);
      }
      // Handle services.
      return this.services.getById(entityName);
    },

    /**
      Returns a modelList given the model name.

      @method getModelListByModelName
      @param {String} modelName The model's name.
      @return {Object} The model list.
    */
    getModelListByModelName: function(modelName) {
      if (modelName === 'annotations' || modelName === 'environment') {
        return this.environment;
      }
      return this[modelName + 's'];
    },

    getModelFromChange: function(change) {
      var change_kind = change[1],
          data = change[2],
          model_id = change_kind === 'remove' && data || data.id;
      return this.resolveModelByName(model_id);
    },

    reset: function() {
      this.services.reset();
      this.machines.reset();
      this.charms.reset();
      this.relations.reset();
      this.notifications.reset();
      this.units.reset();
    },

    /**
      Handle the delta stream coming from the API backend.
      Populate the database according to the changeset included in the delta.

      @method onDelta
      @param {Event} deltaEvent An event object containing the delta changeset
       (in the "data.result" attribute).
      @return {undefined} Nothing.
    */
    onDelta: function(deltaEvent) {
      var self = this,
          changes = deltaEvent.data.result,
          defaultHandler = handlers.pyDelta;

      // Process delta changes invoking handlers for each change in changeset.
      changes.forEach(function(change) {
        var kind = change[0],
            action = change[1],
            data = change[2],
            handler = defaultHandler;
        if (handlers.hasOwnProperty(kind)) {
          handler = handlers[kind];
        }
        handler(self, action, data, kind);
      });

      // Update service unit aggregates
      // (this should select only those elements which had deltas).
      var units = this.units;
      this.services.each(function(service) {
        units.update_service_unit_aggregates(service);
      });
      this.fire('update');
    },

    /**
       Maps machine placement for services.

       The machine mapping is bound by current limitations of the juju-deployer
       tool.  For example, we cannot place multiple units onto the same lxc,
       merely designate that they go on an lxc on a given machine. Similiary,
       we can't place multiple units on the same machine, b/c juju-deployer
       doesn't understand such a placement and simply places those units into
       new machines.

       These limitations will be addressed when juju-deployer is updated to
       understand new charmstore bundle placement rules.

       @method _mapServicesToMachines
       @param {Object} machineList The list of machines.
     */
    _mapServicesToMachines: function(machineList) {
      var machinePlacement = {};
      var owners = {};
      var machineNames = {};

      // Strip uncommitted machines and containers from the machine list.
      var db = this; // machineList.filter does not respect bindscope.
      var machines = machineList.filter(function(machine) {
        if (machine.id.indexOf('new') !== -1 ||
            db.units.filterByMachine(machine.id).length === 0) {
          return false;
        }
        return true;
      });

      // "Sort" machines w/ parents (e.g. containers) to the back of the list.
      machines.sort(function(a, b) {
        var aLxc = 0,
            bLxc = 0;
        if (a.parentId) {
          aLxc = -1;
        }
        if (b.parentId) {
          bLxc = -1;
        }
        return bLxc - aLxc;
      });

      machines.forEach(function(machine) {
        // We're only intested in committed units on the machine.
        var units = this.units.filterByMachine(machine.id).filter(
            function(unit) {
              return unit.agent_state;
            });

        var machineName;
        if (machine.containerType === 'lxc') {
          // If the machine is an LXC, we just base the name off of the
          // machine's parent, which we've already created a name for.
          machineName = 'lxc:' + machineNames[machine.parentId];
        } else {
          // The "owner" is the service that deployer will use to allocate other
          // service units, e.g. "put this unit of mysql on the machine with
          // wordpress."
          //
          // We need to get both the "owner" of the machine and how many times
          // we have seen the owner to generate a deployer designation (e.g.
          // wordpress=2, the second machine owned by wordpress).
          var owner = units[0].service;
          var ownerIndex = owners[owner] >= 0 ? owners[owner] + 1 : 0;
          owners[owner] = ownerIndex;
          machineName = owner + '=' + ownerIndex;
          machineNames[machine.id] = machineName;
        }

        units.forEach(function(unit) {
          var serviceName = unit.service;
          if (serviceName === owner) {
            // Deployer doesn't allow placing units on a machine owned by a unit
            // of the same service.
            return;
          }
          if (machinePlacement[serviceName]) {
            machinePlacement[serviceName].push(machineName);
          } else {
            machinePlacement[serviceName] = [machineName];
          }
        });
      }, this);
      return machinePlacement;
    },

    /**
     * Export deployer formatted dump of the current environment.
     * Note: When we have a selection UI in place this should honor
     * that.
     *
     * @method exportDeployer
     * @return {Object} export object suitable for serialization.
     */
    exportDeployer: function() {
      var serviceList = this.services,
          relationList = this.relations,
          defaultSeries = this.environment.get('defaultSeries'),
          result = {
            envExport: {
              services: {},
              relations: []
            }
          };

      if (defaultSeries) {
        result.envExport.series = defaultSeries;
      }

      serviceList.each(function(service) {
        var units = service.get('units');
        var charm = this.charms.getById(service.get('charm'));
        var serviceOptions = {};
        var charmOptions = charm.get('options');
        var serviceName = service.get('id');

        // Exclude this service if it is a ghost or if it is named "juju-gui".
        // This way we prevent the Juju GUI service to be exported when the
        // bundle is created from a live environment. Note that this is a weak
        // check: in theory, each deployed charm can be named "juju-gui", but
        // we still assume this convention since there are no other (more
        // solid) ways to exclude the Juju GUI service.
        if (service.get('pending') === true ||
            serviceName === JUJU_GUI_SERVICE_NAME) {
          return;
        }

        // Process the service_options removing any values
        // that are the default value for the charm.
        Y.each(service.get('config'), function(value, key) {
          if (Y.Lang.isValue(value)) {
            var optionData = charmOptions && charmOptions[key];
            switch (optionData.type) {
              case 'boolean':
                // XXX frankban 2013-10-31: why boolean options are stored in
                // the db sometimes as booleans and other times as strings
                // (e.g. "true")? As a quick fix, always convert to boolean
                // type, but we need to find who writes in the services db and
                // normalize the values.
                value = (value + '' === 'true');
                break;
              case 'float':
                value = parseFloat(value);
                break;
              case 'int':
                value = parseInt(value, 10);
                break;
            }
            var defaultVal = optionData && optionData['default'];
            var hasDefault = Y.Lang.isValue(defaultVal);
            if (!hasDefault || value !== defaultVal) {
              serviceOptions[key] = value;
            }
          }
        });

        var serviceData = {charm: charm.get('id')};
        if (charm.get('is_subordinate')) {
          // Subordinate services can not have any units.
          serviceData.num_units = 0;
        } else {
          // Test models or ghosts might not have a units LazyModelList.
          serviceData.num_units = units && units.size() || 1;
        }
        if (serviceOptions && Y.Object.size(serviceOptions) >= 1) {
          serviceData.options = serviceOptions;
        }
        // Add constraints
        var constraints = service.get('constraintsStr');
        if (constraints) {
          // constraintStr will filter out empty values
          serviceData.constraints = constraints;
        }

        if (service.get('exposed')) {
          serviceData.expose = true;
        }

        // XXX: Only expose position. Currently these are position absolute
        // rather than relative.
        var anno = service.get('annotations');
        if (anno && anno['gui-x'] && anno['gui-y']) {
          serviceData.annotations = {'gui-x': anno['gui-x'],
            'gui-y': anno['gui-y']};
        }
        result.envExport.services[serviceName] = serviceData;
      }, this);

      if (window.flags && window.flags.mv) {
        var machinePlacement = this._mapServicesToMachines(this.machines);
        Object.keys(machinePlacement).forEach(function(serviceName) {
          var placement = machinePlacement[serviceName];
          result.envExport.services[serviceName].to = placement;
        });
      }

      relationList.each(function(relation) {
        var endpoints = relation.get('endpoints');
        // Skip peer relations: they should be added automatically.
        if (endpoints.length === 1) {
          return;
        }
        // Skip relations on the juju-gui service. The Juju GUI is not supposed
        // to have relation established with other charms, but this can change
        // in the future, and also this can be the case when an extraneous
        // service is named "juju-gui".
        var serviceNames = endpoints.map(function(endpoint) {
          return endpoint[0];
        });
        if (serviceNames.indexOf(JUJU_GUI_SERVICE_NAME) !== -1) {
          return;
        }
        // Export this relation.
        var relationData = endpoints.map(function(endpoint) {
          return endpoint[0] + ':' + endpoint[1].name;
        });
        result.envExport.relations.push(relationData);
      }, this);

      return result;
    },

    /**
      Adds the specified model or array of models to the units model lists.

      This method updates both the global db.units and the model list included
      in the corresponding service.

      @method addUnits
      @param {Object|Object[]|Model|Model[]} models The unit or list of units.
      @return {Model|Model[]} The newly added model or array of models.
    */
    addUnits: function(models) {
      var unitOrUnits = this.units.add(models, true);
      var units = Y.Lang.isArray(unitOrUnits) ? unitOrUnits : [unitOrUnits];
      // Update the units model list included in the corresponding services.
      units.forEach(function(unit) {
        var service = this.services.getById(unit.service);
        var serviceUnits = service.get('units');
        serviceUnits.add(unit, true);
        this.units.update_service_unit_aggregates(service);
      }, this);
      return unitOrUnits;
    },

    /**
      Remove the specified model or array of models from the units model lists.

      This method updates both the global db.units and the model list included
      in the corresponding service.

      @method removeUnits
      @param {Object|Object[]|Model|Model[]} models The unit or list of units.
      @return {Model|Model[]} The removed model or array of models.
    */
    removeUnits: function(models) {
      var unitOrUnits = this.units.remove(models, true);
      var units = Y.Lang.isArray(unitOrUnits) ? unitOrUnits : [unitOrUnits];
      // Update the units model list included in the corresponding services.
      units.forEach(function(unit) {
        var service = this.services.getById(unit.service);
        var serviceUnits = service.get('units');
        serviceUnits.remove(unit, true);
        this.units.update_service_unit_aggregates(service);
      }, this);
      return unitOrUnits;
    }

  });
  models.Database = Database;
}, '0.1.0', {
  requires: [
    'model',
    'model-list',
    'lazy-model-list',
    'datasource-io',
    'datasource-jsonschema',
    'io-base',
    'json-parse',
    'juju-delta-handlers',
    'juju-endpoints',
    'juju-view-utils',
    'juju-charm-models',
    'juju-env',
    'juju-env-go',
    'promise'
  ]
});
