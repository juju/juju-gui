/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

(function() {

  describe('Go Juju environment utilities', function() {
    var environments, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-env-go'], function(Y) {
        environments = Y.namespace('juju.environments');
        done();
      });
    });

    it('provides a way to retrieve a relation key from endpoints', function() {
      var endpoints = {
        wordpress: {Name: 'website', Role: 'provider'},
        haproxy: {Name: 'reverseproxy', Role: 'requirer'}
      };
      var key = environments.createRelationKey(endpoints);
      assert.deepEqual('haproxy:reverseproxy wordpress:website', key);
    });

    it('provides a way to lowercase the keys of an object', function() {
      var obj = {Key1: 'value1', key2: 'value2', MyThirdKey: 'value3'},
          expected = {key1: 'value1', key2: 'value2', mythirdkey: 'value3'},
          result = environments.lowerObjectKeys(obj);
      assert.deepEqual(expected, result);
    });

    it('provides a way to convert object values to strings', function() {
      var obj = {key1: 42, key2: false, key3: null, key4: 'foo'},
          expected = {key1: '42', key2: 'false', key3: null, key4: 'foo'},
          result = environments.stringifyObjectValues(obj);
      assert.deepEqual(expected, result);
    });

  });

  describe('Go Juju environment', function() {
    var cleanups, conn, endpointA, endpointB, ecs, env, juju, machineJobs, msg,
        utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'environment-change-set',
        'juju-tests-utils'
      ], function(Y) {
        juju = Y.namespace('juju');
        utils = Y.namespace('juju-tests.utils');
        machineJobs = Y.namespace('juju.environments').machineJobs;
        done();
      });
    });

    beforeEach(function() {
      conn = new utils.SocketStub();
      ecs = new juju.EnvironmentChangeSet();
      env = new juju.environments.GoEnvironment({
        conn: conn, user: 'user', password: 'password', ecs: ecs
      });
      env.connect();
      cleanups = [];
    });

    afterEach(function()  {
      cleanups.forEach(function(action) {action();});
      // We need to clear any credentials stored in sessionStorage.
      env.setCredentials(null);
      if (env && env.destroy) {env.destroy();}
      if (conn && conn.destroy) {conn.destroy();}
    });

    var noopHandleLogin = function() {
      var oldHandleLogin = Y.juju.environments.GoEnvironment.handleLogin;
      Y.juju.environments.GoEnvironment.handleLogin = function() {};
      cleanups.push(function() {
        Y.juju.environments.GoEnvironment.handleLogin = oldHandleLogin;
      });
    };

    describe('prepareConstraints', function() {

      it('converts integer constraints', function() {
        var constraints = env.prepareConstraints(
            {'root-disk': '800', 'cpu-cores': '4', mem: '2000'});
        assert.deepEqual(
            constraints, {'root-disk': 800, 'cpu-cores': 4, mem: 2000});
      });

      it('removes integer constraints with invalid values', function() {
        var constraints = env.prepareConstraints(
            {'cpu-power': 'four kquad', 'cpu-cores': 'tons', mem: 2000});
        assert.deepEqual(constraints, {mem: 2000});
      });

      it('does not remove zero values', function() {
        var constraints = env.prepareConstraints({'root-disk': '0', mem: 0});
        assert.deepEqual(constraints, {'root-disk': 0, mem: 0});
      });

      it('removes empty/undefined/null values', function() {
        var constraints = env.prepareConstraints({
          arch: undefined,
          tags: '',
          mem: ' ',
          'cpu-cores': 4,
          'cpu-power': null
        });
        assert.deepEqual(constraints, {'cpu-cores': 4});
      });

      it('removes unexpected constraints', function() {
        var constraints = env.prepareConstraints(
            {arch: 'i386', invalid: 'not-a-constraint'});
        assert.deepEqual(constraints, {arch: 'i386'});
      });

      it('turns tags into an array', function() {
        var constraints = env.prepareConstraints({tags: 'tag1,tag2,tag3'});
        assert.deepEqual(constraints, {tags: ['tag1', 'tag2', 'tag3']});
      });

      it('removes empty tags', function() {
        var constraints = env.prepareConstraints({tags: 'tag1,,tag3'});
        assert.deepEqual(constraints, {tags: ['tag1', 'tag3']});
      });

      it('handles invalid tags', function() {
        var constraints = env.prepareConstraints({tags: 'tag1,   ,tag2 ,'});
        assert.deepEqual(constraints, {tags: ['tag1', 'tag2']});
      });

      it('returns empty tags if no tags are really passed', function() {
        var constraints = env.prepareConstraints({tags: ' ,    ,   ,,,'});
        assert.deepEqual(constraints, {tags: []});
      });

      it('converts tags with spaces', function() {
        var constraints = env.prepareConstraints(
            {tags: 'first tag, second   tag'});
        assert.deepEqual(constraints, {tags: ['first-tag', 'second-tag']});
      });

      it('does not modify the input constraints in place', function() {
        var input = {'cpu-power': '800', 'cpu-cores': '4', mem: '2000'};
        var backup = Y.clone(input);
        env.prepareConstraints(input);
        assert.deepEqual(input, backup);
      });

    });

    describe('login', function() {
      it('sends the correct login message', function() {
        noopHandleLogin();
        env.login();
        var last_message = conn.last_message();
        var expected = {
          Type: 'Admin',
          Request: 'Login',
          RequestId: 1,
          Params: {AuthTag: 'user-user', Password: 'password'}
        };
        assert.deepEqual(expected, last_message);
      });

      it('resets the user and password if they are not valid', function() {
        env.login();
        // Assume login to be the first request.
        conn.msg({RequestId: 1, Error: 'Invalid user or password'});
        assert.isNull(env.getCredentials());
        assert.isTrue(env.failedAuthentication);
        assert.isFalse(env.failedTokenAuthentication);
      });

      it('fires a login event on successful login', function() {
        var loginFired = false;
        var result, fromToken;
        env.on('login', function(evt) {
          loginFired = true;
          result = evt.data.result;
          fromToken = evt.data.fromToken;
        });
        env.login();
        // Assume login to be the first request.
        conn.msg({RequestId: 1, Response: {}});
        assert.isTrue(loginFired);
        assert.isTrue(result);
        assert.isFalse(fromToken);
      });

      it('resets failed markers on successful login', function() {
        env.failedAuthentication = env.failedTokenAuthentication = true;
        env.login();
        // Assume login to be the first request.
        conn.msg({RequestId: 1, Response: {}});
        assert.isFalse(env.failedAuthentication);
        assert.isFalse(env.failedTokenAuthentication);
      });

      it('fires a login event on failed login', function() {
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
      });

      it('avoids sending login requests without credentials', function() {
        env.setCredentials(null);
        env.login();
        assert.equal(0, conn.messages.length);
      });

      it('calls environmentInfo and watchAll after login', function() {
        env.login();
        // Assume login to be the first request.
        conn.msg({RequestId: 1, Response: {}});
        var environmentInfoMessage = conn.last_message(2);
        // EnvironmentInfo is the second request.
        var environmentInfoExpected = {
          Type: 'Client',
          Request: 'EnvironmentInfo',
          RequestId: 2,
          Params: {}
        };
        assert.deepEqual(environmentInfoExpected, environmentInfoMessage);
        var watchAllMessage = conn.last_message();
        // EnvironmentInfo is the second request.
        var watchAllExpected = {
          Type: 'Client',
          Request: 'WatchAll',
          RequestId: 3,
          Params: {}
        };
        assert.deepEqual(watchAllExpected, watchAllMessage);
      });
    });

    describe('tokenLogin', function() {
      it('sends the correct tokenLogin message', function() {
        noopHandleLogin();
        env.tokenLogin('demoToken');
        var last_message = conn.last_message();
        var expected = {
          Type: 'GUIToken',
          Request: 'Login',
          RequestId: 1,
          Params: {Token: 'demoToken'}
        };
        assert.deepEqual(expected, last_message);
      });

      it('resets the user and password if the token is not valid', function() {
        env.tokenLogin('badToken');
        // Assume login to be the first request.
        conn.msg({
          RequestId: 1,
          Error: 'unknown, fulfilled, or expired token',
          ErrorCode: 'unauthorized access'
        });
        assert.isNull(env.getCredentials());
        assert.isTrue(env.failedTokenAuthentication);
        assert.isFalse(env.failedAuthentication);
      });

      it('fires a login event on successful token login', function() {
        var loginFired = false;
        var result, fromToken;
        env.on('login', function(evt) {
          loginFired = true;
          result = evt.data.result;
          fromToken = evt.data.fromToken;
        });
        env.tokenLogin('demoToken');
        // Assume login to be the first request.
        conn.msg({
          RequestId: 1,
          Response: {AuthTag: 'tokenuser', Password: 'tokenpasswd'}});
        assert.isTrue(loginFired);
        assert.isTrue(result);
        assert.isTrue(fromToken);
        var credentials = env.getCredentials();
        assert.equal('user-tokenuser', credentials.user);
        assert.equal('tokenpasswd', credentials.password);
      });

      it('resets failed markers on successful login', function() {
        env.failedAuthentication = env.failedTokenAuthentication = true;
        env.tokenLogin('demoToken');
        // Assume login to be the first request.
        conn.msg({
          RequestId: 1,
          Response: {AuthTag: 'tokenuser', Password: 'tokenpasswd'}});
        assert.isFalse(env.failedAuthentication);
        assert.isFalse(env.failedTokenAuthentication);
      });

      it('fires a login event on failed token login', function() {
        var loginFired = false;
        var result;
        env.on('login', function(evt) {
          loginFired = true;
          result = evt.data.result;
        });
        env.tokenLogin('badToken');
        // Assume login to be the first request.
        conn.msg({
          RequestId: 1,
          Error: 'unknown, fulfilled, or expired token',
          ErrorCode: 'unauthorized access'
        });
        assert.isTrue(loginFired);
        assert.isFalse(result);
      });

      it('calls environmentInfo and watchAll after token login', function() {
        env.tokenLogin('demoToken');
        // Assume login to be the first request.
        conn.msg({
          RequestId: 1,
          Response: {AuthTag: 'tokenuser', Password: 'tokenpasswd'}});
        var environmentInfoMessage = conn.last_message(2);
        // EnvironmentInfo is the second request.
        var environmentInfoExpected = {
          Type: 'Client',
          Request: 'EnvironmentInfo',
          RequestId: 2,
          Params: {}
        };
        assert.deepEqual(environmentInfoExpected, environmentInfoMessage);
        var watchAllMessage = conn.last_message();
        // EnvironmentInfo is the second request.
        var watchAllExpected = {
          Type: 'Client',
          Request: 'WatchAll',
          RequestId: 3,
          Params: {}
        };
        assert.deepEqual(watchAllExpected, watchAllMessage);
      });
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
        Response: {
          DefaultSeries: 'precise',
          'ProviderType': 'ec2',
          'Name': 'envname'
        }
      });
      assert.equal('precise', env.get('defaultSeries'));
      assert.equal('ec2', env.get('providerType'));
      assert.equal('envname', env.get('environmentName'));
    });

    it('sends the correct EnvironmentGet request', function() {
      env.environmentGet();
      var expectedMessage = {
        Type: 'Client',
        Request: 'EnvironmentGet',
        RequestId: 1,
        Params: {}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('warns on environmentGet errors', function() {
      env.environmentGet();
      // Mock "console.warn" so that it is possible to collect warnings.
      var original = console.warn;
      var warning = null;
      console.warn = function(msg) {
        warning = msg;
      };
      conn.msg({RequestId: 1, Error: 'bad wolf'});
      assert.strictEqual(
          warning, 'error calling EnvironmentGet API: bad wolf');
      // Restore the original "console.warn".
      console.warn = original;
    });

    it('stores the MAAS server on EnvironmentGet results on MAAS', function() {
      env.environmentGet();
      env.set('providerType', 'maas');
      conn.msg({
        RequestId: 1,
        Response: {
          Config: {'maas-server': '1.2.3.4/MAAS'}
        }
      });
      assert.equal(env.get('maasServer'), '1.2.3.4/MAAS');
    });

    it('ignores MAAS data on EnvironmentGet results not in MAAS', function() {
      env.set('providerType', 'ec2');
      env.environmentGet();
      conn.msg({
        RequestId: 1,
        Response: {
          Config: {'maas-server': '1.2.3.4/MAAS'}
        }
      });
      assert.isUndefined(env.get('maasServer'));
    });

    it('calls EnvironmentGet after EnvironmentInfo on MAAS', function() {
      // Simulate an EnvironmentInfo request/response.
      env.environmentInfo();
      conn.msg({
        RequestId: 1,
        Response: {
          DefaultSeries: 'utopic',
          'ProviderType': 'maas',
          'Name': 'envname'
        }
      });
      assert.lengthOf(conn.messages, 2);
      var expectedMessage = {
        Type: 'Client',
        Request: 'EnvironmentGet',
        RequestId: 2,
        Params: {}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('does not call EnvironmentGet after Info when not on MAAS', function() {
      // The MAAS server attribute is initially undefined.
      assert.isUndefined(env.get('maasServer'));
      // Simulate an EnvironmentInfo request/response.
      env.environmentInfo();
      conn.msg({
        RequestId: 1,
        Response: {
          DefaultSeries: 'utopic',
          'ProviderType': 'ec2',
          'Name': 'envname'
        }
      });
      assert.lengthOf(conn.messages, 1);
      // The MAAS server attribute has been set to null.
      assert.isNull(env.get('maasServer'));
    });

    it('sends the correct AddServiceUnits message', function() {
      env.add_unit('django', 3, null, null, {immediate: true});
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'AddServiceUnits',
        RequestId: 1,
        Params: {ServiceName: 'django', NumUnits: 3, ToMachineSpec: null}
      };
      assert.deepEqual(expected, last_message);
    });

    it('adds new service units to a specific machine', function() {
      env.add_unit('django', 3, '42', null, {immediate: true});
      var expectedMessage = {
        Type: 'Client',
        Request: 'AddServiceUnits',
        RequestId: 1,
        Params: {ServiceName: 'django', NumUnits: 3, ToMachineSpec: '42'}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('successfully adds units to a service', function(done) {
      env.add_unit('django', 2, null, function(data) {
        assert.strictEqual('django', data.service_name);
        assert.strictEqual(2, data.num_units);
        assert.deepEqual(['django/2', 'django/3'], data.result);
        assert.isUndefined(data.err);
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {Units: ['django/2', 'django/3']}
      });
    });

    it('handles failures adding units to a service', function(done) {
      env._add_unit('django', 0, null, function(data) {
        assert.strictEqual('django', data.service_name);
        assert.strictEqual(0, data.num_units);
        assert.strictEqual('must add at least one unit', data.err);
        done();
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'must add at least one unit'
      });
    });

    it('sends the correct DestroyServiceUnits message', function() {
      env.remove_units(['django/2', 'django/3'], null, {immediate: true});
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'DestroyServiceUnits',
        RequestId: 1,
        Params: {UnitNames: ['django/2', 'django/3']}
      };
      assert.deepEqual(expected, last_message);
    });

    it('successfully removes units from a service', function(done) {
      env.remove_units(['django/2', 'django/3'], function(data) {
        assert.deepEqual(['django/2', 'django/3'], data.unit_names);
        assert.isUndefined(data.err);
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {}
      });
    });

    it('handles failures removing units from a service', function(done) {
      env.remove_units(['django/2'], function(data) {
        assert.deepEqual(['django/2'], data.unit_names);
        assert.strictEqual('unit django/2 does not exist', data.err);
        done();
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'unit django/2 does not exist'
      });
    });


    describe('Deployer support', function() {
      it('sends the correct messages on deployer imports', function() {
        env.deployerImport('YAML BLOB');
        var last_message = conn.last_message();
        var expected = {
          Type: 'Deployer',
          Request: 'Import',
          RequestId: 1,
          Params: {
            YAML: 'YAML BLOB'
          }
        };
        assert.deepEqual(expected, last_message);
      });

      it('sends proper messages on deployer status', function() {
        env.deployerStatus();
        var expectedMessage = {
          Type: 'Deployer',
          Request: 'Status',
          Params: {},
          RequestId: 1
        };
        assert.deepEqual(conn.last_message(), expectedMessage);
      });

      it('handles successful status responses', function() {
        var response;
        env.deployerStatus(function(data) {
          response = data;
        });
        // Mimic the server Status response.
        conn.msg({
          RequestId: 1,
          Response: {
            LastChanges: [
              {DeploymentId: 1, Status: 'completed', Time: 42, Error: 'fail'},
              {DeploymentId: 2, Status: 'completed', Time: 43},
              {DeploymentId: 3, Status: 'started', Time: 44, Queue: 0},
              {DeploymentId: 4, Status: 'cancelled', Time: 45},
              {DeploymentId: 5, Status: 'scheduled', Time: 46, Queue: 1}
            ]
          }
        });
        assert.isUndefined(response.err);
        var expectedChanges = [
          {deploymentId: 1, status: 'completed', time: 42,
            queue: undefined, err: 'fail'},
          {deploymentId: 2, status: 'completed', time: 43,
            queue: undefined, err: undefined},
          {deploymentId: 3, status: 'started', time: 44,
            queue: 0, err: undefined},
          {deploymentId: 4, status: 'cancelled', time: 45,
            queue: undefined, err: undefined},
          {deploymentId: 5, status: 'scheduled', time: 46,
            queue: 1, err: undefined}
        ];
        assert.deepEqual(response.changes, expectedChanges);
      });

      it('handles status server failures', function() {
        var response;
        env.deployerStatus(function(data) {
          response = data;
        });
        // Mimic the server Status response.
        conn.msg({
          RequestId: 1,
          Error: 'bad wolf',
          Response: {}
        });
        assert.strictEqual(response.err, 'bad wolf');
      });

      it('builds a proper watch request', function() {
        env.deployerWatch(2);
        var last_message = conn.last_message();
        var expected = {
          Type: 'Deployer',
          Request: 'Watch',
          RequestId: 1,
          Params: {
            DeploymentId: 2
          }
        };
        assert.deepEqual(expected, last_message);
      });

      it('builds a proper watch next request', function() {
        env.deployerNext(5);
        var last_message = conn.last_message();
        var expected = {
          Type: 'Deployer',
          Request: 'Next',
          RequestId: 1,
          Params: {
            WatcherId: 5
          }
        };
        assert.deepEqual(expected, last_message);
      });

    });

    describe('Local charm upload support', function() {

      it('prevents non authorized users from sending files', function(done) {
        env.userIsAuthenticated = false;
        var warn = console.warn,
            called = false;

        console.warn = function(msg) {
          assert.equal(
              msg, 'Attempted upload files without providing credentials.');
          called = true;
        };
        var handler = env.on('login', function(e) {
          assert.deepEqual(e.data, {result: false});
          assert.equal(called, true, 'Console warning not called');
          handler.detach();
          console.warn = warn;
          done();
        });
        env.uploadLocalCharm();
      });

      it('uses the stored webHandler to perform requests', function() {
        env.userIsAuthenticated = true;
        var mockWebHandler = {sendPostRequest: utils.makeStubFunction()};
        env.set('webHandler', mockWebHandler);
        env.uploadLocalCharm(
            'a zip file', 'trusty',
            function() {return 'progress';},
            function() {return 'completed';});
        // Ensure the web handler's sendPostRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendPostRequest.callCount(), 1);
        var lastArguments = mockWebHandler.sendPostRequest.lastArguments();
        assert.strictEqual(lastArguments.length, 7);
        assert.strictEqual(
            lastArguments[0], '/juju-core/charms?series=trusty'); // Path.
        assert.deepEqual(
            lastArguments[1], {'Content-Type': 'application/zip'}); // Headers.
        assert.strictEqual(lastArguments[2], 'a zip file'); // Zip file object.
        assert.strictEqual(lastArguments[3], 'user-user'); // User name.
        assert.strictEqual(lastArguments[4], 'password'); // Password.
        assert.strictEqual(
            lastArguments[5](), 'progress'); // Progress callback.
        assert.strictEqual(
            lastArguments[6](), 'completed'); // Completed callback.
      });

    });

    describe('getLocalCharmFileUrl', function() {

      it('uses the stored webHandler to retrieve the file URL', function() {
        var mockWebHandler = {getUrl: utils.makeStubFunction('myurl')};
        env.set('webHandler', mockWebHandler);
        var url = env.getLocalCharmFileUrl(
            'local:trusty/django-42', 'icon.svg');
        assert.strictEqual(url, 'myurl');
        // Ensure the web handler's getUrl method has been called with the
        // expected arguments.
        assert.strictEqual(mockWebHandler.getUrl.callCount(), 1);
        var lastArguments = mockWebHandler.getUrl.lastArguments();
        assert.lengthOf(lastArguments, 3);
        assert.strictEqual(
            lastArguments[0],
            '/juju-core/charms?url=local:trusty/django-42&file=icon.svg');
        assert.strictEqual(lastArguments[1], 'user-user'); // User name.
        assert.strictEqual(lastArguments[2], 'password'); // Password.
      });

    });

    describe('listLocalCharmFiles', function() {

      it('uses the stored webHandler to retrieve the file list', function() {
        var mockWebHandler = {sendGetRequest: utils.makeStubFunction()};
        env.set('webHandler', mockWebHandler);
        env.listLocalCharmFiles(
            'local:trusty/django-42',
            function() {return 'progress';},
            function() {return 'completed';});
        // Ensure the web handler's sendGetRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendGetRequest.callCount(), 1);
        var lastArguments = mockWebHandler.sendGetRequest.lastArguments();
        assert.lengthOf(lastArguments, 6);
        assert.strictEqual(
            lastArguments[0], '/juju-core/charms?url=local:trusty/django-42');
        assert.deepEqual(lastArguments[1], {}); // Headers.
        assert.strictEqual(lastArguments[2], 'user-user'); // User name.
        assert.strictEqual(lastArguments[3], 'password'); // Password.
        assert.strictEqual(
            lastArguments[4](), 'progress'); // Progress callback.
        assert.strictEqual(
            lastArguments[5](), 'completed'); // Completed callback.
      });

    });

    describe('getLocalCharmFileContents', function() {

      it('uses the stored webHandler to retrieve the contents', function() {
        var mockWebHandler = {sendGetRequest: utils.makeStubFunction()};
        env.set('webHandler', mockWebHandler);
        env.getLocalCharmFileContents(
            'local:trusty/django-42', 'hooks/install',
            function() {return 'progress';},
            function() {return 'completed';});
        // Ensure the web handler's sendGetRequest method has been called with
        // the expected arguments.
        assert.strictEqual(mockWebHandler.sendGetRequest.callCount(), 1);
        var lastArguments = mockWebHandler.sendGetRequest.lastArguments();
        assert.lengthOf(lastArguments, 6);
        assert.strictEqual(
            lastArguments[0],
            '/juju-core/charms?url=local:trusty/django-42&file=hooks/install');
        assert.deepEqual(lastArguments[1], {}); // Headers.
        assert.strictEqual(lastArguments[2], 'user-user'); // User name.
        assert.strictEqual(lastArguments[3], 'password'); // Password.
        assert.strictEqual(
            lastArguments[4](), 'progress'); // Progress callback.
        assert.strictEqual(
            lastArguments[5](), 'completed'); // Completed callback.
      });

    });

    it('sends the correct expose message', function() {
      env.expose('apache', function() {}, {immediate: true});
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
      }, {immediate: true});
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
      }, {immediate: true});
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'service \"mysql\" not found'
      });
      assert.equal(service_name, 'mysql');
      assert.equal(err, 'service "mysql" not found');
    });

    it('sends the correct unexpose message', function() {
      env.unexpose('apache', function() {}, {immediate: true});
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
      }, {immediate: true});
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
      }, {immediate: true});
      // Mimic response, assuming ServiceUnexpose to be the first request.
      conn.msg({
        RequestId: 1,
        Error: 'service \"mysql\" not found'
      });
      assert.equal(err, 'service "mysql" not found');
      assert.equal(service_name, 'mysql');
    });

    it('successfully deploys a service', function() {
      env.deploy('precise/mysql', null, null, null, null, null, null, null,
          {immediate: true});
      msg = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: {
          ServiceName: null,
          ConfigYAML: null,
          Config: {},
          Constraints: {},
          CharmUrl: 'precise/mysql',
          NumUnits: null,
          ToMachineSpec: null
        },
        RequestId: 1
      };
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys a service with a config object', function() {
      var config = {debug: true, logo: 'example.com/mylogo.png'};
      var expected = {
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: {
          ServiceName: null,
          // Configuration values are sent as strings.
          Config: {debug: 'true', logo: 'example.com/mylogo.png'},
          ConfigYAML: null,
          Constraints: {},
          CharmUrl: 'precise/mediawiki',
          NumUnits: null,
          ToMachineSpec: null
        },
        RequestId: 1
      };
      env.deploy('precise/mediawiki', null, config, null, null, null, null,
          null, {immediate: true});
      msg = conn.last_message();
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
          Config: {},
          Constraints: {},
          ConfigYAML: config_raw,
          CharmUrl: 'precise/mysql',
          NumUnits: null,
          ToMachineSpec: null
        },
        RequestId: 1
      };
      env.deploy('precise/mysql', null, null, config_raw, null, null, null,
          null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(expected, msg);
    });

    it('successfully deploys a service with constraints', function() {
      var constraints = {
        'cpu-cores': 1,
        'cpu-power': 0,
        mem: '512M',
        arch: 'i386',
        'root-disk': '8000',
        tags: 'tag1,tag2'
      };
      env.deploy('precise/mediawiki', null, null, null, 1, constraints, null,
          null, {immediate: true});
      msg = conn.last_message();
      assert.deepEqual(msg.Params.Constraints, {
        'cpu-cores': 1,
        'cpu-power': 0,
        mem: 512,
        arch: 'i386',
        'root-disk': 8000,
        tags: ['tag1', 'tag2']
      });
    });

    it('successfully deploys a service to a specific machine', function() {
      var expectedMessage = {
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: {
          ServiceName: null,
          ConfigYAML: null,
          Config: {},
          Constraints: {},
          CharmUrl: 'precise/mediawiki',
          NumUnits: 1,
          ToMachineSpec: '42'
        },
        RequestId: 1
      };
      env.deploy('precise/mediawiki', null, null, null, 1, null, '42', null,
          {immediate: true});
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('successfully deploys a service storing charm data', function() {
      var charm_url;
      var err;
      var service_name;
      env.deploy(
          'precise/mysql', 'mysql', null, null, null, null, null,
          function(data) {
            charm_url = data.charm_url;
            err = data.err;
            service_name = data.service_name;
          }, {immediate: true});
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
      env.deploy(
          'precise/mysql', 'mysql', null, null, null, null, null,
          function(data) {
            err = data.err;
          }, {immediate: true});
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Error: 'service "mysql" not found'
      });
      assert.equal(err, 'service "mysql" not found');
    });

    it('adds a machine', function() {
      env.addMachines([{}], null, {immediate: true});
      var expectedMsg = {
        RequestId: 1,
        Type: 'Client',
        Request: 'AddMachines',
        Params: {
          MachineParams: [{Jobs: [machineJobs.HOST_UNITS]}]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds a machine with the given series and constraints', function() {
      var constraints = {'cpu-cores': 4, 'mem': 4000};
      env.addMachines([{series: 'trusty', constraints: constraints}], null,
          {immediate: true});
      var expectedMsg = {
        RequestId: 1,
        Type: 'Client',
        Request: 'AddMachines',
        Params: {
          MachineParams: [{
            Jobs: [machineJobs.HOST_UNITS],
            Series: 'trusty',
            Constraints: constraints
          }]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds a container', function() {
      env.addMachines([{containerType: 'lxc'}], null, {immediate: true});
      var expectedMsg = {
        RequestId: 1,
        Type: 'Client',
        Request: 'AddMachines',
        Params: {
          MachineParams: [{
            Jobs: [machineJobs.HOST_UNITS],
            ContainerType: 'lxc'
          }]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds a saucy container to a specific machine', function() {
      env.addMachines(
          [{containerType: 'lxc', parentId: '42', series: 'saucy'}],
          null, {immediate: true});
      var expectedMsg = {
        RequestId: 1,
        Type: 'Client',
        Request: 'AddMachines',
        Params: {
          MachineParams: [{
            Jobs: [machineJobs.HOST_UNITS],
            ContainerType: 'lxc',
            ParentId: '42',
            Series: 'saucy'
          }]
        }
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('adds multiple machines/containers', function() {
      env.addMachines([
        {},
        {jobs: [machineJobs.MANAGE_ENVIRON], series: 'precise'},
        {containerType: 'kvm'},
        {containerType: 'lxc', parentId: '1'}
      ], null, {immediate: true});
      var expectedMachineParams = [
        {Jobs: [machineJobs.HOST_UNITS]},
        {Jobs: [machineJobs.MANAGE_ENVIRON], Series: 'precise'},
        {Jobs: [machineJobs.HOST_UNITS], ContainerType: 'kvm'},
        {
          Jobs: [machineJobs.HOST_UNITS],
          ContainerType: 'lxc',
          ParentId: '1'
        }
      ];
      var expectedMsg = {
        RequestId: 1,
        Type: 'Client',
        Request: 'AddMachines',
        Params: {MachineParams: expectedMachineParams}
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    });

    it('avoids sending calls if no machines are added', function() {
      env.addMachines([], null, {immediate: true});
      assert.equal(conn.messages.length, 0);
    });

    it('handles successful addMachines server responses', function() {
      var response;
      env.addMachines([{}, {containerType: 'lxc'}], function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server AddMachines response.
      conn.msg({
        RequestId: 1,
        Response: {Machines: [{Machine: '42'}, {Machine: '2/lxc/1'}]}
      });
      assert.isUndefined(response.err);
      var expectedMachines = [
        {name: '42', err: null},
        {name: '2/lxc/1', err: null}
      ];
      assert.deepEqual(response.machines, expectedMachines);
    });

    it('handles addMachines server failures', function() {
      var response;
      env.addMachines([{}], function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server AddMachines response.
      conn.msg({
        RequestId: 1,
        Error: 'bad wolf',
        Response: {Machines: []}
      });
      assert.strictEqual(response.err, 'bad wolf');
      assert.strictEqual(response.machines.length, 0);
    });

    it('handles addMachines errors adding a specific machine', function() {
      var response;
      env.addMachines([{}, {}, {parentId: '42'}], function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server AddMachines response.
      conn.msg({
        RequestId: 1,
        Response: {
          Machines: [
            {Machine: '', Error: {Code: '', Message: 'bad wolf'}},
            {Machine: '', Error: {Code: '47', Message: 'machine 42 not found'}}
          ]
        }
      });
      assert.isUndefined(response.err);
      var expectedMachines = [
        {name: '', err: 'bad wolf'},
        {name: '', err: 'machine 42 not found (code 47)'}
      ];
      assert.deepEqual(response.machines, expectedMachines);
    });

    // Ensure a destroyMachines request has been sent.
    var assertDestroyMachinesRequestSent = function(names, force) {
      var expectedMsg = {
        RequestId: 1,
        Type: 'Client',
        Request: 'DestroyMachines',
        Params: {MachineNames: names, Force: force}
      };
      assert.deepEqual(conn.last_message(), expectedMsg);
    };

    it('removes a machine', function() {
      env.destroyMachines(['1'], null, null, {immediate: true});
      assertDestroyMachinesRequestSent(['1'], false);
    });

    it('forces a machine removal', function() {
      env.destroyMachines(['42'], true, null, {immediate: true});
      assertDestroyMachinesRequestSent(['42'], true);
    });

    it('removes a container', function() {
      env.destroyMachines(['2/lxc/0'], null, null, {immediate: true});
      assertDestroyMachinesRequestSent(['2/lxc/0'], false);
    });

    it('forces a container removal', function() {
      env.destroyMachines(['1/kvm/42'], true, null, {immediate: true});
      assertDestroyMachinesRequestSent(['1/kvm/42'], true);
    });

    it('removes multiple machines/containers', function() {
      env.destroyMachines(['1', '47', '42/lxc/0'], null, null,
          {immediate: true});
      assertDestroyMachinesRequestSent(['1', '47', '42/lxc/0'], false);
    });

    it('avoids sending calls if no machines are removed', function() {
      env.destroyMachines([], null, null, {immediate: true});
      assert.equal(conn.messages.length, 0);
    });

    it('handles successful destroyMachines server responses', function() {
      var response;
      env.destroyMachines(['42', '1/lxc/2'], false, function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server DestroyMachines response.
      conn.msg({RequestId: 1, Response: {}});
      assert.isUndefined(response.err);
      assert.deepEqual(response.names, ['42', '1/lxc/2']);
    });

    it('handles destroyMachines server failures', function() {
      var response;
      env.destroyMachines(['1'], false, function(data) {
        response = data;
      }, {immediate: true});
      // Mimic the server DestroyMachines response.
      conn.msg({RequestId: 1, Error: 'bad wolf', Response: {}});
      assert.strictEqual(response.err, 'bad wolf');
      assert.deepEqual(response.names, ['1']);
    });

    it('sends the correct get_annotations message', function() {
      env.get_annotations('apache', 'service');
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'GetAnnotations',
        RequestId: 1,
        Params: {Tag: 'service-apache'}
      };
      assert.deepEqual(expected, last_message);
    });

    it('sends the correct update_annotations message', function() {
      env.update_annotations('apache', 'service', {'mykey': 'myvalue'});
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'SetAnnotations',
        RequestId: 1,
        Params: {
          Tag: 'service-apache',
          Pairs: {
            mykey: 'myvalue'
          }
        }
      };
      assert.deepEqual(expected, last_message);
    });

    it('correctly sends all the annotation values as strings', function() {
      var annotations = {mynumber: 42, mybool: true, mystring: 'string'},
          expected = {mynumber: '42', mybool: 'true', mystring: 'string'};
      env.update_annotations('apache', 'service', annotations);
      var pairs = conn.last_message().Params.Pairs;
      assert.deepEqual(expected, pairs);
    });

    it('sends correct multiple update_annotations messages', function() {
      env.update_annotations('apache', 'service', {
        'key1': 'value1',
        'key2': 'value2'
      });
      var expected = [
        {
          Type: 'Client',
          Request: 'SetAnnotations',
          RequestId: 1,
          Params: {
            Tag: 'service-apache',
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
      env.remove_annotations('apache', 'service', ['key1']);
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'SetAnnotations',
        RequestId: 1,
        Params: {
          Tag: 'service-apache',
          Pairs: {
            key1: ''
          }
        }
      };
      assert.deepEqual(expected, last_message);
    });

    it('sends the correct remove_annotations message', function() {
      env.remove_annotations('apache', 'service', ['key1', 'key2']);
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'SetAnnotations',
        RequestId: 1,
        Params: {
          Tag: 'service-apache',
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
      env.get_annotations('mysql', 'service', function(data) {
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
      env.update_annotations('mysql', 'service', {'mykey': 'myvalue'},
          function(data) {
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
      env.update_annotations('mysql', 'service', {
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
      env.remove_annotations('mysql', 'service', ['key1', 'key2'],
          function(data) {
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
      env.get_annotations('haproxy', 'service', function(data) {
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
      env.update_annotations('haproxy', 'service', {
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
      env.remove_annotations('haproxy', 'service', ['key1', 'key2'],
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
      var service_name, result;
      env.get_service('mysql', function(data) {
        service_name = data.service_name;
        result = data.result;
      });
      // Mimic response.
      conn.msg({
        RequestId: 1,
        Response: {
          Service: 'mysql',
          Charm: 'mysql',
          Config: {
            'binlog-format': {
              description: 'Yada, yada, yada.',
              type: 'string',
              value: 'gzip'
            }
          }
        }
      });
      assert.equal(service_name, 'mysql');
      var expected = {
        config: {
          'binlog-format': 'gzip'
        },
        constraints: undefined
      };
      assert.strictEqual('mysql', service_name);
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
        Error: 'service \"yoursql\" not found',
        Response: {
          Service: 'yoursql'
        }
      });
      assert.equal(service_name, 'yoursql');
      assert.equal(err, 'service "yoursql" not found');
    });

    it('can set service constraints', function() {
      env.set_constraints('mysql', {'cpu-cores': '4'});
      msg = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'SetServiceConstraints',
        Params: {
          ServiceName: 'mysql',
          Constraints: {
            'cpu-cores': 4
          }
        },
        RequestId: msg.RequestId
      };
      assert.deepEqual(expected, msg);
    });

    it('must error if neither data nor config are passed', function() {
      assert.throws(function() {
        env.set_config(
            'mysql', undefined, undefined, null, null, {immediate: true});
      }, 'Exactly one of config and data must be provided');
    });

    it('must error if both data and config are passed', function() {
      assert.throws(function() {
        env.set_config('mysql', {'cfg-key': 'cfg-val'}, 'YAMLBEBAML', null,
            null, {immediate: true});
      }, 'Exactly one of config and data must be provided');
    });

    it('can set a service config', function() {
      // This also tests that it only sends the changed values
      env.set_config('mysql', {
        'cfg-key': 'cfg-val',
        'unchanged': 'bar'
      }, null, {
        'cfg-key': 'foo',
        'unchanged': 'bar'
      }, null, {immediate: true});
      msg = conn.last_message();
      var expected = {
        Type: 'Client',
        Params: {
          ServiceName: 'mysql',
          Options: {
            'cfg-key': 'cfg-val'
          }
        },
        Request: 'ServiceSet',
        RequestId: msg.RequestId
      };
      assert.deepEqual(expected, msg);
    });

    it('can set a service config from a file', function() {
      /*jshint multistr:true */
      var data = 'tuning-level: \nexpert-mojo';
      /*jshint multistr:false */
      env.set_config('mysql', null, data, null, null, {immediate: true});
      msg = conn.last_message();
      var expected = {
        RequestId: msg.RequestId,
        Type: 'Client',
        Request: 'ServiceSetYAML',
        Params: {
          ServiceName: 'mysql',
          Config: data
        }
      };
      assert.deepEqual(expected, msg);
    });

    it('handles failed set config', function() {
      var err, service_name;
      env.set_config('yoursql', {}, null, {}, function(evt) {
        err = evt.err;
        service_name = evt.service_name;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        RequestId: msg.RequestId,
        Error: 'service "yoursql" not found'
      });
      assert.equal(err, 'service "yoursql" not found');
      assert.equal(service_name, 'yoursql');
    });

    it('handles successful set config', function() {
      var dataReturned;
      var oldConfig = {key1: 'value1', key2: 'value2', key3: 'value3'};
      var newConfig = {key1: 'value1', key2: 'CHANGED!', key3: 'value3'};
      env.set_config('django', newConfig, null, oldConfig, function(evt) {
        dataReturned = evt;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        RequestId: msg.RequestId,
        Response: {}
      });
      assert.isUndefined(dataReturned.err);
      assert.equal(dataReturned.service_name, 'django');
      // The returned event includes the changed config options.
      assert.deepEqual(dataReturned.newValues, {key2: 'CHANGED!'});
      // The old and new config objects are not modified in the process.
      assert.deepEqual(
          oldConfig, {key1: 'value1', key2: 'value2', key3: 'value3'});
      assert.deepEqual(
          newConfig, {key1: 'value1', key2: 'CHANGED!', key3: 'value3'});
    });

    it('can destroy a service', function() {
      var service_name = '';
      env.destroy_service('mysql', function(evt) {
        service_name = evt.service_name;
      }, {immediate: true});
      var expected = {
        Type: 'Client',
        Request: 'ServiceDestroy',
        Params: {
          ServiceName: 'mysql'
        },
        RequestId: msg.RequestId
      };
      msg = conn.last_message();
      conn.msg({
        RequestId: msg.RequestId,
        Error: 'service "yoursql" not found'
      });
      assert.deepEqual(expected, msg);
      assert.equal(service_name, 'mysql');
    });

    it('handles failed destroy service', function() {
      var err, service_name;
      env.destroy_service('yoursql', function(evt) {
        err = evt.err;
        service_name = evt.service_name;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        RequestId: msg.RequestId,
        Error: 'service "yoursql" not found'
      });
      assert.equal(err, 'service "yoursql" not found');
      assert.equal(service_name, 'yoursql');
    });

    it('sends the correct AddRelation message', function() {
      endpointA = ['haproxy', {name: 'reverseproxy'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, null, {immediate: true});
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'AddRelation',
        Params: {
          Endpoints: ['haproxy:reverseproxy', 'wordpress:website']
        },
        RequestId: 1
      };
      assert.deepEqual(expected, last_message);
    });

    it('successfully adds a relation', function() {
      var endpoints, relationId, result;
      var jujuEndpoints = {};
      endpointA = ['haproxy', {name: 'reverseproxy'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, function(ev) {
        result = ev.result;
      }, {immediate: true});
      msg = conn.last_message();
      jujuEndpoints.haproxy = {
        Name: 'reverseproxy',
        Interface: 'http',
        Scope: 'global',
        Role: 'requirer'
      };
      jujuEndpoints.wordpress = {
        Name: 'website',
        Interface: 'http',
        Scope: 'global',
        Role: 'provider'
      };
      conn.msg({
        RequestId: msg.RequestId,
        Response: {
          Endpoints: jujuEndpoints
        }
      });
      assert.equal(result.id, 'haproxy:reverseproxy wordpress:website');
      assert.equal(result['interface'], 'http');
      assert.equal(result.scope, 'global');
      endpoints = result.endpoints;
      assert.deepEqual(endpoints[0], {'haproxy': {'name': 'reverseproxy'}});
      assert.deepEqual(endpoints[1], {'wordpress': {'name': 'website'}});
    });

    it('handles failed relation adding', function() {
      var evt;
      endpointA = ['haproxy', {name: 'reverseproxy'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.add_relation(endpointA, endpointB, function(ev) {
        evt = ev;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        RequestId: msg.RequestId,
        Error: 'cannot add relation'
      });
      assert.equal(evt.err, 'cannot add relation');
      assert.equal(evt.endpoint_a, 'haproxy:reverseproxy');
      assert.equal(evt.endpoint_b, 'wordpress:website');
    });

    it('sends the correct DestroyRelation message', function() {
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, null, {immediate: true});
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'DestroyRelation',
        Params: {
          Endpoints: [
            'mysql:database',
            'wordpress:website'
          ]
        },
        RequestId: 1
      };
      assert.deepEqual(expected, last_message);
    });

    it('calls the ecs remove relation', function() {
      var lazy = utils.makeStubMethod(env.get('ecs'), '_lazyRemoveRelation');
      this._cleanups.push(lazy.reset);
      env.remove_relation([], [], function() {});
      assert.equal(lazy.calledOnce(), true);
    });

    it('successfully removes a relation', function() {
      var endpoint_a, endpoint_b;
      endpointA = ['mysql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, function(ev) {
        endpoint_a = ev.endpoint_a;
        endpoint_b = ev.endpoint_b;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        RequestId: msg.RequestId,
        Response: {}
      });
      assert.equal(endpoint_a, 'mysql:database');
      assert.equal(endpoint_b, 'wordpress:website');
    });

    it('handles failed attempt to remove a relation', function() {
      var endpoint_a, endpoint_b, err;
      endpointA = ['yoursql', {name: 'database'}];
      endpointB = ['wordpress', {name: 'website'}];
      env.remove_relation(endpointA, endpointB, function(ev) {
        endpoint_a = ev.endpoint_a;
        endpoint_b = ev.endpoint_b;
        err = ev.err;
      }, {immediate: true});
      msg = conn.last_message();
      conn.msg({
        RequestId: msg.RequestId,
        Error: 'service "yoursql" not found'
      });
      assert.equal(endpoint_a, 'yoursql:database');
      assert.equal(endpoint_b, 'wordpress:website');
      assert.equal(err, 'service "yoursql" not found');
    });

    it('calls the ecs remove unit', function() {
      var lazy = utils.makeStubMethod(env.get('ecs'), '_lazyRemoveUnit');
      this._cleanups.push(lazy.reset);
      env.remove_units([], function() {});
      assert.equal(lazy.calledOnce(), true);
    });

    it('sends the correct CharmInfo message', function() {
      env.get_charm('cs:precise/wordpress-10');
      var last_message = conn.last_message();
      var expected = {
        Type: 'Client',
        Request: 'CharmInfo',
        Params: {CharmURL: 'cs:precise/wordpress-10'},
        RequestId: 1
      };
      assert.deepEqual(expected, last_message);
    });

    it('successfully retrieves information about a charm', function(done) {
      // Define a response example.
      var response = {
        Config: {
          Options: {
            debug: {
              Default: 'no',
              Description: 'Setting this option to "yes" will ...',
              Title: '',
              Type: 'string'
            },
            engine: {
              Default: 'nginx',
              Description: 'Two web server engines are supported...',
              Title: '',
              Type: 'string'
            }
          }
        },
        Meta: {
          Categories: null,
          Description: 'This will install and setup WordPress...',
          Format: 1,
          Name: 'wordpress',
          OldRevision: 0,
          Peers: {
            loadbalancer: {
              Interface: 'reversenginx',
              Limit: 1,
              Optional: false,
              Scope: 'global'
            }
          },
          Provides: {
            website: {
              Interface: 'http',
              Limit: 0,
              Optional: false,
              Scope: 'global'
            }
          },
          Requires: {
            cache: {
              Interface: 'memcache',
              Limit: 1,
              Optional: false,
              Scope: 'global'
            },
            db: {
              Interface: 'mysql',
              Limit: 1,
              Optional: false,
              Scope: 'global'
            }
          },
          Subordinate: false,
          Summary: 'WordPress is a full featured web blogging tool...'
        },
        Revision: 10,
        URL: 'cs:precise/wordpress-10'
      };
      // Define expected options.
      var options = response.Config.Options;
      var expectedOptions = {
        debug: {
          'default': options.debug.Default,
          description: options.debug.Description,
          type: options.debug.Type,
          title: options.debug.Title
        },
        engine: {
          'default': options.engine.Default,
          description: options.engine.Description,
          type: options.engine.Type,
          title: options.engine.Title
        }
      };
      // Define expected peers.
      var meta = response.Meta;
      var peer = meta.Peers.loadbalancer;
      var expectedPeers = {
        loadbalancer: {
          'interface': peer.Interface,
          limit: peer.Limit,
          optional: peer.Optional,
          scope: peer.Scope
        }
      };
      // Define expected provides.
      var provide = meta.Provides.website;
      var expectedProvides = {
        website: {
          'interface': provide.Interface,
          limit: provide.Limit,
          optional: provide.Optional,
          scope: provide.Scope
        }
      };
      // Define expected requires.
      var require1 = meta.Requires.cache;
      var require2 = meta.Requires.db;
      var expectedRequires = {
        cache: {
          'interface': require1.Interface,
          limit: require1.Limit,
          optional: require1.Optional,
          scope: require1.Scope
        },
        db: {
          'interface': require2.Interface,
          limit: require2.Limit,
          optional: require2.Optional,
          scope: require2.Scope
        }
      };
      env.get_charm('cs:precise/wordpress-10', function(data) {
        var err = data.err,
            result = data.result;
        // Ensure the result is correctly generated.
        assert.isUndefined(err);
        assert.deepEqual({options: expectedOptions}, result.config);
        assert.deepEqual(expectedPeers, result.peers);
        assert.deepEqual(expectedProvides, result.provides);
        assert.deepEqual(expectedRequires, result.requires);
        assert.equal(response.URL, result.url);
        // The result is enriched with additional info returned by juju-core.
        assert.equal(response.Revision, result.revision);
        assert.equal(meta.Description, result.description);
        assert.equal(meta.Format, result.format);
        assert.equal(meta.Name, result.name);
        assert.equal(meta.Subordinate, result.subordinate);
        assert.equal(meta.Summary, result.summary);
        done();
      });
      // Mimic response, assuming CharmInfo to be the first request.
      conn.msg({
        RequestId: 1,
        Response: response
      });
    });

    it('handles failed attempt to retrieve charm info', function(done) {
      env.get_charm('cs:precise/wordpress-10', function(data) {
        var err = data.err,
            result = data.result;
        assert.equal('charm not found', err);
        assert.isUndefined(result);
        done();
      });
      // Mimic response, assuming CharmInfo to be the first request.
      conn.msg({
        RequestId: 1,
        Error: 'charm not found'
      });
    });

    it('provides for a missing Params', function() {
      // If no "Params" are provided in an RPC call an empty one is added.
      var op = {};
      env._send_rpc(op);
      assert.deepEqual(op.Params, {});
    });

    it('can watch all changes', function() {
      env._watchAll();
      msg = conn.last_message();
      assert.equal(msg.Type, 'Client');
      assert.equal(msg.Request, 'WatchAll');
    });

    it('can retrieve the next set of environment changes', function() {
      // This is normally set by _watchAll, we'll fake it here.
      env._allWatcherId = 42;
      env._next();
      msg = conn.last_message();
      assert.equal(msg.Type, 'AllWatcher');
      assert.equal(msg.Request, 'Next');
      assert.isTrue('Id' in msg);
      // This response is in fact to the sent _next request.
      assert.equal(msg.Id, env._allWatcherId);
    });

    it('fires "_rpc_response" message after an RPC response', function(done) {
      // We don't want the real response, we just want to be sure the event is
      // fired.
      env.detach('_rpc_response');
      env.on('_rpc_response', function(data) {
        done();
      });
      // Calling this sets up the callback.
      env._next();
      env._txn_callbacks[env._counter].call(env, {});
      // The only test assertion is that done (above) is called.
    });

    it('fires "delta" when handling an RPC response', function(done) {
      env.detach('delta');
      var callbackData = {Response: {Deltas: [['service', 'deploy', {}]]}};
      env.on('delta', function(evt) {
        done();
      });
      env._handleRpcResponse(callbackData);
    });

    it('translates the type of each change in the delta', function(done) {
      env.detach('delta');
      var callbackData = {Response: {Deltas: [['service', 'deploy', {}]]}};
      env.on('delta', function(evt) {
        var change = evt.data.result[0];
        assert.deepEqual(['serviceInfo', 'deploy', {}], change);
        done();
      });
      env._handleRpcResponse(callbackData);
    });

    it('sorts deltas', function(done) {
      env.detach('delta');
      var callbackData = {
        Response: {
          Deltas: [
            ['annotation', 'change', {}],
            ['relation', 'change', {}],
            ['machine', 'change', {}],
            ['foobar', 'fake', {}],
            ['unit', 'change', {}],
            ['service', 'deploy', {}]
          ]
        }
      };
      env.on('delta', function(evt) {
        var change = evt.data.result.map(function(delta) {
          return delta[0];
        });
        assert.deepEqual([
          'serviceInfo',
          'relationInfo',
          'unitInfo',
          'machineInfo',
          'annotationInfo',
          'foobarInfo'
        ], change);
        done();
      });
      env._handleRpcResponse(callbackData);
    });

    it('the _rpc_response subscription can not have args', function() {
      var subscribers = env.getEvent('_rpc_response')._subscribers;
      // This test assumes that there is only one subscriber.  If we ever have
      // any more we will need to update this test.
      assert.equal(subscribers.length, 1);
      assert.equal(subscribers[0].args, null);
    });

    it('can resolve a problem with a unit', function() {
      var unit_name = 'mysql/0';
      env.resolved(unit_name);
      msg = conn.last_message();
      assert.equal(msg.Type, 'Client');
      assert.equal(msg.Request, 'Resolved');
      assert.equal(msg.Params.UnitName, 'mysql/0');
      assert.isFalse(msg.Params.Retry);
    });

    it('can retry a problem with a unit', function() {
      var unit_name = 'mysql/0';
      env.resolved(unit_name, null, true);
      msg = conn.last_message();
      assert.equal(msg.Type, 'Client');
      assert.equal(msg.Request, 'Resolved');
      assert.equal(msg.Params.UnitName, 'mysql/0');
      assert.isTrue(msg.Params.Retry);
    });

    it('can remove a unit', function() {
      var unit_name = 'mysql/0';
      env.remove_units([unit_name], null, {immediate: true});
      msg = conn.last_message();
      assert.equal(msg.Type, 'Client');
      assert.equal(msg.Request, 'DestroyServiceUnits');
      assert.deepEqual(msg.Params.UnitNames, ['mysql/0']);
    });

    it('can provide a callback', function(done) {
      var unit_name = 'mysql/0';
      env.resolved(unit_name, null, true, function(result) {
        assert.equal(result.op, 'resolved');
        assert.equal(result.err, 'badness');
        done();
      });
      msg = conn.last_message();
      env.dispatch_result({
        RequestId: msg.RequestId,
        Error: 'badness',
        Response: {}
      });
    });

    it('provides provider features for all supported providers', function() {
      var providers = [
        'all',
        'azure',
        'demonstration',
        'ec2',
        'joyent',
        'local',
        'maas',
        'openstack',
        'manual'
      ];
      var providerFeatures = Y.juju.environments.providerFeatures;
      providers.forEach(function(provider) {
        assert.equal(
            Y.Lang.isArray(providerFeatures[provider].supportedContainerTypes),
            true);
      });
    });

  });

})();
