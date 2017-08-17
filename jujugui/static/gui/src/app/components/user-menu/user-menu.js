/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  Provides a user menu to the header - shows Profile, Account and Logout links.
  If user is not logged in the user icon is replaced with a login button.
*/
class UserMenu extends React.Component {

  _toggleDropdown() {
    this.refs.buttonDropdown._toggleDropdown();
  }

  _handleProfileClick() {
    this.props.navigateUserProfile();
    this._toggleDropdown();
  }

  _handleAccountClick() {
    this.props.navigateUserAccount();
    this._toggleDropdown();
  }

  render() {
    const controllerAPI = this.props.controllerAPI;
    const showLogin = controllerAPI && !controllerAPI.userIsAuthenticated;
    return (
      <juju.components.ButtonDropdown
        classes={['user-menu']}
        ref="buttonDropdown"
        icon={showLogin ? this.props.USSOLoginLink : 'user_16'}
        disableDropdown={showLogin}
        listItems={[
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="profile">
            <a className="dropdown-menu__list-item-link"
              role="button"
              onClick={this._handleProfileClick.bind(this)}>Profile</a>
          </li>,
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="account">
            <a className="dropdown-menu__list-item-link"
              role="button"
              onClick={this._handleAccountClick.bind(this)}>Account</a>
          </li>,
          <li className="dropdown-menu__list-item"
            role="menuitem" tabIndex="0" key="logout">
            {this.props.LogoutLink}
          </li>
        ]}
        tooltip="user"
      />);
  }
};

UserMenu.propTypes = {
  LogoutLink: PropTypes.object,
  USSOLoginLink: PropTypes.object,
  controllerAPI: PropTypes.object,
  navigateUserAccount: PropTypes.func.isRequired,
  navigateUserProfile: PropTypes.func.isRequired
};

YUI.add('user-menu', function() {
  juju.components.UserMenu = UserMenu;
}, '0.1.0', { requires: [
  'dropdown-menu'
]});
