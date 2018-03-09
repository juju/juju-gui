/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonDropdown = require('../button-dropdown/button-dropdown');
/**
  Provides a user menu to the header - shows Profile, Account and Logout links.
  If user is not logged in the user icon is replaced with a login button.
*/
const UserMenu = props => {
  const controllerAPI = props.controllerAPI;
  const showLogin = controllerAPI && !controllerAPI.userIsAuthenticated;
  return (
    <ButtonDropdown
      classes={['user-menu']}
      disableDropdown={showLogin}
      icon={showLogin ? props.USSOLoginLink : 'user_16'}
      listItems={[{
        action: props.navigateUserProfile,
        label: 'Profile'
      }, {
        action: props.showHelp,
        label: 'GUI help'
      }, {
        element: props.LogoutLink
      }]}
      tooltip={showLogin ? '' : 'user'} />);
};

UserMenu.propTypes = {
  LogoutLink: PropTypes.object,
  USSOLoginLink: PropTypes.object,
  controllerAPI: PropTypes.object,
  navigateUserProfile: PropTypes.func.isRequired,
  showHelp: PropTypes.func.isRequired
};

module.exports = UserMenu;
