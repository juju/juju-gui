/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const AddressForm = require('./address-form');
const Spinner = require('../spinner/spinner');
const InsetSelect = require('../inset-select/inset-select');
const GenericInput = require('../generic-input/generic-input');

describe('AddressForm', function() {
  let getCountries, refs;

  const renderComponent = (options = {}) => enzyme.shallow(
    <AddressForm
      addNotification={options.addNotification || sinon.stub()}
      disabled={options.disabled === undefined ? false : options.disabled}
      getCountries={options.getCountries || getCountries}
      showName={options.showName === undefined ? true : options.showName}
      showPhone={options.showPhone === undefined ? true : options.showPhone}
      validateForm={options.validateForm || sinon.stub()} />
  );

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
    const wrapper = renderComponent({ getCountries: sinon.stub() });
    const expected = (
      <div className="address-form">
        <Spinner />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display the form', function() {
    const wrapper = renderComponent();
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
                value={undefined} />
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
    assert.compareJSX(wrapper, expected);
  });

  it('can display the form without some fields', function() {
    const wrapper = renderComponent({
      showName: false,
      showPhone: false
    });
    assert.equal(wrapper.find('[label="Full name"]').length, 0);
    assert.equal(wrapper.find('[label="Phone number"]').length, 0);
  });

  it('can validate the form', function() {
    const wrapper = renderComponent({
      validateForm: sinon.stub().returns(false)
    });
    const instance = wrapper.instance();
    assert.isFalse(instance.validate());
  });

  it('can display an error when getting countries', function() {
    getCountries = sinon.stub().callsArgWith(0, 'Uh oh!', null);
    const addNotification = sinon.stub();
    renderComponent({
      addNotification,
      getCountries
    });
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
    const wrapper = renderComponent({ getCountries });
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });


  it('can get the address', function() {
    const wrapper = renderComponent({
      validateForm: sinon.stub().returns(true)
    });
    const instance = wrapper.instance();
    instance.refs = refs;
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
    const wrapper = renderComponent({
      showName: false,
      showPhone: false,
      validateForm: sinon.stub().returns(true)
    });
    const instance = wrapper.instance();
    instance.refs = refs;
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
