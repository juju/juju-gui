/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentBar = require('./deployment-bar');
const DeploymentBarNotification = require('./notification/notification');
const GenericButton = require('../generic-button/generic-button');

describe('DeploymentBar', function() {
  var acl, previousNotifications;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentBar
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      currentChangeSet={options.currentChangeSet || {}}
      generateChangeDescription={options.generateChangeDescription || sinon.stub()}
      hasEntities={
        options.hasEntities === undefined ? true : options.hasEntities}
      modelCommitted={
        options.modelCommitted === undefined ? false : options.modelCommitted}
      sendAnalytics={options.sendAnalytics || sinon.stub()} />
  );

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
    const wrapper = renderComponent({ currentChangeSet });
    var expected = (
      <div className="deployment-bar">
        <DeploymentBarNotification
          change={null} />
        <div className="deployment-bar__deploy">
          <GenericButton
            action={wrapper.find('GenericButton').prop('action')}
            disabled={false}
            type="inline-deployment">
            Deploy changes (2)
          </GenericButton>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('enables the button if there are changes', function() {
    var currentChangeSet = {one: 1, two: 2};
    const wrapper = renderComponent({
      currentChangeSet,
      hasEntities: false
    });
    assert.isFalse(wrapper.find('GenericButton').prop('disabled'));
  });

  it('disables the button if there are no changes', function() {
    const wrapper = renderComponent({
      hasEntities: false
    });
    assert.isTrue(wrapper.find('GenericButton').prop('disabled'));
  });

  it('passes the button the correct title if there are commits', function() {
    const wrapper = renderComponent({
      hasEntities: false,
      modelCommitted: true
    });
    assert.equal(
      wrapper.find('GenericButton').children().text(),
      'Commit changes (0)');
  });

  it('can display a notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var generateChangeDescription = sinon.stub().returns(change);
    const wrapper = renderComponent({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    // Re-render the component so that componentWillReceiveProps is called.
    wrapper.setProps({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    const notification = wrapper.find('DeploymentBarNotification');
    assert.equal(notification.length, 1);
    assert.deepEqual(notification.prop('change'), change);
    assert.equal(generateChangeDescription.args[0][0], 'add-services-change');
  });


  it('can display a new notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var generateChangeDescription = sinon.stub().returns(change);
    const wrapper = renderComponent({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    // Re-render the component so that componentWillReceiveProps is called.
    wrapper.setProps({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    let notification = wrapper.find('DeploymentBarNotification');
    assert.equal(notification.length, 1);
    assert.deepEqual(notification.prop('change'), change);
    // Re-render with the new props.
    change = {change: 'added-unit-1'};
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    wrapper.setProps({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    notification = wrapper.find('DeploymentBarNotification');
    assert.equal(notification.length, 1);
    assert.deepEqual(notification.prop('change'), change);
  });

  it('does not display a previously displayed notification', function() {
    var change = {change: 'add-services-1'};
    var currentChangeSet = {'add-services-1': 'add-services-change'};
    var generateChangeDescription = sinon.stub().returns(change);
    const wrapper = renderComponent({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    // Re-render the component so that componentWillReceiveProps is called.
    wrapper.setProps({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    let notification = wrapper.find('DeploymentBarNotification');
    assert.equal(notification.length, 1);
    assert.deepEqual(notification.prop('change'), change);
    // Re-render with the new props.
    change = {change: 'added-unit-1'};
    currentChangeSet['added-unit-1'] = 'added-unit-change';
    generateChangeDescription.returns(change);
    wrapper.setProps({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    notification = wrapper.find('DeploymentBarNotification');
    assert.equal(notification.length, 1);
    assert.deepEqual(notification.prop('change'), change);
    // Remove the last change and check that the notification does not update.
    delete currentChangeSet['added-unit-1'];
    generateChangeDescription.returns('add-services-change');
    wrapper.setProps({
      currentChangeSet,
      generateChangeDescription,
      hasEntities: false
    });
    notification = wrapper.find('DeploymentBarNotification');
    assert.equal(notification.length, 1);
    assert.deepEqual(notification.prop('change'), change);
  });

  it('disables the deploy button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var currentChangeSet = {one: 1, two: 2};
    const wrapper = renderComponent({
      acl,
      currentChangeSet
    });
    var expected = (
      <div className="deployment-bar__read-only">
        Read only
      </div>);
    assert.compareJSX(wrapper.find('.deployment-bar__read-only'), expected);
    assert.equal(wrapper.find('GenericButton').length, 0);
  });

  it('calls the deploy method when the deploy button is pressed', () =>{
    const sendAnalytics = sinon.stub();
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      sendAnalytics,
      changeState
    });
    wrapper.find('GenericButton').props().action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {gui: { deploy: ''}});
    assert.equal(sendAnalytics.callCount, 1);
    assert.equal(sendAnalytics.args[0][0], 'Deployment Flow');
    assert.equal(sendAnalytics.args[0][1], 'Button click');
    assert.equal(sendAnalytics.args[0][2], 'deploy');
  });
});
