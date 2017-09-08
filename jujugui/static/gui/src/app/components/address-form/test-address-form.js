/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AddressForm = require('./address-form');
const Spinner = require('../spinner/spinner');
const InsetSelect = require('../inset-select/inset-select');
const GenericInput = require('../generic-input/generic-input');

const jsTestUtils = require('../../utils/component-test-utils');

describe('AddressForm', function() {
  let getCountries, refs;

  beforeEach(() => {
    getCountries = sinon.stub().callsArgWith(0, null, [{
      name: 'Australia',
      code: 'AU'
    }]);
    refs = {
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
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <AddressForm
        addNotification={sinon.stub()}
        disabled={false}
        getCountries={sinon.stub()}
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="address-form">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <AddressForm
        addNotification={sinon.stub()}
        disabled={false}
        getCountries={getCountries}
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="address-form">
        <div>
          <InsetSelect
            disabled={false}
            label="Country"
            options={[{
              label: 'Australia',
              value: 'AU'
            }]}
            ref="country"
            value="GB" />
          <GenericInput
            disabled={false}
            label="Full name"
            ref="name"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]}
            value={undefined} />
          <GenericInput
            disabled={false}
            label="Address line 1"
            ref="line1"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]}
            value={undefined} />
          <GenericInput
            disabled={false}
            label="Address line 2 (optional)"
            ref="line2"
            required={false}
            value={undefined} />
          <GenericInput
            disabled={false}
            label="State/province"
            ref="state"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]}
            value={undefined} />
          <div className="twelve-col">
            <div className="six-col">
              <GenericInput
                disabled={false}
                label="Town/city"
                ref="city"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]}
                value={undefined} />
            </div>
            <div className="six-col last-col">
              <GenericInput
                disabled={false}
                label="Postcode"
                ref="postcode"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]}
                value={undefined}/>
            </div>
            <div className="twelve-col">
              <GenericInput
                disabled={false}
                label="Phone number"
                ref="phoneNumber"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]}
                value="" />
            </div>
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display the form without some fields', function() {
    const renderer = jsTestUtils.shallowRender(
      <AddressForm
        addNotification={sinon.stub()}
        disabled={false}
        getCountries={getCountries}
        showName={false}
        showPhone={false}
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="address-form">
        <div>
          <InsetSelect
            disabled={false}
            label="Country"
            options={[{
              label: 'Australia',
              value: 'AU'
            }]}
            ref="country"
            value="GB" />
          {null}
          <GenericInput
            disabled={false}
            label="Address line 1"
            ref="line1"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]}
            value={undefined} />
          <GenericInput
            disabled={false}
            label="Address line 2 (optional)"
            ref="line2"
            required={false}
            value={undefined} />
          <GenericInput
            disabled={false}
            label="State/province"
            ref="state"
            required={true}
            validate={[{
              regex: /\S+/,
              error: 'This field is required.'
            }]}
            value={undefined} />
          <div className="twelve-col">
            <div className="six-col">
              <GenericInput
                disabled={false}
                label="Town/city"
                ref="city"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]}
                value={undefined} />
            </div>
            <div className="six-col last-col">
              <GenericInput
                disabled={false}
                label="Postcode"
                ref="postcode"
                required={true}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]}
                value={undefined}/>
            </div>
            {null}
          </div>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can validate the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <AddressForm
        addNotification={sinon.stub()}
        disabled={false}
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
      <AddressForm
        addNotification={addNotification}
        disabled={false}
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
      <AddressForm
        addNotification={sinon.stub()}
        disabled={false}
        getCountries={getCountries}
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });


  it('can get the address', function() {
    const renderer = jsTestUtils.shallowRender(
      <AddressForm
        addNotification={sinon.stub()}
        disabled={false}
        getCountries={getCountries}
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    renderer.getRenderOutput();
    assert.deepEqual(instance.getValue(), {
      name: 'Geoffrey Spinach',
      line1: '10 Maple St',
      line2: '',
      city: 'Sasquatch',
      county: 'Bunnyhug',
      postcode: '90210',
      country: 'CA',
      phones: ['12341234']
    });
  });

  it('can get the address without some fields', function() {
    const renderer = jsTestUtils.shallowRender(
      <AddressForm
        addNotification={sinon.stub()}
        disabled={false}
        getCountries={getCountries}
        showName={false}
        showPhone={false}
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = refs;
    renderer.getRenderOutput();
    assert.deepEqual(instance.getValue(), {
      name: null,
      line1: '10 Maple St',
      line2: '',
      city: 'Sasquatch',
      county: 'Bunnyhug',
      postcode: '90210',
      country: 'CA',
      phones: null
    });
  });
});
