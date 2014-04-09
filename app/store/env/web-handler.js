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
  WebHandler.ATTRS = {
    /**
      The event handler attached to the charm upload xhr events. Stored so that
      we can detach it after the request has been completed.

      @attribute xhrEventHandler
      @type {Function}
    */
    'xhrEventHandler': {}
  };

  Y.extend(WebHandler, Y.Base, {

    /**
      Send an asynchronous POST request to the given URL.

      @method post
      @param {String} url The target URL.
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
    post: function(url, headers, data, username, password,
                   progressCallback, completedCallback) {
      var xhr = new XMLHttpRequest({});
      // Set up the event handler.
      var eventHandler = this._xhrEventHandler.bind(
          this, xhr, progressCallback, completedCallback);
      xhr.addEventListener('progress', eventHandler, false);
      xhr.addEventListener('load', eventHandler, false);
      // Store this handler so that we can detach the events later.
      this.set('xhrEventHandler', eventHandler);
      // Set up the request.
      xhr.open('POST', url, true);
      Y.each(headers, function(value, key) {
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
      // Send the POST data.
      xhr.send(data);
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
      The callback from the xhr progress and load events.

      @method _xhrEventHandler
      @param {Object} xhr Reference to the XHR instance.
      @param {Function} progressCallback The progress event callback.
      @param {Function} completedCallback The load event callback.
      @param {Object} evt The event object from either of the events.
    */
    _xhrEventHandler: function(xhr, progressCallback, completedCallback, evt) {
      if (evt.type === 'progress' && typeof progressCallback === 'function') {
        progressCallback(evt);
        // Return explicitly on progress.
        return;
      }
      if (evt.type === 'load') {
        // If it's not a progress event it's a load event which is fired when
        // the transmission is completed for whatever reason.
        var eventHandler = this.get('xhrEventHandler');
        xhr.removeEventListener('progress', eventHandler);
        xhr.removeEventListener('load', eventHandler);
        if (typeof completedCallback === 'function') {
          completedCallback(evt);
        }
      }
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
    }

  });

  module.WebHandler = WebHandler;

}, '0.1.0', {
  requires: [
    'base'
  ]
});


