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
    Y.juju.GhostDeployer,
    Y.Event.EventTracker
  ];
  var JujuGUI = Y.Base.create('juju-gui', Y.App, extensions, {
    /*
      Extension properties
    */

    defaultNamespace: 'charmbrowser',
    /*
      End extension properties
    */

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
      'S-/': {
        target: '#shortcut-help',
        toggle: true,
        callback: function(evt, target) {
          // This could be its own view.
          if (target && !target.getHTML().length) {
            var bindings = [];
            Object.keys(this.keybindings).forEach(k => {
              const v = this.keybindings[k];
              if (v.help && (v.condition === undefined ||
                             v.condition.call(this) === true)) {
                // TODO: translate keybindings to
                // human <Alt> m
                // <Control> <Shift> N (note caps)
                // also 'g then i' style
                bindings.push({key: k, label: v.label || k, help: v.help});
              }
            }, this);

            ReactDOM.render(
              <window.juju.components.Shortcuts
                bindings={bindings}
                disableCookie={localStorage.getItem('disable-cookie')}
                disableAutoPlace={localStorage.getItem('disable-auto-place')}
                forceContainers={localStorage.getItem('force-containers')} />,
              target.getDOMNode());

            // This is only added to the DOM once and is checked if it exists
            // above. It's hidden and then shown, so this event is not auto
            // cleaned up, but can only occur once.
            target.one('#save-settings').on('click', function(ev) {
              var fields = target.all('input');
              fields.each(function(node) {
                // If it's a checkbox:
                if (node.get('type') === 'checkbox') {
                  // and if it's checked set that value to localStorage.
                  if (node.get('checked')) {
                    localStorage.setItem(node.getAttribute('name'), true);
                  } else {
                    // otherwise unset it from the localStorage.
                    localStorage.removeItem(node.getAttribute('name'));
                  }
                } else {
                  localStorage.setItem(
                      node.getAttribute('name'), node.get('value'));
                }
              });
              // Force the GUI to reload so the settings take effect.
              window.location.reload();
            });

            target.one('.close').on('click', function(ev) {
              Y.one('#shortcut-help').hide();
            });
          }
        },
        help: 'Display this help',
        label: 'Shift + ?'
      },
      'A-e': {
        callback: function(evt) {
          this.fire('navigateTo', { url: '/:gui:/' });
        },
        help: 'Navigate to the model overview',
        label: 'Alt + e'
      },
      'S-+': {
        fire: 'zoom_in',
        help: 'Zoom In',
        label: 'Shift + "+"'
      },
      'S--': {
        fire: 'zoom_out',
        help: 'Zoom Out',
        label: 'Shift + -'
      },
      'S-0': {
        fire: 'panToCenter',
        help: 'Center the model overview',
        label: 'Shift + 0'
      },
      'esc': {
        fire: 'clearState',
        callback: function() {
          // Explicitly hide anything we might care about.
          Y.one('#shortcut-help').hide();
        },
        help: 'Cancel current action',
        label: 'Esc'
      },

      'S-d': {
        callback: function(evt) {
          views.utils.exportEnvironmentFile(
            this.db, this.env.findFacadeVersion('Application') === null);
        },
        help: 'Export the model',
        label: 'Shift + d'
      },

      'C-S-d': {
        callback: function(evt) {
          Y.fire('saveWebsocketLog');
        },
        help: 'Save the websocket log to a file',
        label: 'Control + Shift + s'
      }
    },

    /**
     * Data driven behaviors.
     *
     * Placeholder for real behaviors associated with DOM Node data-*
     * attributes.
     *
     * @attribute behaviors
     */
    behaviors: {
      timestamp: {
        /**
         * Wait for the DOM to be built before rendering timestamps.
         *
         * @method behaviors.timestamp.callback
         */
        callback: function() {
          Y.later(6000, this, function(o) {
            Y.one('body')
              .all('[data-timestamp]')
              .each(function(node) {
                node.setHTML(views.humanizeTimestamp(
                  node.getAttribute('data-timestamp')));
              });
          }, [], true);}
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
        '/': 191, '?': 63, '+': 187, '-': 189,
        enter: 13, esc: 27, backspace: 8,
        tab: 9, pageup: 33, pagedown: 34};
      var code_map = {};
      Object.keys(key_map).forEach(k => {
        const v = key_map[k];
        code_map[v] = k;
      });
      this._keybindings = Y.one(window).on('keydown', function(evt) {
        //Normalize key-code
        // This gets triggered by different types of elements some YUI some
        // React. So try and use the native tagName property first, if That
        // fails then fall back to getDOMNode().
        var tagName = evt.target.tagName;
        var contentEditable = evt.target.contentEditable;
        var currentKey;
        if (code_map[evt.keyCode]) {
          currentKey = code_map[evt.which];
        } else {
          currentKey = String.fromCharCode(evt.which).toLowerCase();
        }
        if (!tagName) {
          tagName = evt.target.getDOMNode().tagName;
        }
        if (!contentEditable) {
          contentEditable = evt.target.getDOMNode().contentEditable;
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
          var target = Y.one(spec.target);
          if (target) {
            if (spec.toggle) {
              if (target.getStyle('display') !== 'none') {
                target.hide();
              } else {
                target.show();
              }
            }
            if (spec.focus) { target.focus(); }
          }
          if (spec.callback) { spec.callback.call(this, evt, target); }
          // HACK w/o context/view restriction but right direction
          if (spec.fire) {
            this.views.environment.instance.topo.fire(spec.fire);
          }
          // If we handled the event nothing else has to.
          evt.stopPropagation();
          evt.preventDefault();
        }
      }, this);
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
      window.flags = window.flags || {};

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

      // If this property has a value other than '/' then
      // navigate to it after logging in.
      this.redirectPath = '/';

      // This attribute is used by the namespaced URL tracker.
      // _routeSeen is part of a mechanism to prevent non-namespaced routes
      // from being processed multiple times when multiple namespaces are
      // present in the URL.  The data structure is reset for each URL (in
      // _dispatch).  It holds a mapping between route callback uids and a
      // flag to indicate that the callback has been used.
      this._routeSeen = {};

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

      this.bakeryFactory = new window.jujulib.bakeryFactory(
        Y.juju.environments.web.Bakery);

      // Create a client side database to store state.
      this.db = new models.Database();
      // Create and set up a new instance of the charmstore.
      this._setupCharmstore(window.jujulib.charmstore);
      // Create and set up a new instance of the bundleservice.
      this._setupBundleservice(window.jujulib.bundleservice);
      // Create Romulus API client instances.
      this._setupRomulusServices(
        window.juju_config, window.jujulib, window.localStorage);
      // Set up juju bakery service.
      let dischargeToken;
      if (window.juju_config) {
        dischargeToken = window.juju_config.dischargeToken;
      }
      this.bakeryFactory.create({
        webhandler: new Y.juju.environments.web.WebHandler(),
        interactive: this.get('interactiveLogin'),
        serviceName: 'juju',
        dischargeStore: window.localStorage,
        dischargeToken: dischargeToken
      });
      // Set up a new modelController instance.
      this.modelController = new juju.ModelController({
        db: this.db,
        charmstore: this.get('charmstore')
      });

      let environments = juju.environments;
      // If there is no protocol in the baseURL then prefix the origin when
      // creating state.
      let baseURL = cfg.baseUrl;
      if (baseURL.indexOf('://') < 0) {
        baseURL = `${window.location.origin}${baseURL}`;
      }
      this.state = this._setupState(baseURL);
      // Create an environment facade to interact with.
      // Allow "env" as an attribute/option to ease testing.
      var env = this.get('env');
      if (env) {
        this._init(cfg, env, this.get('controllerAPI'));
        return;
      }
      var ecs = new juju.EnvironmentChangeSet({db: this.db});
      ecs.on('changeSetModified', this._renderDeploymentBar.bind(this));
      ecs.on('currentCommitFinished', this._renderDeploymentBar.bind(this));

      let modelOptions = {
        ecs: ecs,
        user: this.get('user'),
        password: this.get('password'),
        conn: this.get('conn'),
        jujuCoreVersion: this.get('jujuCoreVersion'),
        bundleService: this.get('bundleService')
      };
      let controllerOptions = Object.assign({}, modelOptions);
      if (this.get('sandbox')) {
        modelOptions = this.createSandboxConnection(
          Object.assign({}, modelOptions));
        controllerOptions = this.createSandboxConnection(
          Object.assign({}, controllerOptions));
      } else {
        // The GUI is connected to a real Juju environment. Instantiate a Web
        // handler allowing to perform asynchronous HTTPS requests to Juju.
        modelOptions.webHandler = new environments.web.WebHandler();
      }
      let modelAPI, controllerAPI;
      if (this.isLegacyJuju()) {
        modelAPI = new environments.GoLegacyEnvironment(modelOptions);
      } else {
        modelAPI = new environments.GoEnvironment(modelOptions);
        controllerAPI = new Y.juju.ControllerAPI(controllerOptions);
      }
      if (this.get('gisf')) {
        document.body.classList.add('u-is-beta');
      }
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
      // If the user closed the GUI when they were on a different env than
      // their default then it would show them the login screen. This sets
      // the credentials to the environment that they are logging into
      // initially.
      var user = modelAPI.get('user');
      var password = modelAPI.get('password');
      var macaroons = null;
      if (!user || !password) {
        // No user and password credentials provided in config: proceed with
        // usual credentials handling.
        var credentials = modelAPI.getCredentials();
        if (credentials.areAvailable) {
          user = credentials.user;
          password = credentials.password;
          macaroons = credentials.macaroons;
        }
      }
      modelAPI.setCredentials({ user, password, macaroons });
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

      let getBundleChanges;
      if (controllerAPI) {
        // In Juju >= 2 we establish the controller API connection first, then
        // the model one. Also, bundle changes are always retrieved using the
        // controller connection.
        this.controllerAPI = this.setUpControllerAPI(
          controllerAPI, user, password, macaroons, entityPromise);
        getBundleChanges = this.controllerAPI.getBundleChanges.bind(
          this.controllerAPI);
      } else {
        // In legacy Juju, we only connect to the model, and therefore bundle
        // changes are retrieved from that single WebSocket connection.
        modelAPI.set('socket_url',
          this.createSocketURL(this.get('socketTemplate'), modelUUID));
        getBundleChanges = this.env.getBundleChanges.bind(this.env);
      }
      // Set the modelAPI in the model controller here so
      // that we know that it's been setup.
      this.modelController.set('env', this.env);

      // Create a Bundle Importer instance.
      var environments = Y.namespace('juju.environments');
      this.bundleImporter = new Y.juju.BundleImporter({
        db: this.db,
        modelAPI: this.env,
        getBundleChanges: getBundleChanges,
        fakebackend: new environments.FakeBackend({
          charmstore: this.get('charmstore')
        }),
        isLegacyJuju: this.isLegacyJuju(),
        hideDragOverNotification: this._hideDragOverNotification.bind(this)
      });

      // Create the ACL object.
      this.acl = new Y.juju.generateAcl(this.controllerAPI, this.env);

      this.changesUtils = window.juju.utils.ChangesUtils;
      this.relationUtils = window.juju.utils.RelationUtils;

      // Listen for window unloads and trigger the unloadWindow function.
      window.onbeforeunload = views.utils.unloadWindow.bind(this);

      this.on('*:navigateTo', function(e) {
        this.navigate(e.url);
      }, this);

      // Notify user attempts to modify the environment without permission.
      this.env.on('permissionDenied', this.onEnvPermissionDenied, this);

      // When the environment name becomes available, display it.
      this.env.after('environmentNameChange',
          this.onEnvironmentNameChange, this);
      this.env.after('defaultSeriesChange', this.onDefaultSeriesChange, this);

      // Once the user logs in, we need to redraw.
      this.env.after('login', this.onLogin, this);

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
      this.env.on('delta', this.db.onDelta, this.db);

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
        // Need to re-render the provider logo so that it clears.
        this._renderProviderLogo();
        if (!evt.newVal) {
          // The model is not connected, do nothing waiting for a reconnection.
          console.log('model disconnected');
          return;
        }
        console.log('model connected');
        this.env.userIsAuthenticated = false;
        // Attempt to log in if we already have credentials available.
        var credentials = this.env.getCredentials();
        if (credentials.areAvailable) {
          this.loginToAPIs(null, !!credentials.macaroons, [this.env]);
          return;
        }
        // The user can also try to log in with an authentication token.
        // This will look like ?authtoken=AUTHTOKEN.  For instance,
        // in the sandbox, try logging in with ?authtoken=demoToken.
        // To get a real token from the Juju GUI charm's environment
        // proxy, within an authenticated websocket session, use a
        // request like this:
        // {
        //   'RequestId': 42,
        //   'Type': 'GUIToken',
        //   'Request': 'Create',
        //   'Params': {},
        // }
        // You can then use the token once until it expires, within two
        // minutes of this writing.
        var querystring = this.location.search.substring(1);
        var qs = Y.QueryString.parse(querystring);
        var authtoken = qs.authtoken || '';
        if (authtoken || authtoken.length) {
          // De-dupe if necessary.
          if (Array.isArray(authtoken)) {
            authtoken = authtoken[0];
          }
          // Try a token login.
          this.env.tokenLogin(authtoken);
        }
        // There are no credentials. Do nothing in this case if we are on Juju
        // >= 2 as the controller login check will have kicked the user to the
        // login prompt already and we can wait until they have provided the
        // credentials there. In Juju 1 though we need to display the login.
        if (!this.controllerAPI) {
          this._displayLogin();
        }
      });

      // If the database updates, redraw the view (distinct from model updates).
      // TODO: bound views will automatically update this on individual models.
      this.db.on('update', this.on_database_changed, this);

      this.enableBehaviors();

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
      Y.on('initiateDeploy', function(charm, ghostAttributes) {
        this.deployService(charm, ghostAttributes);
      }, this);

      this._boundAppDragOverHandler = this._appDragOverHandler.bind(this);
      // These are manually detached in the destructor.
      ['dragenter', 'dragover', 'dragleave'].forEach((eventName) => {
        document.addEventListener(
          eventName, this._boundAppDragOverHandler);
      });

      // We are now ready to connect the environment and bootstrap the app.
      if (this.controllerAPI) {
        // In Juju >= 2 we connect to the controller and then to the model.
        this.controllerAPI.connect();
      } else {
        // We won't have a controller API connection in Juju 1.
        this.env.connect();
      }
      this.on('*:autoplaceAndCommitAll', this._autoplaceAndCommitAll, this);
      this.state.bootstrap();
    },

    /**
      Creates a sandbox connection backend for use with the GoJujuAPI.

      @method createSandboxConnection
      @param {Object} cfg The configuration object to use and modify with the
        sandbox connection instance.
      @return {Object} A modified version of the passed in cfg which
        contains the sandbox connection.
    */
    createSandboxConnection: function(cfg) {
      cfg.socket_url = this.get('sandboxSocketURL');
      let environments = juju.environments;
      let sandboxModule = environments.sandbox;
      const fakebackend = new environments.FakeBackend({
        charmstore: this.get('charmstore')
      });
      if (cfg.user && cfg.password) {
        let credentials = fakebackend.get('authorizedUsers');
        credentials['user-' + cfg.user] = cfg.password;
        fakebackend.set('authorizedUsers', credentials);
      }
      cfg.conn = new sandboxModule.ClientConnection({
        juju: new sandboxModule.GoJujuAPI({
          state: fakebackend,
          socket_url: cfg.socket_url,
          bundleService: cfg.bundleService
        })
      });
      // Instantiate a fake Web handler, which simulates the
      // request/response communication between the GUI and the juju-core
      // HTTPS API.
      cfg.webHandler =
        new environments.web.WebSandbox({state: fakebackend});
      return cfg;
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
      const external = this._getExternalAuth();
      controllerAPI.setAttrs({ user, password });
      controllerAPI.setCredentials({ user, password, macaroons, external });

      controllerAPI.after('login', evt => {
        this.anonymousMode = false;
        if (evt.err) {
          this._renderLogin(evt.err);
          return;
        }
        this._renderLoginOutLink();
        console.log('successfully logged into controller');
        // If the user is connected to a model then the modelList will be
        // fetched by the modelswitcher component.
        if (this.env.get('modelUUID')) {
          return;
        }
        const modelUUID = this._getModelUUID();
        const current = this.state.current;
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
          const newState = {
            profile: current.profile,
            root: isLogin ? null : current.root
          };
          // If the current root is 'login' after logging into the controller,
          // and there is no root, no store and no profile defined then we
          // want to render the users profile.
          if (
            !current.store &&
            !newState.profile &&
            (isLogin || !current.root) &&
            this.get('gisf')
          ) {
            newState.profile = this._getAuth().rootUserName;
          }
          this.state.changeState(newState);
        }
      });

      controllerAPI.after('connectedChange', evt => {
        if (!evt.newVal) {
          // The controller is not connected, do nothing waiting for a
          // reconnection.
          console.log('controller disconnected');
          return;
        }
        console.log('controller connected');
        const creds = this.controllerAPI.getCredentials();
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
        if (!creds.areAvailable) {
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
      Reports whether the currently connected controller is a legacy Juju
      (with version < 2).

      @method isLegacyJuju
      @return {Boolean} Whether a legacy Juju version is being used.
    */
    isLegacyJuju: function() {
      var jujuVersion = this.get('jujuCoreVersion');
      return views.utils.compareSemver(jujuVersion, '2') === -1;
    },

    /**
      Handles logging into both the env and controller api WebSockets.

      @method loginToAPIs
      @param {Object} credentials The credentials to pass to the instances
        setCredentials method.
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
              this.bakeryFactory.get('juju'),
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
        if (credentials) {
          // We set credentials even if the API is not connected: they will be
          // used when the connection is eventually established.
          api.setCredentials(credentials);
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
      const controllerAPI = this.controllerAPI;
      const loginToController = controllerAPI.loginWithMacaroon.bind(
        controllerAPI, this.bakeryFactory.get('juju'));
      const webhandler = new Y.juju.environments.web.WebHandler();
      const controllerIsConnected = function() {
        return controllerAPI.get('connected');
      };
      const getDischargeToken = function() {
        return window.localStorage.getItem('discharge-token');
      };
      const charmstore = this.get('charmstore');
      ReactDOM.render(
        <window.juju.components.Login
          charmstore={charmstore}
          controllerIsConnected={controllerIsConnected}
          errorMessage={err}
          getDischargeToken={getDischargeToken}
          gisf={this.get('gisf')}
          hideSpinner={this.hideConnectingMask.bind(this)}
          isLegacyJuju={this.isLegacyJuju()}
          loginToAPIs={this.loginToAPIs.bind(this)}
          loginToController={loginToController}
          sendPost={webhandler.sendPostRequest.bind(webhandler)}
          setCredentials={this.env.setCredentials.bind(this.env)}
          showSpinner={this.showConnectingMask.bind(this)}
          storeUser={this.storeUser.bind(this)} />,
        document.getElementById('login-container'));
    },

    /**
      Renders the Log out component or log in link depending on the
      environment the GUI is executing in.
    */
    _renderLoginOutLink: function() {
      if (this.get('sandbox')) {
        // Do not show the logout link if the user is in sandbox mode.
        return;
      }
      const controllerAPI = this.controllerAPI;
      const linkContainerId = 'profile-link-container';
      const linkContainer = document.getElementById(linkContainerId);
      if (linkContainer === null) {
        console.error(`no linkContainerId: ${linkContainerId}`);
        return;
      }
      const bakeryFactory = this.bakeryFactory;
      const charmstore = this.get('charmstore');
      const webhandler = new Y.juju.environments.web.WebHandler();
      const getDischargeToken = function() {
        return window.localStorage.getItem('discharge-token');
      };
      if (controllerAPI && !controllerAPI.userIsAuthenticated) {
        // If the user is not authenticated but we're connected to a controller
        // then the user is anonymous and we should show them a login button
        // so that they can log in via USSO.
        ReactDOM.render(
          <window.juju.components.USSOLoginLink
            charmstore={charmstore}
            displayType={'text'}
            getDischargeToken={getDischargeToken}
            gisf={this.get('gisf')}
            loginToController={controllerAPI.loginWithMacaroon.bind(
              controllerAPI, bakeryFactory.get('juju'))}
            sendPost={webhandler.sendPostRequest.bind(webhandler)}
            storeUser={this.storeUser.bind(this)}
          />,
          linkContainer);
        return;
      }

      ReactDOM.render(
        <window.juju.components.Logout
          logout={this.logout.bind(this)}
          clearCookie={bakeryFactory.clearAllCookies.bind(bakeryFactory)}
          gisfLogout={window.juju_config.gisfLogout || ''}
          gisf={window.juju_config.gisf || false}
          charmstoreLogoutUrl={charmstore.getLogoutUrl()}
          getUser={this.getUser.bind(this, 'charmstore')}
          clearUser={this.clearUser.bind(this, 'charmstore')}
          // If the charmbrowser is open then don't show the logout link.
          visible={!this.state.current.store}
          locationAssign={window.location.assign.bind(window.location)}
        />,
        linkContainer);
    },

    /**
      Renders the user profile component.

      @method _renderUserProfile
      @param {Object} state - The app state.
      @param {Function} next - Call to continue dispatching.
    */
    _renderUserProfile: function(state, next) {
      // XXX Jeff - 1-2-2016 - Because of a bug in the state system the profile
      // view renders itself and then makes requests to identity before the
      // controller is setup and the user has successfully logged in. As a
      // temporary workaround we will just prevent rendering the profile until
      // the controller is connected.
      // XXX frankban: it seems that the profile is rendered even when the
      // profile is not included in the state.
      const guiState = state.gui || {};
      if (
        guiState.deploy !== undefined ||
        !state.profile ||
        !this.controllerAPI.get('connected') ||
        !this.controllerAPI.userIsAuthenticated
      ) {
        return;
      }
      // XXX Jeff - 18-11-2016 - This profile gets rendered before the
      // controller has completed connecting and logging in when in gisf. The
      // proper fix is to queue up the RPC calls but due to time constraints
      // we're setting up this handler to simply re-render the profile when
      // the controller is properly connected.
      const facadesExist = !!this.controllerAPI.get('facades');
      if (!facadesExist) {
        const handler = this.controllerAPI.after('facadesChange', e => {
          if (e.newVal) {
            this._renderUserProfile(state, next);
            handler.detach();
          }
        });
      }
      const userInfo = {
        external: state.profile,
        isCurrent: false,
        profile: state.profile
      };
      if (userInfo.profile === this._getAuth().rootUserName) {
        userInfo.isCurrent = true;
        // This is the current user, and might be a local one. Use the
        // authenticated charm store user as the external (USSO) name.
        const users = this.get('users') || {};
        userInfo.external = users.charmstore ? users.charmstore.user : null;
      }
      const charmstore = this.get('charmstore');
      const utils = views.utils;
      const currentModel = this.get('modelUUID');
      // When going to the profile view, we are theoretically no longer
      // connected to any model. Setting the current model identifier to null
      // also allows switching to the same model from the profile view.
      this.set('modelUUID', null);
      // NOTE: we need to clone this.get('users') below; passing in without
      // cloning breaks React's ability to distinguish between this.props and
      // nextProps on the lifecycle methods.
      ReactDOM.render(
        <window.juju.components.UserProfile
          acl={this.acl}
          addNotification=
            {this.db.notifications.add.bind(this.db.notifications)}
          charmstore={charmstore}
          currentModel={currentModel}
          facadesExist={facadesExist}
          listBudgets={this.plans.listBudgets.bind(this.plans)}
          listModelsWithInfo={
            this.controllerAPI.listModelsWithInfo.bind(this.controllerAPI)}
          changeState={this.state.changeState.bind(this.state)}
          destroyModels={
            this.controllerAPI.destroyModels.bind(this.controllerAPI)}
          getAgreements={this.terms.getAgreements.bind(this.terms)}
          getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
          gisf={this.get('gisf')}
          interactiveLogin={this.get('interactiveLogin')}
          pluralize={utils.pluralize.bind(this)}
          staticURL={window.juju_config.staticURL}
          storeUser={this.storeUser.bind(this)}
          switchModel={utils.switchModel.bind(this, this.env)}
          userInfo={userInfo}
        />,
        document.getElementById('top-page-container'));
      // The model name should not be visible when viewing the profile.
      this._renderBreadcrumb({ showEnvSwitcher: false });
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
      if (!window.flags || !window.flags.blues) {
        return;
      }
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
    */
    _renderAccount: function() {
      ReactDOM.render(
        <window.juju.components.Account
          acl={this.acl}
          user={this._getAuth()}
          users={Y.clone(this.get('users'), true)} />,
        document.getElementById('top-page-container'));
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
          changeState={this.state.changeState.bind(this.state)}
          appState={this.state} />,
        document.getElementById('header-search-container'));
    },


    _renderHeaderHelp: function() {
      ReactDOM.render(
        <window.juju.components.HeaderHelp
          appState={this.state}
          gisf={this.get('gisf')}
          user={this._getAuth()} />,
        document.getElementById('header-help'));
    },

    _renderHeaderLogo: function() {
      const navigateUserProfile = () => {
        const auth = this._getAuth();
        if (!auth) {
          return;
        }
        views.utils.showProfile(
         this.env && this.env.get('ecs'),
         this.state.changeState.bind(this.state), auth.rootUserName);
      };
      ReactDOM.render(
        <window.juju.components.HeaderLogo
          navigateUserProfile={navigateUserProfile} />,
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
      const currentChangeSet = env.get('ecs').getCurrentChangeSet();
      if (Object.keys(currentChangeSet).length === 0) {
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
      // The beta sign-up component is displayed in sandbox mode at the
      // beginning of the deployment flow.
      const flowDisplayed = state.gui.deploy === 'flow';
      const cookieExists =
          document.cookie.indexOf('beta-signup-seen=true') > -1;
      if (!flowDisplayed && this.get('sandbox') && !cookieExists) {
        ReactDOM.render(
          <window.juju.components.DeploymentSignup
            changeState={this.state.changeState.bind(this.state)}
            exportEnvironmentFile={
              utils.exportEnvironmentFile.bind(utils, db,
                env.findFacadeVersion('Application') === null)}
            modelName={modelName}
            staticURL={window.juju_config.staticURL} />,
          document.getElementById('deployment-container'));
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
        const credentials = controllerAPI && controllerAPI.getCredentials();
        return credentials ? credentials.user : undefined;
      };
      const loginToController = controllerAPI.loginWithMacaroon.bind(
        controllerAPI, this.bakeryFactory.get('juju'));
      const getDischargeToken = function() {
        return window.localStorage.getItem('discharge-token');
      };
      const webhandler = new Y.juju.environments.web.WebHandler();
      const charmstore = this.get('charmstore');
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
          credential={env.get('credential')}
          changes={currentChangeSet}
          charmsGetById={db.charms.getById.bind(db.charms)}
          deploy={utils.deploy.bind(utils, this)}
          setModelName={env.set.bind(env, 'environmentName')}
          generateAllChangeDescriptions={
            changesUtils.generateAllChangeDescriptions.bind(
              changesUtils, services, db.units)}
          generateCloudCredentialName={utils.generateCloudCredentialName}
          getAgreementsByTerms={
              this.terms.getAgreementsByTerms.bind(this.terms)}
          getAuth={this._getAuth.bind(this)}
          getCloudCredentials={
            controllerAPI && controllerAPI.getCloudCredentials.bind(
              controllerAPI)}
          getCloudCredentialNames={
            controllerAPI && controllerAPI.getCloudCredentialNames.bind(
              controllerAPI)}
          getCloudProviderDetails={utils.getCloudProviderDetails.bind(utils)}
          getDischargeToken={getDischargeToken}
          getUserName={getUserName}
          gisf={this.get('gisf')}
          groupedChanges={changesUtils.getGroupedChanges(currentChangeSet)}
          isLegacyJuju={this.isLegacyJuju()}
          listBudgets={this.plans.listBudgets.bind(this.plans)}
          listClouds={
            controllerAPI && controllerAPI.listClouds.bind(controllerAPI)}
          listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
          loginToController={loginToController}
          modelCommitted={connected}
          modelName={modelName}
          region={env.get('region')}
          sendPost={webhandler.sendPostRequest.bind(webhandler)}
          servicesGetById={services.getById.bind(services)}
          showTerms={this.terms.showTerms.bind(this.terms)}
          storeUser={this.storeUser.bind(this)}
          updateCloudCredential={
            controllerAPI && controllerAPI.updateCloudCredential.bind(
              controllerAPI)}
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
          showInstall={!!this.get('sandbox')} />,
        document.getElementById('deployment-bar-container'));
    },

    /**
      Display or hide the sharing modal.

      @method _sharingVisibility
      @param {Boolean} visibility Controls whether to show (true) or hide
                       (false); defaults to true.
    */
    _sharingVisibility: function(visibility = true) {
      // Grab app attributes for easy access.
      const controllerAPI = this.controllerAPI;
      const db = this.db;
      const env = this.env;
      // Bind required functions appropriately.
      const getModelUserInfo = env.modelUserInfo.bind(env);
      const addNotification = db.notifications.add.bind(db.notifications);
      const grantAccess = controllerAPI.grantModelAccess.bind(controllerAPI,
        env.get('modelUUID'));
      const revokeAccess = controllerAPI.revokeModelAccess.bind(controllerAPI,
        env.get('modelUUID'));
      // Render or un-render the sharing component.
      const sharing = document.getElementById('sharing-container');
      if (visibility) {
        ReactDOM.render(
          <window.juju.components.Sharing
            addNotification={addNotification}
            canShareModel={this.acl.canShareModel()}
            closeHandler={this._sharingVisibility.bind(this, false)}
            getModelUserInfo={getModelUserInfo}
            grantModelAccess={grantAccess}
            humanizeTimestamp={views.utils.humanizeTimestamp}
            revokeModelAccess={revokeAccess} />,
        sharing);
      } else {
        ReactDOM.unmountComponentAtNode(sharing);
      }
    },

    /**
      Renders the import and export component to the page in the
      designated element.

      @method _renderModelActions
    */
    _renderModelActions: function() {
      const db = this.db;
      const utils = views.utils;
      const env = this.env;
      const modelConnected = () => {
        return env.get('connected') && this.get('modelUUID');
      };
      ReactDOM.render(
        <window.juju.components.ModelActions
          acl={this.acl}
          changeState={this.state.changeState.bind(this.state)}
          currentChangeSet={env.get('ecs').getCurrentChangeSet()}
          exportEnvironmentFile={
            utils.exportEnvironmentFile.bind(utils, db,
              env.findFacadeVersion('Application') === null)}
          hasEntities={db.services.toArray().length > 0 ||
            db.machines.toArray().length > 0}
          hideDragOverNotification={this._hideDragOverNotification.bind(this)}
          importBundleFile={this.bundleImporter.importBundleFile.bind(
            this.bundleImporter)}
          modelConnected={modelConnected}
          renderDragOverNotification={
            this._renderDragOverNotification.bind(this)}
          sharingVisibility={this._sharingVisibility.bind(this)}/>,
        document.getElementById('model-actions-container'));
    },

    /**
      Renders the logo for the current cloud provider.

      @method _renderProviderLogo
    */
    _renderProviderLogo: function() {
      const container = document.getElementById('provider-logo-container');
      const clearLogo = () => {
        ReactDOM.unmountComponentAtNode(container);
      };
      const cloudProvider = this.env.get('providerType');
      if (!cloudProvider) {
        clearLogo();
        return;
      }
      const providerDetails = views.utils.getCloudProviderDetails(
        cloudProvider);
      if (!providerDetails) {
        clearLogo();
        return;
      }
      const scale = 0.65;
      ReactDOM.render(
        <window.juju.components.SvgIcon
          height={providerDetails.svgHeight * scale}
          name={providerDetails.id}
          width={providerDetails.svgWidth * scale} />,
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
        this.hoverService.detach();
      }
      this.hoverService = topo.on('hoverService', function(service) {
        this._renderAddedServices(service.id);
      }, this);
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
      const topo = this.views.environment.instance.topo;
      const charmstore = this.get('charmstore');
      let inspector = {};
      const inspectorState = state.gui.inspector;
      const service = this.db.services.getById(inspectorState.id);
      const localType = inspectorState.localType;
      // If there is a hoverService event listener then we need to detach it
      // when rendering the inspector.
      if (this.hoverService) {
        this.hoverService.detach();
      }
      // If the url was provided with a service id which isn't in the localType
      // db then change state back to the added services list. This usually
      // happens if the user tries to visit the inspector of a ghost service
      // id which no longer exists.
      if (service) {
        // Select the service token.
        topo.modules.ServiceModule.selectService(service.get('id'));
        var charm = this.db.charms.getById(service.get('charm'));
        var relatableApplications = relationUtils.getRelatableApplications(
          this.db, models.getEndpoints(service, this.endpointsController));
        const ecs = this.env.get('ecs');
        inspector = (
          <window.juju.components.Inspector
            acl={this.acl}
            service={service}
            charm={charm}
            addNotification=
              {this.db.notifications.add.bind(this.db.notifications)}
            setConfig={this.env.set_config.bind(this.env)}
            envResolved={this.env.resolved.bind(this.env)}
            serviceRelations={
              relationUtils.getRelationDataForService(this.db, service)}
            addGhostAndEcsUnits={utils.addGhostAndEcsUnits.bind(
                this, this.db, this.env, service)}
            createMachinesPlaceUnits={utils.createMachinesPlaceUnits.bind(
                this, this.db, this.env, service)}
            destroyService={utils.destroyService.bind(
                this, this.db, this.env, service)}
            destroyUnits={utils.destroyUnits.bind(this, this.env)}
            destroyRelations={this.relationUtils.destroyRelations.bind(
              this, this.db, this.env)}
            relatableApplications={relatableApplications}
            clearState={utils.clearState.bind(this, topo)}
            createRelation={
              relationUtils.createRelation.bind(this, this.db, this.env)}
            getYAMLConfig={utils.getYAMLConfig.bind(this)}
            exposeService={this.env.expose.bind(this.env)}
            unexposeService={this.env.unexpose.bind(this.env)}
            unplaceServiceUnits={ecs.unplaceServiceUnits.bind(ecs)}
            getAvailableVersions={charmstore.getAvailableVersions.bind(
                charmstore)}
            getAvailableEndpoints={relationUtils.getAvailableEndpoints.bind(
              this, this.endpointsController, this.db, models.getEndpoints)}
            getMacaroon={charmstore.bakery.getMacaroon.bind(charmstore.bakery)}
            addCharm={this.env.addCharm.bind(this.env)}
            displayPlans={utils.compareSemver(
              this.get('jujuCoreVersion'), '2') > -1}
            modelUUID={this.get('modelUUID') || ''}
            showActivePlan={this.plans.showActivePlan.bind(this.plans)}
            setCharm={this.env.setCharm.bind(this.env)}
            getCharm={this.env.get_charm.bind(this.env)}
            getUnitStatusCounts={utils.getUnitStatusCounts}
            updateServiceUnitsDisplayname=
              {this.db.updateServiceUnitsDisplayname.bind(this.db)}
            getServiceById={this.db.services.getById.bind(this.db.services)}
            getServiceByName=
              {this.db.services.getServiceByName.bind(this.db.services)}
            linkify={utils.linkify}
            appState={this.state} />
        );
      } else if (localType && window.localCharmFile) {
        // When dragging a local charm zip over the canvas it animates the
        // drag over notification which needs to be closed when the inspector
        // is opened.
        this._hideDragOverNotification();
        var localCharmHelpers = juju.localCharmHelpers;
        inspector = (
          <window.juju.components.LocalInspector
            acl={this.acl}
            file={window.localCharmFile}
            localType={localType}
            services={this.db.services}
            series={utils.getSeriesList()}
            uploadLocalCharm={
                localCharmHelpers.uploadLocalCharm.bind(
                this, this.env, this.db)}
            upgradeServiceUsingLocalCharm={
                localCharmHelpers.upgradeServiceUsingLocalCharm.bind(
                this, this.env, this.db)}
            changeState={this.state.changeState.bind(this.state)} />
        );
      } else {
        this.state.changeState({
          gui: {
            inspector: null}});
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
      // Retrieve from the charm store information on the charm or bundle with
      // the given new style id.
      const getEntity = (id, callback) => {
        let url;
        try {
          url = window.jujulib.URL.fromString(id);
        } catch(err) {
          callback(err, {});
          return;
        }
        charmstore.getEntity(url.legacyPath(), callback);
      };
      const getModelName = () => this.env.get('environmentName');
      ReactDOM.render(
        <window.juju.components.Charmbrowser
          acl={this.acl}
          apiUrl={charmstore.url}
          charmstoreSearch={charmstore.search.bind(charmstore)}
          displayPlans={!this.isLegacyJuju()}
          series={utils.getSeriesList()}
          importBundleYAML={this.bundleImporter.importBundleYAML.bind(
              this.bundleImporter)}
          getBundleYAML={charmstore.getBundleYAML.bind(charmstore)}
          getEntity={getEntity}
          getFile={charmstore.getFile.bind(charmstore)}
          getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
          getModelName={getModelName}
          isLegacyJuju={this.isLegacyJuju()}
          listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
          renderMarkdown={marked.bind(this)}
          deployService={this.deployService.bind(this)}
          appState={this.state}
          utils={utils}
          staticURL={window.juju_config.staticURL}
          charmstoreURL={
            utils.ensureTrailingSlash(window.juju_config.charmstoreURL)}
          apiVersion={window.jujulib.charmstoreAPIVersion}
          addNotification={
            this.db.notifications.add.bind(this.db.notifications)}
          makeEntityModel={Y.juju.makeEntityModel} />,
        document.getElementById('charmbrowser-container'));
      next();
    },

    /**
      The cleanup dispatcher for the store state path.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _clearCharmbrowser: function(state, next) {
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

    /**
      Handles rendering and/or updating the machine UI component.
      @param {Object} state - The app state.
      @param {Function} next - Call to continue dispatching.
    */
    _renderMachineView: function(state, next) {
      var db = this.db;
      ReactDOM.render(
        <window.juju.components.MachineView
          acl={this.acl}
          addGhostAndEcsUnits={views.utils.addGhostAndEcsUnits.bind(
              this, this.db, this.env)}
          autoPlaceUnits={this._autoPlaceUnits.bind(this)}
          createMachine={this._createMachine.bind(this)}
          destroyMachines={this.env.destroyMachines.bind(this.env)}
          environmentName={db.environment.get('name')}
          jujuCoreVersion={this.get('jujuCoreVersion')}
          machines={db.machines}
          placeUnit={this.env.placeUnit.bind(this.env)}
          removeUnits={this.env.remove_units.bind(this.env)}
          services={db.services}
          units={db.units} />,
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
          this.state.changeState({
            root: null,
            store: null,
            model: null,
            user: null,
            profile: this._getAuth().rootUserName
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
      Creates an instance of the State and registers the necessary dispatchers.
      @param {String} baseURL - The path the application is served from.
      @return {Object} The state instance.
    */
    _setupState: function(baseURL) {
      const state = new window.jujugui.State({
        baseURL: baseURL,
        seriesList: window.jujulib.SERIES
      });

      state.register([
        ['*', this.checkUserCredentials.bind(this)],
        ['*', this.show_environment.bind(this)],
        ['*', this.authorizeCookieUse.bind(this)],
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
          this._clearDeployment.bind(this)]
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
        case 'store':
          this._renderCharmbrowser(state, next);
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
      Handles the deploy target functionality.
      @param {Object} state - The application state.
      @param {Function} next - Run the next route handler, if any.
    */
    _deployTarget: function(state, next) {
      const charmstore = this.get('charmstore');
      const entityId = state.special['deployTarget'];
      // Remove the deployTarget from state so that we don't end up
      // dispatching it again by accident.
      this.state.changeState({
        special: {
          deployTarget: null
        }
      });
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
      next();
    },

    /**
      Creates a new instance of the new charmstore api and assigns it to the
      charmstore attribute. Idempotent.

      @method _setupCharmstore
      @param {Object} Charmstore The Charmstore class to instantiate and store
        in the app.
    */
    _setupCharmstore: function(Charmstore) {
      if (this.get('charmstore') === undefined) {
        var jujuConfig = window.juju_config;
        var charmstoreURL = '';
        var existingMacaroons, existingDischargeToken;
        if (!jujuConfig || !jujuConfig.charmstoreURL) {
          console.error('no juju config for charmstoreURL available');
        } else {
          charmstoreURL = views.utils.ensureTrailingSlash(
            jujuConfig.charmstoreURL);
          existingMacaroons = jujuConfig.charmstoreMacaroons;
          existingDischargeToken = jujuConfig.dischargeToken;
        }
        var apiVersion = window.jujulib.charmstoreAPIVersion;
        var bakery = this.bakeryFactory.create({
          webhandler: new Y.juju.environments.web.WebHandler(),
          interactive: this.get('interactiveLogin'),
          setCookiePath: `${charmstoreURL}${apiVersion}/set-auth-cookie`,
          staticMacaroonPath: `${charmstoreURL}${apiVersion}/macaroon`,
          serviceName: 'charmstore',
          macaroon: existingMacaroons,
          dischargeStore: window.localStorage,
          dischargeToken: existingDischargeToken
        });
        this.set('charmstore', new Charmstore(charmstoreURL, bakery));
        // Store away the charmstore auth info.
        var macaroon = bakery.getMacaroon();
        if (macaroon) {
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
      @param {Object} storage The place where to store macaroons.
    */
    _setupRomulusServices: function(config, jujulib, storage) {
      if (!config) {
        // We are probably running tests.
        return;
      }
      if (this.plans || this.terms) {
        console.error(
          'romulus services are being redefined:', this.plans, this.terms);
      }
      var interactive = this.get('interactiveLogin');
      var webHandler = new Y.juju.environments.web.WebHandler();
      var bakery = this.bakeryFactory.create({
        serviceName: 'plans',
        macaroon: config.plansMacaroons,
        webhandler: webHandler,
        interactive: interactive,
        cookieStore: storage,
        dischargeStore: window.localStorage,
        dischargeToken: config.dischargeToken
      });
      this.plans = new window.jujulib.plans(config.plansURL, bakery);
      var bakery = this.bakeryFactory.create({
        serviceName: 'terms',
        macaroon: config.termsMacaroons,
        webhandler: webHandler,
        interactive: interactive,
        cookieStore: storage,
        dischargeStore: window.localStorage,
        dischargeToken: config.dischargeToken
      });
      this.terms = new window.jujulib.terms(config.termsURL, bakery);
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
    },

    /**
     * Hook up all of the declared behaviors.
     *
     * @method enableBehaviors
     */
    enableBehaviors: function() {
      Object.keys(this.behaviors).forEach(behavior => {
        this.behaviors[behavior].callback.call(this);
      });
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

    // Route handlers

    /**
     * Log the current user out and show the login screen again.
     *
     * @method logout
     * @param {Object} req The request.
     * @return {undefined} Nothing.
     */
    logout: function(req) {
      // If the environment view is instantiated, clear out the topology local
      // database on log out, because we clear out the environment database as
      // well. The order of these is important because we need to tell
      // the env to log out after it has navigated to make sure that
      // it always shows the login screen.
      var environmentInstance = this.views.environment.instance;
      if (environmentInstance) {
        environmentInstance.topo.update();
      }
      this.set('modelUUID', '');
      this.set('loggedIn', false);
      // Close both controller and model API connections.
      let closeController = callback => {
        callback();
      };
      const controllerAPI = this.controllerAPI;
      if (controllerAPI) {
        closeController = controllerAPI.close.bind(controllerAPI);
      }
      this.env.close(() => {
        closeController(() => {
          if (controllerAPI) {
            // Juju 2 connects to the controller and gets models from there.
            controllerAPI.connect();
          } else {
            // Juju 1 is just connected to a model.
            this.env.connect();
          }
          this.maskVisibility(true);
          this.env.get('ecs').clear();
          this.db.reset();
          this.db.fire('update');
          this.state.changeState({
            model: null,
            profile: null,
            root: null,
            store: null
          });
          this._renderLogin(null);
        });
      });
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
        // If the api is connecting then we can't know if they are properly
        // logged in yet.
        if (api.get('connecting')) {
          return true;
        }
        if (!api || !api.get('connected')) {
          // If we do not have an api instance or if we are not connected with
          // it then we don't need to concern ourselves with being
          // authenticated to it.
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
     * Notify with an error when the user tries to change the environment
     * without permission.
     *
     * @method onEnvPermissionDenied
     * @private
     * @param {Object} evt An event object (with "title" and "message"
         attributes).
     * @return {undefined} Mutates only.
     */
    onEnvPermissionDenied: function(evt) {
      this.db.notifications.add(
          new models.Notification({
            title: evt.title,
            message: evt.message,
            level: 'error'
          })
      );
    },

    /**
      Get the path to which we should redirect after logging in.  Clear it out
      afterwards so it is clear that we've consumed it.

      This is logic from the onLogin method factored out to make it easier to
      test.

      @method popLoginRedirectPath
      @private
      @return {String} the path to which we should redirect.
    */
    popLoginRedirectPath: function() {
      var result = this.redirectPath;
      delete this.redirectPath;
      var currentPath = this.location.pathname;
      var loginPath = /^\/login(\/|$)/;
      if (currentPath !== '/' && !loginPath.test(currentPath)) {
        // We used existing credentials or a token to go directly to a url.
        result = currentPath;
      } else if (!result || loginPath.test(result)) {
        result = '/';
      }
      return result;
    },

    /**
      Hide the login mask and redispatch the router.

      When the environment gets a response from a login attempt,
      it fires a login event, to which this responds.

      @method onLogin
      @param {Object} evt An event object that includes an "err" attribute
        with an error if the authentication failed.
      @private
    */
    onLogin: function(evt) {
      if (evt.err) {
        this._renderLogin(evt.err);
        return;
      }
      // The login was a success.
      console.log('successfully logged into model');
      this.maskVisibility(false);
      this._clearLogin();
      this.set('loggedIn', true);
      if (this.state.current.root === 'login') {
        this.state.changeState({root: null});
      }
      // Handle token authentication.
      if (evt.fromToken) {
        // Alert the user.  In the future, we might want to call out the
        // password so the user can note it.  That will probably want a
        // modal or similar.
        this.env.onceAfter('environmentNameChange', function() {
          this.db.notifications.add(
              new models.Notification({
                title: 'Logged in with Token',
                message: ('You have successfully logged in with a ' +
                          'single-use authentication token.'),
                level: 'important'
              })
          );
        }, this);
      }
      // Handle the change set token if provided in the query.
      // The change set token identifies a collections of changes required
      // to deploy a bundle. Those changes are assumed to be already
      // registered in the GUI server (via a ChangeSet:SetChanges request).
      // Doing that is usually responsibility of a separate system
      // (most of the times, it is Juju Quickstart).
      var querystring = this.location.search.substring(1);
      var qs = Y.QueryString.parse(querystring);
      var changesToken = qs.changestoken || '';
      if (changesToken || changesToken.length) {
        // De-dupe if necessary.
        if (Array.isArray(changesToken)) {
          changesToken = changesToken[0];
        }
        // Try to create a bundle uncommitted state using the token.
        this.bundleImporter.importChangesToken(changesToken);
      }
      // If we are in GISF mode then we do not want to store and redirect
      // on login because the user has already logged into their models
      // and will frequently be switching between models and logging in to
      // them. We rely exclusively on the state system to update the paths.
      if (!this.get('gisf')) {
        var redirectPath = this.popLoginRedirectPath();
        this.navigate(redirectPath, {overrideAllNamespaces: true});
      }
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
      const sandbox = this.get('sandbox');
      if (template[0] === '/' || sandbox) {
        // We either are in sandbox mode or only the WebSocket path is passed.
        // In both cases, we need to calculate the base URL.
        const schema = this.get('socket_protocol') || 'wss';
        baseUrl = schema + '://' + window.location.hostname;
        if (window.location.port !== '') {
          baseUrl += ':' + window.location.port;
        }
        if (sandbox) {
          // We don't actually use a WebSocket in sandbox mode; create a
          // placeholder that makes it reasonably clear that this isn't real.
          if (template === this.get('controllerSocketTemplate')) {
            return baseUrl + '/sandbox-controller';
          }
          return baseUrl + '/sandbox';
        }
      }
      const defaults = this.get('apiAddress').replace('wss://', '').split(':');
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
      if (this.get('sandbox')) {
        console.log('switching models is not supported in sandbox');
      }
      console.log('switching model connection');
      if (username && password) {
        // We don't always get a new username and password when switching
        // environments; only set new credentials if we've actually gotten them.
        // The GUI will automatically log in when we switch.
        this.env.setCredentials({
          user: username,
          password: password
        });
      };
      const credentials = this.env.getCredentials();
      if (callback) {
        const onLogin = function(callback) {
          callback(this.env);
        };
        // Delay the callback until after the env login as everything should be
        // set up by then.
        this.env.onceAfter('login', onLogin.bind(this, callback), this);
      }
      if (clearDB) {
        // Clear uncommitted state.
        this.env.get('ecs').clear();
      }
      const setUpModel = model => {
        // Tell the model to use the new socket URL when reconnecting.
        model.set('socket_url', socketUrl);
        // Store the existing credentials so that they can be possibly reused.
        model.setCredentials(credentials);
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
      this.hideConnectingMask();
      if (clearDB) {
        this.db.reset();
        this.db.fire('update');
      }
      // Reset canvas centering to new env will center on load.
      const instance = this.views.environment.instance;
      // TODO frankban: investigate in what cases instance is undefined on the
      // environment object. Is this some kind of race?
      if (instance) {
        instance.topo.modules.ServiceModule.centerOnLoad = true;
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
      var maasContainer = Y.one('#maas-server');
      maasContainer.one('a').set('href', maasServer);
      maasContainer.show();
    },

    maskVisibility: function(visibility = true) {
      var mask = document.getElementById('full-screen-mask');
      var display = visibility ? 'block' : 'none';
      if (mask) {
        mask.style.display = display;
      }
    },

    /**
      Shows the connecting to Juju environment mask.

      @method showConnectingMask
    */
    showConnectingMask: function() {
      this.maskVisibility(true);
      var msg = document.getElementById('loading-message');
      if (msg) {
        msg.style.display = 'block';
      }
    },

    /**
      Hides the connecting to Juju model mask.
      @method hideConnectingMask
    */
    hideConnectingMask: function() {
      this.maskVisibility(false);
      var msg = document.getElementById('loading-message');
      if (msg) {
        msg.style.display = 'none';
      }
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
      document.title = `${environmentName} - Juju GUI`;
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
        useDragDropImport: this.get('sandbox'),
        db: this.db,
        env: this.env,
        ecs: this.env.ecs,
        charmstore: this.get('charmstore'),
        bundleImporter: this.bundleImporter,
        state: this.state,
        staticURL: window.juju_config.staticURL
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
      this._renderLoginOutLink();

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
    },

    /**
      A single point for accessing auth information that properly handles
      situations where auth is set outside the GUI (i.e., embedded).

      @method _getAuth
     */
    _getAuth: function() {
      // Try to retrieve the user from the external auth system (HJC).
      const external = this._getExternalAuth();
      if (external) {
        return external;
      }
      const users = this.get('users');
      if (!users) {
        return null;
      }
      const mkUser = (user, canBeLocal) => {
        const parts = user.split('@');
        let usernameDisplay = user;
        if (parts.length === 1 && canBeLocal) {
          usernameDisplay += '@local';
        } else if (parts.length > 1 && parts[1] === 'external') {
          usernameDisplay = parts[0];
        }
        return {
          user: user,
          usernameDisplay: usernameDisplay,
          rootUserName: parts[0]
        };
      };
      let credentials;
      // Try to retrieve the user from the model connection.
      if (this.env) {
        credentials = this.env.getCredentials();
        if (credentials.user) {
          return mkUser(credentials.user, true);
        }
      }
      // Try to retrieve the user from the controller connection.
      if (this.controllerAPI) {
        credentials = this.controllerAPI.getCredentials();
        if (credentials.user) {
          return mkUser(credentials.user, true);
        }
      }
      // Last chance: the charm store.
      const charmstore = users.charmstore;
      if (charmstore && charmstore.user) {
        return mkUser(charmstore.user, false);
      }
      return null;
    },

    /**
      Fetches the external auth and if it exists modify the values as necessary.

      @method _getExternalAuth
      @return {Object|Undefined} The external auth.
    */
    _getExternalAuth: function() {
      const externalAuth = this.get('auth');
      if (externalAuth && externalAuth.user) {
        // When HJC supplies an external auth it's possible that the name is
        // stored in a nested user object.
        externalAuth.usernameDisplay = externalAuth.user.name;
        externalAuth.rootUserName = externalAuth.user.name;
      }
      return externalAuth;
    }

  }, {
    ATTRS: {
      html5: true,
      charmworldURL: {},
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
    'changes-utils',
    'juju-charm-models',
    'juju-bundle-models',
    'juju-controller-api',
    'juju-endpoints-controller',
    'juju-env-bakery',
    'juju-env-base',
    'juju-env-fakebackend',
    'juju-env-api',
    'juju-env-legacy-api',
    'juju-env-sandbox',
    'juju-env-web-handler',
    'juju-env-web-sandbox',
    'juju-models',
    'jujulib-utils',
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
    'notification-list',
    'panel-component',
    'sharing',
    'shortcuts',
    'usso-login-link',
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
    'event-tracker',
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
