/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const CreateModelButton = require('./create-model-button');
const GenericButton = require('../generic-button/generic-button');

const jsTestUtils = require('../../utils/component-test-utils');

describe('CreateModelButton', () => {

  it('renders a button with default values', () => {
    const component = jsTestUtils.shallowRender(
      <CreateModelButton
        changeState={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="create-new-model">
        <GenericButton
          action={output.props.children.props.action}
          disabled={false}
          type="inline-neutral">
          Create new
        </GenericButton>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('renders a button with provided values', () => {
    const component = jsTestUtils.shallowRender(
      <CreateModelButton
        action={sinon.stub()}
        type="positive"
        title="test"
        disabled={false}
        changeState={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="create-new-model">
        <GenericButton
          action={output.props.children.props.action}
          disabled={false}
          type="positive">
          test
        </GenericButton>
      </div>
    );
    jsTestUtils.specificDeepEqual(output, expected);
    assert.deepEqual(output, expected);
  });

  it('renders a disabled button when provided with disabled state', () => {
    const component = jsTestUtils.shallowRender(
      <CreateModelButton
        type="positive"
        title="test"
        disabled={true}
        changeState={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="create-new-model">
        <GenericButton
          action={output.props.children.props.action}
          disabled={true}
          type="positive">
          test
        </GenericButton>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('calls the passed action', () => {
    const action = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <CreateModelButton
        action={action}
        type="positive"
        title="test"
        disabled={false}
        changeState={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    instance._createNewModel();
    assert.isTrue(action.called);
  });

  it('the passed action isn\'t called if button is disabled', () => {
    const action = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <CreateModelButton
        action={action}
        type="positive"
        title="test"
        disabled={true}
        changeState={sinon.stub()}
        switchModel={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    instance._createNewModel();
    assert.isFalse(action.called);
  });

  it('closes the profile before switching to a new model', () => {
    const changeState = sinon.stub();
    const switchModel = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <CreateModelButton
        type="positive"
        title="test"
        changeState={changeState}
        switchModel={switchModel} />, true);
    const output = component.getRenderOutput();
    // Call the action passed to the GenericButton
    output.props.children.props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0], [
      {profile: null, hash: null, postDeploymentPanel: null}
    ]);
    assert.equal(switchModel.callCount, 1);
    assert.deepEqual(switchModel.args[0], [null]);
  });
});
