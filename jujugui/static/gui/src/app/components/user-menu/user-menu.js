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

/**
  Provides a user menu to the header - shows Profile, Account and Logout links.
  If user is not logged in the user icon is replaced with a login button.
*/
const UserMenu = enhanceWithClickOutside(React.createClass({

  propTypes: {
    LogoutLink: React.PropTypes.object,
    USSOLoginLink: React.PropTypes.object,
    controllerAPI: React.PropTypes.object,
    navigateUserAccount: React.PropTypes.func.isRequired,
    navigateUserProfile: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    return {
      showUserMenu: false
    };
  },

  /**
    When the menu is shown, clicking anywhere but the menu will close
    the menu.

    @method handleClickOutside
  */
  handleClickOutside: function() {
    this.setState({ showUserMenu: false });
  },

  /**
    Clicking the help menu will toggle whether it's visibility.

    @method toggleUserMenu
  */
  toggleUserMenu: function() {
    this.setState({ showUserMenu: !this.state.showUserMenu });
  },

  _handleProfileClick: function() {
    this.props.navigateUserProfile();
    this.toggleUserMenu();
  },

  _handleAccountClick: function() {
    this.props.navigateUserAccount();
    this.toggleUserMenu();
  },

  /**
    Generate menu based on whether the button has been clicked.

    @method generateUserMenu
  */
  _generateUserMenu: function() {
    if (!this.state.showUserMenu) {
      return '';
    }
    const logoutLink = this.props.LogoutLink;
    return (
      <juju.components.Panel instanceName="header-menu__menu" visible={true}>
        <ul className="header-menu__menu-list" role="menubar">
          <li className="header-menu__menu-list-item
            header-menu__menu-list-item-with-link"
            role="menuitem" tabIndex="0">
            <a className="header-menu__menu-list-item-link"
              role="button" onClick={this._handleProfileClick}>Profile</a>
          </li>
          <li className="header-menu__menu-list-item
            header-menu__menu-list-item-with-link"
            role="menuitem" tabIndex="0">
            {logoutLink}
          </li>
        </ul>
      </juju.components.Panel>
    );
  },

  /**
    Get class names based on whether the menu is shown.

    @method _getClassNames
  */
  _getClassNames: function(isLogin) {
    return classNames(
      'header-menu__button',
      {
        'header-menu__button-with-text': isLogin,
        'header-menu__show-menu': this.state.showUserMenu
      });
  },

  render: function() {
    const controllerAPI = this.props.controllerAPI;
    const loginEle = this.props.USSOLoginLink;
    const showLogin = controllerAPI && !controllerAPI.userIsAuthenticated;
    let buttonContent;
    let menu;

    if (showLogin) {
      buttonContent = loginEle;
    } else {
      buttonContent = (<juju.components.SvgIcon name="user_16"
        className="header-menu__icon"
        size="16" />);
      menu = this._generateUserMenu();
    }
    return (
      <div className="header-menu">
        <span className={this._getClassNames(showLogin)}
          onClick={this.toggleUserMenu}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="userMenu"
          aria-controls="userMenu"
          aria-expanded="false">
          {buttonContent}
        </span>
        {menu}
      </div>
    );
  }
}));

YUI.add('user-menu', function() {
  juju.components.UserMenu = UserMenu;
}, '0.1.0', { requires: [
  'panel-component',
  'svg-icon'
]});
