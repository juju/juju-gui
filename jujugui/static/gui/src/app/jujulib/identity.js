/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

var module = module;

(function(exports) {

  const jujulib = exports.jujulib;

  /**
    Identity service client.

    Provides access to the Identity API.
  */

  const identityAPIVersion = 'v1';

  /**
    Initializer.

    @function identity
    @param url {String} The URL of the identity instance, including
      scheme and port, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the identity
      instance.
    @returns {Object} A client object for making identity API calls.
  */
  function identity(url, bakery) {
    // Store the API URL (including version) handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/') + identityAPIVersion;
    this.bakery = bakery;
  };

  identity.prototype = {

    /**
      Fetch the user data from the identity service
      @param {String} userName The user name to fetch the data for.
      @param {Function} callback
        Called with the call signature (error <Object>, userData <Object>).
    */
    getUser: function(userName, callback) {
      return this.bakery.get(`${this.url}/u/${userName}`, null, (err, resp) => {
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

  jujulib.identity = identity;

}((module && module.exports) ? module.exports : this));
