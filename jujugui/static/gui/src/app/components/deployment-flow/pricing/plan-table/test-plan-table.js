/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTable = require('../../../basic-table/basic-table');
const DeploymentPlanTable = require('./plan-table');

describe('DeploymentPlanTable', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentPlanTable />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
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
          rows={[{
            columns: [{
              content: (
                <div>
                  <img alt="Apache Drill"
                    className="deployment-plan-table__charm-icon"
                    src={'https://api.jujucharms.com/charmstore/v5/' +
                      '~spiculecharms/apache-drill-25/icon.svg'} />
                  <span className="deployment-plan-table__charm-name">
                    Apache Drill
                  </span>
                </div>),
              columnSize: 3
            }, {
              content: (
                <div>
                  <h4 className="deployment-plan-table__plan-title">
                    Databonus Dash
                  </h4>
                  <p className="deployment-plan-table__plan-description">
                    Spicule’s standard plan for Apache Drill is suitable for
                    large to very large workloads on clusters of 4-16 nodes.
                    Pricing is for the sum of RAM on all processing nodes.
                  </p>
                </div>),
              columnSize: 3
            }, {
              content: '',
              columnSize: 1
            }, {
              content: 'Memory',
              columnSize: 2
            }, {
              content: '$3.25 per GB of RAM per month',
              columnSize: 3,
              classes: ['u-align--right']
            }],
            key: 'Apache Drill'
          }, {
            columns: [{
              content: (
                <div>
                  <img alt="Saiku EE"
                    className="deployment-plan-table__charm-icon"
                    src={'https://api.jujucharms.com/charmstore/v5/~spicule/' +
                      'saikuanalytics-enterprise-22/icon.svg'} />
                  <span className="deployment-plan-table__charm-name">
                    Saiku EE
                  </span>
                </div>),
              columnSize: 3
            }, {
              content: (
                <div>
                  <h4 className="deployment-plan-table__plan-title">
                    Starter pack
                  </h4>
                  <p className="deployment-plan-table__plan-description">
                    Our default plan for Saiku Business Intelligence covers
                    up to 50 users.
                  </p>
                </div>),
              columnSize: 3
            }, {
              content: '',
              columnSize: 1
            }, {
              content: 'Users',
              columnSize: 2
            }, {
              content: '$6 per user per month',
              columnSize: 3,
              classes: ['u-align--right']
            }],
            key: 'Saiku EE'
          }]}
          tableClasses={['no-margin-bottom']} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
