'use strict';

(function () {
  describe('juju service view', function() {
    var ServiceView, models, Y, container, service, db, conn,
        env, charm, ENTER, ESC;

    before(function (done) {
      Y = YUI(GlobalConfig).use(
        'juju-views', 'juju-models', 'base', 'node', 'json-parse',
        'juju-env', 'node-event-simulate', 'juju-tests-utils', 'event-key',
        function (Y) {
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
          ESC = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.esc;
          models = Y.namespace('juju.models');
          ServiceView = Y.namespace('juju.views').service;
          done();
      });
    });

    beforeEach(function (done) {
      conn = new (Y.namespace('juju-tests.utils')).SocketStub(),
      env = new (Y.namespace('juju')).Environment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div id="test-container" />');
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.Charm({id: 'mysql', name: 'mysql',
                                 description: 'A DB'});
      db.charms.add([charm]);
      // Add units sorted by id as that is what we expect from the server.
      db.units.add([
        new models.ServiceUnit({id:'mysql/0', agent_state: 'pending'}),
        new models.ServiceUnit({id:'mysql/1', agent_state: 'pending'}),
        new models.ServiceUnit({id:'mysql/2', agent_state: 'pending'})
      ]);
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
      env.destroy();
      done();
    });

    it('should show controls to modify units by default', function () {
      var view = new ServiceView(
        {container: container, model: service, db: db,
         env: env}).render();
      container.one('#num-service-units').should.not.equal(null);
    });

    it('should not show controls if the charm is subordinate', function () {
      charm.set('is_subordinate', true);
      var view = new ServiceView(
        {container: container, model: service, db: db,
         env: env}).render();
      // "var _ =" makes the linter happy.
      var _ = expect(container.one('#num-service-units')).to.not.exist;
    });

    it('should show the service units ordered by number', function () {
      // Note that the units are added in beforeEach in an ordered manner.
      var view = new ServiceView(
        {container: container, model: service, db: db,
         env: env}).render();
      var rendered_names = container.all('div.thumbnail').get('id');
      var expected_names = db.units.map(function(u) {return u.get('id');});
      expected_names.sort();
      //assert.deepEqual(rendered_names, expected_names);
      rendered_names.should.eql(expected_names);
    });

    it('should start with the proper number of units shown in the text field',
       function() {
         var view = new ServiceView(
           {container: container, model: service, db: db,
            env: env}).render();
         var control = container.one('#num-service-units');
         control.get('value').should.equal('3');
       });

    it('should remove multiple units when the text input changes',
      function() {
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 1);
        control.simulate('keydown', { keyCode: ENTER }); // Simulate Enter.
        var message = conn.last_message();
        message.op.should.equal('remove_units');
        message.unit_names.should.eql(['mysql/2', 'mysql/1']);
      });

    it('should not do anything if requested is < 1',
      function() {
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 0);
        control.simulate('keydown', { keyCode: ENTER });
        var _ = expect(conn.last_message()).to.not.exist;
        control.get('value').should.equal('3');
      });

    it('should not do anything if the number of units is <= 1',
      function() {
        service.set('unit_count', 1);
        db.units.remove([1, 2]);
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 0);
        control.simulate('keydown', { keyCode: ENTER });
        var _ = expect(conn.last_message()).to.not.exist;
        control.get('value').should.equal('1');
      });

    it('should add the correct number of units when entered via text field',
      function() {
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 7);
        control.simulate('keydown', { keyCode: ENTER });
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
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 4);
        control.simulate('keydown', { keyCode: ENTER });
        var callbacks = Y.Object.values(env._txn_callbacks);
        callbacks.length.should.equal(1);
        // Since we don't have an app to listen to this event and tell the
        // view to re-render, we need to do it ourselves.
        db.on('update', view.render, view);
        callbacks[0]({result: [new_unit_id]});
        var db_names = db.units.map(function(u) {return u.get('id');});
        db_names.sort();
        db_names.should.eql(expected_names);
        service.get('unit_count').should.equal(4);
        var rendered_names = container.all('div.thumbnail').get('id');
        assert.deepEqual(rendered_names, expected_names);
      });

    it('should remove units as soon as it gets a ' +
       'reply back from the server',
      function() {
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 2);
        control.simulate('keydown', { keyCode: ENTER });
        var callbacks = Y.Object.values(env._txn_callbacks);
        callbacks.length.should.equal(1);
        callbacks[0]({unit_names: ['mysql/2']});
        var _ = expect(db.units.getById('mysql/2')).to.not.exist;
      });

    it('should reset values on the control when you press escape', function() {
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 2);
        control.simulate('keydown', { keyCode: ESC });
        control.get('value').should.equal('3');
    });

    it('should reset values on the control when you change focus', function() {
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#num-service-units');
        control.set('value', 2);
        control.simulate('blur');
        control.get('value').should.equal('3');
    });

    // Test for destroying services.
    it('should open a confirmation panel when clicking on "Destroy service"',
      function() {
        var view = new ServiceView(
          {container: container, model: service, db: db,
           env: env}).render();
        var control = container.one('#destroy-service');
        control.simulate('click');
        container.one('#destroy-modal-panel .btn-danger')
          .getHTML().should.equal('Destroy Service');
    });

    it('should hide the panel when the Cancel button is clicked', function() {
      var view = new ServiceView(
        {container: container, model: service, db: db,
         env: env}).render();
      var control = container.one('#destroy-service');
      control.simulate('click');
      var cancel = container.one('#destroy-modal-panel .btn:not(.btn-danger)');
      cancel.getHTML().should.equal('Cancel');
      cancel.simulate('click');
      view.panel.get('visible').should.equal(false);
      // We did not send a message to destroy the service.
      var _ = expect(conn.last_message()).to.not.exist;
    });

    it('should destroy the service when "Destroy Service" is clicked', function() {
      var view = new ServiceView(
        {container: container, model: service, db: db,
         env: env}).render();
      var control = container.one('#destroy-service');
      control.simulate('click');
      var destroy = container.one('#destroy-modal-panel .btn-danger');
      destroy.simulate('click');
      var message = conn.last_message();
      message.op.should.equal('destroy_service');
      destroy.get('disabled').should.equal(true);
    });

    it('should remove the service from the db after server ack', function() {
      var view = new ServiceView(
        {container: container, model: service, db: db,
         env: env}).render();
      db.relations.add(
        [new models.Relation({id: 'relation-0000000000',
                              endpoints: [['mysql', {}],['wordpress',{}]]}),
         new models.Relation({id: 'relation-0000000001',
                              endpoints: [['squid', {}],['apache',{}]]})]);
      var control = container.one('#destroy-service');
      control.simulate('click');
      var destroy = container.one('#destroy-modal-panel .btn-danger');
      destroy.simulate('click');
      var called = false;
      view.on('showEnvironment', function(ev) {
        called = true;
      });
      var callbacks = Y.Object.values(env._txn_callbacks);
      callbacks.length.should.equal(1);
      // Since we don't have an app to listen to this event and tell the
      // view to re-render, we need to do it ourselves.
      db.on('update', view.render, view);
      callbacks[0]({result: true});
      var _ = expect(db.services.getById(service.get('id'))).to.not.exist;
      db.relations.map(function(u) {return u.get('id');})
        .should.eql(['relation-0000000001']);
      // Catch show environment event.
      called.should.equal(true);
    });

  });
}) ();
