/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('../../../../../test/fake-analytics');
const DeploymentSupportSelection = require('./support-selection');

describe('DeploymentSupportSelection', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentSupportSelection
      analytics={Analytics}
      getSLAMachineRates={options.getSLAMachineRates || sinon.stub()}
      machineCount="3"
      setSLA={options.setSLA || sinon.stub()} />
  );

  it('can render', () => {
    const data = {
      advanced: '0.110',
      essential: '0.011',
      standard: '0.055',
      unsupported: '0.000'
    };
    const wrapper = renderComponent({
      getSLAMachineRates: cb => cb(data)
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('shows the spinner while requesting SLA rates', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can select a plan', () => {
    const data = {
      advanced: '0.110',
      essential: '0.011',
      standard: '0.055',
      unsupported: '0.000'
    };
    const setSLA = sinon.stub();
    const wrapper = renderComponent({
      getSLAMachineRates: cb => cb(data),
      setSLA: setSLA
    });
    const instance = wrapper.instance();
    const plan = wrapper.find('DeploymentSupportSelectionPlan').at(1);
    assert.equal(plan.prop('selected'), false);
    plan.props().onSelect();
    assert.equal(instance.state.selectedPlan, 'standard');
    wrapper.update();
    assert.equal(
      wrapper.find('DeploymentSupportSelectionPlan').at(1).prop('selected'),
      true);
    assert.deepEqual(setSLA.args[0], [{name: 'standard', hourPrice: '0.055'}]);
  });
});
