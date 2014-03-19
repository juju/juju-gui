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

      @method _createNewRecord
      @param {String} type The type of record to create (service, unit, etc).
      @param {Object} command The command that's to be executed lazily.
      @return {String} The newly created record key.
    */
    _createNewRecord: function(type, command) {
      var key = type + '-' + this._generateUniqueKey(type);
      command = this._wrapCallback(command);
      this.changeSet[key] = {
        commands: [command]
      };
      return key;
    },

    /**
      Wraps the last function parameter so that we can be notified when it's
      called.

      @method _wrapCallback
      @param {Object} command The individual command object from the changeSet.
      @return {Array} The args array with the wrapped callback.
    */
    _wrapCallback: function(command) {
      var args = command.args;
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
        command.executed = true;
        // `this` here is in context that the callback is called
        //  under. In most cases this will be `env`.
        var result = callback.apply(this, self._getArgs(arguments));
        self.fire('taskComplete', command);
        return result;
      }
      args[index] = _callbackWrapper;
      return command;
    },

    /**
      Executes the passed in command on the environment.

      @method _execute
      @param {Object} command An object of the command to execute.
    */
    _execute: function(command) {
      var env = this.get('env');
      env[command.method].apply(env, command.args);
    },

    /**
      Executes all of the commands stored in the changeSet.

      @method commit
    */
    commit: function() {
      var changeSet = this.changeSet;
      Object.keys(changeSet).forEach(function(key) {
        changeSet[key].commands.forEach(function(command) {
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
        executed: false,
        args: args
      };
      return this._createNewRecord('service', command);
    },

    /* End private environment methods. */

    /* Public environment methods. */

    /**
      Calls the environments deploy method or creates a new service record
      in the queue.

      The parameters match the parameters for the env deploy method.

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
