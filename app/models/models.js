'use strict';

YUI.add('juju-models', function(Y) {

  var models = Y.namespace('juju.models');

  var Charm = Y.Base.create('charm', Y.Model, [], {
    idAttribute: 'charm_id',
    charm_id_re: /((\w+):)?(\w+)\/(\S+)-(\d+)/,
    parse_charm_id: function(id) {
      if (!id) {
        id = this.get('id');
      }
      return this.charm_id_re.exec(id);
    }
  }, {
    ATTRS: {
      charm_id: {},
      name: {
        valueFn: function(name) {
          var match = this.parse_charm_id();
          if (match) {
                        return match[3] + '/' + match[4];
          }
          return undefined;
        }
      },
      url: {},
      description: {},
      config: {},
      metadata: {},
      sha256: {}
    }
  });
  models.Charm = Charm;

  var CharmList = Y.Base.create('charmList', Y.ModelList, [], {
    model: Charm
  }, {
    ATTRS: {}
  });
  models.CharmList = CharmList;

  var Service = Y.Base.create('service', Y.Model, [], {
    ATTRS: {
      name: {},
      charm: {},
      config: {},
      constraints: {},
      exposed: {
        value: false
      },
      relations: {},
      unit_count: {},
      aggregated_status: {}
    }
  });
  models.Service = Service;

  var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service
  }, {
    ATTRS: {
    }
  });
  models.ServiceList = ServiceList;

  var ServiceUnit = Y.Base.create('serviceUnit', Y.Model, [], {},
      //    idAttribute: 'name',
      {
        ATTRS: {
          machine: {},
          agent_state: {},
          // relations to unit relation state.
          relations: {},

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
        var state = unit.agent_state;
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

  var Machine = Y.Base.create('machine', Y.Model, [], {
    idAttribute: 'machine_id'
  }, {
    ATTRS: {
      machine_id: {},
      public_address: {},
      instance_id: {},
      instance_state: {},
      agent_state: {}
    }
  });
  models.Machine = Machine;

  var MachineList = Y.Base.create('machineList', Y.ModelList, [], {
    model: Machine
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
      endpoints: {}
    }
  });
  models.Relation = Relation;

  var RelationList = Y.Base.create('relationList', Y.ModelList, [], {}, {
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
          if (Y.Lang.isArray(model)) {return model;}
          return Y.mix(
              [model.name,
               (model instanceof Y.Model) ? model.get('id') : model.id]);
        }},
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
      this.services = new ServiceList();
      this.machines = new MachineList();
      this.charms = new CharmList();
      this.relations = new RelationList();
      this.notifications = new NotificationList();

      // This one is dangerous.. we very well may not have capacity
      // to store a 1-1 representation of units in js.
      // At least we should never assume the collection is complete, and
      // have usage of some ephemeral slice/cursor of the collection.
      // Indexed db might be interesting to explore here, with object delta
      // and bulk transfer feeding directly into indexedb.
      // Needs some experimentation with a large data set.
      this.units = new ServiceUnitList();

      // For model syncing by type. Charms aren't currently sync'd, only
      // fetched on demand (their static).
      this.model_map = {
        'unit': ServiceUnit,
        'machine': Machine,
        'service': Service,
        'relation': Relation,
        'charm': Charm
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
      return modelList.getById(id);
    },

    getModelListByModelName: function(modelName) {
      if (modelName === 'serviceUnit') {
        modelName = 'unit';
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
      console.groupCollapsed('Delta');
      console.log('Delta', this, changes);
      var change_type, model_class = null,
          self = this;

      changes.forEach(
          Y.bind(function(change) {
            change_type = change[0];
            console.log('change', this, change);
            var model_list = this.getModelListByModelName(change_type);
            this.process_model_delta(change, model_list);
          }, this));
      this.services.each(function(service) {
        self.units.update_service_unit_aggregates(service);
      });
      this.fire('update');
      console.groupEnd();
    },

    process_model_delta: function(change, model_list) {
      // console.log('model change', change);
      var change_kind = change[1],
          o = this.getModelFromChange(change);

      if (change_kind === 'add' || change_kind === 'change') {
        // Client-side requests may create temporary objects in the
        // database in order to give the user more immediate feedback.
        // The temporary objects are created after the ACK message from
        // the server that contains their actual names.  When the delta
        // arrives for those objects, they already exist in a skeleton
        // form that needs to be fleshed out.  So, the existing objects
        // are kept and re-used.
        var data = {};
        Y.each(change[2], function(value, name) {
          data[name.replace('-', '_')] = value;
        });
        if (!Y.Lang.isValue(o)) {
          o = model_list.add(data);
        } else {
          if (o instanceof Y.Model) {
            o.setAttrs(data);
          } else {
            // This must be from a LazyModelList.
            Y.each(data, function(value, key) {
              o[key] = value;
            });
            // XXX Fire model changed event manually if we need it later?
          }
        }
      }
      else if (change_kind === 'remove') {
        if (Y.Lang.isValue(o)) {
          model_list.remove(o);
        }
      } else {
        console.warn('Unknown change kind in process_model_delta:',
            change_kind);
      }
    }

  });

  models.Database = Database;

  Y.namespace('juju').db = new Database({});

}, '0.1.0', {
  requires: [
    'model',
    'model-list',
    'lazy-model-list'
  ]
});
