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
      handlers = models.handlers;

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
        instance = list.add(data);
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
        list.remove(instance);
      }
    } else {
      console.warn('Unknown change kind in _process_delta:', action);
    }
    return instance;
  };

  /**
    Utility method to return the services involved in the delta.

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
      services.push(db.services.getById(data.endpoints[1][0]));
    }

    if (!services) { return; }
    return services;
  };

  /**
    Utility method to add a copied Unit Model to the service Model.

    @param {Object | null} modelInstance a reference to the model instance
                           to use to extract the service information from.
    @param {Object | String} data The delta data.
    @param {Object} db A reference to the database Model.
    @return {Object} Reference to the modellist which was added to the service.
  */
  var addUnitToServiceModel = function(modelInstance, data, db) {
    var service = getServicesfromDelta(modelInstance, data, db);
    var modelList = service.get('units');
    if (!modelList) {
      modelList = new models.ServiceUnitList();
      service.set('units', modelList);
    }
    return modelList;
  };

  /**
    Utility method to add a copied Relation Model to the service Model.

    @param {Object | null} modelInstance a reference to the model instance
                           to use to extract the service information from.
    @param {Object | String} data The delta data.
    @param {Object} db A reference to the database Model.
    @return {Object} Reference to the modellist which was added to the service.
  */
  var addRelationToServiceModel = function(modelInstance, data, db) {
    var services = getServicesfromDelta(modelInstance, data, db);
    var modelList = [], tmp;
    services.forEach(function(service) {
      tmp = service.get('relations');
      if (!tmp) {
        tmp = new models.RelationList();
        service.set('relations', tmp);
        modelList.push(tmp);
      } else {
        modelList.push(tmp);
      }
    });
    return modelList;
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

  var ALIVE = 'alive';

  var Service = Y.Base.create('service', Y.Model, [], {

    initializer: function() {
      var relations = new models.RelationList();
      this.set('relations', relations);
      this._events = [];
      this._bindAttributes();
    },

    _bindAttributes: function() {
      this._events.push(
          this.get('relations').on(
              ['*:change', '*:add', '*:remove'], function(e) {
                this.set('aggregateRelations', e);
              }, this));
    },

    /**
      Return true if this service life is "alive", false otherwise.

      A model instance is alive if its life cycle (i.e. the "life" attribute)
      is set to "alive". Other possible values, as they arrive from the
      juju-core delta stream, are "dying" and "dead", in which cases the
      service is not considered alive.

      @method isAlive
      @return {Boolean} Whether this service is alive.
     */
    isAlive: function() {
      return this.get('life') === ALIVE;
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

    destructor: function() {
      this._events.forEach(function(event) {
        event.detach();
      });
    }

  }, {
    ATTRS: {
      displayName: {
        /**
          Dynamically calculate a display name that accounts for Juju Core name
          prefixes.

          @attribute displayName
          @type {String}
         */
        getter: function() {
          return this.get('id').replace('service-', '');
        }
      },
      name: {},
      charm: {},
      icon: {},
      config: {},
      // Annotations on service are an empty dict
      // rather than undefined. This helps make
      // some checks in the code simpler to write.
      // Units still default to undefined as a way
      // to help support scale.
      annotations: {value: {}},
      constraints: {},
      constraintsStr: {
        'getter': function() {
          var result = [];
          Y.each(this.get('constraints'), function(v, k) {
            result.push(k + '=' + v);
          });
          if (result.length) {
            return result.join(',');
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
      relations: { },
      aggregateRelations: {},
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
        The latest charm URL that the service can be upgraded to.

        @attribute upgrade_to
        @type {string}
      */
      upgrade_to: {},
      aggregated_status: {}
    }
  });
  models.Service = Service;

  var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service,

    /**
      Return a list of visible model instances.

      A model instance is visible when it is alive or when, even if it is dying
      or dead, one or more of its units are in an error state.
      In the latter case, we want to still display the service in order to
      allow users to retry or resolve its units.

      @method alive
      @return {Y.ModelList} The resulting visible model instances.
    */
    visible: function() {
      return this.filter({asList: true}, function(model) {
        return model.isAlive() || model.hasErrors();
      });
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
      var serviceCount = this.filter(function(service) {
        return service.get('charm') === charm.get('id');
      }).length + 1;
      var ghostService = this.create({
        id: '(' + charm.get('package_name') + ' ' + serviceCount + ')',
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
          machine: {},
          agent_state: {},
          agent_state_info: {},
          // This is empty if there are no relation errors, and otherwise
          // shows only the relations with errors.  The data structure in that
          // case is a hash mapping a local relation name to a list of services
          // on the other end, like {'cache': ['memcached']}.
          relation_errors: {},

          config: {},
          is_subordinate: {},
          open_ports: {},
          public_address: {},
          private_address: {}
        }
      });
  models.ServiceUnit = ServiceUnit;

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
      var instance = _process_delta(this, action, data, {});
      if (!db) {
        return;
      }
      var unitList = addUnitToServiceModel(instance, data, db);
      _process_delta(unitList, action, data, {});
    },

    _setDefaultsAndCalculatedValues: function(obj) {
      var raw = obj.id.split('/');
      obj.service = raw[0];
      obj.number = parseInt(raw[1], 10);
      obj.urlName = obj.id.replace('/', '-');
      obj.name = 'serviceUnit'; // This lets us more easily mimic models.
      obj.displayName = this.createDisplayName(obj.id);
    },

    add: function() {
      var result = ServiceUnitList.superclass.add.apply(this, arguments);
      if (Y.Lang.isArray(result)) {
        Y.Array.each(result, this._setDefaultsAndCalculatedValues, this);
      } else {
        this._setDefaultsAndCalculatedValues(result);
      }
      return result;
    },

    get_units_for_service: function(service, asList) {
      var options = {},
          sid = service.get('id');

      if (asList !== undefined) {
        options.asList = true;
      }

      var units = this.filter(options, function(m) {
        return m.service === sid;
      });
      return units;
    },

    /*
     *  Return information about the state of the set of units for a
     *  given service in the form of a map of agent states:
     *  state => number of units in that state
     */
    get_informative_states_for_service: function(service) {
      var aggregate_map = {},
          relationError = {},
          units_for_service = this.get_units_for_service(service);

      units_for_service.forEach(function(unit) {
        var state = utils.simplifyState(unit);
        if (aggregate_map[state] === undefined) {
          aggregate_map[state] = 1;
        } else {
          aggregate_map[state] += 1;
          if (state === 'error') {
            // If in error status then we need to parse out why it's in error.
            var info = unit.agent_state_info;
            if (info !== undefined && info.indexOf('failed') > -1) {
              // If we parse more than the relation info then split this out
              if (info.indexOf('relation') > -1) {
                var hook = info.split(':')[1].split('-'),
                    interfaceName = hook.slice(0, hook.length - 2)[0].trim();
                relationError[unit.service] = interfaceName;
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
console.log(aggregate);
      var sum = Y.Array.reduce(
          Y.Object.values(aggregate[0]), 0, function(a, b) {return a + b;});
      var previous_unit_count = service.get('unit_count');
      service.set('unit_count', sum);
      service.set('aggregated_status', aggregate[0]);
      service.set('aggregateRelationError', aggregate[1]);
      // Set Google Analytics tracking event.
      if (previous_unit_count !== sum && window._gaq) {
        window._gaq.push(['_trackEvent', 'Service Stats', 'Update',
          service.get('id'), sum]);
      }
    },
    ATTRS: {}
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
    ATTRS: {
      displayName: {},
      machine_id: {},
      public_address: {},
      instance_id: {},
      agent_state: {},
      agent_state_info: {}
    }
  });
  models.Machine = Machine;

  var MachineList = Y.Base.create('machineList', Y.LazyModelList, [], {
    model: Machine,
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
    Overrides the LazyModelList method to force an id attribute on.
    LazyModelList wants an "id" to index on.  It's not configurable.

    @method _modelToObject
    @param {Model|Object} model Model instance to convert.
    @return {Object} Plain object.
    @protected
    */
    _modelToObject: function(model) {
      var result = MachineList.superclass._modelToObject.call(this, model);
      if (!result.id) {
        // machine_id shouldn't change, so this should be safe.
        result.id = result.machine_id;
      }
      return result;
    },

    _setDefaultsAndCalculatedValues: function(obj) {
      obj.displayName = this.createDisplayName(obj.id);
      obj.name = 'machine';
    },

    add: function() {
      var result = MachineList.superclass.add.apply(this, arguments);
      if (Y.Lang.isArray(result)) {
        Y.Array.each(result, this._setDefaultsAndCalculatedValues, this);
      } else {
        this._setDefaultsAndCalculatedValues(result);
      }
      return result;
    },

    process_delta: function(action, data) {
      _process_delta(this, action, data, {});
    }
  }, {
    ATTRS: {}
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
      display_name: {}
    }
  });
  models.Relation = Relation;

  var RelationList = Y.Base.create('relationList', Y.ModelList, [], {
    model: Relation,

    process_delta: function(action, data, db) {
      var instance = _process_delta(this, action, data, {});
      var relationLists = addRelationToServiceModel(instance, data, db);
      relationLists.forEach(function(relationList) {
        _process_delta(relationList, action, data, {});
      });
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
        result = {error: 'Specified relation is unavailable.'};
      } else if (matches.length > 1) {
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
    if (_annotationProperty[entity.name]) {
      return entity.annotations;
    }
    return entity.get('annotations');
  };

  models.setAnnotations = function(entity, annotations) {
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
      this.charms = new models.BrowserCharmList();
      this.relations = new RelationList();
      this.notifications = new NotificationList();

      // These two are dangerous.. we very well may not have capacity
      // to store a 1-1 representation of units and machines in js.
      // At least we should never assume the collection is complete, and
      // have usage of some ephemeral slice/cursor of the collection.
      // Indexed db might be interesting to explore here, with object delta
      // and bulk transfer feeding directly into indexedb.
      // Needs some experimentation with a large data set.  For now, we are
      // simply using LazyModelList.
      this.units = new ServiceUnitList();
      this.machines = new MachineList();

      // For model syncing by type. Charms aren't currently sync'd, only
      // fetched on demand (they're static).
      this.model_map = {
        'unit': ServiceUnit,
        'machine': Machine,
        'service': Service,
        'relation': Relation,
        'charm': models.BrowserCharm
      };

      // Used to assign new relation ids.
      this._relationCount = 0;
    },

    /**
     * Nicely clean up.
     *
     * @method destructor
     */
    destructor: function() {
      [this.services, this.relations,
        this.machines, this.units,
        this.charms, this.environment,
        this.notifications].forEach(function(ml) {
        ml.detachAll();
        ml.destroy();
      });
    },

    /*
     * Model Id is a [db[model_list_name], model.get('id')]
     * sequence that can be used to lookup models relative
     * to the Database.
     *
     * getModelById can be called with either a modelId
     * or model_type, model_id as individual parameters
     */
    getModelById: function(modelList, id, data) {
      if (!Y.Lang.isValue(id)) {
        id = modelList[1];
        modelList = modelList[0];
      }
      modelList = this.getModelListByModelName(modelList);
      if (!modelList) {
        return undefined;
      }
      return modelList.getById(id);
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
      if (entityName === 'env') {
        return this.environment;
      }
      if (/^\d+$/.test(entityName)) {
        return this.machines.getById(entityName);
      }

      if (/^\S+\/\d+$/.test(entityName)) {
        return this.units.getById(entityName);
      }

      return this.services.getById(entityName);
    },

    /**
      Returns a modelList given the model name.

      @method getModelListByModelName
      @param {String} modelName The model's name.
      @return {Object} The model list.
    */
    getModelListByModelName: function(modelName) {
      if (modelName === 'serviceUnit') {
        modelName = 'unit';
      } else if (modelName === 'annotations' || modelName === 'environment') {
        return this.environment;
      }
      return this[modelName + 's'];
    },

    getModelFromChange: function(change) {
      var change_type = change[0],
          change_kind = change[1],
          data = change[2],
          model_id = change_kind === 'remove' &&
          data || data.id;
      return this.getModelById(change_type, model_id, data);
    },

    reset: function() {
      this.services.reset();
      this.machines.reset();
      this.charms.reset();
      this.relations.reset();
      this.units.reset();
      this.notifications.reset();
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

      // Update service unit aggregates.
      this.services.each(function(service) {
        self.units.update_service_unit_aggregates(service);
      });
      this.fire('update');
    },

    /**
      Add a relation between two services.

      @method addRelation
      @param {String} endpointA A string representation of the service name
        and endpoint connection type ie) wordpress:db.
      @param {String} endpointB A string representation of the service name
        and endpoint connection type ie) wordpress:db.
      @param {Boolean} ghost When true this is a pending relationship.
      @return {Object} new relation.
    */
    addRelation: function(endpointA, endpointB, ghost) {
      if ((typeof endpointA !== 'string') ||
          (typeof endpointB !== 'string')) {
        return {error: 'Two string endpoint names' +
              ' required to establish a relation'};
      }

      // Parses the endpoint strings to extract all required data.
      var endpointData = this.relations
                              .parseEndpointStrings(this,
                                                    [endpointA, endpointB]);

      // This error should never be hit but it's here JIC
      if (!endpointData[0].charm || !endpointData[1].charm) {
        throw new Error('Required charm for relation endpoint not loaded');
      }
      // If there are matching interfaces this will contain an object of the
      // charm interface type and scope (if supplied).
      var match = this.relations.findEndpointMatch(endpointData);

      // If there is an error fetching a valid interface and scope
      if (match.error) { return match; }

      // Assign a unique relation id which is incremented after every
      // successful relation.
      var relationId = 'relation-' + this._relationCount;
      // The ordering of requires and provides is stable in Juju Core, and not
      // specified in PyJuju.
      var endpoints = Y.Array.map(
          [match.requires, match.provides],
          function(endpoint) {
            var result = [];
            result.push(endpoint.name);
            result.push({name: endpoint.type});
            return [endpoint.name, {name: endpoint.type}];
          });
      var relation = this.relations.create({
        relation_id: relationId,
        type: match['interface'],
        endpoints: endpoints,
        pending: Boolean(ghost),
        scope: match.scope || 'global',
        display_name: endpointData[0].type
      });

      if (relation) {
        this._relationCount += 1;
      }
      return relation;

    },


    /**
      Import deployer styled dumps and create the relevant objects in the
      database. This modifies the database its called on directly. \

      Options contains flags controlling import behavior. If 'rewrite-ids' is
      true then import id conflicts will result in the imported object being
      assigned a new id.

      If the deployer data contains multiple bundle definitions then
      'targetBundle' must be included and that bundle will be deployed.

      If 'useGhost' is true then services and relations will be imported as
      ghosts allowing further customization prior to deploy. This defaults to
      true.

      @method importDeployer
      @param {Object} data to import.
      @param {Object} charmStore (with its promiseCharm method).
      @param {Object} options (optional).
      @return {Promise} that the import is complete.
    */
    importDeployer: function(data, charmStore, options) {
      if (!data) {return;}
      options = options || {};
      var self = this;
      var rewriteIds = options.rewriteIds || false;
      var targetBundle = options.targetBundle;
      var useGhost = options.useGhost;
      if (useGhost === undefined) {
        useGhost = true;
      }
      var defaultSeries = self.environment.get('defaultSeries');

      if (!targetBundle && Object.keys(data).length > 1) {
        throw new Error('Import target ambigious, aborting.');
      }

      // Builds out a object with inherited properties.
      var source = targetBundle && data[targetBundle] ||
          data[Object.keys(data)[0]];
      var ancestors = [];
      var seen = [];

      /**
        Helper to build out an inheritence chain

        @method setupinheritance
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

      // Create an id mapping. This will track the ids of objects
      // read from data as they are mapped into db. When options
      // rewriteIds is true this is required for services, but some
      // types of object ids ('relations' for example) can always
      // be rewritten but depend on the use of the proper ids.
      // By building this mapping now we can detect collisions
      // prior to mutating the database.
      var serviceIdMap = {};
      var charms = [];

      /**
       Helper to generate the next valid service id.
       @method nextServiceId
       @return {String} next service id to use.
      */
      function nextServiceId(modellist, id) {
        var existing = modellist.getById(id);
        var count = 0;
        var target;
        while (existing) {
          count += 1;
          target = id + '-' + count;
          existing = modellist.getById(target);
        }
        return target;
      }


      Object.keys(source.services).forEach(function(serviceName) {
        var current = source.services[serviceName];
        var existing = self.services.getById(serviceName);
        var targetId = serviceName;
        if (existing) {
          if (!rewriteIds) {
            throw new Error(serviceName +
                           ' is already present in the database.');
          }
          targetId = nextServiceId(self.services, serviceName);
        }
        serviceIdMap[serviceName] = targetId;

        // Also track any new charms we'll have to add.
        if (current.charm && charms.indexOf(current.charm) === -1) {
          charms.push(charmStore.promiseCharm(current.charm, self.charms,
                                              defaultSeries));
        }
      });

      // If we made it this far its time for mutation, start by importing
      // charms and then services.
      return Y.batch.apply(this, charms)
     .then(function() {
            Object.keys(serviceIdMap).forEach(function(serviceName) {
              var serviceData = source.services[serviceName];
              var serviceId = serviceIdMap[serviceName];
              var charm = self.charms.find(serviceData.charm, defaultSeries);
              var charmId = charm && charm.get('id') || undefined;
              var current = Y.mix(serviceData, {
                id: serviceId, pending: useGhost, charm: charmId
              }, true);
              self.services.add(current);
              // XXX: This is a questionable use case as we are only creating
              // client side objects in the database.  There would ideally be
              // a version of this code that returned a list of Promises that
              // called proper env methods (for all the objects, not just
              // units) to mutate a real env.
              // This however will allow us to import bundles into a fresh
              // database with the intention of only rendering it.
              //if (!useGhost) {}
            });
          })
      .then(function() {
            if (!source.relations) { return; }
            source.relations.forEach(function(relationData) {
              if (relationData.length !== 2) {
                // Skip peer relations
                return;
              }
              self.addRelation(relationData[0], relationData[1], useGhost);
            });
          });

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
      var self = this,
          serviceList = this.services,
          relationList = this.relations,
          result = {
            envExport: {
              series: this.environment.get('defaultSeries'),
              services: {},
              relations: []
            }
          };

      serviceList.each(function(service) {
        var units = service.units;
        var charm = self.charms.getById(service.get('charm'));
        var serviceOptions = {};
        var charmOptions = charm.get('config.options');

        if (service.get('pending') === true) {
          return;
        }

        // Process the service_options removing any values
        // that are the default value for the charm.
        Y.each(service.get('config'), function(value, key) {
          var optionData = charmOptions && charmOptions[key];
          if (!optionData || (optionData && optionData['default'] &&
              (value !== optionData['default']))) {
            serviceOptions[key] = value;
          }
        });

        var serviceData = {
          charm: charm.get('id'),
          // Test models or ghosts might not have a units LazyModelList.
          num_units: units && units.size() || 1
        };
        if (serviceOptions && Y.Object.size(serviceOptions) >= 1) {
          serviceData.options = serviceOptions;
        }
        // Add constraints
        var constraints = service.get('constraintsStr');
        if (constraints) {
          serviceData.constraints = constraints;
        }

        var annotations = service.get('annotations');
        if (annotations && annotations['gui-x']) {
          // XXX: Only expose position. Currently these are position absolute
          // rather than relative.
          serviceData.annotations = {
            'gui-x': annotations['gui-x'],
            'gui-y': annotations['gui-y']
          };
        }
        result.envExport.services[service.get('id')] = serviceData;
      });

      relationList.each(function(relation) {
        var relationData = [];
        Y.each(relation.get('endpoints'), function(data, name) {
          relationData.push(data[0] + ':' + data[1].name);
        });
        // Skip peer, they should add automatically.
        if (relationData.length === 1) {
          return;
        }
        result.envExport.relations.push(relationData);
      });

      return result;
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
    'promise'
  ]
});
