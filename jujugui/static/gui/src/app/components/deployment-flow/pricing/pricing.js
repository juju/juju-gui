/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentPlanTable = require('./plan-table/plan-table');

class DeploymentPricing extends React.Component {
  render() {
    return (
      <div className="deployment-pricing">
        <DeploymentPlanTable />
      </div>
    );
  }
};

module.exports = DeploymentPricing;
