'use strict';

(function() {

  describe('charm normalization', function() {
    var Y, models;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-models', function(Y) {
            models = Y.namespace('juju.models');
            done();
      });
    });

    it('must normalize charm ids when creating', function() {
      var charm = new models.Charm({id: 'precise/openstack-dashboard-0'});
      charm.get('id').should.equal('cs:precise/openstack-dashboard');
      // It also normalizes scheme value.
      charm.get('scheme').should.equal('cs');
    });

    it('must normalize charm ids from getById', function() {
      var charms = new models.CharmList(),
          original = charms.add({id: 'cs:precise/openstack-dashboard'}),
          charm = charms.getById('precise/openstack-dashboard-0');
      charm.should.equal(original);
    });

    it('must create derived attributes from official charm id', function() {
      var charm = new models.Charm(
          {id: 'cs:precise/openstack-dashboard-0'});
      charm.get('scheme').should.equal('cs');
      var _ = expect(charm.get('owner')).to.not.exist;
      charm.get('full_name').should.equal('precise/openstack-dashboard');
      charm.get('charm_store_path').should.equal(
          'charms/precise/openstack-dashboard/json');
    });

    it('must convert timestamps into time objects', function() {
      var time = 1349797266.032,
          date = new Date(time),
          charm = new models.Charm(
          { id: 'precise/foo', last_change: {created: time / 1000} });
      charm.get('last_change').created.should.eql(date);
    });

  });

  describe('charm id helper functions', function() {
    var Y, models;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-models', function(Y) {
            models = Y.namespace('juju.models');
            done();
      });
    });

    it('must parse fully qualified names', function() {
      // undefined never equals undefined.
      var res = models.parse_charm_id('cs:precise/openstack-dashboard-0');
      res.scheme.should.equal('cs');
      var _ = expect(res.owner).to.not.exist;
      res.series.should.equal('precise');
      res.package_name.should.equal('openstack-dashboard');
      res.revision.should.equal('0');
    });

    it('must parse names without revisions', function() {
      var res = models.parse_charm_id('cs:precise/openstack-dashboard'),
          _ = expect(res.revision).to.not.exist;
    });

    it('must parse fully qualified names with owners', function() {
      models.parse_charm_id('cs:~bac/precise/openstack-dashboard-0').owner
        .should.equal('bac');
    });

    it('must parse fully qualified names with hyphenated owners', function() {
      models.parse_charm_id('cs:~alt-bac/precise/openstack-dashboard-0').owner
        .should.equal('alt-bac');
    });

    it('must normalize a charm id without a scheme', function() {
      new models.CharmList().normalizeCharmId('precise/openstack-dashboard')
        .should.equal('cs:precise/openstack-dashboard');
    });

    it('must normalize a charm id with a revision', function() {
      new models.CharmList()
        .normalizeCharmId('local:precise/openstack-dashboard-5')
        .should.equal('local:precise/openstack-dashboard');
    });

  });

  describe('juju models', function() {
    var Y, models;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-models', function(Y) {
            models = Y.namespace('juju.models');
            done();
      });
    });

    it('must be able to create charm', function() {
      var charm = new models.Charm(
          {id: 'cs:~bac/precise/openstack-dashboard-0'});
      charm.get('scheme').should.equal('cs');
      charm.get('owner').should.equal('bac');
      charm.get('series').should.equal('precise');
      charm.get('package_name').should.equal('openstack-dashboard');
      charm.get('revision').should.equal('0');
      charm.get('full_name').should.equal('~bac/precise/openstack-dashboard');
      charm.get('charm_store_path').should.equal(
          '~bac/precise/openstack-dashboard/json');
    });

    it('must be able to parse real-world charm names', function() {
      var charm = new models.Charm({id: 'cs:precise/openstack-dashboard-0'});
      charm.get('full_name').should.equal('precise/openstack-dashboard');
      charm.get('package_name').should.equal('openstack-dashboard');
      charm.get('charm_store_path').should.equal(
          'charms/precise/openstack-dashboard/json');
    });

    it('must be able to parse individually owned charms', function() {
      // Note that an earlier version of the parsing code did not handle
      // hyphens in user names, so this test intentionally includes one.
      var charm = new models.Charm(
          {id: 'cs:~marco-ceppi/precise/wordpress-17'});
      charm.get('full_name').should.equal('~marco-ceppi/precise/wordpress');
      charm.get('package_name').should.equal('wordpress');
      charm.get('charm_store_path').should.equal(
          '~marco-ceppi/precise/wordpress/json');
    });

    it('must reject bad charm ids.', function() {
      var charm = new models.Charm({id: 'foobar'});
      var _ = expect(charm.get('id')).to.not.exist;
      charm.set('id', 'barfoo');
      _ = expect(charm.get('id')).to.not.exist;
    });

    it('must be able to create charm list', function() {
      var c1 = new models.Charm(
          { id: 'cs:precise/mysql',
            description: 'A DB'}),
          c2 = new models.Charm(
          { id: 'cs:precise/logger',
            description: 'Log sub'}),
          clist = new models.CharmList().add([c1, c2]);
      var names = clist.map(function(c) {return c.get('package_name');});
      names[0].should.equal('mysql');
      names[1].should.equal('logger');
    });


    it('service unit list should be able to get units of a given service',
       function() {
         var sl = new models.ServiceList();
         var sul = new models.ServiceUnitList();
         var mysql = new models.Service({id: 'mysql'});
         var wordpress = new models.Service({id: 'wordpress'});
         sl.add([mysql, wordpress]);
         sl.getById('mysql').should.equal(mysql);
         sl.getById('wordpress').should.equal(wordpress);

         sul.add([{id: 'mysql/0'}, {id: 'mysql/1'}]);

         var wp0 = {id: 'wordpress/0'},
         wp1 = {id: 'wordpress/1'};
         sul.add([wp0, wp1]);
         wp0.service.should.equal('wordpress');

         sul.get_units_for_service(mysql, true).getAttrs(['id']).id.should.eql(
         ['mysql/0', 'mysql/1']);
         sul.get_units_for_service(wordpress, true).getAttrs(
         ['id']).id.should.eql(['wordpress/0', 'wordpress/1']);
       });

    it('service unit list should be able to aggregate unit statuses',
       function() {
         var sl = new models.ServiceList();
         var sul = new models.ServiceUnitList();
         var mysql = new models.Service({id: 'mysql'});
         var wordpress = new models.Service({id: 'wordpress'});
         sl.add([mysql, wordpress]);

         var my0 = new models.ServiceUnit(
         {id: 'mysql/0', agent_state: 'pending'}),
         my1 = new models.ServiceUnit(
         {id: 'mysql/1', agent_state: 'pending'});

         sul.add([my0, my1]);

         var wp0 = new models.ServiceUnit(
         { id: 'wordpress/0',
           agent_state: 'pending'}),
         wp1 = new models.ServiceUnit(
         { id: 'wordpress/1',
           agent_state: 'error'});
         sul.add([wp0, wp1]);

         sul.get_informative_states_for_service(mysql).should.eql(
         {'pending': 2});
         sul.get_informative_states_for_service(wordpress).should.eql(
         {'pending': 1, 'error': 1});
       });

    it('service unit objects should parse the service name from unit id',
       function() {
         var service_unit = {id: 'mysql/0'},
         db = new models.Database();
         db.units.add(service_unit);
         service_unit.service.should.equal('mysql');
       });

    it('service unit objects should report their number correctly',
       function() {
         var service_unit = {id: 'mysql/5'},
         db = new models.Database();
         db.units.add(service_unit);
         service_unit.number.should.equal(5);
       });

    it('must be able to resolve models by modelId', function() {
      var db = new models.Database();

      db.services.add([{id: 'wordpress'}, {id: 'mediawiki'}]);
      db.units.add([{id: 'wordpress/0'}, {id: 'wordpress/1'}]);

      var model = db.services.item(0);
      // Single parameter calling
      db.getModelById([model.name, model.get('id')])
               .get('id').should.equal('wordpress');
      // Two parameter interface
      db.getModelById(model.name, model.get('id'))
               .get('id').should.equal('wordpress');

      var unit = db.units.item(0);
      db.getModelById([unit.name, unit.id]).id.should.equal('wordpress/0');
      db.getModelById(unit.name, unit.id).id.should.equal('wordpress/0');
    });

    it('on_delta should handle remove changes correctly',
       function() {
         var db = new models.Database();
         var my0 = new models.ServiceUnit({id: 'mysql/0',
           agent_state: 'pending'}),
         my1 = new models.ServiceUnit({id: 'mysql/1',
           agent_state: 'pending'});
         db.units.add([my0, my1]);
         db.on_delta({data: {result: [
           ['unit', 'remove', 'mysql/1']
          ]}});
         var names = db.units.get('id');
         names.length.should.equal(1);
         names[0].should.equal('mysql/0');
       });

    it('on_delta should be able to reuse existing services with add',
       function() {
         var db = new models.Database();
         var my0 = new models.Service({id: 'mysql', exposed: true});
         db.services.add([my0]);
         // Note that exposed is not set explicitly to false.
         db.on_delta({data: {result: [
           ['service', 'add', {id: 'mysql'}]
          ]}});
         my0.get('exposed').should.equal(false);
       });

    it('on_delta should be able to reuse existing units with add',
       // Units are special because they use the LazyModelList.
       function() {
         var db = new models.Database();
         var my0 = {id: 'mysql/0', agent_state: 'pending'};
         db.units.add([my0]);
         db.on_delta({data: {result: [
           ['unit', 'add', {id: 'mysql/0', agent_state: 'another'}]
          ]}});
         my0.agent_state.should.equal('another');
       });

    it('on_delta should reset relation_errors',
       function() {
         var db = new models.Database();
         var my0 = {id: 'mysql/0', relation_errors: {'cache': ['memcached']}};
         db.units.add([my0]);
         // Note that relation_errors is not set.
         db.on_delta({data: {result: [
           ['unit', 'change', {id: 'mysql/0'}]
          ]}});
         my0.relation_errors.should.eql({});
       });

    it('ServiceUnitList should accept a list of units at instantiation and ' +
       'decorate them', function() {
         var mysql = new models.Service({id: 'mysql'});
         var objs = [{id: 'mysql/0'},
                     {id: 'mysql/1'}];
         var sul = new models.ServiceUnitList({items: objs});
         var unit_data = sul.get_units_for_service(
                 mysql, true).getAttrs(['service', 'number']);
         unit_data.service.should.eql(['mysql', 'mysql']);
         unit_data.number.should.eql([0, 1]);
       });
    it('RelationList.has_relations_for_endpoint should do what it says',
        function() {
          var db = new models.Database(),
              service = new models.Service({id: 'mysql', exposed: false}),
              rel0 = new models.Relation(
              { id: 'relation-0',
                endpoints:
           [['mediawiki', {name: 'cache', role: 'source'}],
                 ['squid', {name: 'cache', role: 'front'}]],
                'interface': 'cache'
              }),
              rel1 = new models.Relation(
              { id: 'relation-4',
                endpoints:
           [['something', {name: 'foo', role: 'bar'}],
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
               'interface': 'cache'
             }),
             rel1 = new models.Relation(
             { id: 'relation-1',
               endpoints:
               [['wordpress', {role: 'peer', name: 'loadbalancer'}]],
               'interface': 'reversenginx'
             }),
             rel2 = new models.Relation(
             { id: 'relation-2',
               endpoints:
               [['mysql', {name: 'db', role: 'db'}],
                 ['mediawiki', {name: 'storage', role: 'app'}]],
               'interface': 'db'
             }),
             rel3 = new models.Relation(
             { id: 'relation-3',
               endpoints:
               [['mysql', {role: 'peer', name: 'loadbalancer'}]],
               'interface': 'mysql-loadbalancer'
             }),
             rel4 = new models.Relation(
             { id: 'relation-4',
               endpoints:
               [['something', {name: 'foo', role: 'bar'}],
                 ['mysql', {name: 'la', role: 'lee'}]],
               'interface': 'thing'
             });
          db.relations.add([rel0, rel1, rel2, rel3, rel4]);
          Y.Array.map(
              db.relations.get_relations_for_service(service),
              function(r) { return r.get('id'); })
                .should.eql(['relation-2', 'relation-3', 'relation-4']);
        });
  });

  describe('juju charm load', function() {
    var Y, models, conn, env, app, container, charm_store, data;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-models', 'juju-gui', 'datasource-local', 'juju-tests-utils',
          'json-stringify',
          function(Y) {
            models = Y.namespace('juju.models');
            done();
          });
    });

    beforeEach(function() {
      conn = new (Y.namespace('juju-tests.utils')).SocketStub(),
      env = new (Y.namespace('juju')).Environment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div id="test" class="container"></div>');
      data = [];
      charm_store = new Y.DataSource.Local({source: data});
    });

    afterEach(function() {
      container.destroy();
    });

    it('will throw an exception with non-read sync', function() {
      var charm = new models.Charm({id: 'local:precise/foo'});
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

    it('throws an error if you do not pass env and charm_store', function() {
      var charm = new models.Charm({id: 'local:precise/foo'});
      try {
        charm.sync('read', {});
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal(
            'You must supply both the env and the charm_store as options.');
      }
      try {
        charm.sync('read', {env: 42});
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal(
            'You must supply both the env and the charm_store as options.');
      }
      try {
        charm.sync('read', {charm_store: 42});
        assert.fail('Should have thrown an error');
      } catch (e) {
        e.should.equal(
            'You must supply both the env and the charm_store as options.');
      }
    });

    it('must send request to juju environment for local charms', function() {
      var charm = new models.Charm({id: 'local:precise/foo'}).load(
          {env: env, charm_store: charm_store});
      assert(!charm.loaded);
      conn.last_message().op.should.equal('get_charm');
    });

    it('must handle success from local charm request', function(done) {
      var charm = new models.Charm({id: 'local:precise/foo'}).load(
          {env: env, charm_store: charm_store},
          function(err, response) {
            assert(!err);
            charm.get('summary').should.equal('wowza');
            assert(charm.loaded);
            done();
          });
      var response = conn.last_message();
      response.result = {summary: 'wowza'};
      env.dispatch_result(response);
      // The test in the callback above should run.
    });

    it('must handle failure from local charm request', function(done) {
      var charm = new models.Charm({id: 'local:precise/foo'}).load(
          {env: env, charm_store: charm_store},
          function(err, response) {
            assert(err);
            assert(response.err);
            assert(!charm.loaded);
            done();
          });
      var response = conn.last_message();
      response.err = true;
      env.dispatch_result(response);
      // The test in the callback above should run.
    });

    it('must handle success from the charm store', function() {
      data.push(
          { responseText: Y.JSON.stringify(
          { summary: 'wowza', subordinate: true })});
      var charm = new models.Charm({id: 'cs:precise/foo-7'}).load(
          {env: env, charm_store: charm_store},
          function(err, response) {
            assert(!err);
          });
      assert(charm.loaded);
      charm.get('summary').should.equal('wowza');
      charm.get('is_subordinate').should.equal(true);
      charm.get('scheme').should.equal('cs');
      charm.get('revision').should.equal('7');
    });

    it('must handle failure from the charm store', function() {
      // _defRequestFn is designed to be overridden to achieve more complex
      // behavior when a request is received.  We simply declare that an
      // error occurred.
      var original = charm_store._defResponseFn;
      charm_store._defResponseFn = function(e) {
        e.error = true;
        original.apply(charm_store, [e]);
      };
      data.push({responseText: Y.JSON.stringify({darn_it: 'uh oh!'})});
      var charm = new models.Charm({id: 'cs:precise/foo'}).load(
          {env: env, charm_store: charm_store},
          function(err, response) {
            assert(err);
          });
      assert(!charm.loaded);
    });

  });
})();
