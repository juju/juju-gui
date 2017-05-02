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

describe('AccountPaymentMethod', () => {
  let acl, paymentMethod, refs;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('account-payment-method', () => { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
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
      id: 'method1'
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
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={addNotification}
        getCountries={sinon.stub()}
        paymentMethod={paymentMethod}
        removePaymentMethod={removePaymentMethod}
        updatePaymentMethod={sinon.stub()}
        updateUser={updateUser}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <juju.components.ExpandingRow
        classes={{
          'user-profile__list-row': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="account-payment-method">
          <juju.components.AccountPaymentMethodCard
            addNotification={addNotification}
            card={paymentMethod}
            onPaymentMethodRemoved={updateUser}
            removePaymentMethod={removePaymentMethod}
            updatePaymentMethod={instance._toggleForm}
            username="spinach" />
        </div>
      </juju.components.ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can show the edit form', () => {
    const addNotification = sinon.stub();
    const getCountries = sinon.stub();
    const validateForm = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={addNotification}
        getCountries={getCountries}
        paymentMethod={paymentMethod}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    output.props.children[1].props.children.props.updatePaymentMethod();
    output = component.getRenderOutput();
    const expected = (
      <div className="account-payment-method__form">
        <juju.components.AddressForm
          address={paymentMethod.address}
          disabled={false}
          addNotification={addNotification}
          getCountries={getCountries}
          ref="cardAddress"
          showName={false}
          showPhone={false}
          validateForm={validateForm} />
        <div className="twelve-col">
          <juju.components.GenericInput
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
            value={`${paymentMethod.month}/${paymentMethod.year}`} />
        </div>
        <div className="twelve-col account-payment-method__buttons">
          <juju.components.GenericButton
            action={instance._toggleForm}
            type="inline-neutral"
            title="Cancel" />
          <juju.components.GenericButton
            action={instance._updatePaymentMethod}
            type="inline-positive"
            title="update" />
        </div>
      </div>);
    expect(output.props.children[1].props.children).toEqualJSX(expected);
  });

  it('validates the form when updating the payment method', () => {
    const updatePaymentMethod = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={sinon.stub()}
        paymentMethod={paymentMethod}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={updatePaymentMethod}
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
    assert.equal(updatePaymentMethod.callCount, 0);
  });

  it('can update a payment method', () => {
    const updatePaymentMethod = sinon.stub().callsArgWith(4, null);
    const updateUser = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={sinon.stub()}
        paymentMethod={paymentMethod}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={updatePaymentMethod}
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
    assert.equal(updatePaymentMethod.callCount, 1);
    assert.equal(updatePaymentMethod.args[0][0], 'spinach');
    assert.equal(updatePaymentMethod.args[0][1], 'method1');
    assert.deepEqual(updatePaymentMethod.args[0][2], {
      name: 'Bruce Dundee',
      line1: '9 Kangaroo St',
      line2: '',
      city: 'Snake',
      county: 'Spider',
      postcode: '9000',
      country: 'AU',
      phones: ['00001111']
    });
    assert.equal(updatePaymentMethod.args[0][3], '12/22');
    assert.equal(instance.state.showForm, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can handle errors when creating a token', () => {
    const addNotification = sinon.stub();
    const updatePaymentMethod = sinon.stub().callsArgWith(4, 'Uh oh!');
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={addNotification}
        getCountries={sinon.stub()}
        paymentMethod={paymentMethod}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={updatePaymentMethod}
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

  it('can cancel the requests when unmounting', () => {
    const abort = sinon.stub();
    const updatePaymentMethod = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={sinon.stub()}
        paymentMethod={paymentMethod}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={updatePaymentMethod}
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
