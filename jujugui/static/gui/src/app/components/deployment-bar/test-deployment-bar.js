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
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction} />);
    assert.deepEqual(output,
      <juju.components.Panel
        instanceName="deployment-bar-panel"
        visible={true}>
        <juju.components.DeploymentBarNotification
          change={null} />
        <juju.components.GenericButton
          action={deployButtonAction}
          type="blue"
          disabled={false}
          title={2} />
        <juju.components.GenericButton
          action={deployButtonAction}
          type="confirm"
          disabled={false}
          title="Deploy changes" />
      </juju.components.Panel>);
  });

  it('enables the button if there are changes', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction} />);
    assert.deepEqual(output.props.children[2],
        <juju.components.GenericButton
          action={deployButtonAction}
          type="confirm"
          disabled={false}
          title="Deploy changes" />);
  });

  it('disables the button if there are no changes', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction} />);
    assert.deepEqual(output.props.children[2],
        <juju.components.GenericButton
          action={deployButtonAction}
          type="confirm"
          disabled={true}
          title="Deploy changes" />);
  });

  it('passes the button the correct title if there are commits', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />);
    assert.deepEqual(output.props.children[2],
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
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.DeploymentBarNotification
        change={change} />);
    assert.equal(generateChangeDescription.args[0][0], 'add-services-change');
  });


  it('can display a new notification', function() {
    var change = 'add-services-1';
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = 'added-unit-1';
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.DeploymentBarNotification
        change={change} />);
  });

  it('does not display a previously displayed notification', function() {
    var change = 'add-services-1';
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = 'added-unit-1';
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Remove the last change and check that the notification does not update.
    delete currentChangeSet['added-unit-1'];
    generateChangeDescription.returns('add-services-change');
    renderer.render(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasCommits={true}
        deployButtonAction={deployButtonAction} />);
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.DeploymentBarNotification
        change={change} />);
  });
});
