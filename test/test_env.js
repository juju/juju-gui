"use strict";

// from nodejs runner
// YUI = require("yui").YUI,
//   base= require("../lib/base.js");


(function () {

var Y;
var SocketStub = function () {
    this.messages = [];

    this.close = function() {
        console.log('close stub');
        this.messages = [];
    };

    this.transient_close = function() {
        this.onclose();
    };

    this.open = function() {
        this.onopen();
    };

    this.msg = function(m) {
        console.log("serializing env msg", m);
        this.onmessage({'data': Y.JSON.stringify(m)});
    };

    this.last_message = function(m) {
        return this.messages[this.messages.length-1];
    };

    this.send = function(m) {
        console.log('socket send', m);
        this.messages.push(Y.JSON.parse(m));
    };

    this.onclose = function() {};
    this.onmessage = function() {};
    this.onopen = function() {};

};

describe("Juju environment", function() {
    var juju, conn, env, msg;

    before(function (done) {
        Y = YUI(GlobalConfig).use(
            "base", "node", "json-parse", "juju-env",
            function (Y) {
                conn = new SocketStub();
                juju = Y.namespace("juju");
                env = new juju.Environment({conn: conn});
                env.connect();
                conn.open();
                done();
            });
    });

    after(function(done)  {
        env.destroy();
        done();
    });

    it("can deploy a service", function(done) {
        env.deploy('precise/mysql');
        msg = conn.last_message();
        msg.op.should.equal('deploy');
        msg.charm_url.should.equal('precise/mysql');
        done();
    });

    it("can add a unit", function(done) {
        env.add_unit('mysql', 3);
        msg = conn.last_message();
        msg.op.should.equal('add_unit');
        msg.service_name.should.equal('mysql');
        msg.num_units.should.equal(3);
        done();
    });

    it("can accept a callback on its methods", function(done) {
        env.get_charm('cs:precise/mysql', function(result) {
            console.log('invoked', result);
            result.op.should.equal('get_charm');
            result.result.id.should.equal('cs:precise/mysql');
            done();
        });

        msg = conn.last_message();
        console.log('msg', msg);
        conn.msg({
            'op': 'get_charm',
            'request_id': msg.request_id,
            'result': {'id': 'cs:precise/mysql'}});
    });

});
})();
