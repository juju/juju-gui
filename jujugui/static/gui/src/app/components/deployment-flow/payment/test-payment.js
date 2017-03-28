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

describe('DeploymentPayment', function() {
  let acl, addressFields, getUser, user;

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
    addressFields = (
      <div>
        <juju.components.InsetSelect
          disabled={false}
          label="Country"
          onChange={null}
          options={[]} />
        <juju.components.GenericInput
          disabled={false}
          label="Full name"
          required={true} />
        <juju.components.GenericInput
          disabled={false}
          label="Address line 1"
          required={true} />
        <juju.components.GenericInput
          disabled={false}
          label="Address line 2 (optional)"
          required={false} />
        <juju.components.GenericInput
          disabled={false}
          label="State/province (optional)"
          required={false} />
        <div className="twelve-col">
          <div className="six-col">
            <juju.components.GenericInput
              disabled={false}
              label="Town/city"
              required={true} />
          </div>
          <div className="six-col last-col">
            <juju.components.GenericInput
              disabled={false}
              label="Postcode"
              required={true} />
          </div>
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={false}
              label="Country code"
              onChange={null}
              options={[]} />
          </div>
          <div className="eight-col last-col">
            <juju.components.GenericInput
              disabled={false}
              label="Phone number"
              required={true} />
          </div>
        </div>
      </div>);
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        getUser={sinon.stub()}
        setPaymentUser={sinon.stub()}
        username="spinach" />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <juju.components.Spinner />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can store the user details', function() {
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach" />);
    assert.equal(setPaymentUser.callCount, 1);
    assert.deepEqual(setPaymentUser.args[0][0], user);
  });

  it('can display payment methods', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        paymentUser={user}
        setPaymentUser={sinon.stub()}
        username="spinach" />, true);
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
    assert.deepEqual(output, expected);
  });

  it('can display an error when getting users', function() {
    getUser = sinon.stub().callsArgWith(1, 'failed', null);
    const addNotification = sinon.stub();
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach" />);
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
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach" />, true);
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
            {addressFields}
            <h2 className="deployment-payment__title">
              Payment information
            </h2>
            <juju.components.GenericInput
              disabled={false}
              label="Card number"
              required={true} />
            <div className="twelve-col">
              <div className="six-col">
                <juju.components.GenericInput
                  disabled={false}
                  label="Expiry MM/YY"
                  required={true} />
              </div>
              <div className="six-col last-col">
                <juju.components.GenericInput
                  disabled={false}
                  label="Security number (CVC)"
                  required={true} />
              </div>
            </div>
            <div className="twelve-col">
              <juju.components.GenericInput
                disabled={false}
                label="Name on card"
                required={true} />
            </div>
            <label htmlFor="cardAddressSame">
              <input checked={true}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={instance._handleCardSameChange}
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input checked={true}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={instance._handleBillingSameChange}
                type="checkbox" />
              Billing address is the same as above
            </label>
            {null}
            {null}
          </div>
          <div className="deployment-payment__add">
          <juju.components.GenericButton
            action={null}
            disabled={false}
            type="inline-neutral"
            title="Add payment details" />
          </div>
        </form>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display a business form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach" />, true);
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
                required={false} />
            </div>
            <h2 className="deployment-payment__title">
              Name and address
            </h2>
            <juju.components.GenericInput
              disabled={false}
              label="Business name"
              required={true} />
            {addressFields}
            <h2 className="deployment-payment__title">
              Payment information
            </h2>
            <juju.components.GenericInput
              disabled={false}
              label="Card number"
              required={true} />
            <div className="twelve-col">
              <div className="six-col">
                <juju.components.GenericInput
                  disabled={false}
                  label="Expiry MM/YY"
                  required={true} />
              </div>
              <div className="six-col last-col">
                <juju.components.GenericInput
                  disabled={false}
                  label="Security number (CVC)"
                  required={true} />
              </div>
            </div>
            <div className="twelve-col">
              <juju.components.GenericInput
                disabled={false}
                label="Name on card"
                required={true} />
            </div>
            <label htmlFor="cardAddressSame">
              <input checked={true}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={instance._handleCardSameChange}
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input checked={true}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={instance._handleBillingSameChange}
                type="checkbox" />
              Billing address is the same as above
            </label>
            {null}
            {null}
          </div>
          <div className="deployment-payment__add">
          <juju.components.GenericButton
            action={null}
            disabled={false}
            type="inline-neutral"
            title="Add payment details" />
          </div>
        </form>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display card and billing address fields', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach" />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    const formContent = output.props.children.props.children[0].props.children;
    formContent[9].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
    formContent[10].props.children[0].props.onChange(
      {currentTarget: {checked: false}});
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
            {addressFields}
            <h2 className="deployment-payment__title">
              Payment information
            </h2>
            <juju.components.GenericInput
              disabled={false}
              label="Card number"
              required={true} />
            <div className="twelve-col">
              <div className="six-col">
                <juju.components.GenericInput
                  disabled={false}
                  label="Expiry MM/YY"
                  required={true} />
              </div>
              <div className="six-col last-col">
                <juju.components.GenericInput
                  disabled={false}
                  label="Security number (CVC)"
                  required={true} />
              </div>
            </div>
            <div className="twelve-col">
              <juju.components.GenericInput
                disabled={false}
                label="Name on card"
                required={true} />
            </div>
            <label htmlFor="cardAddressSame">
              <input checked={false}
                id="cardAddressSame"
                name="cardAddressSame"
                onChange={instance._handleCardSameChange}
                type="checkbox" />
              Credit or debit card address is the same as above
            </label>
            <label htmlFor="billingAddressSame">
              <input checked={false}
                id="billingAddressSame"
                name="billingAddressSame"
                onChange={instance._handleBillingSameChange}
                type="checkbox" />
              Billing address is the same as above
            </label>
            <div>
              <h2 className="deployment-payment__title">
                Card address
              </h2>
              {addressFields}
            </div>
            <div>
              <h2 className="deployment-payment__title">
                Billing address
              </h2>
              {addressFields}
            </div>
          </div>
          <div className="deployment-payment__add">
          <juju.components.GenericButton
            action={null}
            disabled={false}
            type="inline-neutral"
            title="Add payment details" />
          </div>
        </form>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        setPaymentUser={sinon.stub()}
        username="spinach" />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
