'use strict';

(function () {
  describe('juju service config view', function () {
    var ServiceConfigView, models, Y, container, service, db, conn,
      env, charm, ENTER;

    before(function (done) {
      Y = YUI(GlobalConfig).use(
        'juju-views', 'juju-models', 'base', 'node', 'json-parse',
        'juju-env', 'node-event-simulate', 'juju-tests-utils', 'event-key',
        function (Y) {
          ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
          models = Y.namespace('juju.models');
          ServiceConfigView = Y.namespace('juju.views').service_config;
          conn = new (Y.namespace('juju-tests.utils')).SocketStub();
          env = new (Y.namespace('juju')).Environment({conn:conn});
          env.connect();
          conn.open();
          done();
        });
    });

    after(function (done) {
      env.destroy();
      done();
    });

    beforeEach(function (done) {
      container = Y.Node.create('<div id="test-container" />');
      Y.one('#main').append(container);
      db = new models.Database();
      charm = new models.Charm({
        id:'mysql',
        name:'mysql',
        description:'A DB',
        config: {
          option0: {
            description: 'The first option.',
            type: 'string'},
          option1: {
            description: 'The second option.',
            type: 'boolean'}
            }});

      db.charms.add([charm]);
//      // Add units sorted by id as that is what we expect from the server.
//      db.units.add([
//        new models.ServiceUnit({id:'mysql/0', agent_state:'pending'}),
//        new models.ServiceUnit({id:'mysql/1', agent_state:'pending'}),
//        new models.ServiceUnit({id:'mysql/2', agent_state:'pending'})
//      ]);
      service = new models.Service({
        id: 'mysql',
        charm: 'mysql',
        unit_count: db.units.size(),
        loaded: true,
        config: {option0: 'value0', option1: 'value1'}});
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

    it('should display the configuration', function () {
      var view = new ServiceConfigView({
        container: container,
        service: service,
        db: db,
        env: env});
      view.render();

      var config = service.get('config');
      for (var name in config) {
        var value = config[name];
        container.one('#service-config').getHTML().should.contain(name);
        container.one('#service-config').getHTML().should.contain(value);
      }
    });

    it('should let the user change a configuration value', function () {
      var view = new ServiceConfigView({
        container: container,
        service: service,
        db: db,
        env: env}).render();

      container.one('#input-option0').set('value', 'new value');
      // In tests the events are not wired up right so we will call this
      // event handler manually.
      view.saveConfig();
      var message = conn.last_message();
      message.op.should.equal('set_config');
      message.service_name.should.equal('mysql');
      message.config.option0.should.equal('new value');
      message.config.option1.should.equal('value1');
    });

    it('should update the model when the callback is called', function () {
      var view = new ServiceConfigView({
        container: container,
        service: service,
        db: db,
        env: env}).render();

      console.log(service);
      console.log(service.getAttrs());
      service.get('config').option0.should.equal('value0');
      container.one('#input-option0').set('value', 'new value');
      service.get('config').option0.should.equal('value0');
      view._saveConfigCallback();
      service.get('config').option0.should.equal('new value');
    });

    it('should disable the "Update" button while the RPC is outstanding',
        function () {
      var view = new ServiceConfigView({
        container: container,
        service: service,
        db: db,
        env: env}).render();

      // Clicking on the "Update" button disables it until the RPC callback
      // returns, then it is re-enabled.
      var save_button = container.one('#save-service-config');
      save_button.get('disabled').should.equal(false);
      view.saveConfig();
      save_button.get('disabled').should.equal(true);
      view._saveConfigCallback();
      save_button.get('disabled').should.equal(false);
    });

    it('should display errors to the user', function () {
      var view = new ServiceConfigView({
        container: container,
        service: service,
        db: db,
        env: env}).render();

      var error_message = 'Something bad happened.',
        ev = {err: true, message: error_message},
        alert_ = container.one('#message-area>.alert');

      // Before an erronious event is processed, no alert exists.
      expect(alert_).to.not.exist;
      // Handle the error event.
      view._saveConfigCallback(ev);
      // The event handler should have created an alert box.
      alert_ = container.one('#message-area>.alert');
      alert_.getHTML().should.contain(error_message);
    });

    it('should display an error when addErrorMessage is called', function () {
      var view = new ServiceConfigView({
        container: container,
        service: service,
        db: db,
        env: env}).render();

      var error_message = 'Something bad happened.',
        alert_ = container.one('#message-area>.alert');

      // Before an erronious event is processed, no alert exists.
      expect(alert_).to.not.exist;
      // Display the error message.
      view._addErrorMessage(container, error_message);
      // The method should have created an alert box.
      alert_ = container.one('#message-area>.alert');
      alert_.getHTML().should.contain(error_message);
    });


  });
})();
