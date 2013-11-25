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

  describe('sandbox.GoJujuAPI', function() {
    var requires = [
      'jsyaml',
      'juju-env-sandbox', 'juju-tests-utils', 'juju-env-go',
      'juju-models', 'promise'];
    var Y, sandboxModule, ClientConnection, environmentsModule, state, juju,
        client, env, utils;

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
      juju = new sandboxModule.GoJujuAPI({state: state});
      client = new sandboxModule.ClientConnection({juju: juju});
      env = new environmentsModule.GoEnvironment({conn: client});
    });

    afterEach(function() {
      // We need to clear any credentials stored in sessionStorage.
      env.setCredentials(null);
      env.destroy();
      client.destroy();
      juju.destroy();
      state.destroy();
    });

    it('opens successfully.', function() {
      assert.isFalse(juju.connected);
      assert.isUndefined(juju.get('client'));
      client.open();
      assert.isTrue(juju.connected);
      assert.strictEqual(juju.get('client'), client);
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

    it('closes successfully.', function() {
      client.open();
      assert.isTrue(juju.connected);
      assert.notEqual(juju.get('client'), undefined);
      client.close();
      assert.isFalse(juju.connected);
      assert.isUndefined(juju.get('client'));
    });

    it('ignores "close" when already closed.', function() {
      // This simply shows that we do not raise an error.
      juju.close();
    });

    it('can dispatch on received information.', function(done) {
      var data = {Type: 'TheType', Request: 'TheRequest'};
      juju.handleTheTypeTheRequest = function(received) {
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
      // See FakeBackend's authorizedUsers for these default authentication
      // values.
      var data = {
        Type: 'Admin',
        Request: 'Login',
        Params: {
          AuthTag: 'admin',
          Password: 'password'
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        // Add in the error indicator so the deepEqual is comparing apples to
        // apples.
        data.Error = false;
        assert.deepEqual(Y.JSON.parse(received.data), data);
        assert.isTrue(state.get('authenticated'));
        done();
      };
      state.logout();
      assert.isFalse(state.get('authenticated'));
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can log in (environment integration).', function(done) {
      state.logout();
      env.after('login', function() {
        assert.isTrue(env.userIsAuthenticated);
        done();
      });
      env.connect();
      env.setCredentials({user: 'admin', password: 'password'});
      env.login();
    });

    it('can log in with a token.', function(done) {
      // See FakeBackend's initialization for these default authentication
      // values.
      var data = {
        Type: 'GUIToken',
        Request: 'Login',
        Params: {
          Token: 'demoToken'
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var expected = {
          RequestId: 42, Response: {AuthTag: 'admin', Password: 'password'}};
        assert.deepEqual(Y.JSON.parse(received.data), expected);
        assert.isTrue(state.get('authenticated'));
        done();
      };
      state.logout();
      assert.isFalse(state.get('authenticated'));
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('does not log in with a bad token.', function(done) {
      // See FakeBackend's initialization for these default authentication
      // values.
      var data = {
        Type: 'GUIToken',
        Request: 'Login',
        Params: {
          Token: 'badToken'
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var expected = {
          RequestId: 42,
          Error: 'unknown, fulfilled, or expired token',
          ErrorCode: 'unauthorized access',
          Response: {}};
        assert.deepEqual(Y.JSON.parse(received.data), expected);
        assert.isFalse(state.get('authenticated'));
        done();
      };
      state.logout();
      assert.isFalse(state.get('authenticated'));
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can log in with a token (environment integration).', function(done) {
      state.logout();
      env.after('login', function() {
        assert.isTrue(env.userIsAuthenticated);
        assert.deepEqual(env.getCredentials(),
                         {user: 'admin', password: 'password'});
        done();
      });
      env.connect();
      assert.isFalse(env.getCredentials().areAvailable);
      env.tokenLogin('demoToken');
    });

    it('can start the AllWatcher', function(done) {
      var data = {
        Type: 'Client',
        Request: 'WatchAll',
        Params: {},
        RequestId: 1066
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.equal(receivedData.Response.AllWatcherId, 42);
        assert.equal(receivedData.RequestId, 1066);
        assert.isUndefined(client.get('juju').get('nextRequestId'));
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can listen for deltas with Next', function(done) {
      client.get('juju').set('deltaInterval', 50);
      var data = {
        Type: 'AllWatcher',
        Request: 'Next',
        Params: {},
        RequestId: 1067
      };
      state.deploy('cs:precise/wordpress-15', function() {});
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.equal(receivedData.RequestId, 1067);
        assert.isNotNull(receivedData.Response.Deltas);
        var deltas = receivedData.Response.Deltas;
        assert.equal(deltas.length, 3);
        assert.deepEqual(deltas.map(function(delta) {
          return delta[0];
        }), ['service', 'machine', 'unit']);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('structures deltas properly', function(done) {
      client.get('juju').set('deltaInterval', 50);
      var data = {
        Type: 'AllWatcher',
        Request: 'Next',
        Params: {},
        RequestId: 1067
      };
      state.deploy('cs:precise/wordpress-15', function() {});
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        var deltas = receivedData.Response.Deltas;
        assert.deepEqual(deltas, [
          ['service', 'change', {
            'Name': 'wordpress',
            'Exposed': false,
            'CharmURL': 'cs:precise/wordpress-15',
            'Life': 'alive',
            'Config': {
              debug: 'no',
              engine: 'nginx',
              tuning: 'single',
              'wp-content': ''
            },
            'Constraints': {}
          }],
          ['machine', 'change', {'Status': 'running'}],
          ['unit', 'change', {
            'Name': 'wordpress/0',
            'Service': 'wordpress',
            'Series': 'precise',
            'CharmURL': 'cs:precise/wordpress-15',
            'MachineId': '1',
            'Status': 'started'
          }]
        ]);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can deploy.', function(done) {
      // We begin logged in.  See utils.makeFakeBackend.
      var data = {
        Type: 'Client',
        Request: 'ServiceDeploy',
        Params: {
          CharmUrl: 'cs:precise/wordpress-15',
          ServiceName: 'kumquat',
          ConfigYAML: 'engine: apache',
          NumUnits: 2
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.equal(receivedData.RequestId, data.RequestId);
        assert.isUndefined(receivedData.Error);
        assert.isObject(
            state.db.charms.getById('cs:precise/wordpress-15'));
        var service = state.db.services.getById('kumquat');
        assert.isObject(service);
        assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
        assert.deepEqual(service.get('config'), {
          debug: 'no',
          engine: 'apache',
          tuning: 'single',
          'wp-content': ''
        });
        var units = service.get('units').toArray();
        assert.lengthOf(units, 2);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can deploy (environment integration).', function(done) {
      env.connect();
      // We begin logged in.  See utils.makeFakeBackend.
      var callback = function(result) {
        assert.isUndefined(result.err);
        assert.equal(result.charm_url, 'cs:precise/mediawiki-8');
        var service = state.db.services.getById('kumquat');
        assert.equal(service.get('charm'), 'cs:precise/mediawiki-8');
        assert.deepEqual(
            service.get('config'), {
              admins: undefined,
              debug: false,
              logo: 'test logo',
              name: 'Please set name of wiki',
              skin: 'vector'
            }
        );
        done();
      };
      env.deploy(
          'cs:precise/mediawiki-8',
          'kumquat',
          {logo: 'test logo'},
          null,
          1,
          {},
          callback);
    });

    it('can deploy with constraints', function(done) {
      var constraints = {
        'cpu-cores': 1,
        'cpu-power': 0,
        'mem': '512M',
        'arch': 'i386'
      };

      env.connect();
      // We begin logged in.  See utils.makeFakeBackend.
      var callback = function(result) {
        var service = state.db.services.getById('kumquat');
        assert.deepEqual(service.get('constraints'), constraints);
        done();
      };
      env.deploy(
          'cs:precise/wordpress-15',
          'kumquat',
          {llama: 'pajama'},
          null,
          1,
          constraints,
          callback);
    });

    it('can communicate errors after attempting to deploy', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {});
      var callback = function(result) {
        assert.equal(
            result.err, 'A service with this name already exists (wordpress).');
        done();
      };
      env.deploy('cs:precise/wordpress-15', undefined, undefined, undefined,
                 1, null, callback);
    });

    it('can destroy a service', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {
        var data = {
          Type: 'Client',
          Request: 'ServiceDestroy',
          Params: {
            ServiceName: 'wordpress'
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.equal(receivedData.RequestId, data.RequestId);
          assert.isUndefined(receivedData.Error);
          assert.equal(state.db.services.size(), 0);
          assert.isNull(state.db.services.getById('wordpress'));
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can destroy a service (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          assert.equal(state.db.services.size(), 0);
          assert.isNull(state.db.services.getById('wordpress'));
          done();
        };
        env.destroy_service('wordpress', callback);
      });
    });

    it('can remove a unit', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {
        var data = {
          Type: 'Client',
          Request: 'DestroyServiceUnits',
          Params: {
            UnitNames: 'wordpress/0'
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.equal(receivedData.RequestId, data.RequestId);
          // fakebackend defaults error and warning to [] which carries
          // through.
          assert.deepEqual(receivedData.Error, []);
          assert.equal(state.db.services.item(0).get('units').size(), 0);
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can remove a unit (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {
        var callback = function(result) {
          // fakebackend defaults error and warning to [] which carries
          // through.
          assert.deepEqual(result.err, []);
          assert.equal(state.db.services.item(0).get('units').size(), 0);
          done();
        };
        env.remove_units('wordpress/0', callback);
      });
    });

    it('can get a charm', function(done) {
      var data = {
        Type: 'Client',
        Request: 'CharmInfo',
        Params: {
          CharmURL: 'cs:precise/wordpress-15'
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.isUndefined(receivedData.Error);
        assert.isObject(receivedData.Response);
        assert.equal(receivedData.Response.URL, 'cs:precise/wordpress-15');
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can get a charm (environment integration)', function(done) {
      env.connect();
      var callback = function(result) {
        assert.isUndefined(result.err);
        assert.isObject(result.result);
        assert.equal(result.result.url, 'cs:precise/wordpress-15');
        done();
      };
      env.get_charm('cs:precise/wordpress-15', callback);
    });

    it('can communicate errors in getting a charm', function(done) {
      env.connect();
      var callback = function(result) {
        assert.isUndefined(result.result);
        assert.equal(result.err, 'Error interacting with the charmworld API.');
        done();
      };
      env.get_charm('cs:precise/notarealcharm-15', callback);
    });

    it('can successfully get a service and its config', function(done) {
      env.connect();
      state.deploy('cs:precise/mediawiki-15', function() {});
      var callback = function(result) {
        assert.deepEqual(
            result.result.config, {
              admins: undefined,
              debug: false,
              logo: undefined,
              name: 'Please set name of wiki',
              skin: 'vector'
            }
        );
        // We also make sure that we get some object of data for constraints.
        assert.deepEqual(result.result.constraints, {});
        done();
      };
      env.get_service('mediawiki', callback);
    });

    it('can set constraints', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {
        var data = {
          Type: 'Client',
          Request: 'SetServiceConstraints',
          Params: {
            ServiceName: 'wordpress',
            Constraints: { mem: '2' }
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.isUndefined(receivedData.Error);
          var service = state.db.services.getById('wordpress');
          assert.equal(service.get('constraintsStr'), 'mem=2');
          assert.equal(service.get('constraints').mem, 2);
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can set constraints (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          var service = state.db.services.getById('wordpress');
          assert.equal(service.get('constraintsStr'), 'mem=2');
          assert.equal(service.get('constraints').mem, 2);
          done();
        };
        env.set_constraints('wordpress', {mem: '2'}, callback);
      });
    });

    it('can set config', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {
        var data = {
          Type: 'Client',
          Request: 'ServiceSet',
          Params: {
            ServiceName: 'wordpress',
            Options: { engine: 'apache' }
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.isUndefined(receivedData.Error);
          var service = state.db.services.getById('wordpress');
          assert.deepEqual(service.get('config'), {
            debug: 'no',
            engine: 'apache',
            tuning: 'single',
            'wp-content': ''
          });
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can set config (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          var service = state.db.services.getById('wordpress');
          assert.deepEqual(service.get('config'), {
            debug: 'no',
            engine: 'apache',
            tuning: 'single',
            'wp-content': ''
          });
          done();
        };
        env.set_config('wordpress', {
          engine: 'apache'
        }, undefined, {}, callback);
      });
    });

    it('can set YAML config', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {
        var data = {
          Type: 'Client',
          Request: 'ServiceSetYAML',
          Params: {
            ServiceName: 'wordpress',
            Config: 'wordpress:\n  engine: apache'
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.isUndefined(receivedData.Error);
          var service = state.db.services.getById('wordpress');
          assert.deepEqual(service.get('config'), {
            debug: 'no',
            engine: 'apache',
            tuning: 'single',
            'wp-content': ''
          });
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can set YAML config (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          var service = state.db.services.getById('wordpress');
          assert.deepEqual(service.get('config'), {
            debug: 'no',
            engine: 'apache',
            tuning: 'single',
            'wp-content': ''
          });
          done();
        };
        env.set_config('wordpress', undefined,
            'wordpress:\n  engine: apache', {}, callback);
      });
    });

    it('can resolve a unit', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {
        state.db.services.getById('wordpress')
          .get('units').getById('wordpress/0')
          .agent_state = 'error';
        var data = {
          Type: 'Client',
          Request: 'Resolved',
          Params: {
            UnitName: 'wordpress/0'
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          // Running resolved on fakebackend for just a unit does not do
          // anything much, as no hooks were run in starting the unit.
          // Additionally, resolved does not actually clear the unit error,
          // as that would be done by the hooks.  Since no change actually
          // takes place, we simply need to ensure that no error occurred.
          assert.isUndefined(receivedData.Error);
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can resolve a unit (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {
        state.db.services.getById('wordpress')
          .get('units').getById('wordpress/0')
          .agent_state = 'error';
        var callback = function(result) {
          // See note above on resolving in a fakebackend.
          assert.isUndefined(result.err);
          done();
        };
        env.resolved('wordpress/0', undefined, false, callback);
      });
    });

    it('can set a charm.', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {});
      var data = {
        Type: 'Client',
        Request: 'ServiceSetCharm',
        Params: {
          ServiceName: 'wordpress',
          CharmUrl: 'cs:precise/mediawiki-8',
          Force: false
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.isUndefined(receivedData.err);
        var service = state.db.services.getById('wordpress');
        assert.equal(service.get('charm'), 'cs:precise/mediawiki-8');
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can set a charm (environment integration).', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-15', function() {});
      var callback = function(result) {
        assert.isUndefined(result.err);
        var service = state.db.services.getById('wordpress');
        assert.equal(service.get('charm'), 'cs:precise/mediawiki-8');
        done();
      };
      env.setCharm('wordpress', 'cs:precise/mediawiki-8', false, callback);
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
          Type: 'Client',
          Request: 'AddServiceUnits',
          Params: {
            ServiceName: 'wordpress',
            NumUnits: 2
          }
        };
        state.nextChanges();
        client.onmessage = function(received) {
          // After done generating the services
          callback(received);
        };
        client.open();
        client.send(Y.JSON.stringify(data));
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
      var localCb = function(result) {
        env.add_unit('kumquat', 2, function(data) {
          // After finished generating integrated services.
          callback(data);
        });
      };
      env.connect();
      env.deploy(
          'cs:precise/wordpress-15',
          'kumquat',
          {llama: 'pajama'},
          null,
          1,
          null,
          localCb);
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
          Type: 'Client',
          Request: 'ServiceExpose',
          Params: {ServiceName: data.service.get('name')}
        };
        state.nextChanges();
        client.onmessage = function(rec) {
          callback(rec);
        };
        client.open();
        client.send(Y.JSON.stringify(command));
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
      var localCb = function(result) {
        env.expose(result.service_name, function(rec) {
          callback(rec);
        });
      };
      env.connect();
      env.deploy(
          'cs:precise/wordpress-15',
          'kumquat',
          {llama: 'pajama'},
          null,
          1,
          null,
          localCb);
    }

    it('can add additional units', function(done) {
      function testForAddedUnits(received) {
        var service = state.db.services.getById('wordpress'),
            units = service.get('units').toArray(),
            data = Y.JSON.parse(received.data),
            mock = {
              Response: {
                Units: ['wordpress/1', 'wordpress/2']
              }
            };
        // Do we have enough total units?
        assert.lengthOf(units, 3);
        // Does the response object contain the proper data
        assert.deepEqual(data, mock);
        // Error is undefined
        assert.isUndefined(data.Error);
        done();
      }
      // Generate the default services and add units
      generateServices(testForAddedUnits);
    });

    it('throws an error when adding units to an invalid service',
        function(done) {
          state.deploy('cs:precise/wordpress-15', function(service) {
            var data = {
              Type: 'Client',
              Request: 'AddServiceUnits',
              Params: {
                ServiceName: 'noservice',
                NumUnits: 2
              }
            };
            state.nextChanges();
            client.onmessage = function() {
              client.onmessage = function(received) {
                var data = Y.JSON.parse(received.data);

                // If there is no error data.err will be undefined
                assert.equal(true, !!data.Error);
                done();
              };
              client.send(Y.JSON.stringify(data));
            };
            client.open();
            client.onmessage();
          });
        }
    );

    it('can add additional units (integration)', function(done) {
      function testForAddedUnits(data) {
        var service = state.db.services.getById('kumquat'),
            units = service.get('units').toArray();
        assert.lengthOf(units, 3);
        done();
      }
      generateIntegrationServices(testForAddedUnits);
    });

    it('can expose a service', function(done) {
      function checkExposedService(rec) {
        var serviceName = 'wordpress';
        var data = Y.JSON.parse(rec.data),
            mock = {Response: {}};
        var service = state.db.services.getById(serviceName);
        assert.equal(service.get('exposed'), true);
        assert.deepEqual(data, mock);
        done();
      }
      generateAndExposeService(checkExposedService);
    });

    it('can expose a service (integration)', function(done) {
      function checkExposedService(rec) {
        var service = state.db.services.getById('kumquat');
        assert.equal(service.get('exposed'), true);
        // The Go API does not set a result value.  That is OK as
        // it is never used.
        assert.isUndefined(rec.result);
        done();
      }
      generateAndExposeIntegrationService(checkExposedService);
    });

    it('fails silently when exposing an exposed service', function(done) {
      function checkExposedService(rec) {
        var service_name = 'wordpress',
            data = Y.JSON.parse(rec.data),
            service = state.db.services.getById(service_name),
            command = {
              Type: 'Client',
              Request: 'ServiceExpose',
              Params: {ServiceName: service_name}
            };
        state.nextChanges();
        client.onmessage = function(rec) {
          assert.equal(data.err, undefined);
          assert.equal(service.get('exposed'), true);
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
              Type: 'Client',
              Request: 'ServiceExpose',
              Params: {ServiceName: 'foobar'}
            };
            state.nextChanges();
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data);
              assert.equal(data.Error,
                 '"foobar" is an invalid service name.');
              done();
            };
            client.open();
            client.send(Y.JSON.stringify(command));
          }, { unitCount: 1 });
        }
    );

    it('can unexpose a service', function(done) {
      function unexposeService(rec) {
        var service_name = 'wordpress',
            data = Y.JSON.parse(rec.data),
            command = {
              Type: 'Client',
              Request: 'ServiceUnexpose',
              Params: {ServiceName: service_name}
            };
        state.nextChanges();
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data),
              service = state.db.services.getById('wordpress'),
              mock = {Response: {}};
          assert.equal(service.get('exposed'), false);
          assert.deepEqual(data, mock);
          done();
        };
        client.send(Y.JSON.stringify(command));
      }
      generateAndExposeService(unexposeService);
    });

    it('can unexpose a service (integration)', function(done) {
      var service_name = 'kumquat';
      function unexposeService(rec) {
        function localCb(rec) {
          var service = state.db.services.getById(service_name);
          assert.equal(service.get('exposed'), false);
          // No result from Go unexpose.
          assert.isUndefined(rec.result);
          done();
        }
        env.unexpose(service_name, localCb);
      }
      generateAndExposeIntegrationService(unexposeService);
    });

    it('fails silently when unexposing a not exposed service',
        function(done) {
          var service_name = 'wordpress';
          state.deploy('cs:precise/wordpress-15', function(data) {
            var command = {
              Type: 'Client',
              Request: 'ServiceUnexpose',
              Params: {ServiceName: service_name}
            };
            state.nextChanges();
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data),
                  service = state.db.services.getById(service_name);
              assert.equal(service.get('exposed'), false);
              assert.equal(data.err, undefined);
              done();
            };
            client.open();
            client.send(Y.JSON.stringify(command));
          }, { unitCount: 1 });
        }
    );

    it('fails with error when unexposing an invalid service name',
        function(done) {
          function unexposeService(rec) {
            var command = {
              Type: 'Client',
              Request: 'ServiceUnexpose',
              Params: {ServiceName: 'foobar'}
            };
            state.nextChanges();
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data);
              assert.equal(data.Error, '"foobar" is an invalid service name.');
              done();
            };
            client.send(Y.JSON.stringify(command));
          }
          generateAndExposeService(unexposeService);
        }
    );

    it('can add a relation', function(done) {
      // We begin logged in.  See utils.makeFakeBackend.
      state.deploy('cs:precise/wordpress-15', function() {
        state.deploy('cs:precise/mysql-26', function() {
          var data = {
            RequestId: 42,
            Type: 'Client',
            Request: 'AddRelation',
            Params: {
              Endpoints: ['wordpress:db', 'mysql:db']
            }
          };
          client.onmessage = function(received) {
            var recData = Y.JSON.parse(received.data);
            assert.equal(recData.RequestId, data.RequestId);
            assert.equal(recData.Error, undefined);
            assert.isObject(
                state.db.relations.getById('wordpress:db mysql:db'));
            var recEndpoints = recData.Response.Endpoints;
            assert.equal(recEndpoints.wordpress.Name, 'db');
            assert.equal(recEndpoints.wordpress.Scope, 'global');
            assert.equal(recEndpoints.mysql.Name, 'db');
            assert.equal(recEndpoints.mysql.Scope, 'global');
            done();
          };
          client.open();
          client.send(Y.JSON.stringify(data));
        });
      });
    });

    it('can add a relation (integration)', function(done) {
      env.connect();
      env.deploy(
          'cs:precise/wordpress-15', null, null, null, 1, null, function() {
            env.deploy(
                'cs:precise/mysql-26', null, null, null, 1, null, function() {
                  var endpointA = ['wordpress', {name: 'db', role: 'client'}],
                      endpointB = ['mysql', {name: 'db', role: 'server'}];
                  env.add_relation(endpointA, endpointB, function(recData) {
                    assert.equal(recData.err, undefined);
                    assert.equal(recData.endpoint_a, 'wordpress:db');
                    assert.equal(recData.endpoint_b, 'mysql:db');
                    assert.isObject(recData.result);
                    assert.isObject(
                       state.db.relations.getById('wordpress:db mysql:db'));
                    done();
                  });
                }
            );
          }
      );
    });

    it('is able to add a relation with a subordinate service', function(done) {
      state.deploy('cs:precise/wordpress-15', function() {
        state.deploy('cs:precise/puppet-5', function(service) {
          var data = {
            RequestId: 42,
            Type: 'Client',
            Request: 'AddRelation',
            Params: {
              Endpoints: ['wordpress:juju-info', 'puppet:juju-info']
            }
          };
          client.onmessage = function(received) {
            var recData = Y.JSON.parse(received.data);
            assert.equal(recData.RequestId, data.RequestId);
            assert.equal(recData.Error, undefined);
            var recEndpoints = recData.Response.Endpoints;
            assert.equal(recEndpoints.wordpress.Name, 'juju-info');
            assert.equal(recEndpoints.wordpress.Scope, 'container');
            assert.equal(recEndpoints.puppet.Name, 'juju-info');
            assert.equal(recEndpoints.puppet.Scope, 'container');
            done();
          };
          client.open();
          client.send(Y.JSON.stringify(data));
        });
      });
    });

    it('throws an error if only one endpoint is supplied', function(done) {
      // We begin logged in.  See utils.makeFakeBackend.
      state.deploy('cs:precise/wordpress-15', function() {
        var data = {
          RequestId: 42,
          Type: 'Client',
          Request: 'AddRelation',
          Params: {
            Endpoints: ['wordpress:db']
          }
        };
        client.onmessage = function(received) {
          var recData = Y.JSON.parse(received.data);
          assert.equal(recData.RequestId, data.RequestId);
          assert.equal(recData.Error,
              'Two string endpoint names required to establish a relation');
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('throws an error if endpoints are not relatable', function(done) {
      // We begin logged in.  See utils.makeFakeBackend.
      state.deploy('cs:precise/wordpress-15', function() {
        var data = {
          RequestId: 42,
          Type: 'Client',
          Request: 'AddRelation',
          Params: {
            Endpoints: ['wordpress:db', 'mysql:foo']
          }
        };
        client.onmessage = function(received) {
          var recData = Y.JSON.parse(received.data);
          assert.equal(recData.RequestId, data.RequestId);
          assert.equal(recData.Error, 'Charm not loaded.');
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can remove a relation', function(done) {
      // We begin logged in.  See utils.makeFakeBackend.
      var relation = ['wordpress:db', 'mysql:db'];
      state.deploy('cs:precise/wordpress-15', function() {
        state.deploy('cs:precise/mysql-26', function() {
          state.addRelation(relation[0], relation[1]);
          var data = {
            RequestId: 42,
            Type: 'Client',
            Request: 'DestroyRelation',
            Params: {
              Endpoints: relation
            }
          };
          client.onmessage = function(received) {
            var recData = Y.JSON.parse(received.data);
            assert.equal(recData.RequestId, data.RequestId);
            assert.equal(recData.Error, undefined);
            done();
          };
          client.open();
          client.send(Y.JSON.stringify(data));
        });
      });
    });

    it('can remove a relation(integration)', function(done) {
      env.connect();
      env.deploy(
          'cs:precise/wordpress-15', null, null, null, 1, null, function() {
            env.deploy(
                'cs:precise/mysql-26', null, null, null, 1, null, function() {
                  var endpointA = ['wordpress', {name: 'db', role: 'client'}],
                      endpointB = ['mysql', {name: 'db', role: 'server'}];
                  env.add_relation(endpointA, endpointB, function() {
                    env.remove_relation(
                        endpointA, endpointB, function(recData) {
                          assert.equal(recData.err, undefined);
                          assert.equal(recData.endpoint_a, 'wordpress:db');
                          assert.equal(recData.endpoint_b, 'mysql:db');
                          done();
                        }
                    );
                  });
                }
            );
          }
      );
    });

    it('should support deployer import', function(done) {
      var fixture = utils.loadFixture('data/wp-deployer.yaml');
      var data = {
        Type: 'Deployer',
        Request: 'Import',
        Params: {
          YAML: fixture
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.isUndefined(receivedData.err);
        var service = state.db.services.getById('wordpress');
        assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can import deployer files (integration).', function(done) {
      var fixture = utils.loadFixture('data/wp-deployer.yaml');
      var callback = function(result) {
        assert.isUndefined(result.err);
        var service = state.db.services.getById('wordpress');
        assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
        done();
      };

      env.connect();
      env.deployerImport(fixture, null, callback);
    });

    it('should support deployer status with imports', function(done) {
      var fixture = utils.loadFixture('data/wp-deployer.yaml');
      var callback = function(ignored) {
        var data = {
          Type: 'Deployer',
          Request: 'Status',
          Params: {},
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.equal(receivedData.RequestId, 42);
          var lastChanges = receivedData.Response.LastChanges;
          assert.equal(lastChanges.length, 1);
          assert.equal(lastChanges[0].Status, 'completed');
          assert.isNumber(lastChanges[0].Timestamp);
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      };
      env.connect();
      env.deployerImport(fixture, null, callback);
    });

    it('should support deployer status without imports', function(done) {
      var data = {
        Type: 'Deployer',
        Request: 'Status',
        Params: {},
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.equal(receivedData.RequestId, 42);
        var lastChanges = receivedData.Response.LastChanges;
        assert.equal(lastChanges.length, 0);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('should not deal with deployer watches', function(done) {
      var data = {
        Type: 'Deployer',
        Request: 'Watch',
        Params: {
          DeploymentId: 10
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        assert.fail('Should never get a response.');
      };
      client.open();
      client.send(Y.JSON.stringify(data));

      done();
    });

    it('should not deal with watch updates', function(done) {
      var data = {
        Type: 'Deployer',
        Request: 'Next',
        Params: {
          WatcherId: 11
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        assert.fail('Should never get a response.');
      };
      client.open();
      client.send(Y.JSON.stringify(data));

      done();
    });

  });

})();
