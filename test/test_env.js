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
      assert.equal('go-env', env.name);
    });

    it('returns the default env if an invalid one is specified', function() {
      var env = juju.newEnvironment({}, 'invalid-api-backend');
      assert.equal('go-env', env.name);
    });

    it('sets up the env using the provided options', function() {
      var env = juju.newEnvironment({user: 'myuser', password: 'mypassword'});
      assert.equal('myuser', env.get('user'));
      assert.equal('mypassword', env.get('password'));
    });

  });

  describe('Base Environment', function() {
    var requires = ['juju-env-base', 'juju-env-sandbox', 'json-stringify'];
    var environments, juju, Y, sandboxModule, ClientConnection;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        juju = Y.namespace('juju');
        environments = juju.environments;
        sandboxModule = Y.namespace('juju.environments.sandbox');
        ClientConnection = sandboxModule.ClientConnection;
        done();
      });
    });

    it('calls "open" on connection if available.', function() {
      var conn = new ClientConnection({juju: {open: function() {}}});
      var env = new environments.BaseEnvironment({conn: conn});
      assert.isFalse(conn.connected);
      assert.isFalse(env.get('connected'));
      env.connect();
      assert.isTrue(conn.connected);
      assert.isTrue(env.get('connected'));
    });

    it('uses the module-defined sessionStorage.', function() {
      var conn = new ClientConnection({juju: {open: function() {}}});
      var env = new environments.BaseEnvironment({conn: conn});
      var original = environments.sessionStorage;
      var setItemValue;
      environments.sessionStorage = {
        getItem: function() {
          return Y.JSON.stringify({user: 'foo', password: 'kumquat'});
        },
        setItem: function(key, value) {
          setItemValue = {key: key, value: value};
        }
      };
      env.setCredentials(null);
      assert.deepEqual(setItemValue, {key: 'credentials', value: 'null'});
      var creds = env.getCredentials();
      assert.isTrue(creds.areAvailable);
      assert.equal(creds.user, 'foo');
      assert.equal(creds.password, 'kumquat');
      // Clean up.
      environments.sessionStorage = original;
    });

  });

  describe('Base Environment module', function() {
    var requires = ['juju-env-base'];
    var Y, environments, juju;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        juju = Y.namespace('juju');
        environments = juju.environments;
        done();
      });
    });

    it('has a working minimal stubSessionStorage.', function() {
      assert.isNull(environments.stubSessionStorage.getItem('notKey'));
      environments.stubSessionStorage.setItem('foo', 'bar');
      assert.equal(environments.stubSessionStorage.getItem('foo'), 'bar');
      environments.stubSessionStorage.setItem('foo', undefined);
      assert.isNull(environments.stubSessionStorage.getItem('foo'));
    });

    it('has a working verifySessionStorage.', function() {
      // Make sure that the module called the function already.
      assert.isDefined(environments.sessionStorage);
      var original = environments.sessionStorage;
      environments.sessionStorage = {
        getItem: function() {
          throw 'Firefox security exception';
        }
      };
      environments.verifySessionStorage();
      // Verify that the function noticed that sessionStorage was broken and
      // replaced it with a good one.
      assert.strictEqual(
          environments.sessionStorage, environments.stubSessionStorage);
      // Clean up.
      environments.sessionStorage = original;
    });
  });

})();
