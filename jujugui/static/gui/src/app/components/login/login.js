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

class Login extends React.Component {
  componentDidMount() {
    if (this.props.gisf) {
      const bounce = (startTime) => {
        if (this.props.controllerIsConnected()) {
          if (this.refs.USSOLoginLink) {
            this.refs.USSOLoginLink.handleLogin();
          }
        } else if ((performance.now() - startTime) < 5000) {
          console.log(
            'controller not yet connected, attempting retry.');
          setTimeout(bounce, 150, performance.now());
        } else {
          const message = 'controller never connected';
          this.props.addNotification({
            title: message,
            message: message,
            level: 'error'
          });
          console.error(message);
        }
      };
      bounce(performance.now());
    } else {
      this.refs.username.focus();
    }
  }

  /**
    Handle the form submit in the case traditional user/password credentials
    are provided by the user. Call the set credentials and login methods with
    the appropriate values.

    @method _handleLoginSubmit
    @param {Object} evt The submit event.
  */
  _handleLoginSubmit(evt) {
    if (evt && evt.preventDefault) {
      evt.preventDefault();
    }
    this.props.loginToAPIs({
      user: this.refs.username.value,
      password: this.refs.password.value
    }, false);
  }

  /**
    Display a message if the login failed.

    @method _generateErrorMessage
  */
  _generateErrorMessage() {
    var msg = this.props.errorMessage;
    if (msg) {
      return <div className="login__failure-message">{msg}</div>;
    }
  }

  /**
    Generates the login help message based on if we're in legacy Juju or not.

    @method _generateHelpMessage
    @return {Object} The message.
  */
  _generateHelpMessage() {
    return (
      <p>
        Find your username and password with<br />
        <code>juju show-controller --show-password</code>
      </p>);
  }

  _generateUSSOLink () {
    return (
      <juju.components.USSOLoginLink
        displayType="button"
        loginToController={this.props.loginToController}
        ref="USSOLoginLink" />);
  }

  _generateClassnames() {
    return classNames('login', {'hidden': this.props.gisf});
  }

  render() {
    return (
      <div className={this._generateClassnames()}>
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
            onSubmit={this._handleLoginSubmit.bind(this)}>
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
              submit={true}
              type="positive">
              Login
            </juju.components.GenericButton>
            {this._generateUSSOLink()}
          </form>
        </div>
        <div className="login__message">
          {this._generateHelpMessage()}
          <div className="login__message-link">
            <a href="https://jujucharms.com" target="_blank">
              jujucharms.com
            </a>
          </div>
        </div>
      </div>
    );
  }
};

Login.propTypes = {
  addNotification: PropTypes.func.isRequired,
  controllerIsConnected: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  gisf: PropTypes.bool.isRequired,
  loginToAPIs: PropTypes.func.isRequired,
  loginToController: PropTypes.func.isRequired
};

YUI.add('login-component', function() {
  juju.components.Login = Login;
}, '0.1.0', {
  requires: [
    'generic-button',
    'usso-login-link',
    'svg-icon'
  ]
});
