/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const CardForm = require('./card-form');
const GenericInput = require('../generic-input/generic-input');

const jsTestUtils = require('../../utils/component-test-utils');

describe('CardForm', function() {
  let acl;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <CardForm
        acl={acl}
        createCardElement={sinon.stub()}
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
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
    expect(output).toEqualJSX(expected);
  });

  it('mounts the card elements', function() {
    const mount = sinon.stub();
    const createCardElement = sinon.stub().callsArgWith(0, {
      mount: mount
    });
    const renderer = jsTestUtils.shallowRender(
      <CardForm
        acl={acl}
        createCardElement={createCardElement}
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {cardNode: {}};
    instance.componentDidMount();
    assert.equal(mount.callCount, 1);
  });

  it('can validate the form', function() {
    const renderer = jsTestUtils.shallowRender(
      <CardForm
        acl={acl}
        createCardElement={sinon.stub()}
        validateForm={sinon.stub().returns(false)} />, true);
    const instance = renderer.getMountedInstance();
    renderer.getRenderOutput();
    assert.isFalse(instance.validate());
  });

  it('can return the field values', function() {
    const renderer = jsTestUtils.shallowRender(
      <CardForm
        acl={acl}
        createCardElement={sinon.stub()}
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      name: {
        getValue: sinon.stub().returns('Mr Geoffrey Spinach')
      }
    };
    renderer.getRenderOutput();
    assert.deepEqual(instance.getValue(), {
      card: instance.card,
      name: 'Mr Geoffrey Spinach'
    });
  });
});
