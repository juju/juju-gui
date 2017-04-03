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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

function addressFields(key) {
  return (
    <div>
      <juju.components.InsetSelect
        disabled={false}
        label="Country"
        options={[{
          label: 'Australia',
          value: 'AU'
        }]}
        ref={`${key}AddressCountry`}
        value="GB" />
      <juju.components.GenericInput
        disabled={false}
        label="Full name"
        ref={`${key}AddressFullName`}
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />
      <juju.components.GenericInput
        disabled={false}
        label="Address line 1"
        ref={`${key}AddressLine1`}
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />
      <juju.components.GenericInput
        disabled={false}
        label="Address line 2 (optional)"
        ref={`${key}AddressLine2`}
        required={false} />
      <juju.components.GenericInput
        disabled={false}
        label="State/province"
        ref={`${key}AddressState`}
        required={true}
        validate={[{
          regex: /\S+/,
          error: 'This field is required.'
        }]} />
      <div className="twelve-col">
        <div className="six-col">
          <juju.components.GenericInput
            disabled={false}
            label="Town/city"
            ref={`${key}AddressCity`}
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]} />
        </div>
        <div className="six-col last-col">
          <juju.components.GenericInput
            disabled={false}
            label="Postcode"
            ref={`${key}AddressPostcode`}
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]} />
        </div>
        <div className="four-col">
          <juju.components.InsetSelect
            disabled={false}
            label="Country code"
            options={[{
              label: 'AU',
              value: 'AU'
            }]}
            ref={`${key}AddressCountryCode`}
            value="GB" />
        </div>
        <div className="eight-col last-col">
          <juju.components.GenericInput
            disabled={false}
            label="Phone number"
            ref={`${key}AddressPhoneNumber`}
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]} />
        </div>
      </div>
    </div>);
}

