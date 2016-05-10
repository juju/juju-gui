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
      helpMessage: React.PropTypes.object.isRequired,
      setCredentials: React.PropTypes.func.isRequired,
      login: React.PropTypes.func.isRequired,
      loginWithMacaroon: React.PropTypes.func,
      errorMessage: React.PropTypes.string
    },

    componentDidMount: function () {
      this.refs.username.focus();
    },

    /**
      Handle the form submit in the case traditional user/password credentials
      are provided by the user. Call the set credentials and login methods with
      the appropriate values.

      @method _handleLoginSubmit
      @param {Object} evt The submit event.
    */
    _handleLoginSubmit: function(evt) {
      if (evt && evt.preventDefault){
        evt.preventDefault();
      }
      var props = this.props;
      props.setCredentials({
        user: this.refs.username.value,
        password: this.refs.password.value
      });
      props.login();
    },

    /**
      Handle the form submit in the case macaroons based authentication is
      attempted.

      @method _handleLoginWithMacaroonSubmit
      @param {Object} evt The submit event.
    */
    _handleLoginWithMacaroonSubmit: function(evt) {
      if (evt && evt.preventDefault){
        evt.preventDefault();
      }
      this.props.loginWithMacaroon();
    },

    /**
      Display a button for starting the macaroons based authentication if
      available.

      @method _generateLoginWithMacaroonButton
    */
    _generateLoginWithMacaroonButton: function() {
      if (this.props.loginWithMacaroon) {
        return ({
          action: this._handleLoginWithMacaroonSubmit,
          title: 'Login with USSO',
          type: 'neutral'
        });
      }
    },

    /**
      Display a message if the login failed.

      @method _generateErrorMessage
    */
    _generateErrorMessage: function() {
      var msg = this.props.errorMessage;
      if (msg) {
        return <div className="login__failure-message">{msg}</div>;
      }
    },

    render: function() {
      var buttons = [];
      var MacaroonButton = this._generateLoginWithMacaroonButton();
      if (MacaroonButton) {
        buttons.push(MacaroonButton);
      }
      buttons.push({
        action: this._handleLoginSubmit,
        submit: true,
        title: 'Login',
        type: 'positive'
      });
      return (
        <div className="login">
          <div className="login__logo">
            <juju.components.SvgIcon width="75" height="30" name="juju-logo" />
          </div>
          <div className="login__full-form">
            <div className="login__env-name">
              Login
            </div>
            {this._generateErrorMessage()}
            <form
              className="login__form"
              ref="form"
              onSubmit={this._handleLoginSubmit}>
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
              <juju.components.ButtonRow
                buttons={buttons} />
            </form>
          </div>
          <div className="login__message">
            {this.props.helpMessage}
            <div className="login__message-link">
              <a href="https://jujucharms.com" target="_blank">
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
    'button-row',
    'svg-icon'
  ]
});
