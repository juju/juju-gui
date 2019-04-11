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

describe('Juju delta handlers', function() {
  var db, models, handlers;

  beforeAll(function(done) {
    YUI(GlobalConfig).use([], function(Y) {
      window.yui = Y;
      require('../yui-modules');
      window.yui.use(window.MODULES.concat(['juju-delta-handlers']), function() {
        models = window.yui.namespace('juju.models');
        handlers = models.handlers;
        done();
      });
    });
  });

  beforeEach(function() {
    db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
  });

  describe('unitInfo handler', function() {
    var unitInfo;

    beforeAll(function() {
      unitInfo = handlers.unitInfo;
    });

    describe('unit delta', function() {
      // Ensure the unit has been correctly created in the given model list.
      var assertCreated = function(list) {
        var change = {
          name: 'django/1',
          application: 'django',
          'machine-id': '1',
          'agent-status': {
            current: 'allocating',
            message: 'waiting for machine',
            data: {}
          },
          'workload-status': {message: 'exterminating'},
          'public-address': 'example.com',
          'private-address': '10.0.0.1',
          subordinate: false,
          'port-ranges': [{
            'from-port': 9000, 'to-port': 10000, protocol: 'udp'
          }, {
            'from-port': 443, 'to-port': 443, protocol: 'tcp'
          }],
          ports: [{number: 80, protocol: 'tcp'}, {number: 42, protocol: 'udp'}]
        };
        unitInfo(db, 'add', change);
        // Retrieve the unit from the list.
        var unit = list.getById('django/1');
        assert.strictEqual(unit.service, 'django');
        assert.strictEqual(unit.machine, '1');
        assert.strictEqual(unit.agent_state, 'pending');
        assert.strictEqual(unit.agent_state_info, 'waiting for machine');
        assert.strictEqual(unit.agentStatus, 'allocating');
        assert.strictEqual(unit.workloadStatus, '');
        assert.strictEqual(unit.workloadStatusMessage, 'exterminating');
        assert.strictEqual(unit.public_address, 'example.com');
        assert.strictEqual(unit.private_address, '10.0.0.1');
        assert.strictEqual(unit.subordinate, false, 'subordinate');
        assert.deepEqual(unit.portRanges, [{
          from: 9000, to: 10000, protocol: 'udp', single: false
        }, {
          from: 443, to: 443, protocol: 'tcp', single: true
        }]);
      };

      it('creates a unit in the database (global list)', function() {
        db.services.add({id: 'django'});
        assertCreated(db.units);
      });

      it('creates a unit in the database (service list)', function() {
        var django = db.services.add({id: 'django'});
        assertCreated(django.get('units'));
      });

      // Ensure the unit has been correctly updated in the given model list.
      var assertUpdated = function(list, workloadInError) {
        db.addUnits({
          id: 'django/2',
          agent_state: 'pending',
          public_address: 'example.com',
          private_address: '10.0.0.1'
        });
        var change = {
          name: 'django/2',
          application: 'django',
          'agent-status': {
            current: 'idle',
            message: '',
            data: {}
          },
          'workload-status': {
            current: 'maintenance',
            message: 'installing charm software'
          },
          'public-address': 'example.com',
          'private-address': '192.168.0.1',
          subordinate: true
        };
        if (workloadInError) {
          change['agent-status'].current = 'executing';
          change['workload-status'] = {
            current: 'error',
            message: 'hook run error',
            data: {foo: 'bar'}
          };
        }
        unitInfo(db, 'change', change);
        // Retrieve the unit from the database.
        var unit = list.getById('django/2');
        if (!workloadInError) {
          assert.strictEqual(unit.agent_state, 'pending');
          assert.strictEqual(
            unit.workloadStatusMessage, 'installing charm software');
        } else {
          assert.equal(unit.agent_state, 'error');
          assert.equal(unit.agent_state_info, 'hook run error');
          assert.deepEqual(unit.agent_state_data, {foo: 'bar'});
          assert.strictEqual(unit.workloadStatusMessage, 'hook run error');
        }
        assert.strictEqual(
          unit.agentStatus, workloadInError ? 'executing' : 'idle');
        assert.strictEqual(
          unit.workloadStatus, workloadInError ? 'error' : 'maintenance');
        assert.strictEqual(unit.public_address, 'example.com');
        assert.strictEqual(unit.private_address, '192.168.0.1');
        assert.strictEqual(unit.subordinate, true, 'subordinate');
      };

      it('updates a unit in the database (global list)', function() {
        db.services.add({id: 'django'});
        assertUpdated(db.units, true);
      });

      it('updates a unit in the database (service list)', function() {
        var django = db.services.add({id: 'django'});
        assertUpdated(django.get('units'));
      });

      it('updates a unit when workload status is in error', function() {
        db.services.add({id: 'django'});
        assertUpdated(db.units);
      });

      it('creates or updates the corresponding machine', function() {
        var machine;
        db.services.add({id: 'django'});
        var change = {
          name: 'django/2',
          application: 'django',
          'machine-id': '1',
          'agent-status': {
            current: 'idle',
            message: '',
            data: {}
          },
          'workload-status': {
            current: 'maintenance',
            message: 'installing charm software'
          },
          'public-address': 'example.com'
        };
        unitInfo(db, 'add', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database.
        machine = db.machines.getById(1);
        assert.strictEqual('example.com', machine.public_address);
        // Update the machine.
        change['public-address'] = 'example.com/foo';
        unitInfo(db, 'change', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database (again).
        machine = db.machines.getById('1');
        assert.strictEqual('example.com/foo', machine.public_address);
      });

      it('skips machine create if an app is unassociated', function() {
        db.services.add({id: 'django'});
        var change = {
          name: 'django/2',
          application: 'django',
          'machine-id': '',
          'agent-status': {
            current: 'idle',
            message: '',
            data: {}
          },
          'workload-status': {
            current: 'maintenance',
            message: 'installing charm software'
          },
          'public-address': 'example.com'
        };
        unitInfo(db, 'add', change);
        assert.strictEqual(0, db.machines.size());
      });

      it('removes a unit from the database', function() {
        var django = db.services.add({id: 'django'});
        db.addUnits({
          id: 'django/2',
          agent_state: 'pending',
          public_address: 'example.com',
          private_address: '10.0.0.1'
        });
        var change = {
          name: 'django/2',
          application: 'django',
          'agent-status': {
            current: 'idle',
            message: '',
            data: {}
          },
          'workload-status': {
            current: 'idle',
            message: ''
          },
          'public-address': 'example.com',
          'private-address': '192.168.0.1'
        };
        unitInfo(db, 'remove', change);
        // The unit has been removed from both the global list and the app.
        assert.strictEqual(db.units.size(), 0);
        assert.strictEqual(django.get('units').size(), 0);
      });

    });
  });

  describe('applicationInfo handler', function() {
    var applicationInfo, constraints, config, status;

    beforeAll(function() {
      applicationInfo = handlers.applicationInfo;
      constraints = {
        arch: 'amd64',
        mem: 2000,
        'cpu-cores': 4
      };
      config = {cow: 'pie'};
      status = {
        current: 'idle',
        message: 'waiting',
        data: {},
        since: 'yesterday'
      };
    });

    it('creates an application in the database', function() {
      var change = {
        name: 'django',
        'charm-url': 'cs:precise/django-42',
        exposed: true,
        constraints: constraints,
        config: config,
        life: 'alive',
        status: status,
        subordinate: true,
        'workload-version': '42.47'
      };
      var oldUpdateConfig = models.Service.prototype.updateConfig;
      models.Service.prototype.updateConfig = sinon.stub();
      applicationInfo(db, 'add', change);
      assert.strictEqual(db.services.size(), 1);
      // Retrieve the application from the database.
      var application = db.services.getById('django');
      assert.strictEqual(application.get('charm'), 'cs:precise/django-42');
      assert.strictEqual(application.get('exposed'), true, 'exposed');
      assert.deepEqual(application.get('constraints'), constraints);
      // The config on the application is initially set to the customized
      // subset in the delta stream. The full config will be gotten via a call
      // to the Application.Get API.
      assert.equal(db.services.item(0).updateConfig.callCount, 1);
      models.Service.prototype.updateConfig = oldUpdateConfig;
      assert.strictEqual(application.get('life'), 'alive');
      assert.deepEqual(application.get('status'), {
        current: 'idle',
        message: 'waiting',
        data: {},
        since: 'yesterday'
      });
      assert.strictEqual(application.get('subordinate'), true, 'subordinate');
      assert.strictEqual(application.get('workloadVersion'), '42.47');
    });

    it('updates an application in the database', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false,
        life: 'dying',
        status: status,
        subordinate: false,
        'workload-version': '2.0.1'
      };
      applicationInfo(db, 'change', change);
      assert.strictEqual(db.services.size(), 1);
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.strictEqual(application.get('charm'), 'cs:quantal/wordpress-11');
      assert.strictEqual(application.get('exposed'), false, 'exposed');
      assert.strictEqual('dying', application.get('life'));
      assert.deepEqual(application.get('status'), {
        current: 'idle',
        message: 'waiting',
        data: {},
        since: 'yesterday'
      });
      assert.strictEqual(application.get('subordinate'), false, 'subordinate');
      assert.strictEqual(application.get('workloadVersion'), '2.0.1');
    });

    it('promote a ghost application in the database', function() {
      db.services.add({
        id: '4247',
        name: 'wordpress',
        pending: true,
        loading: true,
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false
      };
      applicationInfo(db, 'change', change);
      assert.strictEqual(db.services.size(), 1);
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.strictEqual(application.get('charm'), 'cs:quantal/wordpress-11');
      assert.strictEqual(application.get('exposed'), false, 'exposed');
      assert.strictEqual(application.get('pending'), false, 'pending');
      assert.strictEqual(application.get('loading'), false, 'loading');
    });

    it('handles missing constraints', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false
      };
      applicationInfo(db, 'change', change);
      assert.strictEqual(1, db.services.size());
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.deepEqual(application.get('constraints'), {});
    });

    it('converts the tags constraint into a string', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false,
        constraints: {tags: ['tag1', 'tag2', 'tag3']}
      };
      applicationInfo(db, 'change', change);
      assert.strictEqual(1, db.services.size());
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.deepEqual(
        application.get('constraints'), {tags: 'tag1,tag2,tag3'});
    });

    it('handle empty tags constraint', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false,
        constraints: {tags: []}
      };
      applicationInfo(db, 'change', change);
      assert.strictEqual(1, db.services.size());
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.deepEqual(application.get('constraints'), {});
    });

    it('if configs are not in the change stream they are {}', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false
      };
      applicationInfo(db, 'change', change);
      assert.strictEqual(1, db.services.size());
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.deepEqual({}, application.get('config'));
    });

    it('handles constraint changes', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true,
        constraints: constraints
      });
      var changedConstraints = {'arch': 'i386'};
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false,
        constraints: changedConstraints
      };
      applicationInfo(db, 'change', change);
      assert.strictEqual(1, db.services.size());
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.deepEqual(changedConstraints, application.get('constraints'));
    });

    it('removes an application from the database', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        name: 'wordpress',
        'charm-url': 'cs:quantal/wordpress-11',
        exposed: false
      };
      applicationInfo(db, 'remove', change);
      assert.strictEqual(0, db.services.size());
    });

    it('executes collected application hooks on change', function() {
      var hook1 = sinon.stub();
      var hook2 = sinon.stub();
      models._applicationChangedHooks.django = [hook1, hook2];
      var change = {
        name: 'django',
        'charm-url': 'cs:precise/django-42',
        exposed: true,
        constraints: constraints,
        config: config,
        life: 'alive'
      };
      applicationInfo(db, 'change', change);
      // The two hooks have been called.
      assert.strictEqual(hook1.calledOnce, true);
      assert.strictEqual(hook1.lastCall.args.length, 0);
      assert.strictEqual(hook2.calledOnce, true);
      assert.strictEqual(hook2.lastCall.args.length, 0);
      // The hooks have been garbage collected.
      assert.deepEqual(models._applicationChangedHooks, {});
    });

  });

  describe('remoteApplicationInfo handler', function() {
    let remoteApplicationInfo, status, url;

    beforeAll(function() {
      remoteApplicationInfo = handlers.remoteApplicationInfo;
      status = {
        current: 'idle',
        message: 'waiting',
        data: {},
        since: 'yesterday'
      };
      url = 'local:/u/who/model/django';
    });

    it('creates a remote application in the database', function() {
      const change = {
        'application-url': url,
        name: 'django',
        'model-uuid': 'uuid',
        life: 'alive',
        status: status
      };
      // Send the mega-watcher change.
      remoteApplicationInfo(db, 'add', change);
      // A new remote application has been created.
      assert.strictEqual(db.remoteServices.size(), 1);
      const remoteApplication = db.remoteServices.getById(url);
      // The remote application has the expected attributes.
      assert.strictEqual(remoteApplication.get('url'), url);
      assert.strictEqual(remoteApplication.get('service'), 'django');
      assert.strictEqual(remoteApplication.get('sourceId'), 'uuid');
      assert.strictEqual(remoteApplication.get('life'), 'alive');
      assert.deepEqual(remoteApplication.get('status'), {
        current: 'idle',
        message: 'waiting',
        data: {},
        since: 'yesterday'
      });
    });

    it('updates a remote application in the database', function() {
      // Add a remote application to the database.
      db.remoteServices.add({
        id: url,
        service: 'django',
        sourceId: 'uuid',
        life: 'alive'
      });
      const change = {
        'application-url': url,
        name: 'rails',
        'model-uuid': 'uuid',
        life: 'dying',
        status: status
      };
      // Send the mega-watcher change.
      remoteApplicationInfo(db, 'change', change);
      // No new remote applications have been created.
      assert.strictEqual(db.remoteServices.size(), 1);
      const remoteApplication = db.remoteServices.getById(url);
      // The remote application has the expected attributes.
      assert.strictEqual(remoteApplication.get('url'), url);
      assert.strictEqual(remoteApplication.get('service'), 'rails');
      assert.strictEqual(remoteApplication.get('sourceId'), 'uuid');
      assert.strictEqual(remoteApplication.get('life'), 'dying');
      assert.deepEqual(remoteApplication.get('status'), {
        current: 'idle',
        message: 'waiting',
        data: {},
        since: 'yesterday'
      });
    });

    it('removes a remote application from the database', function() {
      // Add a remote application to the database.
      db.remoteServices.add({
        id: url,
        service: 'django',
        sourceId: 'uuid',
        life: 'alive'
      });
      const change = {
        'application-url': url,
        name: 'django',
        'model-uuid': 'uuid',
        life: 'alive'
      };
      // Send the mega-watcher change to remove the remote application.
      remoteApplicationInfo(db, 'remove', change);
      // The remote application has been removed.
      assert.strictEqual(db.remoteServices.size(), 0);
    });

  });

  describe('relationInfo handler', function() {
    var dbEndpoints, deltaEndpoints, relationInfo, relationKey;

    beforeAll(function() {
      relationInfo = handlers.relationInfo;
      relationKey = 'haproxy:reverseproxy wordpress:website';
    });

    beforeEach(function() {
      db.services.add([{id: 'haproxy'}, {id: 'wordpress'}]);
      dbEndpoints = [
        ['haproxy', {role: 'requirer', name: 'reverseproxy'}],
        ['wordpress', {role: 'provider', name: 'website'}]
      ];
      deltaEndpoints = [
        {
          relation: {
            interface: 'http',
            limit: 1,
            name: 'reverseproxy',
            optional: false,
            role: 'requirer',
            scope: 'global'
          },
          'application-name': 'haproxy'
        },
        {
          relation: {
            interface: 'http',
            limit: 0,
            name: 'website',
            optional: false,
            role: 'provider',
            scope: 'global'
          },
          'application-name': 'wordpress'
        }
      ];
    });

    it('creates a relation in the database', function() {
      var change = {
        key: relationKey,
        endpoints: deltaEndpoints
      };
      relationInfo(db, 'add', change);
      assert.strictEqual(1, db.relations.size());
      // Retrieve the relation from the database.
      var relation = db.relations.getById(relationKey);
      assert.isNotNull(relation);
      assert.strictEqual('http', relation.get('interface'));
      assert.strictEqual('global', relation.get('scope'));
      assert.deepEqual(dbEndpoints, relation.get('endpoints'));
    });

    it('updates a relation in the database', function() {
      db.services.add({id: 'mysql'});
      db.relations.add({
        id: relationKey,
        'interface': 'http',
        scope: 'global',
        endpoints: dbEndpoints
      });
      var firstEndpoint = deltaEndpoints[0],
          firstRelation = firstEndpoint.relation;
      firstEndpoint['application-name'] = 'mysql';
      firstRelation.name = 'db';
      firstRelation.interface = 'mysql';
      firstRelation.scope = 'local';
      var change = {
        key: relationKey,
        endpoints: deltaEndpoints
      };
      var expectedEndpoints = [
        ['mysql', {role: 'requirer', name: 'db'}],
        ['wordpress', {role: 'provider', name: 'website'}]
      ];
      relationInfo(db, 'change', change);
      assert.strictEqual(1, db.relations.size());
      // Retrieve the relation from the database.
      var relation = db.relations.getById(relationKey);
      assert.isNotNull(relation);
      assert.strictEqual('mysql', relation.get('interface'));
      assert.strictEqual('local', relation.get('scope'));
      assert.deepEqual(expectedEndpoints, relation.get('endpoints'));
    });

    it('removes a relation from the database', function() {
      db.relations.add({
        id: relationKey,
        'interface': 'http',
        scope: 'global',
        endpoints: dbEndpoints
      });
      var change = {
        key: relationKey,
        endpoints: deltaEndpoints
      };
      relationInfo(db, 'remove', change);
      assert.strictEqual(db.relations.size(), 0);
    });

    it('waits for the application to be available', function() {
      db.services.reset();
      var change = {
        key: 'haproxy:peer',
        endpoints: [{
          relation: {
            interface: 'haproxy-peer',
            limit: 1,
            name: 'peer',
            optional: false,
            role: 'peer',
            scope: 'global'
          },
          'application-name': 'haproxy'
        }]
      };
      relationInfo(db, 'change', change);
      // The relation is not yet included in the database.
      assert.strictEqual(db.relations.size(), 0);
      // After processing an extraneous application change, the relation is
      // still pending.
      handlers.applicationInfo(db, 'change', {name: 'mysql'});
      assert.strictEqual(db.relations.size(), 0);
      // After processing the corresponding application, the relation is added.
      handlers.applicationInfo(db, 'change', {name: 'haproxy'});
      assert.strictEqual(db.relations.size(), 1);
      var relation = db.relations.getById('haproxy:peer');
      assert.isNotNull(relation);
      assert.strictEqual(relation.get('interface'), 'haproxy-peer');
    });

  });

  describe('machineInfo handler', function() {
    var machineInfo;

    beforeAll(function() {
      machineInfo = handlers.machineInfo;
    });

    it('creates a machine in the database', function() {
      var change = {
        id: '1',
        'instance-id': 'my-machine-instance',
        'agent-status': {current: 'pending', message: 'info'},
        addresses: [
          {
            'space-name': '',
            scope: 'public',
            type: 'hostname',
            value: 'example.com'
          },
          {
            'space-name': '',
            scope: 'local-cloud',
            type: 'ipv4',
            value: '10.0.0.1'
          }
        ],
        'hardware-characteristics': {
          arch: 'amd64',
          'cpu-cores': 1,
          'cpu-power': 100,
          mem: 1740,
          'root-disk': 8192,
          'availability-zone': 'zone'
        },
        jobs: ['JobHostUnits'],
        life: 'alive',
        series: 'trusty',
        'supported-containers': ['lxc'],
        'supported-containers-known': true
      };
      machineInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('1');
      assert.strictEqual(machine.instance_id, 'my-machine-instance');
      assert.strictEqual(machine.agent_state, 'pending');
      assert.strictEqual(machine.agent_state_info, 'info');
      assert.deepEqual(machine.addresses, [
        {name: '', scope: 'public', type: 'hostname', value: 'example.com'},
        {name: '', scope: 'local-cloud', type: 'ipv4', value: '10.0.0.1'}
      ]);
      assert.deepEqual(machine.hardware, {
        arch: 'amd64',
        cpuCores: 1,
        cpuPower: 100,
        mem: 1740,
        disk: 8192,
        availabilityZone: 'zone'
      });
      assert.deepEqual(machine.jobs, ['JobHostUnits']);
      assert.strictEqual(machine.life, 'alive');
      assert.strictEqual(machine.series, 'trusty');
      assert.deepEqual(machine.supportedContainers, ['lxc']);
    });

    it('updates a machine in the database', function() {
      db.machines.add({
        id: '2',
        instance_id: 'instance-42',
        agent_state: 'error',
        agent_state_info: 'there is something wrong',
        series: 'saucy',
        life: 'alive',
        supportedContainers: null
      });
      var change = {
        id: '2',
        'instance-id': 'instance-47',
        'agent-status': {current: 'started'},
        series: 'saucy',
        life: 'dying',
        'supported-containers': ['lxc', 'kvm'],
        'supported-containers-known': true
      };
      machineInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('2');
      assert.strictEqual(machine.instance_id, 'instance-47');
      assert.strictEqual(machine.agent_state, 'started');
      assert.strictEqual(machine.agent_state_info, '');
      assert.strictEqual(machine.series, 'saucy');
      assert.strictEqual(machine.life, 'dying');
      assert.deepEqual(machine.supportedContainers, ['lxc', 'kvm']);
    });

    it('removes a machine from the database', function() {
      db.machines.add({
        id: '3',
        instance_id: 'instance-42',
        agent_state: 'started'
      });
      var change = {
        id: '3',
        'instance-id': 'instance-42',
        'agent-status': {current: 'started'}
      };
      machineInfo(db, 'remove', change);
      assert.strictEqual(db.machines.size(), 0);
    });

    it('handles missing addresses', function() {
      var change = {
        id: '42',
        'instance-id': 'my-machine-instance',
        'agent-status': {current: 'started'}
      };
      machineInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('42');
      assert.deepEqual(machine.addresses, []);
    });

    it('handles missing hardware info', function() {
      var change = {
        id: '42',
        'instance-id': 'my-machine-instance',
        'agent-status': {current: 'started'}
      };
      machineInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('42');
      assert.deepEqual(machine.hardware, {});
    });

    it('handles partial hardware info', function() {
      var change = {
        id: '42',
        'instance-id': 'my-machine-instance',
        'agent-status': {current: 'started'},
        'hardware-characteristics': {arch: 'amd64'}
      };
      machineInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('42');
      var hardware = machine.hardware;
      assert.strictEqual(hardware.arch, 'amd64');
      assert.isUndefined(hardware.cpuCores);
      assert.isUndefined(hardware.cpuPower);
      assert.isUndefined(hardware.mem);
      assert.isUndefined(hardware.disk);
    });

    it('handles supported containers not known', function() {
      var change = {
        id: '42',
        'instance-id': 'my-machine-instance',
        'agent-status': {current: 'started'},
        'supported-containers': [],
        'supported-containers-known': false
      };
      machineInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('42');
      assert.isNull(machine.supportedContainers);
    });

  });

  describe('annotationInfo handler', function() {
    var annotationInfo;

    beforeAll(function() {
      annotationInfo = handlers.annotationInfo;
    });

    it('stores annotations on an application', function() {
      db.services.add({id: 'django'});
      var annotations = {'gui-x': '42', 'gui-y': '47'};
      var change = {
        tag: 'application-django',
        annotations: annotations
      };
      annotationInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      var application = db.services.getById('django');
      assert.deepEqual(annotations, application.get('annotations'));
    });

    it('stores annotations on a unit', function() {
      var django = db.services.add({id: 'django'});
      var djangoUnits = django.get('units');
      var unitData = {id: 'django/2', service: 'django'};
      db.addUnits(unitData);
      var annotations = {'foo': '42', 'bar': '47'};
      var change = {
        tag: 'unit-django-2',
        annotations: annotations
      };
      annotationInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      var globalUnit = db.units.getById('django/2');
      var appUnit = djangoUnits.getById('django/2');
      // Ensure the annotations has been written to both the global and the
      // application nested unit instance.
      assert.deepEqual(globalUnit.annotations, annotations);
      assert.deepEqual(appUnit.annotations, annotations);
    });

    it('stores annotations on a machine', function() {
      db.machines.add({id: '1'});
      var annotations = {'foo': '42', 'bar': '47'};
      var change = {
        tag: 'machine-1',
        annotations: annotations
      };
      annotationInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      var machine = db.machines.getById('1');
      assert.deepEqual(annotations, machine.annotations);
    });

    it('stores annotations on the model', function() {
      var annotations = {'foo': '42', 'bar': '47'};
      var change = {
        tag: 'model-foo',
        annotations: annotations
      };
      annotationInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      assert.deepEqual(annotations, db.environment.get('annotations'));
    });

    it('correctly updates annotations', function() {
      var initial = {'gui-x': '42'},
          next = {'gui-y': '47', 'gui-z': 'Now in 3D!'},
          expected = {'gui-x': '42', 'gui-y': '47', 'gui-z': 'Now in 3D!'};
      db.services.add({id: 'django', annotations: initial});
      var change = {
        tag: 'application-django',
        annotations: next
      };
      annotationInfo(db, 'change', change);
      // Retrieve the annotations from the database.
      var application = db.services.getById('django');
      // we can see that it merged initial and next.
      assert.deepEqual(expected, application.get('annotations'));
    });

    it('does not override the application exposed attr', function() {
      db.services.add({id: 'django', exposed: true});
      var annotations = {'gui-x': '42', 'gui-y': '47'};
      var change = {
        tag: 'application-django',
        annotations: annotations
      };
      annotationInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      var application = db.services.getById('django');
      assert.isTrue(application.get('exposed'));
    });

    it('does not override the unit relation_errors attr', function() {
      var django = db.services.add({id: 'django'});
      var djangoUnits = django.get('units');
      var relation_errors = {'cache': ['memcached']};
      var annotations = {'foo': '42', 'bar': '47'};
      var unitData = {
        id: 'django/2',
        service: 'django',
        relation_errors: relation_errors
      };
      db.addUnits(unitData);
      var change = {
        tag: 'unit-django-2',
        annotations: annotations
      };
      annotationInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      var globalUnit = db.units.getById('django/2');
      var appUnit = djangoUnits.getById('django/2');
      // Ensure relation errors are still there.
      assert.deepEqual(globalUnit.relation_errors, relation_errors);
      assert.deepEqual(appUnit.relation_errors, relation_errors);
    });

    it('does not create new model instances', function() {
      var annotations = {'gui-x': '42', 'gui-y': '47'};
      var change = {
        tag: 'application-django',
        annotations: annotations
      };
      annotationInfo(db, 'add', change);
      assert.strictEqual(0, db.services.size());
    });

  });

});

