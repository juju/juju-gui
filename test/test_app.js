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

function injectData(app, data) {
  var d = data || {
    'result': [
      ['service', 'add',
       {'charm': 'cs:precise/wordpress-6',
         'id': 'wordpress', 'exposed': false}],
      ['service', 'add', {'charm': 'cs:precise/mysql-6', 'id': 'mysql'}],
      ['relation', 'add',
       {'interface': 'reversenginx', 'scope': 'global',
         'endpoints': [['wordpress', {'role': 'peer', 'name': 'loadbalancer'}]],
         'id': 'relation-0000000002'}],
      ['relation', 'add',
       {'interface': 'mysql',
         'scope': 'global', 'endpoints':
         [['mysql', {'role': 'server', 'name': 'db'}],
           ['wordpress', {'role': 'client', 'name': 'db'}]],
         'id': 'relation-0000000001'}],
      ['machine', 'add',
       {'agent-state': 'running', 'instance-state': 'running',
         'id': 0, 'instance-id': 'local', 'dns-name': 'localhost'}],
               ['unit', 'add',
                {'machine': 0, 'agent-state': 'started',
          'public-address': '192.168.122.113', 'id': 'wordpress/0'}],
      ['unit', 'add',
       {'machine': 0, 'agent-state': 'started',
                  'public-address': '192.168.122.222', 'id': 'mysql/0'}]],
    'op': 'delta'};
  app.env.dispatch_result(d);
  return app;
}

