/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentModelName = require('./model-name');
const GenericInput = require('../../generic-input/generic-input');

describe('DeploymentModelName', () => {
  let acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentModelName
      acl={options.acl || acl}
      ddEntity={options.ddEntity}
      modelName={options.modelName || 'mymodel'}
      setModelName={options.setModelName || sinon.stub()} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="six-col no-margin-bottom">
        <GenericInput
          disabled={false}
          key="modelName"
          label="Model name"
          onBlur={wrapper.find('GenericInput').prop('onBlur')}
          onChange={wrapper.find('GenericInput').prop('onChange')}
          ref="modelName"
          required={true}
          validate={[{
            regex: /\S+/,
            error: 'This field is required.'
          }, {
            regex: /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)?$/,
            error: 'This field must only contain lowercase ' +
              'letters, numbers, and hyphens. It must not start or ' +
              'end with a hyphen.'
          }]}
          value="mymodel" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('GenericInput').prop('disabled'), true);
  });

  it('can derive the model name from the DD entity name', () => {
    const wrapper = renderComponent({
      ddEntity: {get: sinon.stub().returns('snazzy-bundle')}
    });
    assert.equal(wrapper.find('GenericInput').prop('value'), 'snazzy-bundle');
  });

  it('focuses on the model name field when loaded', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    const focus = sinon.stub();
    instance.refs = {modelName: {focus}};
    instance.componentDidMount();
    assert.equal(focus.callCount, 1);
  });

  it('can update the model name on blur', () => {
    const setModelName = sinon.stub();
    const wrapper = renderComponent({ setModelName });
    wrapper.find('GenericInput').simulate('blur', {
      currentTarget: {
        value: 'snazzy-bundle'
      }
    });
    assert.equal(setModelName.callCount, 1);
    assert.equal(setModelName.args[0][0], 'snazzy-bundle');
  });

  it('can update the model name on change', () => {
    const setModelName = sinon.stub();
    const wrapper = renderComponent({ setModelName });
    wrapper.find('GenericInput').simulate('change', 'snazzy-bundle');
    assert.equal(setModelName.callCount, 1);
    assert.equal(setModelName.args[0][0], 'snazzy-bundle');
  });

  it('does not update the model name if there is no value', () => {
    const setModelName = sinon.stub();
    const wrapper = renderComponent({ setModelName });
    wrapper.find('GenericInput').simulate('blur', {
      currentTarget: {
        value: ''
      }
    });
    assert.equal(setModelName.callCount, 0);
  });
});
