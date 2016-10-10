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

  var components = window.juju.components; // eslint-disable-line no-unused-vars

  /**
   * The main app class.
   *
   * @class App
   */
  var extensions = [
    Y.juju.NSRouter,
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
            Y.each(this.keybindings, function(v, k) {
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
              <components.Shortcuts
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
          views.utils.exportEnvironmentFile(this.db);
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
      Y.each(key_map, function(v, k) {
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

      // Create a client side database to store state.
      this.db = new models.Database();
      // Create and set up a new instance of the charmstore.
      this._setupCharmstore(window.jujulib.charmstore);
      // Create and set up a new instance of the bundleservice.
      this._setupBundleservice(window.jujulib.bundleservice);
      // Create Romulus API client instances.
      this._setupRomulusServices(
        window.juju_config, window.jujulib, window.localStorage);

      // Set up a new modelController instance.
      this.modelController = new juju.ModelController({
        db: this.db,
        charmstore: this.get('charmstore')
      });

      let environments = juju.environments;
      this._setupUIState(cfg.sandbox, cfg.baseUrl);
      cfg.state = this.state;
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
      const modelUUID = this.get('modelUUID') ||
          (window.juju_config && window.juju_config.jujuEnvUUID);
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
      let getBundleChanges;
      if (controllerAPI) {
        // In Juju >= 2 we establish the controller API connection first, then
        // the model one. Also, bundle changes are always retrieved using the
        // controller connection.
        this.controllerAPI = this.setUpControllerAPI(
          controllerAPI, user, password, macaroons);
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
      var maasServer = this.env.get('maasServer');
      if (maasServer === undefined) {
        this.env.once('maasServerChange', this._onMaasServer, this);
      } else {
        this._displayMaasLink(maasServer);
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
        if (!evt.newVal) {
          // The model is not connected, do nothing waiting for a reconnection.
          return;
        }
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
      this.once('ready', function(e) {
        if (this.controllerAPI) {
          // In Juju >= 2 we connect to the controller and then to the model.
          this.controllerAPI.connect();
        } else {
          // We won't have a controller API connection in Juju 1.
          this.env.connect();
        }
        this.dispatch();
        this.on('*:autoplaceAndCommitAll', this._autoplaceAndCommitAll, this);
      }, this);

      this.zoomMessageHandler = Y.one(Y.config.win).on('resize', function(e) {
        this._handleZoomMessage();
      }, this);
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
      @return {environments.GoEnvironment} An instance of the environment class
        with the necessary events attached and values set. Or undefined if
        we're in a legacy juju model and no controllerAPI instance was supplied.
    */
    setUpControllerAPI: function(controllerAPI, user, password, macaroons) {
      const externalCreds = this._getAuth();
      controllerAPI.setAttrs({ user, password });
      if (externalCreds) {
        controllerAPI.setCredentials(externalCreds);
      } else {
        controllerAPI.setCredentials({ user, password, macaroons });
      }

      controllerAPI.after('login', evt => {
        if (evt.err) {
          this._renderLogin(evt.err);
          return;
        }
        // After logging in trigger the app to dispatch to re-render the
        // components that require an active connection to the controllerAPI.
        this.dispatch();
        // If the user is connected to a model then the modelList will be
        // fetched by the modelswitcher component.
        if (this.env.get('modelUUID')) {
          return;
        }
        // If the user isn't currently connected to a model then fetch the
        // available models so that we can connect to an available one.
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
          this.set('environmentList', modelList);
          // If the modelList has no models in it then we have to drop the
          // user into an uncommitted state.
          if (modelList.length === 0) {
            // Drop the user into the uncommitted state.
            console.log('No models available, using unconnected mode.');
            this.switchEnv();
            return;
          }
          if (modelList.some(data => data.id === this.env.get('modelId'))) {
            // If the user is already connected to a model in this list then
            // leave it be.
            return;
          }
          // Pick a model to connect to.
          const selectedModel = this._pickModel(modelList);
          if (selectedModel === null) {
            console.log('cannot select a model: using unconnected mode');
            // Drop the user into the unconnected state.
            this.switchEnv();
            return;
          }
          // Generate the valid socket URL and switch to this model.
          this.switchEnv(
            this.createSocketURL(
              this.get('socketTemplate'), selectedModel.uuid));
        });
      });

      controllerAPI.after('connectedChange', evt => {
        if (!evt.newVal) {
          // The controller is not connected, do nothing waiting for a
          // reconnection.
          return;
        }
        const creds = this.controllerAPI.getCredentials();
        if (!creds.areAvailable && !this.get('gisf')) {
          this._displayLogin();
          return;
        }
        // If we're in a JIMM controlled environment, HJC, or if we have
        // macaroon credentials then use the macaroon login. If not then uses
        // the standard u/p method.
        if (this.get('gisf') || creds.macaroons || creds.areExternal) {
          this.loginToAPIs(null, true, [this.controllerAPI]);
        } else {
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
      Parses the application URL to populate the state object without
      dispatching

      @method parseURLState
    */
    parseURLState: function(req, res, next) {
      this.state.loadRequest(req, '', {dispatch: false});
      next();
    },

    /**
      This method is to be passed to the components so that they can interact
      with the existing changeState system.

      @method changeState
      @param {Object} state The state to change the view to.
    */
    changeState: function(state) {
      this.fire('changeState', state);
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
            api.loginWithMacaroon(new Y.juju.environments.web.Bakery({
              webhandler: new Y.juju.environments.web.WebHandler(),
              interactive: this.get('interactiveLogin'),
              serviceName: 'juju',
              dischargeStore: window.localStorage,
              dischargeToken: window.juju_config.dischargeToken
            }), this._apiLoginHandler.bind(this, api));
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
      if (!views.utils.isRedirectError(err)) {
        // There is nothing to do in this case, and the user is already
        // prompted with the error in the login view.
        return;
      }
      // If the error is that redirection is required then we have to
      // make a request to get the appropriate model connection information.
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
        const server = servers[0].filter(server => server.scope === 'public');
        // Switch to the redirected model.
        this.switchEnv(this.createSocketURL(
          this.get('socketTemplate'),
          this.get('modelUUID'), server[0].value, server[0].port));
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
      ReactDOM.render(
        <window.juju.components.Login
          setCredentials={this.env.setCredentials.bind(this.env)}
          isLegacyJuju={this.isLegacyJuju()}
          loginToAPIs={this.loginToAPIs.bind(this)}
          errorMessage={err} />,
        document.getElementById('login-container'));
    },

    /**
      Renders the Logout component.

      @method _renderLogout
    */
    _renderLogout: function() {
      if (this.get('sandbox')) {
        // Do not show the logout link if the user is in sandbox mode.
        return;
      }
      // If the charmbrowser is open then don't show the logout link.
      var visible = !this.state.getState('current', 'sectionC', 'metadata');
      var charmstore = this.get('charmstore');
      var bakery = charmstore.bakery;
      ReactDOM.render(
        <window.juju.components.Logout
          logout={this.logout.bind(this)}
          clearCookie={bakery.clearCookie.bind(bakery)}
          charmstoreLogoutUrl={charmstore.getLogoutUrl()}
          getUser={this.getUser.bind(this, 'charmstore')}
          clearUser={this.clearUser.bind(this, 'charmstore')}
          visible={visible} />,
        document.getElementById('profile-link-container'));
    },

    /**
      Renders the user profile component.

      @method _renderUserProfile
    */
    _renderUserProfile: function() {
      const charmstore = this.get('charmstore');
      const utils = views.utils;
      // NOTE: we need to clone this.get('users') below; passing in without
      // cloning breaks React's ability to distinguish between this.props and
      // nextProps on the lifecycle methods.
      ReactDOM.render(
        <window.juju.components.UserProfile
          acl={this.acl}
          currentModel={this.get('modelUUID')}
          listBudgets={this.plans.listBudgets.bind(this.plans)}
          listModelsWithInfo={
            this.controllerAPI.listModelsWithInfo.bind(this.controllerAPI)}
          changeState={this.changeState.bind(this)}
          getAgreements={this.terms.getAgreements.bind(this.terms)}
          getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
          gisf={this.get('gisf')}
          interactiveLogin={this.get('interactiveLogin')}
          pluralize={utils.pluralize.bind(this)}
          staticURL={window.juju_config.staticURL}
          storeUser={this.storeUser.bind(this)}
          switchModel={utils.switchModel.bind(this,
            this.createSocketURL.bind(this, this.get('socketTemplate')),
            this.switchEnv.bind(this), this.env)}
          user={this._getAuth()}
          users={Y.clone(this.get('users'), true)}
          charmstore={this.get('charmstore')} />,
        document.getElementById('top-page-container'));
      // The model name should not be visible when viewing the profile.
      this._renderBreadcrumb({ showEnvSwitcher: false });
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
      var state = this.state;
      ReactDOM.render(
        <window.juju.components.EnvSizeDisplay
          changeState={this.changeState.bind(this)}
          getAppState={state.getState.bind(state)}
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
      var state = this.state;
      ReactDOM.render(
        <window.juju.components.HeaderSearch
          changeState={this.changeState.bind(this)}
          getAppState={state.getState.bind(state)} />,
        document.getElementById('header-search-container'));
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

      @method _renderDeployment
      @param {String} activeComponent The active component state to display.
    */
    _renderDeployment: function(metadata) {
      const env = this.env;
      const currentChangeSet = env.get('ecs').getCurrentChangeSet();
      if (Object.keys(currentChangeSet).length === 0) {
        // If there are no changes then close the deployment flow. This is to
        // prevent showing the deployment flow if the user clicks back in the
        // browser or navigates directly to the url. This changeState needs to
        // happen in app.js, not the component otherwise it will have to try and
        // interrupt the mount to unmount the component.
        this.changeState({
          sectionC: {
            component: null,
            metadata: null
          }
        });
        return;
      }
      const changesUtils = this.changesUtils;
      const controllerAPI = this.controllerAPI;
      const db = this.db;
      const services = db.services;
      const utils = views.utils;
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
      const credentials = controllerAPI && controllerAPI.getCredentials();
      const user = credentials && credentials.user || undefined;
      ReactDOM.render(
        <window.juju.components.DeploymentFlow
          acl={this.acl}
          changesFilterByParent={
            changesUtils.filterByParent.bind(changesUtils, currentChangeSet)}
          changeState={this.changeState.bind(this)}
          cloud={cloud}
          credential={env.get('credential')}
          changes={currentChangeSet}
          deploy={utils.deploy.bind(utils, this)}
          generateAllChangeDescriptions={
            changesUtils.generateAllChangeDescriptions.bind(
              changesUtils, services, db.units)}
          generateCloudCredentialName={utils.generateCloudCredentialName}
          getCloudCredentials={
            controllerAPI && controllerAPI.getCloudCredentials.bind(
              controllerAPI)}
          getCloudCredentialNames={
            controllerAPI && controllerAPI.getCloudCredentialNames.bind(
              controllerAPI)}
          groupedChanges={changesUtils.getGroupedChanges(currentChangeSet)}
          isLegacyJuju={this.isLegacyJuju()}
          listBudgets={this.plans.listBudgets.bind(this.plans)}
          listClouds={
            controllerAPI && controllerAPI.listClouds.bind(controllerAPI)}
          listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
          modelCommitted={env.get('connected')}
          modelName={db.environment.get('name')}
          region={env.get('region')}
          servicesGetById={services.getById.bind(services)}
          updateCloudCredential={
            controllerAPI && controllerAPI.updateCloudCredential.bind(
              controllerAPI)}
          user={user}
          withPlans={false} />,
        document.getElementById('deployment-container'));
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
          changeState={this.changeState.bind(this)}
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
      Renders the import and export component to the page in the
      designated element.

      @method _renderImportExport
    */
    _renderImportExport: function() {
      var env = this.env;
      var ecs = env.get('ecs');
      var db = this.db;
      var services = db.services;
      var servicesArray = services.toArray();
      var machines = db.machines.toArray();
      var utils = views.utils;
      ReactDOM.render(
        <window.juju.components.ImportExport
          acl={this.acl}
          changeState={this.changeState.bind(this)}
          currentChangeSet={ecs.getCurrentChangeSet()}
          exportEnvironmentFile={
            utils.exportEnvironmentFile.bind(utils, db,
              env.findFacadeVersion('Application') === null)}
          hasEntities={servicesArray.length > 0 || machines.length > 0}
          hideDragOverNotification={this._hideDragOverNotification.bind(this)}
          importBundleFile={this.bundleImporter.importBundleFile.bind(
            this.bundleImporter)}
          renderDragOverNotification={
            this._renderDragOverNotification.bind(this)} />,
        document.getElementById('import-export-container'));
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
        <components.Panel
          instanceName="inspector-panel"
          visible={db.services.size() > 0}>
          <components.AddedServicesList
            services={db.services}
            hoveredId={hoveredId}
            updateUnitFlags={db.updateUnitFlags.bind(db)}
            findRelatedServices={db.findRelatedServices.bind(db)}
            findUnrelatedServices={db.findUnrelatedServices.bind(db)}
            getUnitStatusCounts={views.utils.getUnitStatusCounts}
            hoverService={ServiceModule.hoverService.bind(ServiceModule)}
            panToService={ServiceModule.panToService.bind(ServiceModule)}
            changeState={this.changeState.bind(this)} />
        </components.Panel>,
        document.getElementById('inspector-container'));
    },

    /**
      Renders the Inspector component to the page.

      @method _renderInspector
      @param {Object} metadata The data to pass to the inspector which tells it
        how to render.
    */
    _renderInspector: function(metadata) {
      var relationUtils = this.relationUtils;
      var state = this.state;
      var utils = views.utils;
      var topo = this.views.environment.instance.topo;
      var charmstore = this.get('charmstore');
      var inspector;
      var service = this.db.services.getById(metadata.id);
      var localType = metadata.localType;
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
          <components.Inspector
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
            changeState={this.changeState.bind(this)}
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
            appState={state.get('current')}
            appPreviousState={state.get('previous')} />
        );
      } else if (localType && metadata.flash && metadata.flash.file) {
        // When dragging a local charm zip over the canvas it animates the
        // drag over notification which needs to be closed when the inspector
        // is opened.
        this._hideDragOverNotification();
        var localCharmHelpers = juju.localCharmHelpers;
        inspector = (
          <components.LocalInspector
            acl={this.acl}
            file={metadata.flash.file}
            localType={localType}
            services={this.db.services}
            series={utils.getSeriesList()}
            uploadLocalCharm={
                localCharmHelpers.uploadLocalCharm.bind(
                this, this.env, this.db)}
            upgradeServiceUsingLocalCharm={
                localCharmHelpers.upgradeServiceUsingLocalCharm.bind(
                this, this.env, this.db)}
            changeState={this.changeState.bind(this)} />
        );
      } else {
        this.changeState({
          sectionA: {
            component: 'applications',
            metadata: null
          }
        });
        return;
      }
      ReactDOM.render(
        <components.Panel
          instanceName="inspector-panel"
          visible={true}
          metadata={metadata}>
          {inspector}
        </components.Panel>,
        document.getElementById('inspector-container'));
    },

    /**
      Renders the Charmbrowser component to the page in the designated element.

      @method _renderCharmbrowser
      @param {Object} metadata The data to pass to the charmbrowser which tells
        it how to render.
    */
    _renderCharmbrowser: function(metadata) {
      var state = this.state;
      var utils = views.utils;
      var charmstore = this.get('charmstore');
      // Configure syntax highlighting for the markdown renderer.
      marked.setOptions({
        highlight: function(code, lang) {
          var language = Prism.languages[lang];
          if (language) {
            return Prism.highlight(code, language);
          }
        }
      });
      ReactDOM.render(
        <components.Charmbrowser
          acl={this.acl}
          apiUrl={charmstore.url}
          charmstoreSearch={charmstore.search.bind(charmstore)}
          displayPlans={!this.isLegacyJuju()}
          series={utils.getSeriesList()}
          importBundleYAML={this.bundleImporter.importBundleYAML.bind(
              this.bundleImporter)}
          getBundleYAML={charmstore.getBundleYAML.bind(charmstore)}
          getEntity={charmstore.getEntity.bind(charmstore)}
          getFile={charmstore.getFile.bind(charmstore)}
          getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
          listPlansForCharm={this.plans.listPlansForCharm.bind(this.plans)}
          renderMarkdown={marked.bind(this)}
          deployService={this.deployService.bind(this)}
          appState={state.get('current')}
          changeState={this.changeState.bind(this)}
          utils={utils}
          staticURL={window.juju_config.staticURL}
          charmstoreURL={window.juju_config.charmstoreURL}
          apiVersion={window.jujulib.charmstoreAPIVersion}
          addNotification={
            this.db.notifications.add.bind(this.db.notifications)}
          makeEntityModel={Y.juju.makeEntityModel} />,
        document.getElementById('charmbrowser-container'));
    },

    _emptySectionApp: function() {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('login-container'));
    },

    _emptySectionA: function() {
      if (this.hoverService) {
        this.hoverService.detach();
      }
    },
    /**
      Empties out the sectionB UI making sure to properly clean up.

      @method emptySectionB
    */
    emptySectionB: function() {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('machine-view'));
      ReactDOM.unmountComponentAtNode(
        document.getElementById('top-page-container'));
    },

    _emptySectionC: function() {
      // If the model name has been hidden by the profile then show it again.
      this._renderBreadcrumb({ showEnvSwitcher: true });
      ReactDOM.unmountComponentAtNode(
        document.getElementById('charmbrowser-container'));
      ReactDOM.unmountComponentAtNode(
        document.getElementById('deployment-container'));
    },

    /**
      Handles rendering and/or updating the machine UI component.

      @method _machine
      @param {Object|String} metadata The metadata to pass to the machine
        view.
    */
    _renderMachineView: function(metadata) {
      var db = this.db;
      ReactDOM.render(
        <components.MachineView
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
        <components.ExpandingProgress />,
        document.getElementById('drag-over-notification-container'));
    },

    /**
      Sets up the UIState instance on the app

      @method _setupUIState
      @param {Boolean} sandbox
      @param {String} baseUrl
    */
    _setupUIState: function(sandbox, baseUrl) {
      this.state = new models.UIState({
        baseUrl: baseUrl || '',
        dispatchers: {}
      });
      var dispatchers = this.state.get('dispatchers');
      dispatchers.sectionA = {
        applications: this._renderAddedServices.bind(this),
        inspector: this._renderInspector.bind(this),
        empty: this._emptySectionA.bind(this)
      };
      dispatchers.sectionB = {
        account: this._renderAccount.bind(this),
        machine: this._renderMachineView.bind(this),
        profile: this._renderUserProfile.bind(this),
        isv: this._renderISVProfile.bind(this),
        empty: this.emptySectionB.bind(this)
      };
      dispatchers.sectionC = {
        charmbrowser: this._renderCharmbrowser.bind(this),
        deploy: this._renderDeployment.bind(this),
        empty: this._emptySectionC.bind(this)
      };
      dispatchers.app = {
        login: this._renderLogin.bind(this, null),
        deployTarget: views.utils.deployTargetDispatcher.bind(this),
        empty: this._emptySectionApp.bind(this)
      };
      this.state.set('dispatchers', dispatchers);
      this.on('*:changeState', this._changeState, this);
    },

    /**
      Sets up the UIState instance on the app

      @method _changeState
      @param {Object} e The event facade.
    */
    _changeState: function(e) {
      var state = e.details[0];
      var url = this.state.generateUrl(state);
      this.navigate(url);
    },

    /**
      Chooses a model to connect to from the model list based on config and/or
      model availability in this controller.

      @method _pickModel
      @param {Array} modelList The list of models to pick from.
      @return {Object} The selected model, or null if there are no models
        accessible by the user.
     */
    _pickModel: function(modelList) {
      if (!modelList.length) {
        return null;
      }
      let matching = [];
      // At this point the modelUUID attribute could have been removed by
      // the logout process, so fall back to the provided configuration.
      const modelUUID = this.get('modelUUID') ||
          (window.juju_config && window.juju_config.jujuEnvUUID);
      if (modelUUID) {
        matching = modelList.filter(model => model.uuid === modelUUID);
      }
      // XXX This picks the first model if one is not provided by config or
      // not available. We'll want to default to disconnected mode then allow
      // the user to choose a model in this case.
      const selectedModel = matching.length ? matching[0] : modelList[0];
      this.set('modelUUID', selectedModel.uuid);
      return selectedModel;
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
        var existingMacaroons, existingCookie, existingDischargeToken;
        if (!jujuConfig || !jujuConfig.charmstoreURL) {
          console.error('no juju config for charmstoreURL availble');
        } else {
          charmstoreURL = jujuConfig.charmstoreURL;
          existingMacaroons = jujuConfig.charmstoreMacaroons;
          existingDischargeToken = jujuConfig.dischargeToken;
        }
        var apiVersion = window.jujulib.charmstoreAPIVersion;
        if (window.flags && window.flags.gisf) {
          existingCookie = 'macaroon-storefront';
        }
        var bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          interactive: this.get('interactiveLogin'),
          setCookiePath: `${charmstoreURL}${apiVersion}/set-auth-cookie`,
          staticMacaroonPath: `${charmstoreURL}${apiVersion}/macaroon`,
          existingCookie: existingCookie,
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
      var bakery = new Y.juju.environments.web.Bakery({
        serviceName: 'plans',
        macaroon: config.plansMacaroons,
        webhandler: webHandler,
        interactive: interactive,
        cookieStore: storage,
        dischargeStore: window.localStorage,
        dischargeToken: config.dischargeToken
      });
      this.plans = new window.jujulib.plans(config.plansURL, bakery);
      var bakery = new Y.juju.environments.web.Bakery({
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
      if (!this._determineFileType(e.dataTransfer)) {
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

      Unfortunately Chrome, Firefox, And IE in OSX and Windows do not show mime
      types for files that it is not familiar with. This isn't an issue once the
      user has dropped the file because we can parse the file name but while
      it's still hovering the browser only tells us the mime type if it knows
      it, else it's an empty string. This means that we cannot determine between
      a yaml file or a folder during hover.
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

      // IE10, 11 and Firefox do not have this property during hover so we
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
      When the user provides a charm id in the deploy-target query param we want
      to auto deploy that charm.

      @method _autoplaceAndCommitAll
    */
    _autoplaceAndCommitAll: function() {
      this._autoPlaceUnits();
      this.env.get('ecs').commit(this.env);
    },

    /**
     * Display a small screen message using browser data.
     *
     * @method _handleZoomMessage
     */
    _handleZoomMessage: function() {
      this._displayZoomMessage(Y.one('body').get('winWidth'), Y.UA.os);
    },

    /**
     * Display a message when the browser is too small to work.
     *
     * @method _displayZoomMessage
     */
    _displayZoomMessage: function(viewportWidth, os) {
      var metaKey = (os === 'macintosh') ? 'command' : 'ctrl';
      // Only display the message once otherwise the message will continually
      // fire while the browser is being resized or zoomed.
      if (!this.zoomMessageDisplayed && viewportWidth <= 1024) {
        this.db.notifications.add({
          title: 'Browser size adjustment',
          message: 'This browser needs to be maximised or zoomed out to' +
              ' display the Juju GUI properly. Try using "' + metaKey +
              '+-" to zoom the window.',
          level: 'error'
        });
        this.zoomMessageDisplayed = true;
      }
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
      if (this.zoomMessageHandler) {
        this.zoomMessageHandler.detach();
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
      Y.each(this.behaviors, function(behavior) {
        behavior.callback.call(this);
      }, this);

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
      this.dispatch();
      this._renderComponents();
    },

    /**
      Display the login page.

      @method _displayLogin
    */
    _displayLogin: function() {
      this.set('loggedIn', false);
      var component = this.state.getState('current', 'app', 'component');
      if (!component || component !== 'login') {
        this.state.dispatch({
          app: {
            component: 'login',
            metadata: {
              redirectPath: this.get('currentUrl')
            }
          }
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
          this._renderLogin(null);
        });
      });
    },

    // Persistent Views

    /**
     * Ensure that the current user has authenticated.
     *
     * @method checkUserCredentials
     * @param {Object} req The request.
     * @param {Object} res ???
     * @param {Object} next The next route handler.
     *
     */
    checkUserCredentials: function(req, res, next) {
      const apis = [this.env, this.controllerAPI];
      // Loop through each api connection and see if we are properly
      // authenticated. If we aren't then display the login screen.
      const shouldDisplayLogin = apis.some(api => {
        if (!api || !api.get('connected')) {
          // If we do not have an api instance or if we are not connected with
          // it then we don't need to concern ourselves with being
          // authenticated to it.
          return false;
        }
        return !api.userIsAuthenticated;
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
      var currentPath = this.get('currentUrl');
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
      this.maskVisibility(false);
      this._emptySectionApp();
      this.set('loggedIn', true);
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
      this._renderImportExport();
      this._renderBreadcrumb();
      this._renderHeaderSearch();
      // When we render the components we also want to trigger the rest of
      // the application to render but only based on the current state.
      this.state.dispatch();
    },

    /**
     * @method show_environment
     */
    show_environment: function(req, res, next) {
      if (!this.renderEnvironment) {
        next(); return;
      }
      var options = {
        getModelURL: Y.bind(this.getModelURL, this),
        nsRouter: this.nsRouter,
        endpointsController: this.endpointsController,
        useDragDropImport: this.get('sandbox'),
        db: this.db,
        env: this.env,
        ecs: this.env.ecs,
        charmstore: this.get('charmstore'),
        bundleImporter: this.bundleImporter,
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
      this._renderLogout();

      // Display the zoom message on page load.
      this._handleZoomMessage();
      next();
    },

    /**
     * Object routing support
     *
     * This utility helps map from model objects to routes
     * defined on the App object. See the routes Attribute
     * for additional information.
     *
     * @param {object} model The model to determine a route URL for.
     * @param {object} [intent] the name of an intent associated with a route.
     *   When more than one route can match a model, the route without an
     *   intent is matched when this attribute is missing.  If intent is
     *   provided as a string, it is matched to the `intent` attribute
     *   specified on the route. This is effectively a tag.
     * @method getModelURL
     */
    getModelURL: function(model, intent) {
      var matches = [],
          attrs = (model instanceof Y.Model) ? model.getAttrs() : model,
          routes = this.get('routes'),
          regexPathParam = /([:*])([\w\-]+)?/g,
          idx = 0,
          finalPath = '';

      routes.forEach(function(route) {
        var path = route.path,
            required_model = route.model,
            reverse_map = route.reverse_map;

        // Fail fast on wildcard paths, on routes without models,
        // and when the model does not match the route type.
        if (path === '*' ||
            required_model === undefined ||
            model.name !== required_model) {
          return;
        }

        // Replace the path params with items from the model's attributes.
        path = path.replace(regexPathParam,
                            function(match, operator, key) {
                              if (reverse_map !== undefined &&
                                  reverse_map[key]) {
                                key = reverse_map[key];
                              }
                              return attrs[key];
                            });
        matches.push(Y.mix({path: path,
          route: route,
          attrs: attrs,
          intent: route.intent,
          namespace: route.namespace}));
      });

      // See if intent is in the match. Because the default is to match routes
      // without intent (undefined), this test can always be applied.
      matches = matches.filter(match => {
        return match.intent === intent;
      });

      if (matches.length > 1) {
        console.warn('Ambiguous routeModel', attrs.id, matches);
        // Default to the last route in this configuration error case.
        idx = matches.length - 1;
      }

      if (matches[idx] && matches[idx].path) {
        finalPath = this.nsRouter.url({ gui: matches[idx].path });
      }
      return finalPath;
    },

    /**
     * Make sure the user agrees to cookie usage.
     *
     * @method authorizeCookieUse
     * @param {Object} req The request.
     * @param {Object} res The response.
     * @param {Object} next The next route handler.
     *
     */
    authorizeCookieUse: function(req, res, next) {
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
            this._renderUserProfile();
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
      var externalAuth = this.get('auth');
      if (externalAuth) {
        return externalAuth;
      }
      var users = this.get('users');
      var user;
      if (users) {
        var controllerUser;
        // Sometimes _getAuth may be called before the env connection is
        // established, particularly when the app is being initialized.
        if (this.env) {
          var credentials = this.env.getCredentials();
          if (credentials.user) {
            controllerUser = {user: credentials.user};
          }
        }
        // Precedence order of the various services used by the GUI:
        user = controllerUser || users.charmstore;
        if (user && user.user) {
          user.usernameDisplay = user.user;
        }
      }
      return user;
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
       * @attribute currentUrl
       * @default '/'
       * @type {String}
       *
       */
      currentUrl: {

        /**
         * @attribute currentUrl.getter
         */
        getter: function() {
          // The result is a normalized version of the currentURL.
          // Specifically, it omits any tokens used for authentication or
          // change set retrieval, and uses our standard path
          // normalizing tool (currently the nsRouter).
          var nsRouter = this.nsRouter;
          // `this.location` is a test-friendly access of window.location.
          var routes = nsRouter.parse(this.location.toString());
          if (routes.search) {
            var qs = Y.QueryString.parse(routes.search);
            ['authtoken', 'changestoken'].forEach(function(token) {
              if (Y.Lang.isValue(qs[token])) {
                // Remove the token from the URL. It is a one-shot, designed to
                // be consumed.  We don't want it to be in the URL after it has
                // been used.
                delete qs[token];
              }
            });
            routes.search = Y.QueryString.stringify(qs);
          }
          // Use the nsRouter to normalize.
          return nsRouter.url(routes);
        }
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
      },

      /**
       * Routes
       *
       * Each request path is evaluated against all hereby defined routes,
       * and the callbacks for all the ones that match are invoked,
       * without stopping at the first one.
       *
       * To support this we supplement our routing information with
       * additional attributes as follows:
       *
       * `namespace`: (optional) when namespace is specified this route should
       *   only match when the URL fragment occurs in that namespace. The
       *   default namespace (as passed to this.nsRouter) is assumed if no
       *   namespace attribute is specified.
       *
       * `model`: `model.name` (required)
       *
       * `reverse_map`: (optional) A reverse mapping of `route_path_key` to the
       *   name of the attribute on the model.  If no value is provided, it is
       *   used directly as attribute name.
       *
       * `intent`: (optional) A string named `intent` for which this route
       *   should be used. This can be used to select which subview is selected
       *   to resolve a model's route.
       *
       * @attribute routes
       */
      routes: {
        value: [
          // Called on each request.
          { path: '*', callbacks: 'parseURLState'},
          { path: '*', callbacks: 'checkUserCredentials'},
          { path: '*', callbacks: 'show_environment'},
          { path: '*', callbacks: 'authorizeCookieUse'}
        ]
      }
    }
  });

  Y.namespace('juju').App = JujuGUI;

}, '0.5.3', {
  requires: [
    'acl',
    'changes-utils',
    'juju-app-state',
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
    'ns-routing-app-extension',
    // React components
    'account',
    'added-services-list',
    'charmbrowser-component',
    'deployment-bar',
    'deployment-flow',
    'env-size-display',
    'header-breadcrumb',
    'import-export',
    'expanding-progress',
    'header-search',
    'inspector-component',
    'isv-profile',
    'local-inspector',
    'machine-view',
    'login-component',
    'logout-component',
    'notification-list',
    'panel-component',
    'shortcuts',
    'user-profile',
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
