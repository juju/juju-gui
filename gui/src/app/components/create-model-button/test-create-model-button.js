/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const CreateModelButton = require('./create-model-button');
const {Button} = require('@canonical/juju-react-components');

describe('CreateModelButton', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <CreateModelButton
      action={options.action || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      disabled={options.disabled === undefined ? false : options.disabled}
      modifier={options.modifier}
      switchModel={options.switchModel || sinon.stub()}
      title={options.title} />
  );

  it('renders a button with default values', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="create-new-model v1">
        <Button
          action={wrapper.find('Button').prop('action')}
          disabled={false}
          modifier="neutral">
          Create new
        </Button>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders a button with provided values', () => {
    const wrapper = renderComponent({
      title: 'test',
      modifier: 'positive'
    });
    const button = wrapper.find('Button');
    assert.equal(button.prop('modifier'), 'positive');
    assert.equal(button.children().text(), 'test');
  });

  it('renders a disabled button when provided with disabled state', () => {
    const wrapper = renderComponent({disabled: true});
    assert.equal(wrapper.find('Button').prop('disabled'), true);
  });

  it('calls the passed action', () => {
    const action = sinon.stub();
    const wrapper = renderComponent({action});
    wrapper.find('Button').props().action();
    assert.isTrue(action.called);
  });

  it('the passed action isn\'t called if button is disabled', () => {
    const action = sinon.stub();
    const wrapper = renderComponent({action, disabled: true});
    wrapper.find('Button').props().action();
    assert.isFalse(action.called);
  });

  it('closes the profile before switching to a new model', () => {
    const changeState = sinon.stub();
    const switchModel = sinon.stub();
    const wrapper = renderComponent({
      changeState,
      switchModel
    });
    wrapper.find('Button').props().action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0], [
      {profile: null, hash: null, postDeploymentPanel: null}
    ]);
    assert.equal(switchModel.callCount, 1);
    assert.deepEqual(switchModel.args[0], [null]);
  });
});
