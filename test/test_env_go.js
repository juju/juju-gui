'use strict';

(function() {

  describe('Go Juju environment', function() {
    var conn, env, juju, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-env', 'juju-tests-utils'], function(Y) {
        juju = Y.namespace('juju');
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function(done) {
      conn = new utils.SocketStub();
      env = juju.newEnvironment({
        conn: conn, user: 'user', password: 'password'
      }, 'go');
      env.connect();
      done();
    });

    afterEach(function(done)  {
      env.destroy();
      done();
    });

    it('sends the correct login message', function() {
      env.login();
      var last_message = conn.last_message();
      var expected = {
        Type: 'Admin',
        Request: 'Login',
        RequestId: 1,
        Params: {EntityName: 'user', Password: 'password'}
      };
      assert.deepEqual(expected, last_message);
    });

    it('resets the user and password if they are not valid', function() {
      env.login();
      // Assume login to be the first request.
      conn.msg({RequestId: 1, Error: 'Invalid user or password'});
      assert.isNull(env.getCredentials());
      assert.isTrue(env.failedAuthentication);
    });

    it('fires a login event on successful login', function(done) {
      var loginFired = false;
      var result;
      env.on('login', function(evt) {
        loginFired = true;
        result = evt.data.result;
      });
      env.login();
      // Assume login to be the first request.
      conn.msg({RequestId: 1, Response: {}});
      assert.isTrue(loginFired);
      assert.isTrue(result);
      done();
    });

    it('fires a login event on failed login', function(done) {
      var loginFired = false;
      var result;
      env.on('login', function(evt) {
        loginFired = true;
        result = evt.data.result;
      });
      env.login();
      // Assume login to be the first request.
      conn.msg({RequestId: 1, Error: 'Invalid user or password'});
      assert.isTrue(loginFired);
      assert.isFalse(result);
      done();
    });

    it('avoids sending login requests without credentials', function() {
      env.setCredentials(null);
      env.login();
      assert.equal(0, conn.messages.length);
    });

    it('calls environmentInfo on successful login', function(done) {
      env.login();
      // Assume login to be the first request.
      conn.msg({RequestId: 1, Response: {}});
      var last_message = conn.last_message();
      // EnvironmentInfo is the second request.
      var expected = {
        Type: 'Client',
        Request: 'EnvironmentInfo',
        RequestId: 2,
        Params: {}
      };
      assert.deepEqual(expected, last_message);
      done();
    });

    it('sends the correct request for environment info', function() {
      env.environmentInfo();
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'EnvironmentInfo',
        RequestId: 1,
        Params: {}
      };
      assert.deepEqual(expected, last_message);
    });

    it('warns on environment info errors', function() {
      env.environmentInfo();
      // Mock "console.warn" so that it is possible to collect warnings.
      var original = console.warn;
      var warning = null;
      console.warn = function(msg) {
        warning = msg;
      };
      // Assume environmentInfo to be the first request.
      conn.msg({RequestId: 1, Error: 'Error retrieving env info.'});
      assert.include(warning, 'Error');
      // Restore the original "console.warn".
      console.warn = original;
    });

    it('stores environment info into env attributes', function() {
      env.environmentInfo();
      // Assume environmentInfo to be the first request.
      conn.msg({
        RequestId: 1,
        Response: {DefaultSeries: 'precise', 'ProviderType': 'ec2'}
      });
      assert.equal('precise', env.get('defaultSeries'));
      assert.equal('ec2', env.get('providerType'));
    });

    it('successfully expose a service', function() {
      var service;
      env.expose('mysql', function(data) {
        service_name = data.service_name;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {}
      });
      assert.equal(service_name, 'mysql');
    });

    it('handles failed service expose', function() {
      var service;
      var err;
      env.expose('mysql', function(data) {
        service_name = data.service_name;
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {'Error': 'service \"mysql\" not found'}
      });
      assert.equal(service_name, 'mysql');
      assert.equal(err, 'service \"mysql\" not found');

    });

  });

})();
