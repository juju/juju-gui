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
      charmstore: React.PropTypes.object.isRequired,
      controllerIsConnected: React.PropTypes.func.isRequired,
      errorMessage: React.PropTypes.string,
      getDischargeToken: React.PropTypes.func,
      gisf: React.PropTypes.bool.isRequired,
      hideSpinner: React.PropTypes.func,
      isLegacyJuju: React.PropTypes.bool.isRequired,
      loginToAPIs: React.PropTypes.func.isRequired,
      loginToController: React.PropTypes.func.isRequired,
      sendPost: React.PropTypes.func,
      showSpinner: React.PropTypes.func,
      storeUser: React.PropTypes.func.isRequired
    },

    componentDidMount: function () {
      if (this.props.gisf) {
        this.props.showSpinner();
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
            console.error('controller never connected');
          }
        };
        bounce(performance.now());
      } else {
        this.refs.username.focus();
      }
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
      this.props.loginToAPIs({
        user: this.refs.username.value,
        password: this.refs.password.value
      }, false);
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

    /**
      Generates the login help message based on if we're in legacy Juju or not.

      @method _generateHelpMessage
      @return {Object} The message.
    */
    _generateHelpMessage: function() {
      return this.props.isLegacyJuju ?
        (<p>
            Find your password with<br />
            <code>juju api-info --password password</code>
          </p>)
      :
        (<p>
            Find your username and password with<br />
            <code>juju show-controller --show-password</code>
          </p>);
    },

    _generateUSSOLink: function () {
      if (!this.props.isLegacyJuju) {
        return (
          <juju.components.USSOLoginLink
            charmstore={this.props.charmstore}
            callback={this.props.hideSpinner}
            displayType="button"
            getDischargeToken={this.props.getDischargeToken}
            gisf={this.props.gisf}
            loginToController={this.props.loginToController}
            ref="USSOLoginLink"
            sendPost={this.props.sendPost}
            storeUser={this.props.storeUser} />);
      }
    },

    _generateClassnames: function() {
      return classNames('login', {'hidden': this.props.gisf});
    },

    render: function() {
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
              <juju.components.GenericButton
                submit={true}
                title={"Login"}
                type={"positive"} />
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
  });

}, '0.1.0', {
  requires: [
    'generic-button',
    'usso-login-link',
    'svg-icon'
  ]
});
