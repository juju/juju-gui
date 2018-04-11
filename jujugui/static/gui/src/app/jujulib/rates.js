/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

var module = module;

(function(exports) {

  var jujulib = exports.jujulib;

  /**
    Omnibus rates service client.
    Provides access to the Omnibus rates API.
  */

  var ratesAPIVersion = 'v3';

  function rates(url, webHandler) {
    this.url = this.url = url.replace(/\/?$/, '/') + ratesAPIVersion;
    this.webHandler = webHandler;
  };

  rates.prototype = {

    /**
      Fetch the SLA machine rate per hour for all of the different support levels.
      Data returned in the format:
        {
          unsupported: "0.000",
          essential:   "0.011",
          standard:    "0.055",
          advanced:    "0.110"
        }
      @param {Function} callback The callback which is called once the request
        returns. Called with the above data format.
    */
    getSLAMachineRates: function(callback) {
      this.webHandler.sendGetRequest(
        this.url + '/rates/machine-hour', null, null, null, null, null, response => {
          let dollars = {};
          try {
            dollars = JSON.parse(response.target.responseText);
          } catch (e) {
            dollars = null;
          }
          callback(dollars);
        });
    }

  };

  jujulib.rates = rates;
  jujulib.ratesAPIVersion = ratesAPIVersion;

}((module && module.exports) ? module.exports : this));
