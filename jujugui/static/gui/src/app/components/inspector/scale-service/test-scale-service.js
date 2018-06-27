/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const ScaleService = require('./scale-service');

describe('ScaleService', function() {
  let acl, initUtils;

  const renderComponent = (options = {}) => enzyme.shallow(
    <ScaleService
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      initUtils={options.initUtils || initUtils}
      serviceId={options.serviceId || '123'} />,
    { disableLifecycleMethods: true }
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    initUtils = shapeup.addReshape({
      addGhostAndEcsUnits: sinon.stub(),
      createMachinesPlaceUnits: sinon.stub()
    });
  });

  it('hides the constraints on initial rendering', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.scale-service--constraints').prop('className').includes('hidden'),
      true);
  });

  it('hides and shows constraints based on deployment option', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.scale-service--constraints').prop('className').includes('hidden'),
      true);
    wrapper.find('#auto-place-units').at(0).simulate('change', {
      currentTarget: {
        id: 'auto-place-units'
      }
    });
    wrapper.update();
    assert.equal(
      wrapper.find('.scale-service--constraints').prop('className').includes('hidden'),
      false);
  });

  it('creates and autoplaces units if constraints is open', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    // Set the value in the input.
    wrapper.find('.scale-service--units input').simulate('change', {
      currentTarget: {
        name: 'num-units',
        value: 3
      }
    });

    // Open the constraints and set their values.
    wrapper.find('#auto-place-units').at(0).simulate('change', {
      currentTarget: {
        id: 'auto-place-units'
      }
    });

    wrapper.find('Constraints').props().valuesChanged({
      arch: '',
      'cpu-power': 'c p u',
      'cpu-cores': 'c o r e s',
      mem: 'r a m',
      'root-disk': 'd i s k'
    });

    // Submit the scale-service form.
    wrapper.find('form').simulate('submit');
    assert.equal(initUtils.createMachinesPlaceUnits.callCount, 1);
    assert.equal(initUtils.addGhostAndEcsUnits.callCount, 0);
    assert.equal(changeState.callCount, 1);
    // Check that the createMachinesPlaceUnits call was passed the proper data.
    assert.equal(initUtils.createMachinesPlaceUnits.args[0][0], 3);
    assert.deepEqual(initUtils.createMachinesPlaceUnits.args[0][1], {
      arch: '',
      'cpu-power': 'c p u',
      'cpu-cores': 'c o r e s',
      mem: 'r a m',
      'root-disk': 'd i s k'
    });
    // Check that it modifies state so that it shows the unit list.
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: '123',
          activeComponent: 'units'
        }}
    });
  });

  it('creates and shows the machine view if constraints is closed', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    // Set the value in the input.
    wrapper.find('.scale-service--units input').simulate('change', {
      currentTarget: {
        name: 'num-units',
        value: 3
      }
    });
    // Submit the scale-service form.
    wrapper.find('form').simulate('submit');
    assert.equal(initUtils.createMachinesPlaceUnits.callCount, 0);
    assert.equal(initUtils.addGhostAndEcsUnits.callCount, 1);
    assert.equal(changeState.callCount, 1);
    // Check that the addGhostAndEcsUnits call was called with the number of
    // units.
    assert.equal(initUtils.addGhostAndEcsUnits.args[0][0], 3);
    // Check that it modifies state so that it shows the unit list and
    // the machine view.
    assert.deepEqual(changeState.args[0][0], {
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
    const wrapper = renderComponent();
    wrapper.find('input').forEach(input => {
      assert.equal(input.prop('disabled'), true);
    });
    assert.equal(wrapper.find('Constraints').prop('disabled'), true);
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[0].disabled, true);
  });

});
