'use strict';

(function () {
  describe('juju unit view', function() {
    var UnitView, views, machine, models, Y, container, service, unit, db,
      conn, juju, env, charm;
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
          console.log('serializing env msg', m);
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
          models = Y.namespace('juju.models');
          UnitView = views.unit;
          conn = new SocketStub();
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
      db = new models.Database();
      charm = new models.Charm({
        id: 'mysql',
        name: 'mysql',
        description: 'A DB'});
      db.charms.add([charm]);
      service = new models.Service({
        id: 'mysql',
        charm: 'cs:mysql',
        loaded: true,
        rels: {
          ident: 'relation-0',
          endpoint: 'relation-endpoint',
          name: 'relation-name',
          role: 'relation-role',
          scope: 'relation-scope'}});
      db.services.add([service]);
      unit = new models.ServiceUnit({
        id:'mysql/0',
        agent_state: 'pending',
        machine: 'machine-0'});
      db.units.add([unit]);
      machine = new models.Machine({
        id: 'machine-0',
        agent_state: 'pending',
        instance_id: 'instance-0',
        instance_state: 'running',
        public_address: '1.2.3.4'});
      db.machines.add([machine]);
      done();
    });

    afterEach(function (done) {
      container.destroy();
      service.destroy();
      machine.destroy();
      charm.destroy();
      db.destroy();
      conn.messages = [];
      done();
    });

    it('should include unit identifier', function () {
      var view = new UnitView(
        {container: container, unit: unit, db: db});
      view.render();
      container.one('#unit-id').getHTML().should.contain('mysql/0');
    });

    it('should include charm URI', function () {
      var view = new UnitView(
        {container: container, unit: unit, db: db});
      view.render();
      container.one('#charm-uri').getHTML().should.contain('cs:mysql');
    });

    it('should include unit status', function () {
      var view = new UnitView(
        {container: container, unit: unit, db: db});
      view.render();
      container.one('#unit-status').getHTML().should.contain('pending');
    });

    it('should include machine info', function () {
      var view = new UnitView(
        {container: container, unit: unit, db: db});
      view.render();
      container.one('#machine-name').getHTML().should.contain(
        'Machine machine-0');
      container.one('#machine-agent-state').getHTML().should.contain(
        'pending');
      container.one('#machine-instance-id').getHTML().should.contain(
        'instance-0');
      container.one('#machine-instance-state').getHTML().should.contain(
        'running');
      container.one('#machine-public-address').getHTML().should.contain(
        '1.2.3.4');
    });

    it('should include relation info', function () {
      var view = new UnitView(
        {container: container, unit: unit, db: db});
      view.render();
      container.one('#relations').getHTML().should.contain('Relations');
      container.one('.relation-ident').getHTML().should.contain('relation-0');
      container.one('.relation-endpoint').getHTML().should.contain(
        'relation-endpoint');
      container.one('.relation-role').getHTML().should.contain(
        'relation-role');
      container.one('.relation-scope').getHTML().should.contain(
        'relation-scope');
    });

  });
}) ();
