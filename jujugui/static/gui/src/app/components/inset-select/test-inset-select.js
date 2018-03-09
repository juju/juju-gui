/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InsetSelect = require('./inset-select');

const jsTestUtils = require('../../utils/component-test-utils');

describe('InsetSelect', function() {

  it('can render', () => {
    var renderer = jsTestUtils.shallowRender(
      <InsetSelect
        label="Spork!"
        options={[{
          label: 'Splade!',
          value: 'splade'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
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
          onChange={instance._callOnChange}
          ref="field"
          required={undefined}>
          {[<option
            key="splade0"
            value="splade">
            Splade!
          </option>]}
        </select>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can return the field value', () => {
    var renderer = jsTestUtils.shallowRender(
      <InsetSelect
        label="Spork!"
        options={[{
          label: 'Splade!',
          value: 'splade'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: 'default'}};
    assert.equal(instance.getValue(), 'default');
  });

  it('can set the field value', () => {
    var renderer = jsTestUtils.shallowRender(
      <InsetSelect
        label="Spork!"
        options={[{
          label: 'Splade!',
          value: 'splade'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: 'default'}};
    instance.setValue('new');
    assert.equal(instance.getValue(), 'new');
  });

  it('can pass the field value to a supplied onChange method', () => {
    var onChange = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <InsetSelect
        label="Spork!"
        onChange={onChange}
        options={[{
          label: 'Splade!',
          value: 'splade'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    instance.refs = {field: {value: 'new'}};
    output.props.children[1].props.onChange();
    assert.equal(onChange.callCount, 1);
    assert.equal(onChange.args[0][0], 'new');
  });

  it('allows the label to be optional', () => {
    var renderer = jsTestUtils.shallowRender(
      <InsetSelect
        options={[{
          label: 'Splade!',
          value: 'splade'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className='inset-select'>
        {undefined}
        <select className="inset-select__field"
          defaultValue={undefined}
          disabled={undefined}
          id={undefined}
          onChange={instance._callOnChange}
          ref="field"
          required={undefined}>
          {[<option
            key="splade0"
            value="splade">
            Splade!
          </option>]}
        </select>
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
