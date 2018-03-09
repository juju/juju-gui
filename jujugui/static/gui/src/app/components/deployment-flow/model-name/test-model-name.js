/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentModelName = require('./model-name');
const GenericInput = require('../../generic-input/generic-input');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentModelName', () => {
  let acl;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="six-col no-margin-bottom">
        <GenericInput
          disabled={false}
          key="modelName"
          label="Model name"
          onBlur={sinon.stub()}
          onChange={sinon.stub()}
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
    expect(output).toEqualJSX(expected);
  });

  it('can render when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const renderer = jsTestUtils.shallowRender(
      <DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="six-col no-margin-bottom">
        <GenericInput
          disabled={true}
          key="modelName"
          label="Model name"
          onBlur={sinon.stub()}
          onChange={sinon.stub()}
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
    expect(output).toEqualJSX(expected);
  });

  it('can derive the model name from the DD entity name', () => {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentModelName
        acl={acl}
        ddEntity={{get: sinon.stub().returns('snazzy-bundle')}}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    assert.equal(output.props.children.props.value, 'snazzy-bundle');
  });

  it('focuses on the model name field when loaded', () => {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {modelName: {focus: sinon.stub()}};
    instance.componentDidMount();
    assert.equal(instance.refs.modelName.focus.callCount, 1);
  });

  it('can update the model name on blur', () => {
    const setModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={setModelName} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.onBlur({
      currentTarget: {
        value: 'snazzy-bundle'
      }
    });
    assert.equal(setModelName.callCount, 1);
    assert.equal(setModelName.args[0][0], 'snazzy-bundle');
  });

  it('can update the model name on change', () => {
    const setModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={setModelName} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.onChange('snazzy-bundle');
    assert.equal(setModelName.callCount, 1);
    assert.equal(setModelName.args[0][0], 'snazzy-bundle');
  });

  it('does not update the model name if there is no value', () => {
    const setModelName = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentModelName
        acl={acl}
        ddEntity={null}
        modelName="mymodel"
        setModelName={setModelName} />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.onBlur({
      currentTarget: {
        value: ''
      }
    });
    assert.equal(setModelName.callCount, 0);
  });
});
