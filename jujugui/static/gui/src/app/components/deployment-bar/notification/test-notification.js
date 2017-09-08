/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const DeploymentBarNotification = require('./notification');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('DeploymentBarNotification', function() {
  var clearTimeout, setTimeout;

  beforeEach(function() {
    clearTimeout = window.clearTimeout;
    window.clearTimeout = sinon.stub();
    setTimeout = window.setTimeout;
    window.setTimeout = sinon.stub();
  });

  afterEach(function() {
    window.clearTimeout = clearTimeout;
    window.setTimeout = setTimeout;
  });

  it('can render a notification', function() {
    var change = {
      description: 'Django added'
    };
    var output = jsTestUtils.shallowRender(
      <DeploymentBarNotification
        change={change} />);
    assert.deepEqual(output,
      <div className="deployment-bar__notification"
        onClick={output.props.onClick}
        ref="deploymentBarNotificationContainer">
          Django added
      </div>);
  });

  it('can hide the notification when it is clicked', function() {
    var change = {
      id: 'service-added-1',
      description: 'Django added'
    };
    var output = jsTestUtils.shallowRender(
      <DeploymentBarNotification
        change={change} />);
    output.props.onClick();
    assert.deepEqual(output,
      <div className="deployment-bar__notification"
        onClick={output.props.onClick}
        ref="deploymentBarNotificationContainer">
          Django added
      </div>);
    assert.equal(window.clearTimeout.callCount, 1);
  });

  it('can show a notification for the provided change', function() {
    var change = {
      id: 'service-added-1',
      description: 'Django added'
    };
    // Have to render to the document here as the shallow renderer does not
    // support componentDidMount or componentWillReceiveProps.
    var output = testUtils.renderIntoDocument(
      <DeploymentBarNotification
        change={change} />);
    assert.isTrue(
      output.refs.deploymentBarNotificationContainer
        .classList.contains('deployment-bar__notification--visible'));
    assert.equal(window.clearTimeout.callCount, 1);
    assert.equal(window.setTimeout.callCount, 1);
  });

  it('does not show a notification more than once', function() {
    var change = {
      id: 'service-added-1',
      description: 'Django added'
    };
    // Have to render to the document here as the shallow renderer does not
    // support componentDidMount or componentWillReceiveProps.
    var node = document.createElement('div');
    var component = ReactDOM.render(
      <DeploymentBarNotification
        change={change} />, node);

    testUtils.Simulate.click(ReactDOM.findDOMNode(component));
    var container = component.refs.deploymentBarNotificationContainer;
    assert.equal(container.classList.length, 1);
    ReactDOM.render(
      <DeploymentBarNotification
        change={change} />, node);
    assert.equal(window.setTimeout.callCount, 1);
    assert.equal(container.classList.length, 1);
  });
});
