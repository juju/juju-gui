/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const GenericInput = require('./generic-input');

describe('GenericInput', function() {

  const renderComponent = (options = {}) => {
    const value = options.value === undefined ?
      'default' : options.value;
    const wrapper = enzyme.shallow(
      <GenericInput
        autocomplete={
          options.autocomplete === undefined ? false : options.autocomplete}
        disabled={options.disabled === undefined ? false : options.disabled}
        hasExternalError={options.hasExternalError}
        inlineErrorIcon={options.inlineErrorIcon}
        label={options.label === undefined ? 'Region' : options.label}
        multiLine={options.multiLine}
        onBlur={options.onBlur}
        onChange={options.onChange}
        onFocus={options.onFocus}
        onKeyUp={options.onKeyUp}
        placeholder={options.placeholder || 'us-central-1'}
        required={options.required === undefined ? true : options.required}
        type={options.type}
        validate={options.validate === undefined ? [{
          regex: /\S+/,
          error: 'This field is required.'
        }] : options.validate}
        value={value} />
    );
    const instance = wrapper.instance();
    instance.refs = {
      field: {
        innerText: value,
        focus: sinon.stub(),
        value: value
      }
    };
    return wrapper;
  };

  it('can render', () => {
    const wrapper = renderComponent();
    const input = wrapper.find('input');
    const expected = (
      <div className="generic-input">
        <label className={
          'generic-input__label generic-input__label--value-present ' +
          'generic-input__label--placeholder-present'}
        htmlFor="Region">
          Region
        </label>
        <input aria-invalid={false}
          autoComplete="off"
          className="generic-input__field"
          defaultValue="default"
          disabled={false}
          id="Region"
          onBlur={input.prop('onBlur')}
          onChange={input.prop('onChange')}
          onFocus={input.prop('onFocus')}
          onKeyUp={input.prop('onKeyUp')}
          placeholder="us-central-1"
          ref="field"
          required={true}
          type="text" />
        {undefined}
        {null}
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can render a multi line input', () => {
    const wrapper = renderComponent({
      multiLine: true
    });
    const input = wrapper.find('.generic-input__multiline-field');
    const expected = (
      <div aria-invalid={false}
        className="generic-input__multiline-field"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'default'}}
        id="Region"
        onBlur={input.prop('onBlur')}
        onChange={input.prop('onChange')}
        onFocus={input.prop('onFocus')}
        onKeyUp={input.prop('onKeyUp')}
        ref="field">
      </div>
    );
    assert.compareJSX(input, expected);
  });

  it('can display as a different type', () => {
    const wrapper = renderComponent({
      type: 'password'
    });
    assert.equal(wrapper.find('input').prop('type'), 'password');
  });

  it('can return the field value', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.equal(instance.getValue(), 'default');
  });

  it('can set the field value', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.setValue('scooby');
    assert.equal(instance.getValue(), 'scooby');
  });

  it('can set a multi line field value', () => {
    const wrapper = renderComponent({
      multiLine: true
    });
    const instance = wrapper.instance();
    instance.setValue('scooby');
    assert.equal(instance.getValue(), 'scooby');
  });

  it('can return a multi line field value', () => {
    const wrapper = renderComponent({
      multiLine: true
    });
    const instance = wrapper.instance();
    assert.equal(instance.getValue(), 'default');
  });

  it('can validate the form', () => {
    const wrapper = renderComponent({ value: '' });
    const instance = wrapper.instance();
    instance.validate();
    wrapper.update();
    const expected = (
      <ul className="generic-input__errors">
        {[<li className="generic-input__error"
          key="This field is required."
          role="alert">
          This field is required.
        </li>]}
      </ul>
    );
    assert.compareJSX(wrapper.find('.generic-input__errors'), expected);
  });

  it('can validate via a function', () => {
    const wrapper = renderComponent({
      validate: [{
        check: value => value === 'spinach',
        error: 'That username is taken.'
      }],
      value: 'spinach'
    });
    const instance = wrapper.instance();
    instance.validate();
    wrapper.update();
    assert.equal(wrapper.find('.generic-input__errors').length, 1);
    assert.equal(
      wrapper.find('.generic-input__error').text(),
      'That username is taken.');
  });

  it('can validate when there are no validations set', () => {
    const wrapper = renderComponent({
      validate: null,
      value: ''
    });
    const instance = wrapper.instance();
    instance.validate();
    wrapper.update();
    assert.equal(wrapper.find('.generic-input__errors').length, 0);
  });

  it('can validate the input when leaving', () => {
    const wrapper = renderComponent({ value: '' });
    wrapper.find('input').props().onBlur();
    wrapper.update();
    assert.equal(wrapper.find('.generic-input__errors').length, 1);
  });

  it('allows the label to be optional', () => {
    const wrapper = renderComponent({ label: null });
    assert.equal(wrapper.find('.generic-input__label').length, 0);
  });

  it('adds a class to the wrapper element on error', () => {
    const wrapper = renderComponent({ value: '' });
    wrapper.find('input').props().onBlur();
    wrapper.update();
    assert.equal(wrapper.prop('className').includes('has-error'), true);
  });

  it('adds an error icon with inlineErrorIcon is set', () => {
    const wrapper = renderComponent({
      inlineErrorIcon: true,
      value: ''
    });
    wrapper.find('input').props().onBlur();
    wrapper.update();
    assert.equal(wrapper.find('SvgIcon').length, 1);
  });

  it('can set the focus on the field', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.focus();
    assert.equal(instance.refs.field.focus.callCount, 1);
  });

  it('can call the passed blur function', () => {
    const updateModelName = sinon.stub();
    const wrapper = renderComponent({
      onBlur: updateModelName
    });
    wrapper.find('input').props().onBlur();
    assert.equal(updateModelName.callCount, 1);
  });

  it('onKeyUp function passes through', () => {
    const updateModelName = sinon.stub();
    const wrapper = renderComponent({
      onKeyUp: updateModelName
    });
    wrapper.find('input').props().onKeyUp();
    assert.equal(updateModelName.callCount, 1);
  });
});
