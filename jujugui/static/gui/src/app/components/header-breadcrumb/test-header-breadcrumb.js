/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EnvSwitcher = require('../env-switcher/env-switcher');
const HeaderBreadcrumb = require('./header-breadcrumb');

describe('HeaderBreadcrumb', () => {
  let appState;
  const acl = {};

  const renderComponent = (options = {}) => enzyme.shallow(
    <HeaderBreadcrumb
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      appState={options.appState || appState}
      changeState={options.changeState || sinon.stub()}
      humanizeTimestamp={options.humanizeTimestamp || sinon.stub()}
      listModelsWithInfo={options.listModelsWithInfo || sinon.stub()}
      loadingModel={options.loadingModel}
      modelCommitted={options.modelCommitted}
      modelName={options.modelName}
      modelOwner={options.modelOwner}
      setModelName={options.setModelName || sinon.stub()}
      showEnvSwitcher={options.showEnvSwitcher}
      showProfile={options.showProfile || sinon.stub()}
      switchModel={options.switchModel || sinon.stub()}
      user={options.user} />
  );

  beforeEach(function() {
    appState = {
      current: {},
      generatePath: stateObj => {
        return `/u/${stateObj.profile}`;
      }
    };
  });

  it('renders properly with the current user', () => {
    const wrapper = renderComponent({
      user: {username: 'who@external', displayName: 'who'},
      modelCommitted: true,
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true
    });
    const expected = (
      <div className="header-breadcrumb">
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list" data-username="who">
          <li className="header-breadcrumb__list-item">
            <a className="header-breadcrumb--link"
              href="/u/who"
              onClick={wrapper.find('.header-breadcrumb--link').prop('onClick')}
              title="who">
              who
            </a>
          </li>
          <li className="header-breadcrumb__list-item">
            <EnvSwitcher
              acl={acl}
              addNotification={sinon.stub()}
              changeState={sinon.stub()}
              environmentName={'mymodel'}
              humanizeTimestamp={sinon.stub()}
              listModelsWithInfo={sinon.stub()}
              modelCommitted={true}
              setModelName={sinon.stub()}
              switchModel={sinon.stub()}
              user={{username: 'who@external', displayName: 'who'}} />
          </li>
        </ul>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders properly with the model owner', () => {
    const wrapper = renderComponent({
      user: {username: 'dalek@external', displayName: 'dalek'},
      modelCommitted: true,
      modelName: 'mymodel',
      modelOwner: 'rose',
      showEnvSwitcher: true
    });
    const expected = (
      <a className="header-breadcrumb--link"
        href="/u/rose"
        onClick={wrapper.find('.header-breadcrumb--link').prop('onClick')}
        title="rose">
        rose
      </a>
    );
    assert.compareJSX(wrapper.find('.header-breadcrumb--link'), expected);
  });

  it('renders properly with a profile', () => {
    const user = {username: 'dalek@external', displayName: 'dalek'};
    appState.current.profile = 'cyberman';
    const wrapper = renderComponent({
      user: user,
      modelCommitted: true,
      modelName: 'mymodel',
      modelOwner: 'rose',
      showEnvSwitcher: true
    });
    const expected = (
      <a className="header-breadcrumb--link"
        href="/u/cyberman"
        onClick={wrapper.find('.header-breadcrumb--link').prop('onClick')}
        title="cyberman">
        cyberman
      </a>
    );
    assert.compareJSX(wrapper.find('.header-breadcrumb--link'), expected);
  });

  it('removes user name from breadcrumbs if none is provided', () => {
    const wrapper = renderComponent({
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true
    });
    assert.equal(wrapper.find('.header-breadcrumb--link').length, 0);
  });

  it('does not render the model switcher if told not to', () => {
    const wrapper = renderComponent({
      user: {username: 'who@external', displayName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: false
    });
    assert.equal(wrapper.find('EnvSwitcher').length, 0);
  });

  it('does not make the username linkable if we hide model switcher', () => {
    const showProfile = sinon.stub();
    const wrapper = renderComponent({
      user: {username: 'who@external', displayName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: false,
      showProfile
    });
    assert.equal(
      wrapper.find('.header-breadcrumb--link').prop('className').includes(
        'profile-disabled'),
      true);
    // Manually call the onClick handler and make sure it doesn't navigate
    // to show the profile.
    wrapper.find('.header-breadcrumb--link').props().onClick(
      {preventDefault: sinon.stub()});
    assert.equal(showProfile.callCount, 0, 'showProfile called');
  });

  it('calls the profile view when the current user link is clicked', () => {
    const showProfile = sinon.stub();
    const wrapper = renderComponent({
      user: {username: 'who@external', displayName: 'who'},
      modelName: 'mymodel',
      modelOwner: '',
      showEnvSwitcher: true,
      showProfile
    });
    checkProfileCalled(
      wrapper.find('.header-breadcrumb--link').prop('onClick'), showProfile, 'who');
  });

  it('calls the profile view when the model owner link is clicked', () => {
    const showProfile = sinon.stub();
    const wrapper = renderComponent({
      user: {username: 'who@external', displayName: 'who'},
      modelName: 'mymodel',
      modelOwner: 'dalek',
      showEnvSwitcher: true,
      showProfile
    });
    checkProfileCalled(
      wrapper.find('.header-breadcrumb--link').prop('onClick'), showProfile, 'dalek');
  });

  // Check that the link to go to the profile view has been called.
  const checkProfileCalled = (clickUser, showProfile, username) => {
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
    const wrapper = renderComponent({
      user: {username: 'who@external', displayName: 'who'},
      modelName: 'mymodel',
      modelOwner: 'dalek',
      showEnvSwitcher: true,
      loadingModel: true
    });
    const className = 'header-breadcrumb--loading-model';
    assert.equal(
      wrapper.find('.header-breadcrumb').prop('className').includes(className),
      true);
  });
});
