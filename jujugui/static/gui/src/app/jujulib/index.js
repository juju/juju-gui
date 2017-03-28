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
  var _makeRequest = function(
    bakery, path, method, params, callback, parse, redirect) {
    /**
       Success callback that attempts to parse any error messages out of the
       JSON response.

       @param xhr {Object} the XHR response object.
    */
    var success = function(xhr) {
      var data = xhr.target.responseText,
          error = null;

      if (parse !== false) {
        try {
          data = JSON.parse(data);
          if (data.error || data.Error) {
            error = data.error || data.Error;
          }
        } catch(e) {
          error = e;
        }
      }
      callback(error, data);
    };
    /**
       Failure callback that attempts to parse any error messages out of the
       JSON response, before invoking the user-specified callback.

       @param xhrOrMessage {Object} the XHR response object; can also be a
                                    plain error string.
    */
    var failure = function(xhrOrMessage) {
      var data;
      try {
        data = JSON.parse(xhrOrMessage.target.responseText);
      } catch (e) {
        data = { error: xhrOrMessage };
      }
      var error = data.Message || data.message || data.Error || data.error;
      callback(error, data);
    };
    // Invoke the proper bakery function, based on request type.
    switch (method) {
      case 'GET':
        return bakery.sendGetRequest(path, success, failure, redirect);
      case 'POST':
        return bakery.sendPostRequest(
            path, JSON.stringify(params), success, failure, redirect);
      case 'PUT':
        return bakery.sendPutRequest(
            path, JSON.stringify(params), success, failure, redirect);
      case 'PATCH':
        return bakery.sendPatchRequest(
            path, JSON.stringify(params), success, failure, redirect);
      case 'DELETE':
        return bakery.sendDeleteRequest(path, success, failure, redirect);
      default:
        console.error(
          'Supplied request method "' + method + '" not supported.');
    }
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
    _transformAuthObject: _transformAuthObject
  };

}((module && module.exports) ? module.exports : this));
