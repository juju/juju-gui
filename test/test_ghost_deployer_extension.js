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

  var Y, juju, utils, ghostDeployer, GhostDeployer;

  before(function(done) {
    var requires = ['base', 'base-build', 'model', 'ghost-deployer-extension',
      'juju-tests-utils'];
    Y = YUI(GlobalConfig).use(requires, function(Y) {
          juju = Y.namespace('juju');
          utils = Y.namespace('juju-tests.utils');
          done();
        });
  });

  beforeEach(function() {
    window.flags = {};
    GhostDeployer = Y.Base.create(
        'deployer', Y.Base, [juju.GhostDeployer], {
          views: {
            environment: {
              instance: {
                topo: {service_boxes: {}},
                createServiceInspector: utils.makeStubFunction()
              }
            }
          },
          env: {
            deploy: utils.makeStubFunction(),
            add_unit: utils.makeStubFunction()
          }
        });
    ghostDeployer = new GhostDeployer();
    var getMethod = utils.makeStubFunction();
    ghostDeployer.db = {
      charms: { add: utils.makeStubFunction({ get: getMethod }) },
      services: {
        ghostService: utils.makeStubFunction({
          get: utils.makeStubFunction('ghost-service-id'),
          set: utils.makeStubFunction()
        })
      },
      notifications: { add: utils.makeStubFunction() },
      addUnits: utils.makeStubFunction(),
      removeUnits: utils.makeStubFunction()
    };
    ghostDeployer.set('subApps', {
      charmbrowser: {
        fire: utils.makeStubFunction() }});
  });

  afterEach(function() {
    ghostDeployer.destroy();
    window.flags = {};
  });

  // Create and return a charm model instance.
  var makeCharm = function() {
    return new Y.Model({
      id: 'cs:trusty/django-42',
      name: 'django',
      is_subordinate: false
    });
  };

  it('sets the ghost service config to its defaults', function() {
    window.flags.mv = true;
    var charm = makeCharm();
    charm.set('options', { foo: { default: 'bar' }});
    ghostDeployer.db.services = new Y.juju.models.ServiceList();
    ghostDeployer.deployService(charm);
    var service = ghostDeployer.db.services.item(0);
    assert.deepEqual(service.get('config'), {foo: 'bar'});
  });

  it('calls the env deploy method with default charm data', function() {
    window.flags.mv = true;
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    assert.strictEqual(ghostDeployer.env.deploy.calledOnce(), true);
    var args = ghostDeployer.env.deploy.lastArguments();
    assert.strictEqual(args[0], 'cs:trusty/django-42'); // Charm URL.
    assert.strictEqual(args[1], 'django'); // Service name.
    assert.deepEqual(args[2], {}); // Config.
    assert.strictEqual(args[4], 0); // Number of units.
    assert.deepEqual(args[5], {}); // Constraints.
    assert.isNull(args[6]); // Machine placement.
  });

  it('adds the ECS modelId option when deploying the charm', function() {
    window.flags.mv = true;
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    assert.strictEqual(ghostDeployer.env.deploy.calledOnce(), true);
    var args = ghostDeployer.env.deploy.lastArguments();
    var options = args[args.length - 1];
    assert.property(options, 'modelId');
    // The model id is the ghost service identifier.
    assert.strictEqual(options.modelId, 'ghost-service-id');
  });

  it('creates a ghost service', function() {
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    var services = ghostDeployer.db.services;
    assert.strictEqual(services.ghostService.calledOnce(), true);
    var args = services.ghostService.lastArguments();
    assert.lengthOf(args, 1);
    assert.deepEqual(args[0], charm);
    var fire = ghostDeployer.get('subApps').charmbrowser.fire;
    assert.equal(fire.calledOnce(), true);
    var fireArgs = fire.lastArguments();
    assert.equal(fireArgs[0], 'changeState');
    assert.deepEqual(fireArgs[1], {
      sectionA: {
        component: 'inspector',
        metadata: { id: 'ghost-service-id' }}});
  });

  it('can create a ghost unit', function() {
    window.flags.mv = true;
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    var db = ghostDeployer.db;
    assert.strictEqual(db.addUnits.calledOnce(), true);
    var args = db.addUnits.lastArguments();
    assert.lengthOf(args, 1);
    var expectedUnit = {
      id: 'ghost-service-id/0',
      displayName: charm.get('name') + '/0',
      charmUrl: charm.get('id'),
      is_subordinate: charm.get('is_subordinate')
    };
    assert.deepEqual(args[0], expectedUnit);
  });

  it('does not create a ghost unit for subordinates', function() {
    window.flags.mv = true;
    var charm = makeCharm();
    charm.set('is_subordinate', true);
    ghostDeployer.deployService(charm);
    var db = ghostDeployer.db;
    assert.strictEqual(db.addUnits.callCount(), 0);
  });

  it('deploys the ghost unit using the ECS', function() {
    window.flags.mv = true;
    var charm = makeCharm();
    ghostDeployer.deployService(charm);
    var env = ghostDeployer.env;
    // Ensure env.add_unit has been called with the expected arguments.
    assert.strictEqual(env.add_unit.calledOnce(), true);
    var args = env.add_unit.lastArguments();
    assert.strictEqual(args[0], 'ghost-service-id'); // The service name.
    assert.strictEqual(args[1], 1); // The number of units.
    assert.isNull(args[2]); // The unit is not yet placed.
  });

  it('sets the proper annotations in the deploy handler', function() {
    var ghostService = new Y.Model({
      id: 'ghostid'
    });
    var topo = ghostDeployer.views.environment.instance.topo;
    topo.annotateBoxPosition = utils.makeStubFunction();
    topo.service_boxes.ghostid = {};
    ghostDeployer._deployCallbackHandler('foo', {}, {}, ghostService, {});
    var attrs = ghostService.getAttrs();
    assert.equal(attrs.id, 'foo');
    assert.equal(attrs.displayName, undefined);
    assert.equal(attrs.pending, false, 'pending');
    assert.equal(attrs.loading, false, 'loading');
    assert.deepEqual(attrs.config, {}, 'config');
    assert.deepEqual(attrs.constraints, {}, 'constraints');
    assert.deepEqual(topo.service_boxes.foo, {
      id: 'foo',
      pending: false
    });
    assert.equal(topo.annotateBoxPosition.calledOnce(), true);
  });

  it('fires serviceDeployed in the deploy handler', function() {
    var ghostService = new Y.Model({
      id: 'ghostid'
    });
    var topo = ghostDeployer.views.environment.instance.topo;
    topo.annotateBoxPosition = utils.makeStubFunction();
    topo.service_boxes.ghostid = {clientId: 'ghostid'};
    var stubFire = ghostDeployer.get('subApps').charmbrowser.fire;
    ghostDeployer._deployCallbackHandler('ghostid', {}, {}, ghostService, {});
    assert.deepEqual(stubFire.lastArguments(), [
      'serviceDeployed',
      {
        clientId: 'ghostid',
        serviceName: 'ghostid'
      }
    ], 'Event not fired.');
  });

  it('notifies add_unit success', function() {
    var ghostUnit = {displayName: 'django/42'};
    var evt = {err: 'bad wolf'};
    ghostDeployer._addUnitCallback(ghostUnit, evt);
    var notifications = ghostDeployer.db.notifications;
    assert.strictEqual(notifications.add.calledOnce(), true);
    var notification = notifications.add.lastArguments()[0];
    assert.strictEqual(
        notification.get('title'), 'Error adding unit django/42');
    assert.strictEqual(
        notification.get('message'),
        'Could not add the requested unit. Server responded with: bad wolf');
    assert.strictEqual(notification.get('level'), 'error');
  });

  it('notifies add_unit failures', function() {
    var ghostUnit = {displayName: 'django/42'};
    var evt = {service_name: 'django'};
    ghostDeployer._addUnitCallback(ghostUnit, evt);
    var notifications = ghostDeployer.db.notifications;
    assert.strictEqual(notifications.add.calledOnce(), true);
    var notification = notifications.add.lastArguments()[0];
    assert.strictEqual(notification.get('title'), 'Added unit django/42');
    assert.strictEqual(
        notification.get('message'),
        'Successfully created the requested unit.');
    assert.strictEqual(notification.get('level'), 'info');
  });

  it('removes the ghost unit on add_unit success', function() {
    var ghostUnit = {displayName: 'django/42'};
    var evt = {service_name: 'django'};
    ghostDeployer._addUnitCallback(ghostUnit, evt);
    var db = ghostDeployer.db;
    assert.strictEqual(db.removeUnits.calledOnce(), true);
    var args = db.removeUnits.lastArguments();
    assert.lengthOf(args, 1);
    var expectedUnit = {
      displayName: 'django/42',
      service: 'django'
    };
    assert.deepEqual(args[0], expectedUnit);
  });

});
