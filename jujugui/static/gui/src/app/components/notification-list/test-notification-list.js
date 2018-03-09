/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const NotificationList = require('./notification-list');
const NotificationListItem = require('./item/item');

const jsTestUtils = require('../../utils/component-test-utils');

describe('NotificationList', function() {

  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('renders a list based on the notification passed in', () => {
    const notification = {
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    const renderer = jsTestUtils.shallowRender(
      <NotificationList
        notification={notification} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const children = output.props.children;
    const items = [
      <NotificationListItem
        key={notification.timestamp}
        message={notification.message}
        ref={'NotificationListItem' + notification.timestamp}
        removeNotification={children[0].props.removeNotification}
        timeout={undefined}
        timestamp={notification.timestamp}
        type={notification.level} />];
    const expected = (
      <ul className="notification-list"
        onMouseOut={instance._restartTimeouts}
        onMouseOver={instance._clearTimeouts}>
        {items}
      </ul>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can render with no notifications', () => {
    const output = jsTestUtils.shallowRender(
      <NotificationList
        notification={null} />);
    assert.strictEqual(output.props.children[0], undefined);
  });

  it('can render notifications after rendering none', () => {
    const renderer = jsTestUtils.shallowRender(
      <NotificationList
        notification={null} />, true);
    const output = renderer.getRenderOutput();
    assert.strictEqual(output.props.children[0], undefined);
    const notification = {
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    renderer.render(
      <NotificationList
        notification={notification} />);
    const instance = renderer.getMountedInstance();
    // Updates to state don't re-render when using the shallow renderer
    // so just checking that the state gets updated.
    assert.deepEqual(instance.state, {
      notifications: {
        12345: {
          message: 'notification message',
          type: 'info',
          timestamp: '12345'
        }
      }
    });
  });

  it('times out non error messages', () => {
    const notification = {
      key: '12345',
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    const timeout = 500;
    const renderer = jsTestUtils.shallowRender(
      <NotificationList
        notification={notification}
        timeout={timeout} />, this);
    const instance = renderer.getMountedInstance();
    const key = 'NotificationListItem' + notification.timestamp;
    const refs = {};
    const hideStub = sinon.stub();
    refs[key] = { hide: hideStub };
    instance.refs = refs;
    // Trigger the timeout.
    clock.tick(timeout + 10);
    assert.equal(hideStub.callCount, 1);
  });

  it('does not time out error messages', () => {
    const notification = {
      key: '12345',
      timestamp: '12345',
      message: 'notification message',
      level: 'error'
    };
    const timeout = 500;
    const renderer = jsTestUtils.shallowRender(
      <NotificationList
        notification={notification}
        timeout={timeout} />, this);
    const instance = renderer.getMountedInstance();
    const key = 'NotificationListItem' + notification.timestamp;
    const refs = {};
    const hideStub = sinon.stub();
    refs[key] = { hide: hideStub };
    instance.refs = refs;
    // Trigger the timeout.
    clock.tick(timeout + 10);
    assert.equal(hideStub.callCount, 0);
  });

  it('can clear and restart timeouts', () => {
    const longTimeout = 10000;
    const notification = {
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    const renderer = jsTestUtils.shallowRender(
      <NotificationList
        notification={notification}
        timeout={longTimeout} />, this);
    const instance = renderer.getMountedInstance();
    renderer.getRenderOutput();
    assert.equal(instance.timeouts.length, 1,
      'notification timeouts were not populated');
    instance._clearTimeouts();
    assert.equal(instance.timeouts.length, 0,
      'notification timeouts did not clear');
    instance._restartTimeouts();
    assert.equal(instance.timeouts.length, 1,
      'notification timeouts were not restarted');
    // Let everything clear out.
    clock.tick(longTimeout + 10);
  });
});
