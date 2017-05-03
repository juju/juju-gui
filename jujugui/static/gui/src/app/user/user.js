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

/** Class representing a user's authorizations in the GUI **/
const User = class User {

  constructor(cfg = {}) {
    // We pass in these values to make test setup easier.
    this.sessionStorage = cfg.sessionStorage || sessionStorage;
    this.localStorage = cfg.localStorage || localStorage;
  }

  // TODO get username

  /**
   Gets credentials out of sessionStorage.

   @param {String} type The type of credential. Expected to be either
   'controller' or 'model'.
   @return {Object} A credentials object with both the stored data and
   convenience attributes for handling login flow.
  */
  _getCredentials(type) {
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
    Object.defineProperties(credentials, {
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
      },
      areExternal: {
        get: function() {
          return !!(this.external);
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
    return this._getCredentials('controller');
  }

  set controller(credentials) {
    this._setCredentials('controller', credentials);
  }

  get model() {
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
