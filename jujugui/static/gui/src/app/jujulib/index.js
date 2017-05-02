// Copyright (C) 2016 Canonical Ltd.
'use strict';

// This is here to prevent side effects while minifying JS files.
;
var module = module;

/**
  jujulib provides API access for services used by juju.

  jujulib provies access to the APIs for the following services:
  - the Juju Intelligent Model Manager (JIMM);
  - the Juju charm store;
  - the Juju identity manager (IdM);
  - the Romulus plans service;
  - the Romulus terms service.
  - the payment service.
  - the Stripe service.
*/
(function (exports) {

  /**
    Serializes an object into a query string.

    @param obj {Object} the object to serialize
    @return a query string serialized from the object.
  */
  const serializeObject = function(obj) {
    return Object.keys(obj).map(p =>
        `${encodeURIComponent(p)}=${encodeURIComponent(obj[p])}`).join('&');
  };
  /**
    @param {Function} callback The callback to wrap.
    @param {Object} options Any options for the callback wrapper.
      parseJSON: {Boolean} false - Whether the response should be passed
        through JSON.parse.
    @return {Function} The wrapped callback.
  */
  const _wrap = (callback, options={}) => {
    return (err, response) => {
      if (err) {
        callback(err, null);
        return;
      }
      const target = response.target;
      const text = target && target.responseText;
      if (!text) {
        callback(null, null);
        return;
      }
      if (!options.parseJSON) {
        callback(null, text);
        return;
      }
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(text);
        err = jsonResponse.error || jsonResponse.Error;
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, jsonResponse);
      } catch(err) {
        callback(err, null);
        return;
      }
    };
  };

  var _transformAuthObject = function(callback, error, data) {
    if (error !== null) {
      callback(error, data);
    } else {
      var auth = {};
      // Mapping from the API's attributes to the lowercase attributes more
      // common in the JS world. Not sure if we want to do this, or if
      // there's a better way (i.e., one that handles deeply nested
      // structures), but this works for now.
      Object.keys(data).forEach(function(key) {
        auth[key.toLowerCase()] = data[key];
      });
      callback(error, auth);
    }
  };

  /**
    Define the jujulib object, returned by this library and populated by
    submodules.
  */
  exports.jujulib = {
    serializeObject,
    _transformAuthObject,
    _wrap
  };

}((module && module.exports) ? module.exports : this));
