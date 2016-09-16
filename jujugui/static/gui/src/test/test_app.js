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

describe.only('App', function() {
  var container, yui;

  before(function(done) {
    YUI(GlobalConfig).use(['juju-gui'], function(Y) {
      yui = Y;
      done();
    });

    beforeEach(() => {
      window.juju_config = {
        charmstoreURL: 'http://1.2.3.4/',
        plansURL: 'http://plans.example.com/',
        termsURL: 'http://terms.example.com/'
      };
      var elements = [
        'charmbrowser-container',
        'deployment-bar-container',
        'deployment-container',
        'drag-over-notification-container',
        'env-size-display-container',
        'full-screen-mask',
        'header-breadcrumb',
        'header-search-container',
        'import-export-container',
        'inspector-container',
        'loading-message',
        'login-container',
        'machine-view',
        'notifications-container',
        'profile-link-container',
        'top-page-container'
      ];
      container = yui.Node.create('<div>');
      container.set('id', 'test-container');
      container.addClass('container');
      // Set up the elements needed to render the components.
      elements.forEach(function(id) {
        container.appendChild(yui.Node.create('<div/>')).set('id', id);
      });
      container.appendTo(document.body);
    });

    afterEach(() => {
      container.remove(true);
      delete window.juju_config;
    });
  });

  describe('Application basics', function() {
    var Y, app, utils, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-gui',
        'juju-tests-utils',
        'juju-view-utils',
        'juju-views',
        'environment-change-set'
      ],
      function(Y) {
        utils = Y.namespace('juju-tests.utils');
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      window._gaq = [];
    });

    afterEach(function() {
      // Reset the flags.
      window.flags = {};
      app.after('destroy', function() {
        sessionStorage.setItem('credentials', null);
      });
    });

    function constructAppInstance(config, context) {
      config = config || {};
      config.jujuCoreVersion = config.jujuCoreVersion || '2.0.0';
      config.container = container;
      config.viewContainer = container;
      app = new Y.juju.App(Y.mix(config, {
        consoleEnabled: true,
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api',
        consoleEnabled: true
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
              conn: new utils.SocketStub(),
              ecs: new juju.EnvironmentChangeSet()
            })
          }, this);
          assert.equal(app.env.get('user'), undefined);
          assert.equal(app.env.get('password'), undefined);
        });

    it('should propagate login credentials from the configuration',
        function(done) {
          var the_username = 'nehi';
          var the_password = 'moonpie';
          const conn = new utils.SocketStub();
          const ecs = new juju.EnvironmentChangeSet();
          const env = new juju.environments.GoEnvironment({
            conn: conn,
            ecs: ecs,
            user: the_username,
            password: the_password
          });
          env.connect();
          this._cleanups.push(() => {
            env.close(app.destroy.bind(app));
          });
          app = new Y.juju.App({
            env: env,
            container: container,
            consoleEnabled: true,
            user: the_username,
            password: the_password,
            viewContainer: container,
            conn: conn,
            jujuCoreVersion: '2.0-trusty-amd64',
            controllerSocketTemplate: '/api',
            socketTemplate: '/model/$uuid/api',
            ecs: ecs});
          app.after('ready', function() {
            var credentials = app.env.getCredentials();
            assert.equal(credentials.user, 'user-' + the_username + '@local');
            assert.equal(credentials.password, the_password);
            done();
          });
        });

    it('should produce a valid index', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      var container = app.get('container');
      container.getAttribute('id').should.equal('test-container');
      container.getAttribute('class').should.include('container');
    });

    it('attaches a handler for autoplaceAndCommitAll event', function(done) {
      constructAppInstance({
        jujuCoreVersion: '2.1.1-trusty-amd64',
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      app._autoplaceAndCommitAll = function() {
        // This test will hang if this method is not called from the following
        // event being fired.
        done();
      };
      app.after('ready', function() {
        app.fire('autoplaceAndCommitAll');
      });
    });

    it('autoplaceAndCommitAll places and deploys', function() {
      constructAppInstance({
        jujuCoreVersion: '1.21.1.1-trusty-amd64'
      }, this);
      app._autoPlaceUnits = sinon.stub();
      app._autoplaceAndCommitAll();
      assert.equal(app._autoPlaceUnits.callCount, 1);
    });

    it('should display a zoom message on small browsers', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      app._displayZoomMessage(1024, 'linux');
      assert.equal(app.db.notifications.item(0).get('title'),
          'Browser size adjustment');
    });

    it('should not display the zoom message more than once', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      assert.equal(app.db.notifications.size(), 0);
      app._displayZoomMessage(1024, 'linux');
      assert.equal(app.db.notifications.item(0).get('title'),
          'Browser size adjustment');
      app._displayZoomMessage(1024, 'linux');
      assert.equal(app.db.notifications.size(), 1);
    });

    it.skip('should show the correct message on a mac', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      app._displayZoomMessage(1024, 'macintosh');
      assert.isTrue(app.db.notifications.item(0).get(
          'message').indexOf('command+-') !== -1);
    });

    it('should show the correct message for non mac', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      app._displayZoomMessage(1024, 'linux');
      assert.isTrue(app.db.notifications.item(0).get(
          'message').indexOf('ctrl+-') !== -1);
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
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
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
        var setup = utils.makeStubMethod(
            Y.juju.App.prototype, '_setupCharmstore');
        this._cleanups.push(setup.reset);
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new utils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet()
          })
        }, this);
        assert.equal(setup.callCount, 1);
      });

      it('is idempotent', function() {
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new utils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet()
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
            conn: new utils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet()
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
    var Y, app, testUtils, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          ['juju-gui', 'juju-tests-utils', 'juju-view-utils', 'juju-views'],
          function(Y) {
            testUtils = Y.namespace('juju-tests.utils');
            juju = Y.namespace('juju');
            done();
          });
    });

    beforeEach(function() {
      // The context monkeypatching requires a beforeEach to be defined.
    });

    afterEach(function() {
      sessionStorage.setItem('credentials', null);
    });

    function constructAppInstance(config, context) {
      config = config || {};
      const env = new juju.environments.GoEnvironment({
        conn: new testUtils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet()
      });
      config.env = env;
      config.container = container;
      config.viewContainer = container;
      config.jujuCoreVersion = '2.0.0';
      config.consoleEnabled = true;
      app = new Y.juju.App(config);
      env.connect();
      context._cleanups.push(() => {
        env.close(() => {
          app.destroy();
          env.destroy();
        });
      });
      return app;
    }

    describe('drag event attach and detach', function() {
      it('binds the drag handlers', function() {
        var stub = testUtils.makeStubMethod(document, 'addEventListener');
        this._cleanups.push(stub.reset);
        constructAppInstance({}, this);
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
        var stub = testUtils.makeStubMethod(document, 'removeEventListener');
        this._cleanups.push(stub.reset);
        constructAppInstance({}, this);

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
      before(function() {
        // This gets cleaned up by the parent after function.
        constructAppInstance({}, this);
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
        var reactdom = testUtils.makeStubMethod(ReactDOM, 'render');
        this._cleanups.push(reactdom.reset);
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
        var reactdom = testUtils.makeStubMethod(
          ReactDOM, 'unmountComponentAtNode');
        this._cleanups.push(reactdom.reset);
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

    it('dispatches drag events properly: _appDragOverHanlder', function() {
      var determineFileTypeStub, renderDragOverStub, dragTimerControlStub;

      constructAppInstance({}, this);

      determineFileTypeStub = testUtils.makeStubMethod(
          app, '_determineFileType', 'zip');
      renderDragOverStub = testUtils.makeStubMethod(
          app, '_renderDragOverNotification');
      dragTimerControlStub = testUtils.makeStubMethod(
          app, '_dragleaveTimerControl');
      this._cleanups.concat([
        determineFileTypeStub.reset,
        renderDragOverStub.reset,
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
      var app = constructAppInstance({}, this);
      app._dragleaveTimerControl('start');
      assert.equal(app._dragLeaveTimer !== undefined, true);
      app._dragleaveTimerControl('stop');
      assert.equal(app._dragLeaveTimer === null, true);
    });

  });


  describe('Application authentication', function() {
    var conn, conn2, destroyMe, ecs, env, controller, juju, utils, Y;
    var requirements = [
      'juju-gui', 'juju-tests-utils', 'juju-views', 'environment-change-set'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        juju = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function(done) {
      conn = new utils.SocketStub();
      conn2 = new utils.SocketStub();
      ecs = new juju.EnvironmentChangeSet();
      env = new juju.environments.GoEnvironment({
        conn: conn,
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
      destroyMe = [env, ecs, controller];
      done();
    });

    afterEach(function() {
      sessionStorage.setItem('credentials', null);
      Y.each(destroyMe, function(item) {
        item.destroy();
      });
    });

    // Create and return a new app. If connect is True, also connect the env.
    var makeApp = function(connect, context) {
      var app = new Y.juju.App({
        consoleEnabled: true,
        env: env,
        jujuCoreVersion: '2.0.0',
        viewContainer: container
      });
      app.controllerAPI = controller;
      app.navigate = function() { return true; };
      if (connect) {
        env.connect();
        context._cleanups.push(() => {
          env.close(app.destroy.bind(app));
        });
      }
      return app;
    };

    // Ensure the given message is a login request.
    var assertIsLogin = function(message) {
      assert.equal(message.type, 'Admin');
      assert.equal(message.request, 'Login');
    };

    // These tests fail spuriously. It appears that even though ready is called
    // it's not actually ready. I expect that this will be a non issue when
    // app.js is no more.
    it.skip('renders the correct login help message for Juju >= 2',
      function(done) {
        var render = utils.makeStubMethod(ReactDOM, 'render');
        this._cleanups.push(render.reset);
        var app = makeApp(true, this);
        app.after('ready', function() {
          // Log out so that the login form is displayed.
          app.logout();
          assert.strictEqual(render.calledOnce, true, 'render not called');
          var node = render.lastCall.args[0];
          assert.strictEqual(
            node.props.helpMessage,
            'Find your username and password with ' +
            '`juju show-controller --show-password`'
          );
          done();
        });
      });
    // These tests fail spuriously. It appears that even though ready is called
    // it's not actually ready. I expect that this will be a non issue when
    // app.js is no more.
    it.skip('renders the correct login help message for Juju < 2',
      function(done) {
        var render = utils.makeStubMethod(ReactDOM, 'render');
        this._cleanups.push(render.reset);
        var app = makeApp(true, this);
        app.set('jujuCoreVersion', '1.25.0');
        app.after('ready', function() {
          // Log out so that the login form is displayed.
          app.logout();
          assert.strictEqual(render.calledOnce, true, 'render not called');
          var node = render.lastCall.args[0];
          assert.strictEqual(
            node.props.helpMessage,
            'Find your password with `juju api-info --password password`');
          done();
        });
      });

    it('avoids trying to login if the env is not connected', function(done) {
      var app = makeApp(false, this); // Create a disconnected app.
      app.after('ready', () => {
        assert.equal(0, conn.messages.length);
        this._cleanups.push(app.destroy.bind(app));
        done();
      });
    });

    it('tries to login if the env connection is established', function(done) {
      var app = makeApp(true, this); // Create a connected app.
      app.after('ready', () => {
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('avoids trying to login without credentials', function(done) {
      sessionStorage.clear();
      env.setAttrs({
        user: null,
        password: null
      });
      var app = makeApp(true, this); // Create a connected app.
      env.setCredentials(null);
      app.navigate = function() { return; };
      app.after('ready', function() {
        assert.deepEqual(
          app.env.getCredentials(), {user: '', password: '', macaroons: null});
        assert.equal(conn.messages.length, 0);
        done();
      });
    });

    it('uses the authtoken when there are no credentials', function(done) {
      env = new juju.environments.GoLegacyEnvironment({
        conn: conn,
        ecs: ecs,
        user: 'user',
        password: 'password'
      });
      var app = makeApp(false, this);
      // Override the local window.location object.
      app.location = {search: '?authtoken=demoToken'};
      env.setCredentials(null);
      env.connect();
      this._cleanups.push(() => {
        env.close(app.destroy.bind(app));
      });
      app.after('ready', function() {
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          RequestId: 1,
          Type: 'GUIToken',
          Version: 0,
          Request: 'Login',
          Params: {Token: 'demoToken'}
        });
        done();
      });
    });

    it('handles multiple authtokens', function(done) {
      env = new juju.environments.GoLegacyEnvironment({
        conn: conn,
        ecs: ecs,
        user: 'user',
        password: 'password'
      });
      var app = makeApp(false, this);
      // Override the local window.location object.
      app.location = {search: '?authtoken=demoToken&authtoken=discarded'};
      env.setCredentials(null);
      env.connect();
      this._cleanups.push(() => {
        env.close(app.destroy.bind(app));
      });
      app.after('ready', function() {
        assert.equal(conn.messages.length, 1);
        assert.deepEqual(conn.last_message(), {
          RequestId: 1,
          Type: 'GUIToken',
          Version: 0,
          Request: 'Login',
          Params: {Token: 'demoToken'}
        });
        done();
      });
    });

    it('ignores the authtoken if credentials exist', function(done) {
      env = new juju.environments.GoLegacyEnvironment({
        conn: conn,
        ecs: ecs,
        user: 'user',
        password: 'password'
      });
      var app = makeApp(false, this);
      // Override the local window.location object.
      app.location = {search: '?authtoken=demoToken'};
      env.setCredentials({user: 'user', password: 'password'});
      env.connect();
      this._cleanups.push(() => {
        env.close(app.destroy.bind(app));
      });
      app.after('ready', function() {
        assert.equal(1, conn.messages.length);
        var message = conn.last_message();
        assert.equal('Admin', message.Type);
        assert.equal('Login', message.Request);
        done();
      });
    });

    it('displays the login view if credentials are not valid', function(done) {
      var app = makeApp(true, this); // Create a connected app.
      var loginStub = utils.makeStubMethod(app, '_renderLogin');
      app.after('ready', function() {
        app.env.login();
        // Mimic a login failed response assuming login is the first request.
        conn.msg({'request-id': 1, error: 'bad wolf'});
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        assert.equal(loginStub.callCount, 1);
        assert.deepEqual(loginStub.lastCall.args, ['bad wolf']);
        done();
      });
    });

    it('login method handler is called after successful login', function(done) {
      const oldOnLogin = Y.juju.App.prototype.onLogin;
      Y.juju.App.prototype.onLogin = evt => {
        // Clean up.
        Y.juju.App.prototype.onLogin = oldOnLogin;
        // Begin assertions.
        assert.equal(conn.messages.length, 1);
        assertIsLogin(conn.last_message());
        assert.strictEqual(evt.err, null);
        done();
      };
      const app = new Y.juju.App({
        env: env,
        viewContainer: container,
        jujuCoreVersion: '2.0.0'
      });
      env.connect();
      this._cleanups.push(() => {
        env.close(app.destroy.bind(app));
      });
      app.env.userIsAuthenticated = true;
      app.env.login();
    });

    it('navigates to requested url on login', function() {
      // The difference between this test and the following one is that this
      // tests the path where there is no hash in the url.
      var stubit = utils.makeStubMethod;
      var popup = utils.makeStubMethod(
          Y.juju.App.prototype, 'popLoginRedirectPath', '/foo/bar');
      this._cleanups.push(popup.reset);
      var app = makeApp(true, this);
      stubit(app, 'maskVisibility');
      stubit(app, 'navigate');
      stubit(app, 'dispatch');
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
      var stubit = utils.makeStubMethod;
      var popup = utils.makeStubMethod(
          Y.juju.App.prototype, 'popLoginRedirectPath', '/foo/bar');
      this._cleanups.push(popup.reset);
      var app = makeApp(true, this);
      app.set('gisf', true);
      stubit(app, 'maskVisibility');
      stubit(app, 'navigate');
      stubit(app, 'dispatch');
      app.onLogin({ data: { result: true } });
      assert.equal(app.navigate.calledOnce, false,
        'navigate should not be called in gisf mode here');
    });

    // XXX This test causes intermittent cascading failures when run in CI.
    // When the notification system gets refactored this test can be un-skipped.
    it.skip('creates a notification if logged in with a token', function(done) {
      // We need to change the prototype before we instantiate.
      // See the "this.reset()" call in the callback below that cleans up.
      var stub = utils.makeStubMethod(Y.juju.App.prototype, 'onLogin');
      var app = makeApp(false, this);
      utils.makeStubMethod(app, 'maskVisibility');
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
      this._cleanups.push(() => {
        env.close(app.destroy.bind(app));
      });
      conn.msg({
        'request-id': conn.last_message()['request-id'],
        Response: {AuthTag: 'tokenuser', Password: 'tokenpasswd'}});
    });

    it('tries to log in on first connection', function(done) {
      var self = this;
      // This is the case when credential are stashed.
      var app = makeApp(false, this); // Create a disconnected app.
      app.after('ready', function() {
        env.connect();
        self._cleanups.push(() => {
          env.close(app.destroy.bind(app));
        });
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('tries to re-login on disconnections', function(done) {
      // This is the case when credential are stashed.
      var app = makeApp(true, this); // Create a connected app.
      app.after('ready', function() {
        // Disconnect and reconnect the WebSocket.
        conn.transient_close();
        conn.open();
        assert.equal(1, conn.messages.length, 'no login messages sent');
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('tries to re-login with macaroons on disconnections', function(done) {
      sessionStorage.clear();
      env.setAttrs({user: null, password: null, jujuCoreVersion: '2.0.0'});
      var app = makeApp(true, this); // Create a connected app.
      app.after('ready', function() {
        env.setCredentials({macaroons: ['macaroon']});
        // Disconnect and reconnect the WebSocket.
        conn.transient_close();
        conn.open();
        assert.equal(1, conn.messages.length, 'no login messages sent');
        var msg = conn.last_message();
        assert.strictEqual(msg.type, 'Admin');
        assert.strictEqual(msg.request, 'Login');
        assert.deepEqual(msg.params, {macaroons: [['macaroon']]});
        done();
      });
    });

    it('should allow logging out', function() {
      env.connect();
      this._cleanups.push(env.close.bind(env));
      env.logout();
      assert.strictEqual(env.userIsAuthenticated, false);
      assert.deepEqual(
        env.getCredentials(), {user: '', password: '', macaroons: null});
    });

    it('normally uses window.location', function() {
      // A lot of the app's authentication dance uses window.location,
      // both for redirects after login and for authtokens.  For tests,
      // the app copies window.location to app.location, so that we
      // can easily override it.  This test verifies that the initialization
      // actually does stash window.location as we exprect.
      var app = makeApp(false, this);
      this._cleanups.push(app.destroy.bind(app));
      assert.strictEqual(window.location, app.location);
    });

    describe('popLoginRedirectPath', function() {
      it('returns and clears redirectPath', function() {
        var app = makeApp(false, this);
        this._cleanups.push(app.destroy.bind(app));
        app.redirectPath = '/foo/bar/';
        app.location = {toString: function() {return '/login/';}};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('prefers the current path if not login', function() {
        var app = makeApp(false, this);
        this._cleanups.push(app.destroy.bind(app));
        app.redirectPath = '/';
        app.location = {toString: function() {return '/foo/bar/';}};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login/', function() {
        var app = makeApp(false, this);
        this._cleanups.push(app.destroy.bind(app));
        app.redirectPath = '/login/';
        app.location = {toString: function() {return '/login/';}};
        assert.equal(app.popLoginRedirectPath(), '/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login', function() {
        var app = makeApp(false, this);
        this._cleanups.push(app.destroy.bind(app));
        // Missing trailing slash is only difference from previous test.
        app.redirectPath = '/login';
        app.location = {toString: function() {return '/login';}};
        assert.equal(app.popLoginRedirectPath(), '/');
        assert.isUndefined(app.redirectPath);
      });
    });

    describe('currentUrl', function() {
      it('returns the full current path', function() {
        var app = makeApp(false, this);
        this._cleanups.push(app.destroy.bind(app));
        var expected = '/foo/bar/';
        app.location = {
          toString: function() {return 'https://foo.com' + expected;}};
        assert.equal(expected, app.get('currentUrl'));
        expected = '/';
        assert.equal(expected, app.get('currentUrl'));
        expected = '/foo/?bar=bing#shazam';
        assert.equal(expected, app.get('currentUrl'));
      });

      // Ensure the given token is removed from the query string.
      var checkTokenIgnored = function(token) {
        var app = makeApp(false, this);
        this._cleanups.push(app.destroy.bind(app));
        var expected_path = '/foo/bar/';
        var expected_querystring = '';
        var expected_hash = '';
        var expected = function(add_authtoken) {
          var result = expected_path;
          var querystring = expected_querystring;
          if (add_authtoken) {
            querystring += '&' + token + '=demoToken';
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
      };

      it('ignores authtokens', function() {
        // This is intended to be the canonical current path.  This should
        // never include authtokens, which are transient and can never be
        // re-used.
        checkTokenIgnored('authtoken');
      });

      it('ignores changestokens', function() {
        // This is intended to be the canonical current path.  This should
        // never include changestokens, which are transient and can never be
        // re-used.
        checkTokenIgnored('changestoken');
      });

    });

  });


  describe('Application Connection State', function() {
    var Y, app, conn, controllerAPI, env, juju, testUtils;

    function constructAppInstance() {
      var noop = function() {return this;};
      var app = new juju.App({
        env: env,
        controllerAPI: controllerAPI,
        consoleEnabled: true,
        container: container,
        jujuCoreVersion: '2.0.0',
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
        reset: sinon.stub()
      };
      app.dispatch = function() {};
      return app;
    };

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'],
          function(Y) {
            juju = Y.namespace('juju');
            testUtils = Y.namespace('juju-tests.utils');
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
      controllerAPI = new juju.ControllerAPI({
        conn: testUtils.SocketStub(),
        user: 'user',
        password: 'password'
      });
      env.login = sinon.stub();
    });

    afterEach(function() {
      env.close(app.destroy.bind(app));
    });

    it('should be able to handle env connection status changes', function() {
      app = constructAppInstance();
      env.connect();
      conn.open();
      // We need to fake the connection event.
      assert.equal(app.db.reset.callCount, 1);
      assert.equal(env.login.calledOnce, true);

      // Trigger a second time and verify.
      conn.transient_close();
      conn.open();
      assert.equal(app.db.reset.callCount, 2);
    });

    it('should connect to model when GISF', function(done) {
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.set('gisf', true);
      app.set('modelUUID', 'foobar');
      app.after('ready', function() {
        assert.equal(env.connect.callCount, 1);
        done();
      });
    });

    it('should not connect to model when GISF sandbox', function(done) {
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.set('gisf', true);
      app.set('modelUUID', 'sandbox');
      app.after('ready', function() {
        assert.equal(env.connect.callCount, 0);
        done();
      });
    });

    it('should connect to model when URL is present', function(done) {
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.set('gisf', false);
      app.set('socket_url', 'http://example.org');
      app.set('sandbox', false);
      app.after('ready', function() {
        assert.equal(env.connect.callCount, 1);
        done();
      });
    });

    it('should connect to model when in sandbox', function(done) {
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.set('gisf', false);
      app.set('socket_url', '');
      app.set('sandbox', true);
      app.after('ready', function() {
        assert.equal(env.connect.callCount, 1);
        done();
      });
    });

    it('should not connect to model w/o URL or fake backend', function(done) {
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.set('gisf', false);
      app.set('socket_url', '');
      app.set('sandbox', false);
      app.after('ready', function() {
        assert.equal(env.connect.callCount, 0);
        done();
      });
    });
  });

  describe('switchEnv', function() {
    var Y, app, testUtils;
    var _generateMockedApp = function(noWebsocket) {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
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
          return {user: this.setUser, password: this.setPassword}
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
        testUtils = Y.namespace('juju-tests.utils');
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

    it('sets credentials based on existence of jem', function() {
      app = _generateMockedApp();
      app.jem = false;
      app.switchEnv('uuid');
      assert.equal(
          app.env.setUser, 'not-called',
          'Credentials should not have been set.');
      assert.equal(
          app.env.setPassword, 'not-called',
          'Credentials should not have been set.');
      app.jem = true;
      app.switchEnv('uuid', 'new-username', 'new-password');
      assert.equal(
          app.env.setUser, 'new-username',
          'Credentials should have been set.');
      assert.equal(
          app.env.setPassword, 'new-password',
          'Credentials should have been set.');
    });

    it('skips the reconnect when necessary', function() {
      app = _generateMockedApp(false);
      var connect = testUtils.makeStubMethod(app.env, 'connect');
      this._cleanups.push(connect);
      // Try calling switchEnv both with explicit false and with socketUrl not
      // set (implicit).
      app.switchEnv('', '', '', false);
      app.switchEnv();
      assert.equal(connect.callCount, 0);
    });
  });

  describe('getUser', function() {
    var app, juju, utils, Y;

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
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(() => {
      const env = new juju.environments.GoEnvironment({
        conn: new utils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet()
      });
      app = new juju.App({
        env: env,
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
    var app, juju, utils, Y;

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
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(() => {
      const env = new juju.environments.GoEnvironment({
        conn: new utils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet()
      });
      app = new juju.App({
        env: env,
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
    var Y, app, csStub, jemStub, stub, testUtils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      stub = testUtils.makeStubMethod(
        Y.juju.App.prototype, 'setUpControllerAPI');
      this._cleanups.push(stub);
      container = Y.Node.create('<div id="test" class="container"></div>');
      app = new Y.juju.App({
        viewContainer: container,
        consoleEnabled: true,
        jujuCoreVersion: '2.0.0'
      });
      jemStub = sinon.stub();
      app.jem = {
        whoami: jemStub
      };
      var charmstore = app.get('charmstore');
      csStub = testUtils.makeStubMethod(charmstore, 'whoami');
      this._cleanups.push(csStub);
    });

    afterEach(function() {
      app.destroy({remove: true});
    });

    it('calls jem whoami for jem users', function() {
      var user = {user: 'test'};
      app.storeUser('jem');
      assert.equal(jemStub.callCount, 1);
      assert.equal(csStub.callCount, 0);
      var cb = jemStub.lastCall.args[0];
      cb(null, user);
      var users = app.get('users');
      assert.deepEqual(users['jem'], user);
    });

    it('calls charmstore whoami for charmstore users', function() {
      var user = {user: 'test'};
      app.storeUser('charmstore');
      assert.equal(csStub.callCount, 1);
      assert.equal(jemStub.callCount, 0);
      var cb = csStub.lastCall.args[0];
      cb(null, user);
      var users = app.get('users');
      assert.deepEqual(users['charmstore'], user);
    });
  });

  describe('_getAuth', function() {
    var Y, app, credStub, stub, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-gui',
        'juju-tests-utils'
      ], function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      stub = utils.makeStubMethod(
        Y.juju.App.prototype, 'setUpControllerAPI');
      this._cleanups.push(stub);
      container = Y.Node.create('<div id="test" class="container"></div>');
      app = new Y.juju.App({
        viewContainer: container,
        consoleEnabled: true,
        jujuCoreVersion: '2.0.0'
      });
      credStub = utils.makeStubMethod(app.env, 'getCredentials', {user: ''});
      this._cleanups.push(credStub.reset);
    });

    afterEach(function() {
      app.destroy({remove: true});
    });

    it('fetches the auth', function() {
      var user = {user: 'admin'};
      app.set('users', {'jem': user});
      assert.deepEqual(app._getAuth(), user);
    });

    it('uses external auth if present', function() {
      app.set('auth', 'baz');
      app.set('users', { 'foo': 'bar' });
      assert.equal(app._getAuth(), 'baz');
    });

    it('does not break when auth is not set', function() {
      app.set('users', {});
      assert.isUndefined(app._getAuth());
    });

    it('can clean up the username', function() {
      app.set('users', {jem: {user: 'user-admin'}});
      var auth = app._getAuth();
      assert.equal(auth.user, 'user-admin');
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
        charmstore: new window.jujulib.charmstore('http://1.2.3.4/'),
        container: container,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        sandbox: true,
        controllerSocketTemplate: '/api',
        socketTemplate: '/model/$uuid/api',
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
        charmstore: new window.jujulib.charmstore('http://1.2.3.4/'),
        container: container,
        jujuCoreVersion: '2.0.0',
        sandbox: true,
        controllerSocketTemplate: '/api',
        socketTemplate: '/model/$uuid/api',
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

    describe('pickModel', () => {
      it('can pick the right model from a list based on config', () => {
        app = new Y.juju.App({
          apiAddress: 'example.com:17070',
          conn: {close: function() {}},
          container: container,
          jujuCoreVersion: '2.1.1',
          modelUUID: 'who-uuid',
          user: 'rose',
          socket_protocol: 'ws',
          socketTemplate: '/juju/api/$server/$port/$uuid',
          controllerSocketTemplate: '/api',
          viewContainer: container
        });
        const fakeModelList = [{
          uuid: 'dalek-uuid',
        }, {
          uuid: 'who-uuid',
        }, {
          uuid: 'rose-uuid'
        }];
        const model = app._pickModel(fakeModelList);
        assert.strictEqual(model.uuid, 'who-uuid');
        assert.strictEqual(app.get('modelUUID'), 'who-uuid');
      });

      it('picks the first model in a list without config', () => {
        app = new Y.juju.App({
          apiAddress: 'example.com:17070',
          conn: {close: function() {}},
          container: container,
          jujuCoreVersion: '2.1.1',
          user: 'rose',
          socket_protocol: 'ws',
          socketTemplate: '/juju/api/$server/$port/$uuid',
          controllerSocketTemplate: '/api',
          viewContainer: container
        });
        const fakeModelList = [{
          uuid: 'dalek-uuid',
        }, {
          uuid: 'who-uuid',
        }, {
          uuid: 'rose-uuid'
        }];
        const model = app._pickModel(fakeModelList);
        assert.strictEqual(model.uuid, 'dalek-uuid');
        assert.strictEqual(app.get('modelUUID'), 'dalek-uuid');
      });

      it('picks the first model if no model matches', () => {
        app = new Y.juju.App({
          apiAddress: 'example.com:17070',
          conn: {close: function() {}},
          container: container,
          jujuCoreVersion: '2.1.1',
          modelUUID: 'bannakaffalatta-uuid',
          user: 'rose',
          socket_protocol: 'ws',
          socketTemplate: '/juju/api/$server/$port/$uuid',
          controllerSocketTemplate: '/api',
          viewContainer: container
        });
        const fakeModelList = [{
          uuid: 'dalek-uuid',
        }, {
          uuid: 'who-uuid',
        }, {
          uuid: 'rose-uuid'
        }];
        const model = app._pickModel(fakeModelList);
        assert.strictEqual(model.uuid, 'dalek-uuid');
        assert.strictEqual(app.get('modelUUID'), 'dalek-uuid');
      });
    });

    it('honors socket_protocol and uuid', function() {
      app = new Y.juju.App({
        apiAddress: 'example.com:17070',
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
      if (loggedIn) {
        if (credentials) {
          // Credentials have been set on the API.
          assert.strictEqual(api.setCredentials.calledOnce, true);
          assert.deepEqual(api.setCredentials.getCall(0).args, [credentials]);
        }
        // The API has been authenticated with credentials.
        assert.strictEqual(api.login.calledOnce, true);
        assert.strictEqual(api.login.getCall(0).args.length, 0);
        return;
      }
      // No credentials have been set and login has not been called.
      assert.strictEqual(api.setCredentials.called, false);
      assert.strictEqual(api.login.called, false);
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
      checkLoggedInWithCredentials(model, false, null);
    });

    it('is a no-op if no API is connected', () => {
      const credentials = {user: 'user-who', password: 'passwd'};
      const useMacaroons = false;
      app.controllerAPI = makeAPIConnection(false);
      app.env = null;
      app.loginToAPIs(credentials, useMacaroons);
      checkLoggedInWithCredentials(app.controllerAPI, false, null);
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

  describe('checkUserCredentials', function() {
    var app, juju, utils;

    before(function(done) {
      YUI(GlobalConfig).use([
        'juju-gui',
        'juju-tests-utils',
        'juju-view-utils',
        'juju-views',
        'environment-change-set'
      ],
      function(Y) {
        juju = Y.namespace('juju');
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(() => {
      const env = new juju.environments.GoEnvironment({
        conn: new utils.SocketStub(),
        ecs: new juju.EnvironmentChangeSet()
      });
      app = new juju.App({
        env: env,
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

    it('should proceed to next if disconnected but jem is set', function() {
      var req = {}, res = {};
      var next = sinon.stub();
      // Ensure jem is set.
      app.jem = true;
      app.checkUserCredentials(req, res, next);
      assert.equal(next.callCount, 1, 'Next not invoked.');
    });
  });

  describe('isLegacyJuju', function() {
    var app, stub, testUtils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui', 'juju-tests-utils'], function(Y) {
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      stub = testUtils.makeStubMethod(
        Y.juju.App.prototype, 'setUpControllerAPI');
      this._cleanups.push(stub);
      app = new Y.juju.App({
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

});
