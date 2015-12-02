/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('EntityHeader', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-header', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders an entity properly', function() {
    var output = testUtils.renderIntoDocument(
        <juju.components.EntityHeader
          deployService={sinon.spy()}
          changeState={sinon.spy()}
          entityModel={mockEntity} />);

    var entity = output.props.entityModel.toEntity();
    assert.equal(entity.displayName, output.refs.entityHeaderTitle.textContent,
                 'rendered name does not match entity name');
    assert.equal(entity.owner, output.refs.entityHeaderBy.textContent,
                 'rendered owner does not match entity owner');
  });

  it('displays an add to canvas button', function() {
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        entityModel={mockEntity}
        changeState={sinon.spy()}
        deployService={sinon.spy()} />);
    var deployButton = output.refs.deployButton;
    assert.equal(deployButton.props.type, 'confirm');
    assert.equal(deployButton.props.title, 'Add to canvas');
  });

  it('adds a charm when the add button is clicked', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var importBundleYAML = sinon.stub();
    var getBundleYAML = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        deployService={deployService}
        changeState={changeState}
        entityModel={mockEntity} />);
    var deployButton = output.refs.deployButton;
    // Simulate a click.
    deployButton.props.action();
    assert.equal(deployService.callCount, 1);
    assert.equal(deployService.args[0][0], mockEntity);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: null
      }
    });
  });

  it('adds a bundle when the add button is clicked', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, null, 'mock yaml');
    var importBundleYAML = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity} />);
    var deployButton = output.refs.deployButton;
    // Simulate a click.
    deployButton.props.action();
    assert.equal(getBundleYAML.callCount, 1);
    assert.equal(getBundleYAML.args[0][0], 'django-cluster');
    assert.equal(importBundleYAML.callCount, 1);
    assert.deepEqual(importBundleYAML.args[0][0], 'mock yaml');
  });

  it('displays a notification if there is a bundle deploy error', function() {
    var deployService = sinon.stub();
    var changeState = sinon.stub();
    var getBundleYAML = sinon.stub().callsArgWith(1, 'error');
    var importBundleYAML = sinon.stub();
    var addNotification = sinon.stub();
    var entity = jsTestUtils.makeEntity(true);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityHeader
        importBundleYAML={importBundleYAML}
        getBundleYAML={getBundleYAML}
        deployService={deployService}
        changeState={changeState}
        entityModel={entity}
        addNotification={addNotification} />);
    var deployButton = output.refs.deployButton;
    // Simulate a click.
    deployButton.props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(
      addNotification.args[0][0].title, 'Bundle failed to deploy');
  });
});
