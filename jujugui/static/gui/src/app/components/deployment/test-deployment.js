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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Deployment', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-component', function() { done(); });
  });

  it('can display the deployment bar', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var services = [];
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        currentChangeSet={currentChangeSet}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        services={services}
        showInstall={true} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();

    assert.deepEqual(output, <div className="deployment-view">
      <juju.components.DeploymentBar
        hasCommits={false}
        deployButtonAction={instance._barDeployAction}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        showInstall={true} />
      <juju.components.DeploymentPanel
        buttons={undefined}
        closeButtonAction={instance._summaryCloseAction}
        steps={[{
          title: 'Deploy',
          active: false
        }]}
        visible={false}>
        {undefined}
      </juju.components.DeploymentPanel>
    </div>);
  });

  it('does not display the deployment panel by default', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var services = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        services={services}
        showInstall={true} />);
    assert.isFalse(output.props.children[1].props.visible, false);
  });

  it('tracks that it has commits after the first deploy', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var services = [];
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        autoPlaceUnits={autoPlaceUnits}
        services={services}
        showInstall={true} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    instance._summaryDeployAction();
    shallowRenderer.render(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        services={services}
        showInstall={true} />);
    var output = shallowRenderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentBar
        exportEnvironmentFile={exportEnvironmentFile}
        hasCommits={true}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        deployButtonAction={instance._barDeployAction}
        currentChangeSet={currentChangeSet}
        showInstall={true} />);
    assert.deepEqual(output.props.children[0], expected);
  });

  it('tracks that it has commits if existing non-pending service', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var services = [
      {get: sinon.stub().returns(true)},
      {get: sinon.stub().returns(false)}
    ];
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        services={services}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        showInstall={true} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        services={services}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        showInstall={true} />);
    output = shallowRenderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentBar
        exportEnvironmentFile={exportEnvironmentFile}
        hasCommits={true}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        deployButtonAction={instance._barDeployAction}
        currentChangeSet={currentChangeSet}
        showInstall={true} />);
    assert.deepEqual(output.props.children[0], expected);
  });

  it('can display the deployment summary', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var ecsClear = sinon.stub();
    var changeDescriptions = {};
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={ecsClear}
        currentChangeSet={currentChangeSet}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hasEntities={false}
        hideDragOverNotification={hideDragOverNotification}
        changeDescriptions={changeDescriptions}
        exportEnvironmentFile={exportEnvironmentFile}
        getUnplacedUnitCount={getUnplacedUnitCount}
        showInstall={true} />, true);
    var instance = renderer.getMountedInstance();
    // Display the panel.
    instance._barDeployAction();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSummary
        changeDescriptions={changeDescriptions}
        handleViewMachinesClick={instance.handleViewMachinesClick}
        handlePlacementChange={instance.handlePlacementChange}
        autoPlace={true}
        getUnplacedUnitCount={getUnplacedUnitCount} />);
    assert.deepEqual(output.props.children[1].props.children, expected);
  });

  it('can commit to ecs changes', function() {
    var ecsCommit = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var importBundleFile = sinon.stub();
    var changeDescriptions = {};
    var renderDragOverNotification = sinon.stub();
    var services = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        ecsCommit={ecsCommit}
        exportEnvironmentFile={exportEnvironmentFile}
        autoPlaceUnits={autoPlaceUnits}
        currentChangeSet={currentChangeSet}
        changeDescriptions={changeDescriptions}
        getUnplacedUnitCount={getUnplacedUnitCount}
        hasEntities={false}
        importBundleFile={importBundleFile}
        renderDragOverNotification={renderDragOverNotification}
        services={services}
        showInstall={true} />, true);
    var instance = renderer.getMountedInstance();
    // Display the panel.
    instance._barDeployAction();
    var output = renderer.getRenderOutput();
    output.props.children[1].props.buttons[1].action();
    assert.equal(ecsCommit.callCount, 1);
    assert.equal(autoPlaceUnits.callCount, 1);
  });

  it('can automatically place units on commit', function() {
    var ecsCommit = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var importBundleFile = sinon.stub();
    var changeDescriptions = {};
    var renderDragOverNotification = sinon.stub();
    var services = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        ecsCommit={ecsCommit}
        exportEnvironmentFile={exportEnvironmentFile}
        autoPlaceUnits={autoPlaceUnits}
        currentChangeSet={currentChangeSet}
        changeDescriptions={changeDescriptions}
        getUnplacedUnitCount={getUnplacedUnitCount}
        hasEntities={false}
        importBundleFile={importBundleFile}
        renderDragOverNotification={renderDragOverNotification}
        services={services}
        showInstall={true} />, true);
    var instance = renderer.getMountedInstance();
    // Display the panel.
    instance._barDeployAction();
    var output = renderer.getRenderOutput();
    output.props.children[1].props.children.props.handlePlacementChange({
      currentTarget: {
        getAttribute: sinon.stub().returns('placed')
      }
    });
    output.props.children[1].props.buttons[1].action();
    assert.equal(autoPlaceUnits.callCount, 1);
  });

  it('can handle navigating to the machine view', function() {
    var ecsCommit = sinon.stub();
    var changeState = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var importBundleFile = sinon.stub();
    var changeDescriptions = {};
    var renderDragOverNotification = sinon.stub();
    var services = [];
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={sinon.stub()}
        ecsCommit={ecsCommit}
        exportEnvironmentFile={exportEnvironmentFile}
        changeState={changeState}
        autoPlaceUnits={autoPlaceUnits}
        currentChangeSet={currentChangeSet}
        changeDescriptions={changeDescriptions}
        generateChangeDescription={generateChangeDescription}
        getUnplacedUnitCount={getUnplacedUnitCount}
        hasEntities={false}
        importBundleFile={importBundleFile}
        renderDragOverNotification={renderDragOverNotification}
        services={services}
        showInstall={true} />, true);
    var instance = shallowRenderer.getMountedInstance();
    // Display the panel.
    instance._barDeployAction();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children.props.handleViewMachinesClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionB: {
        component: 'machine',
        metadata: {}
      }
    });
    // The deployment summary should have been closed.
    assert.isNull(instance.state.activeComponent);
  });
});
