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
      config: {},
      // Annotations on service are an empty dict
      // rather than undefined. This helps make
      // some checks in the code simpler to write.
      // Units still default to undefined as a way
      // to help support scale.
      annotations: {value: {}},
      constraints: {},
      constraintsStr: {
        getter: function() {
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
      var instance = _process_delta(this, action, data, {relation_errors: {}});
      if (!instance || !db) {return;}
      // Apply this action for this instance to all service models as well.
      // In the future we can transition from using db.units to always
      // looking at db.services[serviceId].units
      var service = db.services.getById(instance.service);
      if (!service) { return; }
      // Get the unit list for this service. (lazy)
      var unitList = service.get('units');
      if (!unitList) {
        unitList = new models.ServiceUnitList();
        service.set('units', unitList);
      }
      _process_delta(unitList, action, data, {relation_errors: {}});
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
      var aggregate_map = {}, aggregate_list = [],
          units_for_service = this.get_units_for_service(service);

      units_for_service.forEach(function(unit) {
        var state = utils.simplifyState(unit);
        if (aggregate_map[state] === undefined) {
          aggregate_map[state] = 1;
        }
        else {
          aggregate_map[state] += 1;
        }

      });

      return aggregate_map;
    },

    /*
     * Updates a service's unit count and aggregate state map during a
     * delta, ensuring that they're up to date.
     */
    update_service_unit_aggregates: function(service) {
      var aggregate = this.get_informative_states_for_service(service);
      var sum = Y.Array.reduce(
          Y.Object.values(aggregate), 0, function(a, b) {return a + b;});
      var previous_unit_count = service.get('unit_count');
      service.set('unit_count', sum);
      service.set('aggregated_status', aggregate);

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

    process_delta: function(action, data) {
      _process_delta(this, action, data, {});
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
          modelList = modelId[0],
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
      this.charms = new models.CharmList();
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
        'charm': models.Charm
      };
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
     * Export deployer formatted dump of the current environment.
     * Note: When we have a selection UI in place this should honor
     * that.
     *
     * @method exportDeployer
     * @param {Object} db for application.
     * @return {Object} export object suitable for serialization.
     */
    exportDeployer: function() {
      var self = this,
          serviceList = this.services,
          relationList = this.relations,
          result = {
            export: {
              series: this.environment.get('defaultSeries'),
              services: [],
              relations: []
          }
        };

      serviceList.each(function(s) {
        var units = s.units;
        var charm = self.charms.getById(s.get('charm'));
        if (s.get('pending') === true) {return;}
        var serviceData = {
          // Using package name here so the default series
          // is picked up. This will likely have to be the full
          // path in the future.
          charm: charm.get('package_name'),
          options: s.get('config'),
          num_units: units && units.size() || 1
        };
        // Add constraints
        var constraints = s.get('constraintsStr');
        if (constraints) {
          serviceData.constraints = constraints;
        }
        result.export.services.push(serviceData);
      });

      relationList.each(function(r) {
        var relationData = [];
        Y.each(r.get('endpoints'), function(data, name) {
          relationData.push([data[0], data[1].name]);
        });
        // Skip peer, they should add automatically.
        if (relationData.length === 1) {
          return;
        }
        result.export.relations.push(relationData);
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
    'juju-charm-models'
  ]
});
