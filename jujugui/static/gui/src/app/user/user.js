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
    this.storage = cfg.storage || sessionStorage;
  }

  // TODO get username

  // TODO get/set identity creds

  // TODO get/set charmstore creds

  /**
   Credentials for the controller connection for the GUI. As a getter,
   it adds convenience attributes to the credentials for handling login flow.
  /*
  /* XXX 'controller' isn't quite right--this handles both controller and model
   connection credentials. Perhaps juju? */
  get controller() {
    let credentials = JSON.parse(
      this.storage.getItem('credentials'));
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

  set controller(credentials) {
    this.storage.setItem('credentials', JSON.stringify(credentials));
  }
};

this.jujugui.User = User;
