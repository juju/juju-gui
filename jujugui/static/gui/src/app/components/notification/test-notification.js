/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Notification = require('./notification');
const SvgIcon = require('../svg-icon/svg-icon');

describe('Notification', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Notification
      content={options.content || (<span>Hello</span>)}
      dismiss={options.dismiss}
      extraClasses={options.extraClasses}
      isBlocking={options.isBlocking}
      type={options.type} />
  );

  it('renders default', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="p-notification">
        <p className="p-notification__response">
          <span>Hello</span>
        </p>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders type', () => {
    const wrapper = renderComponent({ type: 'positive' });
    assert.equal(wrapper.prop('className'), 'p-notification--positive');
  });

  it('renders with additional classes', () => {
    const wrapper = renderComponent({ extraClasses: 'test' });
    assert.equal(wrapper.prop('className').includes('test'), true);
  });

  it('renders with dismiss function', () => {
    const dismiss = sinon.stub();
    const wrapper = renderComponent({ dismiss });
    const expected = (
      <button className="p-notification__action"
        onClick={wrapper.find('.p-notification__action').prop('onClick')}>
        <SvgIcon
          name="close_16"
          size="16" />
      </button>
    );assert.compareJSX(wrapper.find('.p-notification__action'), expected);
  });

  it('can be dismissed', () => {
    const dismiss = sinon.stub();
    const stopPropagation = sinon.stub();
    const wrapper = renderComponent({ dismiss });
    wrapper.find('.p-notification__action').props().onClick({
      stopPropagation: stopPropagation
    });
    assert.equal(dismiss.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
  });

  it('renders with a blocking div', () => {
    const wrapper = renderComponent({ isBlocking: true });
    assert.equal(wrapper.find('.p-notification__blocker').length, 1);
    assert.equal(wrapper.find('.p-notification').length, 1);
  });

  it('renders with a blocking div and is clickable', () => {
    const dismiss = sinon.stub();
    const wrapper = renderComponent({
      dismiss,
      isBlocking: true
    });
    assert.equal(wrapper.find('.p-notification__blocker').length, 1);
    assert.equal(wrapper.find('.p-notification__action').length, 1);
  });

});
