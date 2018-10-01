/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const PaymentMethodCard = require('./card');
const Button = require('../../../shared/button/button');
const SvgIcon = require('../../../svg-icon/svg-icon');

describe('PaymentMethodCard', () => {
  let card;

  const renderComponent = (options = {}) => enzyme.shallow(
    <PaymentMethodCard
      addNotification={options.addNotification}
      card={options.card || card}
      onPaymentMethodRemoved={options.onPaymentMethodRemoved}
      removePaymentMethod={options.removePaymentMethod}
      updatePaymentMethod={options.updatePaymentMethod}
      username='spinach' />
  );

  beforeEach(() => {
    card = {
      id: 'paymentmethod1',
      name: 'personal',
      last4: 1234,
      month: 3,
      year: 2017,
      brand: 'Fancy',
      cardHolder: 'MR G Spinach',
      address: {
        id: 'address1',
        line1: '1 Maple',
        line2: 'St',
        city: 'Sasquatch',
        state: 'Bunnyhug',
        postcode: '90210',
        country: 'North of the Border'
      }
    };
  });

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="payment-card">
        <div className="five-col">
          <div
            className="payment-card-wrapper"
            onClick={wrapper.find('.payment-card-wrapper').prop('onClick')}>
            <div className="payment-card-container">
              <div className="payment-card-front">
                <div className="payment-card-overlay"></div>
                <div className="payment-card-name">
                  MR G Spinach
                </div>
              </div>
              <div className="payment-card-back">
                <div className="payment-card-overlay"></div>
                <div className="payment-card-number">
                  xxxx xxxx xxxx {1234}
                </div>
                <div className="payment-card-bottom">
                  <div className="payment-card-expiry">
                    {3}/{2017}
                  </div>
                  <div className="payment-card-brand">
                    <SvgIcon
                      name="card-fancy"
                      size="40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="seven-col last-col">
          <div className="payment-card-info">
            <h4>Card address</h4>
            <p>1 Maple</p>
            <p>St</p>
            <p>{'Sasquatch'} {'Bunnyhug'}</p>
            <p>{'North of the Border'} {'90210'}</p>
          </div>
        </div>
        {null}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render the actions', () => {
    const wrapper = renderComponent({
      updatePaymentMethod: sinon.stub(),
      removePaymentMethod: sinon.stub()
    });
    const expected = (
      <div className="payment-card-actions">
        <Button
          action={sinon.stub()}
          type="inline-neutral">
          Update payment details
        </Button>
        <Button
          action={wrapper.find('Button').at(1).prop('action')}
          type="inline-neutral">
          Remove payment details
        </Button>
      </div>);
    assert.compareJSX(wrapper.find('.payment-card-actions'), expected);
  });

  it('can render when flipped', () => {
    const wrapper = renderComponent();
    wrapper.find('.payment-card-wrapper').props().onClick(
      {stopPropagation: sinon.stub()});
    wrapper.update();
    assert.equal(
      wrapper.find('.payment-card-wrapper').prop('className').includes(
        'payment-card-wrapper--flipped'),
      true);
  });

  it('can remove the payment method', () => {
    const onPaymentMethodRemoved = sinon.stub();
    const removePaymentMethod = sinon.stub().callsArgWith(2, null);
    const wrapper = renderComponent({
      onPaymentMethodRemoved,
      removePaymentMethod
    });
    wrapper.find('Button').at(1).props().action();
    assert.equal(removePaymentMethod.callCount, 1);
    assert.equal(removePaymentMethod.args[0][0], 'spinach');
    assert.equal(removePaymentMethod.args[0][1], 'paymentmethod1');
    assert.equal(onPaymentMethodRemoved.callCount, 1);
  });

  it('can handle errors when removing the payment method', () => {
    const addNotification = sinon.stub();
    const removePaymentMethod = sinon.stub().callsArgWith(2, 'Uh oh!');
    const wrapper = renderComponent({
      addNotification,
      removePaymentMethod
    });
    wrapper.find('Button').at(1).props().action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to remove the payment method',
      message: 'Unable to remove the payment method: Uh oh!',
      level: 'error'
    });
  });

  it('can cancel the requests when unmounting', () => {
    const abort = sinon.stub();
    const removePaymentMethod = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent({
      removePaymentMethod
    });
    wrapper.find('Button').at(1).props().action();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
