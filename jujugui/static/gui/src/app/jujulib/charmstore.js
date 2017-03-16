/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {


  var jujulib = exports.jujulib;

  /**
    Charm store API client.

    Provides access to the Juju charm store API.
  */

  var charmstoreAPIVersion = 'v5';

  /**
    Initializer.

    @function charmstore
    @param url {String} The URL of the charm store, including scheme, port and
      the trailing slash, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the
      charmstore instance.
    @param processEnity {function} A function to massage entity data into the
      desired form (e.g. turning it into juju gui model objects.
    @returns {Object} A client object for making charmstore API calls.
  */
  function charmstore(url, bakery, processEntity) {
    // Store the API URL (including version) handling missing trailing slash.
    this.url = url.replace(/\/?$/, '/') + charmstoreAPIVersion;
    this.bakery = bakery;

    // XXX jcsackett 2015-11-09 Methods that return entity data should
    // accept an additional modifier function as a callback, but for now
    // we've made it an attribute of the charmstore.
    this.processEntity = processEntity;
  };

  charmstore.prototype = {

    /**
      Returns the url that you need to visit to log out of the charmstore.

      @method getLogoutUrl
      @return {String} The url to visit to log out.
    */
    getLogoutUrl: function() {
      return this._generatePath('logout');
    },
    /**
      Generates a path to the charmstore api based on the query and endpoint
      params passed in.

      @method _generatePath
      @param endpoint {String} The endpoint to call at the charmstore.
      @param query {Object} The query parameters that are required for the
        request.
      @param extension {Boolean} Any extension to add to the endpoint
        such as /meta/any or /archive.
      @return {String} A charmstore url based on the query and endpoint params
        passed in.
    */
    _generatePath: function(endpoint, query, extension) {
      query = query ? '?' + query : '';
      if (extension) {
        endpoint = endpoint + extension;
      }
      return this.url + '/' + endpoint + query;
    },

    /**
      Transforms the results from a charmstore query into model objects.

      @method _transformQueryResults
      @param callback {Function} Called when the api request completes
        successfully.
      @param error {String} An error message or null if no error.
      @param data {Object} The parsed response data.
    */
    _transformQueryResults: function(callback, error, data) {
      if (error !== null) {
        callback(error, data);
      } else {
        // If there is a single charm or bundle being requested then we need
        // to wrap it in an array so we can use the same map code.
        data = data.Results ? data.Results : [data];
        var models = [];
        data.forEach(function(entity) {
          var entityData = this._processEntityQueryData(entity);
          if (this.processEntity !== undefined) {
            entityData = this.processEntity(entityData);
          }
          models.push(entityData);
        }, this);
        callback(error, models);
      }
    },

    /**
      Recursively converts all keys to lowercase when assigning them to the
      supplied host object.

      @method _lowerCaseKeys
      @param obj  {Object}The source object with the uppercase keys.
      @param host {Object} The host object in which the keys will be assigned.
      @param exclude {Integer} Exclude a particular level from lowercasing when
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
        // Create shallow copies of objects for the copy.
        var copy =
            (typeof obj[key] === 'object' && obj[key] !== null) ?
                JSON.parse(JSON.stringify(obj[key])) : obj[key];
        host[newKey] = copy;
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
      @param data {Object} The entities data from the charmstore search api.
      @return {Object} The processed data structure.
    */
    _processEntityQueryData: function(data) {
      const meta = data.Meta,
          extraInfo = meta['extra-info'],
          charmMeta = meta['charm-metadata'],
          charmConfig = meta['charm-config'],
          commonInfo = meta['common-info'],
          revisionInfo = meta['revision-info'] || {},
          bundleMeta = meta['bundle-metadata'],
          owner = meta.owner && meta.owner.User;

      // Singletons and keys which are outside of the common structure
      var processed = {
        id: data.Id,
        downloads: meta.stats && meta.stats.ArchiveDownloadCount,
        entityType: (charmMeta) ? 'charm' : 'bundle',
        // If the id has a user segment then it has not been promulgated.
        is_approved: data.Id.indexOf('~') > 0 ? false : true,
        owner: owner,
        revisions: revisionInfo.Revisions || [],
        code_source: {
          location: extraInfo['bzr-url']
        }
      };
      if (meta['supported-series']) {
        processed.series = meta['supported-series']['SupportedSeries'];
      }
      if (meta['charm-metrics']) {
        processed.metrics = meta['charm-metrics'].Metrics;
      }
      if (commonInfo && commonInfo['bugs-url']) {
        processed.bugUrl = commonInfo['bugs-url'];
      }
      if (commonInfo && commonInfo.homepage) {
        processed.homepage = commonInfo.homepage;
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
        if (meta['bundle-unit-count']) {
          processed.unitCount = meta['bundle-unit-count']['Count'];
        }
        if (meta['bundle-machine-count']) {
          processed.machineCount = meta['bundle-machine-count']['Count'];
        }
        processed.deployerFileUrl =
            this.url +
            '/' +
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
      // Use the outer resource data structure as it's the proper format
      // for the addPendingResources call.
      if (meta.resources && meta.resources.length) {
        processed.resources = meta.resources;
      }

      if (meta['id-revision']) {
        processed['revision_id'] = meta['id-revision']['Revision'];
      }
      return processed;
    },

    /**
      Fetch an individual file from the specified bundle or charm.

      @method getFile
      @param entityId {String} The id of the charm or bundle's file we want.
      @param filename {String} The path/name of the file to fetch.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getFile: function(entityId, filename, callback) {
      entityId = entityId.replace('cs:', '');
      return jujulib._makeRequest(
          this.bakery,
          this._generatePath(entityId, null, '/archive/' + filename),
          'GET',
          null,
          callback,
          false);
    },

    /**
      Get the URL for a  bundle diagram.

      @method getDiagramURL
      @param entityId {String} The id of the charm or bundle's file we want.
    */
    getDiagramURL: function(entityId) {
      entityId = entityId.replace('cs:', '');
      return this._generatePath(entityId, null, '/diagram.svg');
    },

    /**
      Takes the entity id and returns the canonical id for the entity.

      There are a number of variations on charm and bundle ids which are all
      associated to a canonical id. Ex) cs:trusty/ghost === cs:ghost.

      @method getCanonicalId
      @param {String} entityId The id to use to fetch the canonical id of.
      @param {Function} callback The callback which gets called with an error
        or the canonical entity id.
    */
    getCanonicalId: function(entityId, callback) {
      const handler = (error, data) => {
        if (error) {
          callback(error, null);
          return;
        }
        callback(null, data.Id);
      };
      jujulib._makeRequest(
        this.bakery,
        this._generatePath(entityId.replace('cs:', ''), null, '/meta/id'),
        'GET',
        null,
        handler);
    },
    /**
      Makes a request to the charmstore api for the supplied id. Whether that
      be a charm or bundle.

      @method getEntity
      @param entityId {String} The id of the charm or bundle to fetch.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getEntity: function(entityId, callback) {
      // Make sure we strip the ID of any extraneous strings.
      entityId = entityId.replace('cs:', '');
      var endpoints = 'include=' + [
        'bundle-metadata',
        'bundle-machine-count',
        'charm-metadata',
        'charm-config',
        'common-info',
        'id-revision',
        'revision-info',
        'manifest',
        'stats',
        'extra-info',
        'tags',
        'charm-metrics',
        'owner',
        'resources',
        'supported-series'
      ].join('&include=');
      return jujulib._makeRequest(
          this.bakery,
          this._generatePath(entityId, endpoints, '/meta/any'),
          'GET',
          null,
          this._transformQueryResults.bind(this, callback));
    },

    /**
      Makes a search request using the supplied filters and returns the
      results to the supplied callback.

      @method search
      @param filters {Object} The additional filters to use to make the
          search request such as { text: 'apache' }.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
      @param limit {Integer} The number of results to get.
    */
    search: function(filters, callback, limit) {
      var qs = '';
      var keys = Object.keys(filters);
      if (keys.length > 0) {
        keys.forEach(function(key, i) {
          var value = filters[key];
          if (i > 0) {
            qs += '&';
          }
          qs += key;
          if (value && value !== '') {
            qs += '=' + value;
          }
        });
      }
      var includes = [
        qs,
        'limit=' + (limit || 30),
        'autocomplete=1',
        'include=charm-metadata',
        'include=charm-config',
        'include=supported-series',
        'include=bundle-metadata',
        'include=extra-info',
        'include=tags',
        'include=owner',
        'include=stats'
      ];
      var path = this._generatePath('search', includes.join('&'));
      return jujulib._makeRequest(
          this.bakery,
          path,
          'GET',
          null,
          this._transformQueryResults.bind(this, callback));
    },

    /**
      Makes a list request using the supplied author and returns the results to
      the supplied callback.

      @method list
      @param author {String} The charm author's username.
      @param callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
      @param type {String} Type of entity to list, must be either 'bundle' or
          'charm'. Defaults to charm.
    */
    list: function(author, callback, type) {
      author = encodeURIComponent(author);
      type = encodeURIComponent(type || 'charm');
      var qs = [
        'owner=' + author,
        'type=' + type,
        'include=charm-metadata',
        'include=bundle-metadata',
        'include=bundle-unit-count',
        'include=extra-info',
        'include=supported-series',
        'include=stats'
      ];
      qs = qs.join('&');
      var path = this._generatePath('list', qs);
      return jujulib._makeRequest(
        this.bakery,
        path,
        'GET',
        null,
        this._transformQueryResults.bind(this, callback));
    },

    /**
      Queries the whoami service for auth info.

      @method whoami
      @param callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    whoami: function(callback) {
      var path = this._generatePath('whoami');
      return jujulib._makeRequest(
        this.bakery,
        path,
        'GET',
        null,
        jujulib._transformAuthObject.bind(this, callback),
        true,
        // turn off redirect, we want to silently fail
        // if the macaroon is valid.
        false
      );
    },

    /**
      Takes the bundle id and fetches the bundle YAML contents. Required for
      deploying a bundle via the deployer.

      @method getBundleYAML
      @param id {String} Bundle id in apiv4 format.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getBundleYAML: function(id, callback) {
      this.getEntity(
          id, this._getBundleYAMLResponse.bind(this, callback));
    },

    /**
      getEntity success response handler which grabs the deployerFileUrl from
      the received bundle details and requests the YAML.

      @method _getBundleYAMLResponse
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
      @param error {String} An error message or null if no error.
      @param bundle {Array} An array containing the requested bundle model.
    */
    _getBundleYAMLResponse: function(callback, error, bundle) {
      return jujulib._makeRequest(
          this.bakery, bundle[0].deployerFileUrl, 'GET',
          null, callback, false);
    },

    /**
      Gets the list of available versions of the supplied charm id.

      @method getAvailableVersions
      @param charmId {String} The charm id to fetch all of the versions for.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getAvailableVersions: function(charmId, callback) {
      charmId = charmId.replace('cs:', '');
      var series = charmId.split('/')[0];
      return jujulib._makeRequest(
          this.bakery,
          this._generatePath(charmId, null, '/expand-id'),
          'GET',
          null,
          this._processAvailableVersions.bind(this, series, callback));
    },

    /**
      The structure returned by the api is an array of objects with a single
      id value. This reduces it to an array of those ids reducing out the
      ids which are not for the existing series.

      @method _processAvailableVersions
      @param series {String} The series of the charm requested.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
      @param error {String} An error message or null if no error.
      @param data {Object} The response from the request.
    */
    _processAvailableVersions: function(series, callback, error, data) {
      if (error !== null) {
        callback(error, data);
      } else {
        var truncatedList = [];
        data.forEach(function(item) {
          var id = item.Id;
          if (id.indexOf(series) > -1) {
            truncatedList.push(id);
          }
        });
        callback(null, truncatedList);
      }
    },

    /**
      Gets the list of resources for the supplied charm.

      @method getResources
      @param charmId {String} The id of the charm for which to get resources.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getResources: function(charmId, callback) {
      charmId = charmId.replace('cs:', '');
      return jujulib._makeRequest(
          this.bakery,
          this._generatePath(charmId, null, '/meta/resources'),
          'GET',
          null,
          this._processResources.bind(this, callback));
    },

    /**
      Process the data returned by the call to get charm resources.

      @method _processResources
      @param callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
      @param error {String} An error message or null if no error.
      @param data {Object} The response from the request.
    */
    _processResources: function(callback, error, data) {
      if (error !== null) {
        callback(error, data);
      } else {
        const resources = data.map(item => {
          const cleaned = {};
          // Map the keys to lower case.
          Object.keys(item).forEach(key => {
            cleaned[key.toLowerCase()] = item[key];
          });
          return cleaned;
        });
        callback(null, resources);
      }
    }
  };

  // Populate the library with the API client and supported version.
  jujulib.charmstore = charmstore;
  jujulib.charmstoreAPIVersion = charmstoreAPIVersion;

}((module && module.exports) ? module.exports : this));
