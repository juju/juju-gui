/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ModalGUISettings = require('./modal-gui-settings');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ModalGUISettings', function() {
  const _localStorage = {
    setItem: sinon.stub(),
    removeItem: sinon.stub(),
    getItem: sinon.stub().returns(false)
  };

  function visibleRender(
    hide = sinon.stub(),
    _handleChange = sinon.stub(),
    state = {
      'disable-cookie': false,
      'force-containers': false,
      'disable-auto-place': false
    },
    _handleSave = sinon.stub()) {
    return (<div className="modal modal--narrow">
      <div className="twelve-col no-margin-bottom">
        <h2 className="bordered">Custom GUI Settings</h2>
        <span className="close" tabIndex="0" role="button"
          onClick={hide}>
          <SvgIcon name="close_16"
            size="16" />
        </span>
      </div>
      <div className="content">
        <p>
          <label htmlFor="disable-cookie">
            <input type="checkbox" name="disable-cookie"
              id="disable-cookie"
              onChange={_handleChange}
              defaultChecked={state['disable-cookie']} />&nbsp;
              Disable the EU cookie warning.
          </label>
        </p>
        <p>
          <label htmlFor="force-containers">
            <input type="checkbox" name="force-containers"
              id="force-containers"
              onChange={_handleChange}
              defaultChecked={state['force-containers']} />&nbsp;
              Enable container control for this provider.
          </label>
        </p>
        <p>
          <label htmlFor="disable-auto-place">
            <input type="checkbox" name="disable-auto-place"
              id="disable-auto-place"
              onChange={_handleChange}
              defaultChecked={state['disable-auto-place']} />&nbsp;
              Default to not automatically place units on commit.
          </label>
        </p>
        <p>
          <small>
            NOTE: You will need to reload for changes to take effect.
          </small>
        </p>
        <input type="button" className="button--positive"
          name="save-settings" onClick={_handleSave}
          id="save-settings" value="Save"/>
      </div>
    </div>);
  }

  it('renders', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <ModalGUISettings
        closeModal={close}
        localStorage={_localStorage} />, true);
    let output = renderer.getRenderOutput();
    let expected = visibleRender(close);
    expect(output).toEqualJSX(expected);
  });

  it('saves state', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <ModalGUISettings
        closeModal={close}
        localStorage={_localStorage} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({
      'disable-cookie': true,
      'disable-auto-place': null
    });
    instance._handleSave();

    assert.equal(_localStorage.setItem.callCount, 1);
    assert.equal(_localStorage.removeItem.callCount, 2);
  });
});
