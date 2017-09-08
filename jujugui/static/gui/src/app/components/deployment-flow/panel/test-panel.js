/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentPanel = require('./panel');
const GenericButton = require('../../generic-button/generic-button');
const Panel = require('../../panel/panel');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentPanel', function() {

  it('can render', function() {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentPanel
        changeState={sinon.stub()}
        title="Lamington">
        <span>content</span>
      </DeploymentPanel>, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <Panel
        instanceName="deployment-flow-panel"
        visible={true}>
        <div className="deployment-panel">
          <div className="deployment-panel__header">
            <div className="deployment-panel__close">
              <GenericButton
                action={instance._handleClose}
                type="neutral">
                Back to canvas
              </GenericButton>
            </div>
            <div className="deployment-panel__header-name">
              Lamington
            </div>
          </div>
          <div className="deployment-panel__content">
            <span>content</span>
          </div>
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('can render for direct deploy', function() {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentPanel
        changeState={sinon.stub()}
        isDirectDeploy={true}
        loggedIn={false}
        title="Lamington">
        <span>content</span>
      </DeploymentPanel>, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <Panel
        instanceName="deployment-flow-panel"
        visible={true}>
        <div className="deployment-panel">
          <div className={
            'deployment-panel__header deployment-panel__header--dark'}>
            <div className="deployment-panel__header-logo">
              <SvgIcon
                className="svg-icon"
                height="35"
                name="juju-logo-light"
                width="90" />
            </div>
          </div>
          <div className="deployment-panel__content">
            <span>content</span>
          </div>
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('can render for logged in direct deploy', function() {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentPanel
        changeState={sinon.stub()}
        isDirectDeploy={true}
        loggedIn={true}
        title="Lamington">
        <span>content</span>
      </DeploymentPanel>, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <Panel
        instanceName="deployment-flow-panel"
        visible={true}>
        <div className="deployment-panel">
          <div className="deployment-panel__header">
            <div className="deployment-panel__header-logo">
              <SvgIcon
                className="svg-icon"
                height="35"
                name="juju-logo"
                width="90" />
            </div>
          </div>
          <div className="deployment-panel__content">
            <span>content</span>
          </div>
        </div>
      </Panel>);
    expect(output).toEqualJSX(expected);
  });

  it('can close', function() {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <DeploymentPanel
        changeState={changeState}
        sendAnalytics={sinon.stub()}
        title="Lamington">
        <span>content</span>
      </DeploymentPanel>);
    output.props.children.props.children[0].props.children[0].props.children
      .props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {deploy: null},
      profile: null,
      special: {dd:null}
    });
  });
});
