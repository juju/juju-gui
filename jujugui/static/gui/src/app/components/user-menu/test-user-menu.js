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
        LogoutLink={options.LogoutLink || logoutLink}
        USSOLoginLink={USSOLoginLink}
        controllerAPI={controllerAPI}
        navigateUserAccount={sinon.stub()}
        navigateUserProfile={sinon.stub()}
      />, true);
    return {
      renderer: renderer,
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance()
    };
  }

  it('renders the login link if supplied', () => {
    const c = renderComponent({
      userIsAuthenticated: false
    });
    const expected = (
      <ButtonDropdown
        classes={['user-menu']}
        ref="buttonDropdown"
        icon={loginLink}
        disableDropdown={true}
        listItems={[
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="profile">
            <a className="dropdown-menu__list-item-link"
              role="button"
              onClick={c.instance._handleProfileClick}>Profile</a>
          </li>,
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="account">
            <a className="dropdown-menu__list-item-link"
              role="button"
              onClick={c.instance._handleAccountClick}>Account</a>
          </li>,
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="logout">
            {logoutLink}
          </li>
        ]}
        tooltip={''}
      />
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
        ref="buttonDropdown"
        icon="user_16"
        disableDropdown={false}
        listItems={[
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="profile">
            <a className="dropdown-menu__list-item-link"
              role="button"
              onClick={c.instance._handleProfileClick}>Profile</a>
          </li>,
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="account">
            <a className="dropdown-menu__list-item-link"
              role="button"
              onClick={c.instance._handleAccountClick}>Account</a>
          </li>,
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="logout">
            {logoutLink}
          </li>
        ]}
        tooltip="user"
      />
    );
    expect(c.output).toEqualJSX(expected);
  });

  it('navigates to user profile when clicked', () => {
    const c = renderComponent();
    c.instance.refs = {
      buttonDropdown: {
        _toggleDropdown: sinon.stub()
      }
    };
    c.output.props.listItems[0].props.children.props.onClick.call(c.instance);
    assert.equal(c.instance.props.navigateUserProfile.callCount, 1);
    assert.equal(c.instance.refs.buttonDropdown._toggleDropdown.callCount, 1);
  });

  it('navigates to the user account when clicked', () => {
    const c = renderComponent();
    c.instance.refs = {
      buttonDropdown: {
        _toggleDropdown: sinon.stub()
      }
    };
    c.output.props.listItems[1].props.children.props.onClick.call(c.instance);
    assert.equal(c.instance.props.navigateUserAccount.callCount, 1);
    assert.equal(c.instance.refs.buttonDropdown._toggleDropdown.callCount, 1);
  });

});
