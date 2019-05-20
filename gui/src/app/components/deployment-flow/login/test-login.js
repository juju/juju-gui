/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('../../../../test/fake-analytics');
const DeploymentLogin = require('./login');

describe('DeploymentLogin', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentLogin
      addNotification={options.addNotification || sinon.stub()}
      analytics={Analytics}
      callback={options.callback || sinon.stub()}
      gisf={options.gisf === undefined ? true : options.gisf}
      isDirectDeploy={
        options.isDirectDeploy === undefined ? false : options.isDirectDeploy}
      loginToController={options.loginToController || sinon.stub()}
      showLoginLinks={
        options.showLoginLinks === undefined ? true : options.showLoginLinks} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can render for the direct deploy flow', function() {
    const wrapper = renderComponent({isDirectDeploy: true});
    expect(wrapper).toMatchSnapshot();
  });

  it('does not display the login links when requested', function() {
    const wrapper = renderComponent({
      isDirectDeploy: true,
      showLoginLinks: false
    });
    assert.equal(wrapper.find('USSOLoginLink').length, 0);
  });
});
