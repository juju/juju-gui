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


describe('deployer bar view', function() {
  var Y, container, ECS, ecs, dbObj, envObj, mockEvent, testUtils, utils, views,
      view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['deployer-bar',
                               'juju-views',
                               'juju-tests-utils',
                               'environment-change-set',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      ECS = Y.namespace('juju').EnvironmentChangeSet;
      View = views.DeployerBarView;
      mockEvent = { halt: function() {} };
      done();
    });
  });

  beforeEach(function() {
    ecs = new ECS({
      db: dbObj
    });
    container = utils.makeContainer(this, 'deployer-bar');
    view = new View({container: container, ecs: ecs}).render();
  });

  afterEach(function() {
    ecs.destroy();
    container.remove(true);
    view.destroy();
  });

  it('should exist in the views namespace', function() {
    assert(views.DeployerBarView);
  });

  it('should apply the wrapping class to the container', function() {
    assert.equal(container.hasClass('deployer-bar'), true);
  });

  // Test currently has cleanup issues
  it.skip('should increase changes when a service is added', function() {
    ecs.changeSet.abc123 = { foo: 'foo' };
    assert.equal(view._getChangeCount(ecs), 1);
  });

  it('should confirm ECS changes when deploy is clicked', function() {
    var changesStub = utils.makeStubMethod(view, '_getChangeCount', 0),
        deployStub = utils.makeStubMethod(view, '_getDeployedServices', []),
        relationsStub = utils.makeStubMethod(view, '_getAddRelations', []);
    this._cleanups.push(changesStub.reset);
    this._cleanups.push(deployStub.reset);
    this._cleanups.push(relationsStub.reset);
    view.deploy(mockEvent);
    assert.equal(container.hasClass('summary-open'), true,
                 'summary is not open');
    assert.notEqual(container.one('.summary-panel'), null,
                    'summary panel HTML is not present');
  });

  it('should commit on confirmation', function() {
    var stubCommit = utils.makeStubMethod(ecs, 'commit');
    this._cleanups.push(stubCommit.reset);
    view.confirm(mockEvent);
    assert.equal(stubCommit.calledOnce(), true,
                 'ECS commit not called');
    assert.equal(container.hasClass('summary-open'), false,
                 'summary-open class still present');
  });

  it('should close', function() {
    view.summaryClose(mockEvent);
    assert.equal(container.hasClass('summary-open'), false);
  });

  it('provides a way to retrieve the service icon', function() {
    var url = view._getServiceIconUrl('django');
    assert.strictEqual(
        url,
        'https://manage.jujucharms.com' +
        '/api/3/charm/precise/django/file/icon.svg'
    );
  });

  // XXX frankban 2014-05-12: it seems all this suite is not well isolated,
  // or the view does not clean up correctly.
  it.skip('retrieves all the unit changes', function() {
    ecs.lazyAddUnits(['django', 1]);
    ecs.lazyAddUnits(['rails', 2]);
    var results = view._getAddUnits(ecs);
    assert.lengthOf(results, 2);
    assert.deepEqual(results[0], {
      icon: 'https://manage.jujucharms.com' +
          '/api/3/charm/precise/django/file/icon.svg',
      numUnits: 1,
      serviceName: 'django'
    });
    assert.deepEqual(results[1], {
      icon: 'https://manage.jujucharms.com' +
          '/api/3/charm/precise/rails/file/icon.svg',
      numUnits: 2,
      serviceName: 'rails'
    });
  });

});
