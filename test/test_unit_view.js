'use strict';

(function () {
  describe('juju unit view', function() {
    var UnitView, views, machine, models, Y, container, service, unit, db,
      conn, juju, env, charm, testUtils;

    before(function (done) {
      Y = YUI(GlobalConfig).use(
        'juju-views', 'juju-models', 'base', 'node', 'json-parse', 'juju-env',
        'node-event-simulate', 'juju-tests-utils',
        function (Y) {
          views = Y.namespace('juju.views');
          models = Y.namespace('juju.models');
          UnitView = views.unit;
          testUtils = Y.namespace('juju-tests.utils');
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
      charm = new models.Charm({
        id: 'cs:mysql',
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
      container.remove();
      container.destroy();
      service.destroy();
      machine.destroy();
      charm.destroy();
      db.destroy();
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

    it('should not display Retry and Resolved buttons when ' +
       'there is no error', function() {
      var view = new UnitView(
        {container: container, unit: unit, db: db}).render();
      var _ = expect(container.one('#retry-unit-button')).to.not.exist;
       _ = expect(container.one('#resolved-unit-button')).to.not.exist;
    });

    it('should display Retry and Resolved buttons when ' +
       'there is an error', function() {
      unit.set('agent_state', 'foo-error');
      var view = new UnitView(
        {container: container, unit: unit, db: db}).render();
      container.one('#retry-unit-button').getHTML().should.equal('Retry');
      container.one('#resolved-unit-button').getHTML().should.equal('Resolved');
      container.one('#remove-unit-button').getHTML().should.equal('Remove');

    });

    it('should always display Remove button', function() {
      var view = new UnitView(
        {container: container, unit: unit, db: db}).render();
      container.one('#remove-unit-button').getHTML().should.equal('Remove');
    });

    it('should send resolved op when confirmation button clicked',
       function() {
           unit.set('agent_state', 'foo-error');
           var view = new UnitView(
               {container: container, unit: unit, db: db}).render();
           container.one('#resolved-unit-button').simulate('click');
           container.one('#resolved-modal-panel .btn-danger')
               .simulate('click');
           var msg = conn.last_message();
           msg.op.should.equal('resolved');
    });
  });
}) ();
