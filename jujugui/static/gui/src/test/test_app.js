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

describe('App', function() {
  var jujuConfig, container, testUtils, yui;

  before(done => {
    YUI(GlobalConfig).use(['juju-tests-utils'], function(Y) {
      yui = Y;
      testUtils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(() => {
    jujuConfig = window.juju_config;
    window.juju_config = {
      charmstoreURL: 'http://1.2.3.4/',
      plansURL: 'http://plans.example.com/',
      termsURL: 'http://terms.example.com/'
    };
    container = testUtils.makeAppContainer(yui);
  });

  afterEach(() => {
    window.juju_config = jujuConfig;
    container.remove(true);
  });

  describe('Application basics', function() {
    var Y, app, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-gui',
        'juju-tests-utils',
        'juju-view-utils',
        'juju-views',
        'environment-change-set'
      ],
      function(Y) {
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      window._gaq = [];
    });

    afterEach(function(done) {
      // Reset the flags.
      window.flags = {};
      app.after('destroy', function() {
        sessionStorage.setItem('credentials', null);
        done();
      });
    });

    function constructAppInstance(config, context) {
      config = config || {};
      config.jujuCoreVersion = config.jujuCoreVersion || '2.0.0';
      config.controllerAPI = config.controllerAPI || new juju.ControllerAPI({
        conn: new testUtils.SocketStub()
      });
      config.container = container;
      config.viewContainer = container;
      app = new Y.juju.App(Y.mix(config, {
        baseUrl: 'http://0.0.0.0:6543/',
        consoleEnabled: true,
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api'
      }));
      if (config.env && config.env.connect) {
        config.env.connect();
        config.env.ecs = new juju.EnvironmentChangeSet();
      }
      context._cleanups.push(() => {
        const env = config.env;
        if (env && env.connect) {
          env.close(app.destroy.bind(app));
        } else {
          app.destroy();
        }
      });
      app.navigate = function() {};
      app.showView(new Y.View());
      injectData(app);
      return app;
    }

    it('should not have login credentials if missing from the configuration',
        function() {
          constructAppInstance({
            env: new juju.environments.GoEnvironment({
              conn: new testUtils.SocketStub(),
              ecs: new juju.EnvironmentChangeSet()
            })
          }, this);
          assert.equal(app.env.get('user'), undefined);
          assert.equal(app.env.get('password'), undefined);
        });

    it('should propagate login credentials from the configuration',
        function() {
          const user = 'nehi';
          const password = 'moonpie';
          const conn = new testUtils.SocketStub();
          const ecs = new juju.EnvironmentChangeSet();
          const env = new juju.environments.GoEnvironment({
            conn: conn,
            ecs: ecs,
            user: user,
            password: password
          });
          env.connect();
          app = new Y.juju.App({
            baseUrl: 'http://example.com/',
            controllerAPI: new juju.ControllerAPI({
              conn: new testUtils.SocketStub()
            }),
            env: env,
            container: container,
            consoleEnabled: true,
            user: user,
            password: password,
            viewContainer: container,
            conn: conn,
            jujuCoreVersion: '2.0-trusty-amd64',
            controllerSocketTemplate: '/api',
            socketTemplate: '/model/$uuid/api',
            ecs: ecs});
          this._cleanups.push(() => {
            env.close(app.destroy.bind(app));
          });
          var credentials = app.env.getCredentials();
          assert.equal(credentials.user, user + '@local');
          assert.equal(credentials.password, password);
        });

    it('should produce a valid index', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        })
      }, this);
      var container = app.get('container');
      container.getAttribute('id').should.equal('test-container');
      container.getAttribute('class').should.include('container');
    });

    describe('MAAS support', function() {
      var env, maasNode;

      beforeEach(function() {
        // Set up the MAAS link node.
        maasNode = Y.Node.create(
            '<div id="maas-server" style="display:none">' +
            '  <a href="">MAAS UI</a>' +
            '</div>');
        container.appendChild(maasNode);
        // Create the environment.
        env = new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        });
      });

      afterEach(function() {
        container.one('#maas-server').remove(true);
      });

      // Ensure the given MAAS node is shown and includes a link to the given
      // address.
      var assertMaasLinkExists = function(node, address) {
        assert.strictEqual(node.getStyle('display'), 'block');
        assert.strictEqual(node.one('a').get('href'), address);
      };

      it('shows a link to the MAAS server if provider is MAAS', function() {
        constructAppInstance({env: env}, this);
        // The MAAS node is initially hidden.
        assert.strictEqual(maasNode.getStyle('display'), 'none');
        env.set('maasServer', 'http://1.2.3.4/MAAS');
        // Once the MAAS server becomes available, the node is activated and
        // includes a link to the server.
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
        // Further changes to the maasServer attribute don't change the link.
        env.set('maasServer', 'http://example.com/MAAS');
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
      });

      it('shows a link to the MAAS server if already in the env', function() {
        env.set('maasServer', 'http://1.2.3.4/MAAS');
        constructAppInstance({env: env}, this);
        // The link to the MAAS server should be already activated.
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
        // Further changes to the maasServer attribute don't change the link.
        env.set('maasServer', 'http://example.com/MAAS');
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
      });

      it('does not show the MAAS link if provider is not MAAS', function() {
        constructAppInstance({env: env}, this);
        // The MAAS node is initially hidden.
        assert.strictEqual(maasNode.getStyle('display'), 'none');
        env.set('maasServer', null);
        // The MAAS node is still hidden.
        assert.strictEqual(maasNode.getStyle('display'), 'none');
        // Further changes to the maasServer attribute don't activate the link.
        env.set('maasServer', 'http://1.2.3.4/MAAS');
        assert.strictEqual(maasNode.getStyle('display'), 'none');
      });

      it('does not show the MAAS link if already null in the env', function() {
        env.set('maasServer', null);
        constructAppInstance({env: env}, this);
        assert.strictEqual(maasNode.getStyle('display'), 'none');
        // Further changes to the maasServer attribute don't activate the link.
        env.set('maasServer', 'http://1.2.3.4/MAAS');
        assert.strictEqual(maasNode.getStyle('display'), 'none');
      });

    });

    describe('_setupCharmstore', function() {
      it('is called on application instantiation', function() {
        var setup = sinon.stub(Y.juju.App.prototype, '_setupCharmstore');
        this._cleanups.push(setup.restore);
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new testUtils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet(),
            user: 'user',
            password: 'password'
          })
        }, this);
        assert.equal(setup.callCount, 1);
      });

      it('is idempotent', function() {
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new testUtils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet(),
            user: 'user',
            password: 'password'
          })
        }, this);
        // The charmstore attribute is undefined by default
        assert.equal(typeof app.get('charmstore'), 'object');
        assert.equal(app.get('charmstore').url, 'http://1.2.3.4/v5');
        window.juju_config.charmstoreURL = 'it broke';
        assert.equal(
            app.get('charmstore').url,
            'http://1.2.3.4/v5',
            'It should only ever create a single instance of the charmstore');
      });
    });

    describe('romulus services', function() {
      it('sets up API clients', function() {
        app = constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new testUtils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet(),
            user: 'user',
            password: 'password'
          })
        }, this);
        assert.strictEqual(app.plans instanceof window.jujulib.plans, true);
        assert.strictEqual(app.plans.url, 'http://plans.example.com/v2');
        assert.strictEqual(app.plans.bakery.macaroonName, 'Macaroons-plans');
        assert.strictEqual(app.terms instanceof window.jujulib.terms, true);
        assert.strictEqual(app.terms.url, 'http://terms.example.com/v1');
        assert.strictEqual(app.terms.bakery.macaroonName, 'Macaroons-terms');
      });
    });

  });


  describe('File drag over notification system', function() {
    var Y, app, env, juju;

    before(function(done) {
      // Need to define the container before the juju-gui module is loaded so
      // that the DOM exists when it initializes.
      container = testUtils.makeAppContainer(yui);
      Y = YUI(GlobalConfig).use(
          ['juju-gui', 'juju-tests-utils', 'juju-view-utils', 'juju-views'],
          function(Y) {
            juju = Y.namespace('juju');
            done();
          });
    });

    beforeEach(function() {
      env = new juju.environments.GoEnvironment({
        conn: new testUtils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet()
      });
    });

    afterEach(function(done) {
      env.close(() => {
        app.destroy();
        sessionStorage.setItem('credentials', null);
        done();
      });
    });

    function constructAppInstance(config, context) {
      config = config || {};
      config.controllerAPI = config.controllerAPI || new juju.ControllerAPI({
        conn: new testUtils.SocketStub(),
      });
      config.baseUrl = 'http://example.com';
      config.env = config.env || env;
      config.container = container;
      config.viewContainer = container;
      config.jujuCoreVersion = '2.0.0';
      config.consoleEnabled = true;
      config.controllerSocketTemplate = '/api';
      app = new Y.juju.App(config);
      env.connect();
      return app;
    }

    describe('drag event attach and detach', function() {
      it('binds the drag handlers', function() {
        var stub = sinon.stub(document, 'addEventListener');
        this._cleanups.push(stub.restore);
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new testUtils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet(),
            user: 'user',
            password: 'password'
          })
        }, this);
        assert.equal(stub.callCount, 3);
        var args = stub.args;
        assert.equal(args[0][0], 'dragenter');
        assert.isFunction(args[0][1]);
        assert.equal(args[1][0], 'dragover');
        assert.isFunction(args[1][1]);
        assert.equal(args[2][0], 'dragleave');
        assert.isFunction(args[2][1]);
      });

      it('removes the drag handlers', function(done) {
        var stub = sinon.stub(document, 'removeEventListener');
        this._cleanups.push(stub.restore);
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new testUtils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet(),
            user: 'user',
            password: 'password'
          })
        }, this);

        app.after('destroy', function() {
          assert.equal(stub.callCount, 3);
          var args = stub.args;
          assert.equal(args[0][0], 'dragenter');
          assert.isFunction(args[0][1]);
          assert.equal(args[1][0], 'dragover');
          assert.isFunction(args[1][1]);
          assert.equal(args[2][0], 'dragleave');
          assert.isFunction(args[2][1]);
          done();
        });
        app.destroy();
      });
    });

    describe('_determineFileType', function() {
      beforeEach(function() {
        // This gets cleaned up by the parent after function.
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new testUtils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet(),
            user: 'user',
            password: 'password'
          })
        }, this);
      });

      it('returns false if it\'s not a file being dragged', function() {
        var result = app._determineFileType({
          types: ['foo']
        });
        // It should have returned false if it's not a file because then it is
        // something being dragged inside the browser.
        assert.equal(result, false);
      });

      it('returns "zip" for zip files', function() {
        var result = app._determineFileType({
          types: ['Files'],
          items: [{ type: 'application/zip' }]
        });
        assert.equal(result, 'zip');
      });

      it('returns "zip" for zip files in IE', function() {
        // IE uses a different mime type than other browsers.
        var result = app._determineFileType({
          types: ['Files'],
          items: [{ type: 'application/x-zip-compressed' }]
        });
        assert.equal(result, 'zip');
      });

      it('returns "yaml" for the yaml mime type', function() {
        // At the moment we cannot determine between folders and yaml files
        // across browser so we respond with yaml for now.
        var result = app._determineFileType({
          types: ['Files'],
          items: [{ type: 'application/x-yaml' }]
        });
        assert.equal(result, 'yaml');
      });

      it('returns "" if the browser does not support "items"', function() {
        // IE10 and 11 do not have the dataTransfer.items property during hover
        // so we cannot tell what type of file is being hovered over the canvas.
        // So we will just return the default which is "yaml".
        var result = app._determineFileType({
          types: ['Files']
        });
        assert.equal(result, '');
      });
    });

    describe('UI notifications', function() {

      it('_renderDragOverNotification renders drop UI', function() {
        var fade = sinon.stub();
        var reactdom = sinon.stub(ReactDOM, 'render');
        this._cleanups.push(reactdom.restore);
        app._renderDragOverNotification.call({
          views: {
            environment: {
              instance: {
                fadeHelpIndicator: fade
              }}}
        });
        assert.equal(fade.callCount, 1);
        assert.equal(fade.lastCall.args[0], true);
        assert.equal(reactdom.callCount, 1);
      });

      it('_hideDragOverNotification hides drop UI', function() {
        var fade = sinon.stub();
        var reactdom = sinon.stub(
          ReactDOM, 'unmountComponentAtNode');
        this._cleanups.push(reactdom.restore);
        app._hideDragOverNotification.call({
          views: {
            environment: {
              instance: {
                fadeHelpIndicator: fade
              }}}
        });
        assert.equal(fade.callCount, 1);
        assert.equal(fade.lastCall.args[0], false);
        assert.equal(reactdom.callCount, 1);
      });
    });

    it('dispatches drag events properly: _appDragOverHandler', function() {
      var determineFileTypeStub, renderDragOverStub, dragTimerControlStub;

      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        })
      }, this);

      determineFileTypeStub = sinon.stub(
          app, '_determineFileType').returns('zip');
      renderDragOverStub = sinon.stub(
          app, '_renderDragOverNotification');
      dragTimerControlStub = sinon.stub(
          app, '_dragleaveTimerControl');
      this._cleanups.concat([
        determineFileTypeStub.restore,
        renderDragOverStub.restore,
        dragTimerControlStub
      ]);

      var noop = function() {};
      var ev1 = {
        dataTransfer: 'foo', preventDefault: noop, type: 'dragenter' };
      var ev2 = { dataTransfer: {}, preventDefault: noop, type: 'dragleave' };
      var ev3 = { dataTransfer: {}, preventDefault: noop, type: 'dragover' };

      app._appDragOverHandler(ev1);
      app._appDragOverHandler(ev2);
      app._appDragOverHandler(ev3);

      assert.equal(determineFileTypeStub.callCount, 3);
      assert.equal(renderDragOverStub.calledOnce, true);
      assert.equal(dragTimerControlStub.callCount, 3);
      var args = dragTimerControlStub.args;
      assert.equal(args[0][0], 'start');
      assert.equal(args[1][0], 'start');
      assert.equal(args[2][0], 'stop');
    });

    it('can start and stop the drag timer: _dragLeaveTimerControl', function() {
      var app = constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        })
      }, this);
      app._dragleaveTimerControl('start');
      assert.equal(app._dragLeaveTimer !== undefined, true);
      app._dragleaveTimerControl('stop');
      assert.equal(app._dragLeaveTimer === null, true);
    });

  });


  describe('Application authentication', function() {
    var app, conn, conn2, controller, destroyMe, ecs, env, juju, legacyApp,
        legacyEnv, legacyConn, Y;
    var requirements = [
      'juju-gui', 'juju-tests-utils', 'juju-views', 'environment-change-set'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      conn = new testUtils.SocketStub();
      legacyConn = new testUtils.SocketStub();
      conn2 = new testUtils.SocketStub();
      ecs = new juju.EnvironmentChangeSet();
      env = new juju.environments.GoEnvironment({
        conn: conn,
        ecs: ecs,
        user: 'user',
        password: 'password'
      });
      legacyEnv = new juju.environments.GoLegacyEnvironment({
        conn: legacyConn,
        ecs: ecs,
        user: 'user',
        password: 'password'
      });
      controller = new juju.ControllerAPI({
        conn: conn2,
        user: 'user',
        password: 'password'
      });
      env.setCredentials({user: 'user', password: 'password'});
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        consoleEnabled: true,
        controllerAPI: controller,
        env: env,
        controllerSocketTemplate: '/api',
        jujuCoreVersion: '2.0.0',
        viewContainer: container
      });
      app.navigate = function() { return true; };
      legacyApp = new Y.juju.App({
        baseUrl: 'http://example.com/',
        consoleEnabled: true,
        controllerAPI: controller,
        controllerSocketTemplate: '/api',
        env: legacyEnv,
        jujuCoreVersion: '1.25.6',
        viewContainer: container
      });
      legacyApp.navigate = function() { return true; };
      destroyMe = [ecs, controller];
    });

    afterEach(function(done) {
      env.close(() => {
        legacyEnv.close(() => {
          controller.close(() => {
            app.destroy();
            legacyApp.destroy();
            sessionStorage.setItem('credentials', null);
            destroyMe.forEach(item => {
              item.destroy();
            });
            done();
          });
        });
      });
    });

    // Ensure the given message is a login request.
    var assertIsLogin = function(message) {
      assert.equal(message.type, 'Admin');
      assert.equal(message.request, 'Login');
    };

    it('avoids trying to login if the env is not connected', function() {
      assert.equal(0, conn.messages.length);
    });

    it('tries to login if the env connection is established', function() {
      env.connect();
      assert.equal(1, conn.messages.length);
      assertIsLogin(conn.last_message());
    });

    it('avoids trying to login without credentials', function() {
      sessionStorage.clear();
      env.setAttrs({
        user: null,
        password: null
      });
      env.setCredentials(null);
      app.navigate = function() { return; };
      assert.deepEqual(
        app.env.getCredentials(), {user: '', password: '', macaroons: null});
      assert.equal(conn.messages.length, 0);
    });

    it('uses the auth token if there are no credentials', function() {
      // Override the local window.location object.
      legacyApp.location = {search: '?authtoken=demoToken'};
      legacyEnv.setCredentials(null);
      legacyEnv.connect();
      assert.equal(legacyConn.messages.length, 1);
      assert.deepEqual(legacyConn.last_message(), {
        RequestId: 1,
        Type: 'GUIToken',
        Version: 0,
        Request: 'Login',
        Params: {Token: 'demoToken'}
      });
    });

    it('handles multiple authtokens', function() {
      // Override the local window.location object.
      legacyApp.location = {search: '?authtoken=demoToken&authtoken=discarded'};
      legacyEnv.setCredentials(null);
      legacyEnv.connect();
      assert.equal(legacyConn.messages.length, 1);
      assert.deepEqual(legacyConn.last_message(), {
        RequestId: 1,
        Type: 'GUIToken',
        Version: 0,
        Request: 'Login',
        Params: {Token: 'demoToken'}
      });
    });

    it('ignores the authtoken if credentials exist', function() {
      // Override the local window.location object.
      legacyApp.location = {search: '?authtoken=demoToken'};
      legacyEnv.setCredentials({user: 'user', password: 'password'});
      legacyEnv.connect();
      assert.equal(1, legacyConn.messages.length);
      var message = legacyConn.last_message();
      assert.equal('Admin', message.Type);
      assert.equal('Login', message.Request);
    });

    it('displays the login view if credentials are not valid', function() {
      env.connect();
      var loginStub = sinon.stub(app, '_renderLogin');
      app.env.login();
      // Mimic a login failed response assuming login is the first request.
      conn.msg({'request-id': 1, error: 'bad wolf'});
      assert.equal(1, conn.messages.length);
      assertIsLogin(conn.last_message());
      assert.equal(loginStub.callCount, 1);
      assert.deepEqual(loginStub.lastCall.args, ['bad wolf']);
    });

    it('login method handler is called after successful login',
    function(done) {
      let localApp = {};
      const oldOnLogin = Y.juju.App.prototype.onLogin;
      Y.juju.App.prototype.onLogin = evt => {
        assert.equal(conn.messages.length, 1);
        assertIsLogin(conn.last_message());
        assert.strictEqual(evt.err, null);
        localApp.on('destroy', () => done());
        localApp.destroy();
      };
      this._cleanups.push(() => {
        Y.juju.App.prototype.onLogin = oldOnLogin;
      });
      localApp = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: controller,
        env: env,
        controllerSocketTemplate: '/api',
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });
      env.connect();
      localApp.env.userIsAuthenticated = true;
      localApp.env.login();
    });

    it('navigates to requested url on login', function() {
      // The difference between this test and the following one is that this
      // tests the path where there is no hash in the url.
      var popup = sinon.stub(
          Y.juju.App.prototype, 'popLoginRedirectPath').returns('/foo/bar');
      this._cleanups.push(popup.restore);
      env.connect();
      sinon.stub(app, 'maskVisibility');
      sinon.stub(app, 'navigate');
      sinon.stub(app, 'dispatch');
      app.onLogin({ data: { result: true } });
      assert.equal(app.navigate.calledOnce, true);
      assert.deepEqual(app.navigate.lastCall.args, [
        '/foo/bar',
        { overrideAllNamespaces: true }]);
      // dispatch should not be called if there is no hash in the url.
      // dispatch should be called in the test below where there is a hash.
      assert.equal(app.dispatch.calledOnce, false);
    });

    it('does not navigate to requested url on login with gisf', function() {
      var popup = sinon.stub(
          Y.juju.App.prototype, 'popLoginRedirectPath').returns('/foo/bar');
      this._cleanups.push(popup.restore);
      env.connect();
      app.set('gisf', true);
      sinon.stub(app, 'maskVisibility');
      sinon.stub(app, 'navigate');
      sinon.stub(app, 'dispatch');
      app.onLogin({ data: { result: true } });
      assert.equal(app.navigate.calledOnce, false,
        'navigate should not be called in gisf mode here');
    });

    // XXX This test causes intermittent cascading failures when run in CI.
    // When the notification system gets refactored this test can be un-skipped.
    it.skip('creates a notification if logged in with a token', function(done) {
      // We need to change the prototype before we instantiate.
      // See the "this.restore()" call in the callback below that cleans up.
      var stub = sinon.stub(Y.juju.App.prototype, 'onLogin');
      sinon.stub(app, 'maskVisibility');
      app.redirectPath = '/foo/bar/';
      app.location = {
        toString: function() {return '/login/';},
        search: '?authtoken=demoToken'};
      sinon.stub(app.env, 'onceAfter');
      sinon.stub(app, 'navigate');
      stub.addCallback(function() {
        // Clean up.
        this.restore();
        // Begin assertions.
        var e = this.lastCall.args[0];
        // These two really simply verify that our test prep did what we
        // expected.
        assert.equal(e.data.result, true);
        assert.equal(e.data.fromToken, true);
        this.passThroughToOriginalMethod(app);
        assert.equal(app.maskVisibility.calledOnce, true);
        assert.equal(app.env.onceAfter.calledOnce, true);
        var onceAfterArgs = app.env.onceAfter.lastCall.args;
        assert.equal(onceAfterArgs[0], 'environmentNameChange');
        // Call the event handler so we can verify what it does.
        onceAfterArgs[1].call(onceAfterArgs[2]);
        assert.equal(
            app.db.notifications.item(0).get('title'),
            'Logged in with Token');
        assert.equal(app.navigate.calledOnce, true);
        var navigateArgs = app.navigate.lastCall.args;
        assert.equal(navigateArgs[0], '/foo/bar/');
        assert.deepEqual(navigateArgs[1], {overrideAllNamespaces: true});
        done();
      });
      env.setCredentials(null);
      env.connect();
      conn.msg({
        'request-id': conn.last_message()['request-id'],
        Response: {AuthTag: 'tokenuser', Password: 'tokenpasswd'}});
    });

    it('tries to log in on first connection', function() {
      // This is the case when credential are stashed.
      env.connect();
      assert.equal(1, conn.messages.length);
      assertIsLogin(conn.last_message());
    });

    it('tries to re-login on disconnections', function() {
      // This is the case when credential are stashed.
      env.connect();
      // Disconnect and reconnect the WebSocket.
      conn.transient_close();
      conn.open();
      assert.equal(1, conn.messages.length, 'no login messages sent');
      assertIsLogin(conn.last_message());
    });

    it('tries to re-login with macaroons on disconnections', function() {
      sessionStorage.clear();
      env.setAttrs({user: null, password: null, jujuCoreVersion: '2.0.0'});
      env.connect();
      env.setCredentials({macaroons: ['macaroon']});
      // Disconnect and reconnect the WebSocket.
      conn.transient_close();
      conn.open();
      assert.equal(1, conn.messages.length, 'no login messages sent');
      var msg = conn.last_message();
      assert.strictEqual(msg.type, 'Admin');
      assert.strictEqual(msg.request, 'Login');
      assert.deepEqual(msg.params, {macaroons: [['macaroon']]});
    });

    it('should allow closing the connection', function(done) {
      env.connect();
      env.close(() => {
        assert.strictEqual(env.userIsAuthenticated, false);
        assert.deepEqual(
          env.getCredentials(), {user: '', password: '', macaroons: null});
        done();
      });

    });

    it('normally uses window.location', function() {
      // A lot of the app's authentication dance uses window.location,
      // both for redirects after login and for authtokens.  For tests,
      // the app copies window.location to app.location, so that we
      // can easily override it.  This test verifies that the initialization
      // actually does stash window.location as we exprect.
      assert.strictEqual(window.location, app.location);
    });

    describe('popLoginRedirectPath', function() {
      it('returns and clears redirectPath', function() {
        app.redirectPath = '/foo/bar/';
        app.location = {pathname: '/login/'};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('prefers the current path if not login', function() {
        app.redirectPath = '/';
        app.location = {pathname: '/foo/bar/'};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login/', function() {
        app.redirectPath = '/login/';
        app.location = {pathname: '/login/'};
        assert.equal(app.popLoginRedirectPath(), '/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login', function() {
        // Missing trailing slash is only difference from previous test.
        app.redirectPath = '/login';
        app.location = {pathname: '/login/'};
        assert.equal(app.popLoginRedirectPath(), '/');
        assert.isUndefined(app.redirectPath);
      });
    });
  });


  describe('Application Connection State', function() {
    let Y, app, conn, controllerAPI, env, legacyModelAPI, juju;

    function constructAppInstance(legacy) {
      let version = '2.0.0';
      let controller = controllerAPI;
      let model = env;
      if (legacy) {
        version = '1.25.6';
        controller = null;
        model = legacyModelAPI;
      }
      const noop = function() {return this;};
      const app = new juju.App({
        baseUrl: 'http://example.com/',
        env: model,
        controllerAPI: controller,
        consoleEnabled: true,
        container: container,
        jujuCoreVersion: version,
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api'
      });
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
        reset: sinon.stub(),
        fire: sinon.stub(),
        environment: {
          set: () => {},
          get: () => {}
        }
      };
      app.dispatch = function() {};
      return app;
    };

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'],
          function(Y) {
            juju = Y.namespace('juju');
            container = Y.Node.create(
                '<div id="test" class="container"></div>');
            done();
          });
    });

    beforeEach(function() {
      conn = new testUtils.SocketStub();
      env = new juju.environments.GoEnvironment({
        conn: conn,
        user: 'user',
        password: 'password'
      });
      legacyModelAPI = new juju.environments.GoLegacyEnvironment({
        conn: conn,
        user: 'user',
        password: 'password'
      });
      controllerAPI = new juju.ControllerAPI({
        conn: new testUtils.SocketStub(),
        user: 'user',
        password: 'password'
      });
      env.login = sinon.stub();
    });

    afterEach(function(done) {
      env.close(() => {
        controllerAPI.close(() => {
          app.destroy();
          done();
        });
      });
    });

    it('should be able to handle env connection status changes', function() {
      app = constructAppInstance();
      env.connect();
      conn.open();
      // We need to fake the connection event.
      assert.equal(app.db.reset.callCount, 0);
      assert.equal(env.login.calledOnce, true);

      // Trigger a second time and verify.
      conn.transient_close();
      conn.open();
      assert.equal(app.db.reset.callCount, 0);
    });

    it('should connect to controller', function(done) {
      controllerAPI.connect = sinon.stub();
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.after('ready', () => {
        assert.strictEqual(controllerAPI.connect.callCount, 1, 'controller');
        assert.strictEqual(env.connect.callCount, 0, 'model');
        done();
      });
    });

    it('should connect to the model in Juju 1', function(done) {
      controllerAPI.connect = sinon.stub();
      legacyModelAPI.connect = sinon.stub();
      app = constructAppInstance(true);
      app.after('ready', () => {
        assert.strictEqual(controllerAPI.connect.callCount, 0, 'controller');
        assert.strictEqual(legacyModelAPI.connect.callCount, 1, 'model');
        done();
      });
    });

    it('should connect to controller when in sandbox mode', function(done) {
      controllerAPI.connect = sinon.stub();
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.set('modelUUID', 'sandbox');
      app.after('ready', function() {
        assert.strictEqual(controllerAPI.connect.callCount, 1, 'controller');
        assert.strictEqual(env.connect.callCount, 0, 'model');
        done();
      });
    });

    describe('logout', () => {
      it('logs out from API connections and then reconnects', function(done) {
        let controllerClosed = false;
        let modelClosed = false;
        let controllerConnected = false;
        let modelConnected = false;
        const ecs = {
          clear: sinon.stub()
        };
        // Create an application instance.
        app = constructAppInstance();
        app.after('ready', () => {
          // Mock the API connections for the resulting application.
          app.controllerAPI = {
            close: (callback) => {
              assert.strictEqual(
                modelClosed, true,
                'controller: close called before model close');
              controllerClosed = true;
              callback();
            },
            connect: () => {
              assert.strictEqual(
                controllerClosed, true,
                'controller: connect called before close');
              controllerConnected = true;
            }
          };
          app.env = {
            close: (callback) => {
              modelClosed = true;
              callback();
            },
            connect: () => {
              assert.strictEqual(
                modelClosed, true, 'model: connect called before close');
              modelConnected = true;
            },
            get: sinon.stub().returns(ecs)
          };
          app.state.changeState = sinon.stub();
          this._cleanups.push(() => {
            app.controllerAPI = controllerAPI;
            app.env = env;
          });
          // Mock the app method used to render the login mask.
          app._renderLogin = sinon.stub();
          // Log out from the app.
          app.logout();
          // The API connections have been properly closed.
          assert.strictEqual(controllerClosed, true, 'controller close');
          assert.strictEqual(modelClosed, true, 'model closed');
          assert.strictEqual(controllerConnected, true, 'controller connect');
          assert.strictEqual(modelConnected, false, 'model connect');
          // The database has been reset and updated.
          assert.strictEqual(app.db.reset.calledOnce, true, 'db.reset');
          assert.strictEqual(app.db.fire.calledOnce, true, 'db.fire');
          assert.strictEqual(app.db.fire.lastCall.args[0], 'update');
          assert.strictEqual(ecs.clear.calledOnce, true, 'ecs.clear');
          // The login mask has been displayed.
          assert.strictEqual(app._renderLogin.calledOnce, true, 'login');
          assert.equal(app.state.changeState.callCount, 1);
          assert.deepEqual(app.state.changeState.args[0], [{
            model: null,
            profile: null,
            root: null,
            store: null
          }]);
          done();
        });
      });

      it('closes and reopens the model connection in Juju 1', function(done) {
        let modelClosed = false;
        let modelConnected = false;
        const ecs = {
          clear: sinon.stub()
        };
        // Create an application instance.
        app = constructAppInstance(true);
        app.after('ready', () => {
          app.state.changeState = sinon.stub();
          // Mock the API connections for the resulting application.
          app.env = {
            close: (callback) => {
              modelClosed = true;
              callback();
            },
            connect: () => {
              assert.strictEqual(
                modelClosed, true, 'model connect called before close');
              modelConnected = true;
            },
            get: sinon.stub().returns(ecs)
          };
          this._cleanups.push(() => {
            app.env = env;
          });
          // Mock the app method used to render the login mask.
          app._renderLogin = sinon.stub();
          // Log out from the app.
          app.logout();
          // The API connections have been properly closed.
          assert.strictEqual(modelClosed, true, 'model closed');
          assert.strictEqual(modelConnected, true, 'model connect');
          // The database has been reset and updated.
          assert.strictEqual(app.db.reset.called, true, 'db.reset');
          assert.strictEqual(app.db.fire.calledOnce, true, 'db.fire');
          assert.strictEqual(app.db.fire.lastCall.args[0], 'update');
          assert.strictEqual(ecs.clear.calledOnce, true, 'ecs.clear');
          // The login mask has been displayed.
          assert.strictEqual(app._renderLogin.calledOnce, true, 'login');
          assert.equal(app.state.changeState.callCount, 1);
          assert.deepEqual(app.state.changeState.args[0], [{
            model: null,
            profile: null,
            root: null,
            store: null
          }]);
          done();
        });
      });
    });

    it('clears the db changed timer when the app is destroyed', function() {
      // Set up the application instance.
      app = constructAppInstance();
      app.dbChangedTimer = 'I am the timer!';
      // Mock the clearTimeout builtin function.
      const original = clearTimeout;
      clearTimeout = sinon.stub();
      this._cleanups.push(() => {
        clearTimeout = original;
      });
      // Destroy the application.
      app.destroy();
      // The timer has been canceled.
      assert.strictEqual(clearTimeout.calledOnce, true, 'clear call');
      assert.strictEqual(clearTimeout.lastCall.args[0], 'I am the timer!');
    });

  });


  describe('switchEnv', function() {
    var Y, app;
    var _generateMockedApp = function(noWebsocket) {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        baseUrl: 'http://example.com/',
        charmstorestore: new window.jujulib.charmstore('http://1.2.3.4/'),
        consoleEnabled: true,
        container: container,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        password: 'admin',
        sandbox: false,
        sandboxSocketURL: 'ws://host:port/ws/environment/undefined/api',
        socketTemplate: '/environment/$uuid/api',
        user: 'admin',
        viewContainer: container
      });
      var fake_ecs = {
        clear: function() { this.clearCalled = true; },
        clearCalled: false
      };
      var fake_env = {
        ecs: fake_ecs,
        closeCalled: false,
        connect: function() {},
        socketUrl: 'wss://example.com/ws',
        setUser: 'not-called',
        setPassword: 'not-called',
        close: function() { this.closeCalled = true; },
        get: function(key) {
          if (key === 'socket_url') {
            return this.socketUrl;
          }
          if (key === 'ecs') {
            return this.ecs;
          }
        },
        set: function(key, val) {
          if (key === 'socket_url') {
            this.socketUrl = val;
          }
        },
        setCredentials: function(obj) {
          this.setUser = obj.user;
          this.setPassword = obj.password;
        },
        getCredentials: function() {
          return {user: this.setUser, password: this.setPassword};
        }
      };
      if (!noWebsocket) {
        fake_env.ws = {
          onclose: function() { this.oncloseCalled = true; },
          oncloseCalled: false
        };
      }
      var fake_db = {
        resetCalled: false,
        fireSignal: null,
        reset: function() { this.resetCalled = true; },
        fire: function(signal) { this.fireSignal = signal; }
      };
      // Create a mock topology instance for the switchEnv setting the
      // centerOnLoad property on the topology.
      app.views.environment.instance = {
        topo: {
          modules: {
            ServiceModule: {
              centerOnLoad: false
            }
          }
        }
      };
      app.env = fake_env;
      app.db = fake_db;
      app._renderBreadcrumb = sinon.stub();
      return app;
    };

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
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

    it('can connect to an env even if not currently connected', function() {
      app = _generateMockedApp(true);
      app.switchEnv('uuid', 'user', 'password');
      assert.isTrue(app.env.ecs.clearCalled, 'ecs was not cleared.');
      assert.isTrue(app.env.closeCalled, 'env was not closed.');
      assert.isTrue(app.db.resetCalled, 'db was not reset.');
      assert.equal(app.db.fireSignal, 'update', 'db was not updated.');
      var topo = app.views.environment.instance.topo;
      assert.isTrue(topo.modules.ServiceModule.centerOnLoad,
                    'canvas centering was not reset.');
    });

    it('clears and resets the env, db, and ecs on change', function() {
      app = _generateMockedApp();
      app.switchEnv('uuid', 'user', 'password');
      assert.isTrue(app.env.ecs.clearCalled, 'ecs was not cleared.');
      assert.isTrue(app.env.closeCalled, 'env was not closed.');
      assert.isTrue(app.db.resetCalled, 'db was not reset.');
      assert.equal(app.db.fireSignal, 'update', 'db was not updated.');
      var topo = app.views.environment.instance.topo;
      assert.isTrue(topo.modules.ServiceModule.centerOnLoad,
                    'canvas centering was not reset.');
    });

    it('can not clear and reset the db, and ecs on change', function() {
      app = _generateMockedApp();
      app.switchEnv('uuid', 'user', 'password', null, true, false);
      assert.isFalse(app.env.ecs.clearCalled, 'ecs was not cleared.');
      assert.isTrue(app.env.closeCalled, 'env was not closed.');
      assert.isFalse(app.db.resetCalled, 'db was not reset.');
      assert.isNull(app.db.fireSignal);
    });

    it('skips the reconnect when necessary', function() {
      app = _generateMockedApp(false);
      var connect = sinon.stub(app.env, 'connect');
      this._cleanups.push(connect);
      // Try calling switchEnv both with explicit false and with socketUrl not
      // set (implicit).
      app.switchEnv('', '', '', false);
      app.switchEnv();
      assert.equal(connect.callCount, 0);
    });
  });

  describe('getUser', function() {
    var app, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-gui',
        'juju-tests-utils',
        'juju-view-utils',
        'juju-views',
        'environment-change-set'
      ],
      function(Y) {
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(() => {
      const controllerAPI = new juju.ControllerAPI({
        conn: new testUtils.SocketStub()
      });
      const modelAPI = new juju.environments.GoEnvironment({
        conn: new testUtils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet(),
        user: 'user',
        password: 'password'
      });
      app = new juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: controllerAPI,
        env: modelAPI,
        consoleEnabled: true,
        container: container,
        jujuCoreVersion: '2.0.0',
        controllerSocketTemplate: '/api',
        socketTemplate: '/model/$uuid/api'
      });
    });

    afterEach(() => {
      app.destroy();
    });

    it('gets the set user for the supplied service', function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      var charmstoreUser = {
        name: 'foo'
      };
      app.set('users', {
        'charmstore': charmstoreUser
      });
      assert.deepEqual(app.getUser('charmstore'), charmstoreUser);
    });

  });

  describe('clearUser', function() {
    var app, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-gui',
        'juju-tests-utils',
        'juju-view-utils',
        'juju-views',
        'environment-change-set'
      ],
      function(Y) {
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(() => {
      const controllerAPI = new juju.ControllerAPI({
        conn: new testUtils.SocketStub()
      });
      const modelAPI = new juju.environments.GoEnvironment({
        conn: new testUtils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet(),
        user: 'user',
        password: 'password'
      });
      app = new juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: controllerAPI,
        env: modelAPI,
        consoleEnabled: true,
        container: container,
        jujuCoreVersion: '2.0.0',
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api'
      });
    });

    afterEach(() => {
      app.destroy();
    });

    it('clears the set user for the supplied service', function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      var charmstoreUser = {
        name: 'foo'
      };
      app.set('users', {
        'charmstore': charmstoreUser
      });
      app.clearUser('charmstore');
      assert.equal(app.getUser('charmstore'), undefined);
    });

  });

  describe('storeUser', function() {
    var Y, app, juju, csStub;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        consoleEnabled: true,
        jujuCoreVersion: '2.0.0'
      });
      var charmstore = app.get('charmstore');
      csStub = sinon.stub(charmstore, 'whoami');
      this._cleanups.push(csStub);
    });

    afterEach(function() {
      app.destroy({remove: true});
    });

    it('calls charmstore whoami for charmstore users', function() {
      var user = {user: 'test'};
      app.storeUser('charmstore');
      assert.equal(csStub.callCount, 1);
      var cb = csStub.lastCall.args[0];
      cb(null, user);
      var users = app.get('users');
      assert.deepEqual(users['charmstore'], user);
    });
  });


  describe('_getAuth', function() {
    var Y, app, controllerCredStub, modelCredStub, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        consoleEnabled: true,
        jujuCoreVersion: '2.0.0'
      });
      controllerCredStub = sinon.stub(
        app.controllerAPI, 'getCredentials').returns({user: ''});
      this._cleanups.push(controllerCredStub.restore);
      modelCredStub = sinon.stub(
        app.env, 'getCredentials').returns({user: ''});
      this._cleanups.push(modelCredStub.restore);
    });

    afterEach(function() {
      app.destroy({remove: true});
    });

    it('fetches the auth', function() {
      app.set('users', {charmstore: {user: 'admin'}});
      assert.deepEqual(app._getAuth(), {
        user: 'admin',
        usernameDisplay: 'admin',
        rootUserName: 'admin'
      });
    });

    it('uses external auth if present', function() {
      app.set('auth', {user: {name: 'bark'}});
      app.set('users', {foo: 'bar'});
      assert.deepEqual(app._getAuth(), {
        usernameDisplay: 'bark',
        user: {name: 'bark'}
      });
    });

    it('uses controller credentials if present', function() {
      app.set('users', {});
      controllerCredStub.returns({user: 'dalek@external'});
      assert.deepEqual(app._getAuth(), {
        user: 'dalek@external',
        usernameDisplay: 'dalek@external',
        rootUserName: 'dalek'
      });
    });

    it('uses model credentials if present', function() {
      app.set('users', {});
      modelCredStub.returns({user: 'who@local'});
      assert.deepEqual(app._getAuth(), {
        user: 'who@local',
        usernameDisplay: 'who@local',
        rootUserName: 'who'
      });
    });

    it('does not break when auth is not set', function() {
      app.set('users', {});
      assert.strictEqual(app._getAuth(), null);
    });

    it('populates the display name', function() {
      app.set('users', {charmstore: {user: 'admin'}});
      const auth = app._getAuth();
      assert.equal(auth.usernameDisplay, 'admin');
    });
  });

  describe('Application sandbox mode', function() {
    var app, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
        done();
      });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
    });

    afterEach(function() {
      window.sessionStorage.removeItem('credentials');
      app.destroy({remove: true});
    });

    it('instantiates correctly', function() {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        baseUrl: 'http://example.com/',
        charmstore: new window.jujulib.charmstore('http://1.2.3.4/'),
        container: container,
        jujuCoreVersion: '2.1.1',
        password: 'admin',
        sandboxSocketURL: 'ws://host:port/ws/model/undefined/api',
        sandbox: true,
        controllerSocketTemplate: '/api',
        socketTemplate: '/model/$uuid/api',
        user: 'admin',
        viewContainer: container
      });
      app.showView(new Y.View());
      // This simply walks through the hierarchy to show that all the
      // necessary parts are there.
      assert.isObject(app.env.get('conn').get('juju').get('state'));
      assert.isObject(app.controllerAPI.get('conn').get('juju').get('state'));
      // Assert we have a default websocket url.
      assert.equal(
          app.env.get('conn').get('juju').get('socket_url'),
          'ws://host:port/ws/model/undefined/api');
      assert.equal(
          app.controllerAPI.get('conn').get('juju').get('socket_url'),
          'ws://host:port/ws/model/undefined/api');
    });

    it('passes a fake web handler to the model', function() {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        baseUrl: 'http://example.com/',
        charmstore: new window.jujulib.charmstore('http://1.2.3.4/'),
        container: container,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        sandbox: true,
        controllerSocketTemplate: '/api',
        password: 'admin',
        socketTemplate: '/model/$uuid/api',
        user: 'admin',
        viewContainer: container
      });
      app.showView(new Y.View());
      assert.strictEqual(
        app.env.get('webHandler').name, 'sandbox-web-handler');
      // There is no controller connection on juju 1.
      assert.strictEqual(app.controllerAPI, undefined);
    });

    it('creates a placeholder socketUrl', function() {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        baseUrl: 'http://example.com/',
        charmstore: new window.jujulib.charmstore('http://1.2.3.4/'),
        container: container,
        jujuCoreVersion: '2.0.0',
        sandbox: true,
        controllerSocketTemplate: '/api',
        password: 'admin',
        socketTemplate: '/model/$uuid/api',
        user: 'admin',
        viewContainer: container
      });
      const host = window.location.hostname;
      const port = window.location.port;
      let socketUrl = app.createSocketURL(app.get('socketTemplate'));
      assert.strictEqual(socketUrl, `wss://${host}:${port}/sandbox`);
      socketUrl = app.createSocketURL(app.get('controllerSocketTemplate'));
      assert.strictEqual(
        socketUrl, `wss://${host}:${port}/sandbox-controller`);
    });

  });

  describe('configuration parsing', function() {
    var app, getLocation, Y;

    before(function(done) {
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

    it('honors socket_protocol and uuid', function() {
      app = new Y.juju.App({
        apiAddress: 'example.com:17070',
        baseUrl: 'http://example.com/',
        conn: {close: function() {}},
        container: container,
        jujuCoreVersion: '2.1.1',
        modelUUID: '1234-1234',
        socket_protocol: 'ws',
        socketTemplate: '/juju/api/$server/$port/$uuid',
        controllerSocketTemplate: '/api',
        viewContainer: container
      });
      const expected = [
        'ws://',
        window.location.hostname,
        ':',
        window.location.port,
        '/juju/api/example.com/17070/1234-1234'
      ].join('');
      const url = app.createSocketURL(
        app.get('socketTemplate'), app.get('modelUUID'));
      assert.strictEqual(url, expected);
    });

    it('honors a fully qualified provided socket URL', function() {
      app = new Y.juju.App({
        apiAddress: 'example.com:17070',
        baseUrl: 'http://example.com/',
        conn: {close: function() {}},
        container: container,
        jujuCoreVersion: '2.1.1',
        modelUUID: '1234-1234',
        socket_protocol: 'ws',
        socketTemplate: 'wss://my.$server:$port/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container
      });
      const url = app.createSocketURL(
        app.get('socketTemplate'), app.get('modelUUID'));
      assert.equal(url, 'wss://my.example.com:17070/model/1234-1234/api');
    });
  });

  describe('loginToAPIs', function() {
    var app;

    beforeEach(function(done) {
      YUI(GlobalConfig).use(['juju-gui'], Y => {
        app = new Y.juju.App({
          baseUrl: 'http://example.com/',
          consoleEnabled: true,
          jujuCoreVersion: '2.0.0',
          viewContainer: container,
          charmstoreURL: 'http://1.2.3.4/',
          socketTemplate: '/model/$uuid/api',
          controllerSocketTemplate: '/api'
        });
        done();
      });
    });

    afterEach(function() {
      app.destroy();
    });

    // Create and return a mock API connection.
    // The API is connected if connected is true.
    const makeAPIConnection = connected => {
      return {
        name: 'test-api',
        get: sinon.stub().withArgs('connected').returns(connected),
        login: sinon.stub(),
        loginWithMacaroon: sinon.stub(),
        setCredentials: sinon.stub()
      };
    };

    // Check whether the given API connection mock (see makeAPIConnection) is
    // authenticated, and if it is, check that the given credentials have been
    // set as an attribute of the connection object.
    const checkLoggedInWithCredentials = (api, loggedIn, credentials) => {
      if (credentials) {
        // Credentials have been set on the API.
        assert.strictEqual(api.setCredentials.calledOnce, true);
        assert.deepEqual(api.setCredentials.getCall(0).args, [credentials]);
      } else {
        // No credentials have been set.
        assert.strictEqual(api.setCredentials.called, false);
      }
      if (loggedIn) {
        // The API has been authenticated with credentials.
        assert.strictEqual(api.login.calledOnce, true);
        assert.strictEqual(api.login.getCall(0).args.length, 0);
      } else {
        // Login has not been called.
        assert.strictEqual(api.login.called, false);
      }
    };

    // Check whether the given API connection mock (see makeAPIConnection) is
    // authenticated with macaroons.
    const checkLoggedInWithMacaroons = (api, loggedIn) => {
      if (loggedIn) {
        // The API has been authenticated with macaroons.
        assert.strictEqual(api.loginWithMacaroon.calledOnce, true);
        // The loginWithMacaroon method receives the bakery instance and a
        // callback.
        assert.strictEqual(api.loginWithMacaroon.getCall(0).args.length, 2);
        return;
      }
      // The loginWithMacaroon method has not been called.
      assert.strictEqual(api.loginWithMacaroon.called, false);
    };

    it('logs into all connected API backends', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = false;
      const controller = makeAPIConnection(true);
      const model = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons, [controller, model]);
      checkLoggedInWithCredentials(controller, true, credentials);
      checkLoggedInWithCredentials(model, true, credentials);
    });

    it('logs into all default API backends', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = false;
      app.controllerAPI = makeAPIConnection(true);
      app.env = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons);
      checkLoggedInWithCredentials(app.controllerAPI, true, credentials);
      checkLoggedInWithCredentials(app.env, true, credentials);
    });

    it('only logs into APIs if they are connected', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = false;
      const controller = makeAPIConnection(true);
      const model = makeAPIConnection(false);
      app.loginToAPIs(credentials, useMacaroons, [controller, model]);
      checkLoggedInWithCredentials(controller, true, credentials);
      checkLoggedInWithCredentials(model, false, credentials);
    });

    it('only sets credentials if no API is connected', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = false;
      app.controllerAPI = makeAPIConnection(false);
      app.env = null;
      app.loginToAPIs(credentials, useMacaroons);
      checkLoggedInWithCredentials(app.controllerAPI, false, credentials);
    });

    it('does not set credentials if they are not provided', () => {
      const credentials = null;
      const useMacaroons = false;
      const controller = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons, [controller]);
      checkLoggedInWithCredentials(controller, true, null);
    });

    it('logs into all connected API backends (macaroons)', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = true;
      const controller = makeAPIConnection(true);
      const model = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons, [controller, model]);
      checkLoggedInWithMacaroons(controller, true);
      checkLoggedInWithMacaroons(model, true);
    });

    it('logs into all default API backends (macaroons)', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = true;
      app.controllerAPI = makeAPIConnection(true);
      app.env = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons);
      checkLoggedInWithMacaroons(app.controllerAPI, true);
      checkLoggedInWithMacaroons(app.env, true);
    });

    it('only logs into APIs if they are connected (macaroons)', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = true;
      const controller = makeAPIConnection(true);
      const model = makeAPIConnection(false);
      app.loginToAPIs(credentials, useMacaroons, [controller, model]);
      checkLoggedInWithMacaroons(controller, true);
      checkLoggedInWithMacaroons(model, false);
    });
  });

  describe('isLegacyJuju', function() {
    var app, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });
    });

    afterEach(function() {
      app.destroy();
    });

    it('reports legacy Juju versions', function() {
      ['1.26.0', '0.8.0', '1.9', '1'].forEach(function(version) {
        app.set('jujuCoreVersion', version);
        assert.strictEqual(app.isLegacyJuju(), true, version);
      });
    });

    it('reports non-legacy Juju versions', function() {
      ['2.0.1', '2.0-beta42.47', '3.5', '2'].forEach(function(version) {
        app.set('jujuCoreVersion', version);
        assert.strictEqual(app.isLegacyJuju(), false, version);
      });
    });
  });

  describe('checkUserCredentials', function() {
    let app, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });
    });

    afterEach(function() {
      app.destroy();
    });

    // Ensure next is called and the login view is not displayed when
    // dispatching the given state.
    const checkNext = state => {
      const next = sinon.stub().withArgs();
      const displayLogin = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials(state, next);
      assert.equal(next.callCount, 1, 'next not called');
      assert.equal(displayLogin.callCount, 0, '_displayLogin called');
    };

    it('calls next and returns if root state is new', () => {
      checkNext({root: 'new'});
    });

    it('calls next and returns if root state is store', () => {
      checkNext({root: 'store'});
    });

    it('displays login if one of the apis is still connecting', () => {
      app.controllerAPI.set('connecting', true);
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 1);
    });

    it('does not login if all apis are not connected', () => {
      app.controllerAPI.set('connected', false);
      app.env.set('connected', false);
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 0);
    });

    it('displays login if one of the apis is not authenticated', () => {
      app.controllerAPI.set('connected', true);
      app.controllerAPI.userIsAuthenticated = false;
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 1);
    });

    it('displays login if one of the apis is not authd and not gisf', () => {
      app.controllerAPI.set('connected', true);
      app.controllerAPI.userIsAuthenticated = false;
      app.set('gisf', false);
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 1);
    });
  });

  describe('_disambiguateUserState', function() {
    let app, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });
    });

    afterEach(function() {
      app.destroy();
    });

    it('properly handles a rejected entity promise', done => {
      const userState = {user: 'hatch'};
      const entityPromise = Promise.reject(userState);
      app.controllerAPI.userIsAuthenticated = true;
      app._listAndSwitchModel = args => {
        assert.deepEqual(args, userState);
        done();
      };
      app._disambiguateUserState(entityPromise);
    });

    it('properly handles a resolved entity promise', done => {
      const userState = 'hatch';
      const entityPromise = Promise.resolve(userState);
      app.maskVisibility = sinon.stub();
      app.state.changeState = state => {
        assert.deepEqual(app.maskVisibility.args[0], [false]);
        assert.deepEqual({
          store: 'u/hatch',
          user: null
        }, state);
        done();
      };
      app._disambiguateUserState(entityPromise);
    });
  });

  describe('_listAndSwitchModel', function() {
    let app, modelList, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });
      modelList = [{
        'id':'fe9a2845-4829-4d61-8653-248b7052204e',
        'name':'latta',
        'series':'xenial',
        'provider':'gce',
        'uuid':'fe9a2845-4829-4d61-8653-248b7052204e',
        'controllerUUID':'a030379a-940f-4760-8fcf-3062b41a04e7',
        'owner':'frankban@external',
        'life':'alive',
        'isAlive':true,
        'isController':false,
        'lastConnection':null
      },{
        'id':'509f6e4c-4da4-49c8-8f18-537c33b4d3a0',
        'name':'jujugui-org',
        'series':'xenial',
        'provider':'gce',
        'uuid':'509f6e4c-4da4-49c8-8f18-537c33b4d3a0',
        'controllerUUID':'a030379a-940f-4760-8fcf-3062b41a04e7',
        'owner':'uros-jovanovic@external',
        'life':'alive',
        'isAlive':true,
        'isController':false,
        'lastConnection':null
      }];
      app.maskVisibility = sinon.stub();
      app.state.changeState = sinon.stub();
      app._getAuth = sinon.stub().returns({rootUserName: 'pug'});
      app.controllerAPI.listModelsWithInfo = function(callback) {
        callback.call(app, null, modelList);
      };
    });

    afterEach(function() {
      app.destroy();
    });

    it('switches to a supplied model path', () => {
      app._listAndSwitchModel('frankban/latta', null);
      assert.equal(app.maskVisibility.callCount, 1);
      assert.deepEqual(app.maskVisibility.args[0], [false]);
      assert.equal(app.state.changeState.callCount, 1);
      assert.deepEqual(app.state.changeState.args[0], [{
        model: {
          path: 'frankban/latta',
          uuid: 'fe9a2845-4829-4d61-8653-248b7052204e'
        },
        user: null, root: null
      }]);
    });

    it('switches to a supplied model uuid', () => {
      app._listAndSwitchModel(null, '509f6e4c-4da4-49c8-8f18-537c33b4d3a0');
      assert.equal(app.maskVisibility.callCount, 1);
      assert.deepEqual(app.maskVisibility.args[0], [false]);
      assert.equal(app.state.changeState.callCount, 1);
      assert.deepEqual(app.state.changeState.args[0], [{
        model: {
          path: 'uros-jovanovic/jujugui-org',
          uuid: '509f6e4c-4da4-49c8-8f18-537c33b4d3a0'
        },
        user: null, root: null
      }]);
    });

    it('switches to disconnected state if no model is found via uuid', () => {
      app._listAndSwitchModel(null, 'bad-uuid');
      assert.equal(app.maskVisibility.callCount, 1);
      assert.deepEqual(app.maskVisibility.args[0], [false]);
      assert.equal(app.state.changeState.callCount, 1);
      assert.deepEqual(app.state.changeState.args[0], [{
        root: null, store: null, model: null, user: null,
        profile: 'pug'
      }]);
    });

    it('switches to disconnected state if no model found via path', () => {
      app._listAndSwitchModel('bad/path', null);
      assert.equal(app.maskVisibility.callCount, 1);
      assert.deepEqual(app.maskVisibility.args[0], [false]);
      assert.equal(app.state.changeState.callCount, 1);
      assert.deepEqual(app.state.changeState.args[0], [{
        root: null, store: null, model: null, user: null,
        profile: 'pug'
      }]);
    });
  });

  describe('_fetchEntityFromUserState', function() {
    let app, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });

    });

    afterEach(function() {
      app.destroy();
    });

    it('returns a promise for an entity', done => {
      const legacyPath = sinon.stub().returns('~hatch/ghost');
      window.jujulib.URL.fromString = sinon.stub().returns({legacyPath});
      const charmstore = {
        getEntity: sinon.stub()
      };
      app.set('charmstore', charmstore);
      const entityPromise = app._fetchEntityFromUserState('hatch/ghost');
      assert.equal(legacyPath.callCount, 1, 'legacy path not called');
      assert.equal(charmstore.getEntity.callCount, 1, 'getEntity not called');
      assert.equal(charmstore.getEntity.args[0][0], '~hatch/ghost');
      // Call the callback to make sure it properly resolves the promise.
      charmstore.getEntity.args[0][1](null, {});
      entityPromise.then(() => {
        done();
      });
    });

    it('caches the entity promises', () => {
      const legacyPath = sinon.stub().returns('~hatch/ghost');
      window.jujulib.URL.fromString = sinon.stub().returns({legacyPath});
      const charmstore = {
        getEntity: sinon.stub()
      };
      app.set('charmstore', charmstore);
      const entityPromise = app._fetchEntityFromUserState('hatch/ghost');
      assert.deepEqual(app.userPaths.get('hatch/ghost'), {
        promise: entityPromise
      });
    });

    it('returns a cached promise', () => {
      const legacyPath = sinon.stub().returns('~hatch/ghost');
      window.jujulib.URL.fromString = sinon.stub().returns({legacyPath});
      const charmstore = {
        getEntity: sinon.stub()
      };
      app.set('charmstore', charmstore);
      const response = {promise: 'its a promise'};
      app.userPaths.set('hatch/ghost', response);
      const entityPromise = app._fetchEntityFromUserState('hatch/ghost');
      // hacking the userPaths cache so that we can tell if it pulls from there.
      assert.deepEqual(entityPromise, response.promise);
    });

  });

  describe('_switchModelToUUID', function() {
    let app, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        juju = juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      app = new Y.juju.App({
        baseUrl: 'http://example.com/',
        controllerAPI: new juju.ControllerAPI({
          conn: new testUtils.SocketStub()
        }),
        env: new juju.environments.GoEnvironment({
          conn: new testUtils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet(),
          user: 'user',
          password: 'password'
        }),
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });

    });

    afterEach(function() {
      app.destroy();
    });

    it('switches to the provided uuid', () => {
      app.switchEnv = sinon.stub();
      app.createSocketURL = sinon.stub().returns('build-url');
      app._switchModelToUUID('my-uuid');
      assert.equal(app.get('modelUUID'), 'my-uuid');
      assert.equal(app.createSocketURL.callCount, 1);
      assert.deepEqual(app.createSocketURL.args[0], [
        '/model/$uuid/api', 'my-uuid'
      ]);
      assert.equal(app.switchEnv.callCount, 1);
      assert.deepEqual(app.switchEnv.args[0], ['build-url']);
    });

    it('switches to disconnected if none provided', () => {
      app.switchEnv = sinon.stub();
      app.createSocketURL = sinon.stub();
      app._switchModelToUUID();
      assert.strictEqual(app.get('modelUUID'), null);
      assert.equal(app.createSocketURL.callCount, 0);
      assert.equal(app.switchEnv.callCount, 1);
      assert.deepEqual(app.switchEnv.args[0], [undefined]);
    });
  });
});
