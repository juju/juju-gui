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

  // Define strings representing juju-core entities' Life state.
  var ALIVE = 'alive';
  var DYING = 'dying';

  // This is a helper function used by all of the process_delta methods.
  var _process_delta = function(list, action, change_data, change_base) {
    var instanceId;
    if (typeof change_data === 'object') {
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
        exists = utils.isValue(instance);

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
          var changed = {};
          Object.keys(data).forEach(key => {
            const value = data[key];
            if (value === undefined) {
              // A delta in the real environment doesn't send undefined
              // values so this makes the simulated environment work properly.
              return;
            }
            changed[key] = {prevVal: instance[key], newVal: value};
            instance[key] = value;
          });
          // Lazy model lists don't fire change events
          list.fire('change', {changed: changed, instance: instance});
        }
      }
    } else if (action === 'remove') {
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
      jujushellURL: {},
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
        units: new models.ServiceUnitList({preventDirectChanges: true})
      });
    },

    /**
      Updates the appropriate configuration objects based on the passed in
      delta from handlers.js or legacy-handlers.js.

      @method updateConfig
      @param {Object} changeConfig The configuration change delta.
    */
    updateConfig: function(changeConfig) {
      changeConfig = changeConfig || {};
      // Set up config options.
      var serviceConfig = this.get('config') || {};
      var combined = Y.merge(serviceConfig, changeConfig);
      // Compare the local and new config objects.
      // Update the environmentConfig config options with the values as they are
      // in the real Juju environment. This should never be
      // done by anything but this method so that it says as representation of
      // the config options as juju sees it.
      this.set(
        'environmentConfig',
        Y.merge(this.get('environmentConfig'), changeConfig));
      // Update the config property with the appropriate values.
      this.set('config', combined);
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
      return (life === ALIVE || life === DYING);
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
      @param {Object} db The application DB.
      @param {String} relationId The id of the relation to remove.
    */
    removeRelations: function(db, relationId) {
      const relations = db.relations.get_relations_for_service(this);
      relations.some(function(rel) {
        if (rel.get('relation_id') === relationId) {
          relations.remove(rel);
          return true;
        }
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
        'getter': function(val) {
          var name = val || this.get('id').replace('service-', '');
          if (this.get('pending')) {
            name = '(' + name + ')';
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
        },
        'setter': function(value) {
          // Update the ecs with the new application name.
          const ecs = models._getECS();
          const currentName = this.get('name');
          const changeSet = ecs.changeSet;
          Object.keys(changeSet).forEach(key => {
            const change = changeSet[key];
            const method = change.command.method;
            if (method === '_add_unit') {
              if (change.command.args[0] === currentName) {
                change.command.args[0] = value;
              }
            } else if (method === '_deploy') {
              if (change.command.args[0].applicationName === currentName) {
                change.command.args[0].applicationName = value;
              }
            }
          });
          return value;
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
          const constraints = this.get('constraints') || {};
          Object.keys(constraints).forEach(k => {
            const v = constraints[k];
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
      /**
        Whether the service's charm is a subordinate charm.

        @attribute subordinate
        @type {Boolean}
      */
      subordinate: {
        value: false
      },
      pending: {
        value: false
      },
      life: {
        value: ALIVE
      },
      /**
        The application status, as an object with the following attributes:
        - current: current status, for instance "idle" or "executing";
        - message: arbitrary status message set by users;
        - data: additional status data as an object, mostly unused;
        - since: date of the last status change, for instance
          "2015-12-16T12:35:27.873828132+01:00".
        This info is included in the Juju mega-watcher for applications.

        @attribute status
        @type {Object}
        @default {}
      */
      status: {
        value: {}
      },
      unit_count: {},

      /**
        The application workload version.
        This is the optional version of the service provided by this
        application, for  instance the postgreSQL version.

        @attribute workloadVersion
        @type {String}
        @default ''
      */
      workloadVersion: {},

      /**
        The services current units.
        modellist

        @attribute units
        @default {}
        @type {ServiceUnitList}
      */
      units: {},

      /**
        An aggregate of the relation errors that we use to trigger
        databinding changes

        @attribute aggregateRelationError
        @default {}
        @type {Object}
      */
      aggregateRelationError: {},

      /**
        A collection of available versions for the charm. This is populated
        when the user clicks to change their charm version in the inspector.

        @attribute available_versions
        @default undefined
        @type {Array}
      */
      available_versions: {},

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
      },

      /**
        The highlight flag, service-level edition.

        @attribute highlight
        @type {Boolean}
        @default false
      */
      highlight: {
        value: false
      },

      /**
        The hide flag, service-level edition.

        @attribute hide
        @type {Boolean}
        @default false
      */
      hide: {
        value: false
      },

      /**
        The fade flag, service-level edition.

        @attribute fade
        @type {Boolean}
        @default false
      */
      fade: {
        value: false
      },

      /**
        An object containing the active plan for this application. It should be
        null if a request has been made and there were none.

        @attribute activePlan
        @type {Object}
        @default undefined
      */
      activePlan: {},

      /**
        In a multi-series charm the series of the service will not always
        match the one specified as the preferred series in the charm.

        @attribute series
        @type {String}
        @default undefined
      */
      series: {}
    }
  });
  models.Service = Service;

  var ServiceList = Y.Base.create('serviceList', Y.ModelList, [], {
    model: Service,

    /**
      When you have a ghost service its name will be user readable but its id
      will not be. This causes the getById method to fail in fetching the
      proper service.

      Pass either a service model id or the display name into this method and
      it will return the appropriate service model.

      @method getServiceByName
      @param {String} serviceName The service name or id.
      @return {Object} The found service or null.
    */
    getServiceByName: function(serviceName) {
      var service = this.getById(serviceName);
      // If we found it as the id then return;
      if (service !== null) {
        return service;
      } else {
        this.some(function(serv) {
          if (serv.get('name') === serviceName) {
            service = serv;
            return true;
          }
        });
      }
      return service;
    },

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
      Filter the service model list to only include principals.
      In essence, the resulting list does not include services deployed from
      a subordinate charm.

      @method principals
      @return {ModelList} A list of non-subordinate services.
    */
    principals: function() {
      return this.filter({asList: true}, function(service) {
        return !service.get('subordinate');
      });
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
      Convert the number passed in into a alphabet representation. Starting
      from 1, 0 will return ?Z.
      ex) 2 = B, 27 = AA, 38 = AL ...
      @param {Integer} num The number to convert to an alphabet.
      @returns {String} The alphabet representation.
    */
    _numToLetter: function(num) {
      // Because num can be more than 26 we need to reduce it down to a value
      // between 0 and 26 to match alphabets.
      var remainder = num % 26;
      // Reduce it down to the number of characters we need, since we only have
      // 26 characters any multiple of that will require us to add more.
      var multiple = num / 26 | 0;
      var char = '';
      // remainder will be 0 if number is 26 (Z)
      if (remainder) {
        // 96 is the start of lower case alphabet.
        char = String.fromCharCode(96 + remainder);
      } else {
        // subtract 1 from the multiple if remainder is 0 and add a Z;
        multiple--;
        char = 'z';
      }
      // If there are multiple characters required then recurse else
      // return the value of char.
      return multiple ? this._numToLetter(multiple) + char : char;
    },

    /**
      Convert the string passed in into a number representation.
      ex) B = 2, AA = 27, AL = 38 ...
      @returns {String} str The string to convert to a number.
      @returns {Integer} The number representation.
    */
    _letterToNum: function(str) {
      var num = 0;
      var characters = str.split('');
      var characterLength = characters.length;
      characters.forEach((letter, characterPosition) => {
        // Use the character position to calculate the base for this character.
        // The last character needs to have a base of 0 so we subtract one from
        // the position.
        var base = Math.pow(26, characterLength - characterPosition - 1);
        // Use the character code to get the number value for the letter. 96 is
        // the start of lower case alphabet.
        num += base * (str.charCodeAt(characterPosition) - 96);
      });
      return num;
    },

    /**
      Generate a name for a service with an incremented number if needed.
      @param {String} charmName The charm name.
      @param {Object} services the list of services.
      @param {Integer} counter The optional increment counter.
      @returns {String} The name for the service.
    */
    _generateServiceName: function(charmName, services, counter = 0) {
      // There should only be a counter in the charm name after the first one.
      var name = counter > 0 ?
        charmName + '-' + this._numToLetter(counter) : charmName;
      // Check each service to see if this counter is being used.
      var match = services.some(service => {
        return service.get('name') === name;
      });
      // If there is no match return the new name, otherwise check the next
      // counter.
      return match ? this._generateServiceName(
        charmName, services, counter += 1) : name;
    },

    /**
     Add a ghost (pending) service to the
     database. The canvas should pick this up
     independently.

     @method ghostService
     @param {Model} charm to add.
     @param {String} charmName An optional name for this charm.
     @return {Model} Ghosted Service model.
   */
    ghostService: function(charm, charmName) {
      var config = charm && charm.get('config');
      var randomId, invalid = true;

      do {
        // The $ appended to the end is to guarantee that an id coming from Juju
        // will never clash with the randomly generated ghost id's in the GUI.
        randomId = Math.floor(Math.random() * 100000000) + '$';
        // Don't make functions within a loop
        invalid = this.some(function(service) {
          if (service.get('id') === randomId) {
            return true;
          }
        });
      } while (invalid);

      var charmId = charm.get('id');
      if (!charmName) {
        charmName = charm.get('package_name');
      }
      var name = this._generateServiceName(charmName, this);
      var ghostService = this.create({
        // Creating a temporary id because it's undefined by default.
        id: randomId,
        displayName: name,
        name: name,
        annotations: {},
        pending: true,
        charm: charmId,
        unit_count: 0, // No units yet.
        loaded: false,
        subordinate: charm.get('is_subordinate'),
        config: config
      });
      return ghostService;
    },

    /**
      Process service changes coming in from juju-core.

      @method process_delta
      @param {String} action The type of change: 'change', 'remove', 'add'
      @param {Object} data The data for the model being updated
    */
    process_delta: function(action, data) {
      _process_delta(this, action, data, {exposed: false});
    }
  });

  models.ServiceList = ServiceList;

  /**
    A remote service exposes relation endpoints offered from this model or
    from a remote Juju model, either in the same controller on across multiple
    controllers via the Juju environment manager.

    @class RemoteService
  */
  var RemoteService = Y.Base.create('remoteService', Y.Model, [], {
    // The service URL uniquely represents a remote service.
    idAttribute: 'url',

    /**
      Report whether this remote service is alive.
      Return true if the service life is 'alive' or 'dying', false otherwise.

      @method isAlive
      @return {Boolean} Whether this remote service is alive.
    */
    isAlive: function() {
      var life = this.get('life');
      return (life === ALIVE || life === DYING);
    },

    /**
      Store more details to this remote service.

      Details are usually retrieved calling "env.getOffer()" where env is the
      Go Juju environment implementation. The above results in a call to
      "ServiceOffers" on the "CrossModelRelations" Juju API facade.
      The invariant here is that data provided to the env.getOffer() callback,
      if data.err is not defined, can be passed as is to this function as the
      details parameter. This way is easy to immediately enrich the database
      with information taken from the Juju API.

      @method addDetails
      @param {Object} details A data object with the following attributes:
        - description: the human friendly description for the remote service;
        - sourceName: the label assigned to the source Juju model;
        - endpoints: the list of offered endpoints.
          Each endpoint must have the following attributes:
          - name: the endpoint name (e.g. "db" or "website");
          - interface: the endpoint interface (e.g. "http" or "mysql");
          - role: the role for the endpoint ("requirer" or "provider").
        Any other attribute in details is ignored.
    */
    addDetails: function(details) {
      this.setAttrs({
        description: details.description,
        sourceName: details.sourceName,
        endpoints: details.endpoints
      });
    }
  }, {
    // Define remote service attributes.
    ATTRS: {
      /**
        The remote service URL, assigned to the service when it was originally
        offered. For instance "local:/u/admin/ec2/django".
        This info is included in the Juju mega-watcher for remote services.

        @attribute url
        @type {String}
      */
      url: {},
      /**
        The remote service name, for instance "django" or "haproxy".
        This info is included in the Juju mega-watcher for remote services.

        @attribute service
        @type {String}
      */
      service: {},
      /**
        The UUID of the original Juju model from which this service is offered.
        This info is included in the Juju mega-watcher for remote services.

        @attribute sourceId
        @type {String}
      */
      sourceId: {},
      /**
        The remote service life cycle status ("alive", "dying" or "dead").
        This info is included in the Juju mega-watcher for remote services.

        @attribute life
        @type {String}
      */
      life: {},
      /**
        The remote service status, as an object with the following attributes:
        - current: current status, for instance "idle" or "executing";
        - message: arbitrary status message set by users;
        - data: additional status data as an object, mostly unused;
        - since: date of the last status change, for instance
          "2015-12-16T12:35:27.873828132+01:00".
        This info is included in the Juju mega-watcher for remote services.

        @attribute status
        @type {Object}
        @default {}
      */
      status: {
        value: {}
      },
      /**
        The description of the remote service features and capabilities.
        This info is NOT included in the Juju mega-watcher and can be provided
        directly or by calling addDetails on the model instance.

        @attribute description
        @type {String}
      */
      description: {},
      /**
        The name of the original Juju model from which this service is offered.
        This info is NOT included in the Juju mega-watcher and can be provided
        directly or by calling addDetails on the model instance.

        @attribute sourceName
        @type {String}
      */
      sourceName: {},
      /**
        The offered endpoints, as a collection of objects with the following
        attributes:
        - name: the endpoint name (e.g. "db" or "website");
        - interface: the endpoint interface (e.g. "http" or "mysql");
        - role: the role for the endpoint ("requirer" or "provider").
        This info is NOT included in the Juju mega-watcher and can be provided
        directly or by calling addDetails on the model instance.

        @attribute endpoints
        @type {Array of objects}
        @default []
      */
      endpoints: {
        value: []
      }
    }
  });
  models.RemoteService = RemoteService;

  /**
    A list of remote services.

    @class RemoteServiceList
  */
  var RemoteServiceList = Y.Base.create('remoteServiceList', Y.ModelList, [], {
    model: RemoteService,

    /**
      Process remote service changes coming in from juju-core.

      @method process_delta
      @param {String} action The type of change: 'change', 'remove', 'add'.
      @param {Object} data The data for the model being updated.
    */
    process_delta: function(action, data) {
      _process_delta(this, action, data);
    }
  });
  models.RemoteServiceList = RemoteServiceList;


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
        // workloadStatusMessage is a string including the workload status
        // message, like "installing charm software" or whatever is set using
        // status-set in charms. This attribute is only available when using
        // Juju 2.
        workloadStatusMessage: {},
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
        /**
          If the unit has been marked as hidden when another was highlighted.

          @attribute hide
          @type {Boolean}
          @default false
        */
        hide: {
          value: false
        },
        /**
          If the unit has been marked as faded.

          @attribute fade
          @type {Boolean}
          @default false
        */
        fade: {
          value: false
        },
        config: {},
        /**
          Whether the unit belongs to a service deployed from a subordinate
          charm.

          @attribute subordinate
          @type {Boolean}
        */
        subordinate: {
          value: false
        },
        portRanges: {},
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

    /**
      Process unit changes coming in from juju-core.

      @method process_delta
      @param {String} action The type of change: 'change', 'remove', 'add'
      @param {Object} data The data for the model being updated
      @param {Object} db The database containing the model being updated
    */
    process_delta: function(action, data, db) {
      // If a charm URL is included in the data (that is, the Go backend
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
      // Copy the visibility flags from the service onto the unit.
      instance.hide = service.get('hide');
      instance.fade = service.get('fade');
      instance.highlight = service.get('highlight');
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
      if (Array.isArray(models)) {
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
            } else {
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
          return !unit.machine && !unit.subordinate;
        };
      }
      machine = machine || null;
      return this.filter(predicate);
    },

    /**
      Return a list of all the units with a given status

      If status is null it will return the full list of units.

      @method filterByStatus
      @param {String} status The status to filter by.
      @return {Array} The matching units as a list of objects.
    */
    filterByStatus: function(status) {
      if (!status) {
        return this.toArray();
      }
      return this.filter(function(unit) {
        var agentState = unit.agent_state || 'uncommitted';
        if (agentState === status) {
          return unit;
        }
      });
    },

    /*
      Given one of the many agent states returned by juju-core,
      return a simplified version.
      @param {Object} unit A service unit.
      @param {String} life The life status of the units service.
      @return {String} the filtered agent state of the unit.
    */
    _simplifyState: function(unit, life) {
      var state = unit.agent_state,
          inError = (/-?error$/).test(state);
      if (!state) {
        //Uncommitted units don't have state.
        return 'uncommitted';
      }
      if (life === 'dying' && !inError) {
        return 'dying';
      } else {
        if (state === 'started') { return 'running'; }
        if (inError) { return 'error'; }
        // "pending", "installed", and "stopped", plus anything unforeseen
        return state;
      }
    },

    /**
      Determines the category type for the unit status list of the inspector.
      @param {String} category The category name to test.
      @return {String} The category type
        'error', 'landscape', 'pending', 'running'
    */
    _determineCategoryType: function(category) {
      if ((/fail|error/).test(category)) { return 'error'; }
      if ((/landscape/).test(category)) { return 'landscape'; }
      if (category === 'running') { return 'running'; }
      if (category === 'uncommitted') { return 'uncommitted'; }
      return 'pending';
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
        var state = units_for_service._determineCategoryType(
          units_for_service._simplifyState(unit, serviceLife));
        if (aggregate_map[state] === undefined) {
          aggregate_map[state] = 1;
        } else {
          aggregate_map[state] += 1;
        }
        if (state === 'error') {
          // If in error status then we need to parse out why it's in error.
          var info = unit.agent_state_info;
          if (info !== undefined && info.indexOf('failed') > -1) {
            // If we parse more than the relation info then split this out.
            if (info.indexOf('relation') > -1) {
              var stateData = unit.agent_state_data;
              if (stateData) {
                var remoteUnit = stateData['remote-unit'];
                // The remote unit is not present when the kind of the relation
                // hook in error is "broken".
                var svc = remoteUnit ? remoteUnit.split('/')[0] : unit.service;
                relationError[svc] = stateData.hook;
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
      var sum = Object.keys(aggregate[0]).map(k => aggregate[0][k]).reduce(
        (a, b) => {return a + b;}, 0);
      var previous_unit_count = service.get('unit_count');
      service.set('unit_count', sum);
      service.set('aggregated_status', aggregate[0]);
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
        The committed status of the machine. Possible values are 'uncommitted',
        'in-progress' and 'committed'.

        @attribute commitStatus
        @type {String}
        @default undefined
      */
      commitStatus: {},
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
        - number {String}: the machine or container number.
          E.g. the number of container "2/lxc/0" is "0", the number of machine
          "42" is "42".
    */
    parseMachineName: function(name) {
      const parts = name.split('/');
      const partsLength = parts.length;
      if (partsLength < 3) {
        // This is a top level machine.
        return {
          parentId: null,
          containerType: null,
          number: name
        };
      }
      // This is a container.
      return {
        parentId: parts.slice(0, partsLength - 2).join('/'),
        containerType: parts[partsLength - 2],
        number: parts[partsLength - 1]
      };
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
      const info = this.parseMachineName(obj.id);
      obj.parentId = info.parentId;
      obj.containerType = info.containerType;
      obj.number = info.number;
      if (obj.jobs) {
        var MANAGE_ENVIRON = environments.machineJobs.MANAGE_ENVIRON;
        obj.isStateServer = obj.jobs.indexOf(MANAGE_ENVIRON) !== -1;
      } else {
        // If jobs is undefined then a ghost machine has been added. See the
        // addGhost method in this module.
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
      if (Array.isArray(models)) {
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
      obj.commitStatus = 'uncommitted';
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

    /**
      Process machine changes coming in from juju-core.

      @method process_delta
      @param {String} action The type of change: 'change', 'remove', 'add'
      @param {Object} data The data for the model being updated
    */
    process_delta: function(action, data) {
      _process_delta(this, action, data, {});
    },

    /**
      Set the sorting method for the list of machines.

      @method comparator
      @param {String} model The machine model.
    */
    comparator: function(model) {
      return this._getSortMethod(this.get('sortMethod'))(model);
    },

    /**
       Get the sort method for the given sort type.

       @method _getSortMethod
       @param {String} sort The sort type.
       @return {Function} The sorting method function.
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
            // A fairly arbitrary string length to pad out the strings
            // to. If there are sort issues, try increasing this value.
            var maxLength = 50;
            var name = model.displayName;
            // Pad the string out to our max value so that the numbers
            // inside the strings sort correctly.
            for (var i = 0; i < maxLength - name.length; i += 1) {
              name = '0' + name;
            }
            return name;
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
        case 'application':
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
        case 'applications':
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

    /**
      Process relation changes coming in from juju-core.

      @method process_delta
      @param {String} action The type of change: 'change', 'remove', 'add'
      @param {Object} data The data for the model being updated
      @param {Object} db The database containing the model being updated
    */
    process_delta: function(action, data, db) {
      // If the action is remove we need to parse the models before they are
      // removed from the db so that we can remove them from the relation
      // models that are cloned in each of the services.
      if (action === 'remove') {
        var endpoints;
        // PyJuju returns a single string as data to remove relations
        if (typeof data === 'string') {
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
          var service;
          endpoints.forEach(function(endpoint) {
            service = db.services.getById(endpoint[0]);
            // The tests don't always add services so we check if they exist
            // first before trying to remove them
            if (service) {
              service.removeRelations(db, data);
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
            const relations = db.relations.get_relations_for_service(service, true);
            _process_delta(relations, action, data, db);
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
      var matched = true;
      if (!this._compareEndpointSets(endpointSetA, endpointSetB)) {
        // We need to see if one endpoint set is just a mirror of the other,
        // which is still a match. Copy the array so we're not reversing the
        // original set.
        var reversedSetB = endpointSetB.slice(0).reverse();
        if (!this._compareEndpointSets(endpointSetA, reversedSetB)) {
          matched = false;
        }
      }
      return matched;
    },

    /**
      Compare two endpoint sets, forwards and backwards. An endpoint set is
      an Array of two endpoints. Each endpoint is itself an array of the
      service name (a string) and an object of relation metatada. Here's what
      a typical endpoint set might look like:

      [
        ['wordpress', {name: 'db', role: 'client'}],
        ['mysql', {name: 'db', role: 'server'}]
      ]

      @method _compareEndpoints
      @param {Array} endpointSetA A set of endpoint objects.
      @param {Array} endpointSetB A set of endpoint objects.
      @return {Boolean} If the endpoint sets match.
    */
    _compareEndpointSets: function(endpointSetA, endpointSetB) {
      if (endpointSetA.length !== endpointSetB.length) {
        return false;
      }
      // If any of the endpoints don't match their counterparts in the other
      // set, it's not a match.
      for (var i = 0, l = endpointSetA.length; i < l; i += 1) {
        var endpointA = endpointSetA[i],
            endpointB = endpointSetB[i];
        // Each endpoint is an array of two things:
        //   index 0: the service name
        //   index 1: an object with the name and role of the relation
        // ['mysql', {name: 'db', role: 'server'}]
        // In order to be considered a match, the service name and relation
        // name should match.
        if (endpointA[0] !== endpointB[0] ||
            endpointA[1].name !== endpointB[1].name) {
          return false;
        }
      }
      return true;
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
          rel.get('endpoints').forEach(rep => {
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
        return relation.get('endpoints').some(endpoint => {
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
          return new Date().getTime();
        }
      },

      // when a model id is set we can infer link (but only in the
      // context of app's routing table)
      modelId: {
        setter: function(model) {
          if (!model) {return null;}
          if (Array.isArray(model)) {return model;}
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
    /**
      Stores the list of services which are hidden because of the added
      services view.

      @property _highlightedServices
      @type {Array}
      @default []
    */
    _highlightedServices: [],

    initializer: function(config) {
      models._getECS = config.getECS;
      // Single model for environment database is bound to.
      this.environment = new Environment();
      this.services = new ServiceList();
      this.remoteServices = new RemoteServiceList();
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
        this.environment, this.services, this.remoteServices, this.charms,
        this.relations, this.notifications, this.machines, this.units];
      modelLists.forEach(function(modelList) {
        modelList.detachAll();
        modelList.destroy();
      });
    },

    /**
      Dispatch an event.

     @method fireEvent
     @param {String} event The name of the event to fire.
    */
    fireEvent: function(event) {
      document.dispatchEvent(new Event(event));
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

    getModelFromChange: function(change) {
      var change_kind = change[1],
          data = change[2],
          model_id = change_kind === 'remove' && data || data.id;
      return this.resolveModelByName(model_id);
    },

    /**
      Reset all database collections.

      @method reset
    */
    reset: function() {
      this.services.reset();
      this.remoteServices.reset();
      this.machines.reset();
      this.charms.reset();
      this.relations.reset();
      this.notifications.reset();
      this.units.reset();
      this.environment.reset();
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
          changes = deltaEvent.detail.data.result,
          defaultHandler = handlers.defaultHandler;

      // Process delta changes invoking handlers for each change in changeset.
      changes.forEach(function(change) {
        var kind = change[0],
            action = change[1],
            data = change[2],
            handler = defaultHandler;
        if (handlers.hasOwnProperty(kind)) {
          // Juju >= 2 mega-watcher information.
          handler = handlers[kind];
        }
        handler(self, action, data, kind);
      });

      // Update service unit aggregates
      // (this should select only those elements which had deltas).
      var units = this.units;
      this.services.each(function(service) {
        units.update_service_unit_aggregates(service);
      }.bind(this));
      this.fireEvent('update');
    },

    /**
       Maps machine placement for services.

       @param {Object} machineList The list of machines.
     */
    _mapServicesToMachines: function(machineList) {
      const machinePlacement = {};
      const owners = {};
      const machineNames = {};
      const machines = machineList.filter(machine => {
        return this.units.filterByMachine(machine.id).length !== 0;
      });

      // "Sort" machines w/ parents (e.g. containers) to the back of the list.
      machines.sort(function(a, b) {
        let aLxc = 0,
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
        const units = this.units.filterByMachine(machine.id);
        const containerType = machine.containerType;
        let machineName;
        let owner;
        if (containerType !== null && containerType !== undefined) {
          // If the machine is an LXC, we just base the name off of the
          // machine's parent, which we've already created a name for.
          const machineId = machine.parentId;
          if (machineNames[machineId]) {
            machineName = containerType + ':' + machineNames[machineId];
          } else {
            machineName = containerType + ':' + machine.parentId;
          }
        } else {
          // The "owner" is the service that deployer will use to allocate other
          // service units, e.g. "put this unit of mysql on the machine with
          // wordpress."
          //
          // We need to get both the "owner" of the machine and how many times
          // we have seen the owner to generate a deployer designation (e.g.
          // wordpress=2, the second machine owned by wordpress).
          owner = units[0].service;
          const ownerIndex = owners[owner] >= 0 ? owners[owner] + 1 : 0;
          owners[owner] = ownerIndex;
          machineName = owner + '/' + ownerIndex;
          machineNames[machine.id] = machineName;
        }

        units.forEach(function(unit) {
          const serviceName = unit.service;
          if (!machinePlacement[serviceName]) {
            machinePlacement[serviceName] = [];
          }
          if (serviceName === owner) {
            machineName = unit.machine;
          }
          machinePlacement[serviceName].push(machineName);
        });
      }, this);
      return machinePlacement;
    },

    /**
      Export the current model as a bundle, including uncommitted changes.

      @return {Object} The JSON decoded bundle.
    */
    exportBundle: function() {
      const defaultSeries = this.environment.get('defaultSeries');
      const result = {};
      if (defaultSeries) {
        result.series = defaultSeries;
      }
      const applications = this._generateServiceList(this.services);
      result.applications = applications;
      const machinePlacement = this._mapServicesToMachines(this.machines);
      result.relations = this._generateRelationSpec(this.relations);
      result.machines = this._generateMachineSpec(
        machinePlacement, this.machines, applications);
      return result;
    },

    /**
      Generate a service list for the exported yaml file based on the list of
      services passed in.

      @method _generateServiceList
      @param {Object} serviceList The service list.
      @return {Object} The services list for the export.
    */
    _generateServiceList: function(serviceList) {
      var services = {};
      serviceList.each(function(service) {
        var units = service.get('units');
        var charm = this.charms.getById(service.get('charm'));
        var serviceOptions = {};
        var charmOptions = charm.get('options');
        var serviceName = service.get('id');

        // Process the service_options removing any values
        // that are the default value for the charm.
        const config = service.get('config') || {};
        Object.keys(config).forEach(key => {
          let value = config[key];
          if (utils.isValue(value)) {
            var optionData = charmOptions && charmOptions[key];
            switch (optionData.type) {
              case 'boolean':
                // XXX frankban 2013-10-31: why boolean options are stored in
                // the db sometimes as booleans and other times as strings
                // (e.g. "true")? As a quick fix, always convert to boolean
                // type, but we need to find who writes in the services db and
                // normalize the values. Note that a more concise
                // `value = (value  + '' === 'true');`` is not minified
                // correctly and results in `value += 'true'` for some reason.
                if (value === 'true') {
                  value = true;
                } else if (value === 'false') {
                  value = false;
                }
                break;
              case 'float':
                value = parseFloat(value);
                break;
              case 'int':
                value = parseInt(value, 10);
                break;
            }
            var defaultVal = optionData && optionData['default'];
            var hasDefault = utils.isValue(defaultVal);
            if (!hasDefault || value !== defaultVal) {
              serviceOptions[key] = value;
            }
          }
        });

        var serviceData = {charm: charm.get('id')};
        if (charm.get('is_subordinate')) {
          // Subordinate services can not have any units.
          delete serviceData.num_units;
        } else {
          // Test models or ghosts might not have a units LazyModelList.
          serviceData.num_units = units && units.size() || 0;
        }
        if (serviceOptions && Object.keys(serviceOptions).length >= 1) {
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
        services[serviceName] = serviceData;
      }, this);
      return services;
    },

    /**
      Generate a relation list for the exported yaml file based on the list of
      relations passed in.

      @method _generateRelationSpec
      @param {Object} relationList The relation list.
      @return {Object} The relations list for the export.
    */
    _generateRelationSpec: function(relationList) {
      const relations = [];
      relationList.each(relation => {
        const endpoints = relation.get('endpoints');
        // Skip peer relations: they should be added automatically.
        if (endpoints.length === 1) {
          return;
        }
        // Export this relation.
        relations.push(endpoints.map(endpoint =>
          endpoint[0] + (endpoint[1].name ? `:${endpoint[1].name}` : '')));
      });
      return relations;
    },

    /**
      Generate a machine list for the exported yaml file based on the list of
      machines passed in.

      @method _generateMachineSpec
      @param {Object} machinePlacement The machines list.
      @param {Object} machineList The machines list.
      @param {Object} serviceList The services list.
      @return {Object} The machine list for the export.
    */
    _generateMachineSpec: function(machinePlacement, machineList, serviceList) {
      var machines = {};
      var counter = 0;
      // We want to exlcude any machines which do not have units placed on
      // them as well as the machine which contains the GUI if it is the
      // only unit on that machine.
      var machineIdList = [];
      var machineIdMap = {};
      Object.keys(machinePlacement).forEach(function(serviceName) {
        machinePlacement[serviceName].forEach(function(machineId) {
          // Checking for dupes before adding to the list
          var idExists = machineIdList.some(function(id) {
            if (id === machineId) {
              return true;
            }
          });
          if (!idExists) {
            machineIdList.push(machineId);
            // Store a mapping of the machines so we can start them at a
            // 0 index to make the bundle output more pleasing to read.
            var parts = machineId.split(':');
            var parentId;
            if (parts.length === 2) {
              // It's a container
              // Does it provide us a machine id to create this container on
              // by converting it to an integer and comparing it to it's
              // coerced value. It could be a machine number, 'new', or
              // a unit name.
              var partInt = parseInt(parts[1], 10);
              if (!isNaN(partInt)) {
                parentId = partInt;
              }
            } else {
              parentId = machineId;
            }
            // parentId will be undefined if it's a unit name at which point
            // we do not want to create a machine record for it because it will
            // be handled in that units parent machine creation.
            if (parentId && machineIdMap[parentId] === undefined) {
              // Create a mapping of the parentId to a 0 indexed counter which
              // we will use to construct the ids later.
              machineIdMap[parentId] = counter;
              counter += 1;
            }
          }
        }, this);
        // Add the machine placement information to the services 'to' directive.
        serviceList[serviceName].to = machinePlacement[serviceName].map(
          function(machineId) {
            let parts = machineId.split(':');
            if (parts.length === 2) {
              // It's a container
              let partInt = parseInt(parts[1], 10);
              if (!isNaN(partInt)) {
                parts[1] = machineIdMap[partInt];
              }
              return parts.join(':');
            } else {
              return machineIdMap[machineId] + '';
            }
          }
        );
      }, this);

      const defaultSeries = this.environment.get('defaultSeries');
      machineList.each(function(machine) {
        var parentId = machine.parentId;
        if (parentId !== null) {
          // We don't add containers to the machine spec.
          return;
        }
        // We only want to save machines which have units assigned to them.
        var machineId = machine.id;
        machineIdList.some(function(listMachineId) {
          var parts = listMachineId.split(':');
          if (parts.length === 2) {
            var partInt = parseInt(parts[1], 10);
            if (!isNaN(partInt) && machineId === partInt + '') {
              // If the container has a machine number then assign it to be
              // the machine name so that the machineidList will match.
              machineId = listMachineId;
              return true;
            }
          }
        });
        if (machineIdList.indexOf(machineId) > -1) {
          var parts = machineId.split(':');
          if (parts.length === 2) {
            machineId = parts[1];
          }
          machines[machineIdMap[machineId]] = {};
          const series = machine.series || defaultSeries;
          if (series) {
            machines[machineIdMap[machineId]].series = series;
          }
          // The machine object can include a constraints field in the case
          // the machine is not yet committed.
          let constraints = machine.constraints;
          if (machine.hardware) {
            constraints = this._collapseMachineConstraints(machine.hardware);
          }
          if (constraints && constraints.length > 0) {
            machines[machineIdMap[machineId]].constraints = constraints;
          }
        }
      }, this);
      return machines;
    },

    /**
      Collapses the machine hardware object details into the constraints string
      expected by Juju.

      @method _collapseMachineConstraints
      @param {Object} constraints The hardware constraints object from the
        machine model.
      @return {String} The constraints in a string format.
    */
    _collapseMachineConstraints: function(constraints) {
      let constraint = '';
      const constraintMap = {
        availabilityZone: 'availability-zone',
        cpuCores: 'cpu-cores',
        cpuPower: 'cpu-power',
        disk: 'root-disk'
      };
      Object.keys(constraints || {}).forEach(key => {
        if (key === 'availabilityZone') {
          // We do not want to export the availability-zone in the bundle
          // export because it makes the bundles less sharable.
          return;
        }
        const value = constraints[key];
        if (value) {
          const property = constraintMap[key] || key;
          constraint += property + '=' + value + ' ';
        }
      });
      return constraint.trim();
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
      var units = Array.isArray(unitOrUnits) ? unitOrUnits : [unitOrUnits];
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
      var units = Array.isArray(unitOrUnits) ? unitOrUnits : [unitOrUnits];
      // Update the units model list included in the corresponding services.
      units.forEach(function(unit) {
        var service = this.services.getById(unit.service);
        var serviceUnits = service.get('units');
        serviceUnits.remove(unit, true);
        this.units.update_service_unit_aggregates(service);
      }, this);
      return unitOrUnits;
    },

    /**
      Updates a units display name to match the display name of the service.
      This is used after updating the service name.

      @method updateServiceUnitsDisplayname
      @param {String} serviceId
    */
    updateServiceUnitsDisplayname: function(serviceId) {
      var service = this.services.getById(serviceId);
      var serviceName = service.get('name');
      var serviceUnits = service.get('units');
      serviceUnits.each(unit => {
        unit.displayName = `${serviceName}/${unit.number}`;
      });
      // Fire an update event to trigger the UI update.
      this.fireEvent('update');
    },

    /**
      Update the map for a unit id on a service.

      @method updateUnitId
      @param {String} serviceId The service id.
      @param {String} oldId The previous unit id.
      @returns {Model} The updated unit.
    */
    updateUnitId: function(serviceId, oldId) {
      var service = this.services.getById(serviceId);
      var serviceUnits = service.get('units');
      var units = this.units;
      var unit = units.getById(oldId);
      var unitNumber = unit.number;
      var newId = serviceId + '/' + unitNumber;
      unit.service = serviceId;
      unit.id = newId;
      unit.urlName = serviceId + '-' + unitNumber;
      // Due to a YUI bug we need to update the id map to the new id.
      delete units._idMap[oldId];
      units._idMap[newId] = unit;
      // Also update the id map on the service.
      delete serviceUnits._idMap[oldId];
      serviceUnits._idMap[unit.id] = unit;
      // Fire the db change events.
      units.fire('change');
      serviceUnits.fire('change');
      return unit;
    },

    /**
      Returns a list of the deployed (both uncommitted and committed) services
      that are related to the provided service.

      @method findRelatedServices
      @param {Object} service The origin service.
      @param {Boolean} asArray If you want the results returned as an array of
        service names or a model list.
      @return {Y.ModelList|Array} A ModelList of related services or an array
        of service names.
    */
    findRelatedServices: function(service, asArray) {
      const relationUtils = window.juju.utils.RelationUtils;
      var relationData = relationUtils.getRelationDataForService(this, service);
      var related = [service.get('name')]; // Add own name to related list.
      // Compile the list of related services.
      relationData.forEach(function(relation) {
        // Some relations (e.g., peer relations) may not have the far endpoint
        // defined.
        if (relation.far && relation.far.service) {
          related.push(relation.far.service);
        }
      });
      if (asArray) {
        return related;
      }
      return this.services.filter({asList: true}, function(s) {
        return related.indexOf(s.get('name')) > -1;
      });
    },

    /**
      Returns a list of the deployed (both uncommitted and committed) services
      that are not related to the provided service.

      @method findUnrelatedServices
      @param {Object} service The origin service.
      @return {Y.ModelList} A ModelList of the unrelated services.
    */
    findUnrelatedServices: function(service) {
      var related = this.findRelatedServices(service, true);
      // Find the unrelated by filtering out the related.
      var unrelated = this.services.filter({asList: true}, function(s) {
        return related.indexOf(s.get('name')) === -1;
      });
      return unrelated;
    },

    /**
      Percolates a service flag into the units under that service, which are
      stored in two locations: within the service itself, and in db.units.

      @method updateUnitFlags
      @param {Object|Y.ModelList} serviceOrServiceList The service(s) which has
          the flag.
      @param {String} flag The flag that needs updating.
    */
    updateUnitFlags: function(serviceOrServiceList, flag) {
      var dbUnits = this.units;
      /**
        Helper function to deal with a single service.

        @method updateOneService
        @param {Object} service The service being updated.
      */
      function updateOneService(service) {
        var value = service.get(flag),
            units = service.get('units');
        units.each(function(unit) {
          var dbUnit = dbUnits.getById(unit.id);
          // Revive so that this update triggers change events.
          unit = units.revive(unit);
          dbUnit = dbUnits.revive(dbUnit);
          // Need to update the unit in both locations - in the service itself
          // and in the DB.
          unit.set(flag, value);
          dbUnit.set(flag, value);
        });
      }
      if (serviceOrServiceList instanceof models.ServiceList) {
        serviceOrServiceList.each(updateOneService.bind(this));
      } else {
        updateOneService.call(this, serviceOrServiceList);
      }
    },

    /**
      Sets the visibility of a machine based on the service name and
      visibility modifier passed in. This is used by the machine view to
      determine if it should show the token or not when a user clicks on
      highlight in the added services bar.

      @method setMVVisibility
      @param {String} serviceId The service id to compare to the units
        services in the machine.
      @param {Boolean} highlight If the machine with units matching the supplied
        service should be highlighted or not.
    */
    setMVVisibility: function(serviceId, highlight) {
      var highlightIndex = this._highlightedServices.indexOf(serviceId);
      if (highlightIndex >= 0 && highlight === false) {
        // If the service is stored as hidden but we no longer want it to be
        // then remove it from the hidden list.
        this._highlightedServices.splice(highlightIndex, 1);
      } else if (highlightIndex < 0 && highlight === true) {
        this._highlightedServices.push(serviceId);
      }

      var changedMachines = [];
      this.machines.each(function(machine) {
        var units = this.units.filterByMachine(machine.id, true);
        var keepVisible = this._highlightedServices.some(
          function(highlightedService) {
            return units.some(function(unit) {
              return unit.service === highlightedService;
            });
          });
        // If we no longer have any services highlighted then we want to show
        // all machine tokens.
        if (this._highlightedServices.length < 1) {
          keepVisible = true;
        }
        var oldHideValue = machine.hide;
        machine.hide = keepVisible ? false : true;
        // Batch up machines that actually changed in order to fire an
        // aggregated change event outside the loop.
        if (oldHideValue !== machine.hide) {
          changedMachines.push(machine);
        }
      }, this);
      // In order to have the machine view update the rendered tokens we need
      // to fire an event to tell it that the machines have changed.
      if (changedMachines.length) {
        this.machines.fire('changes', {
          instances: changedMachines
        });
      }
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
    'juju-delta-handlers',
    'juju-view-utils',
    'juju-charm-models',
    'juju-env-api'
  ]
});
