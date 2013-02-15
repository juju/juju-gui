'use strict';

(function() {

  describe('Environment factory', function() {
    var environments, juju, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-env'], function(Y) {
        juju = Y.namespace('juju');
        environments = juju.environments;
        done();
      });
    });

    it('returns the Python env if requested', function() {
      var env = juju.newEnvironment({}, 'python');
      assert.equal('python-env', env.name);
    });

    it('returns the Go env if requested', function() {
      var env = juju.newEnvironment({}, 'go');
      assert.equal('go-env', env.name);
    });

    it('returns the default env if none is specified', function() {
      var env = juju.newEnvironment({});
      assert.equal('python-env', env.name);
    });

    it('returns the default env if an invalid one is specified', function() {
      var env = juju.newEnvironment({}, 'invalid-api-backend');
      assert.equal('python-env', env.name);
    });

    it('sets up the env using the provided options', function() {
      var env = juju.newEnvironment({user: 'myuser', password: 'mypassword'});
      assert.equal('myuser', env.get('user'));
      assert.equal('mypassword', env.get('password'));
    });

  });

})();
