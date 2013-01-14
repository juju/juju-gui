'use strict';

// from nodejs runner
// YUI = require('yui').YUI,
//   base= require('../lib/base.js');


(function() {

  var Y;

  describe('Juju environment', function() {
    var juju, conn, env, msg, noop, testUtils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          ['base', 'node', 'json-parse', 'juju-env', 'juju-tests-utils'],
          function(Y) {
            testUtils = Y.namespace('juju-tests.utils');
            conn = new testUtils.SocketStub();
            juju = Y.namespace('juju');
            env = new juju.Environment({conn: conn});
            env.connect();
            conn.open();
            noop = function() {};
            done();
          });
    });

    after(function(done)  {
      env.destroy();
      done();
    });

    it('can deploy a service', function() {
      env.deploy('precise/mysql');
      msg = conn.last_message();
      msg.op.should.equal('deploy');
      msg.charm_url.should.equal('precise/mysql');
    });

    it('can deploy a service with a config file', function() {
      /*jshint multistr:true */
      var config_raw = 'tuning-level: \nexpert-mojo';
      /*jshint multistr:false */
      env.deploy('precise/mysql', null, null, config_raw);
      msg = conn.last_message();
      msg.op.should.equal('deploy');
      msg.charm_url.should.equal('precise/mysql');
      msg.config_raw.should.equal(config_raw);
    });

    it('can add a unit', function() {
      env.add_unit('mysql', 3);
      msg = conn.last_message();
      msg.op.should.equal('add_unit');
      msg.service_name.should.equal('mysql');
      msg.num_units.should.equal(3);
    });

    it('can accept a callback on its methods', function(done) {
      env.get_charm('cs:precise/mysql', function(result) {
        console.log('invoked', result);
        result.op.should.equal('get_charm');
        result.result.id.should.equal('cs:precise/mysql');
        done();
      });

      msg = conn.last_message();
      console.log('msg', msg);
      conn.msg({
        'op': 'get_charm',
        'request_id': msg.request_id,
        'result': {'id': 'cs:precise/mysql'}});
    });

    it('can resolve a problem with a unit', function() {
      var unit_name = 'mysql/0';
      env.resolved(unit_name);
      msg = conn.last_message();
      msg.op.should.equal('resolved');
      msg.unit_name.should.equal(unit_name);
      var _ = expect(msg.relation_name).to.not.exist;
      msg.retry.should.equal(false);
    });

    it('can resolve a problem with a unit relation', function() {
      var unit_name = 'mysql/0';
      var rel_name = 'relation-0000000000';
      env.resolved(unit_name, rel_name);
      msg = conn.last_message();
      msg.op.should.equal('resolved');
      msg.unit_name.should.equal(unit_name);
      msg.relation_name.should.equal(rel_name);
      msg.retry.should.equal(false);
    });

    it('can retry a problem with a unit', function() {
      var unit_name = 'mysql/0';
      env.resolved(unit_name, null, true);
      msg = conn.last_message();
      msg.op.should.equal('resolved');
      msg.unit_name.should.equal(unit_name);
      var _ = expect(msg.relation_name).to.not.exist;
      msg.retry.should.equal(true);
    });

    it('can retry a problem with a unit using a callback', function(done) {
      var unit_name = 'mysql/0';
      env.resolved(unit_name, null, true, function(result) {
        result.op.should.equal('resolved');
        result.result.should.equal(true);
        done();
      });
      msg = conn.last_message();
      conn.msg({
        op: 'resolved',
        result: true,
        request_id: msg.request_id});
    });

    it('will populate the provider type and default series', function() {
      var providerType = 'super provider',
          defaultSeries = 'oneiric',
          evt =
              { data:
                '{"ready": true, ' +
                ' "version": 0,' +
                ' "provider_type": "' + providerType + '",' +
                ' "default_series": "' + defaultSeries + '"}'};

      // Before the message arrives these are not set.
      assert.equal(env.get('providerType', undefined));
      assert.equal(env.get('defaultSeries', undefined));
      env.on_message(evt);
      // After the message arrives the provider type is set.
      assert.equal(env.get('providerType'), providerType);
      assert.equal(env.get('defaultSeries'), defaultSeries);
    });

    it('can get endpoints for a service', function() {
      env.get_endpoints(['mysql']);
      msg = conn.last_message();
      msg.op.should.equal('get_endpoints');
      msg.service_names.should.eql(['mysql']);
    });

    it('can update annotations', function() {
      var unit_name = 'mysql/0';
      env.update_annotations(unit_name, {name: 'A'});
      msg = conn.last_message();
      msg.op.should.equal('update_annotations');
      msg.entity.should.equal(unit_name);
      msg.data.name.should.equal('A');
    });

    it('can get annotations', function() {
      var unit_name = 'mysql/0';
      env.get_annotations(unit_name);
      msg = conn.last_message();
      msg.op.should.equal('get_annotations');
      msg.entity.should.equal(unit_name);
    });

    it('can remove annotations with specified keys', function() {
      var unit_name = 'mysql/0';
      var keys = ['key1', 'key2'];
      env.remove_annotations(unit_name, keys);
      msg = conn.last_message();
      msg.op.should.equal('remove_annotations');
      msg.entity.should.equal(unit_name);
      msg.keys.should.eql(keys);
    });

    it('can remove annotations with no specified keys', function() {
      var unit_name = 'mysql/0';
      env.remove_annotations(unit_name);
      msg = conn.last_message();
      msg.op.should.equal('remove_annotations');
      msg.entity.should.equal(unit_name);
      msg.keys.should.eql([]);
    });

    it('denies write operations if the GUI is in read only mode', function() {
      var writeOperations = {
        add_relation: ['haproxy', 'django', noop],
        add_unit: ['haproxy', 3, noop],
        destroy_service: ['haproxy', noop],
        deploy: ['cs:precise/haproxy', 'haproxy', {}, null, 3, noop],
        expose: ['haproxy', noop],
        remove_relation: ['haproxy', 'django', noop],
        remove_units: [['unit1', 'unit2'], noop],
        resolved: ['unit1', null, true, noop],
        set_config: ['haproxy', {}, null, noop],
        set_constraints: ['haproxy', {}, noop],
        unexpose: ['haproxy', noop]
      };
      env.set('readOnly', true);
      // Mock *console.warn* so that it is possible to collect warnings.
      var original = console.warn;
      var warning = null;
      console.warn = function() {
        warning = arguments;
      };
      // Reset websocket messages.
      conn.messages = [];
      Y.each(writeOperations, function(args, operation) {
        env[operation].apply(env, args);
        assert.equal(0, conn.messages.length, 'Operation ' + operation);
        assert.include(warning[0], 'Permission denied');
        assert.equal(operation, warning[1].op);
      });
      // Restore the original *console.warn*.
      console.warn = original;
    });

    it('allows read operations if the GUI is in read only mode', function() {
      var readOperations = {
        get_annotations: ['example', noop],
        get_charm: ['cs:precise/haproxy', noop],
        get_endpoints: [['haproxy'], noop],
        get_service: ['haproxy', noop],
        login: [],
        remove_annotations: ['example', {}, noop],
        status: [],
        update_annotations: ['example', {}, noop]
      };
      env.set('readOnly', true);
      Y.each(readOperations, function(args, operation) {
        env[operation].apply(env, args);
        var lastOperation = conn.last_message().op;
        assert.equal(operation, lastOperation, 'Operation ' + operation);
      });
    });

  });
})();
