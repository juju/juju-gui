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
        'deployment-container',
        'login-container',
        'notifications-container',
        'loading-message',
        'environment-switcher'
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
      if (config.env && config.env.connect) {
        config.env.connect();
        context._cleanups.push(config.env.close.bind(config.env));
        config.env.ecs = new juju.EnvironmentChangeSet();
      }
      config.container = container;
      config.viewContainer = container;
      app = new Y.juju.App(Y.mix(config, {consoleEnabled: true}));
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
          app = new Y.juju.App(
              { container: container,
                user: the_username,
                password: the_password,
                viewContainer: container,
                conn: {close: function() {}},
                jujuCoreVersion: '1.21.1.1-trusty-amd64',
                ecs: new juju.EnvironmentChangeSet()});
          app.after('ready', function() {
            var credentials = app.env.getCredentials();
            assert.equal(credentials.user, 'user-' + the_username);
            assert.equal(credentials.password, the_password);
            done();
          });
        });

    it('propagates the readOnly option from the configuration', function() {
      app = new Y.juju.App({
        container: container,
        readOnly: true,
        viewContainer: container,
        conn: {close: function() {}},
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        ecs: new juju.EnvironmentChangeSet()
      });
      assert.isTrue(app.env.get('readOnly'));
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
        jujuCoreVersion: '1.21.1.1-trusty-amd64'
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
      app._autoPlaceUnits = utils.makeStubFunction();
      app._autoplaceAndCommitAll();
      assert.equal(app._autoPlaceUnits.callCount(), 1);
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
        assert.equal(setup.callCount(), 1);
      });

      it('is idempotent', function() {
        window.juju_config = {
          charmstoreURL: 'charmurl',
          apiPath: 'v4'
        };
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new utils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet()
          })
        }, this);
        // The charmstore attribute is undefined by default
        assert.equal(typeof app.get('charmstore'), 'object');
        assert.equal(app.get('charmstore').url, 'charmurl');
        assert.equal(app.get('charmstore').version, 'v4');
        window.juju_config.charmstoreURL = 'it broke';
        assert.equal(
            app.get('charmstore').url,
            'charmurl',
            'It should only ever create a single instance of the charmstore');
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

      app = new Y.juju.App(config);
      return app;
    }

    describe('drag event attach and detach', function() {
      it('binds the drag handlers', function() {
        var stub = testUtils.makeStubMethod(document, 'addEventListener');
        this._cleanups.push(stub.reset);
        constructAppInstance({}, this);
        assert.equal(stub.callCount(), 3);
        var args = stub.allArguments();
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
          assert.equal(stub.callCount(), 3);
          var args = stub.allArguments();
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
        var fade = testUtils.makeStubFunction();
        var reactdom = testUtils.makeStubMethod(ReactDOM, 'render');
        this._cleanups.push(reactdom.reset);
        app._renderDragOverNotification.call({
          views: {
            environment: {
              instance: {
                fadeHelpIndicator: fade
              }}}
        });
        assert.equal(fade.callCount(), 1);
        assert.equal(fade.lastArguments()[0], true);
        assert.equal(reactdom.callCount(), 1);
      });

      it('_hideDragOverNotification hides drop UI', function() {
        var fade = testUtils.makeStubFunction();
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
        assert.equal(fade.callCount(), 1);
        assert.equal(fade.lastArguments()[0], false);
        assert.equal(reactdom.callCount(), 1);
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

      assert.equal(determineFileTypeStub.callCount(), 3);
      assert.equal(renderDragOverStub.calledOnce(), true);
      assert.equal(dragTimerControlStub.callCount(), 3);
      var args = dragTimerControlStub.allArguments();
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
    var conn, destroyMe, ecs, env, juju, utils, Y;
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
      ecs = new juju.EnvironmentChangeSet();
      env = new juju.environments.GoEnvironment({
        conn: conn,
        ecs: ecs,
        user: 'user',
        password: 'password'
      });
      env.setCredentials({user: 'user', password: 'password'});
      destroyMe = [env, ecs];
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
      assert.equal('Admin', message.Type);
      assert.equal('Login', message.Request);
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
          assert.strictEqual(render.calledOnce(), true, 'render not called');
          var node = render.lastArguments()[0];
          assert.strictEqual(
            node.props.helpMessage,
            'Find your username and password with ' +
            '`juju show-controller --include-passwords`'
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
          assert.strictEqual(render.calledOnce(), true, 'render not called');
          var node = render.lastArguments()[0];
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
        assert.equal(app.env.getCredentials(), null);
        assert.equal(conn.messages.length, 0);
        done();
      });
    });

    it('uses the authtoken when there are no credentials', function(done) {
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
      var app = makeApp(false, this);
      // Override the local window.location object.
      app.location = {search: '?authtoken=demoToken'};
      env.connect();
      this._cleanups.push(env.close.bind(env));
      app.after('ready', function() {
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('displays the login view if credentials are not valid', function(done) {
      var app = makeApp(true, this); // Create a connected app.
      var loginStub = utils.makeStubMethod(app, '_renderLogin');
      app.after('ready', function() {
        app.env.login();
        // Mimic a login failed response assuming login is the first request.
        conn.msg({RequestId: 1, Error: 'Invalid user or password'});
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        assert.equal(loginStub.callCount(), 1);
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
      var popup = utils.makeStubMethod(
          Y.juju.App.prototype, 'popLoginRedirectPath', '/foo/bar#baz');
      this._cleanups.push(popup.reset);
      var app = makeApp(true, this);
      stubit(app, 'maskVisibility');
      stubit(app, 'navigate');
      stubit(app, 'dispatch');
      app.onLogin({ data: { result: true } });
      assert.equal(app.navigate.calledOnce(), true);
      assert.deepEqual(app.navigate.lastArguments(), [
        '/foo/bar#baz',
        { overrideAllNamespaces: true }]);
      assert.equal(app.dispatch.calledOnce(), true);
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
        var e = this.lastArguments()[0];
        // These two really simply verify that our test prep did what we
        // expected.
        assert.equal(e.data.result, true);
        assert.equal(e.data.fromToken, true);
        this.passThroughToOriginalMethod(app);
        assert.equal(app.maskVisibility.calledOnce(), true);
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
      this._cleanups.push(env.close.bind(env));
      conn.msg({
        RequestId: conn.last_message().RequestId,
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
        assert.equal(1, conn.messages.length);
        assertIsLogin(conn.last_message());
        done();
      });
    });

    it('should allow logging out', function() {
      env.connect();
      this._cleanups.push(env.close.bind(env));
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
    var Y;

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
          env = new juju.environments.GoEnvironment({
            conn: conn,
            user: 'user',
            password: 'password'
          }),
          app = new Y.juju.App({env: env, container: container}),
          reset_called = false,
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
      app.dispatch = function() {};
      env.login = function() {
        login_called = true;
      };
      env.connect();
      conn.open();
      // We need to fake the connection event.
      reset_called.should.equal(true);
      login_called.should.equal(true);

      // Trigger a second time and verify.
      conn.transient_close();
      reset_called = false;
      login_called = false;
      conn.open();
      reset_called.should.equal(true);
      env.close();
      app.destroy();
    });

  });

  describe('switchEnv', function() {
    var Y, app;
    var _generateMockedApp = function(sandbox, socketUrl) {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        charmstorestore: new window.jujulib.charmstore(),
        consoleEnabled: true,
        container: container,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        password: 'admin',
        sandbox: sandbox,
        sandboxSocketURL: 'ws://host:port/ws/environment/undefined/api',
        socketTemplate: '/environment/$uuid/api',
        user: 'admin',
        viewContainer: container
      });
      var fake_ws = {
        onclose: function() { this.oncloseCalled = true; },
        oncloseCalled: false
      };
      var fake_ecs = {
        clear: function() { this.clearCalled = true; },
        clearCalled: false
      };
      var fake_env = {
        ecs: fake_ecs,
        ws: fake_ws,
        closeCalled: false,
        socketUrl: socketUrl || 'wss://example.com/ws',
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
      return app;
    };

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
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

    it('clears and resets the env, db, and ecs on change', function() {
      app = _generateMockedApp(false);
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
      app = _generateMockedApp(false);
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
  });

  describe('storeUser', function() {
    var Y, app;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
        done();
      });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      app = new Y.juju.App({
        viewContainer: container,
        consoleEnabled: true
      });
    });

    afterEach(function() {
      app.destroy({remove: true});
    });

    var makeMacaroon = function(invalid) {
      var data = [{
        caveats: [{cid: 'nothing'}, {cid: 'also nothing'}],
      }, {
        caveats: [{cid: 'declared username rose'}, {cid: 'more nothing'}]
      }, {
        caveats: [{cid: 'whole lot of nothing'}]
      }];
      if (invalid) {
        data.push({caveats: [{cid: 'declared username bad wolf'}]});
        data.push({caveats: [{cid: 'declared username dalek'}]});
      }
      data = JSON.stringify(data);
      return btoa(data);
    };

    it('handles no macaroon being found.', function() {
      app.storeUser('jem', '');
      var users = app.get('users');
      assert.isUndefined(users['jem']);
    });

    it('can get username from a macaroon.', function() {
      var macaroon = makeMacaroon();
      app.storeUser('jem', macaroon);
      var users = app.get('users');
      assert.deepEqual(users['jem'], {user: {name: 'rose'}});
    });

    it('returns null if the macaroon has multiple usernames.', function() {
      var macaroon = makeMacaroon(true);
      app.storeUser('jem', macaroon);
      var users = app.get('users');
      assert.isUndefined(users['jem']);
    });
  });

  describe('_getAuth', function() {
    var Y, app;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
        done();
      });
    });

    beforeEach(function() {
      container = Y.Node.create('<div id="test" class="container"></div>');
      app = new Y.juju.App({
        viewContainer: container,
        consoleEnabled: true
      });
    });

    afterEach(function() {
      app.destroy({remove: true});
    });

    it('fetches the auth for a particular service', function() {
      app.set('users', { 'foo': 'bar' });
      assert.equal(app._getAuth('foo'), 'bar');
    });

    it('uses external auth if present', function() {
      app.set('auth', 'baz');
      app.set('users', { 'foo': 'bar' });
      assert.equal(app._getAuth('foo'), 'baz');
    });

    it('does not break when auth is not set', function() {
      app.set('users', {});
      assert.isUndefined(app._getAuth('foo'));
    });
  });

  describe('Application sandbox mode', function() {
    var Y, app;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
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
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        charmstorestore: new window.jujulib.charmstore(),
        consoleEnabled: true,
        container: container,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        password: 'admin',
        sandboxSocketURL: 'ws://host:port/ws/environment/undefined/api',
        sandbox: true,
        socketTemplate: '/environment/$uuid/api',
        user: 'admin',
        viewContainer: container
      });
      app.showView(new Y.View());
      // This simply walks through the hierarchy to show that all the
      // necessary parts are there.
      assert.isObject(app.env.get('conn').get('juju').get('state'));
      // Assert we have a default websocket url.
      assert.equal(
          app.env.get('conn').get('juju').get('socket_url'),
          'ws://host:port/ws/environment/undefined/api');
    });

    it('passes a fake web handler to the environment', function() {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        charmstore: new window.jujulib.charmstore(),
        container: container,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        sandbox: true,
        socketTemplate: '/environment/$uuid/api',
        viewContainer: container
      });
      app.showView(new Y.View());
      var webHandler = app.env.get('webHandler');
      assert.strictEqual(webHandler.name, 'sandbox-web-handler');
    });

    it('creates a placeholder socketUrl', function() {
      app = new Y.juju.App({
        apiAddress: 'http://example.com:17070',
        charmstore: new window.jujulib.charmstore(),
        container: container,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        sandbox: true,
        socketTemplate: '/environment/$uuid/api',
        viewContainer: container
      });
      var socketUrl = app.createSocketURL();
      var expected = [
        'wss://',
        window.location.hostname,
        ':',
        window.location.port,
        '/sandbox'
      ].join('');
      assert.equal(expected, socketUrl);
    });

  });


  describe('configuration parsing', function() {

    var Y, app, getLocation;

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

    it('can pick the right environment from a list based on config',
        function() {
          app = new Y.juju.App({
            apiAddress: 'example.com:17070',
            conn: {close: function() {}},
            container: container,
            jujuCoreVersion: '1.21.1.1-trusty-amd64',
            jujuEnvUUID: 'tardis',
            user: 'rose',
            socket_protocol: 'ws',
            socketTemplate: '/juju/api/$server/$port/$uuid',
            viewContainer: container
          });
          var fakeEnvList = [{
            path: 'dalek/exterminate',
          }, {
            path: 'rose/badwolf',
          }, {
            path: 'rose/tardis'
          }];
          var envData = app._pickEnv(fakeEnvList);
          assert.equal('rose/tardis', envData.path);
        });

    it('picks the first environment in a list without config',
        function() {
          app = new Y.juju.App({
            apiAddress: 'example.com:17070',
            conn: {close: function() {}},
            container: container,
            jujuCoreVersion: '1.21.1.1-trusty-amd64',
            user: 'rose',
            socket_protocol: 'ws',
            socketTemplate: '/juju/api/$server/$port/$uuid',
            viewContainer: container
          });
          var fakeEnvList = [{
            path: 'dalek/exterminate',
          }, {
            path: 'rose/badwolf',
          }, {
            path: 'rose/tardis'
          }];
          var envData = app._pickEnv(fakeEnvList);
          assert.equal('dalek/exterminate', envData.path);
        });

    it('should honor socket_protocol and uuid', function() {
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
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        jujuEnvUUID: '1234-1234',
        socket_protocol: 'ws',
        socketTemplate: '/juju/api/$server/$port/$uuid',
        viewContainer: container
      });
      app.showView(new Y.View());
      assert.equal(app.env.get('socket_url'), expected);
    });
  });

});
