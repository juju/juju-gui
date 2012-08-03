YUI.add("juju-gui", function(Y) {

var models = Y.namespace("juju.models");

JujuGUI = Y.Base.create("juju-gui", Y.App, [], {
    views: {
        overview: {
            type: "juju.views.overview",
            preserve: true
        },
        
        status: {
            type: "juju.views.status",
            preserve: true,
            parent: "overview"
        }
    },

    initializer: function () {    
        var self = this,
            service_list = new models.ServiceList(),
            machine_list = new models.MachineList(),
            charm_list = new models.CharmList(),
            relation_list = new models.RelationList();
        
        this.domain = {
            services: service_list,
            machines: machine_list,
            charms: charm_list,
            relations: relation_list
        };
        this.get_sample_data();

        this.on("*:showStatus", this.navigate_to_status);

        this.once('ready', function (e) {
            // init models
                      
            // create event routing through the YUI custom event layer
            if (false) {
            this.ws = Y.ReconnectingWebSocket(
                    "ws://" + window.location.host + this.get("socket_path"));
            this.ws.onopen(self.fire("env:connect"));
            this.ws.onclose(self.fire("env:disconnect"));
            this.ws.onmessage(self.publish("env:message", {
                                            context: self,
                                            emitFacade: true,
                                            defaultFn: self.message_to_event
                                           }));
            }

            if (this.hasRoute(this.getPath())) {
                this.dispatch();
            } else {
                this.show_overview();
            }
        }, this);

    },

    message_to_event: function(data) {
        var event_kind = {
            status: "env:status"
        }[data.op];
        this.fire(event_kind, {
            data: data
        });
    },
        
    
        
    get_sample_data: function() {
        var self = this;
        Y.io("status.json", {
                 context: this, 
                 on: {
                     complete: function(id, response) {
                         var status = Y.JSON.parse(response.responseText);
                         this.status = this.parseStatus(status);
                     }}});

        var c1 = new models.Charm({name: "mysql",
                                  description: "A DB"}),
            c2 = new models.Charm({name: "logger",
                                  description: "Log sub"});
        var list = new models.CharmList().add([c1, c2]);
        this.charms = list;
    },
        
    parseStatus: function(status_json) {
        var d = this.domain;

        // for now we reset the lists rather than sync/update
        d["services"].reset();
        d["machines"].reset();
        d["charms"].reset();
        d["relations"].reset();

        Y.each(status_json["machines"], 
            function(machine_data, machine_name) {
            var machine = new models.Machine({
                    machine_id: machine_name,
                    public_address: machine_data["dns-name"]});
            d["machines"].add(machine);
        }, this);

        Y.each(status_json["services"], 
            function(service_data, service_name) {
            var charm = new models.Charm(
                {charm_id: service_data["charm"]}
            );
            var service = new models.Service({
                name: service_name,
                charm: charm,
                subordinate: service_data["subordinate"] || false
            });
            d["services"].add(service);
            d["charms"].add(charm);
            }, this);

        Y.each(status_json["services"], 
              function(service_data, service_name) {
                      Y.each(service_data["relations"],
                            function(relation_data, relation_name) {
                            // build relations
                      }, this);
              }, this);

    },
        
    // Event handlers
    navigate_to_status: function(e) {
        this.navigate("/status");
    },

    // Route handlers
    show_status: function(req) {
        this.showView("status", {
                          domain: this.domain
                      });


    },

    show_overview: function (req) {
        this.showView('overview', {domain: this.domain});
    }


}, {
    ATTRS: {
        routes: {
            value: [
                {path: "/", callback: 'show_overview'},
                {path: "/status", callback: 'show_status'}
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
       'app-base',
       'app-transitions',
       'base',
       'node',
       "reconnecting-websocket"
       ]
});