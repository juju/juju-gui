/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
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

describe('GenericInput', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('generic-input', function() { done(); });
  });

  it('can render', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="generic-input">
        <label className="generic-input__label"
          htmlFor="Region">
          Region
        </label>
        <input className="generic-input__field"
          defaultValue="default"
          disabled={false}
          id="Region"
          placeholder="us-central-1"
          required={true}
          onChange={instance.validate}
          onFocus={instance._focusHandler}
          onBlur={instance._blurHandler}
          ref="field"
          type="text" />
        {null}
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can return the field value', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: 'default'}};
    assert.equal(instance.getValue(), 'default');
  });

  it('can validate the form', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    instance.validate();
    var output = renderer.getRenderOutput();
    var expected = (
      <ul className="generic-input__errors">
        {[<li className="generic-input__error"
          key="This field is required.">
          This field is required.
        </li>]}
      </ul>
    );
    assert.deepEqual(output.props.children[2], expected);
  });

  it('can validate when there are no validations set', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={undefined} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    instance.validate();
    var output = renderer.getRenderOutput();
    assert.isNull(output.props.children[2]);
  });

  it('can validate the form when typing', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    var output = renderer.getRenderOutput();
    output.props.children[1].props.onChange();
    output = renderer.getRenderOutput();
    var expected = (
      <ul className="generic-input__errors">
        {[<li className="generic-input__error"
          key="This field is required.">
          This field is required.
        </li>]}
      </ul>
    );
    assert.deepEqual(output.props.children[2], expected);
  });

  it('allows the label to be optional', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="generic-input">
        {undefined}
        <input className="generic-input__field"
          defaultValue="default"
          disabled={false}
          id={undefined}
          placeholder="us-central-1"
          required={true}
          onChange={instance.validate}
          onFocus={instance._focusHandler}
          onBlur={instance._blurHandler}
          ref="field"
          type="text" />
        {null}
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('adds a class to the wrapper element on error', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {value: ''}};
    var output = renderer.getRenderOutput();
    output.props.children[1].props.onChange();
    output = renderer.getRenderOutput();
    assert.deepEqual(output.props.className, 'generic-input error');
  });

  it('can set the focus on the field', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.GenericInput
        disabled={false}
        label="Region"
        placeholder="us-central-1"
        required={true}
        ref="templateRegion"
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]}
        value="default" />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {field: {focus: sinon.stub()}};
    instance.focus();
    assert.equal(instance.refs.field.focus.callCount, 1);
  });
});
