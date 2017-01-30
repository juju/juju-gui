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

YUI.add('usso-login-link', function() {

  juju.components.USSOLoginLink = React.createClass({

    propTypes: {
      callback: React.PropTypes.func,
      displayType: React.PropTypes.string.isRequired,
      loginToController: React.PropTypes.func.isRequired
    },

    /**
      Handle the login form the user click.
    */
    _handleLogin: function(e) {
      if (e && e.preventDefault) {
        // Depending on the login link type there may or may not be a
        // preventDefault method.
        e.preventDefault();
      }
      this.props.loginToController(err => {
        if (err) {
          console.error('cannot log into the controller:', err);
        }
        const callback = this.props.callback;
        if (callback) {
          callback(err);
        }
      });
    },

    /**
      Returns the text login link.
    */
    _renderTextLink: function() {
      return (
        <a className={'logout-link usso-login__action'}
          onClick={this._handleLogin}
          target="_blank">
          Login
        </a>);
    },

    /**
      Returns the button login link.
    */
    _renderButtonLink: function() {
      return (
        <juju.components.GenericButton
          action={this._handleLogin}
          extraClasses="usso-login__action"
          type="positive"
          title="Sign up or Login" />);
    },

    render: function() {
      const notification = `If requested,
        in the address bar above, please allow popups
        from ${window.location.origin}.`;
      let ele;
      if (this.props.displayType === 'button') {
        ele = this._renderButtonLink();
      } else {
        ele = this._renderTextLink();
      }
      return(
        <div className="usso-login">
          {ele}
          <div className="usso-login__notification">
            {notification}
          </div>
        </div>);
    }

  });

}, '0.1.0', {
  requires: ['generic-button']
});
