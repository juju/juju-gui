/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2015 Canonical Ltd.

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

describe('Bundle Importer', function() {
  var bundleImporter, BundleImporter, deploy, db, env, fakebackend,
      utils, yui;

  before(function(done) {
    var requires = ['bundle-importer', 'juju-tests-utils', 'juju-models',
                    'juju-env-go', 'juju-tests-factory',
                    'environment-change-set'];
    YUI().use(requires, function(Y) {
      BundleImporter = Y.juju.BundleImporter;
      utils = Y['juju-tests'].utils;
      yui = Y;
      done();
    });
  });

  beforeEach(function() {
    db = new yui.juju.models.Database();
    env = new yui.juju.environments.GoEnvironment({
      ecs: new yui.juju.EnvironmentChangeSet({
        db: db
      })
    });
    fakebackend = yui['juju-tests'].factory.makeFakeBackend();
    bundleImporter = new BundleImporter({
      env: env,
      db: db,
      fakebackend: fakebackend
    });
  });

  afterEach(function() {
    db.destroy();
    env.destroy();
    fakebackend.destroy();
  });

  it('can be instantiated', function() {
    assert.equal(bundleImporter instanceof BundleImporter, true);
    assert.equal(typeof bundleImporter.env === 'object', true);
    assert.equal(typeof bundleImporter.db === 'object', true);
    assert.equal(typeof bundleImporter.fakebackend === 'object', true);
  });

  describe('Public methods', function() {

    describe('importBundleYAML', function() {
      it('calls fetchDryRun with yaml', function() {
        var fetch = utils.makeStubMethod(bundleImporter, 'fetchDryRun');
        this._cleanups.push(fetch.reset);
        bundleImporter.importBundleYAML('foo: bar');
        assert.equal(fetch.callCount(), 1);
        var args = fetch.lastArguments();
        assert.equal(args.length, 2);
        assert.equal(args[0], 'foo: bar');
        assert.strictEqual(args[1], null);
      });
    });

    describe('importChangesToken', function() {
      it('calls fetchDryRun with token', function() {
        var fetch = utils.makeStubMethod(bundleImporter, 'fetchDryRun');
        this._cleanups.push(fetch.reset);
        bundleImporter.importChangesToken('TOKEN');
        assert.equal(fetch.callCount(), 1);
        var args = fetch.lastArguments();
        assert.equal(args.length, 2);
        assert.strictEqual(args[0], null);
        assert.equal(args[1], 'TOKEN');
      });
    });

    describe('importBundleFile', function() {

      it('sets up and loads the FileReader', function() {
        var asText = utils.makeStubFunction();
        var generate = utils.makeStubMethod(
            bundleImporter, '_generateFileReader', {
              onload: '',
              readAsText: asText
            });
        var onload = utils.makeStubMethod(bundleImporter, '_fileReaderOnload');
        this._cleanups.concat([generate.reset, onload.reset]);
        var reader = bundleImporter.importBundleFile('path/to/file');
        assert.equal(generate.callCount(), 1);
        assert.equal(asText.callCount(), 1);
        reader.onload();
        assert.equal(onload.callCount(), 1);
      });

      describe('FileReader onload callback', function() {
        var file = { name: 'path/to/file.json' };
        it('shows notification if file contains invalid json', function() {
          var notification = utils.makeStubMethod(
              bundleImporter.db.notifications, 'add');
          this._cleanups.push(notification.reset);
          bundleImporter._fileReaderOnload(file, {
            target: { result: '[invalid json]' }
          });
          assert.equal(notification.callCount(), 1);
          assert.equal(notification.lastArguments()[0].level, 'error');
        });

        it('shows notification before kicking off import', function() {
          var importStub = utils.makeStubMethod(
              bundleImporter, 'importBundleDryRun');
          var notification = utils.makeStubMethod(
              bundleImporter.db.notifications, 'add');
          this._cleanups.concat([importStub.reset, notification.reset]);
          bundleImporter._fileReaderOnload(file, {
            target: { result: '["valid", "json"]' }
          });
          assert.equal(notification.callCount(), 1);
          assert.equal(notification.lastArguments()[0].level, 'important');
          assert.equal(importStub.callCount(), 1);
        });

        it('calls fetchDryRun if yaml file', function() {
          var fetch = utils.makeStubMethod(bundleImporter, 'fetchDryRun');
          var yamlFile = { name: 'path/to/file.yaml' };
          bundleImporter._fileReaderOnload(yamlFile, {target: {result: 'foo'}});
          assert.equal(fetch.callCount(), 1);
          var args = fetch.lastArguments();
          assert.equal(args.length, 2);
          assert.equal(args[0], 'foo');
          assert.strictEqual(args[1], null);
        });
      });
    });

    describe('importBundleDryRun', function() {
      var unsortedRecords = [
        { id: '2', requires: []},
        { id: '5', requires: ['3']},
        // The order of the following records (id:6) requires is important.
        // The sorter must check that all requires are resolved before
        // adding it to the changeSet.
        { id: '6', requires: ['2', '5']},
        { id: '4', requires: ['2']},
        { id: '3', requires: []}
      ];

      var sortedRecords = [
        { id: '2', requires: []},
        { id: '4', requires: ['2']},
        { id: '3', requires: []},
        { id: '5', requires: ['3']},
        { id: '6', requires: ['2', '5']}
      ];

      it('sorts the records then calls to execute', function() {
        var execute = utils.makeStubMethod(bundleImporter, '_executeDryRun');
        this._cleanups.push(execute.reset);
        bundleImporter.importBundleDryRun(unsortedRecords);
        assert.deepEqual(bundleImporter.recordSet, sortedRecords);
        assert.equal(execute.callCount(), 1);
        assert.deepEqual(execute.lastArguments()[0], sortedRecords);
      });
    });

    describe('fetchDryRun', function() {

      it('calls to the env to get a changeset from a YAML', function() {
        var yaml = '{"services":{}}';
        var getChangeSet = utils.makeStubMethod(
            bundleImporter.env, 'getChangeSet');
        this._cleanups.push(getChangeSet.reset);
        bundleImporter.fetchDryRun(yaml, null);
        assert.equal(getChangeSet.callCount(), 1);
        var args = getChangeSet.lastArguments();
        assert.equal(args.length, 3);
        assert.equal(args[0], yaml);
        assert.strictEqual(args[1], null);
      });

      it('ensures v4 format on import', function() {
        var yaml = '{"foo":{"services":{}}}';
        var getChangeSet = utils.makeStubMethod(
            bundleImporter.env, 'getChangeSet');
        this._cleanups.push(getChangeSet.reset);
        bundleImporter.fetchDryRun(yaml, null);
        assert.equal(getChangeSet.callCount(), 1);
        var args = getChangeSet.lastArguments();
        assert.equal(args.length, 3);
        assert.equal(args[0], '{"services":{}}');
        assert.strictEqual(args[1], null);
      });

      it('calls to the env to get a changeset from a token', function() {
        var token = 'foo';
        var getChangeSet = utils.makeStubMethod(
            bundleImporter.env, 'getChangeSet');
        this._cleanups.push(getChangeSet.reset);
        bundleImporter.fetchDryRun(null, token);
        assert.equal(getChangeSet.callCount(), 1);
        var args = getChangeSet.lastArguments();
        assert.equal(args.length, 3);
        assert.strictEqual(args[0], null);
        assert.equal(args[1], token);
      });

      it('has a callback which calls to import the dryrun', function() {
        var yaml = 'foo';
        var dryRun = utils.makeStubMethod(bundleImporter, 'importBundleDryRun');
        var getChangeSet = utils.makeStubMethod(
            bundleImporter.env, 'getChangeSet');
        this._cleanups.concat([dryRun.reset, getChangeSet.reset]);
        var changeSet = { foo: 'bar' };
        bundleImporter.fetchDryRun(yaml);
        var callback = getChangeSet.lastArguments()[2];
        callback({changeSet: changeSet});
        assert.equal(dryRun.callCount(), 1);
        assert.deepEqual(dryRun.lastArguments()[0], changeSet);
      });
    });
  });

  describe('Changeset generation methods', function() {
    it('calls to execute supplied records', function() {
      var called = {
        addCharm: false,
        addMachines: false,
        deploy: false,
        addUnit: false,
        addRelation: false,
        setAnnotations: false
      };
      function executor(record, next) {
        called[record.method] = true;
        next();
      }
      bundleImporter._execute_addCharm = executor;
      bundleImporter._execute_addMachines = executor;
      bundleImporter._execute_deploy = executor;
      bundleImporter._execute_addUnit = executor;
      bundleImporter._execute_addRelation = executor;
      bundleImporter._execute_setAnnotations = executor;

      var sortedRecords = [
        { method: 'addCharm' },
        { method: 'addMachines' },
        { method: 'deploy' },
        { method: 'addUnit' },
        { method: 'addRelation' },
        { method: 'setAnnotations' }
      ];
      bundleImporter._executeDryRun(sortedRecords);
      assert.deepEqual(called, {
        addCharm: true,
        addMachines: true,
        deploy: true,
        addUnit: true,
        addRelation: true,
        setAnnotations: true
      });
    });

    it('properly sorts a recordSet', function() {
      var data = utils.loadFixture(
          'data/wordpress-bundle-recordset.json', true);
      var sorted = bundleImporter._sortDryRunRecords(data);
      var order = [
        'addCharm-0', 'addService-1', 'setAnnotations-2',
        'addCharm-3', 'addService-4', 'setAnnotations-5',
        'addCharm-6', 'addService-7', 'addService-99', 'setAnnotations-8',
        'addMachines-9', 'addMachines-10',
        'addRelation-11', 'addRelation-12',
        'addUnit-13', 'addMachines-16',
        'addUnit-14', 'addMachines-17',
        'addUnit-15'
      ];
      sorted.forEach(function(record, index) {
        assert.equal(record.id, order[index]);
      });
    });

    it('stops but does not fail if unknown record type', function() {
      var sortedRecords = [
        { method: 'badMethod' }
      ];
      var execute = utils.makeStubMethod(bundleImporter, '_executeRecord');
      var notification = utils.makeStubMethod(
          bundleImporter.db.notifications, 'add');
      this._cleanups.concat([execute.reset, notification.reset]);
      bundleImporter._executeDryRun(sortedRecords);
      execute.passThroughToOriginalMethod();
      // the executor should only be called once at which time it'll throw a
      // notification instead of continuing on.
      assert.equal(execute.callCount(), 1, 'execute not called');
      assert.equal(notification.callCount(), 1, 'notification not added');
    });
  });

  describe('Changeset execution', function() {

    it('Sets up the correct environment (v4 Integration)', function(done) {
      var data = utils.loadFixture(
          'data/wordpress-bundle-recordset.json', true);
      bundleImporter.db.after('bundleImportComplete', function() {
        // All that's required is that this complete; timing out indicates
        // failure.
        done();
      });
      bundleImporter.importBundleDryRun(data);
      // Cleans up internals.
      // Note - although we strive to test public methods only, we do need
      // to check on some aspects of the bundle importer's state to ensure
      // that subsequent runs will not encounter problems. Makyo 2015-05-18
      assert.equal(bundleImporter._dryRunIndex, -1);
      assert.equal(db.services.size(), 4);
      assert.equal(db.units.size(), 3);
      assert.equal(db.machines.size(), 4);
      assert.equal(db.relations.size(), 2);
      // Services and units
      // Note that this service, as specified in the fixture, does not include
      // a revision number, but a revision number is included here due to
      // fetching the charm.
      assert.equal(db.services.item(0).get('charm'), 'cs:precise/haproxy-35');
      assert.equal(db.services.item(0).get('config').default_retries, 42);
      assert.equal(db.units.item(0).service, db.services.item(0).get('id'));
      assert.equal(db.units.item(0).displayName, 'haproxy/0');
      assert.equal(db.services.item(1).get('charm'), 'cs:precise/wordpress-27');
      assert.equal(db.units.item(1).service, db.services.item(1).get('id'));
      assert.equal(db.units.item(1).displayName, 'wordpress/0');
      assert.equal(db.services.item(2).get('charm'), 'cs:precise/mysql-51');
      assert.equal(db.units.item(2).service, db.services.item(2).get('id'));
      assert.equal(db.units.item(2).displayName, 'mysql/0');
      // This is an extra service with the same charm as a previous charm.
      // There was a bug where their names would clash and they would get
      // combined into a single service on deploy.
      assert.equal(db.services.item(3).get('charm'), 'cs:precise/mysql-51');
      assert.equal(db.services.item(3).get('name'), 'mysql-slave');
      assert.equal(db.services.item(3).get('displayName'), '(mysql-slave)');
      // Machines
      assert.equal(db.machines.item(0).id, 'new0');
      assert.equal(db.machines.item(1).id, 'new1');
      assert.equal(db.machines.item(2).id, 'new0/lxc/new3');
      assert.equal(db.machines.item(3).id, 'new1/lxc/new2');
      // Relations
      assert.equal(
          db.relations.item(0).get('id'),
          'pending-$addService-1:reverseproxy$addService-4:website');
      assert.equal(
          db.relations.item(1).get('id'),
          'pending-$addService-4:db$addService-7:db');
    });

    it('Sets up the correct environment (v3 colocation)', function() {
      var data = utils.loadFixture(
          'data/wordpress-bundle-v3-recordset.json', true);
      bundleImporter.importBundleDryRun(data);
      assert.equal(db.services.size(), 2);
      assert.equal(db.units.size(), 2);
      assert.equal(db.machines.size(), 1);
      assert.equal(db.units.item(0).machine, db.units.item(1).machine);
    });
  });
});

