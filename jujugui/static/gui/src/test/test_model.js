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
        models._getECS = sinon.stub().returns({changeSet: {}});
        done();
      });
    });

    it('must be able to create Charm', function() {
      var charm = new models.Charm({
        id: 'cs:~alt-bac/precise/openstack-dashboard-0',
        owner: 'alt-bac'
      });
      charm.get('scheme').should.equal('cs');
      charm.get('owner').should.equal('alt-bac');
      charm.get('series').should.equal('precise');
      charm.get('package_name').should.equal('openstack-dashboard');
      charm.get('revision').should.equal(0);
      charm.get('full_name').should.equal(
        '~alt-bac/precise/openstack-dashboard');
    });

    it('must dedupe tags', () => {
      const charm = new models.Charm({
        id: 'cs:precise/openstack-dashboard-0',
        tags: ['bar', 'bar', 'foo', 'foo']
      });
      assert.deepEqual(charm.get('tags'), ['bar', 'foo']);
    });

    it('must accept charm ids without versions.', function() {
      const charm = new models.Charm(
        {id: 'cs:~alt-bac/precise/openstack-dashboard'});
      assert.strictEqual(charm.get('revision'), null);
    });

    it('must accept charm ids with periods.', function() {
      const charm = new models.Charm({
        id: 'cs:~alt.bac/precise/openstack-dashboard-0',
        owner: 'alt.bac'
      });
      assert.equal(charm.get('owner'), 'alt.bac');
    });

    it('must accept charm ids without series.', function() {
      const charm = new models.Charm(
        {id: 'cs:~alt-bac/openstack-dashboard'});
      assert.isUndefined(charm.get('series'));
    });

    it('generates a proper full_name for multi-series charms', () => {
      const charm = new models.Charm({
        id: 'cs:~alt-bac/openstack-dashboard',
        owner: 'alt-bac',
        series: ['precise', 'trusty', 'xenial']
      });
      assert.equal(charm.get('full_name'), '~alt-bac/openstack-dashboard');
    });

    it('must be able to parse hyphenated owner names', function() {
      // Note that an earlier version of the parsing code did not handle
      // hyphens in user names, so this test intentionally includes one.
      const charm = new models.Charm({
        id: 'cs:~marco-ceppi/precise/wordpress-17',
        owner: 'marco-ceppi'
      });
      charm.get('full_name').should.equal('~marco-ceppi/precise/wordpress');
    });

    it('must reject bad charm ids.', function() {
      assert.throws(() => {
        new models.Charm({id: ''});
      }, 'invalid URL: ""');
    });

    it('must reject missing charm ids at initialization.', function() {
      assert.throws(() => {
        new models.Charm();
      }, 'invalid URL: "null"');
    });
  });

  describe('juju models', function() {
    var models, Y, relationUtils;
    const cleanups = [];
    var requirements = [
      'juju-models',
      'juju-charm-models'
    ];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
        relationUtils = window.juju.utils.RelationUtils;
        done();
      });
    });

    beforeEach(function() {
      window._gaq = [];
    });

    afterEach(function() {
      cleanups.forEach(cleanup => {
        cleanup();
      });
    });

    it('percolates flags set on the service into the unit', function() {
      // Setup the database.
      var units = [
        {id: 'mysql/0', service: 'mysql'},
        {id: 'mysql/1', service: 'mysql'}
      ];
      var service = new models.Service({id: 'mysql'});
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
      db.services.add(service);
      db.addUnits(units);
      // Encapsulate and re-use testing logic for each flag.
      function tester(flag) {
        service.set(flag, true);
        db.updateUnitFlags(service, flag);
        service.get('units').each(function(u) {
          assert.equal(u[flag], true, flag + ' not true in the service');
          var dbUnit = db.units.getById(u.id);
          assert.equal(dbUnit[flag], true, flag + ' not true in the DB');
        });
        service.set(flag, false);
        db.updateUnitFlags(service, flag);
        service.get('units').each(function(u) {
          assert.equal(u[flag], false, flag + ' not false in the service');
          var dbUnit = db.units.getById(u.id);
          assert.equal(dbUnit[flag], false, flag + ' not false in the DB');
        });
      }
      // Check each flag.
      tester('highlight');
      tester('hide');
      tester('fade');
    });

    it('can update a units displayName', function(done) {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
      db.services.add([
        {id: 'mysql', name: 'mysql'}
      ]);
      db.addUnits([
        {id: 'mysql/0'}
      ]);
      var service = db.services.getById('mysql');
      service.set('name', 'notmysql');
      document.addEventListener('update', () => {
        // Make sure it fires update so that the GUI can re-render;
        // Check that both the service and master unit gets get updated.
        assert.equal(service.get('units').item(0).displayName, 'notmysql/0');
        assert.equal(db.units.item(0).displayName, 'notmysql/0');
        done();
      });
      db.updateServiceUnitsDisplayname('mysql');
      // Check that both the service and master unit gets get updated.
      assert.equal(service.get('units').item(0).displayName, 'notmysql/0');
      assert.equal(db.units.item(0).displayName, 'notmysql/0');
    });

    it('can update a unit id', function() {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
      db.services.add([
        {id: 'mysql', name: 'mysql'}
      ]);
      var service = db.services.getById('mysql');
      db.addUnits([
        {id: 'mysql/0'}
      ]);
      var unit = db.units.getById('mysql/0');
      service.set('id', 'mysql2');
      assert.deepEqual(Object.keys(db.units._idMap), ['mysql/0']);
      assert.deepEqual(Object.keys(service.get('units')._idMap), ['mysql/0']);
      db.updateUnitId('mysql2', 'mysql/0');
      assert.deepEqual(Object.keys(db.units._idMap), ['mysql2/0']);
      assert.deepEqual(Object.keys(service.get('units')._idMap), ['mysql2/0']);
      assert.equal(unit.service, 'mysql2');
      assert.equal(unit.id, 'mysql2/0');
      assert.equal(unit.urlName, 'mysql2-0');
    });

    it('finds related services', function() {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
          service = new models.Service({name: 'mysql'});
      db.services.add([
        {id: 'mysql', name: 'mysql'},
        {id: 'wordpress', name: 'wordpress'},
        {id: 'haproxy', name: 'haproxy'}
      ]);
      var relations = [
        {far: {service: 'wordpress'}}
      ];
      var stub = sinon.stub(
        relationUtils, 'getRelationDataForService').returns(relations);
      cleanups.push(stub.restore);
      var related = db.findRelatedServices(service);
      related.each(function(s) {
        console.log(s.getAttrs());
      });
      assert.equal(related.size(), 2);
      assert.equal(related.item(0).get('name'), 'mysql');
      assert.equal(related.item(1).get('name'), 'wordpress');
    });

    it('finds unrelated services', function() {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
          service = new models.Service({name: 'mysql'});
      db.services.add([
        {id: 'mysql', name: 'mysql'},
        {id: 'wordpress', name: 'wordpress'},
        {id: 'haproxy', name: 'haproxy'}
      ]);
      var relations = [
        {far: {service: 'wordpress'}}
      ];
      var stub = sinon.stub(
        relationUtils, 'getRelationDataForService').returns(relations);
      cleanups.push(stub.restore);
      var unrelated = db.findUnrelatedServices(service);
      assert.equal(unrelated.size(), 1);
      assert.equal(unrelated.item(0).get('name'), 'haproxy');
    });

    it('handles undefined endpoints in unrelated services', function() {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
          service = new models.Service({name: 'mysql'});
      db.services.add([
        {id: 'mysql', name: 'mysql'},
        {id: 'wordpress', name: 'wordpress'},
        {id: 'haproxy', name: 'haproxy'}
      ]);
      var relations = [{}];
      var stub = sinon.stub(
        relationUtils, 'getRelationDataForService').returns(relations);
      cleanups.push(stub.restore);
      var unrelated = db.findUnrelatedServices(service);
      assert.equal(unrelated.size(), 2);
    });

    describe('setMVVisibility', function() {
      var db;

      beforeEach(function() {
        db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
        db._highlightedServices = []; // needs to be explicitly emptied
        db.machines.add([
          {id: '0', hide: false},
          {id: '1', hide: false}
        ]);
        db.services.add([
          {id: 'mysql', name: 'mysql'},
          {id: '1234$', name: 'ghost'}
        ]);
        db.addUnits([
          {id: 'mysql/0', service: 'mysql', machine: '0'},
          {id: '1234$/0', service: '1234$', machine: '1'}
        ]);
      });

      it('removes hidden services when not hidden anymore', function() {
        db._highlightedServices.push('mysql');
        db.setMVVisibility('mysql', false);
        assert.equal(db._highlightedServices.indexOf('mysql'), -1);
      });

      function assertHighlight(machineId, serviceId) {
        var targetMachine = db.machines.getById(machineId);
        assert.equal(targetMachine.hide, false,
          'Target machine should not be hidden initially');
        db.setMVVisibility(serviceId, true);
        assert.equal(targetMachine.hide, false,
          'Target machine should not be hidden after highlight');
        db.machines.each(function(machine) {
          if (machine.id !== machineId) {
            assert.equal(machine.hide, true,
              'All other machines should be hidden after highlight');
          }
        });
      }

      it('highlights deployed machines properly', function() {
        assertHighlight('0', 'mysql');
      });

      it('highlights ghost machines properly', function() {
        assertHighlight('1', '1234$');
      });

      it('fires a single change event for all machines', function(done) {
        var counter = 0;
        db.machines.on('*:change', function(e) {
          counter += 1;
        });
        db.machines.after('*:changes', function(e) {
          assert.equal(counter, 0, 'single machine change events were fired');
          done();
        });
        db.setMVVisibility('mysql', true);
      });

      it('doesn\'t fire change for unchanged machines', function(done) {
        db.machines.after('*:changes', function(e) {
          var ids = e.instances.map(function(machine) {
            return machine.id;
          });
          assert.equal(ids.indexOf('0'), -1, 'machine 0 should not change');
          done();
        });
        db.setMVVisibility('mysql', true);
      });
    });

    it('should aggregate unit info when adding units', function() {
      var service_unit = {id: 'mysql/0'};
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
      var stub = sinon.stub(
        db.units, 'update_service_unit_aggregates');
      this._cleanups.push(stub.restore);
      db.services.add({id: 'mysql'});
      db.addUnits(service_unit);
      assert.equal(stub.calledOnce, true);
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
      var wp3 = {
        id: 'wordpress/3',
        agent_state: 'error',
        agent_state_info: 'hook failed: "peer-relation-broken"',
        agent_state_data: {
          hook: 'peer-relation-broken',
          'relation-id': 2
        }
      };
      wordpress.get('units').add([wp0, wp1, wp2, wp3], true);

      assert.deepEqual(mysql.get('units')
        .get_informative_states_for_service(mysql),
      [{'pending': 2}, {}]);
      assert.deepEqual(wordpress.get('units')
        .get_informative_states_for_service(wordpress),
      [{'pending': 1, 'error': 3}, {
        mysql: 'db-relation-changed',
        wordpress: 'peer-relation-broken'
      }]);
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
      assert.equal(Array.isArray(dirtyFields), true);
      assert.equal(dirtyFields.length, 0);
    });

    it('service unit objects should parse the service name from unit id',
      function() {
        var service_unit = {id: 'mysql/0'};
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
        db.services.add({id: 'mysql'});
        db.addUnits(service_unit);
        service_unit.service.should.equal('mysql');
      });

    it('service unit objects should report their number correctly',
      function() {
        var service_unit = {id: 'mysql/5'};
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
        db.services.add({id: 'mysql'});
        db.addUnits(service_unit);
        service_unit.number.should.equal(5);
      });

    it('should display service names properly', function() {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
          longId = '1234567890123456789',
          shortId = '12345678901234567';
      db.services.add([{id: longId}, {id: shortId}]);
      var longName = db.services.getById(longId).get('displayName');
      assert.equal(longName.length, 19, 'name is not trucated');
      var shortName = db.services.getById(shortId).get('displayName');
      assert.equal(shortName.length, shortId.length,
        'name does not match');
    });

    it('should display ghost service names properly', function() {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
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
      assert.equal(longName.length, 11 + 2,
        'name is not trucated');
      assert.equal(shortName.length, shortId.length + 2,
        'name does not match');
    });

    it('should update the ecs records when an app name changes', () => {
      const changeSet = {
        'add-unit1': {
          command: {
            args: ['wordpress1'],
            method: '_add_unit'
          }
        },
        'add-unit2': {
          command: {
            args: ['wordpress99'],
            method: '_add_unit'
          }
        },
        'add-app1': {
          command: {
            args: [{applicationName: 'wordpress1'}],
            method: '_deploy'
          }
        },
        'add-app2': {
          command: {
            args: [{applicationName: 'wordpress99'}],
            method: '_deploy'
          }
        }
      };
      let db = new models.Database(
        {getECS: sinon.stub().returns({changeSet: changeSet})});
      db.services.add([{id: 'wordpress', name: 'wordpress1'}]);
      const wordpress = db.services.getById('wordpress');
      assert.equal(wordpress.get('name'), 'wordpress1');
      wordpress.set('name', 'wordpress2');
      assert.equal(changeSet['add-unit1'].command.args[0], 'wordpress2');
      assert.equal(changeSet['add-unit2'].command.args[0], 'wordpress99');
      assert.equal(
        changeSet['add-app1'].command.args[0].applicationName, 'wordpress2');
      assert.equal(
        changeSet['add-app2'].command.args[0].applicationName, 'wordpress99');
    });

    it('must be able to resolve models by their name', function() {
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
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

    describe('onDelta', function() {

      it('should update service units on change', function() {
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
        var mysql = new models.Service({id: 'mysql'});
        db.services.add([mysql]);
        assert.equal(mysql.get('units') instanceof models.ServiceUnitList,
          true);
        db.onDelta({detail: {data: {result: [
          ['unitInfo', 'add', {name: 'mysql/0'}],
          ['unitInfo', 'add', {name: 'mysql/1'}]
        ]}}});
        assert.equal(mysql.get('units').size(), 2);
        db.onDelta({detail: {data: {result: [
          ['unitInfo', 'remove', {
            name: 'mysql/0',
            applicastion: 'mysql'
          }]
        ]}}});
        assert.equal(mysql.get('units').size(), 1);
      });

      it('should create non-existing machines on change', function() {
        // Sometimes we may try to change a machine that doesn't exist yet;
        // for example, a unit change needs to trigger a machine delta
        // change, but the actual create machine delta may not have arrived.
        // In these cases we check to see if the instance exists, and if not,
        // we create it before applying the changes.
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
            id = '0';
        assert.equal(db.machines.size(), 0,
          'the machine list is not be empty');
        db.onDelta({detail: {data: {result: [
          ['machineInfo', 'change', {id: id}]
        ]}}});
        assert.equal(db.machines.size(), 1,
          'the machines list did not have the expected size');
        var machine = db.machines.getById(id);
        assert.notEqual(machine, undefined,
          'the expected machine was not found in the database');
      });

      it('should copy visibility flags from service to unit', function() {
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
            id = 'mysql/0';
        // By default, these flags are all false.
        db.services.add([
          {id: 'mysql', hide: true, fade: true, highlight: true}
        ]);
        var service = db.services.item(0);
        db.onDelta({detail: {data: {result: [
          ['unitInfo', 'change', {name: id, application: service.get('id')}]
        ]}}});
        var unit = db.units.getById(id);
        assert.notEqual(unit, null, 'Unit was not created');
        assert.equal(unit.hide, service.get('hide'),
          'Hide flags should match between unit and service');
        assert.equal(unit.fade, service.get('fade'),
          'Fade flags should match between unit and service');
        assert.equal(unit.highlight, service.get('highlight'),
          'Highlight flags should match between unit and service');
      });

      it('should change machines when units change', function() {
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
        var machinesStub = sinon.stub(db.machines, 'process_delta'),
            unitsStub = sinon.stub(db.units, 'process_delta');
        this._cleanups.push(machinesStub.restore);
        this._cleanups.push(unitsStub.restore);
        db.onDelta({detail: {data: {result: [
          ['unitInfo', 'remove', {'machine-id': '0'}]
        ]}}});
        var args = machinesStub.lastCall.args;
        assert.equal(args[0], 'change',
          'the expected action was not applied to machines');
        assert.equal(args[1].id, '0',
          'the expected machine ID was not changed');
      });

      it('should handle remove changes correctly',
        function() {
          var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
          var mysql = db.services.add({id: 'mysql'});
          var my0 = {id: 'mysql/0', agent_state: 'pending'};
          var my1 = {id: 'mysql/1', agent_state: 'pending'};
          db.addUnits([my0, my1]);
          db.onDelta({detail: {data: {result: [
            ['unitInfo', 'remove', {
              name: 'mysql/1',
              application: 'mysql'
            }]
          ]}}});
          var names = mysql.get('units').get('id');
          names.length.should.equal(1);
          names[0].should.equal('mysql/0');
        });

      it('should be able to reuse existing services with add',
        function() {
          var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
          var my0 = new models.Service({id: 'mysql', exposed: true});
          db.services.add([my0]);
          db.onDelta({detail: {data: {result: [
            ['applicationInfo', 'add', {
              name: 'mysql',
              'charm-url': 'cs:precise/mysql',
              exposed: false
            }]
          ]}}});
          my0.get('exposed').should.equal(false);
        });

      it('should be able to reuse existing units with add',
        // Units are special because they use the LazyModelList.
        function() {
          var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
          db.services.add({id: 'mysql'});
          var my0 = {id: 'mysql/0', public_address: '1.2.3.4'};
          db.addUnits([my0]);
          db.onDelta({detail: {data: {result: [
            ['unitInfo', 'add', {
              name: 'mysql/0',
              'public-address': '5.6.7.8'
            }]
          ]}}});
          my0.public_address.should.equal('5.6.7.8');
        });

      it('uses default handler for unknown deltas', function() {
        var handler = sinon.stub(
          Y.juju.models.handlers, 'defaultHandler');
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
        db.onDelta({detail: {data: {result: [
          ['fakeDelta', 'add', {}]
        ]}}});
        assert.equal(handler.callCount, 1);
      });

      // XXX - We no longer use relation_errors but this test should remain
      // until it's completely removed from the codebase.
      it.skip('should reset relation_errors',
        function() {
          var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
          var my0 = {
            id: 'mysql/0',
            relation_errors: {'cache': ['memcached']}
          };
          db.addUnits([my0]);
          // Note that relation_errors is not set.
          db.onDelta({detail: {data: {result: [
            ['unit', 'change', {id: 'mysql/0'}]
          ]}}});
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
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
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
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})}),
            service = new models.Service({id: 'mysql', exposed: false}),
            rel0 = new models.Relation(
              { id: 'relation-0',
                endpoints:
                 [['mediawiki', {name: 'cache', role: 'source'}],
                   ['squid', {name: 'cache', role: 'front'}]],
                'interface': 'cache' }),
            rel1 = new models.Relation(
              { id: 'relation-1',
                endpoints: [['wordpress', {
                  role: 'peer', name: 'loadbalancer'}]],
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
      var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
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
        db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
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
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
        assert.strictEqual(db.units.get('preventDirectChanges'), true);
      });

      it('changes are disallowed in the service units', function() {
        var db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
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
          {id: 'mysql/12', machine: '15/lxc/6'},
          {id: 'ghost/1', machine: '', subordinate: true}
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

    describe('serviceUnits.filterByStatus', function() {
      var units;

      beforeEach(function() {
        units = new models.ServiceUnitList();
        units.add([
          {id: 'django/0', agent_state: 'error'},
          {id: 'django/42', agent_state: 'pending'},
          {id: 'haproxy/4', agent_state: 'error'},
          {id: 'django/47', agent_state: 'started'},
          {id: 'rails/0', agent_state: 'started'},
          {id: 'rails/42', agent_state: 'error'},
          {id: 'postgres/1'},
          {id: 'rails/2', agent_state: 'pending'},
          {id: 'postgres/2'},
          {id: 'mysql/47', agent_state: 'started'}
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

      it('returns all the units with an error status', function() {
        var resultingUnits = units.filterByStatus('error');
        assertUnits(resultingUnits, ['django/0', 'haproxy/4', 'rails/42']);
      });

      it('returns all the units with an uncommitted status', function() {
        var resultingUnits = units.filterByStatus('uncommitted');
        assertUnits(resultingUnits, ['postgres/1', 'postgres/2']);
      });
    });

    describe('remote services model list', function() {
      var remoteServices;

      beforeEach(function() {
        remoteServices = new models.RemoteServiceList();
      });

      afterEach(function() {
        remoteServices.destroy();
      });

      it('stores remote services by their URL', function() {
        var remoteService = remoteServices.add({id: 'local:/u/who/service'});
        assert.strictEqual(remoteService.get('url'), 'local:/u/who/service');
      });

      it('is populated with info from the mega-watcher', function() {
        var url = 'local:/u/dalek/does/exterminate';
        var status = {
          current: 'killing',
          message: 'extermiate!',
          data: {},
          since: 'the beginning of space and time'
        };
        remoteServices.process_delta('change', {
          id: url,
          service: 'extermination',
          sourceId: 'skaro',
          life: 'exterminated',
          status: status
        });
        assert.strictEqual(remoteServices.size(), 1);
        var remoteService = remoteServices.getById(url);
        var attrs = remoteService.getAttrs();
        // The delta info is present in the model instance.
        assert.strictEqual(attrs.url, url);
        assert.strictEqual(attrs.service, 'extermination');
        assert.strictEqual(attrs.sourceId, 'skaro');
        assert.strictEqual(attrs.life, 'exterminated');
        assert.deepEqual(attrs.status, status);
        // The mega-watcher does not provide everything.
        assert.strictEqual(attrs.description, undefined);
        assert.strictEqual(attrs.sourceName, undefined);
        assert.deepEqual(attrs.endpoints, []);
      });

      it('instances know if they are alive', function() {
        var alive = remoteServices.add({
          id: 'local:/u/who/service-alive',
          life: 'alive'
        });
        assert.strictEqual(alive.isAlive(), true);
        var dying = remoteServices.add({
          id: 'local:/u/who/service-dying',
          life: 'dying'
        });
        assert.strictEqual(dying.isAlive(), true);
      });

      it('instances know if they are dead', function() {
        var dead = remoteServices.add({
          id: 'local:/u/who/service-dead',
          life: 'dead'
        });
        assert.strictEqual(dead.isAlive(), false);
      });

      it('instances can be upgraded with details', function() {
        var url = 'local:/u/who/model/django';
        // Add a remote service.
        var remoteService = remoteServices.add({
          id: url,
          service: 'django',
          sourceId: 'uuid',
          life: 'alive'
        });
        var endpoints = [{
          name: 'db',
          inteface: 'postgres',
          role: 'requirer'
        }];
        var details = {
          // Valid details.
          description: 'django description',
          sourceName: 'ec2',
          endpoints: endpoints,
          // Data already provided by the mega-watcher is not overridden.
          url: 'not valid',
          service: 'rails',
          // Extraneous data is ignored.
          bad: 'wolf'
        };
        // Update the remote service with new info.
        remoteService.addDetails(details);
        var attrs = remoteService.getAttrs();
        // Original mega-watcher info is still there.
        assert.strictEqual(attrs.url, url);
        assert.strictEqual(attrs.service, 'django');
        assert.strictEqual(attrs.sourceId, 'uuid');
        assert.strictEqual(attrs.life, 'alive');
        // New info has been added.
        assert.strictEqual(attrs.description, 'django description');
        assert.strictEqual(attrs.sourceName, 'ec2');
        assert.deepEqual(attrs.endpoints, endpoints);
        // Extraneous info is ignored.
        assert.strictEqual(attrs.bad, undefined);
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
        assert.strictEqual(info.number, '0');
      });

      it('retrieves machine info parsing a machine name', function() {
        var info = machines.parseMachineName('42');
        assert.isNull(info.parentId);
        assert.isNull(info.containerType);
        assert.strictEqual(info.number, '42');
      });

      it('retrieves machine info parsing a container name', function() {
        var info = machines.parseMachineName('0/lxc/0');
        assert.strictEqual(info.parentId, '0');
        assert.strictEqual(info.containerType, 'lxc');
        assert.strictEqual(info.number, '0');
      });

      it('retrieves machine info parsing a sub-container name', function() {
        var info = machines.parseMachineName('1/lxc/0/kvm/42');
        assert.strictEqual(info.parentId, '1/lxc/0');
        assert.strictEqual(info.containerType, 'kvm');
        assert.strictEqual(info.number, '42');
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
        ['42', '0/lxc/0', '1/kvm/0/lxc/42'].forEach(function(id) {
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

    describe('service state simplification', function() {
      var simplifyState;

      before(() => {
        const units = new models.ServiceUnitList();
        simplifyState = units._simplifyState;
      });

      var makeUnit = function(state, relationErrors) {
        var unit = {agent_state: state};
        if (relationErrors) {
          unit.relation_errors = {myrelation: ['service']};
        }
        return unit;
      };

      it('translates service running states correctly', function() {
        var unit = makeUnit('started');
        assert.strictEqual('running', simplifyState(unit));
      });

      it('translates service error states correctly', function() {
        var states = ['install-error', 'foo-error', '-error', 'error'];
        states.forEach(function(state) {
          var unit = makeUnit(state);
          assert.strictEqual(simplifyState(unit), 'error', state);
        });
      });

      it('translates service pending states correctly', function() {
        var states = ['pending', 'installed', 'waiting', 'stopped'];
        states.forEach(function(state, index) {
          var unit = makeUnit(state);
          assert.strictEqual(simplifyState(unit), states[index], state);
        });
      });
    });
  });

  describe('Charm load', function() {
    var Y, models, conn, env, container, juju, testUtils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-models', 'juju-gui', 'datasource-local',
        'juju-tests-utils'], function(Y) {
        models = Y.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
        juju = Y.namespace('juju');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
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
      const userClass = new window.jujugui.User(
        {sessionStorage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      conn = new (Y.namespace('juju-tests.utils')).SocketStub();
      env = new juju.environments.GoEnvironment({
        conn: conn, user: userClass});
      env.connect();
      env.set('facades', {Client: [0], Charms: [1]});
      conn.open();
      container = testUtils.makeContainer(this);
    });

    afterEach(function() {
      env.close();
      env.destroy();
      container.remove();
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
      assert.equal(conn.last_message().request, 'CharmInfo');
    });

    it('must handle success from local charm request', function(done) {
      var charm = new models.Charm({id: 'local:precise/foo-4'}).load(
        env,
        function(err, response) {
          assert.strictEqual(err, false);
          assert.equal(charm.get('summary'), 'wowza');
          assert.strictEqual(charm.loaded, true);
          done();
        });
      var response = {
        'request-id': conn.last_message()['request-id'],
        response: {meta: {summary: 'wowza'}, config: {}}
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
        'request-id': conn.last_message()['request-id'],
        response: {
          meta: {},
          config: {
            default_log: {
              default: 'global',
              description: 'Default log',
              type: 'string'
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
        'request-id': conn.last_message()['request-id'],
        error: 'error'
      };
      env.dispatch_result(response);
      // The test in the callback above should run.
    });
  });

  describe('Charm test', function() {
    var data, instance, models, origData, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-charm-models',
        'juju-tests-utils'
      ], function(Y) {
        models = Y.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
        utils = Y.namespace('juju-tests.utils');

        origData = utils.loadFixture('data/browsercharm.json', true);
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
      data.downloads_in_past_30_days = 10;
      instance = new models.Charm(data);
      instance.get('recent_download_count').should.eql(10);
    });

    it('maps relations to keep with the original charm model', function() {
      instance = new models.Charm(data);
      var requires = instance.get('requires');
      // Interface is quoted for lint purposes.
      requires.balancer['interface'].should.eql('http');

      var provides = instance.get('provides');
      provides.website['interface'].should.eql('http');
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

    it('tracks the total commits of the charm', function() {
      instance = new models.Charm(data);
      assert.equal(instance.get('commitCount'), 10);
    });

    it('provides a providers attr', function() {
      // The charm details needs the failing providers generated from the list
      // of tested_providers.
      data.tested_providers = {
        'ec2': 'SUCCESS',
        'local': 'FAILURE',
        'openstack': 'FAILURE'
      };
      instance = new models.Charm(data);
      instance.get('providers').should.eql(
        {successes: ['ec2'], failures: ['local', 'openstack']});
    });

    it('has an entity type static property', function() {
      instance = new models.Charm(data);
      assert.equal(instance.constructor.entityType, 'charm');
    });

    describe('hasMetrics', function() {

      it('returns true if there is data in the metrics attribute', function() {
        instance = new models.Charm(data);
        instance.set('metrics', {});
        assert.equal(instance.hasMetrics(), true);
      });

      it('returns false otherwise', function() {
        instance = new models.Charm(data);
        instance.setAttrs({
          files: null,
          metrics: null
        });
      });
    });

    describe('populateFileList', function() {
      it('populates the file list with file list returned from charmstore', function(done) {
        const fileList = ['file1', 'file2', 'file3'];
        const getEntity = (id, cb) => {
          assert.equal(id, 'foo');
          cb(null, [{files: fileList}]);
        };
        const callback = function() {
          done();
        };
        instance = new models.Charm(data);
        instance.populateFileList(getEntity, callback);
        assert.deepEqual(instance.get('files'), fileList);
      });

      it('does not try and populate a file list if it already is populated', function() {
        const getEntity = sinon.stub();
        const callback = sinon.stub();
        instance = new models.Charm(data);
        instance.set('files', ['file1', 'file2', 'file3']);
        instance.populateFileList(getEntity, callback);
        assert.equal(getEntity.callCount, 0);
        assert.equal(callback.callCount, 1);
      });
    });

    describe('hasGetStarted', function() {
      it('returns the existance of the getstarted.md file in the file list', function() {
        instance = new models.Charm(data);
        assert.equal(instance.hasGetStarted(), false);
        // Add the file to the files list.
        instance.get('files').push('getstarted.md');
        assert.equal(instance.hasGetStarted(), true);
      });

      it('is case insensitive', function() {
        instance = new models.Charm(data);
        // Add the file to the files list.
        instance.get('files').push('GeTsTaRtEd.Md');
        assert.equal(instance.hasGetStarted(), true);
      });
    });

  });

  describe('database import/export', function() {
    var models;
    var db;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-models',
        'juju-charm-models'],
      function(Y) {
        models = Y.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
        done();
      });
    });

    beforeEach(function() {
      db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
    });

    it('can export the model as a bundle', function() {
      // Mock a topology that can return positions.
      db.services.add({id: 'mysql', charm: 'precise/mysql-1'});
      db.services.add({
        id: 'wordpress',
        charm: 'precise/wordpress-1',
        config: {debug: 'no', username: 'admin'},
        constraints: 'cpu-power=2 cpu-cores=4',
        annotations: {'gui-x': 100, 'gui-y': 200}
      });
      db.addUnits({
        id: 'wordpress/0'
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
      const result = db.exportBundle();

      assert.strictEqual(result.relations.length, 1);
      var relation = result.relations[0];

      assert.equal(result.series, 'precise');
      assert.equal(result.applications.mysql.charm, 'precise/mysql-1');
      assert.equal(result.applications.wordpress.charm, 'precise/wordpress-1');
      // Services with no units are allowed.
      assert.equal(result.applications.mysql.num_units, 0);
      assert.equal(result.applications.wordpress.num_units, 1);

      // A default config value is skipped
      assert.equal(result.applications.wordpress.options.debug, undefined);
      // A value changed from the default is exported
      assert.equal(result.applications.wordpress.options.username, 'admin');
      // Ensure that mysql has no options object in the export as no
      // non-default options are defined
      assert.equal(result.applications.mysql.options, undefined);

      // Constraints
      var constraints = result.applications.wordpress.constraints;
      assert.equal(constraints, 'cpu-power=2 cpu-cores=4');

      // Export position annotations.
      assert.equal(result.applications.wordpress.annotations['gui-x'], 100);
      assert.equal(result.applications.wordpress.annotations['gui-y'], 200);
      // Note that ignored wasn't exported.
      assert.equal(
        result.applications.wordpress.annotations.ignored, undefined);

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
      const result = db.exportBundle();
      // The service has been exported.
      assert.isDefined(result.applications.wordpress);
      // But not its peer relation.
      assert.strictEqual(result.relations.length, 0);
    });

    it('properly exports ambiguous relations', function() {
      db.charms.add([
        {id: 'hadoop-resourcemanager-14'},
        {id: 'hadoop-namenode-13'}
      ]);
      db.services.add({
        id: 'resourcemanager', charm: 'hadoop-resourcemanager-14'});
      db.services.add({
        id: 'namenode', charm: 'hadoop-namenode-13' });
      db.relations.add({
        id: 'relation-0',
        endpoints: [
          ['resourcemanager', {role: 'server'}],
          ['namenode', {role: 'client'}]],
        'interface': 'db'
      });
      assert.deepEqual(db.exportBundle().relations, [[
        'resourcemanager', 'namenode'
      ]]);
    });

    it('exports subordinate services with no num_units', function() {
      // Add a subordinate.
      db.services.add({id: 'puppet', charm: 'precise/puppet-4'});
      db.charms.add([{id: 'precise/puppet-4', is_subordinate: true}]);
      const result = db.exportBundle();
      assert.equal(result.applications.puppet.num_units, undefined);
    });

    it('exports applications for juju 2', function() {
      // Add a subordinate.
      db.services.add({id: 'puppet', charm: 'precise/puppet-4'});
      db.charms.add([{id: 'precise/puppet-4', is_subordinate: true}]);
      // Pass false for the instance when facades show Juju 2.
      const result = db.exportBundle();
      assert.isDefined(result.applications.puppet);
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
      const result = db.exportBundle();
      assert.strictEqual(result.applications.wordpress.options.one, 'foo');
      assert.strictEqual(result.applications.wordpress.options.two, 2);
      assert.strictEqual(result.applications.wordpress.options.three, 3.14);
      assert.strictEqual(result.applications.wordpress.options.four, true);
      assert.strictEqual(result.applications.wordpress.options.five, false);
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
      const result = db.exportBundle();
      assert.isUndefined(result.applications.wordpress.options.one);
      assert.strictEqual(result.applications.wordpress.options.two, 2);
      assert.isUndefined(result.applications.wordpress.options.three);
      assert.strictEqual(result.applications.wordpress.options.four, false);
      assert.isUndefined(result.applications.wordpress.options.five, false);
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
      const result = db.exportBundle();
      assert.equal(result.applications.wordpress.options.one, '1');
      assert.equal(result.applications.wordpress.options.two, '2');
      assert.equal(result.applications.wordpress.options.three, '3');
      assert.equal(result.applications.wordpress.options.four, '4');
      assert.equal(result.applications.wordpress.options.five, true);
    });

    it('exports exposed flag', function() {
      db.services.add({id: 'wordpress', charm: 'precise/wordpress-4'});
      db.charms.add([{id: 'precise/wordpress-4'}]);
      let result = db.exportBundle();
      assert.isUndefined(result.applications.wordpress.expose);
      db.services.getById('wordpress').set('exposed', true);
      result = db.exportBundle();
      assert.isTrue(result.applications.wordpress.expose);
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
        mysql: ['0'],
        wordpress: ['0']
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
        wordpress: ['0', '2'],
        mysql: ['0', '1', '2'],
        apache2: ['1', '2']
      };
      assert.deepEqual(placement, expected);
    });

    it('can determine container placement for units', function() {
      var machines = [{
        id: '0'
      }, {
        id: '0/lxc/0',
        containerType: 'lxc',
        parentId: '0'
      }, {
        id: '0/kvm/0',
        containerType: 'kvm',
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
        machine: '0/kvm/0'
      }];
      db.machines.add(machines);
      db.units.add(units, true);
      var placement = db._mapServicesToMachines(db.machines);
      var expected = {
        wordpress: ['0'],
        mysql: ['0'],
        apache2: ['kvm:wordpress/0']
      };
      assert.deepEqual(placement, expected);
    });

    it('starts bundle export machine index at 0', function() {
      // Because we ignore any machines which do not have units placed or only
      // host the GUI service we remap all machine ids to start at 0.
      var machines = [
        { id: '3', hardware: {}, series: 'trusty' },
        { id: '4', hardware: {}, series: 'trusty' },
        { id: '5', hardware: {}, series: 'trusty' }
      ];
      var units = [{
        service: 'wordpress',
        id: 'wordpress/0',
        agent_state: 'started',
        machine: '3'
      }, {
        service: 'mysql',
        id: 'mysql/0',
        agent_state: 'started',
        machine: '3'
      }, {
        service: 'mysql',
        id: 'mysql/1',
        agent_state: 'started',
        machine: '4'
      }, {
        service: 'apache2',
        id: 'apache2/0',
        agent_state: 'started',
        machine: '4'
      }, {
        service: 'wordpress',
        id: 'wordpress/1',
        agent_state: 'started',
        machine: '5'
      }, {
        service: 'apache2',
        id: 'apache2/1',
        agent_state: 'started',
        machine: '5'
      }, {
        service: 'mysql',
        id: 'mysql/2',
        agent_state: 'started',
        machine: '5'
      }];
      var services = [
        { id: 'wordpress', charm: 'cs:trusty/wordpress-27' },
        { id: 'apache2', charm: 'cs:trusty/apache2-27' },
        { id: 'mysql', charm: 'cs:trusty/mysql-27' }
      ];
      var charms = [
        { id: 'cs:trusty/wordpress-27' },
        { id: 'cs:trusty/apache2-27' },
        { id: 'cs:trusty/mysql-27' }
      ];
      db.machines.add(machines);
      db.services.add(services);
      db.charms.add(charms);
      db.units.add(units, true);
      const bundle = db.exportBundle();
      const expectedMachines = {
        '0': { series: 'trusty' },
        '1': { series: 'trusty' },
        '2': { series: 'trusty' }
      };
      assert.deepEqual(bundle.machines, expectedMachines);
    });

    it('includes machines without series and hardware', function() {
      const machines = [{id: '4'}, {id: '5', constraints: 'foo=bar'}];
      const units = [{
        service: 'apache2',
        id: 'apache2/1',
        machine: '4'
      }, {
        service: 'mysql',
        id: 'mysql/2',
        machine: '5'
      }];
      const services = [
        {id: 'apache2', charm: 'cs:trusty/apache2-27'},
        {id: 'mysql', charm: 'cs:trusty/mysql-27'}
      ];
      const charms = [
        {id: 'cs:trusty/apache2-27'},
        {id: 'cs:trusty/mysql-27'}
      ];
      db.machines.add(machines);
      db.services.add(services);
      db.charms.add(charms);
      db.units.add(units, true);
      const bundle = db.exportBundle();
      const expectedMachines = {'0': {}, '1': {constraints: 'foo=bar'}};
      assert.deepEqual(bundle.machines, expectedMachines);
    });

    it('includes uncommmitted units when determining placement', function() {
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
      var placement = db._mapServicesToMachines(db.machines, true);
      var expected = {
        wordpress: ['0'],
        mysql: ['0'],
        apache2: ['0']
      };
      assert.deepEqual(placement, expected);
    });

    it('includes uncommitted machines when determining placement', function() {
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
      var placement = db._mapServicesToMachines(db.machines, true);
      assert.deepEqual(placement, {
        wordpress: ['new0'],
        mysql: ['new0'],
        apache2: ['new0']
      });
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
      db.machines.add({ id: '0', hardware: {}});
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
      const result = db.exportBundle();
      assert.deepEqual(result.applications.mysql.to, ['0']);
    });
  });

  describe('service models', function() {
    var models, list, django, rails, wordpress, mysql;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-models'], function(Y) {
        models = Y.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
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

    describe('getServiceByName', function() {

      beforeEach(function() {
        list.add({
          id: '432178$',
          name: 'ghost-service'
        });
      });

      it('returns service instances when provided real id', function() {
        var service = list.getServiceByName('mysql');
        assert.equal(service.get('id'), 'mysql');
      });

      it('returns ghost service when provided a name', function() {
        var service = list.getServiceByName('ghost-service');
        assert.equal(service.get('id'), '432178$');
      });
    });

    describe('updateConfig', function() {
      it('updates local config if fields are not dirty', function() {
        django.set('config', {debug: 'foo'});
        django.updateConfig({debug: 'bar'});
        assert.deepEqual(django.get('config'), {debug: 'bar'});
        assert.deepEqual(django.get('environmentConfig'), {debug: 'bar'});
      });
    });

    describe('_numToLetter', function() {
      it('converts numbers to letters correctly', function() {
        // Map of numbers and output to check. This list isn't exhaustive
        // but checks some important milestones for common issues with this
        // technique.
        var mapping = {
          1: 'a',
          2: 'b',
          10: 'j',
          15: 'o',
          26: 'z',
          27: 'aa',
          28: 'ab',
          52: 'az',
          53: 'ba',
          54: 'bb',
          703: 'aaa',
          748: 'abt',
          1982: 'bxf'
        };
        Object.keys(mapping).forEach(function(key) {
          assert.equal(
            list._numToLetter(key), mapping[key],
            key + ' did not properly convert to ' + mapping[key]);
        });
      });
    });

    describe('_letterToNum', function() {
      it('converts letters to numbers correctly', function() {
        // Map of numbers and output to check. This list isn't exhaustive
        // but checks some important milestones for common issues with this
        // technique.
        var mapping = {
          a: 1,
          b: 2,
          j: 10,
          o: 15,
          z: 26,
          aa: 27,
          ab: 28,
          az: 52,
          ba: 53,
          bb: 54,
          aaa: 703,
          abt: 748,
          bxf: 1982
        };
        Object.keys(mapping).forEach(function(key) {
          assert.equal(
            list._letterToNum(key), mapping[key],
            key + ' did not properly convert to ' + mapping[key]);
        });
      });
    });
  });

  describe('db.charms.addFromCharmData', function() {
    var db, metadata, models, options;
    var requirements = ['juju-models'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
        done();
      });
    });

    beforeEach(function() {
      db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
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
    var models;
    var requirements = ['juju-charm-models'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
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
