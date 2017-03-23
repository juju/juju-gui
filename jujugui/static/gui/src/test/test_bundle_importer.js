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
  let bundleImporter, BundleImporter, charmstore, db, getBundleChanges,
      modelAPI, models, utils, yui;

  before(function(done) {
    const requires = [
      'bundle-importer', 'juju-tests-utils', 'juju-models', 'juju-env-api',
      'juju-tests-factory', 'environment-change-set', 'jujulib-utils'];
    YUI(GlobalConfig).use(requires, function(Y) {
      BundleImporter = Y.juju.BundleImporter;
      utils = Y['juju-tests'].utils;
      models = Y.namespace('juju.models');
      yui = Y;
      done();
    });
  });

  beforeEach(function() {
    db = new models.Database();
    modelAPI = new yui.juju.environments.GoEnvironment({
      ecs: new yui.juju.EnvironmentChangeSet({
        db: db
      })
    });
    charmstore = yui['juju-tests'].factory.makeFakeCharmstore();
    getBundleChanges = sinon.stub();
    bundleImporter = new BundleImporter({
      charmstore,
      db,
      getBundleChanges: getBundleChanges,
      makeEntityModel: yui.juju.makeEntityModel,
      modelAPI
    });
  });

  afterEach(function() {
    db.destroy();
    modelAPI.destroy();
  });

  it('can be instantiated', function() {
    assert.equal(bundleImporter instanceof BundleImporter, true);
    assert.equal(typeof bundleImporter.modelAPI === 'object', true);
    assert.equal(typeof bundleImporter.db === 'object', true);
    assert.equal(typeof bundleImporter.charmstore === 'object', true);
  });

  describe('Public methods', function() {

    describe('importBundleYAML', function() {
      it('calls fetchDryRun with yaml', function() {
        var fetch = sinon.stub(bundleImporter, 'fetchDryRun');
        var notify = sinon.stub(
          bundleImporter.db.notifications, 'add');
        this._cleanups.concat([fetch.restore, notify.restore]);
        bundleImporter.importBundleYAML('foo: bar');
        assert.equal(fetch.callCount, 1);
        var args = fetch.lastCall.args;
        assert.equal(args.length, 2);
        assert.equal(args[0], 'foo: bar');
        assert.strictEqual(args[1], null);
        assert.equal(notify.callCount, 1);
        assert.deepEqual(notify.lastCall.args[0], {
          title: 'Fetching bundle data',
          message: 'Fetching detailed bundle data, this may take some time',
          level: 'important'
        });
      });
    });

    describe('importBundleFile', function() {

      it('sets up and loads the FileReader', function() {
        var asText = sinon.stub();
        var generate = sinon.stub(
          bundleImporter, '_generateFileReader').returns({
            onload: '',
            readAsText: asText
          });
        var hideNotification = sinon.stub();
        bundleImporter.hideDragOverNotification = hideNotification;
        var onload = sinon.stub(bundleImporter, '_fileReaderOnload');
        this._cleanups.concat([generate.restore, onload.restore]);
        var reader = bundleImporter.importBundleFile('path/to/file');
        assert.equal(generate.callCount, 1);
        assert.equal(asText.callCount, 1);
        reader.onload();
        assert.equal(onload.callCount, 1);
        // Make sure we hide the bundle drag over notification.
        assert.equal(hideNotification.callCount, 1);
      });

      describe('FileReader onload callback', function() {
        var file = { name: 'path/to/file.json' };
        it('shows notification if file contains invalid json', function() {
          var notification = sinon.stub(
              bundleImporter.db.notifications, 'add');
          this._cleanups.push(notification.restore);
          bundleImporter._fileReaderOnload(file, {
            target: { result: '[invalid json]' }
          });
          assert.equal(notification.callCount, 1);
          assert.equal(notification.lastCall.args[0].level, 'error');
        });

        it('shows notification before kicking off import', function() {
          var importStub = sinon.stub(
              bundleImporter, 'importBundleDryRun');
          var notification = sinon.stub(
              bundleImporter.db.notifications, 'add');
          this._cleanups.concat([importStub.restore, notification.restore]);
          bundleImporter._fileReaderOnload(file, {
            target: { result: '["valid", "json"]' }
          });
          assert.equal(notification.callCount, 1);
          assert.equal(notification.lastCall.args[0].level, 'important');
          assert.equal(importStub.callCount, 1);
        });

        it('calls fetchDryRun if yaml file', function() {
          var fetch = sinon.stub(bundleImporter, 'fetchDryRun');
          var yamlFile = { name: 'path/to/file.yaml' };
          bundleImporter._fileReaderOnload(yamlFile, {target: {result: 'foo'}});
          assert.equal(fetch.callCount, 1);
          var args = fetch.lastCall.args;
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
        var execute = sinon.stub(bundleImporter, '_executeDryRun');
        this._cleanups.push(execute.restore);
        bundleImporter.importBundleDryRun(unsortedRecords);
        assert.deepEqual(bundleImporter.recordSet, sortedRecords);
        assert.equal(execute.callCount, 1);
        assert.deepEqual(execute.lastCall.args[0], sortedRecords);
      });
    });

    describe('fetchDryRun', function() {

      it('calls to modelAPI to get bundle changes from a YAML', function() {
        const yaml = '{"services":{}}';
        bundleImporter.fetchDryRun(yaml, null);
        assert.equal(getBundleChanges.callCount, 1);
        const args = getBundleChanges.lastCall.args;
        assert.equal(args.length, 3);
        assert.equal(args[0], yaml);
        assert.strictEqual(args[1], null);
      });

      it('ensures v4 format on import', function() {
        const yaml = '{"bundle":{"services":{}}}';
        bundleImporter.fetchDryRun(yaml, null);
        assert.equal(getBundleChanges.callCount, 1);
        const args = getBundleChanges.lastCall.args;
        assert.equal(args.length, 3);
        assert.equal(args[0], '{"services":{}}');
        assert.strictEqual(args[1], null);
      });

      it('can import v4 bundles with applications key', function() {
        const yaml = '{"applications":{}}';
        bundleImporter.fetchDryRun(yaml, null);
        assert.equal(getBundleChanges.callCount, 1);
        const args = getBundleChanges.lastCall.args;
        assert.equal(args.length, 3);
        assert.equal(args[0], '{"applications":{}}');
        assert.strictEqual(args[1], null);
      });

      it('calls to modelAPI to get bundle changes from a token', function() {
        const token = 'foo';
        bundleImporter.fetchDryRun(null, token);
        assert.equal(getBundleChanges.callCount, 1);
        const args = getBundleChanges.lastCall.args;
        assert.equal(args.length, 3);
        assert.strictEqual(args[0], null);
        assert.equal(args[1], token);
      });

      it('has a callback which calls to import the dry run', function() {
        const yaml = 'foo';
        const dryRun = sinon.stub(
          bundleImporter, 'importBundleDryRun');
        const changes = [{foo: 'bar'}];
        bundleImporter.fetchDryRun(yaml);
        const callback = getBundleChanges.lastCall.args[2];
        callback([], changes);
        assert.equal(dryRun.callCount, 1);
        assert.deepEqual(dryRun.lastCall.args[0], changes);
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
        'addCharm-0', 'deploy-1', 'setAnnotations-2',
        'addCharm-3', 'deploy-4', 'setAnnotations-5',
        'addCharm-6', 'deploy-7', 'expose-8', 'deploy-99', 'setAnnotations-9',
        'addMachines-10', 'addMachines-11',
        'addRelation-11', 'addRelation-12',
        'addUnit-13', 'addMachines-16',
        'addUnit-14', 'addMachines-17',
        'addUnit-15', 'addUnit-16', 'addUnit-17'
      ];
      sorted.forEach(function(record, index) {
        assert.equal(record.id, order[index]);
      });
    });

    it('stops but does not fail if unknown record type', function() {
      var sortedRecords = [
        { method: 'badMethod' }
      ];
      var execute = sinon.stub(bundleImporter, '_executeRecord');
      var notification = sinon.stub(
          bundleImporter.db.notifications, 'add');
      this._cleanups.push(notification.restore);
      bundleImporter._executeDryRun(sortedRecords);
      const args = execute.lastCall.args;
      execute.restore();
      bundleImporter._executeRecord.apply(bundleImporter, args);
      // the executor should only be called once at which time it'll throw a
      // notification instead of continuing on.
      assert.equal(execute.callCount, 1, 'execute not called');
      assert.equal(notification.callCount, 1, 'notification not added');
    });
  });

  describe('Changeset execution', function() {

    it('sets up the correct model (v5 Integration)', function(done) {
      let getCanonicalIdCount = 0;
      charmstore.getCanonicalId = (entityId, callback) => {
        getCanonicalIdCount += 1;
        callback(null, entityId);
      };
      var data = utils.loadFixture(
          'data/wordpress-bundle-recordset.json', true);
      bundleImporter.db.after('bundleImportComplete', function() {
        // Cleans up internals.
        // Note - although we strive to test public methods only, we do need
        // to check on some aspects of the bundle importer's state to ensure
        // that subsequent runs will not encounter problems. Makyo 2015-05-18
        assert.equal(bundleImporter._dryRunIndex, -1);
        assert.equal(db.services.size(), 4);
        assert.equal(db.units.size(), 5);
        assert.equal(db.machines.size(), 5);
        assert.equal(db.relations.size(), 2);
        // Charms are marked as loaded.
        assert.equal(db.charms.item(0).loaded, true);
        // Services and units
        // Note that this service, as specified in the fixture, does not include
        // a revision number, but a revision number is included here due to
        // fetching the charm.
        assert.equal(db.services.item(0).get('charm'), 'cs:precise/haproxy-35');
        assert.equal(db.services.item(0).get('config').default_retries, 42);
        assert.equal(db.units.item(0).service, db.services.item(0).get('id'));
        assert.equal(db.units.item(0).displayName, 'haproxy/0');
        assert.equal(db.services.item(1).get('charm'),
            'cs:precise/wordpress-27');
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
        assert.equal(db.machines.item(2).id, 'new4');
        assert.equal(db.machines.item(3).id, 'new0/lxd/new3');
        assert.equal(db.machines.item(4).id, 'new1/lxd/new2');
        // Relations
        assert.equal(
            db.relations.item(0).get('id'),
            'pending-$deploy-1:reverseproxy$deploy-4:website');
        assert.equal(
            db.relations.item(1).get('id'),
            'pending-$deploy-4:db$deploy-7:db');
        // Expose
        assert.equal(db.services.item(0).get('exposed'), false);
        assert.equal(db.services.item(1).get('exposed'), false);
        assert.equal(db.services.item(2).get('exposed'), true);
        assert.equal(db.services.item(3).get('exposed'), false);
        assert.equal(getCanonicalIdCount, 3);
        done();
      });
      bundleImporter.importBundleDryRun(data);
    });

    it('handles conflicts with existing service names', function(done) {
      db.services.add(new yui.juju.models.Service({
        id: 'haproxy',
        charm: 'cs:precise/haproxy-35'
      }));
      var data = utils.loadFixture(
          'data/wordpress-bundle-recordset.json', true);
      bundleImporter.db.after('bundleImportComplete', function() {
        assert.equal(db.services.item(0).get('name'), 'haproxy');
        assert.equal(db.services.item(1).get('name'), 'haproxy-a');
        done();
      });
      bundleImporter.importBundleDryRun(data);
    });

    it('sets up the correct model (v3 colocation)', function() {
      var data = utils.loadFixture(
          'data/wordpress-bundle-v3-recordset.json', true);
      bundleImporter.importBundleDryRun(data);
      assert.equal(db.services.size(), 2);
      assert.equal(db.units.size(), 2);
      assert.equal(db.machines.size(), 1);
      assert.equal(db.units.item(0).machine, db.units.item(1).machine);
    });
  });

  describe('_execute_deploy', function() {
    it('properly merges bundle config with defaults', () => {
      const id = 'cs:trusty/haproxy-10';
      const name = 'haproxy';
      const record = {
        'addCharm-0': {},
        args: [
          id,
          'trusty',
          name,
          { services: '', enable_monitoring: true, source: 'backports' },
          '',
          {},
          {},
          {}
        ],
        id: 'deploy-1',
        method: 'deploy',
        requires: [ 'addCharm-0' ]
      };
      const options = {
        services: {
          default: 'foo',
          description: '',
          type: 'string'
        },
        enable_monitoring: {
          default: false,
          description: '',
          type: 'boolean'
        },
        source: {
          default: '',
          description: '',
          type: 'string'
        },
        default_log: {
          default: 'global',
          description: '',
          type: 'string'
        }
      };
      const charm = {
        options: options,
        id: id,
        series: 'trusty'
      };
      const next = sinon.stub();
      charmstore.getEntity = (id, callback) => {
        callback(null, [charm]);
      };
      bundleImporter.modelAPI.deploy = sinon.stub();
      const ghostService = new models.Service({
        id: id,
        name: name
      });
      bundleImporter.db.services.ghostService = sinon.stub();
      bundleImporter.db.services.ghostService.returns(ghostService);
      bundleImporter._saveModelToRequires = sinon.stub();
      bundleImporter._execute_deploy(record, next);
      const expectedConfig = {
        services: '',
        enable_monitoring: true,
        source: 'backports',
        default_log: 'global'
      };
      const actualConfig = ghostService.get('config');
      assert.deepEqual(actualConfig, expectedConfig);
    });
  });
});
