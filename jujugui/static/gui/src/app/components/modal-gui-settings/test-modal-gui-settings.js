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
  function expectedOutput(instance, includeShell=false) {
    const handleChange = instance._handleChange.bind(instance);
    const handleSave = instance._handleSave.bind(instance);
    const shellNode = includeShell ? (
      <p>
        <label htmlFor="jujushell-url">
          <input type="text" name="jujushell-url"
            id="jujushell-url"
            onChange={handleChange}
            value="" />&nbsp;
          DNS name for the Juju Shell.
        </label>
      </p>
    ) : null;
    return (
      <div className="modal modal--narrow">
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Custom GUI Settings</h2>
          <span className="close" tabIndex="0" role="button"
            onClick={instance.props.closeModal}>
            <SvgIcon name="close_16" size="16" />
          </span>
        </div>
        <div className="content">
          <p>
            <label htmlFor="disable-cookie">
              <input type="checkbox" name="disable-cookie"
                id="disable-cookie"
                onChange={handleChange}
                defaultChecked={false} />&nbsp;
              Disable the EU cookie warning.
            </label>
          </p>
          <p>
            <label htmlFor="force-containers">
              <input type="checkbox" name="force-containers"
                id="force-containers"
                onChange={handleChange}
                defaultChecked={false} />&nbsp;
              Enable container control for this provider.
            </label>
          </p>
          <p>
            <label htmlFor="disable-auto-place">
              <input type="checkbox" name="disable-auto-place"
                id="disable-auto-place"
                onChange={handleChange}
                defaultChecked={false} />&nbsp;
              Default to not automatically place units on commit.
            </label>
          </p>
          {shellNode}
          <p>
            <small>
              NOTE: You will need to reload for changes to take effect.
            </small>
          </p>
          <input type="button" className="button--positive"
            name="save-settings" onClick={handleSave}
            id="save-settings" value="Save" />
        </div>
      </div>
    );
  }

  it('renders', function() {
    const comp = render();
    expect(comp.output).toEqualJSX(expectedOutput(comp.instance));
  });

  it('renders including the jujushell URL input', function() {
    const comp = render({flags: {terminal: true}});
    expect(comp.output).toEqualJSX(expectedOutput(comp.instance, true));
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
