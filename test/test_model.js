'use strict';

(function() {

  describe('charm list modified functions', function () {
    var Y, models;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-models', function(Y) {
            models = Y.namespace('juju.models');
            done();
      });
    });

    it('must normalize charm ids when adding', function() {
      var charms = new models.CharmList(),
          charm = charms.add({id: 'precise/openstack-dashboard-0'});
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

  });

  describe('charm id helper functions', function () {
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
      res[0].should.equal('cs');
      var _ = expect(res[1]).to.not.exist;
      res.slice(2).should.eql(['precise', 'openstack-dashboard', '0']);
    });

    it('must parse names without revisions', function() {
      var res = models.parse_charm_id('cs:precise/openstack-dashboard');
      var _ = expect(res[4]).to.not.exist;
    });

    it('must parse fully qualified names with owners', function() {
      models.parse_charm_id('cs:~bac/precise/openstack-dashboard-0')[1]
        .should.equal('bac');
    });

    it('must give calculate a full name from an official id', function() {
      models.calculate_full_name('cs:precise/openstack-dashboard-0')
        .should.equal('precise/openstack-dashboard');
    });

    it('must give calculate a full name from an owned id', function() {
      models.calculate_full_name('cs:~bac/precise/openstack-dashboard-0')
        .should.equal('~bac/precise/openstack-dashboard');
    });

    it('must normalize a charm id without a scheme', function() {
      models.normalize_charm_id('precise/openstack-dashboard')
        .should.equal('cs:precise/openstack-dashboard');
    });

    it('must normalize a charm id with a revision', function() {
      models.normalize_charm_id('local:precise/openstack-dashboard-5')
        .should.equal('local:precise/openstack-dashboard');
    });

    it('must calculate paths for official ids', function() {
      models.calculate_path('cs:precise/openstack-dashboard-0')
        .should.equal('charms/precise/openstack-dashboard/json');
    });

    it('must calculate paths for owned ids', function() {
      models.calculate_path('cs:~bac/precise/openstack-dashboard-0')
        .should.equal('~bac/precise/openstack-dashboard/json');
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
      var db = new models.Database(),
          charm = db.charms.add({id: 'cs:~bac/precise/mysql-6'});
      // and verify calculated attributes on the model
      charm.get('id').should.equal('cs:~bac/precise/mysql');
      charm.get('series').should.equal('precise');
      charm.get('scheme').should.equal('cs');
      charm.get('owner').should.equal('bac');
      charm.get('revision').should.equal('6');
      charm.get('full_name').should.equal('~bac/precise/mysql');
      charm.get('name').should.equal('mysql');
      charm.get('details_url').should.equal(
          '~bac/precise/mysql/json');
    });

    it('must be able to parse real-world charm names', function() {
      var db = new models.Database(),
          charm = db.charms.add({id: 'cs:precise/openstack-dashboard-0'});
      charm.get('full_name').should.equal('precise/openstack-dashboard');
      charm.get('name').should.equal('openstack-dashboard');
      charm.get('details_url').should.equal(
          'charms/precise/openstack-dashboard/json');
    });

    it('must be able to parse individually owned charms', function() {
      var db = new models.Database(),
          charm = db.charms.add({id: 'cs:~marcoceppi/precise/wordpress-17'});
      charm.get('full_name').should.equal('~marcoceppi/precise/wordpress');
      charm.get('name').should.equal('wordpress');
      charm.get('details_url').should.equal(
          '~marcoceppi/precise/wordpress/json');
    });

    it('must be able to create charm list', function() {
      var c1 = new models.Charm(
          { id: 'cs:precise/mysql',
            description: 'A DB'}),
          c2 = new models.Charm(
          { id: 'cs:precise/logger',
            description: 'Log sub'}),
          clist = new models.CharmList().add([c1, c2]);
      var names = clist.map(function(c) {return c.get('name');});
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
         {id: 'wordpress/0', agent_state: 'pending'}),
         wp1 = new models.ServiceUnit(
         {id: 'wordpress/1', agent_state: 'error'});
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

  describe('juju charm list loadById', function() {
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
      app = new Y.juju.App(
        { container: container,
          viewContainer: container,
          env: env,
          charm_store: charm_store });
    });

    afterEach(function() {
      container.destroy();
      app.destroy();
    });

    it('must throw an exception for bad ids.', function() {
      try {
        app.db.charms.loadById('foobar');
        assert.fail('Should have thrown an error.');
      } catch(e) {
        e.should.equal('invalid charm_id: foobar');
      }
    });

    it('must aggregate callbacks for the same id', function() {
      app.db.charms.loading_callbacks['cs:precise/foo'] = [0];
      app.db.charms.loadById('precise/foo-3', 1);
      app.db.charms.loading_callbacks['cs:precise/foo'].should.eql([0, 1]);
    });

    it('must first try to get the charm from itself', function() {
      app.db.charms.add({id: 'local:precise/foo'});
      app.db.charms.loadById('local:precise/foo-17', function(charm) {
        charm.get('id').should.equal('local:precise/foo');
      });
      var _ = expect(conn.last_message()).to.not.exist;
    });

    it('must send request to juju environment for local charms', function() {
      app.db.charms.loadById('local:precise/foo', 'I am a marker!');
      conn.last_message().op.should.equal('get_charm');
      app.db.charms.loading_callbacks['local:precise/foo']
        .should.eql(['I am a marker!']);
    });

    it('must handle success from local charm request', function(done) {
      app.db.charms.loadById('local:precise/foo', function(charm) {
        charm.get('summary').should.equal('wowza');
        done();
      });
      var response = conn.last_message();
      response.result = {summary: 'wowza'};
      env.dispatch_result(response);
      // The test in the callback above should run.
    });

    it('must handle failure from local charm request', function(done) {
      app.db.charms.loadById('local:precise/foo', function(ev) {
        ev.err.should.equal(true);
        done();
      });
      var response = conn.last_message();
      response.err = true;
      env.dispatch_result(response);
      // The test in the callback above should run.
    });

    it('must handle success from the charm store', function(){
      data.push(
        { responseText: Y.JSON.stringify(
          { summary: 'wowza', subordinate: true })});
      app.db.charms.loadById('cs:precise/foo-7', function(charm) {
        charm.get('summary').should.equal('wowza');
        charm.get('is_subordinate').should.equal(true);
        charm.get('scheme').should.equal('cs');
        charm.get('revision').should.equal('7');
      });
    });

    it('must handle failure from the charm store', function(){
      // This is the only reasonable hook point into the local data store that
      // I found to set an error.  Fragile, to some unknown degree.
      var original = charm_store._defResponseFn;
      charm_store._defResponseFn = function(e) {
        e.error = true;
        original.apply(charm_store, [e]);
      };
      data.push({responseText: Y.JSON.stringify({darn_it: 'uh oh!'})});
      app.db.charms.loadById('cs:precise/foo', function(error) {
        // The code sets "err" for the error path to mimic env errors.
        error.err.should.equal(true);
      });
    });

  });
})();
