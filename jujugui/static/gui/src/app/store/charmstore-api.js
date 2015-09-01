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
    this.bakery = new Y.juju.environments.web.Bakery();
    this.setAuthCookiePath = this.charmstoreURL + this.apiPath +
                             '/set-auth-cookie';
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
      this.bakery.sendGetRequest(
        path,
        this.setAuthCookiePath,
        successCallback,
        failureCallback
      );
    },

    /**
      Generates a path to the charmstore apiv4 based on the query and endpoint
      params passed in.

      @method _generatePath
      @param {String} endpoint The endpoint to call at the charmstore.
      @param {Object} query The query parameters that are required for the
        request.
      @param {Boolean} extension Any extension to add to the endpoint
        such as /meta/any or /archive.
      @return {String} A charmstore url based on the query and endpoint params
        passed in.
    */
    _generatePath: function(endpoint, query, extension) {
      query = query ? '?' + query : '';
      if (extension) {
        endpoint = endpoint + extension;
      }
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
      var data = JSON.parse(response.target.responseText);
      // If there is a single charm or bundle being requested then we need
      // to wrap it in an array so we can use the same map code.
      data = data.Results ? data.Results : [data];
      var models = [];
      data.forEach(function(entity) {
        var entityData = this._processEntityQueryData(entity);
        if (entityData.entityType === 'charm') {
          models.push(new jujuModels.Charm(entityData));
        } else {
          models.push(new jujuModels.Bundle(entityData));
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
      @param {Integer} exclude Exclude a particular level from lowercasing when
        recursing; uses a 0-based index, so if 0 is specified, the keys at the
        first level of recursion will not be lowercased. If 3 is specified, the
        keys at the fourth level of recursion will not be lowercased.
      @return {Undefined} Does not return a value, modifies the supplied host
        object in place.
    */
    _lowerCaseKeys: function(obj, host, exclude) {
      if (!obj) {
        return;
      }
      Object.keys(obj).forEach(function(key) {
        // An exclude of 0 means "don't lowercase this level".
        var newKey = key;
        if (exclude !== 0) {
          newKey = key.toLowerCase();
        }
        host[newKey] =
            (typeof obj[key] === 'object' && obj[key] !== null) ?
                Y.merge(obj[key]) : obj[key];
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          // Decrement exclude by one if it exists.
          var newExclude = exclude;
          if (newExclude !== undefined) {
            newExclude = exclude - 1;
          }
          this._lowerCaseKeys(host[newKey], host[newKey], newExclude);
        }
        // This technique will create a version with a capitalized key so we
        // need to delete it from the host object. To protect against keys
        // which are already lower case then we test to make sure we don't
        // delete those.
        if (newKey !== key) {
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
          charmConfig = meta['charm-config'],
          bundleMeta = meta['bundle-metadata'],
          bzrOwner = extraInfo['bzr-owner'];
      // Singletons and keys which are outside of the common structure
      var processed = {
        id: data.Id,
        downloads: meta.stats && meta.stats.ArchiveDownloadCount,
        entityType: (charmMeta) ? 'charm' : 'bundle',
        // If the id has a user segment then it has not been promulgated.
        is_approved: data.Id.indexOf('~') > 0 ? false : true,
        owner: bzrOwner,
        revisions: extraInfo['bzr-revisions'],
        code_source: {
          location: extraInfo['bzr-url']
        }
      };
      if (meta['charm-related']) {
        this._lowerCaseKeys(meta['charm-related'], meta['charm-related']);
        processed.relatedCharms = meta['charm-related'];
      }
      // Convert the options keys to lowercase.
      if (charmConfig && typeof charmConfig.Options === 'object') {
        this._lowerCaseKeys(charmConfig.Options, charmConfig.Options, 0);
        processed.options = charmConfig.Options;
      }
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
      if (meta.manifest) {
        processed.files = [];
        meta.manifest.forEach(function(file) {
          this._lowerCaseKeys(file, file);
          processed.files.push(file.name);
        }, this);
      }
      if (processed.entityType === 'bundle') {
        processed.deployerFileUrl =
            this.charmstoreURL +
            this.apiPath + '/' +
            processed.id.replace('cs:', '') +
            '/archive/bundle.yaml';
      } else {
        processed.relations = {
          provides: processed.provides === undefined ? {} : processed.provides,
          requires: processed.requires === undefined ? {} : processed.requires
        };
        delete processed.provides;
        delete processed.requires;
        processed.is_subordinate = !!metadata.Subordinate;
      }
      return processed;
    },

    /**
      Fetch an individual file from the specified bundle or charm.

      @method getFile
      @param {String} entityId The id of the charm or bundle's file we want.
      @param {String} filename The path/name of the file to fetch.
      @param {Function} successCallback Called when the api request completes
        successfully.
      @param {Function} failureCallback Called when the api request fails
        with a response of >= 400.
    */
    getFile: function(entityId, filename, successCallback, failureCallback) {
      entityId = entityId.replace('cs:', '');
      this._makeRequest(
          this._generatePath(entityId, null, '/archive/' + filename),
          successCallback,
          failureCallback);
    },

    /**
      Makes a request to the charmstore api for the supplied id. Whether that
      be a charm or bundle.

      @method getEntity
      @param {String} entityId The id of the charm or bundle to fetch.
      @param {Function} successCallback Called when the api request completes
        successfully.
      @param {Function} failureCallback Called when the api request fails
        with a response of >= 400.
    */
    getEntity: function(entityId, successCallback, failureCallback) {
      var filters = 'include=bundle-metadata&include=charm-metadata' +
                    '&include=charm-config&include=manifest' +
                    '&include=charm-related&include=extra-info';
      this._makeRequest(
          this._generatePath(entityId, filters, '/meta/any'),
          this._transformQueryResults.bind(this, successCallback),
          failureCallback);
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
                        'include=charm-config&' +
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
    },

    /**
      Takes the bundle id and fetches the bundle YAML contents. Required for
      deploying a bundle via the deployer.

      @method getBundleYAML
      @param {String} id Bundle id in apiv4 format.
      @param {Function} successCallback The success callback.
      @param {Function} failureCallback The failure callback.
    */
    getBundleYAML: function(id, successCallback, failureCallback) {
      this.getEntity(
          id, this._getBundleYAMLResponse.bind(
              this, successCallback, failureCallback), failureCallback);
    },

    /**
      getEntity success response handler which grabs the deployerFileUrl from
      the recieved bundle details and requests the YAML.

      @method _getBundleYAMLResponse
      @param {Function} successCallback The success callback.
      @param {Function} failureCallback The failure callback.
      @param {Array} bundle An array containing the requested bundle model.
    */
    _getBundleYAMLResponse: function(successCallback, failureCallback, bundle) {
      this._makeRequest(
          bundle[0].get('deployerFileUrl'),
          function(resp) {
            successCallback(resp.currentTarget.responseText);
          },
          failureCallback);
    },

    /**
      Gets the list of available versions of the supplied charm id.

      @method getAvailableVersions
      @param {String} charmId The charm id to fetch all of the versions for.
      @param {Function} successCallback The success callback.
      @param {Function} failureCallback The failure callback.
    */
    getAvailableVersions: function(charmId, successCallback, failureCallback) {
      charmId = charmId.replace('cs:', '');
      var series = charmId.split('/')[0];
      this._makeRequest(
          this._generatePath(charmId, null, '/expand-id'),
          this._processAvailableVersions.bind(
              this, series, successCallback, failureCallback),
          failureCallback);
    },

    /**
      The structure returned by the api is an array of objects with a single
      id value. This reduces it to an array of those ids reducing out the
      ids which are not for the existing series.

      @method _processAvailableVersions
      @param {String} series The series of the charm requested.
      @param {Function} success Reference to the success handler.
      @param {Function} failure Reference to the failure handler.
      @param {Object} response The response object from the request.
    */
    _processAvailableVersions: function(series, success, failure, response) {
      var list = response.currentTarget.responseText;
      try {
        list = JSON.parse(list);
      } catch (e) {
        failure(e);
        return;
      }
      var truncatedList = [];
      list.forEach(function(item) {
        var id = item.Id;
        if (id.indexOf(series) > -1) {
          truncatedList.push(id);
        }
      });
      success(truncatedList);
    }
  };

  Y.namespace('juju.charmstore').APIv4 = APIv4;

}, '', {
  requires: [
    'juju-env-bakery',
    'querystring-stringify',
    'juju-charm-models',
    'juju-bundle-models'
  ]
});
