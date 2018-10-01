/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const CreatePaymentUser = require('./create-payment-user');
const GenericInput = require('../generic-input/generic-input');
const Button = require('../shared/button/button');
const CardForm = require('../card-form/card-form');
const AddressForm = require('../address-form/address-form');

describe('CreatePaymentUser', function() {
  let acl, onUserCreated, payment, stripe, refs;

  const renderComponent = (options = {}) => enzyme.shallow(
    <CreatePaymentUser
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      onUserCreated={options.onUserCreated || onUserCreated}
      payment={payment}
      stripe={stripe}
      username={options.username || 'spinach'} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    onUserCreated = sinon.stub();
    refs = {
      emailAddress: {
        getValue: sinon.stub().returns('spinach@example.com')
      },
      userAddress: {
        getValue: sinon.stub().returns({
          name: 'Geoffrey Spinach',
          line1: '10 Maple St',
          line2: '',
          city: 'Sasquatch',
          state: 'Bunnyhug',
          postcode: '90210',
          countryCode: 'CA',
          phones: ['12341234']
        })
      },
      cardForm: {
        getValue: sinon.stub().returns({
          card: {card: 'value'},
          name: 'Mr Geoffrey Spinach'
        })
      }
    };
    payment = shapeup.addReshape({
      createUser: sinon.stub(),
      getCountries: sinon.stub()
    });
    stripe = {
      createCardElement: sinon.stub(),
      createToken: sinon.stub()
    };
  });

  it('can display a personal form', function() {
    const addNotification = sinon.stub();
    const wrapper = renderComponent({addNotification});
    const options = wrapper.find('input');
    const expected = (
      <div className="create-payment-user">
        <form className="create-payment-user__form">
          <div className="create-payment-user__form-content">
            <ul className="create-payment-user__form-type">
              <li className="create-payment-user__form-type-option">
                <label htmlFor="business">
                  <input
                    checked={false}
                    id="business"
                    name="formType"
                    onChange={options.at(1).prop('onChange')}
                    type="radio" />
                    Business use
                </label>
              </li>
              <li className="create-payment-user__form-type-option">
                <label htmlFor="personal">
                  <input
                    checked={true}
                    id="personal"
                    name="formType"
                    onChange={options.at(0).prop('onChange')}
                    type="radio" />
                  Personal use
                </label>
              </li>
            </ul>
            {null}
            <h2 className="create-payment-user__title">
              Your contact details
            </h2>
            {null}
            <GenericInput
              disabled={false}
              label="Email address"
              ref="emailAddress"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }]} />
            <AddressForm
              addNotification={addNotification}
              disabled={false}
              getCountries={sinon.stub()}
              ref="userAddress" />
            <h2 className="create-payment-user__title">
              Payment information
            </h2>
            <CardForm
              acl={acl}
              createCardElement={sinon.stub()}
              ref="cardForm" />
            <label htmlFor="cardAddressSame">
              <input
                checked={true}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={options.at(2).prop('onChange')}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input
                checked={true}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={options.at(3).prop('onChange')}
                ref="billingAddressSame"
                type="checkbox" />
              Billing address is the same as above
            </label>
            {null}
            {null}
            <div className="create-payment-user__add">
              <Button
                action={wrapper.find('Button').prop('action')}
                disabled={false}
                type="inline-positive">
                Add payment details
              </Button>
            </div>
          </div>
        </form>
      </div>);
    wrapper.find('#personal').simulate('change', {target: {id: 'personal'}});
    assert.compareJSX(wrapper, expected);
  });

  it('can display a business form', function() {
    const wrapper = renderComponent({});
    wrapper.find('#business').simulate('change', {target: {id: 'business'}});
    const inputs = wrapper.find('GenericInput');
    assert.equal(inputs.at(0).prop('label'), 'VAT number (optional)');
    assert.equal(inputs.at(1).prop('label'), 'Business name');
  });

  it('can display card and billing address fields', function() {
    const addNotification = sinon.stub();
    const wrapper = renderComponent({addNotification});
    wrapper.find('#cardAddressSame').simulate('change',
      {currentTarget: {checked: false}});
    wrapper.find('#billingAddressSame').simulate('change',
      {currentTarget: {checked: false}});
    const cardExpected = (
      <div className="create-payment-user__card-address-form">
        <h2 className="create-payment-user__title">
          Card address
        </h2>
        <AddressForm
          addNotification={addNotification}
          disabled={false}
          getCountries={sinon.stub()}
          ref="cardAddress" />
      </div>);
    const billingExpected = (
      <div className="create-payment-user__billing-address-form">
        <h2 className="create-payment-user__title">
          Billing address
        </h2>
        <AddressForm
          addNotification={addNotification}
          disabled={false}
          getCountries={sinon.stub()}
          ref="billingAddress" />
      </div>);
    assert.compareJSX(
      wrapper.find('.create-payment-user__card-address-form'), cardExpected);
    assert.compareJSX(
      wrapper.find('.create-payment-user__billing-address-form'), billingExpected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    stripe.createToken.returns({abort: abort});
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = refs;
    wrapper.find('Button').props().action();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('does not add the user if there is a validation error', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = refs;
    instance.refs.emailAddress.validate = sinon.stub().returns(false);
    wrapper.find('Button').props().action();
    assert.equal(stripe.createToken.callCount, 0);
  });

  it('can create the token using the correct data', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = refs;
    wrapper.find('Button').props().action();
    assert.equal(stripe.createToken.callCount, 1);
    assert.deepEqual(stripe.createToken.args[0][0], {card: 'value'});
    assert.deepEqual(stripe.createToken.args[0][1], {
      name: 'Mr Geoffrey Spinach',
      addressLine1: '10 Maple St',
      addressLine2: '',
      addressCity: 'Sasquatch',
      addressState: 'Bunnyhug',
      addressZip: '90210',
      addressCountry: 'CA'
    });
  });

  it('can create the token using the card address', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    refs.cardAddress = {
      getValue: sinon.stub().returns({
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        state: 'Spider',
        postcode: '9000',
        countryCode: 'AU',
        phones: ['00001111']
      })
    };
    instance.refs = refs;
    wrapper.find('#cardAddressSame').simulate('change',
      {currentTarget: {checked: false}});
    wrapper.update();
    wrapper.find('Button').props().action();
    assert.equal(stripe.createToken.callCount, 1);
    assert.deepEqual(stripe.createToken.args[0][0], {card: 'value'});
    assert.deepEqual(stripe.createToken.args[0][1], {
      name: 'Mr Geoffrey Spinach',
      addressLine1: '9 Kangaroo St',
      addressLine2: '',
      addressCity: 'Snake',
      addressState: 'Spider',
      addressZip: '9000',
      addressCountry: 'AU'
    });
  });

  it('can handle errors when trying to create the token', function() {
    const addNotification = sinon.stub();
    stripe.createToken.callsArgWith(2, 'Uh oh!', null);
    const wrapper = renderComponent({addNotification});
    const instance = wrapper.instance();
    instance.refs = refs;
    wrapper.find('Button').props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create Stripe token',
      message: 'Could not create Stripe token: Uh oh!',
      level: 'error'
    });
  });

  it('can create the user using the correct data', function() {
    stripe.createToken.callsArgWith(2, null, {id: 'token_123'});
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = refs;
    wrapper.find('#personal').simulate('change', {target: {id: 'personal'}});
    wrapper.find('Button').props().action();
    assert.equal(payment.createUser.callCount, 1);
    assert.deepEqual(payment.createUser.args[0][0], {
      nickname: 'spinach',
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
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
      vat: null,
      business: false,
      businessName: null,
      billingAddresses: [{
        name: 'Geoffrey Spinach',
        line1: '10 Maple St',
        line2: '',
        city: 'Sasquatch',
        state: 'Bunnyhug',
        postcode: '90210',
        countryCode: 'CA',
        phones: ['12341234']
      }],
      token: 'token_123',
      paymentMethodName: 'Default'
    });
  });

  it('can create a business user using the correct data', function() {
    stripe.createToken.callsArgWith(2, null, {id: 'token_123'});
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    const extraRefs = {
      VATNumber: {
        getValue: sinon.stub().returns('vat23')
      },
      businessName: {
        getValue: sinon.stub().returns('Tuques LTD')
      }
    };
    instance.refs = Object.assign(refs, extraRefs);
    instance.refs = refs;
    wrapper.find('#business').simulate('change', {target: {id: 'business'}});
    wrapper.update();
    wrapper.find('Button').props().action();
    assert.equal(payment.createUser.callCount, 1);
    const args = payment.createUser.args[0][0];
    assert.equal(args.business, true);
    assert.equal(args.businessName, 'Tuques LTD');
    assert.equal(args.vat, 'vat23');
  });

  it('can create the user with a different billing address', function() {
    stripe.createToken.callsArgWith(2, null, {id: 'token_123'});
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    refs.billingAddress = {
      getValue: sinon.stub().returns({
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        state: 'Spider',
        postcode: '9000',
        countryCode: 'AU',
        phones: ['00001111']
      })
    };
    instance.refs = refs;
    wrapper.find('#personal').simulate('change', {target: {id: 'personal'}});
    wrapper.find('#billingAddressSame').simulate('change',
      {currentTarget: {checked: false}});
    wrapper.update();
    wrapper.find('Button').props().action();
    assert.equal(payment.createUser.callCount, 1);
    assert.deepEqual(payment.createUser.args[0][0], {
      nickname: 'spinach',
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
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
      vat: null,
      business: false,
      businessName: null,
      billingAddresses: [{
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        state: 'Spider',
        postcode: '9000',
        countryCode: 'AU',
        phones: ['00001111']
      }],
      token: 'token_123',
      paymentMethodName: 'Default'
    });
  });

  it('can handle errors when trying to create the user', function() {
    const addNotification = sinon.stub();
    stripe.createToken.callsArgWith(2, null, {id: 'token_123'});
    payment.createUser.callsArgWith(1, 'Uh oh!', null);
    const wrapper = renderComponent({addNotification});
    const instance = wrapper.instance();
    instance.refs = refs;
    wrapper.find('#personal').simulate('change', {target: {id: 'personal'}});
    wrapper.find('Button').props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create a payment user',
      message: 'Could not create a payment user: Uh oh!',
      level: 'error'
    });
  });

  it('reloads the user after the user is created', function() {
    stripe.createToken.callsArgWith(2, null, {id: 'token_123'});
    payment.createUser.callsArgWith(1, null, null);
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = refs;
    wrapper.find('#personal').simulate('change', {target: {id: 'personal'}});
    wrapper.find('Button').props().action();
    assert.equal(onUserCreated.callCount, 1);
  });
});
