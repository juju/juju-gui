/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const BundleImporter = require('./bundle-importer');
const jujulibConversionUtils = require('./jujulib-conversion-utils');

describe('BundleImporter', () => {
  let bundleImporter, charmstore, db, getBundleChanges,
      modelAPI, models, utils, yui;

  beforeAll(done => {
    const requires = [
      'juju-tests-utils', 'juju-models', 'juju-env-api',
      'juju-tests-factory', 'environment-change-set'];
    YUI(GlobalConfig).use(requires, Y => {
      utils = Y['juju-tests'].utils;
      models = Y.namespace('juju.models');
      yui = Y;
      done();
    });
  });

  beforeEach(() => {
    const getMockStorage = () => {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store['name'] = val; },
          getItem: function(name) { return this.store['name'] || null; }
        };
      };
    };
    const userClass = new window.jujugui.User({sessionStorage: getMockStorage()});
    userClass.controller = {user: 'user', password: 'password'};
    db = new models.Database();
    modelAPI = new yui.juju.environments.GoEnvironment({
      user: userClass,
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
      makeEntityModel: jujulibConversionUtils.makeEntityModel,
      modelAPI
    });
  });

  afterEach(() => {
    db.destroy();
    modelAPI.destroy();
  });

  it('can be instantiated', () => {
    assert.equal(bundleImporter instanceof BundleImporter, true);
    assert.equal(typeof bundleImporter.modelAPI === 'object', true);
    assert.equal(typeof bundleImporter.db === 'object', true);
    assert.equal(typeof bundleImporter.charmstore === 'object', true);
  });

  describe('importBundleYAML', () => {
    it('calls fetchDryRun with yaml', () => {
      const fetch = sinon.stub(bundleImporter, 'fetchDryRun');
      const notify = sinon.stub(
        bundleImporter.db.notifications, 'add');
      bundleImporter.importBundleYAML('foo: bar');
      assert.equal(fetch.callCount, 1);
      const args = fetch.lastCall.args;
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

  describe('importBundleFile', () => {

    it('sets up and loads the FileReader', () => {
      const asText = sinon.stub();
      const generate = sinon.stub(
        bundleImporter, '_generateFileReader').returns({
        onload: '',
        readAsText: asText
      });
      const hideNotification = sinon.stub();
      bundleImporter.hideDragOverNotification = hideNotification;
      const onload = sinon.stub(bundleImporter, '_fileReaderOnload');
      const reader = bundleImporter.importBundleFile('path/to/file');
      assert.equal(generate.callCount, 1);
      assert.equal(asText.callCount, 1);
      reader.onload();
      assert.equal(onload.callCount, 1);
      // Make sure we hide the bundle drag over notification.
      assert.equal(hideNotification.callCount, 1);
    });

    describe('FileReader onload callback', () => {
      it('calls fetchDryRun if yaml file', () => {
        const fetch = sinon.stub(bundleImporter, 'fetchDryRun');
        const yamlFile = { name: 'path/to/file.yaml' };
        bundleImporter._fileReaderOnload(yamlFile, {target: {result: 'foo'}});
        assert.equal(fetch.callCount, 1);
        const args = fetch.lastCall.args;
        assert.equal(args.length, 2);
        assert.equal(args[0], 'foo');
        assert.strictEqual(args[1], null);
      });
    });
  });

  describe('importBundleDryRun', () => {
    const unsortedRecords = [
      { id: '2', requires: []},
      { id: '5', requires: ['3']},
      // The order of the following records (id:6) requires is important.
      // The sorter must check that all requires are resolved before
      // adding it to the changeSet.
      { id: '6', requires: ['2', '5']},
      { id: '4', requires: ['2']},
      { id: '3', requires: []}
    ];

    const sortedRecords = [
      { id: '2', requires: []},
      { id: '4', requires: ['2']},
      { id: '3', requires: []},
      { id: '5', requires: ['3']},
      { id: '6', requires: ['2', '5']}
    ];

    it('sorts the records then calls to execute', () => {
      const execute = sinon.stub(bundleImporter, '_executeDryRun');
      bundleImporter.importBundleDryRun(unsortedRecords);
      assert.deepEqual(bundleImporter.recordSet, sortedRecords);
      assert.equal(execute.callCount, 1);
      assert.deepEqual(execute.lastCall.args[0], sortedRecords);
    });
  });

  describe('fetchDryRun', () => {

    it('calls to modelAPI to get bundle changes from a YAML', () => {
      const yaml = '{"services":{}}';
      bundleImporter.fetchDryRun(yaml, null);
      assert.equal(getBundleChanges.callCount, 1);
      const args = getBundleChanges.lastCall.args;
      assert.equal(args.length, 3);
      assert.equal(args[0], yaml);
      assert.strictEqual(args[1], null);
    });

    it('ensures v4 format on import', () => {
      const yaml = '{"bundle":{"services":{}}}';
      bundleImporter.fetchDryRun(yaml, null);
      assert.equal(getBundleChanges.callCount, 1);
      const args = getBundleChanges.lastCall.args;
      assert.equal(args.length, 3);
      assert.equal(args[0], '{"services":{}}');
      assert.strictEqual(args[1], null);
    });

    it('can import v4 bundles with applications key', () => {
      const yaml = '{"applications":{}}';
      bundleImporter.fetchDryRun(yaml, null);
      assert.equal(getBundleChanges.callCount, 1);
      const args = getBundleChanges.lastCall.args;
      assert.equal(args.length, 3);
      assert.equal(args[0], '{"applications":{}}');
      assert.strictEqual(args[1], null);
    });

    it('calls to modelAPI to get bundle changes from a token', () => {
      const token = 'foo';
      bundleImporter.fetchDryRun(null, token);
      assert.equal(getBundleChanges.callCount, 1);
      const args = getBundleChanges.lastCall.args;
      assert.equal(args.length, 3);
      assert.strictEqual(args[0], null);
      assert.equal(args[1], token);
    });

    it('has a callback which calls to import the dry run', () => {
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

  describe('Changeset generation methods', () => {
    it('calls to execute supplied records', () => {
      const called = {
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

      const sortedRecords = [
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

    it('properly sorts a recordSet', () => {
      const data = utils.loadFixture(
        'data/wordpress-bundle-recordset.json', true);
      const sorted = bundleImporter._sortDryRunRecords(data);
      const order = [
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

    it('stops but does not fail if unknown record type', () => {
      const sortedRecords = [
        { method: 'badMethod' }
      ];
      const execute = sinon.stub(bundleImporter, '_executeRecord');
      const notification = sinon.stub(
        bundleImporter.db.notifications, 'add');
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

  describe('Changeset execution', () => {

    it('sets up the correct model (v5 Integration)', done => {
      let getCanonicalIdCount = 0;
      charmstore.getCanonicalId = (entityId, callback) => {
        getCanonicalIdCount += 1;
        callback(null, entityId);
      };
      const data = utils.loadFixture(
        'data/wordpress-bundle-recordset.json', true);
      const handler = () => {
        document.removeEventListener('topo.bundleImportComplete', handler);
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
        const id = [
          db.services.item(0).get('id'),
          db.services.item(1).get('id'),
          db.services.item(2).get('id')
        ];
        assert.equal(
          db.relations.item(0).get('id'),
          `pending-$deploy-1:reverseproxy${id[0]}$deploy-4:website${id[1]}`);
        assert.equal(
          db.relations.item(1).get('id'),
          `pending-$deploy-4:db${id[1]}$deploy-7:db${id[2]}`);
        // Expose
        assert.equal(db.services.item(0).get('exposed'), false);
        assert.equal(db.services.item(1).get('exposed'), false);
        assert.equal(db.services.item(2).get('exposed'), true);
        assert.equal(db.services.item(3).get('exposed'), false);
        assert.equal(getCanonicalIdCount, 3);
        done();
      };
      document.addEventListener('topo.bundleImportComplete', handler);
      bundleImporter.importBundleDryRun(data);
    });

    it('handles conflicts with existing service names', done => {
      db.services.add(new yui.juju.models.Service({
        id: 'haproxy',
        charm: 'cs:precise/haproxy-35'
      }));
      const data = utils.loadFixture(
        'data/wordpress-bundle-recordset.json', true);
      const handler = () => {
        document.removeEventListener('topo.bundleImportComplete', handler);
        assert.equal(db.services.item(0).get('name'), 'haproxy');
        assert.equal(db.services.item(1).get('name'), 'haproxy-a');
        done();
      };
      document.addEventListener('topo.bundleImportComplete', handler);
      bundleImporter.importBundleDryRun(data);
    });

    it('sets up the correct model (v3 colocation)', () => {
      const data = utils.loadFixture(
        'data/wordpress-bundle-v3-recordset.json', true);
      bundleImporter.importBundleDryRun(data);
      assert.equal(db.services.size(), 2);
      assert.equal(db.units.size(), 2);
      assert.equal(db.machines.size(), 1);
      assert.equal(db.units.item(0).machine, db.units.item(1).machine);
    });
  });

  describe('_execute_deploy', () => {
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