(function() {

  describe('Application basics', function() {
    var Y, app, container, utils, juju, env, conn;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          ['juju-gui', 'juju-tests-utils', 'juju-view-utils', 'juju-views'],
          function(Y) {
            utils = Y.namespace('juju-tests.utils');
            juju = Y.namespace('juju');
            done();
          });
    });

    beforeEach(function() {
      window._gaq = [];
      container = Y.one('#main')
        .appendChild(Y.Node.create('<div/>'))
          .set('id', 'test-container')
          .addClass('container')
          .append(Y.Node.create('<span/>')
            .set('id', 'environment-name'))
          .append(Y.Node.create('<span/>')
            .addClass('provider-type'))
          .hide();

    });

    afterEach(function(done) {
      app.after('destroy', function() {
        container.remove(true);
        sessionStorage.setItem('credentials', null);
        done();
      });

      app.destroy();
    });

    function constructAppInstance(config) {
      config = config || {};
      if (config.env && config.env.connect) {
        config.env.connect();
      }
      config.container = container;
      config.viewContainer = container;

      app = new Y.juju.App(config);
      app.navigate = function() {};
      app.showView(new Y.View());
      injectData(app);
      return app;
    }

    it('should not have login credentials if missing from the configuration',
        function() {
          constructAppInstance({
            env: juju.newEnvironment({ conn: new utils.SocketStub() })
          });
          assert.equal(app.env.get('user'), undefined);
          assert.equal(app.env.get('password'), undefined);
        });

    it('should report backend misconfiguration', function() {
      var config = {
        sandbox: true,
        apiBackend: 'not really a backend'};
      assert.throws(
          function() {
            /* jshint -W031*/
            new Y.juju.App(config);
          },
          'unrecognized backend type: not really a backend');
    });

    it('should propagate login credentials from the configuration',
        function(done) {
          var the_username = 'nehi';
          var the_password = 'moonpie';
          app = new Y.juju.App(
              { container: container,
                user: the_username,
                password: the_password,
                viewContainer: container,
                conn: {close: function() {}}});
          app.after('ready', function() {
            var credentials = app.env.getCredentials();
            credentials.user.should.equal(the_username);
            credentials.password.should.equal(the_password);
            done();
          });
        });

    it('propagates the readOnly option from the configuration', function() {
      app = new Y.juju.App({
        container: container,
        readOnly: true,
        viewContainer: container,
        conn: {close: function() {}}
      });
      assert.isTrue(app.env.get('readOnly'));
    });

    it('should produce a valid index', function() {
      constructAppInstance({
        env: juju.newEnvironment({ conn: new utils.SocketStub() })
      });
      var container = app.get('container');
      container.getAttribute('id').should.equal('test-container');
      container.getAttribute('class').should.include('container');
    });

    it('should display the configured environment name', function() {
      var environment_name = 'This is the environment name.  Deal with it.';
      constructAppInstance({
        env: juju.newEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          }
        }),
        environment_name: environment_name
      });
      assert.equal(
          container.one('#environment-name').get('text'),
          environment_name);
    });

    it('should show a generic environment name if none configured',
       function() {
         constructAppInstance({
           env: juju.newEnvironment({
             conn: {
               send: function() {},
               close: function() {}
             }
           })
         });
         assert.equal(
         container.one('#environment-name').get('text'),
         'Environment');
       });

    it('should show the provider type, when available', function() {
      constructAppInstance({
        env: juju.newEnvironment({ conn: new utils.SocketStub() })
      });
      var providerType = 'excellent provider';
      // Since no provider type has been set yet, none is displayed.
      assert.equal('', container.one('.provider-type').get('text'));
      app.env.set('providerType', providerType);
      // The provider type has been displayed.
      assert.equal(
          'on ' + providerType,
          container.one('.provider-type').get('text')
      );
    });

    it('hides the browser subapp on some urls', function() {
      constructAppInstance({
        env: juju.newEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          }
        })
      });

      // XXX bug:1217383
      // Force an app._controlEvents so that we don't try to bind viewmode
      // controls.
      var fakeEv = {
        detach: function() {}
      };
      app._controlEvents = [fakeEv, fakeEv];

      var checkUrls = [{
        url: '/logout',
        hidden: true
      }, {
        url: '/',
        hidden: false
      }];

      Y.Array.each(checkUrls, function(check) {
        var req = {url: check.url};
        var next = function() {};
        app.toggleStaticViews(req, undefined, next);
        app.get('subApps').charmbrowser.hidden.should.eql(check.hidden);
      });
    });

    it('should display a zoom message on small browsers', function() {
      constructAppInstance({
        env: juju.newEnvironment({ conn: new utils.SocketStub() })
      });
      app._displayZoomMessage(1024, 'linux');
      assert.equal(app.db.notifications.item(0).get('title'),
          'Browser size adjustment');
    });

    it('should not display the zoom message more than once', function() {
      constructAppInstance({
        env: juju.newEnvironment({ conn: new utils.SocketStub() })
      });
      assert.equal(app.db.notifications.size(), 0);
      app._displayZoomMessage(1024, 'linux');
      assert.equal(app.db.notifications.item(0).get('title'),
          'Browser size adjustment');
      app._displayZoomMessage(1024, 'linux');
      assert.equal(app.db.notifications.size(), 1);
    });

    it('should show the correct message on a mac', function() {
      constructAppInstance({
        env: juju.newEnvironment({ conn: new utils.SocketStub() })
      });
      app._displayZoomMessage(1024, 'macintosh');
      assert.isTrue(app.db.notifications.item(0).get(
          'message').indexOf('command+-') !== -1);
    });

    it('should show the correct message for non mac', function() {
      constructAppInstance({
        env: juju.newEnvironment({ conn: new utils.SocketStub() })
      });
      app._displayZoomMessage(1024, 'linux');
      assert.isTrue(app.db.notifications.item(0).get(
          'message').indexOf('ctrl+-') !== -1);
    });
  });
})();


(function() {

  // Sometimes a large display element needs lots of space in the viewport.  To
  // accommodate that eventuality, a set of events can be fired to manage
  // making room for said large elements.

  describe('Viewport takeover handling', function() {
    var Y, app, container, utils, juju, env, conn;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          ['juju-gui', 'juju-tests-utils', 'juju-view-utils', 'juju-views'],
          function(Y) {
            utils = Y.namespace('juju-tests.utils');
            juju = Y.namespace('juju');
            done();
          });
    });

    beforeEach(function() {
      container = Y.one('#main')
        .appendChild(Y.Node.create('<div/>'))
          .set('id', 'test-container')
          .addClass('container')
          .append(Y.Node.create('<span/>')
            .set('id', 'environment-name'))
          .append(Y.Node.create('<span/>')
            .addClass('provider-type'))
          .hide();

    });

    afterEach(function(done) {
      app.after('destroy', function() {
        container.remove(true);
        sessionStorage.setItem('credentials', null);
        done();
      });

      app.destroy();
    });

    function constructAppInstance(config) {
      config = config || {};
      if (config.env && config.env.connect) {
        config.env.connect();
      }
      config.container = container;
      config.viewContainer = container;

      app = new Y.juju.App(config);
      app.navigate = function() {};
      app.showView(new Y.View());
      injectData(app);
      return app;
    }

    it('minimizes the sidebar on envTakeoverStarting', function(done) {
      app = constructAppInstance({
        env: juju.newEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          }
        })
      });

      // When a viewportTakeoverStarting event is fired the app minimizes the
      // sidebar.
      app.get('subApps').charmbrowser.on('viewNavigate', function(ev) {
        assert.equal(ev.change.viewmode, 'minimized');
        done();
      });

      // Setup an environment view instance.
      app.show_environment({}, {}, function() {return;});
      app.views.environment.instance.fire('envTakeoverStarting');
    });

    it('restores the sidebar on envTakeoverEnding', function(done) {
      app = constructAppInstance({
        env: juju.newEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          }
        })
      });

      app.show_environment({}, {}, function() {return;});
      app.views.environment.instance.fire('envTakeoverStarting');

      // When a viewportTakeoverEnding event is fired the app restoes the
      // sidebar.
      app.get('subApps').charmbrowser.on('viewNavigate', function(ev) {
        assert.equal(ev.change.viewmode, 'sidebar');
        done();
      });

      app.views.environment.instance.fire('envTakeoverEnding');
    });

  });
})();


