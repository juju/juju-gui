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

describe('MultiButton', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('multi-button', function() { done(); });
  });

  it('can render', function() {
    var action = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MultiButton.prototype.wrappedComponent
        action={action}
        defaultValue="default"
        options={['option1', 'option2']}
        type="positive"
        label="Super duper multi button glooper!" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="multi-button">
        <juju.components.GenericButton
          action={output.props.children[0].props.action}
          type="positive"
          title="Super duper multi button glooper!" />
        <juju.components.GenericButton
          action={instance._toggleList}
          icon="chevron_down_white_16"
          type="positive" />
        {undefined}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display the list', function() {
    var action = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MultiButton.prototype.wrappedComponent
        action={action}
        defaultValue="default"
        options={[{
          value: 'option1',
          label: 'label1'
        }]}
        type="positive"
        label="Super duper multi button glooper!" />, true);
    var output = renderer.getRenderOutput();
    // Toggle the list
    output.props.children[1].props.action();
    output = renderer.getRenderOutput();
    var list = output.props.children[2];
    var expected = (
      <ul className="multi-button__list">
        {[<li className="multi-button__list-item"
          key="option10"
          onClick={list.props.children[0].props.onClick}
          role="button"
          tabIndex="0">
          label1
        </li>]}
      </ul>);
    assert.deepEqual(list, expected);
  });

  it('can close the list when clicked outside', function() {
    var action = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MultiButton.prototype.wrappedComponent
        action={action}
        defaultValue="default"
        options={[{
          value: 'option1',
          label: 'label1'
        }]}
        type="positive"
        label="Super duper multi button glooper!" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    // Toggle the list
    output.props.children[1].props.action();
    renderer.getRenderOutput();
    instance.handleClickOutside();
    output = renderer.getRenderOutput();
    assert.isUndefined(output.props.children[2]);
  });
});
