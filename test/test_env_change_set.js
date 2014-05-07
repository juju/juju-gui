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
    var modules = [
      'environment-change-set',
      'juju-env',
      'juju-tests-utils'
    ];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      ECS = Y.namespace('juju').EnvironmentChangeSet;
      testUtils = Y.namespace('juju-tests').utils;
      done();
    });
    window.flags = { mv: true };
  });

  beforeEach(function() {
    ecs = new ECS({
      db: dbObj
    });
    envObj = Y.namespace('juju').newEnvironment({
      connection: new testUtils.SocketStub(),
      user: 'user',
      password: 'password',
      ecs: ecs
    });
    testUtils.makeStubMethod(envObj, '_deploy');
    testUtils.makeStubMethod(envObj, '_set_config');
    testUtils.makeStubMethod(envObj, '_add_relation');
    dbObj = {};
  });

  afterEach(function() {
    ecs.destroy();
  });

  after(function() {
    window.flags = {};
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

      it('deep copies the original arguments', function(done) {
        var args = [{key: 'value'}, [42], function() {}];
        var backup = Y.clone(args);
        function test() {
          var result = ecs._getArgs(arguments);
          // Mutate the resulting arguments.
          result[0].key = 'another value';
          result[1].push(47);
          // Ensure the original ones have not been changed.
          assert.deepEqual(args, backup);
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

      it('creates a new record of the specified type', function() {
        var command = { foo: 'foo' };
        var wrapCallback = testUtils.makeStubMethod(
            ecs, '_wrapCallback', command);
        this._cleanups.push(wrapCallback.reset);
        var key = ecs._createNewRecord('service', command);
        assert.equal(wrapCallback.calledOnce(), true);
        assert.deepEqual(wrapCallback.lastArguments()[0], {
          id: key,
          parents: undefined,
          executed: false,
          command: command
        });
        assert.deepEqual(ecs.changeSet[key], {
          id: key,
          parents: undefined,
          executed: false,
          command: command
        });
      });

      it('adds supplied parent records to the new record', function() {
        var command = { foo: 'foo' };
        var wrapCallback = testUtils.makeStubMethod(
            ecs, '_wrapCallback', command);
        this._cleanups.push(wrapCallback.reset);
        var parent = ['service-123'];
        var key = ecs._createNewRecord('service', command, parent);
        assert.equal(wrapCallback.calledOnce(), true);
        assert.deepEqual(wrapCallback.lastArguments()[0], {
          id: key,
          parents: parent,
          executed: false,
          command: command
        });
        assert.deepEqual(ecs.changeSet[key], {
          id: key,
          parents: parent,
          executed: false,
          command: command
        });
      });
    });

    describe('_wrapCallback', function() {
      it('wraps the callback provided in the record object', function() {
        var callback = testUtils.makeStubFunction('real cb');
        var record = {
          id: 'service-123',
          parents: undefined,
          executed: false,
          command: {
            method: 'deploy',
            args: [1, 2, 'foo', callback]
          }
        };
        ecs._wrapCallback(record);
        // The callback should now be wrapped.
        var fire = testUtils.makeStubMethod(ecs, 'fire');
        this._cleanups.push(fire.reset);
        var result = record.command.args[3]();
        assert.equal(result, 'real cb');
        assert.equal(fire.calledOnce(), true);
        var fireArgs = fire.lastArguments();
        assert.equal(fireArgs[0], 'taskComplete');
        assert.deepEqual(fireArgs[1], {
          id: 'service-123',
          record: record
        });
        assert.equal(record.executed, true);
      });
    });

    describe('_execute', function() {
      it('calls to wrap the callback then executes on the env', function() {
        var callback = testUtils.makeStubFunction();
        var record = {
          id: 'service-123',
          parents: undefined,
          executed: false,
          command: {
            method: '_deploy',
            args: [1, 2, 'foo', callback]
          }
        };
        ecs._execute(envObj, record);
        assert.equal(envObj._deploy.calledOnce(), true);
      });
    });

    describe('_buildHierarchy', function() {
      it('acts sane with "flat" hierarchies', function() {
        ecs.changeSet = {
          a: { parents: [] },
          b: { parents: [] },
          c: { parents: [] },
          d: { parents: [] },
          e: { parents: [] },
          f: { } // Can handle missing parents attribute.
        };

        var result = ecs._buildHierarchy();
        // XXX assert.deepEqual does not seem to play well with arrays
        // of objects.  Slack card on board - Makyo 2014-04-23
        assert.deepEqual(JSON.stringify(result), JSON.stringify([
          [
            { parents: [], key: 'a' },
            { parents: [], key: 'b' },
            { parents: [], key: 'c' },
            { parents: [], key: 'd' },
            { parents: [], key: 'e' },
            { key: 'f' }
          ]
        ]));
      });

      it('splits commands into dependency levels', function() {
        ecs.changeSet = {
          a: { parents: [] },
          b: { parents: [] },
          c: { parents: ['a', 'b'] },
          d: { parents: ['a'] },
          e: { parents: ['a', 'c'] },
          f: { parents: ['e'] }
        };

        var result = ecs._buildHierarchy();
        // XXX assert.deepEqual does not seem to play well with arrays
        // of objects.  Slack card on board - Makyo 2014-04-23
        assert.equal(JSON.stringify(result), JSON.stringify([
          // Top-level.
          [
            { parents: [], key: 'a' },
            { parents: [], key: 'b' }
          ],
          [
            { parents: ['a', 'b'], key: 'c' },
            { parents: ['a'], key: 'd' }
          ],
          [
            { parents: ['a', 'c'], key: 'e' }
          ],
          [
            { parents: ['e'], key: 'f' }
          ]
        ]));
      });
    });

    describe('commit', function() {
      it('loops through the changeSet calling execute on them', function() {
        var execute = testUtils.makeStubMethod(ecs, '_execute');
        this._cleanups.push(execute.reset);
        var fire = testUtils.makeStubMethod(ecs, 'fire');
        this._cleanups.push(fire.reset);
        var changeSet = {
          'service-568': {
            executed: false,
            command: {
              method: '_deploy'
            }
          }
        };
        ecs.changeSet = changeSet;
        ecs.commit(envObj);
        assert.equal(execute.callCount(), 1);
        assert.deepEqual(execute.lastArguments()[1], changeSet['service-568']);
        assert.equal(fire.callCount(), 1);
        var fireArgs = fire.lastArguments();
        assert.equal(fireArgs[0], 'commit');
        assert.equal(fireArgs[1], changeSet['service-568']);
      });
    });
  });

  describe('private ENV methods', function() {
    describe('_lazyDeploy', function() {
      it('creates a new `deploy` record', function(done) {
        var args = [1, 2, 'foo', 'bar', done, {modelId: 'baz'}];
        var key = ecs._lazyDeploy(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_deploy');
        // Remove the functions, which will not be equal.
        var cb = record.command.args.pop();
        args.pop();
        // Also remove the options object.
        args.pop();
        assert.deepEqual(record.command.args, args);
        assert.deepEqual(record.command.options, {modelId: 'baz'});
        cb(); // Will call done().
      });
    });

    describe('_lazySetConfig', function() {
      it('creates a new `setConfig` record for a deployed service', function() {
        var addToRecord = testUtils.makeStubMethod(ecs, '_addToRecord');
        this._cleanups.push(addToRecord.reset);
        var args = [1, 2, 'foo', 'bar'];
        var key = ecs._lazySetConfig(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_set_config');
        assert.deepEqual(record.command.args, args);
        // Make sure we don't also add to a old record
        assert.equal(addToRecord.callCount(), 0);
      });

      it('creates a new `setConfig` record for a queued service', function() {
        var args = [1, 2, 'foo', 'bar'];
        // This assumes that the _lazyDeploy tests complete successfully.
        var key = ecs._lazyDeploy(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        var setArgs = [key, 1, 2, 3];
        var setKey = ecs._lazySetConfig(setArgs);
        var setRecord = ecs.changeSet[setKey];
        assert.equal(setRecord.executed, false);
        assert.isObject(setRecord.command);
        var command = setRecord.command;
        assert.equal(command.method, '_set_config');
        assert.deepEqual(command.args, setArgs);
        // It should have called to create new records
        assert.equal(Y.Object.size(ecs.changeSet), 2);
      });
    });

    describe('_lazyAddRelation', function() {
      it('creates a new `addRelation` record', function() {
        ecs.changeSet = {
          'service-1': {
            command: {
              args: ['charm', 'mysql'],
              method: '_deploy',
              options: { modelId: 'serviceId1$' }
            }
          },
          'service-2': {
            command: {
              args: ['charm', 'wordpress'],
              method: '_deploy',
              options: { modelId: 'serviceId2$' }
            }
          }
        };
        var args = [['serviceId1$', ['db', 'client']],
              ['serviceId2$', ['db', 'server']]];
        var key = ecs._lazyAddRelation(args);
        var record = ecs.changeSet[key];
        assert.deepEqual(record, {
          command: {
            args: [
              ['mysql', ['db', 'client']],
              ['wordpress', ['db', 'server']]
            ],
            method: '_add_relation'
          },
          executed: false,
          id: key,
          parents: ['service-1', 'service-2']
        });
        assert.equal(Y.Object.size(ecs.changeSet), 3);
        // Perform this last, as it will mutate ecs.changeSet.
        assert.equal(ecs._buildHierarchy(ecs.changeSet).length, 2);
      });
    });
  });

  describe('public ENV methods', function() {
    describe('deploy', function() {
      it('can immediately deploy a charm via the env', function() {
        var lazyDeploy = testUtils.makeStubMethod(ecs, '_lazyDeploy');
        this._cleanups.push(lazyDeploy.reset);
        var callback = testUtils.makeStubFunction();
        var args = [1, 2, 3, 4, 5, 6, 7, callback, { immediate: true}];
        envObj.deploy.apply(envObj, args);
        assert.equal(envObj._deploy.calledOnce(), true);
        var deployArgs = envObj._deploy.lastArguments();
        // Remove the final options element, which should not be an argument to
        // env.deploy.
        assert.deepEqual(deployArgs, Array.prototype.slice.call(args, 0, -1));
        // make sure that we don't add it to the changeSet.
        assert.equal(lazyDeploy.callCount(), 0);
      });

      it('can add a `deploy` command to the changeSet', function() {
        var lazyDeploy = testUtils.makeStubMethod(ecs, '_lazyDeploy');
        this._cleanups.push(lazyDeploy.reset);
        var callback = testUtils.makeStubFunction();
        var args = [1, 2, 3, 4, 5, 6, 7, callback];
        envObj.deploy.apply(envObj, args);
        var lazyDeployArgs = lazyDeploy.lastArguments()[0];
        // Assert within a loop, as Arguments do not deeply equal arrays.
        args.forEach(function(arg, i) {
          assert.equal(lazyDeployArgs[i], arg);
        });
        assert.equal(lazyDeploy.calledOnce(), true);
        // make sure we don't call the env deploy method.
        assert.equal(envObj._deploy.callCount(), 0);
      });
    });

    describe('setConfig', function() {
      it('can immediately set config to a deployed service', function() {
        var lazySetConfig = testUtils.makeStubMethod(ecs, '_lazySetConfig');
        this._cleanups.push(lazySetConfig.reset);
        var callback = testUtils.makeStubFunction();
        var args = [1, 2, 3, 4, callback, { immediate: true}];
        envObj.set_config.apply(envObj, args);
        assert.equal(envObj._set_config.calledOnce(), true);
        var setConfigArgs = envObj._set_config.lastArguments();
        // remove the options param off of the end and compare to that. as it
        // should be removed before env.deploy is called.
        assert.deepEqual(
            setConfigArgs, Array.prototype.slice.call(args, 0, -1));
        // make sure that we don't add it to the changeSet.
        assert.equal(lazySetConfig.callCount(), 0);
      });

      it('throws if immediately setting config to queued service', function() {
        var lazySetConfig = testUtils.makeStubMethod(ecs, '_lazySetConfig');
        this._cleanups.push(lazySetConfig.reset);
        var callback = testUtils.makeStubFunction();
        ecs.changeSet.foo = {};
        assert.throws(
            // this is using bind instead of apply because of how the
            // assert.throws assertion operates.
            envObj.set_config.bind(
                envObj, 'foo', 2, 3, 4, callback, { immediate: true}),
            'You cannot immediately setConfig on a queued service');
        assert.equal(envObj._set_config.callCount(), 0);
        // make sure that we don't add it to the changeSet.
        assert.equal(lazySetConfig.callCount(), 0);
      });

      it('can add a `set_config` command to the changeSet', function() {
        var lazySetConfig = testUtils.makeStubMethod(ecs, '_lazySetConfig');
        this._cleanups.push(lazySetConfig.reset);
        var callback = testUtils.makeStubFunction();
        var args = [1, 2, 3, 4, callback];
        envObj.set_config.apply(envObj, args);
        assert.deepEqual(lazySetConfig.lastArguments()[0], args);
        assert.equal(lazySetConfig.calledOnce(), true);
        // Make sure we don't call the env set_config method
        assert.equal(envObj._set_config.callCount(), 0);
      });
    });

    describe('addRelation', function() {
      it('can immediately call `add_relation`', function() {
        var lazyAddRelation = testUtils.makeStubMethod(ecs, '_lazyAddRelation');
        this._cleanups.push(lazyAddRelation.reset);
        var callback = testUtils.makeStubFunction();
        var args = [1, 2, callback, {immediate: true}];
        envObj.add_relation.apply(envObj, args);
        assert.equal(lazyAddRelation.calledOnce(), false);
        assert.equal(envObj._add_relation.callCount(), 1);
        // Get rid of the options, which will not be passed to add_relation.
        args.pop();
        assert.deepEqual(envObj._add_relation.lastArguments(), args);
      });
      it('can add a `add_relation` command to the changeSet', function() {
        var lazyAddRelation = testUtils.makeStubMethod(ecs, '_lazyAddRelation');
        this._cleanups.push(lazyAddRelation.reset);
        var callback = testUtils.makeStubFunction();
        var args = [1, 2, callback];
        envObj.add_relation.apply(envObj, args);
        assert.deepEqual(lazyAddRelation.lastArguments()[0], args);
        assert.equal(lazyAddRelation.calledOnce(), true);
        assert.equal(envObj._add_relation.callCount(), 0);
      });
    });
  });

});
