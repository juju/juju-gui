/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ModalGUISettings = require('./modal-gui-settings');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ModalGUISettings', function() {
  const storage = {
    setItem: sinon.stub(),
    removeItem: sinon.stub(),
    getItem: sinon.stub().returns(false)
  };

  // Shallow render the component with the given parameters, and return an
  // object with the instance and the resulting output.
  function render(params={}) {
    const renderer = jsTestUtils.shallowRender(
      <ModalGUISettings
        closeModal={params.close || sinon.stub()}
        flags={params.flags || {terminal: false}}
        localStorage={params.storage || storage} />, true);
    return {
      instance: renderer.getMountedInstance(),
      output: renderer.getRenderOutput()
    };
  }

  // Return a node wit the component expected output.
  function expectedOutput(instance) {
    const handleChange = instance._handleChange.bind(instance);
    const handleSave = instance._handleSave.bind(instance);
    return (
      <div className="modal modal--narrow">
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Custom GUI Settings</h2>
          <span className="close" onClick={instance.props.closeModal} role="button"
            tabIndex="0">
            <SvgIcon name="close_16" size="16" />
          </span>
        </div>
        <div className="content">
          <p>
            <label htmlFor="disable-cookie">
              <input defaultChecked={false} id="disable-cookie"
                name="disable-cookie"
                onChange={handleChange}
                type="checkbox" />&nbsp;
              Disable the EU cookie warning.
            </label>
          </p>
          <p>
            <label htmlFor="force-containers">
              <input defaultChecked={false} id="force-containers"
                name="force-containers"
                onChange={handleChange}
                type="checkbox" />&nbsp;
              Enable container control for this provider.
            </label>
          </p>
          <p>
            <label htmlFor="disable-auto-place">
              <input defaultChecked={false} id="disable-auto-place"
                name="disable-auto-place"
                onChange={handleChange}
                type="checkbox" />&nbsp;
              Default to not automatically place units on commit.
            </label>
          </p>
          <p>
            <label htmlFor="jujushell-url">
              <input id="jujushell-url" name="jujushell-url"
                onChange={handleChange}
                type="text"
                value="" />&nbsp;
              DNS name for the Juju Shell.
            </label>
          </p>
          <p>
            <small>
              NOTE: You will need to reload for changes to take effect.
            </small>
          </p>
          <input className="button--positive" id="save-settings"
            name="save-settings" onClick={handleSave}
            type="button" value="Save" />
        </div>
      </div>
    );
  }

  it('renders', function() {
    const comp = render();
    expect(comp.output).toEqualJSX(expectedOutput(comp.instance));
  });

  it('saves state', function() {
    const comp = render();
    comp.instance.setState({
      'disable-cookie': true,
      'disable-auto-place': null
    });
    comp.instance._handleSave();
    assert.equal(storage.setItem.callCount, 1);
    assert.deepEqual(storage.setItem.args[0], ['disable-cookie', true]);
    assert.equal(storage.removeItem.callCount, 3);
    assert.deepEqual(storage.removeItem.args[0], ['disable-auto-place']);
    assert.deepEqual(storage.removeItem.args[1], ['force-containers']);
    assert.deepEqual(storage.removeItem.args[2], ['jujushell-url']);
  });
});
