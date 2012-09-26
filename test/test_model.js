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
    });

    it('must be able to parse real-world charm names', function() {
      var charm = new models.Charm({id: 'cs:precise/openstack-dashboard-0'});
      charm.get('name').should.equal('precise/openstack-dashboard');
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

         var my0 = new models.ServiceUnit({id: 'mysql/0'}),
         my1 = new models.ServiceUnit({id: 'mysql/1'});

         sul.add([my0, my1]);

         var wp0 = new models.ServiceUnit({id: 'wordpress/0'}),
         wp1 = new models.ServiceUnit({id: 'wordpress/1'});
         sul.add([wp0, wp1]);
         wp0.get('service').should.equal('wordpress');

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

         var my0 = new models.ServiceUnit({id: 'mysql/0', agent_state: 'pending'}),
         my1 = new models.ServiceUnit({id: 'mysql/1', agent_state: 'pending'});

         sul.add([my0, my1]);

         var wp0 = new models.ServiceUnit({id: 'wordpress/0', agent_state: 'pending'}),
         wp1 = new models.ServiceUnit({id: 'wordpress/1', agent_state: 'error'});
         sul.add([wp0, wp1]);

         sul.get_informative_states_for_service(mysql).should.eql(
         {'pending': 2});
         sul.get_informative_states_for_service(wordpress).should.eql(
         {'pending': 1, 'error': 1});
       });

    it('service units should get service from unit name when missing',
       function() {
         var service_unit = new models.ServiceUnit({id: 'mysql/0'});
         var service = service_unit.get('service');
         service.should.equal('mysql');
       });

    it('must be able to resolve models by modelId', function() {
      var db = new models.Database();

      db.services.add([{id: 'wordpress'},
            {id: 'mediawiki'}]);

      db.units.add([{id: 'wordpress/0'},
            {id: 'wordpress/1'}]);

      var model = db.services.item(0);

      // Single Paramerter calling
      db.getModelById([model.name, model.get('id')])
               .get('id').should.equal('wordpress');

      // Two parameter interface
      db.getModelById(model.name, model.get('id'))
               .get('id').should.equal('wordpress');


      var unit = db.units.item(0);
      db.getModelById([unit.name, unit.get('id')])
               .get('id').should.equal('wordpress/0');

      db.getModelById(unit.name, unit.get('id'))
               .get('id').should.equal('wordpress/0');

    });


    it('service units should report their number correctly',
       function() {
         var service_unit = new models.ServiceUnit({id: 'mysql/5'});
         var number = service_unit.get('number');
         number.should.equal(5);
       });

    it('process_model_delta should handle remove changes correctly',
       function() {
         var db = new models.Database();
         var my0 = new models.ServiceUnit({id: 'mysql/0',
           agent_state: 'pending'}),
         my1 = new models.ServiceUnit({id: 'mysql/1',
           agent_state: 'pending'});
         db.units.add([my0, my1]);
         db.process_model_delta(
         ['unit', 'remove', 'mysql/1'], db.units);
         var names = db.units.get('id');
         names.length.should.equal(1);
         names[0].should.equal('mysql/0');
       });

    it('process_model_delta should be able to reuse existing models with add',
       function() {
         var db = new models.Database();
         var my0 = new models.ServiceUnit({id: 'mysql/0', agent_state: 'pending'});
         db.units.add([my0]);
         db.process_model_delta(
         ['unit', 'add', {id: 'mysql/0', agent_state: 'another'}],
         db.units);
         my0.get('agent_state').should.equal('another');
       });
  });
})();
