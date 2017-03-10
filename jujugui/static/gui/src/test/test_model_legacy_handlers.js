/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

describe('Juju legacy delta handlers', function() {
  var db, models, handlers;
  var requirements = [
    'juju-models', 'juju-legacy-delta-handlers'];

  before(function(done) {
    YUI(GlobalConfig).use(requirements, function(Y) {
      models = Y.namespace('juju.models');
      handlers = models.legacyHandlers;
      done();
    });
  });

  beforeEach(function() {
    db = new models.Database();
  });

  describe('unitLegacyInfo handler', function() {
    var unitLegacyInfo;

    before(function() {
      unitLegacyInfo = handlers.unitLegacyInfo;
    });

    describe('Juju 1.x unit delta', function() {
      // Ensure the unit has been correctly created in the given model list.
      var assertCreated = function(list) {
        var change = {
          Name: 'django/1',
          Service: 'django',
          MachineId: '1',
          Status: 'pending',
          StatusInfo: 'info',
          PublicAddress: 'example.com',
          PrivateAddress: '10.0.0.1',
          Subordinate: false,
          Ports: [{Number: 80, Protocol: 'tcp'}, {Number: 42, Protocol: 'udp'}]
        };
        unitLegacyInfo(db, 'add', change);
        // Retrieve the unit from the list.
        var unit = list.getById('django/1');
        assert.strictEqual(unit.service, 'django');
        assert.strictEqual(unit.machine, '1');
        assert.strictEqual(unit.agent_state, 'pending');
        assert.strictEqual(unit.agent_state_info, 'info');
        assert.strictEqual(unit.workloadStatusMessage, '');
        assert.strictEqual(unit.public_address, 'example.com');
        assert.strictEqual(unit.private_address, '10.0.0.1');
        assert.strictEqual(unit.subordinate, false, 'subordinate');
        assert.deepEqual(unit.portRanges, [{
          from: 80, to: 80, protocol: 'tcp', single: true
        }, {
          from: 42, to: 42, protocol: 'udp', single: true
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
      var assertUpdated = function(list) {
        db.addUnits({
          id: 'django/2',
          agent_state: 'pending',
          public_address: 'example.com',
          private_address: '10.0.0.1'
        });
        var change = {
          Name: 'django/2',
          Application: 'django',
          Status: 'started',
          PublicAddress: 'example.com',
          PrivateAddress: '192.168.0.1',
          Subordinate: true
        };
        unitLegacyInfo(db, 'change', change);
        // Retrieve the unit from the database.
        var unit = list.getById('django/2');
        assert.strictEqual(unit.agent_state, 'started');
        assert.strictEqual(unit.public_address, 'example.com');
        assert.strictEqual(unit.private_address, '192.168.0.1');
        assert.strictEqual(unit.subordinate, true, 'subordinate');
      };

      it('updates a unit in the database (global list)', function() {
        db.services.add({id: 'django'});
        assertUpdated(db.units);
      });

      it('updates a unit in the database (service list)', function() {
        var django = db.services.add({id: 'django'});
        assertUpdated(django.get('units'));
      });

      it('creates or updates the corresponding machine', function() {
        var machine;
        db.services.add({id: 'django'});
        var change = {
          Name: 'django/2',
          Application: 'django',
          MachineId: '1',
          Status: 'pending',
          PublicAddress: 'example.com'
        };
        unitLegacyInfo(db, 'add', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database.
        machine = db.machines.getById(1);
        assert.strictEqual('example.com', machine.public_address);
        // Update the machine.
        change.PublicAddress = 'example.com/foo';
        unitLegacyInfo(db, 'change', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database (again).
        machine = db.machines.getById('1');
        assert.strictEqual('example.com/foo', machine.public_address);
      });

      it('skips machine create if an app is unassociated', function() {
        db.services.add({id: 'django'});
        var change = {
          Name: 'django/2',
          Application: 'django',
          MachineId: '',
          Status: 'pending',
          PublicAddress: 'example.com'
        };
        unitLegacyInfo(db, 'add', change);
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
          Name: 'django/2',
          Application: 'django',
          Status: 'started',
          PublicAddress: 'example.com',
          PrivateAddress: '192.168.0.1'
        };
        unitLegacyInfo(db, 'remove', change);
        // The unit has been removed from both the global list and the app.
        assert.strictEqual(db.units.size(), 0);
        assert.strictEqual(django.get('units').size(), 0);
      });
    });

  });

  describe('serviceLegacyInfo handler', function() {
    var serviceLegacyInfo, constraints, config;

    before(function() {
      serviceLegacyInfo = handlers.serviceLegacyInfo;
      constraints = {
        arch: 'amd64',
        mem: 2000,
        'cpu-cores': 4
      };
      config = {cow: 'pie'};
    });

    it('creates an application in the database', function() {
      var change = {
        Name: 'django',
        CharmURL: 'cs:precise/django-42',
        Exposed: true,
        Constraints: constraints,
        Config: config,
        Life: 'alive',
        Subordinate: true
      };
      var oldUpdateConfig = models.Service.prototype.updateConfig;
      models.Service.prototype.updateConfig = sinon.stub();
      serviceLegacyInfo(db, 'add', change);
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
      assert.strictEqual(application.get('subordinate'), true, 'subordinate');
    });

    it('updates an application in the database', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        Name: 'wordpress',
        CharmURL: 'cs:quantal/wordpress-11',
        Exposed: false,
        Life: 'dying',
        Subordinate: false
      };
      serviceLegacyInfo(db, 'change', change);
      assert.strictEqual(db.services.size(), 1);
      // Retrieve the application from the database.
      var application = db.services.getById('wordpress');
      assert.strictEqual(application.get('charm'), 'cs:quantal/wordpress-11');
      assert.strictEqual(application.get('exposed'), false, 'exposed');
      assert.strictEqual('dying', application.get('life'));
      assert.strictEqual(application.get('subordinate'), false, 'subordinate');
    });

    it('handles missing constraints', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'cs:quantal/wordpress-11',
        exposed: true
      });
      var change = {
        Name: 'wordpress',
        CharmURL: 'cs:quantal/wordpress-11',
        Exposed: false
      };
      serviceLegacyInfo(db, 'change', change);
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
        Name: 'wordpress',
        CharmURL: 'cs:quantal/wordpress-11',
        Exposed: false,
        Constraints: {tags: ['tag1', 'tag2', 'tag3']}
      };
      serviceLegacyInfo(db, 'change', change);
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
        Name: 'wordpress',
        CharmURL: 'cs:quantal/wordpress-11',
        Exposed: false,
        Constraints: {tags: []}
      };
      serviceLegacyInfo(db, 'change', change);
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
        Name: 'wordpress',
        CharmURL: 'cs:quantal/wordpress-11',
        Exposed: false
      };
      serviceLegacyInfo(db, 'change', change);
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
        Name: 'wordpress',
        CharmURL: 'cs:quantal/wordpress-11',
        Exposed: false,
        Constraints: changedConstraints
      };
      serviceLegacyInfo(db, 'change', change);
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
        Name: 'wordpress',
        CharmURL: 'cs:quantal/wordpress-11',
        Exposed: false
      };
      serviceLegacyInfo(db, 'remove', change);
      assert.strictEqual(0, db.services.size());
    });

    it('executes collected application hooks on change', function() {
      var hook1 = sinon.stub();
      var hook2 = sinon.stub();
      models._serviceChangedHooks.django = [hook1, hook2];
      var change = {
        Name: 'django',
        CharmURL: 'cs:precise/django-42',
        Exposed: true,
        Constraints: constraints,
        Config: config,
        Life: 'alive'
      };
      serviceLegacyInfo(db, 'change', change);
      // The two hooks have been called.
      assert.strictEqual(hook1.calledOnce, true);
      assert.strictEqual(hook1.lastCall.args.length, 0);
      assert.strictEqual(hook2.calledOnce, true);
      assert.strictEqual(hook2.lastCall.args.length, 0);
      // The hooks have been garbage collected.
      assert.deepEqual(models._serviceChangedHooks, {});
    });

  });

  describe('relationLegacyInfo handler', function() {
    var dbEndpoints, deltaEndpoints, relationLegacyInfo, relationKey;

    before(function() {
      relationLegacyInfo = handlers.relationLegacyInfo;
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
          Relation: {
            Interface: 'http',
            Limit: 1,
            Name: 'reverseproxy',
            Optional: false,
            Role: 'requirer',
            Scope: 'global'
          },
          ServiceName: 'haproxy'
        },
        {
          Relation: {
            Interface: 'http',
            Limit: 0,
            Name: 'website',
            Optional: false,
            Role: 'provider',
            Scope: 'global'
          },
          ServiceName: 'wordpress'
        }
      ];
    });

    it('creates a relation in the database', function() {
      var change = {
        Key: relationKey,
        Endpoints: deltaEndpoints
      };
      relationLegacyInfo(db, 'add', change);
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
          firstRelation = firstEndpoint.Relation;
      firstEndpoint.ServiceName = 'mysql';
      firstRelation.Name = 'db';
      firstRelation.Interface = 'mysql';
      firstRelation.Scope = 'local';
      var change = {
        Key: relationKey,
        Endpoints: deltaEndpoints
      };
      var expectedEndpoints = [
        ['mysql', {role: 'requirer', name: 'db'}],
        ['wordpress', {role: 'provider', name: 'website'}]
      ];
      relationLegacyInfo(db, 'change', change);
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
        Key: relationKey,
        Endpoints: deltaEndpoints
      };
      relationLegacyInfo(db, 'remove', change);
      assert.strictEqual(db.relations.size(), 0);
    });

    it('waits for the application to be available', function() {
      db.services.reset();
      var change = {
        Key: 'haproxy:peer',
        Endpoints: [{
          Relation: {
            Interface: 'haproxy-peer',
            Limit: 1,
            Name: 'peer',
            Optional: false,
            Role: 'peer',
            Scope: 'global'
          },
          ServiceName: 'haproxy'
        }]
      };
      relationLegacyInfo(db, 'change', change);
      // The relation is not yet included in the database.
      assert.strictEqual(db.relations.size(), 0);
      // After processing an extraneous application change, the relation is
      // still pending.
      handlers.serviceLegacyInfo(db, 'change', {Name: 'mysql'});
      assert.strictEqual(db.relations.size(), 0);
      // After processing the corresponding application, the relation is added.
      handlers.serviceLegacyInfo(db, 'change', {Name: 'haproxy'});
      assert.strictEqual(db.relations.size(), 1);
      var relation = db.relations.getById('haproxy:peer');
      assert.isNotNull(relation);
      assert.strictEqual(relation.get('interface'), 'haproxy-peer');
    });

  });

  describe('machineLegacyInfo handler', function() {
    var machineLegacyInfo;

    before(function() {
      machineLegacyInfo = handlers.machineLegacyInfo;
    });

    it('creates a machine in the database', function() {
      var change = {
        Id: '1',
        InstanceId: 'my-machine-instance',
        Status: 'pending',
        StatusInfo: 'info',
        Addresses: [
          {
            NetworkName: '',
            NetworkScope: 'public',
            Type: 'hostname',
            Value: 'example.com'
          },
          {
            NetworkName: '',
            NetworkScope: 'local-cloud',
            Type: 'ipv4',
            Value: '10.0.0.1'
          }
        ],
        HardwareCharacteristics: {
          Arch: 'amd64',
          CpuCores: 1,
          CpuPower: 100,
          Mem: 1740,
          RootDisk: 8192
        },
        Jobs: ['JobHostUnits'],
        Life: 'alive',
        Series: 'trusty',
        SupportedContainers: ['lxc'],
        SupportedContainersKnown: true
      };
      machineLegacyInfo(db, 'change', change);
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
        arch: 'amd64', cpuCores: 1, cpuPower: 100, mem: 1740, disk: 8192
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
        Id: '2',
        InstanceId: 'instance-47',
        Status: 'started',
        StatusInfo: '',
        Series: 'saucy',
        Life: 'dying',
        SupportedContainers: ['lxc', 'kvm'],
        SupportedContainersKnown: true
      };
      machineLegacyInfo(db, 'change', change);
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
        Id: '3',
        InstanceId: 'instance-42',
        Status: 'started'
      };
      machineLegacyInfo(db, 'remove', change);
      assert.strictEqual(db.machines.size(), 0);
    });

    it('handles missing addresses', function() {
      var change = {
        Id: '42',
        InstanceId: 'my-machine-instance',
        Status: 'started'
      };
      machineLegacyInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('42');
      assert.deepEqual(machine.addresses, []);
    });

    it('handles missing hardware info', function() {
      var change = {
        Id: '42',
        InstanceId: 'my-machine-instance',
        Status: 'started'
      };
      machineLegacyInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('42');
      assert.deepEqual(machine.hardware, {});
    });

    it('handles partial hardware info', function() {
      var change = {
        Id: '42',
        InstanceId: 'my-machine-instance',
        Status: 'started',
        HardwareCharacteristics: {Arch: 'amd64'}
      };
      machineLegacyInfo(db, 'change', change);
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
        Id: '42',
        InstanceId: 'my-machine-instance',
        Status: 'started',
        SupportedContainers: [],
        SupportedContainersKnown: false
      };
      machineLegacyInfo(db, 'change', change);
      assert.strictEqual(db.machines.size(), 1);
      // Retrieve the machine from the database.
      var machine = db.machines.getById('42');
      assert.isNull(machine.supportedContainers);
    });

  });

  describe('annotationLegacyInfo handler', function() {
    var annotationLegacyInfo;

    before(function() {
      annotationLegacyInfo = handlers.annotationLegacyInfo;
    });

    it('stores annotations on an application', function() {
      db.services.add({id: 'django'});
      var annotations = {'gui-x': '42', 'gui-y': '47'};
      var change = {
        Tag: 'service-django',
        Annotations: annotations
      };
      annotationLegacyInfo(db, 'add', change);
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
        Tag: 'unit-django-2',
        Annotations: annotations
      };
      annotationLegacyInfo(db, 'add', change);
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
        Tag: 'machine-1',
        Annotations: annotations
      };
      annotationLegacyInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      var machine = db.machines.getById('1');
      assert.deepEqual(annotations, machine.annotations);
    });

    it('stores annotations on the environment', function() {
      var annotations = {'foo': '42', 'bar': '47'};
      var change = {
        Tag: 'environment-foo',
        Annotations: annotations
      };
      annotationLegacyInfo(db, 'add', change);
      // Retrieve the annotations from the database.
      assert.deepEqual(annotations, db.environment.get('annotations'));
    });

    it('correctly updates annotations', function() {
      var initial = {'gui-x': '42'},
          next = {'gui-y': '47', 'gui-z': 'Now in 3D!'},
          expected = {'gui-x': '42', 'gui-y': '47', 'gui-z': 'Now in 3D!'};
      db.services.add({id: 'django', annotations: initial});
      var change = {
        Tag: 'service-django',
        Annotations: next
      };
      annotationLegacyInfo(db, 'change', change);
      // Retrieve the annotations from the database.
      var application = db.services.getById('django');
      // we can see that it merged initial and next.
      assert.deepEqual(expected, application.get('annotations'));
    });

    it('does not override the application exposed attr', function() {
      db.services.add({id: 'django', exposed: true});
      var annotations = {'gui-x': '42', 'gui-y': '47'};
      var change = {
        Tag: 'service-django',
        Annotations: annotations
      };
      annotationLegacyInfo(db, 'add', change);
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
        Tag: 'unit-django-2',
        Annotations: annotations
      };
      annotationLegacyInfo(db, 'add', change);
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
        Tag: 'service-django',
        Annotations: annotations
      };
      annotationLegacyInfo(db, 'add', change);
      assert.strictEqual(0, db.services.size());
    });

  });

});
