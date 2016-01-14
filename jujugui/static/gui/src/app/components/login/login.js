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
      envName: React.PropTypes.string.isRequired,
      setCredentials: React.PropTypes.func.isRequired,
      login: React.PropTypes.func.isRequired,
      loginFailure: React.PropTypes.bool
    },

    componentDidMount: function () {
      this.refs.username.focus();
    },

    /**
      Handles the form submit by calling the set credentials and login
      methods with the appropriate values.

      @method _handleSubmit
      @param {Object} e The submit event.
    */
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

    /**
      Display a message if the login failed.

      @method _generateFailureMessage
    */
    _generateFailureMessage: function() {
      if (!this.props.loginFailure) {
        return;
      }
      return (
        <div className="login__failure-message">
          The supplied username or password was incorrect.
        </div>);
    },

    render: function() {
      return (
        <div className="login">
          <div className="login__logo">
            <juju.components.SvgIcon width="75" height="30" name="juju-logo" />
          </div>
          <div className="login__full-form">
            <div className="login__env-name">
              {this.props.envName}
            </div>
            {this._generateFailureMessage()}
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
            Find your password with `juju api-info --password password`
            <div className="login__message-link">
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
