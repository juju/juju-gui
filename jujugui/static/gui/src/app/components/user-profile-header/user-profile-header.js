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

YUI.add('user-profile-header', function() {

  juju.components.UserProfileHeader = React.createClass({

    propTypes: {
      users: React.PropTypes.object.isRequired,
      avatar: React.PropTypes.string.isRequired,
      bundleCount: React.PropTypes.number.isRequired,
      charmCount: React.PropTypes.number.isRequired,
      environmentCount: React.PropTypes.number.isRequired,
      interactiveLogin: React.PropTypes.func,
      username: React.PropTypes.string.isRequired
    },

    /**
      Generate the login button if it should be shown.

      @method _generateLogin
      @returns {Object} The login component.
    */
    _generateLogin: function() {
      var props = this.props;
      var interactiveLogin = props.interactiveLogin;
      var users = props.users;
      var authenticated = users.charmstore && users.charmstore.user;
      if (!interactiveLogin || authenticated) {
        return;
      }
      return (
        <juju.components.GenericButton
          title="Log in to the charmstore"
          type="login"
          action={interactiveLogin} />);
    },

    /**
      Generate the provided avatar or a default.

      @method _generateAvatar
      @returns {Object} The avatar component.
    */
    _generateAvatar: function() {
      var className = 'user-profile-header__avatar';
      if (!this.props.avatar) {
        return (
          <span className={className + ' ' + className + '--default'}>
            <span className="avatar-overlay"></span>
          </span>);
      }
      return (
        <img alt={this.props.username}
          className={className}
          src={this.props.avatar} />);
    },

    render: function () {
      var props = this.props;
      var username = props.username;
      var bundleCount = props.bundleCount;
      var bundlePlural = bundleCount === 1 ? '' : 's';
      var charmCount = props.charmCount;
      var charmPlural = charmCount === 1 ? '' : 's';
      var environmentCount = props.environmentCount;
      var environmentPlural = environmentCount === 1 ? '' : 's';
      return (
        <div className="user-profile-header twelve-col">
          {this._generateLogin()}
          {this._generateAvatar()}
          <h1 className="user-profile-header__username">
            {username}
          </h1>
          <ul className="user-profile-header__counts">
            <li className="user-profile-header__count">
              {environmentCount} model{environmentPlural}
            </li>
            <li className="user-profile-header__count">
              {bundleCount} bundle{bundlePlural}
            </li>
            <li className="user-profile-header__count">
              {charmCount} charm{charmPlural}
            </li>
          </ul>
        </div>);
    }

  });

}, '', { requires: [
  'generic-button'
]});
