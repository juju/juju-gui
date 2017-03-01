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

  // Define the name of the uncommitted model.
  const NO_MODEL = 'untitled-model';

  // This component handles the GUI header, in which the breadcrumb is
  // displayed, including information about the current model and all other
  // available models.
  juju.components.HeaderBreadcrumb = React.createClass({
    propTypes: {
      appState: React.PropTypes.object.isRequired,
      authDetails: React.PropTypes.object,
      listModelsWithInfo: React.PropTypes.func,
      modelName: React.PropTypes.string,
      modelOwner: React.PropTypes.string,
      showEnvSwitcher: React.PropTypes.bool.isRequired,
      showProfile: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired
    },

    /**
      Renders the markup for the Env Switcher if the showEnvSwitcher prop is
      truthy.

      @method _renderEnvSwitcher
    */
    _renderEnvSwitcher: function() {
      if (this.props.showEnvSwitcher && !this.props.appState.current.profile) {
        return (
          <li className="header-breadcrumb__list-item">
            <window.juju.components.EnvSwitcher
              authDetails={this.props.authDetails}
              environmentName={this.props.modelName}
              listModelsWithInfo={this.props.listModelsWithInfo}
              showProfile={this.props.showProfile}
              switchModel={this.props.switchModel}
            />
          </li>);
      }
      return;
    },

    /**
      Handles clicks on the profile link. Does not navigate to the profile
      if we aren't showing the model switcher.

      @method _handleProfileClick
      @param {String} username The name of the profile.
      @param {Object} evt The click event.
    */
    _handleProfileClick: function(username, evt) {
      evt.preventDefault();
      if (!this.props.showEnvSwitcher) {
        // Nothing to be done: we are already in the profile view.
        return;
      }
      this.props.showProfile(username);
    },

    /**
      Generate the model owner link. If there is no model or if the owner is
      not available yet, fall back to showing the current logged in user.

      TODO frankban: this requires a better UX. We can no longer assume that
      the second part of the breadcrumb is the logged in user, and so we need a
      new element showing who currently you are.

      @method _generateOwnerLink
    */
    _generateOwnerLink: function() {
      const currentState = this.props.appState.current;
      if (currentState && currentState.profile) {
        return this._buildProfile(currentState.profile);
      }
      const modelOwner = this.props.modelOwner;
      const modelName = this.props.modelName;
      if (!modelOwner || !modelName || modelName === NO_MODEL) {
        // There are no models so just render the current user instead.
        return this._generateUserLink();
      }
      return this._buildProfile(modelOwner.split('@')[0]);
    },

    /**
      Generate the user link. If we aren't showing the model switcher then the
      link to the profile does not turn the users cursor to a pointer because
      we disable the profile functionality in that case.

      @method _generateUserLink
    */
    _generateUserLink: function() {
      const auth = this.props.authDetails;
      if (auth && (auth.user || auth.loading)) {
        return this._buildProfile(auth.loading ? '...' : auth.rootUserName);
      }
    },

    /**
      Build a link for the given user name.

      @method _buildProfile
      @param {String} username The name of the profile.
    */
    _buildProfile: function(username) {
      const linkClasses = classNames('header-breadcrumb--link', {
        'profile-disabled': !this.props.showEnvSwitcher
      });
      const onClick = this._handleProfileClick.bind(this, username);
      return (
        <li className="header-breadcrumb__list-item">
          <a className={linkClasses} onClick={onClick}>{username}</a>
        </li>
      );
    },

    render: function() {
      const userItem = this._generateOwnerLink();
      const authDetails = this.props.authDetails;
      return (
        <ul className="header-breadcrumb"
            // This attribute is required by uitests.
            data-username={authDetails && authDetails.rootUserName}>
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
