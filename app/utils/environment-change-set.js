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
  var ns = Y.namespace('juju');

  var name = 'environment-change-set';

  ns.EnvironmentChangeSet = Y.Base.create(name, Y.Base, [], {

    /**
      Creates the persistent data storage object.

      @method initializer
    */
    initializer: function() {
      this.changeSet = {};
    },

    /* ECS methods */

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
      return Array.prototype.slice.call(args, 0, cut);
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
      this.changeSet[key] = {
        id: key,
        parents: parents,
        executed: false,
        command: command
      };
      this._wrapCallback(this.changeSet[key]);
      return key;
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
          record: record
        });
        // Signal that this record has been completed by decrementing the
        // count of records to complete and deleting it from the changeset.
        self.levelRecordCount -= 1;
        delete self.changeSet[record.id];
        return result;
      }
      args[index] = _callbackWrapper;
    },

    /**
      Executes the passed in record on the environment.

      @method _execute
      @param {Object} record The individual record object from the changeSet.
    */
    _execute: function(record) {
      var env = this.get('env');
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
      this.placedCount = 0

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
      if (command.parents) {
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
    _commitNext: function() {
      var command;
      this.currentLevel += 1;
      this.levelRecordCount = this.currentCommit[this.currentLevel].length;
      this.currentCommit[this.currentLevel].forEach(function(record) {
        command = this.changeSet[record.key];
        this._execute(command);
        this.fire('commit', command);
      }, this);
      // Wait until the entire level has completed (received RPC callbacks from
      // the state server) before starting the next level.
      this.levelTimer = Y.later(200, this, this._waitOnLevel, null, true);
    },

    /**
      Wait until the entire level of commits has been received by the
      environment.  This relies on the fact that _execute wraps the callback
      methods in a wrapper that decrements this.levelRecordCount; once it hits
      0, meaning no commits left in that level, it moves on to either finish up
      or commit the next level.

      @method _waitOnLevel
    */
    _waitOnLevel: function() {
      if (this.levelRecordCount === 0) {
        this.levelTimer.cancel();
        if (this.currentLevel < this.currentCommit.length - 1) {
          // Defer execution to prevent stack overflow.
          Y.soon(Y.bind(this._commitNext, this));
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
    commit: function() {
      this.currentCommit = this._buildHierarchy();
      this.currentLevel = -1;
      this._commitNext();
    },

    /* End ECS methods */

    /* Private environment methods. */

    /**
      Creates a new entry in the queue for creating a new service.

      Receives all the parameters it's public method 'deploy' was called with
      with the exception of the ECS options oject.

      @method _lazyDeploy
      @param {Array} args The arguments to deploy the charm with.
    */
    _lazyDeploy: function(args) {
      var command = {
        method: 'deploy',
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
        toMachine = null;
      }
      return this._createNewRecord('service', command, toMachine);
    },

    /**
      Creates a new entry in the queue for setting a services config.

      Receives all the parameters it's public method 'set_config' was called
      with with the exception of the ECS options oject.

      @method _lazySetConfig
      @param {Array} args The arguments to set the config with.
    */
    _lazySetConfig: function(args) {
      var serviceName = args[0];
      var parent;
      if (this.changeSet[serviceName]) {
        // If it's a queued service then we need to add this command as a
        // reference to the deploy service command.
        parent = [serviceName];
      }
      var command = {
        method: 'set_config', // This needs to match the method name in env.
        args: args
      };
      // XXX Jeff - We may want to flatten this into the deploy service
      // command on 'commit' if there is a queued service for this command.
      // We will want to flatten multiple setConfig calls to the same service
      // on 'commit'.
      return this._createNewRecord('setConfig', command, parent);
    },

    /**
      Creates a new entry in the queue for adding a relation.

      Receives all the parameters it's public method 'addRelation' was called
      with with the exception of the ECS options oject.

      @method _lazyAddRelation
      @param {Array} args The arguments to add the relation with.
    */
    _lazyAddRelation: function(args) {
      var serviceA;
      var serviceB;
      Y.Object.each(this.changeSet, function(value, key) {
        if (value.command.method === 'deploy') {
          if (value.command.options.modelId === args[0][0]) {
            serviceA = key;
            args[0][0] = value.command.args[1];
          }
          if (value.command.options.modelId === args[1][0]) {
            serviceB = key;
            args[1][0] = value.command.args[1];
          }
        }
      });
      var parent = [serviceA, serviceB];
      var command = {
        method: 'add_relation',
        args: args
      };
      return this._createNewRecord('addRelation', command, parent);
    },

    /* End private environment methods. */

    /* Public environment methods. */

    /**
      Calls the environments deploy method or creates a new service record
      in the queue.

      The parameters match the parameters for the public env deploy method in
      go.js.

      @method deploy
    */
    deploy: function(charmUrl, serviceName, config, configRaw, numUnits,
                     constraints, toMachine, callback, options) {
      var env = this.get('env'),
          args = this._getArgs(arguments);
      if (options && options.immediate) {
        // Call the deploy method right away bypassing the queue.
        env.deploy.apply(env, args);
      } else {
        this._lazyDeploy(arguments);
      }
    },

    /**
      Calls the environments set_config method or creates a new set_config
      record in the queue.

      The parameters match the parameters for the public env deploy method in
      go.js.

      @method setConfig
    */
    setConfig: function(serviceName, config, data, serviceConfig, callback,
                        options) {
      var env = this.get('env'),
          args = this._getArgs(arguments);
      if (options && options.immediate) {
        // Need to check that the serviceName is a real service name and not
        // a queued service id before allowing immediate or not.
        if (this.changeSet[serviceName]) {
          throw 'You cannot immediately setConfig on a queued service';
        } else {
          env.set_config.apply(env, args);
        }
      } else {
        this._lazySetConfig(args);
      }
    },

    /**
      Calls the environment's add_relation method or creates a new add_relation
      record in the queue.

      The parameters match the parameters for the public env add relation
      method in go.js.

      @method addRelation
    */
    addRelation: function(endpointA, endpointB, callback, options) {
      var env = this.get('env'),
          args = this._getArgs(arguments);
      if (options && options.immediate) {
        env.add_relation.apply(env, args);
      } else {
        this._lazyAddRelation(args);
      }
    }

    /* End Public environment methods. */

  }, {
    ATTRS: {
      /**
        Reference to the environment
        @attribute env
      */
      env: {},
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
    'base-build'
  ]
});
