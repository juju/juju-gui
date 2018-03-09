/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');

const PaymentDetails = require('./details');
const GenericButton = require('../../generic-button/generic-button');
const GenericInput = require('../../generic-input/generic-input');
const PaymentDetailsAddress = require('./address/address');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('PaymentDetails', () => {
  let acl, payment;

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
    const addNotification = sinon.stub();
    const getCountries = sinon.stub();
    const addAddress = sinon.stub();
    const addBillingAddress = sinon.stub();
    const removeAddress = sinon.stub();
    const removeBillingAddress = sinon.stub();
    const validateForm = sinon.stub();
    const updateAddress = sinon.stub();
    const updateUser = sinon.stub();
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
    const component = jsTestUtils.shallowRender(
      <PaymentDetails
        acl={acl}
        addNotification={addNotification}
        payment={payment}
        paymentUser={paymentUser}
        updateUser={updateUser}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
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
            <GenericButton
              action={instance._toggleAddressEdit}
              disabled={false}
              extraClasses="payment-details-title-button"
              type="inline-neutral">
              Edit
            </GenericButton>
          </h4>
          <ul className="payment-details-addresses">
            {[<PaymentDetailsAddress
              acl={acl}
              addAddress={addAddress}
              addNotification={addNotification}
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
              close={instance._toggleAddressEdit}
              getCountries={getCountries}
              key="Geoffrey Spinach"
              removeAddress={removeAddress}
              showEdit={false}
              updateAddress={updateAddress}
              updated={updateUser}
              username="spinach"
              validateForm={validateForm} />]}
          </ul>
          <h4>
            Billing addresses
            <GenericButton
              action={instance._toggleBillingAddressEdit}
              disabled={false}
              extraClasses="payment-details-title-button"
              type="inline-neutral">
              Edit
            </GenericButton>
          </h4>
          <ul className="payment-details-addresses">
            {[<PaymentDetailsAddress
              acl={acl}
              addAddress={addBillingAddress}
              addNotification={addNotification}
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
              close={instance._toggleBillingAddressEdit}
              getCountries={getCountries}
              key="Geoffrey Spinach"
              removeAddress={removeBillingAddress}
              showEdit={false}
              updateAddress={updateAddress}
              updated={updateUser}
              username="spinach"
              validateForm={validateForm} />]}
          </ul>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
