/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../generic-button/generic-button');
const SvgIcon = require('../svg-icon/svg-icon');
const USSOLoginLink = require('../usso-login-link/usso-login-link');

class Login extends React.Component {
  componentDidMount() {
    if (this.props.gisf) {
      const bounce = startTime => {
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

  _generateUSSOLink() {
    return (
      <USSOLoginLink
        addNotification={this.props.addNotification}
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
          <SvgIcon height="30" name="juju-logo" width="75" />
        </div>
        <div className="login__full-form">
          <div className="login__env-name">
            Login
          </div>
          {this._generateErrorMessage()}
          <form
            className="login__form"
            onSubmit={this._handleLoginSubmit.bind(this)}
            ref="form">
            <label
              className="login__label">
              Username
              <input
                className="login__input"
                name="username"
                ref="username"
                type="text" />
            </label>
            <label
              className="login__label">
              Password
              <input
                className="login__input"
                name="password"
                ref="password"
                type="password" />
            </label>
            <GenericButton
              submit={true}
              type="positive">
              Login
            </GenericButton>
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

module.exports = Login;
