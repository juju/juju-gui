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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('BooleanConfig', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('boolean-config', function() { done(); });
  });

  it('renders a checked input based on config prop', function() {
    var option = {
      key: 'testcheck',
      description: 'it is a test config option',
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.BooleanConfig
        config={true}
        option={option} />
    );
    assert.deepEqual(output,
      <div className="boolean-config">
        <div className="boolean-config--title">{option.key}: </div>
        <div className="boolean-config--toggle">
          <input
            type="checkbox"
            id={option.key}
            onClick={output.props.children[1].props.children[0].props.onClick}
            onChange={output.props.children[1].props.children[0].props.onChange}
            checked={true}
            className="boolean-config--input" />
          <label
            htmlFor={option.key}
            className="boolean-config--label">
            <div className="boolean-config--handle"></div>
          </label>
        </div>
        <div className="boolean-config--description">
          {option.description}
        </div>
      </div>);
  });

  it('renders an unchecked input based on config prop', function() {
    var option = {
      key: 'testcheck',
      description: 'it is a test config option',
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.BooleanConfig
        config={false}
        option={option} />
    );
    assert.deepEqual(output,
      <div className="boolean-config">
        <div className="boolean-config--title">{option.key}: </div>
        <div className="boolean-config--toggle">
          <input
            type="checkbox"
            id={option.key}
            onClick={output.props.children[1].props.children[0].props.onClick}
            onChange={output.props.children[1].props.children[0].props.onChange}
            checked={false}
            className="boolean-config--input" />
          <label
            htmlFor={option.key}
            className="boolean-config--label">
            <div className="boolean-config--handle"></div>
          </label>
        </div>
        <div className="boolean-config--description">
          {option.description}
        </div>
      </div>);
  });

  it('supports string boolean config props (true)', function() {
    var option = {
      key: 'testcheck',
      description: 'it is a test config option',
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.BooleanConfig
        config="True"
        option={option} />
    );
    assert.deepEqual(output,
      <div className="boolean-config">
        <div className="boolean-config--title">{option.key}: </div>
        <div className="boolean-config--toggle">
          <input
            type="checkbox"
            id={option.key}
            onClick={output.props.children[1].props.children[0].props.onClick}
            onChange={output.props.children[1].props.children[0].props.onChange}
            checked={true}
            className="boolean-config--input" />
          <label
            htmlFor={option.key}
            className="boolean-config--label">
            <div className="boolean-config--handle"></div>
          </label>
        </div>
        <div className="boolean-config--description">
          {option.description}
        </div>
      </div>);
  });

  it('supports string boolean config props (false)', function() {
    var option = {
      key: 'testcheck',
      description: 'it is a test config option',
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.BooleanConfig
        config="False"
        option={option} />
    );
    assert.deepEqual(output,
      <div className="boolean-config">
        <div className="boolean-config--title">{option.key}: </div>
        <div className="boolean-config--toggle">
          <input
            type="checkbox"
            id={option.key}
            onClick={output.props.children[1].props.children[0].props.onClick}
            onChange={output.props.children[1].props.children[0].props.onChange}
            checked={false}
            className="boolean-config--input" />
          <label
            htmlFor={option.key}
            className="boolean-config--label">
            <div className="boolean-config--handle"></div>
          </label>
        </div>
        <div className="boolean-config--description">
          {option.description}
        </div>
      </div>);
  });
});