describe('Juju delta handlers utilities', function() {
  let utils;

  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-delta-handlers'], function(Y) {
      utils = Y.namespace('juju.models').utils;
      done();
    });
  });

  describe('Go Juju Entity Tag cleaner', function() {
    var cleanUpEntityTags;

    beforeAll(function() {
      cleanUpEntityTags = utils.cleanUpEntityTags;
    });

    it('cleans up tags from Go juju', function() {
      // Clean up application tags.
      assert.equal('mysql', cleanUpEntityTags('application-mysql'));
      assert.equal(
        'buildbot-master', cleanUpEntityTags('application-buildbot-master'));
      // Clean up unit tags.
      assert.equal('mysql/47', cleanUpEntityTags('unit-mysql-47'));
      assert.equal(
        'buildbot-master/0', cleanUpEntityTags('unit-buildbot-master-0'));
      // Clean up machine tags.
      assert.equal('0', cleanUpEntityTags('machine-0'));
      assert.equal('42', cleanUpEntityTags('machine-42'));
      // Clean up model tags.
      assert.equal('aws', cleanUpEntityTags('model-aws'));
      assert.equal('my-env', cleanUpEntityTags('model-my-env'));
    });

    it('ignores bad values', function() {
      var data = ['foo', 'bar-baz', '123', 'unit-', 'application-', 'machine'];
      data.forEach(item => {
        assert.equal(item, cleanUpEntityTags(item));
      });
    });

  });

  describe('Go Juju endpoints converter', function() {
    var createEndpoints;

    beforeAll(function() {
      createEndpoints = utils.createEndpoints;
    });

    it('correctly returns a list of endpoints', function() {
      var endpoints = [
        {
          relation: {
            interface: 'http',
            limit: 1,
            name: 'reverseproxy',
            optional: false,
            role: 'requirer',
            scope: 'global'
          },
          'application-name': 'haproxy'
        },
        {
          relation: {
            interface: 'http',
            limit: 0,
            name: 'website',
            optional: false,
            role: 'provider',
            scope: 'global'
          },
          'application-name': 'wordpress'
        }
      ];
      var expected = [
        ['haproxy', {role: 'requirer', name: 'reverseproxy'}],
        ['wordpress', {role: 'provider', name: 'website'}]
      ];
      assert.deepEqual(expected, createEndpoints(endpoints));
    });

    it('returns an empty list if there are no endpoints', function() {
      assert.deepEqual([], createEndpoints([]));
    });

  });

  describe('Go Juju convertConstraints', function() {
    var convertConstraints;

    beforeAll(function() {
      convertConstraints = utils.convertConstraints;
    });

    it('correctly returns the constraints', function() {
      var constraints = {
        arch: 'amd64',
        'cpu-cores': 2,
        'cpu-power': 800,
        mem: 2000
      };
      assert.deepEqual(convertConstraints(constraints), constraints);
    });

    it('returns an empty object if no constraints are set', function() {
      assert.deepEqual(convertConstraints(null), {});
      assert.deepEqual(convertConstraints({}), {});
      assert.deepEqual(convertConstraints(undefined), {});
    });

    it('converts the tags', function() {
      var constraints = convertConstraints({
        arch: 'i386',
        tags: ['tag1', 'tag2', 'tag3']
      });
      assert.deepEqual(constraints, {arch: 'i386', tags: 'tag1,tag2,tag3'});
    });

  });

  describe('handleGUIServices', function() {

    // Create and return a fake db.
    const makeDB = (dnsName, exposed) => {
      const get = sinon.stub();
      get.withArgs('config').returns({'dns-name': dnsName});
      get.withArgs('exposed').returns(exposed);
      return {
        environment: {set: sinon.stub()},
        services: {
          getById: sinon.stub().withArgs('myshell').returns({get: get})
        }
      };
    };

    // Create and return a fake unit with the given URL and agent state.
    const makeUnit = (url, state) => {
      return {agent_state: state, charmUrl: url, service: 'myshell'};
    };

    // Ensure the jujushell URL has been set in the environment included in the
    // given db.
    const assertSetCalledOnceWith = (db, url) => {
      assert.strictEqual(db.environment.set.callCount, 1, 'set call count');
      const args = db.environment.set.args[0];
      assert.strictEqual(args.length, 2, 'set number of args');
      assert.strictEqual(args[0], 'jujushellURL');
      assert.strictEqual(args[1], url);
    };

    it('sets the jujushell URL when the app is exposed and ready', function() {
      const db = makeDB('shell1.example.com', true);
      const unit = makeUnit('cs:jujushell-42', 'started');
      utils.handleGUIServices(unit, db);
      assertSetCalledOnceWith(db, 'shell1.example.com');
    });

    it('sets the URL when the charm is owned by juju-gui', function() {
      const db = makeDB('shell2.example.com', true);
      const unit = makeUnit('cs:~juju-gui/jujushell-42', 'started');
      utils.handleGUIServices(unit, db);
      assertSetCalledOnceWith(db, 'shell2.example.com');
    });

    it('sets the URL when the charm is owned by yellow', function() {
      const db = makeDB('shell3.example.com', true);
      const unit = makeUnit('cs:~yellow/jujushell-47', 'started');
      utils.handleGUIServices(unit, db);
      assertSetCalledOnceWith(db, 'shell3.example.com');
    });

    it('unsets the jujushell URL when the app is not exposed', function() {
      const db = makeDB('shell.example.com', false);
      const unit = makeUnit('cs:jujushell-42', 'started');
      utils.handleGUIServices(unit, db);
      assertSetCalledOnceWith(db, null);
    });

    it('unsets the jujushell URL when the app is not started', function() {
      const db = makeDB('shell.example.com', true);
      const unit = makeUnit('cs:jujushell-42', 'pending');
      utils.handleGUIServices(unit, db);
      assertSetCalledOnceWith(db, null);
    });

    it('unsets the jujushell URL when the app lacks a DNS name', function() {
      const db = makeDB('', true);
      const unit = makeUnit('cs:jujushell-42', 'started');
      utils.handleGUIServices(unit, db);
      assertSetCalledOnceWith(db, null);
    });

    it('does nothing when the charm URL is not set on the unit', function() {
      const db = makeDB('shell.example.com', true);
      const unit = makeUnit('', 'started');
      utils.handleGUIServices(unit, db);
      assert.strictEqual(db.environment.set.callCount, 0, 'set call count');
    });

    it('does nothing when the charm is not jujushell', function() {
      const db = makeDB('shell.example.com', true);
      const unit = makeUnit('cs:bad-wolf-42', 'started');
      utils.handleGUIServices(unit, db);
      assert.strictEqual(db.environment.set.callCount, 0, 'set call count');
    });

    it('does nothing when the charm has an unexpected owner', function() {
      const db = makeDB('shell.example.com', true);
      const unit = makeUnit('cs:~badwolf/jujushell-42', 'started');
      utils.handleGUIServices(unit, db);
      assert.strictEqual(db.environment.set.callCount, 0, 'set call count');
    });

  });

  describe('translateToLegacyAgentState', function() {
    var translate;

    beforeAll(function() {
      translate = utils.translateToLegacyAgentState;
    });

    it('returns pending when allocating', function() {
      assert.equal(translate('allocating'), 'pending');
    });

    it('returns error when in error', function() {
      assert.equal(translate('error'), 'error');
    });

    describe('rebooting, executing, idle, lost, failed', function() {

      var states = ['rebooting', 'executing', 'idle', 'lost', 'failed'];

      states.forEach(function(state) {

        it('returns error when in error: ' + state, function() {
          assert.equal(translate(state, 'error'), 'error',
            state + ' did not return the correct value');
        });

        it('returns stopped when terminated: ' + state, function() {
          assert.equal(translate(state, 'terminated'), 'stopped',
            state + ' did not return the correct value');
        });

        it('returns pending when in maintenance: ' + state, function() {
          assert.equal(translate(state, 'maintenance'), 'pending',
            state + ' did not return the correct value');
        });

        it('returns started as a default: ' + state, function() {
          assert.equal(translate(state, 'foobar'), 'started',
            state + ' did not return the correct value');
        });

      });

    });

  });

});
