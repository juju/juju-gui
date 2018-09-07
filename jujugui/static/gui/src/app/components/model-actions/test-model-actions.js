'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ModelActions = require('./model-actions');
const SvgIcon = require('../svg-icon/svg-icon');

describe('ModelActions', function() {
  var acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    <ModelActions
      acl={options.acl || acl}
      appState={options.appState || {current: {}}}
      changeState={options.changeState || sinon.stub()}
      displayTerminalButton={
        options.displayTerminalButton === undefined ?
          false : options.displayTerminalButton}
      exportEnvironmentFile={options.exportEnvironmentFile || sinon.stub()}
      hideDragOverNotification={options.hideDragOverNotification || sinon.stub()}
      importBundleFile={options.importBundleFile || sinon.stub()}
      loadingModel={
        options.loadingModel === undefined ? false : options.loadingModel}
      renderDragOverNotification={options.renderDragOverNotification || sinon.stub()}
      sharingVisibility={options.sharingVisibility || sinon.stub()}
      userIsAuthenticated={
        options.userIsAuthenticated === undefined ?
          true : options.userIsAuthenticated} />
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render and pass the correct props', function() {
    const wrapper = renderComponent();
    var expected = (
      <div className="model-actions">
        <div className="model-actions__buttons">
          <span className="model-actions__export model-actions__button"
            onClick={wrapper.find('.model-actions__export').prop('onClick')}
            role="button"
            tabIndex="0">
            <SvgIcon className="model-actions__icon"
              name="export_16"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Export
              </span>
            </span>
          </span>
          <span className="model-actions__import model-actions__button"
            onClick={wrapper.find('.model-actions__import').prop('onClick')}
            role="button"
            tabIndex="0">
            <SvgIcon className="model-actions__icon"
              name="import_16"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Import
              </span>
            </span>
          </span>
          <span className="model-actions__share model-actions__button"
            onClick={wrapper.find('.model-actions__share').prop('onClick')}
            role="button"
            tabIndex="0">
            <SvgIcon className="model-actions__icon"
              name="share_16"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Share
              </span>
            </span>
          </span>
        </div>
        <input accept=".zip,.yaml,.yml"
          className="model-actions__file"
          onChange={wrapper.find('.model-actions__file').prop('onChange')}
          ref="file-input"
          type="file" />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render the terminalAction', () => {
    const wrapper = renderComponent({ displayTerminalButton: true });
    var expected = (
      <span className="model-actions__shell model-actions__button"
        onClick={wrapper.find('.model-actions__shell').prop('onClick')}
        role="button"
        tabIndex="0">
        <SvgIcon className="model-actions__icon"
          name="code-snippet_24"
          size="16" />
        <span className="tooltip__tooltip--below">
          <span className="tooltip__inner tooltip__inner--up">
            Juju shell
          </span>
        </span>
      </span>);
    assert.compareJSX(wrapper.find('.model-actions__shell'), expected);
  });

  it('can export the env', function() {
    var exportEnvironmentFile = sinon.stub();
    const wrapper = renderComponent({ exportEnvironmentFile });
    wrapper.find('.model-actions__export').props().onClick();
    assert.equal(exportEnvironmentFile.callCount, 1);
  });

  it('can open the file dialog when import is clicked', function() {
    var fileClick = sinon.stub();
    const wrapper = renderComponent();
    var instance = wrapper.instance();
    instance.refs = {'file-input': {click: fileClick}};
    wrapper.find('.model-actions__import').props().onClick();
    assert.equal(fileClick.callCount, 1);
  });

  it('can get a file when a file is selected', function() {
    var importBundleFile = sinon.stub();
    const wrapper = renderComponent({ importBundleFile });
    var instance = wrapper.instance();
    instance.refs = {
      'file-input': {files: ['apache2.yaml']}
    };
    wrapper.find('.model-actions__file').props().onChange();
    assert.equal(importBundleFile.callCount, 1);
    assert.equal(importBundleFile.args[0][0], 'apache2.yaml');
  });

  it('can disable importing when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.model-actions__import').prop('onClick'), false);
  });

  it('disables sharing when not connected', function() {
    const wrapper = renderComponent({ userIsAuthenticated: false });
    assert.equal(wrapper.find('.model-actions__share').length, 0);
  });

  it('disables sharing when creating a new model', function() {
    const wrapper = renderComponent({ appState: {current: {root: 'new'}} });
    assert.equal(wrapper.find('.model-actions__share').length, 0);
  });

  it('can trigger the sharing UI', function() {
    const sharingVisibility = sinon.stub();
    const wrapper = renderComponent({ sharingVisibility });
    wrapper.find('.model-actions__share').props().onClick();
    assert.equal(sharingVisibility.callCount, 1);
  });

  it('applies the correct class when model is loading', function() {
    const wrapper = renderComponent({ loadingModel: true });
    const className = 'model-actions--loading-model';
    assert.equal(
      wrapper.find('.model-actions').prop('className').includes(className), true);
  });

  it('applies the correct class when on a user profile', function() {
    const wrapper = renderComponent({ appState: {current: {profile: 'foo'}} });
    const className = 'model-actions--loading-model';
    assert.equal(
      wrapper.find('.model-actions').prop('className').includes(className), true);
  });

  it('applies the correct class when on a user account page', function() {
    const wrapper = renderComponent({ appState: {current: {root: 'account'}} });
    const className = 'model-actions--loading-model';
    assert.equal(
      wrapper.find('.model-actions').prop('className').includes(className), true);
  });
});
