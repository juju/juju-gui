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
  const web = Y.namespace('juju.environments.web');

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
    @param {Function} charmstoreCookieSetter A function that can be used to
      send macaroons to the charm store so that they are stored as cookies.
    @param {Object} webHandler The HTTP client that will be used by the bakery.
    @return {Object} A bakery instance ready to be used.
  */
  const newBakery = (config, user, charmstoreCookieSetter, webHandler) => {
    // Use the user object to persist macaroons.
    const userStore = new UserStore(user);
    const storage = new web.BakeryStorage(userStore, {
      charmstoreCookieSetter: charmstoreCookieSetter,
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
    return new web.Bakery(webHandler, storage, {
      nonInteractive: !config.interactiveLogin,
      visitPage: url => {
        // Add to the page a notification about accepting the pop up window
        // for logging into USSO.
        const notification = document.createElement('div');
        notification.setAttribute('id', 'login-notification');
        const message = document.createTextNode(
          'To proceed with the authentication, please accept the pop up ' +
          'window or ');
        notification.appendChild(message);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        const text = document.createTextNode('click here');
        link.appendChild(text);
        notification.appendChild(link);
        notification.appendChild(document.createTextNode('.'));
        document.body.appendChild(notification);
        // Open the pop up (default behavior for the time being).
        window.open(url, 'Login');
      },
      onSuccess: () => {
        // Remove the pop up notification from the page.
        const notification = document.getElementById('login-notification');
        if (notification) {
          notification.remove();
        }
      }
    });
  };
  module.newBakery = newBakery;

}, '0.1.0', {requires: ['base', 'juju-env-bakery']});
