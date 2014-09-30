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

describe('test_model.js', function() {
  describe('Charm initialization', function() {
    var models;

    before(function(done) {
      YUI(GlobalConfig).use('juju-models', 'juju-charm-models', function(Y) {
        models = Y.namespace('juju.models');
        done();
      });
    });

    it('must be able to create Charm', function() {
      var charm = new models.Charm(
          {id: 'cs:~alt-bac/precise/openstack-dashboard-0'});
      charm.get('scheme').should.equal('cs');
      charm.get('owner').should.equal('alt-bac');
      charm.get('series').should.equal('precise');
      charm.get('package_name').should.equal('openstack-dashboard');
      charm.get('revision').should.equal(0);
      charm.get('full_name').should.equal(
          '~alt-bac/precise/openstack-dashboard');
      charm.get('charm_path').should.equal(
          '~alt-bac/precise/openstack-dashboard-0/json');
    });

    it('must not set "owner" for promulgated charms', function() {
      var charm = new models.Charm({
        id: 'cs:precise/openstack-dashboard-0'
      });
      assert.isUndefined(charm.get('owner'));
    });

    it('must accept charm ids without versions.', function() {
      var charm = new models.Charm(
          {id: 'cs:~alt-bac/precise/openstack-dashboard'});
      assert.isUndefined(charm.get('revision'));
      assert.equal(charm.get('charm_path'),
          '~alt-bac/precise/openstack-dashboard/json');
    });

    it('must be able to parse hyphenated owner names', function() {
      // Note that an earlier version of the parsing code did not handle
      // hyphens in user names, so this test intentionally includes one.
      var charm = new models.Charm(
          {id: 'cs:~marco-ceppi/precise/wordpress-17'});
      charm.get('full_name').should.equal('~marco-ceppi/precise/wordpress');
    });

    it('must reject bad charm ids.', function() {
      try {
        /* jshint -W031 */
        new models.Charm({id: 'foobar'});
        /* jshint +W031 */
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal(
            'Developers must initialize charms with a well-formed id.');
      }
    });


    it('must reject missing charm ids at initialization.', function() {
      try {
        /* jshint -W031 */
        new models.Charm();
        /* jshint +W031 */
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal(
            'Developers must initialize charms with a well-formed id.');
      }
    });

  });

  describe('juju models', function() {
    var models, Y, utils;
    var requirements = ['juju-models', 'juju-charm-models', 'juju-tests-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      window._gaq = [];
    });

    it('should aggregate unit info when adding units', function() {
      var service_unit = {id: 'mysql/0'};
      var db = new models.Database();
      var stub = utils.makeStubMethod(
          db.units, 'update_service_unit_aggregates');
      this._cleanups.push(stub.reset);
      db.services.add({id: 'mysql'});
      db.addUnits(service_unit);
      assert.equal(stub.calledOnce(), true);
    });

    it('should be able to aggregate unit by status', function() {
      var sl = new models.ServiceList();
      var mysql = new models.Service({id: 'mysql'});
      var wordpress = new models.Service({id: 'wordpress'});
      sl.add([mysql, wordpress]);
      var my0 = {id: 'mysql/0', agent_state: 'pending'};
      var my1 = {id: 'mysql/1', agent_state: 'pending'};
      mysql.get('units').add([my0, my1], true);
      var wp0 = {id: 'wordpress/0', agent_state: 'pending'};
      // The order of these errored units is important because there was an old
      // long standing bug where if the first unit was in relation error it
      // would drop the error status silently.
      var wp1 = {
        id: 'wordpress/2',
        agent_state: 'error',
        agent_state_info: 'hook failed: "db-relation-changed"',
        agent_state_data: {
          hook: 'db-relation-changed',
          'relation-id': 1,
          'remote-unit': 'mysql/0'
        }
      };
      var wp2 = {
        id: 'wordpress/1',
        agent_state: 'error',
        agent_state_info: 'hook failed: "install"'
      };
      wordpress.get('units').add([wp0, wp1, wp2], true);

      assert.deepEqual(mysql.get('units')
                       .get_informative_states_for_service(mysql),
          [{'pending': 2}, {}]);
      assert.deepEqual(wordpress.get('units')
                       .get_informative_states_for_service(wordpress),
          [{'pending': 1, 'error': 2}, { mysql: 'db-relation-changed'}]);
    });

    it('service unit list should update analytics when units are added',
       function() {
         var sl = new models.ServiceList();
         var mysql = new models.Service({id: 'mysql'});
         sl.add([mysql]);
         var my0 = {id: 'mysql/0', agent_state: 'pending'};
         var my1 = {id: 'mysql/1', agent_state: 'pending'};
         var sul = mysql.get('units');

         window._gaq.should.eql([]);
         sul.add([my0], true);
         sul.update_service_unit_aggregates(mysql);
         window._gaq.pop().should.eql(['_trackEvent', 'Service Stats', 'Update',
           'mysql', 1]);
         sul.add([my1], true);
         sul.update_service_unit_aggregates(mysql);
         window._gaq.pop().should.eql(['_trackEvent', 'Service Stats', 'Update',
           'mysql', 2]);
         // Calling update with no additions does not create a new trackEvent.
         sul.update_service_unit_aggregates(mysql);
         window._gaq.should.eql([]);
       });

    it('services are instantiated with _dirtyFields property', function() {
      var service = new models.Service();
      var dirtyFields = service.get('_dirtyFields');
      assert.equal(Y.Lang.isArray(dirtyFields), true);
      assert.equal(dirtyFields.length, 0);
    });

    it('services have unit and relation modellists', function() {
      var service = new models.Service();
      assert.equal(service.get('units') instanceof
                   models.ServiceUnitList, true);
      assert.equal(service.get('relations') instanceof
                   models.RelationList, true);
    });

    it('relation changes on service update relationChangeTrigger',
        function(done) {
          var service = new models.Service();
          var relations = service.get('relations');
          var handler = relations.on(
              '*:add', function() {
                // This means that it will update the aggregate
                // relations for databinding
                handler.detach();
                var isObject = Y.Lang.isObject;
                assert.equal(
                    isObject(service.get('relationChangeTrigger')), true);
                done();
              });
          relations.add(new models.Relation());
        });

    it('service unit objects should parse the service name from unit id',
       function() {
         var service_unit = {id: 'mysql/0'};
         var db = new models.Database();
         db.services.add({id: 'mysql'});
         db.addUnits(service_unit);
         service_unit.service.should.equal('mysql');
       });

    it('service unit objects should report their number correctly',
       function() {
         var service_unit = {id: 'mysql/5'};
         var db = new models.Database();
         db.services.add({id: 'mysql'});
         db.addUnits(service_unit);
         service_unit.number.should.equal(5);
       });

    it('should display service names properly', function() {
      var db = new models.Database(),
          longId = '1234567890123456789',
          shortId = '12345678901234567';
      db.services.add([{id: longId}, {id: shortId}]);
      var longName = db.services.getById(longId).get('displayName');
      assert.equal(longName.length, 18, 'name is not trucated');
      var shortName = db.services.getById(shortId).get('displayName');
      assert.equal(shortName.length, shortId.length,
                   'name does not match');
    });

    it('should display ghost service names properly', function() {
      var db = new models.Database(),
          longId = '12345678901',
          shortId = '123456789';
      db.services.add([
        {id: longId, pending: true},
        {id: shortId, pending: true}
      ]);
      var longName = db.services.getById(longId).get('displayName');
      var shortName = db.services.getById(shortId).get('displayName');
      assert.equal(longName.indexOf('('), 0,
                   'open paren not found');
      assert.equal(longName.lastIndexOf(')'), longName.length - 1,
                   'close paren not found');
      assert.equal(shortName.indexOf('('), 0,
                   'open paren not found');
      assert.equal(shortName.lastIndexOf(')'), shortName.length - 1,
                   'close paren not found');
      // add 2 to the expected length to account for the parenthesis
      // that surround ghosted names
      assert.equal(longName.length, 10 + 2,
                   'name is not trucated');
      assert.equal(shortName.length, shortId.length + 2,
                   'name does not match');
    });

    it('must be able to resolve models by their name', function() {
      var db = new models.Database();
      // Add some services.
      db.services.add([{id: 'wordpress'}, {id: 'mediawiki'}]);
      // A service is properly resolved.
      var service = db.services.item(0);
      assert.deepEqual(db.resolveModelByName(service.get('id')), service);

      // Add some units.
      db.addUnits([{id: 'wordpress/0'}, {id: 'wordpress/1'}]);
      // A unit is properly resolved.
      var unit = db.units.item(0);
      assert.deepEqual(db.resolveModelByName(unit.id), unit);

      // Add some machines.
      db.machines.add([{id: '0'}, {id: '42'}]);
      // A machine is properly resolved.
      var machine = db.machines.item(0);
      assert.deepEqual(db.resolveModelByName(machine.id), machine);

      // The environment is correctly retrieved.
      assert.equal(db.resolveModelByName('env'), db.environment);
    });

    describe.only('onDelta', function() {
      it('should update service units on change', function() {
        var db = new models.Database();
        var mysql = new models.Service({id: 'mysql'});
        db.services.add([mysql]);
        assert.equal(mysql.get('units') instanceof models.ServiceUnitList, true);
        db.onDelta({data: {result: [
          ['unit', 'add', {id: 'mysql/0', agent_state: 'pending'}],
          ['unit', 'add', {id: 'mysql/1', agent_state: 'pending'}]
        ]}});
        assert.equal(mysql.get('units').size(), 2);
        db.onDelta({data: {result: [
          ['unit', 'remove', 'mysql/1']
        ]}});
        assert.equal(mysql.get('units').size(), 1);
      });

      it('should handle remove changes correctly',
         function() {
           var db = new models.Database();
           var mysql = db.services.add({id: 'mysql'});
           var my0 = {id: 'mysql/0', agent_state: 'pending'};
           var my1 = {id: 'mysql/1', agent_state: 'pending'};
           db.addUnits([my0, my1]);
           db.onDelta({data: {result: [
             ['unit', 'remove', 'mysql/1']
           ]}});
           var names = mysql.get('units').get('id');
           names.length.should.equal(1);
           names[0].should.equal('mysql/0');
         });

      it('should be able to reuse existing services with add',
         function() {
           var db = new models.Database();
           var my0 = new models.Service({id: 'mysql', exposed: true});
           db.services.add([my0]);
           // Note that exposed is not set explicitly to false.
           db.onDelta({data: {result: [
             ['service', 'add', {id: 'mysql'}]
           ]}});
           my0.get('exposed').should.equal(false);
         });

      it('should be able to reuse existing units with add',
         // Units are special because they use the LazyModelList.
         function() {
           var db = new models.Database();
           db.services.add({id: 'mysql'});
           var my0 = {id: 'mysql/0', agent_state: 'pending'};
           db.addUnits([my0]);
           db.onDelta({data: {result: [
             ['unit', 'add', {id: 'mysql/0', agent_state: 'another'}]
           ]}});
           my0.agent_state.should.equal('another');
         });

      // We no longer use relation_errors but this test should remain until it's
      // completely removed from the codebase.
      it.skip('should reset relation_errors',
          function() {
            var db = new models.Database();
            var my0 = {id: 'mysql/0', relation_errors: {'cache': ['memcached']}};
            db.addUnits([my0]);
            // Note that relation_errors is not set.
            db.onDelta({data: {result: [
              ['unit', 'change', {id: 'mysql/0'}]
            ]}});
            my0.relation_errors.should.eql({});
          });
    });

    it('ServiceUnitList should accept a list of units at instantiation and ' +
       'decorate them', function() {
         var mysql = new models.Service({id: 'mysql'});
         var objs = [{id: 'mysql/0'}, {id: 'mysql/1'}];
         var sul = mysql.get('units');
         sul.add(objs, true);
         var unit_data = sul.getAttrs(['service', 'number']);
         unit_data.service.should.eql(['mysql', 'mysql']);
         unit_data.number.should.eql([0, 1]);
       });

    it('RelationList.has_relations.. should return true if rel found.',
       function() {
         var db = new models.Database(),
         service = new models.Service({id: 'mysql', exposed: false}),
         rel0 = new models.Relation({
           id: 'relation-0',
           endpoints: [
             ['mediawiki', {name: 'cache', role: 'source'}],
             ['squid', {name: 'cache', role: 'front'}]],
           'interface': 'cache'
         }),
         rel1 = new models.Relation({
           id: 'relation-4',
           endpoints: [
             ['something', {name: 'foo', role: 'bar'}],
             ['mysql', {name: 'la', role: 'lee'}]],
           'interface': 'thing'
         });
         db.relations.add([rel0, rel1]);
         db.relations.has_relation_for_endpoint(
         {service: 'squid', name: 'cache', type: 'cache'}
         ).should.equal(true);
         db.relations.has_relation_for_endpoint(
         {service: 'mysql', name: 'la', type: 'thing'}
         ).should.equal(true);
         db.relations.has_relation_for_endpoint(
         {service: 'squid', name: 'cache', type: 'http'}
         ).should.equal(false);

         // We can also pass a service name which must match for the
         // same relation.

         db.relations.has_relation_for_endpoint(
         {service: 'squid', name: 'cache', type: 'cache'},
         'kafka'
         ).should.equal(false);

         db.relations.has_relation_for_endpoint(
         {service: 'squid', name: 'cache', type: 'cache'},
         'mediawiki'
         ).should.equal(true);

       });

    it('RelationList.get_relations_for_service should do what it says',
       function() {
         var db = new models.Database(),
         service = new models.Service({id: 'mysql', exposed: false}),
         rel0 = new models.Relation(
         { id: 'relation-0',
           endpoints:
           [['mediawiki', {name: 'cache', role: 'source'}],
            ['squid', {name: 'cache', role: 'front'}]],
           'interface': 'cache' }),
         rel1 = new models.Relation(
         { id: 'relation-1',
           endpoints: [['wordpress', {role: 'peer', name: 'loadbalancer'}]],
           'interface': 'reversenginx' }),
         rel2 = new models.Relation(
         { id: 'relation-2',
           endpoints: [['mysql', {name: 'db', role: 'db'}],
             ['mediawiki', {name: 'storage', role: 'app'}]],
           'interface': 'db'}),
         rel3 = new models.Relation(
         { id: 'relation-3',
           endpoints:
           [['mysql', {role: 'peer', name: 'loadbalancer'}]],
           'interface': 'mysql-loadbalancer' }),
         rel4 = new models.Relation(
         { id: 'relation-4',
           endpoints:
           [['something', {name: 'foo', role: 'bar'}],
            ['mysql', {name: 'la', role: 'lee'}]],
                  'interface': 'thing' });
         db.relations.add([rel0, rel1, rel2, rel3, rel4]);
         db.relations.get_relations_for_service(service).map(
         function(r) { return r.get('id'); })
         .should.eql(['relation-2', 'relation-3', 'relation-4']);
       });

    it('getRelationFromEndpoints returns relation using endpoints', function() {
      var relations = new models.RelationList();
      var relation = new models.Relation({
        endpoints: [
          ['wordpress', {
            name: 'db',
            role: 'server'
          }],
          ['mysql', {
            name: 'db',
            role: 'client'
          }]
        ]});
      var endpoints = [
        ['wordpress', {
          name: 'db',
          role: 'server'
        }],
        ['mysql', {
          name: 'db',
          role: 'client'
        }]
      ];
      relations.add(relation);
      assert.deepEqual(relations.getRelationFromEndpoints(endpoints), relation);
    });

    it('compareRelationEndpoints can compare two endpoint sets', function() {
      var relations = new models.RelationList();
      var endpointSetA = [
        ['wordpress', {
          name: 'db',
          role: 'server'
        }],
        ['mysql', {
          name: 'db',
          role: 'client'
        }]
      ];
      var endpointSetB = [
        ['wordpress', {
          name: 'db',
          role: 'server'
        }],
        ['mysql', {
          name: 'db',
          role: 'client'
        }]
      ];

      assert.equal(
          relations.compareRelationEndpoints(
              [endpointSetA[0], endpointSetA[1]],
              [endpointSetB[0], endpointSetB[1]]),
          true, 'compare set 1 failed');
      assert.equal(
          relations.compareRelationEndpoints(
              [endpointSetA[1], endpointSetA[0]],
              [endpointSetB[0], endpointSetB[1]]),
          true, 'compare set 2 failed');
      assert.equal(
          relations.compareRelationEndpoints(
              [endpointSetA[0], endpointSetA[1]],
              [endpointSetB[1], endpointSetB[0]]),
          true, 'compare set 3 failed');
      assert.equal(
          relations.compareRelationEndpoints(
              [endpointSetA[0], endpointSetA[0]],
              [endpointSetB[1], endpointSetB[1]]),
          false, 'compare set 4 failed');
      // Compare endpoints that share the same origin but connect to different
      // services on the other end. (e.g., wordpress related to both mysql and
      // haproxy)
      assert.equal(
          relations.compareRelationEndpoints(
              [endpointSetA[0], endpointSetA[0]],
              [endpointSetB[0], endpointSetB[1]]),
          false, 'compare set 4 failed');
    });

    it('must be able to reference the Environment model', function() {
      var db = new models.Database();
      var env = db.environment;
      env.get('annotations').should.eql({});
    });

    it('returns a display name for a service', function() {
      var service = new models.Service({id: 'mysql', exposed: false});
      assert.equal(service.get('displayName'), 'mysql');
      service = new models.Service({id: 'service-mysql', exposed: false});
      assert.equal(service.get('displayName'), 'mysql');
    });

    it('updates the display name when the id changes', function() {
      var service = new models.Service({id: 'service-mysql', exposed: false});
      assert.equal(service.get('displayName'), 'mysql');
      service.set('id', 'service-flibbertigibbet');
      assert.equal('flibbertigibbet', service.get('displayName'));
    });

    it('returns a display name for a unit', function() {
      var units = new models.ServiceUnitList();
      assert.equal('mysql/0', units.createDisplayName('unit-mysql-0'));
      assert.equal('mysql/0', units.createDisplayName('mysql/0'));
    });

    describe('services.filterUnits', function() {
      var db, services;

      beforeEach(function() {
        // Set up services and units used for tests.
        db = new models.Database();
        services = db.services;
        services.add({id: 'flask'});
        services.add({id: 'rails'});
        services.add({id: 'react'});
        db.addUnits([
          {id: 'flask/0', machine: '1', agent_state: 'started'},
          {id: 'flask/1', machine: '2', agent_state: 'pending'},
          {id: 'rails/0', machine: '1', agent_state: 'pending'},
          {id: 'rails/1', machine: '2/lxc/0', agent_state: 'error'},
          {id: 'react/42', machine: '0', agent_state: 'error'},
          {id: 'react/47', machine: '1', agent_state: 'started'}
        ]);
      });

      afterEach(function() {
        db.destroy();
      });

      // Ensure the given units have the given expectedNames.
      var assertUnits = function(units, expectedNames) {
        var names = units.map(function(unit) {
          return unit.id;
        });
        names.sort();
        expectedNames.sort();
        assert.deepEqual(names, expectedNames);
      };

      it('filters the units based on a predicate (e.g. machine)', function() {
        var units = services.filterUnits(function(unit) {
          return unit.machine === '1';
        });
        assertUnits(units, ['flask/0', 'rails/0', 'react/47']);
      });

      it('filters the units based on a predicate (e.g. state)', function() {
        var units = services.filterUnits(function(unit) {
          return unit.agent_state === 'error';
        });
        assertUnits(units, ['rails/1', 'react/42']);
      });

      it('returns an empty array if no units match', function() {
        var units = services.filterUnits(function(unit) {
          return unit.machine === '1' && unit.agent_state === 'error';
        });
        assert.strictEqual(units.length, 0);
      });

    });

    describe('services.principals', function() {
      var services;

      beforeEach(function() {
        services = new models.ServiceList();
      });

      afterEach(function() {
        services.destroy();
      });

      // Ensure the services in the given model list have the expected names.
      var assertServices = function(services, expectedNames) {
        var names = services.map(function(service) {
          return service.get('id');
        });
        names.sort();
        expectedNames.sort();
        assert.deepEqual(names, expectedNames);
      };

      it('returns the principal services', function() {
        services.add([
          {id: 'django', subordinate: false},
          {id: 'puppet', subordinate: true},
          {id: 'rails', subordinate: false},
          {id: 'storage', subordinate: true}
        ]);
        assertServices(services.principals(), ['django', 'rails']);
      });

      it('returns an empty list if there are no principals', function() {
        services.add([
          {id: 'puppet', subordinate: true},
          {id: 'nagios', subordinate: true}
        ]);
        assert.strictEqual(services.principals().size(), 0);
      });

      it('returns all the services if there are no subordinates', function() {
        services.add([
          {id: 'redis', subordinate: false},
          {id: 'react', subordinate: false},
          {id: 'postgres', subordinate: false}
        ]);
        assertServices(services.principals(), ['postgres', 'react', 'redis']);
      });

    });

    describe('serviceUnits.preventDirectChanges', function() {

      it('changes are disallowed when instantiating the db', function() {
        var db = new models.Database();
        assert.strictEqual(db.units.get('preventDirectChanges'), true);
      });

      it('changes are disallowed in the service units', function() {
        var db = new models.Database();
        var service = db.services.add({id: 'django'});
        var units = service.get('units');
        assert.strictEqual(units.get('preventDirectChanges'), true);
      });

      it('by default adding units is allowed', function() {
        var units = new models.ServiceUnitList();
        // The following does not raise errors.
        units.add({id: 'django/42'});
      });

      it('by default removing units is allowed', function() {
        var units = new models.ServiceUnitList();
        // The following does not raise errors.
        units.remove({id: 'django/42'});
      });

      it('the model list can be configured to deny adding units', function() {
        var units = new models.ServiceUnitList({preventDirectChanges: true});
        var func = function() {
          units.add({id: 'django/42'});
        };
        assert.throw(func, 'direct calls to units.add() are not allowed');
      });

      it('the model list can be configured to deny units removal', function() {
        var units = new models.ServiceUnitList({preventDirectChanges: true});
        var func = function() {
          units.remove({id: 'django/42'});
        };
        assert.throw(func, 'direct calls to units.remove() are not allowed');
      });

    });

    describe('serviceUnits.filterByMachine', function() {
      var units;

      beforeEach(function() {
        units = new models.ServiceUnitList();
        units.add([
          {id: 'django/0', machine: null},
          {id: 'django/42', machine: '42'},
          {id: 'haproxy/4', machine: '1/lxc/1'},
          {id: 'django/47', machine: '47'},
          {id: 'rails/0', machine: '42'},
          {id: 'rails/1', machine: '42'},
          {id: 'mysql/42', machine: '1/kvm/0/lxc/0'},
          {id: 'rails/42', machine: '1'},
          {id: 'postgres/1'},
          {id: 'django/2', machine: '1/lxc/2'},
          {id: 'rails/2', machine: '1/lxc/1'},
          {id: 'postgres/2'},
          {id: 'mysql/47', machine: '1/kvm/0/lxc/1'},
          {id: 'mysql/12', machine: '15/lxc/6'}
        ]);
      });

      afterEach(function() {
        units.destroy();
      });

      // Map a list of units to their ids.
      var mapUnitIds = function(units) {
        return units.map(function(unit) {
          return unit.id;
        });
      };

      // Ensure the resulting units match the given identifier.
      var assertUnits = function(resultingUnits, ids) {
        var resultingIds = mapUnitIds(resultingUnits);
        assert.deepEqual(resultingIds, ids);
      };

      it('returns all the units hosted by a specific machine', function() {
        var resultingUnits = units.filterByMachine('42');
        assertUnits(resultingUnits, ['django/42', 'rails/0', 'rails/1']);
      });

      it('returns all the units hosted by a specific container', function() {
        var resultingUnits = units.filterByMachine('1/lxc/1');
        assertUnits(resultingUnits, ['haproxy/4', 'rails/2']);
      });

      it('returns the machine hosted units including children', function() {
        var resultingUnits = units.filterByMachine('1', true);
        var expectedUnits = [
          'haproxy/4', 'mysql/42', 'rails/42', 'django/2', 'rails/2',
          'mysql/47'
        ];
        assertUnits(resultingUnits, expectedUnits);
      });

      it('should not return units with partially matching ids', function() {
        var resultingUnits = mapUnitIds(units.filterByMachine('1', true));
        assert.equal(resultingUnits.indexOf('mysql/12'), -1,
            'This item should not be returned');
      });

      it('returns the container hosted units including children', function() {
        var resultingUnits = units.filterByMachine('1/kvm/0', true);
        assertUnits(resultingUnits, ['mysql/42', 'mysql/47']);
      });

      it('returns the machine units with non-existing children', function() {
        var resultingUnits = units.filterByMachine('47', true);
        assertUnits(resultingUnits, ['django/47']);
      });

      it('returns all unplaced units', function() {
        var resultingUnits = units.filterByMachine(null);
        assertUnits(resultingUnits, ['django/0', 'postgres/1', 'postgres/2']);
      });

      it('ignores includeChildren if machine is null', function() {
        var resultingUnits = units.filterByMachine(null, true);
        assertUnits(resultingUnits, ['django/0', 'postgres/1', 'postgres/2']);
      });

      it('returns an empty list if no machines match', function() {
        var resultingUnits = units.filterByMachine('no-such');
        assert.lengthOf(resultingUnits, 0);
      });

      it('returns an empty list even when children are included', function() {
        var resultingUnits = units.filterByMachine('no-such', true);
        assert.lengthOf(resultingUnits, 0);
      });

    });

    describe('machines model list', function() {
      var machineJobs, machines;

      before(function() {
        machineJobs = Y.namespace('juju.environments').machineJobs;
      });

      beforeEach(function() {
        machines = new models.MachineList();
      });

      afterEach(function() {
        machines.destroy();
      });

      it('returns a display name for a machine', function() {
        assert.deepEqual(machines.createDisplayName('machine-0'), '0');
        assert.deepEqual(machines.createDisplayName('42'), '42');
      });

      it('returns a display name for a container', function() {
        assert.deepEqual(machines.createDisplayName('0/lxc/0'), '0/lxc/0');
        assert.deepEqual(
            machines.createDisplayName('1/kvm/0/lxc/42'), '1/kvm/0/lxc/42');
      });

      it('retrieves machine info parsing the bootstrap node name', function() {
        var info = machines.parseMachineName('0');
        assert.isNull(info.parentId);
        assert.isNull(info.containerType);
        assert.strictEqual(info.number, 0);
      });

      it('retrieves machine info parsing a machine name', function() {
        var info = machines.parseMachineName('42');
        assert.isNull(info.parentId);
        assert.isNull(info.containerType);
        assert.strictEqual(info.number, 42);
      });

      it('retrieves machine info parsing a container name', function() {
        var info = machines.parseMachineName('0/lxc/0');
        assert.strictEqual(info.parentId, '0');
        assert.strictEqual(info.containerType, 'lxc');
        assert.strictEqual(info.number, 0);
      });

      it('retrieves machine info parsing a sub-container name', function() {
        var info = machines.parseMachineName('1/lxc/0/kvm/42');
        assert.strictEqual(info.parentId, '1/lxc/0');
        assert.strictEqual(info.containerType, 'kvm');
        assert.strictEqual(info.number, 42);
      });

      it('stores machines data parsing machine names', function() {
        ['42', '0/lxc/0', '1/kvm/0/lxc/42'].forEach(function(id) {
          var machine = machines.add({id: id});
          var info = machines.parseMachineName(id);
          assert.strictEqual(machine.parentId, info.parentId, id);
          assert.strictEqual(machine.containerType, info.containerType, id);
          assert.strictEqual(machine.number, info.number, id);
        });
      });

      it('adds machines with the provided id', function() {
        // XXX frankban 2014-03-04: PYJUJU DEPRECATION.
        // This test can be safely removed once machines._modelToObject is
        // removed.
        [0, '42', '0/lxc/0', '1/kvm/0/lxc/42'].forEach(function(id) {
          var machine = machines.add({id: id});
          assert.deepEqual(machine.id, id);
        });
      });

      it('knows when a machine is a state server', function() {
        var machine = machines.add({
          id: '0',
          jobs: [machineJobs.MANAGE_ENVIRON]
        });
        assert.strictEqual(machine.isStateServer, true);
      });

      it('knows when a machine is not a state server', function() {
        var machine = machines.add({
          id: '0',
          jobs: [machineJobs.HOST_UNITS]
        });
        assert.strictEqual(machine.isStateServer, false);
      });

      it('provides a default job to machines without one', function() {
        var machine = machines.add({id: '0'});
        assert.lengthOf(machine.jobs, 1);
        assert.strictEqual(machine.jobs[0], machineJobs.HOST_UNITS);
      });

      describe('addGhost', function() {

        afterEach(function() {
          machines.reset();
        });

        it('defines a ghost counter', function() {
          assert.strictEqual(machines._ghostCounter, 0);
        });

        it('creates a top level ghost machine', function() {
          machines.addGhost();
          assert.strictEqual(machines.size(), 1);
          var machine = machines.item(0);
          assert.strictEqual(machine.id, 'new0');
        });

        it('creates a ghost container', function() {
          machines.addGhost('0', 'lxc');
          assert.strictEqual(machines.size(), 1);
          var machine = machines.item(0);
          assert.strictEqual(machine.id, '0/lxc/new0');
        });

        it('creates a ghost machine with initial attrs', function() {
          machines.addGhost(null, null, {series: 'trusty'});
          assert.strictEqual(machines.size(), 1);
          var machine = machines.item(0);
          assert.strictEqual(machine.series, 'trusty');
        });

        it('does not mutate the initial attrs', function() {
          var attrs = {series: 'trusty'};
          var original = Y.clone(attrs);
          machines.addGhost(null, null, attrs);
          assert.deepEqual(attrs, original);
        });

        it('raises an error if the container type is not passed', function() {
          var func = function() {machines.addGhost('0');};
          var expectedError = 'parent id specified without a container type';
          assert.throws(func, expectedError);
        });

        it('returns the newly created ghost machine', function() {
          var machine = machines.addGhost();
          assert.deepEqual(machine, machines.item(0));
        });

        it('increases the ghost counter', function() {
          var machine0 = machines.addGhost();
          var machine1 = machines.addGhost('42', 'kvm');
          var machine2 = machines.addGhost();
          assert.strictEqual(machine0.id, 'new0');
          assert.strictEqual(machine1.id, '42/kvm/new1');
          assert.strictEqual(machine2.id, 'new2');
        });

      });

      describe('containerization', function() {

        beforeEach(function() {
          machines.add([
            {id: '0'},
            {id: '1'},
            {id: '1/lxc/0'},
            {id: '2'},
            {id: '2/lxc/42'},
            {id: '2/kvm/0'},
            {id: '2/kvm/0/lxc/0'},
            {id: '2/kvm/0/lxc/1'}
          ]);
        });

        afterEach(function() {
          machines.reset();
        });

        // Ensure the machine instances in machinesArray correspond to the
        // given expectedNames.
        var assertMachinesNames = function(machinesArray, expectedNames) {
          var names = machinesArray.map(function(machine) {
            return machine.id;
          });
          assert.deepEqual(names, expectedNames);
        };

        it('returns the children of a machine', function() {
          assertMachinesNames(machines.filterByParent('1'), ['1/lxc/0']);
          assertMachinesNames(
              machines.filterByParent('2'), ['2/kvm/0', '2/lxc/42']);
        });

        it('returns the children of a container', function() {
          assertMachinesNames(
              machines.filterByParent('2/kvm/0'),
              ['2/kvm/0/lxc/0', '2/kvm/0/lxc/1']);
        });

        it('returns an empty list if a machine has no children', function() {
          assertMachinesNames(machines.filterByParent('0'), []);
          assertMachinesNames(machines.filterByParent('1/lxc/0'), []);
        });

        it('returns an empty list if the parent does not exist', function() {
          assertMachinesNames(machines.filterByParent('42'), []);
        });

        it('allows for retrieving top level machines', function() {
          assertMachinesNames(machines.filterByParent(null), ['0', '1', '2']);
        });

        it('filters machines by machine ancestor', function() {
          assertMachinesNames(machines.filterByAncestor('1'), ['1/lxc/0']);
          assertMachinesNames(
              machines.filterByAncestor('2'),
              ['2/kvm/0', '2/lxc/42', '2/kvm/0/lxc/0', '2/kvm/0/lxc/1']);
        });

        it('filters machines by container ancestor', function() {
          assertMachinesNames(
              machines.filterByAncestor('2/kvm/0'),
              ['2/kvm/0/lxc/0', '2/kvm/0/lxc/1']);
        });

        it('returns an empty list if no descendants are found', function() {
          assertMachinesNames(machines.filterByAncestor('0'), []);
          assertMachinesNames(machines.filterByAncestor('1/lxc/0'), []);
        });

        it('returns an empty list if the ancestor does not exist', function() {
          assertMachinesNames(machines.filterByAncestor('42'), []);
        });

        it('returns all the machines if ancestor is null', function() {
          assert.deepEqual(machines.filterByAncestor(null), machines._items);
        });

      });

    });

  });

  describe('Charm load', function() {
    var Y, models, conn, env, app, container, fakeStore, data, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-models', 'juju-gui', 'datasource-local',
        'juju-tests-utils', 'json-stringify',
        'juju-charm-store'], function(Y) {
        models = Y.namespace('juju.models');
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      conn = new (Y.namespace('juju-tests.utils')).SocketStub();
      env = juju.newEnvironment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div id="test" class="container"></div>');
      data = [];
      fakeStore = new Y.juju.charmworld.APIv3({});
      fakeStore.set('datasource', {
        sendRequest: function(params) {
          params.callback.success({
            response: {
              results: [{
                responseText: data
              }]
            }
          });
        }
      });
    });

    afterEach(function() {
      container.destroy();
    });

    it('will throw an exception with non-read sync', function() {
      var charm = new models.Charm({id: 'local:precise/foo-4'});
      try {
        charm.sync('create');
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal('Only use the "read" action; "create" not supported.');
      }
      try {
        charm.sync('update');
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal('Only use the "read" action; "update" not supported.');
      }
      try {
        charm.sync('delete');
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal('Only use the "read" action; "delete" not supported.');
      }
    });

    it('throws an error if you do not pass get_charm',
       function() {
         var charm = new models.Charm({id: 'local:precise/foo-4'});
         try {
           charm.sync('read', {});
           assert.fail('Should have thrown an error');
         } catch (e) {
           e.should.equal(
           'You must supply a get_charm function.');
         }
         try {
           charm.sync('read', {env: 42});
           assert.fail('Should have thrown an error');
         } catch (e) {
           e.should.equal(
           'You must supply a get_charm function.');
         }
       });

    it('must send request to juju environment for local charms', function() {
      var charm = new models.Charm({id: 'local:precise/foo-4'}).load(env);
      assert(!charm.loaded);
      assert.equal('CharmInfo', conn.last_message().Request);
    });

    it('must handle success from local charm request', function(done) {
      var charm = new models.Charm({id: 'local:precise/foo-4'}).load(
          env,
          function(err, response) {
            assert(!err);
            assert.equal('wowza', charm.get('summary'));
            assert(charm.loaded);
            done();
          });
      var response = {
        RequestId: conn.last_message().RequestId,
        Response: {Meta: {Summary: 'wowza'}, Config: {}}
      };
      env.dispatch_result(response);
      // The test in the callback above should run.
    });

    it('parses charm model options correctly', function(done) {
      var charm = new models.Charm({id: 'local:precise/foo-4'}).load(
          env,
          function(err, response) {
            assert(!err);
            // This checks to make sure the parse mechanism is working properly
            // for both the old ane new charm browser.
            var option = charm.get('options').default_log;
            assert.equal('global', option['default']);
            assert.equal('Default log', option.description);
            done();
          });
      var response = {
        RequestId: conn.last_message().RequestId,
        Response: {
          Meta: {},
          Config: {
            Options: {
              default_log: {
                Default: 'global',
                Description: 'Default log',
                Type: 'string'
              }
            }
          }
        }
      };
      env.dispatch_result(response);
      // The test in the callback above should run.
    });

    it('must handle failure from local charm request', function(done) {
      var charm = new models.Charm({id: 'local:precise/foo-4'}).load(
          env,
          function(err, response) {
            assert(err);
            assert(response.err);
            assert(!charm.loaded);
            done();
          });
      var response = {
        RequestId: conn.last_message().RequestId,
        Error: 'error'
      };
      env.dispatch_result(response);
      // The test in the callback above should run.
    });
  });

  describe('Charm test', function() {
    var data, instance, models, origData, relatedData, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'io',
        'juju-charm-models',
        'juju-tests-utils'
      ], function(Y) {
        models = Y.namespace('juju.models');
        utils = Y.namespace('juju-tests.utils');

        origData = utils.loadFixture('data/browsercharm.json', true);
        // relatedData is never mutated so it can be used directly.
        relatedData = utils.loadFixture('data/related.json', true).result;
        done();
      });
    });

    beforeEach(function() {
      data = Y.clone(origData);
    });

    afterEach(function() {
      if (instance) {
        instance.destroy();
      }
    });

    it('maps api downloads in 30 days to recent downloads', function() {
      data.charm.downloads_in_past_30_days = 10;
      instance = new models.Charm(data.charm);
      instance.get('recent_download_count').should.eql(10);
    });

    it('maps relations to keep with the original charm model', function() {
      instance = new models.Charm(data.charm);
      var requires = instance.get('requires');
      // Interface is quoted for lint purposes.
      requires.balancer['interface'].should.eql('http');

      var provides = instance.get('provides');
      provides.website['interface'].should.eql('http');
    });

    it('maps revisions nicely for us with converted dates', function() {
      instance = new models.Charm(data.charm);
      var commits = instance.get('recentCommits');
      commits.length.should.equal(10);

      // Check that our commits have the right keys constructed from the api
      // data provided.
      var sample = commits[0];
      assert(Y.Object.hasKey(sample, 'author'));
      assert(Y.Object.hasKey(sample, 'date'));
      assert(Y.Object.hasKey(sample, 'message'));
      assert(Y.Object.hasKey(sample, 'revno'));

      // Commits should be ordered new to old.
      var checkDate = new Date();
      Y.Array.each(commits, function(commit) {
        assert(checkDate > commit.date);
        checkDate = commit.date;
      });
    });

    it('must be able to determine if an icon should be shown', function() {
      var approved_with_icon = new models.Charm({
        id: 'cs:precise/mysql-2',
        is_approved: true,
        files: ['icon.svg']
      });
      var approved_without_icon = new models.Charm({
        id: 'cs:precise/mysql-2',
        is_approved: true,
        files: []
      });
      var unapproved_with_icon = new models.Charm({
        id: 'cs:precise/mysql-2',
        is_approved: false,
        files: ['icon.svg']
      });
      var unapproved_without_icon = new models.Charm({
        id: 'cs:precise/mysql-2',
        is_approved: false,
        files: []
      });
      assert.isTrue(approved_with_icon.get('shouldShowIcon'));
      assert.isFalse(approved_without_icon.get('shouldShowIcon'));
      assert.isFalse(unapproved_with_icon.get('shouldShowIcon'));
      assert.isFalse(unapproved_without_icon.get('shouldShowIcon'));
    });

    it('sorts files', function() {
      // Because we rely on localeCompare, and this has different
      // implementations and capabilities across browsers, we don't include
      // any capital letters in this test.  They sort reliably within a given
      // browser, but not across browsers.
      instance = new models.Charm({
        id: 'cs:precise/mysql-2',
        files: [
          'alpha/beta/gamma',
          'alpha/beta',
          'alpha/aardvark',
          'zebra',
          'yam'
        ]
      });
      assert.deepEqual(
          instance.get('files'),
          [
            'yam',
            'zebra',
            'alpha/aardvark',
            'alpha/beta',
            'alpha/beta/gamma'
          ]);
    });

    it('tracks recent commits in the last 30 days', function() {
      instance = new models.Charm(data.charm);
      var commits = instance.get('recentCommits'),
          today = new Date();

      // adjust the dates on there manually because the tests will be run on
      // different days throwing things off.
      Y.each([0, 1, 2], function(index) {
        commits[index].date = new Date();
        commits[index].date.setDate(today.getDate() - (1 + index));
      });
      instance.get('recent_commit_count').should.equal(3);
    });

    it('tracks the total commits of the charm', function() {
      instance = new models.Charm(data.charm);
      assert.equal(instance.get('commitCount'), 44);
    });

    it('provides a providers attr', function() {
      // The charm details needs the failing providers generated from the list
      // of tested_providers.
      data.charm.tested_providers = {
        'ec2': 'SUCCESS',
        'local': 'FAILURE',
        'openstack': 'FAILURE'
      };
      instance = new models.Charm(data.charm);
      instance.get('providers').should.eql(
          {successes: ['ec2'], failures: ['local', 'openstack']});
    });

    // Testing a private method because if this test fails it'll provide a much
    // nicer hint as to why something in a View or such doesn't work correctly.
    // The api data that we get must be converted into what the
    // CharmMode.getAttrs() would have sent out to the token widget.
    it('maps related data to the model-ish api', function() {
      var providesData = relatedData.provides.http[0];
      instance = new models.Charm(data.charm);
      var converted = instance._convertRelatedData(providesData);
      assert.equal(providesData.name, converted.name);
      assert.equal(providesData.id, converted.storeId);
      assert.equal(
          providesData.commits_in_past_30_days,
          converted.recent_commit_count);
      assert.equal(
          providesData.downloads_in_past_30_days,
          converted.recent_download_count);
      assert.equal(
          providesData.downloads,
          converted.downloads);
      assert.equal(providesData.has_icon, converted.shouldShowIcon);
      assert.equal(converted.is_approved, providesData.is_approved);
    });

    it('builds proper relatedCharms object', function() {
      instance = new models.Charm(data.charm);
      instance.buildRelatedCharms(relatedData.provides, relatedData.requires);
      var relatedObject = instance.get('relatedCharms');

      // The overall should have the default 5 max charms listed.
      assert.equal(5, relatedObject.overall.length);
      // The requires for mysql should be truncated to the max of 5 as well.
      assert.equal(5, relatedObject.requires.http.length);
      // There's only one key in the provides section.
      assert.equal(1, Y.Object.keys(relatedObject.provides).length);

      // The overall should be sorted by their weights.
      var weights = relatedObject.overall.map(function(charm) {
        return charm.weight;
      });
      assert.equal(weights.sort(), weights);
    });

    it('has an entity type static property', function() {
      instance = new models.Charm(data.charm);
      assert.equal(instance.constructor.entityType, 'charm');
    });

  });

  describe('database import/export', function() {
    var Y, models, utils;
    var db;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-models',
        'juju-tests-utils',
        'juju-charm-store',
        'juju-charm-models'],
      function(Y) {
        utils = Y.namespace('juju-tests.utils');
        models = Y.namespace('juju.models');
        done();
      });
    });

    beforeEach(function() {
      db = new models.Database();
    });

    it('can export in deployer format', function() {
      // Mock a topology that can return positions.
      db.services.add({id: 'mysql', charm: 'precise/mysql-1'});
      db.services.add({
        id: 'wordpress',
        charm: 'precise/wordpress-1',
        config: {debug: 'no', username: 'admin'},
        constraints: 'cpu-power=2 cpu-cores=4',
        annotations: {'gui-x': 100, 'gui-y': 200}
      });
      db.relations.add({
        id: 'relation-0',
        endpoints: [
          ['mysql', {name: 'db', role: 'server'}],
          ['wordpress', {name: 'app', role: 'client'}]],
        'interface': 'db'
      });

      db.environment.set('defaultSeries', 'precise');

      // Add the charms so we can resolve them in the export.
      db.charms.add([{id: 'precise/mysql-1'},
            {id: 'precise/wordpress-1',
              options: {
                debug: {
                  'default': 'no'
                },
                username: {
                  'default': 'root'
                }
              }
            }
          ]);
      var result = db.exportDeployer().envExport;

      assert.strictEqual(result.relations.length, 1);
      var relation = result.relations[0];

      assert.equal(result.series, 'precise');
      assert.equal(result.services.mysql.charm, 'precise/mysql-1');
      assert.equal(result.services.wordpress.charm, 'precise/wordpress-1');

      assert.equal(result.services.mysql.num_units, 1);
      assert.equal(result.services.wordpress.num_units, 1);

      // A default config value is skipped
      assert.equal(result.services.wordpress.options.debug, undefined);
      // A value changed from the default is exported
      assert.equal(result.services.wordpress.options.username, 'admin');
      // Ensure that mysql has no options object in the export as no
      // non-default options are defined
      assert.equal(result.services.mysql.options, undefined);

      // Constraints
      var constraints = result.services.wordpress.constraints;
      assert.equal(constraints, 'cpu-power=2 cpu-cores=4');

      // Export position annotations.
      assert.equal(result.services.wordpress.annotations['gui-x'], 100);
      assert.equal(result.services.wordpress.annotations['gui-y'], 200);
      // Note that ignored wasn't exported.
      assert.equal(result.services.wordpress.annotations.ignored, undefined);

      assert.equal(relation[0], 'mysql:db');
      assert.equal(relation[1], 'wordpress:app');
    });

    it('does not export peer relations', function() {
      db.services.add({id: 'wordpress', charm: 'precise/wordpress-42'});
      db.charms.add({id: 'precise/wordpress-42'});
      db.relations.add({
        id: 'wordpress:loadbalancer',
        endpoints: [['wordpress', {name: 'loadbalancer', role: 'peer'}]],
        'interface': 'reversenginx'
      });
      var result = db.exportDeployer().envExport;
      // The service has been exported.
      assert.isDefined(result.services.wordpress);
      // But not its peer relation.
      assert.strictEqual(result.relations.length, 0);
    });

    it('does not export the juju-gui service', function() {
      db.services.add([
        {id: 'juju-gui', charm: 'precise/juju-gui-42'},
        {id: 'django', charm: 'trusty/django-47'}
      ]);
      db.charms.add([{id: 'precise/juju-gui-42'}, {id: 'trusty/django-47'}]);
      var result = db.exportDeployer().envExport;
      assert.strictEqual(Y.Object.size(result.services), 1);
      assert.isDefined(result.services.django);
    });

    it('does not export juju-gui relations', function() {
      db.services.add([
        {id: 'wordpress', charm: 'precise/wordpress-42'},
        // Someone gave the name "juju-gui" to a wordpress service.
        {id: 'juju-gui', charm: 'precise/wordpress-42'},
        {id: 'mysql', charm: 'trusty/mysql-47'}
      ]);
      db.charms.add([{id: 'precise/wordpress-42'}, {id: 'trusty/mysql-47'}]);
      // The two wordpress instances are connected to the database.
      db.relations.add([
        {
          id: 'wordpress:db mysql:db',
          endpoints: [
            ['mysql', {name: 'db', role: 'provider'}],
            ['wordpress', {name: 'db', role: 'requirer'}]
          ],
          'interface': 'mysql'
        },
        {
          id: 'juju-gui:db mysql:db',
          endpoints: [
            ['mysql', {name: 'db', role: 'provider'}],
            ['juju-gui', {name: 'db', role: 'requirer'}]
          ],
          'interface': 'mysql'
        }
      ]);
      var result = db.exportDeployer().envExport;
      // The juju-gui service has not been exported.
      assert.isUndefined(result.services['juju-gui']);
      // The only exported relation is between wordpress and mysql.
      assert.strictEqual(result.relations.length, 1);
      assert.deepEqual(result.relations[0], ['mysql:db', 'wordpress:db']);
    });

    it('exports subordinate services with num_units set to 0', function() {
      // Add a subordinate.
      db.services.add({id: 'puppet', charm: 'precise/puppet-4'});
      db.charms.add([{id: 'precise/puppet-4', is_subordinate: true}]);
      var result = db.exportDeployer().envExport;
      assert.equal(result.services.puppet.num_units, 0);
    });

    it('exports options preserving their types', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'precise/wordpress-42',
        config: {
          one: 'foo',
          two: '2',
          three: '3.14',
          four: 'true',
          five: false
        }
      });
      db.charms.add([{
        id: 'precise/wordpress-42',
        options: {
          one: {'default': '', type: 'string'},
          two: {'default': 0, type: 'int'},
          three: {'default': 0, type: 'float'},
          four: {'default': undefined, type: 'boolean'},
          five: {'default': true, type: 'boolean'}
        }
      }]);
      var result = db.exportDeployer().envExport;
      assert.strictEqual(result.services.wordpress.options.one, 'foo');
      assert.strictEqual(result.services.wordpress.options.two, 2);
      assert.strictEqual(result.services.wordpress.options.three, 3.14);
      assert.strictEqual(result.services.wordpress.options.four, true);
      assert.strictEqual(result.services.wordpress.options.five, false);
    });

    it('avoid exporting options set to their default values', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'precise/wordpress-42',
        config: {
          one: 'foo',
          two: '2',
          three: '3.14',
          four: 'false',
          five: true
        }
      });
      db.charms.add([{
        id: 'precise/wordpress-42',
        options: {
          one: {'default': 'foo', type: 'string'},
          two: {'default': 0, type: 'int'},
          three: {'default': 3.14, type: 'float'},
          four: {'default': undefined, type: 'boolean'},
          five: {'default': true, type: 'boolean'}
        }
      }]);
      var result = db.exportDeployer().envExport;
      assert.isUndefined(result.services.wordpress.options.one);
      assert.strictEqual(result.services.wordpress.options.two, 2);
      assert.isUndefined(result.services.wordpress.options.three);
      assert.strictEqual(result.services.wordpress.options.four, false);
      assert.isUndefined(result.services.wordpress.options.five, false);
    });

    it('exports non-default options', function() {
      db.services.add({
        id: 'wordpress',
        charm: 'precise/wordpress-1',
        config: {one: '1', two: '2', three: '3', four: '4', five: true},
        annotations: {'gui-x': 100, 'gui-y': 200}
      });
      db.charms.add([{id: 'precise/mysql-1'},
            {id: 'precise/wordpress-1',
              options: {
                one: {
                  'default': ''
                },
                two: {
                  'default': null
                },
                three: {
                  'default': undefined
                },
                four: {
                  'default': '0'
                },
                five: {
                  'default': false
                }
              }
            }
          ]);
      var result = db.exportDeployer().envExport;
      assert.equal(result.services.wordpress.options.one, '1');
      assert.equal(result.services.wordpress.options.two, '2');
      assert.equal(result.services.wordpress.options.three, '3');
      assert.equal(result.services.wordpress.options.four, '4');
      assert.equal(result.services.wordpress.options.five, true);
    });

    it('exports exposed flag', function() {
      db.services.add({id: 'wordpress', charm: 'precise/wordpress-4'});
      db.charms.add([{id: 'precise/wordpress-4'}]);
      var result = db.exportDeployer().envExport;
      assert.isUndefined(result.services.wordpress.expose);
      db.services.getById('wordpress').set('exposed', true);
      result = db.exportDeployer().envExport;
      assert.isTrue(result.services.wordpress.expose);
    });

    it('can determine simple machine placement for services', function() {
      var machine = {id: '0'};
      var units = [{
        service: 'wordpress',
        id: 'wordpress/0',
        agent_state: 'started',
        machine: '0'
      }, {
        service: 'mysql',
        id: 'mysql/0',
        agent_state: 'started',
        machine: '0'
      }];
      db.machines.add(machine);
      db.units.add(units, true);
      var placement = db._mapServicesToMachines(db.machines);
      var expected = {
        'mysql': ['wordpress=0']
      };
      assert.deepEqual(placement, expected);
    });

    it('can determine complex machine placement for services', function() {
      var machines = [{ id: '0' }, { id: '1' }, { id: '2' }];
      var units = [{
        service: 'wordpress',
        id: 'wordpress/0',
        agent_state: 'started',
        machine: '0'
      }, {
        service: 'mysql',
        id: 'mysql/0',
        agent_state: 'started',
        machine: '0'
      }, {
        service: 'mysql',
        id: 'mysql/1',
        agent_state: 'started',
        machine: '1'
      }, {
        service: 'apache2',
        id: 'apache2/0',
        agent_state: 'started',
        machine: '1'
      }, {
        service: 'wordpress',
        id: 'wordpress/1',
        agent_state: 'started',
        machine: '2'
      }, {
        service: 'apache2',
        id: 'apache2/1',
        agent_state: 'started',
        machine: '2'
      }, {
        service: 'mysql',
        id: 'mysql/2',
        agent_state: 'started',
        machine: '2'
      }];
      db.machines.add(machines);
      db.units.add(units, true);
      var placement = db._mapServicesToMachines(db.machines);
      var expected = {
        'mysql': ['wordpress=0', 'wordpress=1'],
        'apache2': ['mysql=0', 'wordpress=1']
      };
      assert.deepEqual(placement, expected);
    });

    it('can determinte lxc placement for units', function() {
      var machines = [{
        id: '0'
      }, {
        id: '0/lxc/0',
        containerType: 'lxc',
        parentId: '0'
      }];
      var units = [{
        service: 'wordpress',
        id: 'wordpress/0',
        agent_state: 'started',
        machine: '0'
      }, {
        service: 'mysql',
        id: 'mysql/0',
        agent_state: 'started',
        machine: '0'
      }, {
        service: 'apache2',
        id: 'apache2/0',
        agent_state: 'started',
        machine: '0/lxc/0'
      }];
      db.machines.add(machines);
      db.units.add(units, true);
      var placement = db._mapServicesToMachines(db.machines);
      var expected = {
        'mysql': ['wordpress=0'],
        'apache2': ['lxc:wordpress=0']
      };
      assert.deepEqual(placement, expected);
    });

    it('ignores uncommmitted units when determining placement', function() {
      var machine = { id: '0' };
      var units = [{
        service: 'wordpress',
        id: 'wordpress/0',
        machine: '0'
      }, {
        service: 'mysql',
        id: 'mysql/0',
        agent_state: 'started',
        machine: '0'
      }, {
        service: 'apache2',
        id: 'apache2/0',
        agent_state: 'started',
        machine: '0'
      }];
      db.machines.add(machine);
      db.units.add(units, true);
      var placement = db._mapServicesToMachines(db.machines);
      var expected = {
        'apache2': ['mysql=0']
      };
      assert.deepEqual(placement, expected);
    });

    it('ignores uncommitted machines when determining placements', function() {
      var machine = { id: 'new0', commitStatus: 'uncommitted' };
      var units = [{
        service: 'wordpress',
        id: 'wordpress/0',
        agent_state: 'started',
        machine: 'new0'
      }, {
        service: 'mysql',
        id: 'mysql/0',
        agent_state: 'started',
        machine: 'new0'
      }, {
        service: 'apache2',
        id: 'apache2/0',
        agent_state: 'started',
        machine: 'new0'
      }];
      db.machines.add(machine);
      db.units.add(units, true);
      var placement = db._mapServicesToMachines(db.machines);
      assert.deepEqual(placement, {});
    });

    it('ignores machines with no units when determining placements',
        function() {
          var machine = { id: '0' };
          db.machines.add(machine);
          var placement = db._mapServicesToMachines(db.machines);
          assert.deepEqual(placement, {});
        });

    it('annotates services with placement info', function() {
      db.services.add({id: 'mysql', charm: 'precise/mysql-1'});
      db.services.add({id: 'wordpress', charm: 'precise/wordpress-1'});
      db.machines.add({ id: '0'});
      db.units.add([{
        service: 'wordpress',
        id: 'wordpress/0',
        agent_state: 'started',
        machine: '0'
      }, {
        service: 'mysql',
        id: 'mysql/0',
        agent_state: 'started',
        machine: '0'
      }], true);
      db.charms.add([{
        id: 'precise/mysql-1',
        options: {
          one: {
            'default': ''
          },
          two: {
            'default': null
          },
          three: {
            'default': undefined
          }
        }
      }, {
        id: 'precise/wordpress-1',
        options: {
          one: {
            'default': ''
          },
          two: {
            'default': null
          },
          three: {
            'default': undefined
          },
          four: {
            'default': '0'
          },
          five: {
            'default': false
          }
        }
      }]);
      var result = db.exportDeployer().envExport;
      assert.deepEqual(result.services.mysql.to, ['wordpress=0']);
    });
  });

  describe('service models', function() {
    var models, list, django, rails, wordpress, mysql;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-models'], function(Y) {
        models = Y.namespace('juju.models');
        done();
      });
    });

    beforeEach(function() {
      window._gaq = [];
      django = new models.Service({id: 'django'});
      rails = new models.Service({
        charm: 'cs:/precise/rails-2',
        id: 'rails',
        life: 'dying',
        aggregated_status: {}
      });
      wordpress = new models.Service({
        id: 'wordpress',
        life: 'dying',
        aggregated_status: {error: 42}
      });
      mysql = new models.Service({
        id: 'mysql',
        life: 'dead',
        aggregated_status: {error: 0}
      });
      list = new models.ServiceList({items: [rails, django, wordpress, mysql]});
    });

    it('instances identify if they are alive', function() {
      // This test also verifies that the default state is "alive".
      assert.isTrue(django.isAlive());
    });

    it('instances identify if they are not alive (dead)', function() {
      assert.isTrue(rails.isAlive(), rails.get('id'));
      assert.isTrue(wordpress.isAlive(), wordpress.get('id'));
      assert.isFalse(mysql.isAlive(), mysql.get('id'));
    });

    it('instances identify if they have errors', function() {
      assert.isTrue(wordpress.hasErrors());
    });

    it('instances identify if they do not have errors', function() {
      assert.isFalse(django.hasErrors(), django.get('id'));
      assert.isFalse(rails.hasErrors(), rails.get('id'));
      assert.isFalse(mysql.hasErrors(), mysql.get('id'));
    });

    it('can be filtered so that it returns only visible models', function() {
      var filtered = list.visible();
      assert.strictEqual(filtered.size(), 3);
      assert.deepEqual(filtered.toArray(), [rails, django, wordpress]);
    });

    it('can return a list of services deployed from charm name', function() {
      var services = list.getServicesFromCharmName('rails');
      assert.equal(services.length, 1);
      assert.deepEqual(services, [rails]);
    });

    it('returns the service name if set', function() {
      var service = new models.Service({
        id: 'django',
        charm: 'cs:/trusty/django-42',
        name: 'my-personal-django'
      });
      assert.strictEqual(service.get('name'), 'my-personal-django');
    });

    it('returns a default name if the name attr is not set', function() {
      var service = new models.Service({
        id: 'django',
        charm: 'cs:/trusty/django-42'
      });
      assert.strictEqual(service.get('name'), 'django');
    });

    it('can properly parse the charm url for the package name', function() {
      assert.equal(rails.get('packageName'), 'rails');
      var jujuGui = new models.Service({
        id: 'juju-gui',
        charm: 'cs:/trusty/juju-gui-90'
      });
      assert.equal(jujuGui.get('packageName'), 'juju-gui');
    });

    describe('updateConfig', function() {
      it('updates local config if fields are not dirty', function() {
        django.set('config', {debug: 'foo'});
        django.updateConfig({debug: 'bar'});
        assert.deepEqual(django.get('_conflictedFields'), []);
        assert.deepEqual(django.get('config'), {debug: 'bar'});
        assert.deepEqual(django.get('environmentConfig'), {debug: 'bar'});
      });

      it('does not update local config if field is drity', function() {
        django.set('config', {python: 'snake', debug: 'foo'});
        django.set('environmentConfig', {python: 'snake', debug: 'foo'});
        django.set('_dirtyFields', ['debug']);
        django.updateConfig({debug: 'bar'});
        assert.deepEqual(django.get('_conflictedFields'), ['debug']);
        assert.deepEqual(django.get('config'), {python: 'snake', debug: 'foo'});
        assert.deepEqual(
            django.get('environmentConfig'), {python: 'snake', debug: 'bar'});
      });
    });
  });

  describe('db.charms.addFromCharmData', function() {
    var db, metadata, models, options, Y;
    var requirements = ['juju-models'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        done();
      });
    });

    beforeEach(function() {
      db = new models.Database();
      metadata = {
        name: 'mycharm',
        summary: 'charm summary',
        description: 'charm description',
        categories: ['tricks', 'treats'],
        subordinate: true,
        provides: 'provides',
        requires: 'requires',
        peers: 'peers'
      };
      options = {'my-option': {}};
    });

    afterEach(function() {
      db.destroy();
    });

    // Ensure the given charm is well formed.
    var assertCharm = function(charm, expectedSeries, expectedRevision) {
      var attrs = charm.getAttrs();
      var relations = attrs.relations;
      var url = 'local:' + expectedSeries + '/mycharm-' + expectedRevision;
      assert.strictEqual(attrs.categories, metadata.categories);
      assert.strictEqual(attrs.description, metadata.description);
      assert.strictEqual(attrs.distro_series, expectedSeries);
      assert.strictEqual(attrs.is_subordinate, metadata.subordinate);
      assert.strictEqual(attrs.name, metadata.name);
      assert.strictEqual(attrs.options, options);
      assert.strictEqual(attrs.revision, expectedRevision);
      assert.strictEqual(attrs.scheme, 'local');
      assert.strictEqual(attrs.summary, metadata.summary);
      assert.strictEqual(attrs.url, url);
      assert.strictEqual(relations.provides, metadata.provides);
      assert.strictEqual(relations.requires, metadata.requires);
      assert.strictEqual(relations.peers, metadata.peers);
    };

    it('creates and returns a new charm model instance', function() {
      var charm = db.charms.addFromCharmData(
          metadata, 'trusty', 42, 'local', options);
      // A new charm model instance has been created.
      assert.strictEqual(db.charms.size(), 1);
      // The newly created charm has been returned.
      assert.deepEqual(db.charms.item(0), charm);
      // The newly created charm is well formed.
      assertCharm(charm, 'trusty', 42);
    });

    it('creates different series and revisions of the same charm', function() {
      var charm1 = db.charms.addFromCharmData(
          metadata, 'saucy', 42, 'local', options);
      var charm2 = db.charms.addFromCharmData(
          metadata, 'trusty', 47, 'local', options);
      // Two new charm model instance have been created.
      assert.strictEqual(db.charms.size(), 2);
      // The newly created charms have been returned.
      assert.deepEqual(db.charms.item(0), charm1);
      assert.deepEqual(db.charms.item(1), charm2);
      // The newly created charms are well formed.
      assertCharm(charm1, 'saucy', 42);
      assertCharm(charm2, 'trusty', 47);
    });

    it('just retrieves the charm if it already exists', function() {
      var charm1 = db.charms.addFromCharmData(
          metadata, 'trusty', 42, 'local', options);
      var charm2 = db.charms.addFromCharmData(
          metadata, 'trusty', 42, 'local', options);
      // Only one charm model instance has been actually created.
      assert.strictEqual(db.charms.size(), 1);
      // The original charm has been returned by the second call.
      assert.deepEqual(charm1, charm2);
      // The returned charm is well formed.
      assertCharm(charm2, 'trusty', 42);
    });

    it('updates an existing charm', function() {
      db.charms.addFromCharmData(metadata, 'trusty', 42, 'local', options);
      metadata.categories = ['picard', 'janeway', 'sisko'];
      metadata.provides = 'new-provides';
      metadata.requires = 'new-requires';
      options = {'another-option': {}};
      var charm = db.charms.addFromCharmData(
          metadata, 'trusty', 42, 'local', options);
      // Only one charm model instance has been actually created.
      assert.strictEqual(db.charms.size(), 1);
      // The updated charm has been returned.
      assert.deepEqual(db.charms.item(0), charm);
      // The returned charm is well formed.
      assertCharm(charm, 'trusty', 42);
    });

  });

  describe('validateCharmMetadata', function() {
    var models, Y;
    var requirements = ['juju-charm-models'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        done();
      });
    });

    it('returns an empty list if no errors are found', function() {
      var metadata = {
        name: 'mycharm',
        summary: 'charm summary',
        description: 'charm description'
      };
      var errors = models.validateCharmMetadata(metadata);
      assert.deepEqual(errors, []);
    });

    it('returns errors if fields are undefined', function() {
      var metadata = {
        description: 'charm description'
      };
      var errors = models.validateCharmMetadata(metadata);
      assert.deepEqual(errors, ['missing name', 'missing summary']);
    });

    it('returns errors if fields are null', function() {
      var metadata = {
        name: null,
        summary: 'charm summary',
        description: 'charm description'
      };
      var errors = models.validateCharmMetadata(metadata);
      assert.deepEqual(errors, ['missing name']);
    });

    it('returns errors if fields are empty strings', function() {
      var metadata = {
        name: '',
        summary: 'charm summary',
        description: '     '
      };
      var errors = models.validateCharmMetadata(metadata);
      assert.deepEqual(errors, ['missing name', 'missing description']);
    });

  });

});
