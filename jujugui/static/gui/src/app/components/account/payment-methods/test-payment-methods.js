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
  let acl;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('account-payment-method', () => { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render the payment methods', () => {
    const user = {
      paymentMethods: [{
        name: 'Company'
      }]
    };
    const addNotification = sinon.stub();
    const updateUser = sinon.stub();
    const removePaymentMethod = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={addNotification}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={removePaymentMethod}
        updateUser={updateUser}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Payment details
        </h2>
        <ul className="user-profile__list twelve-col">
          {[<juju.components.ExpandingRow
            classes={{
              'user-profile__list-row': true,
              'twelve-col': true
            }}
            clickable={false}
            expanded={true}
            key="Company">
            <div>
              Company
            </div>
            <div className="account__payment-details">
              <juju.components.AccountPaymentMethodCard
                addNotification={addNotification}
                card={{name: 'Company'}}
                onPaymentMethodRemoved={updateUser}
                removePaymentMethod={removePaymentMethod}
                username='spinach' />
            </div>
          </juju.components.ExpandingRow>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render when there are no payment methods', () => {
    const user = {
      paymentMethods: []
    };
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
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
          <juju.components.GenericButton
            action={instance._toggleAdd}
            type="inline-neutral"
            title="Add payment method" />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can cancel the requests when unmounting', () => {
    const abort = sinon.stub();
    const user = {
      paymentMethods: []
    };
    const createToken = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={sinon.stub()}
        createPaymentMethod={sinon.stub()}
        createToken={createToken}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
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
    const user = {
      paymentMethods: []
    };
    const createCardElement = sinon.stub();
    const validateForm = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={createCardElement}
        createPaymentMethod={sinon.stub()}
        createToken={sinon.stub()}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
        updateUser={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = component.getMountedInstance();
    let output = component.getRenderOutput();
    output.props.children[1].props.children[1].props.action();
    output = component.getRenderOutput();
    const expected = (
      <juju.components.ExpandingRow
        classes={{'twelve-col': true}}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="account__payment-form">
          <div className="account__payment-form-fields">
            <juju.components.CardForm
              acl={acl}
              createCardElement={createCardElement}
              ref="cardForm"
              validateForm={validateForm} />
          </div>
          <div className="twelve-col account__payment-form-buttons">
            <juju.components.GenericButton
              action={instance._toggleAdd}
              type="inline-neutral"
              title="Cancel" />
            <juju.components.GenericButton
              action={instance._createToken}
              type="inline-positive"
              title="Add payment method" />
          </div>
        </div>
      </juju.components.ExpandingRow>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('validates the form when adding a new payment method', () => {
    const user = {
      paymentMethods: []
    };
    const createToken = sinon.stub().callsArgWith(2, null, {id: 'token123'});
    const createPaymentMethod = sinon.stub().callsArg(2, null, null);
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
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

  it('can create a new payment method', () => {
    const user = {
      paymentMethods: []
    };
    const createToken = sinon.stub().callsArgWith(2, null, {id: 'token123'});
    const createPaymentMethod = sinon.stub().callsArg(3, null, null);
    const updateUser = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
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
      name: 'Mr G Spinach'
    });
    assert.equal(createPaymentMethod.callCount, 1);
    assert.equal(instance.state.showAdd, false);
    assert.equal(updateUser.callCount, 1);
  });

  it('can handle errors when creating a token', () => {
    const user = {
      paymentMethods: []
    };
    const createToken = sinon.stub().callsArgWith(2, 'Uh oh!');
    const createPaymentMethod = sinon.stub().callsArg(2, null, null);
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={addNotification}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
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
    const user = {
      paymentMethods: []
    };
    const createToken = sinon.stub().callsArgWith(2, null, {id: 'token123'});
    const createPaymentMethod = sinon.stub().callsArgWith(3, 'Uh oh!', null);
    const addNotification = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={addNotification}
        createCardElement={createPaymentMethod}
        createPaymentMethod={createPaymentMethod}
        createToken={createToken}
        paymentUser={user}
        removePaymentMethod={sinon.stub()}
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
