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
  /**
     Each handler is called passing the db instance, a name identifying what
     will be changed (e.g. "unit", "service", "unitInfo"), the action to be
     performed ("add", "change" or "remove") and the changeset coming from
     the environment.
     Each handler must return a sequence of sequences containing:
       - the model or model list to modify (e.g. db.environment, db.services,
         db.relations, db.units, db.machines), or, in general, an object
         with a "process_delta" method;
       - the action ("add", "change" or "remove");
       - the data to be added, changed or removed.
  */
  models.handlers = {

    pyDelta: function(db, name, action, changeset) {
      var modelList = db.getModelListByModelName(name),
          data;
      if (action === 'add' || action === 'change') {
        data = Object.create(null);
        Y.each(changeset, function(value, key) {
          data[key.replace('-', '_')] = value;
        });
      } else {
        data = changeset;
      }
      return [[modelList, action, data]];
    },

    unitInfo: function(db, name, action, changeset) {

    }

  };

}, '0.1.0', {
  requires: [
    'base'
  ]
});
