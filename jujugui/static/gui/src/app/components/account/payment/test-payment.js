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

describe('AccountPayment', function() {
  let acl, getCountries, getUser, user;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('account-payment', function() { done(); });
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
    getCountries = sinon.stub();
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={sinon.stub()}
        getUser={sinon.stub()}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
        <juju.components.Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the user details', function() {
    const addNotification = sinon.stub();
    const createPaymentMethod = sinon.stub();
    const createToken = sinon.stub();
    const removePaymentMethod = sinon.stub();
    const validateForm = sinon.stub();
    const createCardElement = sinon.stub();
    const addAddress = sinon.stub();
    const addBillingAddress = sinon.stub();
    const removeAddress = sinon.stub();
    const removeBillingAddress = sinon.stub();
    const updateAddress = sinon.stub();
    const updateBillingAddress = sinon.stub();
    const updateUser = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AccountPayment
        acl={acl}
        addAddress={addAddress}
        addBillingAddress={addBillingAddress}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        createUser={sinon.stub()}
        getCountries={sinon.stub()}
        getUser={getUser}
        removeAddress={removeAddress}
        removeBillingAddress={removeBillingAddress}
        removePaymentMethod={removePaymentMethod}
        updateAddress={updateAddress}
        updateBillingAddress={updateBillingAddress}
        updateUser={updateUser}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
        <div>
          <juju.components.AccountPaymentMethod
            acl={acl}
            addNotification={addNotification}
            createCardElement={createCardElement}
            createPaymentMethod={createPaymentMethod}
            createToken={createToken}
            paymentUser={user}
            removePaymentMethod={removePaymentMethod}
            updateUser={instance._getUser}
            username="spinach"
            validateForm={validateForm} />
          <juju.components.AccountPaymentDetails
            acl={acl}
            addAddress={addAddress}
            addBillingAddress={addBillingAddress}
            addNotification={addNotification}
            getCountries={getCountries}
            paymentUser={user}
            removeAddress={removeAddress}
            removeBillingAddress={removeBillingAddress}
            updateAddress={updateAddress}
            updateBillingAddress={updateBillingAddress}
            updateUser={updateUser}
            username="spinach"
            validateForm={validateForm} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display an error when getting users', function() {
    getUser = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={sinon.stub()}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: Uh oh!',
      level: 'error'
    });
  });

  it('can display a message if there is no user', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createUser = sinon.stub();
    const createToken = sinon.stub();
    getUser = sinon.stub().callsArgWith(1, null, null);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={createToken}
        createUser={createUser}
        getCountries={getCountries}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          <div className="account-payment__no-user">
            You are not set up to make payments.
            <juju.components.GenericButton
              action={instance._toggleAdd}
              type="inline-neutral"
              title="Set up payments" />
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a new user form', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createUser = sinon.stub();
    const createToken = sinon.stub();
    const createCardElement = sinon.stub();
    getUser = sinon.stub().callsArgWith(1, null, null);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={addNotification}
        createCardElement={createCardElement}
        createPaymentMethod={sinon.stub()}
        createToken={createToken}
        createUser={createUser}
        getCountries={getCountries}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children[1].props.action();
    output = renderer.getRenderOutput();
    const expected = (
      <div className="account-payment">
        <div className="account__section">
          <h2 className="account__title twelve-col">
            Payment details
          </h2>
          <div className="twelve-col">
            <juju.components.CreatePaymentUser
              acl={acl}
              addNotification={addNotification}
              createCardElement={createCardElement}
              createToken={createToken}
              createUser={createUser}
              getCountries={getCountries}
              onUserCreated={instance._getUser}
              username="spinach"
              validateForm={validateForm} />
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPayment
        acl={acl}
        addAddress={sinon.stub()}
        addBillingAddress={sinon.stub()}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={sinon.stub()}
        getUser={getUser}
        removeAddress={sinon.stub()}
        removeBillingAddress={sinon.stub()}
        removePaymentMethod={sinon.stub()}
        updateAddress={sinon.stub()}
        updateBillingAddress={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
