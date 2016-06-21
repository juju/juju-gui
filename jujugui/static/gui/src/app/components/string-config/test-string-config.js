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

describe('StringConfig', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('string-config', function() { done(); });
  });

  it('renders a string config', function() {
    var option = {
      key: 'testconfig',
      type: 'text',
      description: 'test config for strings'
    };
    var config = 'the value';
    var output = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config={config}
        option={option} />);
    var typeString = ` (${option.type})`;
    var expected = (
      <div className="string-config">
        <span>{option.key}{typeString}</span>
        <div
          className="string-config--value"
          contentEditable={true}
          ref="editableInput"
          onInput={output.props.children[1].props.onInput}
          onBlur={output.props.children[1].props.onBlur}
          dangerouslySetInnerHTML={{__html: config}}>
        </div>
        <span className="string-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </span>
      </div>);
    assert.deepEqual(output, expected);
  });

  function stubRef(instance, output) {
    // Because shallow render doesn't support refs we have to fake it.
    // Should be 'editableInput'.
    var inputRef = output.props.children[1].ref;
    instance.refs = {};
    instance.refs[inputRef] = {
      innerText: 'initial'
    };
  }

  it('can update when new config is provided', function() {
    var option = {
      key: 'testconfig',
      type: 'text',
      description: 'test config for strings'
    };
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config="initial"
        option={option} />, true);
    var output = shallowRenderer.getRenderOutput();
    var instance = shallowRenderer.getMountedInstance();
    stubRef(instance, output);
    assert.equal(instance.state.value, 'initial');
    shallowRenderer.render(
      <juju.components.StringConfig
        config="updated"
        option={option} />);
    assert.equal(instance.state.value, 'updated');
  });

  it('only updates the input on state change if values differ', function() {
    var option = {
      key: 'testconfig',
      type: 'text',
      description: 'test config for strings'
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config="initial"
        option={option} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    stubRef(instance, output);
    // It should update if state and the value differ
    assert.equal(
      instance.shouldComponentUpdate(null, {
        value: 'not initial'
      }),
      true,
      'Component should have updated');
    // It should not update if the state and the value are the same. This is
    // bedcause in FireFox it does not maintain the cursor position when
    // re-rendering the content editable field.
    assert.equal(
      instance.shouldComponentUpdate(null, {
        value: 'initial'
      }),
      false,
      'Component should not have updated');
  });

  it('does not show a type if none is provided', function() {
    var option = {
      key: 'testconfig',
      description: 'test config for strings'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config="initial"
        option={option} />);
    assert.deepEqual(
      output.props.children[0].props.children, ['testconfig', '']);
  });

  it('can be disabled', function() {
    var option = {
      key: 'testconfig',
      type: 'text',
      description: 'test config for strings'
    };
    var config = 'the value';
    var output = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config={config}
        disabled={true}
        option={option} />);
    var expected = (
      <div
        className="string-config--value string-config--disabled"
        contentEditable={false}
        ref="editableInput"
        onInput={output.props.children[1].props.onInput}
        onBlur={output.props.children[1].props.onBlur}
        dangerouslySetInnerHTML={{__html: config}}>
      </div>);
    assert.deepEqual(output.props.children[1], expected);
  });
});
