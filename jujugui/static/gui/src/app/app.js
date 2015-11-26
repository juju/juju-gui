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
      bundleNotifications = juju.BundleNotifications;

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
    Y.juju.GhostDeployer,
    Y.juju.MachineViewPanel,
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
      login: {
        type: 'juju.views.login',
        preserve: false
      },

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
                bindings.push({key: k, label: v.label || k, help: v.help});
              }
            }, this);

            target.setHTML(
                views.Templates.shortcuts({
                  bindings: bindings,
                  environmentName: this.env.get('environmentName'),
                  'force-containers': localStorage.getItem('force-containers'),
                  'disable-cookie': localStorage.getItem('disable-cookie'),
                  'auto-place-default': localStorage.getItem(
                      'auto-place-default')
                })
            );

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
          }
        },
        help: 'Display this help',
        label: 'Shift + ?'
      },
      'A-e': {
        callback: function(evt) {
          this.fire('navigateTo', { url: '/:gui:/' });
        },
        help: 'Navigate to the Environment overview',
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
        help: 'Center the Environment overview',
        label: 'Shift + 0'
      },
      'C-S-h': {
        callback: function(e) {
          this._toggleSidebar();
        },
        help: 'Show or hide the sidebar',
        label: 'Control + Shift + h'
      },
      'C-A-h': {
        callback: function(e) {
          this._toggleSidebar();
        }
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

      'C-s': {
        'condition': function() {
          return this._simulator !== undefined;
        },
        callback: function() {
          this._simulator.toggle();
        },
        help: 'Toggle the simulator',
        label: 'Control + s'
      },

      'S-d': {
        callback: function(evt) {
          views.utils.exportEnvironmentFile(this.db);
        },
        help: 'Export the environment',
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
        if (!tagName) {
          tagName = evt.target.getDOMNode().tagName;
        }
        // Target filtering, we want to listen on window
        // but not honor hotkeys when focused on
        // text oriented input fields
        if (['INPUT', 'TEXTAREA'].indexOf(tagName) !== -1) {
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

      // When a user drags a file over the browser we show notifications which
      // are drop targets to illustrate what they can do with their selected
      // file. This array keeps track of those masks and their respective
      // handlers with a { mask: mask, handlers: handlers } format.
      this.dragNotifications = [];

      // Create a client side database to store state.
      this.db = new models.Database();
      // Creates and sets up a new instance of the charmstore.
      this._setupCharmstore(window.jujulib.charmstore);

      // Set up a new modelController instance.
      this.modelController = new juju.ModelController({
        db: this.db,
        charmstore: this.get('charmstore')
      });

      // Update the on-screen environment name provided in the configuration,
      // or a default if none is configured.
      var environment_name = this.get('environment_name') || 'Environment',
          environment_node = Y.one('#environment-name');

      // Some tests do not fully populate the DOM, so we check to be sure.
      if (Y.Lang.isValue(environment_node)) {
        environment_node.set('text', environment_name);
      }
      var environments = Y.namespace('juju.environments');
      var state = new environments.FakeBackend({
        charmstore: this.get('charmstore')
      });
      this._setupUIState(cfg.sandbox, cfg.baseUrl);
      cfg.state = this.state;
      // Create an environment facade to interact with.
      // Allow "env" as an attribute/option to ease testing.
      var env = this.get('env');
      if (env) {
        this._init(cfg, env);
        return;
      }
      var ecs = new juju.EnvironmentChangeSet({db: this.db});
      ecs.on('changeSetModified', this._renderDeployment.bind(this));
      ecs.on('currentCommitFinished', this._renderDeployment.bind(this));
      // Instantiate the Juju environment.
      this._generateSocketUrl(function(socketUrl, user, password) {
        // XXX Update the header breadcrumb to show the username. This is a
        // quick hack for the demo.
        var breadcrumbElement = document.querySelector(
            '#user-name .header-banner__link--breadcrumb');
        var auth = this.get('auth');
        if (breadcrumbElement) {
          breadcrumbElement.textContent = auth && auth.user && auth.user.name ||
            'anonymous';
        }

        this.set('socket_url', socketUrl);
        var envOptions = {
          ecs: ecs,
          socket_url: socketUrl,
          user: user,
          password: password,
          readOnly: this.get('readOnly'),
          conn: this.get('conn')
        };
        var webModule = environments.web;
        if (this.get('sandbox')) {
          envOptions.socket_url = this.get('sandboxSocketURL');
          // The GUI is running in sandbox mode.
          var sandboxModule = environments.sandbox;
          if (envOptions.user && envOptions.password) {
            var credentials = state.get('authorizedUsers');
            credentials['user-' + envOptions.user] = envOptions.password;
            state.set('authorizedUsers', credentials);
          }
          envOptions.conn = new sandboxModule.ClientConnection({
            juju: new sandboxModule.GoJujuAPI({
              state: state,
              socket_url: envOptions.socket_url
            })
          });
          // Instantiate a fake Web handler, which simulates the
          // request/response communication between the GUI and the juju-core
          // HTTPS API.
          envOptions.webHandler = new webModule.WebSandbox({state: state});
        } else {
          // The GUI is connected to a real Juju environment.
          // Instantiate a Web handler allowing to perform asynchronous HTTPS
          // requests to the juju-core API.
          envOptions.webHandler = new webModule.WebHandler();
        }
        this._init(cfg, new environments.GoEnvironment(envOptions), state);
      });
    },

    /**
     * Complete the application initialization.
     *
     * @method _init
     * @param {Object} cfg Application configuration data.
     * @param {Object} env The environment instance.
     */
    _init: function(cfg, env) {
      // If the user closed the GUI when they were on a different env than
      // their default then it would show them the login screen. This sets
      // the credentials to the environment that they are logging into
      // initially.
      env.setCredentials({
        user: env.get('user'),
        password: env.get('password')
      });
      this.env = env;

      // Create an event simulator where possible.
      // Starting the simulator is handled by hotkeys
      // and/or the config setting 'simulateEvents'.
      this.simulateEvents();

      // Set the env in the model controller here so
      // that we know that it's been setup.
      this.modelController.set('env', this.env);

      // Create a Bundle Importer instance.
      var environments = Y.namespace('juju.environments');
      this.bundleImporter = new Y.juju.BundleImporter({
        db: this.db,
        env: this.env,
        fakebackend: new environments.FakeBackend({
          charmstore: this.get('charmstore')
        })
      });

      this.changesUtils = window.juju.utils.ChangesUtils;

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

      Y.one('.header-banner').delegate('click', function(e) {
        e.halt();
        this.logout();
      }, '.logout-trigger', this);

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
      this.db.notifications.after('add', this._renderNotifications, this);

      // When someone wants a charm to be deployed they fire an event and we
      // show the charm panel to configure/deploy the service.
      Y.on('initiateDeploy', function(charm, ghostAttributes) {
        this.deployService(charm, ghostAttributes);
      }, this);

      this._boundAppDragOverHandler = this._appDragOverHandler.bind(this);
      // These are manually detached in the destructor.
      ['dragenter', 'dragover', 'dragleave'].forEach(function(eventName) {
        Y.config.doc.addEventListener(eventName, this._boundAppDragOverHandler);
      }, this);

      // We are now ready to connect the environment and bootstrap the app.
      this.once('ready', function(e) {
        if (this.get('socket_url') || this.get('sandbox')) {
          // Connect to the environment.
          this.env.connect();
        }
        this.dispatch();
        this._renderHelpDropdownView();
        if (!window.juju_config || !window.juju_config.hideLoginButton) {
          // We only want to show the user dropdown view if the gui isn't in
          // demo mode.
          this._renderUserDropdownView();
        }
        this.on('*:autoplaceAndCommitAll', this._autoplaceAndCommitAll, this);
      }, this);

      this.zoomMessageHandler = Y.one(Y.config.win).on('resize', function(e) {
        this._handleZoomMessage();
      }, this);
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
      Renders the user profile component.

      @method _renderUserProfile
    */
    _renderUserProfile: function() {
      ReactDOM.render(
        <window.juju.components.UserProfile
          jem={this.jem}
          listEnvs={this.env.listEnvs.bind(this.env)}
          changeState={this.changeState.bind(this)}
          switchEnv={this.switchEnv.bind(this)} />,
        document.getElementById('charmbrowser-container'));
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
          serviceCount={serviceCount}
          machineCount={machineCount}
          changeState={this.changeState.bind(this)}
          getAppState={state.getState.bind(state)} />,
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
    */
    _renderDeployment: function() {
      var env = this.env;
      var ecs = env.get('ecs');
      var services = this.db.services;
      var units = this.db.units;
      var utils = views.utils;
      var changesUtils = this.changesUtils;
      var currentChangeSet = ecs.getCurrentChangeSet();
      var changeDescriptions = changesUtils.generateAllChangeDescriptions(
          currentChangeSet, services, units);
      ReactDOM.render(
        <window.juju.components.Deployment
          changeState={this.changeState.bind(this)}
          services={services.toArray()}
          ecsCommit={ecs.commit.bind(ecs, env)}
          changeDescriptions={changeDescriptions}
          getUnplacedUnitCount={utils.getUnplacedUnitCount.bind(this,
              this.db.units)}
          autoPlaceUnits={this._autoPlaceUnits.bind(this)}
          generateChangeDescription={
              changesUtils.generateChangeDescription.bind(
                  changesUtils, services, units)}
          currentChangeSet={currentChangeSet} />,
        document.getElementById('deployment-container'));
    },

    /**
      Renders the Added Services component to the page in the appropriate
      element.

      @method _renderAddedServices
      @param {String} hoveredId An id for a service.
    */
    _renderAddedServices: function(hoveredId) {
      var utils = views.utils;
      var db = this.db;
      var topo = this.views.environment.instance.topo;
      var ServiceModule = topo.modules.ServiceModule;
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
            setMVVisibility={db.setMVVisibility.bind(db)}
            getUnitStatusCounts={utils.getUnitStatusCounts}
            hoverService={ServiceModule.hoverService.bind(ServiceModule)}
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
        var charm = app.db.charms.getById(service.get('charm'));
        inspector = (
          <components.Inspector
            service={service}
            charm={charm}
            addNotification={this.db.notifications.add.bind(this)}
            setConfig={this.env.set_config.bind(this.env)}
            envResolved={this.env.resolved.bind(this.env)}
            getRelationDataForService={utils.getRelationDataForService.bind(
                this, this.db, service)}
            addGhostAndEcsUnits={utils.addGhostAndEcsUnits.bind(
                this, this.db, this.env, service)}
            createMachinesPlaceUnits={utils.createMachinesPlaceUnits.bind(
                this, this.db, this.env, service)}
            destroyService={utils.destroyService.bind(
                this, this.db, this.env, service)}
            destroyUnits={utils.destroyUnits.bind(this, this.env)}
            clearState={utils.clearState.bind(this, topo)}
            getYAMLConfig={utils.getYAMLConfig.bind(this)}
            changeState={this.changeState.bind(this)}
            exposeService={this.env.expose.bind(this.env)}
            unexposeService={this.env.unexpose.bind(this.env)}
            getAvailableVersions={charmstore.getAvailableVersions.bind(
                charmstore)}
            setCharm={this.env.setCharm.bind(this.env)}
            getCharm={this.env.get_charm.bind(this.env)}
            getUnitStatusCounts={utils.getUnitStatusCounts}
            appState={state.get('current')}
            appPreviousState={state.get('previous')} />
        );
      } else if (localType && metadata.flash && metadata.flash.file) {
        var localCharmHelpers = juju.localCharmHelpers;
        inspector = (
          <components.LocalInspector
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
            component: 'services',
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
      ReactDOM.render(
        <components.Charmbrowser
          charmstoreSearch={charmstore.search.bind(charmstore)}
          series={utils.getSeriesList()}
          importBundleYAML={this.bundleImporter.importBundleYAML.bind(
              this.bundleImporter)}
          getBundleYAML={charmstore.getBundleYAML.bind(charmstore)}
          getEntity={charmstore.getEntity.bind(charmstore)}
          getFile={charmstore.getFile.bind(charmstore)}
          getDiagramURL={charmstore.getDiagramURL.bind(charmstore)}
          renderMarkdown={Y.Markdown.toHTML.bind(this)}
          deployService={this.deployService.bind(this)}
          appState={state.get('current')}
          changeState={this.changeState.bind(this)}
          utils={utils}
          addNotification={this.db.notifications.add.bind(this)}
          makeEntityModel={Y.juju.makeEntityModel} />,
        document.getElementById('charmbrowser-container'));
    },

    _emptySectionA: function() {
      if (this.hoverService) {
        this.hoverService.detach();
      }
    },

    _emptySectionC: function() {
      ReactDOM.unmountComponentAtNode(
        document.getElementById('charmbrowser-container'));
    },

    /**
      Renders the environment switcher

      @method _renderEnvSwitcher
    */
    _renderEnvSwitcher: function() {
      ReactDOM.render(
        <components.EnvSwitcher
          app={this}
          env={this.env}
          jem={this.jem}
          envList={this.get('environmentList')}
          changeState={this.changeState.bind(this)}
          authDetails={this.get('auth')} />,
        document.getElementById('environment-switcher'));
    },

    /**
      Handles rendering and/or updating the machine UI component.

      @method _machine
      @param {Object|String} metadata The metadata to pass to the machine
        view.
    */
    _renderMachineView: function(metadata) {
      this._renderMachineViewPanelView(this.db, this.env);
    },

    /**
      Empties out the sectionB UI making sure to properly clean up.

      @method emptySectionB
    */
    emptySectionB: function() {
      if (this.machineViewPanel) {
        this.machineViewPanel.destroy();
        this.machineViewPanel = null;
      }
    },

    /**
      Sets up the UIState instance on the app

      @method _setupUIState
      @param {Boolean} sandbox
      @param {String} baseUrl
    */
    _setupUIState: function(sandbox, baseUrl) {
      this.state = new models.UIState({
        // Disallow routing to inspectors if we are in sandbox mode; the
        // model to be inspected will not be available.
        allowInspector: !sandbox,
        baseUrl: baseUrl || '',
        dispatchers: {}
      });
      var dispatchers = this.state.get('dispatchers');
      dispatchers.sectionA = {
        services: this._renderAddedServices.bind(this),
        inspector: this._renderInspector.bind(this),
        empty: this._emptySectionA.bind(this)
      };
      dispatchers.sectionB = {
        machine: this._renderMachineView.bind(this),
        empty: this.emptySectionB.bind(this)
      };
      dispatchers.sectionC = {
        profile: this._renderUserProfile.bind(this),
        charmbrowser: this._renderCharmbrowser.bind(this),
        empty: this._emptySectionC.bind(this)
      };
      dispatchers.app = {
        deployTarget: views.utils.deployTargetDispatcher.bind(this)
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
      Composes the various socket paths and protocols and returns the correct
      URL that the GUI should use to communicate with the environment.

      @method _generateSocketUrl
      @return {String} The fully qualified WebSocket URL.
    */
    _generateSocketUrl: function(callback) {
      this.jem = null;
      if (this.get('jemUrl')) {
        var bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          interactive: this.get('interactiveLogin'),
          serviceName: 'jem'
        });
        this.jem = new window.jujulib.environment(this.get('jemUrl'), bakery);
        this.jem.listEnvironments((error, envList) => {
          if (error) {
            console.log('Environment listing failure: ' + error);
            return;
          }
          // XXX This picks the first environment but we'll want to default to
          // sandbox mode then allow the user to choose an env.
          var envData = envList[0];
          this.set('environmentList', envList);
          this._renderEnvSwitcher();
          var doc = window.document;
          var host = doc.location.hostname;
          var port = doc.port;
          var socketUrl = 'wss://' + host;
          if (port) {
            socketUrl += ':' + port;
          }
          // XXX frankban: we cannot rely on the fact that the public address
          // is the last one. There is really no ordering in the returned
          // hosts and ports. We need to try them all in parallel so that at
          // least one connection will succeed. The same logic will be then
          // reused for handling high availability controllers.
          var addresses = envData['host-ports'];
          var wssData = addresses[addresses.length - 1].split(':');
          socketUrl += '/juju/api/' +
                        wssData[0] + '/' +
                        wssData[1] + '/' +
                        envData.uuid;
          callback.call(this, socketUrl, envData.user, envData.password);
        });
        return;
      }
      var socketProtocol = this.get('socket_protocol');
      // Assemble a socket URL from the Location.
      var loc = Y.getLocation();
      socketProtocol = socketProtocol || 'wss';
      var socketUrl = socketProtocol + '://' + loc.hostname;
      if (loc.port) {
        socketUrl += ':' + loc.port;
      }
      // If a WebSocket path is explicitly provided, it gets precedence over
      // all the other methods to automatically calculate it.
      var path = this.get('socket_path');
      if (path) {
        socketUrl += path;
      } else {
        // If the Juju version is over 1.21 then we need to make requests to the
        // api using the environments uuid.
        var jujuVersion = this.get('jujuCoreVersion').split('.');
        var suffix = '';
        var majorVersion = parseInt(jujuVersion[0], 10);
        var minorVersion = parseInt(jujuVersion[1], 10);
        if (majorVersion === 1 && minorVersion > 20 || majorVersion > 1) {
          suffix = '/environment/' + this.get('jujuEnvUUID') + '/api';
        }
        socketUrl += '/ws' + suffix;
      }
      callback.call(this, socketUrl, this.get('user'), this.get('password'));
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
        var jujuConfig = window.juju_config,
            charmstoreURL, apiPath;
        if (!jujuConfig || !jujuConfig.charmstoreURL || !jujuConfig.apiPath) {
          console.error('No juju config for charmstoreURL or apiPath availble');
        } else {
          charmstoreURL = jujuConfig.charmstoreURL;
          apiPath = jujuConfig.apiPath;
        }
        var bakery = new Y.juju.environments.web.Bakery({
          webhandler: new Y.juju.environments.web.WebHandler(),
          interactive: this.get('interactiveLogin'),
          setCookiePath: charmstoreURL + apiPath + '/set-auth-cookie',
          serviceName: 'charmstore'
        });
        this.set('charmstore', new Charmstore(charmstoreURL, apiPath, bakery));
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
      Show the appropriate drag notification type.

      Currently a noop until we get drop a notifications UI from UX.

      @method showDragNotification
      @param {String} fileType The type of file to show the notification for.
    */
    showDragNotification: function(fileType) {
      // Because Chrome is the only browser that reliably supports parsing for
      // a file type, if we don't know what the file type is we assume that
      // the user just knows what they are doing and render all the drop targets
      if (fileType === 'zip' || fileType === '') {
        return;
      }
    },

    /**
      Hide the drag notifications.

      @method hideDragNotifications
    */
    hideDragNotifications: function() {
      // Check to see if there are any active drop notifications
      if (this.dragNotifications.length > 0) {
        this.dragNotifications.forEach(function(notification) {
          notification.mask.remove(true);
          notification.handlers.forEach(function(handler) {
            handler.detach();
          });
        });
      }
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
      var fileType = this._determineFileType(e.dataTransfer);
      if (fileType === false) {
        return; // Ignore if it's not a supported type
      }
      var type = e.type;
      if (type === 'dragenter') {
        this.showDragNotification(fileType);
        return;
      }
      if (type === 'dragleave') {
        this._dragleaveTimerControl('start');
      }
      if (type === 'dragover') {
        this._dragleaveTimerControl('stop');
      }
    },

    /**
      Handles the dragleave timer so that the periodic dragleave events which
      fire as the user is dragging the file around the browser do not stop
      the drag notification from showing.

      @method _dragleaveTimerControl
      @param {String} action The action that should be taken on the timer.
    */
    _dragleaveTimerControl: function(action) {
      if (action === 'start') {
        if (this._dragLeaveTimer) {
          this._dragLeaveTimer.cancel();
        }
        this._dragLeaveTimer = Y.later(100, this, function() {
          this.hideDragNotifications();
        });
      }
      if (action === 'stop') {
        if (this._dragLeaveTimer) {
          this._dragLeaveTimer.cancel();
        }
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
     * Handles rendering the help dropdown view on application load.
     *
     * @method _renderHelpDropdownView
     */
    _renderHelpDropdownView: function() {
      this.helpDropdown = new views.HelpDropdownView({
        container: Y.one('#help-dropdown'),
        env: this.db.environment
      }).render();
    },

    /**
     * Handles rendering the user dropdown view on application load.
     *
     * @method _renderUserDropdownView
     */
    _renderUserDropdownView: function() {
      this.userDropdown = new views.UserDropdownView({
        container: Y.one('#user-dropdown')
      }).render();
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
     * Toggle the visibility of the sidebar.
     *
     * @method _toggleSidebar
     */
    _toggleSidebar: function() {
      Y.one('body').toggleClass('state-sidebar-hidden');
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
      if (this.zoomMessageHandler) {
        this.zoomMessageHandler.detach();
      }
      if (this.helpDropdown) {
        this.helpDropdown.destroy();
      }
      if (this.machineViewPanel) {
        this.machineViewPanel.destroy();
      }
      if (this.userDropdown) {
        this.userDropdown.destroy();
      }
      if (this._keybindings) {
        this._keybindings.detach();
      }
      if (this._simulator) {
        this._simulator.stop();
      }
      Y.each(
          [this.env, this.db, this.endpointsController],
          function(o) {
            if (o && o.destroy) {
              o.detachAll();
              o.destroy();
            }
          }
      );
      ['dragenter', 'dragover', 'dragleave'].forEach(function(eventName) {
        Y.config.doc.removeEventListener(
            eventName, this._boundAppDragOverHandler);
      }, this);
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
      // Regardless of which view we are rendering,
      // update the env view on db change.
      if (this.views.environment.instance) {
        this.views.environment.instance.topo.update();
      }
      this.dispatch();
      this._renderComponents();
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
        // Handle the change set token if provided in the query.
        // The change set token identifies a collections of changes required
        // to deploy a bundle. Those changes are assumed to be already
        // registered in the GUI server (via a ChangeSet:SetChanges request).
        // Doing that is usually responsibility of a separate system
        // (most of the times, it is Juju Quickstart).
        var querystring = this.location.search.substring(1);
        var qs = Y.QueryString.parse(querystring);
        var changesToken = qs.changestoken;
        if (Y.Lang.isValue(changesToken)) {
          // De-dupe if necessary.
          if (Y.Lang.isArray(changesToken)) {
            changesToken = changesToken[0];
          }
          // Try to create a bundle uncommitted state using the token.
          this.bundleImporter.importChangesToken(changesToken);
        }
        this.navigate(redirectPath, {overrideAllNamespaces: true});
        // If the redirectPath has a hash then it will not dispatch after log in
        // because navigateOnHash is set to false so that we can use hash's to
        // show the correct tab in the charm details pages. This issue only
        // presents itself until the next delta comes in and the application
        // hits it's double dispatch and dispatches the url again. As a
        // workaround we check if there is a hash in the url and then dispatch
        // manually.
        if (redirectPath.indexOf('#') > -1) {
          this.dispatch();
        }
        // Start observing bundle deployments.
        bundleNotifications.watchAll(this.env, this.db);
      } else {
        this.showLogin();
      }
    },

    /**
      Switch the application to another environment.
      Disconnect the current WebSocket connection and establish a new one
      pointed to the environment referenced by the given unique identifier.

      @method switchEnv
      @param {String} uuid The environment UUID where to switch to.
    */
    switchEnv: function(uuid, username, password) {
      if (this.get('sandbox')) {
        console.log('switching environments is not supported in sandbox');
        return;
      }
      // Set the credentials so the GUI will automatically log in when we
      // switch the environments.
      this.env.setCredentials({
        user: username,
        password: password
      });
      // XXX Update the header breadcrumb to show the username. This is a
      // quick hack for the demo.
      var breadcrumbElement = document.querySelector(
          '#user-name .header-banner__link--breadcrumb');
      var auth = this.get('auth');
      if (breadcrumbElement) {
        breadcrumbElement.textContent = auth && auth.user && auth.user.name ||
          'anonymous';
      }

      var socketUrl = this.env.get('socket_url');
      // XXX frankban: this is not generic, and very specific for how the
      // socket URL is composed in the GUI embedded in OpenStack. Therefore,
      // the logic here for calculating the new socket URL for the given UUID
      // must be considered temporary demo code.
      var baseUrl = socketUrl.substring(0, socketUrl.lastIndexOf('/'));
      var newSocketUrl = baseUrl + '/' + uuid;
      // Tell the environment to use the new socket URL when reconnecting.
      this.env.set('socket_url', newSocketUrl);
      // Clear uncommitted state.
      this.env.get('ecs').clear();
      // Disconnect and reconnect the environment.
      this.env.ws.onclose = function(event) {
        this.env.on_close();
        this.env.connect();
      }.bind(this);
      this.env.close();
      this.db.reset();
      this.db.fire('update');
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

    /**
      Hides the fullscreen mask.

      @method hideMask
    */
    hideMask: function() {
      var mask = Y.one('#full-screen-mask');
      if (mask) {
        mask.hide();
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
      var environmentName = evt.newVal;
      // If there's an override in the custom settings use that instead.
      if (localStorage.getItem('environmentName')) {
        environmentName = localStorage.getItem('environmentName');
      }
      this.db.environment.set('name', environmentName);
      Y.all('.environment-name').set('text', environmentName);
    },

    /**
      Shows the root view of the application erasing all namespaces

      @method showRootView
    */
    showRootView: function() {
      this._navigate('/', { overrideAllNamespaces: true });
    },

    /**
      Render the react components.

      @method _renderComponents
    */
    _renderComponents: function() {
      // Update the react views on database change
      this._renderEnvSizeDisplay(
        this.db.services.size(),
        this.db.machines.size()
      );
      this._renderDeployment();
      this._renderEnvSwitcher();
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
      this.hideMask();
      var options = {
        getModelURL: Y.bind(this.getModelURL, this),
        nsRouter: this.nsRouter,
        endpointsController: this.endpointsController,
        useDragDropImport: this.get('sandbox'),
        db: this.db,
        env: this.env,
        ecs: this.env.ecs,
        charmstore: this.get('charmstore'),
        bundleImporter: this.bundleImporter
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

      this._renderComponents();
      this._renderNotifications();

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
        Store the url for the JEM if it exists.

        @attribute jemUrl
        @type {String}
        @default undefined
       */
      jemUrl: {},

      /**
       Whether or not to use interactive login for the IdM/JEM connection.

       @attribute interactiveLogin
       @type {Boolean}
       @default false
       */
      interactiveLogin: {value: false},

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
    'changes-utils',
    'juju-app-state',
    'juju-charm-models',
    'juju-bundle-models',
    'juju-endpoints-controller',
    'juju-env-bakery',
    'juju-env-base',
    'juju-env-fakebackend',
    'juju-env-go',
    'juju-env-sandbox',
    'juju-env-web-handler',
    'juju-env-web-sandbox',
    'juju-fakebackend-simulator',
    'juju-models',
    'jujulib-utils',
    'ns-routing-app-extension',
    // React components
    'charmbrowser-component',
    'deployment-component',
    'env-size-display',
    'env-switcher',
    'header-search',
    'inspector-component',
    'local-inspector',
    'notification-list',
    'panel-component',
    'user-profile',
    // juju-views group
    'd3-components',
    'container-token',
    'juju-templates',
    'help-dropdown',
    'user-dropdown',
    'create-machine-view',
    'machine-token',
    'juju-serviceunit-token',
    'machine-view-panel',
    'machine-view-panel-extension',
    'machine-view-panel-header',
    'juju-view-utils',
    'service-scale-up-view',
    'juju-topology',
    'juju-view-environment',
    'juju-view-login',
    'juju-landscape',
    // end juju-views group
    'autodeploy-extension',
    'juju-websocket-logging',
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
    'cookie',
    'querystring',
    'event-key',
    'event-touch',
    'model-controller',
    'FileSaver',
    'ghost-deployer-extension',
    'local-charm-import-helpers',
    'environment-change-set',
    'gallery-markdown',
    // This must stay down here else it breaks the merge-files by being put
    // first in the dependency list, before even YUI.
    'handlebars'
  ]
});
