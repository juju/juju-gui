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
  var Y, ECS, ecs, envObj, dbObj, models, testUtils;

  before(function(done) {
    var modules = [
      'environment-change-set',
      'juju-models',
      'juju-tests-utils'
    ];
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      ECS = Y.namespace('juju').EnvironmentChangeSet;
      testUtils = Y.namespace('juju-tests').utils;
      models = Y.namespace('juju.models');
      done();
    });
    window.flags = { mv: true };
  });

  beforeEach(function() {
    dbObj = new models.Database();
    ecs = new ECS({
      db: dbObj
    });
    envObj = new Y.juju.environments.GoEnvironment({
      connection: new testUtils.SocketStub(),
      user: 'user',
      password: 'password',
      ecs: ecs
    });
    testUtils.makeStubMethod(envObj, '_addCharm');
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
    dbObj.reset();
    dbObj.destroy();
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
              onParentResults: sinon.stub()
            }
          }
        };
        ecs._updateChangesetFromResults({key: 'bar-1'}, null);

        assert.isTrue(
            ecs.changeSet['foo-1'].command.onParentResults.calledOnce);
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
              onParentResults: sinon.stub()
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
              onParentResults: sinon.stub()
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
            cs['addUnits-1'].command.onParentResults.calledOnce,
            true,
            'subrecord not updated'
        );
        assert.equal(
            cs['addUnits-2'].command.onParentResults.calledOnce,
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
          assert.equal(Array.isArray(arguments), false);
          assert.equal(Array.isArray(result), true);
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
        var stub = sinon.stub();
        var args = [1, 2, 'foo', 'bar', stub, { options: 'foo'}];
        function test() {
          var result = ecs._getArgs(arguments);
          assert.equal(Array.isArray(arguments), false);
          assert.equal(Array.isArray(result), true);
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
        assert.equal(wrapCallback.calledOnce, true);
        // Note that we cannot guarantee the duration of the tests, so we
        // need to assert against the record's timestamp below.
        assert.deepEqual(wrapCallback.lastCall.args[0], {
          id: key,
          index: 0,
          parents: [],
          executed: false,
          command: command,
          timestamp: ecs.changeSet[key].timestamp
        });
        assert.deepEqual(ecs.changeSet[key], {
          id: key,
          index: 0,
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
        assert.equal(wrapCallback.calledOnce, true);
        // Note that we cannot guarantee the duration of the tests, so we
        // need to assert against the record's timestamp below.
        assert.deepEqual(wrapCallback.lastCall.args[0], {
          id: key,
          index: 0,
          parents: parent,
          executed: false,
          command: command,
          timestamp: ecs.changeSet[key].timestamp
        });
        assert.deepEqual(ecs.changeSet[key], {
          id: key,
          index: 0,
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
        assert.equal(fire.calledOnce, true);
        assert.equal(fire.lastCall.args[0], 'changeSetModified');
      });
    });

    describe('_wrapCallback', function() {
      it('wraps the callback provided in the record object', function() {
        var callback = sinon.stub().returns('real cb');
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
        assert.equal(fire.callCount, 2);
        var fireArgs = fire.args[0];
        assert.equal(fireArgs[0], 'taskComplete');
        assert.equal(fireArgs[1].id, 'service-123');
        assert.equal(fireArgs[1].record, record);
        assert.equal(record.executed, true);
      });
    });

    describe('_execute', function() {
      it('calls to wrap the callback then executes on the env', function() {
        var callback = sinon.stub();
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
        assert.equal(envObj._deploy.calledOnce, true);
        var args = envObj._deploy.lastCall.args;
        assert.deepEqual(args, record.command.args);
      });

      it('executes the command prepare callable if defined', function() {
        var db = {'mock': 'db'};
        ecs.set('db', db);
        var prepare = sinon.stub();
        var record = {
          id: 'service-123',
          parents: undefined,
          executed: false,
          command: {
            method: '_deploy',
            args: [1, 2, 'foo', sinon.stub()],
            prepare: prepare
          }
        };
        ecs._execute(envObj, record);
        assert.strictEqual(prepare.calledOnce, true);
        // The database object is passed to the prepare callable.
        var args = prepare.lastCall.args;
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

      it('only acts on the current index', function() {
        ecs.changeSet = {
          a: { index: 0, parents: [] },
          b: { index: 0, parents: [] },
          c: { index: 1, parents: [] }
        };
        var result = ecs._buildHierarchy();
        // XXX assert.deepEqual does not seem to play well with arrays
        // of objects.  Slack card on board - Makyo 2014-04-23
        assert.deepEqual(JSON.stringify(result), JSON.stringify([
          [
            { index: 0, parents: [], key: 'a' },
            { index: 0, parents: [], key: 'b' }
          ]
        ]));
      });

      it('acts sane with "flat" hierarchies', function() {
        ecs.changeSet = {
          a: { index: 0, parents: [] },
          b: { index: 0, parents: [] },
          c: { index: 0, parents: [] },
          d: { index: 0, parents: [] },
          e: { index: 0, parents: [] },
          f: { index: 0 } // Can handle missing parents attribute.
        };

        var result = ecs._buildHierarchy();
        assert.deepEqual(JSON.stringify(result), JSON.stringify([
          [
            { index: 0, parents: [], key: 'a' },
            { index: 0, parents: [], key: 'b' },
            { index: 0, parents: [], key: 'c' },
            { index: 0, parents: [], key: 'd' },
            { index: 0, parents: [], key: 'e' },
            { index: 0, key: 'f' }
          ]
        ]));
      });

      it('splits commands into dependency levels', function() {
        ecs.changeSet = {
          a: { index: 0, parents: [] },
          b: { index: 0, parents: [] },
          c: { index: 0, parents: ['a', 'b'] },
          d: { index: 0, parents: ['a'] },
          e: { index: 0, parents: ['a', 'c'] },
          f: { index: 0, parents: ['e'] }
        };

        var result = ecs._buildHierarchy();
        // XXX assert.deepEqual does not seem to play well with arrays
        // of objects.  Slack card on board - Makyo 2014-04-23
        assert.equal(JSON.stringify(result), JSON.stringify([
          // Top-level.
          [
            { index: 0, parents: [], key: 'a' },
            { index: 0, parents: [], key: 'b' }
          ],
          [
            { index: 0, parents: ['a', 'b'], key: 'c' },
            { index: 0, parents: ['a'], key: 'd' }
          ],
          [
            { index: 0, parents: ['a', 'c'], key: 'e' }
          ],
          [
            { index: 0, parents: ['e'], key: 'f' }
          ]
        ]));
      });

      it('filters out unplaced units when instructed to', function() {
        ecs.changeSet = {
          a: { index: 0, parents: [], command: {
            method: '_deploy',
            options: { modelId: '75930989$' }
          }},
          b: { index: 0, parents: [], command: {
            method: '_add_unit',
            options: { modelId: '75930989$/0' }
          }}
        };

        filterStub = testUtils.makeStubMethod(
            db.units, 'filterByMachine', [{id: '75930989$/0'}]);
        var result = ecs._buildHierarchy(true);
        // XXX assert.deepEqual does not seem to play well with arrays
        // of objects.  Slack card on board - Makyo 2014-04-23
        assert.equal(filterStub.calledOnce, true,
                     'no call to find unplaced units');
        assert.equal(JSON.stringify(result), JSON.stringify([
          [
            {
              index: 0,
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
            index: 0,
            executed: false,
            command: {
              method: '_deploy'
            }
          }
        };
        ecs.changeSet = changeSet;
        ecs.commit(envObj);
        assert.equal(execute.callCount, 1);
        assert.deepEqual(execute.lastCall.args[1], changeSet['service-568']);
        assert.equal(fire.callCount, 1);
        var fireArgs = fire.lastCall.args;
        assert.equal(fireArgs[0], 'commit');
        assert.equal(fireArgs[1], changeSet['service-568']);
      });

      it('commits one index at a time', function() {
        var execute = testUtils.makeStubMethod(ecs, '_execute');
        this._cleanups.push(execute.reset);
        var fire = testUtils.makeStubMethod(ecs, 'fire');
        this._cleanups.push(fire.reset);
        var changeSet = {
          'service-568': {
            index: 0,
            executed: false,
            command: {
              method: '_deploy'
            }
          },
          'service-123': {
            index: 1,
            executed: false,
            command: {
              method: '_deploy'
            }
          }
        };
        ecs.changeSet = changeSet;
        ecs.commit();
        assert.equal(execute.callCount, 1);
        assert.equal(ecs.currentIndex, 1, 'Current index not incremented');
        assert.equal(ecs.changeSet['service-123'].index, 1,
            'uncommitted record\'s index changed');
      });

      it('passes the commit index through an event', function() {
        var fire = testUtils.makeStubMethod(ecs, 'fire');
        this._cleanups.push(fire.reset);
        ecs.levelRecordCount = 0;
        ecs.levelTimer = { cancel: sinon.stub() };
        ecs._waitOnLevel(null, 0);
        assert.equal(fire.lastCall.args[0], 'currentCommitFinished');
        assert.deepEqual(fire.lastCall.args[1], {index: 0});
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
          index: 0,
          executed: false,
          command: {
            method: '_deploy'
          }
        }
      };
      ecs.changeSet = changeSet;
      ecs.clear();
      assert.deepEqual(ecs.changeSet, {}, 'changeSet not emptied');
      assert.equal(stubClearDB.calledOnce, true, 'clearFromDB not called');
    });

    it('works with multiple indices', function() {
      var stubClearDB = testUtils.makeStubMethod(ecs, '_clearFromDB');
      this._cleanups.push(stubClearDB.reset);
      var changeSet = {
        'service-568': {
          index: 0,
          executed: false,
          command: {
            method: '_deploy'
          }
        },
        'service-123': {
          index: 1,
          executed: false,
          command: {
            method: '_deploy'
          }
        }
      };
      ecs.changeSet = changeSet;
      ecs.clear();
      assert.deepEqual(ecs.changeSet, {
        'service-123': {
          index: 1,
          executed: false,
          command: {
            method: '_deploy'
          }
        }
      }, 'other indices removed.');
      assert.equal(ecs.currentIndex, 1, 'Current index not incremented');
    });

  });

  describe('_clearFromDB', function() {
    it('clears deployed services', function() {
      var db = ecs.get('db');
      db.services = {};
      var stubRemove = testUtils.makeStubMethod(db.services, 'remove');
      testUtils.makeStubMethod(db.services, 'getById');
      ecs._clearFromDB({method: '_deploy', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Service not removed');
    });

    it('undeletes deleted services', function() {
      var db = ecs.get('db');
      var stubSet = sinon.stub();
      db.services = {
        getById: function() {
          return {
            set: stubSet
          };
        }
      };
      ecs._clearFromDB({method: '_destroyApplication', args: [1]});
      assert.deepEqual(stubSet.lastCall.args, ['deleted', false]);
    });

    it('undeletes deleted machines', function() {
      var db = ecs.get('db');
      var attrs = {deleted: true};
      var machine = {
        deleted: true
      };
      var unit = {
        deleted: true
      };
      db.machines = {
        getById: function() {
          return attrs;
        },
        filterByAncestor: function() {
          return [machine];
        }
      };
      db.units = {
        filterByMachine: function() {
          return [unit];
        }
      };
      ecs._clearFromDB({method: '_destroyMachines', args: [1]});
      assert.deepEqual(attrs, {deleted: false});
      assert.equal(machine.deleted, false);
      assert.equal(unit.deleted, false);
    });

    it('backs out config changes', function() {
      var db = ecs.get('db');
      var setStub = sinon.stub();
      var getStub = function(key) {
        if (key === 'config') {
          return {
            foo: 'bar',
            bax: undefined
          };
        }
        if (key === 'environmentConfig') {
          return { foo: 'baz' };
        }
      };
      db.services = {
        getById: function() {
          return {
            get: getStub,
            set: setStub
          };
        }
      };
      ecs._clearFromDB({method: '_set_config', args: [1]});
      assert.deepEqual(setStub.lastCall.args[1], {
        foo: 'baz',
        bax: undefined
      });
    });

    it('clears added relations', function() {
      var db = ecs.get('db');
      db.relations = {};
      var stubRemove = testUtils.makeStubMethod(db.relations, 'remove');
      testUtils.makeStubMethod(db.relations, 'getById');
      ecs._clearFromDB({method: '_add_relation', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Relation not removed');
    });

    it('undeletes deleted relations', function() {
      var db = ecs.get('db');
      var stubSet = sinon.stub();
      db.relations = {
        getRelationFromEndpoints: function() {
          return {
            set: stubSet
          };
        }
      };
      ecs._clearFromDB({method: '_remove_relation', args: [1, 2]});
      assert.deepEqual(stubSet.lastCall.args, ['deleted', false]);
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

    it('unexposes exposed services', function() {
      var db = ecs.get('db');
      var stubSet = sinon.stub();
      db.services = {
        getById: function() {
          return {
            set: stubSet
          };
        }
      };
      ecs._clearFromDB({method: '_expose', args: [1]});
      assert.deepEqual(stubSet.lastCall.args, ['exposed', false]);
    });

    it('exposes unexposed services', function() {
      var db = ecs.get('db');
      var stubSet = sinon.stub();
      db.services = {
        getById: function() {
          return {
            set: stubSet
          };
        }
      };
      ecs._clearFromDB({method: '_unexpose', args: [1]});
      assert.deepEqual(stubSet.lastCall.args, ['exposed', true]);
    });

    it('clears added machines', function() {
      var db = ecs.get('db');
      db.machines = {};
      var stubRemove = testUtils.makeStubMethod(db.machines, 'remove');
      testUtils.makeStubMethod(db.machines, 'getById');
      ecs._clearFromDB({method: '_addMachines', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Machine not removed');
    });

    it('clears added units', function() {
      var db = ecs.get('db');
      db.units = {};
      var stubRemove = testUtils.makeStubMethod(db, 'removeUnits');
      testUtils.makeStubMethod(db.units, 'getById');
      ecs._clearFromDB({method: '_add_unit', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Unit not removed');
    });
  });

  describe('private ENV methods', function() {
    describe('_lazyAddCharm', function() {
      it('adds a new `add Charm` record', function(done) {
        var args = ['id', 'cookies are better', done, {applicationId: 'foo'}];
        var key = ecs._lazyAddCharm(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_addCharm');
        // Remove the functions, which will not be equal.
        var cb = record.command.args.pop();
        args.pop();
        // Also remove the options object.
        args.pop();
        assert.deepEqual(record.command.args, args);
        assert.deepEqual(record.command.options, {applicationId: 'foo'});
        cb(); // Will call done().
      });

      it('only adds one `add Charm` record for duplicates', function() {
        ecs._lazyAddCharm(
          ['cs:wordpress', 'cookies', null, {applicationId: 'foo'}]);
        assert.equal(Object.keys(ecs.changeSet).length, 1);
        ecs._lazyAddCharm(
          ['cs:wordpress', 'cookies', null, {applicationId: 'foo'}]);
        assert.equal(Object.keys(ecs.changeSet).length, 1);
        ecs._lazyAddCharm(
          ['cs:mysql', 'cookies', null, {applicationId: 'foo'}]);
        assert.equal(Object.keys(ecs.changeSet).length, 2);
      });
    });

    describe('_lazyDeploy', function() {
      it('creates a new `deploy` record', function(done) {
        const args = {
          charmURL: 'cs:precise/django-42',
          applicationName: 'django',
        };
        const key = ecs._lazyDeploy([args, done, {modelId: 'baz'}]);
        const record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_deploy');
        // Remove the functions, which will not be equal.
        const cb = record.command.args.pop();
        // Also remove the options object.
        assert.deepEqual(record.command.args, [args]);
        assert.deepEqual(record.command.options, {modelId: 'baz'});
        cb(); // Will call done().
      });

      it('retrieves the updated application name on preparation', function() {
        const args = {
          charmURL: 'cs:precise/django-42',
          applicationName: 'django',
          series: 'precise',
          numUnits: 1
        };
        const callback = sinon.stub();
        const options = {modelId: 'new1'};
        const key = ecs._lazyDeploy([args, callback, options]);
        const command = ecs.changeSet[key].command;
        // Add the ghost service to the db.
        const services = new Y.juju.models.ServiceList();
        services.add({id: 'new1', name: 'renamed-app'});
        // Execute the command preparation.
        command.prepare({services: services});
        // The service name has been updated.
        assert.strictEqual(command.args[0].applicationName, 'renamed-app');
      });

      it('retrieves the updated application series on preparation', function() {
        const args = {
          charmURL: 'cs:trusty/django-42',
          applicationName: 'django',
          series: 'trusty',
          numUnits: 2
        };
        const callback = sinon.stub();
        const options = {modelId: 'new1'};
        const key = ecs._lazyDeploy([args, callback, options]);
        const command = ecs.changeSet[key].command;
        // Add the ghost service to the db.
        const services = new Y.juju.models.ServiceList();
        services.add({id: 'new1', name: 'renamed-service', series: 'xenial'});
        // Execute the command preparation.
        command.prepare({services: services});
        // The service name has been updated.
        assert.strictEqual(command.args[0].series, 'xenial');
      });

      it('filters out any undefined settings on commit', function() {
        const args = {
          charmURL: 'cs:trusty/django-42',
          applicationName: 'django',
          series: 'trusty',
          numUnits: 2,
          config: {key1: 'val', key2: undefined}
        };
        const callback = sinon.stub();
        const options = {modelId: 'new1'};
        const key = ecs._lazyDeploy([args, callback, options]);
        const command = ecs.changeSet[key].command;
        // Add the ghost service to the db.
        const services = new Y.juju.models.ServiceList();
        services.add({id: 'new1'});
        // Execute the command preparation.
        command.prepare({services: services});
        // Ensure that the undefined key is not still in the config param.
        assert.deepEqual(Object.keys(command.args[0].config), ['key1']);
      });
    });

    describe('lazyDestroyApplication', function() {
      it('creates a new destroy record', function(done) {
        var args = ['foo', done, {modelId: 'baz'}];
        var setStub = sinon.stub();
        ecs.set('db', {
          services: {
            getById: function(arg) {
              assert.equal(arg, args[0]);
              return {
                set: setStub,
                get: function() {
                  return new Y.LazyModelList();
                }
              };
            }}
        });
        var key = ecs.lazyDestroyApplication(args);
        var record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_destroyApplication');
        assert.equal(setStub.calledOnce, true);
        assert.equal(setStub.lastCall.args[0], 'deleted');
        assert.equal(setStub.lastCall.args[1], true);
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
        var stubRemove = sinon.stub();
        var stubDestroy = sinon.stub();
        var stubUpdateSubordinates = sinon.stub();
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
              },
              updateSubordinateUnits: stubUpdateSubordinates
            };
          }
        };
        db.relations = {
          remove: sinon.stub()
        };
        var stubRemoveUnits = testUtils.makeStubMethod(db, 'removeUnits');
        this._cleanups.push(stubRemoveUnits.reset);

        ecs._lazyDeploy([{charmURL: 'wp'}, function() {}, {modelId: 'baz'}]);
        ecs.lazyDestroyApplication(['baz']);
        assert.equal(stubRemove.calledOnce, true, 'remove not called');
        assert.equal(stubDestroy.calledOnce, true, 'destroy not called');
        assert.equal(
            stubRemoveUnits.calledOnce, true, 'remove units not called');
        assert.equal(db.relations.remove.calledOnce, true,
            'remove relations not called');
        assert.equal(stubUpdateSubordinates.calledOnce, true,
            'subordinate units not updated');
        assert.deepEqual(ecs.changeSet, {});
      });

      it('only destroys the last charm', function() {
        const db = ecs.get('db');
        db.services = {
          remove: sinon.stub(),
          getById: function() {
            return {
              destroy: sinon.stub(),
              get: function(key) {
                if (key === 'units') { return {each: sinon.stub()}; }
              },
              set: sinon.stub(),
              updateSubordinateUnits: sinon.stub()
            };
          },
        };
        db.relations = {
          remove: sinon.stub()
        };
        ecs._lazyAddCharm(
          ['cs:wordpress', 'cookies', null, {applicationId: 'foo'}]);
        ecs._lazyDeploy(
          [{charmURL: 'cs:wordpress'}, function() {}, {modelId: 'baz'}]);
        ecs._lazyDeploy(
          [{charmURL: 'cs:wordpress'}, function() {}, {modelId: 'baz2'}]);
        assert.equal(Object.keys(ecs.changeSet).length, 3);
        ecs.lazyDestroyApplication(['baz']);
        assert.equal(Object.keys(ecs.changeSet).length, 2);
        ecs.lazyDestroyApplication(['baz2']);
        assert.equal(Object.keys(ecs.changeSet).length, 0);
      });

      it('destroys unplaced units when the service is removed', function(done) {
        var args = ['foo', done, {modelId: 'baz'}];
        var units = new Y.juju.models.ServiceUnitList();
        var unitIds = ['test/1', 'test/2'];
        units.add([{id: unitIds[0]}, {id: unitIds[1]}]);
        ecs.set('db', {
          services: {
            getById: function(arg) {
              return {
                get: function() {
                  return units;
                },
                set: sinon.stub()
              };
            }
          }
        });
        var removeStub = testUtils.makeStubMethod(ecs, '_lazyRemoveUnit');
        this._cleanups.push(removeStub.reset);
        ecs.lazyDestroyApplication(args);
        assert.equal(removeStub.calledOnce, true);
        assert.deepEqual(removeStub.lastCall.args[0], [unitIds]);
        done();
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
            },
            revive: function() {
              return {
                set: function () {
                  machineObj.deleted = true;
                }
              };
            },
            filterByAncestor: function() {
              return [];
            },
            reset: function() {},
            detachAll: function() {},
            destroy: function() {},
            free: sinon.stub()
          },
          units: {
            detachAll: function() {},
            destroy: function() {},
            filterByMachine: function() {
              return [];
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
        var stubRemove = sinon.stub();
        ecs.get('db').machines = {
          getById: function() {
            return {};
          },
          detachAll: function() {},
          destroy: function() {},
          reset: function() {},
          remove: stubRemove
        };
        ecs.get('db').units = {
          detachAll: function() {},
          destroy: function() {},
          reset: function() {},
          filterByMachine: function() {
            return [];
          }
        };
        ecs.lazyAddMachines([[{}], function() {}], {modelId: 'baz'});
        ecs._lazyDestroyMachines([['baz'], function() {}]);
        assert.equal(stubRemove.calledOnce, true, 'remove not called');
        assert.deepEqual(ecs.changeSet, {});
      });

      it('removes records for queued uncommitted machines', function() {
        var stubDestroy = testUtils.makeStubMethod(
            ecs, '_destroyQueuedMachine');
        this._cleanups.push(stubDestroy.reset);
        ecs.get('db').machines = {
          detachAll: function() {},
          destroy: function() {},
          reset: function() {},
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
        assert.equal(stubDestroy.calledOnce, true);
      });

      it('removes uncommitted units from machines', function() {
        var stubRemove = sinon.stub();
        ecs.get('db').machines = {
          detachAll: function() {},
          destroy: function() {},
          getById: function() {},
          reset: function() {},
          remove: stubRemove
        };
        ecs.get('db').units = {
          detachAll: function() {},
          destroy: function() {},
          reset: function() {},
          filterByMachine: function() {}
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
        var stubSet = sinon.stub();
        var db = ecs.get('db');
        var unit = { machine: 'foo'};
        db.machines = {
          getById: function() {
            return {};
          },
          revive: function() {
            return {
              set: sinon.stub()
            };
          },
          filterByAncestor: function() {
            return [];
          },
          reset: function() {},
          detachAll: function() {},
          destroy: function() {},
          free: sinon.stub()
        };
        db.units = {
          revive: function() { return { set: stubSet }; },
          free: function() {},
          reset: function() {},
          detachAll: function() {},
          destroy: function() {},
          filterByMachine: function() {
            return [unit];
          }
        };
        ecs._lazyDestroyMachines([['baz'], function() {}]);
        assert.deepEqual(unit, {});
        assert.deepEqual(stubSet.lastCall.args, ['machine', null]);
      });

      it('marks nested containers and units as deleted', function() {
        var cmdArgs = ['abc123', true, function() {}];
        var unit = {
          // Required so it's treated as a real unit and not a ghost.
          agent_state: 'running',
          deleted: null
        };
        var machine = {
          deleted: null
        };
        ecs.get('db').machines = {
          detachAll: function() {},
          destroy: function() {},
          reset: function() {},
          free: function() {},
          revive: function(obj) {
            return {
              set: function(key, value) {
                obj[key] = value;
              }
            };
          },
          getById: function() {
            return {
              id: cmdArgs[0],
              parentId: 0
            };
          },
          filterByAncestor: function(machineId) {
            assert.equal(machineId, cmdArgs[0]);
            return [machine];
          }
        };
        ecs.get('db').units = {
          detachAll: function() {},
          destroy: function() {},
          reset: function() {},
          getById: function() {},
          free: function() {},
          revive: function(obj) {
            return {
              set: function(key, value) {
                obj[key] = value;
              }
            };
          },
          filterByMachine: function(machineId, includeChildren) {
            assert.equal(machineId, cmdArgs[0]);
            assert.equal(includeChildren, true);
            return [unit];
          }
        };
        ecs._lazyDestroyMachines(cmdArgs);
        assert.equal(unit.deleted, true, 'unit not set as deleted');
        assert.equal(machine.deleted, true, 'machine not set as deleted');
      });
    });

    describe('lazyAddMachines', function() {
      it('creates a new `addMachines` record', function(done) {
        var translateStub = testUtils.makeStubMethod(ecs,
            '_translateKeysToIds');
        this._cleanups.push(translateStub.reset);
        var args = [[{}], done];
        var key = ecs.lazyAddMachines(args, {modelId: ''});
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
        var services = new Y.juju.models.ServiceList();
        services.add({
          name: 'django',
          series: 'utopic'
        });
        units.add({
          id: 'django/1',
          machine: 'new1',
          charmUrl: 'cs:utopic/django-42'
        });
        // Execute the command preparation.
        command.prepare({
          units: units,
          services: services
        });
        // The series is now set for the new machine call.
        assert.strictEqual(command.args[0][0].series, 'utopic');
      });
    });

    describe('lazyAddUnits', function() {
      var stubUpdateSubordinates;

      beforeEach(function() {
        stubUpdateSubordinates = sinon.stub();
        ecs.get('db').services.getServiceByName = function() {
          return {
            updateSubordinateUnits: stubUpdateSubordinates
          };
        };
      });

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
        assert.equal(stubUpdateSubordinates.calledOnce, true);
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
        assert.equal(stubUpdateSubordinates.calledOnce, true);
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
        assert.equal(stubUpdateSubordinates.calledOnce, true);
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
        assert.equal(stubUpdateSubordinates.calledOnce, true);
      });

      it('updates the service and unit on parent results', function() {
        const args = ['django', 1, 'new1'];
        const db = ecs.get('db');
        db.units = {
          _idMap: {},
          fire: sinon.stub()
        };
        db.services.getById = sinon.stub();
        const unit = {
          id: '756482$/3',
          number: '3'
        };
        testUtils.makeStubMethod(db.units, 'getById', unit);
        testUtils.makeStubMethod(db, 'updateUnitId', {
          id: 'my-service/3'
        });
        const key = ecs.lazyAddUnits(args, {modelId: '1'});
        const command = ecs.changeSet[key].command;
        const parentRecord = {
          command: {
            method: '_deploy',
            args: [{
              charmURL: 'cs:utipic/django-42',
              applicationName: 'my-service',
              series: 'utopic'
            }]
          }
        };
        const parentResults = {}; // Not used in this case.
        command.options = {modelId: '756482$/3'};
        command.onParentResults(parentRecord, parentResults);
        // The first add_unit argument has been updated with the new service
        // name.
        assert.strictEqual(command.args[0], 'my-service',
                           'service name not set properly');
        assert.equal(command.options.modelId, 'my-service/3',
                     'options model id not updated');
        assert.equal(stubUpdateSubordinates.calledOnce, true);
      });

    });

    describe('_lazySetConfig', function() {
      var service;

      beforeEach(function() {
        service = {
          _dirtyFields: [],
          setAttrs: sinon.stub(),
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
          getById: sinon.stub().returns(service)
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
        assert.equal(addToRecord.callCount, 0);
      });

      it('creates a new `setConfig` record for a queued service', function() {
        const args = [{charmURL: 'wp'}, function() {}, {modelId: 'baz'}];
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
        service.set = sinon.stub();
        ecs._lazySetConfig(args);
        assert.equal(service.set.callCount, 2);
        assert.deepEqual(service.set.lastCall.args[1], { foo: 'bar' });
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
        var stubUpdateSubordinates = sinon.stub();
        ecs.get('db').services.getServiceByName = function() {
          return {
            updateSubordinateUnits: stubUpdateSubordinates
          };
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
        assert.equal(stubUpdateSubordinates.calledOnce, true);
      });
    });

    describe('_lazyRemoveRelation', function() {
      it('can remove a ghost relation from the changeset', function() {
        const db = ecs.get('db');
        const origRelations = db.relations;
        db.relations = {
          compareRelationEndpoints: sinon.stub().returns(true),
          getRelationFromEndpoints: sinon.stub(),
          remove: sinon.stub(),
        };
        this._cleanups.push(() => {
          db.relations = origRelations;
        });
        const arg1 = ['svc1', 'endpoints1'];
        const arg2 = ['svc2', 'endpoints2'];
        const updateSubordinateUnits = sinon.stub();
        db.services.getServiceByName = name => {
          const subordinate = name === 'svc2';
          const service = {
            get: sinon.stub().withArgs('subordinate').returns(subordinate)
          };
          if (subordinate) {
            service.updateSubordinateUnits = updateSubordinateUnits;
          }
          return service;
        };
        ecs.changeSet['addRelation-982'] = {
          command: {args: ['arg1', 'arg2'], method: '_add_relation'}
        };
        const record = ecs._lazyRemoveRelation([arg1, arg2]);
        const compare = ecs.get('db').relations.compareRelationEndpoints;
        const remove = ecs.get('db').relations.remove;
        const getRelation = ecs.get('db').relations.getRelationFromEndpoints;
        const compareArgs = compare.lastCall.args;
        assert.equal(compare.calledOnce, true);
        assert.deepEqual(compareArgs[0], ['arg1', 'arg2']);
        assert.deepEqual(compareArgs[1], [arg1, arg2]);
        assert.strictEqual(record, undefined);
        assert.strictEqual(ecs.changeSet['addRelation-982'], undefined);
        assert.deepEqual(getRelation.lastCall.args[0], [arg1, arg2]);
        assert.strictEqual(remove.calledOnce, true);
        assert.strictEqual(updateSubordinateUnits.calledOnce, true);
      });

      it('can add a remove relation record into the changeset', function() {
        var setStub = sinon.stub();
        var db = ecs.get('db');
        db.relations = {
          getRelationFromEndpoints: sinon.stub().returns({
            set: setStub
          })
        };
        var record = ecs._lazyRemoveRelation(['args1', 'args2']);
        assert.equal(record.split('-')[0], 'removeRelation');
        var ecsRecord = ecs.changeSet[record];
        assert.strictEqual(ecsRecord.executed, false);
        assert.equal(ecsRecord.id, record);
        assert.deepEqual(ecsRecord.parents, []);
        // We just need to make that the timestamp is not undefined.
        assert.equal(typeof ecsRecord.timestamp, 'number');
        assert.equal(ecsRecord.command.args.length, 3);
        assert.equal(ecsRecord.command.args[0], 'args1');
        assert.equal(ecsRecord.command.args[1], 'args2');
        assert.equal(typeof ecsRecord.command.args[2], 'function');
        assert.equal(ecsRecord.command.method, '_remove_relation');
        assert.deepEqual(
            db.relations.getRelationFromEndpoints.lastCall.args[0],
            ['args1', 'args2']);
        assert.equal(setStub.calledOnce, true);
        assert.deepEqual(setStub.lastCall.args, ['deleted', true]);
      });
    });

    describe('_lazyRemoveUnit', function() {
      it('can remove a ghost unit from the changeset', function() {
        ecs.get('db').removeUnits = sinon.stub();
        ecs.get('db').units = {
          getById: function() {
            return {
              service: 'foo'
            };
          }
        };
        var stubUpdateSubordinates = sinon.stub();
        ecs.get('db').services.getServiceByName = function() {
          return {
            updateSubordinateUnits: stubUpdateSubordinates
          };
        };
        ecs.changeSet['addUnit-982'] = {
          command: {
            args: ['arg1'],
            method: '_add_unit' ,
            options: {modelId: 'arg1'}}};
        var record = ecs._lazyRemoveUnit([['arg1']]);
        var remove = ecs.get('db').removeUnits;
        assert.strictEqual(record, undefined);
        assert.strictEqual(ecs.changeSet['addUnit-982'], undefined);
        assert.equal(remove.calledOnce, true);
        assert.equal(stubUpdateSubordinates.calledOnce, true);
      });

      it('can add a remove unit record into the changeset', function() {
        var unitObj = {};
        ecs.get('db').units = {
          getById: function(arg) {
            assert.equal(arg.substr(0, 4), 'args');
            return unitObj;
          },
          revive: function() {
            return {
              set: function () {
                unitObj.deleted = true;
              }
            };
          },
          free: sinon.stub()
        };
        var record = ecs._lazyRemoveUnit([['args1', 'args2']]);
        assert.equal(record.split('-')[0], 'removeUnit');
        var ecsRecord = ecs.changeSet[record];
        assert.strictEqual(ecsRecord.executed, false);
        assert.equal(ecsRecord.id, record);
        assert.deepEqual(ecsRecord.parents, []);
        // We just need to make that the timestamp is not undefined.
        assert.equal(typeof ecsRecord.timestamp, 'number');
        assert.equal(ecsRecord.command.args.length, 2);
        assert.deepEqual(ecsRecord.command.args[0], ['args1', 'args2']);
        assert.equal(typeof ecsRecord.command.args[1], 'function');
        assert.equal(ecsRecord.command.method, '_remove_units');
        assert.equal(unitObj.deleted, true);
      });
    });

    describe('lazyExpose', function() {
      it('can add an expose record into the changeset', function() {
        var stubSet = sinon.stub();
        ecs.get('db').services = {
          getById: function() {
            return { set: stubSet };
          }
        };
        var record = ecs.lazyExpose(['service']);
        assert.equal(record.split('-')[0], 'expose');
        var ecsRecord = ecs.changeSet[record];
        assert.strictEqual(ecsRecord.executed, false);
        assert.equal(ecsRecord.id, record);
        assert.deepEqual(ecsRecord.parents, []);
        // We just need to make that the timestamp is not undefined.
        assert.equal(typeof ecsRecord.timestamp, 'number');
        assert.equal(ecsRecord.command.args.length, 2);
        assert.equal(ecsRecord.command.args[0], 'service');
        assert.equal(typeof ecsRecord.command.args[1], 'function');
        assert.equal(ecsRecord.command.method, '_expose');
        assert.deepEqual(stubSet.lastCall.args, ['exposed', true]);
      });
    });

    describe('lazyUnexpose', function() {
      it('can add an unexpose record into the changeset', function() {
        var stubSet = sinon.stub();
        ecs.get('db').services = {
          getById: function() {
            return { set: stubSet };
          }
        };
        var record = ecs.lazyUnexpose(['service']);
        assert.equal(record.split('-')[0], 'unexpose');
        var ecsRecord = ecs.changeSet[record];
        assert.strictEqual(ecsRecord.executed, false);
        assert.equal(ecsRecord.id, record);
        assert.deepEqual(ecsRecord.parents, []);
        // We just need to make that the timestamp is not undefined.
        assert.equal(typeof ecsRecord.timestamp, 'number');
        assert.equal(ecsRecord.command.args.length, 2);
        assert.equal(ecsRecord.command.args[0], 'service');
        assert.equal(typeof ecsRecord.command.args[1], 'function');
        assert.equal(ecsRecord.command.method, '_unexpose');
        assert.deepEqual(stubSet.lastCall.args, ['exposed', false]);
      });

      it('can remove an existing expose record', function() {
        var stubSet = sinon.stub();
        ecs.get('db').services = {
          getById: function() {
            return { set: stubSet };
          }
        };
        ecs.changeSet = {
          'expose-123': {
            command: {
              args: ['service'],
              method: '_expose'
            }
          }
        };
        var stubRemove = testUtils.makeStubMethod(ecs, '_removeExistingRecord');
        ecs.lazyUnexpose(['service']);
        assert.deepEqual(stubSet.lastCall.args, ['exposed', false]);
        assert.equal(stubRemove.calledOnce, true);
        assert.deepEqual(stubRemove.lastCall.args, ['expose-123']);
      });
    });
  });

  describe('public ENV methods', function() {
    describe('addCharm', function() {
      it('can immediately add a charm via the env', function() {
        var lazyAddCharm = testUtils.makeStubMethod(ecs, '_lazyAddCharm');
        this._cleanups.push(lazyAddCharm.reset);
        var callback = sinon.stub();
        var args = [1, 2, callback, { immediate: true}];
        envObj.addCharm.apply(envObj, args);
        assert.equal(envObj._addCharm.calledOnce, true);
        var addCharmArgs = envObj._addCharm.lastCall.args;
        // Remove the final options element, which should not be an argument to
        // env.addCharm
        assert.deepEqual(addCharmArgs, Array.prototype.slice.call(args, 0, -1));
        // make sure that we don't add it to the changeSet.
        assert.equal(lazyAddCharm.callCount, 0);
      });

      it('can add a `addCharm` command to the changeSet', function() {
        var lazyAddCharm = testUtils.makeStubMethod(ecs, '_lazyAddCharm');
        this._cleanups.push(lazyAddCharm. reset);
        var callback = sinon.stub();
        var args = [1, 2, callback];
        envObj.addCharm.apply(envObj, args);
        var lazyAddCharmArgs = lazyAddCharm.lastCall.args[0];
        // Assert within a loop, as Arguments do not deeply equal arrays.
        args.forEach(function(arg, i) {
          assert.equal(lazyAddCharmArgs[i], arg);
        });
        assert.equal(lazyAddCharm.calledOnce, true);
        // make sure we don't call the env deploy method.
        assert.equal(envObj._addCharm.callCount, 0);
      });
    });

    describe('deploy', function() {
      it('can immediately deploy a charm via the env', function() {
        const lazyDeploy = testUtils.makeStubMethod(ecs, '_lazyDeploy');
        this._cleanups.push(lazyDeploy.reset);
        const callback = sinon.stub();
        const args = {charmURL: 'cs:haproxy-42', applicationName: 'haproxy'};
        envObj.deploy.apply(envObj, [args, callback, {immediate: true}]);
        assert.equal(envObj._deploy.calledOnce, true);
        const deployArgs = envObj._deploy.lastCall.args;
        assert.deepEqual(deployArgs, [args, callback]);
        // Make sure that we don't add it to the changeSet.
        assert.equal(lazyDeploy.callCount, 0);
      });

      it('can add a `deploy` command to the changeSet', function() {
        var lazyDeploy = testUtils.makeStubMethod(ecs, '_lazyDeploy');
        this._cleanups.push(lazyDeploy.reset);
        var callback = sinon.stub();
        var args = [1, 2, 3, 4, 5, 6, 7, callback];
        envObj.deploy.apply(envObj, args);
        var lazyDeployArgs = lazyDeploy.lastCall.args[0];
        // Assert within a loop, as Arguments do not deeply equal arrays.
        args.forEach(function(arg, i) {
          assert.equal(lazyDeployArgs[i], arg);
        });
        assert.equal(lazyDeploy.calledOnce, true);
        // make sure we don't call the env deploy method.
        assert.equal(envObj._deploy.callCount, 0);
      });
    });

    describe('setConfig', function() {
      it('can immediately set config to a deployed service', function() {
        var lazySetConfig = testUtils.makeStubMethod(ecs, '_lazySetConfig');
        this._cleanups.push(lazySetConfig.reset);
        var callback = sinon.stub();
        var args = ['service', {key: 'value'}, callback, { immediate: true}];
        envObj.set_config.apply(envObj, args);
        assert.equal(envObj._set_config.calledOnce, true);
        var setConfigArgs = envObj._set_config.lastCall.args;
        // Remove the options param off of the end and compare to that. as it
        // should be removed before env.deploy is called.
        assert.deepEqual(
            setConfigArgs, Array.prototype.slice.call(args, 0, -1));
        // make sure that we don't add it to the changeSet.
        assert.equal(lazySetConfig.callCount, 0);
      });

      it('throws if immediately setting config to queued app', function() {
        var lazySetConfig = testUtils.makeStubMethod(ecs, '_lazySetConfig');
        this._cleanups.push(lazySetConfig.reset);
        var callback = sinon.stub();
        ecs.changeSet.foo = {};
        assert.throws(
            // this is using bind instead of apply because of how the
            // assert.throws assertion operates.
            envObj.set_config.bind(
                envObj, 'foo', {}, callback, { immediate: true}),
            'You cannot immediately set config on a queued application');
        assert.equal(envObj._set_config.callCount, 0);
        // make sure that we don't add it to the changeSet.
        assert.equal(lazySetConfig.callCount, 0);
      });

      it('can add a `set_config` command to the changeSet', function() {
        var lazySetConfig = testUtils.makeStubMethod(ecs, '_lazySetConfig');
        this._cleanups.push(lazySetConfig.reset);
        var callback = sinon.stub();
        var args = [1, 2, 3, 4, callback];
        envObj.set_config.apply(envObj, args);
        assert.deepEqual(lazySetConfig.lastCall.args[0], args);
        assert.equal(lazySetConfig.calledOnce, true);
        // Make sure we don't call the env set_config method
        assert.equal(envObj._set_config.callCount, 0);
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
        var callback = sinon.stub();
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
        var callback = sinon.stub();
        var args = [1, 2, callback, {immediate: true}];
        envObj.add_relation.apply(envObj, args);
        assert.equal(lazyAddRelation.calledOnce, false);
        assert.equal(envObj._add_relation.callCount, 1);
        // Get rid of the options, which will not be passed to add_relation.
        args.pop();
        assert.deepEqual(envObj._add_relation.lastCall.args, args);
      });
      it('can add a `add_relation` command to the changeSet', function() {
        var lazyAddRelation = testUtils.makeStubMethod(ecs, '_lazyAddRelation');
        this._cleanups.push(lazyAddRelation.reset);
        var callback = sinon.stub();
        var args = [1, 2, callback];
        envObj.add_relation.apply(envObj, args);
        assert.deepEqual(lazyAddRelation.lastCall.args[0], args);
        assert.equal(lazyAddRelation.calledOnce, true);
        assert.equal(envObj._add_relation.callCount, 0);
      });
    });

    describe('placeUnit', function() {
      var machineId, mockSet, mockValidateUnitPlacement, unit;

      beforeEach(function() {
        machineId = '0';
        // Set up a mock db object.
        mockSet = sinon.stub();
        ecs.set('db', {
          units: {
            free: sinon.stub(),
            revive: sinon.stub().returns({set: mockSet})
          },
          machines: {
            getById: sinon.stub().returns({
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
              args: [[{series: 'trusty'}]],
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
              args: [[{series: 'trusty'}]],
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
        assert.equal(db.units.revive.calledOnce, true);
        assert.equal(mockSet.calledOnce, true);
        var setArgs = mockSet.lastCall.args;
        assert.deepEqual(setArgs, ['machine', machineId]);
        assert.equal(db.units.free.calledOnce, true);
      });

      it('validates unit placement', function() {
        var err = ecs.placeUnit(unit, machineId);
        assert.isNull(err);
        assert.strictEqual(mockValidateUnitPlacement.calledOnce, true);
        var args = mockValidateUnitPlacement.lastCall.args;
        assert.deepEqual(args, [{ id: 'django/42' }, '0', ecs.get('db')]);
      });

      it('does not apply changes if unit placement is not valid', function() {
        var addStub = sinon.stub();
        ecs.get('db').notifications = {add: addStub};
        mockValidateUnitPlacement = testUtils.makeStubMethod(
            ecs, 'validateUnitPlacement', 'bad wolf');
        this._cleanups.push(mockValidateUnitPlacement.reset);
        var err = ecs.placeUnit(unit, machineId);
        assert.strictEqual(err, 'bad wolf');
        // A notification should have been added.
        assert.equal(addStub.callCount, 1);
        // No parents have been added to the changeset record.
        assert.strictEqual(ecs.changeSet.a.parents.length, 0);
        // The machine id has not been set on the unit.
        assert.strictEqual(mockSet.called, false);
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
    var db, machines, unit, units;

    beforeEach(function() {
      // Set up a unit used for tests and the ecs database.
      unit = {id: 'django/0', charmUrl: 'cs:utopic/django-42'};
      units = new Y.juju.models.ServiceUnitList();
      machines = new Y.juju.models.MachineList();
      const services = new Y.juju.models.ServiceList();
      services.add({
        name: 'django',
        series: 'utopic'
      });
      services.add({
        name: 'wordpress',
        series: 'trusty'
      });
      machines.add({
        id: '0',
        series: 'utopic'
      });
      db = {
        units: units,
        machines: machines,
        services: services
      };
      ecs.set('db', db);
    });

    afterEach(function() {
      units.destroy();
    });

    it('passes the validation on an existing machine', function() {
      var err = ecs.validateUnitPlacement(unit, '0', db);
      assert.isNull(err);
    });

    it('checks the series of an existing machine', function() {
      machines.getById('0').series = 'trusty';
      var err = ecs.validateUnitPlacement(unit, '0', db);
      assert.strictEqual(
          err, 'unable to place a utopic unit on the trusty machine 0');
    });

    it('checks the series of a machine with existing units', function() {
      // This is a ghost mchine.
      machines.getById('0').series = undefined;
      units.add({
        id: 'wordpress/1',
        charmUrl: 'cs:trusty/wordpress-0',
        machine: '0'
      });
      var err = ecs.validateUnitPlacement(unit, '0', db);
      assert.strictEqual(
          err,
          'machine 0 already includes units with a different series: trusty');
    });

  });

});
