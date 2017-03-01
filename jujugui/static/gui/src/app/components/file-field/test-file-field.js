/*
This file is part of the Juju GUI, which lets users view and manage Juju
models within a graphical interface (https://github.com/juju/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('FileField', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('file-field', function() { done(); });
  });

  it('can render', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.FileField
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
          required={true}
          onChange={instance.validate}
          ref="field"
          type="file" />
        <label className="file-field__label"
          htmlFor="Dingo">
          Dingo
        </label>
        {null}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can return the field value', done => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.FileField
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
      <juju.components.FileField
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
          required={true}
          onChange={instance.validate}
          ref="field"
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
    assert.deepEqual(output, expected);
  });

  it('generate a label when file is stored', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.FileField
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
          required={true}
          onChange={instance.validate}
          ref="field"
          type="file" />
        <label className="file-field__label"
          htmlFor="Dingo">
          File stored.
        </label>
        {null}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can set the focus on the field', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.FileField
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
