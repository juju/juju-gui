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

  it('can display the loading spinner', () => {
    const getUser = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        username="spinach" />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Payment details
        </h2>
        <juju.components.Spinner />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render the payment methods', () => {
    const getUser = sinon.stub().callsArgWith(1, null, {
      paymentMethods: [{
        name: 'Company'
      }]
    });
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        username="spinach" />, true);
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
                card={{name: 'Company'}} />
            </div>
          </juju.components.ExpandingRow>]}
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render when there is no user', () => {
    const getUser = sinon.stub().callsArgWith(1, null, null);
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        username="spinach" />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Payment details
        </h2>
        <div>
          No payment methods available.
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render when there are no payment methods', () => {
    const getUser = sinon.stub().callsArgWith(1, null, {
      paymentMethods: []
    });
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        username="spinach" />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Payment details
        </h2>
        <div>
          No payment methods available.
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can handle errors when loading the user', () => {
    const getUser = sinon.stub().callsArgWith(1, 'failed', null);
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={addNotification}
        getUser={getUser}
        username="spinach" />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: failed',
      level: 'error'
    });
  });

  it('can cancel the requests when unmounting', () => {
    const abort = sinon.stub();
    const getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentMethod
        acl={acl}
        addNotification={sinon.stub()}
        getUser={getUser}
        username="spinach" />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
