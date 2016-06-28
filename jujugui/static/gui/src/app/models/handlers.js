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
   to parse and prepare the delta stream coming from Juju >= 2 models so that
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
      hyphen from the beginning of a string.  Thus, application-mysql becomes
      simply mysql (as the expression matches 'applicationName-').
      This function also converts the unit tag so that "unit-mysql-1" becomes
      "mysql/1".

      @method cleanUpEntityTags
      @param {String} tag The tag to clean up.
      @return {String} The tag without the prefix.
    */
    cleanUpEntityTags: function(tag) {
      var result = tag.replace(/^(application|unit|machine|model)-/, '');
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
      return ports.map(port => {
        return port.number + '/' + port.protocol;
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
      return endpoints.map(endpoint => {
        var relation = endpoint.relation;
        var data = {role: relation.role, name: relation.name};
        return [endpoint['application-name'], data];
      });
    },

    /**
      Return the constraints converting the tags to a comma separated string.

      @method convertConstraints
      @param {Object} constraints The constraints included in the mega-watcher
        for applications, or null/undefined if no constraints are set.
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
    },

    /**
      Translates the new JujuStatus and WorkloadStatus's to the legacy Juju 1
      values.

      This logic is a JS implementation of the Juju core implementation to
      accomplish the same task:
      https://github.com/
        juju/juju/blob/juju-1.26-alpha1/state/status_model.go#L272

      @method translateToLegacyAgentState
      @param {String} currentStatus JujuStatus.Current
      @param {String} workloadStatus WorkloadStatus.Current
      @param {String} workloadStatusMessage WorkloadStatus.Message
      @return {String} The legacy agent state.
    */
    translateToLegacyAgentState: function(
      currentStatus, workloadStatus, workloadStatusMessage) {
      var statusMaintenance = 'maintenance';
      var statusAllocating = 'allocating';
      var statusPending = 'pending';
      var statusError = 'error';
      var statusRebooting = 'rebooting';
      var statusExecuting = 'executing';
      var statusIdle = 'idle';
      var statusLost = 'lost';
      var statusFailed = 'failed';
      var statusTerminated = 'terminated';
      var statusStarted = 'started';
      var statusStopped = 'stopped';

      var messageInstalling = 'installing charm software';
      var isInstalled = workloadStatus != statusMaintenance ||
                        workloadStatusMessage != messageInstalling;

      switch (currentStatus) {

        case statusAllocating:
          return statusPending;
          break;

        case statusError:
          return statusError;
          break;

        case statusRebooting:
        case statusExecuting:
        case statusIdle:
        case statusLost:
        case statusFailed:
          switch (workloadStatus) {

            case statusError:
              return statusError;
              break;

            case statusTerminated:
              return statusStopped;
              break;

            case statusMaintenance:
              return isInstalled ? statusStarted : statusPending;
              break;

            default:
              return statusStarted;
              break;
          }
          break;
      }
    }

  };
  models.utils = utils; // Exported for testing purposes.

  /*
    The applicationChangedHooks object maps application names to functions to
    be executed when the next corresponding application change event arrives.
    When an application is removed, the corresponding key is also garbage
    collected.
  */
  var applicationChangedHooks = Object.create(null);
  // Store the hooks in the models for testing.
  models._applicationChangedHooks = applicationChangedHooks;

  /*
    Each handler is called passing the db instance, the action to be
    performed ("add", "change" or "remove"), the change coming from
    the environment, and a (optional) kind identifying what will be
    changed (e.g. "applicationInfo", "unitInfo").
    Each handler has the responsibility to update the database according to
    the received change.
  */
  models.handlers = {

    /**
      Called by the delta parser if a delta is passed to the GUI which it does
      not understand. Throws a console error and then allows delta parsing to
      continue.

      @method defaultHandler
      @param {Object} db The application db (unused)
      @param {String} action The action which the delta is trying to complete.
      @param {Object} change The data for the delta change.
      @param {String} kind The type of delta.
    */
    defaultHandler: function(db, action, change, kind) {
      console.error('Unknown delta type: ' + kind);
      console.log(action, change);
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
        service: change.Application || change.Service,
        machine: change.MachineId,
        public_address: change.PublicAddress,
        private_address: change.PrivateAddress,
        open_ports: utils.convertOpenPorts(change.Ports),
        // Since less recent versions of juju-core (<= 1.20.7) do not include
        // the Subordinate field in the mega-watcher for units, the following
        // attribute could be undefined.
        subordinate: change.Subordinate,
        workloadStatusMessage: ''
      };
      // Juju 2.0 changes the delta structure by removing Status, StatusInfo,
      // and StatusData in favour of JujuStatus.Message and JujuStatus.Data.
      // If change.JujuStatus is not defined then we will use the old delta
      // structure.
      var jujuStatus = change.JujuStatus;
      if (jujuStatus) {
        var workloadStatus = change.WorkloadStatus;
        unitData.workloadStatusMessage = workloadStatus.Message;
        if (workloadStatus.Current === 'error') {
          unitData.agent_state = workloadStatus.Current;
          unitData.agent_state_info = workloadStatus.Message;
          unitData.agent_state_data = workloadStatus.Data;
        } else {
          unitData.agent_state = utils.translateToLegacyAgentState(
            jujuStatus.Current, workloadStatus.Current, workloadStatus.Message);
          unitData.agent_state_info = jujuStatus.Message;
          unitData.agent_state_data = jujuStatus.Data;
        }
      } else {
        // For Juju 1.x
        unitData.agent_state = change.Status;
        unitData.agent_state_info = change.StatusInfo;
        unitData.agent_state_data = change.StatusData;
      }

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
      Handle application info coming from the juju-core delta, updating the
      relevant database models.

      @method applicationInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @return {undefined} Nothing.
     */
    applicationInfo: function(db, action, change) {
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
        var hooks = applicationChangedHooks[change.Name] || [];
        hooks.forEach(function(hook) {
          hook();
        });
      }
      // Delete the application hooks for this application.
      delete applicationChangedHooks[change.Name];
    },

    /**
      Handle remote application info coming from the juju-core delta, updating
      the relevant database models.

      @method remoteapplicationInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
     */
    remoteapplicationInfo: function(db, action, change) {
      var status = change.Status || {};
      var data = {
        id: change.ApplicationURL,
        service: change.Name,
        sourceId: change.EnvUUID,
        life: change.Life,
        status: {
          current: status.Current,
          message: status.Message,
          data: status.Data,
          since: status.Since
        }
      };
      db.remoteServices.process_delta(action, data);
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
      var firstEp = endpoints[0];
      var firstRelation = firstEp.relation;
      var data = {
        id: change.Key,
        // The interface and scope attrs should be the same in both relations.
        'interface': firstRelation.interface,
        scope: firstRelation.scope,
        endpoints: utils.createEndpoints(endpoints)
      };

      var processRelation = function() {
        db.relations.process_delta(action, data, db);
      };

      var applicationName = firstEp['application-name'];
      if (!db.services.getById(applicationName)) {
        // Sometimes (e.g. when a peer relation is immediately created on
        // application deploy) a relation delta is sent by juju-core before the
        // corresponding application is added to the db. In this case, wait for
        // the application delta to arrive before adding a relation.
        console.log(
            'relation change', change.Key,
            'delayed, waiting for missing application',
            applicationName);
        var hooks = applicationChangedHooks[applicationName] || [];
        hooks.push(processRelation);
        applicationChangedHooks[applicationName] = hooks;
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
      // behavior is to override the application exposed and unit
      // relation_errors attributes when they are missing in the change data.
      if (kind === 'environment' || kind === 'model') {
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
    'array-extras'
  ]
});
