'use strict';

const React = require('react');

const Spinner = require('../spinner/spinner');
const BasicTable = require('../basic-table/basic-table');
const RsDetailsItem = require('./rs_details-item');

/**
  React component used to display a list of the users revenue-statements in their profile.
*/
class RevenueStatement extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      data: [
        // Dummy data
        {
          id: 1
        },
        {
          id: 2
        }
      ],
      loading: false
    };
  }

  render() {
    let content;
    if (this.state.loading) {
      return <Spinner />;
    } else {
      const rows = this.state.data.map((revenueStatement, index) => {
        return {
          key: `${index}`,
          columns: [
            {
              content: 'equities-prod-lon-1',
              columnSize: 4
            },
            {
              content: '$0.028',
              columnSize: 2
            },
            {
              content: 'Hours',
              columnSize: 2
            },
            {
              content: '20%',
              columnSize: 2
            },
            {
              content: '$50.96',
              columnSize: 2
            }
          ]
        };
      });
      content = (
        <div className="revenue-statement__inner">
          <header className="revenue-statement__header">
            <img
              alt="Juju logo"
              className="revenue-statement__logo"
              src="https://assets.ubuntu.com/v1/dc0fe093-juju-logo.svg" />

            <h1 className="revenue-statement__heading">Revenue statement</h1>

            <div className="revenue-statement__meta">
              <div className="revenue-statement__meta__col">
                <span className="revenue-statement__label">Payment date:</span>
              </div>
              <div className="revenue-statement__meta__col">
                <span className="revenue-statement__number">1 April 2018</span>
              </div>
            </div>
          </header>

          <div className="revenue-statement__info">
            <div className="revenue-statement__address">
              <span>Paolo Roleto</span>
              <span>Currency Analytics Ltd</span>
              <span>110 Southwark St</span>
              <span>London</span>
              <span>SE1 0SU</span>
              <span>UK</span>
            </div>

            <div className="revenue-statement__meta address-container">
              <div className="revenue-statement__meta__col">
                <span className="revenue-statement__label u-btn-mar">Statement number</span>

                <span className="revenue-statement__label">Our reference</span>
                <span className="revenue-statement__label">Currency</span>
              </div>
              <div className="revenue-statement__meta__col">
                <span className="revenue-statement__value u-btn-mar">21</span>

                <span className="revenue-statement__value">CGL_CN00601</span>
                <span className="revenue-statement__value">USD</span>
              </div>
            </div>
            <hr />
            <div className="revenue-statement__rel-wrap clearfix">
              <div className="revenue-statement__summary">
                <div className="u-btn-mar">
                  <span className="revenue-statement__label">Services during the period</span>
                  <span className="revenue-statement__value">
                    1st December 2017 - 31st January 2018
                  </span>
                </div>
                <div className="u-btn-mar">
                  <span className="revenue-statement__label">Questions?</span>
                  <span className="revenue-statement__value">
                    <a href="mailto:juju-partners@canonical.com">
                      juju-partners@canonical.com
                    </a>
                  </span>
                </div>
              </div>
              <div className="revenue-statement__meta">
                <div className="revenue-statement__meta__col">
                  <span className="revenue-statement__label u-btn-mar">Total:</span>
                  <span className="revenue-statement__label u-btn-mar">Paid by card:</span>
                </div>
                <div className="revenue-statement__meta__col">
                  <span className="revenue-statement__value u-emphasis-value">
                    <strong>$3,077.93</strong>
                  </span>
                  <span className="revenue-statement__value">xxxx xxxx xxxx 1234</span>
                </div>
              </div>
            </div>

            <hr />

            <div className="rs__details v1">
              <h2 className="rs__details-heading">Details - March 2018</h2>
              <div className="rs__details-header">
                <div className="details-header__item">Model, UUid</div>
                <div className="details-header__item">Item</div>
                <div className="details-header__item">Plan</div>
                <div className="details-header__item">Share</div>
                <div className="details-header__item u-align-text--center">Amount</div>
              </div>

              {/* This block should be repeated for each group of items */}
              <div className="rs__details-item">
                <div className="rs__details-item-summary">
                  <strong>equities-prod-lon-2</strong>
                  <span className="rs__details-item-id">
                    4f9aafcc-b213-46eb-822d-10d4a4f52b46
                  </span>
                </div>
                {/* First example item - passing props for each value is only for illustrative purposes */}
                <RsDetailsItem
                  entityAmount="76.33"
                  entityName="Ubuntu Advantage"
                  entityPlan=""
                  entityShare="20" />
                {/* Second example item */}
                <RsDetailsItem
                  entityAmount="91.42"
                  entityName="Kubernetes Master"
                  entityPlan="Pilot Whale burst"
                  entityShare="40" />
                <div className="rs__details-item-total">
                  <div className="rs__details-total-value u-align-text--center">$142.38</div>
                </div>
              </div>

              {/* This block should be repeated for each group of items */}
              <div className="rs__details-item">
                <div className="rs__details-item-summary">
                  <strong>equities-prod-lon-1</strong>
                  <span className="rs__details-item-id">
                    4f9aafcc-b213-46eb-822d-10d4a4f52b46
                  </span>
                </div>
                {/* First example item - passing props for each value is only for illustrative purposes */}
                <RsDetailsItem
                  entityAmount="76.33"
                  entityName="Ubuntu Advantage"
                  entityPlan=""
                  entityShare="20" />
                {/* Second example item */}
                <RsDetailsItem
                  entityAmount="91.42"
                  entityName="Kubernetes Master"
                  entityPlan="Pilot Whale burst"
                  entityShare="40" />
                <div className="rs__details-item-total">
                  <div className="rs__details-total-value u-align-text--center">$142.38</div>
                </div>
                <div className="rs__details-total-revenue">
                  <div className="rs__details-total-heading">Total revenue</div>
                  <div className="rs__details-overall-value">$1895.54</div>
                </div>
              </div>
            </div>

            <hr />
            <h3 className="u-btn-mar revenue-statement-details__title">
              Details - March 2018
            </h3>
            <div className="revenue-statement-details-sm-screen">
              <div className="revenue-statement__billing-package">
                <p>
                  <strong>Ubuntu Advantage Essential</strong>
                </p>
                <p>$0.09 per machine hour</p>
                <p className="revenue-statement__billing-package__model-name">
                  Model: fx-staging-ldn
                </p>
                <div className="revenue-statement__meta">
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__label u-text-align--left">
                      28.999 hours
                    </span>
                  </div>
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__value">$2,567.94</span>
                  </div>
                </div>
                <p className="revenue-statement__billing-package__model-name">
                  Model: version neo
                </p>
                <div className="revenue-statement__meta">
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__label u-text-align--left">
                      28.999 hours
                    </span>
                  </div>
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__value">$2,567.94</span>
                  </div>
                </div>
              </div>
              <div className="revenue-statement__billing-package">
                <p>
                  <strong>Ubuntu Advantage Advanced</strong>
                </p>
                <p>$0.09 per machine hour</p>
                <p>Model: fx-staging-ldn</p>
                <div className="revenue-statement__meta">
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__label u-text-align--left">
                      28.999 hours
                    </span>
                  </div>
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__value">$2,567.94</span>
                  </div>
                </div>

                <p>Model: version neo</p>
                <div className="revenue-statement__meta">
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__label u-text-align--left">
                      28.999 hours
                    </span>
                  </div>
                  <div className="revenue-statement__meta__col">
                    <span className="revenue-statement__value">$2,567.94</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="revenue-statement-details-lrg-screen clearfix">
              <BasicTable
                headerClasses={['profile__entity-table-header-row']}
                headerColumnClasses={['profile__entity-table-header-column']}
                headers={[
                  {
                    content: 'Model / Item',
                    columnSize: 4
                  },
                  {
                    content: 'Price',
                    columnSize: 2
                  },
                  {
                    content: 'Metered',
                    columnSize: 2
                  },
                  {
                    content: 'Share',
                    columnSize: 2
                  },
                  {
                    content: 'Amount',
                    columnSize: 2
                  }
                ]}
                rowClasses={['profile__entity-table-row']}
                rowColumnClasses={['profile__entity-table-column']}
                rows={rows} />
            </div>
            <hr />

            <div className="u-btn-mar">
              <img
                alt="Canonical logo"
                src="https://assets.ubuntu.com/v1/5d6da5c4-logo-canonical-aubergine.svg"
                width="120" />
            </div>

            <div className="revenue-statement__footer">
              <div className="u-btn-mar u-block-children revenue-statement__footer__col">
                <span className="revenue-statement__label">UK Company Number</span>
                <span className="revenue-statement__value">06870835</span>
              </div>

              <div className="u-btn-mar u-block-children revenue-statement__footer__col">
                <span className="revenue-statement__label">VAT Number</span>
                <span className="revenue-statement__value">GB 003232247</span>
              </div>

              <div className="u-btn-mar u-block-children revenue-statement__footer__col">
                <span className="revenue-statement__label">Registered office</span>
                <span className="revenue-statement__value">5th Floor</span>
                <span className="revenue-statement__value">Bluefin Building</span>
                <span className="revenue-statement__value">110 Southwark Street</span>
                <span className="revenue-statement__value">London</span>
                <span className="revenue-statement__value">SE1 0SU</span>
                <span className="revenue-statement__value">UK</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return <div>{content}</div>;
  }
}

module.exports = RevenueStatement;
