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
      var conn = new ClientConnection({
        juju: {open: function() {}, close: function() {}}
      });
      var env = new environments.BaseEnvironment({conn: conn});
      assert.isFalse(conn.connected);
      assert.isFalse(env.get('connected'));
      env.connect();
      assert.isTrue(conn.connected);
      assert.isTrue(env.get('connected'));
      env.close();
      env.destroy();
    });

    it('calls "beforeClose" when the connection is closed', function() {
      var closed = false;
      var conn = new ClientConnection({
        juju: {
          open: function() {},
          close: function() {
            closed = true;
          }
        }
      });
      var env = new environments.BaseEnvironment({conn: conn});
      env.connect();
      var called = false;
      env.beforeClose = function(callback) {
        called = true;
        // The connection is still open.
        assert.strictEqual(closed, false, 'connection unexpectedly closed');
        // Close the connection.
        callback();
        assert.strictEqual(closed, true, 'connection not closed');
      };
      env.close();
      // The beforeClose method has been called.
      assert.strictEqual(called, true, 'before hook not called');
      env.destroy();
    });

    it('uses the module-defined sessionStorage.', function() {
      var conn = new ClientConnection({juju: {open: function() {}}});
      var env = new environments.BaseEnvironment({conn: conn});
      var original = environments.sessionStorage;
      var setItemValue = {};
      environments.sessionStorage = {
        getItem: function(key) {
          return setItemValue[key];
        },
        setItem: function(key, value) {
          setItemValue[key] = value;
        }
      };
      // Try with a valid value.
      var value = {user: 'foo', password: 'kumquat', macaroons: ['macaroon']};
      env.setCredentials(value);
      assert.deepEqual(setItemValue, {credentials: Y.JSON.stringify(value)});
      var creds = env.getCredentials();
      assert.strictEqual(creds.areAvailable, true);
      assert.strictEqual(creds.user, 'user-foo');
      assert.strictEqual(creds.password, 'kumquat');
      assert.deepEqual(creds.macaroons, ['macaroon']);
      // Try with null value.
      env.setCredentials(null);
      assert.deepEqual(setItemValue, {credentials: 'null'});
      creds = env.getCredentials();
      assert.strictEqual(creds.areAvailable, false);
      assert.strictEqual(creds.user, '');
      assert.strictEqual(creds.password, '');
      assert.strictEqual(creds.macaroons, null);
      // Credentials are available with macaroons only or user/password only.
      env.setCredentials({macaroons: ['macaroon']});
      assert.strictEqual(env.getCredentials().areAvailable, true);
      env.setCredentials({user: 'foo', password: 'kumquat'});
      assert.strictEqual(env.getCredentials().areAvailable, true);
      // Clean up.
      environments.sessionStorage = original;
    });

  });

  describe('Base Environment module', function() {
    var requires = ['juju-env-base'];
    var environments, juju;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
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
