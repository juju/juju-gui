/* Copyright (C) 2018 Canonical Ltd. */

'use strict';
const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

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
    const wrapper = renderComponent({gisf: true});
    expect(wrapper).toMatchSnapshot();
  });

  it('can render without any invoices', () => {
    const wrapper = renderComponent({
      invoices: []
    });
    assert.deepEqual(wrapper.find('BasicTable').prop('rows'), []);
  });
});
