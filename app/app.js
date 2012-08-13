YUI.add("juju-gui", function(Y) {

// Debug console access to YUI context.
yui = Y;

var models = Y.namespace("juju.models");
var juju = Y.namespace('juju');

JujuGUI = Y.Base.create("juju-gui", Y.App, [], {
    views: {
        overview: {
            type: "juju.views.overview",
            preserve: false
        },

        service: {
            type: "juju.views.service",
            preserve: false,
            parent: "overview"
        },

	charm_search: {
            type: "juju.views.charm_search",
            preserve: true
	}
    },

    initializer: function () {
        var self = this,
            service_list = new models.ServiceList(),
            machine_list = new models.MachineList(),
            charm_list = new models.CharmList(),
            relation_list = new models.RelationList(),
            unit_list = new models.ServiceUnitList();
        
        this.domain_models = {
            services: service_list,
            machines: machine_list,
            charms: charm_list,
            relations: relation_list,
            units: unit_list
        };

        this.get_sample_data();

        this.on("*:showService", this.navigate_to_service);

	// Create an environment facade to interact with.
        this.env = new juju.Environment({'socket_url': this.get('socket_url')});
	// Update with status
	this.env.on('status', this.on_status_changed, this);

        this.once('ready', function (e) {

	    if (this.get("socket_url")) {
		// Connect to the environment.
		console.log("Connecting to environment")
		this.env.connect();
	    }

            if (this.hasRoute(this.getPath())) {
                this.dispatch();
            } else {
                this.show_overview();
            }

        }, this);

    },

         
    on_status_changed: function(evt) {
	console.log('status changed', evt);
	this.parse_status(evt.data.result);
        this.showView('overview', {domain_models: this.domain_models});
    },

    get_sample_data: function() {
        var self = this;
        Y.io("status.json", {
                 context: this, 
                 on: {
                     complete: function(id, response) {
                         var status = Y.JSON.parse(response.responseText);
                         this.status = this.parse_status(status);
                     }}
             });

    },
        
    parse_status: function(status_json) {
	console.log("parse status");
        var d = this.domain_models,
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
		var charm = new models.Charm({
                        charm_id: service_data.charm});
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
    navigate_to_service: function(e) {
        var service = e.service;
        this.navigate("/service/" + service.get("id") + "/");
    },

    // Route handlers
    show_service: function(req) {
        var d = this.domain_models, 
            service = d.services.getById(req.params.id);
        this.showView("service", {
                          service: service,
                          domain_models: this.domain_models
                      });


    },

    show_overview: function (req) {
	console.log('show overview');
        this.showView('overview', {domain_models: this.domain_models});
    },

    show_charm_search: function(req, res, next) {
	console.log('show search');
	var charm_search = this.get('charm_search');
	if (!charm_search) {
	    console.log('creating search');
	    charm_search = this.createView(
		'charm_search', {'app': this});
	    this.set('charm_search', charm_search.render());
	}
	next();
    }

}, {
    ATTRS: {
        routes: {
            value: [
		{path: "*", callback: 'show_charm_search'},
                {path: "/", callback: 'show_overview'},
                {path: "/service/:id/", callback: 'show_service'}
                ]
            }
    }
});

Y.namespace("juju").App = JujuGUI;

}, "0.5.2", {
    requires: [
	"io",
	"json-parse",
	"juju-models",
	"juju-views",
	"juju-env",
	'app-base',
	'app-transitions',
	'base',
	'node',
	"reconnecting-websocket"
       ]
});