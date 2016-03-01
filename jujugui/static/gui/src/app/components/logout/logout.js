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

YUI.add('logout-component', function() {

  juju.components.Logout = React.createClass({

    propTypes: {
      logout: React.PropTypes.func.isRequired,
      visible: React.PropTypes.bool.isRequired,
      clearCookie: React.PropTypes.func.isRequired,
      charmstoreLogoutUrl: React.PropTypes.string.isRequired,
      getUser: React.PropTypes.func.isRequired,
      clearUser: React.PropTypes.func.isRequired
    },

    logout: function(e) {
      var props = this.props;
      if (!props.getUser()) {
        // If we don't have stored user information for the charmstore then
        // the user isn't logged in so there is no point to redirect
        // them to another page to log out.
        e.preventDefault();
      }
      // Clear the user data on log out.
      props.clearUser();
      props.clearCookie();
      props.logout();
    },

    /**
      Generate the classes based on the props.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'logout-link',
        {
          'logout-link--hidden': !this.props.visible
        }
      );
    },

    render: function() {
      return (
        <a className={this._generateClasses()}
          href={this.props.charmstoreLogoutUrl}
          onClick={this.logout}
          target="_blank">
          Logout
        </a>
      );
    }

  });

}, '0.1.0', { requires: []});
