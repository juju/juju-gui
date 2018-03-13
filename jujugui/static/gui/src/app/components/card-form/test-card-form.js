/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const CardForm = require('./card-form');
const GenericInput = require('../generic-input/generic-input');

describe('CardForm', function() {
  let acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    <CardForm
      acl={options.acl || acl}
      createCardElement={options.createCardElement || sinon.stub()}
      validateForm={options.validateForm || sinon.stub()} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render the form', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="card-form">
        <GenericInput
          disabled={false}
          label="Name on card"
          ref="name"
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }]} />
        <div className="card-form__card"
          ref="cardNode"></div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('mounts the card elements', function() {
    const mount = sinon.stub();
    const createCardElement = sinon.stub().callsArgWith(0, {
      mount: mount
    });
    const wrapper = renderComponent({ createCardElement });
    const instance = wrapper.instance();
    instance.refs = {cardNode: {}};
    instance.componentDidMount();
    assert.equal(mount.callCount, 1);
  });

  it('can validate the form', function() {
    const validateForm = sinon.stub().returns(false);
    const wrapper = renderComponent({ validateForm });
    const instance = wrapper.instance();
    assert.isFalse(instance.validate());
  });

  it('can return the field values', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      name: {
        getValue: sinon.stub().returns('Mr Geoffrey Spinach')
      }
    };
    wrapper.update();
    assert.deepEqual(instance.getValue(), {
      card: instance.card,
      name: 'Mr Geoffrey Spinach'
    });
  });
});
