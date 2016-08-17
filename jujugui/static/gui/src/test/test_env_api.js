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

(function() {

  describe('Juju API utilities', function() {
    var environments;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-env-api'], function(Y) {
        environments = Y.namespace('juju.environments');
        done();
      });
    });

    it('provides a way to retrieve a name from an endpoint', function() {
      // Test both an endpoint with a name and one without, as may occur in
      // hand-crafted bundles.
      var endpointA = [
        'foo',
        { name: 'bar' }
      ];
      var endpointB = [
        'bar',
        {}
      ];
      assert.equal('foo:bar', environments.endpointToName(endpointA));
      assert.equal('bar', environments.endpointToName(endpointB));
    });

    it('provides a way to retrieve a relation key from endpoints', function() {
      var endpoints = {
        wordpress: {name: 'website', role: 'provider'},
        haproxy: {name: 'reverseproxy', role: 'requirer'}
      };
      var key = environments.createRelationKey(endpoints);
      assert.deepEqual(key, 'haproxy:reverseproxy wordpress:website');
    });

    it('provides a way to lowercase the keys of an object', function() {
      var obj = {Key1: 'value1', key2: 'value2', MyThirdKey: 'value3'},
          expected = {key1: 'value1', key2: 'value2', mythirdkey: 'value3'},
          result = environments.lowerObjectKeys(obj);
      assert.deepEqual(expected, result);
    });

    it('provides a way to convert object values to strings', function() {
      var obj = {key1: 42, key2: false, key3: null, key4: 'foo'},
          expected = {key1: '42', key2: 'false', key3: null, key4: 'foo'},
          result = environments.stringifyObjectValues(obj);
      assert.deepEqual(expected, result);
    });

    describe('parsePlacement', function() {

      it('returns null if there is nothing to parse', function() {
        var placement = environments.parsePlacement('');
        assert.strictEqual(placement, null);
      });

      it('correctly returns the scope and the directive', function() {
        var placement = environments.parsePlacement('lxc:2');
        assert.deepEqual(placement, {scope: 'lxc', directive: '2'});
      });

      it('returns a new container placement', function() {
        var placement = environments.parsePlacement('kvm');
        assert.deepEqual(placement, {scope: 'kvm', directive: ''});
      });

      it('returns a machine placement', function() {
        var placement = environments.parsePlacement('42');
        assert.deepEqual(placement, {scope: '#', directive: '42'});
      });

    });

  });

  describe('Juju API', function() {
    var cleanups, conn, endpointA, endpointB, ecs, env, juju, machineJobs, msg,
        utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'environment-change-set',
        'juju-tests-utils'
      ], function(Y) {
        juju = Y.namespace('juju');
        utils = Y.namespace('juju-tests.utils');
        machineJobs = Y.namespace('juju.environments').machineJobs;
        done();
      });
    });

    beforeEach(function() {
      conn = new utils.SocketStub();
      ecs = new juju.EnvironmentChangeSet();
      env = new juju.environments.GoEnvironment({
        conn: conn, user: 'user', password: 'password', ecs: ecs
      });
      env.connect();
      env.set('facades', {
        AllWatcher: [0],
        Annotations: [2],
        Application: [7],
        Charms: [3],
        Client: [1],
        CrossModelRelations: [1],
        GUIToken: [46, 47],
        ModelConfig: [41, 42],
        ModelManager: [2],
        Pinger: [42]
      });
      env.set('modelUUID', 'this-is-a-uuid');
      this._cleanups.push(env.close.bind(env));
      cleanups = [];
    });

    afterEach(function()  {
      cleanups.forEach(function(action) {action();});
      // We need to clear any credentials stored in sessionStorage.
      env.setCredentials(null);
      if (env && env.destroy) {env.destroy();}
      if (conn && conn.destroy) {conn.destroy();}
    });

    var noopHandleLogin = function() {
      var oldHandleLogin = Y.juju.environments.GoEnvironment.handleLogin;
      Y.juju.environments.GoEnvironment.handleLogin = function() {};
      cleanups.push(function() {
        Y.juju.environments.GoEnvironment.handleLogin = oldHandleLogin;
      });
    };

    describe('findFacadeVersion', function() {

      beforeEach(function() {
        env.set('facades', {'Test': [0, 1]});
      });

      afterEach(function() {});

      it('returns the version if the version is supported', function() {
        assert.strictEqual(env.findFacadeVersion('Test', 0), 0);
        assert.strictEqual(env.findFacadeVersion('Test', 1), 1);
      });

      it('returns the last version if the facade is supported', function() {
        assert.strictEqual(env.findFacadeVersion('Test'), 1);
      });

      it('returns null if a specific version is not supported', function() {
        assert.strictEqual(env.findFacadeVersion('Test', 2), null);
      });

      it('returns null if a default version is not supported', function() {
        assert.strictEqual(env.findFacadeVersion('ChangeSet', 1), null);
      });

      it('returns null if a facade is not supported', function() {
        assert.strictEqual(env.findFacadeVersion('BadWolf'), null);
      });

      it('returns null if a facade version is not supported', function() {
        assert.strictEqual(env.findFacadeVersion('BadWolf', 42), null);
      });

    });

    describe('prepareConstraints', function() {

      it('converts a constraints string to an object', function() {
        var constraints = env.prepareConstraints('tags=foo,bar cpu-cores=4');
        assert.deepEqual(constraints, {
          'cpu-cores': 4,
          'tags': ['foo', 'bar']
        });
      });

      it('converts integer constraints', function() {
        var constraints = env.prepareConstraints(
            {'root-disk': '800', 'cpu-cores': '4', mem: '2000'});
        assert.deepEqual(
            constraints, {'root-disk': 800, 'cpu-cores': 4, mem: 2000});
      });

      it('removes integer constraints with invalid values', function() {
        var constraints = env.prepareConstraints(
            {'cpu-power': 'four kquad', 'cpu-cores': 'tons', mem: 2000});
        assert.deepEqual(constraints, {mem: 2000});
      });

      it('does not remove zero values', function() {
        var constraints = env.prepareConstraints({'root-disk': '0', mem: 0});
        assert.deepEqual(constraints, {'root-disk': 0, mem: 0});
      });

      it('removes empty/undefined/null values', function() {
        var constraints = env.prepareConstraints({
          arch: undefined,
          tags: '',
          mem: ' ',
          'cpu-cores': 4,
          'cpu-power': null
        });
        assert.deepEqual(constraints, {'cpu-cores': 4});
      });

      it('removes unexpected constraints', function() {
        var constraints = env.prepareConstraints(
            {arch: 'i386', invalid: 'not-a-constraint'});
        assert.deepEqual(constraints, {arch: 'i386'});
      });

      it('turns tags into an array', function() {
        var constraints = env.prepareConstraints({tags: 'tag1,tag2,tag3'});
        assert.deepEqual(constraints, {tags: ['tag1', 'tag2', 'tag3']});
      });

      it('removes empty tags', function() {
        var constraints = env.prepareConstraints({tags: 'tag1,,tag3'});
        assert.deepEqual(constraints, {tags: ['tag1', 'tag3']});
      });

      it('handles invalid tags', function() {
        var constraints = env.prepareConstraints({tags: 'tag1,   ,tag2 ,'});
        assert.deepEqual(constraints, {tags: ['tag1', 'tag2']});
      });

      it('returns empty tags if no tags are really passed', function() {
        var constraints = env.prepareConstraints({tags: ' ,    ,   ,,,'});
        assert.deepEqual(constraints, {tags: []});
      });

      it('converts tags with spaces', function() {
        var constraints = env.prepareConstraints(
            {tags: 'first tag, second   tag'});
        assert.deepEqual(constraints, {tags: ['first-tag', 'second-tag']});
      });

      it('does not modify the input constraints in place', function() {
        var input = {'cpu-power': '800', 'cpu-cores': '4', mem: '2000'};
        var backup = Y.clone(input);
        env.prepareConstraints(input);
        assert.deepEqual(input, backup);
      });

    });

    describe('login', function() {

      it('sends the correct login message', function() {
        noopHandleLogin();
        env.login();
        var lastMessage = conn.last_message();
        var expected = {
          type: 'Admin',
          request: 'Login',
          'request-id': 1,
          params: {'auth-tag': 'user-user', credentials: 'password'},
          version: 3
        };
        assert.deepEqual(expected, lastMessage);
      });

      it('resets the user and password if they are not valid', function() {
        env.login();
        // Assume login to be the first request.
        conn.msg({'request-id': 1, error: 'Invalid user or password'});
        assert.deepEqual(
          env.getCredentials(), {user: '', password: '', macaroons: null});
        assert.isTrue(env.failedAuthentication);
      });

      it('fires a login event on successful login', function() {
        var loginFired = false;
        var result;
        env.on('login', function(evt) {
          loginFired = true;
          result = evt.data.result;
        });
        env.login();
        // Assume login to be the first request.
        conn.msg({
          'request-id': 1,
          response: {
            'user-info': {},
            facades: [{name: 'ModelManager', versions: [2]}]
          }
        });
        assert.isTrue(loginFired);
        assert.isTrue(result);
      });

      it('resets failed markers on successful login', function() {
        env.failedAuthentication = true;
        env.login();
        // Assume login to be the first request.
        conn.msg({
          'request-id': 1,
          response: {
            'user-info': {},
            facades: [{name: 'ModelManager', versions: [2]}]
          }
        });
        assert.isFalse(env.failedAuthentication);
      });

      it('fires a login event on failed login', function() {
        var loginFired = false;
        var result;
        env.on('login', function(evt) {
          loginFired = true;
          result = evt.data.result;
        });
        env.login();
        // Assume login to be the first request.
        conn.msg({'request-id': 1, error: 'Invalid user or password'});
        assert.isTrue(loginFired);
        assert.isFalse(result);
      });

      it('avoids sending login requests without credentials', function() {
        env.setCredentials(null);
        env.login();
        assert.equal(0, conn.messages.length);
      });

      it('calls currentModelInfo and watchAll after login', function() {
        env.login();
        // Assume login to be the first request.
        conn.msg({'request-id': 1, response: {
          facades: [
            {name: 'Client', versions: [0]},
            {name: 'ModelManager', versions: [2]}
          ],
          'user-info': {},
          'model-tag': 'model-my-model'
        }});
        var currentModelInfoMessage = conn.last_message(2);
        // ModelInfo is the second request.
        var currentModelInfoExpected = {
          type: 'ModelManager',
          request: 'ModelInfo',
          // Note that facade version here is 0 because the login mock response
          // below is empty.
          version: 2,
          'request-id': 2,
          params: {entities: [{tag: 'model-my-model'}]}
        };
        console.log(currentModelInfoMessage);
        assert.deepEqual(currentModelInfoMessage, currentModelInfoExpected);
        var watchAllMessage = conn.last_message();
        // ModelInfo is the second request.
        var watchAllExpected = {
          type: 'Client',
          request: 'WatchAll',
          // Note that facade version here is 0 because the login mock response
          // below is empty.
          version: 0,
          'request-id': 3,
          params: {}
        };
        assert.deepEqual(watchAllMessage, watchAllExpected);
      });

      it('stores user information', function() {
        env.login();
        // Assume login to be the first request.
        conn.msg({'request-id': 1, response: {
          facades: [
            {name: 'Client', versions: [0]},
            {name: 'ModelManager', versions: [2]}
          ],
          'user-info': {'read-only': true}
        }});
        assert.strictEqual(env.get('readOnly'), true);
      });

    });

    describe('login with macaroons', function() {
      var error;

      // Create a callback to use when handling responses.
      var callback = function(err) {
        error = err;
      };

      // Create a fake bakery object with the given discharge fuction.
      var makeBakery = function(dischargeFunc) {
        return {discharge: dischargeFunc};
      };

      // Check that the given message sent to the WebSocket is what we expect.
      // Return the request id.
      var assertRequest = function(msg, macaroons) {
        assert.strictEqual(msg.type, 'Admin');
        assert.strictEqual(msg.request, 'Login');
        assert.strictEqual(msg.version, 3);
        if (macaroons) {
          assert.deepEqual(msg.params, {macaroons: [macaroons]});
        } else {
          assert.deepEqual(msg.params, {});
        }
        return msg['request-id'];
      };

      beforeEach(function() {
        error = '';
      });

      it('does not proceed if a login is pending', function() {
        env.pendingLoginResponse = true;
        env.loginWithMacaroon();
        assert.strictEqual(conn.messages.length, 0, 'unexpected messages');
      });

      it('sends an initial login request without macaroons', function() {
        env.loginWithMacaroon(makeBakery());
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        assertRequest(conn.last_message());
      });

      it('sends an initial login request with macaroons', function() {
        env.setCredentials({macaroons: ['macaroon']});
        env.loginWithMacaroon(makeBakery());
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        assertRequest(conn.last_message(), ['macaroon']);
      });

      it('handles initial response errors', function() {
        env.loginWithMacaroon(makeBakery(), callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        var requestId = assertRequest(conn.last_message());
        conn.msg({'request-id': requestId, error: 'bad wolf'});
        assert.strictEqual(error, 'authentication failed: bad wolf');
      });

      it('sends a second message after discharge', function() {
        var bakery = makeBakery(function(macaroon, success, fail) {
          assert.strictEqual(macaroon, 'discharge-required-macaroon');
          success(['macaroon', 'discharge']);
        });
        env.loginWithMacaroon(bakery, callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        var requestId = assertRequest(conn.last_message());
        conn.msg({
          'request-id': requestId,
          response: {'discharge-required': 'discharge-required-macaroon'}
        });
        assert.strictEqual(conn.messages.length, 2, 'unexpected msg number');
        assertRequest(conn.last_message(), ['macaroon', 'discharge']);
      });

      it('handles discharge failures', function() {
        var bakery = makeBakery(function(macaroon, success, fail) {
          fail('bad wolf');
        });
        env.loginWithMacaroon(bakery, callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        var requestId = assertRequest(conn.last_message());
        conn.msg({
          'request-id': requestId,
          response: {'discharge-required': 'discharge-required-macaroon'}
        });
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        assert.strictEqual(error, 'macaroon discharge failed: bad wolf');
      });

      it('fails if user info is not provided in response', function() {
        env.loginWithMacaroon(makeBakery(), callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        var requestId = assertRequest(conn.last_message());
        conn.msg({'request-id': requestId, response: {}});
        assert.strictEqual(
          error, 'authentication failed: use a proper Juju 2 release');
      });

      it('succeeds after discharge', function() {
        var bakery = makeBakery(function(macaroon, success, fail) {
          assert.strictEqual(macaroon, 'discharge-required-macaroon');
          success(['macaroon', 'discharge']);
        });
        env.loginWithMacaroon(bakery, callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        var requestId = assertRequest(conn.last_message());
        conn.msg({
          'request-id': requestId,
          response: {'discharge-required': 'discharge-required-macaroon'}
        });
        assert.strictEqual(conn.messages.length, 2, 'unexpected msg number');
        requestId = assertRequest(
          conn.last_message(), ['macaroon', 'discharge']);
        conn.msg({
          'request-id': requestId,
          response: {
            'user-info': {identity: 'who'},
            facades: [
              {name: 'Client', versions: [42, 47]},
              {name: 'ModelManager', versions: [2]}
            ]
          }
        });
        assert.strictEqual(error, null);
        var creds = env.getCredentials();
        assert.strictEqual(creds.user, 'user-who');
        assert.strictEqual(creds.password, '');
        assert.deepEqual(creds.macaroons, ['macaroon', 'discharge']);
        assert.deepEqual(env.get('facades'), {
          Client: [42, 47],
          ModelManager: [2]
        });
      });

      it('succeeds with already stored macaroons', function() {
        env.setCredentials({macaroons: ['already stored', 'macaroons']});
        env.loginWithMacaroon(makeBakery(), callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        var requestId = assertRequest(
          conn.last_message(), ['already stored', 'macaroons']);
        conn.msg({
          'request-id': requestId,
          response: {
            'user-info': {identity: 'dalek'},
            facades: [
              {name: 'Client', versions: [0]},
              {name: 'ModelManager', versions: [2]}
            ]
          }
        });
        assert.strictEqual(error, null);
        var creds = env.getCredentials();
        assert.strictEqual(creds.user, 'user-dalek');
        assert.strictEqual(creds.password, '');
        assert.deepEqual(creds.macaroons, ['already stored', 'macaroons']);
        assert.deepEqual(env.get('facades'), {
          Client: [0],
          ModelManager: [2]
        });
      });

    });

    it('ignores rpc requests when websocket is not connected', function() {
      // Set the readyState to 2 for CLOSING.
      conn.readyState = 2;
      env._send_rpc({
        type: 'Client',
        request: 'ModelInfo',
        version: 1,
        'request-id': 1,
        params: {}
      });
      // No calls should be made.
      assert.equal(conn.messages.length, 0);
    });

    it('sends the correct request for model info', function() {
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo();
      var lastMessage = conn.last_message();
      var expected = {
        type: 'ModelManager',
        request: 'ModelInfo',
        version: 2,
        'request-id': 1,
        params: {entities: [{tag: 'my-model-tag'}]}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('logs an error on current model info errors', function() {
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      // Mock "console.error" so that it is possible to collect logged errors.
      var original = console.error;
      var err = null;
      console.error = function(msg) {
        err = msg;
      };
      // Assume currentModelInfo to be the first request.
      conn.msg({'request-id': 1, error: {message: 'bad wolf'}});
      assert.strictEqual(err, 'error retrieving model information: bad wolf');
      // Restore the original "console.error".
      console.error = original;
    });

    it('logs an error on current model info internal errors', function() {
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      // Mock "console.error" so that it is possible to collect logged errors.
      var original = console.error;
      var err = null;
      console.error = function(msg) {
        err = msg;
      };
      // Assume currentModelInfo to be the first request.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            error: {message: 'bad wolf'}
          }]
        }
      });
      assert.strictEqual(err, 'error retrieving model information: bad wolf');
      // Restore the original "console.error".
      console.error = original;
    });

    it('stores model info into env attributes', function() {
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      // Assume currentModelInfo to be the first request.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              'default-series': 'xenial',
              name: 'my-model',
              'provider-type': 'aws',
              uuid: '5bea955d-7a43-47d3-89dd-tag1',
              'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }]
        }
      });
      assert.equal(env.get('defaultSeries'), 'xenial');
      assert.equal(env.get('providerType'), 'aws');
      assert.equal(env.get('environmentName'), 'my-model');
      assert.equal(env.get('modelUUID'), '5bea955d-7a43-47d3-89dd-tag1');
    });

    it('sends the correct ModelGet request', function() {
      env.modelGet();
      var expectedMessage = {
        type: 'ModelConfig',
        request: 'ModelGet',
        version: 42,
        'request-id': 1,
        params: {}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('warns on ModelGet errors', function() {
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      // Mock "console.warn" so that it is possible to collect warnings.
      var original = console.warn;
      var warning = null;
      console.warn = function(msg) {
        warning = msg;
      };
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              'default-series': 'xenial',
              name: 'my-model',
              'provider-type': 'maas',
              uuid: '5bea955d-7a43-47d3-89dd-tag1',
              'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }]
        }
      });
      conn.msg({'request-id': 2, error: 'bad wolf'});
      assert.strictEqual(warning, 'error calling ModelGet API: bad wolf');
      // Restore the original "console.warn".
      console.warn = original;
    });

    it('stores the MAAS server on ModelGet results on MAAS', function() {
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              'default-series': 'xenial',
              name: 'my-model',
              'provider-type': 'maas',
              uuid: '5bea955d-7a43-47d3-89dd-tag1',
              'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }]
        }
      });
      conn.msg({
        'request-id': 2,
        response: {
          config: {'maas-server': {value: '1.2.3.4/MAAS'}}
        }
      });
      assert.equal(env.get('maasServer'), '1.2.3.4/MAAS');
    });

    it('ignores MAAS data on ModelGet results not in MAAS', function() {
      env.set('providerType', 'ec2');
      env.modelGet();
      conn.msg({
        'request-id': 1,
        response: {
          config: {'maas-server': '1.2.3.4/MAAS'}
        }
      });
      assert.strictEqual(env.get('maasServer'), undefined);
    });

    it('calls ModelGet after ModelInfo on MAAS', function() {
      // Simulate a ModelInfo request/response.
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              'default-series': 'xenial',
              name: 'my-model',
              'provider-type': 'maas',
              uuid: '5bea955d-7a43-47d3-89dd-tag1',
              'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }]
        }
      });
      assert.lengthOf(conn.messages, 2);
      var expectedMessage = {
        type: 'ModelConfig',
        request: 'ModelGet',
        version: 42,
        'request-id': 2,
        params: {}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('does not call ModelGet after Info when not on MAAS', function() {
      // The MAAS server attribute is initially undefined.
      assert.strictEqual(env.get('maasServer'), undefined);
      // Simulate a ModelInfo request/response.
      env.set('modelTag', 'my-model-tag');
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              'default-series': 'xenial',
              name: 'my-model',
              'provider-type': 'aws',
              uuid: '5bea955d-7a43-47d3-89dd-tag1',
              'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }]
        }
      });
      assert.lengthOf(conn.messages, 1);
      // The MAAS server attribute has been set to null.
      assert.strictEqual(env.get('maasServer'), null);
    });

    it('destroys a single model (deprecated)', function(done) {
      // Perform the request.
      env.destroyModel(function(err) {
        assert.strictEqual(err, null);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Client',
          version: 1,
          request: 'DestroyModel',
          params: {},
          'request-id': 1
        });
        done();
      });

      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('handles failures while destroying single model', function(done) {
      // Perform the request.
      env.destroyModel(function(err) {
        assert.strictEqual(err, 'bad wolf');
        done();
      });

      // Mimic response.
      conn.msg({'request-id': 1, error: 'bad wolf'});
    });

    it('destroys models', function(done) {
      // Perform the request.
      env.destroyModels(['model-tag-1'], function(response) {
        assert.strictEqual(response.err, undefined);
        assert.deepEqual(response.results, {
          'model-tag-1': null
        });
        assert.strictEqual(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'ModelManager',
          version: 2,
          request: 'DestroyModels',
          params: {entities: [
            {tag: 'model-tag-1'}
          ]},
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{}]}
      });
    });

    it('destroys multiple models', function(done) {
      // Perform the request.
      env.destroyModels(['model-tag-1', 'model-tag-2'], function(response) {
        assert.strictEqual(response.err, undefined);
        assert.deepEqual(response.results, {
          'model-tag-1': null,
          'model-tag-2': null
        });
        assert.strictEqual(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'ModelManager',
          version: 2,
          request: 'DestroyModels',
          params: {entities: [
            {tag: 'model-tag-1'},
            {tag: 'model-tag-2'}
          ]},
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{}, {}]}
      });
    });

    it('handles local failures while destroying models', function(done) {
      // Perform the request.
      var tags = ['model-tag-1', 'model-tag-2', 'model-tag-3'];
      env.destroyModels(tags, function(response) {
        assert.strictEqual(response.err, undefined);
        assert.deepEqual(response.results, {
          'model-tag-1': 'bad wolf',
          'model-tag-2': null,
          'model-tag-3': 'end of the universe'
        });
        done();
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [
          {error: {message: 'bad wolf'}},
          {},
          {error: {message: 'end of the universe'}}
        ]}
      });
    });

    it('handles global failures while destroying models', function(done) {
      // Perform the request.
      env.destroyModels(['model-tag-1'], function(response) {
        assert.strictEqual(response.err, 'bad wolf');
        assert.strictEqual(response.results, undefined);
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, error: 'bad wolf'});
    });

    it('retrieves model info for a single model', function(done) {
      // Perform the request.
      var tag = 'model-5bea955d-7a43-47d3-89dd-b02c923e';
      env.modelInfo([tag], function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.models.length, 1);
        var result = data.models[0];
        assert.strictEqual(result.tag, tag);
        assert.strictEqual(result.name, 'admin');
        assert.strictEqual(result.series, 'trusty');
        assert.strictEqual(result.provider, 'lxd');
        assert.strictEqual(result.uuid, '5bea955d-7a43-47d3-89dd-b02c923e');
        assert.strictEqual(result.serverUuid, '5bea955d-7a43-47d3-89dd');
        assert.strictEqual(result.life, 'alive');
        assert.strictEqual(result.ownerTag, 'user-admin@local');
        assert.strictEqual(result.isAlive, true, 'unexpected zombie model');
        assert.strictEqual(result.isAdmin, false, 'unexpected admin model');
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'ModelManager',
          version: 2,
          request: 'ModelInfo',
          params: {entities: [{tag: tag}]},
          'request-id': 1
        });
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              'default-series': 'trusty',
              name: 'admin',
              'provider-type': 'lxd',
              uuid: '5bea955d-7a43-47d3-89dd-b02c923e',
              'controller-uuid': '5bea955d-7a43-47d3-89dd',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }]
        }
      });
    });

    it('retrieves model info for multiple models', function(done) {
      // Perform the request.
      var tag1 = 'model-5bea955d-7a43-47d3-89dd-tag1';
      var tag2 = 'model-5bea955d-7a43-47d3-89dd-tag2';
      env.modelInfo([tag1, tag2], function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.models.length, 2);
        var result1 = data.models[0];
        assert.strictEqual(result1.tag, tag1);
        assert.strictEqual(result1.name, 'model1');
        assert.strictEqual(result1.series, 'trusty');
        assert.strictEqual(result1.provider, 'lxd');
        assert.strictEqual(result1.uuid, '5bea955d-7a43-47d3-89dd-tag1');
        assert.strictEqual(result1.serverUuid, '5bea955d-7a43-47d3-89dd-tag1');
        assert.strictEqual(result1.life, 'alive');
        assert.strictEqual(result1.ownerTag, 'user-admin@local');
        assert.strictEqual(result1.isAlive, true, 'unexpected zombie model');
        assert.strictEqual(result1.isAdmin, true, 'unexpected regular model');
        var result2 = data.models[1];
        assert.strictEqual(result2.tag, tag2);
        assert.strictEqual(result2.name, 'model2');
        assert.strictEqual(result2.series, 'xenial');
        assert.strictEqual(result2.provider, 'aws');
        assert.strictEqual(result2.uuid, '5bea955d-7a43-47d3-89dd-tag2');
        assert.strictEqual(result2.serverUuid, '5bea955d-7a43-47d3-89dd-tag1');
        assert.strictEqual(result2.life, 'dying');
        assert.strictEqual(result2.ownerTag, 'user-dalek@skaro');
        assert.strictEqual(result2.isAlive, false, 'unexpected alive model');
        assert.strictEqual(result2.isAdmin, false, 'unexpected admin model');
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'ModelManager',
          version: 2,
          request: 'ModelInfo',
          params: {entities: [{tag: tag1}, {tag: tag2}]},
          'request-id': 1
        });
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              'default-series': 'trusty',
              name: 'model1',
              'provider-type': 'lxd',
              uuid: '5bea955d-7a43-47d3-89dd-tag1',
              'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
              life: 'alive',
              'owner-tag': 'user-admin@local'
            }
          }, {
            result: {
              'default-series': 'xenial',
              name: 'model2',
              'provider-type': 'aws',
              uuid: '5bea955d-7a43-47d3-89dd-tag2',
              'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
              life: 'dying',
              'owner-tag': 'user-dalek@skaro'
            }
          }]
        }
      });
    });

    it('handles request failures while retrieving model info', function(done) {
      // Perform the request.
      env.modelInfo(['model-5bea955d-7a43-47d3-89dd'], function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: {message: 'bad wolf'}
      });
    });

    it('handles API failures while retrieving model info', function(done) {
      // Perform the request.
      var tag = 'model-5bea955d-7a43-47d3-89dd';
      env.modelInfo([tag], function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.models.length, 1);
        var result = data.models[0];
        assert.strictEqual(result.tag, tag);
        assert.strictEqual(result.err, 'bad wolf');
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            error: {message: 'bad wolf'}
          }]
        }
      });
    });

    it('handles unexpected failures while getting model info', function(done) {
      // Perform the request.
      env.modelInfo(['model-5bea955d-7a43-47d3-89dd'], function(data) {
        assert.strictEqual(data.err, 'unexpected results: []');
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: []}
      });
    });

    describe('listModelsWithInfo', function() {
      it('listModelsWithInfo: info for a single model', function(done) {
        env.setCredentials({user: 'user-who', password: 'tardis'});
        // Perform the request.
        env.listModelsWithInfo(function(err, data) {
          assert.strictEqual(err, null);
          assert.strictEqual(data.models.length, 1);
          var result = data.models[0];
          assert.strictEqual(result.err, undefined);
          assert.strictEqual(result.tag, 'model-5bea955d-1');
          assert.strictEqual(result.name, 'admin');
          assert.strictEqual(result.series, 'trusty');
          assert.strictEqual(result.provider, 'lxd');
          assert.strictEqual(result.uuid, '5bea955d-1');
          assert.strictEqual(result.serverUuid, '5bea955d-c');
          assert.strictEqual(result.life, 'alive');
          assert.strictEqual(result.ownerTag, 'user-admin@local');
          assert.strictEqual(result.isAlive, true, 'unexpected zombie model');
          assert.strictEqual(result.isAdmin, false, 'unexpected admin model');
          assert.strictEqual(result.lastConnection, 'today');
          assert.equal(conn.messages.length, 2);
          assert.deepEqual(conn.messages[0], {
            type: 'ModelManager',
            version: 2,
            request: 'ListModels',
            params: {tag: 'user-who'},
            'request-id': 1
          });
          assert.deepEqual(conn.messages[1], {
            type: 'ModelManager',
            version: 2,
            request: 'ModelInfo',
            params: {entities: [{tag: 'model-5bea955d-1'}]},
            'request-id': 2
          });
          done();
        });

        // Mimic first response to ModelManager.ListModels.
        conn.msg({
          'request-id': 1,
          response: {
            'user-models': [{
              model: {
                name: 'admin',
                'owner-tag': 'user-who',
                uuid: '5bea955d-1'
              },
              'last-connection': 'today'
            }]
          }
        });
        // Mimic second response to ModelManager.ModelInfo.
        conn.msg({
          'request-id': 2,
          response: {
            results: [{
              result: {
                'default-series': 'trusty',
                name: 'admin',
                'provider-type': 'lxd',
                uuid: '5bea955d-1',
                'controller-uuid': '5bea955d-c',
                life: 'alive',
                'owner-tag': 'user-admin@local'
              }
            }]
          }
        });
      });

      it('listModelsWithInfo: info for multiple models', function(done) {
        env.setCredentials({user: 'user-dalek', password: 'exterminate'});
        // Perform the request.
        env.listModelsWithInfo(function(err, data) {
          assert.strictEqual(err, null);
          assert.strictEqual(data.models.length, 3);
          var result1 = data.models[0];
          assert.strictEqual(result1.err, undefined);
          assert.strictEqual(result1.tag, 'model-5bea955d-1');
          assert.strictEqual(result1.name, 'default');
          assert.strictEqual(result1.series, 'xenial');
          assert.strictEqual(result1.provider, 'lxd');
          assert.strictEqual(result1.uuid, '5bea955d-1');
          assert.strictEqual(result1.serverUuid, '5bea955d-c');
          assert.strictEqual(result1.life, 'dead');
          assert.strictEqual(result1.ownerTag, 'user-dalek@local');
          assert.strictEqual(result1.isAlive, false, 'unexpected alive model');
          assert.strictEqual(result1.isAdmin, false, 'unexpected admin model');
          assert.strictEqual(result1.lastConnection, 'today');
          var result2 = data.models[1];
          assert.strictEqual(result2.err, undefined);
          assert.strictEqual(result2.tag, 'model-5bea955d-c');
          assert.strictEqual(result2.name, 'admin');
          assert.strictEqual(result2.series, 'trusty');
          assert.strictEqual(result2.provider, 'lxd');
          assert.strictEqual(result2.uuid, '5bea955d-c');
          assert.strictEqual(result2.serverUuid, '5bea955d-c');
          assert.strictEqual(result2.life, 'alive');
          assert.strictEqual(result2.ownerTag, 'user-who@local');
          assert.strictEqual(result2.isAlive, true, 'unexpected zombie model');
          assert.strictEqual(result2.isAdmin, true, 'unexpected regular model');
          assert.strictEqual(result2.lastConnection, 'yesterday');
          var result3 = data.models[2];
          assert.strictEqual(result3.err, undefined);
          assert.strictEqual(result3.tag, 'model-5bea955d-3');
          assert.strictEqual(result3.name, 'mymodel');
          assert.strictEqual(result3.series, 'precise');
          assert.strictEqual(result3.provider, 'aws');
          assert.strictEqual(result3.uuid, '5bea955d-3');
          assert.strictEqual(result3.serverUuid, '5bea955d-c');
          assert.strictEqual(result3.life, 'alive');
          assert.strictEqual(result3.ownerTag, 'user-cyberman@local');
          assert.strictEqual(result3.isAlive, true, 'unexpected zombie model');
          assert.strictEqual(result3.isAdmin, false, 'unexpected admin model');
          assert.strictEqual(result3.lastConnection, 'tomorrow');
          assert.equal(conn.messages.length, 2);
          assert.deepEqual(conn.messages[0], {
            type: 'ModelManager',
            version: 2,
            request: 'ListModels',
            params: {tag: 'user-dalek'},
            'request-id': 1
          });
          assert.deepEqual(conn.messages[1], {
            type: 'ModelManager',
            version: 2,
            request: 'ModelInfo',
            params: {entities: [
              {tag: 'model-5bea955d-1'},
              {tag: 'model-5bea955d-c'},
              {tag: 'model-5bea955d-3'}
            ]},
            'request-id': 2
          });
          done();
        });

        // Mimic first response to ModelManager.ListModels.
        conn.msg({
          'request-id': 1,
          response: {
            'user-models': [{
              model: {
                name: 'default',
                'owner-tag': 'user-dalek',
                uuid: '5bea955d-1'
              },
              'last-connection': 'today'
            }, {
              model: {
                name: 'admin',
                'owner-tag': 'user-who',
                uuid: '5bea955d-c'
              },
              'last-connection': 'yesterday'
            }, {
              model: {
                name: 'mymodel',
                'owner-tag': 'user-cyberman',
                uuid: '5bea955d-3'
              },
              'last-connection': 'tomorrow'
            }]
          }
        });
        // Mimic second response to ModelManager.ModelInfo.
        conn.msg({
          'request-id': 2,
          response: {
            results: [{
              result: {
                'default-series': 'xenial',
                name: 'default',
                'provider-type': 'lxd',
                uuid: '5bea955d-1',
                'controller-uuid': '5bea955d-c',
                life: 'dead',
                'owner-tag': 'user-dalek@local'
              }
            }, {
              result: {
                'default-series': 'trusty',
                name: 'admin',
                'provider-type': 'lxd',
                uuid: '5bea955d-c',
                'controller-uuid': '5bea955d-c',
                life: 'alive',
                'owner-tag': 'user-who@local'
              }
            }, {
              result: {
                'default-series': 'precise',
                name: 'mymodel',
                'provider-type': 'aws',
                uuid: '5bea955d-3',
                'controller-uuid': '5bea955d-c',
                life: 'alive',
                'owner-tag': 'user-cyberman@local'
              }
            }]
          }
        });
      });

      it('listModelsWithInfo: credentials error', function(done) {
        env.setCredentials(null);
        // Perform the request.
        env.listModelsWithInfo(function(err, data) {
          assert.equal(err, 'called without credentials');
          done();
        });
      });

      it('listModelsWithInfo: list models error', function(done) {
        // Perform the request.
        env.listModelsWithInfo(function(err, data) {
          assert.strictEqual(err, 'bad wolf');
          done();
        });

        // Mimic response.
        conn.msg({
          'request-id': 1,
          error: 'bad wolf'
        });
      });

      it('listModelsWithInfo: model info error', function(done) {
        // Perform the request.
        env.listModelsWithInfo(function(err, data) {
          assert.strictEqual(err, 'bad wolf');
          done();
        });

        // Mimic first response to ModelManager.ListModels.
        conn.msg({
          'request-id': 1,
          response: {
            'user-models': [{
              model: {
                name: 'default',
                'owner-tag': 'user-dalek',
                uuid: '5bea955d-1'
              },
              'last-connection': 'today'
            }]
          }
        });
        // Mimic second response to ModelManager.ModelInfo.
        conn.msg({
          'request-id': 2,
          error: {message: 'bad wolf'}
        });
      });

      it('listModelsWithInfo: specific model response error', function(done) {
        // Perform the request.
        env.listModelsWithInfo(function(err, data) {
          assert.strictEqual(err, null);
          assert.strictEqual(data.models.length, 1);
          var result = data.models[0];
          assert.strictEqual(result.tag, 'model-5bea955d-1');
          assert.strictEqual(result.err, 'bad wolf');
          done();
        });

        // Mimic first response to ModelManager.ListModels.
        conn.msg({
          'request-id': 1,
          response: {
            'user-models': [{
              model: {
                name: 'default',
                'owner-tag': 'user-dalek',
                uuid: '5bea955d-1'
              },
              'last-connection': 'today'
            }]
          }
        });
        // Mimic second response to ModelManager.ModelInfo.
        conn.msg({
          'request-id': 2,
          response: {
            results: [{
              error: {message: 'bad wolf'}
            }]
          }
        });
      });
    });

    it('pings the server correctly', function() {
      env.ping();
      var expectedMessage = {
        type: 'Pinger',
        request: 'Ping',
        version: 42,
        'request-id': 1,
        params: {}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('sends the correct Application.AddUnits message', function() {
      env.add_unit('django', 3, null, null, {immediate: true});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Application',
        request: 'AddUnits',
        version: 7,
        'request-id': 1,
        params: {application: 'django', 'num-units': 3, placement: [null]}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('adds new units to a specific machine', function() {
      env.add_unit('django', 3, '42', null, {immediate: true});
      var expectedMessage = {
        type: 'Application',
        request: 'AddUnits',
        version: 7,
        'request-id': 1,
        params: {
          application: 'django',
          'num-units': 3,
          placement: [{scope: '#', directive: '42'}]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('adds new units to a specific container', function() {
      env.add_unit('haproxy', 1, 'lxc:47', null, {immediate: true});
      var expectedMessage = {
        type: 'Application',
        request: 'AddUnits',
        version: 7,
        'request-id': 1,
        params: {
          application: 'haproxy',
          'num-units': 1,
          placement: [{scope: 'lxc', directive: '47'}]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('successfully adds units to an application', function(done) {
      env.add_unit('django', 2, null, function(data) {
        assert.strictEqual(data.applicationName, 'django');
        assert.strictEqual(data.numUnits, 2);
        assert.deepEqual(data.result, ['django/2', 'django/3']);
        assert.strictEqual(data.err, undefined);
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {units: ['django/2', 'django/3']}
      });
    });

    it('handles failures adding units to an application', function(done) {
      env._add_unit('django', 0, null, function(data) {
        assert.strictEqual(data.applicationName, 'django');
        assert.strictEqual(data.numUnits, 0);
        assert.strictEqual(data.err, 'must add at least one unit');
        done();
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'must add at least one unit'
      });
    });

    it('sends the correct Application.DestroyUnits message', function() {
      env.remove_units(['django/2', 'django/3'], null, {immediate: true});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Application',
        request: 'DestroyUnits',
        version: 7,
        'request-id': 1,
        params: {'unit-names': ['django/2', 'django/3']}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('successfully removes units from an application', function(done) {
      env.remove_units(['django/2', 'django/3'], function(data) {
        assert.deepEqual(['django/2', 'django/3'], data.unit_names);
        assert.isUndefined(data.err);
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {}
      });
    });

    it('handles failures removing units', function(done) {
      env.remove_units(['django/2'], function(data) {
        assert.deepEqual(['django/2'], data.unit_names);
        assert.strictEqual('unit django/2 does not exist', data.err);
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'unit django/2 does not exist'
      });
    });

    describe('local charm upload support', function() {

      afterEach(function() {
        delete window.juju_config;
      });

      it('uses the correct endpoint when served from juju', function() {
        window.juju_config = { staticURL: '/static-url'};
        env.userIsAuthenticated = true;
        var mockWebHandler = {sendPostRequest: utils.makeStubFunction()};
        env.set('webHandler', mockWebHandler);
        env.uploadLocalCharm(
          'a zip file', 'trusty',
          function() {return 'progress';},
          function() {return 'completed';});
        // Ensure the web handler's sendPostRequest method has been called with
        // the correct charm endpoint
        var lastArguments = mockWebHandler.sendPostRequest.lastArguments();
        assert.strictEqual(
          lastArguments[0],
          '/model/this-is-a-uuid/charms?series=trusty'); // Path.
      });

      it('prevents non authorized users from sending files', function(done) {
        env.userIsAuthenticated = false;
        var warn = console.warn,
            called = false;

        console.warn = function(msg) {
          assert.equal(
              msg, 'Attempted upload files without providing credentials.');
          called = true;
        };
        var handler = env.on('login', function(e) {
          assert.deepEqual(e.data, {result: false});
          assert.equal(called, true, 'Console warning not called');
          handler.detach();
          console.warn = warn;
          done();
        });
        env.uploadLocalCharm();
      });

      it('uses the stored webHandler to perform requests', function() {
        env.userIsAuthenticated = true;
        var mockWebHandler = {sendPostRequest: utils.makeStubFunction()};
        env.set('webHandler', mockWebHandler);
        env.uploadLocalCharm(
            'a zip file', 'trusty',
            function() {return 'progress';},
            function() {return 'completed';});
        // Ensure the web handler's sendPostRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendPostRequest.callCount(), 1);
        var lastArguments = mockWebHandler.sendPostRequest.lastArguments();
        assert.strictEqual(lastArguments.length, 7);
        assert.strictEqual(
            lastArguments[0],
            '/juju-core/model/this-is-a-uuid/charms?series=trusty'); // Path.
        assert.deepEqual(
            lastArguments[1], {'Content-Type': 'application/zip'}); // Headers.
        assert.strictEqual(lastArguments[2], 'a zip file'); // Zip file object.
        assert.strictEqual(lastArguments[3], 'user-user'); // User name.
        assert.strictEqual(lastArguments[4], 'password'); // Password.
        assert.strictEqual(
            lastArguments[5](), 'progress'); // Progress callback.
        assert.strictEqual(
            lastArguments[6](), 'completed'); // Completed callback.
      });

    });

    describe('getLocalCharmFileUrl', function() {

      it('uses the stored webHandler to retrieve the file URL', function() {
        var mockWebHandler = {getUrl: utils.makeStubFunction('myurl')};
        env.set('webHandler', mockWebHandler);
        var url = env.getLocalCharmFileUrl(
            'local:trusty/django-42', 'icon.svg');
        assert.strictEqual(url, 'myurl');
        // Ensure the web handler's getUrl method has been called with the
        // expected arguments.
        assert.strictEqual(mockWebHandler.getUrl.callCount(), 1);
        var lastArguments = mockWebHandler.getUrl.lastArguments();
        assert.lengthOf(lastArguments, 3);
        var expected = '/juju-core/model/this-is-a-uuid/charms?' +
            'url=local:trusty/django-42&file=icon.svg';
        assert.strictEqual(lastArguments[0], expected);
        assert.strictEqual(lastArguments[1], 'user-user'); // User name.
        assert.strictEqual(lastArguments[2], 'password'); // Password.
      });

    });

    describe('listLocalCharmFiles', function() {

      it('uses the stored webHandler to retrieve the file list', function() {
        var mockWebHandler = {sendGetRequest: utils.makeStubFunction()};
        env.set('webHandler', mockWebHandler);
        env.listLocalCharmFiles(
            'local:trusty/django-42',
            function() {return 'progress';},
            function() {return 'completed';});
        // Ensure the web handler's sendGetRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendGetRequest.callCount(), 1);
        var lastArguments = mockWebHandler.sendGetRequest.lastArguments();
        assert.lengthOf(lastArguments, 6);
        var expected = '/juju-core/model/this-is-a-uuid/charms' +
            '?url=local:trusty/django-42';
        assert.strictEqual(lastArguments[0], expected);
        assert.deepEqual(lastArguments[1], {}); // Headers.
        assert.strictEqual(lastArguments[2], 'user-user'); // User name.
        assert.strictEqual(lastArguments[3], 'password'); // Password.
        assert.strictEqual(
            lastArguments[4](), 'progress'); // Progress callback.
        assert.strictEqual(
            lastArguments[5](), 'completed'); // Completed callback.
      });

    });

    describe('getLocalCharmFileContents', function() {

      it('uses the stored webHandler to retrieve the contents', function() {
        var mockWebHandler = {sendGetRequest: utils.makeStubFunction()};
        env.set('webHandler', mockWebHandler);
        env.getLocalCharmFileContents(
            'local:trusty/django-42', 'hooks/install',
            function() {return 'progress';},
            function() {return 'completed';});
        // Ensure the web handler's sendGetRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendGetRequest.callCount(), 1);
        var lastArguments = mockWebHandler.sendGetRequest.lastArguments();
        assert.lengthOf(lastArguments, 6);
        var expected = '/juju-core/model/this-is-a-uuid/charms?' +
            'url=local:trusty/django-42&file=hooks/install';
        assert.strictEqual(lastArguments[0], expected);
        assert.deepEqual(lastArguments[1], {}); // Headers.
        assert.strictEqual(lastArguments[2], 'user-user'); // User name.
        assert.strictEqual(lastArguments[3], 'password'); // Password.
        assert.strictEqual(
            lastArguments[4](), 'progress'); // Progress callback.
        assert.strictEqual(
            lastArguments[5](), 'completed'); // Completed callback.
      });

    });

    it('sends the correct expose message', function() {
      env.expose('apache', function() {}, {immediate: true});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Application',
        request: 'Expose',
        version: 7,
        'request-id': 1,
        params: {application: 'apache'}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('successfully exposes an application', function() {
      var applicationName;
      env.expose('mysql', function(data) {
        applicationName = data.applicationName;
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {}
      });
      assert.equal(applicationName, 'mysql');
    });

    it('handles failed expose calls', function() {
      var applicationName;
      var err;
      env.expose('mysql', function(data) {
        applicationName = data.applicationName;
        err = data.err;
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'application \"mysql\" not found'
      });
      assert.equal(applicationName, 'mysql');
      assert.equal(err, 'application "mysql" not found');
    });

    it('sends the correct unexpose message', function() {
      env.unexpose('apache', function() {}, {immediate: true});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Application',
        request: 'Unexpose',
        version: 7,
        'request-id': 1,
        params: {application: 'apache'}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('successfully unexposes an application', function() {
      var err;
      var applicationName;
      env.unexpose('mysql', function(data) {
        err = data.err;
        applicationName = data.applicationName;
      }, {immediate: true});
      // Mimic response, assuming Application.Unexpose to be the first request.
      conn.msg({
        'request-id': 1,
        response: {}
      });
      assert.isUndefined(err);
      assert.equal(applicationName, 'mysql');
    });

    it('handles failed unexpose calls', function() {
      var err;
      var applicationName;
      env.unexpose('mysql', function(data) {
        err = data.err;
        applicationName = data.applicationName;
      }, {immediate: true});
      // Mimic response, assuming Application.Unexpose to be the first request.
      conn.msg({
        'request-id': 1,
        error: 'application \"mysql\" not found'
      });
      assert.equal(err, 'application "mysql" not found');
      assert.equal(applicationName, 'mysql');
    });

    it('successfully adds a charm', function() {
      var err, url;
      env.addCharm('wily/django-42', null, function(data) {
        err = data.err;
        url = data.url;
      }, {immediate: true});
      var expectedMessage = {
        type: 'Client',
        version: 1,
        request: 'AddCharm',
        params: {url: 'wily/django-42'},
        'request-id': 1
      };
      assert.deepEqual(expectedMessage, conn.last_message());
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
      assert.strictEqual(url, 'wily/django-42');
      assert.strictEqual(err, undefined);
    });

    it('successfully adds a charm with a macaroon', function() {
      var err, url;
      env.addCharm('trusty/django-0', 'MACAROON', function(data) {
        err = data.err;
        url = data.url;
      }, {immediate: true});
      var expectedMessage = {
        type: 'Client',
        request: 'AddCharmWithAuthorization',
        version: 1,
        params: {macaroon: 'MACAROON', url: 'trusty/django-0'},
        'request-id': 1
      };
      assert.deepEqual(expectedMessage, conn.last_message());
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
      assert.strictEqual(url, 'trusty/django-0');
      assert.strictEqual(err, undefined);
    });

    it('handles failed addCharm calls', function() {
      var err, url;
      env.addCharm('wily/django-42', null, function(data) {
        err = data.err;
        url = data.url;
      }, {immediate: true});
      // Mimic response.
      conn.msg({'request-id': 1, error: 'bad wolf'});
      assert.strictEqual(url, 'wily/django-42');
      assert.strictEqual(err, 'bad wolf');
    });

    describe('setCharm', function() {

      it('sends message to change the charm version', function() {
        var applicationName = 'rethinkdb';
        var charmUrl = 'trusty/rethinkdb-1';
        var forceUnits = false;
        var forceSeries = true;
        var cb = utils.makeStubFunction();
        env.setCharm(applicationName, charmUrl, forceUnits, forceSeries, cb);
        var lastMessage = conn.last_message();
        var expected = {
          type: 'Application',
          request: 'Update',
          version: 7,
          'request-id': 1,
          params: {
            application: applicationName,
            'charm-url': charmUrl,
            'force-charm-url': forceUnits,
            'force-series': forceSeries
          }
        };
        assert.deepEqual(lastMessage, expected);
        // Trigger the message.
        conn.msg(expected);
        assert.equal(cb.callCount(), 1);
        assert.deepEqual(cb.lastArguments(), [{
          err: undefined,
          applicationName: applicationName,
          charmUrl: charmUrl
        }]);
      });

    });

    it('successfully deploys an application', function() {
      env.deploy('precise/mysql', 'trusty', 'mysql', null, null, 1, null,
        null, null, {immediate: true});
      msg = conn.last_message();
      var expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: 'mysql',
          'config-yaml': null,
          config: {},
          constraints: {},
          'charm-url': 'precise/mysql',
          'num-units': 1,
          series: 'trusty'
        }]},
        'request-id': 1
      };
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys an application with a config object', function() {
      var config = {debug: true, logo: 'example.com/mylogo.png'};
      var expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: null,
          // Configuration values are sent as strings.
          config: {debug: 'true', logo: 'example.com/mylogo.png'},
          'config-yaml': null,
          constraints: {},
          'charm-url': 'precise/mediawiki',
          'num-units': null
        }]},
        'request-id': 1
      };
      env.deploy('precise/mediawiki', null, null, config, null, null, null,
        null, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys an application with a config file', function() {
      var config_raw = 'tuning-level: \nexpert-mojo';
      var expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: null,
          config: {},
          constraints: {},
          'config-yaml': config_raw,
          'charm-url': 'precise/mysql',
          'num-units': null
        }]},
        'request-id': 1
      };
      env.deploy('precise/mysql', null, null, null, config_raw, null, null,
        null, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys an application with constraints', function() {
      var constraints = {
        'cpu-cores': 1,
        'cpu-power': 0,
        mem: '512M',
        arch: 'i386',
        'root-disk': '8000',
        tags: 'tag1,tag2'
      };
      env.deploy('precise/mediawiki', null, null, null, null, 1, constraints,
        null, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(msg.params.applications[0].constraints, {
        'cpu-cores': 1,
        'cpu-power': 0,
        mem: 512,
        arch: 'i386',
        'root-disk': 8000,
        tags: ['tag1', 'tag2']
      });
    });

    it('successfully deploys an app to a specific machine', function() {
      var expectedMessage = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: null,
          'config-yaml': null,
          config: {},
          constraints: {},
          'charm-url': 'precise/mediawiki',
          'num-units': 1
        }]},
        'request-id': 1
      };
      env.deploy('precise/mediawiki', null, null, null, null, 1, null, '42',
        null, {immediate: true});
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('successfully deploys an application storing charm data', function() {
      var charmUrl;
      var err;
      var applicationName;
      env.deploy(
          'precise/mysql', null, 'mysql', null, null, null, null, null,
          function(data) {
            charmUrl = data.charmUrl;
            err = data.err;
            applicationName = data.applicationName;
          }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{}]}
      });
      assert.equal(charmUrl, 'precise/mysql');
      assert.strictEqual(err, undefined);
      assert.equal(applicationName, 'mysql');
    });

    it('handles failed application deployments', function() {
      var err;
      env.deploy(
          'precise/mysql', null, 'mysql', null, null, null, null, null,
          function(data) {
            err = data.err;
          }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{error: 'app "mysql" not found'}]}
      });
      assert.equal(err, 'app "mysql" not found');
    });

    it('sets metric credentials', function(done) {
      // Perform the request.
      env.setMetricCredentials('django', 'macaroon-content', function(err) {
        assert.strictEqual(err, null);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'SetMetricCredentials',
          params: {creds: [{
            application: 'django',
            'metrics-credentials': 'macaroon-content'
          }]},
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('handles failures while setting metric credentials', function(done) {
      // Perform the request.
      env.setMetricCredentials('rails', 'macaroon-content', function(err) {
        assert.strictEqual(err, 'bad wolf');
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, error: 'bad wolf'});
    });

    it('adds a machine', function() {
      env.addMachines([{}], null, {immediate: true});
      var expectedMsg = {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'AddMachines',
        params: {
          params: [{jobs: [machineJobs.HOST_UNITS]}]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds a machine with the given series and constraints', function() {
      var constraints = {'cpu-cores': 4, 'mem': 4000};
      env.addMachines([{series: 'trusty', constraints: constraints}], null,
          {immediate: true});
      var expectedMsg = {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'AddMachines',
        params: {
          params: [{
            jobs: [machineJobs.HOST_UNITS],
            series: 'trusty',
            constraints: constraints
          }]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds a container', function() {
      env.addMachines([{containerType: 'lxc'}], null, {immediate: true});
      var expectedMsg = {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'AddMachines',
        params: {
          params: [{
            jobs: [machineJobs.HOST_UNITS],
            'container-type': 'lxc'
          }]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds a saucy container to a specific machine', function() {
      env.addMachines(
          [{containerType: 'lxc', parentId: '42', series: 'saucy'}],
          null, {immediate: true});
      var expectedMsg = {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'AddMachines',
        params: {
          params: [{
            jobs: [machineJobs.HOST_UNITS],
            'container-type': 'lxc',
            'parent-id': '42',
            series: 'saucy'
          }]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds multiple machines/containers', function() {
      env.addMachines([
        {},
        {jobs: [machineJobs.MANAGE_ENVIRON], series: 'precise'},
        {containerType: 'kvm'},
        {containerType: 'lxc', parentId: '1'}
      ], null, {immediate: true});
      var expectedMachineParams = [
          {jobs: [machineJobs.HOST_UNITS]},
          {jobs: [machineJobs.MANAGE_ENVIRON], series: 'precise'},
          {jobs: [machineJobs.HOST_UNITS], 'container-type': 'kvm'},
          {jobs: [machineJobs.HOST_UNITS],
           'container-type': 'lxc', 'parent-id': '1' }
      ];
      var expectedMsg = {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'AddMachines',
        params: {params: expectedMachineParams}
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('avoids sending calls if no machines are added', function() {
      env.addMachines([], null, {immediate: true});
      assert.equal(conn.messages.length, 0);
    });

    it('handles successful addMachines server responses', function() {
      var response;
      env.addMachines([{}, {containerType: 'lxc'}], function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server AddMachines response.
      conn.msg({
        'request-id': 1,
        response: {machines: [{machine: '42'}, {machine: '2/lxc/1'}]}
      });
      assert.isUndefined(response.err);
      var expectedMachines = [
        {name: '42', err: null},
        {name: '2/lxc/1', err: null}
      ];
      assert.deepEqual(response.machines, expectedMachines);
    });

    it('handles addMachines server failures', function() {
      var response;
      env.addMachines([{}], function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server AddMachines response.
      conn.msg({
        'request-id': 1,
        error: 'bad wolf',
        response: {machines: []}
      });
      assert.strictEqual(response.err, 'bad wolf');
      assert.strictEqual(response.machines.length, 0);
    });

    it('handles addMachines errors adding a specific machine', function() {
      var response;
      env.addMachines([{}, {}, {parentId: '42'}], function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server AddMachines response.
      conn.msg({
        'request-id': 1,
        response: {
          machines: [
            {machine: '', error: {code: '', message: 'bad wolf'}},
            {machine: '', error: {code: '47', message: 'machine 42 not found'}}
          ]
        }
      });
      assert.isUndefined(response.err);
      var expectedMachines = [
        {name: '', err: 'bad wolf'},
        {name: '', err: 'machine 42 not found (code 47)'}
      ];
      assert.deepEqual(response.machines, expectedMachines);
    });

    // Ensure a destroyMachines request has been sent.
    var assertDestroyMachinesRequestSent = function(names, force) {
      var expectedMsg = {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'DestroyMachines',
        params: {'machine-names': names, force: force}
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    };

    it('removes a machine', function() {
      env.destroyMachines(['1'], null, null, {immediate: true});
      assertDestroyMachinesRequestSent(['1'], false);
    });

    it('forces a machine removal', function() {
      env.destroyMachines(['42'], true, null, {immediate: true});
      assertDestroyMachinesRequestSent(['42'], true);
    });

    it('removes a container', function() {
      env.destroyMachines(['2/lxc/0'], null, null, {immediate: true});
      assertDestroyMachinesRequestSent(['2/lxc/0'], false);
    });

    it('forces a container removal', function() {
      env.destroyMachines(['1/kvm/42'], true, null, {immediate: true});
      assertDestroyMachinesRequestSent(['1/kvm/42'], true);
    });

    it('removes multiple machines/containers', function() {
      env.destroyMachines(['1', '47', '42/lxc/0'], null, null,
          {immediate: true});
      assertDestroyMachinesRequestSent(['1', '47', '42/lxc/0'], false);
    });

    it('avoids sending calls if no machines are removed', function() {
      env.destroyMachines([], null, null, {immediate: true});
      assert.equal(conn.messages.length, 0);
    });

    it('handles successful destroyMachines server responses', function() {
      var response;
      env.destroyMachines(['42', '1/lxc/2'], false, function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server DestroyMachines response.
      conn.msg({'request-id': 1, response: {}});
      assert.isUndefined(response.err);
      assert.deepEqual(response.names, ['42', '1/lxc/2']);
    });

    it('handles destroyMachines server failures', function() {
      var response;
      env.destroyMachines(['1'], false, function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server DestroyMachines response.
      conn.msg({'request-id': 1, error: 'bad wolf', response: {}});
      assert.strictEqual(response.err, 'bad wolf');
      assert.deepEqual(response.names, ['1']);
    });

    it('sends the correct Annotations.Get message', function() {
      env.get_annotations('apache', 'application');
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Annotations',
        version: 2,
        request: 'Get',
        'request-id': 1,
        params: {entities: [{tag: 'application-apache'}]}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('sends the correct Annotations.Get message (for services)', function() {
      env.get_annotations('apache', 'service');
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Annotations',
        version: 2,
        request: 'Get',
        'request-id': 1,
        params: {entities: [{tag: 'service-apache'}]}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('sends the correct Annotations.Set message', function() {
      env.update_annotations('apache', 'application', {'mykey': 'myvalue'});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Annotations',
        version: 2,
        request: 'Set',
        'request-id': 1,
        params: {
          annotations: [{
            entity: 'application-apache',
            annotations: {mykey: 'myvalue'}
          }]
        }
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('sends the correct Annotations.Set message (for services)', function() {
      env.update_annotations('apache', 'service', {'mykey': 'myvalue'});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Annotations',
        version: 2,
        request: 'Set',
        'request-id': 1,
        params: {
          annotations: [{
            entity: 'service-apache',
            annotations: {mykey: 'myvalue'}
          }]
        }
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('correctly sends all the annotation values as strings', function() {
      var annotations = {mynumber: 42, mybool: true, mystring: 'string'},
          expected = {mynumber: '42', mybool: 'true', mystring: 'string'};
      env.update_annotations('apache', 'application', annotations);
      var msg = conn.last_message();
      var pairs = msg.params.annotations[0].annotations;
      assert.deepEqual(expected, pairs);
    });

    it('sends correct multiple update_annotations messages', function() {
      env.update_annotations('apache', 'application', {
        'key1': 'value1',
        'key2': 'value2'
      });
      var expectedMessage = {
        type: 'Annotations',
        version: 2,
        request: 'Set',
        'request-id': 1,
        params: {
          annotations: [{
            entity: 'application-apache',
            annotations: {'key1': 'value1', 'key2': 'value2'}
          }]
        }
      };
      assert.deepEqual([expectedMessage], conn.messages);
    });

    it('sends the correct message to remove annotations', function() {
      env.remove_annotations('apache', 'application', ['key1', 'key2']);
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Annotations',
        version: 2,
        request: 'Set',
        'request-id': 1,
        params: {
          annotations: [{
            entity: 'application-apache',
            annotations: {'key1': '', 'key2': ''}
          }]
        }
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('sends the correct message to remove service annotations', function() {
      env.remove_annotations('apache', 'service', ['key1', 'key2']);
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Annotations',
        version: 2,
        request: 'Set',
        'request-id': 1,
        params: {
          annotations: [{
            entity: 'service-apache',
            annotations: {'key1': '', 'key2': ''}
          }]
        }
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('successfully retrieves annotations', function() {
      var annotations;
      var expected = {
        'key1': 'value1',
        'key2': 'value2'
      };
      env.get_annotations('mysql', 'application', function(data) {
        annotations = data.results;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{annotations: expected}]
        }
      });
      assert.deepEqual(expected, annotations);
    });

    it('successfully sets annotation', function() {
      var err;
      env.update_annotations('mysql', 'application', {'mykey': 'myvalue'},
          function(data) {
            err = data.err;
          });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{}]}
      });
      assert.isUndefined(err);
    });

    it('successfully sets multiple annotations', function() {
      var err;
      env.update_annotations('mysql', 'application', {
        'key1': 'value1',
        'key2': 'value2'
      }, function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{}]}
      });
      assert.isUndefined(err);
    });

    it('successfully removes annotations', function() {
      var err;
      env.remove_annotations('mysql', 'application', ['key1', 'key2'],
          function(data) {
            err = data.err;
          });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{}]}
      });
      assert.isUndefined(err);
    });

    it('handles errors from getting annotations', function() {
      var err;
      env.get_annotations('haproxy', 'application', function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'This is an error.'
      });
      assert.equal('This is an error.', err);
    });

    it('handles internal errors from getting annotations', function() {
      var err;
      env.get_annotations('haproxy', 'application', function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{error: 'bad wolf'}]
        }
      });
      assert.equal('bad wolf', err);
    });

    it('handles errors from setting annotations', function() {
      var err;
      env.update_annotations('haproxy', 'application', {
        'key': 'value'
      }, function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'This is an error.'
      });
      assert.equal('This is an error.', err);
    });

    it('handles internal errors from setting annotations', function() {
      var err;
      env.update_annotations('haproxy', 'application', {
        'key': 'value'
      }, function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{error: 'bad wolf'}]}
      });
      assert.equal('bad wolf', err);
    });

    it('correctly handles errors from removing annotations', function() {
      var err;
      env.remove_annotations('haproxy', 'application', ['key1', 'key2'],
          function(data) {
            err = data.err;
          });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'This is an error.'
      });
      assert.equal('This is an error.', err);
    });

    describe('generateTag', function() {

      var tag;

      it('generates an application tag', function() {
        tag = env.generateTag('django', 'application');
        assert.strictEqual('application-django', tag);
      });

      it('generates a model tag', function() {
        tag = env.generateTag('default', 'model');
        assert.strictEqual('model-default', tag);
      });

      it('generates a unit tag', function() {
        tag = env.generateTag('django/1', 'unit');
        assert.strictEqual('unit-django/1', tag);
      });

    });

    it('sends the correct message to retrieve application config', function() {
      env.getApplicationConfig('mysql');
      var lastMessage = conn.last_message();
      var expected = {
        'request-id': 1,
        type: 'Application',
        version: 7,
        request: 'Get',
        params: {application: 'mysql'}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('successfully gets application configuration', function() {
      var applicationName, result;
      env.getApplicationConfig('mysql', function(data) {
        applicationName = data.applicationName;
        result = data.result;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          Application: 'mysql',
          Charm: 'mysql',
          config: {
            'binlog-format': {
              description: 'Yada, yada, yada.',
              type: 'string',
              value: 'gzip'
            }
          }
        }
      });
      assert.equal(applicationName, 'mysql');
      var expected = {
        config: {
          'binlog-format': 'gzip'
        },
        constraints: undefined,
        series: undefined
      };
      assert.strictEqual(applicationName, 'mysql');
      assert.deepEqual(expected, result);
    });

    it('handles failures while retrieving app configuration  ', function() {
      var applicationName;
      var err;
      env.getApplicationConfig('yoursql', function(data) {
        applicationName = data.applicationName;
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'app \"yoursql\" not found',
        response: {
          Application: 'yoursql'
        }
      });
      assert.equal(applicationName, 'yoursql');
      assert.equal(err, 'app "yoursql" not found');
    });

    it('can set an application config', function() {
      var settings = {'cfg-key': 'cfg-val', 'unchanged': 'bar'};
      var callback = null;
      env.set_config('mysql', settings, callback, {immediate: true});
      msg = conn.last_message();
      var expected = {
        type: 'Application',
        request: 'Update',
        version: 7,
        params: {
          application: 'mysql',
          settings: {
            'cfg-key': 'cfg-val',
            'unchanged': 'bar'
          }
        },
        'request-id': msg['request-id']
      };
      assert.deepEqual(expected, msg);
    });

    it('handles failures while setting application configuration', function() {
      var err, applicationName;
      env.set_config('yoursql', {}, function(evt) {
        err = evt.err;
        applicationName = evt.applicationName;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        'request-id': msg['request-id'],
        error: 'app "yoursql" not found'
      });
      assert.equal(err, 'app "yoursql" not found');
      assert.equal(applicationName, 'yoursql');
    });

    it('handles successful set config', function() {
      var dataReturned;
      var settings = {key1: 'value1', key2: 'value2', key3: 'value3'};
      env.set_config('django', settings, function(evt) {
        dataReturned = evt;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        'request-id': msg['request-id'],
        response: {}
      });
      assert.strictEqual(dataReturned.err, undefined);
      assert.strictEqual(dataReturned.applicationName, 'django');
      assert.deepEqual(dataReturned.newValues, settings);
    });

    it('can destroy an application', function() {
      var applicationName = '';
      env.destroyApplication('mysql', function(evt) {
        applicationName = evt.applicationName;
      }, {immediate: true});
      var expected = {
        type: 'Application',
        version: 7,
        request: 'Destroy',
        params: {application: 'mysql'},
        'request-id': msg['request-id']
      };
      msg = conn.last_message();
      conn.msg({'request-id': msg['request-id']});
      assert.deepEqual(expected, msg);
      assert.equal(applicationName, 'mysql');
    });

    it('handles failures while destroying applications', function() {
      var err, applicationName;
      env.destroyApplication('yoursql', function(evt) {
        err = evt.err;
        applicationName = evt.applicationName;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        'request-id': msg['request-id'],
        error: 'app "yoursql" not found'
      });
      assert.equal(err, 'app "yoursql" not found');
      assert.equal(applicationName, 'yoursql');
    });

    it('sends the correct AddRelation message', function() {
      endpointA = ['haproxy', {name: 'reverseproxy'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, null, {immediate: true});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Application',
        version: 7,
        request: 'AddRelation',
        params: {endpoints: ['haproxy:reverseproxy', 'wordpress:website']},
        'request-id': 1
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('successfully adds a relation', function() {
      var endpoints, result;
      var jujuEndpoints = {};
      endpointA = ['haproxy', {name: 'reverseproxy'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, function(ev) {
        result = ev.result;
      }, {immediate: true});
      msg = conn.last_message();
      jujuEndpoints.haproxy = {
        name: 'reverseproxy',
        interface: 'http',
        scope: 'global',
        role: 'requirer'
      };
      jujuEndpoints.wordpress = {
        name: 'website',
        interface: 'http',
        scope: 'global',
        role: 'provider'
      };
      conn.msg({
        'request-id': msg['request-id'],
        response: {
          endpoints: jujuEndpoints
        }
      });
      assert.equal(result.id, 'haproxy:reverseproxy wordpress:website');
      assert.equal(result['interface'], 'http');
      assert.equal(result.scope, 'global');
      endpoints = result.endpoints;
      assert.deepEqual(endpoints[0], {'haproxy': {'name': 'reverseproxy'}});
      assert.deepEqual(endpoints[1], {'wordpress': {'name': 'website'}});
    });

    it('handles failed relation adding', function() {
      var evt;
      endpointA = ['haproxy', {name: 'reverseproxy'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, function(ev) {
        evt = ev;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        'request-id': msg['request-id'],
        error: 'cannot add relation'
      });
      assert.equal(evt.err, 'cannot add relation');
      assert.equal(evt.endpoint_a, 'haproxy:reverseproxy');
      assert.equal(evt.endpoint_b, 'wordpress:website');
    });

    it('sends the correct DestroyRelation message', function() {
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, null, {immediate: true});
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Application',
        version: 7,
        request: 'DestroyRelation',
        params: {endpoints: ['mysql:database', 'wordpress:website']},
        'request-id': 1
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('calls the ecs remove relation', function() {
      var lazy = utils.makeStubMethod(env.get('ecs'), '_lazyRemoveRelation');
      this._cleanups.push(lazy.reset);
      env.remove_relation([], [], function() {});
      assert.equal(lazy.calledOnce(), true);
    });

    it('successfully removes a relation', function() {
      var endpoint_a, endpoint_b;
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, function(ev) {
        endpoint_a = ev.endpoint_a;
        endpoint_b = ev.endpoint_b;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        'request-id': msg['request-id'],
        response: {}
      });
      assert.equal(endpoint_a, 'mysql:database');
      assert.equal(endpoint_b, 'wordpress:website');
    });

    it('handles failed attempt to remove a relation', function() {
      var endpoint_a, endpoint_b, err;
      endpointA = ['yoursql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, function(ev) {
        endpoint_a = ev.endpoint_a;
        endpoint_b = ev.endpoint_b;
        err = ev.err;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        'request-id': msg['request-id'],
        error: 'app "yoursql" not found'
      });
      assert.equal(endpoint_a, 'yoursql:database');
      assert.equal(endpoint_b, 'wordpress:website');
      assert.equal(err, 'app "yoursql" not found');
    });

    it('calls the ecs remove unit', function() {
      var lazy = utils.makeStubMethod(env.get('ecs'), '_lazyRemoveUnit');
      this._cleanups.push(lazy.reset);
      env.remove_units([], function() {});
      assert.equal(lazy.calledOnce(), true);
    });

    it('sends the correct CharmInfo message', function() {
      env.get_charm('cs:precise/wordpress-10');
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Charms',
        version: 3,
        request: 'CharmInfo',
        params: {'url': 'cs:precise/wordpress-10'},
        'request-id': 1
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('successfully retrieves information about a charm', function(done) {
      // Define a response example.
      var response = {
        config: {
          debug: {
            default: 'no',
            description: 'Setting this option to "yes" will ...',
            type: 'string'
          },
          engine: {
            default: 'nginx',
            description: 'Two web server engines are supported...',
            type: 'string'
          }
        },
        meta: {
          description: 'This will install and setup WordPress...',
          name: 'wordpress',
          peers: {
            loadbalancer: {
              interface: 'reversenginx',
              limit: 1,
              name: 'loadbalancer',
              role: 'peer',
              optional: false,
              scope: 'global'
            }
          },
          provides: {
            website: {
              interface: 'http',
              limit: 0,
              name: 'website',
              role: 'provider',
              optional: false,
              scope: 'global'
            }
          },
          requires: {
            cache: {
              interface: 'memcache',
              limit: 1,
              name: 'cache',
              role: 'requirer',
              optional: false,
              scope: 'global'
            },
            db: {
              interface: 'mysql',
              limit: 1,
              name: 'db',
              role: 'requirer',
              optional: false,
              scope: 'global'
            }
          },
          subordinate: false,
          summary: 'WordPress is a full featured web blogging tool...',
          series: ['xenial', 'trusty'],
          terms: ['term1', 'term2'],
          tags: ['applications', 'blog'],
          'min-juju-version': '2.0.42'
        },
        revision: 10,
        metrics: 'my metrics',
        url: 'cs:precise/wordpress-10'
      };
      // Define expected options.
      var options = response.config;
      var expectedOptions = {
        debug: {
          'default': options.debug.default,
          description: options.debug.description,
          type: options.debug.type,
        },
        engine: {
          'default': options.engine.default,
          description: options.engine.description,
          type: options.engine.type,
        }
      };
      // Define expected peers.
      var meta = response.meta;
      var peer = meta.peers.loadbalancer;
      var expectedPeers = {
        loadbalancer: {
          'interface': peer.interface,
          limit: peer.limit,
          name: peer.name,
          role: peer.role,
          optional: peer.optional,
          scope: peer.scope
        }
      };
      // Define expected provides.
      var provide = meta.provides.website;
      var expectedProvides = {
        website: {
          'interface': provide.interface,
          limit: provide.limit,
          name: provide.name,
          role: provide.role,
          optional: provide.optional,
          scope: provide.scope
        }
      };
      // Define expected requires.
      var require1 = meta.requires.cache;
      var require2 = meta.requires.db;
      var expectedRequires = {
        cache: {
          'interface': require1.interface,
          limit: require1.limit,
          name: require1.name,
          role: require1.role,
          optional: require1.optional,
          scope: require1.scope
        },
        db: {
          'interface': require2.interface,
          limit: require2.limit,
          name: require2.name,
          role: require2.role,
          optional: require2.optional,
          scope: require2.scope
        }
      };
      env.get_charm('cs:precise/wordpress-10', function(data) {
        var err = data.err,
            result = data.result;
        // Ensure the result is correctly generated.
        assert.strictEqual(err, undefined, 'error');
        assert.deepEqual(result.config, {options: expectedOptions}, 'config');
        assert.deepEqual(result.peers, expectedPeers, 'peers');
        assert.deepEqual(result.provides, expectedProvides, 'provides');
        assert.deepEqual(result.requires, expectedRequires, 'requires');
        // The result is enriched with additional info returned by juju-core.
        assert.equal(result.url, response.url, 'url');
        assert.equal(result.revision, response.revision, 'revision');
        assert.equal(result.description, meta.description, 'description');
        assert.equal(result.name, meta.name, 'name');
        assert.equal(result.subordinate, meta.subordinate, 'subordinate');
        assert.equal(result.summary, meta.summary, 'summary');
        assert.equal(
          result.minJujuVersion, meta['min-juju-version'], 'min-juju-version');
        assert.deepEqual(result.tags, meta.tags, 'tags');
        assert.deepEqual(result.series, meta.series, 'series');
        assert.deepEqual(result.terms, meta.terms, 'terms');
        assert.equal(result.metrics, response.metrics, 'metrics');
        done();
      });
      // Mimic response, assuming CharmInfo to be the first request.
      conn.msg({
        'request-id': 1,
        response: response
      });
    });

    it('handles failed attempt to retrieve charm info', function(done) {
      env.get_charm('cs:precise/wordpress-10', function(data) {
        assert.strictEqual(data.err, 'charm not found');
        assert.strictEqual(data.result, undefined);
        done();
      });
      // Mimic response, assuming CharmInfo to be the first request.
      conn.msg({
        'request-id': 1,
        error: 'charm not found'
      });
    });

    it('updates an application charm URL', function(done) {
      var args = {url: 'cs:wily/django-42'};
      env.updateApplication('django', args, function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'django');
        assert.strictEqual(data.url, args.url);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'Update',
          params: {
            application: 'django',
            'charm-url': args.url,
            'force-charm-url': false,
            'force-series': false,
          },
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('updates an application charm URL (force units)', function(done) {
      var args = {url: 'cs:wily/django-42', forceUnits: true};
      env.updateApplication('django', args, function(data) {
        assert.strictEqual(data.forceUnits, true);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'Update',
          params: {
            application: 'django',
            'charm-url': args.url,
            'force-charm-url': true,
            'force-series': false,
          },
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('updates an application charm URL (force series)', function(done) {
      var args = {url: 'cs:wily/django-42', forceSeries: true};
      env.updateApplication('django', args, function(data) {
        assert.strictEqual(data.forceSeries, true);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'Update',
          params: {
            application: 'django',
            'charm-url': args.url,
            'force-charm-url': false,
            'force-series': true
          },
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('updates an application settings', function(done) {
      var args = {settings: {'opt1': 'val1', 'opt2': 42}};
      env.updateApplication('django', args, function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'django');
        assert.deepEqual(data.settings, args.settings);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'Update',
          params: {
            application: 'django',
            settings: {'opt1': 'val1', 'opt2': '42'}
          },
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('updates an application constraints', function(done) {
      var args = {constraints: {'cpu-cores': '4', 'mem': 2000}};
      env.updateApplication('django', args, function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'django');
        assert.deepEqual(data.constraints, args.constraints);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'Update',
          params: {
            application: 'django',
            constraints: {'cpu-cores': 4, 'mem': 2000}
          },
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('updates an application minimum number of units', function(done) {
      var args = {minUnits: 2};
      env.updateApplication('django', args, function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'django');
        assert.strictEqual(data.minUnits, args.minUnits);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'Update',
          params: {
            application: 'django',
            'min-units': 2
          },
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('updates applications (multiple properties)', function(done) {
      var args = {
        url: 'cs:trusty/django-47',
        forceUnits: true,
        forceSeries: true,
        settings: {'opt1': 'val1', 'opt2': true},
        constraints: {'cpu-cores': 8},
        minUnits: 3
      };
      env.updateApplication('django', args, function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'django');
        assert.strictEqual(data.url, args.url);
        assert.strictEqual(data.forceUnits, true);
        assert.strictEqual(data.forceSeries, true);
        assert.deepEqual(data.settings, args.settings);
        assert.deepEqual(data.constraints, args.constraints);
        assert.strictEqual(data.minUnits, 3);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'Application',
          version: 7,
          request: 'Update',
          params: {
            application: 'django',
            'charm-url': args.url,
            'force-charm-url': true,
            'force-series': true,
            settings: {'opt1': 'val1', 'opt2': 'true'},
            constraints: args.constraints,
            'min-units': 3
          },
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
    });

    it('handles failures while updating applications', function(done) {
      env.updateApplication('django', {url: 'django-47'}, function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        assert.strictEqual(data.applicationName, 'django');
        assert.strictEqual(data.url, 'django-47');
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, error: 'bad wolf'});
    });

    it('provides for a missing Params', function() {
      // If no "Params" are provided in an RPC call an empty one is added.
      var op = {type: 'Client'};
      env._send_rpc(op);
      assert.deepEqual(op.params, {});
    });

    it('can watch all changes', function() {
      env._watchAll();
      msg = conn.last_message();
      assert.equal(msg.type, 'Client');
      assert.equal(msg.request, 'WatchAll');
    });

    it('can retrieve the next set of environment changes', function() {
      // This is normally set by _watchAll, we'll fake it here.
      env._allWatcherId = 42;
      env._next();
      msg = conn.last_message();
      assert.equal(msg.type, 'AllWatcher');
      assert.equal(msg.request, 'Next');
      assert.isTrue('id' in msg);
      // This response is in fact to the sent _next request.
      assert.equal(msg.id, env._allWatcherId);
    });

    it('stops the mega-watcher', function() {
      // This is normally set by _watchAll, we'll fake it here.
      env._allWatcherId = 42;
      // Make the request.
      var callback = utils.makeStubFunction();
      env._stopWatching(callback);
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
      // The callback has been called.
      assert.strictEqual(callback.calledOnce(), true, 'callback not');
      assert.strictEqual(env._allWatcherId, null);
      // The request has been properly sent.
      assert.deepEqual({
        'request-id': 1,
        type: 'AllWatcher',
        version: 0,
        request: 'Stop',
        id: 42,
        params: {}
      }, conn.last_message());
    });

    it('fires "_rpc_response" message after an RPC response', function(done) {
      // We don't want the real response, we just want to be sure the event is
      // fired.
      env.detach('_rpc_response');
      env.on('_rpc_response', function(data) {
        done();
      });
      // Calling this sets up the callback.
      env._next();
      env._txn_callbacks[env._counter].call(env, {});
      // The only test assertion is that done (above) is called.
    });

    it('fires "delta" when handling an RPC response', function(done) {
      env.detach('delta');
      var callbackData = {response: {deltas: [['application', 'deploy', {}]]}};
      env.on('delta', function(evt) {
        done();
      });
      env._handleRpcResponse(callbackData);
    });

    it('translates the type of each change in the delta', function(done) {
      env.detach('delta');
      var callbackData = {response: {deltas: [['application', 'deploy', {}]]}};
      env.on('delta', function(evt) {
        var change = evt.data.result[0];
        assert.deepEqual(['applicationInfo', 'deploy', {}], change);
        done();
      });
      env._handleRpcResponse(callbackData);
    });

    it('sorts deltas', function(done) {
      env.detach('delta');
      var callbackData = {
        response: {
          deltas: [
            ['annotation', 'change', {}],
            ['relation', 'change', {}],
            ['machine', 'change', {}],
            ['remoteapplication', 'change', {}],
            ['foobar', 'fake', {}],
            ['unit', 'change', {}],
            ['application', 'deploy', {}]
          ]
        }
      };
      env.on('delta', function(evt) {
        var change = evt.data.result.map(function(delta) {
          return delta[0];
        });
        assert.deepEqual([
          'applicationInfo',
          'relationInfo',
          'unitInfo',
          'machineInfo',
          'annotationInfo',
          'remoteapplicationInfo',
          'foobarInfo'
        ], change);
        done();
      });
      env._handleRpcResponse(callbackData);
    });

    it('the _rpc_response subscription can not have args', function() {
      var subscribers = env.getEvent('_rpc_response')._subscribers;
      // This test assumes that there is only one subscriber.  If we ever have
      // any more we will need to update this test.
      assert.equal(subscribers.length, 1);
      assert.equal(subscribers[0].args, null);
    });

    it('can resolve a problem with a unit', function() {
      var unit_name = 'mysql/0';
      env.resolved(unit_name);
      msg = conn.last_message();
      assert.equal(msg.type, 'Client');
      assert.equal(msg.request, 'Resolved');
      assert.equal(msg.params['unit-name'], 'mysql/0');
      assert.isFalse(msg.params.retry);
    });

    it('can retry a problem with a unit', function() {
      var unit_name = 'mysql/0';
      env.resolved(unit_name, null, true);
      msg = conn.last_message();
      assert.equal(msg.type, 'Client');
      assert.equal(msg.request, 'Resolved');
      assert.equal(msg.params['unit-name'], 'mysql/0');
      assert.isTrue(msg.params.retry);
    });

    it('can remove a unit', function() {
      var unit_name = 'mysql/0';
      env.remove_units([unit_name], null, {immediate: true});
      msg = conn.last_message();
      assert.equal(msg.type, 'Application');
      assert.equal(msg.request, 'DestroyUnits');
      assert.deepEqual(msg.params['unit-names'], ['mysql/0']);
    });

    it('can provide a callback', function(done) {
      var unit_name = 'mysql/0';
      env.resolved(unit_name, null, true, function(result) {
        assert.equal(result.op, 'resolved');
        assert.equal(result.err, 'badness');
        done();
      });
      msg = conn.last_message();
      env.dispatch_result({
        'request-id': msg['request-id'],
        error: 'badness',
        response: {}
      });
    });

    it('provides provider features for all supported providers', function() {
      var providers = [
        'all',
        'azure',
        'demonstration',
        'ec2',
        'joyent',
        'lxd',
        'maas',
        'openstack',
        'manual'
      ];
      var providerFeatures = Y.juju.environments.providerFeatures;
      providers.forEach(function(provider) {
        assert.equal(
            Y.Lang.isArray(providerFeatures[provider].supportedContainerTypes),
            true);
      });
    });

    it('requests the changes from Juju using a YAML', function() {
      var yaml = 'foo:\n  bar: baz';
      var callback = utils.makeStubFunction();
      env.getBundleChanges(yaml, null, callback);
      msg = conn.last_message();
      assert.deepEqual(msg, {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'GetBundleChanges',
        params: {yaml: yaml}
      });
    });

    it('ignores token requests for bundle changes', function() {
      var callback = utils.makeStubFunction();
      env.getBundleChanges(null, 'TOKEN', callback);
      msg = conn.last_message();
      assert.deepEqual(msg, {
        'request-id': 1,
        type: 'Client',
        version: 1,
        request: 'GetBundleChanges',
        params: {yaml: null}
      });
    });

    it('handles processing the bundle changes response', function() {
      var yaml = 'foo:\n  bar: baz';
      var callback = utils.makeStubFunction();
      env.getBundleChanges(yaml, null, callback);
      msg = conn.last_message();
      env.dispatch_result({
        'request-id': msg['request-id'],
        response: {changes: ['foo']}
      });
      assert.equal(callback.callCount(), 1);
      assert.deepEqual(callback.lastArguments()[0], {
        changes: ['foo'],
        errors: undefined
      });
    });

    it('handles bundle changes error response', function() {
      var yaml = 'foo:\n  bar: baz';
      var callback = utils.makeStubFunction();
      env.getBundleChanges(yaml, null, callback);
      msg = conn.last_message();
      env.dispatch_result({
        'request-id': msg['request-id'],
        response: {errors: ['bad wolf']}
      });
      assert.equal(callback.callCount(), 1);
      assert.deepEqual(callback.lastArguments()[0], {
        changes: undefined,
        errors: ['bad wolf']
      });
    });

    it('handles yaml parsing errors from the GUI server', function() {
      var yaml = 'foo:\n  bar: baz';
      var callback = utils.makeStubFunction();
      env.getBundleChanges(yaml, null, callback);
      msg = conn.last_message();
      env.dispatch_result({
        'request-id': msg['request-id'],
        error: 'bad wolf'
      });
      assert.equal(callback.callCount(), 1);
      assert.deepEqual(callback.lastArguments()[0], {
        changes: undefined,
        errors: ['bad wolf']
      });
    });

    it('handles errors on GUI server bundle deployments', function(done) {
      var yaml = 'foo:\n  bar: baz';
      env.getBundleChanges(yaml, null, function(data) {
        assert.strictEqual(data.changes, undefined);
        assert.deepEqual(data.errors, ['not implemented']);
        done();
      });
      // Mimic the first response to Client.GetBundleChanges (Juju).
      conn.msg({
        'request-id': 1,
        'error': 'not implemented'
      });
    });

    it('offers endpoints', function(done) {
      // Define the asynchronous callback.
      var callback = function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'django');
        assert.deepEqual(data.endpoints, ['web', 'cache']);
        assert.strictEqual(data.url, 'local:/u/mydjango');
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'CrossModelRelations',
          version: 1,
          request: 'Offer',
          params: {
            offers: [{
              applicationname: 'django',
              endpoints: ['web', 'cache'],
              applicationurl: 'local:/u/mydjango',
              allowedusers: ['user-dalek', 'user-cyberman'],
              applicationdescription: 'my description'
            }]
          },
          'request-id': 1
        });
        done();
      };

      // Perform the request.
      env.offer(
        'django', ['web', 'cache'], 'local:/u/mydjango', ['dalek', 'cyberman'],
        'my description', callback);

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{}]
        }
      });
    });

    it('offers endpoints without users and URL', function(done) {
      // Define the asynchronous callback.
      env.set('environmentName', 'myenv');
      var callback = function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'haproxy');
        assert.deepEqual(data.endpoints, ['proxy']);
        assert.strictEqual(data.url, 'local:/u/user/myenv/haproxy');
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'CrossModelRelations',
          version: 1,
          request: 'Offer',
          params: {
            offers: [{
              applicationname: 'haproxy',
              endpoints: ['proxy'],
              applicationurl: 'local:/u/user/myenv/haproxy',
              allowedusers: ['user-public'],
              applicationdescription: ''
            }]
          },
          'request-id': 1
        });
        done();
      };

      // Perform the request.
      env.offer('haproxy', ['proxy'], '', [], '', callback);

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{}]
        }
      });
    });

    it('handles request failures while offering endpoints', function(done) {
      var callback = function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        assert.strictEqual(data.applicationName, 'django');
        assert.deepEqual(data.endpoints, ['web', 'cache']);
        assert.strictEqual(data.url, 'local:/u/mydjango');
        done();
      };

      // Perform the request.
      env.offer(
        'django', ['web', 'cache'], 'local:/u/mydjango', ['dalek'],
        'my description', callback);

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{error: {
            message: 'bad wolf'
          }}]
        }
      });
    });

    it('handles API failures while offering endpoints', function(done) {
      var callback = function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        assert.strictEqual(data.applicationName, 'django');
        assert.deepEqual(data.endpoints, ['web', 'cache']);
        assert.strictEqual(data.url, 'local:/u/mydjango');
        done();
      };

      // Perform the request.
      env.offer(
        'django', ['web', 'cache'], 'local:/u/mydjango', ['dalek'],
        'my description', callback);

      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'bad wolf'
      });
    });

    it('lists offers', function(done) {
      // Perform the request.
      env.listOffers(null, function(data) {
        assert.strictEqual(data.err, undefined);
        assert.deepEqual(data.results, [
          {
            applicationName: 'mydjango',
            url: 'local:/u/who/my-env/django',
            charm: 'django',
            endpoints: [
              {
                name: 'website',
                interface: 'http',
                role: 'provider'
              }
            ]
          },
          {err: 'bad wolf'},
          {
            applicationName: 'haproxy',
            url: 'local:/u/dalek/ha',
            charm: 'cs:haproxy',
            endpoints: [
              {
                name: 'cache',
                interface: 'http',
                role: 'requirer'
              },
              {
                name: 'webproxy',
                interface: 'proxy',
                role: 'provider'
              }
            ]
          }
        ]);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'CrossModelRelations',
          version: 1,
          request: 'ListOffers',
          params: {
            filters: [{
              'filter-terms': []
            }]
          },
          'request-id': 1
        });
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: [
              {result: {
                applicationname: 'mydjango',
                applicationurl: 'local:/u/who/my-env/django',
                charmname: 'django',
                endpoints: [{
                  name: 'website',
                  interface: 'http',
                  role: 'provider',
                  limit: 0,
                  scope: 'global'
                }]
              }},
              {error: 'bad wolf'},
              {result: {
                applicationname: 'haproxy',
                applicationurl: 'local:/u/dalek/ha',
                charmname: 'cs:haproxy',
                endpoints: [{
                  name: 'cache',
                  interface: 'http',
                  role: 'requirer',
                  limit: 0,
                  scope: 'global'
                }, {
                  name: 'webproxy',
                  interface: 'proxy',
                  role: 'provider',
                  limit: 1,
                  scope: 'global'
                }]
              }}
            ]
          }]
        }
      });
    });

    it('handles failures while listing offers', function(done) {
      // Perform the request.
      env.listOffers(null, function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        assert.deepEqual(data.results, []);
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'bad wolf'
      });
    });

    it('retrieves details on an offer', function(done) {
      // Perform the request.
      var url = 'local:/u/admin/ec2/django';
      env.getOffer(url, function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.applicationName, 'django');
        assert.strictEqual(data.url, url);
        assert.strictEqual(data.description, 'these are the voyages');
        assert.strictEqual(data.sourceName, 'aws');
        assert.strictEqual(data.sourceId, 'uuid');
        assert.deepEqual(data.endpoints, [
          {name: 'cache', interface: 'http', role: 'requirer'},
          {name: 'webproxy', interface: 'proxy', role: 'provider'}
        ]);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'CrossModelRelations',
          version: 1,
          request: 'ApplicationOffers',
          params: {applicationurls: [url]},
          'request-id': 1
        });
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            result: {
              applicationname: 'django',
              applicationurl: url,
              applicationdescription: 'these are the voyages',
              sourcelabel: 'aws',
              sourceenviron: 'environment-uuid',
              endpoints: [{
                name: 'cache',
                interface: 'http',
                role: 'requirer',
                limit: 0,
                scope: 'global'
              }, {
                name: 'webproxy',
                interface: 'proxy',
                role: 'provider',
                limit: 1,
                scope: 'global'
              }]
            }
          }]
        }
      });
    });

    it('handles request failures while retrieving an offer', function(done) {
      // Perform the request.
      env.getOffer('local:/u/admin/aws/haproxy', function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        error: 'bad wolf'
      });
    });

    it('handles API failures while retrieving an offer', function(done) {
      // Perform the request.
      env.getOffer('local:/u/admin/aws/haproxy', function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        done();
      });

      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          results: [{
            error: {message: 'bad wolf'}
          }]
        }
      });
    });

    it('successfully creates a model', function(done) {
      env.createModel('mymodel', 'user-who@external', function(data) {
        assert.strictEqual(data.err, undefined);
        assert.strictEqual(data.name, 'mymodel');
        assert.strictEqual(data.uuid, 'unique-id');
        assert.strictEqual(data.owner, 'user-rose@external');
        assert.strictEqual(data.region, 'alpha-quadrant');
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'ModelManager',
          version: 2,
          request: 'CreateModel',
          params: {
            name: 'mymodel',
            'owner-tag': 'user-who@external',
            config: {
              'authorized-keys': 'ssh-rsa INVALID (set by the Juju GUI)'
            }
          },
          'request-id': 1
        });
        done();
      });
      // Mimic the response to ModelManager.CreateModel.
      conn.msg({
        'request-id': 1,
        response: {
          name: 'mymodel',
          uuid: 'unique-id',
          'owner-tag': 'user-rose@external',
          'cloud-region': 'alpha-quadrant'
        }
      });
    });

    it('adds local user domain when creating a model', function(done) {
      env.createModel('mymodel', 'user-cyberman', function(data) {
        assert.strictEqual(data.err, undefined);
        assert.equal(conn.messages.length, 1);
        var message = conn.last_message();
        assert.strictEqual(message.params['owner-tag'], 'user-cyberman@local');
        done();
      });
      // Mimic the response to ModelManager.CreateModel.
      conn.msg({
        'request-id': 1,
        response: {
          name: 'mymodel',
          uuid: 'unique-id',
          'owner-tag': 'user-rose@local',
          'cloud-region': 'delta-quadrant'
        }
      });
    });

    it('handles failures while creating models', function(done) {
      env.createModel('bad-model', 'user-dalek', function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        done();
      });
      // Mimic the response to ModelManager.CreateModel.
      conn.msg({'request-id': 1, error: 'bad wolf'});
    });

    it('lists models for a specific owner', function(done) {
      env.listModels('user-who', function(data) {
        assert.strictEqual(data.err, undefined);
        assert.deepEqual([
          {
            name: 'env1',
            tag: 'model-unique1',
            owner: 'user-who',
            uuid: 'unique1',
            lastConnection: 'today'
          },
          {
            name: 'env2',
            tag: 'model-unique2',
            owner: 'user-rose',
            uuid: 'unique2',
            lastConnection: 'yesterday'
          }
        ], data.envs);
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'ModelManager',
          version: 2,
          request: 'ListModels',
          params: {tag: 'user-who'},
          'request-id': 1
        });
        done();
      });
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {
          'user-models': [{
            model: {
              name: 'env1',
              'owner-tag': 'user-who',
              uuid: 'unique1'
            },
            'last-connection': 'today'
          }, {
            model: {
              name: 'env2',
              'owner-tag': 'user-rose',
              uuid: 'unique2'
            },
            'last-connection': 'yesterday'
          }]
        }
      });
    });

    it('handles failures while listing models', function(done) {
      env.listModels('user-dalek', function(data) {
        assert.strictEqual(data.err, 'bad wolf');
        done();
      });
      // Mimic response.
      conn.msg({'request-id': 1, error: 'bad wolf'});
    });

  });

})();
