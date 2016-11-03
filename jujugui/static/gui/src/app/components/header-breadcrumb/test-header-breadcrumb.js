/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('HeaderBreadcrumb', () => {
  let appState;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('header-breadcrumb', () => { done(); });
  });

  beforeEach(function() {
    appState = {
      appState: {}
    };
  });

  it('Renders properly', () => {
    var switchModel = sinon.stub();
    var envName = 'bar';
    var envList = ['envList'];
    var showProfile = sinon.stub();
    var listModelsWithInfo = sinon.stub();
    var authDetails = {
      user: 'foo',
      usernameDisplay: 'Foo'
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.HeaderBreadcrumb
        envName={envName}
        envList={envList}
        appState={appState}
        authDetails={authDetails}
        listModelsWithInfo={listModelsWithInfo}
        showProfile={showProfile}
        showEnvSwitcher={true}
        switchModel={switchModel} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();

    var expected = (
      <ul className="header-breadcrumb">
        <li className="header-breadcrumb__list-item">
          <a className="header-breadcrumb--link"
             onClick={instance._handleProfileClick}>
            Foo
          </a>
        </li>
        <li className="header-breadcrumb__list-item">
          <window.juju.components.EnvSwitcher
            environmentName={envName}
            envList={envList}
            authDetails={authDetails}
            listModelsWithInfo={listModelsWithInfo}
            showProfile={showProfile}
            switchModel={switchModel} />
        </li>
      </ul>
    );
    assert.deepEqual(output, expected);
  });

  it('removes username from breadcrumbs if none is provided', () => {
    var app = {app:'app'};
    var envName = 'bar';
    var envList = ['envList'];
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderBreadcrumb
        app={app}
        envName={envName}
        envList={envList}
        appState={appState}
        listModelsWithInfo={sinon.stub()}
        showEnvSwitcher={true}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />);
    assert.equal(output.props.children[0], undefined);
  });

  it('does not render the env switcher if told not to', () => {
    var app = {app:'app'};
    var envName = 'bar';
    var envList = ['envList'];
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderBreadcrumb
        app={app}
        envName={envName}
        envList={envList}
        appState={appState}
        listModelsWithInfo={sinon.stub()}
        showEnvSwitcher={false}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />);
    // There will be no third child if the envSwitcher is rendered
    assert.equal(output.props.children[1], undefined);
  });

  it('doesn\'t render the env switcher when profile is visible', () => {
    var app = {app:'app'};
    var envName = 'bar';
    var envList = ['envList'];
    appState.appState.profile = true;
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderBreadcrumb
        app={app}
        envName={envName}
        envList={envList}
        appState={appState}
        listModelsWithInfo={sinon.stub()}
        // Even though showEnvSwitcher is true, because the profile is visibile
        // it shouldn't render the env switcher.
        showEnvSwitcher={true}
        showProfile={sinon.stub()}
        switchModel={sinon.stub()} />);
    // There will be no third child if the envSwitcher is rendered
    assert.equal(output.props.children[1], undefined);
  });

  it('doesn\'t make the username linkable if we hide model switcher', () => {
    var app = {app:'app'};
    var envName = 'bar';
    var envList = ['envList'];
    var showProfile = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderBreadcrumb
        app={app}
        authDetails={{
          user: 'foo',
          usernameDisplay: 'foo'
        }}
        envName={envName}
        envList={envList}
        appState={appState}
        listModelsWithInfo={sinon.stub()}
        showEnvSwitcher={false}
        showProfile={showProfile}
        switchModel={sinon.stub()} />);
    assert.equal(
      output.props.children[0].props.children.props.className,
      'header-breadcrumb--link profile-disabled');
    // Manually call the onClick handler and make sure it doesn't navigate
    // to show the profile.
    output.props.children[0].props.children.props.onClick({
      preventDefault: sinon.stub()
    });
    assert.equal(showProfile.callCount, 0, 'profile should not have navigated');
  });

  it('can display the profile when the profile link is clicked', () => {
    var app = {app:'app'};
    var envName = 'bar';
    var envList = ['envList'];
    var showProfile = sinon.stub();
    var authDetails = {
      user: 'foo',
      usernameDisplay: 'Foo'
    };
    var component = jsTestUtils.shallowRender(
      <juju.components.HeaderBreadcrumb
        app={app}
        envName={envName}
        envList={envList}
        appState={appState}
        authDetails={authDetails}
        listModelsWithInfo={sinon.stub()}
        showEnvSwitcher={true}
        showProfile={showProfile}
        switchModel={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    instance._handleProfileClick({
      preventDefault: sinon.stub()
    });
    assert.equal(showProfile.called, true,
                 'showProfile was not called');
  });

});
