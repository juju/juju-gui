/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericButton = require('../../../generic-button/generic-button');
const ExpandingRow = require('../../../expanding-row/expanding-row');
const CardForm = require('../../../card-form/card-form');
const AddressForm = require('../../../address-form/address-form');
const AccountPaymentMethod = require('./method/method');
const AccountPaymentMethods = require('./methods');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('AccountPaymentMethods', () => {
  let acl, user;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
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
    const addNotification = sinon.stub();
    const updateUser = sinon.stub();
    const removePaymentMethod = sinon.stub();
    const updatePaymentMethod = sinon.stub();
    const getCountries = sinon.stub();
    const validateForm = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        getCountries={getCountries}
        paymentUser={user}
        removePaymentMethod={removePaymentMethod}
        updatePaymentMethod={updatePaymentMethod}
        updateUser={updateUser}
        username="spinach"
        validateForm={validateForm} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Payment details
        </h2>
        <ul className="user-profile__list twelve-col">
          {[<AccountPaymentMethod
            acl={acl}
            addNotification={addNotification}
            getCountries={getCountries}
            key="method1"
            paymentMethod={user.paymentMethods[0]}
            removePaymentMethod={removePaymentMethod}
            updatePaymentMethod={updatePaymentMethod}
            updateUser={updateUser}
            username="spinach"
            validateForm={validateForm} />]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render when there are no payment methods', () => {
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Payment details
        </h2>
        <div className="account__payment-no-methods">
          You do not have a payment method.
          <GenericButton
            action={instance._toggleAdd}
            type="inline-neutral">
            Add payment method
          </GenericButton>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can cancel the requests when unmounting (methods)', () => {
    const abort = sinon.stub();
    const createToken = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={createToken}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = {
      cardForm: {
        getValue: sinon.stub().returns({
          card: 'data'
        })
      }
    };
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1]
      .props.children[1].props.action();
    component.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can show the add payment form', () => {
    const createCardElement = sinon.stub();
    const validateForm = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={createCardElement}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    const expected = (
      <ExpandingRow
        classes={{'twelve-col': true}}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="account__payment-form">
          <div className="account__payment-form-fields">
            <CardForm
              acl={acl}
              createCardElement={createCardElement}
              ref="cardForm"
              validateForm={validateForm} />
            <label htmlFor="cardAddressSame">
              <input checked={true}
                className="account__payment-form-checkbox"
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={instance._handleCardSameChange}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as default address.
            </label>
            {null}
          </div>
          <div className="twelve-col account__payment-form-buttons">
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Cancel
            </GenericButton>
            <GenericButton
              action={instance._createToken}
              type="inline-positive">
              Add
            </GenericButton>
          </div>
        </div>
      </ExpandingRow>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can show the address form', () => {
    const createCardElement = sinon.stub();
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const getCountries = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        getCountries={getCountries}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[0]
      .props.children[1].props.children[0].props.onChange({
        currentTarget: {
          checked: false
        }
      });
    output = component.getRenderOutput();
    const expected = (
      <ExpandingRow
        classes={{'twelve-col': true}}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="account__payment-form">
          <div className="account__payment-form-fields">
            <CardForm
              acl={acl}
              createCardElement={createCardElement}
              ref="cardForm"
              validateForm={validateForm} />
            <label htmlFor="cardAddressSame">
              <input checked={false}
                className="account__payment-form-checkbox"
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={instance._handleCardSameChange}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as default address.
            </label>
            <AddressForm
              disabled={false}
              addNotification={addNotification}
              getCountries={getCountries}
              ref="cardAddress"
              showName={false}
              showPhone={false}
              validateForm={validateForm} />
          </div>
          <div className="twelve-col account__payment-form-buttons">
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Cancel
            </GenericButton>
            <GenericButton
              action={instance._createToken}
              type="inline-positive">
              Add
            </GenericButton>
          </div>
        </div>
      </ExpandingRow>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('validates the form when adding a new payment method', () => {
    const createToken = sinon.stub().callsArgWith(2, null, {id: 'token123'});
    const createPaymentMethod = sinon.stub().callsArg(2, null, null);
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(false)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = {
      cardForm: {
        getValue: sinon.stub().returns({
          card: 'data'
        })
      }
    };
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1]
      .props.children[1].props.action();
    assert.equal(createToken.callCount, 0);
  });

  it('can create a new payment method with an existing address', () => {
    const createToken = sinon.stub().callsArgWith(2, null, {id: 'token123'});
    const createPaymentMethod = sinon.stub().callsArg(3, null, null);
    const updateUser = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={updateUser}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = {
      cardForm: {
        getValue: sinon.stub().returns({
          card: {card: 'data'},
          name: 'Mr G Spinach'
        })
      }
    };
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1]
      .props.children[1].props.action();
    assert.equal(createToken.callCount, 1);
    assert.deepEqual(createToken.args[0][0], {
      card: 'data'
    });
    assert.deepEqual(createToken.args[0][1], {
      addressLine1: '1 Maple St',
      addressLine2: '',
      addressCity: 'Sasquatch',
      addressState: 'Bunnyhug',
      addressZip: '90210',
      addressCountry: 'North of the Border',
      name: 'Mr G Spinach'
    });
    assert.equal(createPaymentMethod.callCount, 1);
    assert.equal(instance.state.showAdd, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can create a new payment method with a new address', () => {
    const createToken = sinon.stub().callsArgWith(2, null, {id: 'token123'});
    const createPaymentMethod = sinon.stub().callsArg(3, null, null);
    const updateUser = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={updateUser}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = {
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
      cardForm: {
        getValue: sinon.stub().returns({
          card: {card: 'data'},
          name: 'Mr G Spinach'
        })
      }
    };
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[0]
      .props.children[1].props.children[0].props.onChange({
        currentTarget: {
          checked: false
        }
      });
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1]
      .props.children[1].props.action();
    assert.equal(createToken.callCount, 1);
    assert.deepEqual(createToken.args[0][0], {
      card: 'data'
    });
    assert.deepEqual(createToken.args[0][1], {
      addressLine1: '9 Kangaroo St',
      addressLine2: '',
      addressCity: 'Snake',
      addressState: 'Spider',
      addressZip: '9000',
      addressCountry: 'AU',
      name: 'Mr G Spinach'
    });
    assert.equal(createPaymentMethod.callCount, 1);
    assert.equal(instance.state.showAdd, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can handle errors when creating a token', () => {
    const createToken = sinon.stub().callsArgWith(2, 'Uh oh!');
    const createPaymentMethod = sinon.stub().callsArg(2, null, null);
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={addNotification}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = {
      cardForm: {
        getValue: sinon.stub().returns({
          card: 'data'
        })
      }
    };
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1]
      .props.children[1].props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create Stripe token',
      message: 'Could not create Stripe token: Uh oh!',
      level: 'error'
    });
  });

  it('can handle errors when creating a payment method', () => {
    const createToken = sinon.stub().callsArgWith(2, null, {id: 'token123'});
    const createPaymentMethod = sinon.stub().callsArgWith(3, 'Uh oh!', null);
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <AccountPaymentMethods
        acl={acl}
        addNotification={addNotification}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        getCountries={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updatePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    instance.refs = {
      cardForm: {
        getValue: sinon.stub().returns({
          card: 'data'
        })
      }
    };
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.children[1]
      .props.children[1].props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create the payment method',
      message: 'Could not create the payment method: Uh oh!',
      level: 'error'
    });
  });
});
