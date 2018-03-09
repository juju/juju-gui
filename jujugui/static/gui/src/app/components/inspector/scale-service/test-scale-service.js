/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const ScaleService = require('./scale-service');
const ButtonRow = require('../../button-row/button-row');
const Constraints = require('../../constraints/constraints');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('ScaleService', function() {
  var acl;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('hides the constraints on initial rendering', function() {
    var output = jsTestUtils.shallowRender(
      <ScaleService
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        serviceId="123" />);

    var child = output.props.children[2];
    assert.equal(child.props.className, 'scale-service--constraints hidden');
  });

  it('hides and shows constraints based on deployment option', function() {
    // We need to render the full component here as the shallowRenderer
    // does not yet support simulating change events.
    var output = testUtils.renderIntoDocument(
      <ScaleService
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        serviceId="123" />);

    var autoToggle = output.refs.autoPlaceUnitsToggle;
    var constraints = output.refs.constraintsContainer;
    assert.isTrue(constraints.classList.contains('hidden'));

    testUtils.Simulate.change(autoToggle);

    assert.isFalse(constraints.classList.contains('hidden'));
  });

  it('creates and autoplaces units if constraints is open', function() {
    const addGhostStub = sinon.stub();
    const createMachineStub = sinon.stub();
    const changeStateStub = sinon.stub();
    // We need to render the full component here as the shallowRenderer
    // does not yet support simulating change events.
    const output = testUtils.renderIntoDocument(
      <ScaleService
        acl={acl}
        addGhostAndEcsUnits={addGhostStub}
        changeState={changeStateStub}
        createMachinesPlaceUnits={createMachineStub}
        serviceId="123" />);

    // Set the value in the input.
    const unitCount = output.refs.numUnitsInput;
    unitCount.value = 3;
    testUtils.Simulate.change(unitCount);

    // Open the constraints and set their values.
    testUtils.Simulate.change(output.refs.autoPlaceUnitsToggle);

    const constraintsContainer = output.refs.constraintsContainer;

    const cpu = constraintsContainer.querySelector(
      'input[name="cpu-constraint"]');
    cpu.value = 'c p u';
    testUtils.Simulate.change(cpu);

    const cores = constraintsContainer.querySelector(
      'input[name="cores-constraint"]');
    cores.value = 'c o r e s';
    testUtils.Simulate.change(cores);

    const ram = constraintsContainer.querySelector(
      'input[name="mem-constraint"]');
    ram.value = 'r a m';
    testUtils.Simulate.change(ram);

    const disk = constraintsContainer.querySelector(
      'input[name="disk-constraint"]');
    disk.value = 'd i s k';
    testUtils.Simulate.change(disk);

    // Submit the scale-service form.
    const form = ReactDOM.findDOMNode(output);
    testUtils.Simulate.submit(form);
    assert.equal(createMachineStub.callCount, 1);
    assert.equal(addGhostStub.callCount, 0);
    assert.equal(changeStateStub.callCount, 1);
    // Check that the createMachinesPlaceUnits call was passed the proper data.
    assert.equal(createMachineStub.args[0][0], 3);
    assert.deepEqual(createMachineStub.args[0][1], {
      arch: '',
      'cpu-power': 'c p u',
      'cpu-cores': 'c o r e s',
      mem: 'r a m',
      'root-disk': 'd i s k'
    });
    // Check that it modifies state so that it shows the unit list.
    assert.deepEqual(changeStateStub.args[0][0], {
      gui: {
        inspector: {
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
      <ScaleService
        acl={acl}
        addGhostAndEcsUnits={addGhostStub}
        changeState={changeStateStub}
        createMachinesPlaceUnits={createMachineStub}
        serviceId="123" />);

    // Set the value in the input.
    var unitCount = output.refs.numUnitsInput;
    unitCount.value = 3;
    testUtils.Simulate.change(unitCount);
    // Submit the scale-service form.
    var form = ReactDOM.findDOMNode(output);
    testUtils.Simulate.submit(form);
    assert.equal(createMachineStub.callCount, 0);
    assert.equal(addGhostStub.callCount, 1);
    assert.equal(changeStateStub.callCount, 1);
    // Check that the addGhostAndEcsUnits call was called with the number of
    // units.
    assert.equal(addGhostStub.args[0][0], 3);
    // Check that it modifies state so that it shows the unit list and
    // the machine view.
    assert.deepEqual(changeStateStub.args[0][0], {
      gui: {
        inspector: {
          id: '123',
          activeComponent: 'units'
        },
        machines: ''
      }
    });
  });

  it('can disable the controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <ScaleService
        acl={acl}
        addGhostAndEcsUnits={sinon.stub()}
        changeState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        providerType='ec2'
        serviceId="123" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <form className="scale-service"
        onSubmit={instance._scaleUpService}>
        <div className="scale-service--units">
          <input
            autoComplete="off"
            className="scale-service--units__input"
            disabled={true}
            min="0"
            name="num-units"
            onChange={instance._updateState}
            ref="numUnitsInput"
            step="1"
            type="number" />
          <span className="scale-service--units__span">units</span>
        </div>
        <div className="scale-service--selector">
          <div>
            <input
              className="scale-service--selector__radio"
              disabled={true}
              id="auto-place-units" name="placement"
              onChange={instance._toggleConstraints}
              ref="autoPlaceUnitsToggle"
              type="radio" />
            <label htmlFor="auto-place-units">1 unit per machine</label>
          </div>
          <div>
            <input
              className="scale-service--selector__radio"
              defaultChecked={true}
              disabled={true} id="manually-place-units"
              name="placement"
              onChange={instance._toggleConstraints}
              type="radio" />
            <label htmlFor="manually-place-units">Manually place</label>
          </div>
        </div>
        <div className="scale-service--constraints hidden"
          ref="constraintsContainer">
          <Constraints
            disabled={true}
            hasUnit={true}
            providerType={'ec2'}
            valuesChanged={instance._updateConstraints} />
        </div>
        <ButtonRow buttons={[{
          disabled: true,
          title: 'Confirm',
          submit: true
        }]} />
      </form>);
    expect(output).toEqualJSX(expected);
  });

});
