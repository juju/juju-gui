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
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        exportEnvironmentFile={exportEnvironmentFile}
        currentChangeSet={currentChangeSet}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-bar" />);

    assert.deepEqual(output, <div className="deployment-view">
      <juju.components.DeploymentBar
        hasCommits={false}
        deployButtonAction={output.props.children.props.deployButtonAction}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet} />
    </div>);
  });

  it('displays the deployment bar by default', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet} />);
    assert.deepEqual(output,
      <div className="deployment-view">
        <juju.components.DeploymentBar
          exportEnvironmentFile={exportEnvironmentFile}
          hasCommits={false}
          renderDragOverNotification={renderDragOverNotification}
          importBundleFile={importBundleFile}
          hideDragOverNotification={hideDragOverNotification}
          generateChangeDescription={generateChangeDescription}
          deployButtonAction={output.props.children.props.deployButtonAction}
          currentChangeSet={currentChangeSet} />
      </div>);
  });

  it('tracks that it has commits after the first deploy', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-summary"
        currentChangeSet={currentChangeSet}
        autoPlaceUnits={autoPlaceUnits} />, true);
    var output = shallowRenderer.getRenderOutput();
    output.props.children.props.deployButtonAction();
    shallowRenderer.render(
      <juju.components.Deployment
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-bar"
        currentChangeSet={currentChangeSet} />);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="deployment-view">
        <juju.components.DeploymentBar
          exportEnvironmentFile={exportEnvironmentFile}
          hasCommits={true}
          renderDragOverNotification={renderDragOverNotification}
          importBundleFile={importBundleFile}
          hideDragOverNotification={hideDragOverNotification}
          generateChangeDescription={generateChangeDescription}
          deployButtonAction={output.props.children.props.deployButtonAction}
          currentChangeSet={currentChangeSet} />
      </div>);
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
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        services={services}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-summary"
        currentChangeSet={currentChangeSet} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.Deployment
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        services={services}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-bar"
        currentChangeSet={currentChangeSet} />);
    output = shallowRenderer.getRenderOutput();
    var expected = (
      <div className="deployment-view">
        <juju.components.DeploymentBar
          exportEnvironmentFile={exportEnvironmentFile}
          hasCommits={true}
          renderDragOverNotification={renderDragOverNotification}
          importBundleFile={importBundleFile}
          hideDragOverNotification={hideDragOverNotification}
          generateChangeDescription={generateChangeDescription}
          deployButtonAction={output.props.children.props.deployButtonAction}
          currentChangeSet={currentChangeSet} />
      </div>);
    assert.deepEqual(output, expected);
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
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsClear={ecsClear}
        currentChangeSet={currentChangeSet}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        changeDescriptions={changeDescriptions}
        exportEnvironmentFile={exportEnvironmentFile}
        getUnplacedUnitCount={getUnplacedUnitCount}
        activeComponent="deployment-summary" />);
    assert.deepEqual(output,
      <div className="deployment-view">
        <juju.components.DeploymentSummary
          summaryClearAction={output.props.children.props.summaryClearAction}
          deployButtonAction={output.props.children.props.deployButtonAction}
          closeButtonAction={output.props.children.props.closeButtonAction}
          changeDescriptions={changeDescriptions}
          handleViewMachinesClick={
              output.props.children.props.handleViewMachinesClick}
          handlePlacementChange={
              output.props.children.props.handlePlacementChange}
          autoPlace={true}
          getUnplacedUnitCount={getUnplacedUnitCount} />
      </div>);
  });

  it('can pass updated props to the components', function() {
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var newChangeSet = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var services = [];
    var renderDragOverNotification = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        services={services}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-summary"
        currentChangeSet={currentChangeSet} />, true);
    var output = shallowRenderer.getRenderOutput();
    shallowRenderer.render(
      <juju.components.Deployment
        ecsCommit={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        services={services}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-bar"
        currentChangeSet={newChangeSet} />);
    output = shallowRenderer.getRenderOutput();
    var expected = (
      <div className="deployment-view">
        <juju.components.DeploymentBar
          hasCommits={false}
          exportEnvironmentFile={exportEnvironmentFile}
          renderDragOverNotification={renderDragOverNotification}
          importBundleFile={importBundleFile}
          hideDragOverNotification={hideDragOverNotification}
          generateChangeDescription={generateChangeDescription}
          deployButtonAction={output.props.children.props.deployButtonAction}
          currentChangeSet={newChangeSet} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can commit to ecs changes', function() {
    var ecsCommit = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var changeDescriptions = {};
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsCommit={ecsCommit}
        exportEnvironmentFile={exportEnvironmentFile}
        autoPlaceUnits={autoPlaceUnits}
        currentChangeSet={currentChangeSet}
        changeDescriptions={changeDescriptions}
        getUnplacedUnitCount={getUnplacedUnitCount}
        activeComponent="deployment-summary" />);
    output.props.children.props.deployButtonAction();
    assert.equal(ecsCommit.callCount, 1);
    assert.equal(autoPlaceUnits.callCount, 1);
  });

  it('can automatically place units on commit', function() {
    var ecsCommit = sinon.stub();
    var autoPlaceUnits = sinon.stub();
    var currentChangeSet = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var getUnplacedUnitCount = sinon.stub();
    var changeDescriptions = {};
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsCommit={ecsCommit}
        exportEnvironmentFile={exportEnvironmentFile}
        autoPlaceUnits={autoPlaceUnits}
        currentChangeSet={currentChangeSet}
        changeDescriptions={changeDescriptions}
        getUnplacedUnitCount={getUnplacedUnitCount}
        activeComponent="deployment-summary" />);
    output.props.children.props.handlePlacementChange({
      currentTarget: {
        getAttribute: sinon.stub().returns('placed')
      }
    });
    output.props.children.props.deployButtonAction();
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
    var changeDescriptions = {};
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsCommit={ecsCommit}
        exportEnvironmentFile={exportEnvironmentFile}
        changeState={changeState}
        autoPlaceUnits={autoPlaceUnits}
        currentChangeSet={currentChangeSet}
        changeDescriptions={changeDescriptions}
        generateChangeDescription={generateChangeDescription}
        getUnplacedUnitCount={getUnplacedUnitCount}
        activeComponent="deployment-summary" />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    output.props.children.props.handleViewMachinesClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionB: {
        component: 'machine',
        metadata: {}
      }
    });
    // The deployment summary should have been closed.
    assert.equal(instance.state.activeComponent, 'deployment-bar');
  });
});
