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

  var ALIVE = 'alive';

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
        units: new models.ServiceUnitList(),
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
      displayName: {
        'getter': function(value) {
          if (value) {
            return value;
          } else {
            return this.get('id').replace('service-', '');
          }
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
            value.split(',').map(function(pair) {
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
            var charm = this.get('charm');
            // If there is no charm as well, well you have bigger problems :)
            // but this helps so that we don't need to provide charm data
            // for every test suite.
            if (charm) {
              charm = charm.split('/');
              charm = charm[charm.length - 1].split('-')[0];
            }
            return charm || undefined;
          }
        }
      },
      /**
        Network ids.
        ex) ['public', 'private']

        @attribute networks
        @type {Array}
      */
      networks: {}
    }
  });
  models.Service = Service;

  var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service,

    /**
      Return a list of visible model instances. A model instance is visible
      when it is alive or dying.

      @method visible
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
        displayName: '(' + charm.get('package_name') + ')',
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
      // If a charm_url is included in the data (that is, the Go backend
      // provides it), get the old charm so that we can compare charm URLs
      // in the future.
      var oldModelCharm;
      if (action === 'change' && data.charmUrl && db) {
        var oldModel = db.resolveModelByName(data.id);
        if (oldModel) {
          oldModelCharm = oldModel.charmUrl;
        }
      }
      var instance = _process_delta(this, action, data, {});
      if (!db) {
        return;
      }
      var service = getServicesfromDelta(instance, data, db);
      // If the charm has changed on this unit in the delta, inform the service
      // of the change (but only if it doesn't already know, so as not to fire
      // a change event).  This is required because the two instances of a)
      // someone watching the GUI after setting a charm on a service, and b)
      // someone else watching the GUI as a service's charm changes, differ in
      // the amount of information the GUI has originally.  By setting this
      // flag, both cases can react in the same way.
      if (oldModelCharm &&
          oldModelCharm !== instance.charmUrl && !service.get('charmChanged')) {
        service.set('charmChanged', true);
      }
      // Some tests add units without creating a service so we need to check
      // for a valid service here.
      if (service) {
        var units = service.get('units');
        _process_delta(units, action, data, {});
        units.fire('deltaChange', { service: service });
      } else {
        // fixTests
        console.error('Units added without matching Service');
      }
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
      agent_state_info: {},
      agent_state_data: {}
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

  var Network = Y.Base.create('network', Y.Model, [], {
    initializer: function() {}
  }, {
    ATTRS: {
      'name': {},
      'cidr': {},
      'networkId': {} // Provider Network ID
    }
  });
  models.Network = Network;

  var NetworkList = Y.Base.create('networkList', Y.ModelList, [], {
    model: Network

  });
  models.NetworkList = NetworkList;

  var Database = Y.Base.create('database', Y.Base, [], {
    initializer: function() {
      // Single model for environment database is bound to.
      this.environment = new Environment();
      this.services = new ServiceList();
      this.charms = new models.CharmList();
      this.relations = new RelationList();
      this.notifications = new NotificationList();
      this.machines = new MachineList();
      this.networks = new NetworkList();

      // For model syncing by type. Charms aren't currently sync'd, only
      // fetched on demand (they're static).
      this.model_map = {
        'unit': ServiceUnit,
        'machine': Machine,
        'service': Service,
        'relation': Relation,
        'network': Network,
        'charm': models.Charm
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
        this.machines, this.networks,
        this.charms, this.environment,
        this.notifications].forEach(function(ml) {
        ml.detachAll();
        ml.destroy();
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
      if (entityName === 'env') {
        return this.environment;
      }
      if (/^\d+$/.test(entityName)) {
        return this.machines.getById(entityName);
      }

      if (/^\S+\/\d+$/.test(entityName)) {
        var service = this.services.getById(entityName.split('/')[0]);
        if (service) {
          return service.get('units').getById(entityName);
        }
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
        throw new Error('Deprecated usage of global unit list');
      } else if (modelName === 'annotations' || modelName === 'environment') {
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
      // (This should select only those elements which
      // had deltas)
      this.services.each(function(service) {
        service.get('units').update_service_unit_aggregates(service);
      });
      this.fire('update');
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
        var charm = self.charms.getById(service.get('charm'));
        var serviceOptions = {};
        var charmOptions = charm.get('options');

        if (service.get('pending') === true) {
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
        if (!charm.get('is_subordinate')) {
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
