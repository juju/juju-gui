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

describe('MachineViewAddMachine', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('machine-view-add-machine', function() { done(); });
  });

  it('can render', function() {
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
        <juju.components.Constraints
          valuesChanged={instance._updateConstraints} />
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
    output.props.children[1].props.buttons[0].action();
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
    output.props.children[1].props.buttons[0].action();
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
    output.props.children[1].props.buttons[1].action();
    assert.equal(createMachine.callCount, 1);
    assert.equal(createMachine.args[0][0], null);
    assert.equal(createMachine.args[0][1], null);
    assert.equal(createMachine.args[0][2], instance.state.constraints);
  });
});
