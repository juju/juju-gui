/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const PaymentDetailsAddress = require('./address');
const AddressForm = require('../../../address-form/address-form');
const ExpandingRow = require('../../../expanding-row/expanding-row');
const GenericButton = require('../../../generic-button/generic-button');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('PaymentDetailsAddress', () => {
  let acl, address, newAddress;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    address = {
      id: 'address1',
      name: 'Geoffrey Spinach',
      line1: '10 Maple St',
      line2: '',
      city: 'Sasquatch',
      state: 'Bunnyhug',
      postcode: '90210',
      countryCode: 'CA',
      phones: ['12341234']
    };
    newAddress = {
      name: 'Bruce Dundee',
      line1: '9 Kangaroo St',
      line2: '',
      city: 'Snake',
      state: 'Spider',
      postcode: '9000',
      countryCode: 'AU',
      phones: ['00001111']
    };
  });

  it('can render', () => {
    const addNotification = sinon.stub();
    const getCountries = sinon.stub();
    const validateForm = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={addNotification}
        address={address}
        close={sinon.stub()}
        getCountries={getCountries}
        removeAddress={sinon.stub()}
        showEdit={true}
        updateAddress={sinon.stub()}
        updated={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <ExpandingRow
        classes={{
          'payment-details-address': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={true}>
        <AddressForm
          address={address}
          disabled={true}
          getCountries={getCountries} />
        <div className="twelve-col payment-details-address__edit">
          <AddressForm
            addNotification={addNotification}
            address={address}
            disabled={false}
            getCountries={getCountries}
            ref="addressForm"
            validateForm={validateForm} />
          <div className={
            'twelve-col payment-details-address__buttons'}>
            <GenericButton
              action={close}
              disabled={false}
              type="inline-neutral">
              Cancel
            </GenericButton>
            <GenericButton
              action={instance._updateAddress}
              disabled={false}
              type="inline-positive">
              Update
            </GenericButton>
          </div>
        </div>
      </ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can cancel the form', () => {
    const close = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={sinon.stub()}
        address={address}
        close={close}
        getCountries={sinon.stub()}
        removeAddress={sinon.stub()}
        showEdit={true}
        updateAddress={sinon.stub()}
        updated={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[0].props.action();
    assert.equal(close.callCount, 1);
  });

  it('can validate the form', () => {
    const removeAddress = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={sinon.stub()}
        address={{}}
        close={sinon.stub()}
        getCountries={sinon.stub()}
        removeAddress={sinon.stub()}
        showEdit={true}
        updateAddress={sinon.stub()}
        updated={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(false)} />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1].props.action();
    assert.equal(removeAddress.callCount, 0);
  });

  it('can update the address', () => {
    const updateAddress = sinon.stub().callsArgWith(3, null);
    const close = sinon.stub();
    const updated = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={sinon.stub()}
        address={address}
        close={close}
        getCountries={sinon.stub()}
        removeAddress={sinon.stub()}
        showEdit={true}
        updateAddress={updateAddress}
        updated={updated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    instance.refs = {
      addressForm: {
        getValue: sinon.stub().returns(newAddress)
      }
    };
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1].props.action();
    assert.equal(updateAddress.callCount, 1);
    assert.equal(updateAddress.args[0][0], 'spinach');
    assert.equal(updateAddress.args[0][1], 'address1');
    assert.deepEqual(updateAddress.args[0][2], newAddress);
    assert.equal(updated.callCount, 1);
    assert.equal(close.callCount, 1);
  });

  it('can handle errors when updating the address', () => {
    const updateAddress = sinon.stub().callsArgWith(3, 'Uh oh!');
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <PaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={addNotification}
        address={address}
        close={sinon.stub()}
        getCountries={sinon.stub()}
        removeAddress={sinon.stub()}
        showEdit={true}
        updateAddress={updateAddress}
        updated={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    instance.refs = {
      addressForm: {
        getValue: sinon.stub().returns(newAddress)
      }
    };
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1].props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not update address',
      message: 'Could not update address: Uh oh!',
      level: 'error'
    });
  });

  it('get abort the requests when unmountin', () => {
    const abort = sinon.stub();
    const updateAddress = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <PaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={sinon.stub()}
        address={address}
        close={sinon.stub()}
        getCountries={sinon.stub()}
        removeAddress={sinon.stub()}
        showEdit={true}
        updateAddress={updateAddress}
        updated={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    instance.refs = {
      addressForm: {
        getValue: sinon.stub().returns(newAddress)
      }
    };
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1].props.action();
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
