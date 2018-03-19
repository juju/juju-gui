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
        'juju-tests-utils',
        'juju-env-api'
      ], function(Y) {
        juju = Y.namespace('juju');
        utils = Y.namespace('juju-tests.utils');
        machineJobs = Y.namespace('juju.environments').machineJobs;
        done();
      });
    });

    beforeEach(function() {
      const getMockStorage = function() {
        return new function() {
          return {
            store: {},
            setItem: function(name, val) { this.store['name'] = val; },
            getItem: function(name) { return this.store['name'] || null; }
          };
        };
      };
      const userClass = new window.jujugui.User(
        {sessionStorage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      conn = new utils.SocketStub();
      ecs = new juju.EnvironmentChangeSet();
      env = new juju.environments.GoEnvironment({
        conn: conn, user: userClass, ecs: ecs, modelUUID: 'uuid'
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
        KeyManager: [77],
        ModelConfig: [41, 42],
        ModelManager: [2],
        Pinger: [42],
        Resources: [4, 7]
      });
      env.set('modelUUID', 'this-is-a-uuid');
      this._cleanups.push(env.close.bind(env));
      cleanups = [];
    });

    afterEach(function() {
      cleanups.forEach(function(action) {action();});
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

    describe('close', () => {
      it('stops the pinger', function(done) {
        const originalClearInterval = clearInterval;
        clearInterval = sinon.stub();
        this._cleanups.push(() => {
          clearInterval = originalClearInterval;
        });
        env._pinger = 'I am the pinger';
        env.close(() => {
          assert.strictEqual(clearInterval.calledOnce, true);
          const pinger = clearInterval.getCall(0).args[0];
          assert.strictEqual(pinger, 'I am the pinger');
          assert.strictEqual(env._pinger, null);
          done();
        });
      });

      it('stops the mega-watcher', done => {
        env._allWatcherId = 42;
        let called = false;
        env._stopWatching = cb => {
          called = true;
          cb();
        };
        env.close(() => {
          assert.strictEqual(called, true);
          done();
        });
      });

      it('resets attributes', done => {
        env.setConnectedAttr('environmentName', 'test');
        env.close(() => {
          assert.strictEqual(env.get('environmentName'), null);
          done();
        });
      });

      it('properly disconnects the user', done => {
        env.userIsAuthenticated = true;
        env.close(() => {
          assert.strictEqual(env.userIsAuthenticated, false);
          done();
        });
      });
    });

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
        // XXX Due to https://bugs.launchpad.net/juju/+bug/1755580
        // the prepareConstraints method converts cpu-cores to cores. See
        // the method for more information.
        var constraints = env.prepareConstraints('tags=foo,bar cpu-cores=4');
        assert.deepEqual(constraints, {
          'cores': 4,
          'tags': ['foo', 'bar']
        });
      });

      it('converts integer constraints', function() {
        // XXX Due to https://bugs.launchpad.net/juju/+bug/1755580
        // the prepareConstraints method converts cpu-cores to cores. See
        // the method for more information.
        var constraints = env.prepareConstraints(
          {'root-disk': '800', 'cpu-cores': '4', mem: '2000'});
        assert.deepEqual(
          constraints, {'root-disk': 800, 'cores': 4, mem: 2000});
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
        // XXX Due to https://bugs.launchpad.net/juju/+bug/1755580
        // the prepareConstraints method converts cpu-cores to cores. See
        // the method for more information.
        var constraints = env.prepareConstraints({
          arch: undefined,
          tags: '',
          mem: ' ',
          'cpu-cores': 4,
          'cpu-power': null
        });
        assert.deepEqual(constraints, {'cores': 4});
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

      it('parses units on integer constraints', function() {
        let constraints = env.prepareConstraints(
          {'root-disk': '3m', mem: '5G'});
        assert.equal(constraints['root-disk'], 3,
          'Mebi unit not parsed properly');
        assert.equal(constraints.mem, 5120,
          'Gibi unit not parsed properly');
        constraints = env.prepareConstraints(
          {'root-disk': '4T', mem: '2p'});
        assert.equal(constraints['root-disk'], 4194304,
          'Tebi unit not parsed properly');
        assert.equal(constraints.mem, 2147483648,
          'Pebi unit not parsed properly');
      });

    });

    describe('login', function() {

      it('sends the correct login message', function() {
        noopHandleLogin();
        env.login();
        const lastMessage = conn.last_message();
        const expected = {
          type: 'Admin',
          request: 'Login',
          'request-id': 1,
          params: {'auth-tag': 'user-user@local', credentials: 'password'},
          version: 3
        };
        assert.deepEqual(expected, lastMessage);
      });

      it('sends the correct login message for external users', () => {
        noopHandleLogin();
        env.get('user').controller = {user: 'who@external', password: 'pswd'};
        env.login();
        const lastMessage = conn.last_message();
        const expected = {
          type: 'Admin',
          request: 'Login',
          'request-id': 1,
          params: {'auth-tag': 'user-who@external', credentials: 'pswd'},
          version: 3
        };
        assert.deepEqual(expected, lastMessage);
      });

      it('resets the user and password if they are not valid', function() {
        env.login();
        // Assume login to be the first request.
        conn.msg({'request-id': 1, error: 'Invalid user or password'});
        assert.deepEqual(
          env.get('user').controller,
          {user: '', password: '', macaroons: null});
        assert.isTrue(env.failedAuthentication);
      });

      it('fires a login event on successful login', function(done) {
        const listener = evt => {
          assert.strictEqual(evt.detail.err, null);
          done();
        };
        document.addEventListener('model.login', listener);
        env.login();
        // Assume login to be the first request.
        conn.msg({
          'request-id': 1,
          response: {
            'user-info': {},
            'model-tag': 'model-42',
            facades: [{name: 'ModelManager', versions: [2]}]
          }
        });
        document.removeEventListener('model.login', listener);
      });

      it('resets failed markers on successful login', function() {
        env.failedAuthentication = true;
        env.login();
        // Assume login to be the first request.
        conn.msg({
          'request-id': 1,
          response: {
            'user-info': {},
            'model-tag': 'model-42',
            facades: [{name: 'ModelManager', versions: [2]}]
          }
        });
        assert.isFalse(env.failedAuthentication);
      });

      it('fires a login event on failed login', function(done) {
        const listener = evt => {
          assert.strictEqual(evt.detail.err, 'Invalid user or password');
          done();
        };
        document.addEventListener('model.login', listener);
        env.login();
        // Assume login to be the first request.
        conn.msg({'request-id': 1, error: 'Invalid user or password'});
        document.removeEventListener('model.login', listener);
      });

      it('avoids sending login requests without credentials', function() {
        env.get('user').controller = {};
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
          type: 'Client',
          request: 'ModelInfo',
          // Note that facade version here is 0 because the login mock response
          // below is empty.
          version: 0,
          'request-id': 2,
          params: {}
        };
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
          'model-tag': 'model-42',
          'user-info': {'controller-access': 'login', 'model-access': 'read'}
        }});
        assert.strictEqual(env.get('controllerAccess'), 'login');
        assert.strictEqual(env.get('modelAccess'), 'read');
      });

      it('stores user information (legacy addmodel)', function() {
        env.login();
        // Assume login to be the first request.
        conn.msg({'request-id': 1, response: {
          facades: [
            {name: 'Client', versions: [0]},
            {name: 'ModelManager', versions: [2]}
          ],
          'model-tag': 'model-42',
          'user-info': {
            'controller-access': 'addmodel',
            'model-access': 'admin'
          }
        }});
        assert.strictEqual(env.get('controllerAccess'), 'add-model');
        assert.strictEqual(env.get('modelAccess'), 'admin');
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

      it('allows multiple login attempts if login is pending', function() {
        env.pendingLoginResponse = true;
        env.loginWithMacaroon();
        assert.strictEqual(conn.messages.length, 1, 'unexpected messages');
      });

      it('sends an initial login request without macaroons', function() {
        env.loginWithMacaroon(makeBakery());
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        assertRequest(conn.last_message());
      });

      it('sends an initial login request with macaroons', function() {
        env.get('user').controller = {macaroons: ['macaroon']};
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
        const bakery = makeBakery(function(macaroon, success, fail) {
          assert.strictEqual(macaroon, 'discharge-required-macaroon');
          success(['macaroon', 'discharge']);
        });
        env.loginWithMacaroon(bakery, callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        let requestId = assertRequest(conn.last_message());
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
            'model-tag': 'model-42',
            'user-info': {identity: 'user-who'},
            facades: [
              {name: 'Client', versions: [42, 47]},
              {name: 'ModelManager', versions: [2]}
            ]
          }
        });
        assert.strictEqual(error, null);
        const creds = env.get('user').controller;
        assert.strictEqual(creds.user, 'who@local');
        assert.strictEqual(creds.password, '');
        assert.deepEqual(creds.macaroons, ['macaroon', 'discharge']);
        assert.deepEqual(env.get('facades'), {
          Client: [42, 47],
          ModelManager: [2]
        });
      });

      it('succeeds with already stored macaroons', function() {
        env.get('user').controller = {
          macaroons: ['already stored', 'macaroons']};
        env.loginWithMacaroon(makeBakery(), callback);
        assert.strictEqual(conn.messages.length, 1, 'unexpected msg number');
        const requestId = assertRequest(
          conn.last_message(), ['already stored', 'macaroons']);
        conn.msg({
          'request-id': requestId,
          response: {
            'model-tag': 'model-42',
            'user-info': {identity: 'user-dalek'},
            facades: [
              {name: 'Client', versions: [0]},
              {name: 'ModelManager', versions: [2]}
            ]
          }
        });
        assert.strictEqual(error, null);
        const creds = env.get('user').controller;
        assert.strictEqual(creds.user, 'dalek@local');
        assert.strictEqual(creds.password, '');
        assert.deepEqual(creds.macaroons, ['already stored', 'macaroons']);
        assert.deepEqual(env.get('facades'), {
          Client: [0],
          ModelManager: [2]
        });
      });

    });

    describe('redirectInfo', function() {
      it('makes appropriate request to fetch model redirect info', function() {
        env.redirectInfo();
        var lastMessage = conn.last_message();
        var expected = {
          params: {},
          request: 'RedirectInfo',
          'request-id': 1,
          type: 'Admin',
          version: 3
        };
        assert.deepEqual(expected, lastMessage);
      });

      it('responds with only the server data if no error', function() {
        const callback = sinon.stub();
        env.redirectInfo(callback);
        conn.msg({ 'request-id': 1, response: { servers: 'servers' }});
        assert.equal(callback.callCount, 1);
        assert.deepEqual(callback.args[0], [null, 'servers']);
      });

      it('responds with the error if error', function() {
        const callback = sinon.stub();
        env.redirectInfo(callback);
        conn.msg({ 'request-id': 1, response: { error: 'error' }});
        assert.equal(callback.callCount, 1);
        assert.deepEqual(callback.args[0][0], 'error');
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
      env.currentModelInfo();
      var lastMessage = conn.last_message();
      var expected = {
        type: 'Client',
        request: 'ModelInfo',
        version: 1,
        'request-id': 1,
        params: {}
      };
      assert.deepEqual(expected, lastMessage);
    });

    it('logs an error on current model info errors', function() {
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      // Mock "console.error" so that it is possible to collect logged errors.
      var original = console.error;
      var err = null;
      console.error = function(msg) {
        err = msg;
      };
      // Assume currentModelInfo to be the first request.
      conn.msg({'request-id': 1, error: 'bad wolf'});
      assert.strictEqual(
        err, 'error retrieving current model information: bad wolf');
      // Restore the original "console.error".
      console.error = original;
    });

    it('stores model info into env attributes', function() {
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      // Assume currentModelInfo to be the first request.
      conn.msg({
        'request-id': 1,
        response: {
          'agent-version': '2.42.47',
          'default-series': 'xenial',
          name: 'my-model',
          'provider-type': 'aws',
          'cloud-tag': 'cloud-aws',
          'cloud-region': 'us-east-1',
          'cloud-credential-tag': 'cloudcred-aws_admin@local_aws',
          uuid: '5bea955d-7a43-47d3-89dd-tag1',
          life: 'alive',
          'owner-tag': 'user-admin@local',
          sla: {owner: 'who', level: 'standard'}
        }
      });
      assert.strictEqual(env.get('defaultSeries'), 'xenial');
      assert.strictEqual(env.get('providerType'), 'aws');
      assert.strictEqual(env.get('environmentName'), 'my-model');
      assert.strictEqual(env.get('modelOwner'), 'admin@local');
      assert.strictEqual(env.get('modelUUID'), '5bea955d-7a43-47d3-89dd-tag1');
      assert.strictEqual(env.get('cloud'), 'aws');
      assert.strictEqual(env.get('region'), 'us-east-1');
      assert.strictEqual(env.get('credential'), 'aws_admin@local_aws');
      assert.strictEqual(env.get('sla'), 'standard');
      assert.strictEqual(env.get('version'), '2.42.47');
    });

    it('handles no cloud credential returned by ModelInfo', function() {
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      // Assume currentModelInfo to be the first request.
      conn.msg({
        'request-id': 1,
        response: {
          'default-series': 'xenial',
          name: 'my-model',
          'provider-type': 'aws',
          'cloud-tag': 'cloud-aws',
          'cloud-region': 'us-east-1',
          uuid: '5bea955d-7a43-47d3-89dd-tag1',
          life: 'alive',
          'owner-tag': 'user-admin@local'
        }
      });
      assert.strictEqual(env.get('credential'), '');
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
          'default-series': 'xenial',
          name: 'my-model',
          'provider-type': 'maas',
          uuid: '5bea955d-7a43-47d3-89dd-tag1',
          life: 'alive',
          'owner-tag': 'user-admin@local',
          'cloud-tag': 'cloud-maas',
          'cloud-credential-tag': 'cloudcred-admin'
        }
      });
      conn.msg({'request-id': 2, error: 'bad wolf'});
      assert.strictEqual(warning, 'error calling ModelGet API: bad wolf');
      // Restore the original "console.warn".
      console.warn = original;
    });

    it('stores the MAAS server on ModelGet results on MAAS', function() {
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      conn.msg({
        'request-id': 1,
        response: {
          'default-series': 'xenial',
          name: 'my-model',
          'provider-type': 'maas',
          uuid: '5bea955d-7a43-47d3-89dd-tag1',
          life: 'alive',
          'owner-tag': 'user-admin@local',
          'cloud-tag': 'cloud-maas',
          'cloud-credential-tag': 'cloudcred-admin'
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

    it('does not assume MAAS server on ModelGet results on MAAS', function() {
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      conn.msg({
        'request-id': 1,
        response: {
          'default-series': 'xenial',
          name: 'my-model',
          'provider-type': 'maas',
          uuid: '5bea955d-7a43-47d3-89dd-tag1',
          life: 'alive',
          'owner-tag': 'user-admin@local',
          'cloud-tag': 'cloud-maas',
          'cloud-credential-tag': 'cloudcred-admin'
        }
      });
      conn.msg({
        'request-id': 2,
        response: {config: {}}
      });
      assert.strictEqual(env.get('maasServer'), null);
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
      assert.strictEqual(env.get('maasServer'), null);
    });

    it('calls ModelGet after ModelInfo on MAAS', function() {
      // Simulate a ModelInfo request/response.
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      conn.msg({
        'request-id': 1,
        response: {
          'default-series': 'xenial',
          name: 'my-model',
          'provider-type': 'maas',
          uuid: '5bea955d-7a43-47d3-89dd-tag1',
          life: 'alive',
          'owner-tag': 'user-admin@local',
          'cloud-tag': 'cloud-maas',
          'cloud-credential-tag': 'cloudcred-admin'
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
      assert.strictEqual(env.get('maasServer'), null);
      // Simulate a ModelInfo request/response.
      env.currentModelInfo(env._handleCurrentModelInfo.bind(env));
      conn.msg({
        'request-id': 1,
        response: {
          'default-series': 'xenial',
          name: 'my-model',
          'provider-type': 'aws',
          uuid: '5bea955d-7a43-47d3-89dd-tag1',
          'controller-uuid': '5bea955d-7a43-47d3-89dd-tag1',
          life: 'alive',
          'owner-tag': 'user-admin@local',
          'cloud-tag': 'cloud-aws',
          'cloud-credential-tag': 'cloudcred-admin'
        }
      });
      assert.lengthOf(conn.messages, 1);
      // The MAAS server attribute has been set to null.
      assert.strictEqual(env.get('maasServer'), null);
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
      let jujuConfig;

      beforeEach(function() {
        jujuConfig = window.juju_config;
      });

      afterEach(function() {
        window.juju_config = jujuConfig;
      });

      it('uses the correct endpoint when served from juju', function() {
        window.juju_config = { staticURL: '/static-url'};
        env.userIsAuthenticated = true;
        var mockWebHandler = {sendPostRequest: sinon.stub()};
        env.set('webHandler', mockWebHandler);
        env.uploadLocalCharm(
          'a zip file', 'trusty',
          function() {return 'progress';},
          function() {return 'completed';});
        // Ensure the web handler's sendPostRequest method has been called with
        // the correct charm endpoint
        var lastArguments = mockWebHandler.sendPostRequest.lastCall.args;
        assert.strictEqual(
          lastArguments[0],
          '/model/this-is-a-uuid/charms?series=trusty'); // Path.
      });

      it('prevents non authorized users from sending files', function(done) {
        env.userIsAuthenticated = false;
        const listener = evt => {
          assert.deepEqual(evt.detail.err, 'cannot upload files anonymously');
          done();
        };
        document.addEventListener('model.login', listener);
        env.uploadLocalCharm();
        document.removeEventListener('model.login', listener);
      });

      it('uses the stored webHandler to perform requests', function() {
        env.userIsAuthenticated = true;
        const mockWebHandler = {sendPostRequest: sinon.stub()};
        env.set('webHandler', mockWebHandler);
        env.uploadLocalCharm(
          'a zip file', 'trusty',
          function() {return 'progress';},
          function() {return 'completed';});
        // Ensure the web handler's sendPostRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendPostRequest.callCount, 1);
        const lastArguments = mockWebHandler.sendPostRequest.lastCall.args;
        assert.strictEqual(lastArguments.length, 7);
        assert.strictEqual(
          lastArguments[0],
          '/juju-core/model/this-is-a-uuid/charms?series=trusty'); // Path.
        assert.deepEqual(
          lastArguments[1], {'Content-Type': 'application/zip'}); // Headers.
        assert.strictEqual(lastArguments[2], 'a zip file'); // Zip file object.
        assert.strictEqual(lastArguments[3], 'user-user@local'); // User name.
        assert.strictEqual(lastArguments[4], 'password'); // Password.
        assert.strictEqual(
          lastArguments[5](), 'progress'); // Progress callback.
        assert.strictEqual(
          lastArguments[6](), 'completed'); // Completed callback.
      });

    });

    describe('getLocalCharmFileUrl', function() {
      it('uses the stored webHandler to retrieve the file URL', function() {
        const mockWebHandler = {getUrl: sinon.stub().returns('myurl')};
        env.set('webHandler', mockWebHandler);
        const url = env.getLocalCharmFileUrl(
          'local:trusty/django-42', 'icon.svg');
        assert.strictEqual(url, 'myurl');
        // Ensure the web handler's getUrl method has been called with the
        // expected arguments.
        assert.strictEqual(mockWebHandler.getUrl.callCount, 1);
        const lastArguments = mockWebHandler.getUrl.lastCall.args;
        assert.lengthOf(lastArguments, 3);
        const expected = '/juju-core/model/this-is-a-uuid/charms?' +
            'url=local:trusty/django-42&file=icon.svg';
        assert.strictEqual(lastArguments[0], expected);
        assert.strictEqual(lastArguments[1], 'user-user@local'); // User name.
        assert.strictEqual(lastArguments[2], 'password'); // Password.
      });
    });

    describe('getLocalCharmIcon', function() {
      it('uses the stored webHandler to retrieve the icon URL', function() {
        const mockWebHandler = {getUrl: sinon.stub().returns('myurl')};
        env.set('webHandler', mockWebHandler);
        const url = env.getLocalCharmIcon('local:trusty/django-2', 'icon.svg');
        assert.strictEqual(url, 'myurl');
        // Ensure the web handler's getUrl method has been called with the
        // expected arguments.
        assert.strictEqual(mockWebHandler.getUrl.callCount, 1);
        const lastArguments = mockWebHandler.getUrl.lastCall.args;
        assert.strictEqual(lastArguments.length, 3);
        const expected = '/juju-core/model/this-is-a-uuid/charms?' +
            'url=local:trusty/django-2&icon=1';
        assert.strictEqual(lastArguments[0], expected);
        assert.strictEqual(lastArguments[1], 'user-user@local'); // User name.
        assert.strictEqual(lastArguments[2], 'password'); // Password.
      });
    });

    describe('listLocalCharmFiles', function() {

      it('uses the stored webHandler to retrieve the contet', function() {
        const mockWebHandler = {sendGetRequest: sinon.stub()};
        env.set('webHandler', mockWebHandler);
        env.listLocalCharmFiles(
          'local:trusty/django-42',
          function() {return 'progress';},
          function() {return 'completed';});
        // Ensure the web handler's sendGetRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendGetRequest.callCount, 1);
        const lastArguments = mockWebHandler.sendGetRequest.lastCall.args;
        assert.lengthOf(lastArguments, 6);
        const expected = '/juju-core/model/this-is-a-uuid/charms' +
            '?url=local:trusty/django-42';
        assert.strictEqual(lastArguments[0], expected);
        assert.deepEqual(lastArguments[1], {}); // Headers.
        assert.strictEqual(lastArguments[2], 'user-user@local'); // User name.
        assert.strictEqual(lastArguments[3], 'password'); // Password.
        assert.strictEqual(
          lastArguments[4](), 'progress'); // Progress callback.
        assert.strictEqual(
          lastArguments[5](), 'completed'); // Completed callback.
      });

    });

    describe('getLocalCharmFileContents', function() {

      it('uses the stored webHandler to retrieve the contents', function() {
        const mockWebHandler = {sendGetRequest: sinon.stub()};
        env.set('webHandler', mockWebHandler);
        env.getLocalCharmFileContents(
          'local:trusty/django-42', 'hooks/install',
          function() {return 'progress';},
          function() {return 'completed';});
        // Ensure the web handler's sendGetRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendGetRequest.callCount, 1);
        const lastArguments = mockWebHandler.sendGetRequest.lastCall.args;
        assert.lengthOf(lastArguments, 6);
        const expected = '/juju-core/model/this-is-a-uuid/charms?' +
            'url=local:trusty/django-42&file=hooks/install';
        assert.strictEqual(lastArguments[0], expected);
        assert.deepEqual(lastArguments[1], {}); // Headers.
        assert.strictEqual(lastArguments[2], 'user-user@local'); // User name.
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
      let err, url;
      const charmstore = {};
      env.addCharm('wily/django-42', charmstore, function(data) {
        err = data.err;
        url = data.url;
      }, {immediate: true});
      const expectedMessage = {
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

    it('successfully adds a charm with authorization', function() {
      let err, url;
      const charmstore = {
        getDelegatableMacaroon: (url, callback) => {
          callback(null, `macaroon for adding ${url}`);
        }
      };
      env.addCharm('trusty/django-0', charmstore, function(data) {
        err = data.err;
        url = data.url;
      }, {immediate: true});
      // Mimic responses.
      conn.msg({
        'request-id': 1,
        error: 'bad wolf',
        'error-code': 'unauthorized access'
      });
      conn.msg({'request-id': 2, response: {}});
      const expectedMessages = [{
        type: 'Client',
        version: 1,
        request: 'AddCharm',
        params: {url: 'trusty/django-0'},
        'request-id': 1
      }, {
        type: 'Client',
        request: 'AddCharmWithAuthorization',
        version: 1,
        params: {
          macaroon: 'macaroon for adding trusty/django-0',
          url: 'trusty/django-0'
        },
        'request-id': 2
      }];
      assert.deepEqual(expectedMessages, conn.messages);
      assert.strictEqual(url, 'trusty/django-0');
      assert.strictEqual(err, undefined);
    });

    it('fails adding charm for authorization errors', function() {
      let err, url;
      const charmstore = {
        getDelegatableMacaroon: (url, callback) => {
          callback(null, `macaroon for adding ${url}`);
        }
      };
      env.addCharm('trusty/django-0', charmstore, function(data) {
        err = data.err;
        url = data.url;
      }, {immediate: true});
      // Mimic responses.
      conn.msg({
        'request-id': 1,
        error: 'first bad wolf',
        'error-code': 'unauthorized access'
      });
      conn.msg({'request-id': 2, error: 'second bad wolf'});
      assert.strictEqual(url, 'trusty/django-0');
      assert.strictEqual(err, 'second bad wolf');
    });

    it('fails adding charm for macaraq errors', function() {
      let err, url;
      const charmstore = {
        getDelegatableMacaroon: (url, callback) => {
          callback('macaraq bad wolf', null);
        }
      };
      env.addCharm('trusty/django-0', charmstore, function(data) {
        err = data.err;
        url = data.url;
      }, {immediate: true});
      // Mimic responses.
      conn.msg({
        'request-id': 1,
        error: 'first bad wolf',
        'error-code': 'unauthorized access'
      });
      assert.strictEqual(url, 'trusty/django-0');
      assert.strictEqual(err, 'macaraq bad wolf');
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

    describe('addPendingResources', function() {
      it('adds to the ecs on the public method', () => {
        const stub = sinon.stub(env.get('ecs'), 'lazyAddPendingResources');
        env.addPendingResources({
          applicationName: 'wordpress',
          charmURL: 'wordpress-42',
          channel: 'stable',
          resources: []
        });
        assert.equal(stub.callCount, 1);
      });
      it('uploads resources', done => {
        // Perform the request.
        const resources = [
          {Name: 'res1', File: 'res1.tgz'},
          {Name: 'res2', File: 'res2.tgz'}
        ];
        env._addPendingResources({
          applicationName: 'wordpress',
          charmURL: 'wordpress-42',
          channel: 'stable',
          resources: resources
        }, (err, ids) => {
          assert.strictEqual(err, null);
          assert.deepEqual(ids, {res1: 'id-res-1', res2: 'id-res-2'});
          assert.strictEqual(conn.messages.length, 1);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            type: 'Resources',
            version: 7,
            request: 'AddPendingResources',
            params: {
              tag: 'application-wordpress',
              url: 'wordpress-42',
              channel: 'stable',
              resources: [{
                Name: 'res1', File: 'res1.tgz', Origin: 'store'
              }, {
                Name: 'res2', File: 'res2.tgz', Origin: 'store'
              }]
            },
            'request-id': 1
          });
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {'pending-ids': ['id-res-1', 'id-res-2']}
        });
      });

      it('uploads a single resource', done => {
        // Perform the request.
        env._addPendingResources({
          applicationName: 'hap',
          charmURL: 'cs:xenial/haproxy-47',
          channel: 'beta',
          resources: [{Name: 'myres', File: 'myres.tar.bz2'}]
        }, (err, ids) => {
          assert.strictEqual(err, null);
          assert.deepEqual(ids, {myres: 'id-res-1'});
          assert.strictEqual(conn.messages.length, 1);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            type: 'Resources',
            version: 7,
            request: 'AddPendingResources',
            params: {
              tag: 'application-hap',
              url: 'cs:xenial/haproxy-47',
              channel: 'beta',
              resources: [{
                Name: 'myres', File: 'myres.tar.bz2', Origin: 'store'
              }]
            },
            'request-id': 1
          });
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {'pending-ids': ['id-res-1']}
        });
      });

      it('uploads resources with origin', done => {
        // Perform the request.
        env._addPendingResources({
          applicationName: 'haproxy',
          charmURL: 'xenial/haproxy-47',
          resources: [{Name: 'myres', File: 'myres.tar.bz2', Origin: 'Vulcan'}]
        }, (err, ids) => {
          assert.strictEqual(err, null);
          assert.deepEqual(ids, {myres: 'id-res-vulcan'});
          assert.strictEqual(conn.messages.length, 1);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            type: 'Resources',
            version: 7,
            request: 'AddPendingResources',
            params: {
              tag: 'application-haproxy',
              url: 'xenial/haproxy-47',
              channel: 'stable',
              resources: [{
                Name: 'myres', File: 'myres.tar.bz2', Origin: 'Vulcan'
              }]
            },
            'request-id': 1
          });
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {'pending-ids': ['id-res-vulcan']}
        });
      });

      it('fails when no application name is provided', done => {
        // Perform the request.
        const args = {
          charmURL: 'cs:xenial/haproxy-47',
          channel: 'beta',
          resources: [{Name: 'myres', File: 'myres.tar.bz2'}]
        };
        env._addPendingResources(args, (err, ids) => {
          assert.equal(err, 'invalid arguments: ' + JSON.stringify(args));
          assert.deepEqual(ids, {});
          done();
        });
      });

      it('fails when no charm URL is provided', done => {
        // Perform the request.
        const args = {
          applicationName: 'wordpress',
          charmURL: '',
          channel: 'candidate',
          resources: [{Name: 'myres', File: 'myres.tar.bz2'}]
        };
        env._addPendingResources(args, (err, ids) => {
          assert.equal(err, 'invalid arguments: ' + JSON.stringify(args));
          assert.deepEqual(ids, {});
          done();
        });
      });

      it('fails when no resources are provided', done => {
        // Perform the request.
        const args = {
          applicationName: 'wordpress',
          charmURL: 'wordpress-42',
          resources: []
        };
        env._addPendingResources(args, (err, ids) => {
          assert.equal(err, 'invalid arguments: ' + JSON.stringify(args));
          assert.deepEqual(ids, {});
          done();
        });
      });

      it('fails when invalid resources are provided', done => {
        // Perform the request.
        env._addPendingResources({
          applicationName: 'wordpress',
          charmURL: 'wordpress-42',
          resources: [{File: 'bad'}]
        }, (err, ids) => {
          assert.equal(err, 'resource without name: [{"File":"bad"}]');
          assert.deepEqual(ids, {});
          done();
        });
      });

      it('handles global failures while adding resources', done => {
        // Perform the request.
        env._addPendingResources({
          applicationName: 'redis',
          charmURL: 'redis-0',
          resources: [{Name: 'red', File: 'red.tgz'}]
        }, (err, ids) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(ids, {});
          done();
        });
        // Mimic response.
        conn.msg({'request-id': 1, error: 'bad wolf'});
      });

      it('handles local failures while adding resources', done => {
        // Perform the request.
        env._addPendingResources({
          applicationName: 'redis',
          charmURL: 'redis-0',
          resources: [{Name: 'red', File: 'red.tgz'}]
        }, (err, ids) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(ids, {});
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {error: {message: 'bad wolf'}}
        });
      });

      it('handles unexpected failures while adding resources', done => {
        // Perform the request.
        env._addPendingResources({
          applicationName: 'redis',
          charmURL: 'redis-0',
          resources: [{Name: 'red', File: 'red.tgz'}]
        }, (err, ids) => {
          assert.strictEqual(err, 'unexpected response: {"pending-ids":[]}');
          assert.deepEqual(ids, {});
          done();
        });
        // Mimic response.
        conn.msg({'request-id': 1, response: {'pending-ids': []}});
      });
    });

    describe('setCharm', function() {

      it('sends message to change the charm version', function() {
        var applicationName = 'rethinkdb';
        var charmUrl = 'trusty/rethinkdb-1';
        var forceUnits = false;
        var forceSeries = true;
        var cb = sinon.stub();
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
        assert.equal(cb.callCount, 1);
        assert.deepEqual(cb.lastCall.args, [{
          err: undefined,
          applicationName: applicationName,
          charmUrl: charmUrl
        }]);
      });

    });

    it('successfully deploys an application', function() {
      env.deploy({
        charmURL: 'precise/mysql',
        applicationName: 'mysql',
        series: 'trusty',
        numUnits: 1
      }, null, {immediate: true});
      msg = conn.last_message();
      const expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: 'mysql',
          constraints: {},
          'charm-url': 'precise/mysql',
          'num-units': 1,
          series: 'trusty',
          resources: {}
        }]},
        'request-id': 1
      };
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys an application with a config object', function() {
      const config = {debug: true, logo: 'example.com/mylogo.png'};
      const expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: 'wiki',
          // Configuration values are sent as strings.
          config: {debug: 'true', logo: 'example.com/mylogo.png'},
          constraints: {},
          'charm-url': 'precise/mediawiki',
          'num-units': 0,
          resources: {}
        }]},
        'request-id': 1
      };
      env.deploy({
        charmURL: 'precise/mediawiki',
        applicationName: 'wiki',
        config: config
      }, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys an application with a config file', function() {
      const configRaw = 'tuning-level: \nexpert-mojo';
      const expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: 'mysql',
          constraints: {},
          'config-yaml': configRaw,
          'charm-url': 'precise/mysql',
          'num-units': 0,
          resources: {}
        }]},
        'request-id': 1
      };
      env.deploy({
        charmURL: 'precise/mysql',
        applicationName: 'mysql',
        configRaw: configRaw
      }, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('the raw config takes precedence over the config object', function() {
      const config = {debug: true, logo: 'example.com/mylogo.png'};
      const configRaw = 'tuning-level: \nexpert-mojo';
      const expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: 'wiki',
          'config-yaml': configRaw,
          constraints: {},
          'charm-url': 'precise/mediawiki',
          'num-units': 0,
          resources: {}
        }]},
        'request-id': 1
      };
      env.deploy({
        charmURL: 'precise/mediawiki',
        applicationName: 'wiki',
        config: config,
        configRaw: configRaw
      }, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys an application with constraints', function() {
      const constraints = {
        'cpu-cores': 1,
        'cpu-power': 0,
        mem: '512M',
        arch: 'i386',
        'root-disk': '8000',
        tags: 'tag1,tag2'
      };
      env.deploy({
        charmURL: 'xenial/mediawiki',
        applicationName: 'mediawiki',
        numUnits: 1,
        constraints: constraints
      }, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(msg.params.applications[0].constraints, {
        'cores': 1,
        'cpu-power': 0,
        mem: 512,
        arch: 'i386',
        'root-disk': 8000,
        tags: ['tag1', 'tag2']
      });
    });

    it('successfully deploys an application with resources', function() {
      const resources = {myresource: 'pending-resource-id'};
      const expected = {
        type: 'Application',
        request: 'Deploy',
        version: 7,
        params: {applications: [{
          application: 'wiki',
          constraints: {},
          'charm-url': 'precise/mediawiki',
          'num-units': 7,
          resources: resources
        }]},
        'request-id': 1
      };
      env.deploy({
        charmURL: 'precise/mediawiki',
        applicationName: 'wiki',
        numUnits: 7,
        resources: resources
      }, null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('deploys an application storing charm data', function(done) {
      env.deploy({
        charmURL: 'precise/mysql',
        applicationName: 'mysql',
        series: 'trusty',
        numUnits: 1
      }, (err, applicationName, charmURL) => {
        assert.strictEqual(err, null);
        assert.strictEqual(applicationName, 'mysql');
        assert.strictEqual(charmURL, 'precise/mysql');
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{}]}
      });
    });

    it('handles failed application deployments', function(done) {
      env.deploy({
        charmURL: 'precise/mysql',
        applicationName: 'mysql',
        series: 'trusty',
        numUnits: 1
      }, (err, applicationName, charmURL) => {
        assert.strictEqual(err, 'bad wolf');
        assert.strictEqual(applicationName, '');
        assert.strictEqual(charmURL, '');
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        'request-id': 1,
        response: {results: [{error: {message: 'bad wolf'}}]}
      });
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
      var constraints = {'cores': 4, 'mem': 4000};
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
      const msg = conn.last_message();
      const expected = {
        type: 'Annotations',
        version: 2,
        request: 'Get',
        'request-id': 1,
        params: {entities: [{tag: 'application-apache'}]}
      };
      assert.deepEqual(msg, expected);
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
      var lazy = sinon.stub(env.get('ecs'), 'lazyRemoveRelation');
      this._cleanups.push(lazy.restore);
      env.remove_relation([], [], function() {});
      assert.equal(lazy.calledOnce, true);
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
      var lazy = sinon.stub(env.get('ecs'), 'lazyRemoveUnit');
      this._cleanups.push(lazy.restore);
      env.remove_units([], function() {});
      assert.equal(lazy.calledOnce, true);
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
          type: options.debug.type
        },
        engine: {
          'default': options.engine.default,
          description: options.engine.description,
          type: options.engine.type
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
            'force-series': false
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
            'force-series': false
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
            constraints: {'cores': 4, 'mem': 2000}
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
        constraints: {'cores': 8},
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
      var callback = sinon.stub();
      env._stopWatching(callback);
      // Mimic response.
      conn.msg({'request-id': 1, response: {}});
      // The callback has been called.
      assert.strictEqual(callback.calledOnce, true, 'callback not');
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
      document.removeEventListener(
        '_rpc_response', env._handleRpcResponseBound);
      const handler = evt => {
        document.removeEventListener('_rpc_response', handler);
        done();
      };
      document.addEventListener('_rpc_response', handler);
      // Calling this sets up the callback.
      env._next();
      env._txn_callbacks[env._counter].call(env, {});
      // The only test assertion is that done (above) is called.
    });

    it('fires "delta" when handling an RPC response', function(done) {
      var callbackData = {response: {deltas: [['application', 'deploy', {}]]}};
      const handler = () => {
        document.removeEventListener('delta', handler);
        done();
      };
      document.addEventListener('delta', handler);
      env._handleRpcResponse({detail: callbackData});
    });

    it('translates the type of each change in the delta', function(done) {
      var callbackData = {response: {deltas: [['application', 'deploy', {}]]}};
      const handler = evt => {
        document.removeEventListener('delta', handler);
        const change = evt.detail.data.result[0];
        assert.deepEqual(['applicationInfo', 'deploy', {}], change);
        done();
      };
      document.addEventListener('delta', handler);
      env._handleRpcResponse({detail: callbackData});
    });

    it('sorts deltas', function(done) {
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
      const handler = evt => {
        document.removeEventListener('delta', handler);
        const change = evt.detail.data.result.map(function(delta) {
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
      };
      document.addEventListener('delta', handler);
      env._handleRpcResponse({detail: callbackData});
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
          Array.isArray(providerFeatures[provider].supportedContainerTypes),
          true);
      });
    });

    describe('addKeys', function() {
      it('calls the ecs add keys', function() {
        var lazy = sinon.stub(env.get('ecs'), 'lazyAddSSHKeys');
        this._cleanups.push(lazy.restore);
        env.addKeys([], [], function() {});
        assert.equal(lazy.calledOnce, true);
      });

      it('adds a single key', function(done) {
        // Perform the request.
        env.addKeys('who', ['ssh-rsa key1'], (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, [null]);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'KeyManager',
            request: 'AddKeys',
            version: 77,
            params: {user: 'who', 'ssh-keys': ['ssh-rsa key1']}
          });
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {
            results: [{}]
          }
        });
      });

      it('adds multiple keys', function(done) {
        // Perform the request.
        env.addKeys('who', ['ssh-rsa key1', 'ssh-rsa key2'], (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, [null, null]);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'KeyManager',
            request: 'AddKeys',
            version: 77,
            params: {
              user: 'who',
              'ssh-keys': ['ssh-rsa key1', 'ssh-rsa key2']
            }
          });
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {
            results: [{}, {}]
          }
        });
      });

      it('adds no keys', function(done) {
        // Perform the request.
        env.addKeys('who', [], (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
      });

      it('handles errors when no user is provided', function(done) {
        // Perform the request.
        env.addKeys('', ['ssh-rsa key1'], (err, errors) => {
          assert.strictEqual(err, 'no user provided');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
      });

      it('handles request failures while adding keys', function(done) {
        // Perform the request.
        env.addKeys('who', ['ssh-rsa key1'], (err, errors) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({'request-id': 1, error: 'bad wolf'});
      });

      it('handles API failures while adding keys', function(done) {
        // Perform the request.
        const keys = ['ssh-rsa key1', 'ssh-rsa key2', 'ssh-rsa key3'];
        env.addKeys('dalek', keys, (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, [null, 'bad wolf', null]);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {
            results: [{}, {error: {message: 'bad wolf'}}, {}]
          }
        });
      });

      it('fails for unexpected results', function(done) {
        // Perform the request.
        env.addKeys('cyberman', ['ssh-rsa key1'], (err, errors) => {
          assert.strictEqual(err, 'unexpected results: [{},{}]');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{}, {}]}
        });
      });

      it('fails for no results', function(done) {
        // Perform the request.
        env.addKeys('rose', ['ssh-rsa key1'], (err, errors) => {
          assert.strictEqual(err, 'unexpected results: []');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: []}
        });
      });
    });

    describe('importKeys', function() {
      it('calls the ecs import keys', function() {
        var lazy = sinon.stub(env.get('ecs'), 'lazyImportSSHKeys');
        this._cleanups.push(lazy.restore);
        env.importKeys([], [], function() {});
        assert.equal(lazy.calledOnce, true);
      });

      it('imports a single key', function(done) {
        // Perform the request.
        env.importKeys('who', ['gh:who'], (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, [null]);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'KeyManager',
            request: 'ImportKeys',
            version: 77,
            params: {user: 'who', 'ssh-keys': ['gh:who']}
          });
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {
            results: [{}]
          }
        });
      });

      it('imports multiple keys', function(done) {
        // Perform the request.
        env.importKeys('who', ['gh:rose', 'lp:dalek'], (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, [null, null]);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'KeyManager',
            request: 'ImportKeys',
            version: 77,
            params: {
              user: 'who',
              'ssh-keys': ['gh:rose', 'lp:dalek']
            }
          });
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {
            results: [{}, {}]
          }
        });
      });

      it('imports no keys', function(done) {
        // Perform the request.
        env.importKeys('who', [], (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
      });

      it('handles errors when no user is provided', function(done) {
        // Perform the request.
        env.importKeys('', ['gh:who'], (err, errors) => {
          assert.strictEqual(err, 'no user provided');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
      });

      it('handles request failures while importing keys', function(done) {
        // Perform the request.
        env.importKeys('who', ['gh:who'], (err, errors) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({'request-id': 1, error: 'bad wolf'});
      });

      it('handles API failures while importing keys', function(done) {
        // Perform the request.
        const ids = ['gh:rose', 'bb:cyberman', 'lp:dalek'];
        env.importKeys('dalek', ids, (err, errors) => {
          assert.strictEqual(err, null);
          assert.deepEqual(errors, [null, 'bad wolf', null]);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {
            results: [{}, {error: {message: 'bad wolf'}}, {}]
          }
        });
      });

      it('fails for unexpected results', function(done) {
        // Perform the request.
        env.importKeys('cyberman', ['gh:who'], (err, errors) => {
          assert.strictEqual(err, 'unexpected results: [{},{}]');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{}, {}]}
        });
      });

      it('fails for no results', function(done) {
        // Perform the request.
        env.importKeys('rose', ['gh:who'], (err, errors) => {
          assert.strictEqual(err, 'unexpected results: []');
          assert.deepEqual(errors, []);
          done();
        }, {immediate: true});
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: []}
        });
      });
    });

    describe('listKeys', function() {
      it('retrieves keys', function(done) {
        // Perform the request.
        env.listKeys('who', true, (err, keys) => {
          assert.strictEqual(err, null);
          assert.deepEqual(keys, ['ssh-rsa key1', 'ssh-rsa key2']);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'KeyManager',
            request: 'ListKeys',
            version: 77,
            params: {
              entities: {entities: [{tag: 'user-who'}]},
              mode: true
            }
          });
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{
            result: ['ssh-rsa key1', 'ssh-rsa key2']
          }]}
        });
      });

      it('retrieves key fingerprints', function(done) {
        // Perform the request.
        env.listKeys('dalek', false, (err, keys) => {
          assert.strictEqual(err, null);
          assert.deepEqual(keys, ['fingerprint']);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'KeyManager',
            request: 'ListKeys',
            version: 77,
            params: {
              entities: {entities: [{tag: 'user-dalek'}]},
              mode: false
            }
          });
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{
            result: ['fingerprint']
          }]}
        });
      });

      it('handles request failures while retrieving keys', function(done) {
        // Perform the request.
        env.listKeys('who', false, (err, keys) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(keys, []);
          done();
        });
        // Mimic response.
        conn.msg({'request-id': 1, error: 'bad wolf'});
      });

      it('handles API failures while retrieving keys', function(done) {
        // Perform the request.
        env.listKeys('dalek', false, (err, keys) => {
          assert.strictEqual(
            err, 'cannot list keys: bad wolf');
          assert.deepEqual(keys, []);
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{error: {message: 'bad wolf'}}]}
        });
      });

      it('fails for unexpected results', function(done) {
        // Perform the request.
        env.listKeys('cyberman', false, (err, keys) => {
          assert.strictEqual(err, 'unexpected results: [{},{}]');
          assert.deepEqual(keys, []);
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{}, {}]}
        });
      });

      it('fails for no results', function(done) {
        // Perform the request.
        env.listKeys('rose', false, (err, keys) => {
          assert.strictEqual(err, 'unexpected results: []');
          assert.deepEqual(keys, []);
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: []}
        });
      });
    });

    describe('fullStatus', function() {
      it('succeeds', function(done) {
        // Snapshots could help here!
        const response = '{"request-id":1,"response":{"model":{"name":"default","cloud-tag":"cloud-localhost","region":"localhost","version":"2.3-alpha1.1","available-version":"","model-status":{"status":"available","info":"","data":{},"since":"2017-07-24T17:35:58.284859958Z","kind":"","version":"","life":""},"meter-status":{"color":"","message":""},"sla":"unsupported"},"machines":{"1":{"agent-status":{"status":"started","info":"","data":{},"since":"2017-07-27T09:06:38.403313203Z","kind":"","version":"2.3-alpha1.1","life":""},"instance-status":{"status":"running","info":"Running","data":{},"since":"2017-07-27T09:05:31.888249394Z","kind":"","version":"","life":""},"dns-name":"10.56.39.236","ip-addresses":["10.56.39.236"],"instance-id":"juju-39bb4b-1","series":"xenial","id":"1","network-interfaces":{"eth0":{"ip-addresses":["10.56.39.236"],"mac-address":"00:16:3e:f8:e2:66","is-up":true},"lxdbr0":{"ip-addresses":["10.0.253.1"],"mac-address":"62:f5:69:49:6e:eb","is-up":true}},"containers":{"1/lxd/0":{"agent-status":{"status":"down","info":"agent is not communicating with the server","data":{},"since":"2017-07-27T10:11:50.03607208Z","kind":"","version":"","life":""},"instance-status":{"status":"provisioning error","info":"LXD does not have a uid/gid allocation. In this mode, only privileged containers are supported.","data":{},"since":"2017-07-27T10:11:50.03607208Z","kind":"","version":"","life":""},"dns-name":"","instance-id":"pending","series":"xenial","id":"1/lxd/0","containers":{},"constraints":"","hardware":"","jobs":["JobHostUnits"],"has-vote":false,"wants-vote":false}},"constraints":"","hardware":"arch=amd64 cores=0 mem=0M","jobs":["JobHostUnits"],"has-vote":false,"wants-vote":false},"2":{"agent-status":{"status":"started","info":"","data":{},"since":"2017-07-27T09:06:35.343625024Z","kind":"","version":"2.3-alpha1.1","life":""},"instance-status":{"status":"running","info":"Running","data":{},"since":"2017-07-27T09:05:58.513416815Z","kind":"","version":"","life":""},"dns-name":"10.56.39.67","ip-addresses":["10.56.39.67"],"instance-id":"juju-39bb4b-2","series":"trusty","id":"2","network-interfaces":{"eth0":{"ip-addresses":["10.56.39.67"],"mac-address":"00:16:3e:ae:ab:f4","is-up":true}},"containers":{},"constraints":"","hardware":"arch=amd64 cores=0 mem=0M","jobs":["JobHostUnits"],"has-vote":false,"wants-vote":false}},"applications":{"mysql":{"charm":"cs:mysql-57","series":"xenial","exposed":false,"life":"","relations":{"cluster":["mysql"],"db":["wordpress"]},"can-upgrade-to":"","subordinate-to":[],"units":{"mysql/0":{"agent-status":{"status":"idle","info":"","data":{},"since":"2017-07-27T14:24:37.091302286Z","kind":"","version":"2.3-alpha1.1","life":""},"workload-status":{"status":"active","info":"Ready","data":{},"since":"2017-07-27T09:09:26.605041846Z","kind":"","version":"","life":""},"workload-version":"5.7.19","machine":"1","opened-ports":["3306/tcp"],"public-address":"10.56.39.236","charm":"","subordinates":null,"leader":true}},"meter-statuses":null,"status":{"status":"active","info":"Ready","data":{},"since":"2017-07-27T09:09:26.605041846Z","kind":"","version":"","life":""},"workload-version":"5.7.19"},"wordpress":{"charm":"cs:trusty/wordpress-5","series":"trusty","exposed":false,"life":"","relations":{"db":["mysql"],"loadbalancer":["wordpress"],"website":["haproxy"]},"can-upgrade-to":"","subordinate-to":[],"units":{"wordpress/0":{"agent-status":{"status":"idle","info":"","data":{},"since":"2017-07-27T14:25:15.698979271Z","kind":"","version":"2.3-alpha1.1","life":""},"workload-status":{"status":"active","info":"","data":{},"since":"2017-07-27T09:11:53.345976498Z","kind":"","version":"","life":""},"workload-version":"","machine":"2","opened-ports":["80/tcp"],"public-address":"10.56.39.67","charm":"","subordinates":null,"leader":true}},"meter-statuses":null,"status":{"status":"active","info":"","data":{},"since":"2017-07-27T09:11:53.345976498Z","kind":"","version":"","life":""},"workload-version":""}},"remote-applications":{"haproxy":{"application-url":"local:admin/controller.haproxy","application-name":"haproxy","endpoints":[{"name":"reverseproxy","role":"requirer","interface":"http","limit":0,"scope":"global"}],"life":"","relations":{"reverseproxy":["wordpress"]},"status":{"status":"unknown","info":"waiting for remote connection","data":{},"since":"2017-07-27T10:55:55.481908354Z","kind":"","version":"","life":""}}},"relations":[{"id":4,"key":"haproxy:reverseproxy wordpress:website","interface":"http","scope":"global","endpoints":[{"application":"wordpress","name":"website","role":"provider","subordinate":false},{"application":"haproxy","name":"reverseproxy","role":"requirer","subordinate":false}]},{"id":1,"key":"mysql:cluster","interface":"mysql-ha","scope":"global","endpoints":[{"application":"mysql","name":"cluster","role":"peer","subordinate":false}]},{"id":3,"key":"wordpress:db mysql:db","interface":"mysql","scope":"global","endpoints":[{"application":"mysql","name":"db","role":"provider","subordinate":false},{"application":"wordpress","name":"db","role":"requirer","subordinate":false}]},{"id":2,"key":"wordpress:loadbalancer","interface":"reversenginx","scope":"global","endpoints":[{"application":"wordpress","name":"loadbalancer","role":"peer","subordinate":false}]}]}}'; // eslint-disable-line max-len
        const expected = '{"model":{"name":"default","cloud":"localhost","region":"localhost","version":"2.3-alpha1.1","availableVersion":"","sla":"unsupported","status":{"status":"available","info":"","life":"","since":"2017-07-24T17:35:58.284Z"}},"machines":{"1":{"id":"1","instanceID":"juju-39bb4b-1","series":"xenial","dnsName":"10.56.39.236","ipAddresses":["10.56.39.236"],"networkInterfaces":{"eth0":{"ipAddresses":["10.56.39.236"],"macAddress":"00:16:3e:f8:e2:66","isUp":true},"lxdbr0":{"ipAddresses":["10.0.253.1"],"macAddress":"62:f5:69:49:6e:eb","isUp":true}},"constraints":"","hardware":"arch=amd64 cores=0 mem=0M","jobs":["JobHostUnits"],"hasVote":false,"wantsVote":false,"agent":{"status":"started","info":"","life":"","since":"2017-07-27T09:06:38.403Z"},"instance":{"status":"running","info":"Running","life":"","since":"2017-07-27T09:05:31.888Z"},"containers":{"1/lxd/0":{"id":"1/lxd/0","instanceID":"pending","series":"xenial","dnsName":"","networkInterfaces":{},"constraints":"","hardware":"","jobs":["JobHostUnits"],"hasVote":false,"wantsVote":false,"agent":{"status":"down","info":"agent is not communicating with the server","life":"","since":"2017-07-27T10:11:50.036Z"},"instance":{"status":"provisioning error","info":"LXD does not have a uid/gid allocation. In this mode, only privileged containers are supported.","life":"","since":"2017-07-27T10:11:50.036Z"},"containers":{}}}},"2":{"id":"2","instanceID":"juju-39bb4b-2","series":"trusty","dnsName":"10.56.39.67","ipAddresses":["10.56.39.67"],"networkInterfaces":{"eth0":{"ipAddresses":["10.56.39.67"],"macAddress":"00:16:3e:ae:ab:f4","isUp":true}},"constraints":"","hardware":"arch=amd64 cores=0 mem=0M","jobs":["JobHostUnits"],"hasVote":false,"wantsVote":false,"agent":{"status":"started","info":"","life":"","since":"2017-07-27T09:06:35.343Z"},"instance":{"status":"running","info":"Running","life":"","since":"2017-07-27T09:05:58.513Z"},"containers":{}}},"applications":{"mysql":{"charm":{"name":"mysql","schema":"cs","user":"","series":"","revision":57},"series":"xenial","exposed":false,"life":"","relations":{"cluster":["mysql"],"db":["wordpress"]},"canUpgradeTo":null,"subordinateTo":[],"workloadVersion":"5.7.19","units":{"mysql/0":{"workloadVersion":"5.7.19","machine":"1","ports":["3306/tcp"],"publicAddress":"10.56.39.236","isLeader":true,"agent":{"status":"idle","info":"","life":"","since":"2017-07-27T14:24:37.091Z"},"workload":{"status":"active","info":"Ready","life":"","since":"2017-07-27T09:09:26.605Z"}}},"leaderStatus":{"status":"active","info":"Ready","life":"","since":"2017-07-27T09:09:26.605Z"}},"wordpress":{"charm":{"name":"wordpress","schema":"cs","user":"","series":"trusty","revision":5},"series":"trusty","exposed":false,"life":"","relations":{"db":["mysql"],"loadbalancer":["wordpress"],"website":["haproxy"]},"canUpgradeTo":null,"subordinateTo":[],"workloadVersion":"","units":{"wordpress/0":{"workloadVersion":"","machine":"2","ports":["80/tcp"],"publicAddress":"10.56.39.67","isLeader":true,"agent":{"status":"idle","info":"","life":"","since":"2017-07-27T14:25:15.698Z"},"workload":{"status":"active","info":"","life":"","since":"2017-07-27T09:11:53.345Z"}}},"leaderStatus":{"status":"active","info":"","life":"","since":"2017-07-27T09:11:53.345Z"}}},"remoteApplications":{"haproxy":{"url":"local:admin/controller.haproxy","name":"haproxy","endpoints":[{"name":"reverseproxy","role":"requirer","interface":"http","limit":0,"scope":"global"}],"life":"","relations":{"reverseproxy":["wordpress"]},"status":{"status":"unknown","info":"waiting for remote connection","life":"","since":"2017-07-27T10:55:55.481Z"}}},"relations":[{"id":4,"key":"haproxy:reverseproxy wordpress:website","interface":"http","scope":"global","endpoints":[{"application":"wordpress","name":"website","role":"provider","subordinate":false},{"application":"haproxy","name":"reverseproxy","role":"requirer","subordinate":false}]},{"id":1,"key":"mysql:cluster","interface":"mysql-ha","scope":"global","endpoints":[{"application":"mysql","name":"cluster","role":"peer","subordinate":false}]},{"id":3,"key":"wordpress:db mysql:db","interface":"mysql","scope":"global","endpoints":[{"application":"mysql","name":"db","role":"provider","subordinate":false},{"application":"wordpress","name":"db","role":"requirer","subordinate":false}]},{"id":2,"key":"wordpress:loadbalancer","interface":"reversenginx","scope":"global","endpoints":[{"application":"wordpress","name":"loadbalancer","role":"peer","subordinate":false}]}]}'; // eslint-disable-line max-len
        // Perform the request.
        env.fullStatus((err, status) => {
          assert.strictEqual(err, null);
          assert.equal(JSON.stringify(status), expected);
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'Client',
            request: 'FullStatus',
            version: 1,
            params: {}
          });
          done();
        });
        // Mimic response.
        conn.msg(JSON.parse(response));
      });

      it('handles request failures while retrieving keys', function(done) {
        // Perform the request.
        env.fullStatus((err, status) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(status, {});
          done();
        });
        // Mimic response.
        conn.msg({'request-id': 1, error: 'bad wolf'});
      });

      it('fails for unexpected results', function(done) {
        // Perform the request.
        env.fullStatus((err, status) => {
          assert.strictEqual(err, 'unexpected response: 42');
          assert.deepEqual(status, {});
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: 42
        });
      });

      it('fails for no results', function(done) {
        // Perform the request.
        env.fullStatus((err, status) => {
          assert.strictEqual(err, 'unexpected response: {}');
          assert.deepEqual(status, {});
          done();
        });
        // Mimic response.
        conn.msg({'request-id': 1, response: {}});
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
        assert.strictEqual(data.url, 'local:/u/user@local/myenv/haproxy');
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          type: 'CrossModelRelations',
          version: 1,
          request: 'Offer',
          params: {
            offers: [{
              applicationname: 'haproxy',
              endpoints: ['proxy'],
              applicationurl: 'local:/u/user@local/myenv/haproxy',
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

    describe('remoteApplicationInfo', function() {
      it('retrieves remote application info', function(done) {
        // Perform the request.
        const url = 'default.django';
        env.remoteApplicationInfo(url, (err, info) => {
          assert.strictEqual(err, null);
          assert.strictEqual(info.modelTag, 'model-01234-56789');
          assert.strictEqual(info.modelId, '01234-56789');
          assert.strictEqual(info.name, 'django');
          assert.strictEqual(info.description, 'django is good');
          assert.strictEqual(info.url, url);
          assert.strictEqual(info.sourceModel, 'default');
          assert.deepEqual(info.endpoints, [{
            name: 'ceph',
            role: 'requirer',
            interface: 'ceph-client',
            limit: 1,
            scope: 'global'
          }, {
            name: 'ha',
            role: 'requirer',
            interface: 'hacluster',
            limit: 1,
            scope: 'container'
          }]);
          assert.strictEqual(info.icon, 'i am an svg icon');
          const msg = conn.last_message();
          assert.deepEqual(msg, {
            'request-id': 1,
            type: 'Application',
            request: 'RemoteApplicationInfo',
            version: 7,
            params: {'application-urls': [url]}
          });
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{
            result: {
              'model-tag': 'model-01234-56789',
              name: 'django',
              description: 'django is good',
              'application-url': url,
              'source-model-label': 'default',
              endpoints: [{
                name: 'ceph',
                role: 'requirer',
                interface: 'ceph-client',
                limit: 1,
                scope: 'global'
              }, {
                name: 'ha',
                role: 'requirer',
                interface: 'hacluster',
                limit: 1,
                scope: 'container'
              }],
              icon: btoa('i am an svg icon')
            }
          }]}
        });
      });

      it('handles request failures while getting info', function(done) {
        // Perform the request.
        env.remoteApplicationInfo('default.django', (err, info) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(info, {});
          done();
        });
        // Mimic response.
        conn.msg({'request-id': 1, error: 'bad wolf'});
      });

      it('handles API failures while getting info', function(done) {
        // Perform the request.
        env.remoteApplicationInfo('default.django', (err, info) => {
          assert.strictEqual(
            err, 'cannot get remote application info: bad wolf');
          assert.deepEqual(info, {});
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{error: {message: 'bad wolf'}}]}
        });
      });

      it('fails for unexpected results', function(done) {
        // Perform the request.
        env.remoteApplicationInfo('default.django', (err, info) => {
          assert.strictEqual(err, 'unexpected results: [{},{}]');
          assert.deepEqual(info, {});
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: [{}, {}]}
        });
      });

      it('fails for no results', function(done) {
        // Perform the request.
        env.remoteApplicationInfo('default.django', (err, info) => {
          assert.strictEqual(err, 'unexpected results: []');
          assert.deepEqual(info, {});
          done();
        });
        // Mimic response.
        conn.msg({
          'request-id': 1,
          response: {results: []}
        });
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
              sourceenviron: 'model-uuid',
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

    describe('modelUserInfo', function() {
      it('retrieves model user info', done => {
        // Perform the request.
        env.modelUserInfo((err, users) => {
          assert.strictEqual(err, null);
          assert.strictEqual(users.length, 2);
          assert.deepEqual(users[0], {
            name: 'dalek',
            displayName: 'Dalek',
            domain: 'local',
            lastConnection: new Date('2000-01-01T00:00:00Z'),
            access: 'admin',
            err: undefined
          });
          assert.deepEqual(users[1], {
            name: 'rose@external',
            displayName: 'rose',
            domain: 'Ubuntu SSO',
            lastConnection: null,
            access: 'write',
            err: undefined
          });
          assert.equal(conn.messages.length, 1);
          assert.deepEqual(conn.last_message(), {
            type: 'Client',
            version: 1,
            request: 'ModelUserInfo',
            params: {},
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
                user: 'dalek',
                'display-name': 'Dalek',
                'last-connection': '2000-01-01T00:00:00Z',
                access: 'admin',
                err: null
              }
            }, {
              result: {
                user: 'rose@external',
                'display-name': '',
                'last-connection': '',
                access: 'write',
                err: null
              }
            }]
          }
        });
      });

      it('handles request failures while fetching model user info', done => {
        // Perform the request.
        env.modelUserInfo((err, users) => {
          assert.strictEqual(err, 'bad wolf');
          assert.deepEqual(users, []);
          done();
        });
        // Mimic response.
        conn.msg({'request-id': 1, error: 'bad wolf'});
      });

      it('handles API failures while retrieving model user info', done => {
        // Perform the request.
        env.modelUserInfo((err, users) => {
          assert.strictEqual(err, null);
          assert.strictEqual(users.length, 1);
          assert.strictEqual(users[0].err, 'bad wolf');
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
    });
  });

})();
