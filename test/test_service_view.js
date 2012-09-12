'use strict';

(function () {
  describe('juju service view', function() {
    var ServiceView, views, models, Y, container, service, db, conn,
      juju, env, charm, my0, my1, my2;
    var SocketStub = function () {
      this.messages = [];

      this.close = function() {
          console.log('close stub');
          this.messages = [];
      };

      this.transient_close = function() {
          this.onclose();
      };

      this.open = function() {
          this.onopen();
      };

      this.msg = function(m) {
          console.log("serializing env msg", m);
          this.onmessage({'data': Y.JSON.stringify(m)});
      };

      this.last_message = function(m) {
          return this.messages[this.messages.length-1];
      };

      this.send = function(m) {
          console.log('socket send', m);
          this.messages.push(Y.JSON.parse(m));
      };

      this.onclose = function() {};
      this.onmessage = function() {};
      this.onopen = function() {};

    };

    before(function (done) {
      Y = YUI(GlobalConfig).use(
        'juju-views', 'juju-models', 'base', 'node', 'json-parse',
        'juju-env', 'node-event-simulate',
        function (Y) {
          views = Y.namespace('juju.views');
          models = Y.namespace("juju.models");
          ServiceView = views.service;
          conn = new SocketStub();
          juju = Y.namespace("juju");
          env = new juju.Environment({conn: conn});
          env.connect();
          conn.open();
          done();
      });
    });

    after(function(done)  {
        env.destroy();
        done();
    });

    beforeEach(function (done) {
      container = Y.Node.create('<div id="test-container" />');
      db = new models.Database();
      charm = new models.Charm({id: "mysql", name: "mysql",
                                 description: "A DB"});
      db.charms.add([charm]);
      my0 = new models.ServiceUnit({id:'mysql/0', agent_state: 'pending'}),
      my1 = new models.ServiceUnit({id:'mysql/1', agent_state: 'pending'}),
      my2 = new models.ServiceUnit({id:'mysql/2', agent_state: 'pending'});
      db.units.add([my1, my2, my0]);
      service = new models.Service({id: "mysql", charm: "mysql", unit_count: db.units.size()});
      db.services.add([service])
      done();
    });

    afterEach(function (done) {
      container.destroy();
      service.destroy;
      db.destroy();
      conn.messages = [];
      done();
    });

    it('should show controls to modify units by default', function () {
      var view = new ServiceView(
        {container: container, model: service, domain_models: db, app: {env: env}});
      view.render();
      container.one('#service-unit-control').should.not.equal(null);
    });

    it('should not show controls if the charm is subordinate', function () {
      charm.set('is_subordinate', true);
      var view = new ServiceView(
        {container: container, model: service, domain_models: db, app: {env: env}});
      view.render();
      expect(container.one('#service-unit-control')).to.not.exist;
    });

    it('should show the service units ordered by number', function () {
      // Note that the units are added in beforeEach in an ordered manner.
      var view = new ServiceView(
        {container: container, model: service, domain_models: db, app: {env: env}});
      view.render();
      var rendered_names = container.all('div.thumbnail').get('id');
      var expected_names = db.units.map(function(u) {return u.get('id');});
      expected_names.sort();
      assert.deepEqual(rendered_names, expected_names);
    });

    it('should send an add-unit message when (+) is clicked', function () {
      var view = new ServiceView(
        {container: container, model: service, domain_models: db, app: {env: env}});
      view.render();
      var control = container.one('#add-service-unit');
      control.simulate('click');
      var message = conn.last_message();
      message.op.should.equal('add_unit');
      message.service_name.should.equal('mysql');
      message.num_units.should.equal(1);
    });

    it('should send a remove-unit message when (-) is clicked', function () {
      var view = new ServiceView(
        {container: container, model: service, domain_models: db, app: {env: env}});
      view.render();
      var control = container.one('#rm-service-unit');
      control.simulate('click');
      var message = conn.last_message();
      message.op.should.equal('remove_units');
      // We always remove the unit with the largest number.
      assert.deepEqual(message.unit_names, ['mysql/2']);
    });

    it('should not send a remove-unit message when (-) is clicked if we only have one unit',
      function () {
        db.units.remove([my1, my2]);
        service.set('unit_count', 1);
        var view = new ServiceView(
          {container: container, model: service, domain_models: db, app: {env: env}});
        view.render();
        container.all('div.thumbnail').get('id').length.should.equal(1);
        var control = container.one('#rm-service-unit');
        control.simulate('click');
        expect(conn.last_message()).to.not.exist;
      });

    it('should start with the proper number of units shown in the text field',
       function() {
         var view = new ServiceView(
           {container: container, model: service, domain_models: db, app: {env: env}});
         view.render();
         var control = container.one('#num-service-units');
         control.get('value').should.equal('3');
       });

  });
}) ();
