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
      avatar: React.PropTypes.string.isRequired,
      interactiveLogin: React.PropTypes.func,
      links: React.PropTypes.array.isRequired,
      username: React.PropTypes.string.isRequired,
      users: React.PropTypes.object.isRequired
    },

    /**
      Generate the login button if it should be shown.

      @method _generateLogin
      @returns {Object} The login component.
    */
    _generateLogin: function() {
      const props = this.props;
      const users = props.users;
      if (users.charmstore && users.charmstore.user) {
        return;
      }
      return (
        <juju.components.GenericButton
          title="Log in to the charm store"
          type="inline-neutral"
          action={props.interactiveLogin} />);
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

    /**
      Generate the list of links.

      @method _generateLinks
      @returns {Object} The avatar component.
    */
    _generateLinks: function() {
      var links = [];
      this.props.links.forEach((link) => {
        var action = link.action;
        var type = link.type;
        var classes = {
          'user-profile-header__link--is-link': !!action
        };
        if (type) {
          classes['user-profile-header__link--' + type] = true;
        }
        var className = classNames('user-profile-header__link', classes);
        if (action) {
          links.push(
            <li className={className}
              key={link.label}
              onClick={action}
              role="button"
              tabIndex="0">
              {link.label}
            </li>);
        } else {
          links.push(
            <li className={className}
              key={link.label}>
              {link.label}
            </li>);
        }
      });
      return (
        <ul className="user-profile-header__links">
          {links}
        </ul>);
    },

    render: function () {
      var props = this.props;
      var username = props.username;
      return (
        <div className="user-profile-header twelve-col">
          {this._generateLogin()}
          {this._generateAvatar()}
          <h1 className="user-profile-header__username">
            {username}
          </h1>
          {this._generateLinks()}
        </div>);
    }

  });

}, '', { requires: [
  'generic-button'
]});
