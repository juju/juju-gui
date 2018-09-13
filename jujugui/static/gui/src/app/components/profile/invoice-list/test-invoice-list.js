/* Copyright (C) 2018 Canonical Ltd. */

'use strict';
const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const BasicTable = require('../../shared/basic-table/basic-table');
const ProfileInvoiceList = require('./invoice-list');

describe('Invoice Bundle List', function() {
  const rawInvoiceData = `[{
  	"number": "100001",
  	"status": "Paid",
  	"chargedTo": "card ending 1234",
  	"date": "12/05/2017"
  }, {
  	"number": "100002",
  	"status": "Declined: will retry",
  	"chargedTo": "card ending 1231",
  	"date": "12/05/2017"
  }]`;

  let invoices;
  let acl;

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
    invoices = JSON.parse(rawInvoiceData);
  });

  const renderComponent = (options = {}) => enzyme.shallow(
    <ProfileInvoiceList
      acl={options.acl || acl}
      baseURL="/gui/"
      data={options.invoices || invoices}
      user="lazypower@external" />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    wrapper.update();
    const expected = (
      <div className="profile-invoice-list">
        <div>
          <h2 className="profile__title">
            Payment history
          </h2>
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
            headers={[{
              content: 'Status',
              columnSize: 3
            }, {
              content: 'Invoice Number',
              columnSize: 3
            }, {
              content: 'Charged to',
              columnSize: 3
            }, {
              content: 'Date',
              columnSize: 3
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={[{
              columns: [{
                content: ('Paid'),
                columnSize: 3
              }, {
                content: (
                  <a href="/gui/invoice/id">100001</a>
                ),
                columnSize: 3
              }, {
                content: ('card ending 1234'),
                columnSize: 3
              }, {
                content: '12/05/2017',
                columnSize: 3
              }],
              key: '100001'
            }, {
              columns: [{
                content: ('Declined: will retry'),
                columnSize: 3
              }, {
                content: (
                  <a href="/gui/invoice/id">100002</a>
                ),
                columnSize: 3
              }, {
                content: ('card ending 1231'),
                columnSize: 3
              }, {
                content: '12/05/2017',
                columnSize: 3
              }],
              key: '100002'
            }]} />
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render without any invoices', () => {
    const wrapper = renderComponent({
      invoices: []
    });
    assert.deepEqual(wrapper.find('BasicTable').prop('rows'), []);
  });
});
