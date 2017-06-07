/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const mixwith = require('mixwith');

const hotkeys = require('./init/hotkeys');
const csUser = require('./init/charmstore-user');
const ComponentRenderersMixin = require('./init/component-renderers');

const yui = window.yui;

class GUIApp {
  constructor(config) {
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
    Creates a new instance of the environment change set.
    @return {Object} environment change set instance. This method is idempotent.
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
