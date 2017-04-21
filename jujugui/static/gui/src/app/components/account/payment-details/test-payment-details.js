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

describe('AccountPaymentDetails', () => {
  let acl;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('account-payment-details', () => { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can display the loading spinner', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetails
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={sinon.stub()}
        getUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Account details
        </h2>
        <juju.components.Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display when there is no user', () => {
    const getUser = sinon.stub().callsArgWith(1, null, null);
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetails
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={sinon.stub()}
        getUser={getUser}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Account details
        </h2>
        <div className="account__payment-details-none">
          You do not have any payment details.
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the details', () => {
    const getCountries = sinon.stub();
    const getUser = sinon.stub().callsArgWith(1, null, {
      name: 'Geoffrey Spinach',
      email: 'spinach@example.com',
      business: true,
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
      vat: '1234',
      businessName: 'Spinachy business',
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
    });
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetails
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Account details
        </h2>
        <div className="account__payment-details-view twelve-col">
          <juju.components.GenericInput
            disabled={true}
            label="Name"
            value="Geoffrey Spinach" />
         <juju.components.GenericInput
           disabled={true}
           label="Email address"
           value="spinach@example.com" />
         <juju.components.GenericInput
           disabled={true}
           label="VAT number (optional)"
           value="1234" />
         <juju.components.GenericInput
           disabled={true}
           label="Business name"
           value="Spinachy business" />
          <h4>
            Addresses
          </h4>
          <ul className="account__payment-details-addresses">
            {[<li key="Geoffrey Spinach">
              <juju.components.AddressForm
                disabled={true}
                address={{
                  name: 'Geoffrey Spinach',
                  line1: '10 Maple St',
                  line2: '',
                  city: 'Sasquatch',
                  state: 'Bunnyhug',
                  postcode: '90210',
                  countryCode: 'CA',
                  phones: ['12341234']
                }}
                getCountries={getCountries} />
              </li>]}
          </ul>
          <h4>
            Billing addresses
          </h4>
          <ul className="account__payment-details-addresses">
            {[<li key="Bruce Dundee">
              <juju.components.AddressForm
                disabled={true}
                address={{
                  name: 'Bruce Dundee',
                  line1: '9 Kangaroo St',
                  line2: '',
                  city: 'Snake',
                  state: 'Spider',
                  postcode: '9000',
                  countryCode: 'AU',
                  phones: ['00001111']
                }}
                getCountries={getCountries} />
              </li>]}
          </ul>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can handle errors when getting a user', () => {
    const addNotification = sinon.stub();
    const getUser = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountPaymentDetails
        acl={acl}
        addNotification={addNotification}
        getCountries={sinon.stub()}
        getUser={getUser}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    component.getRenderOutput();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: Uh oh!',
      level: 'error'
    });
  });

  it('can abort requests when unmounting', () => {
    const abort = sinon.stub();
    const getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
    <juju.components.AccountPaymentDetails
      acl={acl}
      addNotification={sinon.stub()}
      getCountries={sinon.stub()}
      getUser={getUser}
      username="spinach"
      validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
