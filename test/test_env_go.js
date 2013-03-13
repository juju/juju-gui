'use strict';

(function() {

  describe('Go Juju environment', function() {
    var conn, env, juju, msg, utils, Y;

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

    it('sends the correct expose message', function() {
      env.expose('apache');
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'ServiceExpose',
        RequestId: 1,
        Params: {ServiceName: 'apache'}
      };
      assert.deepEqual(expected, last_message);
    });

    it('successfully exposes a service', function() {
      var service_name;
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
      var service_name;
      var err;
      env.expose('mysql', function(data) {
        service_name = data.service_name;
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'service \"mysql\" not found'
      });
      assert.equal(service_name, 'mysql');
      assert.equal(err, 'service "mysql" not found');
    });

    it('sends the correct unexpose message', function() {
      env.unexpose('apache');
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'ServiceUnexpose',
        RequestId: 1,
        Params: {ServiceName: 'apache'}
      };
      assert.deepEqual(expected, last_message);
    });

    it('successfully unexposes a service', function() {
      var err;
      var service_name;
      env.unexpose('mysql', function(data) {
        err = data.err;
        service_name = data.service_name;
      });
      // Mimic response, assuming ServiceUnexpose to be the first request.
      conn.msg({
        RequestId: 1,
        Response: {}
      });
      assert.isUndefined(err);
      assert.equal(service_name, 'mysql');
    });

    it('handles failed service unexpose', function() {
      var err;
      var service_name;
      env.unexpose('mysql', function(data) {
        err = data.err;
        service_name = data.service_name;
      });
      // Mimic response, assuming ServiceUnexpose to be the first request.
      conn.msg({
        RequestId: 1,
        Error: 'service \"mysql\" not found'
      });
      assert.equal(err, 'service "mysql" not found');
      assert.equal(service_name, 'mysql');
    });

    it('successfully deploys a service', function() {
      env.deploy('precise/mysql');
      msg = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: {
          CharmUrl: 'precise/mysql'
        },
        RequestId: 1
      };
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys a service with a config file', function() {
      /*jshint multistr:true */
      var config_raw = 'tuning-level: \nexpert-mojo';
      /*jshint multistr:false */
      var expected = {
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: {
          ServiceName: null,
          Config: null,
          ConfigYAML: config_raw,
          CharmUrl: 'precise/mysql'
        },
        RequestId: 1
      };
      env.deploy('precise/mysql', null, null, config_raw);
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys a service storing charm data', function() {
      var charm_url;
      var err;
      var service_name;
      env.deploy('precise/mysql', 'mysql', null, null, null, function(data) {
        charm_url = data.charm_url;
        err = data.err;
        service_name = data.service_name;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {}
      });
      assert.equal(charm_url, 'precise/mysql');
      assert.isUndefined(err);
      assert.equal(service_name, 'mysql');
    });

    it('handles failed service deploy', function() {
      var err;
      env.deploy('precise/mysql', 'mysql', null, null, null, function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'service "mysql" not found'
      });
      assert.equal(err, 'service "mysql" not found');
    });

    it('sends the correct get_annotations message', function() {
      env.get_annotations('service-apache');
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'GetAnnotations',
        RequestId: 1,
        Params: {EntityId: 'service-apache'}
      };
      assert.deepEqual(expected, last_message);
    });

    it('sends the correct update_annotations message', function() {
      env.update_annotations('service-apache', {'mykey': 'myvalue'});
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'SetAnnotations',
        RequestId: 1,
        Params: {
          EntityId: 'service-apache',
          Pairs: {
            mykey: 'myvalue'
          }
        }
      };
      assert.deepEqual(expected, last_message);
    });

    it('sends correct multiple update_annotations messages', function() {
      env.update_annotations('service-apache', {
        'key1': 'value1',
        'key2': 'value2'
      });
      var expected = [
        {
          Type: 'Client',
          Request: 'SetAnnotations',
          RequestId: 1,
          Params: {
            EntityId: 'service-apache',
            Pairs: {
              key1: 'value1',
              key2: 'value2'
            }
          }
        }
      ];
      assert.deepEqual(expected, conn.messages);
    });

    it('sends the correct remove_annotations message', function() {
      env.remove_annotations('service-apache', ['key1']);
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'SetAnnotations',
        RequestId: 1,
        Params: {
          EntityId: 'service-apache',
          Pairs: {
            key1: ''
          }
        }
      };
      assert.deepEqual(expected, last_message);
    });

    it('sends the correct remove_annotations message', function() {
      env.remove_annotations('service-apache', ['key1', 'key2']);
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'SetAnnotations',
        RequestId: 1,
        Params: {
          EntityId: 'service-apache',
          Pairs: {
            key1: '',
            key2: ''
          }
        }
      };
      assert.deepEqual(expected, last_message);
    });

    it('successfully retrieves annotations', function() {
      var annotations;
      var expected = {
        'key1': 'value1',
        'key2': 'value2'
      };
      env.get_annotations('service-mysql', function(data) {
        annotations = data.results;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {
          Annotations: expected
        }
      });
      assert.deepEqual(expected, annotations);
    });

    it('successfully sets annotation', function() {
      var err;
      env.update_annotations('mysql', {'mykey': 'myvalue'}, function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {}
      });
      assert.isUndefined(err);
    });

    it('successfully sets annotations', function() {
      var err;
      env.update_annotations('mysql', {
        'key1': 'value1',
        'key2': 'value2'
      }, function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {}
      });
      assert.isUndefined(err);
    });

    it('successfully removes annotations', function() {
      var err;
      env.remove_annotations('mysql', ['key1', 'key2'], function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {}
      });
      assert.isUndefined(err);
    });

    it('correctly handles errors from getting annotations', function() {
      var err;
      env.get_annotations('service-haproxy', function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'This is an error.'
      });
      assert.equal('This is an error.', err);
    });

    it('correctly handles errors from setting annotations', function() {
      var err;
      env.update_annotations('service-haproxy', {
        'key': 'value'
      }, function(data) {
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'This is an error.'
      });
      assert.equal('This is an error.', err);
    });

    it('correctly handles errors from removing annotations', function() {
      var err;
      env.remove_annotations('service-haproxy', ['key1', 'key2'],
          function(data) {
            err = data.err;
          });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'This is an error.'
      });
      assert.equal('This is an error.', err);
    });

    it('sends the correct get_service message', function() {
      env.get_service('mysql');
      var last_message = conn.last_message();
      var expected = {
        Request: 'ServiceGet',
        Type: 'Client',
        RequestId: 1,
        Params: {ServiceName: 'mysql'}
      };
      assert.deepEqual(expected, last_message);
    });

    it('successfully gets service configuration', function() {
      var service_name;
      var result;
      var expected = {
        Service: 'mysql',
        Charm: 'mysql',
        Settings: {
          'binlog-format': {
            description: 'If binlogging is enabled, etc, etc","type":"string',
            value: null
          }
        }
      };

      env.get_service('mysql', function(data) {
        service_name = data.service_name;
        result = data.result;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: expected
      });
      assert.equal(service_name, 'mysql');
      assert.deepEqual(expected, result);
    });

    it('handles failed get service', function() {
      var service_name;
      var err;
      env.get_service('yoursql', function(data) {
        service_name = data.service_name;
        err = data.err;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'service \"yoursql\" not found'
      });
      assert.equal(service_name, 'yoursql');
      assert.equal(err, 'service "yoursql" not found');
    });

  });


})();
