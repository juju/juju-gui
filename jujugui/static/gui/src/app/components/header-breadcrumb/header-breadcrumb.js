/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('header-breadcrumb', function() {

  juju.components.HeaderBreadcrumb = React.createClass({
    propTypes: {
      appState: React.PropTypes.object.isRequired,
      authDetails: React.PropTypes.object,
      envList: React.PropTypes.array,
      envName: React.PropTypes.string.isRequired,
      listModelsWithInfo: React.PropTypes.func,
      showEnvSwitcher: React.PropTypes.bool.isRequired,
      showProfile: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      userName: React.PropTypes.string
    },

    /**
      Renders the markup for the Env Switcher if the showEnvSwitcher prop is
      truthy.

      @method _renderEnvSwitcher
    */
    _renderEnvSwitcher: function() {
      if (this.props.showEnvSwitcher && !this.props.appState.appState.profile) {
        return (
          <li className="header-breadcrumb__list-item">
            <window.juju.components.EnvSwitcher
              environmentName={this.props.envName}
              envList={this.props.envList}
              listModelsWithInfo={this.props.listModelsWithInfo}
              showProfile={this.props.showProfile}
              switchModel={this.props.switchModel}
              authDetails={this.props.authDetails} />
          </li>);
      }
      return;
    },

    /**
      Handles clicks on the profile link. Does not navigate to the profile
      if we aren't showing the model switcher.
      @method _handleProfileClick
    */
    _handleProfileClick: function(e) {
      e.preventDefault();
      if (!this.props.showEnvSwitcher) {
        return;
      }
      this.props.showProfile();
    },

    /**
      Generate the user link. If we aren't showing the model switcher then the
      link to the profile does not turn the users cursor to a pointer because
      we disable the profile functionality in that case.
      @method _generateUserLink
    */
    _generateUserLink: function() {
      var auth = this.props.authDetails;
      if (auth && (auth.user || auth.loading)) {
        var username = auth.loading ? '...' : auth.usernameDisplay;
        var linkClasses = classNames(
          'header-breadcrumb--link',
          {
            'profile-disabled': !this.props.showEnvSwitcher
          }
        );
        return (
          <li className="header-breadcrumb__list-item">
            <a className={linkClasses}
               onClick={this._handleProfileClick}>
              {username}
            </a>
          </li>);
      }
      return;
    },

    render: function() {
      var userItem = this._generateUserLink();
      return (
        <ul className="header-breadcrumb">
          {userItem}
          {this._renderEnvSwitcher()}
        </ul>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'env-switcher'
  ]
});
