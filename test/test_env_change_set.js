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
        ecs.changeSet = {
          'foo-1': {
            parents: ['bar-1'],
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

    describe('_updateChangesetFromResults', function() {
      beforeEach(function() {
        // Simulates two related services being autodeployed to two machines,
        // one unit per machine.
        ecs.changeSet = {
          'service-1': {
            id: 'service-1',
            parents: [],
            command: {}
          },
          'addUnits-1': {
            id: 'addUnits-1',
            parents: ['service-1', 'addMachines-1'],
            command: {
              onParentResults: testUtils.makeStubFunction()
            }
          },
          'service-2': {
            id: 'service-2',
            parents: [],
            command: {}
          },
          'addUnits-2': {
            id: 'addUnits-2',
            parents: ['service-2', 'addMachines-2'],
            command: {
              onParentResults: testUtils.makeStubFunction()
            }
          },
          'addRelation-1': {
            id: 'addRelation-1',
            parents: ['service-2', 'service-1'],
            command: {}
          },
          'addMachines-2': {
            id: 'addMachines-2',
            parents: [],
            command: {}
          }
        };
      });

      afterEach(function() {
        ecs.changeSet = {};
      });

      it('only updates changeset for subrecords', function() {
        var key = 'service-1',
            cs = ecs.changeSet;
        ecs._updateChangesetFromResults({key: key}, null);
        assert.equal(
            cs['addUnits-1'].command.onParentResults.calledOnce(),
            true,
            'subrecord not updated'
        );
        assert.equal(
            cs['addUnits-2'].command.onParentResults.calledOnce(),
            false,
            'non-child record updated'
        );
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
        var args = envObj._deploy.lastArguments();
        assert.deepEqual(args, record.command.args);
      });

      it('executes the command prepare callable if defined', function() {
        var db = {'mock': 'db'};
        ecs.set('db', db);
        var prepare = testUtils.makeStubFunction();
        var record = {
          id: 'service-123',
          parents: undefined,
          executed: false,
          command: {
            method: '_deploy',
            args: [1, 2, 'foo', testUtils.makeStubFunction()],
            prepare: prepare
          }
        };
        ecs._execute(envObj, record);
        assert.strictEqual(prepare.calledOnce(), true);
        // The database object is passed to the prepare callable.
        var args = prepare.lastArguments();
        assert.deepEqual(args, [db]);
      });
    });

    describe('_buildHierarchy', function() {
      var filterStub, db;

      beforeEach(function() {
        db = ecs.get('db');
        db.units = {};
        filterStub = testUtils.makeStubMethod(db.units, 'filterByMachine');
      });

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

      it('filters out unplaced units by default', function() {
        ecs.changeSet = {
          a: { parents: [], command: {
            method: '_deploy',
            options: { modelId: '75930989$' }
          }},
          b: { parents: [], command: {
            method: '_add_unit',
            options: { modelId: '75930989$/0' }
          }}
        };

        filterStub = testUtils.makeStubMethod(
            db.units, 'filterByMachine', [{id: '75930989$/0'}]);
        var result = ecs._buildHierarchy();
        // XXX assert.deepEqual does not seem to play well with arrays
        // of objects.  Slack card on board - Makyo 2014-04-23
        assert.equal(filterStub.calledOnce(), true,
                     'no call to find unplaced units');
        assert.equal(JSON.stringify(result), JSON.stringify([
          [
            {
              parents: [],
              command: {
                method: '_deploy',
                options: { modelId: '75930989$' }
              },
              key: 'a'
            }
          ]
        ]));
      });
    });

    describe('commit', function() {
      beforeEach(function() {
        var db = ecs.get('db');
        db.units = {};
        testUtils.makeStubMethod(db.units, 'filterByMachine');
      });

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

  describe('clear', function() {
    beforeEach(function() {
      var db = ecs.get('db');
      db.units = {};
      testUtils.makeStubMethod(db.units, 'filterByMachine');
    });

    it('clears the change set', function() {
      var stubClearDB = testUtils.makeStubMethod(ecs, '_clearFromDB');
      this._cleanups.push(stubClearDB.reset);
      var changeSet = {
        'service-568': {
          executed: false,
          command: {
            method: '_deploy'
          }
        }
      };
      ecs.changeSet = changeSet;
      ecs.clear();
      assert.deepEqual(ecs.changeSet, {}, 'changeSet not emptied');
      assert.equal(stubClearDB.calledOnce(), true, 'clearFromDB not called');
    });
  });

  describe('_clearFromDB', function() {
    it('clears deployed services', function() {
      var db = ecs.get('db');
      db.services = {};
      var stubRemove = testUtils.makeStubMethod(db.services, 'remove');
      testUtils.makeStubMethod(db.services, 'getById');
      ecs._clearFromDB({method: '_deploy', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce(), true, 'Service not removed');
    });

    it('undeletes deleted services', function() {
      var db = ecs.get('db');
      var stubSet = testUtils.makeStubFunction();
      db.services = {
        getById: function() {
          return {
            set: stubSet
          };
        }
      };
      ecs._clearFromDB({method: '_destroyService', args: [1]});
      assert.deepEqual(stubSet.lastArguments(), ['deleted', false]);
    });

    it('undeletes deleted machines', function() {
      var db = ecs.get('db');
      var attrs = {deleted: true};
      db.machines = {
        getById: function() {
          return attrs;
        }
      };
      ecs._clearFromDB({method: '_destroyMachines', args: [1]});
      assert.deepEqual(attrs, {deleted: false});
    });

    it.skip('backs out config changes', function() {
      // XXX Config changed is not included in here pending current work on
      // storing the previous config values. Makyo 2014-08-22
    });

    it('clears added relations', function() {
      var db = ecs.get('db');
      db.relations = {};
      var stubRemove = testUtils.makeStubMethod(db.relations, 'remove');
      testUtils.makeStubMethod(db.relations, 'getById');
      ecs._clearFromDB({method: '_add_relation', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce(), true, 'Relation not removed');
    });

    it('undeletes deleted relations', function() {
      var db = ecs.get('db');
      var stubSet = testUtils.makeStubFunction();
      db.relations = {
        getRelationFromEndpoints: function() {
          return {
            set: stubSet
          };
        }
      };
      ecs._clearFromDB({method: '_remove_relation', args: [1, 2]});
      assert.deepEqual(stubSet.lastArguments(), ['deleted', false]);
    });

    it('undeletes deleted units', function() {
      var db = ecs.get('db');
      var attrs = {deleted: true};
      db.units = {
        getById: function() {
          return attrs;
        }
      };
      ecs._clearFromDB({method: '_remove_units', args: [[1]]});
      assert.deepEqual(attrs, {deleted: false});
    });

    it('clears added machines', function() {
      var db = ecs.get('db');
      db.machines = {};
      var stubRemove = testUtils.makeStubMethod(db.machines, 'remove');
      testUtils.makeStubMethod(db.machines, 'getById');
      ecs._clearFromDB({method: '_addMachines', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce(), true, 'Machine not removed');
    });

    it('clears added units', function() {
      var db = ecs.get('db');
      db.units = {};
      var stubRemove = testUtils.makeStubMethod(db, 'removeUnits');
      testUtils.makeStubMethod(db.units, 'getById');
      ecs._clearFromDB({method: '_add_unit', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce(), true, 'Unit not removed');
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
        var setStub = testUtils.makeStubFunction();
        ecs.set('db', {
          services: {
            getById: function(arg) {
              assert.equal(arg, args[0]);
              return {
                set: setStub
              };
            }}
        });
        var key = ecs._lazyDestroyService(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_destroyService');
        assert.equal(setStub.calledOnce(), true);
        assert.equal(setStub.lastArguments()[0], 'deleted');
        assert.equal(setStub.lastArguments()[1], true);
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
        var machineObj = { units: [] };
        ecs.set('db', {
          machines: {
            getById: function(arg) {
              assert.deepEqual(arg, args[0]);
              return machineObj;
            }}
        });
        var key = ecs._lazyDestroyMachines(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_destroyMachines');
        assert.equal(machineObj.deleted, true);
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
          getById: function() {
            return { units: []};
          },
          remove: stubRemove
        };
        ecs.lazyAddMachines([[{}], function() {}], {modelId: 'baz'});
        ecs._lazyDestroyMachines([['baz'], function() {}]);
        assert.equal(stubRemove.calledOnce(), true, 'remove not called');
        assert.deepEqual(ecs.changeSet, {});
      });

      it('removes records for queued uncommitted machines', function() {
        var stubDestroy = testUtils.makeStubMethod(
            ecs, '_destroyQueuedMachine');
        this._cleanups.push(stubDestroy.reset);
        ecs.get('db').machines = {
          getById: function() {
            return { units: []};
          }
        };
        ecs.changeSet = {
          'addMachines-000': {
            command: {
              method: '_addMachines',
              options: {
                modelId: 'baz'
              }
            }
          }
        };
        ecs._lazyDestroyMachines([['baz'], function() {}]);
        assert.equal(stubDestroy.calledOnce(), true);
      });

      it('removes uncommitted units from machines', function() {
        var stubRemove = testUtils.makeStubFunction();
        ecs.get('db').machines = {
          getById: function() {},
          remove: stubRemove
        };
        ecs.changeSet = {
          'addUnits-000': {
            command: {
              method: '_add_unit',
              args: ['foo', 'bar', 'baz']
            },
            parents: ['addMachines-001']
          },
          'addMachines-001': {
            command: {
              options: {
                modelId: 'foo'
              }
            }
          }
        };
        ecs._destroyQueuedMachine('addMachines-001');
        var unit = ecs.changeSet['addUnits-000'];
        assert.deepEqual(unit.parents, []);
        assert.isNull(unit.command.args[2]);
      });

      it('removes machines from uncommitted units', function() {
        var stubSet = testUtils.makeStubFunction();
        var db = ecs.get('db');
        var unit = { machine: 'foo'};
        db.machines = {
          getById: function() {
            return { units: [unit] };
          }
        };
        db.units = {
          revive: function() { return { set: stubSet }; },
          free: function() {}
        };
        ecs._lazyDestroyMachines([['baz'], function() {}]);
        assert.deepEqual(unit, {});
        assert.deepEqual(stubSet.lastArguments(), ['machine', null]);
      });

      it('removes uncommitted units from the parent machine', function() {
        var stubSet = testUtils.makeStubFunction();
        var db = ecs.get('db');
        var unit = { machine: 'foo'};
        var machine = {
          parentId: 1,
          units: [unit]
        };
        var parentMachine = {
          units: [unit]
        };
        db.machines = {
          getById: function(key) {
            if (key === 1) {
              return parentMachine;
            } else {
              return machine;
            }
          }
        };
        db.units = {
          revive: function() { return { set: stubSet }; },
          free: function() {}
        };
        ecs._lazyDestroyMachines([['baz'], function() {}]);
        assert.deepEqual(parentMachine.units, []);
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

      it('includes the series in the command on preparation', function() {
        var args = [[{}]];
        var options = {modelId: 'new1'};
        var key = ecs.lazyAddMachines(args, options);
        var command = ecs.changeSet[key].command;
        // Assign a unit to the machine.
        var units = new Y.juju.models.ServiceUnitList();
        units.add({
          id: 'django/1',
          machine: 'new1',
          charmUrl: 'cs:utopic/django-42'
        });
        // Execute the command preparation.
        command.prepare({units: units});
        // The series is now set for the new machine call.
        assert.strictEqual(command.args[0][0].series, 'utopic');
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

      it('updates the machine where to deploy on parent results', function() {
        var args = ['django', 1, 'new1'];
        var key = ecs.lazyAddUnits(args);
        var command = ecs.changeSet[key].command;
        var parentRecord = {command: {method: '_addMachines'}};
        var parentResults = [{machines: [{name: '42'}]}];
        command.onParentResults(parentRecord, parentResults);
        // The unit will be added to the real machine.
        assert.strictEqual(command.args[2], '42');
      });

      it('updates the service name on parent results', function() {
        var args = ['django', 1, 'new1'];
        var db = ecs.get('db');
        db.units = {};
        var unit = {};
        var stubFinder = testUtils.makeStubMethod(db.units, 'getById', unit);
        var key = ecs.lazyAddUnits(args, {modelId: '1'});
        var command = ecs.changeSet[key].command;
        var parentRecord = {
          command: {
            method: '_deploy',
            args: ['cs:utipic/django-42', 'my-service']
          }
        };
        var parentResults = {}; // Not used in this case.
        command.onParentResults(parentRecord, parentResults);
        // The first add_unit argument has been updated with the new service
        // name.
        assert.strictEqual(command.args[0], 'my-service',
                           'service name not set properly');
        assert.equal(stubFinder.calledOnce(), true,
                     'did not query DB for unit');
        assert.equal(unit.service, 'my-service',
                     'service name not updated on unit');
      });

    });

    describe('_lazySetConfig', function() {
      var service;

      beforeEach(function() {
        service = {
          _dirtyFields: [],
          setAttrs: testUtils.makeStubFunction(),
          get: function(key) {
            if (key === '_dirtyFields') {
              return service._dirtyFields;
            } else {
              return { foo: 'bar' };
            }
          },
          set: function(key, value) {
            service[key] = value;
          }
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
        var dirtyFields = service.get('_dirtyFields');
        dirtyFields.push('bax');
        service.set('_dirtyFields', dirtyFields);
        var args = ['mysql', { foo: 'bar' }, null, { foo: 'baz' }];
        ecs._lazySetConfig(args);
        dirtyFields = service.get('_dirtyFields');
        assert.equal(dirtyFields.length, 2);
        assert.deepEqual(dirtyFields, ['bax', 'foo']);
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
      beforeEach(function() {
        var db = ecs.get('db');
        db.units = {};
        testUtils.makeStubMethod(db.units, 'filterByMachine');
      });

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
        assert.equal(record.command.args.length, 3);
        assert.deepEqual(
            record.command.args[0],
            ['serviceId1$', ['db', 'client']]);
        assert.deepEqual(
            record.command.args[1],
            ['serviceId2$', ['db', 'server']]);
        assert.equal(typeof record.command.args[2], 'function');
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
        var setStub = testUtils.makeStubFunction();
        var db = ecs.get('db');
        db.relations = {
          getRelationFromEndpoints: testUtils.makeStubFunction({
            set: setStub
          })
        };
        var record = ecs._lazyRemoveRelation(['args1', 'args2']);
        assert.equal(record.split('-')[0], 'removeRelation');
        var ecsRecord = ecs.changeSet[record];
        assert.strictEqual(ecsRecord.executed, false);
        assert.equal(ecsRecord.id, record);
        assert.deepEqual(ecsRecord.parents, []);
        // We just need to make this the timestamp is not undefined.
        assert.equal(typeof ecsRecord.timestamp, 'number');
        assert.equal(ecsRecord.command.args.length, 3);
        assert.equal(ecsRecord.command.args[0], 'args1');
        assert.equal(ecsRecord.command.args[1], 'args2');
        assert.equal(typeof ecsRecord.command.args[2], 'function');
        assert.equal(ecsRecord.command.method, '_remove_relation');
        assert.deepEqual(
            db.relations.getRelationFromEndpoints.lastArguments()[0],
            ['args1', 'args2']);
        assert.equal(setStub.calledOnce(), true);
        assert.deepEqual(setStub.lastArguments(), ['deleted', true]);
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
            method: '_add_units' ,
            options: {modelId: 'arg1'}}};
        var record = ecs._lazyRemoveUnit([['arg1']]);
        var remove = ecs.get('db').units.remove;
        assert.strictEqual(record, undefined);
        assert.strictEqual(ecs.changeSet['addUnit-982'], undefined);
        assert.equal(remove.calledOnce(), true);
      });

      it('can add a remove unit record into the changeset', function() {
        var unitObj = {};
        ecs.get('db').units = {
          getById: function(arg) {
            assert.equal(arg.substr(0, 4), 'args');
            return unitObj;
          }
        };
        var record = ecs._lazyRemoveUnit([['args1', 'args2']]);
        assert.equal(record.split('-')[0], 'removeUnit');
        var ecsRecord = ecs.changeSet[record];
        assert.strictEqual(ecsRecord.executed, false);
        assert.equal(ecsRecord.id, record);
        assert.deepEqual(ecsRecord.parents, []);
        // We just need to make this the timestamp is not undefined.
        assert.equal(typeof ecsRecord.timestamp, 'number');
        assert.equal(ecsRecord.command.args.length, 2);
        assert.deepEqual(ecsRecord.command.args[0], ['args1', 'args2']);
        assert.equal(typeof ecsRecord.command.args[1], 'function');
        assert.equal(ecsRecord.command.method, '_remove_units');
        assert.equal(unitObj.deleted, true);
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

      it('retrieves the updated service name on preparation', function() {
        var options = {modelId: 'new1'};
        var callback = testUtils.makeStubFunction();
        var args = [
          'cs:precise/django-42', 'django', {}, null, 1, {}, null,
          callback, options
        ];
        var key = ecs._lazyDeploy(args);
        var command = ecs.changeSet[key].command;
        // Add the ghost service to the db.
        var services = new Y.juju.models.ServiceList();
        services.add({id: 'new1', name: 'renamed-service'});
        // Execute the command preparation.
        command.prepare({services: services});
        // The service name has been updated.
        assert.strictEqual(command.args[1], 'renamed-service');
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

      it('handles heirarchical changes on queued services', function() {
        var db = ecs.get('db');
        db.services = new Y.juju.models.ServiceList();
        db.services.add({ id: 'serviceId1$' });
        db.units = {};
        testUtils.makeStubMethod(db.units, 'filterByMachine');
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
        var args = ['serviceId1$', {}, {}, {}, callback];
        var key = ecs._lazySetConfig(args);
        var record = ecs.changeSet[key];
        assert.equal(typeof record.command.onParentResults, 'function');
        assert.equal(record.executed, false);
        assert.equal(record.id, key);
        assert.deepEqual(record.parents, ['service-1']);
        assert.equal(Y.Object.size(ecs.changeSet), 2);
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
      var machineId, mockSet, mockValidateUnitPlacement, unit;

      beforeEach(function() {
        machineId = '0';
        // Set up a mock db object.
        mockSet = testUtils.makeStubFunction();
        ecs.set('db', {
          units: {
            free: testUtils.makeStubFunction(),
            revive: testUtils.makeStubFunction({set: mockSet})
          },
          machines: {
            getById: testUtils.makeStubFunction({
              id: machineId
            })
          }
        });
        // Set up a mock unit.
        unit = {id: 'django/42'};
        // Mock the validateUnitPlacement function: without errors the function
        // returns null (third argument of makeStubMethod).
        mockValidateUnitPlacement = testUtils.makeStubMethod(
            ecs, 'validateUnitPlacement', null);
        this._cleanups.push(mockValidateUnitPlacement.reset);
        // Set up a base changeset: tests can override this value if required.
        ecs.changeSet = {
          a: {
            command: {
              method: '_add_unit',
              options: {modelId: unit.id}
            },
            parents: []
          },
          b: {
            command: {
              method: '_addMachines',
              options: {modelId: machineId}
            },
            parents: []
          }
        };
      });

      it('places on a same ghost if it was already was placed', function() {
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
        assert.equal(ecs.changeSet.a.parents.length, 1);
        ecs.placeUnit(unit, machineId);
        assert.equal(ecs.changeSet.a.parents.length, 1);
        assert.equal(ecs.changeSet.a.parents[0], 'addMachines_123');
      });

      it('adds addMachine parent for the unit on new machines', function() {
        assert.equal(ecs.changeSet.a.parents.length, 0);
        ecs.placeUnit(unit, machineId);
        assert.equal(ecs.changeSet.a.parents.length, 1);
        assert.equal(ecs.changeSet.a.parents[0], 'b');
      });

      it('updates add_unit record when container exists', function() {
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
        assert.deepEqual(ecs.changeSet.a.command.args, cmdArgs);
        ecs.placeUnit(unit, machineId);
        cmdArgs[2] = machineId;
        assert.deepEqual(ecs.changeSet.a.command.args, cmdArgs);
      });

      it('sets the machineId in the unit model', function() {
        ecs.placeUnit(unit, machineId);
        var db = ecs.get('db');
        assert.equal(db.units.revive.calledOnce(), true);
        assert.equal(mockSet.calledOnce(), true);
        var setArgs = mockSet.lastArguments();
        assert.deepEqual(setArgs, ['machine', machineId]);
        assert.equal(db.units.free.calledOnce(), true);
      });

      it('validates unit placement', function() {
        var err = ecs.placeUnit(unit, machineId);
        assert.isNull(err);
        assert.strictEqual(mockValidateUnitPlacement.calledOnce(), true);
        var args = mockValidateUnitPlacement.lastArguments();
        assert.deepEqual(args, [unit, {id: machineId}]);
      });

      it('does not apply changes if unit placement is not valid', function() {
        mockValidateUnitPlacement = testUtils.makeStubMethod(
            ecs, 'validateUnitPlacement', 'bad wolf');
        this._cleanups.push(mockValidateUnitPlacement.reset);
        var err = ecs.placeUnit(unit, machineId);
        assert.strictEqual(err, 'bad wolf');
        // No parents have been added to the changeset record.
        assert.strictEqual(ecs.changeSet.a.parents.length, 0);
        // The machine id has not been set on the unit.
        assert.strictEqual(mockSet.called(), false);
      });

      it('raises an error if the unit was not added', function() {
        ecs.changeSet = {};
        var err = ecs.placeUnit(unit, machineId);
        assert.strictEqual(
            err,
            'attempted to place a unit which has not been added: django/42');
      });

    });

  });

  describe('validateUnitPlacement', function() {
    var unit, units;

    beforeEach(function() {
      // Set up a unit used for tests and the ecs database.
      unit = {charmUrl: 'cs:utopic/django-42'};
      units = new Y.juju.models.ServiceUnitList();
      ecs.set('db', {units: units});
    });

    afterEach(function() {
      units.destroy();
    });

    it('passes the validation on an existing machine', function() {
      var machine = {id: '0', series: 'utopic'};
      var err = ecs.validateUnitPlacement(unit, machine);
      assert.isNull(err);
    });

    it('passes the validation on a ghost machine', function() {
      units.add({
        id: 'wordpress/1',
        charmUrl: 'cs:utopic/wordpress-0',
        machine: '0'
      });
      var machine = {id: '0'};
      var err = ecs.validateUnitPlacement(unit, machine);
      assert.isNull(err);
    });

    it('checks the series of an existing machine', function() {
      var machine = {id: '0', series: 'trusty'};
      var err = ecs.validateUnitPlacement(unit, machine);
      assert.strictEqual(
          err, 'unable to place a utopic unit on the trusty machine 0');
    });

    it('checks the series of a ghost machine', function() {
      units.add({
        id: 'wordpress/1',
        charmUrl: 'cs:trusty/wordpress-0',
        machine: '0'
      });
      var machine = {id: '0'};
      var err = ecs.validateUnitPlacement(unit, machine);
      assert.strictEqual(
          err,
          'machine 0 already includes units with a different series: trusty');
    });

  });

});
