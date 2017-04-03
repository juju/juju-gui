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
    const getMockStorage = function() {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store['name'] = val; },
          getItem: function(name) { return this.store['name'] || null; }
        };
      };
    };
    const userClass = new window.jujugui.User({storage: getMockStorage()});
    userClass.controller = {user: 'user', password: 'password'};
    dbObj = new models.Database();
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

    describe('_createNewRecord', function() {
      it('always creates a unique key for new records', function() {
        var result = [];
        var wrapCallback = sinon.stub(ecs, '_wrapCallback');
        this._cleanups.push(wrapCallback.restore);
        for (var i = 0; i < 999; i += 1) {
          result.push(ecs._createNewRecord('service'));
        }
        var dedupe = Y.Array.dedupe(result);
        // If there were any duplicates then these would be different.
        assert.equal(dedupe.length, result.length);
      });

      it('creates a new record of the specified type', function() {
        var command = { foo: 'foo' };
        var wrapCallback = sinon.stub(
            ecs, '_wrapCallback').returns(command);
        this._cleanups.push(wrapCallback.restore);
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
        this._cleanups.push(wrapCallback.restore);
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
        var fire = sinon.stub(ecs, 'fire');
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
        var fire = sinon.stub(ecs, 'fire');
        this._cleanups.push(fire.restore);
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
        filterStub = sinon.stub();
        db.units = {
          filterByMachine: filterStub
        };
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
        var db = ecs.get('db');
        db.units = {
          filterByMachine: sinon.stub()
        };
      });

      it('loops through the changeSet calling execute on them', function() {
        var execute = sinon.stub(ecs, '_execute');
        this._cleanups.push(execute.restore);
        var fire = sinon.stub(ecs, 'fire');
        this._cleanups.push(fire.restore);
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
        var execute = sinon.stub(ecs, '_execute');
        this._cleanups.push(execute.restore);
        var fire = sinon.stub(ecs, 'fire');
        this._cleanups.push(fire.restore);
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
        var fire = sinon.stub(ecs, 'fire');
        this._cleanups.push(fire.restore);
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
      db.units = {
        filterByMachine: sinon.stub()
      };
    });

    it('clears the change set', function() {
      var stubClearDB = sinon.stub(ecs, '_clearFromDB');
      this._cleanups.push(stubClearDB.restore);
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
      this._cleanups.push(stubClearDB.restore);
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
      var stubRemove = sinon.stub();
      db.services = {
        remove: stubRemove,
        getById: sinon.stub()
      };
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
      var stubRemove = sinon.stub();
      db.relations = {
        remove: stubRemove,
        getById: sinon.stub()
      };
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
      var stubRemove = sinon.stub();
      db.machines = {
        remove: stubRemove,
        getById: sinon.stub()
      };
      ecs._clearFromDB({method: '_addMachines', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Machine not removed');
    });

    it('clears added units', function() {
      var db = ecs.get('db');
      var stubRemove = sinon.stub();
      db.removeUnits = stubRemove;
      db.units = {
        getById: sinon.stub(),
        reset: sinon.stub()
      };
      ecs._clearFromDB({method: '_add_unit', options: {modelId: 1}});
      assert.equal(stubRemove.calledOnce, true, 'Unit not removed');
    });
  });

  describe('lazy methods', function() {
    describe('lazyAddCharm', function() {
      it('adds a new `add Charm` record', function(done) {
        const args = ['id', 'cookies are better', done];
        const options = {applicationId: 'foo'};
        const key = ecs.lazyAddCharm(args, options);
        const record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_addCharm');
        // Remove the functions, which will not be equal.
        const cb = record.command.args.pop();
        args.pop();
        assert.deepEqual(record.command.args, args);
        assert.deepEqual(record.command.options, options);
        cb(); // Will call done().
      });

      it('only adds one `add Charm` record for duplicates', function() {
        ecs.lazyAddCharm(
          ['cs:wordpress', 'cookies', null, {applicationId: 'foo'}]);
        assert.equal(Object.keys(ecs.changeSet).length, 1);
        ecs.lazyAddCharm(
          ['cs:wordpress', 'cookies', null, {applicationId: 'foo'}]);
        assert.equal(Object.keys(ecs.changeSet).length, 1);
        ecs.lazyAddCharm(
          ['cs:mysql', 'cookies', null, {applicationId: 'foo'}]);
        assert.equal(Object.keys(ecs.changeSet).length, 2);
      });
    });

    describe('lazyAddPendingResources', () => {
      it('creates a new addPendingResources record', () => {
        const args = {
          applicationName: 'django',
          charmURL: 'cs:precise/django-42',
          channel: 'stable',
          resources: {a: 'resource'}
        };
        const key = ecs.lazyAddPendingResources([args, null], {});
        const record = ecs.changeSet[key];
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_addPendingResources');
        // Remove the functions, which will not be equal.
        record.command.args.pop();
        assert.deepEqual(record.command.args, [args]);
      });
    });

    describe('lazyDeploy', function() {
      it('creates a new `deploy` record', function(done) {
        const args = {
          charmURL: 'cs:precise/django-42',
          applicationName: 'django',
        };
        const options = {modelId: 'baz'};
        const key = ecs.lazyDeploy([args, done], options);
        const record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_deploy');
        // Remove the functions, which will not be equal.
        const cb = record.command.args.pop();
        // Also remove the options object.
        assert.deepEqual(record.command.args, [args]);
        assert.deepEqual(record.command.options, options);
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
        const key = ecs.lazyDeploy([args, callback], options);
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
        const key = ecs.lazyDeploy([args, callback], options);
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
        const key = ecs.lazyDeploy([args, callback], options);
        const command = ecs.changeSet[key].command;
        // Add the ghost service to the db.
        const services = new Y.juju.models.ServiceList();
        services.add({id: 'new1'});
        // Execute the command preparation.
        command.prepare({services: services});
        // Ensure that the undefined key is not still in the config param.
        assert.deepEqual(Object.keys(command.args[0].config), ['key1']);
      });

      it('adds the correct addCharm and addPendingResources parents', () => {
        ecs.lazyAddCharm([
          'cs:precise/django-42', 'cookies', null], {applicationId: 'django'});
        ecs.lazyAddPendingResources([{
          applicationName: 'django',
          charmURL: 'cs:precise/django-42',
          channel: 'stable',
          resources: {a: 'resource'}
        }, null], {});
        const key = ecs.lazyDeploy([{
          charmURL: 'cs:precise/django-42',
          applicationName: 'django',
        }, null], {});
        const record = ecs.changeSet[key];
        assert.equal(record.parents.length, 2);
        const parentKeys = {
          addCharm: false,
          addPendingResources: false
        };
        record.parents.forEach(
          parent => parentKeys[parent.split('-')[0]] = true);
        assert.deepEqual(parentKeys, {
          addCharm: true,
          addPendingResources: true
        });
      });

    });

    describe('lazyDestroyApplication', function() {
      it('creates a new destroy record', function(done) {
        const args = ['foo', done];
        const options = {modelId: 'baz'};
        const setStub = sinon.stub();
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
        const key = ecs.lazyDestroyApplication(args, options);
        const record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_destroyApplication');
        assert.equal(setStub.calledOnce, true);
        assert.equal(setStub.lastCall.args[0], 'deleted');
        assert.equal(setStub.lastCall.args[1], true);
        // Remove the functions, which will not be equal.
        const cb = record.command.args.pop();
        args.pop();
        assert.deepEqual(record.command.args, args);
        assert.deepEqual(record.command.options,options);
        cb(); // Will call done().
      });

      it('destroys create records for undeployed services', function() {
        var stubRemove = sinon.stub();
        var stubDestroy = sinon.stub();
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
        db.relations = {
          remove: sinon.stub()
        };
        var stubRemoveUnits = sinon.stub(db, 'removeUnits');
        this._cleanups.push(stubRemoveUnits.restore);

        ecs.lazyDeploy([{charmURL: 'wp'}, function() {}], {modelId: 'baz'});
        ecs.lazyDestroyApplication(['baz']);
        assert.equal(stubRemove.calledOnce, true, 'remove not called');
        assert.equal(stubDestroy.calledOnce, true, 'destroy not called');
        assert.equal(
            stubRemoveUnits.calledOnce, true, 'remove units not called');
        assert.equal(db.relations.remove.calledOnce, true,
            'remove relations not called');
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
              set: sinon.stub()
            };
          },
        };
        db.relations = {
          remove: sinon.stub()
        };
        ecs.lazyAddCharm(
          ['cs:wordpress', 'cookies', null], {applicationId: 'foo'});
        ecs.lazyDeploy(
          [{charmURL: 'cs:wordpress'}, function() {}], {modelId: 'baz'});
        ecs.lazyDeploy(
          [{charmURL: 'cs:wordpress'}, function() {}], {modelId: 'baz2'});
        assert.equal(Object.keys(ecs.changeSet).length, 3);
        ecs.lazyDestroyApplication(['baz']);
        assert.equal(Object.keys(ecs.changeSet).length, 2);
        ecs.lazyDestroyApplication(['baz2']);
        assert.equal(Object.keys(ecs.changeSet).length, 0);
      });

      it('destroys unplaced units when the service is removed', function(done) {
        const args = ['foo', done];
        const options = {modelId: 'baz'};
        const units = new Y.juju.models.ServiceUnitList();
        const unitIds = ['test/1', 'test/2'];
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
        const removeStub = sinon.stub(ecs, 'lazyRemoveUnit');
        this._cleanups.push(removeStub.restore);
        ecs.lazyDestroyApplication(args, options);
        assert.equal(removeStub.calledOnce, true);
        assert.deepEqual(removeStub.lastCall.args[0], [unitIds, null]);
        done();
      });
    });

    describe('lazyDestroyMachines', function() {
      it('creates a new destroy record', function(done) {
        const args = [['0/lxc/0'], false, done];
        const machineObj = { units: [] };
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
        const key = ecs.lazyDestroyMachines(args, {});
        const record = ecs.changeSet[key];
        assert.isObject(record);
        assert.isObject(record.command);
        assert.equal(record.executed, false);
        assert.equal(record.command.method, '_destroyMachines');
        assert.equal(machineObj.deleted, true);
        // Remove the functions, which will not be equal.
        const cb = record.command.args.pop();
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
        ecs.lazyDestroyMachines([['baz'], function() {}]);
        assert.equal(stubRemove.calledOnce, true, 'remove not called');
        assert.deepEqual(ecs.changeSet, {});
      });

      it('removes records for queued uncommitted machines', function() {
        var stubDestroy = sinon.stub(
            ecs, '_destroyQueuedMachine');
        this._cleanups.push(stubDestroy.restore);
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
        ecs.lazyDestroyMachines([['baz'], function() {}]);
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
        ecs.lazyDestroyMachines([['baz'], function() {}]);
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
        ecs.lazyDestroyMachines(cmdArgs);
        assert.equal(unit.deleted, true, 'unit not set as deleted');
        assert.equal(machine.deleted, true, 'machine not set as deleted');
      });
    });

    describe('lazyAddMachines', function() {
      it('creates a new `addMachines` record', function(done) {
        var translateStub = sinon.stub();
        ecs._translateKeysToIds = translateStub;
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
        var args = [[{}], null];
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

      beforeEach(function() {
        ecs.get('db').services.getServiceByName = function() {
          return {};
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
        db.units.getById = sinon.stub().returns(unit);
        sinon.stub(db, 'updateUnitId').returns({
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
      });

    });

    describe('lazySetConfig', function() {
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
        var addToRecord = sinon.stub();
        ecs._addToRecord = addToRecord;
        this._cleanups.push(addToRecord.restore);
        var args = [1, {}, 'foo', {}];
        var key = ecs.lazySetConfig(args);
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
        const args = [{charmURL: 'wp'}, function() {}];
        const options = {modelId: 'baz'};
        // This assumes that the lazyDeploy tests complete successfully.
        const key = ecs.lazyDeploy(args, options);
        const record = ecs.changeSet[key];
        assert.isObject(record);
        const setArgs = [key, {}, 2, {}];
        const setKey = ecs.lazySetConfig(setArgs);
        const setRecord = ecs.changeSet[setKey];
        assert.equal(setRecord.executed, false);
        assert.isObject(setRecord.command);
        const command = setRecord.command;
        assert.equal(command.method, '_set_config');
        assert.deepEqual(command.args, setArgs);
        // It should have called to create new records
        assert.equal(Object.keys(ecs.changeSet).length, 2);
      });

      it('concats changed fields to the service modesl', function() {
        var dirtyFields = service.get('_dirtyFields');
        dirtyFields.push('bax');
        service.set('_dirtyFields', dirtyFields);
        var args = ['mysql', { foo: 'bar' }, null, { foo: 'baz' }];
        ecs.lazySetConfig(args);
        dirtyFields = service.get('_dirtyFields');
        assert.equal(dirtyFields.length, 2);
        assert.deepEqual(dirtyFields, ['bax', 'foo']);
      });

      it('sets the changed values to the service model', function() {
        var args = ['mysql', { foo: 'bar' }, null, { foo: 'baz', bax: 'qux' }];
        service.set = sinon.stub();
        ecs.lazySetConfig(args);
        assert.equal(service.set.callCount, 2);
        assert.deepEqual(service.set.lastCall.args[1], { foo: 'bar' });
      });
    });

    describe('lazyAddRelation', function() {
      beforeEach(function() {
        var db = ecs.get('db');
        db.units = {
          filterByMachine: sinon.stub()
        };
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
        ecs.get('db').services.getServiceByName = function() {
          return {};
        };
        const args = [
          ['serviceId1$', ['db', 'client']],
          ['serviceId2$', ['db', 'server']],
          null
        ];
        const key = ecs.lazyAddRelation(args, {});
        const record = ecs.changeSet[key];
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
        assert.equal(Object.keys(ecs.changeSet).length, 3);
        // Perform this last, as it will mutate ecs.changeSet.
        assert.equal(ecs._buildHierarchy(ecs.changeSet).length, 2);
      });
    });

    describe('lazyRemoveRelation', function() {
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
        db.services.getServiceByName = name => {
          const subordinate = name === 'svc2';
          const service = {
            get: sinon.stub().withArgs('subordinate').returns(subordinate)
          };
          return service;
        };
        ecs.changeSet['addRelation-982'] = {
          command: {args: ['arg1', 'arg2'], method: '_add_relation'}
        };
        const record = ecs.lazyRemoveRelation([arg1, arg2]);
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
      });

      it('can add a remove relation record into the changeset', function() {
        const setStub = sinon.stub();
        const db = ecs.get('db');
        db.relations = {
          getRelationFromEndpoints: sinon.stub().returns({
            set: setStub
          })
        };
        const record = ecs.lazyRemoveRelation(['args1', 'args2', null], {});
        assert.equal(record.split('-')[0], 'removeRelation');
        const ecsRecord = ecs.changeSet[record];
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

    describe('lazyRemoveUnit', function() {
      it('can remove a ghost unit from the changeset', function() {
        ecs.get('db').removeUnits = sinon.stub();
        ecs.get('db').units = {
          getById: function() {
            return {
              service: 'foo'
            };
          }
        };
        ecs.get('db').services.getServiceByName = function() {
          return {};
        };
        ecs.changeSet['addUnit-982'] = {
          command: {
            args: ['arg1'],
            method: '_add_unit' ,
            options: {modelId: 'arg1'}}};
        var record = ecs.lazyRemoveUnit([['arg1']]);
        var remove = ecs.get('db').removeUnits;
        assert.strictEqual(record, undefined);
        assert.strictEqual(ecs.changeSet['addUnit-982'], undefined);
        assert.equal(remove.calledOnce, true);
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
        const record = ecs.lazyRemoveUnit([['args1', 'args2'], null], {});
        assert.equal(record.split('-')[0], 'removeUnit');
        const ecsRecord = ecs.changeSet[record];
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
        const stubSet = sinon.stub();
        ecs.get('db').services = {
          getById: function() {
            return { set: stubSet };
          }
        };
        const record = ecs.lazyExpose(['service', null], {});
        assert.equal(record.split('-')[0], 'expose');
        const ecsRecord = ecs.changeSet[record];
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
        const stubSet = sinon.stub();
        ecs.get('db').services = {
          getById: function() {
            return { set: stubSet };
          }
        };
        const record = ecs.lazyUnexpose(['service', null], {});
        assert.equal(record.split('-')[0], 'unexpose');
        const ecsRecord = ecs.changeSet[record];
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
        var stubRemove = sinon.stub(ecs, '_removeExistingRecord');
        ecs.lazyUnexpose(['service']);
        assert.deepEqual(stubSet.lastCall.args, ['exposed', false]);
        assert.equal(stubRemove.calledOnce, true);
        assert.deepEqual(stubRemove.lastCall.args, ['expose-123']);
      });
    });

    describe('lazyAddCharm', function() {
      it('can immediately add a charm via the env', function() {
        var lazyAddCharm = sinon.stub(ecs, 'lazyAddCharm');
        this._cleanups.push(lazyAddCharm.restore);
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
        var lazyAddCharm = sinon.stub(ecs, 'lazyAddCharm');
        this._cleanups.push(lazyAddCharm.restore);
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

    describe('lazyDeploy', function() {
      it('can immediately deploy a charm via the env', function() {
        const lazyDeploy = sinon.stub(ecs, 'lazyDeploy');
        this._cleanups.push(lazyDeploy.restore);
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
        const lazyDeploy = sinon.stub(ecs, 'lazyDeploy');
        this._cleanups.push(lazyDeploy.restore);
        const callback = sinon.stub();
        const args = ['args', callback];
        envObj.deploy(args, {});
        assert.equal(lazyDeploy.lastCall.args[0][0][0], 'args');
        assert.equal(lazyDeploy.calledOnce, true);
        // make sure we don't call the env deploy method.
        assert.equal(envObj._deploy.callCount, 0);
      });
    });

    describe('lazySetConfig', function() {
      it('can immediately set config to a deployed service', function() {
        var lazySetConfig = sinon.stub(ecs, 'lazySetConfig');
        this._cleanups.push(lazySetConfig.restore);
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
        var lazySetConfig = sinon.stub(ecs, 'lazySetConfig');
        this._cleanups.push(lazySetConfig.restore);
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
        const lazySetConfig = sinon.stub(ecs, 'lazySetConfig');
        this._cleanups.push(lazySetConfig.restore);
        const callback = sinon.stub();
        envObj.set_config(1, 2, callback, {});
        assert.deepEqual(lazySetConfig.lastCall.args[0], [1, 2, callback]);
        assert.equal(lazySetConfig.calledOnce, true);
        // Make sure we don't call the env set_config method
        assert.equal(envObj._set_config.callCount, 0);
      });

      it('handles heirarchical changes on queued services', function() {
        var db = ecs.get('db');
        db.services = new Y.juju.models.ServiceList();
        db.services.add({ id: 'serviceId1$' });
        db.units = {
          filterByMachine: sinon.stub()
        };
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
        var key = ecs.lazySetConfig(args);
        var record = ecs.changeSet[key];
        assert.equal(typeof record.command.onParentResults, 'function');
        assert.equal(record.executed, false);
        assert.equal(record.id, key);
        assert.deepEqual(record.parents, ['service-1']);
        assert.equal(Object.keys(ecs.changeSet).length, 2);
        // Perform this last, as it will mutate ecs.changeSet.
        assert.equal(ecs._buildHierarchy(ecs.changeSet).length, 2);
      });
    });

    describe('lazyAddRelation', function() {
      it('can immediately call `add_relation`', function() {
        var lazyAddRelation = sinon.stub(ecs, 'lazyAddRelation');
        this._cleanups.push(lazyAddRelation.restore);
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
        var lazyAddRelation = sinon.stub(ecs, 'lazyAddRelation');
        this._cleanups.push(lazyAddRelation.restore);
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
        // returns null.
        mockValidateUnitPlacement = sinon.stub(
            ecs, 'validateUnitPlacement').returns(null);
        this._cleanups.push(mockValidateUnitPlacement.restore);
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
        mockValidateUnitPlacement.returns('bad wolf');
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
