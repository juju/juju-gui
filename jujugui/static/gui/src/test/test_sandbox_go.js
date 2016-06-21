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
      'jsyaml', 'juju-env-sandbox', 'juju-tests-utils',
      'environment-change-set', 'juju-tests-factory', 'juju-env-api',
      'juju-models', 'promise'
    ];
    var client, env, ecs, environmentsModule, factory, juju,
        sandboxModule, state, utils, Y, ns;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        sandboxModule = Y.namespace('juju.environments.sandbox');
        environmentsModule = Y.namespace('juju.environments');
        utils = Y.namespace('juju-tests.utils');
        factory = Y.namespace('juju-tests.factory');
        ns = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      state = factory.makeFakeBackend();
      juju = new sandboxModule.GoJujuAPI({
        state: state,
        socket_url: 'socket url'
      });
      client = new sandboxModule.ClientConnection({juju: juju});
      ecs = new ns.EnvironmentChangeSet({db: state.db});
      env = new environmentsModule.GoEnvironment({conn: client, ecs: ecs});
      var facades = sandboxModule.Facades.reduce(function(collected, facade) {
        collected[facade.Name] = facade.Versions;
        return collected;
      }, {});
      env.set('facades', facades);
    });

    afterEach(function() {
      // We need to clear any credentials stored in sessionStorage.
      if (env.get('connected')) {
        env.close();
      }
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
          AuthTag: 'user-admin',
          Password: 'password'
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        // Add in the error indicator so the deepEqual is comparing apples to
        // apples.
        data.Error = false;
        data.Response = {facades: sandboxModule.Facades};
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
          RequestId: 42, Response: {
            AuthTag: 'user-admin',
            Password: 'password',
            facades: sandboxModule.Facades
          }
        };
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
        assert.deepEqual(env.getCredentials(), {
          user: 'user-admin', password: 'password', macaroons: null});
        done();
      });
      env.connect();
      assert.isFalse(env.getCredentials().areAvailable);
      env.tokenLogin('demoToken');
    });

    it('can return model information.', function(done) {
      // See FakeBackend's initialization for these default values.
      var data = {
        Type: 'Client',
        Request: 'ModelInfo',
        RequestId: 42
      };
      client.onmessage = function(received) {
        var expected = {
          RequestId: 42,
          Response: {
            ProviderType: state.get('providerType'),
            DefaultSeries: state.get('defaultSeries'),
            Name: 'sandbox'}};
        assert.deepEqual(Y.JSON.parse(received.data), expected);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('returns ModelGet responses', function(done) {
      var data = {
        RequestId: 42,
        Type: 'Client',
        Request: 'ModelGet'
      };
      client.onmessage = function(received) {
        var expected = {
          RequestId: 42,
          Response: {
            Config: {'maas-server': state.get('maasServer')}
          }
        };
        assert.deepEqual(Y.JSON.parse(received.data), expected);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
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
      state.deploy('cs:precise/wordpress-27', function() {});
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.equal(receivedData.RequestId, 1067);
        assert.isNotNull(receivedData.Response.Deltas);
        var deltas = receivedData.Response.Deltas;
        assert.equal(deltas.length, 3);
        assert.deepEqual(deltas.map(function(delta) {
          return delta[0];
        }), ['application', 'machine', 'unit']);
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
      state.deploy('cs:precise/wordpress-27', function() {});
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        var deltas = receivedData.Response.Deltas;
        assert.equal(deltas.length, 3);
        var applicationChange = deltas[0];
        var machineChange = deltas[1];
        var unitChange = deltas[2];
        assert.deepEqual(applicationChange, [
          'application', 'change', {
            'Name': 'wordpress',
            'Exposed': false,
            'CharmURL': 'cs:precise/wordpress-27',
            'Life': 'alive',
            'Config': {
              debug: 'no',
              engine: 'nginx',
              tuning: 'single',
              'wp-content': ''
            },
            'Constraints': {},
            'Subordinate': false
          }], 'applicationChange'
        );
        assert.deepEqual(machineChange, [
          'machine', 'change', {
            Id: '0',
            Addresses: [],
            InstanceId: 'fake-instance',
            Status: 'started',
            Jobs: ['JobHostUnits'],
            Life: 'alive',
            Series: 'precise',
            HardwareCharacteristics: {
              Arch: 'amd64',
              CpuCores: 1,
              CpuPower: 100,
              Mem: 1740,
              RootDisk: 8192
            },
            SupportedContainers: ['lxc', 'kvm'],
            SupportedContainersKnown: true
          }], 'machineChange'
        );
        assert.deepEqual(unitChange, [
          'unit', 'change', {
            'Name': 'wordpress/0',
            'Application': 'wordpress',
            'Series': 'precise',
            'CharmURL': 'cs:precise/wordpress-27',
            'MachineId': '0',
            'Status': 'started',
            'Subordinate': false
          }], 'unitChange'
        );
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can deploy', function(done) {
      // We begin logged in.  See utils.makeFakeBackend.
      var data = {
        Type: 'Application',
        Request: 'Deploy',
        Version: 2,
        Params: {Applications: [{
          CharmUrl: 'cs:precise/wordpress-27',
          ApplicationName: 'kumquat',
          ConfigYAML: 'engine: apache',
          NumUnits: 2
        }]},
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.equal(receivedData.RequestId, data.RequestId);
        assert.isUndefined(receivedData.Error);
        assert.isObject(
            state.db.charms.getById('cs:precise/wordpress-27'));
        var application = state.db.services.getById('kumquat');
        assert.isObject(application);
        assert.equal(application.get('charm'), 'cs:precise/wordpress-27');
        assert.deepEqual(application.get('config'), {
          debug: 'no',
          engine: 'apache',
          tuning: 'single',
          'wp-content': ''
        });
        var units = application.get('units').toArray();
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
        assert.equal(result.charmUrl, 'cs:precise/mediawiki-18');
        var application = state.db.services.getById('kumquat');
        assert.equal(application.get('charm'), 'cs:precise/mediawiki-18');
        assert.deepEqual(
            application.get('config'), {
              admins: '',
              debug: false,
              logo: 'test logo',
              name: 'Please set name of wiki',
              server_address: '',
              use_suffix: true,
              skin: 'vector'
            }
        );
        done();
      };
      env.deploy(
          'cs:precise/mediawiki-18',
          'kumquat',
          {logo: 'test logo'},
          null,
          1,
          {},
          null,
          callback,
          {immediate: true});
    });

    it('can deploy with constraints', function(done) {
      var constraints = {
        'cpu-cores': 1,
        'cpu-power': 0,
        mem: '512M',
        arch: 'i386'
      };

      env.connect();
      // We begin logged in.  See utils.makeFakeBackend.
      var callback = function(result) {
        var application = state.db.services.getById('kumquat');
        assert.deepEqual(application.get('constraints'), {
          'cpu-cores': 1,
          'cpu-power': 0,
          mem: 512,
          arch: 'i386'
        });
        done();
      };
      env.deploy(
          'cs:precise/wordpress-27',
          'kumquat',
          {llama: 'pajama'},
          null,
          1,
          constraints,
          null,
          callback,
          {immediate: true});
    });

    it('can communicate errors after attempting to deploy', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-27', function() {});
      var callback = function(result) {
        assert.equal(
            result.err,
            'An application with this name already exists (wordpress).');
        done();
      };
      env.deploy('cs:precise/wordpress-27', undefined, undefined, undefined,
          1, null, null, callback, {immediate: true});
    });

    it('can add machines', function(done) {
      state.db.machines.add({id: '0'});
      var request = {
        Type: 'Client',
        Request: 'AddMachines',
        Params: {
          MachineParams: [
            {}, {ParentId: '0', ContainerType: 'lxc'}, {ContainerType: 'kvm'}
          ]
        },
        RequestId: 42
      };
      client.onmessage = function(response) {
        var data = Y.JSON.parse(response.data);
        assert.isUndefined(data.Error);
        assert.strictEqual(data.RequestId, 42);
        var expectedMachines = [
          {Machine: '1', Error: null},
          {Machine: '0/lxc/0', Error: null},
          {Machine: '2/kvm/0', Error: null}
        ];
        assert.deepEqual(data.Response.Machines, expectedMachines);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(request));
    });

    it('can add machines (environment integration)', function(done) {
      state.db.machines.add([{id: '1'}, {id: '1/kvm/2'}]);
      var callback = function(response) {
        assert.isUndefined(response.err);
        var expectedMachines = [
          {name: '2', err: null},
          {name: '1/kvm/2/lxc/0', err: null}
        ];
        assert.deepEqual(response.machines, expectedMachines);
        done();
      };
      env.connect();
      env.addMachines(
          [{}, {parentId: '1/kvm/2', containerType: 'lxc'}],
          callback, {immediate: true});
    });

    it('can report errors occurred while adding machines', function(done) {
      var callback = function(response) {
        assert.isUndefined(response.err);
        var expectedMachines = [
          {name: '', err: 'parent machine specified without container type'},
          {name: '', err: 'cannot add a new machine: machine 42 not found'}
        ];
        assert.deepEqual(response.machines, expectedMachines);
        done();
      };
      env.connect();
      env.addMachines(
          [{parentId: '47'}, {parentId: '42', containerType: 'lxc'}],
          callback, {immediate: true});
    });

    it('can destroy machines', function(done) {
      state.db.machines.add([{id: '1'}, {id: '2/lxc/0'}]);
      var request = {
        Type: 'Client',
        Request: 'DestroyMachines',
        Params: {MachineNames: ['1', '2/lxc/0'], Force: false},
        RequestId: 42
      };
      client.onmessage = function(response) {
        var data = Y.JSON.parse(response.data);
        assert.isUndefined(data.Error);
        assert.strictEqual(data.RequestId, 42);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(request));
    });

    it('can destroy machines (environment integration)', function(done) {
      state.db.machines.add([{id: '0'}, {id: '1/kvm/2'}]);
      var callback = function(response) {
        assert.isUndefined(response.err);
        assert.deepEqual(response.names, ['0', '1/kvm/2']);
        done();
      };
      env.connect();
      env.destroyMachines(
          ['0', '1/kvm/2'], false, callback, {immediate: true});
    });

    it('can report errors occurred while destroying machines', function(done) {
      var callback = function(response) {
        assert.strictEqual(
            response.err,
            'no machines were destroyed: machine 42 does not exist');
        assert.deepEqual(response.names, ['42']);
        done();
      };
      env.connect();
      env.destroyMachines(['42'], false, callback, {immediate: true});
    });

    it('can destroy an application', function(done) {
      state.deploy('cs:precise/wordpress-27', function() {
        var data = {
          Type: 'Application',
          Request: 'Destroy',
          Params: {
            ApplicationName: 'wordpress'
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

    it('can destroy an application (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-27', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          assert.equal(state.db.services.size(), 0);
          assert.isNull(state.db.services.getById('wordpress'));
          done();
        };
        env.destroyApplication('wordpress', callback, {immediate: true});
      });
    });

    it('can remove a unit', function(done) {
      state.deploy('cs:precise/wordpress-27', function() {
        var data = {
          Type: 'Application',
          Request: 'DestroyUnits',
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
          assert.isUndefined(receivedData.Error);
          assert.equal(state.db.services.item(0).get('units').size(), 0);
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can remove a unit (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-27', function() {
        var callback = function(result) {
          // fakebackend defaults error and warning to [] which carries
          // through.
          assert.isUndefined(result.err);
          assert.equal(state.db.services.item(0).get('units').size(), 0);
          done();
        };
        env.remove_units('wordpress/0', callback, {immediate: true});
      });
    });

    it('can get a charm', function(done) {
      var data = {
        Type: 'Client',
        Request: 'CharmInfo',
        Params: {
          CharmURL: 'cs:precise/wordpress-27'
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.isUndefined(receivedData.Error);
        assert.isObject(receivedData.Response);
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can set annotations', function(done) {
      generateApplications(function() {
        var data = {
          Type: 'Annotations',
          Request: 'Set',
          Params: {
            Annotations: [{
              EntityTag: 'application-wordpress',
              Annotations: {'foo': 'bar'}
            }]
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.isUndefined(receivedData.Error);
          assert.deepEqual(receivedData.Response, {});
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can get a charm (environment integration)', function(done) {
      env.connect();
      var callback = function(result) {
        assert.isUndefined(result.err);
        assert.isObject(result.result);
        done();
      };
      env.get_charm('cs:precise/wordpress-27', callback);
    });

    it('can communicate errors in getting a charm', function(done) {
      env.connect();
      var callback = function(result) {
        assert.isUndefined(result.result);
        assert.equal(result.err, 'Error interacting with the charmstore API.');
        done();
      };
      env.get_charm('cs:precise/notarealcharm-15', callback);
    });

    it('can successfully get an application and its config', function(done) {
      env.connect();
      state.deploy('cs:precise/mediawiki-15', function() {});
      var callback = function(result) {
        assert.deepEqual(
            result.result.config, {
              admins: '',
              debug: false,
              logo: '',
              name: 'Please set name of wiki',
              server_address: '',
              skin: 'vector',
              use_suffix: true
            }
        );
        // We also make sure that we get some object of data for constraints.
        assert.deepEqual(result.result.constraints, {});
        done();
      };
      env.getApplicationConfig('mediawiki', callback);
    });

    it('can set constraints', function(done) {
      state.deploy('cs:precise/wordpress-27', function() {
        var data = {
          Type: 'Application',
          Request: 'Update',
          Params: {
            ApplicationName: 'wordpress',
            Constraints: {mem: '2'}
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.isUndefined(receivedData.Error);
          var application = state.db.services.getById('wordpress');
          assert.equal(application.get('constraintsStr'), 'mem=2');
          assert.equal(application.get('constraints').mem, 2);
          done();
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    });

    it('can set constraints (environment integration)', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-27', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          var application = state.db.services.getById('wordpress');
          assert.equal(application.get('constraintsStr'), 'mem=2');
          assert.equal(application.get('constraints').mem, 2);
          done();
        };
        env.updateApplication(
          'wordpress', {constraints: {mem: '2'}}, callback);
      });
    });

    it('can set config', function(done) {
      state.deploy('cs:precise/wordpress-27', function() {
        var data = {
          Type: 'Application',
          Request: 'Update',
          Params: {
            ApplicationName: 'wordpress',
            SettingsStrings: {engine: 'apache'}
          },
          RequestId: 42
        };
        client.onmessage = function(received) {
          var receivedData = Y.JSON.parse(received.data);
          assert.isUndefined(receivedData.Error);
          var application = state.db.services.getById('wordpress');
          assert.deepEqual(application.get('config'), {
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
      state.deploy('cs:precise/wordpress-27', function() {
        var callback = function(result) {
          assert.isUndefined(result.err);
          var application = state.db.services.getById('wordpress');
          assert.deepEqual(application.get('config'), {
            debug: 'no',
            engine: 'apache',
            tuning: 'single',
            'wp-content': ''
          });
          done();
        };
        env.set_config(
          'wordpress', {engine: 'apache'}, callback, {immediate: true});
      });
    });

    it('can resolve a unit', function(done) {
      state.deploy('cs:precise/wordpress-27', function() {
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
      state.deploy('cs:precise/wordpress-27', function() {
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
      state.deploy('cs:precise/wordpress-27', function() {});
      var data = {
        Type: 'Application',
        Request: 'Update',
        Params: {
          ApplicationName: 'wordpress',
          CharmUrl: 'cs:precise/mediawiki-18',
        },
        RequestId: 42
      };
      client.onmessage = function(received) {
        var receivedData = Y.JSON.parse(received.data);
        assert.isUndefined(receivedData.err);
        var application = state.db.services.getById('wordpress');
        assert.equal(application.get('charm'), 'cs:precise/mediawiki-18');
        done();
      };
      client.open();
      client.send(Y.JSON.stringify(data));
    });

    it('can set a charm (environment integration).', function(done) {
      env.connect();
      state.deploy('cs:precise/wordpress-27', function() {});
      var cb = function(result) {
        assert.isUndefined(result.err);
        var application = state.db.services.getById('wordpress');
        assert.equal(application.get('charm'), 'cs:precise/mediawiki-18');
        done();
      };
      env.setCharm('wordpress', 'cs:precise/mediawiki-18', false, false, cb);
    });

    /**
      Generates the applications required for some tests. After the
      applications have been generated it will call the supplied callback.

      This interacts directly with the fakebackend bypassing the environment.
      The test "can add additional units" tests this code directly so as long
      as it passes you can consider this method valid.

      @method generateApplications
      @param {Function} callback The callback to call after the applications
        have been generated.
    */
    function generateApplications(callback) {
      state.deploy('cs:precise/wordpress-27', function(application) {
        var data = {
          Type: 'Application',
          Request: 'AddUnits',
          Params: {
            ApplicationName: 'wordpress',
            NumUnits: 2
          }
        };
        state.nextChanges();
        client.onmessage = function(received) {
          // After done generating the applications...
          callback(received);
        };
        client.open();
        client.send(Y.JSON.stringify(data));
      });
    }

    /**
      Same as generateApplications but uses the environment integration
      methods. Should be considered valid if "can add additional units
      (integration)" test passes.

      @method generateIntegrationApplications
      @param {Function} callback The callback to call after the applications
        have been generated.
    */
    function generateIntegrationApplications(callback) {
      var localCb = function(result) {
        env.add_unit('kumquat', 2, null, function(data) {
          // After finished generating integrated applications.
          callback(data);
        }, {immediate: true});
      };
      env.connect();
      env.deploy(
          'cs:precise/wordpress-27',
          'kumquat',
          {llama: 'pajama'},
          null,
          1,
          null,
          null,
          localCb,
          {immediate: true});
    }

    /**
      Generates the applications and then exposes them for the un/expose tests.
      After they have been exposed it calls the supplied callback.

      This interacts directly with the fakebackend bypassing the environment
      and should be considered valid if "can expose an application" test
      passes.

      @method generateAndExposeApplication
      @param {Function} callback The callback to call after the applications
        have been generated.
    */
    function generateAndExposeApplication(callback) {
      state.deploy('cs:precise/wordpress-27', function(data) {
        var command = {
          Type: 'Application',
          Request: 'Expose',
          Params: {ApplicationName: data.application.get('name')}
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
      Same as generateAndExposeApplication but uses the environment integration
      methods. Should be considered valid if "can expose an application
      (integration)" test passes.

      @method generateAndExposeIntegrationApplication
      @param {Function} callback The callback to call after the applications
        have been generated.
    */
    function generateAndExposeIntegrationApplication(callback) {
      var localCb = function(result) {
        env.expose(result.applicationName, function(rec) {
          callback(rec);
        }, {immediate: true});
      };
      env.connect();
      env.deploy(
          'cs:precise/wordpress-27',
          'kumquat',
          {llama: 'pajama'},
          null,
          1,
          null,
          null,
          localCb,
          {immediate: true});
    }

    it('can add additional units', function(done) {
      function testForAddedUnits(received) {
        var application = state.db.services.getById('wordpress'),
            units = application.get('units').toArray(),
            data = Y.JSON.parse(received.data),
            mock = {
              Response: {
                Units: ['wordpress/1', 'wordpress/2']
              }
            };
        // Do we have enough total units?
        assert.lengthOf(units, 3);
        // Does the response object contain the proper data?
        assert.deepEqual(data, mock);
        // Error is undefined.
        assert.isUndefined(data.Error);
        done();
      }
      // Generate the default applications and add units.
      generateApplications(testForAddedUnits);
    });

    it('throws an error when adding units to an invalid application',
        function(done) {
          state.deploy('cs:precise/wordpress-27', function(application) {
            var data = {
              Type: 'Application',
              Request: 'AddUnits',
              Params: {
                ApplicationName: 'no-application',
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
        var application = state.db.services.getById('kumquat'),
            units = application.get('units').toArray();
        assert.lengthOf(units, 3);
        done();
      }
      generateIntegrationApplications(testForAddedUnits);
    });

    it('can expose an application', function(done) {
      function checkExposedApplication(rec) {
        var applicationName = 'wordpress';
        var data = Y.JSON.parse(rec.data),
            mock = {Response: {}};
        var application = state.db.services.getById(applicationName);
        assert.equal(application.get('exposed'), true);
        assert.deepEqual(data, mock);
        done();
      }
      generateAndExposeApplication(checkExposedApplication);
    });

    it('can expose an application (integration)', function(done) {
      function checkExposedApplication(rec) {
        var application = state.db.services.getById('kumquat');
        assert.equal(application.get('exposed'), true);
        // The Go API does not set a result value.  That is OK as
        // it is never used.
        assert.isUndefined(rec.result);
        done();
      }
      generateAndExposeIntegrationApplication(checkExposedApplication);
    });

    it('fails silently when exposing an exposed application', function(done) {
      function checkExposedApplication(rec) {
        var applicationName = 'wordpress',
            data = Y.JSON.parse(rec.data),
            application = state.db.services.getById(applicationName),
            command = {
              Type: 'Application',
              Request: 'Expose',
              Params: {ApplicationName: applicationName}
            };
        state.nextChanges();
        client.onmessage = function(rec) {
          assert.equal(data.err, undefined);
          assert.equal(application.get('exposed'), true);
          done();
        };
        client.send(Y.JSON.stringify(command));
      }
      generateAndExposeApplication(checkExposedApplication);
    });

    it('fails with error when exposing an invalid application name',
        function(done) {
          state.deploy('cs:precise/wordpress-27', function(data) {
            var command = {
              Type: 'Application',
              Request: 'Expose',
              Params: {ApplicationName: 'foobar'}
            };
            state.nextChanges();
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data);
              assert.equal(data.Error,
                 '"foobar" is an invalid application name.');
              done();
            };
            client.open();
            client.send(Y.JSON.stringify(command));
          }, { unitCount: 1 });
        }
    );

    it('can unexpose an application', function(done) {
      function unexposeApplication(rec) {
        var applicationName = 'wordpress',
            command = {
              Type: 'Application',
              Request: 'Unexpose',
              Params: {ApplicationName: applicationName}
            };
        state.nextChanges();
        client.onmessage = function(rec) {
          var data = Y.JSON.parse(rec.data),
              application = state.db.services.getById('wordpress'),
              mock = {Response: {}};
          assert.equal(application.get('exposed'), false);
          assert.deepEqual(data, mock);
          done();
        };
        client.send(Y.JSON.stringify(command));
      }
      generateAndExposeApplication(unexposeApplication);
    });

    it('can unexpose an application (integration)', function(done) {
      var applicationName = 'kumquat';
      function unexposeApplication(rec) {
        function localCb(rec) {
          var application = state.db.services.getById(applicationName);
          assert.equal(application.get('exposed'), false);
          // No result from Go unexpose.
          assert.isUndefined(rec.result);
          done();
        }
        env.unexpose(applicationName, localCb, {immediate: true});
      }
      generateAndExposeIntegrationApplication(unexposeApplication);
    });

    it('fails silently when unexposing a not exposed application',
        function(done) {
          var applicationName = 'wordpress';
          state.deploy('cs:precise/wordpress-27', function(data) {
            var command = {
              Type: 'Application',
              Request: 'Unexpose',
              Params: {ApplicationName: applicationName}
            };
            state.nextChanges();
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data),
                  application = state.db.services.getById(applicationName);
              assert.equal(application.get('exposed'), false);
              assert.equal(data.err, undefined);
              done();
            };
            client.open();
            client.send(Y.JSON.stringify(command));
          }, { unitCount: 1 });
        }
    );

    it('fails with error when unexposing an invalid application name',
        function(done) {
          function unexposeApplication(rec) {
            var command = {
              Type: 'Application',
              Request: 'Unexpose',
              Params: {ApplicationName: 'foobar'}
            };
            state.nextChanges();
            client.onmessage = function(rec) {
              var data = Y.JSON.parse(rec.data);
              assert.equal(
                data.Error, '"foobar" is an invalid application name.');
              done();
            };
            client.send(Y.JSON.stringify(command));
          }
          generateAndExposeApplication(unexposeApplication);
        }
    );

    it('can add a relation', function(done) {
      // We begin logged in.  See utils.makeFakeBackend.
      state.deploy('cs:precise/wordpress-27', function() {
        state.deploy('cs:precise/mysql-26', function() {
          var data = {
            RequestId: 42,
            Type: 'Application',
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
          'cs:precise/wordpress-27', null, null, null, 1, null, null,
          function() {
            env.deploy(
                'cs:precise/mysql-26', null, null, null, 1, null, null,
                function() {
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
                  }, {immediate: true});
                }, {immediate: true});
          }, {immediate: true});
    });

    it('is able to add a relation with a subordinate app', function(done) {
      state.deploy('cs:precise/wordpress-27', function() {
        state.deploy('cs:precise/puppet-5', function(application) {
          var data = {
            RequestId: 42,
            Type: 'Application',
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
      state.deploy('cs:precise/wordpress-27', function() {
        var data = {
          RequestId: 42,
          Type: 'Application',
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
      state.deploy('cs:precise/wordpress-27', function() {
        var data = {
          RequestId: 42,
          Type: 'Application',
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
      state.deploy('cs:precise/wordpress-27', function() {
        state.deploy('cs:precise/mysql-26', function() {
          state.addRelation(relation[0], relation[1]);
          var data = {
            RequestId: 42,
            Type: 'Application',
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
          'cs:precise/wordpress-27', null, null, null, 1, null, null,
          function() {
            env.deploy(
                'cs:precise/mysql-26', null, null, null, 1, null, null,
                function() {
                  var endpointA = ['wordpress', {name: 'db', role: 'client'}],
                      endpointB = ['mysql', {name: 'db', role: 'server'}];
                  env.add_relation(endpointA, endpointB, function() {
                    env.remove_relation(
                        endpointA, endpointB, function(recData) {
                          assert.equal(recData.err, undefined);
                          assert.equal(recData.endpoint_a, 'wordpress:db');
                          assert.equal(recData.endpoint_b, 'mysql:db');
                          done();
                        }, {immediate: true});
                  }, {immediate: true});
                }, {immediate: true});
          }, {immediate: true});
    });

    describe('handleChangeSetGetChanges', function() {
      var count, data, closeStub, sendStub, ReconnectingWebSocket, websockets;

      beforeEach(function() {
        websockets = [];
        count = 0;
        ReconnectingWebSocket = Y.ReconnectingWebSocket;
        closeStub = utils.makeStubFunction();
        sendStub = utils.makeStubFunction();
        Y.ReconnectingWebSocket = function(socketUrl) {
          this.id = count;
          count += 1;
          assert.equal(socketUrl, 'socket url');
          // Store the generated instances of this object.
          websockets.push(this);
          this.send = sendStub;
          this.close = closeStub;
        };
        data = {
          Type: 'ChangeSet',
          Request: 'GetChanges'
        };
        client.open();
        client.send(JSON.stringify(data));
      });

      afterEach(function() {
        Y.ReconnectingWebSocket = ReconnectingWebSocket;
      });

      it('creates a new websocket on each request', function() {
        // send the data twice to simulate two requests.
        client.send(JSON.stringify(data));
        // Make sure that they aren't the same ws instance.
        assert.equal(websockets[0] instanceof Y.ReconnectingWebSocket, true);
        assert.equal(websockets[1] instanceof Y.ReconnectingWebSocket, true);
        assert.equal(websockets[0] === websockets[1], false);
      });

      it('sends the data when the connection opens', function() {
        websockets[0].onopen();
        assert.equal(sendStub.callCount(), 1, 'send not called');
        assert.equal(
            sendStub.lastArguments()[0],
            '{"Type":"ChangeSet","Request":"GetChanges"}');
      });

      it('returns with error if websocket cannot connect', function(done) {
        // We allow it to try to connect three times before closing the
        // connection and returning with an error.
        websockets[0].onerror();
        websockets[0].onerror();
        websockets[0].onerror();
        assert.equal(juju.wsFailureCount, 3, 'failure count not 3');
        assert.equal(closeStub.callCount(), 1, 'close not called');
        client.onmessage = function(response) {
          assert.equal(
              response.data,
              '{"Response":{},"Error":"Unable to connect to bundle processor."}'
          );
          done();
        };
      });

      it('returns with data if websocket is successful', function(done) {
        websockets[0].onmessage({data: '{"Response":"record set data"}'});
        client.onmessage = function(response) {
          assert.deepEqual(
              response,
              { data: '{"Response":"record set data"}'});
          assert.equal(closeStub.callCount(), 1, 'close not called');
          done();
        };
      });
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
