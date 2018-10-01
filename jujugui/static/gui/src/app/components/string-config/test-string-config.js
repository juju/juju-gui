/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StringConfig = require('./string-config');
const StringConfigInput = require('./input/input');

describe('StringConfig', function() {
  let option;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StringConfig
      config={options.config === undefined ? 'the value' : options.config}
      disabled={options.disabled}
      option={options.option || option} />
  );

  beforeEach(() => {
    option = {
      key: 'testconfig',
      type: 'text',
      description: 'test config for strings'
    };
  });

  it('renders a string config', function() {
    const wrapper = renderComponent();
    var typeString = ` (${option.type})`;
    var expected = (
      <div className="string-config">
        <span className="string-config__label">{option.key}{typeString}</span>
        <div className="string-config--value">
          <StringConfigInput
            config="the value"
            disabled={false}
            ref="editableInput"
            setValue={wrapper.find('StringConfigInput').prop('setValue')} />
        </div>
        <span
          className="string-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </span>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can handle a string config without a config value', function() {
    const wrapper = renderComponent({config: null});
    assert.equal(wrapper.find('StringConfigInput').prop('config'), null);
  });

  it('does not show a type if none is provided', function() {
    option.type = null;
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.string-config__label').text(), 'testconfig');
  });

  it('can be disabled', function() {
    const wrapper = renderComponent({disabled: true});
    assert.equal(wrapper.find('StringConfigInput').prop('disabled'), true);
  });

  it('can display a changed value', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance._setValue('different value');
    wrapper.update();
    assert.equal(
      wrapper.find('.string-config--value').prop('className').includes(
        'string-config--changed'),
      true);
  });

  it('correctly compares existing numbers', function() {
    const wrapper = renderComponent({config: 123});
    const instance = wrapper.instance();
    instance._setValue('123');
    wrapper.update();
    assert.equal(
      wrapper.find('.string-config--value').prop('className').includes(
        'string-config--changed'),
      false);
  });

  it('can handle empty strings with newlines', function() {
    const wrapper = renderComponent({config: ''});
    const instance = wrapper.instance();
    instance._setValue('\n');
    wrapper.update();
    assert.equal(
      wrapper.find('.string-config--value').prop('className').includes(
        'string-config--changed'),
      false);
    assert.equal(instance.getValue(), '');
  });

  it('can remove trailing newlines', function() {
    const wrapper = renderComponent({config: '0'});
    const instance = wrapper.instance();
    instance._setValue('0\n');
    wrapper.update();
    assert.equal(
      wrapper.find('.string-config--value').prop('className').includes(
        'string-config--changed'),
      false);
    assert.equal(instance.getValue(), '0');
  });
});
