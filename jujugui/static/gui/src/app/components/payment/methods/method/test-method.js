/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const shapeup = require('shapeup');

const GenericButton = require('../../../generic-button/generic-button');
const GenericInput = require('../../../generic-input/generic-input');
const ExpandingRow = require('../../../expanding-row/expanding-row');
const AddressForm = require('../../../address-form/address-form');
const PaymentMethodCard = require('../card/card');
const PaymentMethod = require('./method');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('PaymentMethod', () => {
  let acl, payment, paymentMethod, refs;

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
    const addNotification = sinon.stub();
    const updateUser = sinon.stub();
    const removePaymentMethod = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentMethod
        acl={acl}
        addNotification={addNotification}
        payment={payment}
        paymentMethod={paymentMethod}
        updateUser={updateUser}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <ExpandingRow
        classes={{
          'user-profile__list-row': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="payment-method">
          <PaymentMethodCard
            addNotification={addNotification}
            card={paymentMethod}
            onPaymentMethodRemoved={updateUser}
            removePaymentMethod={removePaymentMethod}
            updatePaymentMethod={instance._toggleForm}
            username="spinach" />
        </div>
      </ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can show the edit form', () => {
    const addNotification = sinon.stub();
    const getCountries = sinon.stub();
    const validateForm = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentMethod
        acl={acl}
        addNotification={addNotification}
        payment={payment}
        paymentMethod={paymentMethod}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    output.props.children[1].props.children.props.updatePaymentMethod();
    output = component.getRenderOutput();
    const expected = (
      <div className="payment-method__form">
        <AddressForm
          addNotification={addNotification}
          address={paymentMethod.address}
          disabled={false}
          getCountries={getCountries}
          ref="cardAddress"
          showName={false}
          showPhone={false}
          validateForm={validateForm} />
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
            action={instance._toggleForm}
            type="inline-neutral">
            Cancel
          </GenericButton>
          <GenericButton
            action={instance._updatePaymentMethod}
            type="inline-positive">
            Update
          </GenericButton>
        </div>
      </div>);
    expect(output.props.children[1].props.children).toEqualJSX(expected);
  });

  it('validates the form when updating the payment method', () => {
    payment.updatePaymentMethod = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        paymentMethod={paymentMethod}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(false)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = refs;
    output.props.children[1].props.children.props.updatePaymentMethod();
    output = component.getRenderOutput();
    output.props.children[1].props.children.props.children[2]
      .props.children[1].props.action();
    assert.equal(payment.updatePaymentMethod.callCount, 0);
  });

  it('can update a payment method', () => {
    payment.updatePaymentMethod = sinon.stub().callsArgWith(4, null);
    const updateUser = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        paymentMethod={paymentMethod}
        updateUser={updateUser}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = refs;
    output.props.children[1].props.children.props.updatePaymentMethod();
    output = component.getRenderOutput();
    output.props.children[1].props.children.props.children[2]
      .props.children[1].props.action();
    output = component.getRenderOutput();
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
    assert.equal(instance.state.showForm, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can handle errors when creating a token', () => {
    const addNotification = sinon.stub();
    payment.updatePaymentMethod = sinon.stub().callsArgWith(4, 'Uh oh!');
    const component = jsTestUtils.shallowRender(
      <PaymentMethod
        acl={acl}
        addNotification={addNotification}
        payment={payment}
        paymentMethod={paymentMethod}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = refs;
    output.props.children[1].props.children.props.updatePaymentMethod();
    output = component.getRenderOutput();
    output.props.children[1].props.children.props.children[2]
      .props.children[1].props.action();
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
    const component = jsTestUtils.shallowRender(
      <PaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        payment={payment}
        paymentMethod={paymentMethod}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = refs;
    output.props.children[1].props.children.props.updatePaymentMethod();
    output = component.getRenderOutput();
    output.props.children[1].props.children.props.children[2]
      .props.children[1].props.action();
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
