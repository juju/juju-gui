/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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
   Delta legacy handlers.
   This module contains delta stream handlers and converters to be used
   to parse and prepare the delta stream coming from Juju 1 environments so
   that it can be used to populate the database.

   @module legacy-handlers
 */

YUI.add('juju-legacy-delta-handlers', function(Y) {

  var models = Y.namespace('juju.models');
  var utils = models.utils;

  /*
    The serviceChangedHooks object maps application names to functions to
    be executed when the next corresponding application change event arrives.
    When an application is removed, the corresponding key is also garbage
    collected.
  */
  var serviceChangedHooks = Object.create(null);
  // Store the hooks in the models for testing.
  models._serviceChangedHooks = serviceChangedHooks;

  /*
    Each handler is called passing the db instance, the action to be
    performed ("add", "change" or "remove"), the change coming from
    the environment, and a (optional) kind identifying what will be
    changed (e.g. "serviceLegacyInfo", "unitLegacyInfo").
    Each handler has the responsibility to update the database according to
    the received change.
  */
  models.legacyHandlers = {

    /**
      Handle unit info coming from the juju-core delta, updating the
      relevant database models.

      @method unitLegacyInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    unitLegacyInfo: function(db, action, change) {
      const ports = change.Ports || [];
      const unitData = {
        id: change.Name,
        charmUrl: change.CharmURL,
        service: change.Application || change.Service,
        machine: change.MachineId,
        public_address: change.PublicAddress,
        private_address: change.PrivateAddress,
        portRanges: ports.map(port => {
          return {
            from: port.Number,
            to: port.Number,
            protocol: port.Protocol,
            single: true
          };
        }),
        // Since less recent versions of juju-core (<= 1.20.7) do not include
        // the Subordinate field in the mega-watcher for units, the following
        // attribute could be undefined.
        subordinate: change.Subordinate,
        workloadStatusMessage: ''
      };

      // Handle unit status.
      unitData.agent_state = change.Status;
      unitData.agent_state_info = change.StatusInfo;
      unitData.agent_state_data = change.StatusData;

      var machineData = {
        id: change.MachineId,
        public_address: change.PublicAddress
      };
      // The units model list included in the corresponding application is
      // automatically kept in sync by db.units.process_delta().
      db.units.process_delta(action, unitData, db);
      // It's valid for an application/unit to not have a machine; for example,
      // when a deploy fails due to an error. In that case the unit is unplaced
      // and we don't need to process machine info.
      if (machineData.id) {
        db.machines.process_delta('change', machineData, db);
      }
    },

    /**
      Handle service info coming from the juju-core delta when using Juju 1,
      updating the relevant database models.

      @method serviceLegacyInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @return {undefined} Nothing.
     */
    serviceLegacyInfo: function(db, action, change) {
      var data = {
        id: change.Name,
        // The name attribute is used to store the temporary name of ghost
        // applications. We set it here for consistency, even if the name of a
        // real application can never be changed.
        name: change.Name,
        charm: change.CharmURL,
        exposed: change.Exposed,
        life: change.Life,
        constraints: utils.convertConstraints(change.Constraints),
        subordinate: change.Subordinate
      };
      // Process the stream.
      db.services.process_delta(action, data);
      if (action !== 'remove') {
        db.services.getById(change.Name).updateConfig(change.Config);
        // Execute the registered application hooks.
        var hooks = serviceChangedHooks[change.Name] || [];
        hooks.forEach(function(hook) {
          hook();
        });
      }
      // Delete the application hooks for this application.
      delete serviceChangedHooks[change.Name];
    },

    /**
      Handle relation info coming from the juju-core delta, updating the
      relevant database models.

      @method relationLegacyInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    relationLegacyInfo: function(db, action, change) {
      // Return a list of endpoints suitable for being included in the db.
      var createEndpoints = function(endpoints) {
        return endpoints.map(endpoint => {
          var relation = endpoint.Relation;
          var data = {role: relation.Role, name: relation.Name};
          return [endpoint.ServiceName, data];
        });
      };

      var endpoints = change.Endpoints;
      var firstEp = endpoints[0];
      var firstRelation = firstEp.Relation;
      var data = {
        id: change.Key,
        // The interface and scope attrs should be the same in both relations.
        'interface': firstRelation.Interface,
        scope: firstRelation.Scope,
        endpoints: createEndpoints(endpoints)
      };

      var processRelation = function() {
        db.relations.process_delta(action, data, db);
      };

      var applicationName = firstEp.ServiceName;
      if (!db.services.getById(applicationName)) {
        // Sometimes (e.g. when a peer relation is immediately created on
        // application deploy) a relation delta is sent by juju-core before the
        // corresponding application is added to the db. In this case, wait for
        // the application delta to arrive before adding a relation.
        console.log(
            'relation change', change.Key,
            'delayed, waiting for missing application',
            applicationName);
        var hooks = serviceChangedHooks[applicationName] || [];
        hooks.push(processRelation);
        serviceChangedHooks[applicationName] = hooks;
        return;
      }
      processRelation();
    },

    /**
      Handle machine info coming from the juju-core delta, updating the
      relevant database models.

      @method machineLegacyInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    machineLegacyInfo: function(db, action, change) {
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

      @method annotationLegacyInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    annotationLegacyInfo: function(db, action, change) {
      var cleanUpEntityTags = function(tag) {
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
      };

      var tag = change.Tag,
          kind = tag.split('-')[0],
          id = cleanUpEntityTags(tag),
          instance;
      // We cannot use the process_delta methods here, because their legacy
      // behavior is to override the application exposed and unit
      // relation_errors attributes when they are missing in the change data.
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
      // list and application nested ones.
      if (instance.name === 'serviceUnit') {
        var application = db.services.getById(instance.service);
        if (application) {
          var applicationUnits = application.get('units');
          if (applicationUnits) {
            var nestedInstance = applicationUnits.getById(id);
            models.setAnnotations(nestedInstance, change.Annotations, true);
          }
        }
      }
    }
  };

}, '0.1.0', {
  requires: [
    'base',
    'array-extras',
    'juju-delta-handlers'
  ]
});
