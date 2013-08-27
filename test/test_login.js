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
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, utils, juju;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests').utils;
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      conn = new utils.SocketStub();
      env = juju.newEnvironment({conn: conn});
      env.connect();
      conn.open();
    });

    afterEach(function() {
      env.destroy();
    });

    test('the user is initially assumed to be unauthenticated', function() {
      assert.isFalse(env.userIsAuthenticated);
    });

    test('successful login event marks user as authenticated', function() {
      var data = {Response: {}};
      env.handleLogin(data);
      assert.isTrue(env.userIsAuthenticated);
    });

    test('unsuccessful login event keeps user unauthenticated', function() {
      var data = {Error: 'who are you?'};
      env.handleLogin(data);
      assert.isFalse(env.userIsAuthenticated);
    });

    test('bad credentials are removed', function() {
      var data = {Error: 'who are you?'};
      env.handleLogin(data);
      assert.isNull(env.getCredentials());
    });

    test('credentials passed to the constructor are stored', function() {
      var user = 'Will Smith';
      var password = 'I am legend!';
      var env = juju.newEnvironment({
        user: user,
        password: password,
        conn: conn
      });
      var credentials = env.getCredentials();
      assert.equal(credentials.user, user);
      assert.equal(credentials.password, password);
      assert.equal(JSON.stringify(credentials),
          sessionStorage.getItem('credentials'));
    });

    test('login requests are sent in response to a connection', function() {
      env.fire('log', {op: 'login', data: {}});
    });

    test('if already authenticated, login() is a no-op', function() {
      env.userIsAuthenticated = true;
      env.login();
      assert.equal(conn.last_message(), undefined);
    });

    test('with credentials set, login() sends an RPC message', function() {
      env.setCredentials({user: 'user', password: 'password'});
      env.login();
      var message = conn.last_message();
      assert.equal('Login', message.Request);
      assert.equal('user', message.Params.AuthTag);
      assert.equal('password', message.Params.Password);
    });

  });


  describe('login view', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, utils, juju, views, loginView, container, mask;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests').utils;
        juju = Y.namespace('juju');
        views = Y.namespace('juju.views');
        done();
      });
    });

    beforeEach(function() {
      conn = new utils.SocketStub();
      env = juju.newEnvironment({conn: conn});
      env.connect();
      conn.open();
      container = utils.makeContainer();
      mask = Y.Node.create('<div id="full-screen-mask"/>');
      mask.appendTo(document.body);
      loginView = new views.login(
          {container: container, env: env, help_text: 'Help text'});
    });

    afterEach(function() {
      env.destroy();
      container.remove(true);
      sessionStorage.setItem('credentials', null);
    });

    test('the view login method logs in through the environment', function() {
      var noop = function() {};
      var ev = {preventDefault: noop, currentTarget: {get: noop}};
      container.appendChild('<input/>').set('type', 'text').set(
          'value', 'user');
      container.appendChild('<input/>').set('type', 'password').set(
          'value', 'password');
      loginView.login(ev);
      var message = conn.last_message();
      assert.equal('Login', message.Request);
      assert.equal('user', message.Params.AuthTag);
      assert.equal('password', message.Params.Password);
    });

    test('the view render method adds the login form', function() {
      loginView.render();
      assert.equal(
          container.one('#login-form input[type=submit]').get('value'),
          'Login');
    });

  });

})();
