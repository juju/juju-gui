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
  let option;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('string-config', function() { done(); });
  });

  beforeEach(() => {
      option = {
        key: 'testconfig',
        type: 'text',
        description: 'test config for strings'
      };
  });

  it('renders a string config', function() {
    var config = 'the value';
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config={config}
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    var typeString = ` (${option.type})`;
    var expected = (
      <div className="string-config">
        <span className="string-config__label">{option.key}{typeString}</span>
        <div className="string-config--value">
          <juju.components.StringConfigInput
            config={config}
            disabled={false}
            ref="editableInput"
            setValue={instance._setValue} />
        </div>
        <span className="string-config--description"
          dangerouslySetInnerHTML={{__html: option.description}}>
        </span>
      </div>);
    expect(output).toEqualJSX(expected);
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
    var config = 'the value';
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config={config}
        disabled={true}
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    var expected = (
    <div className="string-config--value string-config--disabled">
      <juju.components.StringConfigInput
        config={config}
        disabled={true}
        ref="editableInput"
        setValue={instance._setValue} />
    </div>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can display a changed value', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config="the value"
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    instance._setValue('different value');
    const output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.className,
      'string-config--value string-config--changed');
  });

  it('correctly compares existing numbers', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config={123}
        option={option} />, true);
    const instance = renderer.getMountedInstance();
    instance._setValue('123');
    const output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.className,
      'string-config--value');
  });
});
