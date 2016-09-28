/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  var jujulib = exports.jujulib;

  /**
    bundleservice API Client
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
    // Store the API URL handling trailing slash.
    this.url = url.replace(/\/?$/, '');
    this.webhandler = webhandler;
  };

  bundleservice.prototype = {
    /*
      Gets the bundle changes from the bundle YAML.

      @method getBundleChangesFromYAML
      @param {String} bundleYAML The bundle contents in YAML format.
      @param {Function} callback The callback function to call with the
        response.
    */
    getBundleChangesFromYAML: function(bundleYAML, callback) {
      const handler = response => {
        let bundleChanges = {};
        let error = null;
        try {
          bundleChanges = JSON.parse(response.currentTarget.response);
        } catch(e) {
          error = 'Unable to parse response data for bundle yaml';
        }
        callback(error, bundleChanges);
      };
      return this.webhandler.sendPostRequest(
        [this.url, 'bundlechanges', 'fromYAML'].join('/'),
        {'Content-type': 'application/json'},
        JSON.stringify({bundle: bundleYAML}),
        null, null, false, null, handler);
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.bundleservice = bundleservice;

}((module && module.exports) ? module.exports : this));
