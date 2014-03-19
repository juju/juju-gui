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

describe('Environment Change Set', function() {
  var Y, ECS, ecs, envObj, dbObj, testUtils;

  before(function(done) {
    var modules = ['environment-change-set', 'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      ECS = Y.namespace('juju').EnvironmentChangeSet;
      testUtils = Y.namespace('juju-tests').utils;
      done();
    });
  });

  beforeEach(function() {
    envObj = {
      deploy: testUtils.makeStubFunction()
    };
    dbObj = {};
    ecs = new ECS({
      env: envObj,
      db: dbObj
    });
  });

  afterEach(function() {
    ecs.destroy();
  });

  describe('ECS methods', function() {
    it('is instantiable', function() {
      assert.equal(ecs instanceof ECS, true);
      // this object is created on instantiation
      assert.isObject(ecs.changeSet);
    });

    describe('_getArgs', function() {
      it('returns an array of arguments', function(done) {
        var args = [1, 2, 'foo', 'bar', function() {}];
        function test() {
          var result = ecs._getArgs(arguments);
          assert.equal(Y.Lang.isArray(arguments), false);
          assert.equal(Y.Lang.isArray(result), true);
          assert.deepEqual(result, args);
          done();
        }
        test.apply(null, args);
      });

      it('strips the ecs options argument off the end', function(done) {
        var stub = testUtils.makeStubFunction();
        var args = [1, 2, 'foo', 'bar', stub, { options: 'foo'}];
        function test() {
          var result = ecs._getArgs(arguments);
          assert.equal(Y.Lang.isArray(arguments), false);
          assert.equal(Y.Lang.isArray(result), true);
          var chopped = Array.prototype.slice.call(
              [1, 2, 'foo', 'bar', stub, { options: 'foo'}], 0, -1);
          assert.deepEqual(result, chopped);
          done();
        }
        test.apply(null, args);
      });
    });

    describe('_createNewRecord', function() {
      it('creates a new record of the specified type', function() {
        var command = { foo: 'foo' };
        var wrapCallback = testUtils.makeStubMethod(
            ecs, '_wrapCallback', command);
        this._cleanups.push(wrapCallback.reset);
        var key = ecs._createNewRecord('service', command);
        assert.equal(wrapCallback.calledOnce(), true);
        assert.deepEqual(wrapCallback.lastArguments()[0], command);
        assert.deepEqual(ecs.changeSet[key], {
          commands: [command]
        });
      });

      it('always creates a unique key for new records', function() {
        var result = [];
        var wrapCallback = testUtils.makeStubMethod(ecs, '_wrapCallback');
        this._cleanups.push(wrapCallback.reset);
        for (var i = 0; i < 999; i += 1) {
          result.push(ecs._createNewRecord('service'));
        }
        var dedupe = Y.Array.dedupe(result);
        // If there were any duplicates then these would be different.
        assert.equal(dedupe.length, result.length);
      });
    });

    describe('_wrapCallback', function() {
      it('wraps the callbacks provided in the command objects', function() {
        var callback = testUtils.makeStubFunction('real cb');
        var command = {
          method: 'deploy',
          executed: false,
          args: [1, 2, 'foo', callback]
        };
        assert.deepEqual(ecs._wrapCallback(command), command);
        // The callback should now be wrapped.
        var fire = testUtils.makeStubMethod(ecs, 'fire');
        this._cleanups.push(fire.reset);
        var result = command.args[3]();
        assert.equal(result, 'real cb');
        assert.equal(fire.calledOnce(), true);
        var fireArgs = fire.lastArguments();
        assert.equal(fireArgs[0], 'taskComplete');
        assert.deepEqual(fireArgs[1], command);
        assert.equal(command.executed, true);
      });
    });

    describe('_execute', function() {
      it('calls to wrap the callback then executes on the env', function() {
        var callback = testUtils.makeStubFunction();
        var command = {
          method: 'deploy',
          executed: false,
          args: [1, 2, 'foo', callback]
        };
        ecs._execute(command);
        assert.equal(envObj.deploy.calledOnce(), true);
      });
    });

    describe('commit', function() {
      it('loops through the changeSet calling execute on them', function() {
        var execute = testUtils.makeStubMethod(ecs, '_execute');
        this._cleanups.push(execute.reset);
        var fire = testUtils.makeStubMethod(ecs, 'fire');
        this._cleanups.push(fire.reset);
        var command = [{ executed: false, method: 'deploy' }];
        var changeSet = {
          'service-568': {
            commands: command
          }
        };
        ecs.changeSet = changeSet;
        ecs.commit();
        assert.equal(execute.callCount(), 1);
        assert.deepEqual(execute.lastArguments()[0], command[0]);
        assert.equal(fire.callCount(), 1);
        var fireArgs = fire.lastArguments();
        assert.equal(fireArgs[0], 'commit');
        assert.equal(fireArgs[1], command[0]);
      });
    });
  });

  describe('private ENV methods', function() {
    it('_lazyDeploy: creates a new `deploy` record', function() {
      var args = [1, 2, 'foo', 'bar'];
      var key = ecs._lazyDeploy(args);
      var record = ecs.changeSet[key];
      assert.isObject(record);
      assert.isArray(record.commands);
      assert.equal(record.commands[0].method, 'deploy');
      assert.equal(record.commands[0].executed, false);
      assert.deepEqual(record.commands[0].args, args);
    });
  });

  describe('public ENV methods', function() {
    it('can immediately deploy a charm via the env', function() {
      var lazyDeploy = testUtils.makeStubMethod(ecs, '_lazyDeploy');
      this._cleanups.push(lazyDeploy.reset);
      var callback = testUtils.makeStubFunction();
      var args = [1, 2, 3, 4, 5, 6, 7, callback, { immediate: true}];
      ecs.deploy.apply(ecs, args);
      assert.equal(envObj.deploy.calledOnce(), true);
      var deployArgs = envObj.deploy.lastArguments();
      // remove the options param off of the end and compare to that. as it
      // should be removed before env.deploy is called.
      assert.deepEqual(deployArgs, Array.prototype.slice.call(args, 0, -1));
      // make sure that we don't add it to the changeSet.
      assert.equal(lazyDeploy.callCount(), 0);
    });

    it('can add a `deploy` command to the changeSet', function() {
      var lazyDeploy = testUtils.makeStubMethod(ecs, '_lazyDeploy');
      this._cleanups.push(lazyDeploy.reset);
      var callback = testUtils.makeStubFunction();
      var args = [1, 2, 3, 4, 5, 6, 7, callback];
      ecs.deploy.apply(ecs, args);
      var lazyDeployArgs = lazyDeploy.lastArguments()[0];
      // remove the options param off of the end and compare to that. as it
      // should be removed before env.deploy is called.
      assert.deepEqual(lazyDeployArgs, args);
      assert.equal(lazyDeploy.calledOnce(), true);
      // make sure we don't call the env deploy method.
      assert.equal(envObj.deploy.callCount(), 0);
    });
  });

});
