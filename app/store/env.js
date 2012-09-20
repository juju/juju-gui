'use strict';

YUI.add('juju-env', function(Y) {

function Environment(config) {
    // Invoke Base constructor, passing through arguments
    Environment.superclass.constructor.apply(this, arguments);
}


Environment.NAME = 'env';
Environment.ATTRS = {
    'socket_url': {},
    'conn': {},
    'connected': {value: false},
    'debug': {value: false}
};

Y.extend(Environment, Y.Base, {
    // Prototype methods for your new class

    initializer: function(){
        console.log('Env Init');
        // Define custom events
        this.publish('msg', {
            emitFacade: true,
            defaultFn: this.dispatch_result
        });
        // txn-id sequence
        this._counter = 0;
        // mapping txn-id callback if any.
        this._txn_callbacks = {};
    },

    destructor: function(){
        this.ws.close();
        this._txn_callbacks = {};
    },

    connect: function(){
        console.log('Env Connect');
        // Allow an external websocket to be passed in.
        var conn = this.get('conn');
        console.log('ext ws', conn);
        if (conn) {
            this.ws = conn;
        } else {
            console.log('Creating new websocket', this.get('socket_url'));
            this.ws = new Y.ReconnectingWebSocket(this.get('socket_url'));
        }
        this.ws.debug = this.get('debug');
        this.ws.onmessage = Y.bind(this.on_message, this);
        this.ws.onopen = Y.bind(this.on_open, this);
        this.ws.onclose = Y.bind(this.on_close, this);
        this.on('msg', this.dispatch_event);
        return this;
    },

    on_open: function(data) {
        console.log('Env: Connected');
        this.set('connected', true);
    },

    on_close: function(data) {
        console.log('Env: Disconnect');
        this.set('connected', false);
    },

    on_message: function(evt) {
        console.log('Env: Receive', evt.data);

        var msg = Y.JSON.parse(evt.data);
        if (msg.version === 0) {
            console.log('Env: Handshake Complete');
            return;
        }
        this.fire('msg', msg);
    },

    dispatch_result: function(data) {
        console.log('Env: Dispatch Result', data);
        this._dispatch_rpc_result(data);
        this._dispatch_event(data);
    },

    _dispatch_event: function(evt) {
        if (!('op' in evt)) {
            console.warn('Env: Unknown evt kind', evt);
            return;
        }
        console.log('Env: Dispatch Evt', evt.op);
        this.fire(evt.op, {data: evt});
    },

    _dispatch_rpc_result: function(msg){
        if ('request_id' in msg) {
            var tid = msg.request_id;
            if (tid in this._txn_callbacks) {
                console.log('Env: Dispatch Rpc');
                this._txn_callbacks[tid].apply(this, [msg]);
                delete this._txn_callbacks[tid];
            }
        }
    },

    _send_rpc: function(op, callback) {
        var tid = this._counter++;
        if (callback) {
            this._txn_callbacks[tid] = callback;
        }
        op.request_id = tid;
        var msg = Y.JSON.stringify(op);
        console.log('Env: send msg', tid, msg, op);
        this.ws.send(msg);
    },

    // Environment API

    add_unit: function(service, num_units, callback) {
        this._send_rpc({
            'op': 'add_unit',
            'service_name': service,
            'num_units': num_units}, callback);
    },
    remove_units: function(unit_names, callback) {
        this._send_rpc({
            'op': 'remove_units',
            'unit_names': unit_names}, callback);

    },

    add_relation: function(endpoint_a, endpoint_b, callback) {
        this._send_rpc({
            'op': 'add_relation',
            'endpoint_a': endpoint_a,
            'endpoint_b': endpoint_b}, callback);

    },

    get_charm: function(charm_url, callback) {
        this._send_rpc({'op': 'get_charm', 'charm_url': charm_url}, callback);
    },

    get_service: function(service_name, callback) {
        this._send_rpc({'op': 'get_service', 'service_name': service_name}, callback);
    },

    deploy: function(charm_url, callback) {
        this._send_rpc({'op': 'deploy', 'charm_url': charm_url}, callback);
    },

    expose: function(service, callback) {
        this._send_rpc({'op':'expose', 'service_name': service}, callback);
    },

    unexpose: function(service, callback) {
        this._send_rpc({'op':'unexpose', 'service_name': service}, callback);
    },

    status: function(callback) {
        this._send_rpc({'op': 'status'}, callback);
    },

    remove_relation: function(endpoint_a, endpoint_b, callback) {
        this._send_rpc({
            'op': 'remove_relation',
            'endpoint_a': endpoint_a,
            'endpoint_b': endpoint_b}, callback);
    },

    destroy_service: function(service, callback) {
        this._send_rpc({
            'op': 'destroy_service',
            'service': service}, callback);
    },

    set_config: function(service, config, callback) {
        this._send_rpc({
            op: 'set_config',
            service_name: service,
            config: config}, callback);
    },

    resolved: function(unit_name, relation_name, retry, callback) {
        this._send_rpc({
            op: 'resolved',
            unit_name: unit_name,
            relation_name: relation_name || null,
            retry: retry || false}, callback);
    }

});


Y.namespace('juju').Environment = Environment;

}, '0.1.0', {
       requires: [
       'io',
       'json-parse',
       'json-stringify',
       'base',
       'reconnecting-websocket'
       ]
});
