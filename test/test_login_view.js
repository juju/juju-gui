'use strict';

YUI(GlobalConfig).use(['juju-gui', 'juju-views', 'juju-tests-utils'], function(Y) {

  describe('login mechanism', function() {
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

    test('login form can be instantiated', function() {
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

    test('login messages from the server affect state', function() {
      var view = makeLoginView();
      env.fire('login', {data: {result: 'success'}});
      assert.equal(view.userIsAuthenticated, true);
    });

    test('the login checker is registered first for all routes',
        function() {
          assert.equal(app.match('/')[0].callback, 'check_user_credentials');
        });

    test('unauthorized requests prompt for credentials', function() {
      var view = makeLoginView();
      var userWasPrompted = false;
      var fauxLoginView = {
        promptUser: function() {
          userWasPrompted = true;
          view.promptUser();
        },
        get: function(name) {
          view.get(name);
        }
      };
      app.getViewInfo('login').instance = fauxLoginView;
      app.check_user_credentials(undefined, undefined, function () {});
      assert.isTrue(userWasPrompted);
    });

    test('unauthorized requests do not call next()', function() {
      var nextWasCalled = false;
      var next = function() {
        nextWasCalled = true;
      }
      app.check_user_credentials(undefined, undefined, next);
      assert.isFalse(nextWasCalled);
    });

    test('requests made while waiting for login results are ignored',
        function() {
      var view = makeLoginView();
      var userWasPrompted = false;
      var fauxLoginView = {
        promptUser: function() {
          userWasPrompted = true;
          view.promptUser();
        },
        get: function(name) {
          view.get(name);
        }
      };
      app.getViewInfo('login').instance = fauxLoginView;
      app.check_user_credentials(undefined, undefined, function () {});
      assert.isTrue(userWasPrompted);
      assert.isTrue(view.get('waiting'));
      userWasPrompted = false;
      app.check_user_credentials(undefined, undefined, function () {});
      assert.isFalse(userWasPrompted);
    });
  });
});
