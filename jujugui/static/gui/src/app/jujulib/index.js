'use strict';
/*
Copyright (C) 2016 Canonical Ltd.

XXX jcssackett 2015-09-18: Licensing for jujulib? It's different then the
licensing for the GUI.
*/

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
     Utility function for making requests via the bakery.

     _makeRequest
     @param bakery {Object} The bakery object to use.
     @param path {String} The JEM endpoint to make the request from,
         e.g. '/model'
     @param method {String} The type of http method to use, e.g. GET or POST.
     @param params {Object} Optional data object to sent with e.g. POST
        commands.
     @param callback {Function} A callback to handle errors or accept the data
         from the request. Must accept an error message or null as its first
         parameter and the response data as its second.
     @param parse {Boolean} Whether or not to parse the response as JSON.
     @param redirect {Boolean} Whether or not to redirect on a 401 within
        the bakery.
  */
  const _makeRequest = function(
    bakery, url, method, params, callback, parse, redirect) {
    const wrappedCallback = (err, response) => {
      if (err) {
        callback(err, null);
        return;
      }
      const text = response.target.responseText;
      if (!text) {
        callback(null, null);
        return;
      }
      // TODO frankban: we should really avoid defaulting optional
      // parameters to true.
      if (parse !== undefined && !parse) {
        callback(null, text);
        return;
      }
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(text);
      } catch(err) {
        callback(err, null);
        return;
      }
      err = jsonResponse.error || jsonResponse.Error;
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, jsonResponse);
    };
    const headers = null;
    // Invoke the proper bakery function, based on request type.
    switch (method) {
      case 'GET':
        return bakery.get(url, headers, wrappedCallback);
        break;
      case 'DELETE':
        return bakery.delete(url, headers, wrappedCallback);
        break;
      case 'POST':
        return bakery.post(
          url, headers, JSON.stringify(params), wrappedCallback);
        break;
      case 'PUT':
        return bakery.put(
          url, headers, JSON.stringify(params), wrappedCallback);
        break;
      case 'PATCH':
        return bakery.patch(
          url, headers, JSON.stringify(params), wrappedCallback);
        break;
      default:
        console.error(`method "${method}" is not supported`);
        break;
    }
  };

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
    _makeRequest: _makeRequest,
    _transformAuthObject: _transformAuthObject,
    serializeObject: serializeObject,
    _wrap
  };

}((module && module.exports) ? module.exports : this));
