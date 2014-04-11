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
 * The fake Web Handler used to simulate HTTP(S) communication with the
 * fake backend when the GUI is run in sandbox mode.
 *
 * @module env
 * @submodule env.web
 */

YUI.add('juju-env-web-sandbox', function(Y) {

  var module = Y.namespace('juju.environments.web');
  var localCharmExpression = /\/juju-core\/charms\?series=(\w+)/;
  // The expression below is not perfect but good enough for sandbox mode
  // needs, in which we can safely assume the "url: query to always precede
  // the "file" query.
  var localCharmFilesExpression =
      /\/juju-core\/charms(?:\/)?\?(?:url=([\w-/:]+))(?:&file=([\w-/.]+))?/;

  /**
   * Sandbox Web requests handler.
   *
   * This object exposes the ability to simulate asynchronous Web requests to
   * the server.
   *
   * @class WebSandbox
   */
  function WebSandbox(config) {
    // Invoke Base constructor, passing through arguments.
    WebSandbox.superclass.constructor.apply(this, arguments);
  }

  WebSandbox.NAME = 'sandbox-web-handler';
  WebSandbox.ATTRS = {
    /**
      The fake backend instance, used to store state and to communicate with
      the db.

      @attribute state
      @type {object}
    */
    'state': {}
  };

  Y.extend(WebSandbox, Y.Base, {

    /**
      Simulate an asynchronous POST request to the given URL.

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
      var match = localCharmExpression.exec(path);
      if (match) {
        // This is a request to upload a local charm to juju-core.
        var state = this.get('state');
        return state.handleUploadLocalCharm(data, match[1], completedCallback);
      }
      // This is in theory unreachable.
      console.error('unexpected POST request to ' + path);
    },

    /**
      Simulate an asynchronous GET request to the given URL.

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
      var match = localCharmFilesExpression.exec(path);
      if (match) {
        // This is a request to list or retrieve local charm files.
        var charmUrl = match[1];
        var filename = match[2];
        var state = this.get('state');
        return state.handleLocalCharmFileRequest(
            charmUrl, filename, completedCallback);
      }
      // This is in theory unreachable.
      console.error('unexpected GET request to ' + path);
    },

    /**
      Given a path and credentials, return a URL including the user:password
      fragment.

      @method getUrl
      @param {String} path The target path.
      @param {String} username The user name for basic HTTP authentication.
      @param {String} password The password for basic HTTP authentication.
      @return {String} The resulting URL.
    */
    getUrl: function(path, username, password) {
      var match = localCharmFilesExpression.exec(path);
      if (match) {
        // This is a request for a local charm's file (usually the icon).
        var charmUrl = match[1];
        var filename = match[2];
        var state = this.get('state');
        return state.getLocalCharmFileUrl(charmUrl, filename);
      }
      // This is in theory unreachable.
      console.error('unexpected getUrl request to ' + path);
    }

  });

  module.WebSandbox = WebSandbox;

}, '0.1.0', {
  requires: [
    'base'
  ]
});


