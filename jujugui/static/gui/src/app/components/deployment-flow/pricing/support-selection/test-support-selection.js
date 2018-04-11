/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentSupportSelection = require('./support-selection');
const DeploymentSupportSelectionPlan = require('./plan/plan');

describe('DeploymentSupportSelection', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentSupportSelection />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    const plans = wrapper.find('DeploymentSupportSelectionPlan');
    const expected = (
      <div className="deployment-support-selection equal-height">
        <DeploymentSupportSelectionPlan
          classes={[]}
          cost="8.75"
          features={['8hx5d ticked']}
          hourPrice="0.00856"
          key="Essential"
          onSelect={plans.at(0).prop('onSelect')}
          selected={false}
          title="Essential" />
        <DeploymentSupportSelectionPlan
          classes={[]}
          cost="77.00"
          features={[
            '10x5 phone support',
            '2hr critical response'
          ]}
          hourPrice="0.02853"
          key="Standard"
          onSelect={plans.at(1).prop('onSelect')}
          selected={false}
          title="Standard" />
        <DeploymentSupportSelectionPlan
          classes={['last-col']}
          cost="154.00"
          features={[
            '24x7 phone support',
            '1hr critical response'
          ]}
          hourPrice="0.05707"
          key="Advanced"
          onSelect={plans.at(2).prop('onSelect')}
          selected={false}
          title="Advanced" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can select a plan', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    const plan = wrapper.find('DeploymentSupportSelectionPlan').at(1);
    assert.equal(plan.prop('selected'), false);
    plan.props().onSelect();
    assert.equal(instance.state.selectedPlan, 'Standard');
    wrapper.update();
    assert.equal(
      wrapper.find('DeploymentSupportSelectionPlan').at(1).prop('selected'),
      true);
  });
});
