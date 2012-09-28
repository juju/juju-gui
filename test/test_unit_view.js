'use strict';

(function() {
  describe('juju unit view', function() {
    var UnitView, views, machine, models, Y, container, service, unit, db,
        conn, juju, env, charm, testUtils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-views', 'juju-models', 'base', 'node', 'json-parse',
          'juju-env', 'node-event-simulate', 'juju-tests-utils',
          function(Y) {
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

    beforeEach(function(done) {
      container = Y.Node.create('<div id=\"test-container\"/>');
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
        unit_count: 1,
        loaded: true});
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'server', name: 'db'}],
          ['mediawiki', {role: 'client', name: 'db'}]],
        'id': 'relation-0000000002'
      });
      db.services.add([service]);
      unit = {
        id: 'mysql/0',
        agent_state: 'pending',
        machine: 'machine-0'};
      db.units.add([unit]);
      machine = {
        id: 'machine-0',
        agent_state: 'pending',
        instance_id: 'instance-0',
        instance_state: 'running',
        public_address: '1.2.3.4'};
      db.machines.add([machine]);
      done();
    });

    afterEach(function(done) {
      container.remove();
      container.destroy();
      service.destroy();
      charm.destroy();
      db.destroy();
      done();
    });

    it('should include unit identifier', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('#unit-id').getHTML().should.contain('mysql/0');
    });

    it('should include charm URI', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('#charm-uri').getHTML().should.contain('cs:mysql');
    });

    it('should include unit status', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('#unit-status').getHTML().should.contain('pending');
    });

    it('should include machine info', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
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

    it('should include relation info', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('#relations').getHTML().should.contain('Relations');
      container.one('.relation-ident').get('text').trim().should.equal('db:2');
      container.one('.relation-endpoint').get('text').trim().should.equal(
          'mediawiki');
      container.one('.relation-role').get('text').trim().should.equal(
          'server');
      container.one('.relation-scope').get('text').trim().should.equal(
          'global');
      container.one('.relation-status').get('text').trim().should.equal('');
    });

    it('should not display Retry and Resolved buttons when ' +
       'there is no error', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      var _ = expect(container.one('#retry-unit-button')).to.not.exist;
      _ = expect(container.one('#resolved-unit-button')).to.not.exist;
    });

    it('should display Retry and Resolved buttons when ' +
       'there is an error', function() {
          unit.agent_state = 'foo-error';
          var view = new UnitView(
              { container: container, unit: unit, db: db, env: env,
                querystring: {}}).render();
          container.one('#retry-unit-button').getHTML().should.equal('Retry');
          container.one('#resolved-unit-button').getHTML().should.equal(
          'Resolved');
          container.one('#remove-unit-button').getHTML().should.equal('Remove');
       });

    it('should always display Remove button', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render(),
          button = container.one('#remove-unit-button');
      button.getHTML().should.equal('Remove');
      // Control is disabled with only one unit for the given service.
      button.get('disabled').should.equal(true);
    });

    it('should send resolved op when confirmation button clicked',
       function() {
          unit.agent_state = 'foo-error';
          var view = new UnitView(
              { container: container, unit: unit, db: db, env: env,
                querystring: {}}).render();
          container.one('#resolved-unit-button').simulate('click');
          container.one('#resolved-modal-panel .btn-danger').simulate('click');
          var msg = conn.last_message();
          msg.op.should.equal('resolved');
          msg.retry.should.equal(false);
       });

    it('should send resolved op with retry when retry clicked', function() {
      unit.agent_state = 'foo-error';
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('#retry-unit-button').simulate('click');
      var msg = conn.last_message();
      msg.op.should.equal('resolved');
      msg.retry.should.equal(true);
    });

    it('should send remove_units op when confirmation clicked', function() {
      // Enable removal button by giving the service more than one unit.
      service.set('unit_count', 2);
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('#remove-unit-button').simulate('click');
      container.one('#remove-modal-panel .btn-danger').simulate('click');
      var msg = conn.last_message();
      msg.op.should.equal('remove_units');
    });

    it('should clear out the database after a unit is removed', function() {
      // Enable removal button by giving the service more than one unit.
      service.set('unit_count', 2);
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('#remove-unit-button').simulate('click');
      container.one('#remove-modal-panel .btn-danger')
         .simulate('click');
      var called_event = null;
      view.on('showService', function(ev) {
        called_event = ev;
      });
      var msg = conn.last_message();
      msg.result = true;
      env.dispatch_result(msg);
      var _ = expect(db.units.getById(unit.id)).to.not.exist;
      called_event.service.should.equal(service);
    });

    it('should show unit errors on the page with action buttons', function() {
      unit.relation_errors = {'db': ['mediawiki']};
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('.relation-status').get('text').trim().should.contain(
        'error');
      container.one('.relation-status').all('button').get('text')
        .should.eql(['Resolved', 'Retry']);
    });

    it('should show highlighted relation rows', function() {
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {rel_id: 'relation-0000000002'}}).render();
      container.one('#relations tbody tr').hasClass('highlighted').should.equal(true);
    });

    it('should be able to send a resolve relation message', function() {
      unit.relation_errors = {'db': ['mediawiki']};
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('.resolved-relation-button').simulate('click');
      container.one('#resolved-relation-modal-panel .btn-danger')
         .simulate('click');
      var msg = conn.last_message();
      msg.op.should.equal('resolved');
      msg.unit_name.should.equal('mysql/0');
      msg.relation_name.should.equal('db');
      msg.retry.should.equal(false);
    });

    it('should be able to send a retry relation message', function() {
      unit.relation_errors = {'db': ['mediawiki']};
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {}}).render();
      container.one('.retry-relation-button').simulate('click');
      var msg = conn.last_message();
      msg.op.should.equal('resolved');
      msg.unit_name.should.equal('mysql/0');
      msg.relation_name.should.equal('db');
      msg.retry.should.equal(true);
    });

    it('should create an error notification if a resolve fails', function() {
      unit.relation_errors = {'db': ['mediawiki']};
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {},
            app: {getModelURL: function(u) { return u.id; }}})
        .render();
      container.one('.resolved-relation-button').simulate('click');
      container.one('#resolved-relation-modal-panel .btn-danger')
         .simulate('click');
      var msg = conn.last_message();
      msg.err = true;
      db.notifications.size().should.equal(0);
      env.dispatch_result(msg);
      db.notifications.size().should.equal(1);
      var notification = db.notifications.toArray()[0];
      notification.get('modelId').should.eql(
        ['relation', 'relation-0000000002']);
    });

    it('should create an error notification if a retry fails', function() {
      unit.relation_errors = {'db': ['mediawiki']};
      var view = new UnitView(
          { container: container, unit: unit, db: db, env: env,
            querystring: {},
            app: {getModelURL: function(u) { return u.id; }}})
        .render();
      container.one('.retry-relation-button').simulate('click');
      var msg = conn.last_message();
      msg.err = true;
      db.notifications.size().should.equal(0);
      env.dispatch_result(msg);
      db.notifications.size().should.equal(1);
      var notification = db.notifications.toArray()[0];
      notification.get('modelId').should.eql(
        ['relation', 'relation-0000000002']);
    });

  });
}) ();