describe('DeploymentPayment', function() {
  let acl, getCountries, getUser, refs, user;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-payment', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    user = {
      paymentMethods: [{
        name: 'Company'
      }]
    };
    getUser = sinon.stub().callsArgWith(1, null, {
      paymentMethods: [{
        name: 'Company'
      }]
    });
    getCountries = sinon.stub().callsArgWith(0, null, [{
      name: 'Australia',
      code: 'AU'
    }]);
    refs = {
      emailAddress: {
        getValue: sinon.stub().returns('spinach@example.com')
      },
      userAddressFullName: {
        getValue: sinon.stub().returns('Geoffrey Spinach')
      },
      userAddressLine1: {
        getValue: sinon.stub().returns('10 Maple St')
      },
      userAddressLine2: {
        getValue: sinon.stub().returns('')
      },
      userAddressCity: {
        getValue: sinon.stub().returns('Sasquatch')
      },
      userAddressState: {
        getValue: sinon.stub().returns('Bunnyhug')
      },
      userAddressPostcode: {
        getValue: sinon.stub().returns('90210')
      },
      userAddressCountry: {
        getValue: sinon.stub().returns('CA')
      },
      userAddressPhoneNumber: {
        getValue: sinon.stub().returns('12341234')
      },
      cardExpiry: {
        getValue: sinon.stub().returns('03/17')
      },
      cardNumber: {
        getValue: sinon.stub().returns('1234 5678 1234 5678')
      },
      cardCVC: {
        getValue: sinon.stub().returns('123')
      },
      cardName: {
        getValue: sinon.stub().returns('Mr Geoffrey Spinach')
      }
    };
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={sinon.stub()}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <juju.components.Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can store the user details', function() {
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(setPaymentUser.callCount, 1);
    assert.deepEqual(setPaymentUser.args[0][0], user);
  });

  it('can display payment methods', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={user}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <ul className="deployment-payment__methods twelve-col">
          {[<li className="deployment-payment__method"
            key="Company0">
            <juju.components.AccountPaymentMethodCard
              card={{name: 'Company'}} />
          </li>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display an error when getting users', function() {
    getUser = sinon.stub().callsArgWith(1, 'failed', null);
    const addNotification = sinon.stub();
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: failed',
      level: 'error'
    });
  });

  it('can display a personal form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const options = output.props.children.props.children[0].props.children[0]
      .props.children;
    const expected = (
      <div className="deployment-payment">
        <form className="deployment-payment__form">
          <div className="deployment-payment__form-content">
            <ul className="deployment-payment__form-type">
              <li className="deployment-payment__form-type-option">
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
              <li className="deployment-payment__form-type-option">
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
            <h2 className="deployment-payment__title">
              Name and address
            </h2>
            {null}
            <juju.components.GenericInput
              disabled={false}
              label="Email address"
              ref="emailAddress"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }]} />
            {addressFields('user')}
            <h2 className="deployment-payment__title">
              Payment information
            </h2>
            <juju.components.GenericInput
              disabled={false}
              label="Card number"
              onChange={instance._formatCardNumber}
              ref="cardNumber"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9_-\s]{16,}/,
                error: 'The card number is too short.'
              }, {
                regex: /^[a-zA-Z0-9_-\s]{0,23}$/,
                error: 'The card number is too long.'
              }, {
                regex: /^[0-9\s]+$/,
                error: 'The card number can only contain numbers.'
              }]} />
            <div className="twelve-col no-margin-bottom">
              <div className="six-col no-margin-bottom">
                <juju.components.GenericInput
                  disabled={false}
                  label="Expiry MM/YY"
                  ref="cardExpiry"
                  required={true}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }, {
                    regex: /[\d]{2}\/[\d]{2}/,
                    error: 'The expiry must be in the format MM/YY'
                  }]} />
              </div>
              <div className="six-col last-col no-margin-bottom">
                <juju.components.GenericInput
                  disabled={false}
                  label="Security number (CVC)"
                  ref="cardCVC"
                  required={true}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }, {
                    regex: /^[0-9]{3}$/,
                    error: 'The CVC must be three characters long.'
                  }, {
                    regex: /^[0-9]+$/,
                    error: 'The CVC can only contain numbers.'
                  }]} />
              </div>
            </div>
            <div className="twelve-col">
              <juju.components.GenericInput
                disabled={false}
                label="Name on card"
                ref="cardName"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
            </div>
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
          <div className="deployment-payment__add">
            <juju.components.GenericButton
              action={instance._handleAddUser}
              disabled={false}
              type="inline-neutral"
              title="Add payment details" />
          </div>
        </form>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a business form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children.props.children[0].props.children[0]
      .props.children[1].props.children.props.children[0].props.onChange();
    output = renderer.getRenderOutput();
    const options = output.props.children.props.children[0].props.children[0]
      .props.children;
    const expected = (
      <div className="deployment-payment">
        <form className="deployment-payment__form">
          <div className="deployment-payment__form-content">
            <ul className="deployment-payment__form-type">
              <li className="deployment-payment__form-type-option">
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
              <li className="deployment-payment__form-type-option">
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
            <div className="deployment-payment__vat">
              <juju.components.GenericInput
                disabled={false}
                label="VAT number (optional)"
                ref="VATNumber"
                required={false} />
            </div>
            <h2 className="deployment-payment__title">
              Name and address
            </h2>
            <juju.components.GenericInput
              disabled={false}
              label="Business name"
              ref="businessName"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }]} />
            <juju.components.GenericInput
              disabled={false}
              label="Email address"
              ref="emailAddress"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }]} />
            {addressFields('user')}
            <h2 className="deployment-payment__title">
              Payment information
            </h2>
            <juju.components.GenericInput
              disabled={false}
              label="Card number"
              onChange={instance._formatCardNumber}
              ref="cardNumber"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9_-\s]{16,}/,
                error: 'The card number is too short.'
              }, {
                regex: /^[a-zA-Z0-9_-\s]{0,23}$/,
                error: 'The card number is too long.'
              }, {
                regex: /^[0-9\s]+$/,
                error: 'The card number can only contain numbers.'
              }]} />
            <div className="twelve-col no-margin-bottom">
              <div className="six-col no-margin-bottom">
                <juju.components.GenericInput
                  disabled={false}
                  label="Expiry MM/YY"
                  ref="cardExpiry"
                  required={true}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }, {
                    regex: /[\d]{2}\/[\d]{2}/,
                    error: 'The expiry must be in the format MM/YY'
                  }]} />
              </div>
              <div className="six-col last-col no-margin-bottom">
                <juju.components.GenericInput
                  disabled={false}
                  label="Security number (CVC)"
                  ref="cardCVC"
                  required={true}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }, {
                    regex: /^[0-9]{3}$/,
                    error: 'The CVC must be three characters long.'
                  }, {
                    regex: /^[0-9]+$/,
                    error: 'The CVC can only contain numbers.'
                  }]} />
              </div>
            </div>
            <div className="twelve-col">
              <juju.components.GenericInput
                disabled={false}
                label="Name on card"
                ref="cardName"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
            </div>
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
          <div className="deployment-payment__add">
            <juju.components.GenericButton
              action={instance._handleAddUser}
              disabled={false}
              type="inline-neutral"
              title="Add payment details" />
          </div>
        </form>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display card and billing address fields', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    let output = renderer.getRenderOutput();
    let formContent = output.props.children.props.children[0].props.children;
    formContent[10].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    formContent[11].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    output = renderer.getRenderOutput();
    formContent = output.props.children.props.children[0].props.children;
    expect(formContent[12]).toEqualJSX(
      <div>
        <h2 className="deployment-payment__title">
          Card address
        </h2>
        {addressFields('card')}
      </div>);
    expect(formContent[13]).toEqualJSX(
      <div>
        <h2 className="deployment-payment__title">
          Billing address
        </h2>
        {addressFields('billing')}
      </div>);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('does not add the user if there is a validation error', function() {
    const createToken = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(false)} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createToken.callCount, 0);
  });

  it('can create the token using the correct data', function() {
    const createToken = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createToken.callCount, 1);
    assert.deepEqual(createToken.args[0][0], {
      number: '1234567812345678',
      cvc: '123',
      expMonth: '03',
      expYear: '17',
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
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    const extraRefs = {
      cardAddressLine1: {
        getValue: sinon.stub().returns('9 Kangaroo St')
      },
      cardAddressLine2: {
        getValue: sinon.stub().returns('')
      },
      cardAddressCity: {
        getValue: sinon.stub().returns('Snake')
      },
      cardAddressState: {
        getValue: sinon.stub().returns('Spider')
      },
      cardAddressPostcode: {
        getValue: sinon.stub().returns('9000')
      },
      cardAddressCountry: {
        getValue: sinon.stub().returns('AU')
      },
      cardAddressPhoneNumber: {
        getValue: sinon.stub().returns('')
      }
    };
    instance.refs = Object.assign(refs, extraRefs);
    let output = renderer.getRenderOutput();
    let formContent = output.props.children.props.children[0].props.children;
    formContent[10].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createToken.callCount, 1);
    assert.deepEqual(createToken.args[0][0], {
      number: '1234567812345678',
      cvc: '123',
      expMonth: '03',
      expYear: '17',
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
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        createToken={sinon.stub().callsArgWith(1, 'Uh oh!', null)}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
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
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub().callsArgWith(1, null, {id: 'token_123'})}
        createUser={createUser}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
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
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub().callsArgWith(1, null, {id: 'token_123'})}
        createUser={createUser}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
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
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub().callsArgWith(1, null, {id: 'token_123'})}
        createUser={createUser}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    const extraRefs = {
      billingAddressLine1: {
        getValue: sinon.stub().returns('9 Kangaroo St')
      },
      billingAddressLine2: {
        getValue: sinon.stub().returns('')
      },
      billingAddressCity: {
        getValue: sinon.stub().returns('Snake')
      },
      billingAddressState: {
        getValue: sinon.stub().returns('Spider')
      },
      billingAddressPostcode: {
        getValue: sinon.stub().returns('9000')
      },
      billingAddressCountry: {
        getValue: sinon.stub().returns('AU')
      },
      billingAddressPhoneNumber: {
        getValue: sinon.stub().returns('00001111')
      }
    };
    instance.refs = Object.assign(refs, extraRefs);
    let output = renderer.getRenderOutput();
    let formContent = output.props.children.props.children[0].props.children;
    formContent[11].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(createUser.callCount, 1);
    assert.deepEqual(createUser.args[0][0], {
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      addresses: [{
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
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        createToken={sinon.stub().callsArgWith(1, null, {id: 'token_123'})}
        createUser={sinon.stub().callsArgWith(1, 'Uh oh!', null)}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
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
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub().callsArgWith(1, null, {id: 'token_123'})}
        createUser={sinon.stub().callsArgWith(1, null, null)}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children.props.action();
    assert.equal(getUser.callCount, 2);
  });
});
