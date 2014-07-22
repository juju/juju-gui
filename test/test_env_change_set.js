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
      'juju-models',
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
    dbObj = {};
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
    testUtils.makeStubMethod(envObj, '_add_units');
    testUtils.makeStubMethod(envObj, '_addMachines');
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

    describe('_translateKeysToIds', function() {
      it('calls keyToId when available', function() {
        ecs.currentCommit = [[
          {
            key: 'foo-1',
            command: { onParentResults: true },
            parents: ['bar-1']
          }
        ]];
        ecs.currentLevel = -1;
        ecs.changeSet = {
          'foo-1': {
            command: {
              onParentResults: testUtils.makeStubFunction()
            }
          }
        };
        ecs._updateChangesetFromResults({key: 'bar-1'}, null);

        assert.isTrue(
            ecs.changeSet['foo-1'].command.onParentResults.calledOnce());
      });
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
        // Note that we cannot guarantee the duration of the tests, so we
        // need to assert against the record's timestamp below.
        assert.deepEqual(wrapCallback.lastArguments()[0], {
          id: key,
          parents: [],
          executed: false,
          command: command,
          timestamp: ecs.changeSet[key].timestamp
        });
        assert.deepEqual(ecs.changeSet[key], {
          id: key,
          parents: [],
          executed: false,
          command: command,
          timestamp: ecs.changeSet[key].timestamp
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
        // Note that we cannot guarantee the duration of the tests, so we
        // need to assert against the record's timestamp below.
        assert.deepEqual(wrapCallback.lastArguments()[0], {
          id: key,
          parents: parent,
          executed: false,
          command: command,
          timestamp: ecs.changeSet[key].timestamp
        });
        assert.deepEqual(ecs.changeSet[key], {
          id: key,
          parents: parent,
          executed: false,
          command: command,
          timestamp: ecs.changeSet[key].timestamp
        });
      });
    });

    describe('_removeExistingRecord', function() {
      it('deletes the requested record from the changeSet', function() {
        ecs.changeSet.abc123 = 'foo';
        ecs._removeExistingRecord('abc123');
        assert.strictEqual(ecs.changeSet.abc123, undefined);
      });

      it('fires a changeSetModified event', function() {
        var fire = testUtils.makeStubMethod(ecs, 'fire');
        ecs.changeSet.abc123 = 'foo';
        ecs._removeExistingRecord('abc123');
        assert.equal(fire.calledOnce(), true);
        assert.equal(fire.lastArguments()[0], 'changeSetModified');
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
        assert.equal(fire.callCount(), 2);
        var fireArgs = fire.allArguments()[0];
        assert.equal(fireArgs[0], 'taskComplete');
        assert.equal(fireArgs[1].id, 'service-123');
        assert.equal(fireArgs[1].record, record);
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

    describe('_lazyDestroyService', function() {
      it('creates a new destroy record', function(done) {
        var args = ['foo', done, {modelId: 'baz'}];
        var key = ecs._lazyDestroyService(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_destroyService');
        // Remove the functions, which will not be equal.
        var cb = record.command.args.pop();
        args.pop();
        // Also remove the options object.
        args.pop();
        assert.deepEqual(record.command.args, args);
        assert.deepEqual(record.command.options, {modelId: 'baz'});
        cb(); // Will call done().
      });

      it('destroys create records for undeployed services', function() {
        var stubRemove = testUtils.makeStubFunction();
        var stubDestroy = testUtils.makeStubFunction();
        var db = ecs.get('db');
        var fakeUnits = new Y.LazyModelList();
        fakeUnits.add({});
        db.services = {
          remove: stubRemove,
          getById: function() {
            return {
              destroy: stubDestroy,
              get: function(key) {
                if (key === 'units') { return fakeUnits; }
              }
            };
          }
        };
        var stubRemoveUnits = testUtils.makeStubMethod(db, 'removeUnits');
        this._cleanups.push(stubRemoveUnits.reset);

        ecs._lazyDeploy([1, 2, 'foo', 'bar', function() {}, {modelId: 'baz'}]);
        ecs._lazyDestroyService(['baz']);
        assert.equal(stubRemove.calledOnce(), true, 'remove not called');
        assert.equal(stubDestroy.calledOnce(), true, 'destroy not called');
        assert.equal(
            stubRemoveUnits.calledOnce(), true, 'remove units not called');
        assert.deepEqual(ecs.changeSet, {});
      });
    });

    describe('_lazyDestroyMachines', function() {
      it('creates a new destroy record', function(done) {
        var args = [['0/lxc/0'], false, done, {}];
        var key = ecs._lazyDestroyMachines(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_destroyMachines');
        // Remove the functions, which will not be equal.
        var cb = record.command.args.pop();
        args.pop();
        // Also remove the options object.
        args.pop();
        assert.deepEqual(record.command.args, args);
        cb(); // Will call done().
      });

      it('destroys create records for undeployed services', function() {
        var stubRemove = testUtils.makeStubFunction();
        ecs.get('db').machines = {
          getById: function() {},
          remove: stubRemove
        };
        ecs.lazyAddMachines([[{}], function() {}], {modelId: 'baz'});
        ecs._lazyDestroyMachines([['baz'], function() {}]);
        assert.equal(stubRemove.calledOnce(), true, 'remove not called');
        assert.deepEqual(ecs.changeSet, {});
      });
    });

    describe('lazyAddMachines', function() {
      it('creates a new `addMachines` record', function(done) {
        var translateStub = testUtils.makeStubMethod(ecs,
            '_translateKeysToIds');
        this._cleanups.push(translateStub.reset);
        var args = [[{}], done];
        var key = ecs.lazyAddMachines(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_addMachines');
        var cb = record.command.args.pop();
        args.pop();
        assert.deepEqual(record.command.args, args);
        cb(); // Will call done().
      });

      it('creates a new `addMachines` record with parentId', function() {
        ecs.changeSet = {
          'addMachines-1': {
            command: {
              method: '_addMachines',
              options: {modelId: 'new1'}
            }
          }
        };
        var args = [[{containerType: 'lxc', parentId: 'new1'}]];
        var key = ecs.lazyAddMachines(args);
        var record = ecs.changeSet[key];
        assert.equal(record.parents[0], 'addMachines-1');
      });
    });

    describe('lazyAddUnits', function() {
      it('creates a new `addUnits` record', function(done) {
        var args = ['mysql', 1, null, done];
        var key = ecs.lazyAddUnits(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_add_unit');
        var cb = record.command.args.pop();
        args.pop();
        assert.deepEqual(record.command.args, args);
        cb();
      });

      it('creates a record with a queued service', function() {
        ecs.changeSet = {
          'service-1': {
            command: {
              method: '_deploy',
              options: { modelId: 'mysql' },
              args: ['charmid', 'mysql']
            }
          }
        };
        var args = ['mysql', 1, null];
        var key = ecs.lazyAddUnits(args);
        var record = ecs.changeSet[key];
        assert.equal(record.parents[0], 'service-1');
      });

      it('creates a record with a queued machine', function() {
        ecs.changeSet = {
          'addMachines-1': {
            command: {
              method: '_addMachines',
              options: {modelId: 'new1'}
            }
          }
        };
        var args = ['mysql', 1, 'new1'];
        var key = ecs.lazyAddUnits(args);
        var record = ecs.changeSet[key];
        assert.equal(record.parents[0], 'addMachines-1');
      });
    });

    describe('_lazySetConfig', function() {
      var service;

      beforeEach(function() {
        service = {
          _dirtyFields: [],
          setAttrs: testUtils.makeStubFunction(),
          get: testUtils.makeStubFunction({
            foo: 'baz'
          })
        };
        ecs.get('db').services = {
          getById: testUtils.makeStubFunction(service)
        };
      });

      it('creates a new `setConfig` record for a deployed service', function() {
        var addToRecord = testUtils.makeStubMethod(ecs, '_addToRecord');
        this._cleanups.push(addToRecord.reset);
        var args = [1, {}, 'foo', {}];
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
        var args = [1, 2, 'foo', 'bar', function() {}, {modelId: 'baz'}];
        // This assumes that the _lazyDeploy tests complete successfully.
        var key = ecs._lazyDeploy(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        var setArgs = [key, {}, 2, {}];
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

      it('concats changed fields to the service modesl', function() {
        service._dirtyFields.push('bax');
        var args = ['mysql', { foo: 'bar' }, null, { foo: 'baz' }];
        ecs._lazySetConfig(args);
        assert.equal(service._dirtyFields.length, 2);
        assert.deepEqual(service._dirtyFields, ['bax', 'foo']);
      });

      it('sets the changed values to the service model', function() {
        var args = ['mysql', { foo: 'bar' }, null, { foo: 'baz', bax: 'qux' }];
        ecs._lazySetConfig(args);
        assert.equal(service.setAttrs.calledOnce(), true);
        assert.deepEqual(service.setAttrs.lastArguments()[0], { foo: 'bar' });
        assert.deepEqual(service.setAttrs.lastArguments()[1], { foo: 'bar' });
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
        assert.equal(record.command.method, '_add_relation');
        assert.deepEqual(record.command.args, [
          ['serviceId1$', ['db', 'client']],
          ['serviceId2$', ['db', 'server']]
        ]);
        assert.equal(typeof record.command.onParentResults, 'function');
        assert.equal(record.executed, false);
        assert.equal(record.id, key);
        assert.deepEqual(record.parents, ['service-1', 'service-2']);
        assert.equal(Y.Object.size(ecs.changeSet), 3);
        // Perform this last, as it will mutate ecs.changeSet.
        assert.equal(ecs._buildHierarchy(ecs.changeSet).length, 2);
      });
    });

    describe('_lazyRemoveRelation', function() {
      it('can remove a ghost relation from the changeset', function() {
        ecs.get('db').relations = {
          compareRelationEndpoints: testUtils.makeStubFunction(true),
          getRelationFromEndpoints: testUtils.makeStubFunction(),
          remove: testUtils.makeStubFunction()
        };
        ecs.changeSet['addRelation-982'] = {
          command: {
            args: ['arg1', 'arg2'],
            method: '_add_relation' }};
        var record = ecs._lazyRemoveRelation(['args1', 'args2']);
        var compare = ecs.get('db').relations.compareRelationEndpoints;
        var remove = ecs.get('db').relations.remove;
        var getRelation = ecs.get('db').relations.getRelationFromEndpoints;
        var compareArgs = compare.lastArguments();
        assert.equal(compare.calledOnce(), true);
        assert.deepEqual(compareArgs[0], ['arg1', 'arg2']);
        assert.deepEqual(compareArgs[1], ['args1', 'args2']);
        assert.strictEqual(record, undefined);
        assert.strictEqual(ecs.changeSet['addRelation-982'], undefined);
        assert.deepEqual(getRelation.lastArguments()[0], ['args1', 'args2']);
        assert.equal(remove.calledOnce(), true);
      });

      it('can add a remove relation record into the changeset', function() {
        var record = ecs._lazyRemoveRelation(['args1', 'args2']);
        assert.equal(record.split('-')[0], 'removeRelation');
        // Note that we cannot guarantee the duration of the tests, so we
        // need to assert against the record's timestamp below.
        assert.deepEqual(ecs.changeSet[record], {
          command: {
            args: ['args1', 'args2'],
            method: '_remove_relation'
          },
          executed: false,
          id: record,
          parents: [],
          timestamp: ecs.changeSet[record].timestamp
        });
      });
    });

    describe('_lazyRemoveUnit', function() {
      it('can remove a ghost unit from the changeset', function() {
        ecs.get('db').units = {
          remove: testUtils.makeStubFunction()
        };
        ecs.changeSet['addUnit-982'] = {
          command: {
            args: ['arg1'],
            method: '_add_units' }};
        var record = ecs._lazyRemoveUnit(['arg1']);
        var remove = ecs.get('db').units.remove;
        assert.strictEqual(record, undefined);
        assert.strictEqual(ecs.changeSet['addUnit-982'], undefined);
        assert.equal(remove.calledOnce(), true);
      });

      it('can add a remove unit record into the changeset', function() {
        var record = ecs._lazyRemoveUnit(['args1', 'args2']);
        assert.equal(record.split('-')[0], 'removeUnit');
        // Note that we cannot guarantee the duration of the tests, so we
        // need to assert against the record's timestamp below.
        assert.deepEqual(ecs.changeSet[record], {
          command: {
            args: ['args1', 'args2'],
            method: '_remove_units'
          },
          executed: false,
          id: record,
          parents: [],
          timestamp: ecs.changeSet[record].timestamp
        });
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
        
      it.only('handles heirarchical changes on queued services', function() {
        var db = ecs.get('db');
        db.services = new Y.juju.models.ServiceList();
        db.services.ghostService({ get: function() {} });
        ecs.changeSet = {
          'service-1': {
            command: {
              args: ['charm', 'mysql'],
              method: '_deploy',
              options: { modelId: 'serviceId1$' }
            }
          }
        };
        var callback = testUtils.makeStubFunction();
        var args = ['service-1', {}, {}, {}, callback];
        var key = ecs._lazySetConfig(args);
        var record = ecs.changeSet[key];
        assert.equal(typeof record.command.onParentResults, 'function');
        assert.equal(record.executed, false);
        assert.equal(record.id, key);
        assert.deepEqual(record.parents, ['service-1', 'service-2']);
        assert.equal(Y.Object.size(ecs.changeSet), 3);
        // Perform this last, as it will mutate ecs.changeSet.
        assert.equal(ecs._buildHierarchy(ecs.changeSet).length, 2);
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

    describe('placeUnit', function() {
      it('throws if it can\'t find the unit being placed', function() {
        var unit = { id: 'foo' };
        assert.throws(
            ecs.placeUnit.bind(ecs, unit),
            'attempted to place a unit which has not been added: ' + unit.id);
      });

      it('places on a same ghost if it was already was placed', function() {
        var unit = { id: '1234' };
        var machineId = '0';
        ecs.changeSet = {
          a: {
            command: {
              method: '_add_unit',
              options: {
                modelId: unit.id }},
            parents: ['addMachines_123'] },
          addMachines_123: {
            command: {
              method: '_addMachines',
              options: {
                modelId: machineId }},
            parents: [] }
        };
        ecs.set('db', {
          units: {
            revive: testUtils.makeStubFunction({
              set: testUtils.makeStubFunction() }),
            free: testUtils.makeStubFunction() }
        });
        assert.equal(ecs.changeSet.a.parents.length, 1);
        ecs.placeUnit(unit, machineId);
        assert.equal(ecs.changeSet.a.parents.length, 1);
        assert.equal(ecs.changeSet.a.parents[0], 'addMachines_123');
      });

      it('adds addMachine parent for the unit on new machines', function() {
        var unit = { id: '1234' };
        var machineId = '0';
        ecs.changeSet = {
          a: {
            command: {
              method: '_add_unit',
              options: {
                modelId: unit.id }},
            parents: [] },
          b: {
            command: {
              method: '_addMachines',
              options: {
                modelId: machineId }},
            parents: [] }
        };
        ecs.set('db', {
          units: {
            revive: testUtils.makeStubFunction({
              set: testUtils.makeStubFunction() }),
            free: testUtils.makeStubFunction() }
        });
        assert.equal(ecs.changeSet.a.parents.length, 0);
        ecs.placeUnit(unit, machineId);
        assert.equal(ecs.changeSet.a.parents.length, 1);
        assert.equal(ecs.changeSet.a.parents[0], 'b');
      });

      it('updates add_unit record when container exists', function() {
        var unit = { id: '1234' };
        var machineId = '0';
        var cmdArgs = ['serviceid', 1, null];
        ecs.changeSet = {
          a: {
            command: {
              args: cmdArgs,
              method: '_add_unit',
              options: {
                modelId: unit.id }},
            parents: [] }
        };
        ecs.set('db', {
          units: {
            revive: testUtils.makeStubFunction({
              set: testUtils.makeStubFunction() }),
            free: testUtils.makeStubFunction() }
        });
        assert.deepEqual(ecs.changeSet.a.command.args, cmdArgs);
        ecs.placeUnit(unit, machineId);
        cmdArgs[2] = machineId;
        assert.deepEqual(ecs.changeSet.a.command.args, cmdArgs);
      });

      it('sets the machineId in the unit model', function() {
        var unit = { id: '1234' };
        var machineId = '0';
        ecs.changeSet = {
          a: {
            command: {
              method: '_add_unit',
              options: {
                modelId: unit.id }},
            parents: [] },
          b: {
            command: {
              method: '_addMachines',
              options: {
                modelId: machineId }},
            parents: [] }
        };
        var set = testUtils.makeStubFunction();
        ecs.set('db', {
          units: {
            revive: testUtils.makeStubFunction({ set: set }),
            free: testUtils.makeStubFunction() }
        });
        ecs.placeUnit(unit, machineId);
        var db = ecs.get('db');
        assert.equal(db.units.revive.calledOnce(), true);
        var setArgs = set.lastArguments();
        assert.equal(set.calledOnce(), true);
        assert.deepEqual(setArgs, ['machine', machineId]);
        assert.equal(db.units.free.calledOnce(), true);
      });
    });
  });

});
