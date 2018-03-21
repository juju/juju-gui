/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const Payment = require('./payment');
const PaymentCharges = require('./charges/charges');
const PaymentDetails = require('./details/details');
const PaymentMethods = require('./methods/methods');
const GenericButton = require('../generic-button/generic-button');

describe('Payment', function() {
  let acl, payment, stripe, user;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Payment
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      payment={options.payment || payment}
      stripe={options.stripe || stripe}
      username={options.spinach || 'spinach'}
      validateForm={options.validateForm || sinon.stub().returns(true)} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    user = {
      paymentMethods: [{
        name: 'Company'
      }]
    };
    payment = {
      addAddress: sinon.stub(),
      addBillingAddress: sinon.stub(),
      createPaymentMethod: sinon.stub(),
      createUser: sinon.stub(),
      getCharges: sinon.stub(),
      getCountries: sinon.stub(),
      getReceipt: sinon.stub(),
      getUser: sinon.stub().callsArgWith(1, null, {
        paymentMethods: [{
          name: 'Company'
        }]
      }),
      removeAddress: sinon.stub(),
      removeBillingAddress: sinon.stub(),
      removePaymentMethod: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      updateAddress: sinon.stub(),
      updateBillingAddress: sinon.stub(),
      updatePaymentMethod: sinon.stub()
    };
    stripe = {
      createCardElement: sinon.stub(),
      createToken: sinon.stub(),
      reshape: shapeup.reshapeFunc
    };
  });

  it('can display a loading spinner', function() {
    payment.getUser = sinon.stub();
    const wrapper = renderComponent();
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can display the user details', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="payment">
        <div>
          <PaymentMethods
            acl={acl}
            addNotification={sinon.stub()}
            payment={{
              createPaymentMethod: payment.createPaymentMethod,
              getCountries: payment.getCountries,
              removePaymentMethod: payment.removePaymentMethod,
              reshape: shapeup.reshapeFunc,
              updatePaymentMethod: payment.updatePaymentMethod
            }}
            paymentUser={user}
            stripe={stripe}
            updateUser={wrapper.find('PaymentMethods').prop('updateUser')}
            username="spinach"
            validateForm={sinon.stub()} />
          <PaymentDetails
            acl={acl}
            addNotification={sinon.stub()}
            payment={{
              addAddress: payment.addAddress,
              addBillingAddress: payment.addBillingAddress,
              getCountries: payment.getCountries,
              removeAddress: payment.removeAddress,
              removeBillingAddress: payment.removeBillingAddress,
              reshape: shapeup.reshapeFunc,
              updateAddress: payment.updateAddress,
              updateBillingAddress: payment.updateBillingAddress
            }}
            paymentUser={user}
            updateUser={wrapper.find('PaymentDetails').prop('updateUser')}
            username="spinach"
            validateForm={sinon.stub()} />
          <PaymentCharges
            acl={acl}
            addNotification={sinon.stub()}
            payment={{
              getCharges: payment.getCharges,
              getReceipt: payment.getReceipt,
              reshape: shapeup.reshapeFunc
            }}
            username="spinach" />
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display an error when getting users', function() {
    payment.getUser = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    const addNotification = sinon.stub();
    renderComponent({ addNotification });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: Uh oh!',
      level: 'error'
    });
  });

  it('can display a message if there is no user', function() {
    payment.getUser = sinon.stub().callsArgWith(1, null, null);
    const wrapper = renderComponent();
    const expected = (
      <div className="payment__no-user">
        <p>You are not set up to make payments.</p>
        <p>
          <GenericButton
            action={wrapper.find('GenericButton').prop('action')}
            type="inline-positive">
            Set up payments
          </GenericButton>
        </p>
      </div>);
    assert.compareJSX(wrapper.find('.payment__no-user'), expected);
  });

  it('can display a new user form', function() {
    payment.getUser = sinon.stub().callsArgWith(1, null, null);
    const wrapper = renderComponent();
    wrapper.find('GenericButton').props().action();
    wrapper.update();
    assert.equal(wrapper.find('CreatePaymentUser').length, 1);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    payment.getUser = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
