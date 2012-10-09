'use strict';

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
          // XXX Fire model changed event manually if we need it later?
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

  // This is how the charm_id_re regex works for various inputs.  The first
  // element is always the initial string, which we have elided in the
  // examples.
  // 'cs:~marcoceppi/precise/word-press-17' ->
  // [..."cs", "marcoceppi", "precise", "word-press", "17"]
  // 'cs:~marcoceppi/precise/word-press' ->
  // [..."cs", "marcoceppi", "precise", "word-press", undefined]
  // 'cs:precise/word-press' ->
  // [..."cs", undefined, "precise", "word-press", undefined]
  // 'cs:precise/word-press-17'
  // [..."cs", undefined, "precise", "word-press", "17"]
  var charm_id_re = /^(?:(\w+):)?(?:~(\S+)\/)?(\w+)\/(\S+?)(?:-(\d+))?$/,
      parse_charm_id = function(id) {
        var parts = charm_id_re.exec(id),
            result = {};
        if (parts) {
          parts.shift();
          Y.each(
              Y.Array.zip(
                  ['scheme', 'owner', 'series', 'package_name', 'revision'],
                  parts),
              function(pair) { result[pair[0]] = pair[1]; });
          if (!Y.Lang.isValue(result.scheme)) {
            result.scheme = 'cs'; // This is the default.
          }
          return result;
        }
        // return undefined;
      },
      _calculate_full_charm_name = function(elements) {
        var tmp = [elements.series, elements.package_name];
        if (elements.owner) {
          tmp.unshift('~' + elements.owner);
        }
        return tmp.join('/');
      };
  // This is exposed for testing purposes.
  models.parse_charm_id = parse_charm_id;

  var Charm = Y.Base.create('charm', Y.Model, [], {
    sync: function(action, options, callback) {
      if (action !== 'read') {
        throw (
            'Only use the "read" action; "' + action + '" not supported.');
      }
      if (!Y.Lang.isValue(options.env) ||
          !Y.Lang.isValue(options.charm_store)) {
        throw 'You must supply both the env and the charm_store as options.';
      }
      var scheme = this.get('scheme'),
          charm_id = this.get('id'),
          revision = this.get('revision'),
          self = this; // cheap, fast bind.
      // Now, is the id local: or cs: ?
      if (scheme === 'local') {
        // Warning!  We don't have experience with local charms yet.
        // This will likely need tweaking.
        if (Y.Lang.isValue(revision)) {
          // Local charms can honor the revision.
          charm_id += '-' + revision;
        }
        options.env.get_charm(charm_id, function(ev) {
          if (ev.err) {
            console.log('error loading local charm', self, ev);
            callback(true, ev);
          } else {
            callback(false, ev.result); // Result is already parsed.
          }
        });
      } else if (scheme === 'cs') {
        // Convert id to charmstore path.
        options.charm_store.sendRequest({
          request: this.get('charm_store_path'),
          callback: {
            'success': function(io_request) {
              callback(false, io_request.response.results[0].responseText);
            },
            'failure': function(ev) {
              console.log('error loading cs charm', self, ev);
              callback(true, ev);
            }
          }
        });
      } else {
        console.error('unknown charm id scheme: ' + scheme, this);
      }
    },
    parse: function() {
      var result = Charm.superclass.parse.apply(this, arguments);
      result.is_subordinate = result.subordinate;
      Y.each(
          ['subordinate', 'name', 'revision'],
          function(nm) { delete result[nm]; });
      return result;
    }
  }, {
    ATTRS: {
      id: {
        lazyAdd: false,
        setter: function(val) {
          var parts = parse_charm_id(val),
              self = this;
          if (!parts) {
            return null;
          }
          Y.each(parts, function(value, key) {
            self._set(key, value);
          });
          this._set(
              'charm_store_path',
              [(parts.owner ? '~' + parts.owner : 'charms'),
               parts.series, parts.package_name, 'json']
            .join('/'));
          this._set('full_name', _calculate_full_charm_name(parts));
          return parts.scheme + ':' + this.get('full_name');
        },
        validator: function(val) {
          return Y.Lang.isValue(charm_id_re.exec(val));
        }
      },
      // All of the below are loaded except as noted.
      bzr_branch: {writeOnce: true},
      charm_store_path: {readOnly: true}, // calculated
      config: {writeOnce: true},
      description: {writeOnce: true},
      full_name: {readOnly: true}, // calculated
      is_subordinate: {writeOnce: true},
      last_change:
            { writeOnce: true,
              setter: function(val) {
                if (val && val.created) {
                  // Mutating in place should be fine since this should only
                  // come from loading over the wire.
                  val.created = new Date(val.created * 1000);
                }
                return val;
              }
            },
      maintainer: {writeOnce: true},
      metadata: {writeOnce: true},
      package_name: {readOnly: true}, // calculated
      owner: {readOnly: true}, // calculated
      peers: {writeOnce: true},
      proof: {writeOnce: true},
      provides: {writeOnce: true},
      requires: {writeOnce: true},
      revision: {readOnly: true}, // calculated
      scheme: {readOnly: true}, // calculated
      series: {readOnly: true}, // calculated
      summary: {writeOnce: true},
      url: {writeOnce: true}
    }
  });
  models.Charm = Charm;

  var CharmList = Y.Base.create('charmList', Y.ModelList, [], {
    model: Charm,
    getById: function(id) {
      // Normalize ids to not have revision numbers.
      // Eventually it would be nice to be able to use revision numbers,
      // but the charm store can't handle it, so we stick with the lowest
      // common denominator: ids without revision numbers.
      return CharmList.superclass.getById.apply(
          this, [this.normalizeCharmId(id)]);
    },
    normalizeCharmId: function(id) {
      var match = parse_charm_id(id);
      if (match) {
        return match.scheme + ':' + _calculate_full_charm_name(match);
      }
      return undefined;
    }
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
      subordinate: {
        value: false
      },
      unit_count: {},
      aggregated_status: {}
    }
  });
  models.Service = Service;

  var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service,

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
        var state = utils.simplifyState(unit.agent_state);
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
      }
    }
  });
  models.Relation = Relation;

  var RelationList = Y.Base.create('relationList', Y.ModelList, [], {
    model: Relation,

    process_delta: function(action, data) {
      _process_delta(this, action, data, {});
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
      this.charms = new CharmList();
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
      console.log('Reset Application Database');
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
            this.getModelListByModelName(change_type).process_delta(
                change[1], change[2]);
          }, this));
      this.services.each(function(service) {
        self.units.update_service_unit_aggregates(service);
      });
      this.fire('update');
      console.groupEnd();
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
    'juju-view-utils'
  ]
});
