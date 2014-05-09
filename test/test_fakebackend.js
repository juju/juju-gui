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
    var Y, environmentsModule, fakebackend;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
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
      assert.equal(fakebackend.login('admin', 'password'), true);
      assert.equal(fakebackend.get('authenticated'), true);
    });

    it('refuses to authenticate', function() {
      fakebackend = new environmentsModule.FakeBackend();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.equal(fakebackend.login('admin', 'not my password'), false);
      assert.equal(fakebackend.get('authenticated'), false);
    });
  });

  describe('FakeBackend.tokenlogin', function() {
    var requires = ['node', 'juju-env-fakebackend'];
    var Y, environmentsModule, fakebackend;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
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
          fakebackend.tokenlogin('demoToken'), ['admin', 'password']);
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
    var Y, factory, fakebackend, utils, result, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        factory = Y.namespace('juju-tests.factory');
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
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.equal(result.error, 'Please log in.');
    });

    it('rejects poorly formed charm ids', function() {
      fakebackend.deploy('shazam!!!!!!', callback);
      assert.equal(result.error, 'Invalid charm id: shazam!!!!!!');
    });

    it('deploys a charm', function() {
      // Defaults service name to charm name; defaults unit count to 1.
      assert.isNull(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'));
      assert.isUndefined(
          fakebackend.deploy('cs:precise/wordpress-15', callback),
          'Fakebackend deploy returned something when undefined was expected.');
      assert.isUndefined(
          result.error,
          'result.error was something when undefined was expected.');
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'),
          'Fakebackend returned null when a charm was expected.');
      var service = fakebackend.db.services.getById('wordpress');
      assert.isObject(
          service,
          'Null returend when a service was expected.');
      assert.strictEqual(service, result.service);
      var attrs = service.getAttrs();
      // clientId varies.
      assert.isTrue(Y.Lang.isString(attrs.clientId));
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
        charm: 'cs:precise/wordpress-15',
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
        upgrade_available: false,
        upgrade_to: undefined,
        packageName: 'wordpress'
      };

      // Assert some key properties
      assert.equal(attrs.id, expectedAttrs.id);
      assert.equal(attrs.charm, expectedAttrs.charm);
      assert.deepEqual(attrs.config, expectedAttrs.config);
      assert.deepEqual(attrs.annotations, expectedAttrs.annotations);
      var units = service.get('units').toArray();
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
          fakebackend.db.charms.getById('cs:precise/wordpress-15'));
      fakebackend.deploy('cs:precise/wordpress-15', callback, options);
      var service = fakebackend.db.services.getById('wordpress');
      assert.isObject(
          service,
          'Null returend when a service was expected.');
      assert.strictEqual(service, result.service);
      var attrs = service.getAttrs();
      var deployedConstraints = attrs.constraints;
      assert.deepEqual(
          options.constraints,
          deployedConstraints
      );
    });

    it('rejects names that duplicate an existing service', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(result.error);
      // The service name is provided explicitly.
      fakebackend.deploy(
          'cs:precise/haproxy-18', callback, {name: 'wordpress'});
      assert.equal(result.error,
          'A service with this name already exists (wordpress).');
      // The service name is derived from charm.
      result = undefined;
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.equal(result.error,
          'A service with this name already exists (wordpress).');
    });

    it('reuses already-loaded charms with the same explicit id.', function() {
      fakebackend._loadCharm('cs:precise/wordpress-15');
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'));
      fakebackend.set('store', undefined);
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(result.error);
      assert.isObject(result.service);
      assert.equal(result.service.get('charm'), 'cs:precise/wordpress-15');
    });

    it('reuses already-loaded charms with the same id.', function() {
      fakebackend._loadCharm('cs:precise/wordpress-15');
      var charm = fakebackend.db.charms.getById('cs:precise/wordpress-15');
      assert.equal(fakebackend.db.charms.size(), 1);
      // The charm data shows that this is not a subordinate charm.  We will
      // change this in the db, to show that the db data is used within the
      // deploy code.
      assert.isFalse(charm.get('is_subordinate'));
      // The _set forces a change to a writeOnly attribute.
      charm._set('is_subordinate', true);
      fakebackend.deploy('cs:precise/wordpress-15', callback, {unitCount: 0});
      assert.isUndefined(result.error);
      assert.strictEqual(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'), charm);
      assert.equal(fakebackend.db.charms.size(), 1);
      assert.equal(result.service.get('charm'), 'cs:precise/wordpress-15');
      // This is the clearest indication that we used the db version, as
      // opposed to the api version, per the comments above.
      assert.isTrue(result.service.get('subordinate'));
    });

    it('accepts a config.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15', callback, {config: {engine: 'apache'}});
      assert.deepEqual(result.service.get('config'), {
        debug: 'no',
        engine: 'apache',
        tuning: 'single',
        'wp-content': ''
      });
    });

    it('deploys a charm with no config options', function(done) {
      // Charms that don't specify options would previously
      // not deploy properly as the code path expected them
      // to exist.
      fakebackend.promiseDeploy('cs:precise/puppetmaster-4')
      .then(function(result) {
            var service = fakebackend.db.services.getById('puppetmaster');
            assert.isObject(
                service,
                'Null returend when a service was expected.');
            assert.strictEqual(service, result.service);
            done();
          });
    });


    it('deploys multiple units.', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback, {unitCount: 3});
      var units = result.service.get('units').toArray();
      assert.lengthOf(units, 3);
      assert.lengthOf(result.units, 3);
      assert.deepEqual(units, result.units);
    });

    it('reports when the API is inaccessible.', function() {
      fakebackend.get('store').charm = function(path, callbacks, bindscope) {
        callbacks.failure({boo: 'hiss'});
      };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.equal(result.error, 'Error interacting with the charmworld API.');
    });

    it('honors the optional service name', function() {
      assert.isUndefined(
          fakebackend.deploy(
              'cs:precise/wordpress-15', callback, {name: 'kumquat'}));
      assert.equal(result.service.get('id'), 'kumquat');
    });

    it('prefers config YAML to config.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15',
          callback,
          {config: {funny: 'business'}, configYAML: 'engine: apache'});
      assert.deepEqual(result.service.get('config'), {
        debug: 'no',
        engine: 'apache',
        tuning: 'single',
        'wp-content': ''
      });
    });

    it('rejects a non-string configYAML', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback, {configYAML: {}});
      assert.equal(
          result.error, 'Developer error: configYAML is not a string.');
    });

    it('accepts a YAML config string.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15',
          callback,
          {configYAML: utils.loadFixture('data/mysql-config.yaml')});
      assert.isObject(result.service.get('config'));
      assert.equal(result.service.get('config').tuning, 'super bad');
    });

    it('rejects unparseable YAML config string.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15',
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
      fakebackend.deploy('cs:precise/wordpress-15', callback, options);
      var service = fakebackend.db.services.getById('wordpress');
      assert.deepEqual(
          options.annotations,
          service.get('annotations')
      );
      var changes = fakebackend.nextAnnotations();
      assert.deepEqual(changes.services, {wordpress: service});
    });
  });

  describe('FakeBackend._getHardwareCharacteristics', function() {
    var factory, fakebackend, Y;
    var requirements = ['juju-tests-factory'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
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
    var factory, fakebackend, machines, Y;
    var requirements = ['juju-tests-factory'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
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
    var factory, fakebackend, machines, machinesCount, Y;
    var requirements = ['juju-tests-factory'];
    var defaultHardware = {
      arch: 'amd64',
      cpuCores: 1,
      cpuPower: 100,
      mem: 1740,
      disk: 8192
    };

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
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
    var factory, fakebackend, machines, Y;
    var requirements = ['juju-tests-factory'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
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
      // Add an initial service and unit.
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
      // Add an initial service and unit.
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
      // Add an initial service and unit.
      var units = addUnit('1');
      var response = fakebackend.destroyMachines(['1'], true);
      assert.isUndefined(response.error);
      // Ensure the machine and the unit have been removed.
      assert.isNull(machines.getById('1'));
      assert.isNull(units.getById('django/0'));
    });

    it('forces removal of containers hosting units', function() {
      // Add an initial service and unit.
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
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];

    var Y, factory, fakebackend, utils, result, callback, service;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      service = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('sets a charm.', function() {
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-8', false,
          callback);
      assert.isUndefined(result.error);
      assert.equal(service.get('charm'), 'cs:precise/mediawiki-8');
    });

    it('fails when the service does not exist', function() {
      fakebackend.setCharm('nope', 'nuh-uh', false, callback);
      assert.equal(result.error, 'Service "nope" not found.');
      assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
    });

    it('fails if a service is in error without force.', function() {
      fakebackend.db.services.getById('wordpress').get('units')
      .each(function(unit) {
            unit.agent_state = 'error';
          });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-8', false,
          callback);
      assert.equal(result.error, 'Cannot set charm on a service with units ' +
          'in error without the force flag.');
      assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
    });

    it('succeeds if a service is in error with force.', function() {
      fakebackend.db.services.each(function(service) {
        service.get('units').each(function(unit) {
          unit.agent_state = 'error';
        });
      });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-8', true,
                           callback);
      assert.isUndefined(result.error);
      assert.equal(service.get('charm'), 'cs:precise/mediawiki-8');
    });
  });

  describe('FakeBackend.expose', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils, result, callback, service;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      service = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.expose('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('exposes a service', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(service.get('exposed'));
      assert.isUndefined(result.error);
      assert.isUndefined(result.warning);
    });

    it('errors on invalid service', function() {
      var result = fakebackend.expose('Je ne suis pas un service');
      assert.equal(
          '"Je ne suis pas un service" is an invalid service name.',
          result.error);
      assert.isUndefined(result.warning);
    });

    it('warns if a service is already exposed', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(service.get('exposed'));
      result = fakebackend.expose('wordpress');
      assert.isUndefined(result.error);
      assert.equal(
          'Service "wordpress" was already exposed.',
          result.warning);
    });
  });

  describe('FakeBackend.unexpose', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils, result, callback, service;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      service = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.unexpose('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('unexposes a service', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(service.get('exposed'));
      result = fakebackend.unexpose('wordpress');
      assert.isFalse(service.get('exposed'));
      assert.isUndefined(result.error);
      assert.isUndefined(result.warning);
    });

    it('errors on invalid service', function() {
      var result = fakebackend.unexpose('Je ne suis pas un service');
      assert.equal(
          '"Je ne suis pas un service" is an invalid service name.',
          result.error);
      assert.isUndefined(result.warning);
    });

    it('warns if a service is already unexposed', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.unexpose('wordpress');
      assert.isFalse(service.get('exposed'));
      assert.isUndefined(result.error);
      assert.equal(
          'Service "wordpress" is not exposed.',
          result.warning);
    });
  });

  describe('FakeBackend deployer support', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = factory.makeFakeBackend();
    });

    afterEach(function() {
      if (fakebackend) {
        fakebackend.destroy();
      }
    });

    it('should support YAML imports', function(done) {
      var fakebackend = factory.makeFakeBackend();
      var db = fakebackend.db;
      db.environment.set('defaultSeries', 'precise');
      var YAMLData = utils.loadFixture('data/wp-deployer.yaml');

      fakebackend.importDeployer(YAMLData, undefined, function(result) {
        assert.equal(result.Error, undefined);
        assert.equal(result.DeploymentId, 1,
                     'deployment id incorrect');
        assert.isNotNull(fakebackend.db.services.getById('wordpress'),
                         'failed to import wordpress');
        assert.isNotNull(fakebackend.db.services.getById('mysql'),
                         'failed to import mysql');
        assert.equal(fakebackend.db.relations.size(), 1,
                     'failed to import relations');
        // Verify units created.
        assert.equal(fakebackend.db.services.getById('wordpress')
                     .get('units').size(), 2,
                     'Unit count wrong');

        // Verify config.
        var wordpress = fakebackend.db.services.getById('wordpress');
        var wordpressCharm = fakebackend.db.charms.getById(
            'cs:precise/wordpress-15');
        var mysql = fakebackend.db.services.getById('mysql');
        // This value is different from the default (nginx).
        assert.equal(wordpressCharm.get('options.engine.default'), 'nginx');
        assert.equal(wordpress.get('config.engine'), 'apache');
        // This value is the default, as provided by the charm.
        assert.equal(wordpress.get('config.tuning'), 'single');
        assert.isTrue(wordpress.get('exposed'));
        assert.isFalse(mysql.get('exposed'));

        // Constraints
        var constraints = mysql.get('constraints');
        assert.equal(constraints['cpu-power'], '2', 'wrong cpu power');
        assert.equal(constraints['cpu-cores'], '4', 'wrong cpu cores');
        done();
      });
    });

    it('should support old-style comma-separated constraints',
        function(done) {

          var fakebackend = factory.makeFakeBackend();
          var db = fakebackend.db;
          db.environment.set('defaultSeries', 'precise');
          var YAMLData = utils.loadFixture('data/wp-deployer-commas.yaml');

          fakebackend.importDeployer(YAMLData, undefined, function(result) {
            assert.equal(result.Error, undefined);
            var mysql = fakebackend.db.services.getById('mysql');
            // Constraints
            var constraints = mysql.get('constraints');
            assert.equal(constraints['cpu-power'], '2', 'wrong cpu power');
            assert.equal(constraints['cpu-cores'], '4', 'wrong cpu cores');
            done();
          });
        }
    );

    it('should support mixed comma and space constraints',
        function(done) {
          var fakebackend = factory.makeFakeBackend();
          var db = fakebackend.db;
          db.environment.set('defaultSeries', 'precise');
          var YAMLData = utils.loadFixture('data/mysql-deployer-mixed.yaml');

          fakebackend.importDeployer(YAMLData, undefined, function(result) {
            assert.equal(result.Error, undefined);
            var mysql = fakebackend.db.services.getById('mysql');
            // Constraints
            var constraints = mysql.get('constraints');
            assert.equal(constraints['cpu-power'], '2', 'wrong cpu power');
            assert.equal(constraints['cpu-cores'], '4', 'wrong cpu cores');
            assert.equal(constraints.mem, '10', 'wrong mem');
            done();
          });
        }
    );

    it('should stop importing if service names conflict', function(done) {
      var fakebackend = factory.makeFakeBackend();
      // If there is a problem within the promises `done` will be called
      // at the end of each promise chain with the error.
      utils.promiseImport('data/wp-deployer.yaml', null, fakebackend)
      .then(function() {
            utils.promiseImport('data/wp-deployer.yaml', null, fakebackend)
            .then(function(resolve) {
                  assert.equal(resolve.result.error,
                      'wordpress is already present in the database.' +
                      ' Change service name and try again.');
                  assert.equal(resolve.backend.db.services.size(), 2,
                      'There should only be two services in the database');
                  done();
                }).then(null, done);
          }).then(null, done);
    });

    it('should provide status of imports', function(done) {
      utils.promiseImport(
          'data/wp-deployer.yaml',
          undefined,
          factory.makeFakeBackend()
      ).then(function(resolve) {
        fakebackend = resolve.backend;
        fakebackend.statusDeployer(function(status) {
          assert.lengthOf(status.LastChanges, 1);
          assert.equal(status.LastChanges[0].Status, 'completed');
          assert.equal(status.LastChanges[0].DeploymentId, 1);
          assert.isNumber(status.LastChanges[0].Timestamp);
          done();
        });
      });
    });

    it('throws an error with more than one import target', function() {
      fakebackend = factory.makeFakeBackend();
      assert.throws(function() {
        fakebackend.importDeployer({a: {}, b: {}});
      }, 'Import target ambigious, aborting.');
    });

    it('detects service id collisions', function(done) {
      fakebackend = factory.makeFakeBackend();
      fakebackend.db.services.add({id: 'mysql', charm: 'cs:precise/mysql-26'});
      var data = {
        a: {services: {mysql: {
          charm: 'cs:precise/mysql-26',
          num_units: 2, options: {debug: false}}}}
      };
      fakebackend.importDeployer(data, null, function(data) {
        assert.equal(data.error, 'mysql is already present in the database.' +
            ' Change service name and try again.');
        done();
      });
    });

    it('properly implements inheritence in target definitions', function(done) {
      fakebackend = factory.makeFakeBackend();
      var data = {
        a: {services: {mysql: {charm: 'cs:precise/mysql-26',
          num_units: 2, options: {debug: false}}}},
        b: {inherits: 'a', services: {mysql: {num_units: 5,
          options: {debug: true}}}},
        c: {inherits: 'b', services: {mysql: {num_units: 3 }}},
        d: {inherits: 'z', services: {mysql: {num_units: 3 }}}
      };


      // No 'z' available.
      assert.throws(function() {
        fakebackend.importDeployer(data, 'd');
      }, 'Unable to resolve bundle inheritence.');

      fakebackend.promiseImport(data, 'c')
        .then(function() {
            // Insure that we inherit the debug options from 'b'
            var mysql = fakebackend.db.services.getById('mysql');
            assert.isNotNull(mysql);
            var config = mysql.get('config');
            assert.equal(config['block-size'], 5);
            done();
          });
    });

    it('properly builds relations on import', function(done) {
      fakebackend = factory.makeFakeBackend();
      var data = {
        a: {
          services: {
            mysql: {
              charm: 'cs:precise/mysql-26',
              num_units: 2, options: {debug: false}},
            wordpress: {
              charm: 'cs:precise/wordpress-15',
              num_units: 1
            }},
          relations: [['mysql', 'wordpress']]
        }};

      fakebackend.promiseImport(data, undefined, factory.makeFakeBackend())
          .then(function() {
            var mysql = fakebackend.db.services.getById('mysql');
            var wordpress = fakebackend.db.services.getById('wordpress');
            assert.isNotNull(mysql);
            assert.isNotNull(wordpress);

            var rel = fakebackend.db.relations.item(0);
            var ep = rel.get('endpoints');
            // Validate we got the proper interfaces
            assert.equal(ep[0][0], 'wordpress');
            assert.equal(ep[0][1].name, 'db');
            assert.equal(ep[1][0], 'mysql');
            assert.equal(ep[1][1].name, 'db');
            assert.isFalse(rel.get('pending'));
            done();
          }).then(undefined, function(e) {done(e);});
    });

    it('should support finding charms through a search', function(done) {
      // Use import to import many charms and then resolve them with a few
      // different keys.
      var defaultSeries = 'precise';
      utils.promiseImport(
          'data/blog.yaml',
          'wordpress-prod',
          factory.makeFakeBackend()
      ).then(function(resolve) {
        var db = resolve.backend.db;
        assert.isNotNull(db.charms.find('wordpress', defaultSeries));
        assert.isNotNull(db.charms.find('precise/wordpress',
                                        defaultSeries));
        assert.isNotNull(db.charms.find('precise/wordpress'));
        assert.isNotNull(db.charms.find('cs:precise/wordpress'));
        assert.isNotNull(db.charms.find('cs:precise/wordpress-999'));
        // Can't find this w/o a series
        assert.isNull(db.charms.find('wordpress'));
        // Find fails on missing items as well.
        assert.isNull(db.charms.find('foo'));
        assert.isNull(db.charms.find('foo', defaultSeries));
        done();
      }).then(undefined, done);
    });

    it('should ignore calls to the deployer watcher', function(done) {
      // This is no op'd in the fakebackend since it doesn't make sense to
      // provide a watch status as things happen nearly instantly.
      fakebackend.deployerWatch(10, function(reply) {
        // Should never be called.
        assert.fail('The watcher callback should never be called.');
      });

      done();
    });

    it('should ignore calls to the watcher updater', function(done) {
      // This is no op'd in the fakebackend since it doens't make sense to
      // provide a watch status as things happen nearly instantly.
      fakebackend.deployerWatch(10, function(reply) {
        // Should never be called.
        assert.fail('The watcher update callback should never be called.');
      });
      done();
    });

  });

  describe('FakeBackend.uniformOperations', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
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
        fakebackend.deploy('cs:precise/wordpress-15', function(result) {
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
            'cs:precise/wordpress-15', ERROR('Please log in.', done));
      });

      it('disallows malformed charm names', function(done) {
        fakebackend.getCharm('^invalid',
            ERROR('Invalid charm id: ^invalid', done));
      });

      it('successfully returns valid charms', function(done) {
        fakebackend.getCharm('cs:precise/wordpress-15', function(data) {
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

    describe('FakeBackend.getService', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.getService('cs:precise/wordpress-15');
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing service', function() {
        var result = fakebackend.getService('^invalid');
        assert.equal(result.error, 'Invalid service id: ^invalid');
      });

      it('successfully returns a valid service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          var service = fakebackend.getService('wordpress').result;
          assert.equal(service.name, 'wordpress');
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

      it('returns an error for a missing service', function() {
        var result = fakebackend.setConfig('scaling', {});
        assert.equal(result.error, 'Service \"scaling\" does not exist.');
      });

      it('successfully returns a valid service configuration', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConfig('wordpress', {
            'blog-title': 'Silence is Golden.'});
          var service = fakebackend.getService('wordpress').result;
          var config = service.config;
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

      it('returns an error for a missing service', function() {
        var result = fakebackend.setConstraints('scaling', {});
        assert.equal(result.error, 'Service \"scaling\" does not exist.');
      });

      it('successfully returns a valid constraints', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConstraints('wordpress', {'cpu': '4'});
          var service = fakebackend.getService('wordpress').result;
          var constraints = service.constraints;
          assert.equal(constraints.cpu, '4');
          assert.equal(constraints.mem, undefined);
          done();
        });
      });

      it('successfully returns a valid constraints as array', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConstraints('wordpress', ['cpu=4']);
          var service = fakebackend.getService('wordpress').result;
          var constraints = service.constraints;
          assert.equal(constraints.cpu, '4');
          assert.equal(constraints.mem, undefined);
          done();
        });
      });

      it('converts the tags constraint to a string', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConstraints('wordpress', {'tags': ['tag1', 'tag2']});
          var service = fakebackend.getService('wordpress').result;
          assert.strictEqual(service.constraints.tags, 'tag1,tag2');
          done();
        });
      });

      it('lets new constraints override existing ones', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConstraints(
              'wordpress', {'tags': ['tag1', 'tag2'], mem: 400});
          var service = fakebackend.getService('wordpress').result;
          assert.deepEqual(service.constraints, {tags: 'tag1,tag2', mem: 400});
          done();
        }, {constraints: {mem: 200, 'cpu-cores': 4}});
      });
    });

    describe('FakeBackend.destroyService', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.destroyService('dummy');
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing service', function() {
        var result = fakebackend.destroyService('missing');
        assert.equal('Invalid service id: missing', result.error);
      });

      it('successfully destroys a valid service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function(data) {
          var result = fakebackend.destroyService('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          // Ensure the service can no longer be retrieved.
          result = fakebackend.getService('wordpress');
          assert.equal(result.error, 'Invalid service id: wordpress');
          done();
        });
      });

      it('removes relations when destroying a service', function(done) {
        // Add a couple of services and hook up relations.
        fakebackend.deploy('cs:precise/wordpress-15', function(data) {
          fakebackend.deploy('cs:precise/mysql-26', function() {
            var result = fakebackend.addRelation('wordpress:db', 'mysql:db');
            assert.isUndefined(result.error);
            var mysql = fakebackend.getService('mysql').result;
            assert.lengthOf(mysql.rels, 1);
            // Now destroy one of the services.
            result = fakebackend.destroyService('wordpress').result;
            assert.isUndefined(result.error);
            assert.equal('wordpress', result);
            // Ensure the destroyed service can no longer be retrieved.
            result = fakebackend.getService('wordpress');
            assert.equal(result.error, 'Invalid service id: wordpress');
            // But the other one exists and has no relations.
            mysql = fakebackend.getService('mysql').result;
            assert.lengthOf(mysql.rels, 0);
            done();
          });
        });
      });

      it('removes units when destroying a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function(data) {
          var service = fakebackend.db.services.getById('wordpress');
          var units = service.get('units').toArray();
          assert.lengthOf(units, 1);
          var result = fakebackend.destroyService('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          units = service.get('units').toArray();
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

      it('must get annotations from a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          var service = fakebackend.getService('wordpress').result;
          assert.deepEqual(service.annotations, {});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.deepEqual(anno, {});
          done();
        });
      });

      it('must update annotations to a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
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
        fakebackend.deploy('cs:precise/wordpress-15', function() {
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

      it('must remove annotations from a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
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
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
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
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(deployResult.error);
      assert.equal(
          fakebackend.addUnit('wordpress', 'goyesca').error,
          'Invalid number of units [goyesca] for service: wordpress');
      assert.equal(
          fakebackend.addUnit('wordpress', 0).error,
          'Invalid number of units [0] for service: wordpress');
      assert.equal(
          fakebackend.addUnit('wordpress', -1).error,
          'Invalid number of units [-1] for service: wordpress');
    });

    it('returns error for invalid number of subordinate units', function() {
      fakebackend.deploy('cs:puppet', callback);
      assert.isUndefined(deployResult.error);
      assert.equal(
          fakebackend.addUnit('puppet', 'goyesca').error,
          'Invalid number of units [goyesca] for service: puppet');
      assert.equal(
          fakebackend.addUnit('puppet', 1).error,
          'Invalid number of units [1] for service: puppet');
      assert.equal(
          fakebackend.addUnit('puppet', -1).error,
          'Invalid number of units [-1] for service: puppet');
      // It also ignores empty requests
      assert.isUndefined(
          fakebackend.addUnit('puppet', 0).error);
      assert.isUndefined(
          fakebackend.addUnit('puppet').error);
    });

    it('returns an error if the service does not exist.', function() {
      assert.equal(
          fakebackend.addUnit('foo').error,
          'Service "foo" does not exist.');
    });

    it('defaults to adding just one unit', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          deployResult.service.get('units').toArray(), 1);
      var result = fakebackend.addUnit('wordpress');
      assert.lengthOf(result.units, 1);
      assert.lengthOf(
          deployResult.service.get('units').toArray(), 2);
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
      assert.equal(deployResult.service.get('name'), 'puppet');
      assert.equal(deployResult.units.length, 0);
      assert.equal(deployResult.service.get('units').size(), 0);
    });

    it('adds multiple units', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          deployResult.service.get('units').toArray(), 1);
      var result = fakebackend.addUnit('wordpress', 5);
      assert.lengthOf(result.units, 5);
      assert.lengthOf(deployResult.service.get('units').toArray(), 6);
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
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
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
      fakebackend.deploy('cs:precise/wordpress-15', function() {
        var unitId = 'wordpress/0';
        var mockRemoveUnits = utils.makeStubMethod(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.reset);
        var result = fakebackend.removeUnits(unitId);
        assert.deepEqual(result, {
          error: undefined,
          warning: undefined
        });
        // The db.removeUnits method has been called once.
        assert.strictEqual(mockRemoveUnits.callCount(), 1);
        // The unit to be removed has been passed.
        var args = mockRemoveUnits.lastArguments();
        assert.lengthOf(args, 1);
        assert.strictEqual(args[0].id, unitId);
      });
    });

    it('can remove multiple units', function() {
      // This assumes that the addUnit tests above pass.
      var self = this;
      fakebackend.deploy('cs:precise/wordpress-15', function() {
        var unitIds = ['wordpress/0', 'wordpress/1'];
        var mockRemoveUnits = utils.makeStubMethod(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.reset);
        var result = fakebackend.removeUnits(unitIds);
        assert.deepEqual(result, {
          error: undefined,
          warning: undefined
        });
        // The db.removeUnits method has been called twice.
        assert.strictEqual(mockRemoveUnits.callCount(), 2);
        // The units to be removed have been passed.
        var args = mockRemoveUnits.allArguments();
        assert.strictEqual(args[0][0].id, unitIds[0]);
        assert.strictEqual(args[1][0].id, unitIds[1]);
      }, {unitCount: 2});
    });

    it('returns an error when removing a subordinate', function() {
      // This assumes that the addUnit tests above pass.
      var self = this;
      fakebackend.deploy('cs:precise/wordpress-15', function() {
        // Simulate the service is a subordinate.
        fakebackend.db.services.item(0).set('is_subordinate', true);
        var unitId = 'wordpress/0';
        var mockRemoveUnits = utils.makeStubMethod(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.reset);
        var result = fakebackend.removeUnits(unitId);
        assert.deepEqual(result, {
          error: ['wordpress/0 is a subordinate, cannot remove.'],
          warning: undefined
        });
        // No units have been removed.
        assert.strictEqual(mockRemoveUnits.called(), false);
      });
    });

    it('returns a warning when removing a non existing unit', function() {
      // This assumes that the addUnit tests above pass.
      var self = this;
      fakebackend.deploy('cs:precise/wordpress-15', function() {
        var mockRemoveUnits = utils.makeStubMethod(
            fakebackend.db, 'removeUnits');
        self._cleanups.push(mockRemoveUnits.reset);
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
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
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
        fakebackend.deploy('cs:precise/wordpress-15', callback);
        assert.isUndefined(deployResult.error);
        assert.isObject(fakebackend.nextChanges());
        var result = fakebackend.addUnit('wordpress');
        assert.lengthOf(result.units, 1);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Y.Object.keys(changes.services), 0);
        assert.lengthOf(Y.Object.keys(changes.units), 1);
        assert.lengthOf(Y.Object.keys(changes.machines), 1);
        assert.lengthOf(Y.Object.keys(changes.relations), 0);
        assert.deepEqual(
            changes.units['wordpress/1'], [result.units[0], true]);
        assert.deepEqual(
            changes.machines[result.machines[0].id],
            [result.machines[0], true]);
      });

      it('reports a deploy correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-15', callback);
        assert.isUndefined(deployResult.error);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Y.Object.keys(changes.services), 1);
        assert.deepEqual(
            changes.services.wordpress, [deployResult.service, true]);
        assert.lengthOf(Y.Object.keys(changes.units), 1);
        assert.deepEqual(
            changes.units['wordpress/0'], [deployResult.units[0], true]);
        assert.lengthOf(Y.Object.keys(changes.machines), 1);
        assert.deepEqual(
            changes.machines[deployResult.machines[0].id],
            [deployResult.machines[0], true]);
        assert.lengthOf(Y.Object.keys(changes.relations), 0);
      });

      it('reports a deploy of multiple units correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-15', callback, {unitCount: 5});
        assert.isUndefined(deployResult.error);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Y.Object.keys(changes.services), 1);
        assert.lengthOf(Y.Object.keys(changes.units), 5);
        assert.lengthOf(Y.Object.keys(changes.machines), 5);
        assert.lengthOf(Y.Object.keys(changes.relations), 0);
      });

      it('reports no changes when no changes have occurred.',
          function() {
            fakebackend.deploy('cs:precise/wordpress-15', callback);
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

      it('reports service changes correctly', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.updateAnnotations('wordpress',
                                        {'foo': 'bar', 'gone': 'away'});

          var changes = fakebackend.nextAnnotations();
          assert.deepEqual(changes.services.wordpress,
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
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
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
      fakebackend.deploy('cs:precise/wordpress-15', function() {
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
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a double explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['puppet:juju-info', 'wordpress:juju-info'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['wordpress:db', 'mysql'],
              { type: 'mysql', scope: 'global',
                endpoints:
                    [['wordpress', {name: 'db'}],
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
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (other)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['wordpress', 'puppet:juju-info'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['puppet', 'wordpress:juju-info'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['wordpress:juju-info', 'puppet'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
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
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with an inferred subordinate charm (reverse)',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['puppet', 'wordpress'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

  });

  describe('FakeBackend.removeRelation', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-tests-factory', 'juju-models',
      'juju-charm-models'
    ];
    var Y, factory, fakebackend, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
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
    var environmentsModule, fakebackend, Y;
    var requirements = ['juju-env-fakebackend'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
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
        testUtils, Y, ziputils;
    var requirements = [
      'node', 'juju-env-fakebackend', 'juju-tests-utils', 'zip-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        testUtils = Y.namespace('juju-tests.utils');
        ziputils = Y.namespace('juju.ziputils');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend();
      // Set up the ziputils.getEntries and the completedCallback mocks.
      mockGetEntries = testUtils.makeStubMethod(ziputils, 'getEntries');
      this._cleanups.push(mockGetEntries.reset);
      completedCallback = testUtils.makeStubFunction();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    // Return an dict mapping arg names to arguments used to call the
    // ziputils.getEntries mock object.
    var retrieveGetEntriesArgs = function() {
      assert.strictEqual(mockGetEntries.callCount(), 1);
      var args = mockGetEntries.lastArguments();
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
      var mockReadCharmEntries = testUtils.makeStubMethod(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.reset);
      // Call the callback passed to ziputils.getEntries.
      var callback = retrieveGetEntriesArgs().callback;
      callback([configEntry, metadataEntry]);
      // Ensure readCharmEntries has been called passing the entries and a
      // callback.
      assert.strictEqual(mockReadCharmEntries.callCount(), 1);
      var readCharmEntriesArgs = mockReadCharmEntries.lastArguments();
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
      var mockReadCharmEntries = testUtils.makeStubMethod(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.reset);
      // Call the callback passed to ziputils.getEntries.
      var callback = retrieveGetEntriesArgs().callback;
      callback(allEntries);
      // Ensure readCharmEntries has been called passing only the required
      // entries.
      var entries = mockReadCharmEntries.lastArguments()[0];
      assert.deepEqual(entries, expectedEntries);
    });

    it('returns an error if the required entries are not found', function() {
      fakebackend.handleUploadLocalCharm(
          'a file object', 'trusty', completedCallback);
      // Patch the ziputils.readCharmEntries function.
      var mockReadCharmEntries = testUtils.makeStubMethod(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.reset);
      // Call the callback passed to ziputils.getEntries.
      var callback = retrieveGetEntriesArgs().callback;
      callback([makeEntry('config.yaml')]);
      // Ensure readCharmEntries has not been called.
      assert.strictEqual(mockReadCharmEntries.callCount(), 0);
      // The completedCallback has been called passing an error.
      assert.strictEqual(completedCallback.callCount(), 1);
      var completedCallbackArgs = completedCallback.lastArguments();
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
      var mockReadCharmEntries = testUtils.makeStubMethod(
          ziputils, 'readCharmEntries');
      this._cleanups.push(mockReadCharmEntries.reset);
      // Call the errback passed to ziputils.getEntries.
      var errback = retrieveGetEntriesArgs().errback;
      errback('bad wolf');
      // The completedCallback has been called passing an error.
      assert.strictEqual(completedCallback.callCount(), 1);
      var completedCallbackArgs = completedCallback.lastArguments();
      assert.strictEqual(completedCallbackArgs.length, 1);
      var evt = completedCallbackArgs[0];
      assert.strictEqual(evt.type, 'error');
      assert.strictEqual(evt.target.responseText.Error, 'bad wolf');
    });

  });

  describe('FakeBackend._handleLocalCharmEntries', function() {
    var callback, environmentsModule, errback, fakebackend, testUtils, Y;
    var requirements = ['js-yaml', 'juju-env-fakebackend', 'juju-tests-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend();
      // Set up the callback and errback mocks.
      callback = testUtils.makeStubFunction();
      errback = testUtils.makeStubFunction();
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
      assert.strictEqual(errback.callCount(), 1);
      var errbackArgs = errback.lastArguments();
      assert.strictEqual(errbackArgs.length, 1);
      var expectedErr = 'Invalid charm archive: invalid metadata: JS-YAML:';
      assert.strictEqual(errbackArgs[0].indexOf(expectedErr), 0);
      // The callback has not been called.
      assert.strictEqual(callback.callCount(), 0);
      // No new charm has been added to the db.
      assert.strictEqual(fakebackend.db.charms.size(), 0);
    });

    it('returns an error if the metadata is not valid', function() {
      var contents = {metadata: '{}'};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(errback.callCount(), 1);
      var errbackArgs = errback.lastArguments();
      assert.strictEqual(errbackArgs.length, 1);
      assert.strictEqual(
          errbackArgs[0],
          'Invalid charm archive: invalid metadata: ' +
          'missing name, missing summary, missing description');
      // The callback has not been called.
      assert.strictEqual(callback.callCount(), 0);
      // No new charm has been added to the db.
      assert.strictEqual(fakebackend.db.charms.size(), 0);
    });

    it('returns an error if the config is not a valid YAML', function() {
      var contents = {metadata: makeMetadata(), config: '{'};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(errback.callCount(), 1);
      var errbackArgs = errback.lastArguments();
      assert.strictEqual(errbackArgs.length, 1);
      var expectedErr = 'Invalid charm archive: invalid options: JS-YAML:';
      assert.strictEqual(errbackArgs[0].indexOf(expectedErr), 0);
      // The callback has not been called.
      assert.strictEqual(callback.callCount(), 0);
      // No new charm has been added to the db.
      assert.strictEqual(fakebackend.db.charms.size(), 0);
    });

    it('adds a new charm in the db', function() {
      var contents = {metadata: makeMetadata()};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(fakebackend.db.charms.size(), 1);
      // The errback has not been called.
      assert.strictEqual(errback.callCount(), 0);
    });

    it('calls the callback passing the newly created charm URL', function() {
      var contents = {metadata: makeMetadata()};
      fakebackend._handleLocalCharmEntries(
          contents, 'trusty', callback, errback);
      assert.strictEqual(callback.callCount(), 1);
      var callbackArgs = callback.lastArguments();
      assert.strictEqual(callbackArgs.length, 1);
      var expectedEvt = fakebackend._createSuccessEvent(
          '{"CharmURL":"local:trusty/mycharm-0"}');
      assert.deepEqual(callbackArgs[0], expectedEvt);
      // The errback has not been called.
      assert.strictEqual(errback.callCount(), 0);
    });

  });

  describe('FakeBackend.handleLocalCharmFileRequest', function() {
    var callback, environmentsModule, fakebackend, testUtils, Y;
    var requirements = ['juju-env-fakebackend', 'juju-tests-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      // Instantiate a fake backend.
      fakebackend = new environmentsModule.FakeBackend();
      // Set up the callback mock.
      callback = testUtils.makeStubFunction();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('sends an error response if the local charm is not found', function() {
      fakebackend.handleLocalCharmFileRequest(
          'local:trusty/rails-42', null, callback);
      // The callback has been called.
      assert.strictEqual(callback.callCount(), 1);
      var lastArguments = callback.lastArguments();
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
      assert.strictEqual(callback.callCount(), 1);
      var lastArguments = callback.lastArguments();
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
      assert.strictEqual(callback.callCount(), 1);
      var lastArguments = callback.lastArguments();
      assert.lengthOf(lastArguments, 1);
      // An empty list has been sent.
      var evt = lastArguments[0];
      console.log(evt.target);
      var expectedEvt = {
        target: {responseText: '{"Files":[]}', status: 200}
      };
      assert.deepEqual(evt, expectedEvt);
    });

  });

  describe('FakeBackend.getLocalCharmFileUrl', function() {
    var environmentsModule, fakebackend, testUtils, Y;
    var requirements = ['juju-env-fakebackend', 'juju-tests-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        testUtils = Y.namespace('juju-tests.utils');
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
          url, 'https://charmworld.example.comstatic/img/charm_160.svg');
    });

    it('prints a console error if other files are requested', function() {
      // Patch the console.error method.
      var mockError = testUtils.makeStubMethod(console, 'error');
      // Make a POST request to an unexpected URL.
      fakebackend.getLocalCharmFileUrl('local:trusty/django-42', 'readme');
      mockError.reset();
      // An error has been printed to the console.
      assert.strictEqual(mockError.callCount(), 1);
      var lastArguments = mockError.lastArguments();
      assert.lengthOf(lastArguments, 1);
      assert.strictEqual(
          'unexpected getLocalCharmFileUrl request for readme',
          lastArguments[0]);
    });

  });

  describe('FakeBackend\'s ServiceDeploy', function() {
    var requires = ['node', 'juju-env-fakebackend', 'juju-tests-utils',
      'juju-gui', 'juju-tests-factory'];
    var Y, utils, juju, environments, factory, sandbox, state, conn, env;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        sandbox = Y.namespace('juju.environments.sandbox');
        environments = Y.namespace('juju.environments');
        utils = Y.namespace('juju-tests.utils');
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

    it('can deploy to a specified machine', function(done) {
      conn.get('juju').set('deltaInterval', 50);
      var data = {
        Type: 'AllWatcher',
        Request: 'Next',
        Params: {},
        RequestId: 1067
      };
      // Add a bunch of machines that are not associated with services.
      state._getUnitMachines(10);
      state.deploy('cs:precise/wordpress-15', function() {}, {toMachine: '7'});
      conn.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        // The received data is a response to our AllWatcher request.
        assert.equal(receivedData.RequestId, 1067);
        assert.isNotNull(receivedData.Response.Deltas);
        var deltas = receivedData.Response.Deltas;
        // There were several things that happened:
        assert.equal(deltas.length, 12);
        // the service was created,
        assert.equal(deltas[0][0], 'service');
        // the seventh machine is "started",
        assert.equal(deltas[7][0], 'machine');
        assert.equal(deltas[7][1], 'change');
        assert.equal(deltas[7][2].Status, 'started');
        // and the unit was added to the machine we requested.
        assert.equal(deltas[11][2].MachineId, '7');
        done();
      };
      conn.open();
      conn.send(Y.JSON.stringify(data));
    });

    it('errors when toMachine is specified and unitCount > 1', function(done) {
      // Add a bunch of machines that are not associated with services.
      state.deploy('cs:precise/wordpress-15', function(response) {
        assert.equal(response.error, 'When deploying to a specific machine, ' +
            'the number of units requested must be 1.');
        done();
      }, {toMachine: '42', unitCount: 3});
    });

    it('will assign two services to the same machine', function(done) {
      state._getUnitMachines(99);
      state.deploy('cs:precise/wordpress-15', function() {
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
