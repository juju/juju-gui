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
      assert.isUndefined(env.get('user'));
      assert.isUndefined(env.get('password'));
    });

    it('fires a login event on successful login', function(done) {
      var loginFired = false;
      env.on('login', function() {
        loginFired = true;
      });
      env.login();
      // Assume login to be the first request.
      conn.msg({RequestId: 1, Response: {}});
      assert.isTrue(loginFired);
      done();
    });

    it('avoids sending login requests without credentials', function() {
      env.setAttrs({user: undefined, password: undefined});
      env.login();
      assert.equal(0, conn.messages.length);
    });

  });

})();
