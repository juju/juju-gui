/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const Button = require('../../shared/button/button');
const CardForm = require('../../card-form/card-form');
const PaymentMethod = require('./method/method');
const PaymentMethods = require('./methods');

describe('PaymentMethods', () => {
  let acl, payment, stripe, user;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <PaymentMethods
        acl={options.acl || acl}
        addNotification={options.addNotification || sinon.stub()}
        payment={options.payment || payment}
        paymentUser={options.paymentUser || user}
        stripe={options.stripe || stripe}
        updateUser={options.updateUser || sinon.stub()}
        username={options.username || 'spinach'} />
    );
    const instance = wrapper.instance();
    instance.refs = {
      cardForm: {
        getValue: sinon.stub().returns({
          card: {card: 'data'},
          name: 'Mr G Spinach'
        })
      }
    };
    return wrapper;
  };

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    payment = {
      createPaymentMethod: sinon.stub().callsArg(3, null, null),
      getCountries: sinon.stub(),
      removePaymentMethod: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      updatePaymentMethod: sinon.stub()
    };
    stripe = {
      createCardElement: sinon.stub(),
      createToken: sinon.stub().callsArgWith(2, null, {id: 'token123'})
    };
    user = {
      addresses: [{
        id: 'address1',
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'North of the Border'
      }],
      paymentMethods: []
    };
  });

  it('can render the payment methods', () => {
    user.paymentMethods = [{
      name: 'Company',
      id: 'method1'
    }];
    const wrapper = renderComponent();
    const expected = (
      <div className="payment__section">
        <h2 className="payment__title twelve-col">
          Payment details
        </h2>
        <ul className="user-profile__list twelve-col">
          {[<PaymentMethod
            acl={acl}
            addNotification={sinon.stub()}
            key="method1"
            payment={{
              getCountries: payment.getCountries,
              removePaymentMethod: payment.removePaymentMethod,
              reshape: shapeup.reshapeFunc,
              updatePaymentMethod: payment.updatePaymentMethod
            }}
            paymentMethod={user.paymentMethods[0]}
            updateUser={sinon.stub()}
            username="spinach" />]}
        </ul>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render when there are no payment methods', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="payment-methods__no-methods">
        <p>You do not have a payment method.</p>
        <p>
          <Button
            action={wrapper.find('Button').prop('action')}
            type="inline-positive">
            Add payment method
          </Button>
        </p>
      </div>);
    assert.compareJSX(wrapper.find('.payment-methods__no-methods'), expected);
  });

  it('can cancel the requests when unmounting (methods)', () => {
    const abort = sinon.stub();
    stripe.createToken = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent();
    wrapper.find('Button').props().action();
    wrapper.update();
    wrapper.find('Button').at(1).props().action();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can show the add payment form', () => {
    const wrapper = renderComponent();
    wrapper.find('Button').props().action();
    wrapper.update();
    const expected = (
      <div className="payment-methods__form">
        <div className="payment-methods__form-fields">
          <CardForm
            acl={acl}
            createCardElement={sinon.stub()}
            ref="cardForm" />
          <label htmlFor="cardAddressSame">
            <input checked={true}
              className="payment-methods__form-checkbox"
              id="cardAddressSame"
              name="cardAddressSame"
              onChange={wrapper.find('input').prop('onChange')}
              ref="cardAddressSame"
              type="checkbox" />
            Credit or debit card address is the same as default address.
          </label>
          {null}
        </div>
        <div className="twelve-col payment-methods__form-buttons">
          <Button
            action={wrapper.find('Button').at(0).prop('action')}
            type="inline-neutral">
            Cancel
          </Button>
          <Button
            action={wrapper.find('Button').at(1).prop('action')}
            type="inline-positive">
            Add
          </Button>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.payment-methods__form'), expected);
  });

  it('can show the address form', () => {
    const wrapper = renderComponent();
    wrapper.find('Button').props().action();
    wrapper.update();
    wrapper.find('input').props().onChange({
      currentTarget: {
        checked: false
      }
    });
    wrapper.update();
    assert.equal(wrapper.find('AddressForm').length, 1);
  });

  it('validates the form when adding a new payment method', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs.cardForm.validate = sinon.stub().returns(false);
    wrapper.find('Button').props().action();
    wrapper.update();
    wrapper.find('Button').at(1).props().action();
    assert.equal(stripe.createToken.callCount, 0);
  });

  it('can create a new payment method with an existing address', () => {
    const updateUser = sinon.stub();
    const wrapper = renderComponent({ updateUser });
    const instance = wrapper.instance();
    wrapper.find('Button').props().action();
    wrapper.update();
    wrapper.find('Button').at(1).props().action();
    assert.equal(stripe.createToken.callCount, 1);
    assert.deepEqual(stripe.createToken.args[0][0], {
      card: 'data'
    });
    assert.deepEqual(stripe.createToken.args[0][1], {
      addressLine1: '1 Maple St',
      addressLine2: '',
      addressCity: 'Sasquatch',
      addressState: 'Bunnyhug',
      addressZip: '90210',
      addressCountry: 'North of the Border',
      name: 'Mr G Spinach'
    });
    assert.equal(payment.createPaymentMethod.callCount, 1);
    assert.equal(instance.state.showAdd, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can create a new payment method with a new address', () => {
    const updateUser = sinon.stub();
    const wrapper = renderComponent({ updateUser });
    const instance = wrapper.instance();
    instance.refs.cardAddress = {
      getValue: sinon.stub().returns({
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        county: 'Spider',
        postcode: '9000',
        country: 'AU',
        phones: ['00001111']
      })
    };
    wrapper.find('Button').props().action();
    wrapper.update();
    wrapper.find('input').props().onChange({
      currentTarget: {
        checked: false
      }
    });
    wrapper.find('Button').at(1).props().action();
    assert.equal(stripe.createToken.callCount, 1);
    assert.deepEqual(stripe.createToken.args[0][0], {
      card: 'data'
    });
    assert.deepEqual(stripe.createToken.args[0][1], {
      addressLine1: '9 Kangaroo St',
      addressLine2: '',
      addressCity: 'Snake',
      addressState: 'Spider',
      addressZip: '9000',
      addressCountry: 'AU',
      name: 'Mr G Spinach'
    });
    assert.equal(payment.createPaymentMethod.callCount, 1);
    assert.equal(instance.state.showAdd, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can handle errors when creating a token', () => {
    stripe.createToken = sinon.stub().callsArgWith(2, 'Uh oh!');
    const addNotification = sinon.stub();
    const wrapper = renderComponent({ addNotification });
    wrapper.find('Button').props().action();
    wrapper.update();
    wrapper.find('Button').at(1).props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create Stripe token',
      message: 'Could not create Stripe token: Uh oh!',
      level: 'error'
    });
  });

  it('can handle errors when creating a payment method', () => {
    payment.createPaymentMethod = sinon.stub().callsArgWith(3, 'Uh oh!', null);
    const addNotification = sinon.stub();
    const wrapper = renderComponent({ addNotification });
    wrapper.find('Button').props().action();
    wrapper.update();
    wrapper.find('Button').at(1).props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create the payment method',
      message: 'Could not create the payment method: Uh oh!',
      level: 'error'
    });
  });
});
