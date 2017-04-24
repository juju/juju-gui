/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('AccountPaymentDetailsAddress', () => {
  let acl, address, newAddress;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('account-payment-details-address', () => { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    address = {
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
      <juju.components.AccountPaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={addNotification}
        address={address}
        close={sinon.stub()}
        getCountries={getCountries}
        removeAddress={sinon.stub()}
        showEdit={true}
        updated={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <juju.components.ExpandingRow
        classes={{
          'account-payment-details-address': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={true}>
        <juju.components.AddressForm
          disabled={true}
          address={address}
          getCountries={getCountries} />
        <div className="twelve-col account-payment-details-address__edit">
           <juju.components.AddressForm
             addNotification={addNotification}
             address={address}
             disabled={false}
             getCountries={getCountries}
             ref="addressForm"
             validateForm={validateForm} />
           <div className={
             'twelve-col account-payment-details-address__buttons'}>
             <juju.components.GenericButton
               action={close}
               disabled={false}
               type="inline-neutral"
               title="Cancel" />
             <juju.components.GenericButton
               action={instance._updateAddress}
               disabled={false}
               type="inline-positive"
               title="Update" />
           </div>
        </div>
      </juju.components.ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can cancel the form', () => {
    const close = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={sinon.stub()}
        address={address}
        close={close}
        getCountries={sinon.stub()}
        removeAddress={sinon.stub()}
        showEdit={true}
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
      <juju.components.AccountPaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={sinon.stub()}
        address={{}}
        close={sinon.stub()}
        getCountries={sinon.stub()}
        removeAddress={removeAddress}
        showEdit={true}
        updated={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(false)} />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1].props.action();
    assert.equal(removeAddress.callCount, 0);
  });

  it('can remove and old address and add the new one', () => {
    const addAddress = sinon.stub().callsArgWith(2, null);
    const removeAddress = sinon.stub().callsArgWith(2, null);
    const close = sinon.stub();
    const updated = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetailsAddress
        acl={acl}
        addAddress={addAddress}
        addNotification={sinon.stub()}
        address={address}
        close={close}
        getCountries={sinon.stub()}
        removeAddress={removeAddress}
        showEdit={true}
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
    assert.equal(removeAddress.callCount, 1);
    assert.equal(removeAddress.args[0][0], 'spinach');
    assert.equal(removeAddress.args[0][1], 'Bruce Dundee');
    assert.equal(addAddress.callCount, 1);
    assert.equal(addAddress.args[0][0], 'spinach');
    assert.deepEqual(addAddress.args[0][1], newAddress);
    assert.equal(updated.callCount, 1);
    assert.equal(close.callCount, 1);
  });

  it('can handle errors when removing the address', () => {
    const addAddress = sinon.stub();
    const removeAddress = sinon.stub().callsArgWith(2, 'Uh oh!');
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetailsAddress
        acl={acl}
        addAddress={addAddress}
        addNotification={addNotification}
        address={address}
        close={sinon.stub()}
        getCountries={sinon.stub()}
        removeAddress={removeAddress}
        showEdit={true}
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
      title: 'Could not remove address',
      message: 'Could not remove address: Uh oh!',
      level: 'error'
    });
  });

  it('can handle errors when adding the address', () => {
    const addAddress = sinon.stub().callsArgWith(2, 'Uh oh!');
    const removeAddress = sinon.stub().callsArgWith(2, null);
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetailsAddress
        acl={acl}
        addAddress={addAddress}
        addNotification={addNotification}
        address={address}
        close={sinon.stub()}
        getCountries={sinon.stub()}
        removeAddress={removeAddress}
        showEdit={true}
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
      title: 'Could not add address',
      message: 'Could not add address: Uh oh!',
      level: 'error'
    });
  });

  it('get abort the requests when unmountin', () => {
    const abort = sinon.stub();
    const removeAddress = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetailsAddress
        acl={acl}
        addAddress={sinon.stub()}
        addNotification={sinon.stub()}
        address={address}
        close={sinon.stub()}
        getCountries={sinon.stub()}
        removeAddress={removeAddress}
        showEdit={true}
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
