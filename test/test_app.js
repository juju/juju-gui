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
      Y = YUI(GlobalConfig).use([
        'juju-gui',
        'juju-view-utils',
        'juju-views',
        'environment-change-set'
      ],
      function(Y) {
        utils = window.jujuTestUtils.utils;
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
            .set('id', 'environment-name')
            .addClass('environment-name'))
          .hide();

    });

    afterEach(function(done) {
      // Reset the flags.
      window.flags = {};
      app.after('destroy', function() {
        container.remove(true);
        sessionStorage.setItem('credentials', null);
        done();
      });

      app.destroy();
    });

    function constructAppInstance(config, context) {
      config = config || {};
      if (config.env && config.env.connect) {
        config.env.connect();
        config.env.ecs = new juju.EnvironmentChangeSet();
      }
      config.container = container;
      config.viewContainer = container;
      if (context) {
        var _renderDeployerBarView = utils.makeStubMethod(
            Y.juju.App.prototype, '_renderDeployerBarView');
        context._cleanups.push(_renderDeployerBarView.reset);
      }
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
          var _renderDeployerBarView = utils.makeStubMethod(
              Y.juju.App.prototype, '_renderDeployerBarView');
          this._cleanups.push(_renderDeployerBarView.reset);
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
      var _renderDeployerBarView = utils.makeStubMethod(
          Y.juju.App.prototype, '_renderDeployerBarView');
      this._cleanups.push(_renderDeployerBarView.reset);
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

    it('should display the configured environment name', function() {
      var environment_name = 'This is the environment name.  Deal with it.';
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          },
          ecs: new juju.EnvironmentChangeSet()
        }),
        environment_name: environment_name
      }, this);
      assert.equal(
          container.one('#environment-name').get('text'),
          environment_name);
    });

    it('should show a generic environment name if none configured',
       function() {
         constructAppInstance({
           env: new juju.environments.GoEnvironment({
             conn: {
               send: function() {},
               close: function() {}
             },
             ecs: new juju.EnvironmentChangeSet()
           })
         });
         assert.equal(
         container.one('#environment-name').get('text'),
         'Environment');
       });

    it('should show a the environment name if one is configured', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          },
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      var name = 'Sandbox';
      assert.equal(
          'Environment',
          container.one('.environment-name').get('text'));
      app.env.set('environmentName', name);
      assert.equal(container.one('.environment-name').get('text'), 'Sandbox');
    });

    it('should show the environment name override when requested', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          },
          ecs: new juju.EnvironmentChangeSet()
        })
      }, this);
      var name = 'Sandbox';
      localStorage.setItem('environmentName', 'not sandbox');
      assert.equal(
          'Environment',
          container.one('.environment-name').get('text'));
      app.env.set('environmentName', name);
      assert.equal(
          container.one('.environment-name').get('text'),
          'not sandbox');
      localStorage.removeItem('environmentName');
    });

    it('hides the browser subapp on some urls', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: {
            send: function() {},
            close: function() {}
          },
          ecs: new juju.EnvironmentChangeSet(),
          jujuCoreVersion: '1.21.1.1-trusty-amd64'
        })
      }, this);

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
        app.get('subApps').charmbrowser.fire('autoplaceAndCommitAll');
      });
    });

    it('autoplaceAndCommitAll places and deploys', function() {
      constructAppInstance({
        jujuCoreVersion: '1.21.1.1-trusty-amd64'
      }, this);
      app.deployerBar = {
        _autoPlaceUnits: utils.makeStubFunction(),
        deploy: utils.makeStubFunction(),
        destroy: function() {}
      };
      app._autoplaceAndCommitAll();
      assert.equal(app.deployerBar._autoPlaceUnits.callCount(), 1);
      assert.equal(app.deployerBar.deploy.callCount(), 1);
    });

    it('should display a zoom message on small browsers', function() {
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      });
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
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      });
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
      });
      app._displayZoomMessage(1024, 'linux');
      assert.isTrue(app.db.notifications.item(0).get(
          'message').indexOf('ctrl+-') !== -1);
    });

    it('renders the environment header', function(done) {
      container.appendChild(Y.Node.create(
          '<div id="environment-header"></div>'));
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      });
      app.after('ready', function() {
        assert.isObject(app.environmentHeader);
        assert.equal(container.one('#environment-header').hasClass(
            'environment-header'), true);
        done();
      });
    });

    it('renders the user dropdown', function(done) {
      container.appendChild(Y.Node.create('<div id="user-dropdown"></div>'));
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      });
      app.after('ready', function() {
        assert.isObject(app.userDropdown);
        assert.equal(container.one('#user-dropdown').hasClass(
            'dropdown-menu'), true);
        done();
      });
    });

    it('does not render user dropdown with hideLoginButton', function(done) {
      window.juju_config = { hideLoginButton: true };
      container.appendChild(Y.Node.create('<div id="user-dropdown"></div>'));
      constructAppInstance({
        env: new juju.environments.GoEnvironment({
          conn: new utils.SocketStub(),
          ecs: new juju.EnvironmentChangeSet()
        })
      });
      app.after('ready', function() {
        assert.isNotObject(app.userDropdown);
        assert.equal(container.one('#user-dropdown').hasClass(
            'dropdown-menu'), false);
        delete window.juju_config.hideLoginButton;
        done();
      });
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

      // Ensure the given MAAS node is shown and includes a link to the given
      // address.
      var assertMaasLinkExists = function(node, address) {
        assert.strictEqual(node.getStyle('display'), 'block');
        assert.strictEqual(node.one('a').get('href'), address);
      };

      it('shows a link to the MAAS server if provider is MAAS', function() {
        constructAppInstance({env: env});
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
        constructAppInstance({env: env});
        // The link to the MAAS server should be already activated.
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
        // Further changes to the maasServer attribute don't change the link.
        env.set('maasServer', 'http://example.com/MAAS');
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
      });

      it('does not show the MAAS link if provider is not MAAS', function() {
        constructAppInstance({env: env});
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
        constructAppInstance({env: env});
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
        assert.equal(setup.callCount(), 1);
      });

      it('is idempotent', function() {
        window.juju_config = {
          charmstoreURL: 'charmurl'
        };
        constructAppInstance({
          env: new juju.environments.GoEnvironment({
            conn: new utils.SocketStub(),
            ecs: new juju.EnvironmentChangeSet()
          })
        }, this);
        // The charmstore attribute is undefined by default
        assert.equal(typeof app.get('charmstore'), 'object');
        assert.equal(app.get('charmstore').charmstoreURL, 'charmurl');
        window.juju_config.charmstoreURL = 'it broke';
        assert.equal(
            app.get('charmstore').charmstoreURL,
            'charmurl',
            'It should only ever create a single instance of the charmstore');
      });

    });

  });
})();


