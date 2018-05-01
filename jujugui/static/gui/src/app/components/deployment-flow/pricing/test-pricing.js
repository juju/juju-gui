/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentPlanTable = require('./plan-table/plan-table');
const DeploymentPricing = require('./pricing');
const DeploymentSupportSelection = require('./support-selection/support-selection');

describe('DeploymentPricing', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentPricing
      addNotification={options.addNotification || sinon.stub()}
      applications={options.applications || []}
      charms={options.charms || {}}
      getSLAMachineRates={options.getSLAMachineRates || sinon.stub()}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-pricing">
        <DeploymentPlanTable
          addNotification={sinon.stub()}
          applications={[]}
          charms={{}}
          listPlansForCharm={sinon.stub()} />
        <div className="twelve-col">
          <div className="six-col deployment-pricing__secondary-text">
            Monthly cost is determined by price plan, support level, and by usage.
          </div>
          <div className="six-col last-col u-align--right deployment-pricing__estimated-price">
            Estimated application cost:
            <span className="deployment-pricing__estimated-price-number">
              $3500.00
            </span>
          </div>
        </div>
        <div className="twelve-col no-margin-bottom">
          <div className="six-col deployment-pricing__support-title">
            Choose your level of support
          </div>
          <div className="six-col last-col u-align--right deployment-pricing__estimated-price">
            <span className="link">
              Support details
            </span>
          </div>
        </div>
        <DeploymentSupportSelection getSLAMachineRates={sinon.stub()} />
        <div className="twelve-col no-margin-bottom">
          <div className="six-col no-margin-bottom deployment-pricing__secondary-text">
            <strong>Estimated costs based on 8 machines.</strong> Support is
            billed monthly. You can upgrade the level at any time, and downgrade
            at the end of a month.
          </div>
          <div className="six-col last-col u-align--right no-margin-bottom">
            <span className="link">
              Unsupported trial version
            </span>
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});