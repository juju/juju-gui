/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AccountPaymentMethodCard = require('../../account/payment/methods/card/card');
const DeploymentPayment = require('./payment');
const CreatePaymentUser = require('../../create-payment-user/create-payment-user');
const Spinner = require('../../spinner/spinner');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentPayment', function() {
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
      <DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={sinon.stub()}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can store the user details', function() {
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(setPaymentUser.callCount, 1);
    assert.deepEqual(setPaymentUser.args[0][0], user);
  });

  it('can display payment methods', function() {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={user}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <ul className="deployment-payment__methods twelve-col">
          {[<li className="deployment-payment__method"
            key="Company0">
            <AccountPaymentMethodCard
              card={{name: 'Company'}} />
          </li>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display an error when getting users', function() {
    getUser = sinon.stub().callsArgWith(1, 'failed', null);
    const addNotification = sinon.stub();
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: failed',
      level: 'error'
    });
  });

  it('can display a new user form', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createUser = sinon.stub();
    const createToken = sinon.stub();
    const createCardElement = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createToken={createToken}
        createUser={createUser}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
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
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