describe('File drag over notification system', function() {
  var Y, app, container, testUtils, juju, env, conn;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-gui', 'juju-view-utils', 'juju-views'],
        function(Y) {
          testUtils = window.jujuTestUtils.utils;
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
        .hide();
    var _renderDeployerBarView = testUtils.makeStubMethod(
        Y.juju.App.prototype, '_renderDeployerBarView');
    this._cleanups.push(_renderDeployerBarView.reset);
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
    }
    config.container = container;
    config.viewContainer = container;

    app = new Y.juju.App(config);
    return app;
  }

  describe('drag event attach and detach', function() {
    it('binds the drag handlers', function() {
      var stub = testUtils.makeStubMethod(Y.config.doc, 'addEventListener');
      constructAppInstance();
      // This function doesn't exist until the appDragOverHandler
      // function is bound to the app.
      assert.isFunction(app._boundAppDragOverHandler);
      assert.equal(stub.callCount(), 3);
      var args = stub.allArguments();
      assert.equal(args[0][0], 'dragenter');
      assert.isFunction(args[0][1]);
      assert.equal(args[1][0], 'dragover');
      assert.isFunction(args[1][1]);
      assert.equal(args[2][0], 'dragleave');
      assert.isFunction(args[2][1]);
      stub.reset();
    });

    it('removes the drag handlers', function(done) {
      var stub = testUtils.makeStubMethod(Y.config.doc, 'removeEventListener');
      constructAppInstance();

      app.after('destroy', function() {
        assert.equal(stub.callCount(), 3);
        var args = stub.allArguments();
        assert.equal(args[0][0], 'dragenter');
        assert.isFunction(args[0][1]);
        assert.equal(args[1][0], 'dragover');
        assert.isFunction(args[1][1]);
        assert.equal(args[2][0], 'dragleave');
        assert.isFunction(args[2][1]);
        stub.reset();
        done();
      });
      app.destroy();
    });
  });

  describe('_determineFileType', function() {
    before(function() {
      // This gets cleaned up by the parent after function.
      constructAppInstance();
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
    beforeEach(function() {
      constructAppInstance();
    });

    it('showDragNotification: is a function', function() {
      assert.isFunction(app.showDragNotification);
    });

    it('hideDragNotification: removes masks and detaches events', function() {
      var removeStub = testUtils.makeStubFunction();
      var detachStub = testUtils.makeStubFunction();
      app.dragNotifications = [{
        mask: {
          remove: removeStub
        },
        handlers: [{ detach: detachStub }]
      }];
      app.hideDragNotifications();
      assert.equal(removeStub.calledOnce(), true, 'removeStub not called once');
      assert.equal(removeStub.lastArguments()[0], true);
      assert.equal(detachStub.calledOnce(), true);
    });
  });

  it('dispatches drag events properly: _appDragOverHanlder', function() {
    var determineFileTypeStub, showNotificationStub, dragTimerControlStub;

    constructAppInstance();

    determineFileTypeStub = testUtils.makeStubMethod(
        app, '_determineFileType', 'zip');
    showNotificationStub = testUtils.makeStubMethod(
        app, 'showDragNotification');
    dragTimerControlStub = testUtils.makeStubMethod(
        app, '_dragleaveTimerControl');

    var noop = function() {};
    var ev1 = { dataTransfer: 'foo', preventDefault: noop, type: 'dragenter' };
    var ev2 = { dataTransfer: {}, preventDefault: noop, type: 'dragleave' };
    var ev3 = { dataTransfer: {}, preventDefault: noop, type: 'dragover' };

    app._appDragOverHandler(ev1);
    app._appDragOverHandler(ev2);
    app._appDragOverHandler(ev3);

    assert.equal(determineFileTypeStub.callCount(), 3);
    assert.equal(showNotificationStub.calledOnce(), true);
    assert.equal(showNotificationStub.lastArguments()[0], 'zip');
    assert.equal(dragTimerControlStub.callCount(), 2);
    var args = dragTimerControlStub.allArguments();
    assert.equal(args[0][0], 'start');
    assert.equal(args[1][0], 'stop');

    determineFileTypeStub.reset();
    showNotificationStub.reset();
    dragTimerControlStub.reset();
  });

  it('can start and stop the drag timer: _dragLeaveTimerControl', function() {
    var laterStub, hideDragNotificationStub, dragCancelStub;
    constructAppInstance();

    var dragTimer = {};
    dragCancelStub = testUtils.makeStubMethod(dragTimer, 'cancel');

    laterStub = testUtils.makeStubMethod(Y, 'later', dragTimer);
    hideDragNotificationStub = testUtils.makeStubMethod(
        app, 'hideDragNotifications');

    app._dragleaveTimerControl('start');
    assert.equal(laterStub.calledOnce(), true);
    var args = laterStub.lastArguments();
    assert.equal(args[0], 100);
    assert.equal(args[1] instanceof Y.juju.App, true);
    assert.isFunction(args[2]);
    args[2].call(app); // Call the callback passed to later;
    // The callback should call this method
    assert.equal(hideDragNotificationStub.calledOnce(), true);
    // Calling with start again should cancel the timer and create a new one
    app._dragleaveTimerControl('start');
    assert.equal(dragCancelStub.calledOnce(), true);
    assert.equal(laterStub.callCount(), 2);
    // Calling with stop should cancel the timer
    app._dragleaveTimerControl('stop');
    assert.equal(dragCancelStub.callCount(), 2);

    laterStub.reset();
    hideDragNotificationStub.reset();
  });

});


(function() {

  describe('Application authentication', function() {
    var FAKE_VIEW_NAME, LOGIN_VIEW_NAME;
    var conn, container, destroyMe, ecs, env, juju, utils, Y;
    var requirements = [
      'juju-gui', 'juju-views', 'environment-change-set'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        utils = window.jujuTestUtils.utils;
        juju = Y.namespace('juju');
        FAKE_VIEW_NAME = 'FakeView';
        LOGIN_VIEW_NAME = 'LoginView';
        done();
      });
    });

    beforeEach(function(done) {
      container = utils.makeContainer(this, 'container');
      conn = new utils.SocketStub();
      ecs = new juju.EnvironmentChangeSet();
      env = new juju.environments.GoEnvironment({conn: conn, ecs: ecs});
      env.setCredentials({user: 'user', password: 'password'});
      destroyMe = [env, ecs];
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
      var popup = utils.makeStubMethod(
          Y.juju.App.prototype, 'popLoginRedirectPath', '/foo/bar');
      this._cleanups.push(popup.reset);
      var app = makeApp(true);
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
      var popup = utils.makeStubMethod(
          Y.juju.App.prototype, 'popLoginRedirectPath', '/foo/bar#baz');
      this._cleanups.push(popup.reset);
      var app = makeApp(true);
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

    it('retrieves the bundle deployments status on login', function() {
      var app = makeApp(true);
      app.onLogin({data: {result: true}});
      var expectedMessage = {
        RequestId: 2, // The first request is the login one.
        Type: 'Deployer',
        Request: 'Status',
        Params: {}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    // XXX This test causes intermittent cascading failures when run in CI.
    // When the notification system gets refactored this test can be un-skipped.
    it.skip('creates a notification if logged in with a token', function(done) {
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
      Y = YUI(GlobalConfig).use(['juju-gui'],
          function(Y) {
            container = Y.Node.create(
                '<div id="test" class="container"></div>');
            done();
          });
    });

    it('should be able to handle env connection status changes', function() {
      var juju = Y.namespace('juju'),
          conn = new window.jujuTestUtils.utils.SocketStub(),
          env = new juju.environments.GoEnvironment({
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
      Y = YUI(GlobalConfig).use(['juju-gui'], function(Y) {
        utils = window.jujuTestUtils.utils;
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
            consoleEnabled: true,
            user: 'admin',
            password: 'admin',
            jujuCoreVersion: '1.21.1.1-trusty-amd64',
            charmstorestore: new Y.juju.charmstore.APIv4({})
          });
      app.showView(new Y.View());
      // This simply walks through the hierarchy to show that all the
      // necessary parts are there.
      assert.isObject(app.env.get('conn').get('juju').get('state'));
    });

    it('passes a fake web handler to the environment', function() {
      app = new Y.juju.App({
        container: container,
        viewContainer: container,
        sandbox: true,
        jujuCoreVersion: '1.21.1.1-trusty-amd64',
        charmstore: new Y.juju.charmstore.APIv4({})
      });
      app.showView(new Y.View());
      var webHandler = app.env.get('webHandler');
      assert.strictEqual(webHandler.name, 'sandbox-web-handler');
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

    it('should honor socket_protocol and uuid', function() {
      app = new Y.juju.App(
          { container: container,
            viewContainer: container,
            socket_protocol: 'ws',
            jujuCoreVersion: '1.21.1.1-trusty-amd64',
            jujuEnvUUID: '1234-1234',
            conn: {close: function() {}} });
      app.showView(new Y.View());
      assert.equal(
          app.env.get('socket_url'),
          'ws://example.net:71070/ws/environment/1234-1234/api');
    });
  });

})();
