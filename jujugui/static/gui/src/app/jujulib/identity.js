/* Copyright (C) 2018 Canonical Ltd. */
'use strict';


/**
  Identity service client.

  Provides access to the Identity API.
*/

const identityAPIVersion = 'v1';

/**
  Initializer.

  @function identity
  @param userStorage {Object} An object containing access to the identity URL.
  @param bakery {Object} A bakery object for communicating with the identity
    instance.
  @returns {Object} A client object for making identity API calls.
*/
function identity(userStorage, bakery) {
  // Store the API URL (including version) handling missing trailing slash.
  this.userStorage = userStorage;
  this.bakery = bakery;
};

identity.prototype = {

  /**
    Returns the proper URL for connecting to the identity API or null if There
    is no base identityURL provided by the userStorage instance.
    @return {String|null} The generated identity URL.
  */
  getIdentityURL: function() {
    const identityURL = this.userStorage.identityURL();
    if (identityURL === null) {
      return null;
    }
    return `${identityURL}/${identityAPIVersion}`;
  },

  /**
    Fetch the user data from the identity service
    @param {String} userName The user name to fetch the data for.
    @param {Function} callback
      Called with the call signature (error <Object>, userData <Object>).
  */
  getUser: function(userName, callback) {
    const identityURL = this.getIdentityURL();
    if (identityURL === null) {
      callback('no identity URL available', null);
      return null;
    }
    return this.bakery.get(`${identityURL}/u/${userName}`, null, (err, resp) => {
      if (err) {
        callback(err, null);
        return;
      }
      try {
        const data = JSON.parse(resp.target.responseText);
        callback(null, data);
      } catch (e) {
        callback(e.toString(), null);
      }
    });
  }
};

module.exports = identity;
