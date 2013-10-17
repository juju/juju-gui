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

var spinner;

/**
 * Provide the main App class, based on the YUI App framework. Also provide
 * the routing definitions, which map the request paths to the top-level
 * views defined by the App class.
 *
 * @module app
 */

// Create a global for debug console access to YUI context.
var yui;

YUI.add('juju-gui', function(Y) {

  // Assign the global for console access.
  yui = Y;

  var juju = Y.namespace('juju'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      utils = views.utils,
      widgets = Y.namespace('juju.widgets');

  /**
   * The main app class.
   *
   * @class App
   */
  var JujuGUI = Y.Base.create('juju-gui', Y.App, [
                                                  Y.juju.SubAppRegistration,
                                                  Y.juju.NSRouter,
                                                  Y.juju.Cookies,
                                                  Y.juju.GhostDeployer], {

    /*
      Extension properties
    */
    subApplications: [{
      type: Y.juju.subapps.Browser,
      config: {}
    }],

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

      login: {
        type: 'juju.views.login',
        preserve: false
      },

      environment: {
        type: 'juju.views.environment',
        preserve: true
      },

      service: {
        type: 'juju.views.service',
        preserve: false,
        parent: 'environment'
      },

      service_config: {
        type: 'juju.views.service_config',
        preserve: false,
        parent: 'service'
      },

      service_constraints: {
        type: 'juju.views.service_constraints',
        preserve: false,
        parent: 'service'
      },

      service_relations: {
        type: 'juju.views.service_relations',
        preserve: false,
        parent: 'service'
      },

      unit: {
        type: 'juju.views.unit',
        preserve: false,
        parent: 'service'
      },

      charm: {
        type: 'juju.views.charm',
        preserve: false
      },

      notifications: {
        type: 'juju.views.NotificationsView',
        preserve: true
      },

      notifications_overview: {
        type: 'juju.views.NotificationsOverview'
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
     *
     * All are optional.
     */
    keybindings: {
      'A-s': {
        target: '#charm-search-field',
        focus: true,
        help: 'Select the charm Search'
      },
      '/': {
        target: '#charm-search-field',
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
                bindings.push({key: k, help: v.help});
              }
            }, this);
            target.setHTML(
                views.Templates.shortcuts({bindings: bindings}));
          }
        },
        help: 'Display this help'
      },
      'A-e': {
        callback: function(evt) {
          this.fire('navigateTo', { url: '/:gui:/' });
        },
        help: 'Navigate to the Environment overview.'
      },
      'S-+': {
        fire: 'zoom_in',
        help: 'Zoom In'
      },
      'S--': {
        fire: 'zoom_out',
        help: 'Zoom Out'
      },
      'S-0': {
        fire: 'panToCenter',
        help: 'Center the Environment overview'
      },
      'esc': {
        fire: 'clearState',
        callback: function() {
          // Explicitly hide anything we might care about.
          Y.one('#shortcut-help').hide();
        },
        help: 'Cancel current action'
      },

      'C-s': {
        'condition': function() {
          return this._simulator !== undefined;
        },
        callback: function() {
          this._simulator.toggle();
        },
        help: 'Toggle the simulator'
      },

      'S-d': {
        callback: function(evt) {
          this.exportYAML();
        },
        help: 'Export the environment'
      },

      'C-S-d': {
        callback: function(evt) {
          Y.fire('saveWebsocketLog');
        },
        help: 'Save the websocket log to a file'
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
        var source = evt.target.getDOMNode();
        // Target filtering, we want to listen on window
        // but not honor hotkeys when focused on
        // text oriented input fields
        if (['INPUT', 'TEXTAREA'].indexOf(source.tagName) !== -1) {
          return;
        }
        var symbolic = [];
        if (evt.ctrlKey) { symbolic.push('C');}
        if (evt.altKey) { symbolic.push('A');}
        if (evt.shiftKey) { symbolic.push('S');}
        if (code_map[evt.keyCode]) {
          symbolic.push(code_map[evt.which]);
        } else {
          symbolic.push(String.fromCharCode(evt.which).toLowerCase());
        }
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

      if (window.flags && window.flags.websocket_capture) {
        this.websocketLogging = new Y.juju.WebsocketLogging();
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

      // Create a client side database to store state.
      this.db = new models.Database();

      // Optional Landscape integration helper.
      this.landscape = new views.Landscape();
      this.landscape.set('db', this.db);

      // Set up a new modelController instance.
      this.modelController = new juju.ModelController({
        db: this.db,
        store: this.get('store')
      });

      // Update the on-screen environment name provided in the configuration,
      // or a default if none is configured.
      var environment_name = this.get('environment_name') || 'Environment',
          environment_node = Y.one('#environment-name');

      // Some tests do not fully populate the DOM, so we check to be sure.
      if (Y.Lang.isValue(environment_node)) {
        environment_node.set('text', environment_name);
      }
      // Create an environment facade to interact with.
      // Allow "env" as an attribute/option to ease testing.
      if (this.get('env')) {
        this.env = this.get('env');
      } else {
        // Calculate the socket_url.
        var socketUrl = this.get('socket_url');
        var socketPort = this.get('socket_port');
        var socketProtocol = this.get('socket_protocol');
        if (socketPort || socketProtocol) {
          // Assemble a socket URL from the Location.
          var loc = Y.getLocation();
          socketPort = socketPort || loc.port;
          socketProtocol = socketProtocol || 'wss';
          socketUrl = socketProtocol + '://' + loc.hostname;
          if (socketPort) {
            socketUrl += ':' + socketPort;
          }
          socketUrl += '/ws';
          this.set('socket_url', socketUrl);
        }
        // Instantiate the environment specified in the configuration, choosing
        // between the available implementations, currently Go and Python.
        var envOptions = {
          socket_url: socketUrl,
          user: this.get('user'),
          password: this.get('password'),
          readOnly: this.get('readOnly'),
          conn: this.get('conn')
        };
        var apiBackend = this.get('apiBackend');
        if (this.get('sandbox')) {
          var sandboxModule = Y.namespace('juju.environments.sandbox');
          var State = Y.namespace('juju.environments').FakeBackend;
          var state = new State({store: this.get('store')});
          if (envOptions.user && envOptions.password) {
            var credentials = {};
            credentials[envOptions.user] = envOptions.password;
            state.set('authorizedUsers', credentials);
          }
          if (apiBackend === 'python') {
            envOptions.conn = new sandboxModule.ClientConnection(
                {juju: new sandboxModule.PyJujuAPI({state: state})});
          } else if (apiBackend === 'go') {
            envOptions.conn = new sandboxModule.ClientConnection(
                {juju: new sandboxModule.GoJujuAPI({state: state})});
          } else {
            // Clean ourselves up before giving up the ghost, for tests' sake.
            this.destroy();
            throw 'unrecognized backend type: ' + apiBackend;
          }

        }
        this.env = juju.newEnvironment(envOptions, apiBackend);
      }

      // Create an event simulator where possible.
      // Starting the simulator is handled by hotkeys
      // and/or the config setting 'simulateEvents'.
      this.simulateEvents();

      // Set the env in the model controller here so
      // that we know that it's been setup.
      this.modelController.set('env', this.env);

      // Create notifications controller
      this.notifications = new juju.NotificationController({
        app: this,
        env: this.env,
        notifications: this.db.notifications});

      this.on('*:navigateTo', function(e) {
        this.navigate(e.url);
      }, this);

      // Notify user attempts to modify the environment without permission.
      this.env.on('permissionDenied', this.onEnvPermissionDenied, this);

      // When the provider type and environment names become available,
      // display them.
      this.env.after('providerTypeChange', this.onProviderTypeChange, this);
      this.env.after('environmentNameChange',
          this.onEnvironmentNameChange, this);
      this.env.after('defaultSeriesChange', this.onDefaultSeriesChange, this);

      // Once the user logs in, we need to redraw.
      this.env.after('login', this.onLogin, this);

      // Feed environment changes directly into the database.
      this.env.on('delta', this.db.onDelta, this.db);

      // Feed delta changes to the notifications system.
      this.env.on('delta', this.notifications.generate_notices,
          this.notifications);

      // Handlers for adding and removing services to the service list.
      this.endpointsController = new juju.EndpointsController({
        db: this.db,
        modelController: this.modelController
      });
      this.endpointsController.bind();

      // When the connection resets, reset the db, re-login (a delta will
      // arrive with successful authentication), and redispatch.
      this.env.after('connectedChange', function(ev) {
        if (ev.newVal === true) {
          this.db.reset();
          this.env.userIsAuthenticated = false;
          // Do not attempt environment login without credentials.
          var credentials = this.env.getCredentials();
          if (credentials && credentials.areAvailable) {
            this.env.login();
          } else {
            this.checkUserCredentials();
          }
        }
      }, this);

      // If the database updates, redraw the view (distinct from model updates).
      // TODO: bound views will automatically update this on individual models.
      this.db.on('update', this.on_database_changed, this);

      this.enableBehaviors();

      this.once('ready', function(e) {
        if (this.get('socket_url') || this.get('sandbox')) {
          // Connect to the environment.
          this.env.connect();
        }
        if (this.get('activeView')) {
          this.get('activeView').render();
        } else {
          this.dispatch();
        }
      }, this);

      // Halt the default navigation on the juju logo to allow us to show
      // the real root view without namespaces
      var navNode = Y.one('#nav-brand-env');
      // Tests won't have this node.
      if (navNode) {
        navNode.on('click', function(e) {
          e.halt();
          this.showRootView();
        }, this);
      }

      Y.one('#logout-trigger').on('click', function(e) {
        // If this is not a Get Juju link then allow it to work as normal.
        if (!this.get('showGetJujuButton')) {
          e.halt();
          this.logout();
        }
      }, this);

      var exportNode = Y.one('#export-trigger');
      // Tests won't have this node.
      if (exportNode) {
        exportNode.on('click', function(e) {
          e.halt();
          this.exportYAML();
        }, this);
      }

      // Attach SubApplications. The subapps should share the same db.
      cfg.db = this.db;

      // To use the new service Inspector use the deploy method
      // from the Y.juju.GhostDeployer extension
      cfg.deploy = Y.bind(this.deployService, this);

      cfg.deployBundle = this.deployBundle.bind(this);

      // Watch specific things, (add units), remove db.update above
      // Note: This hides under the flag as tests don't properly clean
      // up sometimes and this binding creates spooky interaction
      // at a distance and strange failures.
      this.db.services.after(
          ['add', 'remove', '*:change'],
          this.on_database_changed, this);
      this.db.relations.after(
          ['add', 'remove', '*:change'],
          this.on_database_changed, this);

      // Share the store instance with subapps.
      cfg.store = this.get('store');
      cfg.envSeries = this.env.get('defaultSeries');
      this.addSubApplications(cfg);

      // When someone wants a charm to be deployed they fire an event and we
      // show the charm panel to configure/deploy the service.
      Y.on('initiateDeploy', function(charm, ghostAttributes) {
        cfg.deploy(charm, ghostAttributes);
      }, this);
    },

    /**
      Calls the deployer import method with the bundle data
      to deploy the bundle to the environment.

      @method deployBundle
      @param {Object} bundle Bundle data.
    */
    deployBundle: function(bundle) {
      var notifications = this.db.notifications;
      this.env.deployerImport(
          Y.JSON.stringify({
            bundle: bundle
          }), null, Y.bind(utils.deployBundleCallback, null, notifications));
    },

    /**
    Export the YAML for this environment.

    @method exportYAML
    */
    exportYAML: function() {
      var result = this.db.exportDeployer();
      var exportData = jsyaml.dump(result);
      var exportBlob = new Blob([exportData],
          {type: 'application/yaml;charset=utf-8'});
      saveAs(exportBlob, 'export.yaml');
    },

    /**
    Start the simulator if it can start and it has not already been started.

    @method simulateEvents
    */
    simulateEvents: function() {
      if (!this._simulator && this.env) {
        // Try/Catch this to allow mocks in tests.
        try {
          var conn = this.env.get('conn');
          var juju = conn && conn.get('juju');
          var state = juju && juju.get('state');
          if (state) {
            var Simulator = Y.namespace('juju.environments').Simulator;
            this._simulator = new Simulator({state: state});
            if (this.get('simulateEvents')) {
              this._simulator.start();
            }
          }
        }
        catch (err) {
          // Unable to create simulator, usually due to mocks or an
          // unsupported environment
          console.log('Unable to create simulator: ');
        }
      }
    },

    /**
    Release resources and inform subcomponents to do the same.

    @method destructor
    */
    destructor: function() {
      if (this._keybindings) {
        this._keybindings.detach();
      }
      if (this._simulator) {
        this._simulator.stop();
      }
      Y.each(
          [this.env, this.db, this.notifications,
           this.landscape, this.endpointsController],
          function(o) {
            if (o && o.destroy) {
              o.detachAll();
              o.destroy();
            }
          }
      );
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
      Y.log(evt, 'debug', 'App: Database changed');
      // Database changed event is fired when the user logs-in but we deal with
      // that case manually so we don't need to dispatch the whole application.
      // This whole handler can be removed once we go to model bound views.
      if (window.location.pathname.match(/login/)) {
        return;
      }

      // This timeout helps to reduce the number of needless dispatches from
      // upwards of 8 to 2. At least until we can move to the model bound views.
      if (this.dbChangedTimer) {
        this.dbChangedTimer.cancel();
      }
      this.dbChangedTimer = Y.later(100, this, this._dbChangedHandler);
      return;
    },

    /**
      After the db has changed and the timer has timed out to reduce repeat
      calls then this is called to handle the db updates.

      @method _dbChangedHandler
      @private
    */
    _dbChangedHandler: function() {
      var active = this.get('activeView');

      // Update Landscape annotations.
      this.landscape.update();

      // Regardless of which view we are rendering,
      // update the env view on db change.
      if (this.views.environment.instance) {
        this.views.environment.instance.topo.update();
      }
      // Redispatch to current view to update.
      if (active && active.name === 'EnvironmentView') {
        active.rendered();
      } else {
        this.dispatch();
      }
    },

    // Route handlers

    /**
     * @method show_notifications_overview
     */
    show_notifications_overview: function(req) {
      this.showView('notifications_overview', {
        env: this.env,
        notifications: this.db.notifications,
        nsRouter: this.nsRouter
      });
    },

    /**
     * Show the login screen.
     *
     * @method showLogin
     * @return {undefined} Nothing.
     */
    showLogin: function() {
      this.showView('login', {
        env: this.env,
        help_text: this.get('login_help')
      });
      var passwordField = this.get('container').one('input[type=password]');
      // The password field may not be present in testing context.
      if (passwordField) {
        passwordField.focus();
      }
    },

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
      this.env.logout();
      return;
    },

    // Persistent Views

    /**
     * `notifications` is a preserved view that remains rendered on all main
     * views.  We manually create an instance of this view and insert it into
     * the App's view metadata.
     *
     * @method show_notifications_view
     */
    show_notifications_view: function(req, res, next) {
      var view = this.getViewInfo('notifications'),
          instance = view.instance;
      if (!instance) {
        view.instance = new views.NotificationsView(
            {container: Y.one('#notifications'),
              env: this.env,
              notifications: this.db.notifications,
              nsRouter: this.nsRouter
            });
        view.instance.render();
      }
      next();
    },

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
      // If the Juju environment is not connected, exit without letting the
      // route dispatch proceed. On env connection change, the app will
      // re-dispatch and this route callback will be executed again.
      if (!this.env || !this.env.get('connected')) {
        return;
      }
      var credentials = this.env.getCredentials();
      // After re-arranging the execution order of our routes to support the
      // new :gui: namespace we were unable to log out on prod build in Ubuntu
      // chrome. It appeared to be because credentials was null so the log in
      // form was never shown - this handles that edge case.
      var noCredentials = !(credentials && credentials.areAvailable);
      if (noCredentials) {
        // If there are no stored credentials redirect to the login page
        if (!req || req.path !== '/login/') {
          // Set the original requested path in the event the user has
          // to log in before continuing.
          this.redirectPath = this.get('currentUrl');
          this.navigate('/login/', { overrideAllNamespaces: true });
          return;
        }
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
     * Hide the login mask and redispatch the router.
     *
     * When the environment gets a response from a login attempt,
     * it fires a login event, to which this responds.
     *
     * @method onLogin
     * @param {Object} e An event object (with a "data.result" attribute).
     * @private
     */
    onLogin: function(e) {
      if (e.data.result) {
        // We need to save the url to continue on to without redirecting
        // to root if there are extra path details.
        this.hideMask();
        var originalPath = this.get('currentUrl');
        if (originalPath !== '/' && !originalPath.match(/\/login\//)) {
          this.redirectPath = originalPath;
        }
        if (originalPath.match(/login/) && this.redirectPath === '/') {
          setTimeout(
              Y.bind(this.showRootView, this), 0);
          return;
        } else {
          var nsRouter = this.nsRouter;

          this.navigate(
              nsRouter.url(nsRouter.parse(this.redirectPath)),
              {overrideAllNamespaces: true});
          this.redirectPath = null;
          return;
        }
      } else {
        this.showLogin();
      }
    },

    /**
      Hides the fullscreen mask and stops the spinner.

      @method hideMask
    */
    hideMask: function() {
      var mask = Y.one('#full-screen-mask');
      if (mask) {
        mask.hide();
        // Stop the animated loading spinner.
        if (spinner) {
          spinner.stop();
        }
      }
    },

    /**
     * Display the provider type.
     *
     * The provider type arrives asynchronously.  Instead of updating the
     * display from the environment code (a separation of concerns violation),
     * we update it here.
     *
     * @method onProviderTypeChange
     */
    onProviderTypeChange: function(evt) {
      var providerType = evt.newVal;
      this.db.environment.set('provider', providerType);
      Y.all('.provider-type').set('text', 'on ' + providerType);
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
      var environmentName = evt.newValue;
      this.db.environment.set('name', environmentName);
      Y.all('.environment-name').set('text', environmentName);
    },

    /**
       Determine if the browser or environment should be rendered or not.

       When hitting internal :gui: views, the browser needs to disappear
       entirely from the UX for users. However, when we pop back it needs to
       appear back in the previous state.

       The environment only needs to render when another full page view isn't
       visible.

       @method toggleStaticViews
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    toggleStaticViews: function(req, res, next) {
      var url = req.url,
          match = /(logout|:gui:\/(charms|service|unit))/;
      var subapps = this.get('subApps');

      if (subapps && subapps.charmbrowser) {
        var charmbrowser = subapps.charmbrowser;
        if (url.match(match)) {
          charmbrowser.hidden = true;
          // XXX At some point in the near future we will add the ability to
          // route on root namespaced paths and this check will no longer
          // be needed
          this.renderEnvironment = false;

          // XXX bug:1217383
          // We're hiding the subapp from view, but people want to be able to
          // click on the viewmode controls. We handle that here as a temp
          // hack until the old :gui: views are gone and we've moved to the
          // serviceInspector. Then the browser will always be around and can
          // handle this widget for us. This is horrible and we know it. When
          // the idea of 'hidden' is removed with the old views this hack will
          // go away with it.
          if (!this._controlEvents || this._controlEvents.length === 0) {
            this._controls = new widgets.ViewmodeControls({
              currentViewmode: subapps.charmbrowser._viewState.viewmode
            });
            this._controls.render();
            this._controlEvents = [];
            this._controlEvents.push(
                this._controls.on(
                    this._controls.EVT_FULLSCREEN,
                    function(ev) {
                      // Navigate away from anything in :gui: and to the
                      // /fullscreen in :charmbrowser:
                      this._controls._updateActiveNav('fullscreen');
                      this.navigate(this.nsRouter.url({
                        gui: '/',
                        charmbrowser: '/fullscreen'
                      }), { overrideAllNamespaces: true });

                    }, this
                )
            );
            this._controlEvents.push(
                this._controls.on(
                    this._controls.EVT_SIDEBAR,
                    function(ev) {
                      // Navigate away from anything in :gui: and to the
                      // /sidebar in :charmbrowser:
                      this._controls._updateActiveNav('sidebar');
                      this.navigate(this.nsRouter.url({
                        gui: '/',
                        charmbrowser: '/sidebar'
                      }), { overrideAllNamespaces: true });
                    }, this
                )
            );
          }

        } else {
          charmbrowser.hidden = false;
          this.renderEnvironment = true;

          // XXX bug:1217383
          // Destroy the controls widget we might have had around for a bit.
          if (this._controlEvents) {
            this._controlEvents.forEach(function(ev) {
              ev.detach();
            });
            // reset the list to no events.
            this._controlEvents = [];
          }

          if (this._controls) {
            this._controls.destroy();
          }
        }

        charmbrowser.updateVisible();
      }

      next();
    },

    /**
      Shows the root view of the application erasing all namespaces

      @method showRootView
    */
    showRootView: function() {
      this._navigate('/', { overrideAllNamespaces: true });
      // Reset the view state of the subapps.
      var subapps = this.get('subApps');
      if (subapps.charmbrowser) {
        subapps.charmbrowser.initState();
      }
    },

    /**
     * @method show_environment
     */
    show_environment: function(req, res, next) {
      if (!this.renderEnvironment) {
        next(); return;
      }
      this.hideMask();
      var options = {
        getModelURL: Y.bind(this.getModelURL, this),
        nsRouter: this.nsRouter,
        landscape: this.landscape,
        endpointsController: this.endpointsController,
        useDragDropImport: this.get('sandbox'),
        db: this.db,
        env: this.env,
        store: this.get('store')};

      this.showView('environment', options, {
        /**
         * Let the component framework know that the view has been rendered.
         *
         * @method show_environment.callback
         */
        callback: function() {
          this.views.environment.instance.rendered();
        },
        render: true
      });
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
      matches = Y.Array.filter(matches, function(match) {
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
      var ga_key = this.get('GA_key');
      if (ga_key) {
        this.cookieHandler = this.cookieHandler || new Y.juju.Cookies();
        this.cookieHandler.check();
      }
      next();
    }

  }, {
    ATTRS: {
      html5: true,
      charmworldURL: {},
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
          return [
            window.location.pathname,
            window.location.search,
            window.location.hash
          ].join('');
        }
      },
      /**
         @attribute store
         @default Y.juju.charmworld.APIv2
         @type {Y.juju.charmworld.APIv2}
       */
      store: {
        /**
           We keep one instance of the store and will work on caching results
           at the app level so that routes can share api calls. However, in
           tests there's no config for talking to the api so we have to watch
           out in test runs and allow the store to be broken.

           @method store.valueFn
        */
        valueFn: function() {
          var cfg = {
            noop: false,
            apiHost: ''
          };
          if (!window.juju_config || !window.juju_config.charmworldURL) {
            console.error('No juju config to fetch charmworld store url');
            cfg.noop = true;
          } else {
            cfg.apiHost = window.juju_config.charmworldURL;
          }
          if (window.flags.charmworldv3) {
            return new Y.juju.charmworld.APIv3(cfg);
          } else {
            return new Y.juju.charmworld.APIv2(cfg);
          }
        }
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
          { path: '*', callbacks: 'checkUserCredentials'},
          { path: '*', callbacks: 'show_notifications_view'},
          { path: '*', callbacks: 'toggleStaticViews'},
          { path: '*', callbacks: 'show_environment'},
          { path: '*', callbacks: 'authorizeCookieUse'},
          // Charms.
          //XXX jcsackett July 31 2013 This path is only needed until we turn
          //on the service inspector. When we remove the charm view, we can (and
          //should) remove this as well.
          { path: '/charms/*charm_path/',
            callbacks: 'show_charm',
            model: 'browser-charm',
            namespace: 'gui'},
          // Notifications.
          { path: '/notifications/',
            callbacks: 'show_notifications_overview',
            namespace: 'gui'},
          // Authorization
          { path: '/login/', callbacks: 'showLogin' }
        ]
      }
    }
  });

  Y.namespace('juju').App = JujuGUI;

}, '0.5.3', {
  requires: [
    'juju-charm-models',
    'juju-charm-store',
    'juju-models',
    'juju-notifications',
    'ns-routing-app-extension',
    // This alias does not seem to work, including references by hand.
    'juju-controllers',
    'juju-notification-controller',
    'juju-endpoints-controller',
    'juju-env',
    'juju-env-fakebackend',
    'juju-fakebackend-simulator',
    'juju-env-sandbox',
    'juju-charm-models',
    'juju-views',
    'juju-view-environment',
    'juju-view-login',
    'juju-landscape',
    'juju-websocket-logging',
    'io',
    'json-parse',
    'app-base',
    'app-transitions',
    'base',
    'node',
    'model',
    'app-cookies-extension',
    'cookie',
    'app-subapp-extension',
    'sub-app',
    'subapp-browser',
    'event-key',
    'event-touch',
    'model-controller',
    'FileSaver',
    'juju-inspector-widget',
    'juju-ghost-inspector',
    'juju-view-bundle',
    'viewmode-controls'
  ]
});
