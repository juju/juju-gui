/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const PaymentDetailsAddress = require('./address');
const AddressForm = require('../../../address-form/address-form');
const ExpandingRow = require('../../../shared/expanding-row/expanding-row');
const Button = require('../../../shared/button/button');

describe('PaymentDetailsAddress', () => {
  let acl, address, newAddress;

  const renderComponent = (options = {}) => enzyme.shallow(
    <PaymentDetailsAddress
      acl={options.acl || acl}
      addAddress={options.addAddress || sinon.stub()}
      addNotification={options.addNotification || sinon.stub()}
      address={options.address || address}
      close={options.close || sinon.stub()}
      getCountries={options.getCountries || sinon.stub()}
      removeAddress={options.removeAddress || sinon.stub()}
      showEdit={options.showEdit === undefined ? true : options.showEdit}
      updateAddress={options.updateAddress || sinon.stub()}
      updated={options.updated || sinon.stub()}
      username={options.username || 'spinach'} />
  );

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
    const wrapper = renderComponent();
    const expected = (
      <div className="payment-details-address_wrapper">
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
            getCountries={sinon.stub()} />
          <div className="twelve-col payment-details-address__edit u-no-margin--bottom">
            <AddressForm
              addNotification={sinon.stub()}
              address={address}
              disabled={false}
              getCountries={sinon.stub()}
              ref="addressForm" />
            <div className={
              'twelve-col payment-details-address__buttons u-no-margin--bottom'}>
              <Button
                action={sinon.stub()}
                disabled={false}
                type="inline-neutral">
                Cancel
              </Button>
              <Button
                action={wrapper.find('Button').at(1).prop('action')}
                disabled={false}
                type="inline-positive">
                Update
              </Button>
            </div>
          </div>
        </ExpandingRow>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can cancel the form', () => {
    const close = sinon.stub();
    const wrapper = renderComponent({close});
    wrapper.find('Button').at(0).props().action();
    assert.equal(close.callCount, 1);
  });

  it('can validate the form', () => {
    const removeAddress = sinon.stub();
    const wrapper = renderComponent({removeAddress});
    const instance = wrapper.instance();
    instance.refs = {
      addressForm: {
        validate: sinon.stub().returns(false)
      }
    };
    wrapper.find('Button').at(1).props().action();
    assert.equal(removeAddress.callCount, 0);
  });

  it('can update the address', () => {
    const updateAddress = sinon.stub().callsArgWith(3, null);
    const close = sinon.stub();
    const updated = sinon.stub();
    const wrapper = renderComponent({
      close,
      updateAddress,
      updated
    });
    const instance = wrapper.instance();
    instance.refs = {
      addressForm: {
        getValue: sinon.stub().returns(newAddress)
      }
    };
    wrapper.find('Button').at(1).props().action();
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
    const wrapper = renderComponent({
      updateAddress,
      addNotification
    });
    const instance = wrapper.instance();
    instance.refs = {
      addressForm: {
        getValue: sinon.stub().returns(newAddress)
      }
    };
    wrapper.find('Button').at(1).props().action();
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
    const wrapper = renderComponent({
      updateAddress
    });
    const instance = wrapper.instance();
    instance.refs = {
      addressForm: {
        getValue: sinon.stub().returns(newAddress)
      }
    };
    wrapper.find('Button').at(1).props().action();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });
});
