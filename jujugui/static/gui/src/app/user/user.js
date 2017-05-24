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

if (typeof this.jujugui === 'undefined') {
  this.jujugui = {};
}

// XXX j.c.sackett 2016-05-26 Session expiration should be set via config, but
// as that also requires an update from blues browser we'll do that in a follow
// up. For now it's set to the same timeout as in blues browser.
const EXPIRATION_TIME = 24; // Time for a session, in hours

function getExpirationDate() {
  let expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + EXPIRATION_TIME);
  return expirationDate;
}

/** Class representing a user's authorizations in the GUI **/
const User = class User {

  constructor(cfg = {}) {
    // We pass in these values to make test setup easier.
    this.sessionStorage = cfg.sessionStorage || sessionStorage;
    this.localStorage = cfg.localStorage || localStorage;
    this._external = cfg.externalAuth || null;
    this.expiration = cfg.expiration || getExpirationDate();
  }

  get expiration() {
    return new Date(this.sessionStorage.getItem('expiration'));
  }

  set expiration(val) {
    this.sessionStorage.setItem('expiration', val);
  }

  _checkExpiration() {
    const now = new Date();
    if (now > this.expiration) {
      this.localStorage.clear();
      this.sessionStorage.clear();
    }
  }

  /**
   Get's the user's display name from the username in controller credentials.

   The user's display name is the first half of the full username. That is, in
   "doctor@who", the display name is "doctor".

   If external auth -- e.g. from HJC -- exists, that is used for name data.
   */
  get displayName() {
    this._checkExpiration();
    if (this.externalAuth) {
      return this.externalAuth.displayName;
    }
    return this.controller.user.split('@')[0];
  }

  /**
   Get's the user's username from the username in controller credentials.

   The full username includes location, e.g. @external.

   If external auth -- e.g. from HJC -- exists, that is used for name data.
   */
  get username() {
    this._checkExpiration();
    if (this.externalAuth) {
      return this.externalAuth.username;
    }
    return this.controller.user;
  }

  /**
   Setter for external auth information, i.e. from HJC.

   External auth information is used for determining username display and
   controller credential status.
   */
  set externalAuth(val) {
    this._external = val;
  }

  /**
   Getter for external auth information, i.e. from HJC.

   Since external auth from HJC can be a nested object, this moves name data to
   the top level of the object.
   */
  get externalAuth() {
    this._checkExpiration();
    const externalAuth = this._external;
    if (externalAuth && externalAuth.user) {
      // When HJC supplies an external auth it's possible that the name is
      // stored in a nested user object.
      externalAuth.displayName = externalAuth.user.name;
      externalAuth.username = externalAuth.user.name;
    }
    return externalAuth;
  }

  /**
   Gets credentials out of sessionStorage.

   @param {String} type The type of credential. Expected to be either
   'controller' or 'model'.
   @return {Object} A credentials object with both the stored data and
   convenience attributes for handling login flow.
  */
  _getCredentials(type) {
    this._checkExpiration();
    let credentials = JSON.parse(
      this.sessionStorage.getItem(type + 'Credentials'));
    if (!credentials) {
      credentials = {};
    }
    if (credentials.user) {
      // User names without a "@something" part are local Juju users.
      if (credentials.user.indexOf('@') === -1) {
        credentials.user += '@local';
      }
    } else {
      credentials.user = '';
    }
    if (!credentials.password) {
      credentials.password = '';
    }
    if (!credentials.macaroons) {
      credentials.macaroons = null;
    }
    const external = this.externalAuth;
    Object.defineProperties(credentials, {
      areExternal: {
        get: function() {
          return !!external;
        }
      },
      areAvailable: {
        /**
          * Reports whether or not credentials are populated.
          *
          * @method get
          * @return {Boolean} Whether or not either user and password or
          *   macaroons are set.
          */
        get: function() {
          const creds = !!((this.user && this.password) || this.macaroons);
          // In typical deploys this is sufficient however in HJC or when
          // external auth values are provided we have to be more resilient.
          return creds || this.areExternal;
        }
      }
    });
    return credentials;
  }

  /**
   Sets credentials in sessionStorage.

   @param {String} type The type of credential. Expected to be either
   'controller' or 'model'.
   @param {Object} credentials The credentials object to be stored.
   */
  _setCredentials(type, credentials) {
    this.sessionStorage.setItem(
      type + 'Credentials', JSON.stringify(credentials));
  }

  get controller() {
    this._checkExpiration();
    return this._getCredentials('controller');
  }

  set controller(credentials) {
    this._setCredentials('controller', credentials);
  }

  get model() {
    this._checkExpiration();
    // There are situations where we have no model creds but can fall back to
    // the controller credentials. So we only return empty credentials if both
    // the model creds and the controller creds are empty.
    let credentials = this._getCredentials('model');
    if (credentials.areAvailable) {
      return credentials;
    }
    return this._getCredentials('controller');
  }

  set model(credentials) {
    this._setCredentials('model', credentials);
  }

  setMacaroon(service, macaroon) {
    this.localStorage.setItem(service, macaroon);
  }

  getMacaroon(service) {
    this._checkExpiration();
    return this.localStorage.getItem(service);
  }

  clearMacaroon(service) {
    this.localStorage.removeItem(service);
  }

  clearMacaroons() {
    this.localStorage.clear();
  }
};

this.jujugui.User = User;
