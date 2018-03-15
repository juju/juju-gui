/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const PaymentMethodCard = require('../../payment/methods/card/card');
const DeploymentPayment = require('./payment');
const CreatePaymentUser = require('../../create-payment-user/create-payment-user');
const Spinner = require('../../spinner/spinner');

describe('DeploymentPayment', function() {
  let acl, getCountries, getUser, user;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentPayment
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      createCardElement={options.createCardElement || sinon.stub()}
      createToken={options.createToken || sinon.stub()}
      createUser={options.createUser || sinon.stub()}
      getCountries={options.getCountries || getCountries}
      getUser={options.getUser || getUser}
      paymentUser={options.paymentUser}
      setPaymentUser={options.setPaymentUser || sinon.stub()}
      username={options.username || 'spinach'}
      validateForm={options.validateForm || sinon.stub()} />
  );

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
    const wrapper = renderComponent({ getUser: sinon.stub() });
    const expected = (
      <div className="deployment-payment">
        <Spinner />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can store the user details', function() {
    const setPaymentUser = sinon.stub();
    renderComponent({ setPaymentUser });
    assert.equal(setPaymentUser.callCount, 1);
    assert.deepEqual(setPaymentUser.args[0][0], user);
  });

  it('can display payment methods', function() {
    const wrapper = renderComponent({ paymentUser: user });
    const expected = (
      <ul className="deployment-payment__methods twelve-col">
        {[<li className="deployment-payment__method"
          key="Company0">
          <PaymentMethodCard
            card={{name: 'Company'}} />
        </li>]}
      </ul>);
    assert.compareJSX(wrapper.find('.deployment-payment__methods'), expected);
  });

  it('can display an error when getting users', function() {
    getUser = sinon.stub().callsArgWith(1, 'failed', null);
    const addNotification = sinon.stub();
    const setPaymentUser = sinon.stub();
    renderComponent({
      addNotification,
      setPaymentUser
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: failed',
      level: 'error'
    });
  });

  it('can display a new user form', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-payment">
        <CreatePaymentUser
          acl={acl}
          addNotification={sinon.stub()}
          createCardElement={sinon.stub()}
          createToken={sinon.stub()}
          createUser={sinon.stub()}
          getCountries={getCountries}
          onUserCreated={wrapper.find('CreatePaymentUser').prop('onUserCreated')}
          username="spinach"
          validateForm={sinon.stub()} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    getUser = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent({ getUser });
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
