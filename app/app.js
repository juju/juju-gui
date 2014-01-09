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
      widgets = Y.namespace('juju.widgets'),
      importHelpers = juju.BundleHelpers;

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

      notifications: {
        type: 'juju.views.NotificationsView',
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

      // Stash the location object so that tests can override it.
      this.location = window.location;

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
            var authtoken = qs.authtoken;
            if (Y.Lang.isValue(authtoken)) {
              // De-dupe if necessary.
              if (Y.Lang.isArray(authtoken)) {
                authtoken = authtoken[0];
              }
              // Try a token login.
              this.env.tokenLogin(authtoken);
            } else {
              this.checkUserCredentials();
            }
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
        this._renderHelpDropdownView();
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

      var importNode = Y.one('#import-trigger');
      var importFileInput = Y.one('.import-export input[type=file]');

      // Tests won't have this node.
      if (importNode && importFileInput) {
        importNode.on('click', function(e) {
          e.halt();
          e.currentTarget.siblings('input[type=file]')
                                  .item(0).getDOMNode().click();
        });

        importFileInput.on('change', function(e) {
          importHelpers.deployBundleFiles(
              e.currentTarget.get('files')._nodes,
              this.env,
              this.db
          );
        }, this);
      }

      // Attach SubApplications. The subapps should share the same db.
      cfg.db = this.db;

      // To use the new service Inspector use the deploy method
      // from the Y.juju.GhostDeployer extension
      cfg.deployService = Y.bind(this.deployService, this);

      // Provide the bundle deployment helper to the subapps and views to
      // access in case of an UX interaction that triggers a bundle deploy.
      // Grab a reference of these for the nested event calls below.
      var env = this.env;
      var db = this.db;
      cfg.deployBundle = function(bundle, bundleId) {
        // The other views will hand us an Object vs a YAML string. The import
        // helpers want the yaml string instead.
        importHelpers.deployBundle(
            Y.JSON.stringify({
              bundle: bundle
            }),
            bundleId,
            env,
            db
        );
      };

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
        cfg.deployService(charm, ghostAttributes);
      }, this);
    },

    /**
     * Handles rendering the help dropdown view on application load.
     *
     * @method _renderHelpDropdownView
     */
    _renderHelpDropdownView: function() {
      this.helpDropdown = new views.HelpDropdownView({
        container: Y.one('#help-dropdown'),
        env: this.db.environment
      }).render();
      // See `renderOnboarding()` in browser.js and `_startOnboarding()`
      // in help-dropdown.js for why this is done like this.
      this.helpDropdown.on('navigate', function(e) {
        this.navigate(e.url);
      }, this);
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
      if (this.helpDropdown) {
        this.helpDropdown.destroy();
      }
      if (this._keybindings) {
        this._keybindings.detach();
      }
      if (this._simulator) {
        this._simulator.stop();
      }
      Y.each(
          [this.env, this.db, this.notifications,
           this.endpointsController],
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
      this.set('loggedIn', false);
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
        this.set('loggedIn', false);
        // If there are no stored credentials redirect to the login page
        if (!req || req.path !== '/login/') {
          // Set the original requested path in the event the user has
          // to log in before continuing.
          this.redirectPath = this.get('currentUrl');
          this.navigate('/login/', { overrideAllNamespaces: true });
          return;
        }
      } else if (!this.get('loggedIn')) {
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
        // The login was a success.
        this.hideMask();
        var redirectPath = this.popLoginRedirectPath();
        this.set('loggedIn', true);
        // Handle token authentication.
        if (e.data.fromToken) {
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
        this.navigate(redirectPath, {overrideAllNamespaces: true});
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

       When hitting static views the browser needs to disappear
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
          match = /logout/;
      var subapps = this.get('subApps');

      if (subapps && subapps.charmbrowser) {
        var charmbrowser = subapps.charmbrowser;
        if (url.match(match)) {
          charmbrowser.hidden = true;
          // XXX At some point in the near future we will add the ability to
          // route on root namespaced paths and this check will no longer
          // be needed
          this.renderEnvironment = false;
        } else {
          charmbrowser.hidden = false;
          this.renderEnvironment = true;
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
      Renders the network list view into the environment

      @method renderNetworkList
    */
    renderNetworkList: function(req, res, next) {
      if (!this.networkListView) {
        Y.one('#main').append('<div class="network-list"></div>');
        var container = Y.one('.network-list');
        this.networkListView = new juju.views.NetworkListView({
          env: this.env,
          db: this.db
        });
        this.networkListView.render(container);
      }

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
          // Specifically, it omits any authtokens and uses our standard path
          // normalizing tool (currently the nsRouter).
          var nsRouter = this.nsRouter;
          // `this.location` is a test-friendly access of window.location.
          var routes = nsRouter.parse(this.location.toString());
          if (routes.search) {
            var qs = Y.QueryString.parse(routes.search);
            var authtoken = qs.authtoken;
            if (Y.Lang.isValue(authtoken)) {
              // Remove the token from the URL.  It is a one-shot, designed to
              // be consumed.  We don't want it to be in the URL after it has
              // been used.
              delete qs.authtoken;
              routes.search = Y.QueryString.stringify(qs);
            }
          }
          // Use the nsRouter to normalize.
          return nsRouter.url(routes);
        }
      },
      /**
         @attribute store
         @default Y.juju.charmworld.APIv3
         @type {Y.juju.charmworld.APIv3}
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
          return new Y.juju.charmworld.APIv3(cfg);
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
          { path: '*', callbacks: 'renderNetworkList' },
          { path: '*', callbacks: 'authorizeCookieUse'},
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
    'bundle-import-helpers',
    'node',
    'model',
    'app-cookies-extension',
    'cookie',
    'querystring',
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
    'help-dropdown'
  ]
});
