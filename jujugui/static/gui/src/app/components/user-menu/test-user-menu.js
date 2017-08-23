/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

describe('UserMenu', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-menu', function() { done(); });
  });

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
      <juju.components.UserMenu
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
      <juju.components.ButtonDropdown
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
      <juju.components.ButtonDropdown
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
