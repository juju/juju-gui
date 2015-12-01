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

YUI.add('login-component', function() {

  juju.components.Login = React.createClass({

    propTypes: {
      setCredentials: React.PropTypes.func.isRequired,
      login: React.PropTypes.func.isRequired
    },

    _handleSubmit: function(e) {
      if (e && e.preventDefault){
        e.preventDefault();
      }
      var props = this.props;
      props.setCredentials({
        user: this.refs.username.value,
        password: this.refs.password.value
      });
      props.login();
    },

    render: function() {
      return (
        <div className="login">
          <div className="login__logo">
            <juju.components.SvgIcon width="75" height="30" name="juju-logo" />
          </div>
          <div className="login__full-form">
            <div className="login__env-name">{this.props.envName}</div>
            <form
              className="login__form"
              ref="form"
              onSubmit={this._handleSubmit}>
              <label
                className="login__label">
                Username
                <input
                  className="login__input"
                  type="text"
                  name="username"
                  ref="username" />
              </label>
              <label
                className="login__label">
                Password
                <input
                  className="login__input"
                  type="password"
                  name="password"
                  ref="password" />
              </label>
              <juju.components.GenericButton
                action={this._handleSubmit}
                type="confirm"
                title="Login" />
            </form>
          </div>
          <div className="login__message">
            The password for newer Juju clients can be found by locating the
            Juju environment file placed in ~/.juju/environments/ with the
            same name as the current environment.  For example, if you have
            an environment named "production", then the file is named
            ~/.juju/environments/production.jenv.  Look for the "password"
            field in the file, or if that is empty, for the "admin-secret".
            Remove the quotes from the value, and use this to log in.
            Note that using juju-quickstart can automate logging in,
            as well as other parts of installing and starting Juju.
            <div>
              <a
                href="https://jujucharms.com"
                target="_blank">
                jujucharms.com
              </a>
            </div>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'svg-icon',
    'generic-button'
  ]
});
