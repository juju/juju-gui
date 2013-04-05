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

  describe.only('sandbox.PyJujuAPI', function() {
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

    /**
      Generates the services required for some tests. After the services have
      been generated it will call the supplied callback.

      This interacts directly with the fakebackend bypassing the environment.
      The test "can add additional units" tests this code directly so as long
      as it passes you can consider this method valid.

      @method generateServices
      @param {Function} callback The callback to call after the services have
        been generated.
    */
    function generateServices(callback) {
      state.deploy('cs:wordpress', function(service) {
        var data = {
          op: 'add_unit',
          service_name: 'wordpress',
          num_units: 2
        };
        state.nextChanges();
        client.onmessage = function() {
          client.onmessage = function(received) {
            // After done generating the services
            callback(received);
          };
          client.send(Y.JSON.stringify(data));
        };
        client.open();
      });
    }

    /**
      Same as generateServices but uses the environment integration methods.
      Should be considered valid if "can add additional units (integration)"
      test passes.

      @method generateIntegrationServices
      @param {Function} callback The callback to call after the services have
        been generated.
    */
    function generateIntegrationServices(callback) {
      env.after('defaultSeriesChange', function() {
        var localCb = function(result) {
          env.add_unit('kumquat', 2, function(data) {
            // After finished generating integrated services
            callback(data);
          });
        };
        env.deploy(
            'cs:wordpress', 'kumquat', {llama: 'pajama'}, null, 1, localCb);
      });
      env.connect();
    }

    /**
      Generates the services and then exposes them for the un/expose tests.
      After they have been exposed it calls the supplied callback.

      This interacts directly with the fakebackend bypassing the environment and
      should be considered valid if "can expose a service" test passes.

      @method generateAndExposeService
      @param {Function} callback The callback to call after the services have
        been generated.
    */
    function generateAndExposeService(callback) {
      state.deploy('cs:wordpress', function(data) {
        var command = {
          op: 'expose',
          service_name: data.service.get('name')
        };
        state.nextChanges();
        client.onmessage = function() {
          client.onmessage = function(rec) {
            callback(rec);
          };
          client.send(Y.JSON.stringify(command));
        };
        client.open();
      }, { unitCount: 1 });
    }

    /**
      Same as generateAndExposeService but uses the environment integration
      methods. Should be considered valid if "can expose a service
      (integration)" test passes.

      @method generateAndExposeIntegrationService
      @param {Function} callback The callback to call after the services have
        been generated.
    */
    function generateAndExposeIntegrationService(callback) {
      env.after('defaultSeriesChange', function() {
        var localCb = function(result) {
          env.expose(result.service_name, function(rec) {
            callback(rec);
          });
        };
        env.deploy(
            'cs:wordpress', 'kumquat', {llama: 'pajama'}, null, 1, localCb);
      });
      env.connect();
    }

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
      env.on('delta', db.onDelta, db);
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
      function testForAddedUnits(received) {
        var service = state.db.services.getById('wordpress'),
            units = state.db.units.get_units_for_service(service),
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
        // Error is undefined
        assert.isUndefined(data.err);
        done();
      }
      // Generate the default services and add units
      generateServices(testForAddedUnits);
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
      function testForAddedUnits(data) {
        var service = state.db.services.getById('kumquat'),
            units = state.db.units.get_units_for_service(service);
        assert.lengthOf(units, 3);
        done();
      }
      generateIntegrationServices(testForAddedUnits);
    });

    it('can remove units', function(done) {
      function removeUnits() {
        var data = {
          op: 'remove_units',
          unit_names: ['wordpress/2', 'wordpress/3']
        };
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data),
              mock = {
                op: 'remove_units',
                result: true,
                unit_names: ['wordpress/2', 'wordpress/3']
              };
          // No errors
          assert.equal(data.result, true);
          // Returned data object contains all information
          assert.deepEqual(data, mock);
          done();
        };
        client.send(Y.JSON.stringify(data));
      }
      // Generate the services base data and then execute the test
      generateServices(removeUnits);
    });

    it('can remove units (integration)', function(done) {
      function removeUnits() {
        var unitNames = ['kumquat/2', 'kumquat/3'];
        env.remove_units(unitNames, function(data) {
          assert.equal(data.result, true);
          assert.deepEqual(data.unit_names, unitNames);
          done();
        });
      }
      // Generate the services via the integration method then execute the test
      generateIntegrationServices(removeUnits);
    });

    it('allows attempting to remove units from an invalid service',
        function(done) {
          function removeUnit() {
            var data = {
              op: 'remove_units',
              unit_names: ['bar/3']
            };
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data);
              assert.equal(data.result, true);
              done();
            };
            client.send(Y.JSON.stringify(data));
          }
          // Generate the services base data then execute the test.
          generateServices(removeUnit);
        }
    );

    it('throws an error if unit is a subordinate', function(done) {
      function removeUnits() {
        var data = {
          op: 'remove_units',
          unit_names: ['wordpress/2']
        };
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data);
          assert.equal(Y.Lang.isArray(data.err), true);
          assert.equal(data.err.length, 1);
          done();
        };
        state.db.services.getById('wordpress').set('is_subordinate', true);
        client.send(Y.JSON.stringify(data));
      }
      // Generate the services base data then execute the test.
      generateServices(removeUnits);
    });

    it('can expose a service', function(done) {
      function checkExposedService(rec) {
        var data = Y.JSON.parse(rec.data),
            mock = {
              op: 'expose',
              result: true,
              service_name: 'wordpress'
            };
        var service = state.db.services.getById(mock.service_name);
        assert.equal(service.get('exposed'), true);
        assert.equal(data.result, true);
        assert.deepEqual(data, mock);
        done();
      }
      generateAndExposeService(checkExposedService);
    });

    it('can expose a service (integration)', function(done) {
      function checkExposedService(rec) {
        var service = state.db.services.getById('kumquat');
        assert.equal(service.get('exposed'), true);
        assert.equal(rec.result, true);
        done();
      }
      generateAndExposeIntegrationService(checkExposedService);
    });

    it('fails silently when exposing an exposed service', function(done) {
      function checkExposedService(rec) {
        var data = Y.JSON.parse(rec.data),
            service = state.db.services.getById(data.service_name),
            command = {
              op: 'expose',
              service_name: data.service_name
            };
        state.nextChanges();
        client.onmessage = function(rec) {
          assert.equal(data.err, undefined);
          assert.equal(service.get('exposed'), true);
          assert.equal(data.result, true);
          done();
        };
        client.send(Y.JSON.stringify(command));
      }
      generateAndExposeService(checkExposedService);
    });

    it('fails with error when exposing an invalid service name',
        function(done) {
          state.deploy('cs:wordpress', function(data) {
            var command = {
              op: 'expose',
              service_name: 'foobar'
            };
            state.nextChanges();
            client.onmessage = function() {
              client.onmessage = function(rec) {
                var data = Y.JSON.parse(rec.data);
                assert.equal(data.result, false);
                assert.equal(data.err,
                   '`foobar` is an invalid service name.');
                done();
              };
              client.send(Y.JSON.stringify(command));
            };
            client.open();
          }, { unitCount: 1 });
        }
    );

    it('can unexpose a service', function(done) {
      function unexposeService(rec) {
        var data = Y.JSON.parse(rec.data),
            command = {
              op: 'unexpose',
              service_name: data.service_name
            };
        state.nextChanges();
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data),
              service = state.db.services.getById(data.service_name),
              mock = {
                op: 'unexpose',
                result: true,
                service_name: 'wordpress'
              };
          assert.equal(service.get('exposed'), false);
          assert.deepEqual(data, mock);
          done();
        };
        client.send(Y.JSON.stringify(command));
      }
      generateAndExposeService(unexposeService);
    });

    it('can unexpose a service (integration)', function(done) {
      function unexposeService(rec) {
        function localCb(rec) {
          var service = state.db.services.getById('kumquat');
          assert.equal(service.get('exposed'), false);
          assert.equal(rec.result, true);
          done();
        }
        env.unexpose(rec.service_name, localCb);
      }
      generateAndExposeIntegrationService(unexposeService);
    });

    it('fails silently when unexposing a not exposed service',
        function(done) {
          state.deploy('cs:wordpress', function(data) {
            var command = {
              op: 'unexpose',
              service_name: data.service.get('name')
            };
            state.nextChanges();
            client.onmessage = function() {
              client.onmessage = function(rec) {
                var data = Y.JSON.parse(rec.data),
                    service = state.db.services.getById(data.service_name);
                assert.equal(service.get('exposed'), false);
                assert.equal(data.result, true);
                assert.equal(data.err, undefined);
                done();
              };
              client.send(Y.JSON.stringify(command));
            };
            client.open();
          }, { unitCount: 1 });
        }
    );

    it('fails with error when unexposing an invalid service name',
        function(done) {
          function unexposeService(rec) {
            var data = Y.JSON.parse(rec.data),
                command = {
                  op: 'unexpose',
                  service_name: 'foobar'
                };
            state.nextChanges();
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data);
              assert.equal(data.result, false);
              assert.equal(data.err, '`foobar` is an invalid service name.');
              done();
            };
            client.send(Y.JSON.stringify(command));
          }
          generateAndExposeService(unexposeService);
        }
    );

    it('can add a relation', function(done) {
      function localCb() {
        state.deploy('cs:mysql', function(service) {
          var data = {
            op: 'add_relation',
            endpoint_a: [
              'wordpress',
              { name: 'db',
                role: 'client' }
            ],
            endpoint_b: [
              'mysql',
              { name: 'db',
                role: 'server' }
            ]
          };
          client.onmessage = function(rec) {
            var data = Y.JSON.parse(rec.data),
                mock = {
                  endpoint_a: 'wordpress:db',
                  endpoint_b: 'mysql:db',
                  op: 'add_relation',
                  result: {
                    id: 'relation-0',
                    'interface': 'mysql',
                    scope: 'global',
                    endpoints: [{
                      wordpress: {
                        name: 'db',
                        role: 'client'
                      }
                    }, {
                      mysql: {
                        name: 'db',
                        role: 'server'
                      }
                    }]
                  }
                };
            assert.equal(data.err, undefined);
            assert.equal(typeof data.result, 'object');
            assert.deepEqual(data, mock);
            done();
          }
          client.send(Y.JSON.stringify(data));
        });
      }
      generateServices(localCb);
    });

    it('can add a relation (integration)', function(done) {
      function addRelation() {
        function localCb(rec) {
console.log(rec);
          done();
        }
        var endpointA = [
              'wordpress',
              { name: 'db',
                role: 'client' }
            ],
            endpointB = [
              'mysql',
              { name: 'db',
                role: 'server' }
            ];
        env.add_relation(endpointA, endpointB, localCb);
      }
      generateIntegrationServices(function() {
        env.deploy('cs:mysql', undefined, undefined, undefined, 1, addRelation);
      });
    });

    it('does something with subordinate modules', function(done) {
      assert.fail();
      done();
    });

    it('throws an error if only one endpoint is supplied', function(done) {
      assert.fail();
      done();
    });

    it('throws an error if both endpoints are the same', function(done) {
      assert.fail();
      done();
    });

    it('throws an error if endpoints are not relatable', function(done) {
      assert.fail();
      done();
    });

  });

})();
