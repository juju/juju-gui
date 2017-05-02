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

/**
  Helper functions for creating and working with the bakery.
*/

YUI.add('bakery-utils', function(Y) {

  const module = Y.namespace('juju.bakeryutils');

  /**
    Implement the bakery storage store interface by using the user local
    storage in order to persist macaroons.
  */
  const UserStore = class UserStore {

    /**
      Creates the user store.

      @param {Object} user An instance of "jujulib.User".
    */
    constructor(user) {
      this._user = user;
    }

    getItem(key) {
      return this._user.getMacaroon(key);
    }

    setItem(key, value) {
      this._user.setMacaroon(key, value);
    }

    clear() {
      this._user.clearMacaroons();
    }

  };

  /**
    Create and return a new bakery instance.

    @param {Object} config The app configuration.
    @param {Object} user The app user as an instance of "jujulib.User".
    @param {Object} stateGetter A callable that can be called to retrieve the
      current state of the GUI.
    @param {Function} cookieSetter A function that can be used to send
      macaroons to the charm store so that they are stored as cookies.
    @param {Object} webHandler The HTTP client that will be used by the bakery.
    @return {Object} A bakery instance ready to be used.
  */
  const newBakery = (config, user, stateGetter, cookieSetter, webHandler) => {
    // Use the user object to persist macaroons.
    const userStore = new UserStore(user);
    const storage = new jujulib.BakeryStorage(userStore, {
      charmstoreCookieSetter: cookieSetter,
      // Some initial macaroons may be provided in the GUI configuration.
      initial: {
        charmstore: config.charmstoreMacaroons,
        identity: config.dischargeToken
      },
      // Set the services so that it's possible to get human readable keys from
      // service URLs.
      services: {
        charmstore: config.charmstoreURL,
        payment: config.paymentURL,
        plans: config.plansURL,
        terms: config.termsURL
      }
    });
    return new jujulib.Bakery(webHandler, storage, {
      nonInteractive: !config.interactiveLogin,
      visitPage: url => {
        // Add to the page a notification about accepting the pop up window
        // for logging into USSO.
        const holder = document.getElementById('login-notification');
        const content = (
          <span>
            To proceed with the authentication, please accept the pop up
            window or&nbsp;
            <a href={url} target="_blank">click here</a>.
          </span>);
        let dismiss = null;
        if (stateGetter().root !== 'login') {
          dismiss = () => {
            ReactDOM.unmountComponentAtNode(holder);
          };
        }
        ReactDOM.render(
          <window.juju.components.Notification
            dismiss={dismiss}
            content={content}
          />, holder);
        // Open the pop up (default behavior for the time being).
        window.open(url, 'Login');
      },
      onSuccess: () => {
        // Remove the pop up notification from the page.
        ReactDOM.unmountComponentAtNode(
          document.getElementById('login-notification')
        );
      }
    });
  };
  module.newBakery = newBakery;

}, '0.1.0', {requires: ['notification']});
