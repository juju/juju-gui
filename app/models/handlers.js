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
   Delta handlers.
   This module contains delta stream handlers and converters to be used
   to parse and prepare the delta stream coming from environments so that
   it can be used to populate the database.

   @module handlers
 */

YUI.add('juju-delta-handlers', function(Y) {

  var models = Y.namespace('juju.models');

  // A collection of helper functions used by the delta handlers.
  var utils = {

    /**
      Clean up the entity tags, which have the entity type prefixing the
      entity's name when retrieved from the server in some instances, notably
      annotations.

      The regular expression removes any non-hyphen characters followed by a
      hyphen from the beginning of a string.  Thus, service-mysql becomes
      simply mysql (as the expression matches 'service-'). This function also
      converts the unit tag so that "unit-mysql-1" becomes "mysql/1".

      @method cleanUpEntityTags
      @param {String} tag The tag to clean up.
      @return {String} The tag without the prefix.
    */
    cleanUpEntityTags: function(tag) {
      var result = tag.replace(/^(service|unit|machine|environment)-/, '');
      if (!result) {
        return tag;
      }
      var unitPrefix = 'unit-';
      if (tag.slice(0, unitPrefix.length) === unitPrefix) {
        // Clean up the unit name, e.g. "mysql-42" becomes "mysql/42".
        result = result.replace(/-(\d+)$/, '/$1');
      }
      return result;
    },

    /**
      Return a list of ports represented as "NUM/PROTOCOL", e.g. "80/tcp".

      @method convertOpenPorts
      @param {Array} ports A list of port objects, each one including the
       "Number" and "Protocol" attributes.
      @return {Array} The converted list of ports.
    */
    convertOpenPorts: function(ports) {
      if (!ports) {
        return [];
      }
      return Y.Array.map(ports, function(port) {
        return port.Number + '/' + port.Protocol;
      });
    },

    /**
      Return a list of endpoints suitable for being included in the database.

      @method createEndpoints
      @param {Array} endpoints A list of endpoints returned by the juju-core
       delta stream.
      @return {Array} The converted list of endpoints.
    */
    createEndpoints: function(endpoints) {
      return Y.Array.map(endpoints, function(endpoint) {
        var relation = endpoint.Relation,
            data = {role: relation.Role, name: relation.Name};
        return [endpoint.ServiceName, data];
      });
    },

    /**
      Return the constraints converting the tags to a comma separated string.

      @method convertConstraints
      @param {Object} constraints The constraints included in the mega-watcher
        for services, or null/undefined if no constraints are set.
      @return {Object} The converted constraints.
    */
    convertConstraints: function(constraints) {
      var result = constraints || {};
      var tags = result.tags || [];
      delete result.tags;
      if (tags.length) {
        result.tags = tags.join(',');
      }
      return result;
    }

  };
  models.utils = utils; // Exported for testing purposes.

  /*
    The serviceChangedHooks object maps service names to functions to be
    executed when the next corresponding service change event arrives.
    When a service is removed, the corresponding key is also garbage collected.
  */
  var serviceChangedHooks = Object.create(null);
  // Store the hooks in the models for testing.
  models._serviceChangedHooks = serviceChangedHooks;

  /*
     Each handler is called passing the db instance, the action to be
     performed ("add", "change" or "remove"), the change coming from
     the environment, and a (optional) kind identifying what will be
     changed (e.g. "unit", "service", "unitInfo").
     Each handler has the responsibility to update the database according to
     the received change.
  */
  models.handlers = {

    /**
      Convert the delta stream coming from pyJuju into that suitable
      for being used by the database models.

      @method pyDelta
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    pyDelta: function(db, action, change, kind) {
      var data;
      var modelList = db.getModelListByModelName(kind);
      // If this is a unit change, then set its service so that both the
      // global units model lest and the service nested one can be updated.
      if (kind === 'unit' && typeof change !== 'string') {
        change.service = change.id.split('/')[0];
      }
      // If kind === 'annotations' then this is an environment
      // annotation, and we don't need to change the values.
      if (kind !== 'annotations' &&
          (action === 'add' || action === 'change')) {
        data = Object.create(null);
        Y.each(change, function(value, key) {
          data[key.replace(/-/g, '_')] = value;
        });
      } else {
        data = change;
      }
      modelList.process_delta(action, data, db);
    },

    /**
      Handle unit info coming from the juju-core delta, updating the
      relevant database models.

      @method unitInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    unitInfo: function(db, action, change) {
      var unitData = {
        id: change.Name,
        charmUrl: change.CharmURL,
        service: change.Service,
        machine: change.MachineId,
        agent_state: change.Status,
        agent_state_info: change.StatusInfo,
        agent_state_data: change.StatusData,
        public_address: change.PublicAddress,
        private_address: change.PrivateAddress,
        open_ports: utils.convertOpenPorts(change.Ports),
        // Since less recent versions of juju-core (<= 1.20.7) do not include
        // the Subordinate field in the mega-watcher for units, the following
        // attribute could be undefined.
        subordinate: change.Subordinate
      };
      var machineData = {
        id: change.MachineId,
        public_address: change.PublicAddress
      };
      // The units model list included in the corresponding service is
      // automatically kept in sync by db.units.process_delta().
      db.units.process_delta(action, unitData, db);
      // It's valid for a service/unit to not have a machine; for example, when
      // a deploy fails due to an error. In that case the unit is unplaced and
      // we don't need to process machine info.
      if (machineData.id) {
        db.machines.process_delta(action, machineData, db);
      }
    },

    /**
      Handle service info coming from the juju-core delta, updating the
      relevant database models.

      @method serviceInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @return {undefined} Nothing.
     */
    serviceInfo: function(db, action, change) {
      var data = {
        id: change.Name,
        // The name attribute is used to store the temporary name of ghost
        // services. We set it here for consistency, even if the name of a
        // real service can never be changed.
        name: change.Name,
        charm: change.CharmURL,
        exposed: change.Exposed,
        life: change.Life,
        constraints: utils.convertConstraints(change.Constraints),
        // Since less recent versions of juju-core (<= 1.20.7) do not include
        // the Subordinate field in the mega-watcher for services, the
        // following attribute could be undefined.
        subordinate: change.Subordinate
      };
      // Process the stream.
      db.services.process_delta(action, data);
      if (action !== 'remove') {
        var service = db.services.getById(change.Name);
        // Set up config options.
        var serviceConfig = service.get('config') || {};
        var changeConfig = change.Config || {};
        var combined = Y.merge(serviceConfig, changeConfig);
        service.set('config', combined);
        // Update the environmentConfig config options. This should never be
        // done by anything but this method so that it says as representation of
        // the config options as juju sees it.
        service.set(
            'environmentConfig',
            Y.merge(service.get('environmentConfig'), changeConfig));
        // Execute the registered service hooks.
        var hooks = serviceChangedHooks[change.Name] || [];
        hooks.forEach(function(hook) {
          hook();
        });
      }
      // Delete the service hooks for this service.
      delete serviceChangedHooks[change.Name];
    },

    /**
      Handle relation info coming from the juju-core delta, updating the
      relevant database models.

      @method relationInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    relationInfo: function(db, action, change) {
      var endpoints = change.Endpoints;
      var firstEndpoint = endpoints[0];
      var firstRelation = firstEndpoint.Relation;
      var data = {
        id: change.Key,
        // The interface and scope attrs should be the same in both relations.
        'interface': firstRelation.Interface,
        scope: firstRelation.Scope,
        endpoints: utils.createEndpoints(endpoints)
      };

      var processRelation = function() {
        db.relations.process_delta(action, data, db);
      };

      var serviceName = firstEndpoint.ServiceName;
      if (!db.services.getById(serviceName)) {
        // Sometimes (e.g. when a peer relation is immediately created on
        // service deploy) a relation delta is sent by juju-core before the
        // corresponding service is added to the db. In this case, wait for
        // the service delta to arrive before adding a relation.
        console.log(
            'relation change', change.Key,
            'delayed, waiting for missing service',
            serviceName);
        var hooks = serviceChangedHooks[serviceName] || [];
        hooks.push(processRelation);
        serviceChangedHooks[serviceName] = hooks;
        return;
      }
      processRelation();
    },

    /**
      Handle machine info coming from the juju-core delta, updating the
      relevant database models.

      @method machineInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    machineInfo: function(db, action, change) {
      var addresses = change.Addresses || [];
      var data = {
        id: change.Id,
        addresses: addresses.map(function(address) {
          return {
            name: address.NetworkName,
            scope: address.NetworkScope,
            type: address.Type,
            value: address.Value
          };
        }),
        instance_id: change.InstanceId,
        agent_state: change.Status,
        agent_state_info: change.StatusInfo,
        agent_state_data: change.StatusData,
        hardware: {},
        jobs: change.Jobs,
        life: change.Life,
        series: change.Series,
        supportedContainers: null
      };
      // The HardwareCharacteristics attribute is undefined if the machine
      // is not yet provisioned.
      var hardwareCharacteristics = change.HardwareCharacteristics;
      if (hardwareCharacteristics) {
        /* TODO: Should this be standardized to cpu-cores, cpu-power, etc.? */
        data.hardware = {
          arch: hardwareCharacteristics.Arch,
          cpuCores: hardwareCharacteristics.CpuCores,
          cpuPower: hardwareCharacteristics.CpuPower,
          mem: hardwareCharacteristics.Mem,
          disk: hardwareCharacteristics.RootDisk
        };
      }
      // The supported containers are only available when the machine is
      // provisioned.
      if (change.SupportedContainersKnown) {
        data.supportedContainers = change.SupportedContainers;
      }
      db.machines.process_delta(action, data);
    },

    /**
      Handle annotation info coming from the juju-core delta, updating the
      relevant database models.

      @method annotationInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    annotationInfo: function(db, action, change) {
      var tag = change.Tag,
          kind = tag.split('-')[0],
          id = utils.cleanUpEntityTags(tag),
          instance;
      // We cannot use the process_delta methods here, because their legacy
      // behavior is to override the service exposed and unit relation_errors
      // attributes when they are missing in the change data.
      if (kind === 'environment') {
        instance = db.environment;
      } else {
        instance = db.resolveModelByName(id);
      }
      // Do not proceed if the instance is not found.
      if (!instance) {
        return;
      }
      models.setAnnotations(instance, change.Annotations, true);
      // Keep in sync annotations in units present in the global units model
      // list and service nested ones.
      if (instance.name === 'serviceUnit') {
        var service = db.services.getById(instance.service);
        if (service) {
          var serviceUnits = service.get('units');
          if (serviceUnits) {
            var nestedInstance = serviceUnits.getById(id);
            models.setAnnotations(nestedInstance, change.Annotations, true);
          }
        }
      }
    }
  };

}, '0.1.0', {
  requires: [
    'base',
    'array-extras'
  ]
});
