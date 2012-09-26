'use strict';

// Create a global for debug console access to YUI context.
var yui;

YUI.add('juju-gui', function(Y) {

  // Assign the global for console access.
  yui = Y;

  var juju = Y.namespace('juju'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views');

  var JujuGUI = Y.Base.create('juju-gui', Y.App, [], {
    views: {
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

      charm_search: {
        type: 'juju.views.charm_search',
        preserve: true
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
     * Data driven behaviors
     *  This is a placehold for real behaviors associated with
     *  DOM Node  data-* attributes.
     */
    behaviors: {
      timestamp: {
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

    initializer: function() {
      // Create a client side database to store state.
      this.db = new models.Database();
      // Create an environment facade to interact with.
      this.env = new juju.Environment({
        'socket_url': this.get('socket_url')});

      // Create notifications controller
      this.notifications = new juju.NotificationController({
        app: this,
        env: this.env,
        notifications: this.db.notifications});

      // Create a charm store.
      this.charm_store = new Y.DataSource.IO({
        source: this.get('charm_store_url')});

      // Event subscriptions

      // TODO: refactor per event views into a generic show view event.
      this.on('*:showService', this.navigate_to_service);
      this.on('*:showUnit', this.navigate_to_unit);
      this.on('*:showCharmCollection', this.navigate_to_charm_collection);
      this.on('*:showCharm', this.navigate_to_charm);
      this.on('*:showEnvironment', this.navigate_to_environment);

      // Feed environment changes directly into the database.
      this.env.on('delta', this.db.on_delta, this.db);

      // Feed delta changes to the notifications system
      this.env.on('delta', this.notifications.generate_notices,
          this.notifications);

      // When the connection resets, reset the db.
      this.env.on('connectionChange', function(ev) {
        if (ev.changed.connection.newVal) {
          this.db.reset();
        }
      }, this);

      // If the database updates redraw the view (distinct from model updates)
      // TODO - Bound views will automatically update this on individual models
      this.db.on('update', this.on_database_changed, this);

      this.on('navigate', function(e) {
        console.log('app navigate', e);
      });

      this.enableBehaviors();

      this.once('ready', function(e) {
        if (this.get('socket_url')) {
          // Connect to the environment.
          console.log('App: Connecting to environment');
          this.env.connect();
        }

        console.log(
            'App: Re-rendering current view', this.getPath(), 'info');

        if (this.get('activeView')) {
          this.get('activeView').render();
        } else {
          this.dispatch();
        }
      }, this);

    },

    enableBehaviors: function() {
      Y.each(this.behaviors, function(behavior) {
        behavior.callback.call(this);
      }, this);

    },

    on_database_changed: function(evt) {
      Y.log(evt, 'debug', 'App: Database changed');
      // Redispatch to current view to update.
      this.dispatch();
    },

    // Event handlers
    navigate_to_unit: function(e) {
      console.log('Evt.Nav.Router unit target', e.unit_id);
      this.navigate('/unit/' + e.unit_id.replace('/', '-') + '/');
    },

    navigate_to_service: function(e) {
      console.log(
          e.service.get('id'), 'debug', 'Evt.Nav.Router service target');
      var service = e.service;
      this.navigate('/service/' + service.get('id') + '/');
    },

    navigate_to_charm_collection: function(e) {
      console.log('Evt.Nav.Router charm collection');
      var query = Y.one('#charm-search').get('value');
      this.navigate('/charms/?q=' + query);
    },

    navigate_to_charm: function(e) {
      console.log('Evt.Nav.Router charm');
      var charm_url = e.charm_data_url;
      this.navigate('/charms/' + charm_url);
    },

    navigate_to_environment: function(e) {
      console.log('Evt.Nav.Router environment');
      this.navigate('/');
    },

    // Route handlers
    show_unit: function(req) {
      console.log(
          'App: Route: Unit', req.params.id, req.path, req.pendingRoutes);
      var unit_id = req.params.id.replace('-', '/');
      var unit = this.db.units.getById(unit_id);
      if (unit) {
        // Once the unit is loaded we need to get the full details of the
        // service.  Otherwise the relations data will not be available.
        var service = this.db.services.getById(unit.service);
        this._prefetch_service(service);
      }
      this.showView('unit', {unit: unit, db: this.db, env: this.env});
    },

    _prefetch_service: function(service) {
      // only prefetch once
      // we redispatch to the service view after we have status
      if (!service || service.get('prefetch')) { return; }

      service.set('prefetch', true);

      // Prefetch service details for service subviews.
      if (service && !service.get('loaded')) {
        this.env.get_service(
            service.get('id'), Y.bind(this.load_service, this));
      }

      if (service) {
        // TODO service charm reference should be by id.
        var charm_id = service.get('charm');
        var charm = this.db.charms.getById(charm_id);
        console.log('prefetching charm', charm_id, charm);
        if (!charm) {
          charm = new models.Charm({id: charm_id});
          this.db.charms.add(charm);
        }
        if (!charm.get('loaded')) {
          console.log('Get charm', charm_id);
          this.env.get_charm(charm_id, Y.bind(this.load_charm, this));
        }
      }
    },

    _buildServiceView: function(req, viewName) {
      console.log('App: Route: Service',
          viewName, req.params.id, req.path, req.pendingRoutes);

      var service = this.db.services.getById(req.params.id);
      this._prefetch_service(service);
      this.showView(viewName, {
        model: service,
        db: this.db,
        env: this.env,
        app: this,
        querystring: req.query
      });
    },

    show_service: function(req) {
      this._buildServiceView(req, 'service');
    },

    show_service_config: function(req) {
      this._buildServiceView(req, 'service_config');
    },

    show_service_relations: function(req) {
      this._buildServiceView(req, 'service_relations');
    },

    show_service_constraints: function(req) {
      this._buildServiceView(req, 'service_constraints');
    },

    show_environment: function(req) {
      console.log('App: Route: Environment', req.path, req.pendingRoutes);
      this.showView(
          'environment', {db: this.db, env: this.env}, {render: true},
          function(view) {
            // After the view has been attached to the DOM, perform any
            // rendering that is reliant on that fact, such as getting
            // computed styles or clientRects.
            view.postRender();
          });
    },

    show_charm_collection: function(req) {
      console.log('App: Route: Charm Collection', req.path, req.query);
      this.showView('charm_collection', {
        query: req.query.q,
        charm_store: this.charm_store
      });
    },

    show_charm: function(req) {
      console.log('App: Route: Charm', req.path, req.params);
      var charm_url = req.params.charm_url;
      this.showView('charm', {
        charm_data_url: charm_url,
        charm_store: this.charm_store,
        env: this.env
      });
    },

    show_notifications_overview: function(req) {
      this.showView('notifications_overview', {
        app: this,
        env: this.env,
        notifications: this.db.notifications});
    },

    /*
     * Persistent Views
     *
     * 'charm_search' and 'notifications' are preserved views that remain
     * rendered on all main views.  we manually create an instance of this
     * view and insert it into the App's view metadata.
     */
    show_charm_search: function(req, res, next) {
      var view = this.getViewInfo('charm_search'),
          instance = view.instance;
      if (!instance) {
        view.instance = new views.charm_search({app: this});
        view.instance.render();
      }
      next();
    },

    show_notifications_view: function(req, res, next) {
      var view = this.getViewInfo('notifications'),
          instance = view.instance;
      if (!instance) {
        view.instance = new views.NotificationsView(
            {container: Y.one('#notifications'),
              app: this,
              env: this.env,
              notifications: this.db.notifications});
        view.instance.render();
      }
      next();
    },

    // Model interactions -> move to db layer
    load_service: function(evt) {
      console.log('load service', evt);
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

    load_charm: function(evt) {
      console.log('load charm', evt);
      var charm_data = evt.result;
      var charm = this.db.charms.getById(evt.charm_url);
      if (!charm) {
        console.warn('Could not load charm data for', evt.charm_url, evt);
        return;
      }
      charm.setAttrs({'provides': charm_data.provides,
        'peers': charm_data.peers,
        'requires': charm_data.requires,
        'config': charm_data.config,
        'is_subordinate': charm_data.subordinate,
        'revision': charm_data.revision,
        'loaded': true});
      this.dispatch();
    },

    /*
     *  Object routing support
     *  This is a utility that helps map from model objects to routes
     *  defined on the App object.
     *
     * getModelURL(model, [intent])
     *    :model: the model to determine a route url for
     *    :intent: (optional) the name of an intent associated with
     *             a route. When more than one route can match a model
     *             the route w/o an intent is matched when this attribute
     *             is missing. If intent is provided as a string it
     *             is matched to the 'intent' attribute specified on the
     *             route. This is effectively a tag.
     *
     * To support this we suppliment to our routing information with
     * additional attributes as follows:
     *
     *   :model: model.name (required)
     *   :reverse_map: (optional) route_path_key: str
     *          reverse map can map :id  to the name of attr on model
     *          if no value is provided its used directly as attribute name
     *   :intent: (optional) A string named intent for which this route
     *           should be used. This can be used to select which subview
     *           is selected to resolve a models route.
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

        // Fail fast on wildcard paths, routes w/o models
        // and when the model doesn't match the route type
        if (path === '*' ||
            required_model === undefined ||
            model.name !== required_model) {
          return;
        }

        // Replace the path params with items from the
        // models attrs
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

      // See if intent is in the match. Because the default is
      // to match routes without intent (undefined) this test
      // can always be applied.
      matches = Y.Array.filter(matches, function(match) {
        return match.intent === intent;
      });

      if (matches.length > 1) {
        console.warn('Ambiguous routeModel', attrs.id, matches);
        // Default to the last route in this configuration
        // error case.
        idx = matches.length - 1;
      }
      return matches[idx] && matches[idx].path;
    },

    // Override Y.Router.route (and setter) to allow inclusion
    // of additional routing params
    _setRoutes: function(routes) {
      this._routes = [];
      Y.Array.each(routes, function(route) {
        // additionally pass route as options
        // needed to pass through the attribute setter
        this.route(route.path, route.callback, route);
      }, this);
      return this._routes.concat();
    },
    route: function(path, callback, options) {
      JujuGUI.superclass.route.call(this, path, callback);

      // This is a whitelist to spare the extra juggling
      if (options.model) {
        var r = this._routes,
                idx = r.length - 1;
        if (r[idx].path === path) {
          // Combine our options with the default
          // computed route information
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
      routes: {
        value: [
          {path: '*', callback: 'show_charm_search'},
          {path: '*', callback: 'show_notifications_view'},
          {path: '/charms/', callback: 'show_charm_collection'},
          {path: '/charms/*charm_url',
            callback: 'show_charm',
            reverse_map: {charm_url: 'name'},
            model: 'charm'},
          {path: '/notifications/',
            callback: 'show_notifications_overview'},
          {path: '/service/:id/config',
            callback: 'show_service_config',
            intent: 'config',
            model: 'service'},
          {path: '/service/:id/constraints',
            callback: 'show_service_constraints',
            intent: 'constraints',
            model: 'service'},
          {path: '/service/:id/relations',
            callback: 'show_service_relations',
            intent: 'relations',
            model: 'service'},
          {path: '/service/:id/',
            callback: 'show_service',
            model: 'service'},
          {path: '/unit/:id/',
            callback: 'show_unit',
            reverse_map: {id: 'urlName'},
            model: 'serviceUnit'},
          {path: '/', callback: 'show_environment'}
        ]
      }
    }
  });

  Y.namespace('juju').App = JujuGUI;

}, '0.5.2', {
  requires: [
    'juju-models',
    'juju-views',
    'juju-controllers',
    'io',
    'json-parse',
    'app-base',
    'app-transitions',
    'base',
    'node',
    'model']
});
