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
  let appState, changeState, humanizeTimestamp,
      listModelsWithInfo, showProfile, switchModel;
  const acl = sinon.stub();

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('header-breadcrumb', () => { done(); });
  });

  beforeEach(function() {
    appState = {
      current: {}
    };
    listModelsWithInfo = sinon.stub();
    showProfile = sinon.stub();
    switchModel = sinon.stub();
    changeState = sinon.stub();
    humanizeTimestamp = sinon.stub();
  });

  // Render the component and return the instance and the output.
  const render = attrs => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderBreadcrumb
        acl={acl}
        appState={appState}
        authDetails={attrs.authDetails}
        changeState={changeState}
        humanizeTimestamp={humanizeTimestamp}
        loadingModel={attrs.loadingModel}
        listModelsWithInfo={listModelsWithInfo}
        modelName={attrs.modelName}
        modelOwner={attrs.modelOwner}
        showEnvSwitcher={attrs.showEnvSwitcher}
        showProfile={showProfile}
        switchModel={switchModel}
      />, true);
    const output = renderer.getRenderOutput();
    const userSection = output.props.children[1].props.children[0];
    let clickUser = null;
    if (userSection) {
      clickUser = userSection.props.children.props.onClick;
    }
    return {
      instance: renderer.getMountedInstance(),
      output: output,
      clickUser: clickUser
    };
  };

  it('renders properly with the current user', () => {
    const comp = render({
      authDetails: {user: 'who@external', rootUserName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true,
    });
    const expectedOutput = (
      <div className="header-breadcrumb">
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list" data-username="who">
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link" onClick={comp.clickUser}>
              who
            </a>
          </li>
          <li className="header-breadcrumb__list-item">
            <window.juju.components.EnvSwitcher
              acl={acl}
              authDetails={{user: 'who@external', rootUserName: 'who'}}
              changeState={changeState}
              environmentName={'mymodel'}
              humanizeTimestamp={humanizeTimestamp}
              listModelsWithInfo={listModelsWithInfo}
              switchModel={switchModel} />
          </li>
        </ul>
      </div>
    );
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('renders properly with the model owner', () => {
    const comp = render({
      authDetails: {user: 'dalek@external', rootUserName: 'dalek'},
      modelName: 'mymodel',
      modelOwner: 'rose',
      showEnvSwitcher: true
    });
    const expectedOutput = (
      <div className="header-breadcrumb">
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list" data-username="dalek">
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link" onClick={comp.clickUser}>
              rose
            </a>
          </li>
          <li className="header-breadcrumb__list-item">
            <window.juju.components.EnvSwitcher
              acl={acl}
              authDetails={{user: 'dalek@external', rootUserName: 'dalek'}}
              changeState={changeState}
              environmentName={'mymodel'}
              humanizeTimestamp={humanizeTimestamp}
              listModelsWithInfo={listModelsWithInfo}
              switchModel={switchModel} />
          </li>
        </ul>
      </div>
    );
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('renders properly with a profile', () => {
    appState.current.profile = 'cyberman';
    const comp = render({
      authDetails: {user: 'dalek@external', rootUserName: 'dalek'},
      modelName: 'mymodel',
      modelOwner: 'rose',
      showEnvSwitcher: true
    });
    const expectedOutput = (
      <div className="header-breadcrumb">
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list" data-username="dalek">
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link" onClick={comp.clickUser}>
              cyberman
            </a>
          </li>
          {null}
        </ul>
      </div>
    );
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('removes user name from breadcrumbs if none is provided', () => {
    const comp = render({
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true
    });
    assert.strictEqual(comp.output.props.children[1].props.children[0],
      null);
  });

  it('does not render the model switcher if told not to', () => {
    const comp = render({
      authDetails: {user: 'who@external', rootUserName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: false
    });
    assert.strictEqual(comp.output.props.children[1].props.children[1],
      null);
  });

  it('does not render the model switcher when profile is visible', () => {
    appState.current.profile = 'who';
    const comp = render({
      authDetails: {user: 'who@external', rootUserName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      // Even though showEnvSwitcher is true, because the profile is visibile
      // it shouldn't render the model switcher.
      showEnvSwitcher: true
    });
    // There will be no third child if the envSwitcher is rendered
    assert.strictEqual(comp.output.props.children[1].props.children[1],
      null);
  });

  it('does not make the username linkable if we hide model switcher', () => {
    const comp = render({
      authDetails: {user: 'who@external', rootUserName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: false
    });
    const userSection = comp.output.props.children[1].props.children[0];
    assert.equal(
      userSection.props.children.props.className,
      'header-breadcrumb--link profile-disabled');
    // Manually call the onClick handler and make sure it doesn't navigate
    // to show the profile.
    comp.clickUser({preventDefault: sinon.stub()});
    assert.equal(showProfile.callCount, 0, 'showProfile called');
  });

  it('calls the profile view when the current user link is clicked', () => {
    const comp = render({
      authDetails: {user: 'who@external', rootUserName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true
    });
    checkProfileCalled(comp.clickUser, 'who');
  });

  it('calls the profile view when the model owner link is clicked', () => {
    const comp = render({
      authDetails: {user: 'who@external', rootUserName: 'who'},
      modelName: 'mymodel',
      modelOwner: 'dalek',
      showEnvSwitcher: true
    });
    checkProfileCalled(comp.clickUser, 'dalek');
  });

  // Check that the link to go to the profile view has been called.
  const checkProfileCalled = (clickUser, username) => {
    const preventDefault = sinon.stub();
    clickUser({preventDefault: preventDefault});
    assert.equal(preventDefault.callCount, 1, 'preventDefault not called');
    let args = preventDefault.args[0];
    assert.equal(args.length, 0, 'preventDefault args');
    assert.equal(showProfile.callCount, 1, 'showProfile not called');
    args = showProfile.args[0];
    assert.equal(args.length, 1, 'showProfile args');
    assert.strictEqual(args[0], username, 'showProfile user');
  };

  it('applies the correct class when loading a model', () => {
    const comp = render({
      authDetails: {user: 'who@external', rootUserName: 'who'},
      modelName: 'mymodel',
      modelOwner: 'dalek',
      showEnvSwitcher: true,
      loadingModel: true
    });
    const className = 'header-breadcrumb--loading-model';
    const classPresent = comp.output.props.className.indexOf(className) >= 0;
    assert.isTrue(classPresent);
  });
});
