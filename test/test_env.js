'use strict';

// from nodejs runner
// YUI = require('yui').YUI,
//   base= require('../lib/base.js');


(function () {

var Y;

describe('Juju environment', function() {
    var juju, conn, env, msg, testUtils;

    before(function (done) {
        Y = YUI(GlobalConfig).use(
            ['base', 'node', 'json-parse', 'juju-env', 'juju-tests-utils'],
            function (Y) {
                testUtils = Y.namespace('juju-tests.utils');
                conn = new testUtils.SocketStub();
                juju = Y.namespace('juju');
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

    it('can deploy a service', function(done) {
        env.deploy('precise/mysql');
        msg = conn.last_message();
        msg.op.should.equal('deploy');
        msg.charm_url.should.equal('precise/mysql');
        done();
    });

    it('can add a unit', function(done) {
        env.add_unit('mysql', 3);
        msg = conn.last_message();
        msg.op.should.equal('add_unit');
        msg.service_name.should.equal('mysql');
        msg.num_units.should.equal(3);
        done();
    });

    it('can accept a callback on its methods', function(done) {
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
