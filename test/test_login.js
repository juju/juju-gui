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
      var credentials = env.getCredentials();
      assert.equal(credentials.user, undefined);
      assert.equal(credentials.password, undefined);
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
      env.setCredentials({ user: 'user', password: 'password' });
      env.login();
      assert.equal(conn.last_message().op, 'login');
      assert.equal(conn.last_message().user, 'user');
      assert.equal(conn.last_message().password, 'password');
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
      container = Y.one('body').appendChild('<div/>');
      // Needed by the render method.
      mask = Y.one('body').appendChild('<div/>').set('id', 'full-screen-mask');
      loginView = new views.login(
          {container: container, env: env, help_text: 'Help text'});
    });

    afterEach(function() {
      env.destroy();
      container.remove(true);
      mask.remove(true);
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
      assert.equal(conn.last_message().op, 'login');
      assert.equal(conn.last_message().user, 'user');
      assert.equal(conn.last_message().password, 'password');
    });

    test('the view render method adds the login form', function() {
      loginView.render();
      assert.equal(
          container.one('#login-form input[type=submit]').get('value'),
          'Login');
    });

  });

})();
