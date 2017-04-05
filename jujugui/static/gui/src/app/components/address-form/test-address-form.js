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

describe('AddressForm', function() {
  let acl, getCountries;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('address-form', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    getCountries = sinon.stub().callsArgWith(0, null, [{
      name: 'Australia',
      code: 'AU'
    }]);
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AddressForm
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={sinon.stub()}
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="address-form">
        <juju.components.Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AddressForm
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={getCountries}
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="address-form">
        <div>
          <juju.components.InsetSelect
            disabled={false}
            label="Country"
            options={[{
              label: 'Australia',
              value: 'AU'
            }]}
            ref="country"
            value="GB" />
          <juju.components.GenericInput
            disabled={false}
            label="Full name"
            ref="name"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]} />
          <juju.components.GenericInput
            disabled={false}
            label="Address line 1"
            ref="line1"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]} />
          <juju.components.GenericInput
            disabled={false}
            label="Address line 2 (optional)"
            ref="line2"
            required={false} />
          <juju.components.GenericInput
            disabled={false}
            label="State/province"
            ref="state"
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
                ref="city"
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
                ref="postcode"
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
                ref="countryCode"
                value="GB" />
            </div>
            <div className="eight-col last-col">
              <juju.components.GenericInput
                disabled={false}
                label="Phone number"
                ref="phoneNumber"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
            </div>
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can validate the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AddressForm
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={getCountries}
        validateForm={sinon.stub().returns(false)} />, true);
    const instance = renderer.getMountedInstance();
    renderer.getRenderOutput();
    assert.isFalse(instance.validate());
  });

  it('can display an error when getting countries', function() {
    getCountries = sinon.stub().callsArgWith(0, 'Uh oh!', null);
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.AddressForm
        acl={acl}
        addNotification={addNotification}
        getCountries={getCountries}
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load country info',
      message: 'Could not load country info: Uh oh!',
      level: 'error'
    });
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    getCountries = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AddressForm
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={getCountries}
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });


  it('can get the address', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.AddressForm
        acl={acl}
        addNotification={sinon.stub()}
        getCountries={getCountries}
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      name: {
        getValue: sinon.stub().returns('Geoffrey Spinach')
      },
      line1: {
        getValue: sinon.stub().returns('10 Maple St')
      },
      line2: {
        getValue: sinon.stub().returns('')
      },
      city: {
        getValue: sinon.stub().returns('Sasquatch')
      },
      state: {
        getValue: sinon.stub().returns('Bunnyhug')
      },
      postcode: {
        getValue: sinon.stub().returns('90210')
      },
      country: {
        getValue: sinon.stub().returns('CA')
      },
      phoneNumber: {
        getValue: sinon.stub().returns('12341234')
      }
    };
    renderer.getRenderOutput();
    assert.deepEqual(instance.getValue(), {
      name: 'Geoffrey Spinach',
      line1: '10 Maple St',
      line2: '',
      city: 'Sasquatch',
      state: 'Bunnyhug',
      postcode: '90210',
      countryCode: 'CA',
      phones: ['12341234']
    });
  });
});
