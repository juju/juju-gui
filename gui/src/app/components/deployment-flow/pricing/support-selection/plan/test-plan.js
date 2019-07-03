/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('test/fake-analytics');
const DeploymentSupportSelectionPlan = require('./plan');

describe('DeploymentSupportSelectionPlan', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentSupportSelectionPlan
      analytics={Analytics}
      classes={options.classes}
      features={options.features || ['feature 1', 'feature 2']}
      hourPrice={options.hourPrice || '0.5'}
      machineCount={10}
      onSelect={options.onSelect || sinon.stub()}
      selected={options.selected === undefined ? false : options.selected}
      title={options.title || 'Gold'} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can display as selected', function() {
    const wrapper = renderComponent({selected: true});
    assert.equal(
      wrapper.prop('className').includes('deployment-support-select-plan--selected'),
      true);
  });

  it('can handle extra classes', function() {
    const wrapper = renderComponent({classes: ['extra']});
    assert.equal(wrapper.prop('className').includes('extra'), true);
  });
});
