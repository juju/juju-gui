/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const StateChangeHandlers = require('./handlers');
const State = require('./state');

const jujulibTestHelper = require('@canonical/jujulib/api/test-helpers');
const AllWatcherResponse = require('@canonical/jujulib/tests/data/allwatcher-response');

function setupApp(options = {}) {
  return {
    activeModelUUID: options.activeModelUUID || null,
    applicationConfig: {
      apiAddress: 'api.test.com'
    },
    _deployTarget: jest.fn(),
    _handleUserEntity: jest.fn(),
    _renderApp: jest.fn(),
    _rootDispatcher: jest.fn(),
    checkUserCredentials: jest.fn()
  };
}

function setupStateInstance(options = {}) {
  const app = setupApp();
  const baseURL = '1.2.3.4:123';
  const sendAnalytics = sinon.stub();
  return StateChangeHandlers.setupState({
    app: options.app || app,
    baseURL: options.baseURL || baseURL,
    sendAnalytics: options.sendAnalytics || sendAnalytics,
    websocket: options.websocket
  });
}

describe('StateChangeHandlers', () => {
  describe('setupState', () => {
    it('can return a setup state instance', () => {
      const {state} = setupStateInstance();
      expect(state instanceof State).toBe(true);
      expect(state.baseURL).toBe('1.2.3.4:123/');
      expect(typeof state.sendAnalytics).toBe('function');
      expect(state._dispatchers).toMatchSnapshot();
    });
  });

  describe('_handleModelState', () => {
    let activeModelUUID = null;

    beforeEach(() => {
      activeModelUUID = 'abc123';
    });

    it('calls next and does nothing if already connected', () => {
      const {state, stateChangeHandlers} = setupStateInstance({
        app: setupApp({
          activeModelUUID
        })
      });
      stateChangeHandlers.modelConnectionStatus = 'ready';
      const next = jest.fn();
      const value = state._dispatchers.model[0][0]({
        model: {
          uuid: activeModelUUID
        }
      }, next);
      expect(next).toHaveBeenCalled();
      expect(value).toBe(undefined);
    });

    it('does nothing if the model is actively connecting', () => {
      const {state, stateChangeHandlers} = setupStateInstance({
        app: setupApp({
          activeModelUUID
        })
      });
      stateChangeHandlers.modelConnectionStatus = 'connecting';
      const next = jest.fn();
      const value = state._dispatchers.model[0][0]({
        model: {
          uuid: activeModelUUID
        }
      }, next);
      expect(next).toHaveBeenCalledTimes(0);
      expect(value).toBe(undefined);
    });

    it('calls jujulib connectAndLogin then setups watcher handler', done => {
      let ws = null;
      const {state, stateChangeHandlers} = setupStateInstance({
        websocket: jujulibTestHelper.makeWSClass(instance => {
          ws = instance;
        })
      });
      const next = jest.fn();
      expect(stateChangeHandlers.modelConnectionStatus).toBe(null);
      const jujuPromise = state._dispatchers.model[0][0]({
        model: {
          uuid: activeModelUUID
        }
      }, next);
      expect(next).toHaveBeenCalledTimes(0);
      expect(jujuPromise instanceof Promise).toBe(true);
      ws.queueResponses(new Map([
        [2, AllWatcherResponse.watchAll],
        [3, AllWatcherResponse.next]
      ]));
      ws.open();
      jujulibTestHelper.replyToLogin(ws, {
        facades: [{
          name: 'AllWatcher', versions: [1]
        }, {
          name: 'Client', versions: [1]
        }, {
          name: 'Pinger', versions: [1]
        }]
      });

      jujuPromise.then(() => {
        expect(typeof stateChangeHandlers.activeModelWatcherHandle.stop).toBe('function');
        expect(stateChangeHandlers.modelConnectionStatus).toBe('ready');
        done();
      });
    });
  });
});
