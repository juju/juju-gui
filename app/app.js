YUI.add("juju-gui", function(Y) {

// Debug console access to YUI context.
yui = Y;

var juju = Y.namespace('juju');
var models = Y.namespace("juju.models");

JujuGUI = Y.Base.create("juju-gui", Y.App, [], {
    views: {
        environment: {
            type: "juju.views.environment",
            preserve: false
        },

        service: {
            type: "juju.views.service",
            preserve: false,
            parent: "environment"
        },

        service_config: {
            type: "juju.views.service_config",
            preserve: false,
            parent: "service"
        },

        service_constraints: {
            type: "juju.views.service_constraints",
            preserve: false,
            parent: "service"
        },

        service_relations: {
            type: "juju.views.service_relations",
            preserve: false,
            parent: "service"
        },

        unit: {
            type: "juju.views.unit",
            preserve: false,
            parent: "service"
        },

        charm_collection: {
            type: "juju.views.charm_collection",
            preserve: false,
            parent: "environment"
        },

        charm: {
            type: "juju.views.charm",
            preserve: false,
            parent: "charm_collection"
        },

        charm_search: {
            type: "juju.views.charm_search",
            preserve: true
        }
    },

    initializer: function () {
        // Create a client side database to store state.
        this.db = new models.Database();

        // Create an environment facade to interact with.
        this.env = new juju.Environment({'socket_url': this.get('socket_url')});

        // Event subscriptions

        // TODO: refactor per event views into a generic show view event.
        this.on("*:showService", this.navigate_to_service);
        this.on("*:showUnit", this.navigate_to_unit);
        this.on("*:showCharmCollection", this.navigate_to_charm_collection);
        this.on("*:showCharm", this.navigate_to_charm);

        // Feed environment changes directly into the database.
        this.env.on('delta', this.db.on_delta, this.db);

        // If the database updates redraw the view (distinct from model updates)
        // TODO - Bound views will automatically update this on individual models
        this.db.on('update', this.on_db_changed, this);

        this.on("navigate", function(e) {
            console.log("app navigate", e);
        });

        this.once('ready', function (e) {
            if (this.get("socket_url")) {
                // Connect to the environment.
                Y.log("App: Connecting to environment");
                this.env.connect();
            }
            var current_path = this.getPath();
            Y.log("App: Rerendering current view " + current_path, "info");
            if (this.get('activeView')) {
                this.get('activeView').render();
            } else {
                this.dispatch();
            }
        }, this);

    },

    on_database_changed: function(evt) {
        Y.log(evt, "debug", 'App: Database changed');
        // Redispatch to current view to update.
        this.dispatch();
    },

    // Event handlers
    navigate_to_unit: function(e) {
        console.log("Evt.Nav.Router unit target", e.unit_id);
        this.navigate("/unit/" + e.unit_id.replace("/", "-") + "/");
    },

    navigate_to_service: function(e) {
        console.log(e.service.get("id"), "debug", "Evt.Nav.Router service target");
        var service = e.service;
        this.navigate("/service/" + service.get("id") + "/");
    },

    navigate_to_charm_collection: function(e) {
        console.log("Evt.Nav.Router charm collection");
        query = Y.one('#charm-search').get('value');
        this.navigate("/charms/?q=" + query);
    },

    navigate_to_charm: function(e) {
        console.log("Evt.Nav.Router charm");
        var charm_url = e.charm_data_url;
        this.navigate("/charms/" + charm_url);
    },

    // Route handlers
    show_unit: function(req) {
        console.log(
            "App: Route: Unit", req.params.id, req.path, req.pendingRoutes);
        var unit_id = req.params.id.replace('-', '/');
        var unit = this.db.units.getById(unit_id);
        this.showView("unit", {unit: unit, db: this.db});
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
            var charm_id = service.get('charm').get('id');
            var charm = this.db.charms.getById(charm_id);
            console.log("prefetching charm", charm_id, charm);
            if (charm && !charm.get('loaded')) {
                console.log("Get charm", charm_id);
                this.env.get_charm(charm_id, Y.bind(this.load_charm, this));
            }
        }
    },

    /* As alternative to this initialization being done by each service view,
    a common view that matched on the entire service subpath could annotate
    the request with the svc object and perform the prefetch */

    show_service: function(req) {
        console.log(
            "App: Route: Service", req.params.id, req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView("service", {model: service, domain_models: this.db});
    },

    show_service_config: function(req) {
        console.log("App: Route: Svc Config", req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView("service_config", {model: service, domain_models: this.db});
    },

    show_service_relations: function(req) {
        console.log("App: Route: Svc Relations", req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView("service_relations", {model: service, domain_models: this.db});
    },

    show_service_constraints: function(req) {
        console.log("App: Route: Svc Constraints", req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView("service_constraints", {model: service, domain_models: this.db});
    },

    show_environment: function (req) {
        console.log("App: Route: Environment", req.path, req.pendingRoutes);
        this.showView('environment', {domain_models: this.db});
    },

    show_charm_collection: function(req) {
        console.log("App: Route: Charm Collection", req.path, req.query);
        this.showView('charm_collection', {'query': req.query.q});
    },

    show_charm: function(req) {
        console.log("App: Route: Charm", req.path, req.params);
        var charm_url = req.params.charm_url;
        this.showView("charm", {"charm_data_url": charm_url});
    },

    /* Present on all views */
    show_charm_search: function(req, res, next) {
        var charm_search = this.get('charm_search');
        if (!charm_search) {
            charm_search = this.createView(
                'charm_search', {'app': this});
            this.set('charm_search', charm_search.render());
        }
        next();
    },

    // Model interactions -> move to db layer
    load_service: function(evt) {
        console.log('load service', evt);
        var svc_data = evt.result;
        var svc = this.db.services.getById(svc_data.name);
        if (!svc) {
            console.warn("Could not load service data for", evt.service_name, evt);
            return;
        }
        svc.set('config', svc_data.config);
        svc.set('constraints', svc_data.constraints);
        // TODO: need to unify with .relations from status parse.
        svc.set('rels', svc_data.rels);
        svc.set('loaded', true);
        svc.set('prefetch', false);
        this.dispatch();
    },

    load_charm: function (evt) {
        console.log('load charm', evt);
        var charm_data = evt.result;
        var charm = this.db.charms.getById(evt.charm_url);
        if (!charm) {
            console.warn("Could not load charm data for", evt.charm_url, evt);
            return;
        }

        charm.set('provides', charm_data.provides);
        charm.set('peers', charm_data.peers);
        charm.set('requires', charm_data.requires);
        charm.set('config', charm_data.config);
        charm.set('is_subordinate', charm_data.subordinate);
        charm.set('revision', charm_data.revision);
        charm.set('loaded', true);
        this.dispatch();
    }

}, {
    ATTRS: {
        routes: {
            value: [
		{path: "*", callback: 'show_charm_search'},

                {path: "/charms/", callback: 'show_charm_collection'},
                {path: "/charms/*charm_url", callback: 'show_charm'},
                {path: "/service/:id/config", callback: 'show_service_config'},
                {path: "/service/:id/constraints", callback: 'show_service_constraints'},
                {path: "/service/:id/relations", callback: 'show_service_relations'},
                {path: "/service/:id/", callback: 'show_service'},
                {path: "/unit/:id/", callback: 'show_unit'},
                {path: "/", callback: 'show_environment'}
                ]
            }
    }
});

Y.namespace("juju").App = JujuGUI;

}, "0.5.2", {
    requires: [
	"juju-models",
	"juju-views",
	"juju-controllers",
	"io",
	"json-parse",
	'app-base',
	'app-transitions',
	'base',
	'node']
});