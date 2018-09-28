/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const PaymentDetails = require('./details');
const Button = require('../../shared/button/button');
const GenericInput = require('../../generic-input/generic-input');
const PaymentDetailsAddress = require('./address/address');

describe('PaymentDetails', () => {
  let acl, payment;

  const renderComponent = (options = {}) => enzyme.shallow(
    <PaymentDetails
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      payment={options.payment || payment}
      paymentUser={options.paymentUser || sinon.stub()}
      updateUser={options.updateUser || sinon.stub()}
      username={options.username || 'spinach'} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    payment = {
      addAddress: sinon.stub(),
      addBillingAddress: sinon.stub(),
      getCountries: sinon.stub(),
      removeAddress: sinon.stub(),
      removeBillingAddress: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      updateAddress: sinon.stub(),
      updateBillingAddress: sinon.stub()
    };
  });

  it('can display the details', () => {
    const paymentUser ={
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      business: true,
      addresses: [{
        name: 'Geoffrey Spinach',
        line1: '10 Maple St',
        line2: '',
        city: 'Sasquatch',
        state: 'Bunnyhug',
        postcode: '90210',
        countryCode: 'CA',
        phones: ['12341234']
      }],
      vat: '1234',
      businessName: 'Spinachy business',
      billingAddresses: [{
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        state: 'Spider',
        postcode: '9000',
        countryCode: 'AU',
        phones: ['00001111']
      }]
    };
    const wrapper = renderComponent({ paymentUser });
    const expected = (
      <div className="payment__section">
        <h2 className="payment__title twelve-col">
          Account details
        </h2>
        <div className="payment-details-view twelve-col">
          <div className="payment-details-fields">
            <GenericInput
              disabled={true}
              label="Name"
              value="Geoffrey Spinach" />
            <GenericInput
              disabled={true}
              label="Email address"
              value="spinach@example.com" />
            <GenericInput
              disabled={true}
              label="VAT number (optional)"
              value="1234" />
            <GenericInput
              disabled={true}
              label="Business name"
              value="Spinachy business" />
          </div>
          <h4>
            Addresses
            <Button
              action={wrapper.find('Button').at(0).prop('action')}
              disabled={false}
              extraClasses="payment-details-title-button"
              type="inline-neutral">
              Edit
            </Button>
          </h4>
          <ul className="payment-details-addresses">
            {[<PaymentDetailsAddress
              acl={acl}
              addAddress={sinon.stub()}
              addNotification={sinon.stub()}
              address={{
                name: 'Geoffrey Spinach',
                line1: '10 Maple St',
                line2: '',
                city: 'Sasquatch',
                state: 'Bunnyhug',
                postcode: '90210',
                countryCode: 'CA',
                phones: ['12341234']
              }}
              close={wrapper.find('PaymentDetailsAddress').at(0).prop('close')}
              getCountries={sinon.stub()}
              key="Geoffrey Spinach"
              removeAddress={sinon.stub()}
              showEdit={false}
              updateAddress={sinon.stub()}
              updated={sinon.stub()}
              username="spinach" />]}
          </ul>
          <h4>
            Billing addresses
            <Button
              action={wrapper.find('Button').at(1).prop('action')}
              disabled={false}
              extraClasses="payment-details-title-button"
              type="inline-neutral">
              Edit
            </Button>
          </h4>
          <ul className="payment-details-addresses">
            {[<PaymentDetailsAddress
              acl={acl}
              addAddress={sinon.stub()}
              addNotification={sinon.stub()}
              address={{
                name: 'Bruce Dundee',
                line1: '9 Kangaroo St',
                line2: '',
                city: 'Snake',
                state: 'Spider',
                postcode: '9000',
                countryCode: 'AU',
                phones: ['00001111']
              }}
              close={wrapper.find('PaymentDetailsAddress').at(1).prop('close')}
              getCountries={sinon.stub()}
              key="Geoffrey Spinach"
              removeAddress={sinon.stub()}
              showEdit={false}
              updateAddress={sinon.stub()}
              updated={sinon.stub()}
              username="spinach" />]}
          </ul>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
