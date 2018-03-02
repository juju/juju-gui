/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonDropdown = require('../button-dropdown/button-dropdown');
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

  render() {
    const controllerAPI = this.props.controllerAPI;
    const showLogin = controllerAPI && !controllerAPI.userIsAuthenticated;
    return (
      <ButtonDropdown
        classes={['user-menu']}
        ref="buttonDropdown"
        icon={showLogin ? this.props.USSOLoginLink : 'user_16'}
        disableDropdown={showLogin}
        listItems={[{
          action: this.props.navigateUserProfile,
          label: 'Profile'
        }, {
          action: this.props.showHelp,
          label: 'GUI help'
        }, {
          element: this.props.LogoutLink
        }]}
        tooltip={showLogin ? '' : 'user'} />);
  }
};

UserMenu.propTypes = {
  LogoutLink: PropTypes.object,
  USSOLoginLink: PropTypes.object,
  controllerAPI: PropTypes.object,
  navigateUserProfile: PropTypes.func.isRequired,
  showHelp: PropTypes.func.isRequired
};

module.exports = UserMenu;
