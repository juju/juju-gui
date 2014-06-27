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
  var Y, container, dbObj, ECS, ecs, mockEvent, testUtils, utils, views,
      view, View, bundleHelpers;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['deployer-bar',
                               'juju-views',
                               'juju-tests-utils',
                               'bundle-import-helpers',
                               'environment-change-set',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      ECS = Y.namespace('juju').EnvironmentChangeSet;
      View = views.DeployerBarView;
      bundleHelpers = Y.namespace('juju.BundleHelpers');
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
    window.clearTimeout(ecs.descriptionTimer);
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

  it('should increase changes when a service is added', function() {
    ecs.changeSet.abc123 = { foo: 'foo' };
    assert.equal(view._getChangeCount(ecs), 1);
  });

  it('should disabled the deploy button if there are no changes', function() {
    assert.equal(container.one('.deploy-button').hasClass('disabled'), true);
  });

  it('should enable the deploy button if there are changes', function() {
    ecs.lazyAddUnits(['django', 1]);
    assert.equal(container.one('.deploy-button').hasClass('disabled'), false);
  });

  it('should not show the summary panel when there are no changes', function() {
    container.one('.deploy-button').simulate('click');
    assert.equal(container.hasClass('summary-open'), false);
  });

  it('should show the summary panel when there are changes', function() {
    ecs.lazyAddUnits(['django', 1]);
    container.one('.deploy-button').simulate('click');
    assert.equal(container.hasClass('summary-open'), true);
  });

  it('can show a summary of uncommitted changes for deployment', function() {
    var changesStub = utils.makeStubMethod(view, '_getChangeCount', 0),
        deployStub = utils.makeStubMethod(view, '_getDeployedServices', []),
        relationsStub = utils.makeStubMethod(view, '_getAddRelations', []);
    this._cleanups.push(changesStub.reset);
    this._cleanups.push(deployStub.reset);
    this._cleanups.push(relationsStub.reset);
    view._showSummary();
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

  it('can open the recent changes in the summary panel', function() {
    var changesNode = container.one('.panel.summary .changes');
    var toggleNode = changesNode.one('.toggle');
    container.one('.deploy-button').simulate('click');
    assert.equal(changesNode.hasClass('open'), false,
        'The changes should initially be closed');
    toggleNode.simulate('click');
    assert.equal(changesNode.hasClass('open'), true,
        'The changes node should have had the open class added');
  });

  it('can hide the recent changes in the summary panel', function() {
    var changesNode = container.one('.panel.summary .changes');
    var toggleNode = changesNode.one('.toggle');
    container.one('.deploy-button').simulate('click');
    toggleNode.simulate('click');
    assert.equal(changesNode.hasClass('open'), true,
        'The changes should set to open');
    toggleNode.simulate('click');
    assert.equal(changesNode.hasClass('open'), false,
        'The changes node should have had the open class removed');
  });

  it('can show a list of recent changes', function() {
    var changesStub = utils.makeStubMethod(view,
        '_generateAllChangeDescriptions', []);
    this._cleanups.push(changesStub.reset);
    view._showChanges();
    assert.equal(container.hasClass('changes-open'), true,
        'Changes should be open.');
    assert.notEqual(container.one('.panel.changes'), null,
        'Summary panel HTML should be present.');
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

  it('can convert relation endpoints to their real names', function() {
    var args = [
      ['wordpress', {
        name: 'db',
        role: 'server'
      }],
      ['84882221$', {
        name: 'db',
        role: 'client'
      }],
      function() {}
    ];
    view.set('db', {
      services: new Y.ModelList()
    });
    view.get('db').services.add([
      { id: 'foobar' },
      { id: '84882221$', displayName: '(mysql)' },
      { id: 'wordpress', displayName: 'wordpress' }
    ]);
    var services = view._getRealRelationEndpointNames(args);
    assert.deepEqual(services, ['mysql', 'wordpress']);
  });

  it('can generate descriptions for any change type', function() {
    var tests = [{
      icon: 'changes-service-added',
      msg: ' bar has been added.',
      change: {
        command: {
          method: '_deploy',
          args: ['foo', 'bar']
        }
      }
    }, {
      icon: 'changes-service-added',
      msg: ' 1 foo unit has been added.',
      change: {
        command: {
          method: '_add_unit',
          args: ['foo', 1]
        }
      }
    }, {
      icon: 'changes-service-added',
      msg: ' 2 foo units have been added.',
      change: {
        command: {
          method: '_add_unit',
          args: ['foo', 2]
        }
      }
    }, {
      icon: 'changes-relation-added',
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
      icon: 'changes-container-created',
      msg: '1 container has been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{ parentId: 1 }]]
        }
      }
    }, {
      icon: 'changes-container-created',
      msg: '2 containers have been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{ parentId: 1 }, { parentId: 1 }]]
        }
      }
    }, {
      icon: 'changes-machine-created',
      msg: '1 machine has been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{}]]
        }
      }
    }, {
      icon: 'changes-machine-created',
      msg: '2 machines have been added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{}, {}]]
        }
      }
    }, {
      icon: 'changes-config-changed',
      msg: 'Configuration values changed for foo.',
      change: {
        command: {
          method: '_set_config',
          args: ['foo']
        }
      }
    }, {
      icon: 'changes-service-exposed',
      msg: 'An unknown change has been made to this enviroment via the CLI.',
      change: {
        command: {
          method: '_anUnknownMethod'
        }
      }
    }];
    // This method needs to be stubbed out for the add relation path.
    var endpointNames = utils.makeStubMethod(
        view, '_getRealRelationEndpointNames', ['foo', 'baz']);
    this._cleanups.push(endpointNames.reset);
    tests.forEach(function(test) {
      var change = view._generateChangeDescription(test.change, true);
      assert.equal(change.icon, test.icon);
      assert.equal(change.description, test.msg);
      assert.equal(change.time, '00:00');
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

  it('retrieves all the unit changes', function() {
    ecs.lazyAddUnits(['django', 1]);
    ecs.lazyAddUnits(['rails', 2]);
    var results = view._getChanges(ecs).addUnits;
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

  it('retrieves all the machine changes', function() {
    var machine = {};
    ecs.lazyAddMachines([[machine]], { modelId: 'new-0' });
    var container = {
      parentId: 'new-0', containerType: 'lxc'
    };
    // Add a second machine and a container on the first.
    ecs.lazyAddMachines([[machine]], { modelId: 'new-1' });
    ecs.lazyAddMachines([[container]], { modelId: 'new-2' });
    var results = view._getChanges(ecs).addMachines;
    assert.lengthOf(results, 3);
    assert.deepEqual(results[0], machine);
    assert.deepEqual(results[1], machine);
    assert.deepEqual(results[2], container);
  });

  it('can export the environment', function() {
    var exportStub = utils.makeStubMethod(bundleHelpers, 'exportYAML');
    this._cleanups.push(exportStub.reset);
    container.one('.export').simulate('click');
    assert.equal(exportStub.calledOnce(), true,
        'exportYAML should have been called');
  });

  it('can open the import file dialogue', function() {
    // The file input is hidden and the dialogue is opened by a
    // javascript click event. Stubbing out the click so we can test
    // that it is called.
    var clickStub = utils.makeStubMethod(container.one(
        '.import-file').getDOMNode(), 'click');
    this._cleanups.push(clickStub.reset);
    container.one('.import').simulate('click');
    assert.equal(clickStub.calledOnce(), true,
        'the file input should have been clicked');
  });

  it('can import a bundle file', function() {
    var importStub = utils.makeStubMethod(bundleHelpers, 'deployBundleFiles');
    this._cleanups.push(importStub.reset);
    container.one('.import-file').simulate('change');
    assert.equal(importStub.calledOnce(), true,
        'deployBundleFiles should have been called');
  });

  it('can set the height mode to small', function() {
    assert.equal(container.hasClass('mode-min'), false);
    container.one('.action-list .min').simulate('click');
    assert.equal(container.hasClass('mode-min'), true);
  });

  it('can set the height mode to medium', function() {
    assert.equal(container.hasClass('mode-mid'), false);
    container.one('.action-list .mid').simulate('click');
    assert.equal(container.hasClass('mode-mid'), true);
  });

  it('can set the height mode to large', function() {
    assert.equal(container.hasClass('mode-max'), false);
    container.one('.action-list .max').simulate('click');
    assert.equal(container.hasClass('mode-max'), true);
  });

  it('changes the deploy label after the first deploy', function() {
    var deployButton = container.one('.deploy-button');
    assert.equal(deployButton.get('text').trim(), 'Deploy');
    view.deploy({halt: utils.makeStubFunction()});
    assert.equal(deployButton.get('text').trim(), 'Commit');
  });

  it('shows the commit label after deploy and re-render', function() {
    var deployButton = container.one('.deploy-button');
    view.deploy({halt: utils.makeStubFunction()});
    assert.equal(deployButton.get('text').trim(), 'Commit');
    view.render();
    assert.equal(deployButton.get('text').trim(), 'Commit');
  });
});
