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

describe('PanelComponent', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('panel-component', function() { done(); });
  });

  it('generates a visible panel when visible flag is provided', function() {
    var instanceName = 'custom-instance-name';
    var renderer = jsTestUtils.shallowRender(
        <juju.components.Panel
          instanceName={instanceName}
          visible={true} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="panel-component custom-instance-name"
        onClick={instance._handleClick}>
        <div onClick={instance._stopBubble}>
          {undefined}
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('generates a hidden panel if visible flag is falsey', function() {
    var instanceName = 'custom-instance-name';
    var renderer = jsTestUtils.shallowRender(
        <juju.components.Panel
          instanceName={instanceName} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="panel-component custom-instance-name hidden"
        onClick={instance._handleClick}>
        <div onClick={instance._stopBubble}>
          {undefined}
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('renders provided children components', function() {
    var instanceName = 'custom-instance-name';
    var renderer = jsTestUtils.shallowRender(
        <juju.components.Panel
          instanceName={instanceName}
          visible={true}>
          <div>child</div>
        </juju.components.Panel>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="panel-component custom-instance-name"
        onClick={instance._handleClick}>
        <div onClick={instance._stopBubble}>
          <div>child</div>
        </div>
      </div>);
  });

  it('can call a function on click if provided', function() {
    var instanceName = 'custom-instance-name';
    var clickAction = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
        <juju.components.Panel
          instanceName={instanceName}
          clickAction={clickAction}
          visible={true} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleClick();
    assert.equal(clickAction.callCount, 1);
  });

  it('does not bubble clicks from the children', function() {
    var instanceName = 'custom-instance-name';
    var clickAction = sinon.stub();
    var stopPropagation = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
        <juju.components.Panel
          instanceName={instanceName}
          clickAction={clickAction}
          visible={true} />, true);
    var output = renderer.getRenderOutput();
    output.props.children.props.onClick({stopPropagation: stopPropagation});
    assert.equal(stopPropagation.callCount, 1);
    assert.equal(clickAction.callCount, 0);
  });
});
