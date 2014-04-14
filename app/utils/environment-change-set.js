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
    _buildHierarchy: function(changeSet) {
      var hierarchy = [[]],
          command, alreadyPlacedParents,
          keyToLevel = {},
          currLevel = 1;

      // Take care of top-level objects quickly.
      Object.keys(changeSet).forEach(function(key) {
        command = changeSet[key];
        command.key = key;
        if (!command.parents || command.parents.length === 0) {
          hierarchy[0].push(Y.clone(command));
          keyToLevel[key] = 0;
          delete changeSet[key];
        } else {
          // Default everything else to the first level.
          keyToLevel[key] = 1;
        }
      });

      // Now build the other levels of the hierarchy as long as there are still
      // commands in the change set. Functions defined outside of loop for
      // runtime efficiency (jshint W083).
      function checkForParents(parent) {
        if (keyToLevel[parent] >= currLevel) {
          alreadyPlacedParents = false;
        }
      }

      function placeIfNeeded(value, key) {
        command = changeSet[key];

        // Since we are deleting keys from the changeSet as we iterate over
        // the original list, return if command is undefined.
        if (!command) {
          return;
        }

        // Check and see if all of the parents have already been placed.
        alreadyPlacedParents = true;
        command.parents.forEach(checkForParents);

        // If so, then the command belongs in the current level, so push it
        // there and delete it from the changeSet.
        if (alreadyPlacedParents) {
          hierarchy[currLevel].push(Y.clone(command));
          keyToLevel[key] = currLevel;
          delete changeSet[key];
        }
      }

      while (Object.keys(changeSet).length > 0) {
        hierarchy.push([]);
        Y.Object.each(keyToLevel, placeIfNeeded);
        currLevel += 1;
      }
      return hierarchy;
    },

    /**
      Starts the processing of all of the top level
      commands stored in the changeSet.

      @method commit
    */
    commit: function() {
      // XXX Matthew - This needs to be cloned because _buildHierarchy modifies
      // the changeset it is given for efficiency.  In the future, however, we
      // will need this.changeset in its current form, rather than maintaining
      // the hierarchical form because RPC callbacks should remove commands as
      // they return.  Clarify this comment at that time. 2014-04-14
      var changeSet = this.changeSet;
      var hierarchy = this._buildHierarchy(Y.clone(changeSet));
      var command;

      hierarchy.forEach(function(level) {
        level.forEach(function(record) {
          // XXX Matthew - this fires commands in the right order, but does not
          // wait until levels have completed before firing.  Card on board.
          // 2014-04-14
          command = changeSet[record.key];
          this._execute(command);
          this.fire('commit', command);
        }, this);
      }, this);
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
        args: args
      };
      // The 6th param is the toMachine param of the env deploy call.
      var toMachine = args[6];
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
        this._lazyDeploy(args);
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
