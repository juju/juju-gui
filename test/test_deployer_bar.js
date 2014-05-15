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
  var Y, container, ECS, ecs, mockEvent, testUtils, utils, views,
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
    ecs = new ECS({});
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


  it('can be told to show deploy confirmation or recent changes', function() {
    var summaryStub = utils.makeStubMethod(view, '_showSummary');
    this._cleanups.push(summaryStub.reset);

    view.showDeployConfirmation(mockEvent);
    assert.equal(
        summaryStub.lastArguments()[0], true,
        '_showSummary did not receive true from showDeployConfirmation.'
    );

    view.showRecentChanges(mockEvent);
    assert.equal(
        summaryStub.lastArguments()[0], false,
        '_showSummary did not receive false from showRecentChanges.'
    );
  });

  it('can show a summary of uncommitted changes for deployment', function() {
    var changesStub = utils.makeStubMethod(view, '_getChangeCount', 0),
        deployStub = utils.makeStubMethod(view, '_getDeployedServices', []),
        relationsStub = utils.makeStubMethod(view, '_getAddRelations', []);
    this._cleanups.push(changesStub.reset);
    this._cleanups.push(deployStub.reset);
    this._cleanups.push(relationsStub.reset);
    view._showSummary(true);
    assert.equal(
        container.hasClass('summary-open'), true,
        'Summary is not open.'
    );
    assert.notEqual(
        container.one('.summary-panel'), null,
        'Summary panel HTML is not present.'
    );
    assert.notEqual(
        container.one('.post-summary'), null,
        'Deployment confirmation not present.'
    );
    assert.equal(
        container.one('.change-list'), null,
        'Recent changes present when they should not be.'
    );
  });

  it('can show a list of recent changes', function() {
    var changesStub = utils.makeStubMethod(view, '_getChangeCount', 0),
        deployStub = utils.makeStubMethod(view, '_getDeployedServices', []),
        relationsStub = utils.makeStubMethod(view, '_getAddRelations', []);
    this._cleanups.push(changesStub.reset);
    this._cleanups.push(deployStub.reset);
    this._cleanups.push(relationsStub.reset);
    view._showSummary(false);
    assert.equal(
        container.hasClass('summary-open'), true,
        'Summary is not open.'
    );
    assert.notEqual(
        container.one('.summary-panel'), null,
        'Summary panel HTML is not present.'
    );
    assert.equal(
        container.one('.post-summary'), null,
        'Deployment confirmation present when it should not be.'
    );
    assert.notEqual(
        container.one('.change-list'), null,
        'Recent changes not present.'
    );
  });

  it('should commit on confirmation', function() {
    var stubCommit = utils.makeStubMethod(ecs, 'commit');
    this._cleanups.push(stubCommit.reset);
    view.deploy(mockEvent);
    assert.equal(stubCommit.calledOnce(), true,
                 'ECS commit not called');
    assert.equal(container.hasClass('summary-open'), false,
                 'summary-open class still present');
  });

  it('closes the summary', function() {
    view.hideSummary(mockEvent);
    assert.equal(container.hasClass('summary-open'), false);
  });

  it('can generate descriptions for any change type', function() {
    var tests = [{
      icon: '<i class="sprite service-added"></i>',
      msg: ' bar has been added.',
      change: {
        command: {
          method: '_deploy',
          args: ['foo', 'bar']
        }
      }
    }, {
      icon: '<i class="sprite service-added"></i>',
      msg: ' 1 foo unit has been added.',
      change: {
        command: {
          method: '_add_unit',
          args: ['foo', 1]
        }
      }
    }, {
      icon: '<i class="sprite service-added"></i>',
      msg: ' 2 foo units have been added.',
      change: {
        command: {
          method: '_add_unit',
          args: ['foo', 2]
        }
      }
    }, {
      icon: '<i class="sprite relation-added"></i>',
      msg: 'bar relation added between foo and baz.',
      change: {
        command: {
          method: '_add_relation',
          args: [
            ['foo', { name: 'bar' }],
            ['baz']
          ]
        }
      }
    }, {
      icon: '<i class="sprite container-created01"></i>',
      msg: '1 container has been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{ parentId: 1 }]]
        }
      }
    }, {
      icon: '<i class="sprite container-created01"></i>',
      msg: '2 containers have been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{ parentId: 1 }, { parentId: 1 }]]
        }
      }
    }, {
      icon: '<i class="sprite machine-created01"></i>',
      msg: '1 machine has been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{}]]
        }
      }
    }, {
      icon: '<i class="sprite machine-created01"></i>',
      msg: '2 machines have been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{}, {}]]
        }
      }
    }, {
      icon: '<i class="sprite service-exposed"></i>',
      msg: 'An unknown change has been made to this enviroment via the CLI.',
      change: {
        command: {
          method: '_anUnknownMethod'
        }
      }
    }];

    var msg;
    tests.forEach(function(test) {
      msg = test.icon + test.msg + '<time>00:00</time>';
      assert.equal(view._generateChangeDescription(test.change, true), msg);
    });
  });

  it('can generate descriptions for all the changes in the ecs', function() {
    var stubDescription = utils.makeStubMethod(
        view,
        '_generateChangeDescription');
    this._cleanups.push(stubDescription.reset);
    ecs.changeSet = { foo: {}, bar: {} };
    view._generateAllChangeDescriptions(ecs);
    assert.equal(stubDescription.callCount(), 2);
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

  // XXX see above
  it.skip('retrieves all the machine changes', function() {
    var machine = {};
    var container = {
      parentId: ecs.lazyAddMachines([[machine]]), containerType: 'lxc'
    };
    // Add a second machine and a container on the first.
    ecs.lazyAddMachines([[machine, container]]);
    var results = view._getAddMachines(ecs);
    assert.lengthOf(results, 3);
    assert.deepEqual(results[0], machine);
    assert.deepEqual(results[1], machine);
    assert.deepEqual(results[2], container);
  });
});
