/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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


YUI.add('charmstore-api', function(Y) {

  var jujuModels = Y.juju.models;

  /**
    Implementation of the charmstore v4 api.

    @class APIv4
  */
  function APIv4(config) {
    this.charmstoreURL = config.charmstoreURL;
    this.apiPath = 'v4';
    // We are using the webHandler class included in our source as a wrapper
    // around XHR. In the future if we would like to provide this class
    // as a public module for people to interact with the charmstore v4 api
    // then we should accept a requestHandler class being passed in on
    // instantiation as well as a different _makeRequest method for the
    // prototype.
    this.requestHandler = new Y.juju.environments.web.WebHandler();
  }

  APIv4.prototype = {
    /**
      Takes the path supplied by the caller and makes a request to the
      requestHandler instance.

      @method _makeRequest
      @param {String} The path to make the api request to.
      @param {Function} successCallback Called when the api request completes
        successfully.
      @param {Function} failureCallback Called when the api request fails
        with a response of >= 400.
    */
    _makeRequest: function(path, successCallback, failureCallback) {
      this.requestHandler.sendGetRequest(
          path,
          // The WebHandler methods allow you to pass in headers, username,
          // password, progressCallback which we do not need.
          null, null, null, null,
          this._requestHandler.bind(this, successCallback, failureCallback));
    },

    /**
      Handles the request response from the _makeRequest method, calling the
      supplied failure callback if the response status was >= 400 or passing the
      response object to the supplied success callback.

      @method _requestHandler
      @param {Function} successCallback Called when the api request completes
        successfully.
      @param {Function} failureCallback Called when the api request fails
        with a response of >= 400.
      @param {Object} response The XHR response object.
    */
    _requestHandler: function(successCallback, failureCallback, response) {
      var target = response.target;
      if (target.status >= 400) {
        failureCallback(response);
        return;
      }
      successCallback(response);
    },

    /**
      Generates a path to the charmstore apiv4 based on the query and endpoint
      params passed in.

      @method _generatePath
      @param {String} endpoint The endpoint to call at the charmstore.
      @param {Object} query The query parameters that are required for the
        request.
      @return {String} A charmstore url based on the query and endpoint params
        passed in.
    */
    _generatePath: function(endpoint, query) {
      query = query ? '?' + query : '';
      return this.charmstoreURL + this.apiPath + '/' + endpoint + query;
    },

    /**
      Transforms the results from a charmstore query into model objects.

      @method _transformQueryResults
      @param {Function} successCallback Called when the api request completes
        successfully.
      @param {Object} response Thre XHR response object.
    */
    _transformQueryResults: function(successCallback, response) {
      var data = JSON.parse(response.target.responseText).Results;
      var models = data.map(function(entity) {
        var entityData = this._processEntityQueryData(entity);
        if (entityData.entityType === 'charm') {
          return new jujuModels.Charm(entityData);
        } else {
          return new jujuModels.Bundle(entityData);
        }
      }, this);
      successCallback(models);
    },

    /**
      Recursively converts all keys to lowercase when assigning them to the
      supplied host object.

      @method lowerCaseKeys
      @param {Object} obj The source object with the uppercase keys.
      @param {Object} host The host object in which the keys will be assigned.
      @return {Undefined} Does not return a value, modifies the supplied host
        object in place.
    */
    _lowerCaseKeys: function(obj, host) {
      Object.keys(obj).forEach(function(key) {
        host[key.toLowerCase()] = obj[key];
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          this._lowerCaseKeys(obj[key], host[key.toLowerCase()]);
        } else {
          // This technique will create a version with a capitalized key so we
          // need to delete it from the host object.
          delete host[key];
        }
      }, this);
    },

    /**
      The response object returned from the apiv4 search endpoint is a complex
      object with golang style keys. This parses the complex object and
      returns something that we use to instantiate new charm and bundle models.

      @method _processEntityQueryData
      @param {Object} data The entities data from the charmstore search api.
      @return {Object} The processed data structure.
    */
    _processEntityQueryData: function(data) {
      var meta = data.Meta,
          extraInfo = meta['extra-info'],
          charmMeta = meta['charm-metadata'],
          bundleMeta = meta['bundle-metadata'],
          bzrOwner = extraInfo['bzr-owner'];
      // Singletons and keys which are outside of the common structure
      var processed = {
        id: data.Id,
        downloads: meta.stats.ArchiveDownloadCount,
        entityType: (charmMeta) ? 'charm' : 'bundle',
        // If the id has a user segment then it has not been promulgated.
        is_approved: data.Id.indexOf('~') > 0 ? false : true,
        owner: bzrOwner,
        revisions: extraInfo['bzr-revisions'],
        code_source: {
          location: extraInfo['bzr-url']
        }
      };
      // An entity will only have one or the other.
      var metadata = (charmMeta) ? charmMeta : bundleMeta;
      // Convert the remaining metadata keys to lowercase.
      this._lowerCaseKeys(metadata, processed);
      // Bundles do not have a provided name from the api so we need to parse
      // the name from the id to match the model.
      if (!processed.name) {
        var idParts = data.Id.split('/');
        // The last section will have the name of the bundle.
        idParts = idParts[idParts.length - 1];
        // Need to strip the revision number off of the end.
        idParts = idParts.split('-').slice(0, -1);
        processed.name = idParts.join('-');
      }
      // To allow the user to click on a bundle search result and display the
      // details from the old apiv3 we need to try and generate the old url.
      // This is a temporary fix and will be removed once the bundle details
      // page supports apiv4.
      if (processed.entityType === 'bundle') {
        var basket = extraInfo['bzr-url'].split('/')[3];
        var rev = data.Id.split('-');
        // Grab only the revision;
        rev = rev[rev.length - 1];
        var user = bzrOwner !== 'charmers' ? '~' + bzrOwner + '/' : '';
        processed.id = user + basket + '/' + rev + '/' + processed.name;
      }
      return processed;
    },

    /**
      Makes a search request using the supplied filters and returns the
      results to the supplied callback.

      @method search
      @param {Object} filters The additional filters to use to make the
        search request such as { text: 'apache' }.
      @param {Function} successCallback Called when the api request completes
        successfully.
      @param {Function} failureCallback Called when the api request fails
        with a response of >= 400.
    */
    search: function(filters, successCallback, failureCallback) {
      var defaultFilters =
                        '&limit=30&' +
                        'include=charm-metadata&' +
                        'include=bundle-metadata&' +
                        'include=extra-info&' +
                        'include=stats';

      var path = this._generatePath(
          'search', Y.QueryString.stringify(filters) + defaultFilters);
      this._makeRequest(
          path,
          this._transformQueryResults.bind(this, successCallback),
          failureCallback);
    },

    /**
      Returns the correct path for a charm or bundle icon provided an id and
      whether or not it is a bundle.

      This method should not be called directly from within the application.
      Instead use utils.getIconPath() as it handles local charms as well and
      then defaults to this method if it's not local.

      @method getIconPath
      @param {String} charmId The id of the charm to fetch the icon for.
      @param {Boolean} isBundle Whether or not this is an icon for a bundle.
      @return {String} The URL of the charm's icon.
    */
    getIconPath: function(charmId, isBundle) {
      var path;
      if (typeof isBundle === 'boolean' && isBundle) {
        path = '/juju-ui/assets/images/non-sprites/bundle.svg';
      } else {
        // Get the charm ID from the service.  In some cases, this will be
        // the charm URL with a protocol, which will need to be removed.
        // The following regular expression removes everything up to the
        // colon portion of the quote and leaves behind a charm ID.
        charmId = charmId.replace(/^[^:]+:/, '');
        // Note that we make sure isBundle is Boolean. It's coming from a
        // handlebars template helper which will make the second argument the
        // context object when it's not supplied. We want it optional for
        // normal use to default to the charm version, but if it's a boolean,
        // then check that boolean because the author cares specifically if
        // it's a bundle or not.
        path = this.charmstoreURL + [
          this.apiPath, charmId, 'icon.svg'].join('/');
      }
      return path;
    }
  };

  Y.namespace('juju.charmstore').APIv4 = APIv4;

}, '', {
  requires: [
    'juju-env-web-handler',
    'querystring-stringify',
    'juju-charm-models',
    'juju-bundle-models'
  ]
});
