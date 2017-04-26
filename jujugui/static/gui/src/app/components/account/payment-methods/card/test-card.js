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

describe('AccountPaymentMethodCard', () => {
  let card;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('account-payment-method-card', () => { done(); });
  });

  beforeEach(() => {
    card = {
      id: 'paymentmethod1',
      name: 'personal',
      last4: 1234,
      month: 3,
      year: 2017,
      brand: 'Fancy',
      address: {
        id: 'address1',
        line1: '1 Maple',
        line2: 'St',
        city: 'Sasquatch',
        state: 'Bunnyhug',
        postcode: '90210',
        country: 'North of the Border'
      }
    };
  });

  it('can render', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        card={card} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__payment-card twelve-col">
        <div className="eight-col">
          <div className="account__payment-card-wrapper"
            onClick={instance._handleCardClick}>
            <div className="account__payment-card-container">
              <div className="account__payment-card-front">
                <div className="account__payment-card-overlay"></div>
                <div className="account__payment-card-name">
                  Click to reveal card details.
                </div>
              </div>
              <div className="account__payment-card-back">
                <div className="account__payment-card-overlay"></div>
                <div className="account__payment-card-number">
                  xxxx xxxx xxxx {1234}
                </div>
                <div className="account__payment-card-bottom">
                  <div className="account__payment-card-expiry">
                    {3}/{2017}
                  </div>
                  <div className="account__payment-card-brand">
                    Fancy
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="account__payment-card-info">
            <h4>Card address</h4>
            <p>1 Maple</p>
            <p>St</p>
            <p>{'Sasquatch'} {'Bunnyhug'}</p>
            <p>{'North of the Border'} {'90210'}</p>
          </div>
        </div>
        {null}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render the actions', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        card={card}
        removePaymentMethod={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="four-col last-col account__payment-card-actions">
        <juju.components.GenericButton
          action={instance._removePaymentMethod}
          type="inline-base"
          title="Remove payment details" />
      </div>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can render when flipped', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        card={card} />, true);
    let output = component.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick(
      {stopPropagation: sinon.stub()});
    output = component.getRenderOutput();
    assert.equal(
      output.props.children[0].props.children[0].props.className,
      'account__payment-card-wrapper account__payment-card-wrapper--flipped');
  });

  it('can remove the payment method', () => {
    const onPaymentMethodRemoved = sinon.stub();
    const removePaymentMethod = sinon.stub().callsArgWith(2, null);
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        addNotification={sinon.stub()}
        card={card}
        onPaymentMethodRemoved={onPaymentMethodRemoved}
        removePaymentMethod={removePaymentMethod}
        username='spinach' />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children.props.action();
    assert.equal(removePaymentMethod.callCount, 1);
    assert.equal(removePaymentMethod.args[0][0], 'spinach');
    assert.equal(removePaymentMethod.args[0][1], 'paymentmethod1');
    assert.equal(onPaymentMethodRemoved.callCount, 1);
  });

  it('can handle errors when removing the payment method', () => {
    const addNotification = sinon.stub();
    const removePaymentMethod = sinon.stub().callsArgWith(2, 'Uh oh!');
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        addNotification={addNotification}
        card={card}
        onPaymentMethodRemoved={sinon.stub()}
        removePaymentMethod={removePaymentMethod}
        username='spinach' />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children.props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to remove the payment method',
      message: 'Unable to remove the payment method: Uh oh!',
      level: 'error'
    });
  });

  it('can cancel the requests when unmounting', () => {
    const abort = sinon.stub();
    const removePaymentMethod = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        addNotification={sinon.stub()}
        card={card}
        onPaymentMethodRemoved={sinon.stub()}
        removePaymentMethod={removePaymentMethod}
        username='spinach' />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children.props.action();
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
