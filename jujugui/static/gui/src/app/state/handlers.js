/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const State = require('./state');
const {urls} = require('jaaslib');
const jujulib = require('@canonical/jujulib');

/**
  A list of require statements for the required jujulib model facades.
  @type {Array}
*/
const _defaultModelFacades = [
  // Sort facades alphabetically.
  require('@canonical/jujulib/api/facades/application-v6.js'),
  require('@canonical/jujulib/api/facades/all-watcher-v1.js'),
  require('@canonical/jujulib/api/facades/charms-v2.js'),
  require('@canonical/jujulib/api/facades/client-v1.js'),
  require('@canonical/jujulib/api/facades/pinger-v1.js')
];

/**
  A class which provides all of the handlers for the various state values.
  @class
*/
class StateChangeHandlers {
  constructor(config) {
    this.app = config.app;
    /**
      The websocket instance to use for the jujulib queries. Defaults to WebSocket.
      @type {Object}
    */
    this._WebSocket = WebSocket;
    /**
      Stores the status of the model connection so we can intellegently
      determine what to do with the modelConnection. This is required even
      though the connection is asynchronous because we want to block dispatching
      the application until the model connection is completely ready and
      native promises do not allow external inspection on its status.

      Use the public property `modelConnectionStatus` to take advantage of the
      setter with validation.

      Allowed values are:
        null
        'ready'
        'connecting'
      @type {String}
    */
    this._modelConnectionStatus = null;
    /**
      Stores the handler to the active models watcher handle so that it can be
      stopped when switching or disconnecting models.
      @type {Object}
    */
    this.activeModelWatcherHandle = null;
  }

  /**
    Creates a new instance of the State and registers the necessary dispatchers.
    app method is idempotent.
    @static
    @param {Object} config - The configuration options for the new state instance.
      requires the following values:
    @param {Object} config.app - Reference to the application instance.
    @param {String} config.baseURL - The base URL of the application. Used for
      parsing the URL to generate valid state values.
    @param {Function} config.sendAnalytics - A function called on state changes.
    @param {Object} config.websocket - A custom WebSocket implementation. defaults
      to the native WebSocket instance.
    @return {Object} The state instance.
  */

  static setupState(config) {
    const state = new State({
      baseURL: config.baseURL,
      seriesList: urls.SERIES,
      sendAnalytics: config.sendAnalytics
    });

    const app = config.app;

    const handlers = new StateChangeHandlers({app});

    handlers._WebSocket = config.websocket;

    state.register([
      ['*', app._renderApp.bind(app)],
      ['*', app.checkUserCredentials.bind(app)],
      ['root',
        app._rootDispatcher.bind(app)],
      ['user',
        app._handleUserEntity.bind(app)],
      ['model',
        handlers._handleModelState.bind(handlers)],
      ['special.deployTarget', app._deployTarget.bind(app)],
      // The follow states are handled by app.js and do not need to do anything
      // special. These are only here to suppress warnings about dispatchers not found.
      ['profile'],
      ['store'],
      ['search'],
      ['help'],
      ['gui'],
      ['postDeploymentPanel'],
      ['terminal'],
      ['hash'],
      ['special.dd']
    ]);
    return {state, stateChangeHandlers: handlers};
  }

  set modelConnectionStatus(value) {
    const validValues = [null, 'ready', 'connecting'];
    if (!validValues.includes(value)) {
      throw `Invalid value "${value}" set to modelConnectionStatus, \
valid values are [${validValues.map(i => String(i)).join(', ')}]`;
    }
    this._modelConnectionStatus = value;
  }

  get modelConnectionStatus() {
    return this._modelConnectionStatus;
  }

  /**
    Handles the state changes for the model key.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _handleModelState(state, next) {
    const newModelUUID = state.model.uuid;
    if (this.app.activeModelUUID === newModelUUID) {
      if (this.modelConnectionStatus === 'ready') {
        next();
        return;
      } else if (this.modelConnectionStatus === 'connecting') {
        // If we get in here it's because the application has dispatched multiple
        // times but we do not want to connect multiple times.
        return;
      }
    }

    const modelURL = jujulib.generateModelURL(
      this.app.applicationConfig.apiAddress, newModelUUID);

    const connectionOptions = {
      debug: true,
      facades: _defaultModelFacades,
      wsclass: this._WebSocket || WebSocket,
      bakery: this.app.bakery
    };

    this.app.activeModelUUID = newModelUUID;
    this.modelConnectionStatus = 'connecting';

    return jujulib
      .connectAndLogin(modelURL, {}, connectionOptions)
      .then(juju => {
        this.app.modelConnection = juju.conn;
        const facades = juju.conn.facades;
        // Setup pinger, if it's not running then the model will
        // automatically disconnect after 1 minute.
        facades.pinger.pingForever(30000);

        return new Promise((resolve, reject) => {
          this.activeModelWatcherHandle = facades.client.watch((err, result) => {
            if (err) {
              console.log('cannot watch model:', err);
              reject();
            }
            this._processDeltas(result);
            this.modelConnectionStatus = 'ready';
            resolve();
            next();
          });
        });
      });
  }

  /**
    Process the deltas that are returned from the megawatcher. This code
    was moved over from the old model api handler and can be improved once we
    remove the YUI db and replace it with maraca.
    @param {Object} result The data result from the watch jujulib calls.
  */
  _processDeltas(result) {
    const deltas = [];
    const cmp = {
      applicationInfo: 1,
      relationInfo: 2,
      unitInfo: 3,
      machineInfo: 4,
      annotationInfo: 5,
      remoteapplicationInfo: 100
    };
    result.deltas.forEach(delta => {
      const [kind, operation, entityInfo] = delta;
      deltas.push([kind + 'Info', operation, entityInfo]);
    });
    deltas.sort((a, b) => {
      // Sort items that are not not in our hierarchy last.
      if (!cmp[a[0]]) {
        return 1;
      }
      if (!cmp[b[0]]) {
        return -1;
      }
      let scoreA = cmp[a[0]];
      let scoreB = cmp[b[0]];
      // Reverse the sort order for removes.
      if (a[1] === 'remove') { scoreA = -scoreA; }
      if (b[1] === 'remove') { scoreB = -scoreB; }
      return scoreA - scoreB;
    });
    document.dispatchEvent(new CustomEvent('delta', {
      detail: {data: {result: deltas}}
    }));
  }

};

module.exports = StateChangeHandlers;
