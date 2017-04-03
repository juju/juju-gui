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
  var acl, previousNotifications;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-bar', function() { done(); });
  });

  beforeEach(function() {
    var DeploymentBar = juju.components.DeploymentBar;
    previousNotifications = DeploymentBar.prototype.previousNotifications;
    juju.components.DeploymentBar.prototype.previousNotifications = [];
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  afterEach(function() {
    var DeploymentBar = juju.components.DeploymentBar;
    DeploymentBar.prototype.previousNotifications = previousNotifications;
  });

  it('can render and pass the correct props', function() {
    var currentChangeSet = {one: 1, two: 2};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={sinon.stub()}
        hasEntities={true}
        modelCommitted={false}
        showInstall={true} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.Panel
        instanceName="deployment-bar-panel"
        visible={true}>
        <div className="deployment-bar">
          <a className="button--inline-neutral"
            href="https://jujucharms.com/get-started"
            target="_blank">
            Install Juju
          </a>
          <juju.components.DeploymentBarNotification
            change={null} />
          <div className="deployment-bar__deploy">
            <juju.components.GenericButton
              action={instance._deployAction}
              type="inline-deployment"
              disabled={false}
              title="Deploy changes (2)" />
          </div>
        </div>
      </juju.components.Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without the install button', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        generateChangeDescription={sinon.stub()}
        hasEntities={false}
        modelCommitted={false}
        showInstall={false} />);
    assert.isUndefined(output.props.children.props.children[0]);
  });

  it('enables the button if there are changes', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        generateChangeDescription={sinon.stub()}
        hasEntities={false}
        modelCommitted={false}
        showInstall={true} />);
    assert.isFalse(
      output.props.children.props.children[2].props.children.props.disabled);
  });

  it('disables the button if there are no changes', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        generateChangeDescription={sinon.stub()}
        hasEntities={false}
        modelCommitted={false}
        showInstall={true} />);
    assert.isTrue(
      output.props.children.props.children[2].props.children.props.disabled);
  });

  it('passes the button the correct title if there are commits', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        generateChangeDescription={sinon.stub()}
        modelCommitted={true}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    assert.equal(
      output.props.children.props.children[2].props.children.props.title,
      'Commit changes (0)');
  });

  it('can display a notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[1]).toEqualJSX(
      <juju.components.DeploymentBarNotification
        change={change} />);
    assert.equal(generateChangeDescription.args[0][0], 'add-services-change');
  });


  it('can display a new notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[1]).toEqualJSX(
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = {change: 'added-unit-1'};
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[1]).toEqualJSX(
      <juju.components.DeploymentBarNotification
        change={change} />);
  });

  it('does not display a previously displayed notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[1]).toEqualJSX(
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = {change: 'added-unit-1'};
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[1]).toEqualJSX(
      <juju.components.DeploymentBarNotification
        change={change} />);
    // Remove the last change and check that the notification does not update.
    delete currentChangeSet['added-unit-1'];
    generateChangeDescription.returns('add-services-change');
    renderer.render(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        services={[]}
        showInstall={true} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[1]).toEqualJSX(
      <juju.components.DeploymentBarNotification
        change={change} />);
  });

  it('disables the deploy button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var currentChangeSet = {one: 1, two: 2};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={sinon.stub()}
        hasEntities={true}
        modelCommitted={false}
        showInstall={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-bar__read-only">
        Read only
      </div>);
    expect(output.props.children.props.children[2]).toEqualJSX(expected);
  });

  it('calls the deploy method when the deploy button is pressed', () =>{
    const sendAnalytics = sinon.stub();
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        acl={acl}
        changeState={changeState}
        currentChangeSet={sinon.stub()}
        generateChangeDescription={sinon.stub()}
        hasEntities={true}
        modelCommitted={false}
        sendAnalytics={sendAnalytics}
        showInstall={true} />, true);
    const instance = renderer.getMountedInstance();
    instance._deployAction();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {gui: { deploy: ''}});
    assert.equal(sendAnalytics.callCount, 1);
    assert.equal(sendAnalytics.args[0][0], 'Deployment Flow');
    assert.equal(sendAnalytics.args[0][1], 'Button click');
    assert.equal(sendAnalytics.args[0][2], 'deploy');
  });
});
