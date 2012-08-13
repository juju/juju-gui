YUI.add("juju-env", function(Y) {


	
var EVENT_DISPATCH_MAP = {
    status: "env:status",
    deploy: "env:deploy",
    add_unit: "env:add_unit",
    add_relation: "env:add_relation",
    destroy_service: "env:destroy_service"
}

    
function Environment(config) {
    // Invoke Base constructor, passing through arguments
    Environment.superclass.constructor.apply(this, arguments);
}

Environment.NAME = "env";
Environment.ATTRS = {
    'socket_url': {},
    'debug': {value: false},
}

Y.extend(Environment, Y.Base, {
    // Prototype methods for your new class

    initializer: function(){
	// Define custom events
	this.publish("msg", {
	    emitFacade: true, defaultFn: this.message_to_event
	});
	this.publish("connect", {emitFacade: true});
	this.publish("disconnect", {emitFacade: true});
    },

    destructor: function(){
	this.ws.close();
    },

    connect: function(){
        this.ws = new Y.ReconnectingWebSocket(this.get("socket_url"));
	this.ws.debug = this.get("debug");
	this.ws.onmessage = Y.bind(this.on_message, this);
	this.ws.onopen = Y.bind(this.on_open, this);
	this.ws.onclose = Y.bind(this.on_close, this);
	this.on('msg', this.dispatch_event);
    },

    on_open: function(data) {
	console.log("open", data);
	this.fire('connect');
    },

    on_close: function(data) {
	console.log("close", data);
	this.fire('disconnect')
    },

    on_message: function(evt) {
	last_msg = evt;
	var msg = Y.JSON.parse(evt.data);
	console.log("msg", msg);
	if (msg.version === 0) {
	    console.log("greeting");
	    // call out to status
	    // this.env_status()
	    return;
	}
	this.fire("msg", msg);
    },

    dispatch_event: function(evt) {
	console.log('dispatch event invoked', evt)

	if (!'op' in evt) {
	    console.log('unknown evt kind');
	    return
	}

	if (!evt.op in EVENT_DISPATCH_MAP) {
	    console.warn('unknown evt op', evt.op);
	    return
	}

        var event_kind = EVENT_DISPATCH_MAP[evt.op];
        this.fire(event_kind, {data: evt});
    },


    // Environment API

    add_unit: function(service, num_units) {
	console.log("invoke env.add_unit", service, num_units);
	this.ws.send(
	    Y.JSON.stringify(
		{'op': 'add_unit', 
		 'service_name': service,
		 'num_units': num_units}));
    },

    add_relation: function(endpoint_a, endpoint_b) {
	console.log("invoke env.add_relation", endpoint_a, endpoint_b);
	this.ws.send(
	    Y.JSON.stringify(
		{'op': 'add_relation', 
		 'endpoint_a': endpoint_a,
		 'endpoint_b': endpoint_b}));
    },

    deploy: function(charm_url) {
	console.log("invoke env.deploy", charm_url);
	this.ws.send(
	    Y.JSON.stringify({'op': 'deploy', 'charm_url': charm_url}));
    },

    status: function() {
	console.log('invoke env.status');
	this.ws.send(Y.JSON.stringify({'op': 'status'}));
    },

    remove_relation: function(endpoint_a, endpoint_b) {
	console.log('invoke env.remove_relation');
	this.ws.send(
	    Y.JSON.stringify(
		{'op': 'remove_relation',
		 'endpoint_a': endpoint_a,
		 'endpoint_b': endpoint_b}));
    },

});


Y.namespace("juju").Environment = Environment

}, "0.1.0", {
       requires: [
       "io",
       "json-parse",
       'base',
       "reconnecting-websocket"
       ]
});
