/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2014 Canonical Ltd.

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

/**
 * The Web Handler used to communicate to the juju-core HTTPS API.
 * Objects defined here can be used to make asynchronous HTTP(S) requests
 * and handle responses.
 *
 * @module env
 * @submodule env.web
 */

YUI.add('juju-env-web-handler', function(Y) {

  var module = Y.namespace('juju.environments.web');

  /**
   * HTTP(S) requests handler.
   *
   * This object exposes the ability to perform asynchronous Web requests
   * to the server.
   *
   * @class WebHandler
   */
  function WebHandler(config) {
    // Invoke Base constructor, passing through arguments.
    WebHandler.superclass.constructor.apply(this, arguments);
  }

  WebHandler.NAME = 'web-handler';
  WebHandler.ATTRS = {};

  Y.extend(WebHandler, Y.Base, {

    /**
      Send an asynchronous POST request to the given URL.

      @method sendPostRequest
      @param {String} path The remote target path/URL.
      @param {Object} headers Additional request headers as key/value pairs.
      @param {Object} data The data to send as a file object, a string or in
        general as an ArrayBufferView/Blob object.
      @param {String} username The user name for basic HTTP authentication
        (or null if no authentication is required).
      @param {String} password The password for basic HTTP authentication
        (or null if no authentication is required).
      @param {Function} progressCallback The progress event callback.
      @param {Function} completedCallback The load event callback.
    */
    sendPostRequest: function(path, headers, data, username, password,
                              progressCallback, completedCallback) {
      var xhr = this._createRequest(
          path, 'POST', headers, username, password,
          progressCallback, completedCallback);
      // Send the POST data.
      xhr.send(data);
    },

    /**
      Send an asynchronous GET request to the given URL.

      @method sendGetRequest
      @param {String} path The remote target path/URL.
      @param {Object} headers Additional request headers as key/value pairs.
      @param {String} username The user name for basic HTTP authentication
        (or null if no authentication is required).
      @param {String} password The password for basic HTTP authentication
        (or null if no authentication is required).
      @param {Function} progressCallback The progress event callback.
      @param {Function} completedCallback The load event callback.
    */
    sendGetRequest: function(path, headers, username, password,
                             progressCallback, completedCallback) {
      var xhr = this._createRequest(
          path, 'GET', headers, username, password,
          progressCallback, completedCallback);
      // Send the GET request.
      xhr.send();
    },

    /**
      Given a path and credentials, return a URL including the user:password
      fragment. The current host is used.

      @method getUrl
      @param {String} path The target path.
      @param {String} username The user name for basic HTTP authentication.
      @param {String} password The password for basic HTTP authentication.
      @return {String} The resulting URL.
    */
    getUrl: function(path, username, password) {
      var location = window.location;
      return location.protocol + '//' +
          username + ':' + password + '@' +
          location.host + path;
    },

    /**
      Create and return a value for the HTTP "Authorization" header.
      The resulting value includes the given credentials.

      @method _createAuthorizationHeader
      @param {String} username The user name.
      @param {String} password The password associated to the user name.
      @return {String} The resulting "Authorization" header value.
    */
    _createAuthorizationHeader: function(username, password) {
      var hash = btoa(username + ':' + password);
      return 'Basic ' + hash;
    },

    /**
      Create and return a xhr progress handler function.

      @method _createProgressHandler
      @param {Function} callback The progress event callback
        (or null if progress is not handled).
      @return {Function} The resulting progress handler function.
    */
    _createProgressHandler: function(callback) {
      var handler = function(evt) {
        if (typeof callback === 'function') {
          callback(evt);
        }
      };
      return handler;
    },

    /**
      Create and return a xhr load handler function.

      @method _createCompletedHandler
      @param {Function} callback The completed event callback.
      @param {Function} progressHandler The progress event handler.
      @param {Object} xhr The asynchronous request instance.
      @return {Function} The resulting load handler function.
    */
    _createCompletedHandler: function(callback, progressHandler, xhr) {
      var handler = function(evt) {
        if (typeof callback === 'function') {
          callback(evt);
        }
        // The request has been completed: detach all the handlers.
        xhr.removeEventListener('progress', progressHandler);
        xhr.removeEventListener('load', handler);
      };
      return handler;
    },

    /**
      Create, set up and return an asynchronous request to the given URL with
      the given method.

      @method _createRequest
      @param {String} path The remote target path/URL.
      @param {String} method The request method (e.g. "GET" or "POST").
      @param {Object} headers Additional request headers as key/value pairs.
      @param {String} username The user name for basic HTTP authentication
        (or null if no authentication is required).
      @param {String} password The password for basic HTTP authentication
        (or null if no authentication is required).
      @param {Function} progressCallback The progress event callback
        (or null if progress is not handled).
      @param {Function} completedCallback The load event callback.
      @return {Object} The asynchronous request instance.
    */
    _createRequest: function(path, method, headers, username, password,
                             progressCallback, completedCallback) {
      var xhr = new XMLHttpRequest({});
      // Set up the event handlers.
      var progressHandler = this._createProgressHandler(progressCallback);
      var completedHandler = this._createCompletedHandler(
          completedCallback, progressHandler, xhr);
      xhr.addEventListener('progress', progressHandler, false);
      xhr.addEventListener('load', completedHandler, false);
      // Set up the request.
      xhr.open(method, path, true);
      Y.each(headers || {}, function(value, key) {
        xhr.setRequestHeader(key, value);
      });
      // Handle basic HTTP authentication. Rather than passing the username
      // and password to the xhr directly, we create the corresponding request
      // header manually, so that a request/response round trip is avoided and
      // the authentication works well in Firefox and IE.
      if (username && password) {
        var authHeader = this._createAuthorizationHeader(username, password);
        xhr.setRequestHeader('Authorization', authHeader);
      }
      return xhr;
    }

  });

  module.WebHandler = WebHandler;

}, '0.1.0', {
  requires: [
    'base'
  ]
});


