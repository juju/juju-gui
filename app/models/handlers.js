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
      simply mysql (as the expression matches 'service-').

      @method cleanUpEntityTags
      @param {String} tag The tag to clean up.
      @return {String} The tag without the prefix.
    */
    cleanUpEntityTags: function(tag) {
      return tag.replace(/^(service|unit|machine|environment)-/, '');
    }

  };
  models.utils = utils; // Exported for testing purposes.

  /**
     Each handler is called passing the db instance, the action to be
     performed ("add", "change" or "remove"), the change coming from
     the environment, and a (optional) kind identifying what will be
     changed (e.g. "unit", "service", "unitInfo").
     Each handler have the responsibility to update the database according to
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
      var data,
          modelList = db.getModelListByModelName(kind);
      if (action === 'add' || action === 'change') {
        data = Object.create(null);
        Y.each(change, function(value, key) {
          data[key.replace('-', '_')] = value;
        });
      } else {
        data = change;
      }
      modelList.process_delta(action, data);
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
        service: change.Service,
        machine: change.MachineId,
        agent_state: change.Status,
        public_address: change.PublicAddress,
        private_address: change.PrivateAddress
        // XXX 2013-04-03 frankban: include change.Ports.
      };
      var machineData = {
        id: change.MachineId,
        public_address: change.PublicAddress,
        // XXX 2013-04-03 frankban: what's the difference between the agent
        // state and the instance state in this context?
        agent_state: change.Status,
        instance_state: change.Status
      };
      db.units.process_delta(action, unitData);
      db.machines.process_delta(action, machineData);
    },

    /**
      Handle service info coming from the juju-core delta, updating the
      relevant database models.

      @method serviceInfo
      @param {Object} db The app.models.models.Database instance.
      @param {String} action The operation to be performed
       ("add", "change" or "remove").
      @param {Object} change The JSON entity information.
      @param {String} kind The delta event type.
      @return {undefined} Nothing.
     */
    serviceInfo: function(db, action, change) {
      var data = {
        id: change.Name,
        charm: change.CharmURL,
        exposed: change.Exposed
      };
      db.services.process_delta(action, data);
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
      var data = {
        id: change.Key
        // XXX 2013-04-03 frankban: include change.Endpoints.
      };
      db.relations.process_delta(action, data);
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
      var data = {
        id: change.Id,
        instance_id: change.InstanceId
      };
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
          modelList = db.getModelListByModelName(kind),
          id = utils.cleanUpEntityTags(tag);
      if (kind === 'unit') {
        // Clean up the unit name, e.g. "mysql-42" becomes "mysql/42".
        id = id.replace(/-(\d+)$/, '/$1');
      }
      var data = {
        id: id,
        annotations: change.Annotations
      };
      modelList.process_delta(action, data);
    }

  };

}, '0.1.0', {
  requires: [
    'base'
  ]
});
