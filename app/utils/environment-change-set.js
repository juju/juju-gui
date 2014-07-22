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

YUI.add('environment-change-set', function(Y) {
  var ns = Y.namespace('juju'),
      utils = Y.namespace('juju.views.utils');

  var name = 'environment-change-set';

  ns.EnvironmentChangeSet = Y.Base.create(name, Y.Base, [], {

    /**
      Creates the persistent data storage object.

      @method initializer
    */
    initializer: function() {
      this.changeSet = {};
      this.currentCommit = [];
    },

    /* ECS methods */

    /**
      When a command finishes executing, if that command provides a means of
      retrieving an ID or IDs from the RPC data, provide that information to
      any commands down the line that require it within their own contexts.
      The command's idsFromResults should return an array.

      @method _updateChangesetFromResults
      @param {Object} record The current command.
      @param {Object} results The data returned by calling the command.
    */
    _updateChangesetFromResults: function(record, results) {
      for (var level = this.currentLevel + 1;
          level < this.currentCommit.length;
          level += 1) {
        /* jshint -W083 */
        this.currentCommit[level].forEach(function(subrecord) {
          if (subrecord.command.onParentResults &&
              subrecord.parents &&
              subrecord.parents.indexOf(record.key) !== -1) {
            // Possibly mutate the original record on the changeset.
            this.changeSet[subrecord.key].command.onParentResults(
                record, results);
          } // if
        }, this); // foreach
      } // for
    },

    /**
      Returns an array of the parameters this method was called with skipping
      the final parameter because it's the public method options.

      @method _getArgs
      @return {Array} An array of the arguments passed to this method.
    */
    _getArgs: function(args) {
      var lastParam = args[args.length - 1];
      var cut;
      // If there is an object after the callback it's the
      // configuration object for ECS.
      if (Y.Lang.isObject(lastParam) &&
          Y.Lang.isFunction(args[args.length - 2])) {
        cut = -1;
      }
      // Deep copy the resulting array of arguments, in order to prevent
      // changeset functions to mutate the given data structures.
      return Y.clone(Array.prototype.slice.call(args, 0, cut));
    },

    /**
      Generates a random number between 1 and 1000;

      @method _generateRandomNumber
      @return {Integer} A random number.
    */
    _generateRandomNumber: function() {
      return Math.floor((Math.random() * 1000) + 1);
    },

    /**
      Generates a unique key to use for new records.

      @method _generateUniqueKey
      @param {String} type The type of record to create (service, unit, etc).
      @return {Integer} The unique key.
    */
    _generateUniqueKey: function(type) {
      var key = this._generateRandomNumber();
      while (this.changeSet[type + '-' + key] !== undefined) {
        key = this._generateRandomNumber();
      }
      return key;
    },

    /**
      Creates a new record of the appropriate type in the changeSet.

      Each record in the changeSet is an object the following format:

      'parents' {Array} Keys whos commands must finish before it can be run.
      'executed' {Boolean} Weather this command has been executed or not.
      'command' {Object} The env method to call with arguments.

      { parents: ['service-1234'],
        executed: false,
        command: {
          method: 'deploy',
          args: ['foo', 'bar'] } }

      @method _createNewRecord
      @param {String} type The type of record to create (service, unit, etc).
      @param {Object} command The command that's to be executed lazily.
      @return {String} The newly created record key.
    */
    _createNewRecord: function(type, command, parents) {
      var key = type + '-' + this._generateUniqueKey(type);
      parents = parents || [];
      this.changeSet[key] = {
        id: key,
        parents: Y.Array.filter(parents, function(parent) {
          return !!parent;
        }),
        executed: false,
        command: command,
        timestamp: Date.now()
      };
      this.fire('changeSetModified');
      this._wrapCallback(this.changeSet[key]);
      return key;
    },

    /**
      Removes an existing record from the changeSet

      @method _removeExistingRecord
      @param {String} id The id of the record to remove.
    */
    _removeExistingRecord: function(id) {
      delete this.changeSet[id];
      // We need to fire this event so other items in the application know this
      // list has changed.
      this.fire('changeSetModified');
    },

    /**
      Wraps the last function parameter so that we can be notified when it's
      called.

      @method _wrapCallback
      @param {Object} record The individual record object from the changeSet.
    */
    _wrapCallback: function(record) {
      var args = record.command.args;
      var index = args.length - 1;
      var callback = args[index];
      if (!Y.Lang.isFunction(callback)) {
        return;
      }
      /* jshint -W040 */
      // Possible strict violation.
      var self = this;
      /**
        Wrapper function for the supplied callback for the command.
        @method _callbackWrapper
      */
      function _callbackWrapper() {
        record.executed = true;
        // `this` here is in context that the callback is called
        //  under. In most cases this will be `env`.
        var result = callback.apply(this, self._getArgs(arguments));
        self.fire('taskComplete', {
          id: record.id,
          record: record,
          result: arguments
        });
        // Signal that this record has been completed by decrementing the
        // count of records to complete and deleting it from the changeset.
        self.levelRecordCount -= 1;
        delete self.changeSet[record.id];
        self._updateChangesetFromResults(record, arguments);
        self.fire('changeSetModified');
        return result;
      }
      args[index] = _callbackWrapper;
    },

    /**
      Executes the passed in record on the environment.

      @method _execute
      @param {Object} record The individual record object from the changeSet.
    */
    _execute: function(env, record) {
      var command = record.command;
      env[command.method].apply(env, command.args);
    },

    /**
      Build a hierarchy of commits so that actions that depend on others can be
      executed first.

      @method _buildHierarchy
      @param {Object} changeSet A cloned changeSet.  Make sure to clone, as it
        will be mutated in the process of building the hierarchy.
      @return {Array} An array of arrays of commands to commit, separated by
        level.
    */
    _buildHierarchy: function() {
      var hierarchy = [[]],
          command,
          keyToLevelMap = {},
          currLevel = 1;
      this.placedCount = 0;

      // Take care of top-level objects quickly.
      Object.keys(this.changeSet).forEach(Y.bind(function(key) {
        command = this.changeSet[key];
        command.key = key;
        if (!command.parents || command.parents.length === 0) {
          hierarchy[0].push(Y.clone(command));
          command.placed = true;
          keyToLevelMap[key] = 0;
          this.placedCount += 1;
        } else {
          // Default everything else to the first level.
          keyToLevelMap[key] = 1;
        }
      }, this));

      // Now build the other levels of the hierarchy as long as there are still
      // commands in the change set. Functions defined outside of loop for
      // runtime efficiency (jshint W083).
      while (this.placedCount < Object.keys(this.changeSet).length) {
        hierarchy.push([]);
        Y.Object.each(keyToLevelMap, Y.bind(this._placeIfNeeded, this,
            currLevel, keyToLevelMap, hierarchy));
        currLevel += 1;
      }
      return hierarchy;
    },

    /**
      Assign a level to a change in the change set if all of its parents have
      already been placed.

      @method _placeIfNeeded
      @param {Number} currLevel The current level of the hierarchy.
      @param {Object} keyToLevelMap A mapping of all keys and which levels
        they are in.
      @param {Array} hierarchy An array of arrays of placed commands.
      @param {Number} value The current level value.
      @param {String} key The current level key.
    */
    _placeIfNeeded: function(currLevel, keyToLevelMap, hierarchy, value, key) {
      var command = this.changeSet[key];

      if (!command || command.placed) {
        return;
      }

      // Check and see if all of the parents have already been placed.
      var alreadyPlacedParents = true;
      if (command.parents.length > 0) {
        for (var i = 0; i < command.parents.length; i += 1) {
          if (keyToLevelMap[command.parents[i]] >= currLevel) {
            alreadyPlacedParents = false;
          }
        }
      }

      // If so, then the command belongs in the current level, so push it
      // there and increment the placed count.
      if (alreadyPlacedParents) {
        hierarchy[currLevel].push(Y.clone(command));
        command.placed = true;
        keyToLevelMap[key] = currLevel;
        this.placedCount += 1;
      }
    },

    /**
      Commit the next level of the hierarchy of commits to be made.

      @method _commitNext
    */
    _commitNext: function(env) {
      var command;
      this.currentLevel += 1;
      this.levelRecordCount = this.currentCommit[this.currentLevel].length;
      this.currentCommit[this.currentLevel].forEach(function(record) {
        command = this.changeSet[record.key];
        this._execute(env, command);
        this.fire('commit', command);
      }, this);
      // Wait until the entire level has completed (received RPC callbacks from
      // the state server) before starting the next level.
      this.levelTimer = Y.later(200, this, this._waitOnLevel, env, true);
    },

    /**
      Wait until the entire level of commits has been received by the
      environment.  This relies on the fact that _execute wraps the callback
      methods in a wrapper that decrements this.levelRecordCount; once it hits
      0, meaning no commits left in that level, it moves on to either finish up
      or commit the next level.

      @method _waitOnLevel
    */
    _waitOnLevel: function(env) {
      if (this.levelRecordCount === 0) {
        this.levelTimer.cancel();
        if (this.currentLevel < this.currentCommit.length - 1) {
          // Defer execution to prevent stack overflow.
          Y.soon(Y.bind(this._commitNext, this, env));
        } else {
          this.currentLevel = -1;
          delete this.currentCommit;
        }
      }
    },

    /**
      Starts the processing of all of the top level
      commands stored in the changeSet.

      @method commit
    */
    commit: function(env) {
      this.currentCommit = this._buildHierarchy();
      this.currentLevel = -1;
      this._commitNext(env);
    },

    /* End ECS methods */

    /* Private environment methods. */

    /**
      Creates a new entry in the queue for creating a new service.

      Receives all the parameters received by the environment's "deploy"
      method with the exception of the ECS options object.

      @method _lazyDeploy
      @param {Array} args The arguments to deploy the charm with.
    */
    _lazyDeploy: function(args) {
      var command = {
        method: '_deploy',
        args: this._getArgs(args)
      };
      if (command.args.length !== args.length) {
        command.options = args[args.length - 1];
      }
      // The 6th param is the toMachine param of the env deploy call.
      var toMachine = command.args[6];
      if (!this.changeSet[parent]) {
        // If the toMachine isn't a record in the changeSet that means it's
        // an existing machine or that the machine does not exist and one
        // will be created to host this unit. This means that this does not
        // need to be queued behind another command.
        toMachine = [];
      }
      return this._createNewRecord('service', command, toMachine);
    },

    /**
      Creates a new entry in the queue for destroying a service; or, if the
      service is in the queue already, removes it.

      Receives all parameters received by the environment's 'destroy_service'
      method with the exception of the ECS options object.

      @method _lazyDestroyService
      @param {Array} args The arguments used for destroying.
    */
    _lazyDestroyService: function(args) {
      var command = {
        method: '_destroyService',
        args: this._getArgs(args)
      };
      if (command.args.length !== args.length) {
        command.options = args[args.length - 1];
      }
      var existingService;
      // Check if the service is pending in the change set.
      Object.keys(this.changeSet).forEach(function(key) {
        if (this.changeSet[key].command.method === '_deploy') {
          if (this.changeSet[key].command.options.modelId === args[0]) {
            existingService = key;
          }
        }
      }, this);
      if (existingService) {
        this._destroyQueuedService(existingService);
      } else {
        return this._createNewRecord('destroyService', command, []);
      }
    },

    /**
      In the event that a service in the change set needs to be destroyed,
      remove it and all of the entries of which it is a parent.

      @method _destroyQueuedService
      @param {String} service The key of the service to be destroyed.
    */
    _destroyQueuedService: function(service) {
      // Search for everything that has that service as a parent and remove it.
      Object.keys(this.changeSet).forEach(function(key) {
        if (this.changeSet[key].parents.indexOf(service) !== -1) {
          this._removeExistingRecord(key);
        }
      }, this);
      // Remove the service itself.
      var db = this.get('db');
      var modelId = this.changeSet[service].command.options.modelId;
      var model = db.services.getById(modelId);
      var units = model.get('units');
      // Remove the unplaced service units
      units.each(function(unit) {
        db.removeUnits(unit);
      });
      db.services.remove(model);
      model.destroy();
      this._removeExistingRecord(service);
    },

    /**
      Creates a new entry in the queue for destroying a machine; or, if the
      machine is in the queue already, removes it.

      Receives all parameters received by the environment's 'destroyMachines'
      method with the exception of the ECS options object.

      @method _lazyDestroyMachine
      @param {Array} args The arguments used for destroying.
    */
    _lazyDestroyMachines: function(args) {
      var command = {
        method: '_destroyMachines',
        args: this._getArgs(args)
      };
      if (command.args.length !== args.length) {
        command.options = args[args.length - 1];
      }
      // Search for already queued machines.
      var existingMachine;
      Object.keys(this.changeSet).forEach(function(key) {
        if (this.changeSet[key].command.method === '_addMachines') {
          if (this.changeSet[key].command.options.modelId === args[0][0]) {
            existingMachine = key;
          }
        }
      }, this);
      if (existingMachine) {
        this._destroyQueuedMachine(existingMachine);
      } else {
        return this._createNewRecord('destroyMachines', command, []);
      }
    },

    /**
      In the event that a machine in the change set needs to be destroyed,
      remove it and all of the entries of which it is a parent.

      @method _destroyQueuedMachine
      @param {String} machine The key of the machine to be destroyed.
    */
    _destroyQueuedMachine: function(machine) {
      // Search for everything that has that machine as a parent and remove it.
      Object.keys(this.changeSet).forEach(function(key) {
        if (this.changeSet[key].parents.indexOf(machine) !== -1) {
          this._removeExistingRecord(key);
        }
      }, this);
      // Remove the machine itself.
      var db = this.get('db');
      var modelId = this.changeSet[machine].command.options.modelId;
      db.machines.remove(db.machines.getById(modelId));
      this._removeExistingRecord(machine);
    },

    /**
      Creates a new entry in the queue for setting a services config.

      Receives all the parameters received by the environment's "set_config"
      method with the exception of the ECS options object.

      @method _lazySetConfig
      @param {Array} args The arguments to set the config with.
    */
    _lazySetConfig: function(args) {
      var ghostServiceName = args[0],
          parent = [];
      // Search for and add the service to parent.
      Y.Object.each(this.changeSet, function(value, key) {
        if (value.command.method === '_deploy') {
          if (value.command.options.modelId === args[0]) {
            parent.push(key);
            args[0] = value.command.args[1];
          }
        }
      });

      var command = {
        method: '_set_config', // This needs to match the method name in env.
        args: args,
        /**
          Replace changeSet keys with real service names returned from the call.

          @method onParentResults
          @param {String} record The changeSet record which generated the
            results.
          @param {String} results The data returned by the API call.
        */
        onParentResults: function(record, results) {
          if (record.command.method === '_deploy') {
            this.args.forEach(function(arg, index) {
              if (Y.Lang.isArray(arg) &&
                  record.command.options.modelId === arg[0]) {
                this.args[index][0] = results[0].service_name;
              }
            }, this);
          }
        }
      };

      var config = args[1],
          serviceConfig = args[3];
      var service = this.get('db').services.getById(ghostServiceName);
      var changedFields = utils.getChangedConfigOptions(config, serviceConfig);
      // Set the values in the service model and keep the dirty fields array
      // up to date.
      service._dirtyFields = service._dirtyFields
                                    .concat(Object.keys(changedFields));
      service.setAttrs(
          config,
          Y.mix(service.get('config'), changedFields, true, null, null, true));
      // XXX Jeff - We may want to flatten this into the deploy service
      // command on 'commit' if there is a queued service for this command.
      // We will want to flatten multiple setConfig calls to the same service
      // on 'commit'.
      return this._createNewRecord('setConfig', command, parent);
    },

    /**
      Creates a new entry in the queue for adding a relation.

      Receives all the parameters received by the environment's "add_relation"
      method with the exception of the ECS options object.

      @method _lazyAddRelation
      @param {Array} args The arguments to add the relation with.
    */
    _lazyAddRelation: function(args) {
      var serviceA;
      var serviceB;
      Y.Object.each(this.changeSet, function(value, key) {
        if (value.command.method === '_deploy') {
          if (value.command.options.modelId === args[0][0]) {
            serviceA = key;
          }
          if (value.command.options.modelId === args[1][0]) {
            serviceB = key;
          }
        }
      });
      var parent = [serviceA, serviceB];
      var command = {
        method: '_add_relation',
        args: args,
        /**
          Replace changeSet keys with real service names returned from the call.

          @method onParentResults
          @param {String} record The changeSet record which generated the
            results.
          @param {String} results The data returned by the API call.
        */
        onParentResults: function(record, results) {
          if (record.command.method === '_deploy') {
            this.args.forEach(function(arg, index) {
              if (Y.Lang.isArray(arg) &&
                  record.command.options.modelId === arg[0]) {
                this.args[index][0] = results[0].service_name;
              }
            }, this);
          }
        }
      };
      return this._createNewRecord('addRelation', command, parent);
    },

    /**
      Creates a new entry in the queue for removing a relation.

      Receives all the parameters received by the environment's
      "remove_relation" method with the exception of the ECS options object.

      @method _lazyRemoveRelation
      @param {Array} args The arguments to remove the relation with.
    */
    _lazyRemoveRelation: function(args) {
      // If an existing ecs record for this relation exists, remove it from the
      // queue.
      var changeSet = this.changeSet,
          argsEndpoints = [args[0], args[1]],
          ghosted = false,
          command, record;
      var relations = this.get('db').relations;
      Object.keys(changeSet).forEach(function(key) {
        command = changeSet[key].command;
        if (command.method === '_add_relation') {
          // If there is a matching ecs relation then remove it from the queue.
          if (relations.compareRelationEndpoints(
                                        [command.args[0], command.args[1]],
                                        argsEndpoints)) {
            ghosted = true;
            this._removeExistingRecord(key);
            // Remove the relation from the relations db. Even the ghost
            // relations are stored in the db.
            relations.remove(relations.getRelationFromEndpoints(argsEndpoints));
          }
        }
      }, this);
      // If the relation wasn't found in the ecs then it's a real relation.
      if (!ghosted) {
        record = this._createNewRecord('removeRelation', {
          method: '_remove_relation',
          args: args
        });
        // XXX We will probably want to mark that the relation line is pending
        // to be destroyed. Awaiting feedback from design. 06-23-2014 Jeff
      }
      return record;
    },

    /**
      Creates a new entry in the queue for removing a unit.

      Receives all the parameters received by the environment's
      "_remove_unit" method with the exception of the ECS options object.

      @method _lazyRemoveUnit
      @param {Array} args The arguments to remove the relation with.
    */
    _lazyRemoveUnit: function(args) {
      // If an existing ecs record for this unit exists, remove it from the
      // queue.
      var changeSet = this.changeSet,
          ghosted = false,
          service = args[0],
          units = this.get('db').units,
          command, record;
      Object.keys(changeSet).forEach(function(key) {
        command = changeSet[key].command;
        if (command.method === '_add_units') {
          // If there is a matching ecs unit then remove it from the queue.
          if (command.args[0] === service) {
            ghosted = true;
            this._removeExistingRecord(key);
            // Remove the unit from the units DB. Even the ghost units are
            // stored in the DB.
            units.remove({service: service});
          }
        }
      }, this);
      // If the unit wasn't found in the ecs then it's a real unit.
      if (!ghosted) {
        record = this._createNewRecord('removeUnit', {
          method: '_remove_units',
          args: args
        });
      }
      return record;
    },
    /**
      Creates a new entry in the queue for adding machines/containers.

      Receives all the parameters received by the environment's "addMachines"
      method with the exception of the ECS options object.

      @method lazyAddMachines
      @param {Array} args The arguments to add the machines with.
      @param {Object} options The ECS options including a modelId field
        representing the ghost machine model instance identifier.
    */
    lazyAddMachines: function(args, options) {
      var parent = [];
      // Search for and add the container to its parent machine.
      args[0].forEach(function(param) {
        if (param.parentId) {
          Y.Object.each(this.changeSet, function(value, key) {
            var command = value.command;
            if (command.method === '_addMachines' &&
                command.options.modelId === param.parentId) {
              parent.push(key);
            }
          }, this);
        }
      }, this);
      var command = {
        method: '_addMachines',
        args: args,
        options: options,
        /**
          Replace changeSet keys with real machine IDs returned from the call.

          Note: this only works with one machine for the moment.

          @method onParentResults
          @param {String} record The changeSet record which generated the
            results.
          @param {String} results The data returned by the API call.
        */
        onParentResults: function(record, results) {
          // Assume the machine we are interested in is the first one.
          if (record.command.method === '_addMachines') {
            // We are only interested in machine parent results.
            var currentParentId = record.command.options.modelId;
            var newParentId = results[0].machines[0].name;
            this.args[0].forEach(function(param) {
              param.parentId = param.parentId.replace(
                  currentParentId, newParentId);
            });
          }
        }
      };
      return this._createNewRecord('addMachines', command, parent);
    },

    /**
      Creates a new entry in the queue for adding service units.

      Receives all the parameters received by the environment's "add_unit"
      method with the exception of the ECS options object.

      @method lazyAddUnits
      @param {Array} args The arguments to add the units with.
      @param {Object} options The ECS options including a modelId field
        representing the ghost unit model instance identifier.
    */
    lazyAddUnits: function(args, options) {
      var parent = [];
      // Search for and add the service to parent.
      Y.Object.each(this.changeSet, function(value, key) {
        if (value.command.method === '_deploy') {
          if (value.command.options.modelId === args[0]) {
            parent.push(key);
            args[0] = value.command.args[1];
          }
        }
      });
      // If toMachine is specified, search for and add the machine to parent.
      var toMachine = args[2];
      if (toMachine) {
        Y.Object.each(this.changeSet, function(value, key) {
          var command = value.command;
          if (command.method === '_addMachines' &&
              command.options.modelId === toMachine) {
            parent.push(key);
          }
        }, this);
      }
      var command = {
        method: '_add_unit',
        args: args,
        options: options,
        /**
          Replace the toMachine argument with the real one in results, returned
          by the addMachines API call.

          Note: this only works with one machine for the moment.

          @method onParentResults
          @param {String} record The changeSet record which generated the
            results.
          @param {String} results The data returned by the API call.
        */
        onParentResults: function(record, results) {
          // Assume the machine we are interested in is the first one.
          if (record.command.method === '_addMachines') {
            // We are only interested in machine parent results.
            var newMachineId = results[0].machines[0].name;
            this.args[2] = newMachineId;
          }
        }
      };
      return this._createNewRecord('addUnits', command, parent);
    },

    /**
      Given a Unit ID, retrieve the changeSet record for that unit.

      @method _retrieveUnitRecord
      @param {String} unitId The ID of the unit to retrieve.
      @return {Object} the unit
    */
    _retrieveUnitRecord: function(unitId) {
      var record;
      Y.Object.some(this.changeSet, function(value, key) {
        var command = value.command;
        if (command.method === '_add_unit' &&
            command.options.modelId === unitId) {
          record = value;
          return true;
        }
      });
      return record;
    },

    /**
      Place a unit on a machine or container.

      @method placeUnit
      @param {Object} unit The unit to place.
      @param {String} machineId The id of the destination machine.
    */
    placeUnit: function(unit, machineId) {
      var record = this._retrieveUnitRecord(unit.id);
      if (!record) {
        throw 'attempted to place a unit which has not been added: ' + unit.id;
      }
      // When placeUnit is called the unit could have been already placed on a
      // ghost machine. In that case the corresponding addMachines parent has
      // been set to the addUnit record. When we place the unit again, that
      // parent is no longer relevant and must be removed. At this point either
      // the unit is re-placed to a ghost, in which case a new parent is added,
      // or an existing machine will host the unit, in which case we don't need
      // a parent at all.
      record.parents = record.parents.filter(function(parent) {
        return parent.indexOf('addMachines') !== 0;
      });
      // Add the new addMachines parent.
      var containerExists = true;
      Y.Object.each(this.changeSet, function(value, key) {
        var command = value.command;
        if (command.method === '_addMachines' &&
            command.options.modelId === machineId) {
          record.parents.push(key);
          containerExists = false;
        }
      }, this);
      // Update the command in the changeset to place the unit on an already
      // existing machine.
      if (containerExists && machineId) {
        record.command.args[2] = machineId;
      }
      // Place the unit in the db.
      var unitsDb = this.get('db').units;
      // Because each 'model' in a lazy model list is actually just an object
      // it doesn't fire change events. We need to revive it to a real object,
      // make the change then the change events will fire.
      var unitModel = unitsDb.revive(unit);
      unitModel.set('machine', machineId);
      unitsDb.free(unitModel);
    }

    /* End private environment methods. */

  }, {
    ATTRS: {
      /**
        Reference to the db
        @attribute db
      */
      db: {}
    }
  });

}, '', {
  requires: [
    'base',
    'base-build',
    'juju-view-utils'
  ]
});
