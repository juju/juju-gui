/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentSupportSelectionPlan = require('./plan');
const SvgIcon = require('../../../../svg-icon/svg-icon');

describe('DeploymentSupportSelectionPlan', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentSupportSelectionPlan
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
    const expected = (
      <div className="deployment-support-select-plan four-col">
        <div
          className="deployment-support-select-plan__card"
          onClick={sinon.stub()}
          role="button"
          tabIndex="0">
          <h3>Gold</h3>
          <ul className="deployment-support-select-plan__features">
            <li
              className="deployment-support-select-plan__feature"
              key="feature 10">
              <SvgIcon
                name="bullet"
                size="14" />
              feature 1
            </li>
            <li
              className="deployment-support-select-plan__feature"
              key="feature 21">
              <SvgIcon
                name="bullet"
                size="14" />
              feature 2
            </li>
          </ul>
          <div className="deployment-support-select-plan__price">
            Monthly cost
            <span className="deployment-support-select-plan__price-number">
              ${'3600.00'}
            </span>
          </div>
        </div>
        <div className="deployment-support-select-plan__hour-price">
          ${'0.5'} per machine-hour
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
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
