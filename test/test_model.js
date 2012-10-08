'use strict';

(function() {


  describe('juju models', function() {
    var Y, models;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-models', function(Y) {
            models = Y.namespace('juju.models');
            done();
      });
    });

    it('must be able to create charm', function() {
      var charm = new models.Charm({id: 'cs:precise/mysql-6'});
      charm.get('id').should.equal('cs:precise/mysql-6');
      // and verify the value function on the model
      charm.get('name').should.equal('precise/mysql');
      charm.get('details_url').should.equal(
          '/charms/charms/precise/mysql/json');
    });

    it('must be able to parse real-world charm names', function() {
      var charm = new models.Charm({id: 'cs:precise/openstack-dashboard-0'});
      charm.get('name').should.equal('precise/openstack-dashboard');
      charm.get('details_url').should.equal(
          '/charms/charms/precise/openstack-dashboard/json');
    });

    it('must be able to parse individually owned charms', function() {
      var charm = new models.Charm({id: 'cs:~marcoceppi/precise/wordpress-17'});
      charm.get('name').should.equal('marcoceppi/precise/wordpress');
      charm.get('details_url').should.equal(
          '/charms/~marcoceppi/precise/wordpress/json');
    });

    it('must be able to create charm list', function() {
      var c1 = new models.Charm({name: 'mysql',
        description: 'A DB'}),
          c2 = new models.Charm({name: 'logger',
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
})();
