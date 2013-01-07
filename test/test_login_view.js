'use strict';

(function() {

  var requires = ['node', 'juju-gui', 'juju-views', 'juju-tests-utils'];
  var Y = YUI(GlobalConfig).use(requires);

  describe('login view', function() {
    var conn, env, utils, juju, makeLoginView, views, app;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function() {
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      makeLoginView = function() {
        var view = new views.LoginView({env: env});
        return view;
      };
    });

    beforeEach(function() {
      var container = Y.Node.create('<div/>');
      conn = new utils.SocketStub();
      env = new juju.Environment({conn: conn});
      env.connect();
      conn.open();
      env.set('connected', true);
    });

    afterEach(function() {
      env.destroy();
    });

    test('login view can be instantiated', function() {
      var view = makeLoginView();
    });

    test('credentials are stored on the environment', function() {
      var view = makeLoginView();
      assert.equal(env.get('user'), undefined);
      assert.equal(env.get('password'), undefined);
      view._prompt = function() { return 'xxx'; };
//      view.promptUser()
//      assert.equal(env.get('user'), 'xxx');
//      assert.equal(env.get('password'), 'xxx');
    });

  });


  describe('environment login support', function() {
    var conn, env, utils, juju, makeLoginView, views, app;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function() {
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

    test('successful verification messages are handled', function() {
      assert.isFalse(env.userIsAuthenticated);
      env.fire('msg', {data: {op: 'login', result: true}});
      assert.isTrue(env.userIsAuthenticated);
    });

    test('failed verification messages are handled', function() {
      assert.isFalse(env.userIsAuthenticated);
      env.fire('msg', {op: 'login', data: {}});
      assert.isFalse(env.userIsAuthenticated);
    });

  });


  describe('login credentials routing', function() {
    var conn, env, utils, juju, makeLoginView, views, app;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function() {
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      makeLoginView = function() {
        var view = new views.LoginView({env: env});
        return view;
      };
    });

    beforeEach(function() {
      var container = Y.Node.create('<div/>');
      conn = new utils.SocketStub();
      env = new juju.Environment({conn: conn});
      env.connect();
      conn.open();
      env.set('connected', true);
      app = new Y.juju.App({env: env, container: container});
    });

    afterEach(function() {
      env.destroy();
    });

//    test('the login checker is registered first for all routes', function() {
//      assert.equal(app.match('/')[0].callback, 'check_user_credentials');
//    });

//    test('next is not called for unauthorized users', function() {
//      var nextCalled = false;
//      var next = function() {
//        nextCalled = true;
//      };
//      env.userIsAuthenticated = false;
//      env.waiting = false;
//      app.check_user_credentials(undefined, undefined, next);
//      assert.isFalse(nextCalled);
//    });

//    test('next is not called while waiting', function() {
//      var nextCalled = false;
//      var next = function() {
//        nextCalled = true;
//      };
//      env.set('user', 'user');
//      env.set('password', 'password');
//      env.userIsAuthenticated = false;
//      env.waiting = true;
//      app.check_user_credentials(undefined, undefined, next);
//      assert.isFalse(nextCalled);
//    });

//    test('next is called when authorized', function() {
//      var nextCalled = false;
//      var next = function() {
//        nextCalled = true;
//      };
//      env.set('user', 'user');
//      env.set('password', 'password');
//      env.waiting = false;
//      env.userIsAuthenticated = true;
//      app.check_user_credentials(undefined, undefined, next);
//      assert.isTrue(nextCalled);
//    });

//    test('if there are no stored credentials the user is prompted',
//        function() {
//          var view = app.getViewInfo('login').instance = makeLoginView();
//          var nextCalled = false;
//          var next = function() {
//            nextCalled = true;
//          };
//          app.check_user_credentials(undefined, undefined, next);
//          assert.isTrue(view._prompted);
//          assert.isFalse(nextCalled);
//        });

//    test('if there are stored credentials, env.login() is called', function() {
//      var view = app.getViewInfo('login').instance = makeLoginView();
//      var nextCalled = false;
//      var next = function() {
//        nextCalled = true;
//      };
//      var loginCalled = false;
//      app.env = {
//        login: function() {
//          loginCalled = true;
//        },
//        get: function() {
//          return 'xxx';
//        }
//      };
//      env.set('user', 'user');
//      env.set('password', 'password');
//      app.check_user_credentials(undefined, undefined, next);
//      assert.isTrue(loginCalled);
//      assert.isFalse(nextCalled);
//    });

  });

})();
