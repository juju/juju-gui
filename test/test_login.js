'use strict';

(function() {

   describe('environment login support', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, utils, juju, makeLoginView, views, app;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function() {
      Y = YUI(GlobalConfig).use(requires);
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
    });

    beforeEach(function() {
      var container = Y.Node.create('<div/>');
      conn = new utils.SocketStub();
      env = new juju.Environment({conn: conn});
      env.connect();
      conn.open();
      //      env.set('connected', true);
    });

    afterEach(function() {
      env.destroy();
    });

    test('the user is initially assumed to be unauthenticated', function() {
      assert.equal(env.userIsAuthenticated, false);
    });

    test('successful login event marks user as authenticated', function() {
      var evt = {data: {op: 'login', result: true}};
      env.handleLoginEvent(evt);
      assert.equal(env.userIsAuthenticated, true);
    });

    test('unsuccessful login event keeps user unauthenticated', function() {
      var evt = {data: {op: 'login'}};
      env.handleLoginEvent(evt);
      assert.equal(env.userIsAuthenticated, false);
    });

    test('bad credentials are removed', function() {
      var evt = {data: {op: 'login'}};
      env.handleLoginEvent(evt);
      assert.equal(env.get('user'), undefined);
      assert.equal(env.get('password'), undefined);
    });

    test('credentials passed to the constructor are stored', function() {
      var user = 'Will Smith';
      var password = 'I am legend!';
      var env = new juju.Environment({
        user: user,
        password: password,
        conn: conn
      });
      assert.equal(env.get('user'), user);
      assert.equal(env.get('password'), password);
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
      env.set('user', 'user');
      env.set('password', 'password');
      env.login();
      assert.equal(conn.last_message().op, 'login');
      assert.equal(conn.last_message().user, 'user');
      assert.equal(conn.last_message().password, 'password');
    });

  });

})();
