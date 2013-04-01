'use strict';

(function() {

  describe('sandbox.ClientConnection', function() {
    var requires = ['juju-env-sandbox', 'json-stringify'];
    var Y, sandboxModule, ClientConnection;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        sandboxModule = Y.namespace('juju.environments.sandbox');
        ClientConnection = sandboxModule.ClientConnection;
        done();
      });
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
      conn.send(Y.JSON.stringify(sent));
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
      assert.deepEqual(Y.JSON.parse(received.data), data);
    });

    it('receives messages from the API asynchronously.', function(done) {
      var data = {sample: 'foo', bar: [42, 36]};
      var conn = new ClientConnection({juju: {open: function() {}}});
      var isAsync = false;
      conn.onmessage = function(received) {
        assert.isString(received.data);
        assert.deepEqual(Y.JSON.parse(received.data), data);
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

  });

  describe('sandbox.PyJujuAPI', function() {
    var requires = [
      'juju-env-sandbox', 'juju-tests-utils', 'juju-env-python',
      'juju-models'];
    var Y, sandboxModule, ClientConnection, PyJujuAPI, environmentsModule,
        state, juju, client, env, utils, cleanups;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        sandboxModule = Y.namespace('juju.environments.sandbox');
        environmentsModule = Y.namespace('juju.environments');
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      state = utils.makeFakeBackendWithCharmStore().fakebackend;
      juju = new sandboxModule.PyJujuAPI({state: state});
      client = new sandboxModule.ClientConnection({juju: juju});
      env = new environmentsModule.PythonEnvironment({conn: client});
      cleanups = [];
    });

    afterEach(function() {
      Y.each(cleanups, function(f) {f();});
      env.destroy();
      client.destroy();
      juju.destroy();
      state.destroy();
    });

    it('opens successfully.', function(done) {
      var isAsync = false;
      client.onmessage = function(message) {
        assert.isTrue(isAsync);
        assert.deepEqual(
            Y.JSON.parse(message.data),
            {
              ready: true,
              provider_type: 'demonstration',
              default_series: 'precise'
            });
        done();
      };
      assert.isFalse(juju.connected);
      assert.isUndefined(juju.get('client'));
      client.open();
      assert.isTrue(juju.connected);
      assert.strictEqual(juju.get('client'), client);
      isAsync = true;
    });

    it('ignores "open" when already open to same client.', function() {
      client.receive = function() {
        assert.ok(false, 'The receive method should not be called.');
      };
      // Whitebox test: duplicate "open" state.
      juju.connected = true;
      juju.set('client', client);
      // This is effectively a re-open.
      client.open();
      // The assert.ok above is the verification.
    });

    it('refuses to open if already open to another client.', function() {
      // This is a simple way to make sure that we don't leave multiple
      // setInterval calls running.  If for some reason we want more
      // simultaneous clients, that's fine, though that will require
      // reworking the delta code generally.
      juju.connected = true;
      juju.set('client', {receive: function() {
        assert.ok(false, 'The receive method should not have been called.');
      }});
      assert.throws(
          client.open.bind(client),
          'INVALID_STATE_ERR : Connection is open to another client.');
    });

    it('closes successfully.', function(done) {
      client.onmessage = function() {
        client.close();
        assert.isFalse(juju.connected);
        assert.isUndefined(juju.get('client'));
        done();
      };
      client.open();
    });

    it('ignores "close" when already closed.', function() {
      // This simply shows that we do not raise an error.
      juju.close();
    });

    it('can dispatch on received information.', function(done) {
      var data = {op: 'testingTesting123', foo: 'bar'};
      juju.performOp_testingTesting123 = function(received) {
        assert.notStrictEqual(received, data);
        assert.deepEqual(received, data);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('refuses to dispatch when closed.', function() {
      assert.throws(
          juju.receive.bind(juju, {}),
          'INVALID_STATE_ERR : Connection is closed.'
      );
    });

    it('can log in.', function(done) {
      state.logout();
      // See FakeBackend's authorizedUsers for these default authentication
      // values.
      var data = {
        op: 'login',
        user: 'admin',
        password: 'password',
        request_id: 42
      };
      client.onmessage = function(received) {
        // First message is the provider type and default series.  We ignore
        // it, and prepare for the next one, which will be the reply to our
        // login.
        client.onmessage = function(received) {
          data.result = true;
          assert.deepEqual(Y.JSON.parse(received.data), data);
          assert.isTrue(state.get('authenticated'));
          done();
        };
        client.send(Y.JSON.stringify(data));
      };
      client.open();
    });

    it('can log in (environment integration).', function(done) {
      state.logout();
      env.after('defaultSeriesChange', function() {
        // See FakeBackend's authorizedUsers for these default values.
        env.setCredentials({user: 'admin', password: 'password'});
        env.after('login', function() {
          assert.isTrue(env.userIsAuthenticated);
          done();
        });
        env.login();
      });
      env.connect();
    });

    it('can deploy.', function(done) {
      // We begin logged in.  See utils.makeFakeBackendWithCharmStore.
      var data = {
        op: 'deploy',
        charm_url: 'cs:wordpress',
        service_name: 'kumquat',
        config_raw: 'funny: business',
        num_units: 2,
        request_id: 42
      };
      client.onmessage = function(received) {
        // First message is the provider type and default series.  We ignore
        // it, and prepare for the next one, which will be the reply to our
        // deployment.
        client.onmessage = function(received) {
          var parsed = Y.JSON.parse(received.data);
          assert.isUndefined(parsed.err);
          assert.deepEqual(parsed, data);
          assert.isObject(
              state.db.charms.getById('cs:precise/wordpress-10'));
          var service = state.db.services.getById('kumquat');
          assert.isObject(service);
          assert.equal(service.get('charm'), 'cs:precise/wordpress-10');
          assert.deepEqual(service.get('config'), {funny: 'business'});
          var units = state.db.units.get_units_for_service(service);
          assert.lengthOf(units, 2);
          done();
        };
        client.send(Y.JSON.stringify(data));
      };
      client.open();
    });

    it('can deploy (environment integration).', function(done) {
      // We begin logged in.  See utils.makeFakeBackendWithCharmStore.
      env.after('defaultSeriesChange', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          assert.equal(result.charm_url, 'cs:wordpress');
          var service = state.db.services.getById('kumquat');
          assert.equal(service.get('charm'), 'cs:precise/wordpress-10');
          assert.deepEqual(service.get('config'), {llama: 'pajama'});
          done();
        };
        env.deploy(
            'cs:wordpress', 'kumquat', {llama: 'pajama'}, null, 1, callback);
      });
      env.connect();
    });

    it('can communicate errors after attempting to deploy', function(done) {
      // Create a service with the name "wordpress".
      // The charm store is synchronous in tests, so we don't need a real
      // callback.
      state.deploy('cs:wordpress', function() {});
      env.after('defaultSeriesChange', function() {
        var callback = function(result) {
          assert.equal(
              result.err, 'A service with this name already exists.');
          done();
        };
        env.deploy(
            'cs:wordpress', undefined, undefined, undefined, 1, callback);
      });
      env.connect();
    });

    it('can send a delta stream of changes.', function(done) {
      // Create a service with the name "wordpress".
      // The charm store is synchronous in tests, so we don't need a real
      // callback.
      state.deploy('cs:wordpress', function() {});
      client.onmessage = function(received) {
        // First message is the provider type and default series.  We ignore
        // it, and prepare for the next one, which will handle the delta
        // stream.
        client.onmessage = function(received) {
          var parsed = Y.JSON.parse(received.data);
          assert.equal(parsed.op, 'delta');
          var deltas = parsed.result;
          assert.lengthOf(deltas, 3);
          assert.equal(deltas[0][0], 'service');
          assert.equal(deltas[0][1], 'change');
          assert.equal(deltas[0][2].charm, 'cs:precise/wordpress-10');
          assert.equal(deltas[1][0], 'machine');
          assert.equal(deltas[1][1], 'change');
          assert.equal(deltas[2][0], 'unit');
          assert.equal(deltas[2][1], 'change');
          done();
        };
        juju.sendDelta();
      };
      client.open();
    });

    it('does not send a delta if there are no changes.', function(done) {
      client.onmessage = function(received) {
        // First message is the provider type and default series.  We ignore
        // it, and prepare for the next one, which will handle the delta
        // stream.
        client.receiveNow = function(response) {
          assert.ok(false, 'This method should not have been called.');
        };
        juju.sendDelta();
        done();
      };
      client.open();
    });

    it('can send a delta stream (integration).', function(done) {
      // Create a service with the name "wordpress".
      // The charm store is synchronous in tests, so we don't need a real
      // callback.
      state.deploy('cs:wordpress', function() {}, {unitCount: 2});
      var db = new Y.juju.models.Database();
      db.on('update', function() {
        // We want to verify that the GUI database is equivalent to the state
        // database.
        assert.equal(db.services.size(), 1);
        assert.equal(db.units.size(), 2);
        assert.equal(db.machines.size(), 2);
        var stateService = state.db.services.item(0);
        var guiService = db.services.item(0);
        Y.each(
            ['charm', 'config', 'constraints', 'exposed',
             'id', 'name', 'subordinate'],
            function(attrName) {
              assert.deepEqual(
                  guiService.get(attrName), stateService.get(attrName));
            }
        );
        state.db.units.each(function(stateUnit) {
          var guiUnit = db.units.getById(stateUnit.id);
          Y.each(
              ['agent_state', 'machine', 'number', 'service'],
              function(attrName) {
                assert.deepEqual(guiUnit[attrName], stateUnit[attrName]);
              }
          );
        });
        state.db.machines.each(function(stateMachine) {
          var guiMachine = db.machines.getById(stateMachine.id);
          Y.each(
              ['agent_state', 'instance_state', 'public_address',
               'machine_id'],
              function(attrName) {
                assert.deepEqual(guiMachine[attrName], stateMachine[attrName]);
              }
          );
        });
        done();
      });
      env.on('delta', db.on_delta, db);
      env.after('defaultSeriesChange', function() {juju.sendDelta();});
      env.connect();
    });

    it('sends delta streams periodically after opening.', function(done) {
      client.onmessage = function(received) {
        // First message is the provider type and default series.  We ignore
        // it, and prepare for the next one, which will handle the delta
        // stream.
        var isAsync = false;
        client.onmessage = function(received) {
          assert.isTrue(isAsync);
          var parsed = Y.JSON.parse(received.data);
          assert.equal(parsed.op, 'delta');
          var deltas = parsed.result;
          assert.lengthOf(deltas, 3);
          assert.equal(deltas[0][2].charm, 'cs:precise/wordpress-10');
          done();
        };
        // Create a service with the name "wordpress".
        // The charm store is synchronous in tests, so we don't need a real
        // callback.
        state.deploy('cs:wordpress', function() {});
        isAsync = true;
      };
      juju.set('deltaInterval', 4);
      client.open();
    });

    it('stops sending delta streams after closing.', function(done) {
      var sysSetInterval = window.setInterval;
      var sysClearInterval = window.clearInterval;
      cleanups.push(function() {
        window.setInterval = sysSetInterval;
        window.clearInterval = sysClearInterval;
      });
      window.setInterval = function(f, interval) {
        assert.isFunction(f);
        assert.equal(interval, 4);
        return 42;
      };
      window.clearInterval = function(token) {
        assert.equal(token, 42);
        done();
      };
      client.onmessage = function(received) {
        // First message is the provider type and default series.  We can
        // close now.
        client.close();
      };
      juju.set('deltaInterval', 4);
      client.open();
    });

    it('can add additional units', function(done) {
      state.deploy('cs:wordpress', function(service) {
        var data = {
          op: 'add_unit',
          service_name: 'wordpress',
          num_units: 2
        };
        //Clear out the delta stream
        state.nextChanges();
        client.onmessage = function() {
          client.onmessage = function(received) {
            var units = state.db.units.get_units_for_service(service.service),
                data = Y.JSON.parse(received.data),
                mock = {
                  num_units: 2,
                  service_name: 'wordpress',
                  op: 'add_unit',
                  result: ['wordpress/2', 'wordpress/3']
                };
            // Do we have enough total units?
            assert.lengthOf(units, 3);
            // Does the response object contain the proper data
            assert.deepEqual(data, mock);
            done();
          };
          client.send(Y.JSON.stringify(data));
        };
        client.open();
      });
    });

    it('throws an error when adding units to an invalid service',
        function(done) {
          state.deploy('cs:wordpress', function(service) {
            var data = {
              op: 'add_unit',
              service_name: 'noservice',
              num_units: 2
            };
            //Clear out the delta stream
            state.nextChanges();
            client.onmessage = function() {
              client.onmessage = function(received) {
                var data = Y.JSON.parse(received.data);

                // If there is no error data.err will be undefined
                assert.equal(true, !!data.err);
                done();
              };
              client.send(Y.JSON.stringify(data));
            };
            client.open();
          });
        }
    );

    it('can add additional units (integration)', function(done) {
      env.after('defaultSeriesChange', function() {
        var callback = function(result) {
          env.add_unit('kumquat', 2, function(data) {
            var service = state.db.services.getById('kumquat');
            var units = state.db.units.get_units_for_service(service);
            assert.lengthOf(units, 3);
            done();
          });
        };
        env.deploy(
            'cs:wordpress', 'kumquat', {llama: 'pajama'}, null, 1, callback);
      });
      env.connect();
    });



  });

})();
