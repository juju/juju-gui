/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EnvSwitcher = require('../env-switcher/env-switcher');
const HeaderBreadcrumb = require('./header-breadcrumb');

const jsTestUtils = require('../../utils/component-test-utils');

describe('HeaderBreadcrumb', () => {
  let appState, addNotification, changeState, humanizeTimestamp,
      listModelsWithInfo, showProfile, switchModel;
  const acl = {};


  beforeEach(function() {
    appState = {
      current: {},
      generatePath: (stateObj) => {
        return `/u/${stateObj.profile}`;
      }
    };
    addNotification = sinon.stub();
    listModelsWithInfo = sinon.stub();
    showProfile = sinon.stub();
    switchModel = sinon.stub();
    changeState = sinon.stub();
    humanizeTimestamp = sinon.stub();
  });

  // Render the component and return the instance and the output.
  const render = attrs => {
    const renderer = jsTestUtils.shallowRender(
      <HeaderBreadcrumb
        acl={acl}
        addNotification={addNotification}
        appState={appState}
        user={attrs.user}
        changeState={changeState}
        humanizeTimestamp={humanizeTimestamp}
        loadingModel={attrs.loadingModel}
        listModelsWithInfo={listModelsWithInfo}
        modelName={attrs.modelName}
        modelCommitted={attrs.modelCommitted}
        modelOwner={attrs.modelOwner}
        setModelName={attrs.setModelName || sinon.stub()}
        showEnvSwitcher={attrs.showEnvSwitcher}
        showProfile={showProfile}
        switchModel={switchModel} />, true);
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
    const setModelName = sinon.stub();
    const comp = render({
      user: {username: 'who@external', displayName: 'who'},
      modelCommitted: true,
      modelName: 'mymodel',
      modelOwner: '',
      setModelName: setModelName,
      showEnvSwitcher: true
    });
    const expectedOutput = (
      <div className="header-breadcrumb">
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list" data-username="who">
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link"
              onClick={comp.clickUser}
              title="who"
              href="/u/who">
              who
            </a>
          </li>
          <li className="header-breadcrumb__list-item">
            <EnvSwitcher
              acl={acl}
              addNotification={addNotification}
              user={{username: 'who@external', displayName: 'who'}}
              changeState={changeState}
              environmentName={'mymodel'}
              humanizeTimestamp={humanizeTimestamp}
              listModelsWithInfo={listModelsWithInfo}
              modelCommitted={true}
              setModelName={setModelName}
              switchModel={switchModel} />
          </li>
        </ul>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('renders properly with the model owner', () => {
    const setModelName = sinon.stub();
    const comp = render({
      user: {username: 'dalek@external', displayName: 'dalek'},
      modelCommitted: true,
      modelName: 'mymodel',
      modelOwner: 'rose',
      setModelName: setModelName,
      showEnvSwitcher: true
    });
    const expectedOutput = (
      <div className="header-breadcrumb">
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list" data-username="dalek">
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link"
              onClick={comp.clickUser}
              title="rose"
              href="/u/rose">
              rose
            </a>
          </li>
          <li className="header-breadcrumb__list-item">
            <EnvSwitcher
              acl={acl}
              addNotification={addNotification}
              user={{username: 'dalek@external', displayName: 'dalek'}}
              changeState={changeState}
              environmentName={'mymodel'}
              humanizeTimestamp={humanizeTimestamp}
              listModelsWithInfo={listModelsWithInfo}
              modelCommitted={true}
              setModelName={setModelName}
              switchModel={switchModel} />
          </li>
        </ul>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('renders properly with a profile', () => {
    appState.current.profile = 'cyberman';
    const comp = render({
      user: {username: 'dalek@external', displayName: 'dalek'},
      modelName: 'mymodel',
      modelOwner: 'rose',
      showEnvSwitcher: true
    });
    const expectedOutput = (
      <div className="header-breadcrumb">
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list" data-username="dalek">
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link"
              onClick={comp.clickUser}
              title="cyberman"
              href="/u/cyberman">
              cyberman
            </a>
          </li>
          {null}
        </ul>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
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
      user: {username: 'who@external', displayName: 'who'},
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
      user: {username: 'who@external', displayName: 'who'},
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

  it('does not render the model switcher when in the account page', () => {
    appState.current.root = 'account';
    const comp = render({
      user: {username: 'who@external', displayName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true
    });
    const switcher = comp.output.props.children[1].props.children[1];
    assert.strictEqual(switcher, null);
  });

  it('does not make the username linkable if we hide model switcher', () => {
    const comp = render({
      user: {username: 'who@external', displayName: 'who'},
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
      user: {username: 'who@external', displayName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true
    });
    checkProfileCalled(comp.clickUser, 'who');
  });

  it('calls the profile view when the model owner link is clicked', () => {
    const comp = render({
      user: {username: 'who@external', displayName: 'who'},
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
      user: {username: 'who@external', displayName: 'who'},
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
