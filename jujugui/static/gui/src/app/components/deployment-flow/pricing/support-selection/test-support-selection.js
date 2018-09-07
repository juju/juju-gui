'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentSupportSelection = require('./support-selection');
const DeploymentSupportSelectionPlan = require('./plan/plan');

describe('DeploymentSupportSelection', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentSupportSelection
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
    const plans = wrapper.find('DeploymentSupportSelectionPlan');
    const expected = (
      <div className="deployment-support-selection equal-height">
        <DeploymentSupportSelectionPlan
          classes={[]}
          features={['8hx5d ticked']}
          hourPrice="0.011"
          key="Essential"
          machineCount={3}
          onSelect={plans.at(0).prop('onSelect')}
          selected={false}
          title="Essential" />
        <DeploymentSupportSelectionPlan
          classes={[]}
          features={[
            '10x5 phone support',
            '2hr critical response'
          ]}
          hourPrice="0.055"
          key="Standard"
          machineCount={3}
          onSelect={plans.at(1).prop('onSelect')}
          selected={false}
          title="Standard" />
        <DeploymentSupportSelectionPlan
          classes={['last-col']}
          features={[
            '24x7 phone support',
            '1hr critical response'
          ]}
          hourPrice="0.110"
          key="Advanced"
          machineCount={3}
          onSelect={plans.at(2).prop('onSelect')}
          selected={false}
          title="Advanced" />
      </div>);
    assert.compareJSX(wrapper, expected);
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
