/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const NotificationListItem = require('./item');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('NotificationListItem', function() {
  let clock;

  const renderComponent = (options = {}) => enzyme.shallow(
    <NotificationListItem
      message={options.message || 'notification message'}
      removeNotification={options.removeNotification || sinon.stub()}
      timestamp={options.timestamp || '123'}
      type={options.type || 'info'} />
  );

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('renders a notification list item', () => {
    const wrapper = renderComponent();
    var classes = 'notification-list-item notification-list-item--info ' +
      'notification-list-item--visible';
    var expected = (
      <li className={classes}>
        <span>notification message</span>
        <span
          className="notification-list-item__hide"
          onClick={wrapper.find('.notification-list-item__hide').prop('onClick')}
          role="button"
          tabIndex="0">
          <SvgIcon
            name="close_16"
            size="16" />
        </span>
      </li>);
    assert.compareJSX(wrapper, expected);
  });

  it('updates class and calls to remove itself after hiding', () => {
    const wrapper = renderComponent();
    // Check that it's rendered with the proper classes.
    assert.isTrue(
      wrapper.prop('className').includes('notification-list-item--visible'));
    assert.isFalse(
      wrapper.prop('className').includes('notification-list-item--hidden'));
    wrapper.find('.notification-list-item__hide').simulate('click');
    wrapper.update();
    // After a click it should have the classes updated.
    assert.isFalse(
      wrapper.prop('className').includes('notification-list-item--visible'));
    assert.isTrue(
      wrapper.prop('className').includes('notification-list-item--hidden'));
  });

  it('calls the remove notification prop after the timeout', () => {
    const removeNotification = sinon.stub();
    const wrapper = renderComponent({ removeNotification });
    wrapper.find('.notification-list-item__hide').simulate('click');
    assert.equal(removeNotification.callCount, 0);
    clock.tick(1000);
    assert.equal(removeNotification.callCount, 1);
  });

});
