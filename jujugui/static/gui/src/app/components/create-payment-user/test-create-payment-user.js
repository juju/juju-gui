/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const CreatePaymentUser = require('./create-payment-user');
const GenericInput = require('../generic-input/generic-input');
const GenericButton = require('../generic-button/generic-button');
const CardForm = require('../card-form/card-form');
const AddressForm = require('../address-form/address-form');

const jsTestUtils = require('../../utils/component-test-utils');

describe('CreatePaymentUser', function() {
  let acl, getCountries, onUserCreated, refs;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    onUserCreated = sinon.stub();
    getCountries = sinon.stub();
    refs = {
      emailAddress: {
        getValue: sinon.stub().returns('spinach@example.com')
      },
      userAddress: {
        getValue: sinon.stub().returns({
          name: 'Geoffrey Spinach',
          line1: '10 Maple St',
          line2: '',
          city: 'Sasquatch',
          state: 'Bunnyhug',
          postcode: '90210',
          countryCode: 'CA',
          phones: ['12341234']
        })
      },
      cardForm: {
        getValue: sinon.stub().returns({
          card: {card: 'value'},
          name: 'Mr Geoffrey Spinach'
        })
      }
    };
  });

  it('can display a personal form', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createCardElement = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const options = output.props.children.props.children[0].props.children[0]
      .props.children;
    const expected = (
      <div className="create-payment-user">
        <form className="create-payment-user__form">
          <div className="create-payment-user__form-content">
            <ul className="create-payment-user__form-type">
              <li className="create-payment-user__form-type-option">
                <label htmlFor="personal">
                  <input checked={true}
                    id="personal"
                    name="formType"
                    onChange={options[0].props.children.props.children[0]
                      .props.onChange}
                    type="radio" />
                  Personal use
                </label>
              </li>
              <li className="create-payment-user__form-type-option">
                <label htmlFor="business">
                  <input checked={false}
                    id="business"
                    name="formType"
                    onChange={options[1].props.children.props.children[0]
                      .props.onChange}
                    type="radio" />
                  Business use
                </label>
              </li>
            </ul>
            {null}
            <h2 className="create-payment-user__title">
              Name and address
            </h2>
            {null}
            <GenericInput
              disabled={false}
              label="Email address"
              ref="emailAddress"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }]} />
            <AddressForm
              addNotification={addNotification}
              disabled={false}
              getCountries={getCountries}
              ref="userAddress"
              validateForm={validateForm} />
            <h2 className="create-payment-user__title">
              Payment information
            </h2>
            <CardForm
              acl={acl}
              createCardElement={createCardElement}
              ref="cardForm"
              validateForm={validateForm} />
            <label htmlFor="cardAddressSame">
              <input checked={true}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={instance._handleCardSameChange}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input checked={true}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={instance._handleBillingSameChange}
                ref="billingAddressSame"
                type="checkbox" />
              Billing address is the same as above
            </label>
            {null}
            {null}
          </div>
          <div className="create-payment-user__add">
            <GenericButton
              action={instance._handleAddUser}
              disabled={false}
              type="inline-neutral">
              Add payment details
            </GenericButton>
          </div>
        </form>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a business form', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createCardElement = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children.props.children[0].props.children[0]
      .props.children[1].props.children.props.children[0].props.onChange();
    output = renderer.getRenderOutput();
    const options = output.props.children.props.children[0].props.children[0]
      .props.children;
    const expected = (
      <div className="create-payment-user">
        <form className="create-payment-user__form">
          <div className="create-payment-user__form-content">
            <ul className="create-payment-user__form-type">
              <li className="create-payment-user__form-type-option">
                <label htmlFor="personal">
                  <input checked={false}
                    id="personal"
                    name="formType"
                    onChange={options[0].props.children.props.children[0]
                      .props.onChange}
                    type="radio" />
                  Personal use
                </label>
              </li>
              <li className="create-payment-user__form-type-option">
                <label htmlFor="business">
                  <input checked={true}
                    id="business"
                    name="formType"
                    onChange={options[1].props.children.props.children[0]
                      .props.onChange}
                    type="radio" />
                  Business use
                </label>
              </li>
            </ul>
            <div className="create-payment-user__vat">
              <GenericInput
                disabled={false}
                label="VAT number (optional)"
                ref="VATNumber"
                required={false} />
            </div>
            <h2 className="create-payment-user__title">
              Name and address
            </h2>
            <GenericInput
              disabled={false}
              label="Business name"
              ref="businessName"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }]} />
            <GenericInput
              disabled={false}
              label="Email address"
              ref="emailAddress"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }]} />
            <AddressForm
              addNotification={addNotification}
              disabled={false}
              getCountries={getCountries}
              ref="userAddress"
              validateForm={validateForm} />
            <h2 className="create-payment-user__title">
              Payment information
            </h2>
            <CardForm
              acl={acl}
              createCardElement={createCardElement}
              ref="cardForm"
              validateForm={validateForm} />
            <label htmlFor="cardAddressSame">
              <input checked={true}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={instance._handleCardSameChange}
                ref="cardAddressSame"
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input checked={true}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={instance._handleBillingSameChange}
                ref="billingAddressSame"
                type="checkbox" />
              Billing address is the same as above
            </label>
            {null}
            {null}
          </div>
          <div className="create-payment-user__add">
            <GenericButton
              action={instance._handleAddUser}
              disabled={false}
              type="inline-neutral">
              Add payment details
            </GenericButton>
          </div>
        </form>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display card and billing address fields', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={validateForm} />, true);
    let output = renderer.getRenderOutput();
    let formContent = output.props.children.props.children[0].props.children;
    formContent[8].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    formContent[9].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    output = renderer.getRenderOutput();
    formContent = output.props.children.props.children[0].props.children;
    expect(formContent[10]).toEqualJSX(
      <div>
        <h2 className="create-payment-user__title">
          Card address
        </h2>
        <AddressForm
          addNotification={addNotification}
          disabled={false}
          getCountries={getCountries}
          ref="cardAddress"
          validateForm={validateForm} />
      </div>);
    expect(formContent[11]).toEqualJSX(
      <div>
        <h2 className="create-payment-user__title">
          Billing address
        </h2>
        <AddressForm
          addNotification={addNotification}
          disabled={false}
          getCountries={getCountries}
          ref="billingAddress"
          validateForm={validateForm} />
      </div>);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    const createToken = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = component.getMountedInstance();
    instance.refs = refs;
    const output = component.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    component.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('does not add the user if there is a validation error', function() {
    const createToken = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(false)} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createToken.callCount, 0);
  });

  it('can create the token using the correct data', function() {
    const createToken = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createToken.callCount, 1);
    assert.deepEqual(createToken.args[0][0], {card: 'value'});
    assert.deepEqual(createToken.args[0][1], {
      name: 'Mr Geoffrey Spinach',
      addressLine1: '10 Maple St',
      addressLine2: '',
      addressCity: 'Sasquatch',
      addressState: 'Bunnyhug',
      addressZip: '90210',
      addressCountry: 'CA'
    });
  });

  it('can create the token using the card address', function() {
    const createToken = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    refs.cardAddress = {
      getValue: sinon.stub().returns({
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        state: 'Spider',
        postcode: '9000',
        countryCode: 'AU',
        phones: ['00001111']
      })
    };
    instance.refs = refs;
    let output = renderer.getRenderOutput();
    let formContent = output.props.children.props.children[0].props.children;
    formContent[8].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createToken.callCount, 1);
    assert.deepEqual(createToken.args[0][0], {card: 'value'});
    assert.deepEqual(createToken.args[0][1], {
      name: 'Mr Geoffrey Spinach',
      addressLine1: '9 Kangaroo St',
      addressLine2: '',
      addressCity: 'Snake',
      addressState: 'Spider',
      addressZip: '9000',
      addressCountry: 'AU'
    });
  });

  it('can handle errors when trying to create the token', function() {
    const addNotification = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createToken={sinon.stub().callsArgWith(2, 'Uh oh!', null)}
        createUser={sinon.stub()}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create Stripe token',
      message: 'Could not create Stripe token: Uh oh!',
      level: 'error'
    });
  });

  it('can create the user using the correct data', function() {
    const createUser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub().callsArgWith(2, null, {id: 'token_123'})}
        createUser={createUser}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createUser.callCount, 1);
    assert.deepEqual(createUser.args[0][0], {
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      addresses: [{
        name: 'Geoffrey Spinach',
        line1: '10 Maple St',
        line2: '',
        city: 'Sasquatch',
        state: 'Bunnyhug',
        postcode: '90210',
        countryCode: 'CA',
        phones: ['12341234']
      }],
      vat: null,
      business: false,
      businessName: null,
      billingAddresses: [{
        name: 'Geoffrey Spinach',
        line1: '10 Maple St',
        line2: '',
        city: 'Sasquatch',
        state: 'Bunnyhug',
        postcode: '90210',
        countryCode: 'CA',
        phones: ['12341234']
      }],
      token: 'token_123',
      paymentMethodName: 'Default'
    });
  });

  it('can create a business user using the correct data', function() {
    const createUser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub().callsArgWith(2, null, {id: 'token_123'})}
        createUser={createUser}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    const extraRefs = {
      VATNumber: {
        getValue: sinon.stub().returns('vat23')
      },
      businessName: {
        getValue: sinon.stub().returns('Tuques LTD')
      }
    };
    instance.refs = Object.assign(refs, extraRefs);
    instance.refs = refs;
    let output = renderer.getRenderOutput();
    output.props.children.props.children[0].props.children[0]
      .props.children[1].props.children.props.children[0].props.onChange();
    output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createUser.callCount, 1);
    const args = createUser.args[0][0];
    assert.equal(args.business, true);
    assert.equal(args.businessName, 'Tuques LTD');
    assert.equal(args.vat, 'vat23');
  });

  it('can create the user with a different billing address', function() {
    const createUser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub().callsArgWith(2, null, {id: 'token_123'})}
        createUser={createUser}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    refs.billingAddress = {
      getValue: sinon.stub().returns({
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        state: 'Spider',
        postcode: '9000',
        countryCode: 'AU',
        phones: ['00001111']
      })
    };
    instance.refs = refs;
    let output = renderer.getRenderOutput();
    let formContent = output.props.children.props.children[0].props.children;
    formContent[9].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createUser.callCount, 1);
    assert.deepEqual(createUser.args[0][0], {
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      addresses: [{
        name: 'Geoffrey Spinach',
        line1: '10 Maple St',
        line2: '',
        city: 'Sasquatch',
        state: 'Bunnyhug',
        postcode: '90210',
        countryCode: 'CA',
        phones: ['12341234']
      }],
      vat: null,
      business: false,
      businessName: null,
      billingAddresses: [{
        name: 'Bruce Dundee',
        line1: '9 Kangaroo St',
        line2: '',
        city: 'Snake',
        state: 'Spider',
        postcode: '9000',
        countryCode: 'AU',
        phones: ['00001111']
      }],
      token: 'token_123',
      paymentMethodName: 'Default'
    });
  });

  it('can handle errors when trying to create the user', function() {
    const addNotification = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createToken={sinon.stub().callsArgWith(2, null, {id: 'token_123'})}
        createUser={sinon.stub().callsArgWith(1, 'Uh oh!', null)}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not create a payment user',
      message: 'Could not create a payment user: Uh oh!',
      level: 'error'
    });
  });

  it('reloads the user after the user is created', function() {
    const renderer = jsTestUtils.shallowRender(
      <CreatePaymentUser
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createToken={sinon.stub().callsArgWith(2, null, {id: 'token_123'})}
        createUser={sinon.stub().callsArgWith(1, null, null)}
        getCountries={getCountries}
        onUserCreated={onUserCreated}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(onUserCreated.callCount, 1);
  });
});
