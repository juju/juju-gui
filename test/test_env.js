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

    it('can resolve a problem with a unit', function(done) {
        var unit_name = 'mysql/0';
        env.resolved(unit_name);
        msg = conn.last_message();
        msg.op.should.equal('resolved');
        msg.unit_name.should.equal(unit_name);
        var _ = expect(msg.relation_name).to.not.exist;
        msg.retry.should.equal(false);
        done();
    });

    it('can resolve a problem with a unit relation', function(done) {
        var unit_name = 'mysql/0';
        var rel_name = 'relation-0000000000';
        env.resolved(unit_name, rel_name);
        msg = conn.last_message();
        msg.op.should.equal('resolved');
        msg.unit_name.should.equal(unit_name);
        msg.relation_name.should.equal(rel_name);
        msg.retry.should.equal(false);
        done();
    });

    it('can retry a problem with a unit', function(done) {
        var unit_name = 'mysql/0';
        env.resolved(unit_name, null, true);
        msg = conn.last_message();
        msg.op.should.equal('resolved');
        msg.unit_name.should.equal(unit_name);
        var _ = expect(msg.relation_name).to.not.exist;
        msg.retry.should.equal(true);
        done();
    });
    it('can retry a problem with a unit using a callback', function(done) {
        var unit_name = 'mysql/0';
        env.resolved(unit_name, null, true, function(result) {
            result.op.should.equal('resolved');
            result.result.should.equal(true);
            done();
        });
        msg = conn.last_message();
        conn.msg({
            op: 'resolved',
            result: true,
            request_id: msg.request_id});
    });

});
})();
