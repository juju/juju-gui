/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AccountPayment = require('./payment');
const Spinner = require('../../spinner/spinner');
const AccountPaymentCharges = require('./charges/charges');
const AccountPaymentDetails = require('./details/details');
const AccountPaymentMethods = require('./methods/methods');
const CreatePaymentUser = require('../../create-payment-user/create-payment-user');
const GenericButton = require('../../generic-button/generic-button');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('AccountPayment', function() {
  let acl, getCountries, getUser, user;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    user = {
      paymentMethods: [{
        name: 'Company'
      }]
    };
    getUser = sinon.stub().callsArgWith(1, null, {
      paymentMethods: [{
        name: 'Company'
      }]
    });
    getCountries = sinon.stub();
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCharges={sinon.stub()}
        getCountries={sinon.stub()}
        getReceipt={sinon.stub()}
        getUser={sinon.stub()}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the user details', function() {
    const addNotification = sinon.stub();
    const createPaymentMethod = sinon.stub();
    const createToken = sinon.stub();
    const removePaymentMethod = sinon.stub();
    const validateForm = sinon.stub();
    const createCardElement = sinon.stub();
    const addAddress = sinon.stub();
    const addBillingAddress = sinon.stub();
    const removeAddress = sinon.stub();
    const removeBillingAddress = sinon.stub();
    const updateAddress = sinon.stub();
    const updateBillingAddress = sinon.stub();
    const updateUser = sinon.stub();
    const updatePaymentMethod = sinon.stub();
    const getCharges = sinon.stub();
    const getReceipt = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <AccountPayment
        acl={acl}
        addAddress={addAddress}
        addBillingAddress={addBillingAddress}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        createUser={sinon.stub()}
        getCharges={getCharges}
        getCountries={sinon.stub()}
        getReceipt={getReceipt}
        getUser={getUser}
        removeAddress={removeAddress}
        removeBillingAddress={removeBillingAddress}
        removePaymentMethod={removePaymentMethod}
        updateAddress={updateAddress}
        updateBillingAddress={updateBillingAddress}
        updateUser={updateUser}
        updatePaymentMethod={updatePaymentMethod}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
        <div>
          <AccountPaymentMethods
            acl={acl}
            addNotification={addNotification}
            createCardElement={createCardElement}
            createPaymentMethod={createPaymentMethod}
            createToken={createToken}
            getCountries={getCountries}
            paymentUser={user}
            removePaymentMethod={removePaymentMethod}
            updatePaymentMethod={updatePaymentMethod}
            updateUser={instance._getUser}
            username="spinach"
            validateForm={validateForm} />
          <AccountPaymentDetails
            acl={acl}
            addAddress={addAddress}
            addBillingAddress={addBillingAddress}
            addNotification={addNotification}
            getCountries={getCountries}
            paymentUser={user}
            removeAddress={removeAddress}
            removeBillingAddress={removeBillingAddress}
            updateAddress={updateAddress}
            updateBillingAddress={updateBillingAddress}
            updateUser={updateUser}
            username="spinach"
            validateForm={validateForm} />
          <AccountPaymentCharges
            acl={acl}
            addNotification={addNotification}
            getCharges={getCharges}
            getReceipt={getReceipt}
            username="spinach" />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display an error when getting users', function() {
    getUser = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCharges={sinon.stub()}
        getCountries={sinon.stub()}
        getReceipt={sinon.stub()}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: Uh oh!',
      level: 'error'
    });
  });

  it('can display a message if there is no user', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createUser = sinon.stub();
    const createToken = sinon.stub();
    getUser = sinon.stub().callsArgWith(1, null, null);
    const renderer = jsTestUtils.shallowRender(
      <AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={createToken}
        createUser={createUser}
        getCharges={sinon.stub()}
        getCountries={getCountries}
        getReceipt={sinon.stub()}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          <div className="account-payment__no-user">
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
    getUser = sinon.stub().callsArgWith(1, null, null);
    const renderer = jsTestUtils.shallowRender(
      <AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createPaymentMethod={sinon.stub()}
        createToken={createToken}
        createUser={createUser}
        getCharges={sinon.stub()}
        getCountries={getCountries}
        getReceipt={sinon.stub()}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children[1].props.action();
    output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
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
    getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCharges={sinon.stub()}
        getCountries={sinon.stub()}
        getReceipt={sinon.stub()}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
