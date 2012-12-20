'use strict';

(function() {

  var Y = YUI(GlobalConfig).use(
      ['node', 'juju-gui', 'juju-views', 'juju-tests-utils']);

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
    });

    afterEach(function() {
      env.destroy();
    });

    test('login view can be instantiated', function() {
      var view = makeLoginView();
    });

    test('credentials are initially assumed invalid', function() {
      var view = makeLoginView();
      assert.equal(view.userIsAuthenticated, false);
    });

    test('successful login event marks user as authenticated', function() {
      var view = makeLoginView();
      var evt = {data: {result: 'success'}};
      view.handleLoginEvent(evt);
      assert.equal(view.userIsAuthenticated, true);
    });

    test('unsuccessful login event marks user as unauthenticated', function() {
      var view = makeLoginView();
      var evt = {data: {}};
      view.handleLoginEvent(evt);
      assert.equal(view.userIsAuthenticated, false);
    });

    test('credentials passed to the constructor are stored', function() {
      var fauxEnvironment = {
        after: function() {
        }
      };
      var user = 'Will Smith';
      var password = 'I am legend!';
      var view = new views.LoginView({
        user: user,
        password: password,
        env: fauxEnvironment
      });
      assert.equal(view.get('user'), user);
      assert.equal(view.get('password'), password);
    });

    test('prompts when there are no known credentials', function() {
      var view = makeLoginView();
      view.login();
      assert.isTrue(view._prompted);
    });

    test('no prompt when there are known credentials', function() {
      var view = makeLoginView();
      view.set('user', 'user');
      view.set('password', 'password');
      view.login();
      assert.isFalse(view._prompted);
    });

    test('login() sends login message', function() {
      var view = makeLoginView();
      view.set('user', 'user');
      view.set('password', 'password');
      view.login();
      assert.equal(conn.last_message().op, 'login');
    });

  });


  describe('login user interaction', function() {
    var conn, env, utils, juju, makeLoginView, views, app;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function() {
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      makeLoginView = function() {
        var view = new views.LoginView({env: env});
        // Disable actually prompting.
        view._prompt = function() {};
        return view;
      };
    });

    beforeEach(function() {
      var container = Y.Node.create('<div/>');
      conn = new utils.SocketStub();
      env = new juju.Environment({conn: conn});
      env.connect();
      conn.open();
      app = new Y.juju.App({env: env, container: container});
    });

    afterEach(function() {
      env.destroy();
    });

    test('the login checker is registered first for all routes', function() {
      assert.equal(app.match('/')[0].callback, 'check_user_credentials');
    });

    test('unauthorized requests prompt for credentials', function() {
      app.check_user_credentials(undefined, undefined, function() {});
      var view = app.getViewInfo('login').instance;
      assert.isTrue(view._prompted);
    });

    test('unauthorized requests do not call next()', function() {
      var nextWasCalled = false;
      var next = function() {
        nextWasCalled = true;
      }
      app.check_user_credentials(undefined, undefined, next);
      assert.isFalse(nextWasCalled);
    });

    test('user is not prompted while waiting for login results', function() {
      app.check_user_credentials(undefined, undefined, function() {});
      var view = app.getViewInfo('login').instance;
      assert.isTrue(view._prompted);
      assert.isTrue(view.waiting);
      view._prompted = false;
      app.check_user_credentials(undefined, undefined, function() {});
      assert.isFalse(view._prompted);
    });

    // If there are know credentials that are not known to be bad (they are
    // either good or not yet validated) and a login request is made, no
    // prompting is done, instead the existing credentials are reused, or if we
    // are waiting on credential validation, no action is taken.
    test('no prompting if non-invalid credentials are available', function() {
      app.check_user_credentials(undefined, undefined, function() {});
      var view = app.getViewInfo('login').instance;
      assert.isTrue(view._prompted);
      assert.isTrue(view.waiting);
      view._prompted = false;
      app.check_user_credentials(undefined, undefined, function() {});
      assert.isFalse(view._prompted);
    });

  });


  describe('login server interaction', function() {
    var conn, env, utils, juju, makeLoginView, views, app;
    var test = it; // We aren't really doing BDD so let's be more direct.

    before(function() {
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      juju = Y.namespace('juju');
      makeLoginView = function() {
        var view = new views.LoginView({env: env});
        // Disable actually prompting.
        view._prompt = function() {};
        return view;
      };
    });

    beforeEach(function() {
      var container = Y.Node.create('<div/>');
      conn = new utils.SocketStub();
      env = new juju.Environment({conn: conn});
      env.connect();
      conn.open();
      app = new Y.juju.App({env: env, container: container});
    });

    afterEach(function() {
      env.destroy();
    });

    test('the login method actually sends a message ', function() {
      env.login('user', 'pass');
      assert.equal(conn.last_message().op, 'login');
    });

    test('the login view contacts the server to verify credentials', function() {
      var view = makeLoginView();
      var user = 'Will Smith';
      var password = 'I am legend!';
      // If we ask the view to validate credentials, a login message will be sent
      // to the server.
      view.validateCredentials(user, password);
      var msg = conn.last_message();
      assert.equal(msg.op, 'login');
      assert.equal(msg.user, user);
      assert.equal(msg.password, password);
    });

    test('successful credential verification messages are handled', function() {
      var view = makeLoginView();
      assert.isFalse(view.userIsAuthenticated);
      env.fire('login', {data: {result: 'success'}});
      assert.isTrue(view.userIsAuthenticated);
    });

    test('failed credential verification messages are handled', function() {
      var view = makeLoginView();
      assert.isFalse(view.userIsAuthenticated);
      env.fire('login', {data: {}});
      assert.isFalse(view.userIsAuthenticated);
    });

  });
})();
