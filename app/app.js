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

        var service_list = new models.ServiceList(),
            machine_list = new models.MachineList(),
            charm_list = new models.CharmList(),
            relation_list = new models.RelationList(),
            unit_list = new models.ServiceUnitList();
        
        this.db = {
            services: service_list,
            machines: machine_list,
            charms: charm_list,
            relations: relation_list,
            units: unit_list
        };

        // Create an environment facade to interact with.
        this.env = new juju.Environment({'socket_url': this.get('socket_url')});

        // Event subscriptions
        this.on("*:showService", this.navigate_to_service);
        this.on("*:showUnit", this.navigate_to_unit);
        this.on("*:showCharmCollection", this.navigate_to_charm_collection);
        this.on("*:showCharm", this.navigate_to_charm);
        this.env.on('status', this.on_status_changed, this);

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
         
    on_status_changed: function(evt) {
        Y.log(evt, "debug", 'App: Status changed');
        this.parse_status(evt.data.result);
        // Redispatch to current view to update.
        this.dispatch();
    },

    parse_status: function(status_json) {
        console.log("App: Parse status");
        var d = this.db,
            relations = {};

        // for now we reset the lists rather than sync/update
        d.services.reset();
        d.machines.reset();
        d.charms.reset();
        d.relations.reset();
        d.units.reset();

        Y.each(status_json.machines,
            function(machine_data, machine_name) {
            var machine = new models.Machine({
                machine_id: machine_name,
                public_address: machine_data["dns-name"]});
            d.machines.add(machine);
        }, this);
	
        Y.each(status_json.services,
            function(service_data, service_name) {
		// XXX: only for charm store charms.
		var charm_name = service_data.charm.split(":")[1].split("-")[0];
		var charm = new models.Charm({
                    charm_id: service_data.charm,
            charm_name: charm_name});
		var service = new models.Service({
                    name: service_name,
                    charm: charm
		});
		d.services.add(service);
		d.charms.add(charm);
                
                Y.each(service_data.units, function(unit_data, unit_name) {
                    var unit = new models.ServiceUnit({
                            name: unit_name,
                            service: service,
                            machine: d.machines.getById(unit_data.machine),
                            agent_state: unit_data["agent-state"],
                            is_subordinate: (service_data.subordinate || false),
                            public_address: unit_data["public-address"]
                            });
                    d.units.add(unit);
                }, this);

                Y.each(service_data.relations,
                    function(relation_data, relation_name) {
                        // XXX: only preocessing 1st element for now
                        relations[service_name] = relation_data[0];
                        // XXX: fixiing this will alter the build
                        // in the relations block below
                }, this);

            }, this);

        Y.each(relations, function(source, target) {
                   var s = d.services.getById(source);
                   var t = d.services.getById(target);
                   var relation = new models.Relation({
                           endpoints: {source: s, target: t}
                           });
                   d.relations.add(relation);
               });

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
        onsole.log("App: Route: Svc Config", req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView("service-config", {model: service, domain_models: this.db});
    },

    show_service_constraints: function(req) {
        console.log("App: Route: Svc Constraints", req.path, req.pendingRoutes);
        var service = this.db.services.getById(req.params.id);
        this._prefetch_service(service);
        this.showView("service-constraints", {model: service, domain_models: this.db});
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
    }

}, {
    ATTRS: {
        routes: {
            value: [
		{path: "*", callback: 'show_charm_search'},

                {path: "/charms/", callback: 'show_charm_collection'},
                {path: "/charms/*charm_url", callback: 'show_charm'},
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