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

  describe('environment login support', function() {
    const requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    let conn, env, utils, juju;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests').utils;
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      conn = new utils.SocketStub();
      env = new juju.environments.GoEnvironment({conn: conn});
      env.connect();
      conn.open();
    });

    afterEach(function() {
      env.close();
      env.destroy();
      sessionStorage.setItem('credentials', null);
    });

    // These duplicate more thorough tests in test_env_api.js.
    it('the user is initially assumed to be unauthenticated', function() {
      assert.isFalse(env.userIsAuthenticated);
    });

    it('successful login event marks user as authenticated', function() {
      var data = {response: {
        facades: [{name: 'ModelManager', versions: [2]}],
        'model-tag': 'model-42',
        'user-info': {}
      }};
      env.handleLogin(data);
      assert.isTrue(env.userIsAuthenticated);
    });

    it('unsuccessful login event keeps user unauthenticated', function() {
      var data = {error: 'who are you?'};
      env.handleLogin(data);
      assert.isFalse(env.userIsAuthenticated);
    });

    it('bad credentials are removed', function() {
      var data = {error: 'who are you?'};
      env.handleLogin(data);
      assert.deepEqual(
        env.getCredentials(), {user: '', password: '', macaroons: null});
    });

    it('credentials passed to the constructor are stored', function() {
      const user = 'jean-luc-picard';
      const password = 'I am the real legend!';
      // Make sure that the session is empty from the 'beforeEach' instantiation
      sessionStorage.setItem('credentials', null);
      const env = new juju.environments.GoEnvironment({
        user: user,
        password: password,
        conn: conn
      });
      const credentials = env.getCredentials();
      assert.equal(credentials.user, user + '@local');
      assert.equal(credentials.password, password);
      assert.equal(JSON.stringify({
        user: user,
        password: password,
        macaroons: null
      }), sessionStorage.getItem('credentials'));
    });

    it('login requests are sent in response to a connection', function() {
      env.fire('log', {op: 'login', data: {}});
    });

    it('if already authenticated, login() is a no-op', function() {
      env.userIsAuthenticated = true;
      env.login();
      assert.equal(conn.last_message(), undefined);
    });

    it('with credentials set, login() sends an RPC message', function() {
      env.setCredentials({user: 'admin', password: 'password'});
      env.login();
      var message = conn.last_message();
      assert.equal(message.request, 'Login');
      assert.equal(message.params['auth-tag'], 'user-admin@local');
      assert.equal(message.params.credentials, 'password');
    });

  });

})();
