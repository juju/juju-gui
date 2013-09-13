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

  describe('Juju delta handlers', function() {
    var db, models, handlers, Y;
    var requirements = ['juju-models', 'juju-delta-handlers'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        handlers = models.handlers;
        done();
      });
    });

    beforeEach(function() {
      db = new models.Database();
    });


    describe('pyDelta handler', function() {
      var pyDelta;

      before(function() {
        pyDelta = handlers.pyDelta;
      });

      it('replaces the attribute names when required', function() {
        var change = {
          id: 'django/1',
          private_address: '10.0.0.1',
          'public-address': 'example.com',
          'is-subordinate': true,
          'hyphens-are-delicious': '42'
        };
        pyDelta(db, 'add', change, 'unit');
        // Retrieve the unit from the database.
        var unit = db.units.getById('django/1');
        assert.strictEqual('10.0.0.1', unit.private_address);
        assert.strictEqual('example.com', unit.public_address);
        assert.isTrue(unit.is_subordinate);
        assert.strictEqual('42', unit.hyphens_are_delicious);
      });

      it('passes through environment annotations without changes', function() {
        pyDelta(db, 'change', {'hyphenated-key': 'peanut'}, 'annotations');
        assert.strictEqual(
            'peanut',
            db.environment.get('annotations')['hyphenated-key']);
      });

      it('automatically handles changes to different model lists', function() {
        pyDelta(db, 'add', {id: 'django'}, 'service');
        pyDelta(db, 'add', {id: 'django/1'}, 'unit');
        pyDelta(db, 'add', {id: '1'}, 'machine');
        assert.strictEqual(1, db.services.size());
        assert.strictEqual(1, db.units.size());
        assert.strictEqual(1, db.machines.size());
        assert.isNotNull(db.services.getById('django'));
        assert.isNotNull(db.units.getById('django/1'));
        assert.isNotNull(db.machines.getById('1'));
      });

      it('automatically handles removals of model lists', function() {
        db.services.add({
          id: 'wordpress',
          charm: 'cs:quantal/wordpress-11',
          exposed: true
        });
        db.units.add({
          id: 'wordpress/1',
          agent_state: 'pending',
          public_address: 'example.com',
          private_address: '10.0.0.1'
        });
        pyDelta(db, 'remove', 'wordpress/1', 'unit');
        pyDelta(db, 'remove', 'wordpress', 'service');
        assert.strictEqual(0, db.services.size());
        assert.strictEqual(0, db.units.size());
      });

    });


    describe('unitInfo handler', function() {
      var unitInfo;

      before(function() {
        unitInfo = handlers.unitInfo;
      });

      it('creates a unit in the database', function() {
        var change = {
          Name: 'django/1',
          Service: 'django',
          MachineId: '1',
          Status: 'pending',
          StatusInfo: 'info',
          PublicAddress: 'example.com',
          PrivateAddress: '10.0.0.1',
          Ports: [{Number: 80, Protocol: 'tcp'}, {Number: 42, Protocol: 'udp'}]
        };
        unitInfo(db, 'add', change);
        assert.strictEqual(1, db.units.size());
        // Retrieve the unit from the database.
        var unit = db.units.getById('django/1');
        assert.strictEqual('django', unit.service);
        assert.strictEqual('1', unit.machine);
        assert.strictEqual('pending', unit.agent_state);
        assert.strictEqual('info', unit.agent_state_info);
        assert.strictEqual('example.com', unit.public_address);
        assert.strictEqual('10.0.0.1', unit.private_address);
        assert.deepEqual(['80/tcp', '42/udp'], unit.open_ports);
      });

      it('updates a unit in the database', function() {
        db.units.add({
          id: 'django/2',
          agent_state: 'pending',
          public_address: 'example.com',
          private_address: '10.0.0.1'
        });
        var change = {
          Name: 'django/2',
          Status: 'started',
          PublicAddress: 'example.com',
          PrivateAddress: '192.168.0.1'
        };
        unitInfo(db, 'change', change);
        assert.strictEqual(1, db.units.size());
        // Retrieve the unit from the database.
        var unit = db.units.getById('django/2');
        assert.strictEqual('started', unit.agent_state);
        assert.strictEqual('example.com', unit.public_address);
        assert.strictEqual('192.168.0.1', unit.private_address);
      });

      it('creates or updates the corresponding machine', function() {
        var machine;
        var change = {
          Name: 'django/2',
          MachineId: '1',
          Status: 'pending',
          PublicAddress: 'example.com'
        };
        unitInfo(db, 'add', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database.
        machine = db.machines.getById(1);
        assert.strictEqual('example.com', machine.public_address);
        // Update the machine.
        change.PublicAddress = 'example.com/foo';
        unitInfo(db, 'change', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database (again).
        machine = db.machines.getById('1');
        assert.strictEqual('example.com/foo', machine.public_address);
      });

      it('removes a unit from the database', function() {
        db.units.add({
          id: 'django/2',
          agent_state: 'pending',
          public_address: 'example.com',
          private_address: '10.0.0.1'
        });
        var change = {
          Name: 'django/2',
          Status: 'started',
          PublicAddress: 'example.com',
          PrivateAddress: '192.168.0.1'
        };
        unitInfo(db, 'remove', change);
        assert.strictEqual(0, db.units.size());
      });

    });


    describe('serviceInfo handler', function() {
      var serviceInfo, constraints, config;

      before(function() {
        serviceInfo = handlers.serviceInfo;
        constraints = {
          'arch': '',
          'cpu-cores': 4};
        config = {cow: 'pie'};
      });

      it('creates a service in the database', function() {
        var change = {
          Name: 'django',
          CharmURL: 'cs:precise/django-42',
          Exposed: true,
          Constraints: constraints,
          Config: config,
          Life: 'alive'
        };
        serviceInfo(db, 'add', change);
        assert.strictEqual(1, db.services.size());
        // Retrieve the service from the database.
        var service = db.services.getById('django');
        assert.strictEqual('cs:precise/django-42', service.get('charm'));
        assert.isTrue(service.get('exposed'));
        assert.deepEqual(constraints, service.get('constraints'));
        // The config on the service is initially set to the customized subset
        // in the delta stream.  The full config will be gotten via a call to
        // get_service.
        assert.deepEqual(config, service.get('config'));
        assert.strictEqual('alive', service.get('life'));
      });

      it('updates a service in the database', function() {
        db.services.add({
          id: 'wordpress',
          charm: 'cs:quantal/wordpress-11',
          exposed: true
        });
        var change = {
          Name: 'wordpress',
          CharmURL: 'cs:quantal/wordpress-11',
          Exposed: false,
          Life: 'dying'
        };
        serviceInfo(db, 'change', change);
        assert.strictEqual(1, db.services.size());
        // Retrieve the service from the database.
        var service = db.services.getById('wordpress');
        assert.strictEqual('cs:quantal/wordpress-11', service.get('charm'));
        assert.isFalse(service.get('exposed'));
        assert.strictEqual('dying', service.get('life'));
      });

      it('if constraints are not in the change stream they are {}',
         function() {
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
           serviceInfo(db, 'change', change);
           assert.strictEqual(1, db.services.size());
           // Retrieve the service from the database.
           var service = db.services.getById('wordpress');
           assert.deepEqual({}, service.get('constraints'));
         });

      it('if configs are not in the change stream they are {}',
         function() {
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
           serviceInfo(db, 'change', change);
           assert.strictEqual(1, db.services.size());
           // Retrieve the service from the database.
           var service = db.services.getById('wordpress');
           assert.deepEqual({}, service.get('config'));
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
        serviceInfo(db, 'change', change);
        assert.strictEqual(1, db.services.size());
        // Retrieve the service from the database.
        var service = db.services.getById('wordpress');
        assert.deepEqual(changedConstraints, service.get('constraints'));
      });

      it('handles config changes', function() {
        db.services.add({
          id: 'wordpress',
          charm: 'cs:quantal/wordpress-11',
          exposed: true,
          config: {moon: 'beam', cow: 'boy'}
        });
        var change = {
          Name: 'wordpress',
          CharmURL: 'cs:quantal/wordpress-11',
          Exposed: false,
          Config: config
        };
        serviceInfo(db, 'change', change);
        assert.strictEqual(1, db.services.size());
        // Retrieve the service from the database.
        var service = db.services.getById('wordpress');
        assert.deepEqual({moon: 'beam', cow: 'pie'}, service.get('config'));
      });

      it('removes a service from the database', function() {
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
        serviceInfo(db, 'remove', change);
        assert.strictEqual(0, db.services.size());
      });

    });


    describe('relationInfo handler', function() {
      var dbEndpoints, deltaEndpoints, relationInfo, relationKey;

      before(function() {
        relationInfo = handlers.relationInfo;
        relationKey = 'haproxy:reverseproxy wordpress:website';
      });

      beforeEach(function() {
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
          Key: relationKey,
          Endpoints: deltaEndpoints
        };
        relationInfo(db, 'remove', change);
        assert.strictEqual(db.relations.size(), 0);
      });

    });


    describe('machineInfo handler', function() {
      var machineInfo;

      before(function() {
        machineInfo = handlers.machineInfo;
      });

      it('creates a machine in the database', function() {
        var change = {
          Id: '1',
          InstanceId: 'my-machine-instance',
          Status: 'pending',
          StatusInfo: 'info'
        };
        machineInfo(db, 'add', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database.
        var machine = db.machines.getById('1');
        assert.strictEqual('my-machine-instance', machine.instance_id);
        assert.strictEqual('pending', machine.agent_state);
        assert.strictEqual('info', machine.agent_state_info);
      });

      it('updates a machine in the database', function() {
        db.machines.add({
          id: '2',
          instance_id: 'instance-42',
          agent_state: 'error',
          agent_state_info: 'there is something wrong'
        });
        var change = {
          Id: '2',
          InstanceId: 'instance-47',
          Status: 'running',
          StatusInfo: ''
        };
        machineInfo(db, 'change', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database.
        var machine = db.machines.getById('2');
        assert.strictEqual('instance-47', machine.instance_id);
        assert.strictEqual('running', machine.agent_state);
        assert.strictEqual('', machine.agent_state_info);
      });

    });


    describe('annotationInfo handler', function() {
      var annotationInfo;

      before(function() {
        annotationInfo = handlers.annotationInfo;
      });

      it('stores annotations on a service', function() {
        db.services.add({id: 'django'});
        var annotations = {'gui-x': '42', 'gui-y': '47'};
        var change = {
          Tag: 'service-django',
          Annotations: annotations
        };
        annotationInfo(db, 'add', change);
        // Retrieve the annotations from the database.
        var service = db.services.getById('django');
        assert.deepEqual(annotations, service.get('annotations'));
      });

      it('stores annotations on a unit', function() {
        db.units.add({id: 'django/2'});
        var annotations = {'foo': '42', 'bar': '47'};
        var change = {
          Tag: 'unit-django-2',
          Annotations: annotations
        };
        annotationInfo(db, 'add', change);
        // Retrieve the annotations from the database.
        var unit = db.units.getById('django/2');
        assert.deepEqual(annotations, unit.annotations);
      });

      it('stores annotations on a machine', function() {
        db.machines.add({id: '1'});
        var annotations = {'foo': '42', 'bar': '47'};
        var change = {
          Tag: 'machine-1',
          Annotations: annotations
        };
        annotationInfo(db, 'add', change);
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
        annotationInfo(db, 'add', change);
        // Retrieve the annotations from the database.
        assert.deepEqual(annotations, db.environment.get('annotations'));
      });

      it('correctly updates annotations', function() {
        var initial = {'gui-x': '42'},
            expected = {'gui-y': '47', 'gui-z': 'Now in 3D!'};
        db.services.add({id: 'django', annotations: initial});
        var change = {
          Tag: 'service-django',
          Annotations: expected
        };
        annotationInfo(db, 'change', change);
        // Retrieve the annotations from the database.
        var service = db.services.getById('django');
        assert.deepEqual(expected, service.get('annotations'));
      });

      it('does not override the service exposed attr', function() {
        db.services.add({id: 'django', exposed: true});
        var annotations = {'gui-x': '42', 'gui-y': '47'};
        var change = {
          Tag: 'service-django',
          Annotations: annotations
        };
        annotationInfo(db, 'add', change);
        // Retrieve the annotations from the database.
        var service = db.services.getById('django');
        assert.isTrue(service.get('exposed'));
      });

      it('does not override the unit relation_errors attr', function() {
        var relation_errors = {'cache': ['memcached']},
            annotations = {'foo': '42', 'bar': '47'};
        db.units.add({id: 'django/2', relation_errors: relation_errors});
        var change = {
          Tag: 'unit-django-2',
          Annotations: annotations
        };
        annotationInfo(db, 'add', change);
        // Retrieve the annotations from the database.
        var unit = db.units.getById('django/2');
        assert.deepEqual(relation_errors, unit.relation_errors);
      });

      it('does not create new model instances', function() {
        var annotations = {'gui-x': '42', 'gui-y': '47'};
        var change = {
          Tag: 'service-django',
          Annotations: annotations
        };
        annotationInfo(db, 'add', change);
        assert.strictEqual(0, db.services.size());
      });

    });

  });


  describe('Juju delta handlers utilities', function() {
    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-delta-handlers'], function(Y) {
        utils = Y.namespace('juju.models').utils;
        done();
      });
    });


    describe('Go Juju Entity Tag cleaner', function() {
      var cleanUpEntityTags;

      before(function() {
        cleanUpEntityTags = utils.cleanUpEntityTags;
      });

      it('cleans up tags from Go juju', function() {
        // Clean up service tags.
        assert.equal('mysql', cleanUpEntityTags('service-mysql'));
        assert.equal(
            'buildbot-master', cleanUpEntityTags('service-buildbot-master'));
        // Clean up unit tags.
        assert.equal('mysql/47', cleanUpEntityTags('unit-mysql-47'));
        assert.equal(
            'buildbot-master/0', cleanUpEntityTags('unit-buildbot-master-0'));
        // Clean up machine tags.
        assert.equal('0', cleanUpEntityTags('machine-0'));
        assert.equal('42', cleanUpEntityTags('machine-42'));
        // Clean up environment tags.
        assert.equal('aws', cleanUpEntityTags('environment-aws'));
        assert.equal('my-env', cleanUpEntityTags('environment-my-env'));
      });

      it('ignores bad values', function() {
        var data = ['foo', 'bar-baz', '123', 'unit-', 'service-', 'machine'];
        Y.each(data, function(item) {
          assert.equal(item, cleanUpEntityTags(item));
        });
      });

    });


    describe('Go Juju ports converter', function() {
      var convertOpenPorts;

      before(function() {
        convertOpenPorts = utils.convertOpenPorts;
      });

      it('correctly returns a list of ports', function() {
        var ports = [
          {Number: 80, Protocol: 'tcp'},
          {Number: 42, Protocol: 'udp'}
        ];
        assert.deepEqual(['80/tcp', '42/udp'], convertOpenPorts(ports));
      });

      it('returns an empty list if there are no ports', function() {
        assert.deepEqual([], convertOpenPorts([]));
        assert.deepEqual([], convertOpenPorts(null));
        assert.deepEqual([], convertOpenPorts(undefined));
      });

    });


    describe('Go Juju endpoints converter', function() {
      var createEndpoints;

      before(function() {
        createEndpoints = utils.createEndpoints;
      });

      it('correctly returns a list of endpoints', function() {
        var endpoints = [
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

  });

})();
