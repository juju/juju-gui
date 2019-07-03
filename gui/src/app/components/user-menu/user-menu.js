/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const {ButtonDropdown} = require('@canonical/juju-react-components');

require('./_user-menu.scss');

/**
  Provides a user menu to the header - shows Profile, help and Logout links.
  If user is not logged in the user icon is replaced with a login button.
*/
const UserMenu = props => {
  const controllerAPI = props.controllerAPI;
  const showLogin = controllerAPI && !controllerAPI.userIsAuthenticated;
  const analytics = props.analytics.addCategory('User Menu');
  return (
    <div className="v1">
      <ButtonDropdown
        classes={['user-menu']}
        disableDropdown={showLogin}
        icon={showLogin ? props.USSOLoginLink : 'user_16'}
        listItems={[{
          action: function(navigateUserProfile, analytics) {
            navigateUserProfile();
            analytics.addCategory('Profile').sendEvent(analytics.CLICK);
          }.bind(this, props.navigateUserProfile, analytics),
          label: 'Profile'
        }, {
          action: function(showHelp, analytics) {
            showHelp();
            analytics.addCategory('Help').sendEvent(analytics.CLICK);
          }.bind(this, props.showHelp, analytics),
          label: 'GUI help'
        }, {
          element: props.LogoutLink
        }]}
        tooltip={showLogin ? '' : 'User'} />
    </div>);
};

UserMenu.propTypes = {
  LogoutLink: PropTypes.object,
  USSOLoginLink: PropTypes.object,
  analytics: PropTypes.object.isRequired,
  controllerAPI: PropTypes.object,
  navigateUserProfile: PropTypes.func.isRequired,
  showHelp: PropTypes.func.isRequired
};

module.exports = UserMenu;
