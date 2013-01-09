'use strict';

(function() {

  describe('environment login support', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, utils, juju;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires);
      juju = Y.namespace('juju');
      utils = Y.namespace('juju-tests.utils');
      done();
    });

    beforeEach(function() {
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


  describe('login view', function() {
    var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
    var Y, conn, env, utils, juju, views, loginView, container, loginMask;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function() {
      Y = YUI(GlobalConfig).use(requires);
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      views = Y.namespace('juju-views');
    });

    beforeEach(function() {
      conn = new utils.SocketStub();
      env = new juju.Environment({conn: conn});
      env.connect();
      conn.open();
      container = Y.Node.create('<div/>');
      // Needed by the render method.
      loginMask = Y.one('body').appendChild('<div/>').set('id', 'login-mask');
      loginView = new views.login(
        {container: container, env: env, help_text: 'Help text'});
    });

    afterEach(function() {
      env.destroy();
      container.remove(true);
      loginMask.remove(true);
    });

    test('the view login method calls the environment login one', function() {
      var noop = function() {};
      var ev = {preventDefault: noop, currentTarget: {get: noop}};
      container.appendChild('<input/>').set('type', 'text').set(
        'value', 'user');
      container.appendChild('<input/>').set('type', 'password').set(
        'value', 'password');
      loginView.login(ev);
      assert.equal(conn.last_message().op, 'login');
      assert.equal(conn.last_message().user, 'user');
      assert.equal(conn.last_message().password, 'password');
    });

    test('the view render method adds the login form', function() {
      loginView.render();
      assert.isTrue(Y.one('#login-form'));
    });

  });

})();
