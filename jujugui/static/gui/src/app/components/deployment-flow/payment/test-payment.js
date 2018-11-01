/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const CreatePaymentUser = require('../../create-payment-user/create-payment-user');
const DeploymentPayment = require('./payment');
const Link = require('../../link/link');
const PaymentMethodCard = require('../../payment/methods/card/card');
const Spinner = require('../../spinner/spinner');

describe('DeploymentPayment', function() {
  let acl, getUser, payment, stripe, user;

  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <DeploymentPayment
        acl={options.acl || acl}
        addNotification={options.addNotification || sinon.stub()}
        changeState={options.changeState || sinon.stub()}
        generatePath={options.generatePath || sinon.stub()}
        payment={payment}
        paymentUser={options.paymentUser}
        setPaymentUser={options.setPaymentUser || sinon.stub()}
        stripe={stripe}
        username={options.username || 'spinach'}
      />
    );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    user = {
      paymentMethods: [
        {
          name: 'Company'
        }
      ]
    };
    getUser = sinon.stub().callsArgWith(1, null, {
      paymentMethods: [
        {
          name: 'Company'
        }
      ]
    });
    payment = {
      createUser: sinon.stub(),
      getCountries: sinon.stub(),
      getUser
    };
    stripe = {
      createCardElement: sinon.stub(),
      createToken: sinon.stub()
    };
  });

  it('can display a loading spinner', function() {
    payment.getUser = sinon.stub();
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-payment">
        <Spinner />
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can store the user details', function() {
    const setPaymentUser = sinon.stub();
    renderComponent({setPaymentUser});
    assert.equal(setPaymentUser.callCount, 1);
    assert.deepEqual(setPaymentUser.args[0][0], user);
  });

  it('can display payment methods', function() {
    const wrapper = renderComponent({paymentUser: user});
    const expected = (
      <ul className="deployment-payment__methods twelve-col">
        {[
          <li className="deployment-payment__method" key="Company0">
            <PaymentMethodCard card={{name: 'Company'}} />
          </li>
        ]}
      </ul>
    );
    assert.compareJSX(wrapper.find('.deployment-payment__methods'), expected);
  });

  it('can display a link when there are no payment methods', function() {
    user.paymentMethods = [];
    const wrapper = renderComponent({
      paymentUser: user
    });
    const expected = (
      <div className="deployment-payment__no-methods">
        You do not have a payment method, you can add one from your&nbsp;
        <Link
          changeState={sinon.stub()}
          clickState={{
            gui: {
              deploy: null
            },
            hash: 'payment',
            profile: 'spinach'
          }}
          generatePath={sinon.stub()}
        >
          Profile
        </Link>
        .
      </div>
    );
    assert.compareJSX(wrapper.find('.deployment-payment__no-methods'), expected);
  });

  it('can display an error when getting users', function() {
    payment.getUser.callsArgWith(1, 'failed', null);
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
          onUserCreated={wrapper.find('CreatePaymentUser').prop('onUserCreated')}
          payment={shapeup.addReshape({
            createUser: payment.createUser.bind(payment),
            getCountries: payment.getCountries.bind(payment)
          })}
          stripe={stripe}
          username="spinach"
        />
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    payment.getUser.returns({abort: abort});
    const wrapper = renderComponent();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
