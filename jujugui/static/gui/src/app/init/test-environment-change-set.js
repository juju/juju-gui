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

const ECS = require('./environment-change-set');
const testUtils = require('./testing-utils');
const User = require('../user/user');
const utils = require('./utils');

describe('Environment Change Set', function() {
  var Y, ecs, envObj, dbObj, models, _cleanups;

  beforeAll(function(done) {
    Y = YUI(GlobalConfig).use([], function(Y) {
      window.yui = Y;
      require('../yui-modules');
      window.yui.use(window.MODULES, function() {
        models = window.yui.namespace('juju.models');
        done();
      });
    });
  });

  beforeEach(function() {
    _cleanups = [];
    const getMockStorage = function() {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store['name'] = val; },
          getItem: function(name) { return this.store['name'] || null; }
        };
      };
    };
    const userClass = new User({sessionStorage: getMockStorage()});
    userClass.controller = {user: 'user', password: 'password'};
    dbObj = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
    dbObj.fireEvent = sinon.stub();
    ecs = new ECS({
      db: dbObj
    });
    envObj = new Y.juju.environments.GoEnvironment({
      connection: new testUtils.SocketStub(),
      user: userClass,
      ecs: ecs
    });
    sinon.stub(envObj, '_addCharm');
    sinon.stub(envObj, '_deploy');
    sinon.stub(envObj, '_set_config');
    sinon.stub(envObj, '_add_relation');
    sinon.stub(envObj, '_addMachines');
  });

  afterEach(function() {
    _cleanups.forEach(cleanup => cleanup && cleanup());
    dbObj.reset();
    dbObj.destroy();
    envObj.destroy();
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

    describe('_createNewRecord', function() {
      it('always creates a unique key for new records', function() {
        var result = [];
        var wrapCallback = sinon.stub(ecs, '_wrapCallback');
        _cleanups.push(wrapCallback.restore);
        for (var i = 0; i < 999; i += 1) {
          result.push(ecs._createNewRecord('service'));
        }
        var dedupe = utils.arrayDedupe(result);
        // If there were any duplicates then these would be different.
        assert.equal(dedupe.length, result.length);
      });

      it('creates a new record of the specified type', function() {
        var command = { foo: 'foo' };
        var wrapCallback = sinon.stub(
          ecs, '_wrapCallback').returns(command);
        _cleanups.push(wrapCallback.restore);
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
        var wrapCallback = sinon.stub(
          ecs, '_wrapCallback').returns(command);
        _cleanups.push(wrapCallback.restore);
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
        const changeSetModifiedListener = sinon.stub();
        document.addEventListener(
          'ecs.changeSetModified', changeSetModifiedListener);
        ecs.changeSet.abc123 = 'foo';
        ecs._removeExistingRecord('abc123');
        assert.equal(changeSetModifiedListener.calledOnce, true);
        document.removeEventListener(
          'ecs.changeSetModified', changeSetModifiedListener);
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
        const changeSetModifiedListener = sinon.stub();
        document.addEventListener(
          'ecs.changeSetModified', changeSetModifiedListener);
        const taskCompleteListener = sinon.stub();
        document.addEventListener(
          'ecs.taskComplete', taskCompleteListener);
        var result = record.command.args[3]();
        assert.equal(result, 'real cb');
        assert.equal(changeSetModifiedListener.calledOnce, true);
        assert.equal(taskCompleteListener.calledOnce, true);
        assert.equal(taskCompleteListener.args[0][0].detail.id, 'service-123');
        assert.equal(taskCompleteListener.args[0][0].detail.record, record);
        assert.equal(record.executed, true);
        document.removeEventListener(
          'ecs.changeSetModified', changeSetModifiedListener);
        document.removeEventListener(
          'ecs.taskComplete', taskCompleteListener);
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
        ecs.db = db;
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
        assert.deepEqual(args, [db, ecs]);
      });
    });

    describe('_buildHierarchy', function() {
      var filterStub, db;

      beforeEach(function() {
        db = ecs.db;
        filterStub = sinon.stub();
        db.units.filterByMachine = filterStub;
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

        filterStub.returns([{id: '75930989$/0'}]);
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
        var db = ecs.db;
        db.units.filterByMachine = sinon.stub();
      });

      it('loops through the changeSet calling execute on them', function() {
        var execute = sinon.stub(ecs, '_execute');
        _cleanups.push(execute.restore);
        const commitListener = sinon.stub();
        document.addEventListener('ecs.commit', commitListener);
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
        assert.equal(commitListener.callCount, 1);
        assert.equal(
          commitListener.args[0][0].detail, changeSet['service-568']);
        document.removeEventListener('ecs.commit', commitListener);
      });

      it('commits one index at a time', function() {
        var execute = sinon.stub(ecs, '_execute');
        _cleanups.push(execute.restore);
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

      it('keeps track of committing status', function() {
        // Stub enough to pause committing between records.
        let execute = sinon.stub(ecs, '_execute');
        _cleanups.push(execute.restore);
        let changeSet = {
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
        assert.isFalse(ecs.isCommitting());
        ecs.commit();
        assert.isTrue(ecs.isCommitting());
      });

      it('passes the commit index through an event', function() {
        const currentCommitFinishedListener = sinon.stub();
        document.addEventListener(
          'ecs.currentCommitFinished', currentCommitFinishedListener);
        ecs.levelRecordCount = 0;
        ecs._waitOnLevel(null, 0);
        assert.equal(currentCommitFinishedListener.callCount, 1);
        assert.deepEqual(
          currentCommitFinishedListener.args[0][0].detail, {index: 0});
        document.removeEventListener(
          'ecs.currentCommitFinished', currentCommitFinishedListener);
      });
    });
  });

  describe('clear', function() {
    beforeEach(function() {
      var db = ecs.db;
      db.units.filterByMachine = sinon.stub();
    });

    it('clears the change set', function() {
      var stubClearDB = sinon.stub(ecs, '_clearFromDB');
      _cleanups.push(stubClearDB.restore);
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
      var stubClearDB = sinon.stub(ecs, '_clearFromDB');
      _cleanups.push(stubClearDB.restore);
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
      var db = ecs.db;
      var stubRemove = sinon.stub();
      db.services.remove = stubRemove;
      db.services.getById = sinon.stub();
      ecs._clearFromDB({method: '_deploy', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Service not removed');
    });

    it('undeletes deleted services', function() {
      var db = ecs.db;
      var stubSet = sinon.stub();
      db.services.getById = sinon.stub().returns({set: stubSet});
      ecs._clearFromDB({method: '_destroyApplication', args: [1]});
      assert.deepEqual(stubSet.lastCall.args, ['deleted', false]);
    });

    it('undeletes deleted machines', function() {
      var db = ecs.db;
      var attrs = {deleted: true};
      var machine = {
        deleted: true
      };
      var unit = {
        deleted: true
      };
      db.machines.getById = sinon.stub().returns(attrs);
      db.machines.filterByAncestor = sinon.stub().returns([machine]);
      db.units.filterByMachine = sinon.stub().returns([unit]);
      ecs._clearFromDB({method: '_destroyMachines', args: [1]});
      assert.deepEqual(attrs, {deleted: false});
      assert.equal(machine.deleted, false);
      assert.equal(unit.deleted, false);
    });

    it('backs out config changes', function() {
      var db = ecs.db;
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
      db.services.getById = sinon.stub().returns({
        get: getStub,
        set: setStub
      });
      ecs._clearFromDB({method: '_set_config', args: [1]});
      assert.deepEqual(setStub.lastCall.args[1], {
        foo: 'baz',
        bax: undefined
      });
    });

    it('clears added relations', function() {
      var db = ecs.db;
      var stubRemove = sinon.stub();
      db.relations.remove = stubRemove;
      db.relations.getById = sinon.stub();
      ecs._clearFromDB({method: '_add_relation', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Relation not removed');
    });

    it('undeletes deleted relations', function() {
      var db = ecs.db;
      var stubSet = sinon.stub();
      db.relations.getRelationFromEndpoints = sinon.stub().returns({
        set: stubSet
      });
      ecs._clearFromDB({method: '_remove_relation', args: [1, 2]});
      assert.deepEqual(stubSet.lastCall.args, ['deleted', false]);
    });

    it('undeletes deleted units', function() {
      var db = ecs.db;
      var attrs = {deleted: true};
      db.units.getById = sinon.stub().returns(attrs);
      ecs._clearFromDB({method: '_remove_units', args: [[1]]});
      assert.deepEqual(attrs, {deleted: false});
    });

    it('unexposes exposed services', function() {
      var db = ecs.db;
      var stubSet = sinon.stub();
      db.services.getById = sinon.stub().returns({set: stubSet});
      ecs._clearFromDB({method: '_expose', args: [1]});
      assert.deepEqual(stubSet.lastCall.args, ['exposed', false]);
    });

    it('exposes unexposed services', function() {
      var db = ecs.db;
      var stubSet = sinon.stub();
      db.services.getById = sinon.stub().returns({set: stubSet});
      ecs._clearFromDB({method: '_unexpose', args: [1]});
      assert.deepEqual(stubSet.lastCall.args, ['exposed', true]);
    });

    it('clears added machines', function() {
      var db = ecs.db;
      var stubRemove = sinon.stub();
      db.machines.remove = stubRemove;
      db.machines.getById = sinon.stub();
      ecs._clearFromDB({method: '_addMachines', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Machine not removed');
    });

    it('clears added units', function() {
      var db = ecs.db;
      var stubRemove = sinon.stub();
      db.removeUnits = stubRemove;
      db.units.getById = sinon.stub();
      db.units.reset = sinon.stub();
      ecs._clearFromDB({method: '_add_unit', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Unit not removed');
    });
  });

});
