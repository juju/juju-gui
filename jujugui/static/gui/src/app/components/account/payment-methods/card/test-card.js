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
      name: 'Company',
      last4: 1234,
      month: 3,
      year: 2017,
      brand: 'Fancy',
    };
  });

  it('can render', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        card={card} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__payment-card"
        onClick={instance._handleCardClick}>
        <div className="account__payment-card-container">
          <div className="account__payment-card-front">
            <div className="account__payment-card-overlay"></div>
            <div className="account__payment-card-name">
              Company
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
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render when flipped', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethodCard
        card={card} />, true);
    let output = component.getRenderOutput();
    output.props.onClick({stopPropagation: sinon.stub()});
    output = component.getRenderOutput();
    assert.deepEqual(
      output.props.className,
      'account__payment-card account__payment-card--flipped');
  });
});
