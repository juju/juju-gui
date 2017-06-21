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

/**
 * Provide the main App class, based on the YUI App framework. Also provide
 * the routing definitions, which map the request paths to the top-level
 * views defined by the App class.
 *
 * @module app
 */

// Create a global for debug console access to YUI context.
var yui; // eslint-disable-line no-unused-vars

YUI.add('juju-gui', function(Y) {

  // Assign the global for console access.
  yui = Y;

  var juju = Y.namespace('juju'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      d3 = Y.namespace('d3');

  /**
   * The main app class.
   *
   * @class App
   */
  var extensions = [
    widgets.AutodeployExtension,
    Y.juju.Cookies,
    Y.juju.AppRenderer,
    Y.juju.GhostDeployer
  ];
  var JujuGUI = Y.Base.create('juju-gui', Y.App, extensions, {
    /**
     * Views
     *
     * The views encapsulate the functionality blocks that output
     * the GUI pages. The "parent" attribute defines the hierarchy.
     *
     * @attribute views
     */
    views: {
      environment: {
        type: 'juju.views.environment',
        preserve: true
      }
    },

    /*
     * Declarative keybindings on the window object.
     *
     * Prefix supported are:
     *   C - Control
     *   A - Alt
     *   S - Shift
     *
     * Followed by a lowercase letter. For example
     *
     * A-s is the 'Alt + s' keybinding.
     *
     * This maps to an object which has the following behavior.
     *
     * target: {String} CSS selector of one element
     * focus: {Boolean} Focus the element.
     * toggle: {Boolean} Toggle element visibility.
     * fire: {String} Event to fire when triggered. (XXX: Target is topology)
     * condition: {Function} returns Boolean, should method be added to
     *            keybindings.
     * callback: {Function} Taking (event, target).
     * help: {String} Help text to display in popup.
     * label: {String} The label to display in the help text. Defaults to the
     *        specified keybinding.
     *
     * All are optional.
     */
    keybindings: {
      'A-s': {
        target: '#charm-search-field',
        focus: true,
        help: 'Select the charm Search',
        label: 'Alt + s'
      },
      '/': {
        target: '.header-search__input',
        focus: true,
        help: 'Select the charm Search'
      },
      'S-1': {
        callback: function() {
          this._clearShortcutsModal();
          if (document.getElementById('modal-gui-settings').
            children.length > 0) {
            this._clearSettingsModal();
          } else {
            this._displaySettingsModal();
          }
        },
        help: 'GUI Settings',
        label: 'Shift + !'
      },
      'S-/': {
        callback: function() {
          this._clearSettingsModal();
          if (document.getElementById('modal-shortcuts').
            children.length > 0) {
            this._clearShortcutsModal();
          } else {
            this._displayShortcutsModal();
          }
        },
        help: 'Display this help',
        label: 'Shift + ?'
      },
      'S-+': {
        fire: 'topo.zoom_in',
        help: 'Zoom In',
        label: 'Shift + "+"'
      },
      'S--': {
        fire: 'topo.zoom_out',
        help: 'Zoom Out',
        label: 'Shift + -'
      },
      'S-0': {
        fire: 'topo.panToCenter',
        help: 'Center the model overview',
        label: 'Shift + 0'
      },
      'esc': {
        fire: 'topo.clearState',
        callback: function() {
          this._clearSettingsModal();
          this._clearShortcutsModal();
        },
        help: 'Cancel current action',
        label: 'Esc'
      },

      'S-d': {
        callback: function(evt) {
          views.utils.exportEnvironmentFile(this.db);
        },
        help: 'Export the model',
        label: 'Shift + d'
      }
    },

    /**
     * Activate the keyboard listeners. Only called by the main index.html,
     * not by the tests' one.
     *
     * @method activateHotkeys
     */
    activateHotkeys: function() {
      var key_map = {
        '1': 49, '/': 191, '?': 63, '+': 187, '-': 189,
        enter: 13, esc: 27, backspace: 8,
        tab: 9, pageup: 33, pagedown: 34};
      var code_map = {};
      Object.keys(key_map).forEach(k => {
        const v = key_map[k];
        code_map[v] = k;
      });
      this._keybindings = document.addEventListener('keydown', evt => {
        // Normalize key-code
        // This gets triggered by different types of elements some YUI some
        // React. So try and use the native tagName property first, if that
        // fails then fall back to ReactDOM.findDOMNode().
        var tagName = evt.target.tagName;
        var contentEditable = evt.target.contentEditable;
        var currentKey;
        if (code_map[evt.keyCode]) {
          currentKey = code_map[evt.which];
        } else {
          currentKey = String.fromCharCode(evt.which).toLowerCase();
        }
        if (!tagName) {
          tagName = ReactDOM.findDOMNode(evt.target).tagName;
        }
        if (!contentEditable) {
          contentEditable = ReactDOM.findDOMNode(evt.target).contentEditable;
        }
        // Don't ignore esc in the search box.
        if (currentKey === 'esc' &&
            evt.target.className === 'header-search__input') {
          // Remove the focus from the search box.
          evt.target.blur();
          // Target filtering, we want to listen on window
          // but not honor hotkeys when focused on
          // text oriented input fields.
        } else if (['INPUT', 'TEXTAREA'].indexOf(tagName) !== -1 ||
                   contentEditable === 'true') {
          return;
        }
        var symbolic = [];
        if (evt.ctrlKey) { symbolic.push('C');}
        if (evt.altKey) { symbolic.push('A');}
        if (evt.shiftKey) { symbolic.push('S');}
        symbolic.push(currentKey);
        var trigger = symbolic.join('-');
        var spec = this.keybindings[trigger];
        if (spec) {
          if (spec.condition && !spec.condition.call(this)) {
            // Note that when a condition check fails,
            // the event still propagates.
            return;
          }
          var target = document.querySelector(spec.target);
          if (target) {
            if (spec.toggle) {
              if (target.classList.contains('hidden')) {
                target.classList.remove('hidden');
              } else {
                target.classList.add('hidden');
              }
            }
            if (spec.focus) { target.focus(); }
          }
          if (spec.callback) { spec.callback.call(this, evt, target); }
          // HACK w/o context/view restriction but right direction
          if (spec.fire) {
            document.dispatchEvent(new Event(spec.fire));
          }
          // If we handled the event nothing else has to.
          evt.stopPropagation();
        }
      });
    },

    /**
      Return the current model unique identifier.

      @method _getModelUUID
      @return {String} The model UUID.
    */
    _getModelUUID: function() {
      return this.get('modelUUID') ||
        (window.juju_config && window.juju_config.jujuEnvUUID);
    },

    /**
     * @method initializer
     * @param {Object} cfg Application configuration data.
     */
    initializer: function(cfg) {
      // If no cfg is passed in, use a default empty object so we don't blow up
      // getting at things.
      cfg = cfg || {};

      // If this flag is true, start the application with the console activated.
      var consoleEnabled = this.get('consoleEnabled');

      // Concession to testing, they need muck with console, we cannot as well.
      if (window.mochaPhantomJS === undefined) {
        if (consoleEnabled) {
          consoleManager.native();
        } else {
          consoleManager.noop();
        }
      }

      /**
        Reference to the juju.Cookies instance.

        @property cookieHandler
        @type {juju.Cookies}
        @default null
      */
      this.cookieHandler = null;

      this.renderEnvironment = true;

      // When a user drags a file over the browser we show notifications which
      // are drop targets to illustrate what they can do with their selected
      // file. This array keeps track of those masks and their respective
      // handlers with a { mask: mask, handlers: handlers } format.
      this.dragNotifications = [];

      /**
        The object used for storing a mapping of previously visited user paths
        to the type of entity (model, store). e.g. /u/spinach/ghost would map to
        store.

        @property userPaths
        @type {Map}
      */
      this.userPaths = new Map();

      // Track anonymous mode. This value will be set to true when anonymous
      // navigation is allowed, in essence when a GISF anonymous user is being
      // modeling on a new canvas.
      this.anonymousMode = false;

      const config = window.juju_config || {};
      config.interactiveLogin = this.get('interactiveLogin');

      // Set up a client side database to store state.
      this.db = new models.Database();
      // Create a user store to track authentication details.
      const userCfg = {
        externalAuth: this.get('auth'),
        expiration: window.sessionStorage.getItem('expirationDatetime')
      };
      this.user = this.get('user') || new window.jujugui.User(userCfg);

      // Instantiate a macaroon bakery, which is used to handle the macaroon
      // acquisition over HTTP.
      const webHandler = new Y.juju.environments.web.WebHandler();
      const stateGetter = () => {
        return this.state.current;
      };
      const cookieSetter = (value, callback) => {
        this.get('charmstore').setAuthCookie(value, callback);
      };
      this.bakery = Y.juju.bakeryutils.newBakery(
        config, this.user, stateGetter, cookieSetter, webHandler);

      // Create and set up a new instance of the charmstore.
      this._setupCharmstore(config, window.jujulib.charmstore);
      // Create and set up a new instance of the bundleservice.
      this._setupBundleservice(window.jujulib.bundleservice);
      // Set up a new modelController instance.
      this.modelController = new juju.ModelController({
        db: this.db,
        charmstore: this.get('charmstore')
      });

      let environments = juju.environments;
      // This is wrapped to be called twice.
      // The early return (at line 478) would state from being set (originally
      // at line 514).
      const setUpStateWrapper = function() {
        // If there is no protocol in the baseURL then prefix the origin when
        // creating state.
        let baseURL = cfg.baseUrl;
        if (baseURL.indexOf('://') < 0) {
          baseURL = `${window.location.origin}${baseURL}`;
        }
        this.state = this._setupState(baseURL);
      }.bind(this);
      // Create an environment facade to interact with.
      // Allow "env" as an attribute/option to ease testing.
      var env = this.get('env');
      if (env) {
        setUpStateWrapper();
        this._init(cfg, env, this.get('controllerAPI'));
        return;
      }
      var ecs = new juju.EnvironmentChangeSet({db: this.db});
      this.renderDeploymentBarListener = this._renderDeploymentBar.bind(this);
      document.addEventListener(
        'ecs.changeSetModified', this.renderDeploymentBarListener);
      document.addEventListener(
        'ecs.currentCommitFinished', this.renderDeploymentBarListener);

      if (this.get('gisf')) {
        document.body.classList.add('u-is-beta');
      }
      this.defaultPageTitle = 'Juju GUI';

      let modelOptions = {
        user: this.user,
        ecs: ecs,
        conn: this.get('conn'),
        jujuCoreVersion: this.get('jujuCoreVersion'),
        bundleService: this.get('bundleService')
      };
      let controllerOptions = Object.assign({}, modelOptions);
      modelOptions.webHandler = new environments.web.WebHandler();
      const modelAPI = new environments.GoEnvironment(modelOptions);
      const controllerAPI = new Y.juju.ControllerAPI(controllerOptions);

      // For analytics to work we need to set it up before state is set up.
      // Relies on controllerAPI, is used by state
      this.sendAnalytics = juju.sendAnalyticsFactory(
        controllerAPI,
        window.dataLayer
      );

      setUpStateWrapper();

      this.defaultPageTitle = 'Juju GUI';
      this._init(cfg, modelAPI, controllerAPI);
    },

    /**
      Complete the application initialization.

      @method _init
      @param {Object} cfg Application configuration data.
      @param {Object} modelAPI The environment instance.
      @param {Object} controllerAPI The controller api instance.
    */
    _init: function(cfg, modelAPI, controllerAPI) {
      // Store the initial model UUID.
      const modelUUID = this._getModelUUID();
      this.set('modelUUID', modelUUID);
      const controllerCreds = this.user.controller;
      this.env = modelAPI;
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
      this.controllerAPI = this.setUpControllerAPI(
        controllerAPI,
        controllerCreds.user,
        controllerCreds.password,
        controllerCreds.macaroons,
        entityPromise);
      const getBundleChanges = this.controllerAPI.getBundleChanges.bind(
        this.controllerAPI);
      // Create Romulus API client instances.
      this._setupRomulusServices(window.juju_config, window.jujulib);
      // Set the modelAPI in the model controller here so
      // that we know that it's been setup.
      this.modelController.set('env', this.env);

      // Create a Bundle Importer instance.
      this.bundleImporter = new Y.juju.BundleImporter({
        db: this.db,
        modelAPI: this.env,
        getBundleChanges: getBundleChanges,
        makeEntityModel: Y.juju.makeEntityModel,
        charmstore: this.get('charmstore'),
        hideDragOverNotification: this._hideDragOverNotification.bind(this)
      });

      // Create the ACL object.
      this.acl = new Y.juju.generateAcl(this.controllerAPI, this.env);

      this.changesUtils = window.juju.utils.ChangesUtils;
      this.relationUtils = window.juju.utils.RelationUtils;

      // Listen for window unloads and trigger the unloadWindow function.
      window.onbeforeunload = views.utils.unloadWindow.bind(this);

      // When the environment name becomes available, display it.
      this.env.after('environmentNameChange',
        this.onEnvironmentNameChange, this);
      this.env.after('defaultSeriesChange', this.onDefaultSeriesChange, this);

      // Once we know about MAAS server, update the header accordingly.
      let maasServer = this.env.get('maasServer');
      if (!maasServer && this.controllerAPI) {
        maasServer = this.controllerAPI.get('maasServer');
      }
      if (maasServer) {
        this._displayMaasLink(maasServer);
      } else {
        if (this.controllerAPI) {
          this.controllerAPI.once('maasServerChange', this._onMaasServer, this);
        }
        this.env.once('maasServerChange', this._onMaasServer, this);
      }

      // Feed environment changes directly into the database.
      this.onDeltaBound = this.db.onDelta.bind(this.db);
      document.addEventListener('delta', this.onDeltaBound);

      // Handlers for adding and removing services to the service list.
      this.endpointsController = new juju.EndpointsController({
        db: this.db,
        modelController: this.modelController
      });
      this.endpointsController.bind();

      // Stash the location object so that tests can override it.
      this.location = window.location;

      // When the connection resets, reset the db, re-login (a delta will
      // arrive with successful authentication), and redispatch.
      this.env.after('connectedChange', evt => {
        this._renderProviderLogo();
        if (!evt.newVal) {
          // The model is not connected, do nothing waiting for a reconnection.
          console.log('model disconnected');
          return;
        }
        console.log('model connected');
        this.env.userIsAuthenticated = false;
        // Attempt to log in if we already have credentials available.
        const credentials = this.user.model;
        if (credentials.areAvailable) {
          this.loginToAPIs(null, !!credentials.macaroons, [this.env]);
          return;
        }
      });

      // If the database updates, redraw the view (distinct from model updates).
      // TODO: bound views will automatically update this on individual models.
      this.bound_on_database_changed = this.on_database_changed.bind(this);
      document.addEventListener('update', this.bound_on_database_changed);

      // Watch specific things, (add units), remove db.update above
      // Note: This hides under the flag as tests don't properly clean
      // up sometimes and this binding creates spooky interaction
      // at a distance and strange failures.
      this.db.machines.after(
        ['add', 'remove', '*:change'],
        this.on_database_changed, this);
      this.db.services.after(
        ['add', 'remove', '*:change'],
        this.on_database_changed, this);
      this.db.relations.after(
        ['add', 'remove', '*:change'],
        this.on_database_changed, this);
      this.db.environment.after(
        ['add', 'remove', '*:change'],
        this.on_database_changed, this);
      this.db.units.after(
        ['add', 'remove', '*:change'],
        this.on_database_changed, this);
      this.db.notifications.after('add', this._renderNotifications, this);

      // When someone wants a charm to be deployed they fire an event and we
      // show the charm panel to configure/deploy the service.
      this._onInitiateDeploy = evt => {
        this.deployService(evt.detail.charm, evt.detail.ghostAttributes);
      };
      document.addEventListener('initiateDeploy', this._onInitiateDeploy);

      this._boundAppDragOverHandler = this._appDragOverHandler.bind(this);
      // These are manually detached in the destructor.
      ['dragenter', 'dragover', 'dragleave'].forEach((eventName) => {
        document.addEventListener(
          eventName, this._boundAppDragOverHandler);
      });
      // In Juju >= 2 we connect to the controller and then to the model.
      this.state.bootstrap();
    },

    /**
      Sends the discharge token via POST to the storefront. This is used
      when the GUI is operating in GISF mode, allowing a shared login between
      the GUI and the storefront.

      @method _sendGISFPostBack
    */
    _sendGISFPostBack: function() {
      const dischargeToken = this.user.getMacaroon('identity');
      if (!dischargeToken) {
        console.error('no discharge token in local storage after login');
        return;
      }
      console.log('sending discharge token to storefront');
      const content = 'discharge-token=' + dischargeToken;
      const webhandler = new Y.juju.environments.web.WebHandler();
      webhandler.sendPostRequest(
        '/_login',
        {'Content-Type': 'application/x-www-form-urlencoded'},
        content);
    },

    /**
      Auto log the user into the charm store as part of the login process
      when the GUI operates in a GISF context.
    */
    _ensureLoggedIntoCharmstore: function() {
      if (!this.user.getMacaroon('charmstore')) {
        this.get('charmstore').getMacaroon((err, macaroon) => {
          if (err) {
            console.error(err);
            return;
          }
          this.storeUser('charmstore', true);
          console.log('logged into charmstore');
        });
      }
    },

    /**
      Creates the second instance of the WebSocket for communication with
      the Juju controller if it's necessary. A username and password must be
      supplied if you're connecting to a standalone Juju controller and not to
      one which requires macaroon authentication.

      @method setUpControllerAPI
      @param {Object} controllerAPI Instance of the GoEnvironment class.
      @param {String} user The username if not using macaroons.
      @param {String} password The password if not using macaroons.
      @param {Array} macaroons A list of macaroons that the user has saved.
      @param {Promise} entityPromise A promise with the entity if any.
      @return {environments.GoEnvironment} An instance of the environment class
        with the necessary events attached and values set. Or undefined if
        we're in a legacy juju model and no controllerAPI instance was supplied.
    */
    setUpControllerAPI: function(
      controllerAPI, user, password, macaroons, entityPromise) {
      this.user.controller = { user, password, macaroons };

      this.controllerLoginHandler = evt => {
        const state = this.state;
        const current = this.state.current;
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
        if (this.get('gisf')) {
          this._sendGISFPostBack();
          this._ensureLoggedIntoCharmstore();
        }

        // If state has a `next` property then that overrides all defaults.
        const specialState = current.special;
        const next = specialState && specialState.next;
        const dd = specialState && specialState.dd;

        if (state.current.root === 'login') {
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
              // The root at this point will be 'login' and because the `next`
              // url may not explicitly define a new root path we have to set it
              // to null to clear 'login' from the url.
              if (!newState.root) {
                newState.root = null;
              }
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
        if (this.env.get('modelUUID')) {
          return;
        }
        const modelUUID = this._getModelUUID();
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
            this.get('gisf')
          ) {
            newState.profile = this.user.displayName;
          }
          state.changeState(newState);
        }
      };
      document.addEventListener('login', this.controllerLoginHandler);

      controllerAPI.after('connectedChange', evt => {
        if (!evt.newVal) {
          // The controller is not connected, do nothing waiting for a
          // reconnection.
          console.log('controller disconnected');
          return;
        }
        console.log('controller connected');
        const creds = this.user.controller;
        const gisf = this.get('gisf');
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
        if (!gisf) {
          this.loginToAPIs(null, false, [this.controllerAPI]);
        }
      });
      controllerAPI.set('socket_url',
        this.createSocketURL(this.get('controllerSocketTemplate')));
      return controllerAPI;
    },

    /**
      Handles logging into both the env and controller api WebSockets.

      @method loginToAPIs
      @param {Object} credentials The credentials for the controller APIs.
      @param {Boolean} useMacaroons Whether to use macaroon based auth
        (macaraq) or simple username/password auth.
      @param {Array} apis The apis instances that we should be logging into.
        Defaults to [this.controllerAPI, this.env].
    */
    loginToAPIs: function(
      credentials, useMacaroons, apis=[this.controllerAPI, this.env]) {
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
    },

    /**
      Callback handler for the API loginWithMacaroon method which handles
      the "redirection required" error message.

      @method _apiLoginHandler
      @param {Object} api The API that the user is attempting to log into.
        ex) this.env or this.controllerAPI
      @param {String} err The login error message, if any.
    */
    _apiLoginHandler: function(api, err) {
      if (this.state.current.root === 'login') {
        this.state.changeState({root: null});
      }
      if (!err) {
        return;
      }
      if (!views.utils.isRedirectError(err)) {
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
        this.switchEnv(this.createSocketURL(
          this.get('socketTemplate'),
          this.get('modelUUID'), publicHost.value, publicHost.port), null,
        null, null, true, false);
      });
    },

    /**
      Renders the login component.

      @method _renderLogin
      @param {String} err Possible authentication error, or null if no error
        message must be displayed.
    */
    _renderLogin: function(err) {
      document.getElementById('loading-message').style.display = 'none';
      // XXX j.c.sackett 2017-01-30 Right now USSO link is using
      // loginToController, while loginToAPIs is used by the login form.
      // We want to use loginToAPIs everywhere since it handles more.
      const loginToController =
        this.controllerAPI.loginWithMacaroon.bind(
          this.controllerAPI, this.bakery);
      const controllerIsConnected = () => {
        return this.controllerAPI && this.controllerAPI.get('connected');
      };
      ReactDOM.render(
        <window.juju.components.Login
          controllerIsConnected={controllerIsConnected}
          errorMessage={err}
          gisf={this.get('gisf')}
          loginToAPIs={this.loginToAPIs.bind(this)}
          loginToController={loginToController} />,
        document.getElementById('login-container'));
    },

    /**
      Renders the Log out component or log in link depending on the
      environment the GUI is executing in.
    */
    _renderUserMenu: function() {
      const controllerAPI = this.controllerAPI;
      const linkContainerId = 'profile-link-container';
      const linkContainer = document.getElementById(linkContainerId);
      if (!linkContainer) {
        console.error(`no linkContainerId: ${linkContainerId}`);
        return;
      }
      const charmstore = this.get('charmstore');
      const bakery = this.bakery;
      const USSOLoginLink = (<window.juju.components.USSOLoginLink
        displayType={'text'}
        loginToController={controllerAPI.loginWithMacaroon.bind(
          controllerAPI, bakery)}
      />);

      let logoutUrl = '/logout';
      if (window.juju_config.baseUrl) {
        logoutUrl = window.juju_config.baseUrl.replace(/\/?$/, logoutUrl);
      }

      const doCharmstoreLogout = () => {
        return this.getUser('charmstore') && !this.get('gisf');
      };
      const LogoutLink = (<window.juju.components.Logout
        charmstoreLogoutUrl={charmstore.getLogoutUrl()}
        doCharmstoreLogout={doCharmstoreLogout}
        locationAssign={window.location.assign.bind(window.location)}
        logoutUrl={logoutUrl}
        // If the charmbrowser is open then don't show the logout link.
        visible={!this.state.current.store}
      />);

      const navigateUserProfile = () => {
        const username = this.user.displayName;
        if (!username) {
          return;
        }
        views.utils.showProfile(
          this.env && this.env.get('ecs'),
          this.state.changeState.bind(this.state),
          username);
      };
      const navigateUserAccount = () => {
        const username = this.user.displayName;
        if (!username) {
          return;
        }
        views.utils.showAccount(
          this.env && this.env.get('ecs'),
          this.state.changeState.bind(this.state));
      };

      ReactDOM.render(<window.juju.components.UserMenu
        controllerAPI={controllerAPI}
        LogoutLink={LogoutLink}
        navigateUserAccount={navigateUserAccount}
        navigateUserProfile={navigateUserProfile}
        USSOLoginLink={USSOLoginLink}
      />, linkContainer);
    },

    /**
      Renders the user profile component.

      @method _renderUserProfile
      @param {Object} state - The app state.
      @param {Function} next - Call to continue dispatching.
    */
    _renderUserProfile: function(state, next) {
      ReactDOM.render(
        <window.juju.components.Profile />,
        document.getElementById('top-page-container'));
    },

    /**
      Generate a user info object.
      @param {Object} state - The application state.
    */
    _getUserInfo: function(state) {
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
        const users = this.get('users') || {};
        userInfo.external = users.charmstore ? users.charmstore.user : null;
      }
      return userInfo;
    },

    /**
      The cleanup dispatcher for the user profile path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearUserProfile: function(state, next) {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('top-page-container'));
      next();
    },

    /**
      Renders the ISV profile component.

      @method _renderISVProfile
    */
    _renderISVProfile: function() {
      ReactDOM.render(
        <window.juju.components.ISVProfile
          d3={d3} />,
        document.getElementById('top-page-container'));
      // The model name should not be visible when viewing the profile.
      this._renderBreadcrumb({ showEnvSwitcher: false });
    },

    /**
      Renders the account component.

      @method _renderAccount
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _renderAccount: function(state, next) {
      const controllerAPI = this.controllerAPI;
      if (!controllerAPI || !controllerAPI.userIsAuthenticated) {
        // If the controller isn't ready yet then don't render anything.
        return;
      }
      // When going to the account view, we are theoretically no longer
      // connected to any model.
      this.set('modelUUID', null);
      ReactDOM.render(
        <window.juju.components.Account
          acl={this.acl}
          addAddress={
            this.payment && this.payment.addAddress.bind(this.payment)}
          addBillingAddress={
            this.payment && this.payment.addBillingAddress.bind(this.payment)}
          addNotification={
            this.db.notifications.add.bind(this.db.notifications)}
          controllerIsReady={this._controllerIsReady.bind(this)}
          createCardElement={
            this.stripe && this.stripe.createCardElement.bind(this.stripe)}
          createPaymentMethod={
            this.payment && this.payment.createPaymentMethod.bind(this.payment)}
          createToken={this.stripe && this.stripe.createToken.bind(this.stripe)}
          createUser={
            this.payment && this.payment.createUser.bind(this.payment)}
          generateCloudCredentialName={views.utils.generateCloudCredentialName}
          getUser={this.payment && this.payment.getUser.bind(this.payment)}
          getCharges={
            this.payment && this.payment.getCharges.bind(this.payment)}
          getCloudCredentialNames={
            controllerAPI.getCloudCredentialNames.bind(controllerAPI)}
          getCloudProviderDetails={views.utils.getCloudProviderDetails.bind(
            views.utils)}
          getCountries={
            this.payment && this.payment.getCountries.bind(this.payment)}
          getReceipt={
            this.payment && this.payment.getReceipt.bind(this.payment)}
          listClouds={controllerAPI.listClouds.bind(controllerAPI)}
          removeAddress={
            this.payment && this.payment.removeAddress.bind(this.payment)}
          removeBillingAddress={
            this.payment && this.payment.removeBillingAddress.bind(
              this.payment)}
          removePaymentMethod={
            this.payment && this.payment.removePaymentMethod.bind(this.payment)}
          revokeCloudCredential={
            controllerAPI.revokeCloudCredential.bind(controllerAPI)}
          sendAnalytics={this.sendAnalytics}
          showPay={window.juju_config.payFlag || false}
          updateCloudCredential={
            controllerAPI.updateCloudCredential.bind(controllerAPI)}
          updateAddress={
            this.payment && this.payment.updateAddress.bind(this.payment)}
          updateBillingAddress={
            this.payment && this.payment.updateBillingAddress.bind(
              this.payment)}
          updatePaymentMethod={
            this.payment && this.payment.updatePaymentMethod.bind(this.payment)}
          user={this.user.controller.user}
          userInfo={this._getUserInfo(state)}
          validateForm={views.utils.validateForm.bind(views.utils)} />,
        document.getElementById('top-page-container'));
      next();
    },

    /**
      The cleanup dispatcher for the account path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearAccount: function(state, next) {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('top-page-container'));
      next();
    },

    /**
      Renders the Environment Size Display component to the page in the
      designated element.

      @method _renderEnvSizeDisplay
      @param {Integer} serviceCount The serviceCount to display.
      @param {Integer} machineCount The machineCount to display.
    */
    _renderEnvSizeDisplay: function(serviceCount=0, machineCount=0) {
      ReactDOM.render(
        <window.juju.components.EnvSizeDisplay
          appState={this.state}
          machineCount={machineCount}
          pluralize={views.utils.pluralize.bind(this)}
          serviceCount={serviceCount} />,
        document.getElementById('env-size-display-container'));
    },

    /**
      Renders the Header Search component to the page in the
      designated element.

      @method _renderHeaderSearch
    */
    _renderHeaderSearch: function() {
      ReactDOM.render(
        <window.juju.components.HeaderSearch
          appState={this.state} />,
        document.getElementById('header-search-container'));
    },

    _renderHeaderHelp: function() {
      ReactDOM.render(
        <window.juju.components.HeaderHelp
          appState={this.state}
          gisf={this.get('gisf')}
          displayShortcutsModal={this._displayShortcutsModal.bind(this)}
          user={this.user} />,
        document.getElementById('header-help'));
    },

    _renderHeaderLogo: function() {
      const userName = this.user.displayName;
      const gisf = this.get('gisf');
      const homePath = gisf ? '/' :
        this.state.generatePath({profile: userName});
      const showProfile = () =>
        this.state.changeState({
          profile: userName,
          model: null,
          store: null,
          root: null,
          search: null,
          account: null,
          user: null
        });
      ReactDOM.render(
        <window.juju.components.HeaderLogo
          gisf={gisf}
          homePath={homePath}
          showProfile={showProfile}
        />,
        document.getElementById('header-logo'));
    },

    /**
      Renders the notification component to the page in the designated element.

      @method _renderNotifications
    */
    _renderNotifications: function(e) {
      var notification = null;
      if (e && e.details) {
        notification = e.details[0].model.getAttrs();
      }
      ReactDOM.render(
        <window.juju.components.NotificationList
          notification={notification}/>,
        document.getElementById('notifications-container'));
    },

    /**
      Renders the Deployment component to the page in the
      designated element.

      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _renderDeployment: function(state, next) {
      const env = this.env;
      const db = this.db;
      const connected = this.env.get('connected');
      const modelName = env.get('environmentName') || 'mymodel';
      const utils = views.utils;
      const ecs = env.get('ecs');
      const currentChangeSet = ecs.getCurrentChangeSet();
      const deployState = state.gui.deploy;
      const ddData = deployState ? JSON.parse(deployState) : null;
      if (Object.keys(currentChangeSet).length === 0 && !ddData) {
        // If there are no changes then close the deployment flow. This is to
        // prevent showing the deployment flow if the user clicks back in the
        // browser or navigates directly to the url. This changeState needs to
        // happen in app.js, not the component otherwise it will have to try and
        // interrupt the mount to unmount the component.
        this.state.changeState({
          gui: {
            deploy: null
          }
        });
        return;
      }
      const changesUtils = this.changesUtils;
      const controllerAPI = this.controllerAPI;
      const services = db.services;
      // Auto place the units. This is probably not the best UX, but is required
      // to display the machines in the deployment flow.
      this._autoPlaceUnits();
      let cloud = env.get('providerType');
      if (cloud) {
        cloud = {
          cloudType: cloud,
          name: env.get('cloud')
        };
      }
      const getUserName = () => {
        return this.user.username;
      };
      const loginToController = controllerAPI.loginWithMacaroon.bind(
        controllerAPI, this.bakery);
      const charmstore = this.get('charmstore');
      const isLoggedIn = () => this.controllerAPI.userIsAuthenticated;
      ReactDOM.render(
        <window.juju.components.DeploymentFlow
          acl={this.acl}
          addAgreement={this.terms.addAgreement.bind(this.terms)}
          addNotification={db.notifications.add.bind(db.notifications)}
          applications={services.toArray()}
          charmstore={charmstore}
          changesFilterByParent={
            changesUtils.filterByParent.bind(changesUtils, currentChangeSet)}
          changeState={this.state.changeState.bind(this.state)}
          cloud={cloud}
          controllerIsReady={this._controllerIsReady.bind(this)}
          createToken={this.stripe && this.stripe.createToken.bind(this.stripe)}
          createCardElement={
            this.stripe && this.stripe.createCardElement.bind(this.stripe)}
          createUser={
            this.payment && this.payment.createUser.bind(this.payment)}
          credential={env.get('credential')}
          changes={currentChangeSet}
          charmsGetById={db.charms.getById.bind(db.charms)}
          deploy={utils.deploy.bind(utils, this)}
          sendAnalytics={this.sendAnalytics}
          setModelName={env.set.bind(env, 'environmentName')}
          formatConstraints={utils.formatConstraints.bind(utils)}
          generateAllChangeDescriptions={
            changesUtils.generateAllChangeDescriptions.bind(
              changesUtils, services, db.units)}
          generateCloudCredentialName={utils.generateCloudCredentialName}
          generateMachineDetails={
            utils.generateMachineDetails.bind(
              utils, env.genericConstraints, db.units)}
          generatePath={this.state.generatePath.bind(this.state)}
          getAgreementsByTerms={
            this.terms.getAgreementsByTerms.bind(this.terms)}
          isLoggedIn={isLoggedIn}
          getCloudCredentials={
            controllerAPI.getCloudCredentials.bind(controllerAPI)}
          getCloudCredentialNames={
            controllerAPI.getCloudCredentialNames.bind(controllerAPI)}
          getCloudProviderDetails={utils.getCloudProviderDetails.bind(utils)}
          getCurrentChangeSet={ecs.getCurrentChangeSet.bind(ecs)}
          getCountries={
            this.payment && this.payment.getCountries.bind(this.payment)
              || null}
          getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
          getEntity={charmstore.getEntity.bind(charmstore)}
          getUser={this.payment && this.payment.getUser.bind(this.payment)}
          getUserName={getUserName}
          gisf={this.get('gisf')}
          groupedChanges={changesUtils.getGroupedChanges(currentChangeSet)}
          listBudgets={this.plans.listBudgets.bind(this.plans)}
          listClouds={controllerAPI.listClouds.bind(controllerAPI)}
          listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
          loginToController={loginToController}
          makeEntityModel={Y.juju.makeEntityModel}
          modelCommitted={connected}
          modelName={modelName}
          ddData={ddData}
          profileUsername={this._getUserInfo(state).profile}
          region={env.get('region')}
          renderMarkdown={marked}
          servicesGetById={services.getById.bind(services)}
          showPay={window.juju_config.payFlag || false}
          showTerms={this.terms.showTerms.bind(this.terms)}
          updateCloudCredential={
            controllerAPI.updateCloudCredential.bind(controllerAPI)}
          validateForm={utils.validateForm.bind(utils)}
          withPlans={false} />,
        document.getElementById('deployment-container'));
    },

    /**
      The cleanup dispatcher for the deployment flow state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearDeployment: function(state, next) {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('deployment-container'));
      next();
    },

    /**
      Renders the Deployment component to the page in the
      designated element.

      @method _renderDeploymentBar
    */
    _renderDeploymentBar: function() {
      var env = this.env;
      var ecs = env.get('ecs');
      var db = this.db;
      var services = db.services;
      var servicesArray = services.toArray();
      var machines = db.machines.toArray();
      var units = db.units;
      var changesUtils = this.changesUtils;
      ReactDOM.render(
        <window.juju.components.DeploymentBar
          acl={this.acl}
          changeState={this.state.changeState.bind(this.state)}
          currentChangeSet={ecs.getCurrentChangeSet()}
          generateChangeDescription={
            changesUtils.generateChangeDescription.bind(
              changesUtils, services, units)}
          hasEntities={servicesArray.length > 0 || machines.length > 0}
          modelCommitted={this.env.get('connected')}
          sendAnalytics={this.sendAnalytics} />,
        document.getElementById('deployment-bar-container'));
    },

    /**
      Report whether the controller API connection is ready, connected and
      authenticated.

      @return {Boolean} Whether the controller is ready.
    */
    _controllerIsReady: function() {
      return !!(
        this.controllerAPI &&
        this.controllerAPI.get('connected') &&
        this.controllerAPI.userIsAuthenticated
      );
    },

    /**
      Display or hide the sharing modal.

      @method _sharingVisibility
      @param {Boolean} visibility Controls whether to show (true) or hide
                       (false); defaults to true.
    */
    _sharingVisibility: function(visibility = true) {
      const sharing = document.getElementById('sharing-container');
      if (!visibility) {
        ReactDOM.unmountComponentAtNode(sharing);
        return;
      }
      const db = this.db;
      const env = this.env;
      const grantRevoke = (action, username, access, callback) => {
        if (this.get('gisf') && username.indexOf('@') === -1) {
          username += '@external';
        }
        action(env.get('modelUUID'), [username], access, callback);
      };
      const controllerAPI = this.controllerAPI;
      const grantAccess = controllerAPI.grantModelAccess.bind(controllerAPI);
      const revokeAccess = controllerAPI.revokeModelAccess.bind(controllerAPI);
      ReactDOM.render(
        <window.juju.components.Sharing
          addNotification={db.notifications.add.bind(db.notifications)}
          canShareModel={this.acl.canShareModel()}
          closeHandler={this._sharingVisibility.bind(this, false)}
          getModelUserInfo={env.modelUserInfo.bind(env)}
          grantModelAccess={grantRevoke.bind(this, grantAccess)}
          humanizeTimestamp={views.utils.humanizeTimestamp}
          revokeModelAccess={grantRevoke.bind(this, revokeAccess)}
        />, sharing);
    },

    /**
      Renders the model action components to the page in the designated
      element.

      @method _renderModelActions
    */
    _renderModelActions: function() {
      const db = this.db;
      const utils = views.utils;
      const env = this.env;
      ReactDOM.render(
        <window.juju.components.ModelActions
          acl={this.acl}
          appState={this.state}
          changeState={this.state.changeState.bind(this.state)}
          exportEnvironmentFile={
            utils.exportEnvironmentFile.bind(utils, db)}
          hideDragOverNotification={this._hideDragOverNotification.bind(this)}
          importBundleFile={this.bundleImporter.importBundleFile.bind(
            this.bundleImporter)}
          renderDragOverNotification={
            this._renderDragOverNotification.bind(this)}
          sharingVisibility={this._sharingVisibility.bind(this)}
          loadingModel={env.loading}
          userIsAuthenticated={env.userIsAuthenticated} />,
        document.getElementById('model-actions-container'));
    },

    /**
      Renders the logo for the current cloud provider.

      @method _renderProviderLogo
    */
    _renderProviderLogo: function() {
      const container = document.getElementById('provider-logo-container');
      const cloudProvider = this.env.get('providerType');
      let providerDetails = views.utils.getCloudProviderDetails(cloudProvider);
      const currentState = this.state.current || {};
      const isDisabled = (
        // There is no provider.
        !cloudProvider ||
        // It's not possible to get provider details.
        !providerDetails ||
        // We are in the profile page.
        currentState.profile ||
        // We are in the account page.
        currentState.root === 'account'
      );
      const classes = classNames(
        'provider-logo',
        {
          'provider-logo--disabled': isDisabled,
          [`provider-logo--${cloudProvider}`]: cloudProvider
        }
      );
      const scale = 0.65;
      if (!providerDetails) {
        // It's possible that the GUI is being run on a provider that we have
        // not yet setup in the cloud provider details.
        providerDetails = {};
      }
      ReactDOM.render(
        <div className={classes}>
          <window.juju.components.SvgIcon
            height={providerDetails.svgHeight * scale}
            name={providerDetails.id || ''}
            width={providerDetails.svgWidth * scale} />
        </div>,
        container);
    },

    /**
      Renders the zoom component to the page in the designated element.

      @method _renderZoom
    */
    _renderZoom: function() {
      ReactDOM.render(
        <window.juju.components.Zoom
          topo={this.views.environment.instance.topo} />,
        document.getElementById('zoom-container'));
    },

    /**
      Renders the Added Services component to the page in the appropriate
      element.

      @method _renderAddedServices
      @param {String} hoveredId An id for a service.
    */
    _renderAddedServices: function(hoveredId) {
      const instance = this.views.environment.instance;
      if (!instance) {
        // TODO frankban: investigate in what cases instance is undefined on
        // the environment object. Is this some kind of race?
        return;
      }
      const topo = instance.topo;
      const ServiceModule = topo.modules.ServiceModule;
      // Set up a handler for syncing the service token hover. This needs to be
      // attached only when the component is visible otherwise the added
      // services component will try to render if the user hovers a service
      // when they have the service details open.
      if (this.hoverService) {
        document.removeEventListener('topo.hoverService', this.hoverService);
      }
      this.hoverService = evt => {
        this._renderAddedServices(evt.detail.id);
      };
      document.addEventListener('topo.hoverService', this.hoverService);
      // Deselect the active service token. This needs to happen so that when a
      // user closes the service details the service token deactivates.
      ServiceModule.deselectNodes();
      const db = this.db;
      ReactDOM.render(
        <window.juju.components.Panel
          instanceName="inspector-panel"
          visible={db.services.size() > 0}>
          <window.juju.components.AddedServicesList
            services={db.services}
            hoveredId={hoveredId}
            updateUnitFlags={db.updateUnitFlags.bind(db)}
            findRelatedServices={db.findRelatedServices.bind(db)}
            findUnrelatedServices={db.findUnrelatedServices.bind(db)}
            getUnitStatusCounts={views.utils.getUnitStatusCounts}
            hoverService={ServiceModule.hoverService.bind(ServiceModule)}
            panToService={ServiceModule.panToService.bind(ServiceModule)}
            changeState={this.state.changeState.bind(this.state)} />
        </window.juju.components.Panel>,
        document.getElementById('inspector-container'));
    },

    /**
      The cleanup dispatcher for the inspector state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearInspector: function(state, next) {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('inspector-container'));
      next();
    },

    /**
      Renders the Inspector component to the page.
      @param {Object} state - The app state.
      @param {Function} next - Call to continue dispatching.
    */
    _renderInspector: function(state, next) {
      const relationUtils = this.relationUtils;
      const utils = views.utils;
      const instance = this.views.environment.instance;
      if (!instance) {
        return;
      }
      const topo = instance.topo;
      const charmstore = this.get('charmstore');
      let inspector = {};
      const inspectorState = state.gui.inspector;
      const service = this.db.services.getById(inspectorState.id);
      const localType = inspectorState.localType;
      // If there is a hoverService event listener then we need to detach it
      // when rendering the inspector.
      if (this.hoverService) {
        document.removeEventListener('topo.hoverService', this.hoverService);
      }
      const model = this.env;
      const db = this.db;
      // If the url was provided with a service id which isn't in the localType
      // db then change state back to the added services list. This usually
      // happens if the user tries to visit the inspector of a ghost service
      // id which no longer exists.
      if (service) {
        // Select the service token.
        topo.modules.ServiceModule.selectService(service.get('id'));
        const charm = db.charms.getById(service.get('charm'));
        const relatableApplications = relationUtils.getRelatableApplications(
          db, models.getEndpoints(service, this.endpointsController));
        const ecs = model.get('ecs');
        const addCharm = (url, callback, options) => {
          model.addCharm(url, charmstore, callback, options);
        };
        inspector = (
          <window.juju.components.Inspector
            acl={this.acl}
            addCharm={addCharm}
            addGhostAndEcsUnits={utils.addGhostAndEcsUnits.bind(
              this, db, model, service)}
            addNotification={db.notifications.add.bind(db.notifications)}
            appState={this.state}
            charm={charm}
            clearState={utils.clearState.bind(this, topo)}
            createMachinesPlaceUnits={utils.createMachinesPlaceUnits.bind(
              this, db, model, service)}
            createRelation={relationUtils.createRelation.bind(this, db, model)}
            destroyService={utils.destroyService.bind(
              this, db, model, service)}
            destroyRelations={this.relationUtils.destroyRelations.bind(
              this, db, model)}
            destroyUnits={utils.destroyUnits.bind(this, model)}
            displayPlans={utils.compareSemver(
              this.get('jujuCoreVersion'), '2') > -1}
            getCharm={model.get_charm.bind(model)}
            getUnitStatusCounts={utils.getUnitStatusCounts}
            getYAMLConfig={utils.getYAMLConfig.bind(this)}
            envResolved={model.resolved.bind(model)}
            exposeService={model.expose.bind(model)}
            getAvailableEndpoints={relationUtils.getAvailableEndpoints.bind(
              this, this.endpointsController, db, models.getEndpoints)}
            getAvailableVersions={charmstore.getAvailableVersions.bind(
              charmstore)}
            getServiceById={db.services.getById.bind(db.services)}
            getServiceByName={db.services.getServiceByName.bind(db.services)}
            linkify={utils.linkify}
            modelUUID={this.get('modelUUID') || ''}
            providerType={model.get('providerType') || ''}
            relatableApplications={relatableApplications}
            service={service}
            serviceRelations={
              relationUtils.getRelationDataForService(db, service)}
            setCharm={model.setCharm.bind(model)}
            setConfig={model.set_config.bind(model)}
            showActivePlan={this.plans.showActivePlan.bind(this.plans)}
            showPlans={window.juju_config.plansFlag || false}
            unexposeService={model.unexpose.bind(model)}
            unplaceServiceUnits={ecs.unplaceServiceUnits.bind(ecs)}
            updateServiceUnitsDisplayname={
              db.updateServiceUnitsDisplayname.bind(db)}
          />
        );
      } else if (localType && window.localCharmFile) {
        // When dragging a local charm zip over the canvas it animates the
        // drag over notification which needs to be closed when the inspector
        // is opened.
        this._hideDragOverNotification();
        const localCharmHelpers = juju.localCharmHelpers;
        inspector = (
          <window.juju.components.LocalInspector
            acl={this.acl}
            changeState={this.state.changeState.bind(this.state)}
            file={window.localCharmFile}
            localType={localType}
            services={db.services}
            series={utils.getSeriesList()}
            upgradeServiceUsingLocalCharm={
              localCharmHelpers.upgradeServiceUsingLocalCharm.bind(
                this, model, db)}
            uploadLocalCharm={
              localCharmHelpers.uploadLocalCharm.bind(
                this, model, db)}
          />
        );
      } else {
        this.state.changeState({gui: {inspector: null}});
        return;
      }
      ReactDOM.render(
        <window.juju.components.Panel
          instanceName="inspector-panel"
          visible={true}>
          {inspector}
        </window.juju.components.Panel>,
        document.getElementById('inspector-container'));
      next();
    },

    /**
      Renders the Charmbrowser component to the page in the designated element.
      @param {Object} state - The app state.
      @param {Function} next - Call to continue dispatching.
    */
    _renderCharmbrowser: function(state, next) {
      const utils = views.utils;
      const charmstore = this.get('charmstore');
      // Configure syntax highlighting for the markdown renderer.
      marked.setOptions({
        highlight: function(code, lang) {
          const language = Prism.languages[lang];
          if (language) {
            return Prism.highlight(code, language);
          }
        }
      });
      /*
       Retrieve from the charm store information on the charm or bundle with
       the given new style id.

       @returns {Object} The XHR reference for the getEntity call.
      */
      const getEntity = (id, callback) => {
        let url;
        try {
          url = window.jujulib.URL.fromString(id);
        } catch(err) {
          callback(err, {});
          return;
        }
        // Get the entity and return the XHR.
        return charmstore.getEntity(url.legacyPath(), callback);
      };
      const getModelName = () => this.env.get('environmentName');
      ReactDOM.render(
        <window.juju.components.Charmbrowser
          acl={this.acl}
          apiUrl={charmstore.url}
          charmstoreSearch={charmstore.search.bind(charmstore)}
          deployTarget={this.deployTarget.bind(this, charmstore)}
          series={utils.getSeriesList()}
          importBundleYAML={this.bundleImporter.importBundleYAML.bind(
            this.bundleImporter)}
          getBundleYAML={charmstore.getBundleYAML.bind(charmstore)}
          getEntity={getEntity}
          getFile={charmstore.getFile.bind(charmstore)}
          getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
          getModelName={getModelName}
          gisf={this.get('gisf')}
          listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
          renderMarkdown={marked}
          deployService={this.deployService.bind(this)}
          appState={this.state}
          utils={utils}
          staticURL={window.juju_config.staticURL}
          charmstoreURL={
            utils.ensureTrailingSlash(window.juju_config.charmstoreURL)}
          apiVersion={window.jujulib.charmstoreAPIVersion}
          addNotification={
            this.db.notifications.add.bind(this.db.notifications)}
          makeEntityModel={Y.juju.makeEntityModel}
          setPageTitle={this.setPageTitle.bind(this)}
          showTerms={this.terms.showTerms.bind(this.terms)}
          urllib={window.jujulib.URL}
        />,
        document.getElementById('charmbrowser-container'));
      next();
    },

    /**
      The cleanup dispatcher for the store state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearCharmbrowser: function(state, next) {
      if (state.search || state.store) {
        // State calls the cleanup methods on every dispatch even if the state
        // object exists between calls. Maybe this should be updated in state
        // but for now if we know that the new state still contains the
        // charmbrowser then just let the subsequent render method update
        // the rendered component.
        return;
      }
      ReactDOM.unmountComponentAtNode(
        document.getElementById('charmbrowser-container'));
      next();
    },

    /**
      The cleanup dispatcher for the root state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearLogin: function(state, next) {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('login-container'));
      if (next) {
        next();
      }
    },

    _displayShortcutsModal: function() {
      ReactDOM.render(
        <window.juju.components.ModalShortcuts
          closeModal={this._clearShortcutsModal.bind(this)}
          guiVersion={window.GUI_VERSION.version}
          keybindings={this.keybindings} />,
        document.getElementById('modal-shortcuts'));
    },

    _displaySettingsModal: function() {
      ReactDOM.render(
        <window.juju.components.ModalGUISettings
          closeModal={this._clearSettingsModal.bind(this)}
          localStorage={localStorage} />,
        document.getElementById('modal-gui-settings'));
    },

    /**
      The cleanup dispatcher keyboard shortcuts modal.
    */
    _clearShortcutsModal: function() {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('modal-shortcuts'));
    },

    /**
      The cleanup dispatcher global settings modal.
    */
    _clearSettingsModal: function() {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('modal-gui-settings'));
    },

    /**
      Handles rendering and/or updating the machine UI component.
      @param {Object} state - The app state.
      @param {Function} next - Call to continue dispatching.
    */
    _renderMachineView: function(state, next) {
      const db = this.db;
      const ecs = this.env.get('ecs');
      const utils = views.utils;
      const genericConstraints = this.env.genericConstraints;
      ReactDOM.render(
        <window.juju.components.MachineView
          acl={this.acl}
          addGhostAndEcsUnits={utils.addGhostAndEcsUnits.bind(
            this, this.db, this.env)}
          autoPlaceUnits={this._autoPlaceUnits.bind(this)}
          changeState={this.state.changeState.bind(this.state)}
          createMachine={this._createMachine.bind(this)}
          destroyMachines={this.env.destroyMachines.bind(this.env)}
          environmentName={db.environment.get('name') || ''}
          generateMachineDetails={
            utils.generateMachineDetails.bind(
              utils, genericConstraints, db.units)}
          machines={db.machines}
          parseConstraints={
            utils.parseConstraints.bind(utils, genericConstraints)}
          placeUnit={this.env.placeUnit.bind(this.env)}
          providerType={this.env.get('providerType') || ''}
          removeUnits={this.env.remove_units.bind(this.env)}
          services={db.services}
          series={window.jujulib.CHARM_SERIES}
          units={db.units}
          updateMachineConstraints={ecs.updateMachineConstraints.bind(ecs)}
          updateMachineSeries={ecs.updateMachineSeries.bind(ecs)} />,
        document.getElementById('machine-view'));
      next();
    },

    /**
      The cleanup dispatcher for the machines state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearMachineView: function(state, next) {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('machine-view'));
      next();
    },

    /**
      Renders the mask and animations for the drag over notification for when
      a user drags a yaml file or zip file over the canvas.

      @method _renderDragOverNotification
      @param {Boolean} showIndicator
    */
    _renderDragOverNotification: function(showIndicator = true) {
      this.views.environment.instance.fadeHelpIndicator(showIndicator);
      ReactDOM.render(
        <window.juju.components.ExpandingProgress />,
        document.getElementById('drag-over-notification-container'));
    },

    /**
      Handles the state changes for the model key.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _handleModelState: function(state, next) {
      const env = this.env;
      if (this.get('modelUUID') !== state.model.uuid ||
          (!env.get('connected') && !env.get('connecting'))) {
        this._switchModelToUUID(state.model.uuid);
      }
      next();
    },

    /**
      Switches to the specified UUID, or if none is provided then
      switches to the unconnected mode.
      @param {String} uuid The uuid of the model to switch to, or none.
    */
    _switchModelToUUID: function(uuid) {
      let socketURL = undefined;
      if (uuid) {
        console.log('switching to model: ', uuid);
        this.set('modelUUID', uuid);
        socketURL = this.createSocketURL(this.get('socketTemplate'), uuid);
      } else {
        console.log('switching to disconnected mode');
        this.set('modelUUID', null);
      }
      this.switchEnv(socketURL);
    },

    /**
      Determines if the user state is a store path or a model path.
      @param {String} userState The state value for the 'user' key.
      @return {Promise} A promise with the charmstore entity if one exists.
    */
    _fetchEntityFromUserState: function(userState) {
      const userPaths = this.userPaths;
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
        this.get('charmstore').getEntity(
          legacyPath, (err, entityData) => {
            if (err) {
              console.error(err);
              reject(userState);
              return;
            }
            resolve(userState);
          });
      });
      userPaths.set(userState, {promise:entityPromise});
      return entityPromise;
    },

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
    _listAndSwitchModel: function(modelPath, modelUUID) {
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
        if (model && this.env.get('modelUUID') === model.uuid) {
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
    },

    /**
      Provided an entityPromise, attaches handlers for the resolve and reject
      cases. If resolved it changes state to the entity found, if rejected
      calls _listAndSwitchModel with the possible model name.

      @param {Promise} entityPromise A promise containing the result of a
        getEntity charmstore call.
    */
    _disambiguateUserState: function(entityPromise) {
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
    },

    /**
      Handle the request to display the user entity state.

      @method _handleUserEntity
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _handleUserEntity: function(state, next) {
      this._disambiguateUserState(
        this._fetchEntityFromUserState(state.user));
    },

    /**
      The cleanup dispatcher for the user entity state path. The store will be
      mounted if the path was for a bundle or charm. If the entity was a model
      we don't need to do anything.

      @method _clearUserEntity
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearUserEntity: function(state, next) {
      const container = document.getElementById('charmbrowser-container');
      // The charmbrowser will only be mounted if the entity is a charm or
      // bundle.
      if (container.childNodes.length > 0) {
        ReactDOM.unmountComponentAtNode(container);
      }
      next();
    },

    /**
    Ensures the controller is connected on dispatch. Does nothing if the
   controller is already connecting/connected or if we're trying to disconnect.
   @param {Object} state - The application state.
   @param {Function} next - Run the next route handler, if any.
   */
    _ensureControllerConnection: function(state, next) {
      if (
        !this.controllerAPI.get('connecting') &&
        !this.controllerAPI.get('connected')
      ) {
        this.controllerAPI.connect();
      }
      next();
    },

    /**
      Creates an instance of the State and registers the necessary dispatchers.
      @param {String} baseURL - The path the application is served from.
      @return {Object} The state instance.
    */
    _setupState: function(baseURL) {
      const state = new window.jujugui.State({
        baseURL: baseURL,
        seriesList: window.jujulib.SERIES,
        sendAnalytics: this.sendAnalytics
      });
      state.register([
        ['*', this._ensureControllerConnection.bind(this)],
        ['*', this.authorizeCookieUse.bind(this)],
        ['*', this.checkUserCredentials.bind(this)],
        ['*', this.show_environment.bind(this)],
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
        ['hash'],
        // special dd is handled by the root dispatcher as it requires /new
        // for now.
        ['special.dd']
      ]);

      return state;
    },

    _clearAllGUIComponents: function(state, next) {
      const noop = () => {};
      this._clearMachineView(state, noop);
      this._clearDeployment(state, noop);
      this._clearInspector(state, noop);
    },

    /**
      The dispatcher for the root state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _rootDispatcher: function(state, next) {
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
          if (this.env.get('connected')) {
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
    },

    /**
      The cleanup dispatcher for the root state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearRoot: function(state, next) {
      this._clearCharmbrowser(state, next);
      this._clearLogin(state, next);
      next();
    },

    /**
      State handler for he deploy target functionality.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _deployTarget: function(state, next) {
      // Remove the deployTarget from state so that we don't end up
      // dispatching it again by accident.
      this.state.changeState({
        special: {
          deployTarget: null
        }
      });
      this.deployTarget(this.get('charmstore'), state.special['deployTarget']);
      next();
    },

    /**
      Deploys the supplied entity Id from the supplied charmstore instance.
      @param {Object} charmstore The charmstore instance to fetch the entity.
      @param {String} entityId The entity id to deploy.
    */
    deployTarget: function(charmstore, entityId) {
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
            this.deployService(new Y.juju.models.Charm(charm));
          }
        });
      }
    },

    /**
      Calls the necessary methods to setup the GUI and put the user in the
      Deployment Flow when they have used Direct Deploy.

      @param {Object} ddData - The Direct Deploy data from state.
    */
    _directDeploy: function(ddData) {
      const current = this.state.current;
      if (current &&
          current.gui &&
          current.gui.deploy) {
        // If we're already in the deployment flow then return to stop
        // infinitely updating state.
        return;
      }
      this.deployTarget(this.get('charmstore'), ddData.id);
      this.state.changeState({
        gui: {
          deploy: JSON.stringify(ddData)
        }
      });
    },

    /**
      Creates a new instance of the charm store API and assigns it to the
      "charmstore" attribute. This method is idempotent.

      @param {object} jujuConfig The app configuration.
      @param {Object} Charmstore The Charmstore class.
    */
    _setupCharmstore: function(jujuConfig, Charmstore) {
      if (this.get('charmstore') === undefined) {
        this.set('charmstore', new Charmstore(
          jujuConfig.charmstoreURL, this.bakery));
        // Store away the charmstore auth info.
        if (this.bakery.storage.get(jujuConfig.charmstoreURL)) {
          this.get('users')['charmstore'] = {loading: true};
          this.storeUser('charmstore', false, true);
        }
      }
    },

    /**
      Creates a new instance of the bundleservice API and stores it in the
      app in an idempotent fashion.

      @method _setupBundleservice
      @param {Object} Bundleservice The bundleservice API class to
      instantiate.
    */
    _setupBundleservice: function(Bundleservice) {
      if (this.get('bundleService') === undefined) {
        const jujuConfig = window.juju_config;
        const bundleServiceURL = jujuConfig && jujuConfig.bundleServiceURL;
        if (!jujuConfig || !bundleServiceURL) {
          console.error('no juju config for bundleserviceURL availble');
          return;
        }
        const bundleService = new Bundleservice(
          bundleServiceURL,
          new Y.juju.environments.web.WebHandler());
        this.set('bundleService', bundleService);
      }
    },
    /**
      Creates new API client instances for Romulus services.
      Assign them to the "plans" and "terms" app properties.

      @method _setupRomulusServices
      @param {Object} config The GUI application configuration.
      @param {Object} jujulib The Juju API client library.
    */
    _setupRomulusServices: function(config, jujulib) {
      if (!config) {
        // We are probably running tests.
        return;
      }
      if (this.plans || this.terms) {
        console.error(
          'romulus services are being redefined:', this.plans, this.terms);
      }
      this.plans = new window.jujulib.plans(config.plansURL, this.bakery);
      this.terms = new window.jujulib.terms(config.termsURL, this.bakery);
      if (config.payFlag) {
        this.payment = new window.jujulib.payment(
          config.paymentURL, this.bakery);
        this.stripe = new window.jujulib.stripe(
          'https://js.stripe.com/', config.stripeKey);
      }
    },

    /**
      Returns the current defaultSeries value from the environment.

      @method getEnvDefaultSeries
      @return {String} The default series.
    */
    getEnvDefaultSeries: function() {
      return this.env.get('defaultSeries');
    },

    /**
      Hide the drag notifications.

      @method _hideDragOverNotification
    */
    _hideDragOverNotification: function() {
      this.views.environment.instance.fadeHelpIndicator(false);
      ReactDOM.unmountComponentAtNode(
        document.getElementById('drag-over-notification-container'));
    },

    /**
      Event handler for the dragenter, dragover, dragleave events on the
      document. It calls to determine the file type being dragged and manages
      the commands to the timerControl method.

      @method _appDragOverHandler
      @param {Object} e The event object from the various events.
    */
    _appDragOverHandler: function(e) {
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
    },

    /**
      Handles the dragleave timer so that the periodic dragleave events which
      fire as the user is dragging the file around the browser do not stop
      the drag notification from showing.

      @method _dragleaveTimerControl
      @param {String} action The action that should be taken on the timer.
    */
    _dragleaveTimerControl: function(action) {
      if (this._dragLeaveTimer) {
        window.clearTimeout(this._dragLeaveTimer);
        this._dragLeaveTimer = null;
      }
      if (action === 'start') {
        this._dragLeaveTimer = setTimeout(() => {
          this._hideDragOverNotification();
        }, 100);
      }
    },

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
    _determineFileType: function(dataTransfer) {
      var types = dataTransfer.types;
      var fileFound = Object.keys(types).some(function(key) {
        // When dragging a single file in Firefox dataTransfer.types is an array
        // with two elements ["application/x-moz-file", "Files"]
        if (types[key] === 'Files') { return true; }
      });

      if (!fileFound) {
        // If the dataTransfer type isn't `Files` then something is being
        // dragged from inside the browser.
        return false;
      }

      // IE10, 11 and Safari do not have this property during hover so we
      // cannot tell what type of file is being hovered over the canvas.
      if (dataTransfer.items) {
        // See method doc for bug information.
        var file = dataTransfer.items[0];

        if (file.type === 'application/zip' ||
            file.type === 'application/x-zip-compressed') {
          return 'zip';
        }
        return 'yaml';
      }
      return '';
    },

    /**
    Release resources and inform subcomponents to do the same.

    @method destructor
    */
    destructor: function() {
      // Clear the database handler timer. Without this, the application could
      // dispatch after it is destroyed, resulting in a dirty state and bugs
      // difficult to debug, so please do not remove this code.
      if (this.dbChangedTimer) {
        clearTimeout(this.dbChangedTimer);
      }
      if (this._keybindings) {
        this._keybindings.detach();
      }
      const toBeDestroyed = [
        this.env,
        this.controllerAPI,
        this.db,
        this.endpointsController
      ];
      toBeDestroyed.forEach(obj => {
        if (obj && obj.destroy) {
          obj.detachAll();
          obj.destroy();
        }
      });
      ['dragenter', 'dragover', 'dragleave'].forEach((eventName) => {
        document.removeEventListener(eventName, this._boundAppDragOverHandler);
      });
      document.removeEventListener('update', this.bound_on_database_changed);
      document.removeEventListener('initiateDeploy', this._onInitiateDeploy);
      document.removeEventListener(
        'ecs.changeSetModified', this.renderDeploymentBarListener);
      document.removeEventListener(
        'ecs.currentCommitFinished', this.renderDeploymentBarListener);
      document.removeEventListener('login', this.controllerLoginHandler);
      document.removeEventListener('delta', this.onDeltaBound);
    },

    /**
     * On database changes update the view.
     *
     * @method on_database_changed
     */
    on_database_changed: function(evt) {
      // This timeout helps to reduce the number of needless dispatches from
      // upwards of 8 to 2. At least until we can move to the model bound
      // views.
      if (this.dbChangedTimer) {
        clearTimeout(this.dbChangedTimer);
      }
      this.dbChangedTimer = setTimeout(this._dbChangedHandler.bind(this), 100);
      return;
    },

    /**
      After the db has changed and the timer has timed out to reduce repeat
      calls then this is called to handle the db updates.

      @method _dbChangedHandler
      @private
    */
    _dbChangedHandler: function() {
      // Regardless of which view we are rendering,
      // update the env view on db change.
      if (this.views.environment.instance) {
        this.views.environment.instance.topo.update();
      }
      this.state.dispatch();
      this._renderComponents();
    },

    /**
      Display the login page.

      @method _displayLogin
    */
    _displayLogin: function() {
      this.set('loggedIn', false);
      const root = this.state.current.root;
      if (root !== 'login') {
        this.state.changeState({
          root: 'login'
        });
      }
    },

    /**
     Logs the user out of the gui.

     This closes the model/controller connections and clears cookies and other
     authentication artifacts. If in gisf mode this will then redirect the user
     to the store front logout mechanism to complete logout.

     @method _handleLogout
    */
    _handleLogout: function() {
      const config = window.juju_config;

      this.clearUser();
      this.bakery.storage.clear();

      var environmentInstance = this.views.environment.instance;
      if (environmentInstance) {
        environmentInstance.topo.update();
      }
      this.set('modelUUID', '');
      this.set('loggedIn', false);
      const controllerAPI = this.controllerAPI;
      const closeController = controllerAPI.close.bind(controllerAPI);
      this.env.close(() => {
        closeController(() => {
          controllerAPI.connect();
          this.maskVisibility(true);
          this.env.get('ecs').clear();
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
    },

    // Persistent Views

    /**
      Ensure that the current user has authenticated.
      @param {Object} state The application state.
      @param {Function} next The next route handler.
    */
    checkUserCredentials: function(state, next) {
      // If we're in disconnected mode (either "/new" or "/store"), then allow
      // the canvas to be shown.
      if (state && (state.root === 'new' || state.root === 'store')) {
        next();
        return;
      }
      const apis = [this.env, this.controllerAPI];
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
        return !api.userIsAuthenticated && !this.get('gisf');
      });
      if (shouldDisplayLogin) {
        this._displayLogin();
        return;
      }
      next();
    },

    /**
      Create the new socket URL based on the socket template and model details.

      @method createSocketURL
      @param {String} template The template to use to generate the url.
      @param {String} uuid The unique identifier for the model.
      @param {String} server The optional API server host address for the
        model. If not provided, defaults to the host name included in the
        provided apiAddress option.
      @param {String} port The optional API server port for the model. If not
        provided, defaults to the host name included in the provided apiAddress
        option.
      @return {String} The resulting fully qualified WebSocket URL.
    */
    createSocketURL: function(template, uuid, server, port) {
      let baseUrl = '';
      const apiAddress = this.get('apiAddress');
      if (!apiAddress) {
        // It should not ever be possible to get here unless you're running the
        // gui in dev mode without pointing it to a proxy/server supplying
        // the necessary config values.
        alert(
          'Unable to create socketURL, no apiAddress provided. The GUI must ' +
          'be loaded with a valid configuration. Try GUIProxy if ' +
          'running in development mode: https://github.com/frankban/guiproxy');
        return;
      }
      if (template[0] === '/') {
        // The WebSocket path is passed so we need to calculate the base URL.
        const schema = this.get('socket_protocol') || 'wss';
        baseUrl = schema + '://' + window.location.hostname;
        if (window.location.port !== '') {
          baseUrl += ':' + window.location.port;
        }
      }
      const defaults = apiAddress.replace('wss://', '').split(':');
      template = template.replace('$uuid', uuid);
      template = template.replace('$server', server || defaults[0]);
      template = template.replace('$port', port || defaults[1]);
      return baseUrl + template;
    },

    /**
      Switch the application to another environment.
      Disconnect the current WebSocket connection and establish a new one
      pointed to the environment referenced by the given URL.

      @method switchEnv
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
    switchEnv: function(
      // TODO frankban: make the function defaults saner, for instance
      // clearDB=true should really be preserveDB=false by default.
      socketUrl, username, password, callback, reconnect=!!socketUrl,
      clearDB=true) {
      console.log('switching model connection');
      this.env.loading = true;
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
        this.env.loading = false;
        if (callback) {
          callback(this.env);
        }
      };
      // Delay the callback until after the env login as everything should be
      // set up by then.
      document.addEventListener(
        'model.login', onLogin.bind(this, callback), {once: true});
      if (clearDB) {
        // Clear uncommitted state.
        this.env.get('ecs').clear();
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
      }.bind(this.env);
      if (this.env.ws) {
        this.env.ws.onclose = onclose;
        this.env.close();
        // If we are already disconnected then connect if we're supposed to.
        if (!this.env.get('connected')) {
          setUpModel(this.env);
        }
      } else {
        this.env.close(onclose);
      }
      if (clearDB) {
        this.db.reset();
        this.db.fireEvent('update');
      }
      // Reset canvas centering to new env will center on load.
      const instance = this.views.environment.instance;
      // TODO frankban: investigate in what cases instance is undefined on the
      // environment object. Is this some kind of race?
      if (instance) {
        instance.topo.modules.ServiceModule.centerOnLoad = true;
      }
      // If we're not reconnecting, then mark the switch as done.
      if (this.state.current.root === 'new') {
        this.env.loading = false;
      }
    },

    /**
      If we are in a MAAS environment, react to the MAAS server address
      retrieval adding a link to the header pointing to the MAAS server.

      @method _onMaasServer
      @param {Object} evt An event object (with a "newVal" attribute).
    */
    _onMaasServer: function(evt) {
      if (evt.newVal === evt.prevVal) {
        // This can happen if the attr is set blithely. Ignore if so.
        return;
      }
      this._displayMaasLink(evt.newVal);
    },

    /**
      If the given maasServer is not null, create a link to the MAAS server
      in the GUI header.

      @method _displayMaasLink
      @param {String} maasServer The MAAS server URL (or null if not in MAAS).
    */
    _displayMaasLink: function(maasServer) {
      if (maasServer === null) {
        // The current environment is not MAAS.
        return;
      }
      var maasContainer = document.querySelector('#maas-server');
      maasContainer.querySelector('a').setAttribute('href', maasServer);
      maasContainer.classList.remove('hidden');
    },

    maskVisibility: function(visibility = true) {
      var mask = document.getElementById('full-screen-mask');
      var display = visibility ? 'block' : 'none';
      if (mask) {
        mask.style.display = display;
      }
    },

    /**
      Sets the page title.
      @param {String} title The title to be appended with ' - Juju GUI'
    */
    setPageTitle: function(title) {
      document.title = title ? `${title} - Juju GUI` : this.defaultPageTitle;
    },

    /**
     * Record environment default series changes in our model.
     *
     * The provider type arrives asynchronously.  Instead of updating the
     * display from the environment code (a separation of concerns violation),
     * we update it here.
     *
     * @method onDefaultSeriesChange
     */
    onDefaultSeriesChange: function(evt) {
      this.db.environment.set('defaultSeries', evt.newVal);
    },

    /**
      Display the Environment Name.

      The environment name can arrive asynchronously.  Instead of updating
      the display from the environment view (a separtion of concerns violation),
      we update it here.

      @method onEnvironmentNameChange
    */
    onEnvironmentNameChange: function(evt) {
      var environmentName = evt.newVal || 'untitled-model';
      // Update the name on the current model. This is what the components use
      // to display the model name.
      this.db.environment.set('name', environmentName);
      // Update the breadcrumb with the new model name.
      this._renderBreadcrumb();
      // Update the page title.
      this.defaultPageTitle = `${environmentName} - Juju GUI`;
      this.setPageTitle();
    },

    /**
      Render the react components.

      @method _renderComponents
    */
    _renderComponents: function() {
      // Update the react views on database change
      this._renderEnvSizeDisplay(
        this.db.services.size(),
        this.db.machines.filterByParent().length
      );
      this._renderDeploymentBar();
      this._renderModelActions();
      this._renderProviderLogo();
      this._renderZoom();
      this._renderBreadcrumb();
      this._renderHeaderSearch();
      this._renderHeaderHelp();
      this._renderHeaderLogo();
      const gui = this.state.current.gui;
      if (!gui || (gui && !gui.inspector)) {
        this._renderAddedServices();
      }
    },

    /**
      Show the environment view.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    show_environment: function(state, next) {
      if (!this.renderEnvironment) {
        next(); return;
      }
      var options = {
        endpointsController: this.endpointsController,
        db: this.db,
        env: this.env,
        ecs: this.env.ecs,
        charmstore: this.get('charmstore'),
        bundleImporter: this.bundleImporter,
        state: this.state,
        staticURL: window.juju_config.staticURL,
        sendAnalytics: this.sendAnalytics
      };

      this.showView('environment', options, {
        /**
         * Let the component framework know that the view has been rendered.
         *
         * @method show_environment.callback
         */
        callback: function() {
          var envView = this.views.environment.instance;
          envView.rendered();
        },
        render: true
      });
      if (!this.env.get('environmentName')) {
        // If this is starting in an unconnected state there will not be a model
        // name so we set it so that onEnvironmentNameChange sets and updates
        // the name correctly.
        this.env.set('environmentName', null);
      }
      this._renderComponents();
      this._renderNotifications();
      this._renderUserMenu();

      next();
    },

    /**
      Make sure the user agrees to cookie usage.
      @param {Object} state - The application state.
      @param {Function} next - The next route handler.
    */
    authorizeCookieUse: function(state, next) {
      var GTM_enabled = this.get('GTM_enabled');
      if (GTM_enabled) {
        this.cookieHandler = this.cookieHandler || new Y.juju.Cookies();
        this.cookieHandler.check();
      }
      next();
    },

    /**
      Get the user info for the supplied service.

      @method getUser
      @param {String} service The service the macaroon comes from.
      @return {Object} The user information.
    */
    getUser: function(service) {
      return this.get('users')[service];
    },

    /**
      Clears the user info for the supplied service.

      @method clearUser
      @param {String} service The service the macaroon comes from.
    */
    clearUser: function(service) {
      delete this.get('users')[service];
    },

    /**
      Takes a macaroon and stores the user info (if any) in the app.

      @method storeUser
      @param {String} service The service the macaroon comes from.
      @param {String} macaroon The base64 encoded macaroon.
      @param {Boolean} rerenderProfile Rerender the user profile.
      @param {Boolean} rerenderBreadcrumb Rerender the breadcrumb.
     */
    storeUser: function(service, rerenderProfile, rerenderBreadcrumb) {
      var callback = function(error, auth) {
        if (error) {
          console.error('Unable to query user information', error);
          return;
        }
        if (auth) {
          this.get('users')[service] = auth;
          // If the profile is visible then we want to rerender it with the
          // updated username.
          if (rerenderProfile) {
            this._renderUserProfile(this.state.current, ()=>{});
          }
        }
        if (rerenderBreadcrumb) {
          this._renderBreadcrumb();
        }
      };
      if (service === 'charmstore') {
        this.get('charmstore').whoami(callback.bind(this));
      } else {
        console.error('Unrecognized service', service);
      }
    }
  }, {
    ATTRS: {
      html5: true,
      /**
        A flag to indicate if the user is actually logged into the environment.

        @attribute loggedIn
        @default false
        @type {Boolean}
      */
      loggedIn: {
        value: false
      },
      /**
        Store the instance of the charmstore api that we will be using
        throughout the application.

        @attribute charmstore
        @type {jujulib.charmstore}
        @default undefined
      */
      charmstore: {},

      /**
       Whether or not to use interactive login for the IdM/JEM connection.

       @attribute interactiveLogin
       @type {Boolean}
       @default false
       */
      interactiveLogin: { value: true },

      /**
       The address for the environment's state-server. Used for websocket
       creation.

       @attribute apiAddress
       @type {String}
       @default ''
       */
      apiAddress: {value: ''},

      /**
       The template to use to create websockets. It can include these vars:
         - $server: the WebSocket server, like "1.2.3.4";
         - $port: the WebSocket port, like "17070";
         - $uuid: the target model unique identifier.
       If the provided value starts with a "/" it is considered to be a path
       and not a full URL. In this case, the system assumes current host,
       current port and this.get('socket_protocol') (defaulting to 'wss').

       @attribute socketTemplate
       @type {String}
       @default '/model/$uuid/api'
       */
      socketTemplate: {value: '/model/$uuid/api'},

      /**
       The authentication store for the user. This holds macaroons or other
       credential details for the user to connect to the controller.
       */
      user: {value: null},

      /**
       The users associated with various services that the GUI uses. The users
       are keyed by their service name. For example,
       this.get('users')['charmstore'] will return the user object for the
       charmstore service.

       @attribute users
       @type {Object}
       */
      users: {
        value: {}
      }
    }
  });

  Y.namespace('juju').App = JujuGUI;

}, '0.5.3', {
  requires: [
    'acl',
    'analytics',
    'changes-utils',
    'juju-charm-models',
    'juju-bundle-models',
    'juju-controller-api',
    'juju-endpoints-controller',
    'juju-env-base',
    'juju-env-api',
    'juju-env-web-handler',
    'juju-models',
    'jujulib-utils',
    'bakery-utils',
    'net-utils',
    // React components
    'account',
    'added-services-list',
    'charmbrowser-component',
    'deployment-bar',
    'deployment-flow',
    'deployment-signup',
    'env-size-display',
    'header-breadcrumb',
    'model-actions',
    'expanding-progress',
    'header-help',
    'header-logo',
    'header-search',
    'inspector-component',
    'isv-profile',
    'local-inspector',
    'machine-view',
    'login-component',
    'logout-component',
    'modal-gui-settings',
    'modal-shortcuts',
    'notification-list',
    'panel-component',
    'profile',
    'sharing',
    'svg-icon',
    'user-menu',
    'user-profile',
    'zoom',
    // juju-views group
    'd3-components',
    'juju-view-utils',
    'juju-topology',
    'juju-view-environment',
    'juju-landscape',
    // end juju-views group
    'autodeploy-extension',
    'io',
    'json-parse',
    'app-base',
    'app-transitions',
    'base',
    'bundle-importer',
    'bundle-import-notifications',
    'node',
    'model',
    'app-cookies-extension',
    'app-renderer-extension',
    'cookie',
    'querystring',
    'event-key',
    'event-touch',
    'model-controller',
    'FileSaver',
    'ghost-deployer-extension',
    'local-charm-import-helpers',
    'environment-change-set',
    'relation-utils'
  ]
});
