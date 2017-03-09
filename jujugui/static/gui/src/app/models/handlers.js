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
      console.warn(
        'unknown mega-watcher ' + action + ' event of type ' + kind + ': ' +
        JSON.stringify(change));
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
      const portRanges = change['port-ranges'] || [];
      const unitData = {
        id: change.name,
        charmUrl: change['charm-url'],
        service: change.application,
        machine: change['machine-id'],
        public_address: change['public-address'],
        private_address: change['private-address'],
        portRanges: portRanges.map(portRange => {
          return {
            from: portRange['from-port'],
            to: portRange['to-port'],
            protocol: portRange.protocol,
            single: portRange['from-port'] === portRange['to-port']
          };
        }),
        subordinate: change.subordinate,
        workloadStatusMessage: ''
      };

      // Handle agent and workload status.
      const agentStatus = change['agent-status'] || {};
      const workloadStatus = change['workload-status'] || {};
      unitData.workloadStatusMessage = workloadStatus.message;
      if (workloadStatus.current === 'error') {
        unitData.agent_state = workloadStatus.current;
        unitData.agent_state_info = workloadStatus.message;
        unitData.agent_state_data = workloadStatus.data;
      } else {
        unitData.agent_state = utils.translateToLegacyAgentState(
          agentStatus.current, workloadStatus.current, workloadStatus.message);
        unitData.agent_state_info = agentStatus.message;
        unitData.agent_state_data = agentStatus.data;
      }

      // The units model list included in the corresponding application is
      // automatically kept in sync by db.units.process_delta().
      db.units.process_delta(action, unitData, db);
      // It's valid for an application/unit to not have a machine; for example,
      // when a deploy fails due to an error. In that case the unit is unplaced
      // and we don't need to process machine info.
      if (unitData.machine) {
        db.machines.process_delta('change', {
          id: unitData.machine,
          public_address: unitData.public_address
        }, db);
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
        id: change.name,
        // The name attribute is used to store the temporary name of ghost
        // applications. We set it here for consistency, even if the name of a
        // real application can never be changed.
        name: change.name,
        charm: change['charm-url'],
        exposed: change.exposed,
        life: change.life,
        constraints: utils.convertConstraints(change.constraints),
        subordinate: change.subordinate
      };
      // Process the stream.
      db.services.process_delta(action, data);
      if (action !== 'remove') {
        db.services.getById(change.name).updateConfig(change.config || {});
        // Execute the registered application hooks.
        var hooks = applicationChangedHooks[change.name] || [];
        hooks.forEach(function(hook) {
          hook();
        });
      }
      // Delete the application hooks for this application.
      delete applicationChangedHooks[change.name];
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
    remoteApplicationInfo: function(db, action, change) {
      var status = change.status || {};
      var data = {
        id: change['application-url'],
        service: change.name,
        sourceId: change['model-uuid'],
        life: change.life,
        status: {
          current: status.current,
          message: status.message,
          data: status.data,
          since: status.since
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
      var endpoints = change.endpoints;
      var firstEp = endpoints[0];
      var firstRelation = firstEp.relation;
      var data = {
        id: change.key,
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
            'relation change', change.key,
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
      var addresses = change.addresses || [];
      var status = change['agent-status'] || {};
      var data = {
        id: change.id,
        addresses: addresses.map(function(address) {
          return {
            name: address['space-name'],
            scope: address.scope,
            type: address.type,
            value: address.value
          };
        }),
        instance_id: change['instance-id'],
        agent_state: status.current,
        agent_state_info: status.message || '',
        agent_state_data: status.data,
        hardware: {},
        jobs: change.jobs,
        life: change.life,
        series: change.series,
        supportedContainers: null
      };
      // The "hardware-characteristics" attribute is undefined if the machine
      // is not yet provisioned.
      var hardwareCharacteristics = change['hardware-characteristics'];
      if (hardwareCharacteristics) {
        data.hardware = {
          arch: hardwareCharacteristics.arch,
          cpuCores: hardwareCharacteristics['cpu-cores'],
          cpuPower: hardwareCharacteristics['cpu-power'],
          mem: hardwareCharacteristics.mem,
          disk: hardwareCharacteristics['root-disk'],
          availabilityZone: hardwareCharacteristics['availability-zone']
        };
      }
      // The supported containers are only available when the machine is
      // provisioned.
      if (change['supported-containers-known']) {
        data.supportedContainers = change['supported-containers'];
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
      var tag = change.tag,
          kind = tag.split('-')[0],
          id = utils.cleanUpEntityTags(tag),
          instance;
      // We cannot use the process_delta methods here, because their legacy
      // behavior is to override the application exposed and unit
      // relation_errors attributes when they are missing in the change data.
      if (kind === 'model') {
        instance = db.environment;
      } else {
        instance = db.resolveModelByName(id);
      }
      // Do not proceed if the instance is not found.
      if (!instance) {
        return;
      }
      models.setAnnotations(instance, change.annotations, true);
      // Keep in sync annotations in units present in the global units model
      // list and application nested ones.
      if (instance.name === 'serviceUnit') {
        var application = db.services.getById(instance.service);
        if (application) {
          var applicationUnits = application.get('units');
          if (applicationUnits) {
            var nestedInstance = applicationUnits.getById(id);
            models.setAnnotations(nestedInstance, change.annotations, true);
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