(function() {

  describe('Application authentication', function() {
    var FAKE_VIEW_NAME, LOGIN_VIEW_NAME;
    var conn, container, destroyMe, env, juju, utils, Y;
    var requirements = ['juju-gui', 'juju-tests-utils', 'juju-views'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        juju = Y.namespace('juju');
        FAKE_VIEW_NAME = 'FakeView';
        LOGIN_VIEW_NAME = 'LoginView';
        done();
      });
    });

    beforeEach(function(done) {
      container = utils.makeContainer(this, 'container');
      conn = new utils.SocketStub();
      env = juju.newEnvironment({conn: conn});
      env.setCredentials({user: 'user', password: 'password'});
      destroyMe = [env];
      done();
    });

    afterEach(function(done) {
      sessionStorage.setItem('credentials', null);
      Y.each(destroyMe, function(item) {
        item.destroy();
      });
      done();
    });

    // Create and return a new app. If connect is True, also connect the env.
    var makeApp = function(connect, fakeview) {
      var app = new Y.juju.App({
        env: env,
        viewContainer: container,
        consoleEnabled: true
      });
      app.navigate = function() { return true; };
      if (fakeview) {
        var fakeView = new Y.View();
        fakeView.name = FAKE_VIEW_NAME;
        app.showView(fakeView);
      }
      if (connect) {
        env.connect();
      }
      destroyMe.push(app);
      return app;
    };

    // Ensure the given message is a login request.
    var assertIsLogin = function(message) {
      assert.equal('Admin', message.Type);
      assert.equal('Login', message.Request);
    };

    it('avoids trying to login if the env is not connected', function(done) {
      var app = makeApp(false); // Create a disconnected app.
      app.after('ready', function() {
        assert.equal(0, conn.messages.length);
        done();
      });
    });

    it('tries to login if the env connection is established', function(done) {
      var app = makeApp(true); // Create a connected app.
      app.after('ready', function() {
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('avoids trying to login without credentials', function(done) {
      env.setCredentials(null);
      var app = makeApp(true); // Create a connected app.
      app.navigate = function() { return; };
      app.after('ready', function() {
        assert.equal(app.env.getCredentials(), null);
        assert.equal(conn.messages.length, 0);
        done();
      });
    });

    it('uses the authtoken when there are no credentials', function(done) {
      var app = makeApp(false);
      // Override the local window.location object.
      app.location = {search: '?authtoken=demoToken'};
      env.setCredentials(null);
      env.connect();
      app.after('ready', function() {
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          RequestId: 1,
          Type: 'GUIToken',
          Request: 'Login',
          Params: {Token: 'demoToken'}
        });
        done();
      });
    });

    it('handles multiple authtokens', function(done) {
      var app = makeApp(false);
      // Override the local window.location object.
      app.location = {search: '?authtoken=demoToken&authtoken=discarded'};
      env.setCredentials(null);
      env.connect();
      app.after('ready', function() {
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          RequestId: 1,
          Type: 'GUIToken',
          Request: 'Login',
          Params: {Token: 'demoToken'}
        });
        done();
      });
    });

    it('ignores the authtoken if credentials exist', function(done) {
      var app = makeApp(false);
      // Override the local window.location object.
      app.location = {search: '?authtoken=demoToken'};
      env.connect();
      app.after('ready', function() {
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('displays the login view if credentials are not valid', function(done) {
      var app = makeApp(true); // Create a connected app.
      app.after('ready', function() {
        app.env.login();
        // Mimic a login failed response assuming login is the first request.
        conn.msg({RequestId: 1, Error: 'Invalid user or password'});
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        assert.equal(LOGIN_VIEW_NAME, app.get('activeView').name);
        done();
      });
    });

    it('login method handler is called after successful login', function(done) {
      var oldOnLogin = Y.juju.App.prototype.onLogin;
      Y.juju.App.prototype.onLogin = function(e) {
        // Clean up.
        Y.juju.App.prototype.onLogin = oldOnLogin;
        // Begin assertions.
        assert.equal(conn.messages.length, 1);
        assertIsLogin(conn.last_message());
        assert.isTrue(e.data.result, true);
        done();
      };
      var app = new Y.juju.App({ env: env, viewContainer: container });
      env.connect();
      app.env.userIsAuthenticated = true;
      app.env.login();
      app.destroy(true);
    });

    it('navigates to requested url on login', function() {
      // The difference between this test and the following one is that this
      // tests the path where there is no hash in the url.
      var stubit = utils.makeStubMethod;
      var oldPopRedirectMethod = Y.juju.App.prototype.popLoginRedirectPath;
      Y.juju.App.prototype.popLoginRedirectPath = function() {
        Y.juju.App.prototype.popLoginRedirectPath = oldPopRedirectMethod;
        return '/foo/bar';
      };
      var app = makeApp(false);
      stubit(app, 'hideMask');
      stubit(app, 'navigate');
      stubit(app, 'dispatch');
      app.onLogin({ data: { result: true } });
      assert.equal(app.navigate.calledOnce(), true);
      assert.deepEqual(app.navigate.lastArguments(), [
        '/foo/bar',
        { overrideAllNamespaces: true }]);
      // dispatch should not be called if there is no hash in the url.
      // dispatch should be called in the test below where there is a hash.
      assert.equal(app.dispatch.calledOnce(), false);
    });

    it('navigates to requested url with hash on login', function() {
      // In order to support bookmarking the current tab in the charm details
      // we have navigateOnHash http://yuilibrary.com/yui/docs/api/classes/
      // PjaxBase.html#attr_navigateOnHash set to false. This causes issues
      // if the user is not yet logged in and requests a url with a hash in it
      // becaause the router will then refuse to navigate to it. By navigating
      // then manually dispatching it forces the application to render the
      // proper view.
      var stubit = utils.makeStubMethod;
      var oldPopRedirectMethod = Y.juju.App.prototype.popLoginRedirectPath;
      Y.juju.App.prototype.popLoginRedirectPath = function() {
        Y.juju.App.prototype.popLoginRedirectPath = oldPopRedirectMethod;
        return '/foo/bar#baz';
      };
      var app = makeApp(false);
      stubit(app, 'hideMask');
      stubit(app, 'navigate');
      stubit(app, 'dispatch');
      app.onLogin({ data: { result: true } });
      assert.equal(app.navigate.calledOnce(), true);
      assert.deepEqual(app.navigate.lastArguments(), [
        '/foo/bar#baz',
        { overrideAllNamespaces: true }]);
      assert.equal(app.dispatch.calledOnce(), true);
    });

    it('creates a notification if logged in with a token', function(done) {
      // We need to change the prototype before we instantiate.
      // See the "this.reset()" call in the callback below that cleans up.
      var stub = utils.makeStubMethod(Y.juju.App.prototype, 'onLogin');
      var app = makeApp(false);
      utils.makeStubMethod(app, 'hideMask');
      app.redirectPath = '/foo/bar/';
      app.location = {
        toString: function() {return '/login/';},
        search: '?authtoken=demoToken'};
      utils.makeStubMethod(app.env, 'onceAfter');
      utils.makeStubMethod(app, 'navigate');
      stub.addCallback(function() {
        // Clean up.
        this.reset();
        // Begin assertions.
        var e = this.lastArguments()[0];
        // These two really simply verify that our test prep did what we
        // expected.
        assert.equal(e.data.result, true);
        assert.equal(e.data.fromToken, true);
        this.passThroughToOriginalMethod(app);
        assert.equal(app.hideMask.calledOnce(), true);
        assert.equal(app.env.onceAfter.calledOnce(), true);
        var onceAfterArgs = app.env.onceAfter.lastArguments();
        assert.equal(onceAfterArgs[0], 'environmentNameChange');
        // Call the event handler so we can verify what it does.
        onceAfterArgs[1].call(onceAfterArgs[2]);
        assert.equal(
            app.db.notifications.item(0).get('title'),
            'Logged in with Token');
        assert.equal(app.navigate.calledOnce(), true);
        var navigateArgs = app.navigate.lastArguments();
        assert.equal(navigateArgs[0], '/foo/bar/');
        assert.deepEqual(navigateArgs[1], {overrideAllNamespaces: true});
        done();
      });
      env.setCredentials(null);
      env.connect();
      conn.msg({
        RequestId: conn.last_message().RequestId,
        Response: {AuthTag: 'tokenuser', Password: 'tokenpasswd'}});
    });

    it('tries to log in on first connection', function(done) {
      // This is the case when credential are stashed.
      var app = makeApp(true); // Create a disconnected app.
      app.after('ready', function() {
        env.connect();
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('tries to re-login on disconnections', function(done) {
      // This is the case when credential are stashed.
      var app = makeApp(true); // Create a connected app.
      app.after('ready', function() {
        // Disconnect and reconnect the WebSocket.
        conn.transient_close();
        conn.open();
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('should allow logging out', function() {
      env.connect();
      env.logout();
      assert.equal(false, env.userIsAuthenticated);
      assert.equal(null, env.getCredentials());
    });

    it('normally uses window.location', function() {
      // A lot of the app's authentication dance uses window.location,
      // both for redirects after login and for authtokens.  For tests,
      // the app copies window.location to app.location, so that we
      // can easily override it.  This test verifies that the initialization
      // actually does stash window.location as we exprect.
      var app = makeApp(false);
      assert.strictEqual(window.location, app.location);
    });

    describe('popLoginRedirectPath', function() {
      it('returns and clears redirectPath', function() {
        var app = makeApp(false);
        app.redirectPath = '/foo/bar/';
        app.location = {toString: function() {return '/login/';}};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('prefers the current path if not login', function() {
        var app = makeApp(false);
        app.redirectPath = '/';
        app.location = {toString: function() {return '/foo/bar/';}};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login/', function() {
        var app = makeApp(false);
        app.redirectPath = '/login/';
        app.location = {toString: function() {return '/login/';}};
        assert.equal(app.popLoginRedirectPath(), '/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login', function() {
        var app = makeApp(false);
        // Missing trailing slash is only difference from previous test.
        app.redirectPath = '/login';
        app.location = {toString: function() {return '/login';}};
        assert.equal(app.popLoginRedirectPath(), '/');
        assert.isUndefined(app.redirectPath);
      });
    });

    describe('currentUrl', function() {
      it('returns the full current path', function() {
        var app = makeApp(false);
        var expected = '/foo/bar/';
        app.location = {
          toString: function() {return 'https://foo.com' + expected;}};
        assert.equal(expected, app.get('currentUrl'));
        expected = '/';
        assert.equal(expected, app.get('currentUrl'));
        expected = '/foo/?bar=bing#shazam';
        assert.equal(expected, app.get('currentUrl'));
      });

      it('ignores authtokens', function() {
        // This is intended to be the canonical current path.  This should
        // never include authtokens, which are transient and can never be
        // re-used.
        var app = makeApp(false);
        var expected_path = '/foo/bar/';
        var expected_querystring = '';
        var expected_hash = '';
        var expected = function(add_authtoken) {
          var result = expected_path;
          var querystring = expected_querystring;
          if (add_authtoken) {
            querystring += '&authtoken=demoToken';
          }
          if (querystring) {
            result += '?' + querystring;
          }
          result += expected_hash;
          return result;
        };
        app.location = {
          toString: function() {return 'https://foo.com' + expected(true);}};
        assert.equal(expected(), app.get('currentUrl'));
        expected_path = '/';
        assert.equal(expected(), app.get('currentUrl'));
        expected_path = '/foo/';
        expected_querystring = 'bar=bing';
        expected_hash = '#shazam';
        assert.equal(expected(), app.get('currentUrl'));
      });
    });

  });
})();

(function() {

  describe('Application Connection State', function() {
    var container, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'],
          function(Y) {
            container = Y.Node.create(
                '<div id="test" class="container"></div>');
            done();
          });
    });

    it('should be able to handle env connection status changes', function() {
      var juju = Y.namespace('juju'),
          conn = new Y['juju-tests'].utils.SocketStub(),
          env = juju.newEnvironment({
            conn: conn,
            user: 'user',
            password: 'password'
          }),
          app = new Y.juju.App({env: env, container: container}),
          reset_called = false,
          dispatch_called = false,
          login_called = false,
          noop = function() {return this;};
      app.showView(new Y.View());

      // Mock the database.
      app.db = {
        // Mock out notifications, so the application can start normally.
        notifications: {
          addTarget: noop,
          after: noop,
          filter: noop,
          map: noop,
          on: noop,
          size: function() {return 0;}
        },
        reset: function() {
          reset_called = true;
        }
      };
      app.dispatch = function() {
        // We want to verify that we are called after the value is set, so
        // check_user_credentials can look at this value reliably.
        if (env.get('connected')) {
          dispatch_called = true;
        }
      };
      env.login = function() {
        login_called = true;
      };
      env.connect();
      conn.open();
      // We need to fake the connection event.
      reset_called.should.equal(true);
      //dispatch_called.should.equal(true);
      login_called.should.equal(true);

      // Trigger a second time and verify.
      conn.transient_close();
      reset_called = false;
      login_called = false;
      conn.open();
      reset_called.should.equal(true);
      //dispatch_called.should.equal(true);
      app.destroy();
    });

  });
})();

(function() {

  describe('Application sandbox mode', function() {
    var Y, app, container, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
    });

    afterEach(function() {
      if (app) {
        app.destroy({remove: true});
      }
    });

    it('instantiates correctly', function() {
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            sandbox: true,
            apiBackend: 'python',
            consoleEnabled: true,
            user: 'admin',
            password: 'admin',
            store: new Y.juju.charmworld.APIv3({})
          });
      app.showView(new Y.View());
      // This simply walks through the hierarchy to show that all the
      // necessary parts are there.
      assert.isObject(app.env.get('conn').get('juju').get('state'));
    });
  });

})();

(function() {

  describe('configuration parsing', function() {

    var Y, app, container, getLocation;

    before(function(done) {
      console.log('Loading App prefetch test code');
      Y = YUI(GlobalConfig).use(
          ['juju-gui'], function(Y) {
            done();
          });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      // Monkey patch.
      getLocation = Y.getLocation;
      Y.getLocation = function() {
        return {port: 71070, hostname: 'example.net'};
      };
    });

    afterEach(function() {
      Y.getLocation = getLocation;
      container.destroy();
      app.destroy();
    });

    it('should honor socket_url', function() {
      // The app passes it through to the environment.
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            socket_url: 'wss://example.com/',
            conn: {close: function() {}} });
      app.showView(new Y.View());
      assert.equal(app.env.get('socket_url'), 'wss://example.com/');
    });

    it('should honor socket_port', function() {
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            socket_port: '8080' ,
            conn: {close: function() {}} });
      app.showView(new Y.View());
      assert.equal(
          app.env.get('socket_url'),
          'wss://example.net:8080/ws');
    });

    it('should honor socket_protocol', function() {
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            socket_protocol: 'ws',
            conn: {close: function() {}} });
      app.showView(new Y.View());
      assert.equal(
          app.env.get('socket_url'),
          'ws://example.net:71070/ws');
    });

    it('should support combining socket_port and socket_protocol', function() {
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            socket_protocol: 'ws',
            socket_port: '8080',
            conn: {close: function() {}} });
      app.showView(new Y.View());
      assert.equal(
          app.env.get('socket_url'),
          'ws://example.net:8080/ws');
    });

    it('should allow socket_port to override socket_url', function() {
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            socket_port: '8080',
            socket_url: 'fnord',
            conn: {close: function() {}} });
      app.showView(new Y.View());
      assert.equal(
          app.env.get('socket_url'),
          'wss://example.net:8080/ws');
    });

    it('should allow socket_protocol to override socket_url', function() {
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            socket_protocol: 'ws',
            socket_url: 'fnord',
            conn: {close: function() {}} });
      app.showView(new Y.View());
      assert.equal(
          app.env.get('socket_url'),
          'ws://example.net:71070/ws');
    });
  });

})();
