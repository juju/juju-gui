/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  var jujulib = exports.jujulib;

  /**
    JIMM API client.

    Provides access to the JIMM API.
  */

  /**
    Initializer.

    @function bundleservice
    @param url {String} The URL of the bundleservice instance, including
      scheme, port and the trailing slash, and excluding the API version
      if applicable.
    @returns {Object} A client object for making bundleservice API calls.
  */
  function bundleservice(url, webhandler) {
    // Store the API URL handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/');
  };

  bundleservice.prototype = {
    getBundleChangesFromYAML: function(bundleYAML, callback) {
      const url = [this.url, 'bundlechanges', 'fromYAML'].join('/');
      this.webhandler.sendPostRequest(
        url,
        {},
        JSON.stringify({bundle: bundleYAML}),
        null,
        null,
        false,
        null,
        callback);
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.bundleservice = bundleservice;

}((module && module.exports) ? module.exports : this));
