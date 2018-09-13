/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const Spinner = require('../spinner/spinner');
const BasicTable = require('../shared/basic-table/basic-table');

/**
  React component used to display a list of the users invoices in their profile.
*/
class Invoice extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      data: [{
        id: 1
      }, {
        id: 2
      }],
      loading: false
    };
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (<Spinner />);
    } else {
      const rows = (this.state.data).map((invoice, index) => {
        return {
          key: `${index}`,
          columns: [{
            content: 'Ubuntu Advantage Essential',
            columnSize: 3
          }, {
            content: '$0.09 per machine-hour',
            columnSize: 3
          }, {
            content: '28,499 hours',
            columnSize: 3
          }, {
            content: '$32,888',
            columnSize: 3
          }]
        };
      });
      content = (
        <div className="invoice__inner">
          <header className="invoice__header">
            <img
              alt="Juju logo"
              className="invoice__logo"
              src="https://assets.ubuntu.com/v1/dc0fe093-juju-logo.svg" />

            <h1 className="invoice__heading">Invoice</h1>

            <div className="invoice__meta">
              <div className="invoice__meta__col">
                <span className="invoice__label">Invoice number:</span>
              </div>
              <div className="invoice__meta__col">
                <span className="invoice__number u-emphasis-value">1003528</span>
              </div>
            </div>
          </header>

          <div className="invoice__info">

            <div className="invoice__address">
              <span>Paolo Roleto</span>
              <span>Currency Analytics Ltd</span>
              <span>110 Southwark St</span>
              <span>London</span>
              <span>SE1 0SU</span>
              <span>UK</span>
            </div>

            <div className="invoice__meta">
              <div className="invoice__meta__col">
                <span className="invoice__label u-btn-mar">Invoice date:</span>

                <span className="invoice__label">Our reference:</span>
                <span className="invoice__label u-btn-mar">Your reference:</span>

                <span className="invoice__label">Currency:</span>
                <span className="invoice__label u-btn-mar">Net total:</span>

                <span className="invoice__label">VAT number:</span>
                <span className="invoice__label">VAT @ 20%:</span>
                <span className="invoice__label">GDP</span>
              </div>
              <div className="invoice__meta__col">
                <span className="invoice__value u-btn-mar">01 Feb 2018</span>

                <span className="invoice__value">CGL_CN00601</span>
                <span className="invoice__value u-btn-mar">280000000</span>

                <span className="invoice__value">USD</span>
                <span className="invoice__value u-btn-mar"><strong>$2,564.94</strong></span>

                <span className="invoice__value">GB 123456789</span>
                <span className="invoice__value"><strong>$512.75</strong></span>
                <span className="invoice__value">£394.90</span>
              </div>
            </div>
            <hr />
            <div className="invoice__rel-wrap clearfix">
              <div className="invoice__summary">
                <div className="u-btn-mar">
                  <span className="invoice__label">
                    Services during the period
                  </span>
                  <span className="invoice__value">
                    1st December 2017 - 31st January 2018
                  </span>
                </div>
                <div className="u-btn-mar">
                  <span className="invoice__label">
                    Questions?
                  </span>
                  <span className="invoice__value">
                    <a href="mailto:accountsrecievable@canonical.com">
                      accountsrecievable@canonical.com
                    </a>
                  </span>
                </div>
              </div>
              <div className="invoice__meta">
                <div className="invoice__meta__col">
                  <span className="invoice__label u-btn-mar">Total:</span>
                  <span className="invoice__label u-btn-mar">Paid by card:</span>
                </div>
                <div className="invoice__meta__col">
                  <span className="invoice__value u-emphasis-value">
                    <strong>$3,077.93</strong>
                  </span>
                  <span className="invoice__value">xxxx xxxx xxxx 1234</span>
                </div>
              </div>
            </div>
            <hr />
            <h3 className="u-btn-mar invoice-details__title">Details</h3>
            <div className="invoice-details-sm-screen">
              <div className="invoice__billing-package">
                <p><strong>Ubuntu Advantage Essential</strong></p>
                <p>$0.09 per machine hour</p>
                <p className="invoice__billing-package__model-name">Model: fx-staging-ldn</p>
                <div className="invoice__meta">
                  <div className="invoice__meta__col">
                    <span className="invoice__label u-text-align--left">28.999 hours</span>
                  </div>
                  <div className="invoice__meta__col">
                    <span className="invoice__value">$2,567.94</span>
                  </div>
                </div>
                <p className="invoice__billing-package__model-name">Model: version neo</p>
                <div className="invoice__meta">
                  <div className="invoice__meta__col">
                    <span className="invoice__label u-text-align--left">28.999 hours</span>
                  </div>
                  <div className="invoice__meta__col">
                    <span className="invoice__value">$2,567.94</span>
                  </div>
                </div>
              </div>
              <div className="invoice__billing-package">
                <p><strong>Ubuntu Advantage Advanced</strong></p>
                <p>$0.09 per machine hour</p>
                <p>Model: fx-staging-ldn</p>
                <div className="invoice__meta">
                  <div className="invoice__meta__col">
                    <span className="invoice__label u-text-align--left">28.999 hours</span>
                  </div>
                  <div className="invoice__meta__col">
                    <span className="invoice__value">$2,567.94</span>
                  </div>
                </div>

                <p>Model: version neo</p>
                <div className="invoice__meta">
                  <div className="invoice__meta__col">
                    <span className="invoice__label u-text-align--left">28.999 hours</span>
                  </div>
                  <div className="invoice__meta__col">
                    <span className="invoice__value">$2,567.94</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-details-lrg-screen clearfix">
              <BasicTable
                headerClasses={['profile__entity-table-header-row']}
                headerColumnClasses={['profile__entity-table-header-column']}
                headers={[{
                  content: 'Item',
                  columnSize: 3
                }, {
                  content: 'Unit price',
                  columnSize: 3
                }, {
                  content: 'Quantity',
                  columnSize: 3
                }, {
                  content: 'Amount',
                  columnSize: 3
                }]}
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

            <div className="invoice__footer">
              <div className="u-btn-mar u-block-children invoice__footer__col">
                <span className="invoice__label">UK Company Number</span>
                <span className="invoice__value">06870835</span>
              </div>

              <div className="u-btn-mar u-block-children invoice__footer__col">
                <span className="invoice__label">VAT Number</span>
                <span className="invoice__value">GB 003232247</span>
              </div>

              <div className="u-btn-mar u-block-children invoice__footer__col">
                <span className="invoice__label">Registered office</span>
                <span className="invoice__value">5th Floor</span>
                <span className="invoice__value">Bluefin Building</span>
                <span className="invoice__value">110 Southwark Street</span>
                <span className="invoice__value">London</span>
                <span className="invoice__value">SE1 0SU</span>
                <span className="invoice__value">UK</span>
              </div>
            </div>
          </div>
        </div>);
    }
    return (
      <React.Fragment>
        {content}
      </React.Fragment>
    );
  }
};

module.exports = Invoice;
