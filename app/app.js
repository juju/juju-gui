YUI.add("juju-gui", function(Y) {

// Debug console access to YUI context.
yui = Y;

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

	// Define custom events
	this.publish("env:msg", {
	    emitFacade: true, defaultFn: this.message_to_event
	});
	this.publish("env:connect", {emitFacade: true});
	this.publish("env:disconnect", {emitFacade: true});


        this.once('ready', function (e) {
            this.ws = new Y.ReconnectingWebSocket(this.get("socket_url"));
	    this.ws.onmessage = Y.bind(this.on_message, this);
	    this.ws.onopen = Y.bind(this.on_open, this);
	    this.ws.onclose = Y.bind(this.on_close, this);
	    console.log("websocket made");

            if (this.hasRoute(this.getPath())) {
                this.dispatch();
            } else {
                this.show_overview();
            }
        });

    },

    on_open: function(data) {
	console.log("open", data);
	this.fire('env:connect');
    },

    on_close: function(data) {
	console.log("close", data);
	this.fire('env:disconnect')
    },

    on_message: function(evt) {
	last_msg = evt;
	var msg = Y.JSON.parse(evt.data);
	console.log("msg", msg);
	if (msg.version == 0) {
	    console.log("greeting");
	    return
	}
	this.fire("env:msg", msg);
    },

    message_to_event: function(data) {
	console.log('invoked')
	console.log(this);
	console.log(data)
        var event_kind = {
            status: "env:status"
        }[data.op];
        this.fire(event_kind, {
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