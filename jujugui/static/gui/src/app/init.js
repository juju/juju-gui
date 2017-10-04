/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const ReactDOM = require('react-dom');
const mixwith = require('mixwith');

const acl = require('./store/env/acl');
const analytics = require('./init/analytics');
const utils = require('./init/utils');
const jujulibConversionUtils = require('./init/jujulib-conversion-utils');
const viewUtils = require('./views/utils');
const hotkeys = require('./init/hotkeys');
const csUser = require('./init/charmstore-user');
const cookieUtil = require('./init/cookie-util');
const BundleImporter = require('./init/bundle-importer');
const EndpointsController = require('./init/endpoints-controller');
const WebHandler = require('./store/env/web-handler');

const newBakery = require('./init/utils/bakery-utils');
const EnvironmentView = require('./init/topology/environment');

const ComponentRenderersMixin = require('./init/component-renderers-mixin');
const DeployerMixin = require('./init/deployer-mixin');

// Hacks until all of the global references have been removed.
window.juju.utils.RelationUtils = require('./init/relation-utils');

const yui = window.yui;
window.models = yui.namespace('juju.models');

class GUIApp {
  constructor(config) {
    /**
      The supplied application configuration object on instantiation. Stored
      here to avoid having to pass it around.
      @type {Object}
    */
    this.applicationConfig = config;
    /**
      Holds the modelUUID the application should connect to. It's possible that
      this value and the value in the modelAPI instance will differ as another
      portion of the application has set this value prior to switching models.
      @type {String}
    */
    this.modelUUID = config.jujuEnvUUID || null;
    /**
      The default web page title.
      @type {String}
    */
    this.defaultPageTitle = 'Juju GUI';
    /**
      The object used for storing a mapping of previously visited user paths
      to the type of entity (model, store). e.g. /u/spinach/ghost would map to
      store.
      @type {Map}
    */
    this._userPaths = new Map();
    /**
      Track anonymous mode. This value will be set to true when anonymous
      navigation is allowed, in essence when a GISF anonymous user is being
      modeling on a new canvas.
      @type {Boolean}
    */
    this.anonymousMode = false;
    /**
      Stores the custom event handlers for the application.
      @type {Object}
    */
    this._domEventHandlers = {};
    /**
      Timer for the drag over handler.
      @type {Integer}
    */
    this._dragLeaveTimer = null;
    /**
      The keydown event listener from the hotkey activation.
      @type {Object}
    */
    this._hotkeyListener = hotkeys.activate(this);
    /**
      The application database.
      @type {Object}
    */
    this.db = new yui.juju.models.Database();
    /**
      Timer for debouncing database change events.
      @type {Integer}
    */
    this._dbChangedTimer = null;
    this._domEventHandlers['boundOnDatabaseChanged'] =
      this.onDatabaseChanged.bind(this);
    document.addEventListener(
      'update', this._domEventHandlers['boundOnDatabaseChanged']);
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

    const webHandler = new WebHandler();
    const stateGetter = () => this.state.current;
    const cookieSetter = (value, callback) => {
      this.charmstore.setAuthCookie(value, callback);
    };
    /**
      A bakery instance.
      Used to perform requests on a macaroon authenticated endpoints.
      @type {Object}
    */
    this.bakery = newBakery(
      config, this.user, stateGetter, cookieSetter, webHandler);
    /**
      A charm store API client instance.
      Used to retrieve information about charms and bundles via the charm store.
      @type {Object}
    */
    this.charmstore = this._setupCharmstore(config, window.jujulib.charmstore);
    /**
      A bundle service API client instance.
      Used to retrieve a list of actions to generate a bundle.
      @type {Object}
    */
    this.bundleService = this._setupBundleservice(
      config, window.jujulib.bundleservice);

    this.ecs = this._setupEnvironmentChangeSet();
    const modelOptions = {
      user: this.user,
      ecs: this.ecs,
      conn: config.conn,
      jujuCoreVersion: config.jujuCoreVersion,
      bundleService: this.bundleService
    };
    const controllerOptions = Object.assign({}, modelOptions);
    const environments = yui.juju.environments;
    modelOptions.webHandler = new WebHandler();
    /**
      An API connection to the Juju model.
      @type {Object}
    */
    this.modelAPI = new environments.GoEnvironment(modelOptions);
    // When the environment name becomes available, display it.
    this.modelAPI.after('environmentNameChange', this.onModelNameChange, this);
    this.modelAPI.after(
      'defaultSeriesChange', this.onDefaultSeriesChange, this);
    // When the connection resets, reset the db, re-login (a delta will
    // arrive with successful authentication), and redispatch.
    this.modelAPI.after('connectedChange', evt => {
      this._renderProviderLogo();
      if (!evt.newVal) {
        // The model is not connected, do nothing waiting for a reconnection.
        console.log('model disconnected');
        return;
      }
      console.log('model connected');
      this.modelAPI.userIsAuthenticated = false;
      // Attempt to log in if we already have credentials available.
      const credentials = this.user.model;
      if (credentials.areAvailable) {
        this.loginToAPIs(null, !!credentials.macaroons, [this.modelAPI]);
        return;
      }
    });
    /**
      The application instance of the model controller.
      @type {Object}
    */
    this.modelController = new yui.juju.ModelController({
      db: this.db,
      env: this.modelAPI,
      charmstore: this.charmstore
    });
    /**
      Application instance of the endpointsController.
      @type {Object}
    */
    this.endpointsController = new EndpointsController({
      db: this.db,
      modelController: this.modelController
    });
    this.endpointsController.bind();
    /**
      Application instance of the controller API.
      @type {Object}
    */
    this.controllerAPI = new yui.juju.ControllerAPI(controllerOptions);
    /**
      Generated send analytics method. Must be setup before state is set up as
      it is used by state and relies on the controllerAPI instance.
    */
    this.sendAnalytics = analytics.sendAnalyticsFactory(
      this.controllerAPI,
      window.dataLayer);

    let baseURL = config.baseUrl;
    if (baseURL.indexOf('://') < 0) {
      // If there is no protocol in the baseURL then prefix the origin when
      // creating state.
      baseURL = `${window.location.origin}${baseURL}`;
    }
    /**
      A state instance.
      Used to manage the whole application state and reflect changes in
      the URL path.
      @type {Object}
    */
    this.state = this._setupState(baseURL);

    this._setupControllerAPI();

    this._setupRomulusServices(config, window.jujulib);

    /**
      A statsd client that can be used to send metrics to be consumed by
      prometheus.
      @type {Object or null}
    */
    this.stats = null;
    if (config.statsURL) {
      this.stats = new window.jujugui.StatsClient(config.statsURL, 'gui');
    }

    /**
      Application instance of the bundle importer.
      @type {Object}
    */
    this.bundleImporter = new BundleImporter({
      db: this.db,
      modelAPI: this.modelAPI,
      getBundleChanges: this.controllerAPI.getBundleChanges.bind(
        this.controllerAPI),
      makeEntityModel: jujulibConversionUtils.makeEntityModel,
      charmstore: this.charmstore,
      hideDragOverNotification: this._hideDragOverNotification.bind(this)
    });

    if (config.gisf) {
      document.body.classList.add('u-is-beta');
    }

    /**
      The ACL object including methods for checking whether the user has
      permission to perform specific actions, like deploying a charm or
      destroying a model.
      @type {Object}
    */
    this.acl = new acl.generateAcl(this.controllerAPI, this.modelAPI);
    // Listen for window unloads and trigger the unloadWindow function.
    window.onbeforeunload = utils.unloadWindow.bind(this);

    this._handleMaasServer();
    // Feed environment changes directly into the database.
    this._domEventHandlers['onDeltaBound'] = this.db.onDelta.bind(this.db);
    document.addEventListener('delta', this._domEventHandlers['onDeltaBound']);

    this.db.machines.after(
      ['add', 'remove', '*:change'],
      this.onDatabaseChanged, this);
    this.db.services.after(
      ['add', 'remove', '*:change'],
      this.onDatabaseChanged, this);
    this.db.relations.after(
      ['add', 'remove', '*:change'],
      this.onDatabaseChanged, this);
    this.db.environment.after(
      ['add', 'remove', '*:change'],
      this.onDatabaseChanged, this);
    this.db.environment.after(
      ['add', 'remove', '*:change'],
      this._renderModelActions, this);
    this.db.units.after(
      ['add', 'remove', '*:change'],
      this.onDatabaseChanged, this);
    this.db.notifications.after('add', this._renderNotifications, this);

    // When someone wants a charm to be deployed they fire an event and we
    // show the charm panel to configure/deploy the service.
    this._domEventHandlers['onInitiateDeploy'] = evt => {
      this.deployService(evt.detail.charm, evt.detail.ghostAttributes);
    };
    document.addEventListener(
      'initiateDeploy', this._domEventHandlers['onInitiateDeploy']);

    this._domEventHandlers['boundAppDragOverHandler'] =
      this._appDragOverHandler.bind(this);
    // These are manually detached in the destructor.
    ['dragenter', 'dragover', 'dragleave'].forEach(eventName => {
      document.addEventListener(
        eventName, this._domEventHandlers['boundAppDragOverHandler']);
    });

    this._bindRenderUtilities();

    /**
      Reference to the rendered topology.
      @type {Object}
    */
    this.topology = this._renderTopology();
    this._renderComponents();
    const result = this.state.bootstrap();
    if (result.error) {
      console.error(result.error);
    }
  }

