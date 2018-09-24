/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const NotificationList = require('./notification-list');
const NotificationListItem = require('./item/item');

describe('NotificationList', function() {
  let clock, notifications;

  const renderComponent = (options = {}) => enzyme.shallow(
    <NotificationList
      notifications={
        options.notifications === undefined ? notifications : options.notifications}
      timeout={options.timeout} />
  );

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    notifications = [{
      key: '12345',
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    }];
  });

  afterEach(() => {
    clock.restore();
  });

  it('renders a list based on the notification passed in', () => {
    const wrapper = renderComponent();
    const items = [
      <NotificationListItem
        key={notifications[0].timestamp}
        message={notifications[0].message}
        ref={'NotificationListItem' + notifications[0].timestamp}
        removeNotification={wrapper.find('NotificationListItem').prop('removeNotification')}
        timeout={undefined}
        timestamp={notifications[0].timestamp}
        type={notifications[0].level} />];
    const expected = (
      <ul
        className="notification-list"
        onMouseOut={wrapper.prop('onMouseOut')}
        onMouseOver={wrapper.prop('onMouseOver')}>
        {items}
      </ul>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can render with no notifications', () => {
    const wrapper = renderComponent({ notifications: [] });
    assert.equal(wrapper.find('NotificationListItem').length, 0);
  });

  it('can render notifications after rendering none', () => {
    const wrapper = renderComponent({ notifications: [] });
    assert.equal(wrapper.find('NotificationListItem').length, 0);
    wrapper.setProps({ notifications });
    wrapper.update();
    assert.equal(wrapper.find('NotificationListItem').length, 1);
  });

  it('times out non error messages', () => {
    const timeout = 500;
    const wrapper = renderComponent({ timeout });
    const instance = wrapper.instance();
    const key = 'NotificationListItem' + notifications[0].timestamp;
    const refs = {};
    const hideStub = sinon.stub();
    refs[key] = { hide: hideStub };
    instance.refs = refs;
    // Trigger the timeout.
    clock.tick(timeout + 10);
    assert.equal(hideStub.callCount, 1);
  });

  it('does not time out error messages', () => {
    notifications[0].level = 'error';
    const timeout = 500;
    const wrapper = renderComponent({ timeout });
    const instance = wrapper.instance();
    const key = 'NotificationListItem' + notifications[0].timestamp;
    const refs = {};
    const hideStub = sinon.stub();
    refs[key] = { hide: hideStub };
    instance.refs = refs;
    // Trigger the timeout.
    clock.tick(timeout + 10);
    assert.equal(hideStub.callCount, 0);
  });

  it('can clear and restart timeouts', () => {
    const timeout = 10000;
    const wrapper = renderComponent({ timeout });
    const instance = wrapper.instance();
    assert.equal(instance.timeouts.length, 1,
      'notification timeouts were not populated');
    instance._clearTimeouts();
    assert.equal(instance.timeouts.length, 0,
      'notification timeouts did not clear');
    instance._restartTimeouts();
    assert.equal(instance.timeouts.length, 1,
      'notification timeouts were not restarted');
    // Let everything clear out.
    clock.tick(timeout + 10);
  });

  it('does not reshow notifications', () => {
    const wrapper = renderComponent();
    let items = wrapper.find('NotificationListItem');
    assert.equal(items.length, 1);
    assert.equal(items.first().prop('timestamp'), '12345');
    // Hide the notification.
    items.first().props().removeNotification('12345');
    notifications.push({
      key: '222',
      timestamp: '2468',
      message: 'notification2 message',
      level: 'error'
    });
    wrapper.setProps({ notifications });
    items = wrapper.find('NotificationListItem');
    assert.equal(items.length, 1);
    assert.equal(items.first().prop('timestamp'), '2468');
  });
});
