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

(function() {

  // Helpers
  // Verify that an expected Error was found.
  var ERROR = function(errString, done) {
    return function(result) {
      assert.equal(errString, result.error);
      done();
    };
  };

  describe('FakeBackend.login', function() {
    var requires = ['node', 'juju-env-fakebackend'];
    var environmentsModule, fakebackend;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        done();
      });
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('authenticates', function() {
      fakebackend = new environmentsModule.FakeBackend();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.equal(fakebackend.login('user-admin', 'password'), true);
      assert.equal(fakebackend.get('authenticated'), true);
      fakebackend.logout();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.equal(fakebackend.login('user-admin@local', 'password'), true);
      assert.equal(fakebackend.get('authenticated'), true);
      fakebackend.logout();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.equal(fakebackend.login('user-test', 'test'), true);
      assert.equal(fakebackend.get('authenticated'), true);
      fakebackend.logout();
    });

    it('refuses to authenticate', function() {
      fakebackend = new environmentsModule.FakeBackend();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.equal(fakebackend.login('user-admin', 'not my password'), false);
      assert.equal(fakebackend.get('authenticated'), false);
    });
  });

  describe('FakeBackend.tokenlogin', function() {
    var requires = ['node', 'juju-env-fakebackend'];
    var environmentsModule, fakebackend;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        done();
      });
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('authenticates', function() {
      fakebackend = new environmentsModule.FakeBackend();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.deepEqual(
          fakebackend.tokenlogin('demoToken'),
          ['user-admin@local', 'password']);
      assert.equal(fakebackend.get('authenticated'), true);
    });

    it('refuses to authenticate', function() {
      fakebackend = new environmentsModule.FakeBackend();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.isUndefined(fakebackend.tokenlogin('not the token'));
      assert.equal(fakebackend.get('authenticated'), false);
    });
  });

  describe('FakeBackend.deploy', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend, utils, result, callback, models;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        factory = Y.namespace('juju-tests.factory');
        models = Y.namespace('juju.models');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      result = undefined;
      callback = function(response) {
        result = response;
      };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.equal(result.error, 'Please log in.');
    });

    it('rejects poorly formed charm ids', function() {
      fakebackend.deploy('shazam!!!!!!', callback);
      assert.equal(result.error, 'Invalid charm id: shazam!!!!!!');
    });

    it('deploys a charm', function() {
      // Defaults application name to charm name; defaults unit count to 1.
      assert.isNull(
          fakebackend.db.charms.getById('cs:precise/wordpress-27'));
      assert.isUndefined(
          fakebackend.deploy('cs:precise/wordpress-27', callback),
          'Fakebackend deploy returned something when undefined was expected.');
      assert.isUndefined(
          result.error,
          'result.error was something when undefined was expected.');
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-27'),
          'Fakebackend returned null when a charm was expected.');
      var application = fakebackend.db.services.getById('wordpress');
      assert.isObject(
        application, 'Null returned when an application was expected.');
      assert.strictEqual(application, result.application);
      var attrs = application.getAttrs();
      // clientId varies.
      assert.isTrue(typeof attrs.clientId === 'string');
      delete attrs.clientId;
      // when doing a deep equals on an object which contains a LazyModelList
      // call toArray() on it first else it will fail and it won't tell you why.
      // We make specific checks around unit/rel size counts outside of the
      // deepEquals check so we can make these easily testable.
      attrs.relations = [];
      attrs.units = [];
      // deepEquals compares order, even though that's not guaranteed by any
      // JS engine - if there are failures here check the order first.
      // Be aware of issues with mocha's diff reporting, see issues:
      // https://github.com/visionmedia/mocha/issues/905
      // https://github.com/visionmedia/mocha/issues/903
      var expectedAttrs = {
        initialized: true,
        destroyed: false,
        id: 'wordpress',
        displayName: 'wordpress',
        name: 'wordpress',
        aggregateRelationError: undefined,
        aggregateRelations: undefined,
        aggregated_status: undefined,
        charm: 'cs:precise/wordpress-27',
        config: {
          debug: 'no',
          engine: 'nginx',
          tuning: 'single',
          'wp-content': ''
        },
        annotations: {},
        charmChanged: false,
        constraints: {},
        constraintsStr: undefined,
        exposed: false,
        subordinate: false,
        icon: undefined,
        pending: false,
        placeFromGhostPosition: false,
        life: 'alive',
        units: [],
        relations: [],
        unit_count: undefined,
        packageName: 'wordpress'
      };

      // Assert some key properties
      assert.equal(attrs.id, expectedAttrs.id);
      assert.equal(attrs.charm, expectedAttrs.charm);
      assert.deepEqual(attrs.config, expectedAttrs.config);
      assert.deepEqual(attrs.annotations, expectedAttrs.annotations);
      var units = application.get('units').toArray();
      assert.lengthOf(units, 1);
      assert.lengthOf(result.units, 1);
      assert.strictEqual(units[0], result.units[0]);
      assert.equal(units[0].service, 'wordpress');
    });

    it('deploys a charm with constraints', function() {
      var options = {
        constraints: {
          cpu: 1,
          mem: '4G',
          arch: 'i386'
        }
      };
      assert.isNull(
          fakebackend.db.charms.getById('cs:precise/wordpress-27'));
      fakebackend.deploy('cs:precise/wordpress-27', callback, options);
      var application = fakebackend.db.services.getById('wordpress');
      assert.isObject(
          application,
          'Null returend when an application was expected.');
      assert.strictEqual(application, result.application);
      var attrs = application.getAttrs();
      var deployedConstraints = attrs.constraints;
      assert.deepEqual(
          options.constraints,
          deployedConstraints
      );
    });

    it('rejects names that duplicate an existing application', function() {
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.isUndefined(result.error);
      // The application name is provided explicitly.
      fakebackend.deploy(
          'cs:precise/haproxy-18', callback, {name: 'wordpress'});
      assert.equal(result.error,
          'An application with this name already exists (wordpress).');
      // The application name is derived from charm.
      result = undefined;
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.equal(result.error,
          'An application with this name already exists (wordpress).');
    });

    it('reuses already-loaded charms with the same explicit id.', function() {
      fakebackend._loadCharm('cs:precise/wordpress-27');
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-27'));
      fakebackend.set('store', undefined);
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.isUndefined(result.error);
      assert.isObject(result.application);
      assert.equal(result.application.get('charm'), 'cs:precise/wordpress-27');
    });

    it('reuses already-loaded charms with the same id.', function() {
      fakebackend._loadCharm('cs:precise/wordpress-27');
      var charm = fakebackend.db.charms.getById('cs:precise/wordpress-27');
      assert.equal(fakebackend.db.charms.size(), 1);
      // The charm data shows that this is not a subordinate charm.  We will
      // change this in the db, to show that the db data is used within the
      // deploy code.
      assert.isFalse(charm.get('is_subordinate'));
      // The _set forces a change to a writeOnly attribute.
      charm._set('is_subordinate', true);
      fakebackend.deploy('cs:precise/wordpress-27', callback, {unitCount: 0});
      assert.isUndefined(result.error);
      assert.strictEqual(
          fakebackend.db.charms.getById('cs:precise/wordpress-27'), charm);
      assert.equal(fakebackend.db.charms.size(), 1);
      assert.equal(result.application.get('charm'), 'cs:precise/wordpress-27');
      // This is the clearest indication that we used the db version, as
      // opposed to the api version, per the comments above.
      assert.isTrue(result.application.get('subordinate'));
    });

    it('accepts a config.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-27', callback, {config: {engine: 'apache'}});
      assert.deepEqual(result.application.get('config'), {
        debug: 'no',
        engine: 'apache',
        tuning: 'single',
        'wp-content': ''
      });
    });

    it('casts configs to their proper types', function() {
      var existingConfig = {
        boolean_1: 'false',
        boolean_2: 'True',
        int_1: '3',
        int_2: '-1',
        float_1: '3.00',
        float_2: '-1.00',
        string_1: 'http'
      };
      var options = {config: existingConfig};
      var charm = new models.Charm({
        id: 'cs:precise/test',
        options: {
          'boolean_1': {default: false, type: 'boolean'},
          'boolean_2': {default: false, type: 'boolean'},
          'int_1': {default: 1, type: 'int'},
          'int_2': {default: 1, type: 'int'},
          'float_1': {default: 1.00, type: 'float'},
          'float_2': {default: 1.00, type: 'float'},
          'string_1': {default: '', type: 'string'}
        }
      });
      fakebackend._deployFromCharm(charm, callback, options);
      var config = result.application.get('config');
      // Boolean
      assert.strictEqual(config.boolean_1, false);
      assert.strictEqual(config.boolean_2, true);
      // Int
      assert.strictEqual(config.int_1, 3);
      assert.strictEqual(config.int_2, -1);
      // Float
      assert.strictEqual(config.float_1, 3.00);
      assert.strictEqual(config.float_2, -1.00);
      // String
      assert.strictEqual(config.string_1, 'http');
    });

    it('deploys a charm with no config options', function(done) {
      // Charms that don't specify options would previously
      // not deploy properly as the code path expected them
      // to exist.
      fakebackend.promiseDeploy('cs:precise/puppetmaster-4')
      .then(function(result) {
        var application = fakebackend.db.services.getById('puppetmaster');
        assert.isObject(
          application,
          'Null returend when an application was expected.');
        assert.strictEqual(application, result.application);
        done();
      });
    });

    it('deploys multiple units.', function() {
      fakebackend.deploy('cs:precise/wordpress-27', callback, {unitCount: 3});
      var units = result.application.get('units').toArray();
      assert.lengthOf(units, 3);
      assert.lengthOf(result.units, 3);
      assert.deepEqual(units, result.units);
    });

    it('allows deploying an application without units', function() {
      fakebackend.deploy('cs:precise/wordpress-27', callback, {unitCount: 0});
      // There is no error.
      assert.isUndefined(result.error);
      // No units have been added.
      assert.strictEqual(result.application.get('units').size(), 0);
    });

    it('reports when the API is inaccessible.', function() {
      fakebackend.get('charmstore').getEntity = function(id, cb) {
        cb('hiss', {});
      };
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.equal(result.error, 'Error interacting with the charmstore API.');
    });

    it('honors the optional application name', function() {
      assert.isUndefined(
          fakebackend.deploy(
              'cs:precise/wordpress-27', callback, {name: 'kumquat'}));
      assert.equal(result.application.get('id'), 'kumquat');
    });

    it('prefers config YAML to config.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-27',
          callback,
          {config: {funny: 'business'}, configYAML: 'engine: apache'});
      assert.deepEqual(result.application.get('config'), {
        debug: 'no',
        engine: 'apache',
        tuning: 'single',
        'wp-content': ''
      });
    });

    it('rejects a non-string configYAML', function() {
      fakebackend.deploy('cs:precise/wordpress-27', callback, {configYAML: {}});
      assert.equal(
          result.error, 'Developer error: configYAML is not a string.');
    });

    it('accepts a YAML config string.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-27',
          callback,
          {configYAML: utils.loadFixture('data/mysql-config.yaml')});
      assert.isObject(result.application.get('config'));
      assert.equal(result.application.get('config').tuning, 'super bad');
    });

    it('rejects unparseable YAML config string.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-27',
          callback,
          {configYAML: 'auto_id: %n'});
      assert.equal(
          result.error,
          'Error parsing YAML.\n' +
          'JS-YAML: end of the stream or a document separator is expected ' +
          'at line 1, column 10:\n' +
          '    auto_id: %n\n' +
          '             ^');
    });

    it('honors annotations', function() {
      var options = {
        annotations: {
          'gui-x': '-3',
          'gui-y': '5'
        }
      };
      fakebackend.deploy('cs:precise/wordpress-27', callback, options);
      var application = fakebackend.db.services.getById('wordpress');
      assert.deepEqual(
          options.annotations,
          application.get('annotations')
      );
      var changes = fakebackend.nextAnnotations();
      assert.deepEqual(changes.applications, {wordpress: application});
    });
  });

  describe('FakeBackend._getHardwareCharacteristics', function() {
    var factory, fakebackend;
    var requirements = ['juju-tests-factory'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = factory.makeFakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('returns hardware for containers', function() {
      var hardware = fakebackend._getHardwareCharacteristics(true);
      assert.deepEqual(hardware, {arch: 'amd64'});
    });

    it('returns hardware for containers with the given arch', function() {
      var hardware = fakebackend._getHardwareCharacteristics(
          true, {arch: 'i386', mem: 8000});
      assert.deepEqual(hardware, {arch: 'i386'});
    });

    it('returns default hardware if no constraints are provided', function() {
      var hardware = fakebackend._getHardwareCharacteristics(false);
      assert.deepEqual(hardware, {
        arch: 'amd64',
        cpuCores: 1,
        cpuPower: 100,
        mem: 1740,
        disk: 8192
      });
    });

    it('returns hardware corresponding to the given constraints', function() {
      var hardware = fakebackend._getHardwareCharacteristics(false, {
        arch: 'i386',
        'cpu-cores': 8,
        'cpu-power': 2000,
        mem: 4200,
        disk: 4700
      });
      assert.deepEqual(hardware, {
        arch: 'i386',
        cpuCores: 8,
        cpuPower: 2000,
        mem: 4200,
        disk: 4700
      });
    });

    it('falls back to defaults if some constraints are missing', function() {
      var hardware = fakebackend._getHardwareCharacteristics(false, {
        arch: 'i386',
        'cpu-power': 2000
      });
      assert.deepEqual(hardware, {
        arch: 'i386',
        cpuCores: 1,
        cpuPower: 2000,
        mem: 1740,
        disk: 8192
      });
    });

  });

  describe('FakeBackend._getNextMachineName', function() {
    var factory, fakebackend, machines;
    var requirements = ['juju-tests-factory'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = factory.makeFakeBackend();
      machines = fakebackend.db.machines;
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('returns machine 0 if the machines db is empty', function() {
      assert.strictEqual(fakebackend._getNextMachineName(), '0');
    });

    it('returns the next top level machine', function() {
      machines.add([{id: '42'}, {id: '43'}, {id: '43/lxc/1'}]);
      assert.strictEqual(fakebackend._getNextMachineName(), '44');
    });

    it('returns container 0 if no containers are found', function() {
      machines.add([{id: '42'}, {id: '42/lxc/6'}, {id: '43'}]);
      assert.strictEqual(
          fakebackend._getNextMachineName('43', 'lxc'), '43/lxc/0');
    });

    it('returns the next container', function() {
      machines.add(
          [{id: '42'}, {id: '42/lxc/6'}, {id: '43'}, {id: '43/lxc/1'}]);
      assert.strictEqual(
          fakebackend._getNextMachineName('42', 'lxc'), '42/lxc/7');
    });

    it('returns the next container for the given container type', function() {
      machines.add(
          [{id: '0'}, {id: '0/lxc/42'}, {id: '0/kvm/47'}]);
      assert.strictEqual(
          fakebackend._getNextMachineName('0', 'kvm'), '0/kvm/48');
    });

    it('returns sub-container 0 if no containers are found', function() {
      machines.add(
          [{id: '0'}, {id: '0/kvm/1'}, {id: '1'}, {id: '1/kvm/2'}]);
      assert.strictEqual(
          fakebackend._getNextMachineName('0/kvm/1', 'lxc'), '0/kvm/1/lxc/0');
    });

    it('returns the next sub-container', function() {
      machines.add(
          [{id: '0'}, {id: '1'}, {id: '1/kvm/2'}, {id: '1/kvm/2/lxc/42'}]);
      assert.strictEqual(
          fakebackend._getNextMachineName('1/kvm/2', 'lxc'), '1/kvm/2/lxc/43');
    });

  });

  describe('FakeBackend.addMachines', function() {
    var factory, fakebackend, machines, machinesCount;
    var requirements = ['juju-tests-factory'];
    var defaultHardware = {
      arch: 'amd64',
      cpuCores: 1,
      cpuPower: 100,
      mem: 1740,
      disk: 8192
    };

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = factory.makeFakeBackend();
      // Create initial machines.
      machines = fakebackend.db.machines;
      machines.add([
        {id: '0'},
        {id: '1'},
        {id: '1/lxc/0'}
      ]);
      // Store the initial number of machines/containers.
      machinesCount = machines.size();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var response = fakebackend.addMachines([{}]);
      assert.strictEqual(response.error, 'Please log in.');
      // No machines have been added.
      assert.strictEqual(machines.size(), machinesCount);
    });

    it('prevents containers creation if containerType is not set', function() {
      var response = fakebackend.addMachines([{parentId: '1'}]);
      assert.isUndefined(response.error);
      assert.deepEqual(
          response.machines,
          [{error: 'parent machine specified without container type'}]);
      // No machines have been added.
      assert.strictEqual(machines.size(), machinesCount);
    });

    it('prevents containers creation if the parent is not found', function() {
      var response = fakebackend.addMachines(
          [{parentId: '42', containerType: 'lxc'}]);
      assert.isUndefined(response.error);
      assert.deepEqual(
          response.machines,
          [{error: 'cannot add a new machine: machine 42 not found'}]);
      // No machines have been added.
      assert.strictEqual(machines.size(), machinesCount);
    });

    it('prevents containers creation if type is not supported', function() {
      var response = fakebackend.addMachines(
          [{parentId: '1', containerType: 'no-such'}]);
      assert.isUndefined(response.error);
      assert.deepEqual(
        response.machines,
        [{error: 'cannot add a new machine: machine 1 cannot host no-such ' +
             'containers'}]);
      // No machines have been added.
      assert.strictEqual(machines.size(), machinesCount);
    });

    it('adds a machine', function() {
      var response = fakebackend.addMachines([{}]);
      assert.isUndefined(response.error);
      assert.deepEqual(response.machines, [{name: '2'}]);
      // The machine has been added.
      assert.strictEqual(machines.size(), machinesCount + 1);
      assert.isNotNull(machines.getById('2'));
    });

    it('sets up new machine properties', function() {
      var response = fakebackend.addMachines([{
        constraints: {'cpu-cores': 4, 'cpu-power': 4242, mem: 2000},
        jobs: ['JobHostUnits', 'JobManageEnviron'],
        series: 'trusty'
      }]);
      assert.isUndefined(response.error);
      // Retrieve the new machine.
      var machine = machines.getById('2');
      assert.isNotNull(machine);
      // Check the machine properties.
      assert.strictEqual(machine.agent_state, 'started');
      assert.deepEqual(machine.addresses, []);
      assert.strictEqual(machine.instance_id, 'fake-instance');
      assert.deepEqual(machine.hardware, {
        arch: defaultHardware.arch,
        cpuCores: 4,
        cpuPower: 4242,
        mem: 2000,
        disk: defaultHardware.disk
      });
      assert.deepEqual(machine.jobs, ['JobHostUnits', 'JobManageEnviron']);
      assert.strictEqual(machine.life, 'alive');
      assert.strictEqual(machine.series, 'trusty');
      assert.deepEqual(machine.supportedContainers, ['lxc', 'kvm']);
    });

    it('sets up relevant default properties', function() {
      var response = fakebackend.addMachines([{}]);
      assert.isUndefined(response.error);
      // Retrieve the new machine.
      var machine = machines.getById('2');
      assert.isNotNull(machine);
      // Check the machine properties.
      assert.strictEqual(machine.agent_state, 'started');
      assert.deepEqual(machine.addresses, []);
      assert.strictEqual(machine.instance_id, 'fake-instance');
      assert.deepEqual(machine.hardware, defaultHardware);
      assert.strictEqual(machine.life, 'alive');
      assert.strictEqual(machine.series, 'precise');
    });

    it('sets up properties for containers hosted by new machines', function() {
      var response = fakebackend.addMachines([
        {containerType: 'lxc', series: 'saucy'}]);
      assert.isUndefined(response.error);
      // Retrieve the new machine and the new container.
      var machine = machines.getById('2');
      assert.isNotNull(machine);
      var container = machines.getById('2/lxc/0');
      assert.isNotNull(container);
      // Check the machine properties.
      assert.strictEqual(machine.agent_state, 'started');
      assert.deepEqual(machine.addresses, []);
      assert.strictEqual(machine.instance_id, 'fake-instance');
      assert.deepEqual(machine.hardware, defaultHardware);
      assert.deepEqual(machine.jobs, ['JobHostUnits']);
      assert.strictEqual(machine.life, 'alive');
      assert.strictEqual(machine.series, 'saucy');
      // Check the container properties.
      assert.strictEqual(container.agent_state, 'started');
      assert.deepEqual(container.addresses, []);
      assert.strictEqual(container.instance_id, 'fake-instance');
      assert.deepEqual(container.hardware, {arch: 'amd64'});
      assert.strictEqual(container.life, 'alive');
      assert.strictEqual(container.series, 'saucy');
    });

    it('adds a container to a new machine', function() {
      var response = fakebackend.addMachines([{containerType: 'kvm'}]);
      assert.isUndefined(response.error);
      assert.deepEqual(response.machines, [{name: '2/kvm/0'}]);
      // The new container has been created inside a new machine.
      assert.strictEqual(machines.size(), machinesCount + 2);
      assert.isNotNull(machines.getById('2'));
      assert.isNotNull(machines.getById('2/kvm/0'));
    });

    it('adds a container to an existing machine', function() {
      var response = fakebackend.addMachines(
          [{parentId: '1', containerType: 'lxc'}]);
      assert.isUndefined(response.error);
      assert.deepEqual(response.machines, [{name: '1/lxc/1'}]);
      // The container has been added.
      assert.strictEqual(machines.size(), machinesCount + 1);
      assert.isNotNull(machines.getById('1/lxc/1'));
    });

    it('adds multiple machines/containers', function() {
      var response = fakebackend.addMachines(
          [{}, {containerType: 'lxc'}, {parentId: '1', containerType: 'kvm'}]);
      assert.isUndefined(response.error);
      assert.deepEqual(
          response.machines,
          [{name: '2'}, {name: '3/lxc/0'}, {name: '1/kvm/0'}]);
      // The new machines and containers have been added.
      assert.strictEqual(machines.size(), machinesCount + 4);
      assert.isNotNull(machines.getById('2'));
      assert.isNotNull(machines.getById('3'));
      assert.isNotNull(machines.getById('3/lxc/0'));
      assert.isNotNull(machines.getById('1/kvm/0'));
    });

    it('adds some machines/containers', function() {
      var response = fakebackend.addMachines([
        {parentId: '0'}, // Container type not specified.
        {},
        {parentId: '5', containerType: 'kvm'}, // Invalid parent id.
        {parentId: '0', containerType: 'lxc'}
      ]);
      assert.isUndefined(response.error);
      var expectedMachines = [
        {error: 'parent machine specified without container type'},
        {name: '2'},
        {error: 'cannot add a new machine: machine 5 not found'},
        {name: '0/lxc/0'}
      ];
      assert.deepEqual(response.machines, expectedMachines);
      // Only valid machines/containers have been added.
      assert.strictEqual(machines.size(), machinesCount + 2);
      assert.isNotNull(machines.getById('2'));
      assert.isNotNull(machines.getById('0/lxc/0'));
    });

    it('calculates the next machine numbers', function() {
      machines.add({id: '42'});
      machinesCount = machines.size();
      var response = fakebackend.addMachines([{}, {}]);
      assert.isUndefined(response.error);
      assert.deepEqual(response.machines, [{name: '43'}, {name: '44'}]);
      // The machines have been added.
      assert.strictEqual(machines.size(), machinesCount + 2);
      assert.isNotNull(machines.getById('43'));
      assert.isNotNull(machines.getById('44'));
    });

    it('calculates the next container numbers', function() {
      machines.add([{id: '42'}, {id: '42/lxc/47'}]);
      machinesCount = machines.size();
      var response = fakebackend.addMachines([
        {parentId: '42', containerType: 'lxc'},
        {parentId: '42', containerType: 'lxc'}
      ]);
      assert.isUndefined(response.error);
      assert.deepEqual(
          response.machines, [{name: '42/lxc/48'}, {name: '42/lxc/49'}]);
      // The containers have been added.
      assert.strictEqual(machines.size(), machinesCount + 2);
      assert.isNotNull(machines.getById('42/lxc/48'));
      assert.isNotNull(machines.getById('42/lxc/49'));
    });

  });

  describe('FakeBackend.destroyMachines', function() {
    var factory, fakebackend, machines;
    var requirements = ['juju-tests-factory'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = factory.makeFakeBackend();
      // Create initial machines.
      machines = fakebackend.db.machines;
      machines.add([
        {id: '0'},
        {id: '1'},
        {id: '2'},
        {id: '2/lxc/0'},
        {id: '3'},
        {id: '3/kvm/0'},
        {id: '3/kvm/0/lxc/0'},
        {id: '3/kvm/0/lxc/1'},
        {id: '42'}
      ]);
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    // Add a unit to the given machine. Return the units model list.
    var addUnit = function(machineName) {
      var db = fakebackend.db;
      db.services.add({id: 'django'});
      db.addUnits({id: 'django/0', machine: machineName});
      return db.units;
    };

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var response = fakebackend.destroyMachines(['42']);
      assert.strictEqual(response.error, 'Please log in.');
      // Ensure the machine has not been removed.
      assert.isNotNull(machines.getById('42'));
    });

    it('removes a machine', function() {
      var response = fakebackend.destroyMachines(['1']);
      assert.isUndefined(response.error);
      // Ensure the machine has been removed.
      assert.isNull(machines.getById('1'));
    });

    it('removes a container', function() {
      var response = fakebackend.destroyMachines(['2/lxc/0']);
      assert.isUndefined(response.error);
      // Ensure the container has been removed.
      assert.isNull(machines.getById('2/lxc/0'));
    });

    it('removes multiple machines/containers', function() {
      var response = fakebackend.destroyMachines(['1', '42', '3/kvm/0/lxc/0']);
      assert.isUndefined(response.error);
      // Ensure the machines/containers have been removed.
      assert.isNull(machines.getById('1'));
      assert.isNull(machines.getById('42'));
      assert.isNull(machines.getById('3/kvm/0/lxc/0'));
    });

    it('returns an error if a single machine does not exist', function() {
      var response = fakebackend.destroyMachines(['99']);
      assert.strictEqual(
          response.error,
          'no machines were destroyed: machine 99 does not exist');
    });

    it('returns an error if a single container does not exist', function() {
      var response = fakebackend.destroyMachines(['2/lxc/99']);
      assert.strictEqual(
          response.error,
          'no machines were destroyed: machine 2/lxc/99 does not exist');
    });

    it('returns an error if no machines/containers exist', function() {
      var response = fakebackend.destroyMachines(['47', '2/lxc/99', '99']);
      assert.strictEqual(
          response.error,
          'no machines were destroyed: machine 47 does not exist; ' +
          'machine 2/lxc/99 does not exist; machine 99 does not exist');
    });

    it('returns an error if some machines do not exist', function() {
      var response = fakebackend.destroyMachines(
          ['1', '99', '2/lxc/0', '42/lxc/1']);
      assert.strictEqual(
          response.error,
          'some machines were not destroyed: machine 99 does not exist; ' +
          'machine 42/lxc/1 does not exist');
      // Ensure the existing machines/containers have been removed.
      assert.isNull(machines.getById('1'));
      assert.isNull(machines.getById('2/lxc/0'));
    });

    it('returns an error if the machine hosts units', function() {
      // Add an initial application and unit.
      var units = addUnit('1');
      var response = fakebackend.destroyMachines(['1']);
      assert.strictEqual(
          response.error,
          'no machines were destroyed: machine 1 has unit(s) django/0 ' +
          'assigned');
      // Ensure the machine and the unit are still in the database.
      assert.isNotNull(machines.getById('1'));
      assert.isNotNull(units.getById('django/0'));
    });

    it('returns an error if the container hosts units', function() {
      // Add an initial application and unit.
      var units = addUnit('2/lxc/0');
      var response = fakebackend.destroyMachines(['2/lxc/0']);
      assert.strictEqual(
          response.error,
          'no machines were destroyed: machine 2/lxc/0 has unit(s) django/0 ' +
          'assigned');
      // Ensure the machine and the unit are still in the database.
      assert.isNotNull(machines.getById('2/lxc/0'));
      assert.isNotNull(units.getById('django/0'));
    });

    it('forces removal of machines hosting units', function() {
      // Add an initial application and unit.
      var units = addUnit('1');
      var response = fakebackend.destroyMachines(['1'], true);
      assert.isUndefined(response.error);
      // Ensure the machine and the unit have been removed.
      assert.isNull(machines.getById('1'));
      assert.isNull(units.getById('django/0'));
    });

    it('forces removal of containers hosting units', function() {
      // Add an initial application and unit.
      var units = addUnit('3/kvm/0/lxc/0');
      var response = fakebackend.destroyMachines(['3/kvm/0/lxc/0'], true);
      assert.isUndefined(response.error);
      // Ensure the container and the unit have been removed.
      assert.isNull(machines.getById('3/kvm/0/lxc/0'));
      assert.isNull(units.getById('django/0'));
    });

    it('returns an error if the machine hosts containers', function() {
      var response = fakebackend.destroyMachines(['3']);
      assert.strictEqual(
          response.error,
          'no machines were destroyed: machine 3 is hosting containers ' +
          '3/kvm/0, 3/kvm/0/lxc/0, 3/kvm/0/lxc/1');
      // Ensure the machine and its containers are still in the database.
      assert.isNotNull(machines.getById('3'));
      assert.isNotNull(machines.getById('3/kvm/0'));
      assert.isNotNull(machines.getById('3/kvm/0/lxc/0'));
      assert.isNotNull(machines.getById('3/kvm/0/lxc/1'));
    });

    it('returns an error if some machines host containers', function() {
      var response = fakebackend.destroyMachines(['1', '2', '3/kvm/0']);
      assert.strictEqual(
          response.error,
          'some machines were not destroyed: ' +
          'machine 2 is hosting containers 2/lxc/0; machine ' +
          '3/kvm/0 is hosting containers 3/kvm/0/lxc/0, 3/kvm/0/lxc/1');
      // Ensure the machines with containers are still in the database.
      assert.isNotNull(machines.getById('2'));
      assert.isNotNull(machines.getById('3/kvm/0'));
      assert.isNotNull(machines.getById('3/kvm/0/lxc/0'));
      assert.isNotNull(machines.getById('3/kvm/0/lxc/1'));
      // Ensure the empty machines have been removed.
      assert.isNull(machines.getById('1'));
    });

    it('forces removal of machines hosting containers', function() {
      var response = fakebackend.destroyMachines(['2'], true);
      assert.isUndefined(response.error);
      // Ensure the machine and its container have been removed.
      assert.isNull(machines.getById('2'));
      assert.isNull(machines.getById('2/lxc/0'));
    });

    it('forces removal of containers hosting other containers', function() {
      var response = fakebackend.destroyMachines(['3/kvm/0'], true);
      assert.isUndefined(response.error);
      // Ensure the container and its sub-containers have beem removed.
      assert.isNull(machines.getById('3/kvm/0'));
      assert.isNull(machines.getById('3/kvm/0/lxc/0'));
      assert.isNull(machines.getById('3/kvm/0/lxc/1'));
    });

    it('returns multiple errors', function() {
      addUnit('1');
      var response = fakebackend.destroyMachines(['1', '2', '42']);
      assert.strictEqual(
          response.error,
          'some machines were not destroyed: ' +
          'machine 1 has unit(s) django/0 assigned; ' +
          'machine 2 is hosting containers 2/lxc/0');
    });

  });

  describe('FakeBackend.setCharm', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];

    var factory, fakebackend, result, callback, application;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      application = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('sets a charm.', function() {
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-18', false,
          false, callback);
      assert.isUndefined(result.error);
      assert.equal(application.get('charm'), 'cs:precise/mediawiki-18');
    });

    it('fails when the application does not exist', function() {
      fakebackend.setCharm('nope', 'nuh-uh', false, false, callback);
      assert.equal(result.error, 'Application "nope" not found.');
      assert.equal(application.get('charm'), 'cs:precise/wordpress-27');
    });

    it('fails if an application is in error without force.', function() {
      fakebackend.db.services.getById('wordpress').get('units')
      .each(function(unit) {
        unit.agent_state = 'error';
      });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-18', false, false,
          callback);
      assert.equal(result.error, 'Cannot set charm on an application with ' +
          'units in error without the force flag.');
      assert.equal(application.get('charm'), 'cs:precise/wordpress-27');
    });

    it('succeeds if an application is in error with force.', function() {
      fakebackend.db.services.each(function(application) {
        application.get('units').each(function(unit) {
          unit.agent_state = 'error';
        });
      });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-18', true, true,
                           callback);
      assert.isUndefined(result.error);
      assert.equal(application.get('charm'), 'cs:precise/mediawiki-18');
    });
  });

  describe('FakeBackend.expose', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend, application;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      fakebackend.deploy('cs:precise/wordpress-27', function() {});
      application = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.expose('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('exposes an application', function() {
      assert.isFalse(application.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(application.get('exposed'));
      assert.isUndefined(result.error);
      assert.isUndefined(result.warning);
    });

    it('errors on invalid application', function() {
      var result = fakebackend.expose('Je ne suis pas un application');
      assert.equal(
          '"Je ne suis pas un application" is an invalid application name.',
          result.error);
      assert.isUndefined(result.warning);
    });

    it('warns if an application is already exposed', function() {
      assert.isFalse(application.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(application.get('exposed'));
      result = fakebackend.expose('wordpress');
      assert.isUndefined(result.error);
      assert.equal('Application "wordpress" already exposed.', result.warning);
    });
  });

  describe('FakeBackend.unexpose', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend, application;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      fakebackend.deploy('cs:precise/wordpress-27', function() {});
      application = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.unexpose('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('unexposes an application', function() {
      assert.isFalse(application.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(application.get('exposed'));
      result = fakebackend.unexpose('wordpress');
      assert.isFalse(application.get('exposed'));
      assert.isUndefined(result.error);
      assert.isUndefined(result.warning);
    });

    it('errors on invalid application', function() {
      var result = fakebackend.unexpose('Je ne suis pas un application');
      assert.equal(
          '"Je ne suis pas un application" is an invalid application name.',
          result.error);
      assert.isUndefined(result.warning);
    });

    it('warns if an application is already unexposed', function() {
      assert.isFalse(application.get('exposed'));
      var result = fakebackend.unexpose('wordpress');
      assert.isFalse(application.get('exposed'));
      assert.isUndefined(result.error);
      assert.equal(
          'Application "wordpress" is not exposed.',
          result.warning);
    });
  });

  describe('FakeBackend.uniformOperations', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    describe('FakeBackend.resolved', function(done) {

      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.resolved('wordpress/0');
        assert.equal(result.error, 'Please log in.');
      });

      it('reports invalid units', function() {
        var result = fakebackend.resolved('wordpress/0');
        assert.equal(result.error, 'Unit "wordpress/0" does not exist.');
      });

      it('reports invalid relations', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function(result) {
          result = fakebackend.resolved('wordpress/0', 'db');
          assert.equal(result.error, 'Relation db not found for wordpress/0');
          done();
        });
      });
    });

    describe('FakeBackend.getCharm', function() {

      it('rejects unauthenticated calls', function(done) {
        fakebackend.logout();
        fakebackend.getCharm(
            'cs:precise/wordpress-27', ERROR('Please log in.', done));
      });

      it('disallows malformed charm names', function(done) {
        fakebackend.getCharm('^invalid',
            ERROR('Invalid charm id: ^invalid', done));
      });

      it('successfully returns valid charms', function(done) {
        fakebackend.getCharm('cs:precise/wordpress-27', function(data) {
          assert.equal(data.result.name, 'wordpress');
          done();
        });
      });

      it('loads subordinate charms properly', function(done) {
        fakebackend.getCharm('cs:precise/puppet-5', function(data) {
          assert.equal(data.result.name, 'puppet');
          assert.isTrue(data.result.is_subordinate);
          done();
        });
      });
    });

    describe('FakeBackend.getApplication', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.getApplication('cs:precise/wordpress-27');
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing application', function() {
        var result = fakebackend.getApplication('^invalid');
        assert.equal(result.error, 'Invalid application id: ^invalid');
      });

      it('successfully returns a valid application', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          var application = fakebackend.getApplication('wordpress').result;
          assert.equal(application.name, 'wordpress');
          done();
        });
      });
    });

    describe('FakeBackend.setConfig', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.setConfig('wordpress', {'foo': 'bar'});
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing application', function() {
        var result = fakebackend.setConfig('scaling', {});
        assert.equal(result.error, 'Application \"scaling\" does not exist.');
      });

      it('successfully returns a valid app configuration', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.setConfig('wordpress', {
            'blog-title': 'Silence is Golden.'});
          var application = fakebackend.getApplication('wordpress').result;
          var config = application.config;
          assert.equal(config['blog-title'], 'Silence is Golden.');
          done();
        });
      });
    });

    describe('FakeBackend.setConstraints', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.setConstraints('wordpress', {'cpu': '4'});
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing application', function() {
        var result = fakebackend.setConstraints('scaling', {});
        assert.equal(result.error, 'Application \"scaling\" does not exist.');
      });

      it('successfully returns a valid constraints', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.setConstraints('wordpress', {'cpu': '4'});
          var application = fakebackend.getApplication('wordpress').result;
          var constraints = application.constraints;
          assert.equal(constraints.cpu, '4');
          assert.equal(constraints.mem, undefined);
          done();
        });
      });

      it('successfully returns a valid constraints as array', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.setConstraints('wordpress', ['cpu=4']);
          var application = fakebackend.getApplication('wordpress').result;
          var constraints = application.constraints;
          assert.equal(constraints.cpu, '4');
          assert.equal(constraints.mem, undefined);
          done();
        });
      });

      it('converts the tags constraint to a string', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.setConstraints('wordpress', {'tags': ['tag1', 'tag2']});
          var application = fakebackend.getApplication('wordpress').result;
          assert.strictEqual(application.constraints.tags, 'tag1,tag2');
          done();
        });
      });

      it('lets new constraints override existing ones', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.setConstraints(
              'wordpress', {'tags': ['tag1', 'tag2'], mem: 400});
          var application = fakebackend.getApplication('wordpress').result;
          assert.deepEqual(
            application.constraints, {tags: 'tag1,tag2', mem: 400});
          done();
        }, {constraints: {mem: 200, 'cpu-cores': 4}});
      });
    });

    describe('FakeBackend.destroyApplication', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.destroyApplication('dummy');
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing application', function() {
        var result = fakebackend.destroyApplication('missing');
        assert.equal('Invalid application id: missing', result.error);
      });

      it('successfully destroys a valid application', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function(data) {
          var result = fakebackend.destroyApplication('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          // Ensure the application can no longer be retrieved.
          result = fakebackend.getApplication('wordpress');
          assert.equal(result.error, 'Invalid application id: wordpress');
          done();
        });
      });

      it('removes relations when destroying an application', function(done) {
        // Add a couple of applications and hook up relations.
        fakebackend.deploy('cs:precise/wordpress-27', function(data) {
          fakebackend.deploy('cs:precise/mysql-26', function() {
            var result = fakebackend.addRelation('wordpress:db', 'mysql:db');
            assert.isUndefined(result.error);
            var mysql = fakebackend.getApplication('mysql').result;
            assert.lengthOf(mysql.rels, 1);
            // Now destroy one of the applications.
            result = fakebackend.destroyApplication('wordpress').result;
            assert.isUndefined(result.error);
            assert.equal('wordpress', result);
            // Ensure the destroyed application can no longer be retrieved.
            result = fakebackend.getApplication('wordpress');
            assert.equal(result.error, 'Invalid application id: wordpress');
            // But the other one exists and has no relations.
            mysql = fakebackend.getApplication('mysql').result;
            assert.lengthOf(mysql.rels, 0);
            done();
          });
        });
      });

      it('removes units when destroying an application', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function(data) {
          var application = fakebackend.db.services.getById('wordpress');
          var units = application.get('units').toArray();
          assert.lengthOf(units, 1);
          var result = fakebackend.destroyApplication('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          units = application.get('units').toArray();
          assert.lengthOf(units, 0);
          done();
        });
      });

    });

    describe('FakeBackend.Annotations', function() {
      it('must require authentication', function() {
        fakebackend.logout();
        var reply = fakebackend.getAnnotations('env');
        assert.equal(reply.error, 'Please log in.');
      });

      it('must get annotations from an application', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          var application = fakebackend.getApplication('wordpress').result;
          assert.deepEqual(application.annotations, {});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.deepEqual(anno, {});
          done();
        });
      });

      it('must update annotations to an application', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.updateAnnotations('wordpress',
                                        {'foo': 'bar', 'gone': 'away'});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'away');

          // Apply an update and verify that merge happened.
          fakebackend.updateAnnotations('wordpress', {'gone': 'too far'});
          anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'too far');
          done();
        });
      });

      it('must update annotations on a unit', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.updateAnnotations('wordpress/0',
                                        {'foo': 'bar', 'gone': 'away'});
          var anno = fakebackend.getAnnotations('wordpress/0').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'away');

          // Apply an update and verify that merge happened.
          fakebackend.updateAnnotations('wordpress/0', {'gone': 'too far'});
          anno = fakebackend.getAnnotations('wordpress/0').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'too far');
          done();
        });
      });

      it('must update annotations on the environment', function() {
        fakebackend.updateAnnotations('env',
                                      {'foo': 'bar', 'gone': 'away'});
        var anno = fakebackend.getAnnotations('env').result;
        assert.equal(anno.foo, 'bar');
        assert.equal(anno.gone, 'away');

        // Apply an update and verify that merge happened.
        fakebackend.updateAnnotations('env', {'gone': 'too far'});
        anno = fakebackend.getAnnotations('env').result;
        assert.equal(anno.foo, 'bar');
        assert.equal(anno.gone, 'too far');

        // Verify the annotations on the model directly.
        anno = fakebackend.db.environment.get('annotations');
        assert.equal(anno.foo, 'bar');
        assert.equal(anno.gone, 'too far');

        // Verify changes make it into nextAnnotations
        var changes = fakebackend.nextAnnotations();
        assert.deepEqual(changes.annotations.env,
                         fakebackend.db.environment);
      });

      it('must remove annotations from an application', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.updateAnnotations('wordpress',
                                        {'foo': 'bar', 'gone': 'away'});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'away');

          // Remove an annotation and verify that happened.
          fakebackend.removeAnnotations('wordpress', ['gone']);
          anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, undefined);

          // Finally remove annotations with falsey keys.
          fakebackend.removeAnnotations('wordpress');
          anno = fakebackend.getAnnotations('wordpress').result;
          assert.deepEqual(anno, {});
          done();
        });

      });
    });
  });

  describe('FakeBackend.addUnit', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend, deployResult, callback;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      deployResult = undefined;
      callback = function(response) { deployResult = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.addUnit('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('returns an error for an invalid number of units', function() {
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.isUndefined(deployResult.error);
      assert.equal(
          fakebackend.addUnit('wordpress', 'goyesca').error,
          'Invalid number of units [goyesca] for application: wordpress');
      assert.equal(
          fakebackend.addUnit('wordpress', 0).error,
          'Invalid number of units [0] for application: wordpress');
      assert.equal(
          fakebackend.addUnit('wordpress', -1).error,
          'Invalid number of units [-1] for application: wordpress');
    });

    it('returns error for invalid number of subordinate units', function() {
      fakebackend.deploy('cs:puppet', callback);
      assert.isUndefined(deployResult.error);
      assert.equal(
          fakebackend.addUnit('puppet', 'goyesca').error,
          'Invalid number of units [goyesca] for application: puppet');
      assert.equal(
          fakebackend.addUnit('puppet', 1).error,
          'Invalid number of units [1] for application: puppet');
      assert.equal(
          fakebackend.addUnit('puppet', -1).error,
          'Invalid number of units [-1] for application: puppet');
      // It also ignores empty requests
      assert.isUndefined(
          fakebackend.addUnit('puppet', 0).error);
      assert.isUndefined(
          fakebackend.addUnit('puppet').error);
    });

    it('returns an error if the application does not exist.', function() {
      assert.equal(
          fakebackend.addUnit('foo').error,
          'Application "foo" does not exist.');
    });

    it('defaults to adding just one unit', function() {
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          deployResult.application.get('units').toArray(), 1);
      var result = fakebackend.addUnit('wordpress');
      assert.lengthOf(result.units, 1);
      assert.lengthOf(
          deployResult.application.get('units').toArray(), 2);
      // Units are simple objects, not models.
      assert.equal(result.units[0].id, 'wordpress/1');
      assert.equal(result.units[0].agent_state, 'started');
      // Creating units also created/assigned associated machines.  Like units,
      // these are simple objects, not models.
      assert.lengthOf(result.machines, 1);
      assert.equal(
          result.machines[0].id, result.units[0].machine);
      assert.isString(result.machines[0].id);
      assert.equal(result.machines[0].agent_state, 'started');
    });

    it('deploys subordinates without adding units', function() {
      fakebackend.deploy('cs:precise/puppet-5', callback);
      assert.equal(deployResult.application.get('name'), 'puppet');
      assert.equal(deployResult.units.length, 0);
      assert.equal(deployResult.application.get('units').size(), 0);
    });

    it('adds multiple units', function() {
      fakebackend.deploy('cs:precise/wordpress-27', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          deployResult.application.get('units').toArray(), 1);
      var result = fakebackend.addUnit('wordpress', 5);
      assert.lengthOf(result.units, 5);
      assert.lengthOf(deployResult.application.get('units').toArray(), 6);
      assert.equal(result.units[0].id, 'wordpress/1');
      assert.equal(result.units[1].id, 'wordpress/2');
      assert.equal(result.units[2].id, 'wordpress/3');
      assert.equal(result.units[3].id, 'wordpress/4');
      assert.equal(result.units[4].id, 'wordpress/5');
      assert.lengthOf(result.machines, 5);
    });

  });

  describe('FakeBackend.removeUnit', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('can remove a single unit', function() {
      // This assumes that the addUnit tests above pass.
      var self = this;
      fakebackend.deploy('cs:precise/wordpress-27', function() {
        var unitId = 'wordpress/0';
        var mockRemoveUnits = sinon.stub(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.restore);
        var result = fakebackend.removeUnits(unitId);
        assert.deepEqual(result, {
          error: undefined,
          warning: undefined
        });
        // The db.removeUnits method has been called once.
        assert.strictEqual(mockRemoveUnits.callCount, 1);
        // The unit to be removed has been passed.
        var args = mockRemoveUnits.lastCall.args;
        assert.lengthOf(args, 1);
        assert.strictEqual(args[0].id, unitId);
      });
    });

    it('can remove multiple units', function() {
      // This assumes that the addUnit tests above pass.
      var self = this;
      fakebackend.deploy('cs:precise/wordpress-27', function() {
        var unitIds = ['wordpress/0', 'wordpress/1'];
        var mockRemoveUnits = sinon.stub(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.restore);
        var result = fakebackend.removeUnits(unitIds);
        assert.deepEqual(result, {
          error: undefined,
          warning: undefined
        });
        // The db.removeUnits method has been called twice.
        assert.strictEqual(mockRemoveUnits.callCount, 2);
        // The units to be removed have been passed.
        var args = mockRemoveUnits.args;
        assert.strictEqual(args[0][0].id, unitIds[0]);
        assert.strictEqual(args[1][0].id, unitIds[1]);
      }, {unitCount: 2});
    });

    it('returns an error when removing a subordinate', function() {
      // This assumes that the addUnit tests above pass.
      var self = this;
      fakebackend.deploy('cs:precise/wordpress-27', function() {
        // Simulate the application is a subordinate.
        fakebackend.db.services.item(0).set('subordinate', true);
        var unitId = 'wordpress/0';
        var mockRemoveUnits = sinon.stub(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.restore);
        var result = fakebackend.removeUnits(unitId);
        assert.deepEqual(result, {
          error: ['wordpress/0 is a subordinate, cannot remove.'],
          warning: undefined
        });
        // No units have been removed.
        assert.strictEqual(mockRemoveUnits.called, false);
      });
    });

    it('returns a warning when removing a non existing unit', function() {
      // This assumes that the addUnit tests above pass.
      var self = this;
      fakebackend.deploy('cs:precise/wordpress-27', function() {
        var mockRemoveUnits = sinon.stub(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.restore);
        var result = fakebackend.removeUnits('wordpress/42');
        assert.deepEqual(result, {
          error: undefined,
          warning: ['wordpress/42 does not exist, cannot remove.']
        });
      });
    });

  });

  describe('FakeBackend.next*', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend, deployResult, callback;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      deployResult = undefined;
      callback = function(response) { deployResult = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    describe('FakeBackend.nextChanges', function() {
      it('rejects unauthenticated calls.', function() {
        fakebackend.logout();
        var result = fakebackend.nextChanges();
        assert.equal(result.error, 'Please log in.');
      });

      it('reports no changes initially.', function() {
        assert.isNull(fakebackend.nextChanges());
      });

      it('reports a call to addUnit correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-27', callback);
        assert.isUndefined(deployResult.error);
        assert.isObject(fakebackend.nextChanges());
        var result = fakebackend.addUnit('wordpress');
        assert.lengthOf(result.units, 1);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Object.keys(changes.applications), 0);
        assert.lengthOf(Object.keys(changes.units), 1);
        assert.lengthOf(Object.keys(changes.machines), 1);
        assert.lengthOf(Object.keys(changes.relations), 0);
        assert.deepEqual(
            changes.units['wordpress/1'], [result.units[0], true]);
        assert.deepEqual(
            changes.machines[result.machines[0].id],
            [result.machines[0], true]);
      });

      it('reports a deploy correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-27', callback);
        assert.isUndefined(deployResult.error);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Object.keys(changes.applications), 1);
        assert.deepEqual(
            changes.applications.wordpress, [deployResult.application, true]);
        assert.lengthOf(Object.keys(changes.units), 1);
        assert.deepEqual(
            changes.units['wordpress/0'], [deployResult.units[0], true]);
        assert.lengthOf(Object.keys(changes.machines), 1);
        assert.deepEqual(
            changes.machines[deployResult.machines[0].id],
            [deployResult.machines[0], true]);
        assert.lengthOf(Object.keys(changes.relations), 0);
      });

      it('reports a deploy of multiple units correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-27', callback, {unitCount: 5});
        assert.isUndefined(deployResult.error);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Object.keys(changes.applications), 1);
        assert.lengthOf(Object.keys(changes.units), 5);
        assert.lengthOf(Object.keys(changes.machines), 5);
        assert.lengthOf(Object.keys(changes.relations), 0);
      });

      it('reports no changes when no changes have occurred.',
          function() {
            fakebackend.deploy('cs:precise/wordpress-27', callback);
            assert.isUndefined(deployResult.error);
            assert.isObject(fakebackend.nextChanges());
            assert.isNull(fakebackend.nextChanges());
          }
      );
    });

    describe('FakeBackend.nextAnnotations', function() {
      it('rejects unauthenticated calls.', function() {
        fakebackend.logout();
        var result = fakebackend.nextAnnotations();
        assert.equal(result.error, 'Please log in.');
      });

      it('reports no changes initially.', function() {
        assert.isNull(fakebackend.nextAnnotations());
      });

      it('reports application changes correctly', function(done) {
        fakebackend.deploy('cs:precise/wordpress-27', function() {
          fakebackend.updateAnnotations('wordpress',
                                        {'foo': 'bar', 'gone': 'away'});

          var changes = fakebackend.nextAnnotations();
          assert.deepEqual(changes.applications.wordpress,
                           fakebackend.db.services.getById('wordpress'));
          done();
        });
      });

      it('reports env changes correctly', function() {
        fakebackend.updateAnnotations('env',
                                      {'foo': 'bar', 'gone': 'away'});

        // Verify changes name it into nextAnnotations
        var changes = fakebackend.nextAnnotations();
        assert.deepEqual(changes.annotations.env,
                         fakebackend.db.environment);
      });
    });
  });

  describe('FakeBackend.addRelation', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    function createRelation(charms, relation, mock, done) {
      fakebackend.promiseDeploy(charms[0])
      .then(fakebackend.promiseDeploy(charms[1]))
      .then(function() {
        relation.push(true);
        var result = fakebackend.addRelation.apply(fakebackend, relation);
        assert.equal(result.error, undefined);
        assert.equal(result.relationId, 'relation-0');
        assert.equal(typeof result.relation, 'object');
        // Check those elements we care about.
        assert.equal(result.endpoints[0][0], mock.endpoints[0][0]);
        assert.equal(result.endpoints[0][1].name,
                     mock.endpoints[0][1].name);
        assert.equal(result.endpoints[1][0], mock.endpoints[1][0]);
        assert.equal(result.endpoints[1][1].name,
                     mock.endpoints[1][1].name);
        assert.equal(result.scope, mock.scope);
        assert.equal(result.type, mock.type);
        done();
      }).then(undefined, done);
    }

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Please log in.');
    });

    it('requires two string endpoint names', function() {
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Two string endpoint names' +
              ' required to establish a relation');
    });

    it('requires relationships to be explicit if more than one ' +
        'shared interface', function(done) {
      fakebackend.deploy('cs:mediawiki', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('mediawiki', 'mysql');
          assert.equal(result.error,
                  'Ambiguous relationship is not allowed.');
          done();
        });
      });
    });

    it('throws an error if there are no shared interfaces', function(done) {
      fakebackend.deploy('cs:hadoop', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('hadoop', 'mysql');
          assert.equal(result.error, 'Specified relation is unavailable.');
          done();
        });
      });
    });

    it('requires the specified interfaces to match', function(done) {
      fakebackend.deploy('cs:precise/wordpress-27', function() {
        fakebackend.deploy('cs:precise/haproxy-18', function() {
          var result = fakebackend.addRelation(
              'wordpress:cache', 'haproxy:munin');
          assert.equal(result.error, 'Specified relation is unavailable.');
          done();
        });
      });
    });

    it('can create a relation with a explicit interfaces', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:mysql'],
        ['wordpress:db', 'mysql:db'],
        { type: 'mysql', scope: 'global',
          endpoints:
              [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
        done);
    });

    it('can create a relation with double explicit interface (reverse)',
        function(done) {
          createRelation(
            ['cs:wordpress', 'cs:mysql'],
            ['mysql:db', 'wordpress:db'],
            { type: 'mysql', scope: 'global',
              endpoints:
                  [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
            done);
        });

    it('can create a relation with a double explicit interface and a ' +
        'subordinate charm', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:puppet'],
        ['wordpress:juju-info', 'puppet:juju-info'],
        { type: 'juju-info', scope: 'container',
          endpoints: [
            ['puppet', {name: 'juju-info'}],
            ['wordpress', {name: 'juju-info'}]]},
        done);
    });

    it('can create a relation with a double explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:puppet'],
        ['puppet:juju-info', 'wordpress:juju-info'],
        { type: 'juju-info', scope: 'container',
          endpoints: [
            ['puppet', {name: 'juju-info'}],
            ['wordpress', {name: 'juju-info'}]]},
        done);
    });

    it('can create a relation with a single explicit interface',
        function(done) {
          createRelation(
            ['cs:wordpress', 'cs:mysql'],
            ['wordpress:db', 'mysql'],
            { type: 'mysql', scope: 'global',
              endpoints: [
                ['wordpress', {name: 'db'}],
                ['mysql', {name: 'db'}]]},
            done);
        });

    it('can create a relation with a single explicit interface (reverse)',
        function(done) {
          createRelation(
            ['cs:wordpress', 'cs:mysql'],
            ['mysql', 'wordpress:db'],
            { type: 'mysql', scope: 'global',
              endpoints:
                  [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
            done);
        });

    it('can create a relation with a single explicit interface (other)',
        function(done) {
          createRelation(
            ['cs:wordpress', 'cs:mysql'],
            ['wordpress', 'mysql:db'],
            { type: 'mysql', scope: 'global',
              endpoints:
                  [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
            done);
        });

    it('can create a relation with a single explicit interface (other,' +
        ' reverse)', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:mysql'],
        ['mysql:db', 'wordpress'],
        { type: 'mysql', scope: 'global',
          endpoints:
              [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
        done);
    });

    it('can create a relation with a single explicit interface and a' +
        ' subordinate charm', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:puppet'],
        ['puppet:juju-info', 'wordpress'],
        { type: 'juju-info', scope: 'container',
          endpoints: [
            ['puppet', {name: 'juju-info'}],
            ['wordpress', {name: 'juju-info'}]]},
        done);
    });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (other)', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:puppet'],
        ['wordpress', 'puppet:juju-info'],
        { type: 'juju-info', scope: 'container',
          endpoints: [
            ['puppet', {name: 'juju-info'}],
            ['wordpress', {name: 'juju-info'}]]},
        done);
    });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:puppet'],
        ['puppet', 'wordpress:juju-info'],
        { type: 'juju-info', scope: 'container',
          endpoints: [
            ['puppet', {name: 'juju-info'}],
            ['wordpress', {name: 'juju-info'}]]},
        done);
    });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:puppet'],
        ['wordpress:juju-info', 'puppet'],
        { type: 'juju-info', scope: 'container',
          endpoints: [
            ['puppet', {name: 'juju-info'}],
            ['wordpress', {name: 'juju-info'}]]},
        done);
    });

    it('can create a relation with an inferred interface', function(done) {
      createRelation(
        ['cs:wordpress', 'cs:mysql'],
        ['wordpress', 'mysql'],
        { type: 'mysql', scope: 'global',
          endpoints:
              [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
        done);
    });

    it('can create a relation with an inferred interface (reverse)',
        function(done) {
          createRelation(
            ['cs:wordpress', 'cs:mysql'],
            ['mysql', 'wordpress'],
            { type: 'mysql', scope: 'global',
              endpoints:
                  [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
            done);
        });

    it('can create a relation with an inferred subordinate charm',
        function(done) {
          createRelation(
            ['cs:wordpress', 'cs:puppet'],
            ['wordpress', 'puppet'],
            { type: 'juju-info', scope: 'container',
              endpoints: [
                ['puppet', {name: 'juju-info'}],
                ['wordpress', {name: 'juju-info'}]]},
            done);
        });

    it('can create a relation with an inferred subordinate charm (reverse)',
        function(done) {
          createRelation(
            ['cs:wordpress', 'cs:puppet'],
            ['puppet', 'wordpress'],
            { type: 'juju-info', scope: 'container',
              endpoints: [
                ['puppet', {name: 'juju-info'}],
                ['wordpress', {name: 'juju-info'}]]},
            done);
        });

  });

  describe('FakeBackend.addRelations', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      fakebackend.set('authenticated', true);
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('returns with an error if not authenticated', function() {
      fakebackend.set('authenticated', false);
      assert.deepEqual(fakebackend.addRelations(), {error: 'Please log in.'});
    });

    it('returns with an error if initial endpoint is not a string', function() {
      assert.deepEqual(
          fakebackend.addRelations({}),
          {error: 'Relation source not a string'});
    });

    it('returns with an error if endpoint format is unkown', function() {
      assert.deepEqual(
          fakebackend.addRelations('foo', null),
          {error: 'Relations in unexpected format'});
    });

    it('calls addRelation once if both endpoints are strings', function() {
      var addRelation = sinon.stub(fakebackend, 'addRelation').returns('foo');
      var result = fakebackend.addRelations('bar:baz', 'bax:qux', true);
      assert.equal(result, 'foo');
      assert.equal(addRelation.callCount, 1);
      assert.deepEqual(
          addRelation.lastCall.args,
          ['bar:baz', 'bax:qux', true]);
    });

    it('calls addRelation in loop if endpoints are one-many', function() {
      var addRelation = sinon.stub(fakebackend, 'addRelation');
      addRelation.onFirstCall().returns('foo');
      addRelation.onSecondCall().returns('bar');
      var result = fakebackend.addRelations(
          'bar:baz', ['bax:qux', 'foo:bar'], true);
      assert.deepEqual(result, ['foo', 'bar']);
      assert.equal(addRelation.callCount, 2);
      assert.deepEqual(
          addRelation.args[0],
          ['bar:baz', 'bax:qux', true]);
      assert.deepEqual(
          addRelation.args[1],
          ['bar:baz', 'foo:bar', true]);

    });
  });

  describe('FakeBackend.removeRelation', function() {
    var requires = [
      'node', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var factory, fakebackend;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    function createAndRemoveRelation(charms, relation,
        removeRelation, mock, done) {
      fakebackend.deploy(charms[0], function() {
        fakebackend.deploy(charms[1], function() {
          fakebackend.addRelation.apply(fakebackend, relation);
          var result = fakebackend.removeRelation.apply(
              fakebackend, removeRelation);

          assert.equal(result.error, mock.error);
          assert.equal(typeof result, 'object');
          done();
        });
      });
    }

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Please log in.');
    });

    it('requires two string endpoint names', function() {
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Two string endpoint names' +
              ' required to establish a relation');
    });

    it('removes a relation when supplied with two string endpoints',
        function(done) {
          createAndRemoveRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['wordpress:db', 'mysql:db'],
              ['wordpress:db', 'mysql:db'],
              {},
              done);
        });

    it('removes a relation when supplied with two string endpoints (reverse)',
        function(done) {
          createAndRemoveRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['wordpress:db', 'mysql:db'],
              ['mysql:db', 'wordpress:db'],
              {},
              done);
        });

    it('removes a relation when supplied with two different string endpoints',
        function(done) {
          createAndRemoveRelation(
              ['cs:mediawiki', 'cs:haproxy'],
              ['mediawiki:website', 'haproxy:reverseproxy'],
              ['mediawiki:website', 'haproxy:reverseproxy'],
              {},
              done);
        });

    it('removes a relation when supplied with two different string endpoints',
        function(done) {
          createAndRemoveRelation(
              ['cs:mediawiki', 'cs:haproxy'],
              ['mediawiki:website', 'haproxy:reverseproxy'],
              ['haproxy:reverseproxy', 'mediawiki:website'],
              {},
              done);
        });

    it('throws an error if the charms do not exist', function(done) {
      createAndRemoveRelation(
          ['cs:mediawiki', 'cs:haproxy'],
          ['mediawiki:website', 'haproxy:reverseproxy'],
          ['wordpress:db', 'mysql:db'],
          {error: 'Charm not loaded.'},
          done);
    });

    it('throws an error if the relationship does not exist', function(done) {
      createAndRemoveRelation(
          ['cs:wordpress', 'cs:mysql'],
          ['wordpress:db', 'mysql:db'],
          ['wordpress:bar', 'mysql:baz'],
          {error: 'Relationship does not exist'},
          done);
    });

  });

  describe('FakeBackend: events handling', function() {
    var environmentsModule, fakebackend;
    var requirements = ['juju-env-fakebackend'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    describe('FakeBackend events handling', function() {

      it('has the ability to create an error event', function() {
        var evt = fakebackend._createErrorEvent('bad wolf');
        var expectedEvt = {
          type: 'error',
          target: {responseText: {Error: 'bad wolf'}, status: 400}
        };
        assert.deepEqual(evt, expectedEvt);
      });

      it('has the ability to create an customized error event', function() {
        var evt = fakebackend._createErrorEvent('bad wolf', 'load', 401);
        var expectedEvt = {
          type: 'load',
          target: {responseText: {Error: 'bad wolf'}, status: 401}
        };
        assert.deepEqual(evt, expectedEvt);
      });

      it('has the ability to create a successful event', function() {
        var evt = fakebackend._createSuccessEvent('yay');
        var expectedEvt = {target: {responseText: 'yay', status: 200}};
        assert.deepEqual(evt, expectedEvt);
      });

    });

  });

  describe('FakeBackend.handleUploadLocalCharm', function() {
    var completedCallback, environmentsModule, fakebackend, mockGetEntries,
        ziputils;
    var requirements = [
      'node', 'juju-env-fakebackend', 'zip-utils'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        ziputils = Y.namespace('juju.ziputils');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend();
      // Set up the ziputils.getEntries and the completedCallback mocks.
      mockGetEntries = sinon.stub(ziputils, 'getEntries');
      this._cleanups.push(mockGetEntries.restore);
      completedCallback = sinon.stub();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    // Return an dict mapping arg names to arguments used to call the
    // ziputils.getEntries mock object.
    var retrieveGetEntriesArgs = function() {
      assert.strictEqual(mockGetEntries.callCount, 1);
      var args = mockGetEntries.lastCall.args;
      assert.strictEqual(args.length, 3);
      return {file: args[0], callback: args[1], errback: args[2]};
    };

    // Create and return a mock entry file object.
    var makeEntry = function(name) {
      return {directory: false, filename: name};
    };

    it('calls ziputils.getEntries passing the proper args', function() {
      fakebackend.handleUploadLocalCharm(
          'a file object', 'trusty', completedCallback);
      // Ensure ziputils.getEntries has been called passing the file object,
      // a callback function and an errback function.
      var args = retrieveGetEntriesArgs();
      assert.strictEqual(args.file, 'a file object');
      assert.strictEqual(typeof args.callback, 'function');
      assert.strictEqual(typeof args.errback, 'function');
    });

    it('uses the zip helpers to read the zip entries', function() {
      fakebackend.handleUploadLocalCharm(
          'a file object', 'trusty', completedCallback);
      var configEntry = makeEntry('config.yaml');
      var metadataEntry = makeEntry('metadata.yaml');
      var expectedEntries = {
        config: configEntry,
        metadata: metadataEntry
      };
      // Patch the ziputils.readCharmEntries function.
      var mockReadCharmEntries = sinon.stub(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.restore);
      // Call the callback passed to ziputils.getEntries.
      var callback = retrieveGetEntriesArgs().callback;
      callback([configEntry, metadataEntry]);
      // Ensure readCharmEntries has been called passing the entries and a
      // callback.
      assert.strictEqual(mockReadCharmEntries.callCount, 1);
      var readCharmEntriesArgs = mockReadCharmEntries.lastCall.args;
      assert.strictEqual(readCharmEntriesArgs.length, 2);
      assert.deepEqual(readCharmEntriesArgs[0], expectedEntries);
      assert.strictEqual(typeof readCharmEntriesArgs[1], 'function');
    });

    it('filters the entries', function() {
      fakebackend.handleUploadLocalCharm(
          'a file object', 'trusty', completedCallback);
      var configEntry = makeEntry('config.yaml');
      var metadataEntry = makeEntry('metadata.yaml');
      var allEntries = [
        makeEntry('another-file.yaml'),
        configEntry,
        makeEntry('extraneous.yaml'),
        metadataEntry
      ];
      var expectedEntries = {
        config: configEntry,
        metadata: metadataEntry
      };
      // Patch the ziputils.readCharmEntries function.
      var mockReadCharmEntries = sinon.stub(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.restore);
      // Call the callback passed to ziputils.getEntries.
      var callback = retrieveGetEntriesArgs().callback;
      callback(allEntries);
      // Ensure readCharmEntries has been called passing only the required
      // entries.
      var entries = mockReadCharmEntries.lastCall.args[0];
      assert.deepEqual(entries, expectedEntries);
    });

    it('returns an error if the required entries are not found', function() {
      fakebackend.handleUploadLocalCharm(
          'a file object', 'trusty', completedCallback);
      // Patch the ziputils.readCharmEntries function.
      var mockReadCharmEntries = sinon.stub(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.restore);
      // Call the callback passed to ziputils.getEntries.
      var callback = retrieveGetEntriesArgs().callback;
      callback([makeEntry('config.yaml')]);
      // Ensure readCharmEntries has not been called.
      assert.strictEqual(mockReadCharmEntries.callCount, 0);
      // The completedCallback has been called passing an error.
      assert.strictEqual(completedCallback.callCount, 1);
      var completedCallbackArgs = completedCallback.lastCall.args;
      assert.strictEqual(completedCallbackArgs.length, 1);
      var evt = completedCallbackArgs[0];
      assert.strictEqual(evt.type, 'error');
      assert.strictEqual(
          evt.target.responseText.Error,
          'Invalid charm archive: missing metadata.yaml');
    });

    it('passes a suitable errback to ziputils.getEntries', function() {
      fakebackend.handleUploadLocalCharm(
          'a file object', 'trusty', completedCallback);
      // Patch the ziputils.readCharmEntries function.
      var mockReadCharmEntries = sinon.stub(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.restore);
      // Call the errback passed to ziputils.getEntries.
      var errback = retrieveGetEntriesArgs().errback;
      errback('bad wolf');
      // The completedCallback has been called passing an error.
      assert.strictEqual(completedCallback.callCount, 1);
      var completedCallbackArgs = completedCallback.lastCall.args;
      assert.strictEqual(completedCallbackArgs.length, 1);
      var evt = completedCallbackArgs[0];
      assert.strictEqual(evt.type, 'error');
      assert.strictEqual(evt.target.responseText.Error, 'bad wolf');
    });

  });

  describe('FakeBackend._handleLocalCharmEntries', function() {
    var callback, environmentsModule, errback, fakebackend;
    var requirements = ['js-yaml', 'juju-env-fakebackend'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend();
      // Set up the callback and errback mocks.
      callback = sinon.stub();
      errback = sinon.stub();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    // Create and return a charm's metadata object.
    var makeMetadata = function(name) {
      var metadata = {
        name: name || 'mycharm',
        summary: 'charm summary',
        description: 'charm description'
      };
      return jsyaml.dump(metadata);
    };

    it('returns an error if the metadata is not a valid YAML', function() {
      var contents = {metadata: '{'};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(errback.callCount, 1);
      var errbackArgs = errback.lastCall.args;
      assert.strictEqual(errbackArgs.length, 1);
      var expectedErr = 'Invalid charm archive: invalid metadata: JS-YAML:';
      assert.strictEqual(errbackArgs[0].indexOf(expectedErr), 0);
      // The callback has not been called.
      assert.strictEqual(callback.callCount, 0);
      // No new charm has been added to the db.
      assert.strictEqual(fakebackend.db.charms.size(), 0);
    });

    it('returns an error if the metadata is not valid', function() {
      var contents = {metadata: '{}'};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(errback.callCount, 1);
      var errbackArgs = errback.lastCall.args;
      assert.strictEqual(errbackArgs.length, 1);
      assert.strictEqual(
          errbackArgs[0],
          'Invalid charm archive: invalid metadata: ' +
          'missing name, missing summary, missing description');
      // The callback has not been called.
      assert.strictEqual(callback.callCount, 0);
      // No new charm has been added to the db.
      assert.strictEqual(fakebackend.db.charms.size(), 0);
    });

    it('returns an error if the config is not a valid YAML', function() {
      var contents = {metadata: makeMetadata(), config: '{'};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(errback.callCount, 1);
      var errbackArgs = errback.lastCall.args;
      assert.strictEqual(errbackArgs.length, 1);
      var expectedErr = 'Invalid charm archive: invalid options: JS-YAML:';
      assert.strictEqual(errbackArgs[0].indexOf(expectedErr), 0);
      // The callback has not been called.
      assert.strictEqual(callback.callCount, 0);
      // No new charm has been added to the db.
      assert.strictEqual(fakebackend.db.charms.size(), 0);
    });

    it('adds a new charm in the db', function() {
      var contents = {metadata: makeMetadata()};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(fakebackend.db.charms.size(), 1);
      // The errback has not been called.
      assert.strictEqual(errback.callCount, 0);
    });

    it('calls the callback passing the newly created charm URL', function() {
      var contents = {metadata: makeMetadata()};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(callback.callCount, 1);
      var callbackArgs = callback.lastCall.args;
      assert.strictEqual(callbackArgs.length, 1);
      var expectedEvt = fakebackend._createSuccessEvent(
          '{"CharmURL":"local:trusty/mycharm-0"}');
      assert.deepEqual(callbackArgs[0], expectedEvt);
      // The errback has not been called.
      assert.strictEqual(errback.callCount, 0);
    });

  });

  describe('FakeBackend.handleLocalCharmFileRequest', function() {
    var callback, environmentsModule, fakebackend;
    var requirements = ['juju-env-fakebackend'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend();
      // Set up the callback mock.
      callback = sinon.stub();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('sends an error response if the local charm is not found', function() {
      fakebackend.handleLocalCharmFileRequest(
          'local:trusty/rails-42', null, callback);
      // The callback has been called.
      assert.strictEqual(callback.callCount, 1);
      var lastArguments = callback.lastCall.args;
      assert.lengthOf(lastArguments, 1);
      // An error event has been sent.
      var evt = lastArguments[0];
      var expectedEvt = {
        type: 'load',
        target: {
          responseText: {Error: 'unable to retrieve and save the charm: ' +
                'charm not found in the provider storage'},
          status: 400
        }
      };
      assert.deepEqual(evt, expectedEvt);
    });

    it('sends an 404 response if a file content is requested', function() {
      // XXX frankban 2014-04-11: this test must be changed when local charm
      // contents handling in sandbox mode is improved.
      fakebackend.db.charms.add({id: 'local:trusty/rails-42'});
      fakebackend.handleLocalCharmFileRequest(
          'local:trusty/rails-42', 'hooks/install', callback);
      // The callback has been called.
      assert.strictEqual(callback.callCount, 1);
      var lastArguments = callback.lastCall.args;
      assert.lengthOf(lastArguments, 1);
      // An error event has been sent.
      var evt = lastArguments[0];
      var expectedEvt = {
        type: 'load',
        target: {responseText: {Error: 'page not found'}, status: 404}
      };
      assert.deepEqual(evt, expectedEvt);
    });

    it('sends the list of files included in the local charm', function() {
      // XXX frankban 2014-04-11: this test must be changed when local charm
      // contents handling in sandbox mode is improved.
      fakebackend.db.charms.add({id: 'local:trusty/rails-42'});
      fakebackend.handleLocalCharmFileRequest(
          'local:trusty/rails-42', null, callback);
      // The callback has been called.
      assert.strictEqual(callback.callCount, 1);
      var lastArguments = callback.lastCall.args;
      assert.lengthOf(lastArguments, 1);
      // An empty list has been sent.
      var evt = lastArguments[0];
      var expectedEvt = {
        target: {responseText: '{"Files":[]}', status: 200}
      };
      assert.deepEqual(evt, expectedEvt);
    });

  });

  describe('FakeBackend.getLocalCharmFileUrl', function() {
    var environmentsModule, fakebackend;
    var requirements = ['juju-env-fakebackend'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend({
        // Create a mock store object.
        store: {
          get: function(attr) {
            if (attr === 'apiHost') {
              return 'https://charmworld.example.com';
            }
          }
        }
      });
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('returns the default icon path', function() {
      var url = fakebackend.getLocalCharmFileUrl(
          'local:trusty/django-42', 'icon.svg');
      assert.strictEqual(
          url, '/static/gui/build/app/assets/images/non-sprites/charm_160.svg');
    });

    it('prints a console error if other files are requested', function() {
      // Patch the console.error method.
      var mockError = sinon.stub(console, 'error');
      // Make a POST request to an unexpected URL.
      fakebackend.getLocalCharmFileUrl('local:trusty/django-42', 'readme');
      mockError.restore();
      // An error has been printed to the console.
      assert.strictEqual(mockError.callCount, 1);
      var lastArguments = mockError.lastCall.args;
      assert.lengthOf(lastArguments, 1);
      assert.strictEqual(
          'unexpected getLocalCharmFileUrl request for readme',
          lastArguments[0]);
    });

  });

  describe('FakeBackend\'s Application.Deploy', function() {
    var requires = ['node', 'juju-env-fakebackend',
      'juju-gui', 'juju-tests-factory'];
    var juju, environments, factory, sandbox, state, conn, env;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        sandbox = Y.namespace('juju.environments.sandbox');
        environments = Y.namespace('juju.environments');
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      state = factory.makeFakeBackend();
      juju = new sandbox.GoJujuAPI({state: state});
      conn = new sandbox.ClientConnection({juju: juju});
      env = new environments.GoEnvironment({conn: conn});
    });

    afterEach(function() {
      // We need to clear any credentials stored in sessionStorage.
      env.setCredentials(null);
      env.destroy();
      conn.destroy();
      juju.destroy();
      state.destroy();
    });

    it('will assign two applications to the same machine', function(done) {
      state._getUnitMachines(99);
      state.deploy('cs:precise/wordpress-27', function() {
        var result;
        result = state.addUnit('wordpress', 1, '47');
        assert.isUndefined(result.error);
        result = state.addUnit('wordpress', 1, '47');
        assert.isUndefined(result.error);
        done();
      });
    });

  });
})();
