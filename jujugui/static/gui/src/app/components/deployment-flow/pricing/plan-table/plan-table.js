/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const BasicTable = require('../../../basic-table/basic-table');

class DeploymentPlanTable extends React.Component {
  render() {
    return (
      <div className="deployment-plan-table">
        <BasicTable
          headerClasses={['deployment-plan-table__header-row']}
          headerColumnClasses={['deployment-plan-table__header-column']}
          headers={[{
            content: 'Applications',
            columnSize: 3
          }, {
            content: 'Plan',
            columnSize: 4
          }, {
            content: 'Metered',
            columnSize: 2
          }, {
            content: 'Price',
            classes: ['u-align--right'],
            columnSize: 3
          }]}
          rowClasses={['deployment-plan-table__table-row']}
          rowColumnClasses={['deployment-plan-table__table-column']}
          rows={[{
            columns: [{
              content: (
                <div>
                  <img alt="Apache Drill"
                    src="" />
                  Apache Drill
                </div>),
              columnSize: 3
            }, {
              content: (
                <div>
                  <h4>Databonus Dash</h4>
                  <p>
                    Spicule’s standard plan for Apache Drill is suitable for
                    large to very large workloads on clusters of 4-16 nodes.
                    Pricing is for the sum of RAM on all processing nodes.
                  </p>
                </div>),
              columnSize: 4
            }, {
              content: 'Memory',
              columnSize: 2,
              classes: ['u-align--right']
            }, {
              content: '$3.25 per GB of RAM per month',
              columnSize: 3,
              classes: ['u-align--right']
            }],
            key: 'apache'
          }]} />
      </div>
    );
  }
};

module.exports = DeploymentPlanTable;
