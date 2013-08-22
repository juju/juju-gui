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

  describe('sandbox.PyJujuAPI', function() {
    var requires = [
      'juju-env-sandbox', 'juju-tests-utils', 'juju-env-python',
      'juju-models', 'promise'];
    var Y, sandboxModule, ClientConnection, environmentsModule, state, juju,
        client, env, utils, cleanups;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        sandboxModule = Y.namespace('juju.environments.sandbox');
        environmentsModule = Y.namespace('juju.environments');
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      state = utils.makeFakeBackend();
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
      state.deploy('cs:precise/wordpress-15', function(service) {
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
      Generates the two services required for relation removal tests. After the
      services have been generated, a relation between them will be added and
      then removed.

      This interacts directly with the fakebackend bypassing the environment.

      @method generateAndRelateServices
      @param {Array} charms The URLs of two charms to be deployed.
      @param {Array} relation Two endpoint strings to be related.
      @param {Array} removeRelation Two enpoint strings identifying
        a relation to be removed.
      @param {Object} mock Object with the expected return values of
        the relation removal operation.
      @param {Function} done To be called to signal the test end.
      @return {undefined} Side effects only.
    */
    function generateAndRelateServices(charms, relation,
        removeRelation, mock, done) {
      state.deploy(charms[0], function() {
        state.deploy(charms[1], function() {
          if (relation) {
            state.addRelation(relation[0], relation[1]);
          }
          var data = {
            op: 'remove_relation',
            endpoint_a: removeRelation[0],
            endpoint_b: removeRelation[1]
          };
          client.onmessage = function(received) {
            var recData = Y.JSON.parse(received.data);
            // Skip the defaultSeriesChange message.
            if (recData.default_series === undefined) {
              assert.equal(recData.result, mock.result);
              assert.equal(recData.err, mock.err);
              if (!recData.err) {
                assert.equal(recData.endpoint_a, mock.endpoint_a);
                assert.equal(recData.endpoint_b, mock.endpoint_b);
              }
              done();
            }
          };
          client.open();
          client.send(Y.JSON.stringify(data));
        });
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
            'cs:precise/wordpress-15',
            'kumquat',
            {llama: 'pajama'},
            null,
            1,
            null,
            localCb);
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
      state.deploy('cs:precise/wordpress-15', function(data) {
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
            'cs:precise/wordpress-15',
            'kumquat',
            {llama: 'pajama'},
            null,
            1,
            null,
            localCb);
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
      // We begin logged in.  See utils.makeFakeBackend.
      var data = {
        op: 'deploy',
        charm_url: 'cs:precise/wordpress-15',
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
              state.db.charms.getById('cs:precise/wordpress-15'));
          var service = state.db.services.getById('kumquat');
          assert.isObject(service);
          assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
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
      // We begin logged in.  See utils.makeFakeBackend.
      env.after('defaultSeriesChange', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          assert.equal(result.charm_url, 'cs:precise/wordpress-15');
          var service = state.db.services.getById('kumquat');
          assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
          assert.deepEqual(service.get('config'), {llama: 'pajama'});
          done();
        };
        env.deploy(
            'cs:precise/wordpress-15',
            'kumquat',
            {llama: 'pajama'},
            null,
            1,
            null,
            callback);
      });
      env.connect();
    });

    it('can communicate errors after attempting to deploy', function(done) {
      // Create a service with the name "wordpress".
      // The charm store is synchronous in tests, so we don't need a real
      // callback.
      state.deploy('cs:precise/wordpress-15', function() {});
      env.after('defaultSeriesChange', function() {
        var callback = function(result) {
          assert.equal(
              result.err, 'A service with this name already exists.');
          done();
        };
        env.deploy(
            'cs:precise/wordpress-15',
            undefined,
            undefined,
            undefined,
            1,
            null,
            callback);
      });
      env.connect();
    });

    it('can send a delta stream of changes.', function(done) {
      // Create a service with the name "wordpress".
      // The charm store is synchronous in tests, so we don't need a real
      // callback.
      state.deploy('cs:precise/wordpress-15', function() {});
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
          assert.equal(deltas[0][2].charm, 'cs:precise/wordpress-15');
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
      state.deploy('cs:precise/wordpress-15', function() {}, {unitCount: 2});
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
              ['agent_state', 'public_address', 'machine_id'],
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
          assert.equal(deltas[0][2].charm, 'cs:precise/wordpress-15');
          done();
        };
        // Create a service with the name "wordpress".
        // The charm store is synchronous in tests, so we don't need a real
        // callback.
        state.deploy('cs:precise/wordpress-15', function() {});
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
              result: ['wordpress/1', 'wordpress/2']
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
          state.deploy('cs:precise/wordpress-15', function(service) {
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
          unit_names: ['wordpress/0', 'wordpress/1']
        };
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data),
              mock = {
                op: 'remove_units',
                result: true,
                unit_names: ['wordpress/0', 'wordpress/1']
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
        var unitNames = ['kumquat/1', 'kumquat/2'];
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
              unit_names: ['bar/2']
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
          unit_names: ['wordpress/1']
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

    it('can get a service', function(done) {
      generateServices(function(data) {
        // Post deploy of wordpress so we should be able to
        // pull its data.
        var op = {
          op: 'get_service',
          service_name: 'wordpress',
          request_id: 99
        };
        client.onmessage = function(received) {
          var parsed = Y.JSON.parse(received.data);
          var service = parsed.result;
          assert.equal(service.name, 'wordpress');
          // Error should be undefined.
          done(received.error);
        };
        client.send(Y.JSON.stringify(op));
      });
    });

    it('can destroy a service', function(done) {
      generateServices(function(data) {
        // Post deploy of wordpress so we should be able to
        // destroy it.
        var op = {
          op: 'destroy_service',
          service_name: 'wordpress',
          request_id: 99
        };
        client.onmessage = function(received) {
          var parsed = Y.JSON.parse(received.data);
          assert.equal(parsed.result, 'wordpress');
          // Error should be undefined.
          done(received.error);
        };
        client.send(Y.JSON.stringify(op));
      });
    });

    it('can destroy a service (integration)', function(done) {
      function destroyService(rec) {
        function localCb(rec2) {
          assert.equal(rec2.result, 'kumquat');
          var service = state.db.services.getById('kumquat');
          assert.isNull(service);
          done();
        }
        var result = env.destroy_service(rec.service_name, localCb);
      }
      generateAndExposeIntegrationService(destroyService);
    });

    it('can get a charm', function(done) {
      generateServices(function(data) {
        // Post deploy of wordpress we should be able to
        // pull its data.
        var op = {
          op: 'get_charm',
          charm_url: 'cs:precise/wordpress-15',
          request_id: 99
        };
        client.onmessage = function(received) {
          var parsed = Y.JSON.parse(received.data);
          var charm = parsed.result;
          assert.equal(charm.name, 'wordpress');
          // Error should be undefined.
          done(received.error);
        };
        client.send(Y.JSON.stringify(op));
      });
    });

    it('can set service config', function(done) {
      generateServices(function(data) {
        // Post deploy of wordpress we should be able to
        // pull its data.
        var op = {
          op: 'set_config',
          service_name: 'wordpress',
          config: {'blog-title': 'Inimical'},
          request_id: 99
        };
        client.onmessage = function(received) {
          var parsed = Y.JSON.parse(received.data);
          assert.deepEqual(parsed.result, {'blog-title': 'Inimical'});
          var service = state.db.services.getById('wordpress');
          assert.equal(service.get('config')['blog-title'], 'Inimical');
          // Error should be undefined.
          done(parsed.error);
        };
        client.send(Y.JSON.stringify(op));
      });
    });

    it('can set service constraints', function(done) {
      generateServices(function(data) {
        // Post deploy of wordpress we should be able to
        // pull its data.
        var op = {
          op: 'set_constraints',
          service_name: 'wordpress',
          constraints: ['cpu=2', 'mem=128'],
          request_id: 99
        };
        client.onmessage = function(received) {
          var service = state.db.services.getById('wordpress');
          var constraints = service.get('constraints');
          assert.equal(constraints.cpu, '2');
          assert.equal(constraints.mem, '128');
          // Error should be undefined.
          done(received.error);
        };
        client.send(Y.JSON.stringify(op));
      });
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
          state.deploy('cs:precise/wordpress-15', function(data) {
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
                   '"foobar" is an invalid service name.');
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
          state.deploy('cs:precise/wordpress-15', function(data) {
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
              assert.equal(data.err, '"foobar" is an invalid service name.');
              done();
            };
            client.send(Y.JSON.stringify(command));
          }
          generateAndExposeService(unexposeService);
        }
    );

    it('can add a relation', function(done) {
      function localCb() {
        state.deploy('cs:precise/mysql-26', function(service) {
          var data = {
            op: 'add_relation',
            endpoint_a: 'wordpress:db',
            endpoint_b: 'mysql:db'
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
                    endpoints: [
                      {wordpress: {name: 'db'}},
                      {mysql: {name: 'db'}}
                    ]
                  }
                };

            assert.equal(data.err, undefined);
            assert.equal(typeof data.result, 'object');
            assert.deepEqual(data, mock);
            done();
          };
          client.send(Y.JSON.stringify(data));
        });
      }
      generateServices(localCb);
    });

    it('can add a relation (integration)', function(done) {
      function addRelation() {
        function localCb(rec) {
          var mock = {
            endpoint_a: 'kumquat:db',
            endpoint_b: 'mysql:db',
            op: 'add_relation',
            request_id: rec.request_id,
            result: {
              id: 'relation-0',
              'interface': 'mysql',
              scope: 'global',
              request_id: rec.request_id,
              endpoints: [
                {kumquat: {name: 'db'}},
                {mysql: {name: 'db'}}
              ]
            }
          };

          assert.equal(rec.err, undefined);
          assert.equal(typeof rec.result, 'object');
          assert.deepEqual(rec.details[0], mock);
          done();
        }
        var endpointA = [
          'kumquat',
          { name: 'db',
            role: 'client' }
        ];
        var endpointB = [
          'mysql',
          { name: 'db',
            role: 'server' }
        ];
        env.add_relation(endpointA, endpointB, localCb);
      }
      generateIntegrationServices(function() {
        env.deploy(
            'cs:precise/mysql-26',
            undefined,
            undefined,
            undefined,
            1,
            null,
            addRelation);
      });
    });

    it('is able to add a relation with a subordinate service', function(done) {
      function localCb() {
        state.deploy('cs:precise/puppet-5', function(service) {
          var data = {
            op: 'add_relation',
            endpoint_a: 'wordpress:juju-info',
            endpoint_b: 'puppet:juju-info'
          };

          client.onmessage = function(rec) {
            var data = Y.JSON.parse(rec.data),
                mock = {
                  endpoint_a: 'wordpress:juju-info',
                  endpoint_b: 'puppet:juju-info',
                  op: 'add_relation',
                  result: {
                    id: 'relation-0',
                    'interface': 'juju-info',
                    scope: 'container',
                    endpoints: [
                      {puppet: {name: 'juju-info'}},
                      {wordpress: {name: 'juju-info'}}
                    ]
                  }
                };
            assert.equal(data.err, undefined);
            assert.equal(typeof data.result, 'object');
            assert.deepEqual(data, mock);
            done();
          };
          client.send(Y.JSON.stringify(data));
        });
      }
      generateServices(localCb);
    });

    it('throws an error if only one endpoint is supplied', function(done) {
      function localCb() {
        var data = {
          op: 'add_relation',
          endpoint_a: 'wordpress:db'
        };
        state.nextChanges();
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data);
          assert(data.err, 'Two endpoints required to set up relation.');
          done();
        };
        client.send(Y.JSON.stringify(data));
      }
      generateServices(localCb);
    });

    it('throws an error if endpoints are not relatable', function(done) {
      function localCb() {
        var data = {
          op: 'add_relation',
          endpoint_a: 'wordpress:db',
          endpoint_b: 'mysql:foo'
        };
        state.nextChanges();
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data);
          assert(data.err, 'No matching interfaces.');
          done();
        };
        client.send(Y.JSON.stringify(data));
      }
      generateServices(localCb);
    });

    it('can remove a relation', function(done) {
      generateAndRelateServices(
          ['cs:precise/wordpress-15', 'cs:precise/mysql-26'],
          ['wordpress:db', 'mysql:db'],
          ['wordpress:db', 'mysql:db'],
          {result: true, endpoint_a: 'wordpress:db', endpoint_b: 'mysql:db'},
          done);
    });

    it('can remove a relation (integration)', function(done) {
      var endpoints = [
        ['kumquat',
          { name: 'db',
            role: 'client' }],
        ['mysql',
          { name: 'db',
            role: 'server' }]
      ];
      env.after('defaultSeriesChange', function() {
        function localCb(result) {
          var mock = {
            endpoint_a: 'kumquat:db',
            endpoint_b: 'mysql:db',
            op: 'remove_relation',
            request_id: 4,
            result: true
          };
          assert.deepEqual(result.details[0], mock);
          done();
        }
        env.deploy(
            'cs:precise/wordpress-15', 'kumquat',
            {llama: 'pajama'}, null, 1, null, function() {
              env.deploy('cs:precise/mysql-26', null, null, null, 1, null,
                  function() {
                    env.add_relation(endpoints[0], endpoints[1], function() {
                      env.remove_relation(endpoints[0], endpoints[1], localCb);
                    });
                  });
            }
        );
      });
      env.connect();
    });

    it('throws an error if the charms do not exist', function(done) {
      generateAndRelateServices(
          ['cs:precise/wordpress-15', 'cs:precise/mysql-26'],
          ['wordpress:db', 'mysql:db'],
          ['no_such', 'charms'],
          {err: 'Charm not loaded.',
            endpoint_a: 'wordpress:db', endpoint_b: 'mysql:db'},
          done);
    });

    it('throws an error if the relationship does not exist', function(done) {
      generateAndRelateServices(
          ['cs:precise/wordpress-15', 'cs:precise/mysql-26'],
          null,
          ['wordpress:db', 'mysql:db'],
          {err: 'Relationship does not exist',
            endpoint_a: 'wordpress:db', endpoint_b: 'mysql:db'},
          done);
    });

    describe('Sandbox Annotations', function() {

      it('should handle service annotation updates', function(done) {
        generateServices(function(data) {
          // Post deploy of wordpress we should be able to
          // pull its data.
          var op = {
            op: 'update_annotations',
            entity: 'wordpress',
            data: {'foo': 'bar'},
            request_id: 99
          };
          client.onmessage = function(received) {
            var service = state.db.services.getById('wordpress');
            var annotations = service.get('annotations');
            assert.equal(annotations.foo, 'bar');
            // Validate that annotations appear in the delta stream.
            client.onmessage = function(delta) {
              delta = Y.JSON.parse(delta.data);
              assert.equal(delta.op, 'delta');
              var serviceChange = Y.Array.find(delta.result, function(change) {
                return change[0] === 'service';
              });
              assert.equal(serviceChange[0], 'service');
              assert.equal(serviceChange[1], 'change');
              assert.deepEqual(serviceChange[2].annotations, {'foo': 'bar'});
              // Error should be undefined.
              done(received.error);
            };
            juju.sendDelta();
          };
          client.open();
          client.send(Y.JSON.stringify(op));
        });
      });

      it('should handle environment annotation updates', function(done) {
        generateServices(function(data) {
          // We only deploy a service here to reuse the env connect/setup
          // code.
          // Post deploy of wordpress we should be able to
          // pull env data.
          client.onmessage = function(received) {
            var env = state.db.environment;
            var annotations = env.get('annotations');
            assert.equal(annotations.foo, 'bar');
            // Validate that annotations appear in the delta stream.
            client.onmessage = function(delta) {
              delta = Y.JSON.parse(delta.data);
              assert.equal(delta.op, 'delta');
              var envChange = Y.Array.find(delta.result, function(change) {
                return change[0] === 'annotations';
              });
              assert.equal(envChange[1], 'change');
              assert.deepEqual(envChange[2], {'foo': 'bar'});
              done();
            };
            juju.sendDelta();
          };
          client.open();
          client.send(Y.JSON.stringify({
            op: 'update_annotations',
            entity: 'env',
            data: {'foo': 'bar'},
            request_id: 99
          }));
        });
      });

      it('should handle unit annotation updates', function(done) {
        generateServices(function(data) {
          // Post deploy of wordpress we should be able to
          // pull its data.
          var op = {
            op: 'update_annotations',
            entity: 'wordpress/0',
            data: {'foo': 'bar'},
            request_id: 99
          };
          client.onmessage = function(received) {
            var unit = state.db.units.getById('wordpress/0');
            var annotations = unit.annotations;
            assert.equal(annotations.foo, 'bar');
            // Error should be undefined.
            done(received.error);
          };
          client.open();
          client.send(Y.JSON.stringify(op));
        });
      });

    });

    it('should allow unit resolved to be called', function(done) {
      generateServices(function(data) {
        // Post deploy of wordpress we should be able to
        // pull its data.
        var op = {
          op: 'resolved',
          unit_name: 'wordpress/0',
          request_id: 99
        };
        client.onmessage = function(received) {
          var parsed = Y.JSON.parse(received.data);
          assert.equal(parsed.result, true);
          done(parsed.error);
        };
        client.open();
        client.send(Y.JSON.stringify(op));
      });
    });

    /**
     * Utility method to turn _some_ callback
     * styled async methods into Promises.
     * It does this by supplying a simple
     * adaptor that can handle {error:...}
     * and {result: ... } returns.
     *
     * This callback is appended to any calling arguments
     *
     * @method promise
     * @param {Object} context Calling context.
     * @param {String} methodName name of method on context to invoke.
     * @param {Arguments} arguments Additional arguments passed
     *        to resolved method.
     * @return {Promise} a Y.Promise object.
     */
    function promise(context, methodName) {
      var slice = Array.prototype.slice;
      var args = slice.call(arguments, 2);
      var method = context[methodName];

      return Y.Promise(function(resolve, reject) {
        var resultHandler = function(result) {
          if (result.err || result.error) {
            reject(result.err || result.error);
          } else {
            resolve(result);
          }
        };

        args.push(resultHandler);
        var result = method.apply(context, args);
        if (result !== undefined) {
          // The method returned right away.
          return resultHandler(result);
        }
      });
    }

    it('should support export', function(done) {
      client.open();
      promise(state, 'deploy', 'cs:precise/wordpress-15')
       .then(promise(state, 'deploy', 'cs:precise/mysql-26'))
       .then(promise(state, 'addRelation', 'wordpress:db', 'mysql:db'))
       .then(function() {
            client.onmessage = function(result) {
              var data = Y.JSON.parse(result.data).result;
              assert.equal(data.services[0].name, 'wordpress');
              done();
            };
            client.send(Y.JSON.stringify({op: 'exportEnvironment'}));
          });
    });

    it('should support import', function(done) {
      var fixture = utils.loadFixture('data/sample-fakebackend.json', false);

      client.onmessage = function() {
        client.onmessage = function(result) {
          var data = Y.JSON.parse(result.data).result;
          assert.isTrue(data);

          // Verify that we can now find an expected entry
          // in the database.
          assert.isNotNull(state.db.services.getById('wordpress'));

          var changes = state.nextChanges();
          // Validate the delta includes imported services.
          assert.include(Y.Object.keys(changes.services), 'wordpress');
          assert.include(Y.Object.keys(changes.services), 'mysql');
          // validate relation was added/updated.
          assert.include(Y.Object.keys(changes.relations), 'relation-0');
          done();
        };
        client.send(Y.JSON.stringify({op: 'importEnvironment',
                             envData: fixture}));
      };
      client.open();
    });

  });

})();
