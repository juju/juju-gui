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

  describe('sandbox.ClientConnection', function() {
    var requires = ['juju-env-sandbox', 'json-stringify', 'juju-tests-factory'];
    var sandboxModule, ClientConnection, factory, state, juju;

    before(function(done) {
      YUI(GlobalConfig).use(requires, function(Y) {
        sandboxModule = Y.namespace('juju.environments.sandbox');
        ClientConnection = sandboxModule.ClientConnection;
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function() {
      state = factory.makeFakeBackend();
      juju = new sandboxModule.GoJujuAPI({
        state: state,
        socket_url: 'socket url'});
    });

    it('opens successfully in isolation.', function() {
      var receivedFromOpen;
      var jujuopen = function(client) {
        receivedFromOpen = client;
      };
      var conn = new ClientConnection({juju: {open: jujuopen}});
      var onopenFlag = false;
      conn.onopen = function() {
        onopenFlag = true;
      };
      assert.isFalse(conn.connected);
      conn.open();
      assert.isTrue(conn.connected);
      assert.isTrue(onopenFlag);
      assert.strictEqual(receivedFromOpen, conn);
    });

    it('silently ignores requests to open when already open.', function() {
      // This is the preparation.
      var jujuopenFlag = false;
      var jujuopen = function() {
        jujuopenFlag = true;
      };
      var conn = new ClientConnection({juju: {open: jujuopen}});
      assert.isFalse(conn.connected);
      conn.open();
      jujuopenFlag = false;
      var onopenFlag = false;
      conn.onopen = function() {
        onopenFlag = true;
      };
      // This is the test.
      conn.open();
      assert.isTrue(conn.connected);
      assert.isFalse(onopenFlag);
      assert.isFalse(jujuopenFlag);
    });

    it('closes successfully in isolation.', function() {
      var jujuclosedFlag;
      var jujuclosed = function() {
        jujuclosedFlag = true;
      };
      var conn = new ClientConnection({
        juju: {
          open: function() {},
          close: jujuclosed
        }
      });
      conn.open();
      assert.isTrue(conn.connected);
      var oncloseFlag = false;
      conn.onclose = function() {
        oncloseFlag = true;
      };
      conn.close();
      assert.isFalse(conn.connected);
      assert.isTrue(oncloseFlag);
      assert.isTrue(jujuclosedFlag);
    });

    it('silently ignores requests to close when already closed', function() {
      var jujuclosedFlag = false;
      var jujuclosed = function() {
        jujuclosedFlag = true;
      };
      var conn = new ClientConnection({
        juju: {
          open: function() {},
          close: jujuclosed
        }
      });
      assert.isFalse(conn.connected);
      var oncloseFlag = false;
      conn.onclose = function() {
        oncloseFlag = true;
      };
      conn.close();
      assert.isFalse(conn.connected);
      assert.isFalse(oncloseFlag);
      assert.isFalse(jujuclosedFlag);
    });

    it('sends messages to the API.', function() {
      var received;
      var sent = {response: 42, foo: ['bar', 'shazam']};
      var conn = new ClientConnection({
        juju: {
          open: function() {},
          receive: function(data) {received = data;}
        }
      });
      conn.open();
      conn.send(JSON.stringify(sent));
      assert.deepEqual(received, sent);
    });

    it('can receive messages from the API immediately.', function() {
      var data = {sample: 'foo', bar: [42, 36]};
      var conn = new ClientConnection({juju: {open: function() {}}});
      var received;
      conn.onmessage = function(event) {received = event;};
      conn.open();
      conn.receiveNow(data);
      assert.isString(received.data);
      assert.deepEqual(JSON.parse(received.data), data);
    });

    it('receives messages from the API asynchronously.', function(done) {
      var data = {sample: 'foo', bar: [42, 36]};
      var conn = new ClientConnection({juju: {open: function() {}}});
      var isAsync = false;
      conn.onmessage = function(received) {
        assert.isString(received.data);
        assert.deepEqual(JSON.parse(received.data), data);
        assert.isTrue(isAsync);
        done();
      };
      conn.open();
      conn.receive(data);
      isAsync = true;
    });

    it('refuses to send messages when not connected.', function() {
      var conn = new ClientConnection({juju: {open: function() {}}});
      assert.throws(
          conn.send.bind(conn, {response: 42}),
          'INVALID_STATE_ERR : Connection is closed.');
    });

    it('refuses to receive immediately when not connected.', function() {
      var conn = new ClientConnection({juju: {open: function() {}}});
      assert.throws(
          conn.receiveNow.bind(conn, {response: 42}),
          'INVALID_STATE_ERR : Connection is closed.');
    });

    it('refuses to receive asynchronously when not connected.', function() {
      var conn = new ClientConnection({juju: {open: function() {}}});
      assert.throws(
          conn.receive.bind(conn, {response: 42}),
          'INVALID_STATE_ERR : Connection is closed.');
    });

    it('returns ListModels responses', function(done) {
      var client = new ClientConnection({juju: juju});
      var data = {
        'request-id': 42,
        type: 'ModelManager',
        request: 'ListModels'
      };
      client.onmessage = function(received) {
        var expected = {
          'request-id': 42,
          response: {
            'user-models': [{
              model: {
                name: 'sandbox',
                uuid: 'sandbox1',
                'owner-tag': 'user-admin',
              },
              'last-connection': 'today'
            }]
          }
        };
        console.log(received.data);
        assert.deepEqual(JSON.parse(received.data), expected);
        done();
      };
      client.open();
      client.send(JSON.stringify(data));
    });

    it('returns ConfigSkeleton responses', function(done) {
      var client = new ClientConnection({juju: juju});
      var data = {
        'request-id': 42,
        type: 'ModelManager',
        request: 'ConfigSkeleton'
      };
      client.onmessage = function(received) {
        var expected = {
          'request-id': 42,
          response: {
            'owner-tag': 'user-admin',
            config: {
              attr1: 'value1',
              attr2: 'value2',
              name: 'sandbox',
              'authorized-keys': 'ssh-rsa INVALID',
              'access-key': 'access!',
              'secret-key': 'secret!'
            }
          }
        };
        assert.deepEqual(JSON.parse(received.data), expected);
        done();
      };
      client.open();
      client.send(JSON.stringify(data));
    });

  });

})();
