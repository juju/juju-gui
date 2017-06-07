// /* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const mixwith = require('mixwith');

const hotkeys = require('./init/hotkeys');
const csUser = require('./init/charmstore-user');
const ComponentRenderersMixin = require('./init/component-renderers');

const yui = window.yui;

class GUIApp {
  constructor(config) {
    /**
      The default web page title.
      @type {String}
    */
    this.defaultPageTitle = 'Juju GUI';
    /**
      The keydown event listener from the hotkey activation.
      @type {Object}
    */
    this._hotkeyListener = hotkeys.activate(this);
    /**
      Stores the custom event handlers for the application.
      @type {Object}
    */
    this._domEventHandlers = {};
    /**
      The application database
      @type {Object}
    */
    this.db = new yui.juju.models.Database();
    /**
      Application instance of the user class.
      @type {Object}
    */
    this.user = config.user || new window.jujugui.User({
      externalAuth: config.auth,
      expiration: window.sessionStorage.getItem('expirationDatetime')
    });

    /**
      Stores the user object for the charmstore.
      @type {Object}
    */
    this.users = csUser.create();

    const webHandler = new yui.juju.environments.web.WebHandler();
    const stateGetter = () => this.state.current;
    const cookieSetter = (value, callback) => {
      this.charmstore.setAuthCookie(value, callback);
    };
    /**
      Application instance of the bakery
      @type {Object}
    */
    this.bakery = yui.juju.bakeryutils.newBakery(
      config, this.user, stateGetter, cookieSetter, webHandler);
    /**
      The application instance of the charmstore.
      @type {Object}
    */
    this.charmstore = this._setupCharmstore(config, window.jujulib.charmstore);
    /**
      The application instance of the bundle service.
      @type {Object}
    */
    this.bundleService = this._setupBundleservice(
      config, window.jujulib.bundleservice);

    this.ecs = this._setupEnvironmentChangeSet();
    /**
      The application instance of the model controller.
      @type {Object}
    */
    this.modelController = new yui.juju.ModelController({
      db: this.db,
      charmstore: this.charmstore
    });

    const modelOptions = {
      user: this.user,
      ecs: this.ecs,
      conn: config.conn,
      jujuCoreVersion: config.jujuCoreVersion,
      bundleService: this.bundleService
    };
    const controllerOptions = Object.assign({}, modelOptions);
    const environments = yui.juju.environments;
    modelOptions.webHandler = new environments.web.WebHandler();
    /**
      Application instance of the model API.
      @type {Object}
    */
    this.modelAPI = new environments.GoEnvironment(modelOptions);
    /**
      Application instance of the controller API.
      @type {Object}
    */
    this.controllerAPI = new yui.juju.ControllerAPI(controllerOptions);
    /**
      Generated send analytics method. Must be setup before state is set up as
      it is used by state and relies on the controllerAPI instance.
    */
    this.sendAnalytics = yui.juju.sendAnalyticsFactory(
      this.controllerAPI,
      window.dataLayer);

    let baseURL = config.baseUrl;
    if (baseURL.indexOf('://') < 0) {
      // If there is no protocol in the baseURL then prefix the origin when
      // creating state.
      baseURL = `${window.location.origin}${baseURL}`;
    }
    /**
      Application instance of State.
      @type {Object}
    */
    this.state = this._setupState(baseURL);
  }
  /**
    Creates a new instance of the charm store API. This method is idempotent.
    @param {object} config The app instantiation configuration.
    @param {Object} Charmstore The Charmstore class.
    @return {Object} The existing or new instance of charmstore.
  */
  _setupCharmstore(config, Charmstore) {
    if (this.charmstore === undefined) {
      return new Charmstore(config.charmstoreURL, this.bakery);
      // Store away the charmstore auth info.
      if (this.bakery.storage.get(config.charmstoreURL)) {
        this.users['charmstore'] = {loading: true};
        this.storeUser('charmstore', false, true);
      }
    }
    return this.charmstore;
  }

