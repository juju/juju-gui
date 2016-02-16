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

describe('DeploymentBar', function() {
  var previousNotifications;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-bar', function() { done(); });
  });

  beforeEach(function() {
    var DeploymentBar = juju.components.DeploymentBar;
    previousNotifications = DeploymentBar.prototype.previousNotifications;
    juju.components.DeploymentBar.prototype.previousNotifications = [];
  });

  afterEach(function() {
    var DeploymentBar = juju.components.DeploymentBar;
    DeploymentBar.prototype.previousNotifications = previousNotifications;
  });

  it('can render and pass the correct props', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var services = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.Panel
        instanceName="deployment-bar-panel"
        visible={true}>
        <div className="deployment-bar deployment-bar--initial">
          <span className="deployment-bar__import link"
            onClick={instance._handleImportClick}
            role="button"
            tabIndex="0">
            Import
          </span>
          <span className="deployment-bar__export link"
            onClick={instance._handleExport}
            role="button"
            tabIndex="0">
            Export
          </span>
          <input className="deployment-bar__file"
            type="file"
            onChange={instance._handleImportFile}
            accept=".zip,.yaml,.yml"
            ref="file-input" />
          <a className="deployment-bar__install-button"
            href="https://jujucharms.com/get-started"
            target="_blank">
            Install Juju
          </a>
          <juju.components.DeploymentBarNotification
            change={null} />
          <div className="deployment-bar__deploy">
            <juju.components.GenericButton
              action={deployButtonAction}
              type="blue"
              disabled={false}
              title="2" />
            <juju.components.GenericButton
              action={deployButtonAction}
              type="confirm"
              disabled={false}
              title="Deploy changes" />
          </div>
        </div>
      </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('can render without the install button', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var services = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={false} />);
    assert.isUndefined(output.props.children.props.children[3]);
  });

  it('enables the button if there are changes', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var services = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    assert.deepEqual(output.props.children.props.children[5].props.children[1],
        <juju.components.GenericButton
          action={deployButtonAction}
          type="confirm"
          disabled={false}
          title="Deploy changes" />);
  });

  it('can export the env', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var services = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={exportEnvironmentFile}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    output.props.children.props.children[1].props.onClick();
    assert.equal(exportEnvironmentFile.callCount, 1);
  });

  it('can open the file dialog when import is clicked', function() {
    var currentChangeSet = {one: 1, two: 2};
    var fileClick = sinon.stub();
    var importBundleFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var deployButtonAction = sinon.stub();
    var services = [];
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        hasCommits={false}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        services={services}
        showInstall={true} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {'file-input': {click: fileClick}};
    var output = shallowRenderer.getRenderOutput();
    output.props.children.props.children[0].props.onClick();
    assert.equal(fileClick.callCount, 1);
  });

  it('can get a file when a file is selected', function() {
    var currentChangeSet = {one: 1, two: 2};
    var importBundleFile = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var deployButtonAction = sinon.stub();
    var services = [];
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        hasCommits={false}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet}
        services={services}
        showInstall={true} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {
      'file-input': {files: ['apache2.yaml']},
    };
    var output = shallowRenderer.getRenderOutput();
    output.props.children.props.children[2].props.onChange();
    assert.equal(importBundleFile.callCount, 1);
    assert.equal(importBundleFile.args[0][0], 'apache2.yaml');
  });

  it('disables the button if there are no changes', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var services = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    assert.deepEqual(output.props.children.props.children[5].props.children[1],
        <juju.components.GenericButton
          action={deployButtonAction}
          type="confirm"
          disabled={true}
          title="Deploy changes" />);
  });

  it('passes the button the correct title if there are commits', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var services = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        hasCommits={true}
        deployButtonAction={deployButtonAction}
        exportEnvironmentFile={sinon.stub()}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    assert.deepEqual(output.props.children.props.children[5].props.children[1],
        <juju.components.GenericButton
          action={deployButtonAction}
          type="confirm"
          disabled={true}
          title="Commit changes" />);
  });

  it('can display a notification', function() {
    var change = 'add-services-1';
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var services = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children.props.children[4],
      <juju.components.DeploymentBarNotification
        change={change} />);
    assert.equal(generateChangeDescription.args[0][0], 'add-services-change');
  });


  it('can display a new notification', function() {
    var change = 'add-services-1';
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var services = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children.props.children[4],
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = 'added-unit-1';
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        importBundleFile={sinon.stub()}
        deployButtonAction={deployButtonAction}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children.props.children[4],
      <juju.components.DeploymentBarNotification
        change={change} />);
  });

  it('does not display a previously displayed notification', function() {
    var change = 'add-services-1';
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var services = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        importBundleFile={sinon.stub()}
        deployButtonAction={deployButtonAction}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        importBundleFile={sinon.stub()}
        deployButtonAction={deployButtonAction}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children.props.children[4],
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = 'added-unit-1';
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction}
        importBundleFile={sinon.stub()}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children.props.children[4],
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Remove the last change and check that the notification does not update.
    delete currentChangeSet['added-unit-1'];
    generateChangeDescription.returns('add-services-change');
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        exportEnvironmentFile={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        importBundleFile={sinon.stub()}
        deployButtonAction={deployButtonAction}
        renderDragOverNotification={sinon.stub()}
        services={services}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children.props.children[4],
      <juju.components.DeploymentBarNotification
        change={change} />);
  });
});
