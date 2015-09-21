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

describe('ScaleService', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('scale-service', function() { done(); });
  });

  it('hides the constraints on initial rendering', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.ScaleService
        serviceId="123" />);

    var child = output.props.children[2];
    assert.equal(child.props.className, 'scale-service__constraints hidden');
  });

  it('hides and shows constraints based on deployment option', function() {
    // We need to render the full component here as the shallowRenderer
    // does not yet support simulating change events.
    var output = testUtils.renderIntoDocument(
      <juju.components.ScaleService
        serviceId="123" />);

    var autoToggle = output.getDOMNode().querySelector('#auto-place-units');
    var constraints =
      output.getDOMNode().querySelector('.scale-service__constraints.hidden');
    assert.isNotNull(constraints);

    testUtils.Simulate.change(autoToggle);

    constraints =
      output.getDOMNode().querySelector('.scale-service__constraints');
    assert.isNotNull(constraints);
  });

  it('creates and autoplaces units if constraints is open', function() {
    var addGhostStub = sinon.stub();
    var createMachineStub = sinon.stub();
    var changeStateStub = sinon.stub();
    // We need to render the full component here as the shallowRenderer
    // does not yet support simulating change events.
    var output = testUtils.renderIntoDocument(
      <juju.components.ScaleService
        serviceId="123"
        addGhostAndEcsUnits={addGhostStub}
        createMachinesPlaceUnits={createMachineStub}
        changeState={changeStateStub} />);

    // Set the value in the input.
    var unitCount = output.getDOMNode().querySelector('input[name=num-units]');
    unitCount.value = 3;
    testUtils.Simulate.change(unitCount);

    // Open the constraints and set their values.
    var autoToggle = output.getDOMNode().querySelector('#auto-place-units');
    testUtils.Simulate.change(autoToggle);

    var cpu = output.getDOMNode().querySelector('input[name=cpu-constraint]');
    cpu.value = 'c p u';
    testUtils.Simulate.change(cpu);

    var cores = output.getDOMNode().querySelector(
        'input[name=cores-constraint]');
    cores.value = 'c o r e s';
    testUtils.Simulate.change(cores);

    var ram = output.getDOMNode().querySelector('input[name=ram-constraint]');
    ram.value = 'r a m';
    testUtils.Simulate.change(ram);

    var disk  = output.getDOMNode().querySelector(
        'input[name=disk-constraint]');
    disk.value = 'd i s k';
    testUtils.Simulate.change(disk);

    // Click the submit button in the ButtonRow component.
    var button = output.getDOMNode().querySelector('button');
    testUtils.Simulate.click(button);
    assert.equal(createMachineStub.callCount, 1);
    assert.equal(addGhostStub.callCount, 0);
    assert.equal(changeStateStub.callCount, 1);
    // Check that the createMachinesPlaceUnits call was passed the proper data.
    assert.equal(createMachineStub.args[0][0], 3);
    assert.deepEqual(createMachineStub.args[0][1], {
      'cpu-power': 'c p u',
      'cpu-cores': 'c o r e s',
      'mem': 'r a m',
      'root-disk': 'd i s k'
    });
    // Check that it modifies state so that it shows the unit list.
    assert.deepEqual(changeStateStub.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: '123',
          activeComponent: 'units'
        }}
    });
  });

  it('creates and shows the machine view if constraints is closed', function() {
    var addGhostStub = sinon.stub();
    var createMachineStub = sinon.stub();
    var changeStateStub = sinon.stub();
    // We need to render the full component here as the shallowRenderer
    // does not yet support simulating change events.
    var output = testUtils.renderIntoDocument(
      <juju.components.ScaleService
        serviceId="123"
        addGhostAndEcsUnits={addGhostStub}
        createMachinesPlaceUnits={createMachineStub}
        changeState={changeStateStub} />);

    // Set the value in the input.
    var unitCount = output.getDOMNode().querySelector('input[name=num-units]');
    unitCount.value = 3;
    testUtils.Simulate.change(unitCount);
    // Click the submit button in the ButtonRow component.
    var button = output.getDOMNode().querySelector('button');
    testUtils.Simulate.click(button);
    assert.equal(createMachineStub.callCount, 0);
    assert.equal(addGhostStub.callCount, 1);
    assert.equal(changeStateStub.callCount, 1);
    // Check that the addGhostAndEcsUnits call was called with the number of
    // units.
    assert.equal(addGhostStub.args[0][0], 3);
    // Check that it modifies state so that it shows the unit list and
    // the machine view.
    assert.deepEqual(changeStateStub.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: '123',
          activeComponent: 'units'
        }
      },
      sectionB: {
        component: 'machine'
      }
    });
  });

});