  /**
    Creates a new instance of the bundleservice API. This method is idempotent.
    @param {object} config The app instantiation configuration.
    @param {Object} BundleService The bundleservice API class
    @return {Object} The existing or new instance of bundleservice.
  */
  _setupBundleservice(config, BundleService) {
    if (this.bundleService === undefined) {
      const bundleServiceURL = config && config.bundleServiceURL;
      if (!config || !bundleServiceURL) {
        console.error('no juju config for bundleserviceURL availble');
        return;
      }
      return new BundleService(
        bundleServiceURL,
        new yui.juju.environments.web.WebHandler());
    }
    return this.bundleService;
  }

  /**
    Creates a new instance of the environment change set. This method is
    idempotent.
    @return {Object} environment change set instance.
  */
  _setupEnvironmentChangeSet() {
    if (this.ecs === undefined) {
      this._domEventHandlers['renderDeploymentBarListener'] =
        this._renderDeploymentBar.bind(this);
      const listener = this._domEventHandlers['renderDeploymentBarListener'];
      document.addEventListener('ecs.changeSetModified', listener);
      document.addEventListener('ecs.currentCommitFinished', listener);
      return new yui.juju.EnvironmentChangeSet({db: this.db});
    }
    return this.ecs;
  }
  /**
    Creates a new instance of the State and registers the necessary dispatchers.
    This method is idempotent.
    @param {String} baseURL The path the application is served from.
    @return {Object} The state instance.
  */
  _setupState(baseURL) {
    if (this.state) {
      return this.state;
    }
    const state = new window.jujugui.State({
      baseURL: baseURL,
      seriesList: window.jujulib.SERIES,
      sendAnalytics: this.sendAnalytics
    });
    state.register([
      // ['*', this._ensureControllerConnection.bind(this)],
      // ['*', this.authorizeCookieUse.bind(this)],
      // ['*', this.checkUserCredentials.bind(this)],
      // ['*', this.show_environment.bind(this)],
      // ['root',
        // this._rootDispatcher.bind(this),
        // this._clearRoot.bind(this)],
      ['profile',
        this._renderUserProfile.bind(this),
        this._clearUserProfile.bind(this)],
      // ['user',
        // this._handleUserEntity.bind(this),
        // this._clearUserEntity.bind(this)],
      // ['model',
        // this._handleModelState.bind(this)],
      ['store',
        this._renderCharmbrowser.bind(this),
        this._clearCharmbrowser.bind(this)],
      ['search',
        this._renderCharmbrowser.bind(this),
        this._clearCharmbrowser.bind(this)],
      ['account',
        this._renderAccount.bind(this),
        this._clearAccount.bind(this)],
      // ['special.deployTarget', this._deployTarget.bind(this)],
      ['gui', null, this._clearAllGUIComponents.bind(this)],
      ['gui.machines',
        this._renderMachineView.bind(this),
        this._clearMachineView.bind(this)],
      ['gui.inspector',
        this._renderInspector.bind(this)
        // the this._clearInspector method is not called here because the
        // added services component is also rendered into the inspector so
        // calling it here causes React to throw an error.
      ],
      ['gui.deploy',
        this._renderDeployment.bind(this),
        this._clearDeployment.bind(this)],
      // Nothing needs to be done at the top level when the hash changes.
      ['hash']
    ]);
    return state;
  }

  /**
    Cleans up the instance of the application.
  */
  destructor() {
    this._hotkeyListener.detach();
    const ecsListener = this._domEventHandlers['renderDeploymentBarListener'];
    document.removeEventListener('ecs.changeSetModified', ecsListener);
    document.removeEventListener('ecs.currentCommitFinished', ecsListener);
  }
}

class JujuGUI extends mixwith.mix(GUIApp)
                             .with(
                               csUser.CharmstoreUserMixin,
                               ComponentRenderersMixin) {}

module.exports = JujuGUI;
//
