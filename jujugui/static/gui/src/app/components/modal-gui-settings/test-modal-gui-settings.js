'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ModalGUISettings = require('./modal-gui-settings');
const SvgIcon = require('../svg-icon/svg-icon');

describe('ModalGUISettings', function() {
  let storage;

  // Shallow render the component with the given parameters, and return an
  // object with the instance and the resulting output.
  const renderComponent = (options = {}) => enzyme.shallow(
    <ModalGUISettings
      closeModal={options.closeModal || sinon.stub()}
      flags={options.flags || {terminal: false}}
      localStorage={options.localStorage || storage} />
  );

  beforeEach(() => {
    storage = {
      setItem: sinon.stub(),
      removeItem: sinon.stub(),
      getItem: sinon.stub().returns(false)
    };
  });

  it('renders', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="modal modal--narrow">
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Custom GUI Settings</h2>
          <span className="close"
            onClick={sinon.stub()}
            role="button"
            tabIndex="0">
            <SvgIcon name="close_16" size="16" />
          </span>
        </div>
        <div className="content">
          <p>
            <label htmlFor="disable-cookie">
              <input defaultChecked={false} id="disable-cookie"
                name="disable-cookie"
                onChange={wrapper.find('#disable-cookie').prop('onChange')}
                type="checkbox" />&nbsp;
              Disable the EU cookie warning.
            </label>
          </p>
          <p>
            <label htmlFor="force-containers">
              <input defaultChecked={false} id="force-containers"
                name="force-containers"
                onChange={wrapper.find('#force-containers').prop('onChange')}
                type="checkbox" />&nbsp;
              Enable container control for this provider.
            </label>
          </p>
          <p>
            <label htmlFor="disable-auto-place">
              <input defaultChecked={false} id="disable-auto-place"
                name="disable-auto-place"
                onChange={wrapper.find('#disable-auto-place').prop('onChange')}
                type="checkbox" />&nbsp;
              Default to not automatically place units on commit.
            </label>
          </p>
          <p>
            <label htmlFor="jujushell-url">
              <input id="jujushell-url" name="jujushell-url"
                onChange={wrapper.find('#jujushell-url').prop('onChange')}
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
            name="save-settings"
            onClick={wrapper.find('#save-settings').prop('onClick')}
            type="button" value="Save" />
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('saves state', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.setState({
      'disable-cookie': true,
      'disable-auto-place': null
    });
    instance._handleSave();
    assert.equal(storage.setItem.callCount, 1);
    assert.deepEqual(storage.setItem.args[0], ['disable-cookie', true]);
    assert.equal(storage.removeItem.callCount, 3);
    assert.deepEqual(storage.removeItem.args[0], ['disable-auto-place']);
    assert.deepEqual(storage.removeItem.args[1], ['force-containers']);
    assert.deepEqual(storage.removeItem.args[2], ['jujushell-url']);
  });
});
