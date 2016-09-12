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
  var container;

  before(function(done) {
    YUI(GlobalConfig).use(['juju-gui'], function(Y) {
      var elements = [
        'charmbrowser-container',
        'deployment-bar-container',
        'deployment-container',
        'login-container',
        'notifications-container',
        'loading-message',
        'header-breadcrumb'
      ];
      container = Y.Node.create('<div>');
      container.set('id', 'test-container');
      container.addClass('container');
      // Set up the elements needed to render the components.
      elements.forEach(function(id) {
        container.appendChild(Y.Node.create('<div/>')).set('id', id);
      });
      container.appendTo(document.body);
      done();
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

      app.destroy();
    });

    function constructAppInstance(config, context) {
      config = config || {};
      config.jujuCoreVersion = config.jujuCoreVersion || '2.0.0';
      if (config.env && config.env.connect) {
        config.env.connect();
        context._cleanups.push(config.env.close.bind(config.env));
        config.env.ecs = new juju.EnvironmentChangeSet();
      }
      config.container = container;
      config.viewContainer = container;
      app = new Y.juju.App(Y.mix(config, {
        consoleEnabled: true,
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api'
      }));
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
          app = new Y.juju.App({
            container: container,
            consoleEnabled: true,
            user: the_username,
            password: the_password,
            viewContainer: container,
            conn: {close: function() {}},
            jujuCoreVersion: '2.0-trusty-amd64',
            controllerSocketTemplate: '/api',
            socketTemplate: '/model/$uuid/api',
            ecs: new juju.EnvironmentChangeSet()});
          app.after('ready', function() {
            var credentials = app.env.getCredentials();
            assert.equal(credentials.user, 'user-' + the_username);
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
        jujuCoreVersion: '2.1.1-trusty-amd64'
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

    it('should show the correct message on a mac', function() {
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

      afterEach(function() {
        delete window.juju_config;
      });

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
        window.juju_config = {
          charmstoreURL: 'http://1.2.3.4/',
          plansURL: 'http://plans.example.com/',
          termsURL: 'http://terms.example.com/'
        };
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

      afterEach(function() {
        delete window.juju_config;
      });

      it('sets up API clients', function() {
        window.juju_config = {
          plansURL: 'http://plans.example.com/',
          termsURL: 'http://terms.example.com/'
        };
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
      app.after('destroy', function() {
        sessionStorage.setItem('credentials', null);
      });

      app.destroy();
    });

    function constructAppInstance(config, context) {
      config = config || {};
      if (!config.env) {
        config.env = new juju.environments.GoEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          },
          ecs: new juju.EnvironmentChangeSet()
        });
      }
      if (config.env && config.env.connect) {
        config.env.connect();
        context._cleanups.push(config.env.close.bind(config.env));
      }
      config.container = container;
      config.viewContainer = container;
      config.jujuCoreVersion = '2.0.0';

      app = new Y.juju.App(config);
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
        context._cleanups.push(env.close.bind(env));
      }
      destroyMe.push(app);
      return app;
    };

    // Ensure the given message is a login request.
    var assertIsLogin = function(message) {
      assert.equal('Admin', message.type);
      assert.equal('Login', message.request);
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
      app.after('ready', function() {
        assert.equal(0, conn.messages.length);
        done();
      });
    });

    it('tries to login if the env connection is established', function(done) {
      var app = makeApp(true, this); // Create a connected app.
      app.after('ready', function() {
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
      this._cleanups.push(env.close.bind(env));
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
      this._cleanups.push(env.close.bind(env));
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
      this._cleanups.push(env.close.bind(env));
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
      this._cleanups.push(env.close.bind(env));
      app.env.userIsAuthenticated = true;
      app.env.login();
      app.destroy(true);
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
      this._cleanups.push(env.close.bind(env));
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
        self._cleanups.push(env.close.bind(env));
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
      assert.strictEqual(window.location, app.location);
    });

    describe('popLoginRedirectPath', function() {
      it('returns and clears redirectPath', function() {
        var app = makeApp(false, this);
        app.redirectPath = '/foo/bar/';
        app.location = {toString: function() {return '/login/';}};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('prefers the current path if not login', function() {
        var app = makeApp(false, this);
        app.redirectPath = '/';
        app.location = {toString: function() {return '/foo/bar/';}};
        assert.equal(app.popLoginRedirectPath(), '/foo/bar/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login/', function() {
        var app = makeApp(false, this);
        app.redirectPath = '/login/';
        app.location = {toString: function() {return '/login/';}};
        assert.equal(app.popLoginRedirectPath(), '/');
        assert.isUndefined(app.redirectPath);
      });

      it('uses root if the redirectPath is /login', function() {
        var app = makeApp(false, this);
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
      env.close();
      app.destroy();
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
      app.set('jujuEnvUUID', 'foobar');
      app.after('ready', function() {
        assert.equal(env.connect.callCount, 1);
        done();
      });
    });

    it('should not connect to model when GISF sandbox', function(done) {
      env.connect = sinon.stub();
      app = constructAppInstance();
      app.set('gisf', true);
      app.set('jujuEnvUUID', 'sandbox');
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

  describe.skip('getUser', function() {
    var Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-gui', function() {
        done();
      });
    });

    beforeEach(function() {});
    afterEach(function() {});

    it('gets the set user for the supplied service', function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      var app = new Y.juju.App({
        viewContainer: container,
        consoleEnabled: true,
        jujuCoreVersion: '2.0.0',
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api'
      });
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
    var Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('juju-gui', function() {
        done();
      });
    });
    // If these *Each aren't here this test hangs ¯\_(ツ)_/¯
    beforeEach(() => {});
    afterEach(() => {});

    it('clears the set user for the supplied service', function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      var app = new Y.juju.App({
        viewContainer: container,
        consoleEnabled: true,
        jujuCoreVersion: '2.0.0',
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api'
      });
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

    it('can pick the right model from a list based on config',
        function() {
          app = new Y.juju.App({
            apiAddress: 'example.com:17070',
            conn: {close: function() {}},
            container: container,
            jujuCoreVersion: '2.1.1',
            jujuEnvUUID: 'tardis',
            user: 'rose',
            socket_protocol: 'ws',
            socketTemplate: '/juju/api/$server/$port/$uuid',
            controllerSocketTemplate: '/api',
            viewContainer: container
          });
          var fakeEnvList = [{
            path: 'dalek/exterminate',
          }, {
            path: 'rose/badwolf',
          }, {
            path: 'rose/tardis'
          }];
          var envData = app._pickModel(fakeEnvList);
          assert.equal('rose/tardis', envData.path);
        });

    it('picks the first model in a list without config',
        function() {
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
          var fakeEnvList = [{
            path: 'dalek/exterminate',
          }, {
            path: 'rose/badwolf',
          }, {
            path: 'rose/tardis'
          }];
          var envData = app._pickModel(fakeEnvList);
          assert.equal('dalek/exterminate', envData.path);
        });

    it('honors socket_protocol and uuid', function() {
      var expected = [
        'ws://',
        window.location.hostname,
        ':',
        window.location.port,
        '/juju/api/example.com/17070/1234-1234'
      ].join('');
      app = new Y.juju.App({
        apiAddress: 'example.com:17070',
        conn: {close: function() {}},
        container: container,
        jujuCoreVersion: '2.1.1',
        jujuEnvUUID: '1234-1234',
        socket_protocol: 'ws',
        socketTemplate: '/juju/api/$server/$port/$uuid',
        controllerSocketTemplate: '/api',
        viewContainer: container
      });
      app.showView(new Y.View());
      assert.equal(app.env.get('socket_url'), expected);
    });

    it('honors a fully qualified provided socket URL', function() {
      app = new Y.juju.App({
        apiAddress: 'example.com:17070',
        conn: {close: function() {}},
        container: container,
        jujuCoreVersion: '2.1.1',
        jujuEnvUUID: '1234-1234',
        socket_protocol: 'ws',
        socketTemplate: 'wss://my.$server:$port/model/$uuid/api',
        controllerSocketTemplate: '/api',
        viewContainer: container
      });
      app.showView(new Y.View());
      assert.equal(
        app.env.get('socket_url'),
        'wss://my.example.com:17070/model/1234-1234/api');
    });
  });

  describe('checkUserCredentials', function() {
    var app, testUtils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-gui',
        'juju-tests-utils'
      ],
      function(Y) {
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      app = new Y.juju.App({
        consoleEnabled: true,
        jujuCoreVersion: '2.0.0',
        viewContainer: container,
        socketTemplate: '/model/$uuid/api',
        controllerSocketTemplate: '/api'
      });
    });

    afterEach(function() {
      app.destroy();
    });

    it('should proceed to next if disconnected but jem is set', function() {
      var req = {}, res = {};
      var next = sinon.stub();
      var maskVisibility = testUtils.makeStubMethod(app, 'maskVisibility');
      this._cleanups.push(maskVisibility.reset);
      // Ensure jem is set.
      app.jem = true;
      app.checkUserCredentials(req, res, next);
      var args = maskVisibility.args;
      assert.equal(args[0][0], false);
      assert.equal(maskVisibility.callCount, 1, 'Visibility mask not hidden');
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
