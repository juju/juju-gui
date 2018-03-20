/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InsetSelect = require('./inset-select');

describe('InsetSelect', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <InsetSelect
      disabled={options.disabled}
      label={options.label === undefined ? 'Spork!' : options.label}
      onChange={options.onChange}
      options={options.options || [{
        label: 'Splade!',
        value: 'splade'
      }]}
      required={options.required}
      value={options.value} />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    var expected = (
      <div className='inset-select inset-select--spork'>
        <label className="inset-select__label"
          htmlFor="Spork!">
          Spork!
        </label>
        <select className="inset-select__field"
          defaultValue={undefined}
          disabled={undefined}
          id="Spork!"
          onChange={wrapper.find('.inset-select__field').prop('onChange')}
          ref="field"
          required={undefined}>
          {[<option
            key="splade0"
            value="splade">
            Splade!
          </option>]}
        </select>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can return the field value', () => {
    const wrapper = renderComponent();
    var instance = wrapper.instance();
    instance.refs = {field: {value: 'default'}};
    assert.equal(instance.getValue(), 'default');
  });

  it('can set the field value', () => {
    const wrapper = renderComponent();
    var instance = wrapper.instance();
    instance.refs = {field: {value: 'default'}};
    instance.setValue('new');
    assert.equal(instance.getValue(), 'new');
  });

  it('can pass the field value to a supplied onChange method', () => {
    var onChange = sinon.stub();
    const wrapper = renderComponent({ onChange });
    var instance = wrapper.instance();
    instance.refs = {field: {value: 'new'}};
    wrapper.find('.inset-select__field').props().onChange();
    assert.equal(onChange.callCount, 1);
    assert.equal(onChange.args[0][0], 'new');
  });

  it('allows the label to be optional', () => {
    const wrapper = renderComponent({ label: null });
    assert.equal(wrapper.find('.inset-select__label').length, 0);
  });
});
