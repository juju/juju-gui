/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');

const Payment = require('./payment');
const Spinner = require('../spinner/spinner');
const PaymentCharges = require('./charges/charges');
const PaymentDetails = require('./details/details');
const PaymentMethods = require('./methods/methods');
const CreatePaymentUser = require('../create-payment-user/create-payment-user');
const GenericButton = require('../generic-button/generic-button');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Payment', function() {
  let acl, getCountries, payment, stripe, user;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    user = {
      paymentMethods: [{
        name: 'Company'
      }]
    };
    getCountries = sinon.stub();
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
    const renderer = jsTestUtils.shallowRender(
      <Payment
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        stripe={stripe}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="payment">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the user details', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const updateUser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Payment
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        stripe={stripe}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="payment">
        <div>
          <PaymentMethods
            acl={acl}
            addNotification={addNotification}
            payment={{
              createPaymentMethod: payment.createPaymentMethod,
              getCountries: payment.getCountries,
              removePaymentMethod: payment.removePaymentMethod,
              reshape: shapeup.reshapeFunc,
              updatePaymentMethod: payment.updatePaymentMethod
            }}
            paymentUser={user}
            stripe={stripe}
            updateUser={updateUser}
            username="spinach"
            validateForm={validateForm} />
          <PaymentDetails
            acl={acl}
            addNotification={addNotification}
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
            updateUser={updateUser}
            username="spinach"
            validateForm={validateForm} />
          <PaymentCharges
            acl={acl}
            addNotification={addNotification}
            payment={{
              getCharges: payment.getCharges,
              getReceipt: payment.getReceipt,
              reshape: shapeup.reshapeFunc
            }}
            username="spinach" />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display an error when getting users', function() {
    payment.getUser = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <Payment
        acl={acl}
        addNotification={addNotification}
        payment={payment}
        stripe={stripe}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: Uh oh!',
      level: 'error'
    });
  });

  it('can display a message if there is no user', function() {
    payment.getUser = sinon.stub().callsArgWith(1, null, null);
    const renderer = jsTestUtils.shallowRender(
      <Payment
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        stripe={stripe}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="payment">
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          <div className="payment__no-user">
            You are not set up to make payments.
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Set up payments
            </GenericButton>
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a new user form', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createUser = sinon.stub();
    const createToken = sinon.stub();
    const createCardElement = sinon.stub();
    payment.getUser = sinon.stub().callsArgWith(1, null, null);
    const renderer = jsTestUtils.shallowRender(
      <Payment
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        stripe={stripe}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children[1].props.action();
    output = renderer.getRenderOutput();
    const expected = (
      <div className="payment">
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          <div className="twelve-col">
            <CreatePaymentUser
              acl={acl}
              addNotification={addNotification}
              createCardElement={createCardElement}
              createToken={createToken}
              createUser={createUser}
              getCountries={getCountries}
              onUserCreated={instance._getUser}
              username="spinach"
              validateForm={validateForm} />
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    payment.getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <Payment
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        stripe={stripe}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
