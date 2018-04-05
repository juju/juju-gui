/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const BasicTable = require('../../../basic-table/basic-table');

class DeploymentPlanTable extends React.Component {
  _generateRows() {

    const data = [{
      charm: {
        name: 'Apache Drill',
        icon:
          'https://api.jujucharms.com/charmstore/v5/~spiculecharms/apache-drill-25/icon.svg'
      },
      plan: {
        title: 'Databonus Dash',
        description: `Spicule’s standard plan for Apache Drill is suitable for
          large to very large workloads on clusters of 4-16 nodes.
          Pricing is for the sum of RAM on all processing nodes.`
      },
      metered: 'Memory',
      price: '$3.25 per GB of RAM per month'
    }, {
      charm: {
        name: 'Saiku EE',
        icon: 'https://api.jujucharms.com/charmstore/v5/~spicule/' +
          'saikuanalytics-enterprise-22/icon.svg'
      },
      plan: {
        title: 'Starter pack',
        description: `Our default plan for Saiku Business Intelligence covers
          up to 50 users.`
      },
      metered: 'Users',
      price: '$6 per user per month'
    }];
    return data.map(row => ({
      columns: [{
        content: (
          <div>
            <img alt={row.charm.name}
              className="deployment-plan-table__charm-icon"
              src={row.charm.icon} />
            <span className="deployment-plan-table__charm-name">
              {row.charm.name}
            </span>
          </div>),
        columnSize: 3
      }, {
        content: (
          <div>
            <h4 className="deployment-plan-table__plan-title">
              {row.plan.title}
            </h4>
            <p className="deployment-plan-table__plan-description">
              {row.plan.description}
            </p>
          </div>),
        columnSize: 3
      }, {
        content: '',
        columnSize: 1
      }, {
        content: row.metered,
        columnSize: 2
      }, {
        content: row.price,
        columnSize: 3,
        classes: ['u-align--right']
      }],
      key: row.charm.name
    }));
  }

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
          rowClasses={['deployment-plan-table__row']}
          rowColumnClasses={['deployment-plan-table__column']}
          rows={this._generateRows()} />
      </div>
    );
  }
};

module.exports = DeploymentPlanTable;
