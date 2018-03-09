/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const UserMenu = require('./user-menu');
const ButtonDropdown = require('../button-dropdown/button-dropdown');

const jsTestUtils = require('../../utils/component-test-utils');

describe('UserMenu', () => {

  const loginLink = <div className="login"></div>;
  const logoutLink = <div className="logout"></div>;

  function renderComponent(options = {}) {
    const userIsAuthenticated = options.userIsAuthenticated !== undefined ?
      options.userIsAuthenticated : true;
    const USSOLoginLink = options.USSOLoginLink !== undefined ?
      options.USSOLoginLink : loginLink;
    const controllerAPI = {
      userIsAuthenticated: userIsAuthenticated
    };
    const renderer = jsTestUtils.shallowRender(
      <UserMenu
        controllerAPI={controllerAPI}
        LogoutLink={options.LogoutLink || logoutLink}
        navigateUserProfile={options.navigateUserProfile || sinon.stub()}
        showHelp={sinon.stub()}
        USSOLoginLink={USSOLoginLink} />, true);
    return {
      renderer: renderer,
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance()
    };
  }

  it('can render without the account link', () => {
    const c = renderComponent({
      userIsAuthenticated: false
    });
    const expected = (
      <ButtonDropdown
        classes={['user-menu']}
        disableDropdown={true}
        icon={loginLink}
        listItems={[{
          action: sinon.stub(),
          label: 'Profile'
        }, {
          action: sinon.stub(),
          label: 'GUI help'
        }, {
          element: logoutLink
        }]}
        tooltip={''} />
    );
    expect(c.output).toEqualJSX(expected);
  });

  it('renders the login link if supplied', () => {
    const c = renderComponent({
      userIsAuthenticated: false
    });
    const expected = (
      <ButtonDropdown
        classes={['user-menu']}
        disableDropdown={true}
        icon={loginLink}
        listItems={[{
          action: sinon.stub(),
          label: 'Profile'
        }, {
          action: sinon.stub(),
          label: 'GUI help'
        }, {
          element: logoutLink
        }]}
        tooltip={''} />
    );
    expect(c.output).toEqualJSX(expected);
  });

  it('renders a user icon when no login link is supplied', () => {
    const c = renderComponent({
      USSOLoginLink: null
    });
    const expected = (
      <ButtonDropdown
        classes={['user-menu']}
        disableDropdown={false}
        icon="user_16"
        listItems={[{
          action: sinon.stub(),
          label: 'Profile'
        }, {
          action: sinon.stub(),
          label: 'GUI help'
        }, {
          element: logoutLink
        }]}
        tooltip="user" />
    );
    expect(c.output).toEqualJSX(expected);
  });

  it('navigates to user profile when clicked', () => {
    const navigateUserProfile = sinon.stub();
    const c = renderComponent({ navigateUserProfile });
    c.output.props.listItems[0].action();
    assert.equal(navigateUserProfile.callCount, 1);
  });

});
