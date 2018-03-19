/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const FileField = require('./file-field');

describe('FileField', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <FileField
      accept={options.accept || '.json'}
      disabled={options.disabled === undefined ? false : options.disabled}
      label={options.label || 'Dingo'}
      required={options.required === undefined ? true : options.required} />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    var expected = (
      <div className="file-field">
        <input accept=".json"
          className="file-field__field"
          disabled={false}
          id="Dingo"
          onChange={wrapper.find('input').prop('onChange')}
          ref="field"
          required={true}
          type="file" />
        <label className="file-field__label"
          htmlFor="Dingo">
          Dingo
        </label>
        {null}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can return the field value', done => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
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
    const wrapper = renderComponent();
    var instance = wrapper.instance();
    instance.refs = {field: {files: []}};
    instance.validate();
    wrapper.update();
    var expected = (
      <ul className="file-field__errors">
        {[<li className="file-field__error"
          key="required">
          This field is required.
        </li>]}
      </ul>);
    assert.equal(wrapper.prop('className').includes('error'), true);
    assert.compareJSX(wrapper.find('.file-field__errors'), expected);
  });

  it('can validate the form when the file changes', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {field: {files: []}};
    wrapper.find('input').props().onChange();
    wrapper.update();
    var expected = (
      <ul className="file-field__errors">
        {[<li className="file-field__error"
          key="required">
          This field is required.
        </li>]}
      </ul>);
    assert.equal(wrapper.prop('className').includes('error'), true);
    assert.compareJSX(wrapper.find('.file-field__errors'), expected);
  });

  it('generate a label when file is stored', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.setState({contents: 'foo'});
    wrapper.update();
    const expected = (
      <label className="file-field__label"
        htmlFor="Dingo">
        File stored.
      </label>);
    assert.compareJSX(wrapper.find('.file-field__label'), expected);
  });

  it('can set the focus on the field', () => {
    const wrapper = renderComponent();
    var instance = wrapper.instance();
    instance.refs = {field: {focus: sinon.stub()}};
    instance.focus();
    assert.equal(instance.refs.field.focus.callCount, 1);
  });
});
