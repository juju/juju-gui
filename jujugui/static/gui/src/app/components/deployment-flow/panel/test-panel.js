/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentPanel = require('./panel');
const GenericButton = require('../../generic-button/generic-button');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('DeploymentPanel', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentPanel
      changeState={options.changeState || sinon.stub()}
      isDirectDeploy={options.isDirectDeploy}
      loggedIn={options.loggedIn}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      title={options.title || 'Lamington'}>
      {options.children || (<span>content</span>)}
    </DeploymentPanel>
  );

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-panel">
        <div className="deployment-panel__header">
          <div className="deployment-panel__close">
            <GenericButton
              action={wrapper.find('GenericButton').prop('action')}
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
      </div>);
    assert.compareJSX(wrapper.find('.deployment-panel'), expected);
  });

  it('can render for direct deploy', function() {
    const wrapper = renderComponent({
      isDirectDeploy: true,
      loggedIn: false
    });
    const expected = (
      <div className="deployment-panel__header deployment-panel__header--dark">
        <div className="deployment-panel__header-logo">
          <SvgIcon
            className="svg-icon"
            height="35"
            name="juju-logo-light"
            width="90" />
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.deployment-panel__header'), expected);
  });

  it('can render for logged in direct deploy', function() {
    const wrapper = renderComponent({
      isDirectDeploy: true,
      loggedIn: true
    });
    assert.equal(
      wrapper.find('.deployment-panel__header').prop('className').includes(
        'deployment-panel__header--dark'),
      false);
    assert.equal(wrapper.find('SvgIcon').prop('name'), 'juju-logo');
  });

  it('can close', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('GenericButton').props().action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {deploy: null},
      profile: null,
      special: {dd: null}
    });
  });
});
