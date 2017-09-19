/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const keysim = require('keysim');
const utils = require('../test/utils');

describe('init', () => {
  let app, container, getMockStorage, JujuGUI;

  const createApp = config => {
    const defaults = {
      apiAddress: 'http://api.example.com/',
      controllerSocketTemplate: 'wss://$server:$port/api',
      socketTemplate: '/model/$uuid/api',
      socket_protocol: 'wss',
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
    app.destructor();
    container.remove();
  });

  it('activates the listeners for keyboard events', () => {
    const keyboard = keysim.Keyboard.US_ENGLISH;
    const keystroke = new keysim.Keystroke(keysim.Keystroke.SHIFT, 191);
    keyboard.dispatchEventsForKeystroke(keystroke, container);
    const shortcuts = document.getElementById('modal-shortcuts');
    assert.equal(shortcuts.children.length > 0, true,
      'The shortcuts component did not render');
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
