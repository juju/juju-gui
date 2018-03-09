/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const FileField = require('./file-field');

const jsTestUtils = require('../../utils/component-test-utils');

describe('FileField', function() {

  it('can render', () => {
    var renderer = jsTestUtils.shallowRender(
      <FileField
        accept=".json"
        disabled={false}
        label="Dingo"
        required={true} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="file-field">
        <input accept=".json"
          className="file-field__field"
          disabled={false}
          id="Dingo"
          onChange={instance.validate}
          ref="field"
          required={true}
          type="file" />
        <label className="file-field__label"
          htmlFor="Dingo">
          Dingo
        </label>
        {null}
      </div>);
    expect(expected).toEqualJSX(output);
  });

  it('can return the field value', done => {
    const renderer = jsTestUtils.shallowRender(
      <FileField
        accept=".json"
        disabled={false}
        label="Dingo"
        required={true} />, true);
    const instance = renderer.getMountedInstance();
    // Patch the file reader factory used to create the JSON file reader.
    const reader = instance._newFileReader();
    const original = instance._newFileReader;
    instance._newFileReader = () => {
      return reader;
    };
    const onload = reader.onload;
    reader.onload = evt => {
      // Restore the original reader factory.
      instance._newFileReader = original;
      // While loading, the field is not yet ready.
      assert.strictEqual(instance.ready, false);
      onload(evt);
      // After loading, the field is ready.
      assert.strictEqual(instance.ready, true);
      assert.strictEqual(instance.getValue(), 'these are the voyages');
      done();
    };
    const file = new Blob(['these are the voyages']);
    instance.refs = {field: {files: [file]}};
    instance.validate();
  });

  it('can validate the form', () => {
    var renderer = jsTestUtils.shallowRender(
      <FileField
        accept=".json"
        disabled={false}
        label="Dingo"
        required={true} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {files: []}};
    instance.validate();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="file-field error">
        <input accept=".json"
          className="file-field__field"
          disabled={false}
          id="Dingo"
          onChange={instance.validate}
          ref="field"
          required={true}
          type="file" />
        <label className="file-field__label"
          htmlFor="Dingo">
          Dingo
        </label>
        <ul className="file-field__errors">
          {[<li className="file-field__error"
            key="required">
            This field is required.
          </li>]}
        </ul>
      </div>);
    expect(expected).toEqualJSX(output);
  });

  it('can validate the form when the file changes', () => {
    const renderer = jsTestUtils.shallowRender(
      <FileField
        accept=".json"
        disabled={false}
        label="Dingo"
        required={true} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {field: {files: []}};
    let output = renderer.getRenderOutput();
    output.props.children[0].props.onChange();
    output = renderer.getRenderOutput();
    const expected = (
      <div className="file-field error">
        <input accept=".json"
          className="file-field__field"
          disabled={false}
          id="Dingo"
          onChange={instance.validate}
          ref="field"
          required={true}
          type="file" />
        <label className="file-field__label"
          htmlFor="Dingo">
          Dingo
        </label>
        <ul className="file-field__errors">
          {[<li className="file-field__error"
            key="required">
            This field is required.
          </li>]}
        </ul>
      </div>);
    expect(expected).toEqualJSX(output);
  });

  it('generate a label when file is stored', () => {
    const renderer = jsTestUtils.shallowRender(
      <FileField
        accept=".json"
        disabled={false}
        label="Dingo"
        required={true} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({contents: 'foo'});
    let output = renderer.getRenderOutput();
    const expected = (
      <div className="file-field">
        <input accept=".json"
          className="file-field__field"
          disabled={false}
          id="Dingo"
          onChange={instance.validate}
          ref="field"
          required={true}
          type="file" />
        <label className="file-field__label"
          htmlFor="Dingo">
          File stored.
        </label>
        {null}
      </div>);
    expect(expected).toEqualJSX(output);
  });

  it('can set the focus on the field', () => {
    var renderer = jsTestUtils.shallowRender(
      <FileField
        accept=".json"
        disabled={false}
        label="Dingo"
        required={true} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {focus: sinon.stub()}};
    instance.focus();
    assert.equal(instance.refs.field.focus.callCount, 1);
  });
});
