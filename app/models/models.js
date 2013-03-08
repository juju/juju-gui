'use strict';

/**
 * The database models.
 *
 * @module models
 */

YUI.add('juju-models', function(Y) {

  var models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  // This is a helper function used by all of the process_delta methods.
  var _process_delta = function(list, action, change_data, change_base) {
    var model_id = (action === 'remove') && change_data || change_data.id,
        o = list.getById(model_id);

    if (action === 'add' || action === 'change') {
      // Client-side requests may create temporary objects in the
      // database in order to give the user more immediate feedback.
      // The temporary objects are created after the ACK message from
      // the server that contains their actual names.  When the delta
      // arrives for those objects, they already exist in a skeleton
      // form that needs to be fleshed out.  So, the existing objects
      // are kept and re-used.
      var data = change_base || {};
      Y.each(change_data, function(value, name) {
        data[name.replace('-', '_')] = value;
      });
      if (list.createDisplayName) {
        data.displayName = list.createDisplayName(data.id);
      }
      if (!Y.Lang.isValue(o)) {
        o = list.add(data);
      } else {
        if (o instanceof Y.Model) {
          o.setAttrs(data);
        } else {
          // This must be from a LazyModelList.
          Y.each(data, function(value, key) {
            o[key] = value;
          });
        }
      }
    }
    else if (action === 'remove') {
      if (Y.Lang.isValue(o)) {
        list.remove(o);
      }
    } else {
      console.warn('Unknown change kind in _process_delta:', action);
    }
  };

  /**
   * Model a single Environment. Serves as a place to collect
   * Environment level annotations.
   *
   * @class Environment
   **/
  var Environment = Y.Base.create('environment', Y.Model, [], {
    /**
     * Update the annotations on delta events.
     * We don't support removal of the Environment model.
     *
     * @method process_delta
     **/
    process_delta: function(action, data) {
      this.set('annotations', data);
    }
  }, {
    ATTRS: {
      name: {},
      provider: {},
      annotations: {
        valueFn: function() {return {};}
      }
    }
  });
  models.Environment = Environment;

  var Service = Y.Base.create('service', Y.Model, [], {
    ATTRS: {
      displayName: {},
      name: {},
      charm: {},
      config: {},
      constraints: {},
      exposed: {
        value: false
      },
      subordinate: {
        value: false
      },
      pending: {
        value: false
      },
      unit_count: {},
      aggregated_status: {}
    }
  });
  models.Service = Service;

  var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service,
    /**
     * Create a display name that can be used in the views as an entity label
     * agnostic from juju type.
     *
     * @method createDisplayName
     * @param {String} name The name to modify.
     * @return {String} A display name.
     */
    createDisplayName: function(name) {
      return name.replace('service-', '');
    },

    process_delta: function(action, data) {
      _process_delta(this, action, data, {exposed: false});
    }
  }, {
    ATTRS: {
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
      //    idAttribute: 'name',
      {
        ATTRS: {
          displayName: {},
          machine: {},
          agent_state: {},
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

    process_delta: function(action, data) {
      _process_delta(this, action, data, {relation_errors: {}});
    },

    _setDefaultsAndCalculatedValues: function(obj) {
      var raw = obj.id.split('/');
      obj.service = raw[0];
      obj.number = parseInt(raw[1], 10);
      obj.urlName = obj.id.replace('/', '-');
      obj.name = 'serviceUnit'; // This lets us more easily mimic models.
    },

    add: function() {
      var result = ServiceUnitList.superclass.add.apply(this, arguments);
      if (Y.Lang.isArray(result)) {
        Y.Array.each(result, this._setDefaultsAndCalculatedValues);
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
      service.set('unit_count', sum);
      service.set('aggregated_status', aggregate);
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
      instance_state: {},
      agent_state: {}
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
            function(endpoint) { return endpoint[0] === service_id; });
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
     * Currenly this depends on a mapping between the model
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

    /*
     * Model Id is a [db[model_list_name], model.get('id')]
     * sequence that can be used to lookup models relative
     * to the Database.
     *
     * getModelById can be called with either a modelId
     * or model_type, model_id as individual parameters
     */
    getModelById: function(modelList, id) {
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

    getModelListByModelName: function(modelName) {
      if (modelName === 'serviceUnit') {
        modelName = 'unit';
      } else if (modelName === 'annotations') {
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
      return this.getModelById(change_type, model_id);
    },

    reset: function() {
      this.services.reset();
      this.machines.reset();
      this.charms.reset();
      this.relations.reset();
      this.units.reset();
      this.notifications.reset();
    },

    on_delta: function(delta_evt) {
      var changes = delta_evt.data.result;
      var change_type, model_class = null,
          self = this;

      changes.forEach(
          Y.bind(function(change) {
            change_type = change[0];
            this.getModelListByModelName(change_type).process_delta(
                change[1], change[2]);
          }, this));
      this.services.each(function(service) {
        self.units.update_service_unit_aggregates(service);
      });
      this.fire('update');
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
    'juju-endpoints',
    'juju-view-utils',
    'juju-charm-models'
  ]
});
