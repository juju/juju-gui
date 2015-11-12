;
/*
Copyright (C) 2015 Canonical Ltd.

XXX jcssackett 2015-09-18: Licensing for juju.js? It's different then the
licensing for the GUI.
*/

var module = module;

//TODO fix docstrings to have the same format as the rest of the gui.
//TODO fix docstring layout in charmstore bits to match the rest of this file.
/**
 * jujulib provides API access for microservices used by juju.
 *
 * jujulib provies access to the APIs for the Juju Environment
 * Manager (JEM), the juju charmstore, and the juju identity
 * manager (IdM).
 */
(function (exports) {
  'use strict';

  /**
   * Utility function for making requests via the bakery.
   *
   * _makeRequest
   * @param bakery {Object} The bakery object to use.
   * @param path {String} The JEM endpoint to make the request from,
   *     e.g. '/env'
   * @param method {String} The type of http method to use, e.g. GET or POST.
   * @param params {Object} Optional data object to sent with e.g. POST commands.
   * @params callback {Function} A callback to handle errors or accept the data
   *     from the request. Must accept an error message or null as its first
   *     parameter and the response data as its second.
   * @params parse {Boolean} Whether or not to parse the response as JSON.
  */
  var _makeRequest = function(bakery, path, method, params, callback, parse) {
    var success = function(xhr) {
      var data = xhr.target.responseText;
      if (parse !== false) {
        data = JSON.parse(data);
      }
      callback(null, data);
    };
    var failure = function(xhr) {
      var data = JSON.parse(xhr.target.responseText);
      var error = data.Message || data.message;
      callback(error, data);
    };
    if (method === 'GET') {
      bakery.sendGetRequest(path, success, failure);
    } else if (method === 'POST') {
      bakery.sendPostRequest(path, JSON.stringify(params), success, failure);
    }
  };

  /**
   * Environment object for jujulib.
   *
   * Provides access to the JEM API.
   */

  /**
   * Initializer
   *
   * @function environment
   * @param url {String} The URL, including scheme and port, of the JEM instance.
   * @param bakery {Object} A bakery object for communicating with the JEM instance.
   * @returns {Object} A client object for making JEM API calls.
   */
  function environment(url, bakery) {
    this.jemUrl = url + '/v1';
    this.bakery = bakery;
  };


  /**
   * Lists the available environments on the JEM.
   *
   * @public listEnvironments
   * @params callback {Function} A callback to handle errors or accept the data
   *     from the request. Must accept an error message or null as its first
   *     parameter and the response data as its second.
   */
  environment.prototype.listEnvironments = function(callback) {
    var _listEnvironments = function(error, data) {
      if (error === null) {
        data = data.environments;
      }
      callback(error, data);
    };
    _makeRequest(
        this.bakery, this.jemUrl + '/env', 'GET', null, _listEnvironments);
  };

  /**
   * Lists the available state servers on the JEM.
   *
   * @public listServers
   * @params callback {Function} A callback to handle errors or accept the data
   *     from the request. Must accept an error message or null as its first
   *     parameter and the response data as its second.
   */
  environment.prototype.listServers = function(callback) {
    var _listServers = function(error, data) {
      if (error === null) {
        data = data['state-servers'];
      }
      callback(error, data);
    };
    _makeRequest(
        this.bakery, this.jemUrl + '/server', 'GET', null, _listServers);
  };
  /**
   * Provides the data for a particular environment.
   *
   * @public getEnvironment
   * @param envOwnerName {String} The user name of the given environment's owner.
   * @param envName {String} The name of the given environment.
   * @params callback {Function} A callback to handle errors or accept the data
   *     from the request. Must accept an error message or null as its first
   *     parameter and the response data as its second.
   */
  environment.prototype.getEnvironment = function (
      envOwnerName, envName, callback) {
    var url = [this.jemUrl, 'env', envOwnerName, envName].join('/');
    _makeRequest(this.bakery, url, 'GET', null, callback);
  };

  /**
   * Create a new environment.
   *
   * @public newEnvironment
   * @param envOwnerName {String} The name of the given environment's owner.
   * @param envName {String} The name of the given environment.
   * @param baseTemplate {String} The name of the config template to be used
   *     for creating the environment.
   * @param stateServer {String} The entityPath name of the state server to
   *     create the environment with.
   * @param password {String} The password for the new environment.
   * @params callback {Function} A callback to handle errors or accept the data
   *     from the request. Must accept an error message or null as its first
   *     parameter and the response data as its second.
   */
  environment.prototype.newEnvironment = function (
      envOwnerName, envName, baseTemplate, stateServer, password, callback) {
    var body = {
      name: envName,
      password: password,
      templates: [baseTemplate],
      'state-server': stateServer
    };
    var url = [this.jemUrl, 'env', envOwnerName].join('/');
    _makeRequest(this.bakery, url, 'POST', body, callback);
  };


  /**
   * Charmstore object for jujulib.
   *
   * Provides access to the charmstore API.
   */

  /**
   * Initializer
   *
   * @function charmstore
   * @param url {String} The URL, including scheme and port, of the charmstore
   * @param apiVersion {String} The api version, e.g. v4
   * @param bakery {Object} A bakery object for communicating with the charmstore instance.
   * @param processEnity {function} A function to massage entity data into the
   *    desired form (e.g. turning it into juju gui model objects.
   * @returns {Object} A client object for making charmstore API calls.
   */
  function charmstore(url, apiVersion, bakery, processEntity) {
    this.url = url;
    this.version = apiVersion;
    this.bakery = bakery;

    // XXX jcsackett 2015-11-09 Methods that return entity data should
    // accept an additional modifier function as a callback, but for now
    // we've made it an attribute of the charmstore.
    this.processEntity = processEntity;
  }

  charmstore.prototype = {
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
      return this.url + this.version + '/' + endpoint + query;
    },

    /**
      Transforms the results from a charmstore query into model objects.

      @method _transformQueryResults
      @param {Function} successCallback Called when the api request completes
        successfully.
      @param {Object} response Thre XHR response object.
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
        // Create shallow copies of objects for the copy.
        var copy;
        // XXX jcsackett 2015-11-09: Previously we used Y.merge to make shallow
        // copies. As a side effect, arrays were munged into weird objects.
        // Unfortunately the GUI relies on this side effect. When we can update
        // the gui to not expect this behavior we can just use the statement in
        // the else block of this if statement.
        if (Array.isArray(obj[key])) {
          copy = {};
          obj[key].forEach(function(val ,i) {
            copy[i] = val;
          });
        } else {
          copy =
              (typeof obj[key] === 'object' && obj[key] !== null) ?
                  JSON.parse(JSON.stringify(obj[key])) : obj[key];
        }
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
            this.url +
            this.version + '/' +
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
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getFile: function(entityId, filename, callback) {
      entityId = entityId.replace('cs:', '');
      return _makeRequest(
          this.bakery,
          this._generatePath(entityId, null, '/archive/' + filename),
          callback);
    },

    /**
      Get the URL for a  bundle diagram.

      @method getDiagramURL
      @param {String} entityId The id of the charm or bundle's file we want.
    */
    getDiagramURL: function(entityId) {
      entityId = entityId.replace('cs:', '');
      return this._generatePath(entityId, null, '/diagram.svg');
    },

    /**
      Makes a request to the charmstore api for the supplied id. Whether that
      be a charm or bundle.

      @method getEntity
      @param {String} entityId The id of the charm or bundle to fetch.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getEntity: function(entityId, callback) {
      var filters = 'include=bundle-metadata&include=charm-metadata' +
                    '&include=charm-config&include=manifest&include=stats' +
                    '&include=charm-related&include=extra-info';
      return _makeRequest(
          this.bakery,
          this._generatePath(entityId, filters, '/meta/any'),
          this._transformQueryResults.bind(this, callback));
    },

    /**
      Makes a search request using the supplied filters and returns the
      results to the supplied callback.

      @method search
      @param {Object} filters The additional filters to use to make the
          search request such as { text: 'apache' }.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
      @param {Integer} limit The number of results to get.
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
      qs = qs +
          '&limit=' + (limit || 30) + '&' +
          'include=charm-metadata&' +
          'include=charm-config&' +
          'include=bundle-metadata&' +
          'include=extra-info&' +
          'include=stats';
      var path = this._generatePath('search', qs);
      return _makeRequest(
          this.bakery,
          path,
          this._transformQueryResults.bind(this, callback));
    },

    /**
      Takes the bundle id and fetches the bundle YAML contents. Required for
      deploying a bundle via the deployer.

      @method getBundleYAML
      @param {String} id Bundle id in apiv4 format.
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
      @param {Array} bundle An array containing the requested bundle model.
    */
    _getBundleYAMLResponse: function(callback, error, bundle) {
      return _makeRequest(
          this.bakery, bundle[0].get('deployerFileUrl'), callback, false);
    },

    /**
      Gets the list of available versions of the supplied charm id.

      @method getAvailableVersions
      @param {String} charmId The charm id to fetch all of the versions for.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getAvailableVersions: function(charmId, callback) {
      charmId = charmId.replace('cs:', '');
      var series = charmId.split('/')[0];
      return _makeRequest(
          this.bakery,
          this._generatePath(charmId, null, '/expand-id'),
          this._processAvailableVersions.bind(this, series, callback));
    },

    /**
      The structure returned by the api is an array of objects with a single
      id value. This reduces it to an array of those ids reducing out the
      ids which are not for the existing series.

      @method _processAvailableVersions
      @param {String} series The series of the charm requested.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
      @param {Object} response The response object from the request.
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
    }
  };


  /**
   * The jujulib object, returned by this library.
   */
  var jujulib = {
    charmstore: charmstore,
    environment: environment,
    identity: function() {}
  };

  exports.jujulib = jujulib;

}((module && module.exports) ? module.exports : this));
