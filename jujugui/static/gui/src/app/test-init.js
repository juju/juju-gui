/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const keysim = require('keysim');
const utils = require('../test/utils');
const ReactDOM = require('react-dom');

describe('init', () => {
  let app, cleanups, container, getMockStorage, JujuGUI;

  const createApp = config => {
    const defaults = {
      apiAddress: 'http://api.example.com/',
      controllerSocketTemplate: 'wss://$server:$port/api',
      socketTemplate: '/model/$uuid/api',
      baseUrl: 'http://example.com/',
      charmstoreURL: 'http://1.2.3.4/',
      flags: {},
      gisf: false,
      plansURL: 'http://plans.example.com/',
      termsURL: 'http://terms.example.com/'
    };
    // Overwrite any default values with those provided.
    const initConfig = Object.assign(defaults, config);
    return new JujuGUI(initConfig);
  };

  beforeAll(done => {
    // The module list is copied from index.html.mako and is required by
    // init.js.
    YUI(GlobalConfig).use(MODULES, Y => {
      // init.js requires the window to contain the YUI object.
      window.yui = Y;
      // The gui version is required to be set by component-renderers-mixin.js.
      window.GUI_VERSION = {version: '1.2.3'};
      // The require needs to be after the yui modules have been loaded.
      JujuGUI = require('../app/init');
      done();
    });
  });

  beforeEach(() => {
    cleanups = [];
    container = utils.makeAppContainer();
    app = createApp();
    getMockStorage = function() {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store[name] = val; },
          getItem: function(name) { return this.store[name] || null; }
        };
      };
    };
  });

  afterEach(() => {
    cleanups.forEach(cleanup => cleanup());
    app.destructor();
    container.remove();
  });

  describe('Application basics', () => {
    it('should produce a valid index', () => {
      container.getAttribute('id').should.equal('test-container');
      container.getAttribute('class').should.include('container');
    });

    it('activates the listeners for keyboard events', () => {
      const keyboard = keysim.Keyboard.US_ENGLISH;
      const keystroke = new keysim.Keystroke(keysim.Keystroke.SHIFT, 191);
      keyboard.dispatchEventsForKeystroke(keystroke, container);
      const shortcuts = document.getElementById('modal-shortcuts');
      assert.equal(shortcuts.children.length > 0, true,
        'The shortcuts component did not render');
    });

    describe('MAAS support', () => {
      let maasNode;

      beforeEach(() => {
        // Set up the MAAS link node.
        maasNode = document.createElement('div');
        maasNode.setAttribute('id', 'maas-server');
        maasNode.classList.add('hidden');
        const link = document.createElement('a');
        const content = document.createTextNode('MAAS UI');
        link.appendChild(content);
        maasNode.appendChild(link);
        container.appendChild(maasNode);
      });

      afterEach(() => {
        container.querySelector('#maas-server').remove(true);
      });

      // Ensure the given MAAS node is shown and includes a link to the given
      // address.
      const assertMaasLinkExists = function(node, address) {
        assert.strictEqual(node.classList.contains('hidden'), false);
        assert.strictEqual(node.querySelector('a').href, address);
      };

      it('shows a link to the MAAS server if provider is MAAS', () => {
        // The MAAS node is initially hidden.
        assert.strictEqual(maasNode.classList.contains('hidden'), true);
        app.modelAPI.set('maasServer', 'http://1.2.3.4/MAAS');
        // Once the MAAS server becomes available, the node is activated and
        // includes a link to the server.
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
        // Further changes to the maasServer attribute don't change the link.
        app.modelAPI.set('maasServer', 'http://example.com/MAAS');
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
      });

      it('shows a link to the MAAS server if already in the env', () => {
        app.modelAPI.set('maasServer', 'http://1.2.3.4/MAAS');
        // The link to the MAAS server should be already activated.
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
        // Further changes to the maasServer attribute don't change the link.
        app.modelAPI.set('maasServer', 'http://example.com/MAAS');
        assertMaasLinkExists(maasNode, 'http://1.2.3.4/MAAS');
      });

      it('does not show the MAAS link if provider is not MAAS', () => {
        // The MAAS node is initially hidden.
        assert.strictEqual(maasNode.classList.contains('hidden'), true);
        app.modelAPI.set('maasServer', null);
        // The MAAS node is still hidden.
        assert.strictEqual(maasNode.classList.contains('hidden'), true);
        // Further changes to the maasServer attribute don't activate the link.
        app.modelAPI.set('maasServer', 'http://1.2.3.4/MAAS');
        assert.strictEqual(maasNode.classList.contains('hidden'), true);
      });

    });

    describe('_setupCharmstore', () => {
      it('is called on application instantiation', () => {
        assert.isNotNull(app.charmstore);
      });

      it('is idempotent', () => {
        // The charmstore attribute is undefined by default
        assert.equal(typeof app.charmstore, 'object');
        assert.equal(app.charmstore.url, 'http://1.2.3.4/v5');
        app._setupCharmstore(
          {charmstoreURL: 'it broke'}, window.jujulib.charmstore);
        assert.equal(
          app.charmstore.url,
          'http://1.2.3.4/v5',
          'It should only ever create a single instance of the charmstore');
      });
    });

    describe('romulus services', () => {
      it('sets up API clients', () => {
        assert.strictEqual(app.plans instanceof window.jujulib.plans, true);
        assert.strictEqual(app.plans.url, 'http://plans.example.com/v3');
        assert.strictEqual(app.terms instanceof window.jujulib.terms, true);
        assert.strictEqual(app.terms.url, 'http://terms.example.com/v1');
      });
    });
  });

  describe('File drag over notification system', () => {
    describe('drag event attach and detach', () => {
      it('binds the drag handlers', () => {
        app.destructor();
        const stub = sinon.stub(document, 'addEventListener');
        cleanups.push(stub.restore);
        app = createApp();
        assert.equal(stub.callCount >= 3, true);
        const args = stub.args;
        assert.equal(args[8][0], 'dragenter');
        assert.isFunction(args[0][1]);
        assert.equal(args[9][0], 'dragover');
        assert.isFunction(args[1][1]);
        assert.equal(args[10][0], 'dragleave');
        assert.isFunction(args[2][1]);
      });

      it('removes the drag handlers', () => {
        // This test causes cascading failures as the event listeners are not
        // removed as the method is stubbed out, so stub out addEventListener
        // as well so we don't need to clean them up.
        app.destructor();
        const addStub = sinon.stub(document, 'addEventListener');
        const stub = sinon.stub(document, 'removeEventListener');
        cleanups.push(addStub.restore);
        cleanups.push(stub.restore);
        const newApp = createApp();
        newApp.destructor();
        assert.equal(stub.callCount >= 3, true);
        const args = stub.args;
        assert.equal(args[51][0], 'dragenter');
        assert.isFunction(args[0][1]);
        assert.equal(args[52][0], 'dragover');
        assert.isFunction(args[1][1]);
        assert.equal(args[53][0], 'dragleave');
        assert.isFunction(args[2][1]);
      });
    });

    describe('_determineFileType', () => {
      it('returns false if it\'s not a file being dragged', () => {
        const result = app._determineFileType({
          types: ['foo']
        });
        // It should have returned false if it's not a file because then it is
        // something being dragged inside the browser.
        assert.equal(result, false);
      });

      it('returns "zip" for zip files', () => {
        const result = app._determineFileType({
          types: ['Files'],
          items: [{ type: 'application/zip' }]
        });
        assert.equal(result, 'zip');
      });

      it('returns "zip" for zip files in IE', () => {
        // IE uses a different mime type than other browsers.
        const result = app._determineFileType({
          types: ['Files'],
          items: [{ type: 'application/x-zip-compressed' }]
        });
        assert.equal(result, 'zip');
      });

      it('returns "yaml" for the yaml mime type', () => {
        // At the moment we cannot determine between folders and yaml files
        // across browser so we respond with yaml for now.
        const result = app._determineFileType({
          types: ['Files'],
          items: [{ type: 'application/x-yaml' }]
        });
        assert.equal(result, 'yaml');
      });

      it('returns "" if the browser does not support "items"', () => {
        // IE10 and 11 do not have the dataTransfer.items property during hover
        // so we cannot tell what type of file is being hovered over the canvas.
        // So we will just return the default which is "yaml".
        const result = app._determineFileType({
          types: ['Files']
        });
        assert.equal(result, '');
      });
    });

    describe('UI notifications', () => {
      it('_renderDragOverNotification renders drop UI', () => {
        const fade = sinon.stub();
        const reactdom = sinon.stub(ReactDOM, 'render');
        cleanups.push(reactdom.restore);
        app.topology.fadeHelpIndicator = fade;
        app._renderDragOverNotification();
        assert.equal(fade.callCount, 1);
        assert.equal(fade.lastCall.args[0], true);
        assert.equal(reactdom.callCount, 1);
      });

      it('_hideDragOverNotification hides drop UI', () => {
        const fade = sinon.stub();
        const reactdom = sinon.stub(
          ReactDOM, 'unmountComponentAtNode');
        cleanups.push(reactdom.restore);
        app.topology.fadeHelpIndicator = fade;
        app._hideDragOverNotification();
        assert.equal(fade.callCount, 1);
        assert.equal(fade.lastCall.args[0], false);
        assert.equal(reactdom.callCount, 1);
      });
    });

    it('dispatches drag events properly: _appDragOverHandler', () => {
      const determineFileTypeStub = sinon.stub(
        app, '_determineFileType').returns('zip');
      const renderDragOverStub = sinon.stub(
        app, '_renderDragOverNotification');
      const dragTimerControlStub = sinon.stub(
        app, '_dragleaveTimerControl');
      cleanups = cleanups.concat([
        determineFileTypeStub.restore,
        renderDragOverStub.restore,
        dragTimerControlStub
      ]);

      const noop = () => {};
      const ev1 = {
        dataTransfer: 'foo', preventDefault: noop, type: 'dragenter' };
      const ev2 = { dataTransfer: {}, preventDefault: noop, type: 'dragleave' };
      const ev3 = { dataTransfer: {}, preventDefault: noop, type: 'dragover' };

      app._appDragOverHandler(ev1);
      app._appDragOverHandler(ev2);
      app._appDragOverHandler(ev3);

      assert.equal(determineFileTypeStub.callCount, 3);
      assert.equal(renderDragOverStub.calledOnce, true);
      assert.equal(dragTimerControlStub.callCount, 3);
      const args = dragTimerControlStub.args;
      assert.equal(args[0][0], 'start');
      assert.equal(args[1][0], 'start');
      assert.equal(args[2][0], 'stop');
    });

    it('can start and stop the drag timer: _dragLeaveTimerControl', () => {
      app._dragleaveTimerControl('start');
      assert.equal(app._dragLeaveTimer !== undefined, true);
      app._dragleaveTimerControl('stop');
      assert.equal(app._dragLeaveTimer === null, true);
    });
  });

  describe('Application authentication', () => {
    let conn;

    beforeEach(() => {
      conn = new utils.SocketStub();
      app.destructor();
      const userClass = new window.jujugui.User(
        {sessionStorage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      app = createApp({
        conn: conn,
        user: userClass
      });
    });

    afterEach(() => {
      conn = null;
    });

    // Ensure the given message is a login request.
    const assertIsLogin = function(message) {
      assert.equal(message.type, 'Admin');
      assert.equal(message.request, 'Login');
    };

    it('avoids trying to login if the env is not connected', () => {
      assert.equal(0, conn.messages.length);
    });

    it('tries to login if the env connection is established', () => {
      app.modelAPI.connect();
      assert.equal(1, conn.messages.length);
      assertIsLogin(conn.last_message());
    });

    it('avoids trying to login without credentials', () => {
      app.modelAPI.get('user').controller = null;
      app.navigate = () => { return; };
      assert.deepEqual(
        app.user.controller, {user: '', password: '', macaroons: null});
      assert.equal(conn.messages.length, 0);
    });

    it('tries to log in on first connection', () => {
      // This is the case when credential are stashed.
      app.modelAPI.connect();
      assert.equal(1, conn.messages.length);
      assertIsLogin(conn.last_message());
    });

    it('tries to re-login on disconnections', () => {
      // This is the case when credential are stashed.
      app.modelAPI.connect();
      // Disconnect and reconnect the WebSocket.
      conn.transient_close();
      conn.open();
      assert.equal(1, conn.messages.length, 'no login messages sent');
      assertIsLogin(conn.last_message());
    });

    it('tries to re-login with macaroons on disconnections', () => {
      app.modelAPI.setAttrs({jujuCoreVersion: '2.0.0'});
      app.modelAPI.get('user').controller = ({macaroons: ['macaroon']});
      app.modelAPI.connect();
      // Disconnect and reconnect the WebSocket.
      conn.transient_close();
      conn.open();
      // Equals 2 because it hasn't been reset since the first connection
      // This is a direct result of getting the notification to allow popups
      // click a link to login working which essentially allows multiple login
      // attempts without waiting for a timeout. 02/05/2017 Luke
      assert.equal(2, conn.messages.length, 'no login messages sent');
      const msg = conn.last_message();
      assert.strictEqual(msg.type, 'Admin');
      assert.strictEqual(msg.request, 'Login');
      assert.deepEqual(msg.params, {macaroons: [['macaroon']]});
    });

    it('should allow closing the connection', done => {
      app.modelAPI.connect();
      app.modelAPI.close(() => {
        assert.strictEqual(app.modelAPI.userIsAuthenticated, false);
        let creds = app.modelAPI.get('user').sessionStorage.store.modelCredentials;
        creds = JSON.parse(creds);
        assert.deepEqual(creds, null);
        done();
      });
    });

    it('sends a post to storefront after controller connection in GISF', () => {
      app.destructor();
      app = createApp({conn: conn, gisf: true});
      sinon.stub(app, 'maskVisibility');
      sinon.stub(app, 'navigate');
      sinon.stub(app, 'dispatch');
      sinon.stub(app.state, 'changeState');
      sinon.stub(app, '_sendGISFPostBack');
      sinon.stub(app, '_ensureLoggedIntoCharmstore');
      document.dispatchEvent(new Event('login'));
      assert.equal(app._sendGISFPostBack.callCount, 1);
      assert.equal(app._ensureLoggedIntoCharmstore.callCount, 1);
    });
  });

  describe('Application Connection State', () => {
    it('should be able to handle env connection status changes', () => {
      const conn = new utils.SocketStub();
      const userClass = new window.jujugui.User(
        {sessionStorage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      app.destructor();
      app = createApp({
        conn: conn,
        user: userClass
      });
      app.db.reset = sinon.stub();
      app.modelAPI.login = sinon.stub();
      app.modelAPI.connect();
      conn.open();
      // We need to fake the connection event.
      assert.equal(app.db.reset.callCount, 0);
      assert.equal(app.modelAPI.login.calledOnce, true);

      // Trigger a second time and verify.
      conn.transient_close();
      conn.open();
      assert.equal(app.db.reset.callCount, 0);
    });


    describe('logout', () => {
      it('logs out from API connections and then reconnects', () => {
        let controllerClosed = false;
        let modelClosed = false;
        let controllerConnected = false;
        let modelConnected = false;
        app.db.reset = sinon.stub();
        app.db.fireEvent = sinon.stub();
        const ecs = {
          clear: sinon.stub()
        };
        // Mock the API connections for the resulting application.
        app.controllerAPI.destroy();
        app.controllerAPI = {
          close: callback => {
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
          },
          destroy: sinon.stub()
        };
        app.modelAPI.destroy();
        app.modelAPI = {
          close: callback => {
            modelClosed = true;
            callback();
          },
          connect: () => {
            assert.strictEqual(
              modelClosed, true, 'model: connect called before close');
            modelConnected = true;
          },
          destroy: sinon.stub(),
          get: sinon.stub().returns(ecs)
        };
        app.state.changeState = sinon.stub();
        // Log out from the app.
        app._handleLogout();
        // The API connections have been properly closed.
        assert.strictEqual(controllerClosed, true, 'controller close');
        assert.strictEqual(modelClosed, true, 'model closed');
        assert.strictEqual(controllerConnected, true, 'controller connect');
        assert.strictEqual(modelConnected, false, 'model connect');
        // The database has been reset and updated.
        assert.strictEqual(app.db.reset.calledOnce, true, 'db.reset');
        assert.strictEqual(app.db.fireEvent.calledOnce, true, 'db.fireEvent');
        assert.strictEqual(app.db.fireEvent.lastCall.args[0], 'update');
        assert.strictEqual(ecs.clear.calledOnce, true, 'ecs.clear');
        assert.equal(app.state.changeState.callCount, 1);
        assert.deepEqual(app.state.changeState.args[0], [{
          model: null,
          profile: null,
          root: null,
          store: null
        }]);
      });

      it('clears the db changed timer when the app is destroyed', () => {
        app._dbChangedTimer = 'I am the timer!';
        // Mock the clearTimeout builtin function.
        const original = clearTimeout;
        clearTimeout = sinon.stub();
        cleanups.push(() => {
          clearTimeout = original;
        });
        // Destroy the application.
        app.destructor();
        // The timer has been canceled.
        assert.strictEqual(clearTimeout.calledOnce, true, 'clear call');
        assert.strictEqual(clearTimeout.lastCall.args[0], 'I am the timer!');
      });
    });
  });

  describe('switchEnv', () => {
    let ecs;

    beforeEach(() => {
      ecs = app.modelAPI.get('ecs');
      ecs.clear = sinon.stub();
      app.modelAPI.close = sinon.stub();
      app.db.reset = sinon.stub();
      app.db.fireEvent = sinon.stub();
    });

    it('can connect to an env even if not currently connected', () => {
      app.switchEnv('wss://example.com/ws', 'user', 'password');
      assert.isTrue(ecs.clear.called, 'ecs was not cleared.');
      assert.isTrue(app.modelAPI.close.called, 'env was not closed.');
      assert.isTrue(app.db.reset.called, 'db was not reset.');
      assert.equal(app.db.fireEvent.args[0][0], 'update', 'db was not updated.');
      const topo = app.topology.topo;
      assert.isTrue(topo.modules.ServiceModule.centerOnLoad,
        'canvas centering was not reset.');
    });

    it('clears and resets the env, db, and ecs on change', () => {
      app.switchEnv('wss://example.com/ws', 'user', 'password');
      assert.isTrue(ecs.clear.called, 'ecs was not cleared.');
      assert.isTrue(app.modelAPI.close.called, 'env was not closed.');
      assert.isTrue(app.db.reset.called, 'db was not reset.');
      assert.equal(app.db.fireEvent.args[0][0], 'update', 'db was not updated.');
      const topo = app.topology.topo;
      assert.isTrue(topo.modules.ServiceModule.centerOnLoad,
        'canvas centering was not reset.');
    });

    it('can not clear and reset the db, and ecs on change', () => {
      app.switchEnv('wss://example.com/ws', 'user', 'password', null, true, false);
      assert.isFalse(ecs.clear.called, 'ecs was not cleared.');
      assert.isTrue(app.modelAPI.close.called, 'env was not closed.');
      assert.isFalse(app.db.reset.called, 'db was not reset.');
      assert.isFalse(app.db.fireEvent.called);
    });

    it('skips the reconnect when necessary', () => {
      const connect = sinon.stub(app.modelAPI, 'connect');
      cleanups.push(connect.restore);
      // Try calling switchEnv both with explicit false and with socketUrl not
      // set (implicit).
      app.switchEnv('', '', '', false);
      app.switchEnv();
      assert.equal(connect.callCount, 0);
    });
  });

  describe('getUser', () => {
    it('gets the set user for the supplied service', () => {
      const charmstoreUser = {
        name: 'foo'
      };
      app.users = {
        'charmstore': charmstoreUser
      };
      assert.deepEqual(app.getUser('charmstore'), charmstoreUser);
    });
  });

  describe('clearUser', () => {
    it('clears the set user for the supplied service', () => {
      const charmstoreUser = {
        name: 'foo'
      };
      app.users = {
        'charmstore': charmstoreUser
      };
      app.clearUser('charmstore');
      assert.equal(app.users.charmstore, undefined);
    });
  });

  describe('storeUser', () => {
    beforeEach(() => {
      app.charmstore.whoami = sinon.stub();
    });

    it('calls charmstore whoami for charmstore users', () => {
      const user = {user: 'test'};
      app.storeUser('charmstore');
      assert.equal(app.charmstore.whoami.callCount, 1);
      const cb = app.charmstore.whoami.lastCall.args[0];
      cb(null, user);
      const users = app.users;
      assert.deepEqual(users['charmstore'], user);
    });

    it('renders the profile and breadcrumb if told to', () => {
      const user = {user: 'test'};
      const state = {test: 'state'};
      app.state._appStateHistory.push(state);
      app._renderBreadcrumb = sinon.stub();
      app._renderUserProfile = sinon.stub();
      app.storeUser('charmstore', true, true);
      assert.equal(app.charmstore.whoami.callCount, 1);
      app.charmstore.whoami.lastCall.args[0](null, user);
      assert.equal(app._renderBreadcrumb.callCount, 1);
      assert.equal(app._renderUserProfile.callCount, 1);
      assert.deepEqual(app.users['charmstore'], user);
    });
  });

  describe('loginToAPIs', () => {
    // Create and return a mock API connection.
    // The API is connected if connected is true.
    const makeAPIConnection = connected => {
      return {
        destroy: sinon.stub(),
        name: 'test-api',
        get: sinon.stub().withArgs('connected').returns(connected),
        login: sinon.stub(),
        loginWithMacaroon: sinon.stub()
      };
    };

    // Check whether the given API connection mock (see makeAPIConnection) is
    // authenticated, and if it is, check that the given credentials have been
    // set as an attribute of the connection object.
    const checkLoggedInWithCredentials = (api, loggedIn, credentials) => {
      if (credentials) {
        // Credentials have been set on the API.
        // Adding the macaroons to the credentials for comparison purposes.
        if (credentials.macaroons === undefined) {
          credentials.macaroons = null;
        }
        assert.deepEqual(app.user.controller, credentials);
      } else {
        // No credentials have been set.
        const expected = {
          user: '',
          password: '',
          macaroons: null
        };
        assert.deepEqual(app.user.controller, expected);
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
      const credentials = {user: 'user-who@local', password: 'passwd'};
      const useMacaroons = false;
      const controller = makeAPIConnection(true);
      const model = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons, [controller, model]);
      checkLoggedInWithCredentials(controller, true, credentials);
      checkLoggedInWithCredentials(model, true, credentials);
    });

    it('logs into all default API backends', () => {
      const credentials = {user: 'user-who@local', password: 'passwd'};
      const useMacaroons = false;
      app.controllerAPI = makeAPIConnection(true);
      // Clean up the old env before assigning a new env.
      app.modelAPI.destroy();
      app.modelAPI = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons);
      checkLoggedInWithCredentials(app.controllerAPI, true, credentials);
      checkLoggedInWithCredentials(app.modelAPI, true, credentials);
    });

    it('only logs into APIs if they are connected', () => {
      const credentials = {user: 'user-who@local', password: 'passwd'};
      const useMacaroons = false;
      const controller = makeAPIConnection(true);
      const model = makeAPIConnection(false);
      app.loginToAPIs(credentials, useMacaroons, [controller, model]);
      checkLoggedInWithCredentials(controller, true, credentials);
      checkLoggedInWithCredentials(model, false, credentials);
    });

    it('sets credentials even if no API is connected', () => {
      const credentials = {user: 'user-who@local', password: 'passwd'};
      const useMacaroons = false;
      app.controllerAPI = makeAPIConnection(false);
      // Clean up the old env before assigning a new env.
      app.modelAPI.destroy();
      app.modelAPI = null;
      app.loginToAPIs(credentials, useMacaroons);
      checkLoggedInWithCredentials(app.controllerAPI, false, credentials);
    });

    it('does not set credentials if they are not provided', () => {
      app.user.controller = null;
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
      // Clean up the old env before assigning a new env.
      app.modelAPI.destroy();
      app.modelAPI = makeAPIConnection(true);
      app.loginToAPIs(credentials, useMacaroons);
      checkLoggedInWithMacaroons(app.controllerAPI, true);
      checkLoggedInWithMacaroons(app.modelAPI, true);
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

  describe('_ensureControllerConnection', () => {
    it('connects to the controller if it needs to', () => {
      app.controllerAPI.connect = sinon.stub();
      app.controllerAPI.set('connecting', false);
      app.controllerAPI.set('connected', false);
      app._ensureControllerConnection({root: 'store'}, sinon.stub());
      assert.strictEqual(app.controllerAPI.connect.callCount, 1, 'controller');
    });

    it('does not connect to the controller if it is already connected', () => {
      app._displayLogin = sinon.stub();
      app.controllerAPI.connect = sinon.stub();
      app.controllerAPI.set('connecting', false);
      // setting connected to true will trigger login, so stub that out.
      app.controllerAPI.login = sinon.stub();
      app.controllerAPI.set('connected', true);
      app._ensureControllerConnection({root: 'store'}, sinon.stub());
      assert.strictEqual(
        app.controllerAPI.connect.callCount, 0, 'controller');
    });

    it('does not connect to the controller if it is already connecting', () => {
      app.controllerAPI.connect = sinon.stub();
      app.controllerAPI.set('connecting', true);
      app.controllerAPI.set('connected', false);
      app._ensureControllerConnection({root: 'store'}, sinon.stub());
      assert.strictEqual(app.controllerAPI.connect.callCount, 0, 'controller');
    });
  });

  describe('checkUserCredentials', () => {
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

    it('does not display login if one of the apis is still connecting', () => {
      app.controllerAPI.set('connecting', true);
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 0);
    });

    it('does not login if all apis are not connected', () => {
      app.controllerAPI.set('connected', false);
      app.modelAPI.set('connected', false);
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 0);
    });

    it('displays login if one of the apis is not authenticated', () => {
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.controllerAPI.set('connected', true);
      app.controllerAPI.userIsAuthenticated = false;
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 2);
    });

    it('displays login if one of the apis is not authd and not gisf', () => {
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.controllerAPI.set('connected', true);
      app.controllerAPI.userIsAuthenticated = false;
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 2);
    });

    it('does not login if all apis are authenticated', () => {
      app.controllerAPI.userIsAuthenticated = true;
      app.modelAPI.userIsAuthenticated = true;
      const next = sinon.stub();
      const displayStub = sinon.stub(app, '_displayLogin');
      app.checkUserCredentials({}, next);
      assert.equal(displayStub.callCount, 0);
    });
  });

  describe('_disambiguateUserState', function() {
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

  describe('_controllerIsReady', () => {
    beforeEach(() => {
      app._displayLogin = sinon.stub();
    });

    it('reports true when the controller API is ready', () => {
      app.controllerAPI.set('connected', true);
      app.controllerAPI.userIsAuthenticated = true;
      assert.strictEqual(app._controllerIsReady(), true);
    });

    it('reports false when the controller API is not ready', () => {
      const controllerAPI = app.controllerAPI;
      controllerAPI.set('connected', false);
      controllerAPI.userIsAuthenticated = false;
      // Without a controller API object the controller is not ready.
      app.controllerAPI = null;
      assert.strictEqual(app._controllerIsReady(), false, 'no controller');
      // Before the API is connected the controller is not ready.
      app.controllerAPI = controllerAPI;
      assert.strictEqual(app._controllerIsReady(), false, 'not connected');
      // Before the API is properly logged in the controller is not ready.
      app.controllerAPI.set('connected', true);
      assert.strictEqual(app._controllerIsReady(), false, 'not authenticated');
    });
  });

  describe('_listAndSwitchModel', () => {
    let modelList;

    beforeEach(() => {
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
      app.controllerAPI.listModelsWithInfo = callback => {
        callback.call(app, null, modelList);
      };
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
        profile: ''
      }]);
    });

    it('switches to disconnected state if no model found via path', () => {
      app._listAndSwitchModel('bad/path', null);
      assert.equal(app.maskVisibility.callCount, 1);
      assert.deepEqual(app.maskVisibility.args[0], [false]);
      assert.equal(app.state.changeState.callCount, 1);
      assert.deepEqual(app.state.changeState.args[0], [{
        root: null, store: null, model: null, user: null,
        profile: ''
      }]);
    });
  });

  describe('_fetchEntityFromUserState', () => {
    it('returns a promise for an entity', done => {
      const legacyPath = sinon.stub().returns('~hatch/ghost');
      window.jujulib.URL.fromString = sinon.stub().returns({legacyPath});
      const charmstore = {
        getEntity: sinon.stub()
      };
      app.charmstore = charmstore;
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
      app.charmstore = charmstore;
      const entityPromise = app._fetchEntityFromUserState('hatch/ghost');
      assert.deepEqual(app._userPaths.get('hatch/ghost'), {
        promise: entityPromise
      });
    });

    it('returns a cached promise', () => {
      const legacyPath = sinon.stub().returns('~hatch/ghost');
      window.jujulib.URL.fromString = sinon.stub().returns({legacyPath});
      const charmstore = {
        getEntity: sinon.stub()
      };
      app.charmstore = charmstore;
      const response = {promise: 'its a promise'};
      app._userPaths.set('hatch/ghost', response);
      const entityPromise = app._fetchEntityFromUserState('hatch/ghost');
      // hacking the userPaths cache so that we can tell if it pulls from there.
      assert.deepEqual(entityPromise, response.promise);
    });
  });

  describe('_switchModelToUUID', () => {
    it('switches to the provided uuid', () => {
      app.switchEnv = sinon.stub();
      app._switchModelToUUID('my-uuid');
      assert.equal(app.modelUUID, 'my-uuid');
      assert.equal(app.switchEnv.callCount, 1);
      assert.equal(
        app.switchEnv.args[0][0].endsWith('/model/my-uuid/api'), true);
    });

    it('switches to disconnected if none provided', () => {
      app.switchEnv = sinon.stub();
      app.createSocketURL = sinon.stub();
      app._switchModelToUUID();
      assert.strictEqual(app.modelUUID, null);
      assert.equal(app.createSocketURL.callCount, 0);
      assert.equal(app.switchEnv.callCount, 1);
      assert.deepEqual(app.switchEnv.args[0], [undefined]);
    });
  });

  describe('anonymous mode', () => {
    let userClass;

    // Set up the mocks required for these tests.
    const setupApp = (config) => {
      // Clean up the old app.
      app.destructor();
      app = createApp(config);
      app._displayLogin = sinon.stub();
      app._renderLogin = sinon.stub();
      app._renderUserMenu = sinon.stub();
      app.maskVisibility = sinon.stub();
      app.loginToAPIs = sinon.stub();
    };

    beforeEach(() => {
      userClass = new window.jujugui.User(
        {sessionStorage: getMockStorage()});
      userClass.controller = {};
      setupApp();
    });

    // Report whether the application canvas is visible.
    const appIsVisible = () => {
      if (!app.maskVisibility.called) {
        return false;
      }
      const args = app.maskVisibility.args[0];
      return !args[0];
    };

    it('is disabled when the app is created', () => {
      assert.strictEqual(app.anonymousMode, false, 'anonymousMode');
    });

    it('is enabled when the controller connects in gisf mode', done => {
      setupApp({gisf: true, user: userClass});
      app.state = {current: {root: 'new'}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, true, 'anonymousMode');
        assert.strictEqual(appIsVisible(), true, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, false, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, false, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is disabled when the controller connects but not in gisf', done => {
      setupApp({gisf: false, user: userClass});
      app.state = {current: {root: 'new'}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, false, 'anonymousMode');
        assert.strictEqual(appIsVisible(), false, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, true, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, false, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is disabled when credentials are available', done => {
      setupApp({gisf: true, user: userClass});
      app.controllerAPI.get('user').controller = {macaroons: 'macaroons'};
      app.state = {current: {root: 'new'}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, false, 'anonymousMode');
        assert.strictEqual(appIsVisible(), false, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, false, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, true, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is disabled when not in /new', done => {
      setupApp({gisf: true, user: userClass});
      app.state = {current: {root: 'store'}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, false, 'anonymousMode');
        assert.strictEqual(appIsVisible(), false, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, true, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, false, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is disabled when in the homepage', done => {
      setupApp({gisf: true, user: userClass});
      app.state = {current: {root: null}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, false, 'anonymousMode');
        assert.strictEqual(appIsVisible(), false, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, true, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, false, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is kept enabled when previously enabled', done => {
      setupApp({gisf: true, user: userClass});
      app.anonymousMode = true;
      app.state = {current: {root: 'store'}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, true, 'anonymousMode');
        assert.strictEqual(appIsVisible(), true, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, false, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, false, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is kept enabled when previously enabled and in homepage', done => {
      setupApp({gisf: true, user: userClass});
      app.anonymousMode = true;
      app.state = {current: {root: null}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, true, 'anonymousMode');
        assert.strictEqual(appIsVisible(), true, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, false, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, false, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is ignored when enabled but navigating to the login page', done => {
      setupApp({gisf: true, user: userClass});
      app.anonymousMode = true;
      app.state = {current: {root: 'login'}, changeState: () => {}};
      app.controllerAPI.after('connectedChange', evt => {
        assert.strictEqual(app.anonymousMode, true, 'anonymousMode');
        assert.strictEqual(appIsVisible(), false, 'appIsVisible');
        assert.strictEqual(app._displayLogin.called, true, '_displayLogin');
        assert.strictEqual(app.loginToAPIs.called, false, 'loginToAPIs');
        done();
      });
      app.controllerAPI.set('connected', true);
    });

    it('is disabled after successful login', done => {
      const listener = evt => {
        document.removeEventListener('login', listener);
        assert.strictEqual(app.anonymousMode, false, 'anonymousMode');
        assert.strictEqual(
          app._renderUserMenu.called, true, '_renderUserMenu');
        assert.equal(app.state.changeState.called, true, 'changeState');
        const args = app.state.changeState.args[0];
        assert.equal(args.length, 1, 'changeState num args');
        assert.deepEqual(args[0], {root: null}, 'changeState args');
        done();
      };
      app.controllerAPI.after('connectedChange', evt => {
        document.addEventListener('login', listener);
        app.anonymousMode = true;
        app.state = {current: {root: 'login'}, changeState: sinon.stub()};
        document.dispatchEvent(new CustomEvent('login', {
          detail: {err: null}
        }));
      });
      app.controllerAPI.set('connected', true);
    });

    it('is disabled after failed login', done => {
      app.anonymousMode = true;
      app.state = {current: {root: null}};
      const listener = evt => {
        assert.strictEqual(app.anonymousMode, false, 'anonymousMode');
        assert.strictEqual(app._renderLogin.called, true, '_renderLogin');
        document.removeEventListener('login', listener);
        done();
      };
      document.addEventListener('login', listener);
      document.dispatchEvent(new CustomEvent('login', {
        detail: {err: 'bad wolf'}
      }));
    });
  });

  describe('setPageTitle', () => {
    it('can set the page title', () => {
      document.title = 'Test';
      app.setPageTitle('Testing');
      assert.equal(document.title, 'Testing - Juju GUI');
    });

    it('can set the default page title', () => {
      document.title = 'Test';
      app.defaultPageTitle = 'Juju GUI';
      app.setPageTitle();
      assert.equal(document.title, 'Juju GUI');
    });
  });
});
