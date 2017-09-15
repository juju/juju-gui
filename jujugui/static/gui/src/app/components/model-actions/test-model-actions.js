/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ModelActions = require('./model-actions');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ModelActions', function() {
  var acl;

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render and pass the correct props', function() {
    var renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        userIsAuthenticated={true}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="model-actions">
        <div className="model-actions__buttons">
          <span className="model-actions__export model-actions__button"
            onClick={instance._handleExport}
            role="button"
            tabIndex="0">
            <SvgIcon name="export_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Export
              </span>
            </span>
          </span>
          <span className="model-actions__import model-actions__button"
            onClick={instance._handleImportClick}
            role="button"
            tabIndex="0">
            <SvgIcon name="import_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Import
              </span>
            </span>
          </span>
          <span className="model-actions__share model-actions__button"
            onClick={instance.props.sharingVisibility}
            role="button"
            tabIndex="0">
            <SvgIcon name="share_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Share
              </span>
            </span>
          </span>
        </div>
        <input className="model-actions__file"
          type="file"
          onChange={instance._handleImportFile}
          accept=".zip,.yaml,.yml"
          ref="file-input" />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can export the env', function() {
    var exportEnvironmentFile = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        userIsAuthenticated={true}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />);
    output.props.children[0].props.children[0].props.onClick();
    assert.equal(exportEnvironmentFile.callCount, 1);
  });

  it('can open the file dialog when import is clicked', function() {
    var fileClick = sinon.stub();
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        userIsAuthenticated={true}
        sharingVisibility={sinon.stub()}
      />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {'file-input': {click: fileClick}};
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[1].props.onClick();
    assert.equal(fileClick.callCount, 1);
  });

  it('can get a file when a file is selected', function() {
    var importBundleFile = sinon.stub();
    var hideDragOverNotification = sinon.stub();
    var renderDragOverNotification = sinon.stub();
    var exportEnvironmentFile = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={exportEnvironmentFile}
        renderDragOverNotification={renderDragOverNotification}
        importBundleFile={importBundleFile}
        hideDragOverNotification={hideDragOverNotification}
        userIsAuthenticated={true}
        sharingVisibility={sinon.stub()}
      />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {
      'file-input': {files: ['apache2.yaml']}
    };
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.onChange();
    assert.equal(importBundleFile.callCount, 1);
    assert.equal(importBundleFile.args[0][0], 'apache2.yaml');
  });

  it('can disable importing when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        userIsAuthenticated={true}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="model-actions">
        <div className="model-actions__buttons">
          <span className="model-actions__export model-actions__button"
            onClick={instance._handleExport}
            role="button"
            tabIndex="0">
            <SvgIcon name="export_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Export
              </span>
            </span>
          </span>
          <span className="model-actions__import model-actions__button"
            onClick={false}
            role="button"
            tabIndex="0">
            <SvgIcon name="import_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Import
              </span>
            </span>
          </span>
          <span className="model-actions__share model-actions__button"
            onClick={instance.props.sharingVisibility}
            role="button"
            tabIndex="0">
            <SvgIcon name="share_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Share
              </span>
            </span>
          </span>
        </div>
        <input className="model-actions__file"
          type="file"
          onChange={null}
          accept=".zip,.yaml,.yml"
          ref="file-input" />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('disables sharing when not connected', function() {
    const renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        userIsAuthenticated={false}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />, true);
    const output = renderer.getRenderOutput();
    const sharing = output.props.children[0].props.children[2];
    assert.isNull(sharing);
  });

  it('disables sharing when creating a new model', function() {
    const renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {root: 'new'}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        userIsAuthenticated={true}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />, true);
    const output = renderer.getRenderOutput();
    const sharing = output.props.children[0].props.children[2];
    assert.isNull(sharing);
  });

  it('can trigger the sharing UI', function() {
    const sharingVisibility = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        userIsAuthenticated={true}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sharingVisibility} />, true);
    const output = renderer.getRenderOutput();
    const sharingButton = output.props.children[0].props.children[2];
    assert.notEqual(sharingButton, undefined);
    sharingButton.props.onClick();
    assert.equal(sharingVisibility.callCount, 1);
  });

  it('applies the correct class when model is loading', function() {
    const renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        loadingModel={true}
        userIsAuthenticated={false}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />, true);
    const output = renderer.getRenderOutput();
    const className = 'model-actions--loading-model';
    const classFound = output.props.className.indexOf(className) >= 0;
    assert.isTrue(classFound);
  });

  it('applies the correct class when on a user profile', function() {
    const renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {profile: 'foo'}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        loadingModel={false}
        userIsAuthenticated={false}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />, true);
    const output = renderer.getRenderOutput();
    const className = 'model-actions--loading-model';
    const classFound = output.props.className.indexOf(className) >= 0;
    assert.isTrue(classFound);
  });

  it('applies the correct class when on a user account page', function() {
    const renderer = jsTestUtils.shallowRender(
      <ModelActions
        acl={acl}
        appState={{current: {root: 'account'}}}
        changeState={sinon.stub()}
        exportEnvironmentFile={sinon.stub()}
        hideDragOverNotification={sinon.stub()}
        importBundleFile={sinon.stub()}
        loadingModel={false}
        userIsAuthenticated={false}
        renderDragOverNotification={sinon.stub()}
        sharingVisibility={sinon.stub()}
      />, true);
    const output = renderer.getRenderOutput();
    const className = 'model-actions--loading-model';
    const classFound = output.props.className.indexOf(className) >= 0;
    assert.strictEqual(classFound, true);
  });
});
