/*
This file is part of the Juju GUI, which lets users view and manage Juju
models within a graphical interface (https://launchpad.net/juju-gui).
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
      this.currentIndex = 0;
      this.committing = false;
    },

    /* ECS methods */

    /**
      Retrieve only the changeSet items for the current index, a utility method
      used by the deployer bar to only show the currently active change set
      items.

      @method getCurrentChangeSet
      @return {Object} The current set of changeSet items
    */
    getCurrentChangeSet: function() {
      var currentChangeSet = {};
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        if (value.index === this.currentIndex) {
          currentChangeSet[key] = value;
        }
      });
      return currentChangeSet;
    },

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
      var changeSet = this.changeSet,
          changeSetRecord;
      Object.keys(changeSet).forEach(function(key) {
        changeSetRecord = changeSet[key];
        if (changeSetRecord.command.onParentResults &&
            changeSetRecord.parents &&
            changeSetRecord.parents.indexOf(record.key) !== -1) {
          changeSetRecord.command.onParentResults(record, results);
        }
      });
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
      Given a unit and reference to the db get that units series.
      @param {Object} unit The unit object.
      @param {Object} db reference to the db.
      @return {String} The charm series.
    */
    _getUnitSeries: (unit, db) =>
      db.services.getServiceByName(unit.id.split('/')[0]).get('series'),

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
        index: this.currentIndex,
        parents: parents.filter(parent => {
          return !!parent;
        }),
        executed: false,
        command: command,
        timestamp: Date.now()
      };
      document.dispatchEvent(new Event('ecs.changeSetModified'));
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
      document.dispatchEvent(new Event('ecs.changeSetModified'));
    },

    /**
      Wraps the last function parameter so that we can be notified when it's
      called.

      @method _wrapCallback
      @param {Object} record The individual record object from the changeSet.
    */
    _wrapCallback: function(record) {
      const args = record.command.args;
      // By convention, the callback is the last argument.
      const callback = args[args.length - 1];
      const self = this;
      args[args.length - 1] = function() {
        record.executed = true;
        self._markCommitStatus('committed', record.command);
        let result = null;
        if (callback) {
          // `this` here is in context that the callback is called
          //  under. In most cases this will be `env`.
          result = callback.apply(this, arguments);
        }
        document.dispatchEvent(new CustomEvent('ecs.taskComplete', {
          detail: {
            id: record.id,
            record: record,
            result: arguments
          }
        }));
        // Signal that this record has been completed by decrementing the
        // count of records to complete and deleting it from the changeset.
        self.levelRecordCount -= 1;
        delete self.changeSet[record.id];
        self._updateChangesetFromResults(record, arguments);
        document.dispatchEvent(new Event('ecs.changeSetModified'));
        return result;
      };
    },

    /**
      Executes the passed in record on the model.

      @method _execute
      @param {Object} record The individual record object from the changeSet.
    */
    _execute: function(env, record) {
      var command = record.command;
      // Commands may define a prepare method to be called before the actual
      // external command execution.
      if (command.prepare) {
        command.prepare(this.get('db'), this);
      }
      this._markCommitStatus('in-progress', record.command);
      // XXX we should ensure that the method is actually a function.
      // Makyo 2017-07-26
      env[command.method].apply(env, command.args);
    },

    /**
      Build a hierarchy of commits so that actions that depend on others can be
      executed first.

      @method _buildHierarchy
      @param {Boolean} removeUnplaced Whether to remove unplaced units from the
        hierarchy, as in the instance of committing changes, or not, as in the
        case of clearing changes.
      @return {Array} An array of arrays of commands to commit, separated by
        level.
    */
    _buildHierarchy: function(removeUnplaced) {
      var hierarchy = [[]],
          command,
          keyToLevelMap = {},
          currLevel = 1,
          keys = [],
          db = this.get('db'),
          unplacedUnits = db.units.filterByMachine(null);
      this.placedCount = 0;

      // Retrieve only the keys for changeSet entries in the current index.
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        if (value.index === this.currentIndex) {
          keys.push(key);
        }
      });

      // Filter out unplaced units and increment their changeSet index;
      // they should remain undeployed by default.
      if (unplacedUnits && removeUnplaced) {
        var unplacedIds = unplacedUnits.map(function(u) { return u.id; });
        keys = keys.filter(function(key) {
          var command = this.changeSet[key].command,
              modelId = command.options && command.options.modelId;
          // Return all non-add-unit records
          if (command.method !== '_add_unit') {
            return true;
          }
          // If the unit isn't unplaced, return that.  If it is unplaced,
          // remove it from the list and increment its indiex so that it
          // can be committed next time.
          if (unplacedIds.indexOf(modelId) < 0) {
            return true;
          } else {
            this.changeSet[key].index += 1;
            return false;
          }
        }, this);
      }

      // Take care of top-level objects quickly.
      keys.forEach(key => {
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
      });

      // Now build the other levels of the hierarchy as long as there are still
      // commands in the change set. Functions defined outside of loop for
      // runtime efficiency.
      while (this.placedCount < keys.length) {
        hierarchy.push([]);
        Object.keys(keyToLevelMap).forEach(key => {
          this._placeIfNeeded(
            currLevel, keyToLevelMap, hierarchy, keyToLevelMap[key], key);
        });
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
    _commitNext: function(env, currentIndex) {
      var record;
      this.currentLevel += 1;
      this.levelRecordCount = this.currentCommit[this.currentLevel].length;
      this.currentCommit[this.currentLevel].forEach(function(changeSetRecord) {
        record = this.changeSet[changeSetRecord.key];
        this._execute(env, record);
        document.dispatchEvent(new CustomEvent('ecs.commit', {
          detail: record
        }));
      }, this);
      // Wait until the entire level has completed (received RPC callbacks from
      // the state server) before starting the next level.
      this.levelTimer = window.setInterval(this._waitOnLevel.bind(this), 200,
        env, currentIndex);

    },

    /**
      Wait until the entire level of commits has been received by the
      model.  This relies on the fact that _execute wraps the callback
      methods in a wrapper that decrements this.levelRecordCount; once it hits
      0, meaning no commits left in that level, it moves on to either finish up
      or commit the next level.

      @method _waitOnLevel
    */
    _waitOnLevel: function(env, currentIndex) {
      if (this.levelRecordCount === 0) {
        window.clearInterval(this.levelTimer);
        if (this.currentLevel < this.currentCommit.length - 1) {
          // Defer execution to prevent stack overflow.
          window.setTimeout(this._commitNext.bind(this, env, currentIndex), 0);
        } else {
          this.currentLevel = -1;
          // If there is an error committing and the ECS is aborted, running
          // commit again will reset this. This is the only exit point from
          // committing.
          this.committing = false;
          delete this.currentCommit;
          document.dispatchEvent(new CustomEvent('ecs.currentCommitFinished', {
            detail: {
              index: currentIndex
            }
          }));
        }
      }
    },

    /**
      Mark the supplied commands associated model to the supplied commit status.

      @method _markCommitStatus
      @param {String} status The status to set the 'commitStatus' attr to.
      @param {Object} command The command from the changeSet record.
    */
    _markCommitStatus: function(status, command) {
      var db = this.get('db'),
          modelList;
      // When we add commit status changes to services, relations etc they will
      // be switched here.
      switch (command.method) {
        case '_addMachines':
          modelList = db.machines;
          break;
      }
      if (modelList) {
        // When working with ghost services we are passed a modelId which points
        // to the proper model. So we fetch that model.
        var model = modelList.getById(command.options.modelId);
        // If the modelList was stubbed in tests, ensure that we have an actual
        // model to work with.
        if (model) {
          // Depending on the modellist this model may be an object from a
          // lazymodellist or a Y.Model from a regular model list.
          if (!(model instanceof Y.Model)) {
            // We need to revive the model if it's an Object so that other
            // parts of the application can listen for the change event.
            model = modelList.revive(model);
          }
          model.set('commitStatus', status);
          if (typeof modelList.free === 'function') {
            modelList.free(model);
          }
        }
      }
    },

    /**
      Starts the processing of all of the top level
      commands stored in the changeSet.

      @method commit
    */
    commit: function(env) {
      // Build the hierarchy, but do not include unplaced units.
      this.currentCommit = this._buildHierarchy(true);
      this.currentIndex += 1;
      this.currentLevel = -1;
      this.committing = true;
      this._commitNext(env, this.currentIndex - 1);
    },

    /**
      Check to see if the current commit is in progress.

      @return {Boolean} true if the commit is in progress.
    */
    isCommitting: function() {
      return this.committing;
    },

    /**
      Clears all of the items in the changeset and all of their corresponding
      database changes.

      @method clear
    */
    clear: function() {
      // Build the hierarchy, but include unplaced units, as they will be
      // removed as well.
      var toClear = this._buildHierarchy(false);
      // We need to work through the hierarchy of changes in reverse, otherwise
      // removing units will fail as the service might not exist anymore.
      toClear.reverse().forEach(function(level) {
        level.forEach(function(change) {
          this._clearFromDB(change.command);
        }.bind(this));
      }.bind(this));
      // Wipe out the current index from the changeset.
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        if (value.index === this.currentIndex) {
          delete this.changeSet[key];
        }
      });
      this.currentIndex += 1;
      this.currentCommit = [];
      this.committing = false;
      document.dispatchEvent(new Event('ecs.changeSetModified'));
      this.get('db').fireEvent('update');
    },

    /**
      Removes a model or a change from the database corresponding to an item
      in the changeSet.

      @method _clearFromDB
      @param {Object} command The command from the changeset.
    */
    _clearFromDB: function(command) {
      var db = this.get('db'),
          services = db.services,
          machines = db.machines,
          relations = db.relations,
          units = db.units;
      switch (command.method) {
        case '_addCharm':
          // Leaving the charm in memory doesn't pose any negative side
          // effects so once it's added we just leave it there.
          break;
        case '_deploy':
          services.remove(services.getById(command.options.modelId));
          break;
        case '_destroyApplication':
          services.getById(command.args[0]).set('deleted', false);
          break;
        case '_destroyMachines':
          var machineId = command.args[0][0];
          // Set the parent machine to not be deleted.
          machines.getById(command.args[0]).deleted = false;
          // Set the containers of the parent machine to not be deleted.
          machines.filterByAncestor(machineId).forEach(machine => {
            machine.deleted = false;
          });
          units.filterByMachine(machineId, true).forEach(unit => {
            unit.deleted = false;
          });
          break;
        case '_set_config':
          var service = services.getById(command.args[0]);
          var config = service.get('config');
          var envConfig = service.get('environmentConfig');
          Object.keys(config).forEach(function(key) {
            // Return the local configuration values to the values in the env.
            // The local config value has keys with undefined values where as
            // the one from the model only has values with truthy values.
            config[key] = envConfig[key];
          });
          service.set('config', config);
          break;
        case '_add_relation':
          relations.remove(relations.getById(command.options.modelId));
          break;
        case '_remove_relation':
          relations.getRelationFromEndpoints([
            command.args[0],
            command.args[1]
          ]).set('deleted', false);
          break;
        case '_remove_units':
          command.args[0].forEach(function(unit) {
            units.getById(unit).deleted = false;
          });
          break;
        case '_expose':
          services.getById(command.args[0]).set('exposed', false);
          break;
        case '_unexpose':
          services.getById(command.args[0]).set('exposed', true);
          break;
        case '_addMachines':
          machines.remove(machines.getById(command.options.modelId));
          break;
        case '_add_unit':
          db.removeUnits(units.getById(command.options.modelId));
          break;
      }
    },

    /* End ECS methods */

    /* Private model methods. */

    /**
      Creates a new entry in the queue for adding a charm to the controller.

      Receives all the parameters received by the models "addCharm" method
      with the exception of the ECS options object.

      @method lazyAddCharm
      @param {Array} args The arguments to add the charm with.
      @param {Object} options The ECS options.
    */
    lazyAddCharm: function(args, options) {
      const existing = Object.keys(this.changeSet).some(key => {
        return this.changeSet[key].command.args[0] === args[0];
      });
      // If there is an existing record for this charm then don't add another.
      if (existing) {
        return;
      }
      const command = {method: '_addCharm', args: args, options: options};
      return this._createNewRecord('addCharm', command, []);
    },

    /**
      Creates a new entry in the queue to add the pending resources.
      @param {Array} The arguments to add the pending resources with.

      @method lazyAddPendingResources
      @param {Array} args The arguments to add resources with.
      @param {Object} options The ECS options.
    */
    lazyAddPendingResources: function(args, options) {
      const command = {
        method: '_addPendingResources',
        args: args,
        options: options
      };
      // Set up the parents of this record.
      const parents = [];
      Object.keys(this.changeSet).forEach(key => {
        const command = this.changeSet[key].command;
        if (command.method === '_addCharm') {
          // Get the key to the record which adds the charm for this app.
          if (command.args[0] === args[0].charmURL) {
            parents.push(key);
          }
        }
      });
      return this._createNewRecord('addPendingResources', command, parents);
    },

    /**
      Creates a new entry in the queue for adding SSH keys to the model.

      Receives all the parameters required for the model's "addKeys"
      method with the exception of the ECS options object.

      @method lazyAddSSHKeys
      @param {Array} args The arguments to add SSH keys with.
      @param {Object} options The ECS options.
    */
    lazyAddSSHKeys: function(args, options) {
      const command = {
        method: '_addKeys',
        args: args,
        options: options
      };
      return this._createNewRecord('addSSHKeys', command, []);
    },

    /**
      Creates a new entry in the queue for importing SSH keys to the model.

      Receives all the parameters required for the model's "importKeys"
      method with the exception of the ECS options object.

      @method lazyImportSSHKeys
      @param {Array} args The arguments to import SSH keys with.
      @param {Object} options The ECS options.
    */
    lazyImportSSHKeys: function(args, options) {
      const command = {
        method: '_importKeys',
        args: args,
        options: options
      };
      return this._createNewRecord('importSSHKeys', command, []);
    },

    /**
      Creates a new entry in the queue for creating a new service.

      Receives all the parameters received by the model's "deploy"
      method with the exception of the ECS options object.

      @method lazyDeploy
      @param {Array} args The arguments to deploy the charm with.
      @param {Object} options The ECS options.
    */
    lazyDeploy: function(args, options) {
      var command = {
        method: '_deploy',
        args: args,
        options: options,
        /**
          Called immediately before executing the deploy command.

          @method prepare
          @param {Object} db The database instance.
        */
        prepare: function(db) {
          if (!this.options || !this.options.modelId) {
            // When using the deploy-target query parameter we want to auto
            // deploy so we can skip generating the line item in the deployer
            // bar.
            return;
          }
          const ghostService = db.services.getById(this.options.modelId);
          const deployArgs = this.args[0];
          // Update the application name, which can change from when the
          // charm is added to the canvas to the actual time the changes are
          // committed.
          deployArgs.applicationName = ghostService.get('name');
          // Update the application series, which can change from when the
          // charm is added to the canvas to the time that the changes are
          // committed.
          const series = ghostService.get('series');
          if (series) {
            deployArgs.series = series;
          }
          // Loop through the services settings and remove any which have
          // undefined values so that they aren't set as 'undefined'.
          const config = deployArgs.config || {};
          Object.keys(config).forEach(key => {
            if (config[key] === undefined) {
              delete config[key];
            }
          });
          // Check if we have any resources, if we do, then add them.
          const resourceIds = ghostService.get('resourceIds');
          if (resourceIds) {
            deployArgs.resources = resourceIds;
          }
        }
      };
      // Set up the parents of this record.
      const parents = [];
      Object.keys(this.changeSet).forEach(key => {
        const command = this.changeSet[key].command;
        if (command.method === '_addCharm') {
          // Get the key to the record which adds the charm for this app.
          if (command.args[0] === args[0].charmURL) {
            parents.push(key);
          }
        }
        if (command.method === '_addPendingResources') {
          if (command.args[0].applicationName === args[0].applicationName) {
            parents.push(key);
          }
        }
      });
      return this._createNewRecord('service', command, parents);
    },

    /**
      Creates a new entry in the queue for destroying an application; or, if
      the service is in the queue already, removes it.

      Receives all parameters received by the model's
      'destroyApplication' method with the exception of the ECS options object.

      @method lazyDestroyApplication
      @param {Array} args The arguments used for destroying.
      @param {Object} options The ECS options.
    */
    lazyDestroyApplication: function(args, options) {
      var command = {
        method: '_destroyApplication',
        args: args,
        options: options
      };
      let existingService;
      let record;
      // Check if the service is pending in the change set.
      Object.keys(this.changeSet).some(key => {
        if (this.changeSet[key].command.method === '_deploy') {
          if (this.changeSet[key].command.options.modelId === args[0]) {
            existingService = key;
            record = this.changeSet[key];
            return true;
          }
        }
      });
      if (existingService) {
        this._destroyQueuedService(existingService, record);
      } else {
        var service = this.get('db').services.getById(args[0]);
        // Remove any unplaced units.
        var units = [];
        service.get('units').each(function(unit) {
          units.push(unit.id);
        }, this);
        this.lazyRemoveUnit([units, null], {});
        service.set('deleted', true);
        return this._createNewRecord('destroyApplication', command, []);
      }
    },

    /**
      In the event that a service in the change set needs to be destroyed,
      remove it and all of the entries of which it is a parent as well as
      the addCharm call associated with this application.

      @method _destroyQueuedService
      @param {String} recordKey The key of the application to be destroyed.
      @param {String} record The changeSet record for the application.
    */
    _destroyQueuedService: function(recordKey, record) {
      // Search for everything that has that service as a parent and remove it.
      Object.keys(this.changeSet).forEach(function(key) {
        if (this.changeSet[key].parents.indexOf(recordKey) !== -1) {
          this._removeExistingRecord(key);
        }
      }, this);
      // Remove the service itself.
      var db = this.get('db');
      var modelId = this.changeSet[recordKey].command.options.modelId;
      var model = db.services.getById(modelId);
      var units = model.get('units');
      const relations = db.relations.get_relations_for_service(model);
      // Remove the unplaced service units
      units.each(function(unit) {
        db.removeUnits(unit);
      });
      // Remove the associated relations
      db.relations.remove(relations);
      db.services.remove(model);
      model.destroy();
      this._removeExistingRecord(recordKey);
      // Check if there are other applications using the same charm. If not
      // then remove the addCharm call.
      record.parents.some(key => {
        if (key.indexOf('addCharm-') === 0) {
          const used = Object.keys(this.changeSet).some(recordKey => {
            if (recordKey.indexOf('service-') === 0) {
              return this.changeSet[recordKey].parents.includes(key);
            }
          });
          // If the addCharm call is not used anywhere else then it can be
          // safely removed.
          if (!used) {
            // It is possible that some resources were added with the charm
            // which also needs to be removed.
            record.parents.forEach(key => {
              if (key.indexOf('addPendingResources-') === 0) {
                this._removeExistingRecord(key);
              }
            });
            this._removeExistingRecord(key);
          }
        }
      });
    },

    /**
      Creates a new entry in the queue for destroying a machine; or, if the
      machine is in the queue already, removes it.

      Receives all parameters received by the model's 'destroyMachines'
      method with the exception of the ECS options object.

      @method lazyDestroyMachine
      @param {Array} args The arguments used for destroying.
      @param {Object} options The ECS options.
    */
    lazyDestroyMachines: function(args, options) {
      var command = {
        method: '_destroyMachines',
        args: args,
        options: options
      };
      // Search for already queued machines.
      var existingMachine;
      Object.keys(this.changeSet).forEach(function(key) {
        if (this.changeSet[key].command.method === '_addMachines') {
          if (this.changeSet[key].command.options.modelId === args[0][0]) {
            existingMachine = key;
          }
        }
      }, this);
      var db = this.get('db');
      var machine = db.machines.getById(command.args[0]);
      var units = db.units.filterByMachine(machine.id, true);
      // Remove the unit from the machine.
      var removedUnits = units.filter(unit => this.unplaceUnit(unit));
      if (machine.parentId) {
        // Remove the removed units from the parent machines unit list.
        var parentMachine = db.machines.getById(machine.parentId);
        removedUnits.forEach(function(unit) {
          var idx = parentMachine.units.indexOf(unit);
          parentMachine.units.splice(idx, 1);
        });
      }
      // Remove the units record of the machine
      if (existingMachine) {
        this._destroyQueuedMachine(existingMachine);
      } else {
        var allMachines = db.machines.filterByAncestor(machine.id);
        // Add the parent to the list.
        allMachines.unshift(machine);
        // Loop through all of the machines setting them to deleted.
        allMachines.forEach(machine => {
          var machineModel = db.machines.revive(machine);
          machineModel.set('deleted', true);
          db.machines.free(machineModel);
        });
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
        var change = this.changeSet[key];
        var idx = change.parents ? change.parents.indexOf(machine) : -1;
        if (idx !== -1) {
          // If the child is an add unit command, we just want to remove the
          // machine as a parent. If it's a container or something else, we want
          // to remove the record along with this one.
          if (change.command.method === '_add_unit') {
            // Remove the machine record from the _add_unit's parents
            change.parents.splice(idx, 1);
            change.command.args[2] = null; // remove the toMachine arg.
          } else {
            this._removeExistingRecord(key);
          }
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

      Receives all the parameters received by the model's "set_config"
      method with the exception of the ECS options object.

      @method lazySetConfig
      @param {Array} args The arguments to set the config with.
      @param {Object} options The ECS options.
    */
    lazySetConfig: function(args, options) {
      var ghostServiceName = args[0],
          parent = [];
      // Search for and add the service to parent.
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        if (value.command.method === '_deploy') {
          if (value.command.options.modelId === args[0]) {
            parent.push(key);
          }
        }
      });

      var command = {
        method: '_set_config', // This needs to match the method name in env.
        args: args,
        options: options,
        /**
          Replace changeSet keys with real service names returned from the call.

          @method onParentResults
          @param {String} record The changeSet record which generated the
            results.
          @param {String} results The data returned by the API call.
        */
        onParentResults: function(record, results) {
          if (record.command.method === '_deploy') {
            // After deploy change the temp id to the real name.
            const tempId = this.args[0];
            if (
              tempId.indexOf('$') > -1 &&
              record.command.options.modelId === tempId
            ) {
              const applicationName = results[1];
              this.args[0] = applicationName;
            }
          }
        }
      };

      var config = args[1];
      var service = this.get('db').services.getById(ghostServiceName);
      // Only the modified options are sent to the API backend. With the
      // new React configuration system the modified values is determined
      // in the view and set in the service model so we can faithfully
      // take what it says to set as correct.
      var changedFields = config;
      // Set the values in the service model and keep the dirty fields array
      // up to date.
      var DIRTYFIELDS = '_dirtyFields';
      var dirtyFields = service.get(DIRTYFIELDS);
      dirtyFields = dirtyFields.concat(Object.keys(changedFields));
      service.set(DIRTYFIELDS, dirtyFields);
      service.set(
        'config',
        Y.mix(service.get('config'), changedFields, true, null, null, true));
      // XXX Jeff - We may want to flatten this into the deploy service
      // command on 'commit' if there is a queued service for this command.
      // We will want to flatten multiple setConfig calls to the same service
      // on 'commit'.
      return this._createNewRecord('setConfig', command, parent);
    },

    /**
      Creates a new entry in the queue for adding a relation.

      Receives all the parameters received by the model's "add_relation"
      method with the exception of the ECS options object.

      @method lazyAddRelation
      @param {Array} args The arguments to add the relation with.
      @param {Object} options The ECS options.
    */
    lazyAddRelation: function(args, options) {
      var serviceA;
      var serviceB;
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
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
        options: options,
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
              if (
                Array.isArray(arg) &&
                record.command.options.modelId === arg[0]
              ) {
                const applicationName = results[1];
                this.args[index][0] = applicationName;
              }
            }, this);
          }
        }
      };
      return this._createNewRecord('addRelation', command, parent);
    },

    /**
      Creates a new entry in the queue for removing a relation.

      Receives all the parameters received by the model's
      "remove_relation" method with the exception of the ECS options object.

      @method lazyRemoveRelation
      @param {Array} args The arguments to remove the relation with.
      @param {Object} options The ECS options.
    */
    lazyRemoveRelation: function(args, options) {
      // If an existing ecs record for this relation exists, remove it from the
      // queue.
      const changeSet = this.changeSet;
      const argsEndpoints = [args[0], args[1]];
      let ghosted = false;
      let command, record;
      const db = this.get('db');
      const relations = db.relations;
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
          args: args,
          options: options
        });
        relations.getRelationFromEndpoints(argsEndpoints).set('deleted', true);
      }
      return record;
    },

    /**
      Creates a new entry in the queue for removing a unit.

      Receives all the parameters received by the model's
      "_remove_unit" method with the exception of the ECS options object.

      @method lazyRemoveUnit
      @param {Array} args The arguments to remove the unit with.
      @param {Object} options The ECS options.
    */
    lazyRemoveUnit: function(args, options) {
      // If an existing ecs record for this unit exists, remove it from the
      // queue.
      var changeSet = this.changeSet,
          toRemove = args[0],
          db = this.get('db'),
          units = db.units,
          command, record;
      // XXX It is currently not possible to remove pending units, there may
      // be future work around this - Makyo 2014-08-13
      Object.keys(changeSet).forEach(function(key) {
        command = changeSet[key].command;
        if (command.method === '_add_unit') {
          // XXX Currently, modelId is a single unit's name.  In the future,
          // this will likely be an array and an intersection between the two
          // will need to be found. Makyo 2014-08-15
          var unitName = command.options.modelId;
          var unitIndex = toRemove.indexOf(unitName);
          // If there is a matching ecs unit then remove it from the queue.
          if (unitIndex !== -1) {
            toRemove.splice(unitIndex, 1);
            this._removeExistingRecord(key);
            // Remove the unit from the units DB. Even the ghost units are
            // stored in the DB.
            var unit = units.getById(unitName);
            db.removeUnits(unit);
          }
        }
      }, this);
      // If the unit wasn't found in the ecs then it's a real unit.
      if (toRemove.length > 0) {
        args[0] = toRemove;
        record = this._createNewRecord('removeUnit', {
          method: '_remove_units',
          args: args,
          options: options
        });
        args[0].forEach(function(unit) {
          var unit = units.getById(unit);
          var unitModel = units.revive(unit);
          unitModel.set('deleted', true);
          units.free(unitModel);
          db.fireEvent('update');
        });
        // XXX We would like to be able to update subordinate units here, but
        // as this doesn't actually remove them from the database, the unit
        // count will not be updated.  A future branch will address the fact
        // that the service which owns the unit does not see an update here.
        // Makyo 2015-10-14
      }
      return record;
    },

    /**
      Creates a new entry in the queue for exposing a service.

      Receives all the parameters received by the model's "expose"
      method with the exception of the ECS options object.

      @method lazyExpose
      @param {Array} args The arguments to unexpose with.
      @param {Object} options The ECS options.
    */
    lazyExpose: function(args, options) {
      var db = this.get('db');
      var parent = [];
      // Search for and add the service to parent.
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        if (value.command.method === '_deploy') {
          if (value.command.options.modelId === args[0]) {
            parent.push(key);
          }
        }
      });
      db.services.getById(args[0]).set('exposed', true);

      return this._createNewRecord('expose', {
        method: '_expose',
        args: args,
        options: options,

        /**
          Replace changeSet keys with real service names returned from the call.

          @method onParentResults
          @param {String} record The changeSet record which generated the
            results.
          @param {String} results The data returned by the API call.
        */
        onParentResults: function(record, results) {
          if (record.command.method === '_deploy') {
            // After deploy change the temp id to the real name.
            const tempId = this.args[0];
            if (
              tempId.indexOf('$') > -1 &&
              record.command.options.modelId === tempId
            ) {
              const applicationName = results[1];
              this.args[0] = applicationName;
            }
          }
        }
      }, parent);
    },

    /**
      Creates a new entry in the queue for unexposing a service.

      Receives all the parameters received by the model's "unexpose"
      method with the exception of the ECS options object.

      @method lazyUnexpose
      @param {Array} args The arguments to unexpose with.
      @param {Object} options The ECS options.
    */
    lazyUnexpose: function(args, options) {
      var existingExpose;
      var db = this.get('db');
      // Check if the service is pending in the change set.
      Object.keys(this.changeSet).forEach(function(key) {
        if (this.changeSet[key].command.method === '_expose') {
          if (this.changeSet[key].command.args[0] === args[0]) {
            existingExpose = key;
          }
        }
      }, this);
      db.services.getById(args[0]).set('exposed', false);
      if (existingExpose) {
        this._removeExistingRecord(existingExpose);
      } else {
        return this._createNewRecord('unexpose', {
          method: '_unexpose',
          args: args,
          options: options
        });
      }
    },

    /**
      Creates a new entry in the queue for adding machines/containers.

      Receives all the parameters received by the model's "addMachines"
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
          Object.keys(this.changeSet).forEach(key => {
            const value = this.changeSet[key];
            var command = value.command;
            if (command.method === '_addMachines' &&
                command.options.modelId === param.parentId) {
              parent.push(key);
            }
          });
        }
      }, this);
      var command = {
        method: '_addMachines',
        args: args,
        options: options,
        /**
          Make the machine series match the series of the units it will host
          (if any).

          If a command defines a prepare function, the function is called
          passing a db instance right before the actual command execution.

          @method prepare
          @param {Object} db The database instance.
          @param {Object} ecs The ecs module.
        */
        prepare: function(db, ecs) {
          var units = db.units.filterByMachine(this.options.modelId);
          if (!units.length) {
            return;
          }
          // If no series is provided on the machine then define it.
          // Assume all the units in this machine have the same series.
          // This is safe since this kind of validation is done during
          // units' placement.
          if (!this.args[0][0].series) {
            this.args[0][0].series = ecs._getUnitSeries(units[0], db);
          }
        },
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
      Update a machine's series.

      @param {String} machineId The id of the machine.
      @param {String} series The new series.
    */
    updateMachineSeries: function(machineId, series) {
      const db = this.get('db');
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        const command = value.command;
        if (command.method === '_addMachines' &&
            command.options.modelId === machineId) {
          value.command.args[0][0].series = series;
        }
      });
      // Because each 'model' in a lazy model list is actually just an object
      // it doesn't fire change events. We need to revive it to a real object,
      // make the change then the change events will fire.
      const machine = db.machines.getById(machineId);
      const machineModel = db.machines.revive(machine);
      machineModel.set('series', series);
      db.machines.free(machineModel);
      return null;
    },

    /**
      Update a machine's constraints.

      @param {String} machineId The id of the machine.
      @param {Object} constraints The new constraints.
    */
    updateMachineConstraints: function(machineId, constraints) {
      const db = this.get('db');
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        const command = value.command;
        if (command.method === '_addMachines' &&
            command.options.modelId === machineId) {
          value.command.args[0][0].constraints = constraints;
        }
      });
      // Because each 'model' in a lazy model list is actually just an object
      // it doesn't fire change events. We need to revive it to a real object,
      // make the change then the change events will fire.
      const machine = db.machines.getById(machineId);
      const machineModel = db.machines.revive(machine);
      // The model requires the constraints to be in the format:
      // cpu-power=w cores=x mem=y root-disk=z
      machineModel.set('constraints', utils.formatConstraints(constraints));
      db.machines.free(machineModel);
      return null;
    },

    /**
      Creates a new entry in the queue for adding service units.

      Receives all the parameters received by the model's "add_unit"
      method with the exception of the ECS options object.

      @method lazyAddUnits
      @param {Array} args The arguments to add the units with.
      @param {Object} options The ECS options including a modelId field
        representing the ghost unit model instance identifier.
    */
    lazyAddUnits: function(args, options) {
      var parent = [];
      // Search for and add the service to parent.
      Object.keys(this.changeSet).forEach(key => {
        const value = this.changeSet[key];
        if (value.command.method === '_deploy') {
          if (value.command.options.modelId === args[0]) {
            parent.push(key);
            args[0] = value.command.args[0].applicationName;
          }
        }
      });
      // If toMachine is specified, search for and add the machine to parent.
      var toMachine = args[2];
      if (toMachine) {
        Object.keys(this.changeSet).forEach(key => {
          const value = this.changeSet[key];
          var command = value.command;
          if (command.method === '_addMachines' &&
              command.options.modelId === toMachine) {
            parent.push(key);
          }
        });
      }
      var db = this.get('db');
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
          switch (record.command.method) {
            case '_addMachines':
              // Assume the machine we are interested in is the first one.
              var newMachineId = results[0].machines[0].name;
              this.args[2] = newMachineId;
              break;
            case '_deploy':
              // Update the service name. The add_unit record is first added
              // passing the initial service name. This service name can be
              // changed by users before the changes are committed.
              const applicationName = record.command.args[0].applicationName;
              this.args[0] = applicationName;
              // We also need to update the unit id to match the new service id
              // so that we can correctly look up the unit using service id +
              // unit number.
              const unit = db.updateUnitId(
                applicationName, this.options.modelId);
              // Update the ecs change with the new id.
              this.options.modelId = unit.id;
              break;
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
      Object.keys(this.changeSet).some(key => {
        const value = this.changeSet[key];
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
      @return {String} An error if the unit is not present in the changeset or
        if its placement is not valid. Null if the placement succeeds.
    */
    placeUnit: function(unit, machineId) {
      var record = this._retrieveUnitRecord(unit.id);
      if (!record) {
        return 'attempted to place a unit which has not been added: ' + unit.id;
      }
      var db = this.get('db');
      var error = this.validateUnitPlacement(unit, machineId, db);
      if (error) {
        db.notifications.add({
          title: 'Error placing unit',
          message: 'Error placing unit: ' + error,
          level: 'error'
        });
        return error;
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
      Object.keys(this.changeSet).forEach(key => {
        var value = this.changeSet[key];
        var command = value.command;
        if (command.method === '_addMachines' &&
            command.options.modelId === machineId) {
          // If the machine doesn't yet have a series defined then set one
          // when placing the first unit on it.
          if (!value.command.args[0][0].series) {
            value.command.args[0][0].series = this._getUnitSeries(unit, db);
          }
          record.parents.push(key);
          containerExists = false;
        }
      });
      // Update the command in the changeset to place the unit on an already
      // existing machine.
      if (containerExists && machineId) {
        record.command.args[2] = machineId;
      }
      // Place the unit in the db.
      var unitsDb = db.units;
      // Because each 'model' in a lazy model list is actually just an object
      // it doesn't fire change events. We need to revive it to a real object,
      // make the change then the change events will fire.
      var unitModel = unitsDb.revive(unit);
      unitModel.set('machine', machineId);
      unitsDb.free(unitModel);
      return null;
    },

    /**
      Takes a service id and then handles unplacing all of the uncommitted
      units for that service.

      @method unplaceServiceUnits
      @param {String} serviceId The service id to unplace units for.
      @returns {Array} Any units that had been unplaced, or an empty array.
    */
    unplaceServiceUnits: function(serviceId) {
      return this.get('db').units
        // We only want to unplace units which have the matching
        // service id and which are placed on machines.
        .filter(unit => unit.service === serviceId && unit.machine)
        // Unplace any units which match the criteria.
        .map(unit => this.unplaceUnit(unit));
    },

    /**
      Removes the placed unit from the machine it's placed on.

      @method unplaceUnit
      @param {Object} unit The unit to remove from the machine.
      @returns {Object} unit The removed unit or undefined if the unit has
        already been deployed.
    */
    unplaceUnit: function(unit) {
      const db = this.get('db');
      // Update the revived model to trigger events.
      const unitModel = db.units.revive(unit);
      unit = this._unplaceUnit(unit, unitModel);
      db.units.free(unitModel);
      return unit;
    },

    /**
      Removes the placed unit from the machine it's placed on.

      @method _unplaceUnit
      @param {Object} unit The unit to remove from the machine.
      @param {Object} unitModel The YUI Model instance for the unit.
      @returns {Object} unit The removed unit or undefined if the unit has
        already been deployed.
    */
    _unplaceUnit: function(unit, unitModel) {
      if (!unit.agent_state) {
        // Remove the unit's machine, making it an unplaced unit.
        delete unit.machine;
        unitModel.set('machine', null);
        return unit;
      }
      // If the unit is deployed to the machine then mark it as deleted
      // so that the UI updates.
      unitModel.set('deleted', true);
    },

    /* End private model methods. */

    /**
      Validate the unit's placement on a machine.

      @method validateUnitPlacement
      @param {Object} unit The unit to place.
      @param {String} machineId the machine Id to place the unit.
      @param {Object} db Reference to the application db.
      @return {String} A validation error or null if no errors occurred.
    */
    validateUnitPlacement: function(unit, machineId, db) {
      var machine = db.machines.getById(machineId);
      var unitSeries = this._getUnitSeries(unit, db);
      if (machine.series) {
        // This is a real provisioned machine. Ensure its series matches the
        // unit series.
        if (machine.series !== unitSeries) {
          return 'unable to place a ' + unitSeries + ' unit on the ' +
              machine.series + ' machine ' + machine.id;
        }
        return null;
      }
      // This is a ghost machine. If units are already assigned to this
      // machine, ensure they all share the same series.
      var error = null;
      var db = this.get('db');
      db.units.filterByMachine(machine.id).some(existingUnit => {
        var existingUnitSeries = this._getUnitSeries(existingUnit, db);
        if (existingUnitSeries !== unitSeries) {
          error = 'machine ' + machine.id + ' already includes units with a ' +
              'different series: ' + existingUnitSeries;
          return true;
        }
      });
      return error;
    }

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
