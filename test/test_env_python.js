/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

// from nodejs runner
// YUI = require('yui').YUI,
//   base= require('../lib/base.js');


(function() {

  var Y;

  describe('Python Juju environment', function() {
    var conn, endpointA, endpointB, env, juju, msg, testUtils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          ['base', 'node', 'json-parse', 'juju-env', 'juju-tests-utils'],
          function(Y) {
            testUtils = Y.namespace('juju-tests.utils');
            conn = new testUtils.SocketStub();
            juju = Y.namespace('juju');
            env = juju.newEnvironment({conn: conn}, 'python');
            env.connect();
            conn.open();
            done();
          });
    });

    after(function() {
      env.destroy();
    });

    afterEach(function() {
      sessionStorage.setItem('credentials', null);
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

    it('successfully deploys a service with constraints', function() {
      var constraints = { cpu: '1', mem: '512M', arch: 'i386'};
      env.deploy('precise/mysql', null, null, null, 1, constraints);
      msg = conn.last_message();
      // The python backend needs to format them differently than the go
      // backend to support rapi.
      assert.deepEqual(msg.constraints, ['cpu=1', 'mem=512M', 'arch=i386']);
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
        //console.log('invoked', result);
        result.op.should.equal('get_charm');
        result.result.id.should.equal('cs:precise/mysql');
        done();
      });

      msg = conn.last_message();
      //console.log('msg', msg);
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
      assert.isNull(msg.relation_name);
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
      assert.isNull(msg.relation_name);
      msg.retry.should.equal(true);
    });

    // it('can remove a unit', function() {
    //   PSA: tested via integration test in test_sandbox_python
    //   If 
    // });

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

    it('successfully gets service configuration', function() {
      var result, service_name;
      var expected = {
        'config': {'cfg_key': 'cfg_val'},
        'constraints': {'cstr_key': 'cstr_val'}
      };
      env.get_service('mysql', function(data) {
        service_name = data.service_name;
        result = data.result;
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        service_name: 'mysql',
        result: expected
      });
      assert.equal(service_name, 'mysql');
      assert.deepEqual(expected, result);
    });

    it('handles failed get service', function() {
      var service_name;
      var err;
      env.get_service('yoursql', function(data) {
        service_name = data.service_name;
        err = data.err;
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        service_name: 'yoursql',
        err: 'service "yoursql" not found'
      });
      assert.equal(service_name, 'yoursql');
      assert.equal(err, 'service "yoursql" not found');
    });

    it('must error if neither data nor config are passed', function() {
      assert.throws(
          function() {env.set_config('mysql', undefined, undefined);},
          'Exactly one of config and data must be provided');
    });

    it('must error if both data and config are passed', function() {
      assert.throws(
          function() {
            env.set_config('mysql', {'cfg-key': 'cfg-val'}, 'YAMLBEBAML');},
          'Exactly one of config and data must be provided');
    });

    it('can set a service config', function() {
      var config = {'cfg-key': 'cfg-val'};
      // This also tests that it only sends changed values.
      env.set_config('mysql', config, null, {});
      msg = conn.last_message();
      assert.equal(msg.op, 'set_config');
      assert.equal(msg.service_name, 'mysql');
      assert.deepEqual(msg.config, config);
    });

    it('can set a service config from a file', function() {
      /*jshint multistr:true */
      var data = 'tuning-level: \nexpert-mojo';
      /*jshint multistr:false */
      env.set_config('mysql', null, data, null);
      msg = conn.last_message();
      assert.equal(msg.op, 'set_config');
      assert.equal(msg.service_name, 'mysql');
      assert.equal(msg.data, data);
    });

    it('handles failed set config', function() {
      var err, service_name;
      env.set_config('yoursql', {}, null, {}, function(evt) {
        err = evt.err;
        service_name = evt.service_name;
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        service_name: 'yoursql',
        err: 'service "yoursql" not found'
      });
      assert.equal(err, 'service "yoursql" not found');
      assert.equal(service_name, 'yoursql');
    });

    it('can destroy a service', function() {
      env.destroy_service('mysql');
      msg = conn.last_message();
      assert.equal(msg.op, 'destroy_service');
      assert.equal(msg.service_name, 'mysql');
    });

    it('handles failed destroy service', function() {
      var err, service_name;
      env.destroy_service('yoursql', function(evt) {
        err = evt.err;
        service_name = evt.service_name;
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        service_name: 'yoursql',
        err: 'service "yoursql" not found'
      });
      assert.equal(err, 'service "yoursql" not found');
      assert.equal(service_name, 'yoursql');
    });

    it('successfully adds a relation', function(done) {
      var endpoints, result;
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, function(ev) {
        result = ev.result;
        assert.equal(result.id, 'relation-0');
        assert.equal(result['interface'], 'http');
        assert.equal(result.scope, 'global');
        endpoints = result.endpoints;
        assert.deepEqual(endpoints[0], {'mysql': {'name': 'database'}});
        assert.deepEqual(endpoints[1], {'wordpress': {'name': 'website'}});
        done();
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        op: 'add_relation',
        result: {
          id: 'relation-0',
          'interface': 'http',
          scope: 'global',
          endpoints: [
            {'mysql': {'name': 'database'}},
            {'wordpress': {'name': 'website'}}
          ]
        }
      });
    });

    it('handles failed relation adding', function(done) {
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, function(ev) {
        assert.equal(ev.err, 'cannot add relation');
        assert.equal(ev.endpoint_a, 'mysql:database');
        assert.equal(ev.endpoint_b, 'wordpress:website');
        done();
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        op: 'add_relation',
        err: 'cannot add relation',
        endpoint_a: 'mysql:database',
        endpoint_b: 'wordpress:website'
      });
    });

    it('successfully removes a relation', function(done) {
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, function(ev) {
        assert.equal(ev.result, true);
        done();
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        op: 'remove_relation',
        result: true
      });
    });

    it('handles failed relation removal', function(done) {
      endpointA = ['yoursql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, function(ev) {
        assert.equal(ev.err, 'service "yoursql" not found');
        assert.equal(ev.endpoint_a, 'yoursql:database');
        assert.equal(ev.endpoint_b, 'wordpress:website');
        done();
      });
      msg = conn.last_message();
      conn.msg({
        request_id: msg.request_id,
        op: 'remove_relation',
        err: 'service "yoursql" not found',
        endpoint_a: 'yoursql:database',
        endpoint_b: 'wordpress:website'
      });
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

    it('can update annotations', function() {
      var unit_name = 'mysql/0';
      env.update_annotations(unit_name, 'unit', {name: 'A'});
      msg = conn.last_message();
      msg.op.should.equal('update_annotations');
      msg.entity.should.equal(unit_name);
      msg.data.name.should.equal('A');
    });

    it('can get annotations', function() {
      var unit_name = 'mysql/0';
      env.get_annotations(unit_name, 'unit');
      msg = conn.last_message();
      msg.op.should.equal('get_annotations');
      msg.entity.should.equal(unit_name);
    });

    it('can remove annotations with specified keys', function() {
      var unit_name = 'mysql/0';
      var keys = ['key1', 'key2'];
      env.remove_annotations(unit_name, 'unit', keys);
      msg = conn.last_message();
      msg.op.should.equal('remove_annotations');
      msg.entity.should.equal(unit_name);
      msg.keys.should.eql(keys);
    });

    it('can remove annotations with no specified keys', function() {
      var unit_name = 'mysql/0';
      env.remove_annotations(unit_name, 'unit');
      msg = conn.last_message();
      msg.op.should.equal('remove_annotations');
      msg.entity.should.equal(unit_name);
      msg.keys.should.eql([]);
    });

    var assertOperationDenied = function(operationName, argsWithoutCallback) {
      // Define a callback tracking error state.
      var errorRaised = false;
      var callback = function(evt) {
        errorRaised = evt.err;
      };
      // Subscribe an event handler called when *permissionDenied* is fired.
      var permissionDeniedFired = false;
      env.on('permissionDenied', function() {
        permissionDeniedFired = true;
      });
      // Mock *console.warn* so that it is possible to collect warnings.
      var original = console.warn;
      var warning = null;
      console.warn = function() {
        warning = arguments;
      };
      // Reset websocket messages.
      conn.messages = [];
      var args = argsWithoutCallback.slice(0);
      args.push(callback);
      env.set('readOnly', true);
      env[operationName].apply(env, args);
      // Ensure no messages are sent to the server.
      assert.equal(0, conn.messages.length);
      // A warning is always created.
      assert.include(warning[0], 'Permission denied');
      assert.equal(operationName, warning[1].op);
      // The callback received an error.
      assert.isTrue(errorRaised);
      // A *permissionDenied* was fired by the environment, or it was silenced.
      var silent = Y.Array.some(env.get('_silentFailureOps'), function(v) {
        return v === warning[1].op;
      });
      assert.isTrue(permissionDeniedFired || silent);
      // Restore the original *console.warn*.
      console.warn = original;
    };

    it('denies adding a relation if the GUI is read-only', function() {
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      assertOperationDenied('add_relation', [endpointA, endpointB]);
    });

    it('denies adding a unit if the GUI is read-only', function() {
      assertOperationDenied('add_unit', ['haproxy', 3]);
    });

    it('denies destroying a service if the GUI is read-only', function() {
      assertOperationDenied('destroy_service', ['haproxy']);
    });

    it('denies deploying a charm if the GUI is read-only', function() {
      assertOperationDenied(
          'deploy', ['cs:precise/haproxy', 'haproxy', {}, null, 3, null]);
    });

    it('denies exposing a service if the GUI is read-only', function() {
      assertOperationDenied('expose', ['haproxy']);
    });

    it('denies removing annotations if the GUI is read-only', function() {
      assertOperationDenied('remove_annotations', ['example', 'type', {}]);
    });

    it('denies removing a relation if the GUI is read-only', function() {
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      assertOperationDenied('remove_relation', [endpointA, endpointB]);
    });

    it('denies removing units if the GUI is read-only', function() {
      assertOperationDenied('remove_units', [['haproxy/1', 'haproxy/2']]);
    });

    it('denies marking units as resolved if the GUI is read-only', function() {
      assertOperationDenied('resolved', ['unit1', null, true]);
    });

    it('denies changes to config options if the GUI is read-only', function() {
      assertOperationDenied('set_config', ['haproxy', {}, null, {}]);
    });

    it('denies changing constraints if the GUI is read-only', function() {
      assertOperationDenied('set_constraints', ['haproxy', {}]);
    });

    it('denies un-exposing a service if the GUI is read-only', function() {
      assertOperationDenied('unexpose', ['haproxy']);
    });

    it('denies updating annotations if the GUI is read-only', function() {
      assertOperationDenied('update_annotations', ['example', 'type', {}]);
    });

    var assertOperationAllowed = function(operationName, args) {
      env.set('readOnly', true);
      env[operationName].apply(env, args);
      // Ensure the message is correctly sent to the server.
      assert.equal(operationName, conn.last_message().op);
    };

    it('allows retrieving annotations if the GUI is read-only', function() {
      assertOperationAllowed('get_annotations', ['example', 'type']);
    });

    it('allows getting charms if the GUI is read-only', function() {
      assertOperationAllowed('get_charm', ['cs:precise/haproxy']);
    });

    it('allows getting services if the GUI is read-only', function() {
      assertOperationAllowed('get_service', ['haproxy']);
    });

    it('allows logging in if the GUI is read-only', function() {
      env.setCredentials({user: 'user', password: 'password'});
      assertOperationAllowed('login', []);
    });

    it('denies logging in without providing credentials', function() {
      env.setAttrs({user: undefined, password: undefined});
      // Mock *console.warn* so that it is possible to collect warnings.
      var original = console.warn;
      var warning = false;
      console.warn = function() {
        warning = true;
      };
      // Reset websocket messages.
      conn.messages = [];
      env.login();
      // Ensure no messages are sent to the server.
      assert.equal(0, conn.messages.length);
      // A warning is emitted.
      assert.isTrue(warning);
      // Restore the original *console.warn*.
      console.warn = original;
    });

  });
})();
