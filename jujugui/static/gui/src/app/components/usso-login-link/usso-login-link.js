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
      charmstore: React.PropTypes.object.isRequired,
      displayType: React.PropTypes.string.isRequired,
      getDischargeToken: React.PropTypes.func.isRequired,
      gisf: React.PropTypes.bool,
      loginToController: React.PropTypes.func.isRequired,
      sendPost: React.PropTypes.func.isRequired,
      storeUser: React.PropTypes.func.isRequired
    },

    /**
     Calls the bakery to get a charm store macaroon.

     @method _interactiveLogin
     */
    loginToCharmstore: function() {
      const bakery = this.props.charmstore.bakery;
      bakery.fetchMacaroonFromStaticPath(this._fetchMacaroonCallback);
    },

    /**
     Callback for fetching the macaroon.

     @method _fetchMacaroonCallback
     @param {String|Object|Null} error The error response from the callback.
     @param {String} macaroon The resolved macaroon.
     */
    _fetchMacaroonCallback: function(error, macaroon) {
      if (error) {
        console.log(error);
        return;
      }
      this.props.storeUser('charmstore', true);
      console.log('logged into charmstore');
    },

    /**
      Handle the login form the user click.
    */
    handleLogin: function(e) {
      if (e && e.preventDefault) {
        // Depending on the login link type there may or may not be a
        // preventDefault method.
        e.preventDefault();
      }
      this.props.loginToController(err => {
        if (err) {
          console.error('cannot log into the controller:', err);
        }
        if (this.props.gisf) {
          const dischargeToken = this.props.getDischargeToken();
          if (!dischargeToken) {
            console.error('no discharge token in local storage after login');
          } else {
            console.log('sending discharge token to storefront');
            const content = 'discharge-token=' + dischargeToken;
            this.props.sendPost(
              '/_login',
              {'Content-Type': 'application/x-www-form-urlencoded'},
              content);
          }
          this.loginToCharmstore();
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
          onClick={this.handleLogin}
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
          action={this.handleLogin}
          extraClasses="usso-login__action"
          type="positive"
          title="Sign up/Log in with USSO" />);
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
