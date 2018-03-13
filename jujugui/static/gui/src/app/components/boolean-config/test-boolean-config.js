/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BooleanConfig = require('./boolean-config');

describe('BooleanConfig', function() {
  let option;

  const renderComponent = (options = {}) => enzyme.shallow(
    <BooleanConfig
      config={options.config === undefined ? true : options.config}
      disabled={options.disabled === undefined ? false : options.disabled}
      label={options.label || 'Test'}
      onChange={options.onChange || null}
      option={options.option || option} />
  );

  beforeEach(() => {
    option = {
      key: 'testcheck',
      description: 'it is a test config option'
    };
  });

  it('renders a checked input based on config prop', function() {
    const wrapper = renderComponent();
    const input = wrapper.find('.boolean-config--input');
    const expected = (
      <div className="boolean-config">
        <div className="boolean-config--toggle-container">
          <div className="boolean-config--title">Test</div>
          <div className="boolean-config--toggle">
            <input
              className="boolean-config--input"
              defaultChecked={true}
              disabled={false}
              id={option.key}
              onChange={input.prop('onChange')}
              onClick={input.prop('onClick')}
              type="checkbox" />
            <label
              className="boolean-config--label"
              htmlFor={option.key}>
              <div className="boolean-config--handle"></div>
            </label>
          </div>
        </div>
        <div className="boolean-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders an unchecked input based on config prop', function() {
    const wrapper = renderComponent({ config: false });
    assert.equal(wrapper.find('.boolean-config--input').prop('defaultChecked'), false);
  });

  it('supports string boolean config props (true)', function() {
    const wrapper = renderComponent({ config: 'True' });
    assert.equal(wrapper.find('.boolean-config--input').prop('defaultChecked'), true);
  });

  it('supports string boolean config props (false)', function() {
    const wrapper = renderComponent({ config: 'False' });
    assert.equal(wrapper.find('.boolean-config--input').prop('defaultChecked'), false);
  });

  it('can call an onChange method if supplied', function() {
    const onChange = sinon.stub();
    const wrapper = renderComponent({ onChange });
    wrapper.find('.boolean-config--input').simulate('change', {
      target: {
        checked: true
      }
    });
    assert.equal(onChange.callCount, 1);
  });

  it('can be disabled', function() {
    const wrapper = renderComponent({ disabled: true });
    assert.equal(wrapper.find('.boolean-config--input').prop('disabled'), true);
  });
});
