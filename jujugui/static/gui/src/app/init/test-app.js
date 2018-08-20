/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const App = require('./app');

describe('App', () => {
  let applicationConfig, appState, bundleImporter, charmstore, controllerAPI,
      db, modelAPI, topology;

  const renderComponent = (options = {}) => enzyme.shallow(
    <App
      acl={options.acl || {}}
      addToModel={options.addToModel || sinon.stub()}
      applicationConfig={options.applicationConfig || applicationConfig}
      appState={options.appState || appState}
      bakery={options.bakery || {}}
      bundleImporter={options.bundleImporter || bundleImporter}
      charmstore={options.charmstore || charmstore}
      controllerAPI={options.controllerAPI || controllerAPI}
      db={options.db || db}
      deployService={options.deployService || sinon.stub()}
      endpointsController={options.endpointsController || {}}
      getUser={options.getUser || sinon.stub()}
      getUserInfo={options.getUserInfo || sinon.stub()}
      gisf={options.gisf || {}}
      identity={options.identity || {}}
      loginToAPIs={options.loginToAPIs || sinon.stub()}
      maasServer={options.maasServer}
      modelAPI={options.modelAPI || modelAPI}
      modelUUID={options.modelUUID || 'abc123'}
      payment={options.payment || {}}
      plans={options.plans || {}}
      rates={options.rates || {}}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      setPageTitle={options.setPageTitle || sinon.stub()}
      stats={options.stats || {}}
      storeUser={options.storeUser || sinon.stub()}
      stripe={options.stripe || {}}
      switchModel={options.switchModel || sinon.stub()}
      terms={options.terms || {}}
      topology={options.topology || topology}
      user={options.user || {}} />
  );

  beforeEach(() => {
    applicationConfig = {
      flags: {},
      gisf: false
    };
    appState = {
      changeState: sinon.stub(),
      current: {},
      generatePath: sinon.stub()
    };
    bundleImporter = {
      importBundleFile: sinon.stub()
    };
    controllerAPI = {
      findFacadeVersion: sinon.stub(),
      destroyModels: sinon.stub(),
      get: sinon.stub().withArgs('connected').returns(true),
      listModelsWithInfo: sinon.stub(),
      loginWithMacaroon: sinon.stub()
    };
    charmstore = {
      getLogoutUrl: sinon.stub().returns('/logout')
    };
    db = {
      environment: {
        get: sinon.stub()
      },
      machines: {
        filterByParent: sinon.stub().returns([]),
        toArray: sinon.stub().returns([])
      },
      notifications: {
        add: sinon.stub(),
        toArray: sinon.stub().returns([])
      },
      services: {
        size: sinon.stub().returns(5),
        toArray: sinon.stub().returns([])
      }
    };
    const ecs = {
      getCurrentChangeSet: sinon.stub().returns({})
    };
    const modelAPIGet = sinon.stub();
    modelAPIGet.withArgs('ecs').returns(ecs);
    modelAPIGet.withArgs('modelOwner').returns('');
    modelAPIGet.withArgs('connected').returns(true);
    modelAPI = {
      get: modelAPIGet,
      set: sinon.stub()
    };
    topology = {
      fadeHelpIndicator: sinon.stub(),
      topo: {
        modules: {
          ServiceModule: {
            deselectNodes: sinon.stub(),
            hoverService: sinon.stub(),
            panToService: sinon.stub()
          },
          ViewportModule: {
            resized: sinon.stub()
          }
        }
      }
    };
  });

  describe('UI notifications', () => {
    it('renders drop UI', () => {
      const wrapper = renderComponent();
      assert.equal(wrapper.find('ExpandingProgress').length, 0);
      document.dispatchEvent(new CustomEvent('showDragOverNotification', {
        detail: true
      }));
      wrapper.update();
      assert.equal(topology.fadeHelpIndicator.callCount, 1);
      assert.strictEqual(topology.fadeHelpIndicator.args[0][0], true);
      assert.equal(wrapper.find('ExpandingProgress').length, 1);
    });

    it('hides drop UI', () => {
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      // Initially have the notification visible.
      instance._showDragOverNotification(true);
      wrapper.update();
      assert.equal(wrapper.find('ExpandingProgress').length, 1);
      document.dispatchEvent(new CustomEvent('showDragOverNotification', {
        detail: false
      }));
      wrapper.update();
      assert.equal(topology.fadeHelpIndicator.callCount, 2);
      assert.strictEqual(topology.fadeHelpIndicator.args[1][0], false);
      assert.equal(wrapper.find('ExpandingProgress').length, 0);
    });
  });

  describe('_controllerIsReady', () => {
    it('reports true when the controller API is ready', () => {
      controllerAPI.get = sinon.stub().withArgs('connected').returns(true);
      controllerAPI.userIsAuthenticated = true;
      const wrapper = renderComponent({ controllerAPI });
      const instance = wrapper.instance();
      assert.strictEqual(instance._controllerIsReady(), true);
    });

    it('reports false when the controller API is not ready', () => {
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      // Without a controller API object the controller is not ready.
      wrapper.setProps({ controllerAPI: null });
      assert.strictEqual(instance._controllerIsReady(), false, 'no controller');
      // Before the API is connected the controller is not ready.
      controllerAPI.get.withArgs('connected').returns(false);
      controllerAPI.userIsAuthenticated = false;
      wrapper.setProps({ controllerAPI });
      assert.strictEqual(instance._controllerIsReady(), false, 'not connected');
      // Before the API is properly logged in the controller is not ready.
      controllerAPI.get.withArgs('connected').returns(true);
      wrapper.setProps({ controllerAPI });
      assert.strictEqual(instance._controllerIsReady(), false, 'not authenticated');
    });
  });
});
