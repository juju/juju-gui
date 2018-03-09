/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const NotificationListItem = require('./item');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('NotificationListItem', function() {

  it('renders a notification list item', () => {
    var message = 'notification message';
    var classes = 'notification-list-item notification-list-item--info ' +
      'notification-list-item--visible';
    var renderer = jsTestUtils.shallowRender(
      <NotificationListItem
        message={message}
        removeNotification={sinon.stub()}
        timestamp="123"
        type="info" />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <li className={classes}>
        <span>{message}</span>
        <span className="notification-list-item__hide" onClick={instance.hide}
          role="button"
          tabIndex="0">
          <SvgIcon name="close_16"
            size="16" />
        </span>
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('adds the proper type class to the container', () => {
    var classes = 'notification-list-item notification-list-item--error ' +
      'notification-list-item--visible';
    var output = jsTestUtils.shallowRender(
      <NotificationListItem
        message="message"
        removeNotification={sinon.stub()}
        timestamp="123"
        type="error" />);
    assert.equal(output.props.className, classes);
  });

  it('updates class and calls to remove itself after hiding', done => {
    var timestamp = '123456';
    var timeout = 1;
    var removeNotification = function(ts) {
      assert.equal(ts, timestamp);
      done();
    };
    var component = testUtils.renderIntoDocument(
      <NotificationListItem
        message="message"
        removeNotification={removeNotification}
        timeout={timeout}
        // Used to shorten the test time by setting the setTimeouts to 0.
        timestamp={timestamp}
        type="info" />);
    var element = ReactDOM.findDOMNode(component);
    // Check that it's rendered with the proper classes.
    assert.isTrue(
      element.classList.contains('notification-list-item--visible'));
    assert.isFalse(
      element.classList.contains('notification-list-item--hidden'));
    testUtils.Simulate.click(
      element.querySelector('.notification-list-item__hide'));
    // After a click it should have the classes updated.
    assert.isFalse(
      element.classList.contains('notification-list-item--visible'));
    assert.isTrue(
      element.classList.contains('notification-list-item--hidden'));
  });

});
