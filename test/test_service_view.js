'use strict';

(function () {
  describe('juju service view', function() {
    var ServiceView, views, models, Y, container, service, db, conn,
      juju, env, charm, my0, my1, my2, testUtils;

    before(function (done) {
      Y = YUI(GlobalConfig).use(
        'juju-views', 'juju-models', 'base', 'node', 'json-parse',
        'juju-env', 'node-event-simulate', 'juju-tests-utils',
        function (Y) {
          views = Y.namespace('juju.views');
          models = Y.namespace('juju.models');
          testUtils = Y.namespace('juju-tests.utils');
          ServiceView = views.service;
          conn = new testUtils.SocketStub();
          juju = Y.namespace('juju');
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
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.Charm({id: 'mysql', name: 'mysql',
                                 description: 'A DB'});
      db.charms.add([charm]);
      my0 = new models.ServiceUnit({id:'mysql/0', agent_state: 'pending'}),
      my1 = new models.ServiceUnit({id:'mysql/1', agent_state: 'pending'}),
      my2 = new models.ServiceUnit({id:'mysql/2', agent_state: 'pending'});
      db.units.add([my1, my2, my0]);
      service = new models.Service({id: 'mysql', charm: 'mysql',
                                    unit_count: db.units.size()});
      db.services.add([service]);
      done();
    });

    afterEach(function (done) {
      container.remove();
      container.destroy();
      service.destroy();
      db.destroy();
      env._txn_callbacks = {};
      conn.messages = [];
      done();
    });

    it('should show controls to modify units by default', function () {
      var view = new ServiceView(
        {container: container, model: service, domain_models: db,
         env: env});
      view.render();
      container.one('#service-unit-control').should.not.equal(null);
    });

    it('should not show controls if the charm is subordinate', function () {
      charm.set('is_subordinate', true);
      var view = new ServiceView(
        {container: container, model: service, domain_models: db,
         env: env});
      view.render();
      // Prove that we can attach events without error even when there's
      // nothing to which to attach.
      view.attachEvents();
      // "var _ =" makes the linter happy.
      var _ = expect(container.one('#service-unit-control')).to.not.exist;
    });

    it('should show the service units ordered by number', function () {
      // Note that the units are added in beforeEach in an ordered manner.
      var view = new ServiceView(
        {container: container, model: service, domain_models: db,
         env: env});
      view.render();
      view.attachEvents();
      var rendered_names = container.all('div.thumbnail').get('id');
      var expected_names = db.units.map(function(u) {return u.get('id');});
      expected_names.sort();
      assert.deepEqual(rendered_names, expected_names);
    });

    it('should send an add-unit message when (+) is clicked', function () {
      var view = new ServiceView(
        {container: container, model: service, domain_models: db,
         env: env});
      view.render();
      view.attachEvents();
      var control = container.one('#add-service-unit');
      control.simulate('click');
      var message = conn.last_message();
      message.op.should.equal('add_unit');
      message.service_name.should.equal('mysql');
      message.num_units.should.equal(1);
    });

    it('should send a remove-unit message when (-) is clicked', function () {
      var view = new ServiceView(
        {container: container, model: service, domain_models: db,
         env: env});
      view.render();
      view.attachEvents();
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
          {container: container, model: service, domain_models: db,
           env: env});
        view.render();
        view.attachEvents();
        container.all('div.thumbnail').get('id').length.should.equal(1);
        var control = container.one('#rm-service-unit');
        control.simulate('click');
        // "var _ =" makes the linter happy.
        var _ = expect(conn.last_message()).to.not.exist;
      });

    it('should start with the proper number of units shown in the text field',
       function() {
         var view = new ServiceView(
           {container: container, model: service, domain_models: db,
            env: env});
         view.render();
         var control = container.one('#num-service-units');
         control.get('value').should.equal('3');
       });

    it('should remove multiple units when the text input changes',
      function() {
        var view = new ServiceView(
          {container: container, model: service, domain_models: db,
           env: env});
        view.render();
        var control = container.one('#num-service-units');
        control.set('value', 1);
        control.simulate('keydown', { keyCode: view.ENTER_KEY }); // Simulate Enter.
        var message = conn.last_message();
        message.op.should.equal('remove_units');
        assert.deepEqual(message.unit_names, ['mysql/2', 'mysql/1']);
      });

    it('should not do anything if the number of units is < 1',
      function() {
        var view = new ServiceView(
          {container: container, model: service, domain_models: db,
           env: env});
        view.render();
        var control = container.one('#num-service-units');
        control.set('value', 0);
        control.simulate('keydown', { keyCode: view.ENTER_KEY });
        // "var _ =" makes the linter happy.
        var _ = expect(conn.last_message()).to.not.exist;
      });

    it('should add the correct number of units when entered via text field',
      function() {
        var view = new ServiceView(
          {container: container, model: service, domain_models: db,
           env: env});
        view.render();
        var control = container.one('#num-service-units');
        control.set('value', 7);
        control.simulate('keydown', { keyCode: view.ENTER_KEY });
        var message = conn.last_message();
        message.op.should.equal('add_unit');
        message.service_name.should.equal('mysql');
        message.num_units.should.equal(4);
      });

    it('should add pending units as soon as it gets a reply back ' +
       'from the server',
      function() {
        var new_unit_id = 'mysql/5';
        var expected_names = db.units.map(function(u) {return u.get('id');});
        expected_names.push(new_unit_id);
        expected_names.sort();
        var view = new ServiceView(
          {container: container, model: service, domain_models: db,
           env: env});
        view.render();
        var control = container.one('#add-service-unit');
        control.simulate('click');
        var callbacks = Y.Object.values(env._txn_callbacks);
        callbacks.length.should.equal(1);
        // Since we don't have an app to listen to this event and tell the
        // view to re-render, we need to do it ourselves.
        db.on('update', view.render, view);
        callbacks[0]({result: [new_unit_id]});
        var db_names = db.units.map(function(u) {return u.get('id');});
        db_names.sort();
        assert.deepEqual(db_names, expected_names);
        service.get('unit_count').should.equal(4);
        var rendered_names = container.all('div.thumbnail').get('id');
        assert.deepEqual(rendered_names, expected_names);
      });

    it('should switch units to "stopping" as soon as it gets a ' +
       'reply back from the server',
      function() {
        var view = new ServiceView(
          {container: container, model: service, domain_models: db,
           env: env});
        view.render();
        var control = container.one('#rm-service-unit');
        control.simulate('click');
        var callbacks = Y.Object.values(env._txn_callbacks);
        callbacks.length.should.equal(1);
        callbacks[0]({unit_names: ['mysql/2']});
        db.units.getById('mysql/2').get('agent_state').should.equal('stopping');
      });

  });
}) ();
