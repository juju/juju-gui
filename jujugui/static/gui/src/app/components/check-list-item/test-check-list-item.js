/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const CheckListItem = require('./check-list-item');

describe('CheckListItem', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <CheckListItem
      action={options.action}
      aside={options.aside}
      checked={options.checked}
      className={options.className}
      disabled={options.disabled}
      extraInfo={options.extraInfo}
      id={options.id}
      label={options.label || 'a-label'}
      whenChanged={options.whenChanged || sinon.stub()} />
  );

  it('renders ui based on props', () => {
    const wrapper = renderComponent({
      aside: '3',
      checked: false,
      className: 'select-all',
      disabled: false,
      id: 'apache/2'
    });
    const expected = (
      <li className="check-list-item check-list-item--select-all"
        data-id="apache/2"
        onClick={undefined} role="button" tabIndex="0">
        <label htmlFor="a-label-item">
          <div className="check-list-item__hit-area"
            onClick={wrapper.find('.check-list-item__hit-area').prop('onClick')}>
            <input
              checked={false}
              disabled={false}
              id="a-label-item"
              onChange={wrapper.find('input').prop('onChange')}
              onClick={wrapper.find('input').prop('onClick')}
              type="checkbox" />
          </div>
          <span className="check-list-item__label">
              a-label
          </span>
          {undefined}
          <span className="check-list-item__aside">
              3
          </span>
        </label>
      </li>);
    assert.compareJSX(wrapper, expected);
  });

  it('displays extraInfo when provided', () => {
    const wrapper = renderComponent({
      extraInfo: 'Current workload status'
    });
    const expected = (
      <span className="check-list-item__extra-info"
        title="Current workload status">
          Current workload status
      </span>);
    assert.compareJSX(wrapper.find('.check-list-item__extra-info'), expected);
  });

  it('does not set a "for" id on the label if it is a nav element', () => {
    const wrapper = renderComponent({
      action: sinon.stub()
    });
    assert.strictEqual(wrapper.find('label').prop('htmlFor'), undefined);
  });

  it('has a nav class if it is a nav element', () => {
    const wrapper = renderComponent({
      action: sinon.stub()
    });
    assert.equal(wrapper.prop('className').includes('check-list-item--nav'), true);
  });

  it('calls the supplied whenChanged if supplied', () => {
    const whenChanged = sinon.stub();
    const wrapper = renderComponent({ whenChanged });
    wrapper.find('input').simulate('change', {
      currentTarget: {
        checked: true
      }
    });
    assert.equal(whenChanged.callCount, 1);
    assert.equal(whenChanged.args[0][0], true);
  });

  it('does not bubble the click event when clicking a checkbox', () => {
    const action = sinon.stub();
    const wrapper = renderComponent({ action });
    wrapper.find('input').simulate('click', { stopPropagation: sinon.stub() });
    assert.equal(action.callCount, 0);
  });

  it('can have a disabled checkbox', () => {
    const wrapper = renderComponent({ disabled: true });
    assert.equal(wrapper.find('input').prop('disabled'), true);
  });

  it('can toggle the checkbox from the hit area', () => {
    const wrapper = renderComponent({ action: sinon.stub() });
    assert.equal(wrapper.find('input').prop('checked'), false);
    wrapper.find('.check-list-item__hit-area').simulate('click',
      {stopPropagation: sinon.stub()});
    wrapper.update();
    assert.equal(wrapper.find('input').prop('checked'), true);
  });
});
