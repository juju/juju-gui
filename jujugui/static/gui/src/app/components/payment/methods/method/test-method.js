/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');
const enzyme = require('enzyme');

const GenericButton = require('../../../generic-button/generic-button');
const GenericInput = require('../../../generic-input/generic-input');
const AddressForm = require('../../../address-form/address-form');
const PaymentMethodCard = require('../card/card');
const PaymentMethod = require('./method');

describe('PaymentMethod', () => {
  let acl, payment, paymentMethod, refs;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <PaymentMethod
        acl={options.acl || acl}
        addNotification={options.addNotification || sinon.stub()}
        payment={options.payment || payment}
        paymentMethod={options.paymentMethod || paymentMethod}
        updateUser={options.updateUser || sinon.stub()}
        username={options.username || 'spinach'} />
    );
    const instance = wrapper.instance();
    instance.refs = refs;
    return wrapper;
  };

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    payment = {
      getCountries: sinon.stub(),
      removePaymentMethod: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      updatePaymentMethod: sinon.stub()
    };
    paymentMethod = {
      address: {
        id: 'address1',
        name: 'Home',
        line1: '1 Maple St',
        line2: null,
        county: 'Bunnyhug',
        city: 'Sasquatch',
        postcode: '90210',
        country: 'North of the Border'
      },
      id: 'method1',
      month: 4,
      year: 22
    };
    refs = {
      cardAddress: {
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
      },
      expiry: {
        getValue: sinon.stub().returns('12/22')
      }
    };
  });

  it('can render the payment method', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="payment-method">
        <PaymentMethodCard
          addNotification={sinon.stub()}
          card={paymentMethod}
          onPaymentMethodRemoved={sinon.stub()}
          removePaymentMethod={sinon.stub()}
          updatePaymentMethod={
            wrapper.find('PaymentMethodCard').prop('updatePaymentMethod')}
          username="spinach" />
      </div>);
    assert.compareJSX(wrapper.find('.payment-method'), expected);
  });

  it('can show the edit form', () => {
    const wrapper = renderComponent();
    wrapper.find('PaymentMethodCard').props().updatePaymentMethod();
    wrapper.update();
    const expected = (
      <div className="payment-method__form">
        <AddressForm
          addNotification={sinon.stub()}
          address={paymentMethod.address}
          disabled={false}
          getCountries={sinon.stub()}
          ref="cardAddress"
          showName={false}
          showPhone={false} />
        <div className="twelve-col">
          <GenericInput
            disabled={false}
            label="Expiry MM/YY"
            ref="expiry"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }, {
              regex: /[\d]{2}\/[\d]{2}/,
              error: 'The expiry must be in the format MM/YY'
            }]}
            value="04/22" />
        </div>
        <div className="twelve-col payment-method__buttons">
          <GenericButton
            action={wrapper.find('GenericButton').at(0).prop('action')}
            type="inline-neutral">
            Cancel
          </GenericButton>
          <GenericButton
            action={wrapper.find('GenericButton').at(1).prop('action')}
            type="inline-positive">
            Update
          </GenericButton>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.payment-method__form'), expected);
  });

  it('validates the form when updating the payment method', () => {
    payment.updatePaymentMethod = sinon.stub();
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs.cardAddress.validate = sinon.stub().returns(false);
    wrapper.find('PaymentMethodCard').props().updatePaymentMethod();
    wrapper.update();
    wrapper.find('GenericButton').at(1).props().action();
    assert.equal(payment.updatePaymentMethod.callCount, 0);
  });

  it('can update a payment method', () => {
    payment.updatePaymentMethod = sinon.stub().callsArgWith(4, null);
    const updateUser = sinon.stub();
    const wrapper = renderComponent({ updateUser });
    wrapper.find('PaymentMethodCard').props().updatePaymentMethod();
    wrapper.update();
    wrapper.find('GenericButton').at(1).props().action();
    assert.equal(payment.updatePaymentMethod.callCount, 1);
    assert.equal(payment.updatePaymentMethod.args[0][0], 'spinach');
    assert.equal(payment.updatePaymentMethod.args[0][1], 'method1');
    assert.deepEqual(payment.updatePaymentMethod.args[0][2], {
      name: 'Bruce Dundee',
      line1: '9 Kangaroo St',
      line2: '',
      city: 'Snake',
      county: 'Spider',
      postcode: '9000',
      country: 'AU',
      phones: ['00001111']
    });
    assert.equal(payment.updatePaymentMethod.args[0][3], '12/22');
    assert.equal(wrapper.instance().state.showForm, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can handle errors when creating a token', () => {
    const addNotification = sinon.stub();
    payment.updatePaymentMethod = sinon.stub().callsArgWith(4, 'Uh oh!');
    const wrapper = renderComponent({ addNotification });
    wrapper.find('PaymentMethodCard').props().updatePaymentMethod();
    wrapper.update();
    wrapper.find('GenericButton').at(1).props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not update the payment method',
      message: 'Could not update the payment method: Uh oh!',
      level: 'error'
    });
  });

  it('can cancel the requests when unmounting (method)', () => {
    const abort = sinon.stub();
    payment.updatePaymentMethod = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent();
    wrapper.find('PaymentMethodCard').props().updatePaymentMethod();
    wrapper.update();
    wrapper.find('GenericButton').at(1).props().action();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
