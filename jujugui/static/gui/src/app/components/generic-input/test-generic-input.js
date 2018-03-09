/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericInput = require('./generic-input');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('GenericInput', function() {

  it('can render', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        autocomplete={false}
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
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
          onBlur={instance._blurHandler}
          onChange={instance._callOnChange}
          onFocus={instance._focusHandler}
          onKeyUp={instance._keyUpHandler}
          placeholder="us-central-1"
          ref="field"
          required={true}
          type="text" />
        {undefined}
        {null}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can render a multi line input', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        autocomplete={false}
        disabled={false}
        label="Region"
        multiLine={true}
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="generic-input">
        <label className={
          'generic-input__label generic-input__label--value-present ' +
          'generic-input__label--placeholder-present'}
        htmlFor="Region">
          Region
        </label>
        <div aria-invalid={false}
          className="generic-input__multiline-field"
          contentEditable={true}
          dangerouslySetInnerHTML={{__html: 'default'}}
          id="Region"
          onBlur={instance._blurHandler}
          onChange={instance._handleDIVOnchange}
          onFocus={instance._focusHandler}
          onKeyUp={instance._keyUpHandler}
          ref="field">
        </div>
        {undefined}
        {null}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can display as a different type', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        type="password"
        validate={[]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="generic-input">
        <label className={
          'generic-input__label generic-input__label--value-present ' +
          'generic-input__label--placeholder-present'}
        htmlFor="Region">
          Region
        </label>
        <input aria-invalid={false}
          autoComplete="on"
          className="generic-input__field"
          defaultValue="default"
          disabled={false}
          id="Region"
          onBlur={instance._blurHandler}
          onChange={instance._callOnChange}
          onFocus={instance._focusHandler}
          onKeyUp={instance._keyUpHandler}
          placeholder="us-central-1"
          ref="field"
          required={true}
          type="password" />
        {undefined}
        {null}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can return the field value', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: 'default'}};
    assert.equal(instance.getValue(), 'default');
  });

  it('can set the field value', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: 'default'}};
    instance.setValue('scooby');
    assert.equal(instance.getValue(), 'scooby');
  });

  it('can set a multi line field value', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        multiLine={true}
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {innerText: 'default'}};
    instance.setValue('scooby');
    assert.equal(instance.getValue(), 'scooby');
  });

  it('can return a multi line field value', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        multiLine={true}
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {innerText: 'default'}};
    assert.equal(instance.getValue(), 'default');
  });

  it('can validate the form', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    instance.validate();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="generic-input__errors">
        {[<li className="generic-input__error"
          key="This field is required."
          role="alert">
          This field is required.
        </li>]}
      </ul>
    );
    expect(output.props.children[3]).toEqualJSX(expected);
  });

  it('can validate via a function', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          check: value => value === 'spinach',
          error: 'That username is taken.'
        }]} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: 'spinach'}};
    instance.validate();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="generic-input__errors">
        {[<li className="generic-input__error"
          key="This value is invalid."
          role="alert">
          That username is taken.
        </li>]}
      </ul>
    );
    expect(output.props.children[3]).toEqualJSX(expected);
  });

  it('can validate when there are no validations set', () => {
    var renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={undefined} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    instance.validate();
    var output = renderer.getRenderOutput();
    assert.isNull(output.props.children[3]);
  });

  it('can validate the input when leaving', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    let output = renderer.getRenderOutput();
    output.props.children[1].props.onBlur();
    output = renderer.getRenderOutput();
    const expected = (
      <ul className="generic-input__errors">
        {[<li className="generic-input__error"
          key="This field is required."
          role="alert">
          This field is required.
        </li>]}
      </ul>
    );
    expect(output.props.children[3]).toEqualJSX(expected);
  });

  it('allows the label to be optional', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="generic-input">
        {undefined}
        <input aria-invalid={false}
          autoComplete="on"
          className="generic-input__field"
          defaultValue="default"
          disabled={false}
          id={undefined}
          onBlur={instance._blurHandler}
          onChange={instance._callOnChange}
          onFocus={instance._focusHandler}
          onKeyUp={instance._keyUpHandler}
          placeholder="us-central-1"
          ref="field"
          required={true}
          type="text" />
        {undefined}
        {null}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('adds a class to the wrapper element on error', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    let output = renderer.getRenderOutput();
    output.props.children[1].props.onBlur();
    output = renderer.getRenderOutput();
    assert.equal(output.props.className, 'generic-input has-error');
  });

  it('adds an error icon with inlineErrorIcon is set', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        inlineErrorIcon={true}
        placeholder="placeholder"
        ref="test"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    let output = renderer.getRenderOutput();
    output.props.children[1].props.onBlur();
    output = renderer.getRenderOutput();
    const expected = (<SvgIcon
      name="relation-icon-error"
      size={16} />);
    expect(output.props.children[2]).toEqualJSX(expected);
  });

  it('can set the focus on the field', () => {
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {focus: sinon.stub()}};
    instance.focus();
    assert.equal(instance.refs.field.focus.callCount, 1);
  });

  it('can call the passed blur function', () => {
    const updateModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        onBlur={updateModelName}
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    let output = renderer.getRenderOutput();
    output.props.children[1].props.onBlur();
    assert.equal(updateModelName.callCount, 1);
  });

  it('onKeyUp function passes through', () => {
    const updateModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <GenericInput
        disabled={false}
        label="Region"
        onKeyUp={updateModelName}
        placeholder="us-central-1"
        ref="templateRegion"
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    let output = renderer.getRenderOutput();
    output.props.children[1].props.onKeyUp();
    assert.equal(updateModelName.callCount, 1);
  });
});
