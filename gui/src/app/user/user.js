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

// XXX j.c.sackett 2016-05-26 Session expiration should be set via config, but
// as that also requires an update from blues browser we'll do that in a follow
// up. For now it's set to the same timeout as in blues browser.
const EXPIRATION_HOURS = 24; // Time for a session, in hours.

/** Generates the expiration date for user tokens.

 The expiration date is EXPIRATION_HOURS from now.
 */
function getExpirationDate() {
  let expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + EXPIRATION_HOURS);
  return expirationDate;
}

/** Class representing a user's authorizations in the GUI **/
class User {

  constructor(cfg = {}) {
    // We pass in these values to make test setup easier.
    this.sessionStorage = cfg.sessionStorage || sessionStorage;
    this.localStorage = cfg.localStorage || localStorage;
    this._external = cfg.externalAuth || null;
    this.expirationDatetime = cfg.expirationDatetime || getExpirationDate();
  }

  /**
    Gets the expiration date out of session storage for the user.

    Since all data dumped into session storage is serialized, so this also
    converts the value back into a Date.
  */
  get expirationDatetime() {
    return new Date(this.sessionStorage.getItem('expirationDatetime'));
  }

  /**
    Sets the expiration date for the user's tokens.

    Since the date is stored in session storage it will be serialized.

    @param expirationDate Date The time to expire the session for the user.
  */
  set expirationDatetime(expirationDatetime) {
    this.sessionStorage.setItem('expirationDatetime', expirationDatetime);
  }

  /**
    Checks the expiration date and if reached purges the data. We dump all
    tokens (controller/models, charmstore, omni, etc.) as this is a full session
    expiration.
  */
  _purgeIfExpired() {
    const now = new Date();
    if (now > this.expirationDatetime) {
      this.localStorage.clear();
      this.sessionStorage.clear();
    }
  }

  /**
    Gets the user's display name from the username in controller credentials.

    The user's display name is the first half of the full username. That is, in
    "doctor@who", the display name is "doctor".

    If external auth -- e.g. from HJC -- exists, that is used for name data.
  */
  get displayName() {
    this._purgeIfExpired();
    if (this.externalAuth) {
      return this.externalAuth.displayName;
    }
    return this.controller.user.split('@')[0];
  }

  /**
    Gets the user's username from the username in controller credentials.

    The full username includes location, e.g. @external.

    If external auth -- e.g. from HJC -- exists, that is used for name data.
  */
  get username() {
    this._purgeIfExpired();
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
    this._purgeIfExpired();
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
    this._purgeIfExpired();
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
          Reports whether or not credentials are populated.

          @method get
          @return {Boolean} Whether or not either user and password or
            macaroons are set.
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

  /**
    Returns controller credentials.

    @return {Object} A credentials object with both the stored data and
      convenience attributes for handling login flow.
  */
  get controller() {
    this._purgeIfExpired();
    return this._getCredentials('controller');
  }

  /**
    Sets controller credentials.

    @param {Object} credentials The credentials object to be stored.
  */
  set controller(credentials) {
    this._setCredentials('controller', credentials);
  }

  /**
    Returns model credentials.

    @return {Object} A credentials object with both the stored data and
      convenience attributes for handling login flow.
  */
  get model() {
    this._purgeIfExpired();
    // There are situations where we have no model creds but can fall back to
    // the controller credentials. So we only return empty credentials if both
    // the model creds and the controller creds are empty.
    let credentials = this._getCredentials('model');
    if (credentials.areAvailable) {
      return credentials;
    }
    return this._getCredentials('controller');
  }

  /**
    Sets model credentials.

    @param {Object} credentials The credentials object to be stored.
  */
  set model(credentials) {
    this._setCredentials('model', credentials);
  }

  /**
    Returns the inferred identity URL, which is only available after a
    successful login, and can be assumed to be valid only for the duration of
    the user session.

    @return {String} The URL of the identity manager (or null if not present).
  */
  identityURL() {
    const token = this.getMacaroon('identity');
    if (!token) {
      return null;
    }
    for (const key in this.localStorage) {
      if (key !== 'identity' && this.getMacaroon(key) === token) {
        return key;
      }
    }
    return null;
  }

  /**
    Sets the given serialized macaroons for the given service.

    @param {String} service The service name, like "charmstore" or "terms".
    @param {String} macaroon The serialized macaroons.
  */
  setMacaroon(service, macaroon) {
    this.localStorage.setItem(service, macaroon);
  }

  /**
    Retrieves serialized macaroons for the given service.

    @param {String} service The service name, like "charmstore" or "terms".
    @return {String} The serialized macaroons.
  */
  getMacaroon(service) {
    this._purgeIfExpired();
    return this.localStorage.getItem(service);
  }

  /**
    Removes macaroons for the given service.

    @param {String} service The service name, like "charmstore" or "terms".
  */
  clearMacaroon(service) {
    this.localStorage.removeItem(service);
  }

  /**
    Removes all stored macaroons (for all services).
  */
  clearMacaroons() {
    this.localStorage.clear();
  }
};

module.exports = User;
