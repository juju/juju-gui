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

    initializer: function () {
        // Create a client side database to store state.
        this.db = new models.Database();

        // Create an environment facade to interact with.
        this.env = new juju.Environment({'socket_url': this.get('socket_url')});

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


        // If the database updates redraw the view (distinct from model updates)
        // TODO - Bound views will automatically update this on individual models
        this.db.on('update', this.on_database_changed, this);

        this.on('navigate', function(e) {
            console.log('app navigate', e);
        });

        this.once('ready', function (e) {
            if (this.get('socket_url')) {
                // Connect to the environment.
                Y.log('App: Connecting to environment');
                this.env.connect();
            }

            Y.log('App: Rerendering current view ' + this.getPath(), 'info');
            if (this.get('activeView')) {
                this.get('activeView').render();
            } else {
                this.dispatch();
            }
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
        console.log(e.service.get('id'), 'debug', 'Evt.Nav.Router service target');
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
            var service = this.db.services.getById(unit.get('service'));
            this._prefetch_service(service);
        }
        this.showView('unit', {unit: unit, db: this.db});
    },

    _prefetch_service: function(service) {
        // only prefetch once
        // we redispatch to the service view after we have status
        if (!service || service.get('prefetch'))
            return;

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

    /* As alternative to this initialization being done by each service view,
    a common view that matched on the entire service subpath could annotate
    the request with the svc object and perform the prefetch */

    show_service: function(req) {
        console.log(
            'App: Route: Service', req.params.id, req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView('service', {model: service, domain_models: this.db});
    },

    show_service_config: function(req) {
        console.log('App: Route: Svc Config', req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView('service_config', {model: service, domain_models: this.db});
    },

    show_service_relations: function(req) {
        console.log('App: Route: Svc Relations', req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView('service_relations', {model: service, domain_models: this.db});
    },

    show_service_constraints: function(req) {
        console.log('App: Route: Svc Constraints', req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView('service_constraints', {model: service, domain_models: this.db});
    },

    show_environment: function (req) {
        console.log("App: Route: Environment", req.path, req.pendingRoutes);
        this.showView('environment', {domain_models: this.db, env: this.env}, {render: true});
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
                          env: this.env,
                          model_list: this.db.notifications});
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
                                 env: this.env,
                                 model_list: this.db.notifications});
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
        // TODO: need to unify with .relations from delta stream.
        svc.setAttrs({'config': svc_data.config,
                     'constraints': svc_data.constraints,
                     'rels': svc_data.rels,
                     'loaded': true,
                     'prefetch': false});
        this.dispatch();
    },

    load_charm: function (evt) {
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
     * routeModel(model, [intent]) -> 'urlstring or known route' || undefined
     * 
     * Some models have more than one associated view, in some cases it 
     * may still require additional knowledge of intent to map to the 
     * proper view. In those cases passing a string 'intent' to the 
     * routeModel call will check that the matched route contain reference
     * to the supplied intent.
     * 
     * To support this ee suppliment our routing information with additional
     * attributes as follows:
     * 
     * model: model.name (required)
     * primary: boolean -- given mode than one match this becomes the default
     * reverse_map: {route_path_key: str || function(value, model)}
     *          reverse map can map :id in the path to either
     *              another attribute name on the model
     *          or 
     *          a function(the attr value of the key,)
     *              and returning the value to use in the URL
     *              (the context is the model)
     */
    routeModel: function(model, intent) {
        var matches = [],
            attrs = model.getAttrs(),
            routes = this.get('routes'),
            regexPathParam = /([:*])([\w\-]+)?/g;

        routes.forEach(function(route) {
            var path = route.path,
                required_model = route.model,
                reverse_map = route.reverse_map;

            // Fail fast on wildcard paths, routes w/o models
            // and when the model doesn't match the route type
            if (path === '*' || 
               required_model === undefined ||
               model.name != required_model) {
               return;                
            }

            // Replace the path params with items from the 
            // models attrs
            path = path.replace(regexPathParam, 
                    function (match, operator, key) {
                        if (reverse_map !== undefined && reverse_map[key]) {
                            var mapping = reverse_map[key];
                            if (Y.Lang.isFunction(mapping)) {
                                return mapping.call(model, attrs[key]);
                            } else {
                                key = mapping;
                            }
                        }
                    return attrs[key];
            });
            matches.push({path: path, 
                         route: route,
                         model: model,
                         intent: intent});
        });

        // see if intent is in the url
        if (intent !== undefined) {
            matches = Y.Array.filter(matches, function(match) {
                return match.path.search(intent) > -1;
            });
        }
        // if there is more than one match return the 'primary' if set
        if (matches.length > 1) {
            matches = Y.Array.filter(matches, function(match) {
                return match.route.primary === true;
            });
        }
        return matches[0] && matches[0].path;
    },

    // Override Y.Router.route (and setter) to allow inclusion 
    // of additional routing params
    _setRoutes: function(routes) {
        this._routes = [];
        Y.Array.each(routes, function (route) {
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
                idx = this._routes.length -1;
            r[idx] = Y.mix(r[idx], options);
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
                     model: 'service'},
                {path: '/service/:id/constraints', 
                     callback: 'show_service_constraints', 
                     model: 'service'},
                {path: '/service/:id/relations', 
                     callback: 'show_service_relations',
                     model: 'service'},
                {path: '/service/:id/', callback: 'show_service',
                     model: 'service',
                     primary: true},
                {path: '/unit/:id/', callback: 'show_unit',
                     reverse_map: {
                        "id": function(value)  {
                            return this.get("id").replace("/", "-");}},
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
        'node']
});
