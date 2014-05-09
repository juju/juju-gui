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
                topo: {
                  service_boxes: {}},
                createServiceInspector: utils.makeStubFunction() }}},
          env: {
            deploy: utils.makeStubFunction() }
        });
    ghostDeployer = new GhostDeployer();
    var getMethod = utils.makeStubFunction();
    ghostDeployer.db = {
      charms: { add: utils.makeStubFunction({ get: getMethod }) },
      services: { ghostService: utils.makeStubFunction({ get: getMethod }) },
      notifications: { add: utils.makeStubFunction() }
    };
  });

  afterEach(function() {
    ghostDeployer.destroy();
    window.flags = {};
  });

  it('calls the env deploy method with the default charm data', function() {
    window.flags.il = true;
    var charmGetStub = utils.makeStubFunction();
    ghostDeployer.deployService({ get: charmGetStub });
    assert.equal(ghostDeployer.env.deploy.calledOnce(), true);
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

});
