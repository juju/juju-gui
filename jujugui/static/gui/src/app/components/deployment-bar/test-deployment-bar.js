/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentBar = require('./deployment-bar');
const DeploymentBarNotification = require('./notification/notification');
const GenericButton = require('../generic-button/generic-button');
const Panel = require('../panel/panel');

const jsTestUtils = require('../../utils/component-test-utils');

describe('DeploymentBar', function() {
  var acl, previousNotifications;

  beforeEach(function() {
    previousNotifications = DeploymentBar.prototype.previousNotifications;
    DeploymentBar.prototype.previousNotifications = [];
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  afterEach(function() {
    DeploymentBar.prototype.previousNotifications = previousNotifications;
  });

  it('can render and pass the correct props', function() {
    var currentChangeSet = {one: 1, two: 2};
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={sinon.stub()}
        hasEntities={true}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <Panel
        instanceName="deployment-bar-panel"
        visible={true}>
        <div className="deployment-bar">
          <DeploymentBarNotification
            change={null} />
          <div className="deployment-bar__deploy">
            <GenericButton
              action={instance._deployAction}
              type="inline-deployment"
              disabled={false}>
              Deploy changes (2)
            </GenericButton>
          </div>
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('enables the button if there are changes', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        generateChangeDescription={sinon.stub()}
        hasEntities={false}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />);
    assert.isFalse(
      output.props.children.props.children[1].props.children.props.disabled);
  });

  it('disables the button if there are no changes', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction}
        generateChangeDescription={sinon.stub()}
        hasEntities={false}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />);
    assert.isTrue(
      output.props.children.props.children[1].props.children.props.disabled);
  });

  it('passes the button the correct title if there are commits', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        generateChangeDescription={sinon.stub()}
        modelCommitted={true}
        sendAnalytics={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    assert.equal(
      output.props.children.props.children[1].props.children.props.children,
      'Commit changes (0)');
  });

  it('can display a notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[0]).toEqualJSX(
      <DeploymentBarNotification
        change={change} />);
    assert.equal(generateChangeDescription.args[0][0], 'add-services-change');
  });


  it('can display a new notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[0]).toEqualJSX(
      <DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = {change: 'added-unit-1'};
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[0]).toEqualJSX(
      <DeploymentBarNotification
        change={change} />);
  });

  it('does not display a previously displayed notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var deployButtonAction = sinon.stub();
    var generateChangeDescription = sinon.stub().returns(change);
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    // Re-render the component so that componentWillReceiveProps is called.
    renderer.render(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[0]).toEqualJSX(
      <DeploymentBarNotification
        change={change} />);
    // Re-render with the new props.
    change = {change: 'added-unit-1'};
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    renderer.render(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[0]).toEqualJSX(
      <DeploymentBarNotification
        change={change} />);
    // Remove the last change and check that the notification does not update.
    delete currentChangeSet['added-unit-1'];
    generateChangeDescription.returns('add-services-change');
    renderer.render(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        hasEntities={false}
        deployButtonAction={deployButtonAction}
        modelCommitted={false}
        services={[]}
        sendAnalytics={sinon.stub()} />);
    output = renderer.getRenderOutput();
    expect(output.props.children.props.children[0]).toEqualJSX(
      <DeploymentBarNotification
        change={change} />);
  });

  it('disables the deploy button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var currentChangeSet = {one: 1, two: 2};
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={sinon.stub()}
        currentChangeSet={currentChangeSet}
        generateChangeDescription={sinon.stub()}
        hasEntities={true}
        modelCommitted={false}
        sendAnalytics={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-bar__read-only">
        Read only
      </div>);
    expect(output.props.children.props.children[1]).toEqualJSX(expected);
  });

  it('calls the deploy method when the deploy button is pressed', () =>{
    const sendAnalytics = sinon.stub();
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentBar
        acl={acl}
        changeState={changeState}
        currentChangeSet={{}}
        generateChangeDescription={sinon.stub()}
        hasEntities={true}
        modelCommitted={false}
        sendAnalytics={sendAnalytics} />, true);
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
