'use strict';

(function () {
describe('juju login view', function() {
  var Y, conn, env, makeLoginView, views, app;
  var test = it; // We aren't really doing BDD so let's be more direct.

  before(function(done) {
    Y = YUI(GlobalConfig).use('juju-gui', 'juju-tests-utils',
      function(Y) {
        views = Y.namespace('juju.views');
        makeLoginView = function() {
          return new views.LoginView({env: env});
        };
        done()
      });
  });

  beforeEach(function() {
    var container = Y.Node.create('<div/>');
    conn = new Y.namespace('juju-tests.utils').SocketStub();
    env = new Y.namespace('juju').Environment({conn: conn});
    env.connect();
    conn.open();
//    app = new Y.juju.App({env: env, container: container});
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

  test('making requests while unauthorized prompts for credentials',
      function() {
        var view = makeLoginView();
      });
});
})();