  /**
    As a minor performance boost and to avoid potential rerenderings
    because of rebinding functions in the render methods. Any method that
    requires binding and is passed into components should be bound here
    and then used across components.
  */
  _bindRenderUtilities() {
    /**
      A collection of pre-bound methods to pass to render methods.
      @type {Object}
    */
    this._bound = {
      addNotification: this.db.notifications.add.bind(this.db.notifications),
      changeState: this.state.changeState.bind(this.state),
      destroyModels: this.controllerAPI.destroyModels.bind(this.controllerAPI), // eslint-disable-line max-len
      listModelsWithInfo: this.controllerAPI.listModelsWithInfo.bind(this.controllerAPI) // eslint-disable-line max-len
    };
    // Bind switchModel separately to include the already bound
    // addNotifications.
    this._bound.switchModel = utils.switchModel.bind(
      this, this.modelAPI, this._bound.addNotification);
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
        console.error('no juju config for bundleserviceURL available');
        const message = 'The service for handling bundles is not available.' +
          ' Please try refreshing the GUI.';
        this.db.notifications.add({
          title: message,
          message: message,
          level: 'error'
        });
        return;
      }
      return new BundleService(
        bundleServiceURL,
        new WebHandler());
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
    Ensures the controller is connected on dispatch. Does nothing if the
    controller is already connecting/connected or if we're trying to disconnect.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
   */
  _ensureControllerConnection(state, next) {
    if (
      !this.controllerAPI.get('connecting') &&
      !this.controllerAPI.get('connected')
    ) {
      this.controllerAPI.connect();
    }
    next();
  }
  /**
    Make sure the user agrees to cookie usage.
    @param {Object} state - The application state.
    @param {Function} next - The next route handler.
  */
  authorizeCookieUse(state, next) {
    if (this.applicationConfig.GTM_enabled) {
      cookieUtil.check(document);
    }
    next();
  }
  /**
    Ensure that the current user has authenticated.
    @param {Object} state The application state.
    @param {Function} next The next route handler.
  */
  checkUserCredentials(state, next) {
    // If we're in disconnected mode (either "/new" or "/store"), then allow
    // the canvas to be shown.
    if (state && (state.root === 'new' || state.root === 'store')) {
      next();
      return;
    }
    const apis = [this.modelAPI, this.controllerAPI];
    // Loop through each api connection and see if we are properly
    // authenticated. If we aren't then display the login screen.
    const shouldDisplayLogin = apis.some(api => {
      // Legacy Juju won't have a controller API.
      // If we do not have an api instance or if we are not connected with
      // it then we don't need to concern ourselves with being
      // authenticated to it.
      if (!api || !api.get('connected')) {
        return false;
      }
      // If the api is connecting then we can't know if they are properly
      // logged in yet.
      if (api.get('connecting')) {
        return false;
      }
      return !api.userIsAuthenticated && !this.applicationConfig.gisf;
    });
    if (shouldDisplayLogin) {
      this._displayLogin();
      return;
    }
    next();
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
      ['*', this._ensureControllerConnection.bind(this)],
      ['*', this.authorizeCookieUse.bind(this)],
      ['*', this.checkUserCredentials.bind(this)],
      ['*', this._renderComponents.bind(this)],
      ['root',
        this._rootDispatcher.bind(this),
        this._clearRoot.bind(this)],
      ['profile',
        this._renderUserProfile.bind(this),
        this._clearUserProfile.bind(this)],
      ['user',
        this._handleUserEntity.bind(this),
        this._clearUserEntity.bind(this)],
      ['model',
        this._handleModelState.bind(this)],
      ['store',
        this._renderCharmbrowser.bind(this),
        this._clearCharmbrowser.bind(this)],
      ['search',
        this._renderCharmbrowser.bind(this),
        this._clearCharmbrowser.bind(this)],
      ['account',
        this._renderAccount.bind(this),
        this._clearAccount.bind(this)],
      ['special.deployTarget', this._deployTarget.bind(this)],
      ['gui', null, this._clearAllGUIComponents.bind(this)],
      ['gui.machines',
        this._renderMachineView.bind(this),
        this._clearMachineView.bind(this)],
      ['gui.status',
        this._renderStatusView.bind(this),
        this._clearStatusView.bind(this)],
      ['gui.inspector',
        this._renderInspector.bind(this)
        // the this._clearInspector method is not called here because the
        // added services component is also rendered into the inspector so
        // calling it here causes React to throw an error.
      ],
      ['gui.deploy',
        this._renderDeployment.bind(this),
        this._clearDeployment.bind(this)],
      ['postDeploymentPanel',
        this._displayPostDeployment.bind(this),
        this._clearPostDeployment.bind(this)],
      // Nothing needs to be done at the top level when the hash changes.
      ['hash'],
      // special dd is handled by the root dispatcher as it requires /new
      // for now.
      ['special.dd']
    ]);
    return state;
  }

  /**
    The dispatcher for the root state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _rootDispatcher(state, next) {
    switch (state.root) {
      case 'login':
        // _renderLogin is called from various places with a different call
        // signature so we have to call next manually after.
        this._renderLogin();
        next();
        break;
      case 'logout':
        // If we're in gisf _handleLogout will navigate away from the GUI
        this._handleLogout();
        this.state.changeState({root: 'login'});
        return;
        break;
      case 'store':
        this._renderCharmbrowser(state, next);
        break;
      case 'account':
        this._renderAccount(state, next);
        break;
      case 'new':
        // When going to disconnected mode we need to be disconnected from
        // models.
        if (this.modelAPI.get('connected')) {
          this._switchModelToUUID();
        }
        // When dispatching, we only want to remove the mask if we're in
        // anonymousMode or the user is logged in; otherwise we need to
        // properly redirect to login.
        const userLoggedIn = this.controllerAPI.userIsAuthenticated;
        if (this.anonymousMode || userLoggedIn) {
          this.maskVisibility(false);
        }
        const specialState = state.special;
        if (specialState && specialState.dd) {
          this._directDeploy(specialState.dd);
        }
        break;
      default:
        next();
        break;
    }
  }

  /**
    Handles the state changes for the model key.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _handleModelState(state, next) {
    const modelAPI = this.modelAPI;
    if (this.modelUUID !== state.model.uuid ||
        (!modelAPI.get('connected') && !modelAPI.get('connecting'))) {
      this._switchModelToUUID(state.model.uuid);
    }
    next();
  }

  /**
    Switches to the specified UUID, or if none is provided then
    switches to the unconnected mode.
    @param {String} uuid The uuid of the model to switch to, or none.
  */
  _switchModelToUUID(uuid) {
    let socketURL = undefined;
    if (uuid) {
      console.log('switching to model: ', uuid);
      this.modelUUID = uuid;
      const config = this.applicationConfig;
      socketURL = utils.createSocketURL({
        protocol: config.socket_protocol,
        apiAddress: config.apiAddress,
        template: config.socketTemplate,
        uuid});
    } else {
      console.log('switching to disconnected mode');
      this.modelUUID = null;
    }
    this.switchEnv(socketURL);
  }

  /**
    The cleanup dispatcher for the root state path.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearRoot(state, next) {
    this._clearCharmbrowser(state, next);
    this._clearLogin(state, next);
    next();
  }

  /**
    Handle the request to display the user entity state.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _handleUserEntity(state, next) {
    this._disambiguateUserState(
      this._fetchEntityFromUserState(state.user));
  }

  /**
    The cleanup dispatcher for the user entity state path. The store will be
    mounted if the path was for a bundle or charm. If the entity was a model
    we don't need to do anything.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _clearUserEntity(state, next) {
    const container = document.getElementById('charmbrowser-container');
    // The charmbrowser will only be mounted if the entity is a charm or
    // bundle.
    if (container.childNodes.length > 0) {
      ReactDOM.unmountComponentAtNode(container);
    }
    next();
  }

  /**
    Creates new API client instances for Romulus services.
    Assign them to the "plans" and "terms" app properties.
    @param {Object} config The GUI application configuration.
    @param {Object} jujulib The Juju API client library.
  */
  _setupRomulusServices(config, jujulib) {
    if (!config) {
      // We are probably running tests.
      return;
    }
    if (this.plans || this.terms) {
      console.error(
        'romulus services are being redefined:', this.plans, this.terms);
    }
    /**
      Application instance of the plans api.
      @type {Object}
    */
    this.plans = new window.jujulib.plans(config.plansURL, this.bakery);
    /**
      Application instance of the terms api.
      @type {Object}
    */
    this.terms = new window.jujulib.terms(config.termsURL, this.bakery);
    if (config.flags.pay) {
      /**
        Application instance of the payment api.
        @type {Object}
      */
      this.payment = new window.jujulib.payment(
        config.paymentURL, this.bakery);
      /**
        Application instance of the stripe api.
        @type {Object}
      */
      this.stripe = new window.jujulib.stripe(
        'https://js.stripe.com/', config.stripeKey);
    }
  }

  _handleMaasServer() {
    // Once we know about MAAS server, update the header accordingly.
    let maasServer = this.modelAPI.get('maasServer');
    if (!maasServer && this.controllerAPI) {
      maasServer = this.controllerAPI.get('maasServer');
    }
    if (maasServer) {
      this._displayMaasLink(maasServer);
    } else {
      if (this.controllerAPI) {
        this.controllerAPI.once('maasServerChange', this._onMaasServer, this);
      }
      this.modelAPI.once('maasServerChange', this._onMaasServer, this);
    }
  }

  /**
    Determines if the user state is a store path or a model path.
    @param {String} userState The state value for the 'user' key.
    @return {Promise} A promise with the charmstore entity if one exists.
  */
  _fetchEntityFromUserState(userState) {
    const userPaths = this._userPaths;
    const entityCache = userPaths.get(userState);
    if (entityCache && entityCache.promise) {
      return entityCache.promise;
    }
    const entityPromise = new Promise((resolve, reject) => {
      let legacyPath = undefined;
      try {
        legacyPath =
          window.jujulib.URL.fromString('u/' + userState).legacyPath();
      } catch (e) {
        // If the state cannot be parsed into a url we can be sure it's
        // not an entity.
        reject(userState);
        return;
      }
      this.charmstore.getEntity(
        legacyPath, (err, entityData) => {
          if (err) {
            console.log('model/charm store disambiguation:', err);
            reject(userState);
            return;
          }
          resolve(userState);
        });
    });
    userPaths.set(userState, {promise:entityPromise});
    return entityPromise;
  }

  /**
    Requests to disambiguate the user state if any and then sets up the proper
    event listeners on the controllerAPI instance.
  */
  _setupControllerAPI() {
    // Generate the application state then see if we have to disambiguate
    // the user portion of the state.
    const pathState = this.state.generateState(window.location.href, false);
    let entityPromise = null;
    if (!pathState.error && pathState.state.user) {
      // If we have a user component to the state then it is ambiguous.
      // disambiguate the user state by checking if the user fragment
      // represents a charm store entity.
      entityPromise = this._fetchEntityFromUserState(pathState.state.user);
    }
    this._domEventHandlers['controllerLoginHandler'] =
      this._controllerLoginHandler.bind(this, entityPromise);
    document.addEventListener(
      'login', this._domEventHandlers['controllerLoginHandler']);
    this.controllerAPI.after(
      'connectedChange',
      this._controllerConnectedChangeHandler.bind(this));
    const config = this.applicationConfig;
    this.controllerAPI.set('socket_url',
      utils.createSocketURL({
        apiAddress: config.apiAddress,
        template: config.controllerSocketTemplate,
        protocol: config.socket_protocol
      }));
  }

  _controllerLoginHandler(entityPromise, evt) {
    const state = this.state;
    this.anonymousMode = false;
    if (evt.detail && evt.detail.err) {
      this._renderLogin(evt.detail.err);
      return;
    }
    this._renderUserMenu();
    console.log('successfully logged into controller');

    // If the GUI is embedded in storefront, we need to share login
    // data with the storefront backend and ensure we're already
    // logged into the charmstore.
    if (this.applicationConfig.gisf) {
      this._sendGISFPostBack();
      this._ensureLoggedIntoCharmstore();
    }

    // If state has a `next` property then that overrides all defaults.
    const specialState = state.current.special;
    const next = specialState && specialState.next;
    const dd = specialState && specialState.dd;

    if (state.current.root === 'login') {
      state.changeState({root: null});
      if (dd) {
        console.log('initiating direct deploy');
        this.maskVisibility(false);
        this._directDeploy(dd);
        return;
      } else if (next) {
        // There should never be a `next` state if we aren't on login but
        // adding the state login check here just to be sure.
        console.log('redirecting to "next" state', next);
        const {error, state: newState} = state.generateState(next, false);
        if (error === null) {
          newState.special = null;
          this.maskVisibility(false);
          state.changeState(newState);
          return;
        }
        console.error('error redirecting to previous state', error);
        return;
      }
    }

    // If the user is connected to a model then the modelList will be
    // fetched by the modelswitcher component.
    if (this.modelAPI.get('modelUUID')) {
      return;
    }
    // As we are not changing the state anymore, we can cache the current
    // state at this point.
    const current = state.current;
    const modelUUID = this.modelUUID;
    if (modelUUID && !current.profile && current.root !== 'store') {
      // A model uuid was defined in the config so attempt to connect to it.
      this._listAndSwitchModel(null, modelUUID);
    } else if (entityPromise !== null) {
      this._disambiguateUserState(entityPromise);
    } else {
      // Drop into disconnected mode and show the profile but only if there
      // is no state defined in root or store. If there is a state defined
      // either of those then we want to let that dispatcher handle the
      // routing.
      this.maskVisibility(false);
      const isLogin = current.root === 'login';
      const previousState = state.previous;
      const previousRoot = previousState && previousState.root || null;
      // If there was a previous root before the login then redirect to that
      // otherwise go to the profile.
      let newState = {
        // We don't want to redirect to the previous root if it was the
        // login page.
        profile: previousRoot && previousRoot !== 'login' ?
          null : current.profile,
        root: isLogin ? previousRoot : current.root
      };
      // If the current root is 'login' after logging into the controller,
      // and there is no root, no store and no profile defined then we
      // want to render the users profile.
      if (
        !current.store &&
        !newState.profile &&
        newState.root !== 'account' &&
        (isLogin || !current.root) &&
        this.applicationConfig.gisf
      ) {
        newState.profile = this.user.displayName;
      }
      state.changeState(newState);
    }
  }

  _controllerConnectedChangeHandler(evt) {
    if (!evt.newVal) {
      // The controller is not connected, do nothing waiting for a
      // reconnection.
      console.log('controller disconnected');
      return;
    }
    console.log('controller connected');
    const creds = this.user.controller;
    const gisf = this.applicationConfig.gisf;
    const currentState = this.state.current;
    const rootState = currentState ? currentState.root : null;
    // If an anonymous GISF user lands on the GUI at /new then don't
    // attempt to log into the controller.
    if ((
      !creds.areAvailable && gisf && rootState === 'new'
    ) || (
        this.anonymousMode && rootState !== 'login'
      )) {
      this.anonymousMode = true;
      console.log('now in anonymous mode');
      this.maskVisibility(false);
      return;
    }
    if (!creds.areAvailable ||
    // When using direct deploy when a user is not logged in it will
    // navigate to show the login if we do not have this state check.
        (currentState.special && currentState.special.dd)) {
      this._displayLogin();
      return;
    }
    // If macaroons are available or if we have an external token from
    // Keystone, then proceed with the macaroons based authentication.
    if (creds.macaroons || creds.areExternal) {
      this.loginToAPIs(null, true, [this.controllerAPI]);
      return;
    }
    // The traditional user/password authentication does not make sense if
    // the GUI is embedded in the storefront.
    this.loginToAPIs(null, gisf, [this.controllerAPI]);
  }

  /**
    Update the model name across the application on model name change.
    @param {Object} evt The name change event.
  */
  onModelNameChange(evt) {
    const modelName = evt.newVal || 'untitled-model';
    // Update the name on the current model. This is what the components use
    // to display the model name.
    this.db.environment.set('name', modelName);
    // Update the breadcrumb with the new model name.
    this._renderBreadcrumb();
    // Update the page title.
    this.defaultPageTitle = `${modelName} - Juju GUI`;
    this.setPageTitle();
  }
  /**
    Update the model instance when the default series changes
    @param {Object} evt The series change event.
   */
  onDefaultSeriesChange(evt) {
    this.db.environment.set('defaultSeries', evt.newVal);
  }
  /**
    Debounce database change events then call handler.
   */
  onDatabaseChanged() {
    const changedTimer = this._dbChangedTimer;
    if (changedTimer) {
      clearTimeout(changedTimer);
    }
    this._dbChangedTimer = setTimeout(this._dbChangedHandler.bind(this), 100);
    return;
  }

  /**
    After the db has changed and the timer has timed out to reduce repeat
    calls then this is called to handle the db updates.
  */
  _dbChangedHandler() {
    this.topology.topo.update();
    this.state.dispatch();
    this._renderComponents();
  }

  /**
    Event handler for the dragenter, dragover, dragleave events on the
    document. It calls to determine the file type being dragged and manages
    the commands to the timerControl method.
    @param {Object} e The event object from the various events.
  */
  _appDragOverHandler(e) {
    e.preventDefault(); // required to allow items to be dropped
    // In this case, we want an empty string to be a truthy value.
    const fileType = this._determineFileType(e.dataTransfer);
    if (fileType === false) {
      return; // Ignore if it's not a supported type
    }
    if (e.type === 'dragenter') {
      this._renderDragOverNotification();
    }
    // Possible values for type are 'dragover' and 'dragleave'.
    this._dragleaveTimerControl(e.type === 'dragover' ? 'stop' : 'start');
  }

  /**
    Handles the dragleave timer so that the periodic dragleave events which
    fire as the user is dragging the file around the browser do not stop
    the drag notification from showing.
    @param {String} action The action that should be taken on the timer.
  */
  _dragleaveTimerControl(action) {
    if (this._dragLeaveTimer) {
      window.clearTimeout(this._dragLeaveTimer);
      this._dragLeaveTimer = null;
    }
    if (action === 'start') {
      this._dragLeaveTimer = setTimeout(() => {
        this._hideDragOverNotification();
      }, 100);
    }
  }

  /**
    Takes the information from the dataTransfer object to determine what
    kind of file the user is dragging over the canvas.

    Unfortunately Safari and IE do not show mime types for files that they
    are not familiar with. This isn't an issue once the user has dropped the
    file because we can parse the file name but while it's still hovering the
    browser only tells us the mime type if it knows it, else it's an empty
    string. This means that we cannot determine between a yaml file or a
    folder during hover.
    Bug: https://code.google.com/p/chromium/issues/detail?id=342554
    Real mime type for yaml files should be: application/x-yaml

    @method _determineFileType
    @param {Object} dataTransfer dataTransfer object from the dragover event.
    @return {String} The file type extension.
  */
  _determineFileType(dataTransfer) {
    const types = dataTransfer.types;
    // When dragging a single file in Firefox dataTransfer.types is an array
    // with two elements ["application/x-moz-file", "Files"]
    if (!Object.keys(types).some(key => types[key] === 'Files')) {
      // If the dataTransfer type isn't `Files` then something is being
      // dragged from inside the browser.
      return false;
    }
    // IE10, 11 and Safari do not have this property during hover so we
    // cannot tell what type of file is being hovered over the canvas.
    if (dataTransfer.items) {
      // See method doc for bug information.
      const file = dataTransfer.items[0];
      if (file.type === 'application/zip' ||
          file.type === 'application/x-zip-compressed') {
        return 'zip';
      }
      return 'yaml';
    }
    return '';
  }

  /**
    Sets the page title.
    @param {String} title The title to be appended with ' - Juju GUI'
  */
  setPageTitle(title) {
    document.title = title ? `${title} - Juju GUI` : this.defaultPageTitle;
  }

  /**
    Make the necessary state changes to display the login UI.
  */
  _displayLogin() {
    const root = this.state.current.root;
    if (root !== 'login') {
      this.state.changeState({root: 'login'});
    }
  }

  /**
    Handles logging into both the env and controller api WebSockets.

    @method loginToAPIs
    @param {Object} credentials The credentials for the controller APIs.
    @param {Boolean} useMacaroons Whether to use macaroon based auth
      (macaraq) or simple username/password auth.
    @param {Array} apis The apis instances that we should be logging into.
      Defaults to [this.controllerAPI, this.modelAPI].
  */
  loginToAPIs(
    credentials, useMacaroons, apis=[this.controllerAPI, this.modelAPI]) {
    if (useMacaroons) {
      apis.forEach(api => {
        // The api may be unset if the current Juju does not support it.
        if (api && api.get('connected')) {
          console.log(`logging into ${api.name} with macaroons`);
          api.loginWithMacaroon(
            this.bakery,
            this._apiLoginHandler.bind(this, api));
        }
      });
      return;
    }
    apis.forEach(api => {
      // The api may be unset if the current Juju does not support it.
      if (!api) {
        return;
      }
      // Ensure the credentials are set, if available.
      if (credentials && api.name === 'model-api') {
        this.user.model = credentials;
      } else if (credentials) {
        this.user.controller = credentials;
      }
      if (api.get('connected')) {
        console.log(`logging into ${api.name} with user and password`);
        api.login();
      }
    });
  }

  /**
    Callback handler for the API loginWithMacaroon method which handles
    the "redirection required" error message.
    @param {Object} api The API that the user is attempting to log into.
      ex) this.env or this.controllerAPI
    @param {String} err The login error message, if any.
  */
  _apiLoginHandler(api, err) {
    if (!err) {
      return;
    }
    if (!viewUtils.isRedirectError(err)) {
      // There is nothing to do in this case, and the user is already
      // prompted with the error in the login view.
      console.log(`cannot log into ${api.name}: ${err}`);
      return;
    }
    // If the error is that redirection is required then we have to
    // make a request to get the appropriate model connection information.
    console.log(`redirection required for loggin into ${api.name}`);
    api.redirectInfo((err, servers) => {
      if (err) {
        this.db.notifications.add({
          title: 'Unable to log into Juju',
          message: err,
          level: 'error'
        });
        return;
      }
      // Loop through the available servers and find the public IP.
      const hosts = servers[0];
      const publicHosts = hosts.filter(host => host.scope === 'public');
      if (!publicHosts.length) {
        this.db.notifications.add({
          title: 'Model connection error',
          message: 'Cannot find a public host for connecting to the model',
          level: 'error'
        });
        console.error('no public hosts found: ' + JSON.stringify(servers));
        return;
      }
      const publicHost = publicHosts[0];
      // Switch to the redirected model.
      // Make sure we keep the change set by not clearing the db when
      // creating a model with change set (last param false).
      const config = this.applicationConfig;
      this.switchEnv(
        utils.createSocketURL({
          apiAddress: config.apiAddress,
          template: config.socketTemplate,
          protocol: config.socket_protocol,
          uuid: this.modelUUID,
          server: publicHost.value,
          port: publicHost.port
        }), null, null, null, true, false);
    });
  }

  /**
    Switch the application to another environment.
    Disconnect the current WebSocket connection and establish a new one
    pointed to the environment referenced by the given URL.
    @param {String} socketUrl The URL for the environment's websocket.
    @param {String} username The username for the new environment.
    @param {String} password The password for the new environment.
    @param {Function} callback A callback to be called after the env has been
      switched and logged into.
    @param {Boolean} reconnect Whether to reconnect to a new environment; by
                               default, if the socketUrl is set, we assume we
                               want to reconnect to the provided URL.
    @param {Boolean} clearDB Whether to clear the database and ecs.
  */
  switchEnv(
    // TODO frankban: make the function defaults saner, for instance
    // clearDB=true should really be preserveDB=false by default.
    socketUrl, username, password, callback, reconnect=!!socketUrl,
    clearDB=true) {
    console.log('switching model connection');
    this.modelAPI.loading = true;
    if (username && password) {
      // We don't always get a new username and password when switching
      // environments; only set new credentials if we've actually gotten them.
      // The GUI will automatically log in when we switch.
      this.user.model = {
        user: username,
        password: password
      };
    };
    const credentials = this.user.model;
    const onLogin = callback => {
      this.modelAPI.loading = false;
      if (callback) {
        callback(this.modelAPI);
      }
      const current = this.state.current;
      if (current.root === 'login') {
        this.state.changeState({root: null});
      }
    };
    // Delay the callback until after the env login as everything should be
    // set up by then.
    document.addEventListener(
      'model.login', onLogin.bind(this, callback), {once: true});
    if (clearDB) {
      // Clear uncommitted state.
      this.modelAPI.get('ecs').clear();
    }
    const setUpModel = model => {
      // Tell the model to use the new socket URL when reconnecting.
      model.set('socket_url', socketUrl);
      // We need to reset the credentials each time we set up a model,
      // b/c we remove the credentials when we close down a model
      // connection in the `close()` method of base.js
      this.user.model = credentials;
      // Reconnect the model if required.
      if (reconnect) {
        model.connect();
      }
    };
    // Disconnect and reconnect the model.
    const onclose = function() {
      this.on_close();
      setUpModel(this);
    }.bind(this.modelAPI);
    if (this.modelAPI.ws) {
      this.modelAPI.ws.onclose = onclose;
      this.modelAPI.close();
      // If we are already disconnected then connect if we're supposed to.
      if (!this.modelAPI.get('connected')) {
        setUpModel(this.modelAPI);
      }
    } else {
      this.modelAPI.close(onclose);
    }
    if (clearDB) {
      this.db.reset();
      this.db.fireEvent('update');
    }
    if (this.topology) {
      this.topology.topo.modules.ServiceModule.centerOnLoad = true;
    }
    // If we're not reconnecting, then mark the switch as done.
    if (this.state.current.root === 'new') {
      this.modelAPI.loading = false;
    }
  }

  /**
    Calls the listModelsWithInfo method on the controller API and then
    switches to the provided model name or model uuid if available. If no
    matching model is found then state is changed to the users profile page.
    If both model name and model uuid are provided then the model name will
    win.
    @param {String} modelPath The model path to switch to in the format
      username/modelname.
    @param {String} modelUUID The model uuid to switch to.
  */
  _listAndSwitchModel(modelPath, modelUUID) {
    this.controllerAPI.listModelsWithInfo((err, modelList) => {
      if (err) {
        console.error('unable to list models', err);
        this.db.notifications.add({
          title: 'Unable to list models',
          message: 'Unable to list models: ' + err,
          level: 'error'
        });
        return;
      }
      const noErrorModels = modelList.filter(model => !model.err);
      const generatePath = (owner, name) => `${owner.split('@')[0]}/${name}`;

      let model = undefined;
      if (modelPath) {
        model = noErrorModels.find(model =>
          generatePath(model.owner, model.name) === modelPath);
      } else if (modelUUID) {
        model = noErrorModels.find(model => model.uuid === modelUUID);
      }
      this.maskVisibility(false);
      // If we're already connected to the model then don't do anything.
      if (model && this.modelAPI.get('modelUUID') === model.uuid) {
        return;
      }
      if (model) {
        this.state.changeState({
          model: {
            path: generatePath(model.owner, model.name),
            uuid: model.uuid
          },
          user: null,
          root: null
        });
      } else {
        // If no model was found then navigate to the user profile.
        const msg = `no such charm, bundle or model: u/${modelPath}`;
        // TODO frankban: here we should put a notification, but we can't as
        // this seems to be dispatched twice.
        console.log(msg);
        // replace get auth with user.username
        this.state.changeState({
          root: null,
          store: null,
          model: null,
          user: null,
          profile: this.user.displayName
        });
      }
    });
  }

  /**
    Provided an entityPromise, attaches handlers for the resolve and reject
    cases. If resolved it changes state to the entity found, if rejected
    calls _listAndSwitchModel with the possible model name.
    @param {Promise} entityPromise A promise containing the result of a
      getEntity charmstore call.
  */
  _disambiguateUserState(entityPromise) {
    entityPromise.then(userState => {
      console.log('entity found, showing store');
      // The entity promise returned an entity so it is not a model and
      // we should navigate to the store.
      this.maskVisibility(false);
      this.state.changeState({
        store: 'u/' + userState,
        user: null
      });
    }).catch(userState => {
      // No entity was found so it's possible that this is a model.
      // We need to list the models that the user has access to and find
      // one which matches the name to extract the UUID.
      if (!this.controllerAPI.userIsAuthenticated) {
        console.log('not logged into controller');
        return;
      }
      this._listAndSwitchModel(userState);
    });
  }

  /**
    Sends the discharge token via POST to the storefront. This is used
    when the GUI is operating in GISF mode, allowing a shared login between
    the GUI and the storefront.
  */
  _sendGISFPostBack() {
    const dischargeToken = this.user.getMacaroon('identity');
    if (!dischargeToken) {
      console.error('no discharge token in local storage after login');
      const message = 'Authentication failed. Please try refreshing the GUI.';
      this.db.notifications.add({
        title: message,
        message: message,
        level: 'error'
      });
      return;
    }
    console.log('sending discharge token to storefront');
    const content = 'discharge-token=' + dischargeToken;
    const webhandler = new WebHandler();
    webhandler.sendPostRequest(
      '/_login',
      {'Content-Type': 'application/x-www-form-urlencoded'},
      content);
  }

  /**
    Generate a user info object.
    @param {Object} state - The application state.
  */
  _getUserInfo(state) {
    const username = state.profile || this.user.displayName || '';
    const userInfo = {
      external: username,
      isCurrent: false,
      profile: username
    };
    if (userInfo.profile === this.user.displayName) {
      userInfo.isCurrent = true;
      // This is the current user, and might be a local one. Use the
      // authenticated charm store user as the external (USSO) name.
      const users = this.users || {};
      userInfo.external = users.charmstore ? users.charmstore.user : null;
    }
    return userInfo;
  }

  /**
    Auto log the user into the charm store as part of the login process
    when the GUI operates in a GISF context.
  */
  _ensureLoggedIntoCharmstore() {
    if (!this.user.getMacaroon('charmstore')) {
      this.charmstore.getMacaroon((err, macaroon) => {
        if (err) {
          const message = 'Authentication failed. Please try refreshing the GUI.';
          console.error(message, err);
          this.db.notifications.add({
            title: message,
            message: `${message}: ${err}`,
            level: 'error'
          });
          return;
        }
        this.storeUser('charmstore', true);
        console.log('logged into charmstore');
      });
    }
  }

  /**
    If we are in a MAAS environment, react to the MAAS server address
    retrieval adding a link to the header pointing to the MAAS server.
    @param {Object} evt An event object (with a "newVal" attribute).
  */
  _onMaasServer(evt) {
    if (evt.newVal === evt.prevVal) {
      // This can happen if the attr is set blithely. Ignore if so.
      return;
    }
    this._displayMaasLink(evt.newVal);
  }

  /**
    If the given maasServer is not null, create a link to the MAAS server
    in the GUI header.
    @param {String} maasServer The MAAS server URL (or null if not in MAAS).
  */
  _displayMaasLink(maasServer) {
    if (maasServer === null) {
      // The current environment is not MAAS.
      return;
    }
    const maasContainer = document.querySelector('#maas-server');
    maasContainer.querySelector('a').setAttribute('href', maasServer);
    maasContainer.classList.remove('hidden');
  }

  maskVisibility(visibility = true) {
    var mask = document.getElementById('full-screen-mask');
    var display = visibility ? 'block' : 'none';
    if (mask) {
      mask.style.display = display;
    }
  }

  /**
    Calls the necessary methods to setup the GUI and put the user in the
    Deployment Flow when they have used Direct Deploy.
    @param {Object} ddData - The Direct Deploy data from state.
  */
  _directDeploy(ddData) {
    const current = this.state.current;
    if (current &&
        current.gui &&
        current.gui.deploy) {
      // If we're already in the deployment flow then return to stop
      // infinitely updating state.
      return;
    }
    this.deployTarget(this.charmstore, ddData.id);
    this.state.changeState({
      gui: {
        deploy: JSON.stringify(ddData)
      },
      postDeploymentPanel: {
        entityId: ddData.id
      }
    });
  }

  /**
    State handler for he deploy target functionality.
    @param {Object} state - The application state.
    @param {Function} next - Run the next route handler, if any.
  */
  _deployTarget(state, next) {
    // Remove the deployTarget from state so that we don't end up
    // dispatching it again by accident.
    this.state.changeState({
      special: {
        deployTarget: null
      }
    });
    this.deployTarget(this.charmstore, state.special['deployTarget']);
    next();
  }

  /**
    Deploys the supplied entity Id from the supplied charmstore instance.
    @param {Object} charmstore The charmstore instance to fetch the entity.
    @param {String} entityId The entity id to deploy.
  */
  deployTarget(charmstore, entityId) {
    /**
      Handles parsing and displaying the failure notification returned from
      the charmstore api.
      @param {Object} error The XHR request object from the charmstore req.
    */
    const failureNotification = error => {
      let message = `Unable to deploy target: ${entityId}`;
      try {
        message = JSON.parse(error.currentTarget.responseText).Message;
      } catch (e) {
        console.error(e);
      }
      this.db.notifications.add({
        title: 'Error deploying target.',
        message: message,
        level: 'error'
      });
    };
    // The charmstore apiv4 format can have the bundle keyword either at the
    // start, for charmers bundles, or after the username, for namespaced
    // bundles. ex) bundle/swift & ~jorge/bundle/swift
    if (entityId.indexOf('bundle/') > -1) {
      charmstore.getBundleYAML(entityId, (error, bundleYAML) => {
        if (error) {
          failureNotification(error);
        } else {
          this.bundleImporter.importBundleYAML(bundleYAML);
        }
      });
    } else {
      // If it's not a bundle then it's a charm.
      charmstore.getEntity(entityId.replace('cs:', ''), (error, charm) => {
        if (error) {
          failureNotification(error);
        } else {
          charm = charm[0];
          let config = {},
              options = charm.get ? charm.get('options') : charm.options;
          Object.keys(options).forEach(function(key) {
            config[key] = options[key]['default'];
          });
          // We call the env deploy method directly because we don't want
          // the ghost inspector to open.
          this.deployService(new yui.juju.models.Charm(charm));
        }
      });
    }
  }

  /**
    Renders the topology to the DOM.
    @return {Object} Reference to the rendered topology.
  */
  _renderTopology() {
    const topology = new EnvironmentView({
      endpointsController: this.endpointsController,
      db: this.db,
      env: this.modelAPI,
      ecs: this.ecs,
      charmstore: this.charmstore,
      bundleImporter: this.bundleImporter,
      state: this.state,
      staticURL: this.applicationConfig.staticURL,
      sendAnalytics: this.sendAnalytics,
      container: document.querySelector(
        this.applicationConfig.container || '#main')
    });
    topology.render();
    // Trigger the resized method so that the topology fills the viewport.
    topology.topo.modules.ViewportModule.resized();
    return topology;
  }

  /**
   Logs the user out of the gui.

    This closes the model/controller connections and clears cookies and other
    authentication artifacts. If in gisf mode this will then redirect the user
    to the store front logout mechanism to complete logout.

    @method _handleLogout
  */
  _handleLogout() {
    const config = this.applicationConfig;
    this.clearUser();
    this.bakery.storage.clear();
    const topology = this.topology;
    if (topology) {
      topology.topo.update();
    }
    this.modelUUID = '';
    this.loggedIn = false;
    const controllerAPI = this.controllerAPI;
    const closeController = controllerAPI.close.bind(controllerAPI);
    this.modelAPI.close(() => {
      closeController(() => {
        controllerAPI.connect();
        this.maskVisibility(true);
        this.modelAPI.get('ecs').clear();
        this.db.reset();
        this.db.fireEvent('update');
        this.state.changeState({
          model: null,
          profile: null,
          root: null,
          store: null
        });
      });
    });
    if (config.gisf) {
      const gisfLogoutUrl = config.gisfLogout || '';
      window.location.assign(window.location.origin + gisfLogoutUrl);
    }
  }

  /**
    Cleans up the instance of the application.
  */
  destructor() {
    if (this._dbChangedTimer) {
      clearTimeout(this._dbChangedTimer);
    }
    // Destroy YUI classes.
    this.modelAPI && this.modelAPI.destroy();
    this.controllerAPI.destroy();
    this.db.destroy();
    this.endpointsController.destructor();
    this.topology.destructor();
    this._hotkeyListener.deactivate();
    // Detach event listeners.
    const remove = document.removeEventListener.bind(document);
    const handlers = this._domEventHandlers;
    const ecsListener = handlers['renderDeploymentBarListener'];
    remove('ecs.changeSetModified', ecsListener);
    remove('ecs.currentCommitFinished', ecsListener);
    remove('login', handlers['controllerLoginHandler']);
    remove('delta', handlers['onDeltaBound']);
    remove('update', handlers['boundOnDatabaseChanged']);
    remove('initiateDeploy', handlers['onInitiateDeploy']);
    ['dragenter', 'dragover', 'dragleave'].forEach(eventName => {
      remove(eventName, handlers['boundAppDragOverHandler']);
    });
  }
}

class JujuGUI extends mixwith.mix(GUIApp).with(
  csUser.CharmstoreUserMixin,
  ComponentRenderersMixin,
  DeployerMixin
) {}

module.exports = JujuGUI;
