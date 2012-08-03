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
        var self = this;
        this.get_sample_data();

        this.on("*:showStatus", this.navigate_to_status);

        this.once('ready', function (e) {
            // create event routing through the YUI custom event layer
            self.ws = Y.ReconnectingWebSocket(
                    "ws://" + window.location.host + this.get("socket_path"));
            self.ws.onopen(self.fire("env:connect"));
            self.ws.onclose(self.fire("env:disconnect"));
            self.ws.onmessage(self.publish("env:message", {
                                            emitFacade: true,
                                            defaultFn: self.message_to_event
                                           })
                             );
            if (this.hasRoute(this.getPath())) {
                this.dispatch();
            } else {
                this.show_overview();
            }
        });

    },

    message_to_event: function(data) {
        var event_kind = {
            status: "env:status"
        }[data.op];
        self.fire(event_kind, {
            data: data
        });
    },
        
    
        
    get_sample_data: function() {
        var self = this;

        Y.io("status.json", {on: {
        complete: function(id, response) {
            var status = Y.JSON.parse(response.responseText);
            self.status = self.parseStatus(status);
        }}});

        var c1 = new models.Charm({name: "mysql",
                                  description: "A DB"}),
            c2 = new models.Charm({name: "logger",
                                  description: "Log sub"});
        var list = new models.CharmList().add([c1, c2]);
        this.charms = list;
    },
        
    parseStatus: function(status_json) {
        
    },
        
    // Event handlers
    navigate_to_status: function(e) {
        this.navigate("/status");
    },

    // Route handlers
    show_status: function(req) {
        this.showView("status", {
                          status:this.status, 
                          charms:this.charms
                      });


    },

    show_overview: function (req) {
        this.showView('overview');
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