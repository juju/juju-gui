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
var testUtils = React.addons.TestUtils;

describe('MachineViewAddMachine', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-add-machine', function() { done(); });
  });

  it('can render for creating a machine', function() {
    var close = sinon.stub();
    var createMachine = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewAddMachine
        close={close}
        createMachine={createMachine} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      title: 'Cancel',
      action: close
    }, {
      title: 'Create',
      action: instance._createMachine,
      type: 'confirm'
    }];
    var expected = (
      <div className="add-machine">
        {undefined}
        <div className="add-machine__constraints">
          <h4 className="add-machine__title">
            Define constraints
          </h4>
          <juju.components.Constraints
            valuesChanged={instance._updateConstraints} />
        </div>
        <juju.components.ButtonRow buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render for creating a container', function() {
    var close = sinon.stub();
    var createMachine = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewAddMachine
        close={close}
        createMachine={createMachine}
        parentId="new0" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      title: 'Cancel',
      action: close
    }, {
      title: 'Create',
      action: instance._createMachine,
      type: 'confirm'
    }];
    var expected = (
      <div className="add-machine">
        <select className="add-machine__container-type"
          defaultValue=""
          onChange={instance._updateContainerType}>
          <option disabled={true} value="">
            Choose container type...
          </option>
          <option value="lxc">LXC</option>
          <option value="kvm">KVM</option>
        </select>
        {undefined}
        <juju.components.ButtonRow buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can call the cancel method', function() {
    var close = sinon.stub();
    var createMachine = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewAddMachine
        close={close}
        createMachine={createMachine} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[2].props.buttons[0].action();
    assert.equal(close.callCount, 1);
  });

  it('can call the cancel method', function() {
    var close = sinon.stub();
    var createMachine = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewAddMachine
        close={close}
        createMachine={createMachine} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[2].props.buttons[0].action();
    assert.equal(close.callCount, 1);
  });

  it('can create a machine', function() {
    var close = sinon.stub();
    var createMachine = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MachineViewAddMachine
        close={close}
        createMachine={createMachine} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    output.props.children[2].props.buttons[1].action();
    assert.equal(createMachine.callCount, 1);
    assert.equal(createMachine.args[0][0], null);
    assert.equal(createMachine.args[0][1], null);
    assert.equal(createMachine.args[0][2], instance.state.constraints);
  });

  it('can create a container', function() {
    var close = sinon.stub();
    var createMachine = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.MachineViewAddMachine
        close={close}
        createMachine={createMachine}
        parentId="new0" />);
    var outputNode = output.getDOMNode();
    var selectNode = outputNode.querySelector('.add-machine__container-type');
    selectNode.value = 'lxc';
    testUtils.Simulate.change(selectNode);
    testUtils.Simulate.click(outputNode.querySelector(
      '.generic-button--type-confirm'));
    assert.equal(createMachine.callCount, 1);
    assert.equal(createMachine.args[0][0], 'lxc');
    assert.equal(createMachine.args[0][1], 'new0');
  });
});
