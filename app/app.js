'use strict';

/**
 * Provides the main app class, based on the YUI App framework.
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
      views = Y.namespace('juju.views');

  /**
   * The main app class.
   *
   * @class App
   */
  var JujuGUI = Y.Base.create('juju-gui', Y.App, [], {

    /*
     * Views
     *
     * The views encapsulate the functionality blocks that output
     * the GUI pages. The "parent" attribute defines the hierarchy.
     *
     *  @attribute views
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

      charm_collection: {
        type: 'juju.views.charm_collection',
        preserve: false,
        parent: 'environment'
      },

      charm: {
        type: 'juju.views.charm',
        preserve: false,
        parent: 'charm_collection'
      },

      notifications: {
        type: 'juju.views.NotificationsView',
        preserve: true
      },

      notifications_overview: {
        type: 'juju.views.NotificationsOverview'
      }

    },

    /**
     * Data driven behaviors
     *
     * Placeholder for real behaviors associated with DOM Node data-*
     * attributes.
     *
     *  @attribute behaviors
     */
    behaviors: {
      timestamp: {
        /**
         * Wait for the DOM to be built before rendering timestamps.
         */
        callback: function() {
          var self = this;
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
     */
    activateHotkeys: function() {
      Y.one(window).on('keydown', function(ev) {
        var key = [],
            keyStr = null,
            data = { preventDefault: false };
        if (ev.altKey) {
          key.push('alt');
        } else if (ev.ctrlKey) {
          key.push('ctrl');
        } else if (ev.shiftKey) {
          key.push('shift');
        }
        if (key.length === 0 &&
            // If we have no modifier, check if this is a function or the ESC
            // key. If it is not one of these keys, do nothing.
            !(ev.keyCode >= 112 && ev.keyCode <= 123 || ev.keyCode === 27)) {
          return; //nothing to do
        }
        keyStr = keyCodeToString(ev.keyCode);
        if (!keyStr) {
          keyStr = ev.keyCode;
        }
        key.push(keyStr);
        Y.fire('window-' + key.join('-') + '-pressed', data);
        if (data.preventDefault) {
          ev.preventDefault();
        }
      });

      Y.detachAll('window-alt-E-pressed');
      Y.on('window-alt-E-pressed', function(data) {
        this.fire('navigateTo', { url: '/' });
        data.preventDefault = true;
      }, this);

      Y.detachAll('window-alt-S-pressed');
      Y.on('window-alt-S-pressed', function(data) {
        var field = Y.one('#charm-search-field');
        if (field) {
          field.focus();
        }
        data.preventDefault = true;
      }, this);

      /**
       * Transform a numeric keyCode value to its string version. Example:
       * 16 returns 'shift'.
       * @param {number} keyCode The numeric value of a key.
       * @return {string} The string version of the given keyCode.
       */
      function keyCodeToString(keyCode) {
        if (keyCode === 16) {
          return 'shift';
        }
        if (keyCode === 17) {
          return 'control';
        }
        if (keyCode === 18) {
          return 'alt';
        }
        if (keyCode === 27) {
          return 'esc';
        }
        // Numbers or Letters
        if (keyCode >= 48 && keyCode <= 57 || //Numbers
            keyCode >= 65 && keyCode <= 90) { //Letters
          return String.fromCharCode(keyCode);
        }
        //F1 -> F12
        if (keyCode >= 112 && keyCode <= 123) {
          return 'F' + (keyCode - 111);
        }
        return null;
      }
    },

    /**
     * @method initializer
     */
    initializer: function() {
      // If this flag is true, start the application
      // with the console activated.
      var consoleEnabled = this.get('consoleEnabled');

      // Concession to testing, they need muck with console, we cannot as well.
      if (window.mochaPhantomJS === undefined) {
        if (consoleEnabled) {
          consoleManager.native();
        } else {
          consoleManager.noop();
        }
      }
      // Create a client side database to store state.
      this.db = new models.Database();
      this.serviceEndpoints = {};

      // Update the on-screen environment name provided in the configuration or
      // a default if none is configured.
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
        this.env = new juju.Environment(
            { socket_url: this.get('socket_url'),
              user: this.get('user'),
              password: this.get('password'),
              readOnly: this.get('readOnly')});
      }
      // Create a charm store.
      if (this.get('charm_store')) {
        // This path is for tests.
        this.charm_store = this.get('charm_store');
      } else {
        this.charm_store = new juju.CharmStore({
          datasource: this.get('charm_store_url')});
      }
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

      // When the provider type becomes available, display it.
      this.env.after('providerTypeChange', this.onProviderTypeChange);

      // Once the user logs in, we need to redraw.
      this.env.after('login', this.onLogin, this);

      // Feed environment changes directly into the database.
      this.env.on('delta', this.db.on_delta, this.db);

      // Feed delta changes to the notifications system.
      this.env.on('delta', this.notifications.generate_notices,
          this.notifications);

      // When the connection resets, reset the db, re-login (a delta will
      // arrive with the login), and redispatch.
      this.env.after('connectedChange', function(ev) {
        if (ev.newVal === true) {
          this.db.reset();
          this.env.userIsAuthenticated = false;
          this.env.login();
          this.dispatch();
        }
      }, this);

      // If the database updates, redraw the view (distinct from model updates)
      // TODO: bound views will automatically update this on individual models.
      this.db.on('update', this.on_database_changed, this);

      this.enableBehaviors();

      this.once('ready', function(e) {
        if (this.get('socket_url')) {
          // Connect to the environment.
          this.env.connect();
        }
        if (this.get('activeView')) {
          this.get('activeView').render();
        } else {
          this.dispatch();
        }
      }, this);

      // Create the CharmPanel instance once the app is initialized.
      var popup = views.CharmPanel.getInstance({
        charm_store: this.charm_store,
        env: this.env,
        app: this
      });
      popup.setDefaultSeries(this.env.get('defaultSeries'));
      this.env.after('defaultSeriesChange', function(ev) {
        popup.setDefaultSeries(ev.newVal);
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
     * @method on_database_changed
     */
    on_database_changed: function(evt) {
      Y.log(evt, 'debug', 'App: Database changed');

      var self = this;
      var active = this.get('activeView');

      // Compare endpoints map against db to see if services have been added.
      var servicesAdded = this.db.services.some(function(service) {
        return (self.serviceEndpoints[service.get('id')] === undefined);
      });

      // If there are new services in the DB, pull an updated endpoints map.
      if (servicesAdded) {
        this.updateEndpoints();
      } else {
        // If any services have been removed, delete them from the map
        // rather than updating it as a whole.
        Y.Object.each(this.serviceEndpoints, function(key, value, obj) {
          if (self.db.services.getById(key) === null) {
            delete(self.serviceEndpoints[key]);
          }
        });
      }

      // Redispatch to current view to update.
      if (active && active.name === 'EnvironmentView') {
        active.update();
        active.rendered();
      } else {
        this.dispatch();
      }
    },

    /**
     * When services are added, we update endpoints here.
     *
     * @method updateEndpoints
     */
    updateEndpoints: function(callback) {
      var self = this;

      // Defensive code to aid tests. Other systems
      // don't have to mock enough to get_endpoints below.
      if (!this.env.get('connected')) {
        return;
      }
      self.env.get_endpoints([], function(evt) {
        self.serviceEndpoints = evt.result;
        if (Y.Lang.isFunction(callback)) {
          callback(self.serviceEndpoints);
        }
      });
    },

    // Route handlers

    /**
     * @method show_unit
     */
    show_unit: function(req) {
      // This replacement honors service names that have a hyphen in them.
      var unit_id = req.params.id.replace(/^(\S+)-(\d+)$/, '$1/$2');
      var unit = this.db.units.getById(unit_id);
      if (unit) {
        // Once the unit is loaded we need to get the full details of the
        // service.  Otherwise the relations data will not be available.
        var service = this.db.services.getById(unit.service);
        this._prefetch_service(service);
      }
      this.showView(
          'unit',
          // The querystring is used to handle highlighting relation rows in
          // links from notifications about errors.
          { getModelURL: Y.bind(this.getModelURL, this),
            unit: unit, db: this.db, env: this.env,
            querystring: req.query });
    },

    /**
     * @method _prefetch_service
     * @private
     */
    _prefetch_service: function(service) {
      // Only prefetch once. We redispatch to the service view
      // after we have status.
      if (!service || service.get('prefetch')) { return; }
      service.set('prefetch', true);

      // Prefetch service details for service subviews.
      if (Y.Lang.isValue(service)) {
        if (!service.get('loaded')) {
          this.env.get_service(
              service.get('id'), Y.bind(this.loadService, this));
        }
        var charm_id = service.get('charm'),
            self = this;
        if (!Y.Lang.isValue(this.db.charms.getById(charm_id))) {
          this.db.charms.add({id: charm_id}).load(this.env,
              // If views are bound to the charm model, firing "update" is
              // unnecessary, and potentially even mildly harmful.
              function(err, result) { self.db.fire('update'); });
        }
      }
    },

    /**
     * @method _buildServiceView
     * @private
     */
    _buildServiceView: function(req, viewName) {
      console.log('App: Route: Service',
          viewName, req.params.id, req.path, req.pendingRoutes);

      var service = this.db.services.getById(req.params.id);
      this._prefetch_service(service);
      this.showView(viewName, {
        model: service,
        db: this.db,
        env: this.env,
        getModelURL: Y.bind(this.getModelURL, this),
        querystring: req.query
      }, {}, function(view) {
        // If the view contains a method call fitToWindow,
        // we will execute it after getting the view rendered.
        if (view.fitToWindow) {
          view.fitToWindow();
        }
      });
    },

    /**
     * @method show_service
     */
    show_service: function(req) {
      this._buildServiceView(req, 'service');
    },

    /**
     * @method show_service_config
     */
    show_service_config: function(req) {
      this._buildServiceView(req, 'service_config');
    },

    /**
     * @method show_service_relations
     */
    show_service_relations: function(req) {
      this._buildServiceView(req, 'service_relations');
    },

    /**
     * @method show_service_constraints
     */
    show_service_constraints: function(req) {
      this._buildServiceView(req, 'service_constraints');
    },

    /**
     * @method show_charm_collection
     */
    show_charm_collection: function(req) {
      console.log('App: Route: Charm Collection', req.path, req.query);
      this.showView('charm_collection', {
        query: req.query.q,
        charm_store: this.charm_store
      });
    },

    /**
     * @method show_charm
     */
    show_charm: function(req) {
      console.log('App: Route: Charm', req.path, req.params);
      var charm_url = req.params.charm_store_path;
      this.showView('charm', {
        charm_data_url: charm_url,
        charm_store: this.charm_store,
        env: this.env
      });
    },

    /**
     * @method show_notifications_overview
     */
    show_notifications_overview: function(req) {
      this.showView('notifications_overview', {
        env: this.env,
        notifications: this.db.notifications});
    },

    /**
     * Persistent Views
     *
     * 'notifications' is a preserved view that remains rendered on all main
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
              notifications: this.db.notifications});
        view.instance.render();
      }
      next();
    },

    /**
     * Ensure that the current user has authenticated.
     *
     * @method check_user_credentials
     * @param {Object} req The request.
     * @param {Object} res ???
     * @param {Object} next The next route handler.
     *
     */
    check_user_credentials: function(req, res, next) {
      // If the Juju environment is not connected, exit without letting the
      // route dispatch proceed. On env connection change, the app will
      // re-dispatch and this route callback will be executed again.
      if (!this.env.get('connected')) {
        return;
      }
      // If there are no stored credentials, the user is prompted for some.
      var user = this.env.get('user');
      var password = this.env.get('password');
      if (!Y.Lang.isValue(user) || !Y.Lang.isValue(password)) {
        this.showView('login', {
          env: this.env,
          help_text: this.get('login_help')
        });
        var passwordField = this.get('container').one('input[type=password]');
        // The password field may not be present in testing context.
        if (passwordField) {
          passwordField.focus();
        }
      }
      // If there are credentials available and there has not been
      // a successful login attempt, try to log in.
      if (Y.Lang.isValue(user) && Y.Lang.isValue(password) &&
          !this.env.userIsAuthenticated) {
        this.env.login();
        return;
      }
      // If there has not been a successful login attempt,
      // do not let the route dispatch proceed.
      if (!this.env.userIsAuthenticated) {
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
     * Hide the login mask and redispatch the router.
     *
     * When the environment gets a response from a login attempt,
     * it fires a login event, to which this responds.
     *
     * @method onLogin
     * @private
     */
    onLogin: function() {
      Y.one('body > #login-mask').hide();
      this.dispatch();
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
      Y.all('.provider-type').set('text', 'on ' + providerType);
    },

    /**
     * @method show_environment
     */
    show_environment: function(req, res, next) {
      var self = this,
          view = this.getViewInfo('environment'),
          options = {
            getModelURL: Y.bind(this.getModelURL, this),
            /** A simple closure so changes to the value are available. */
            getServiceEndpoints: function() {
              return self.serviceEndpoints;},
            loadService: this.loadService,
            db: this.db,
            env: this.env};

      this.showView('environment', options, {
        /**
         * Let the component framework know that the view has been rendered.
         */
        callback: function() {
          this.views.environment.instance.rendered();
        },
        render: true});
    },

    /**
     * Model interactions -> move to db layer
     *
     * @method load_service
     */
    loadService: function(evt) {
      if (evt.err) {
        this.db.notifications.add(
            new models.Notification({
              title: 'Error loading service',
              message: 'Service name: ' + evt.service_name,
              level: 'error'
            })
        );
        return;
      }
      var svc_data = evt.result;
      var svc = this.db.services.getById(svc_data.name);
      if (!svc) {
        console.warn('Could not load service data for',
            evt.service_name, evt);
        return;
      }
      // We intentionally ignore svc_data.rels.  We rely on the delta stream
      // for relation data instead.
      svc.setAttrs({'config': svc_data.config,
        'constraints': svc_data.constraints,
        'loaded': true,
        'prefetch': false});
      this.dispatch();
    },

    /**
     * Object routing support
     *
     * This utility helps map from model objects to routes
     * defined on the App object.
     *
     * To support this we supplement our routing information with
     * additional attributes as follows:
     *
     * model: model.name (required)
     * reverse_map: (optional) A reverse mapping of route_path_key to the
     *   name of the attribute on the model.  If no value is provided, it is
     *   used directly as attribute name.
     * intent: (optional) A string named intent for which this route should
     *   be used. This can be used to select which subview is selected to
     *   resolve a model's route.
     *
     * @method getModelURL
     * @param {object} model The model to determine a route url for.
     * @param {object} [intent] the name of an intent associated with a route.
     *   When more than one route can match a model, the route without an
     *   intent is matched when this attribute is missing.  If intent is
     *   provided as a string, it is matched to the 'intent' attribute
     *   specified on the route. This is effectively a tag.
     *
     * @method getModelURL
     */
    getModelURL: function(model, intent) {
      var matches = [],
          attrs = (model instanceof Y.Model) ? model.getAttrs() : model,
          routes = this.get('routes'),
          regexPathParam = /([:*])([\w\-]+)?/g,
          idx = 0;

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
              if (reverse_map !== undefined && reverse_map[key]) {
                key = reverse_map[key];
              }
              return attrs[key];
            });
        matches.push(Y.mix({path: path,
          route: route,
          attrs: attrs,
          intent: route.intent}));
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
      return matches[idx] && matches[idx].path;
    },

    /**
     * Override Y.Router.route (and setter) to allow inclusion of additional
     * routing params
     *
     * @method _setRoutes
     * @private
     */
    _setRoutes: function(routes) {
      this._routes = [];
      Y.Array.each(routes, function(route) {
        // Additionally pass route as options. This is needed to pass through
        // the attribute setter.
        this.route(route.path, route.callback, route);
      }, this);
      return this._routes.concat();
    },

    /**
     * @method route
     */
    route: function(path, callback, options) {
      JujuGUI.superclass.route.call(this, path, callback);

      // Use a whitelist to spare the extra juggling.
      if (options.model) {
        var r = this._routes,
                idx = r.length - 1;
        if (r[idx].path === path) {
          // Combine our options with the default computed route information.
          r[idx] = Y.mix(r[idx], options);
        } else {
          console.error(
              'Underlying Y.Router not behaving as expected. ' +
              'Press the red button.');
        }
      }
    }

  }, {
    ATTRS: {
      charm_store: {},
      /*
       * Routes
       *
       * Each request path is evaluated against all hereby defined routes,
       * and the callbacks for all the ones that match are invoked,
       * without stopping at the first one.
       *
       *  @attribute routes
       */
      routes: {
        value: [
          // Called on each request.
          { path: '*', callback: 'check_user_credentials'},
          { path: '*', callback: 'show_notifications_view'},
          // Charms.
          { path: '/charms/', callback: 'show_charm_collection'},
          { path: '/charms/*charm_store_path',
            callback: 'show_charm',
            model: 'charm'},
          // Notifications.
          { path: '/notifications/',
            callback: 'show_notifications_overview'},
          // Services.
          { path: '/service/:id/config',
            callback: 'show_service_config',
            intent: 'config',
            model: 'service'},
          { path: '/service/:id/constraints',
            callback: 'show_service_constraints',
            intent: 'constraints',
            model: 'service'},
          { path: '/service/:id/relations',
            callback: 'show_service_relations',
            intent: 'relations',
            model: 'service'},
          { path: '/service/:id/',
            callback: 'show_service',
            model: 'service'},
          // Units.
          { path: '/unit/:id/',
            callback: 'show_unit',
            reverse_map: {id: 'urlName'},
            model: 'serviceUnit'},
          // Root.
          { path: '/', callback: 'show_environment'}
        ]
      }
    }
  });

  Y.namespace('juju').App = JujuGUI;

}, '0.5.2', {
  requires: [
    'juju-charm-models',
    'juju-charm-panel',
    'juju-charm-store',
    'juju-models',
    'juju-notifications',
    // This alias does not seem to work, including references by hand.
    'juju-controllers',
    'juju-notification-controller',
    'juju-env',
    'juju-charm-models',
    'juju-views',
    'juju-view-login',
    'io',
    'json-parse',
    'app-base',
    'app-transitions',
    'base',
    'node',
    'model']
});
