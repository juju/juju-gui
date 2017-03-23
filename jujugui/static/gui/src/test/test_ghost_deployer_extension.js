/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

describe('Ghost Deployer Extension', function() {

  var Y, juju, ghostDeployer, GhostDeployer;

  before(function(done) {
    var requires = ['base', 'base-build', 'model', 'ghost-deployer-extension',
      'juju-models'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
      juju = Y.namespace('juju');
      done();
    });
  });

  beforeEach(function() {
    GhostDeployer = Y.Base.create(
        'deployer', Y.Base, [juju.GhostDeployer], {
          views: {
            environment: {
              instance: {
                topo: {service_boxes: {}},
                createServiceInspector: sinon.stub()
              }
            }
          },
          env: {
            deploy: sinon.stub(),
            add_unit: sinon.stub(),
            addCharm: sinon.stub(),
            addPendingResources: sinon.stub()
          },
          state: {
            changeState: sinon.stub()
          }
        }, {
          ATTRS: {
            charmstore: {
              value: {
                bakery: {
                  getMacaroon: sinon.stub().returns('cookies are better')
                }
              }
            }
          }
        });
    ghostDeployer = new GhostDeployer();
    var getMethod = sinon.stub();
    ghostDeployer.db = {
      charms: { add: sinon.stub().returns({ get: getMethod }) },
      services: {
        ghostService: sinon.stub().returns({
          get: sinon.stub().returns('ghost-service-id'),
          set: sinon.stub()
        })
      },
      notifications: { add: sinon.stub() },
      addUnits: sinon.stub(),
      removeUnits: sinon.stub()
    };
  });

  afterEach(function() {
    ghostDeployer.destroy();
  });

  // Create and return a charm model instance.
  var makeCharm = function(id='cs:trusty/django-42') {
    return new Y.Model({
      id: id,
      name: 'django',
      package_name: 'django',
      is_subordinate: false,
      series: 'trusty'
    });
  };

  it('sets the ghost service config to its defaults', function() {
    var charm = makeCharm();
    charm.set('options', { foo: { default: 'bar' }});
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    ghostDeployer.deployService(charm);
    var service = ghostDeployer.db.services.item(0);
    assert.deepEqual(service.get('config'), {foo: 'bar'});
  });

  it('sets the active plan on the service', function() {
    var charm = makeCharm();
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    ghostDeployer.deployService(charm, undefined, null, 'active-plan');
    var service = ghostDeployer.db.services.item(0);
    assert.equal(service.get('activePlan'), 'active-plan');
  });

  it('sets the plans on the charm', function() {
    var charm = makeCharm();
    var plans = ['plan1', 'plan2'];
    ghostDeployer.db.charms = new Y.juju.models.ServiceList();
    ghostDeployer.deployService(charm, undefined, plans, 'active-plan');
    var service = ghostDeployer.db.charms.item(0);
    assert.deepEqual(service.get('plans'), plans);
  });

  it('sets the plans on the charm when not setting an active plan', function() {
    var charm = makeCharm();
    var plans = ['plan1', 'plan2'];
    ghostDeployer.db.charms = new Y.juju.models.ServiceList();
    ghostDeployer.deployService(charm, undefined, plans);
    var service = ghostDeployer.db.charms.item(0);
    assert.deepEqual(service.get('plans'), plans);
  });

  it('calls to add the charm before deploying', function() {
    var charm = makeCharm();
    var addCharmCalled = false;
    ghostDeployer.env.addCharm = function(charmId, macaroon, callback, opt) {
      addCharmCalled = true;
      assert.equal(charmId, charm.get('id'));
      // It should fetch the macaroon when adding the charm.
      assert.strictEqual(macaroon, null);
      assert.equal(typeof callback, 'function');
      assert.deepEqual(opt, {
        applicationId: 'ghost-service-id'
      });
      assert.equal(ghostDeployer.env.deploy.callCount, 0,
        'deploy should not have been called before charm was added');
    };
    ghostDeployer.deployService(charm);
    assert.equal(addCharmCalled, true);
    assert.equal(ghostDeployer.env.deploy.callCount, 1);
  });

  it('does not call addCharm for local charms and juju 2', function() {
    const charm = makeCharm('local:trusty/django-42');
    ghostDeployer.env.addCharm = sinon.stub();
    ghostDeployer.deployService(charm);
    assert.equal(ghostDeployer.env.addCharm.callCount, 0);
    assert.equal(ghostDeployer.env.deploy.callCount, 1);
  });

  it('calls the env addPendingResources method with default charm data', () => {
    const charm = makeCharm();
    charm.set('resources', {a: 'resource'});
    ghostDeployer.deployService(charm);
    assert.strictEqual(ghostDeployer.env.addPendingResources.calledOnce, true);
    const args = ghostDeployer.env.addPendingResources.lastCall.args;
    assert.equal(args[0].charmURL, 'cs:trusty/django-42');
    assert.equal(args[0].applicationName, 'ghost-service-id');
    assert.deepEqual(args[0].resources, {a: 'resource'});
    assert.equal(typeof args[1], 'function');
  });

  it('adds the ECS modelId option when deploying the charm', function() {
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    assert.strictEqual(ghostDeployer.env.deploy.calledOnce, true);
    var args = ghostDeployer.env.deploy.lastCall.args;
    var options = args[args.length - 1];
    assert.property(options, 'modelId');
    // The model id is the ghost service identifier.
    assert.strictEqual(options.modelId, 'ghost-service-id');
  });

  it('creates a ghost service', function() {
    var charm = makeCharm();
    ghostDeployer.fire = sinon.stub();
    ghostDeployer.deployService(charm);
    var services = ghostDeployer.db.services;
    assert.strictEqual(services.ghostService.calledOnce, true);
    var args = services.ghostService.lastCall.args;
    assert.lengthOf(args, 1);
    assert.deepEqual(args[0], charm);
    const changeState = ghostDeployer.state.changeState;
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: null,
      gui: {
        inspector: {
          id: 'ghost-service-id',
          localType: null
        }
      }
    });
  });

  it('increments the name for duplicate ghost services', function() {
    var charm = makeCharm();
    var mysql = {
      id: 'cs:trusty/mysql',
      name: 'mysql',
      package_name: 'mysql',
      is_subordinate: false
    };
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    var services = ghostDeployer.db.services;
    services.ghostService(charm);
    services.ghostService(charm);
    services.ghostService(new Y.Model(mysql));
    services.ghostService(new Y.Model(mysql));
    assert.equal(services.item(0).get('name'), 'django');
    assert.equal(services.item(1).get('name'), 'django-a');
    assert.equal(services.item(2).get('name'), 'mysql');
    assert.equal(services.item(3).get('name'), 'mysql-a');
  });

  it('increments subset names for duplicate services', function() {
    var mysql = {
      id: 'cs:trusty/mysql',
      name: 'mysql',
      package_name: 'mysql',
      is_subordinate: false
    };
    var mysqlSlave = {
      id: 'cs:trusty/mysql-slave',
      name: 'mysql-slave',
      package_name: 'mysql-slave',
      is_subordinate: false
    };
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    var services = ghostDeployer.db.services;
    services.ghostService(new Y.Model(mysqlSlave));
    services.ghostService(new Y.Model(mysql));
    assert.equal(services.item(0).get('name'), 'mysql-slave');
    assert.equal(services.item(1).get('name'), 'mysql');
  });

  it('increments subset custom names for duplicate services', function() {
    var mysql = {
      id: 'cs:trusty/mysql',
      name: 'my-mysql',
      package_name: 'my-mysql',
      is_subordinate: false
    };
    var mysqlSlave = {
      id: 'cs:trusty/mysql',
      name: 'my-mysql-slave',
      package_name: 'my-mysql-slave',
      is_subordinate: false
    };
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    var services = ghostDeployer.db.services;
    services.ghostService(new Y.Model(mysqlSlave));
    services.ghostService(new Y.Model(mysql));
    assert.equal(services.item(0).get('name'), 'my-mysql-slave');
    assert.equal(services.item(1).get('name'), 'my-mysql');
  });

  it('uses the default name if available', function() {
    var charm = makeCharm();
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    var services = ghostDeployer.db.services;
    services.ghostService(charm);
    var service2 = services.ghostService(charm);
    services.item(0).destroy();
    var service3 = services.ghostService(charm);
    assert.equal(services.item(0).get('name'), 'django-a');
    assert.equal(services.item(0).get('id'), service2.get('id'));
    assert.equal(services.item(1).get('name'), 'django');
    assert.equal(services.item(1).get('id'), service3.get('id'));
  });

  it('increments the name with middle deleted services', function() {
    var charm = makeCharm();
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    var services = ghostDeployer.db.services;
    services.ghostService(charm);
    services.ghostService(charm);
    services.ghostService(charm);
    services.item(1).destroy();
    services.ghostService(charm);
    assert.equal(services.item(0).get('name'), 'django');
    assert.equal(services.item(1).get('name'), 'django-b');
    assert.equal(services.item(2).get('name'), 'django-a');
  });

  it('can create a ghost unit', function() {
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    var db = ghostDeployer.db;
    assert.strictEqual(db.addUnits.calledOnce, true);
    var args = db.addUnits.lastCall.args;
    assert.lengthOf(args, 1);
    var expectedUnit = {
      id: 'ghost-service-id/0',
      displayName: 'ghost-service-id/0',
      charmUrl: charm.get('id'),
      subordinate: charm.get('is_subordinate')
    };
    assert.deepEqual(args[0], expectedUnit);
  });

  it('does not create a ghost unit for subordinates', function() {
    var charm = makeCharm();
    charm.set('is_subordinate', true);
    ghostDeployer.deployService(charm);
    var db = ghostDeployer.db;
    assert.strictEqual(db.addUnits.callCount, 0);
  });

  it('deploys the ghost unit using the ECS', function() {
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    var env = ghostDeployer.env;
    // Ensure env.add_unit has been called with the expected arguments.
    assert.strictEqual(env.add_unit.calledOnce, true);
    var args = env.add_unit.lastCall.args;
    assert.strictEqual(args[0], 'ghost-service-id'); // The service name.
    assert.strictEqual(args[1], 1); // The number of units.
    assert.isNull(args[2]); // The unit is not yet placed.
  });

  it('sets the proper annotations in the deploy handler', function() {
    const ghostService = new Y.Model({
      id: 'ghostid',
      name: 'django',
      config: {}
    });
    const topo = ghostDeployer.views.environment.instance.topo;
    topo.annotateBoxPosition = sinon.stub();
    topo.service_boxes.ghostid = {};
    ghostDeployer._deployCallbackHandler(ghostService, null);
    const attrs = ghostService.getAttrs();
    assert.equal(attrs.id, 'django');
    assert.equal(attrs.displayName, undefined);
    assert.equal(attrs.pending, false, 'pending');
    assert.equal(attrs.loading, false, 'loading');
    assert.deepEqual(attrs.config, {}, 'config');
    assert.deepEqual(attrs.constraints, {}, 'constraints');
    assert.deepEqual(topo.service_boxes.django, {
      id: 'django',
      pending: false
    });
    assert.equal(topo.annotateBoxPosition.calledOnce, true);
  });

  it('notifies add_unit success', function() {
    var ghostUnit = {displayName: 'django/42'};
    var evt = {err: 'bad wolf'};
    ghostDeployer._addUnitCallback(ghostUnit, evt);
    var notifications = ghostDeployer.db.notifications;
    assert.strictEqual(notifications.add.calledOnce, true);
    var notification = notifications.add.lastCall.args[0];
    assert.equal(notification.title, 'Error adding unit django/42');
    assert.equal(
        notification.message,
        'Could not add the requested unit. Server responded with: bad wolf');
    assert.equal(notification.level, 'error');
  });

  it('notifies add_unit failures', function() {
    var ghostUnit = {displayName: 'django/42'};
    var evt = {applicationName: 'django'};
    ghostDeployer._addUnitCallback(ghostUnit, evt);
    var notifications = ghostDeployer.db.notifications;
    assert.strictEqual(notifications.add.calledOnce, true);
    var notification = notifications.add.lastCall.args[0];
    assert.equal(notification.title, 'Added unit django/42');
    assert.equal(
        notification.message,
        'Successfully created the requested unit.');
    assert.equal(notification.level, 'info');
  });

  it('removes the ghost unit on add_unit success', function() {
    var ghostUnit = {displayName: 'django/42'};
    var evt = {applicationName: 'django'};
    ghostDeployer._addUnitCallback(ghostUnit, evt);
    var db = ghostDeployer.db;
    assert.strictEqual(db.removeUnits.calledOnce, true);
    var args = db.removeUnits.lastCall.args;
    assert.lengthOf(args, 1);
    var expectedUnit = {
      displayName: 'django/42',
      service: 'django'
    };
    assert.deepEqual(args[0], expectedUnit);
  });

});
