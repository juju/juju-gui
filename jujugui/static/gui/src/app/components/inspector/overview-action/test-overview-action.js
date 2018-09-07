'use strict';

const React = require('react');
const enzyme = require('enzyme');

const OverviewAction = require('./overview-action');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('OverviewAction', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <OverviewAction
      action={options.action || sinon.stub()}
      icon={options.icon}
      linkAction={options.linkAction}
      linkTitle={options.linkTitle}
      title={options.title || 'My action'}
      value={options.value}
      valueType={options.valueType} />
  );

  it('calls the callable provided when clicked', function() {
    const action = sinon.stub();
    const wrapper = renderComponent({ action });
    wrapper.simulate('click');
    assert.equal(action.callCount, 1);
  });

  it('displays the provided title', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.overview-action__title').text(), 'My action');
  });

  it('sets the provided icon', function() {
    const wrapper = renderComponent({ icon: 'action-icon' });
    const expected = (
      <span className="overview-action__icon">
        <SvgIcon name="action-icon"
          size="16" />
      </span>);
    assert.compareJSX(wrapper.find('.overview-action__icon'), expected);
  });

  it('sets the link', function() {
    const linkAction = sinon.stub();
    const wrapper = renderComponent({
      linkAction,
      linkTitle: 'Juju Charms'
    });
    const expected = (
      <span className="overview-action__link"
        onClick={wrapper.find('.overview-action__link').prop('onClick')}>
          Juju Charms
      </span>);
    assert.compareJSX(wrapper.find('.overview-action__link'), expected);
  });

  it('calls the supplied action when the link is clicked', function() {
    const linkAction = sinon.stub();
    const stopPropagation = sinon.stub();
    const wrapper = renderComponent({
      linkAction,
      linkTitle: 'Juju Charms'
    });
    wrapper.find('.overview-action__link').simulate('click', {
      stopPropagation: stopPropagation
    });
    assert.equal(linkAction.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
  });

  it('hides the link if it is not provided', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.overview-action__link').prop('className').includes('hidden'),
      true);
  });

  it('sets the value', function() {
    const wrapper = renderComponent({ value: '5' });
    assert.equal(wrapper.find('.overview-action__value').text(), '5');
  });

  it('sets the value type class', function() {
    const wrapper = renderComponent({
      value: '5',
      valueType: 'pending'
    });
    assert.equal(
      wrapper.find('.overview-action__value').prop('className').includes(
        'overview-action__value--type-pending'),
      true);
  });

  it('hides the value if it is not provided', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.overview-action__value').prop('className').includes(
        'hidden'),
      true);
  });
});
