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

describe('StringConfigInput', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('string-config-input', function() { done(); });
  });

  it('can render', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfigInput
        config="config value"
        disabled={false}
        setValue={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    var expected = (
      <div className="string-config-input"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'config value'}}
        onBlur={instance._updateValue}
        onInput={instance._updateValue}
        ref="editableInput">
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can update the value', function() {
    const setValue = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfigInput
        config="config value"
        disabled={false}
        setValue={setValue} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    output.props.onInput({
      currentTarget: {
        innerText: 'new value'
      }
    });
    assert.equal(setValue.callCount, 1);
    assert.equal(setValue.args[0][0], 'new value');
  });

  it('does not update if the values are the same', function() {
    const setValue = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfigInput
        config="config value"
        disabled={false}
        setValue={setValue} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    output.props.onInput({
      currentTarget: {
        innerText: 'new value'
      }
    });
    output = renderer.getRenderOutput();
    var expected = (
      <div className="string-config-input"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'config value'}}
        onBlur={instance._updateValue}
        onInput={instance._updateValue}
        ref="editableInput">
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('updates if the values are the different', function() {
    const setValue = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfigInput
        config="config value"
        disabled={false}
        setValue={setValue} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    output.props.onInput({
      currentTarget: {
        innerText: 'another value'
      }
    });
    output = renderer.getRenderOutput();
    var expected = (
      <div className="string-config-input"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'another value'}}
        onBlur={instance._updateValue}
        onInput={instance._updateValue}
        ref="editableInput">
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
