/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AccountPaymentMethodCard = require('./card');
const GenericButton = require('../../../../generic-button/generic-button');
const SvgIcon = require('../../../../svg-icon/svg-icon');

const jsTestUtils = require('../../../../../utils/component-test-utils');

describe('AccountPaymentMethodCard', () => {
  let card;

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
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethodCard
        card={card} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__payment-card twelve-col">
        <div className="eight-col">
          <div className="account__payment-card-wrapper"
            onClick={instance._handleCardClick}>
            <div className="account__payment-card-container">
              <div className="account__payment-card-front">
                <div className="account__payment-card-overlay"></div>
                <div className="account__payment-card-name">
                  MR G Spinach
                </div>
              </div>
              <div className="account__payment-card-back">
                <div className="account__payment-card-overlay"></div>
                <div className="account__payment-card-number">
                  xxxx xxxx xxxx {1234}
                </div>
                <div className="account__payment-card-bottom">
                  <div className="account__payment-card-expiry">
                    {3}/{2017}
                  </div>
                  <div className="account__payment-card-brand">
                    <SvgIcon
                      size="40"
                      name="card-fancy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="account__payment-card-info">
            <h4>Card address</h4>
            <p>1 Maple</p>
            <p>St</p>
            <p>{'Sasquatch'} {'Bunnyhug'}</p>
            <p>{'North of the Border'} {'90210'}</p>
          </div>
        </div>
        {null}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render the actions', () => {
    const updatePaymentMethod = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethodCard
        card={card}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={updatePaymentMethod} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="four-col last-col account__payment-card-actions">
        <GenericButton
          action={instance._removePaymentMethod}
          type="inline-neutral">
          Remove payment details
        </GenericButton>
        <GenericButton
          action={updatePaymentMethod}
          type="inline-neutral">
          Update payment details
        </GenericButton>
      </div>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can render when flipped', () => {
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethodCard
        card={card} />, true);
    let output = component.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick(
      {stopPropagation: sinon.stub()});
    output = component.getRenderOutput();
    assert.equal(
      output.props.children[0].props.children[0].props.className,
      'account__payment-card-wrapper account__payment-card-wrapper--flipped');
  });

  it('can remove the payment method', () => {
    const onPaymentMethodRemoved = sinon.stub();
    const removePaymentMethod = sinon.stub().callsArgWith(2, null);
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethodCard
        addNotification={sinon.stub()}
        card={card}
        onPaymentMethodRemoved={onPaymentMethodRemoved}
        removePaymentMethod={removePaymentMethod}
        username='spinach' />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[0].props.action();
    assert.equal(removePaymentMethod.callCount, 1);
    assert.equal(removePaymentMethod.args[0][0], 'spinach');
    assert.equal(removePaymentMethod.args[0][1], 'paymentmethod1');
    assert.equal(onPaymentMethodRemoved.callCount, 1);
  });

  it('can handle errors when removing the payment method', () => {
    const addNotification = sinon.stub();
    const removePaymentMethod = sinon.stub().callsArgWith(2, 'Uh oh!');
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethodCard
        addNotification={addNotification}
        card={card}
        onPaymentMethodRemoved={sinon.stub()}
        removePaymentMethod={removePaymentMethod}
        username='spinach' />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[0].props.action();
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
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethodCard
        addNotification={sinon.stub()}
        card={card}
        onPaymentMethodRemoved={sinon.stub()}
        removePaymentMethod={removePaymentMethod}
        username='spinach' />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[0].props.action();
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
