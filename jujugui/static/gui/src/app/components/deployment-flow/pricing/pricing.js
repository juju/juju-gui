/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const PropTypes = require('prop-types');

const DeploymentPlanTable = require('./plan-table/plan-table');
const DeploymentSupportSelection = require('./support-selection/support-selection');
const Link = require('../../link/link');

const DeploymentPricing = props => {
  return (
    <div className="deployment-pricing">
      <DeploymentPlanTable
        addNotification={props.addNotification}
        applications={props.applications}
        charms={props.charms}
        listPlansForCharm={props.listPlansForCharm} />
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
      <div className="twelve-col no-margin-bottom"
        id="support-level">
        <div className="six-col deployment-pricing__support-title">
          Choose your level of support
        </div>
        <div className="six-col last-col u-align--right deployment-pricing__estimated-price">
          <a href="https://www.ubuntu.com/support/plans-and-pricing#ua-support"
            target="_blank">
            Support details
          </a>
        </div>
      </div>
      <DeploymentSupportSelection getSLAMachineRates={props.getSLAMachineRates} />
      <div className="twelve-col no-margin-bottom">
        <div className="six-col no-margin-bottom deployment-pricing__secondary-text">
          <strong>Estimated costs based on 8 machines.</strong> Support is
          billed monthly. You can upgrade the level at any time, and downgrade
          at the end of a month.
        </div>
        <div className="six-col last-col u-align--right no-margin-bottom">
          <Link changeState={props.changeState}
            clickState={{
              gui: {
                deploy: ''
              }
            }}
            generatePath={props.generatePath}>
            Unsupported trial version
          </Link>
        </div>
      </div>
    </div>
  );
};

DeploymentPricing.propTypes = {
  addNotification: PropTypes.func.isRequired,
  applications: PropTypes.array.isRequired,
  changeState: PropTypes.func.isRequired,
  charms: PropTypes.object.isRequired,
  generatePath: PropTypes.func.isRequired,
  getSLAMachineRates: PropTypes.func.isRequired,
  listPlansForCharm: PropTypes.func.isRequired
};

module.exports = DeploymentPricing;
