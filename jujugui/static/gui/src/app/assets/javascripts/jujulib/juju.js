;
/*
Copyright (C) 2015 Canonical Ltd.

XXX jcssackett 2015-09-18: Licensing for juju.js? It's different then the
licensing for the GUI.
*/

var module = module;

/**
   jujulib provides API access for microservices used by juju.

   jujulib provies access to the APIs for the Juju Environment
   Manager (JEM), the juju charmstore, and the juju identity
   manager (IdM).
 */
(function (exports) {
  'use strict';

  /**
     Utility function for making requests via the bakery.

     _makeRequest
     @param bakery {Object} The bakery object to use.
     @param path {String} The JEM endpoint to make the request from,
         e.g. '/model'
     @param method {String} The type of http method to use, e.g. GET or POST.
     @param params {Object} Optional data object to sent with e.g. POST commands.
     @param callback {Function} A callback to handle errors or accept the data
         from the request. Must accept an error message or null as its first
         parameter and the response data as its second.
     @param parse {Boolean} Whether or not to parse the response as JSON.
     @param redirect {Boolean} Whether or not to redirect on a 401 within
        the bakery.
  */
  var _makeRequest = function(
    bakery, path, method, params, callback, parse, redirect) {
    var success = function(xhr) {
      var data = xhr.target.responseText,
          error = null;

      if (parse !== false) {
        try {
          data = JSON.parse(data);
        } catch(e) {
          error = e;
        }
      }
      callback(error, data);
    };
    var failure = function(xhr) {
      var data = JSON.parse(xhr.target.responseText);
      var error = data.Message || data.message;
      callback(error, data);
    };
    switch (method) {
      case 'GET':
        return bakery.sendGetRequest(path, success, failure, redirect);
      case 'POST':
        return bakery.sendPostRequest(
            path, JSON.stringify(params), success, failure, redirect);
      case 'PUT':
        return bakery.sendPutRequest(
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
    JEM object for jujulib.

    Provides access to the JEM API.
  */

  /**
    Initializer

    @function jem
    @param url {String} The URL of the JEM instance, including scheme, port
      and the trailing slash, and excluding the API version.
    @param bakery {Object} A bakery object for communicating with the JEM
      instance.
    @returns {Object} A client object for making JEM API calls.
  */
  function jem(url, bakery) {
    // XXX j.c.sackett 2016-03-16 We should probably adopt the generate query
    // mechanism from charmstore but that's a larger rewrite. For now we're
    // making sure we can take the same initialization data for the JEM URL as
    // we do for the charmstore url.
    this.url = url + 'v2';
    this.bakery = bakery;
  };


  /**
    Build a model from the response to model related JEM API calls.

    @private _handleModel
    @params model {Object} The model object included in the JEM response.
  */
  function _handleModel(model) {
    return {
      path: model.path,
      user: model.user,
      password: model.password,
      uuid: model.uuid,
      controllerPath: model['controller-path'],
      controllerUuid: model['controller-uuid'],
      caCert: model['ca-cert'],
      hostPorts: model['host-ports']
    };
  };


  /**
    Build a controller from the response to controller related JEM API calls.

    @private _handleController
    @params controller {Object} The controller object included in the response.
  */
  function _handleController(controller) {
    return {
      path: controller.path,
      providerType: controller['provider-type'],
      schema: controller.schema,
      location: controller.location
    };
  };


  jem.prototype = {
    /**
      Lists the available models on the JEM.

      @public listModels
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the response data as its second.
    */
    listModels: function(callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, response.models.map(_handleModel));
      };
      var url = this.url + '/model';
      return _makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Lists the available controllers on the JEM.

      @public listControllers
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the response data as its second.
    */
    listControllers: function(callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, response.controllers.map(_handleController));
      };
      var url = this.url + '/controller';
      _makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Retrieve info on a model.

      @public getModel
      @param ownerName {String} The user name of the given model's owner.
      @param name {String} The name of the model.
      @params callback {Function} A callback to handle errors or accept the
        data from the request. Must accept an error message or null as its
        first parameter and the response data as its second.
    */
    getModel: function (ownerName, name, callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, _handleModel(response));
      };
      var url = [this.url, 'model', ownerName, name].join('/');
      _makeRequest(this.bakery, url, 'GET', null, handler);
    },

    /**
      Create a new model.

      @public newModel
      @param ownerName {String} The name of the given environment's owner.
      @param name {String} The name of the given environment.
      @param baseTemplate {String} The name of the config template to be used
          for creating the environment.
      @param controller {String} The entityPath name of the controller to
          create the environment with.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    newModel: function (ownerName, name, baseTemplate, controller, callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        callback(null, _handleModel(response));
      };
      var body = {
        name: name,
        controller: controller,
        templates: [baseTemplate]
      };
      var url = [this.url, 'model', ownerName].join('/');
      _makeRequest(this.bakery, url, 'POST', body, handler);
    },

    /**
      Queries the whoami service for auth info.

      @method whoami
      @param callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    whoami: function(callback) {
      var url = this.url + '/whoami';
      _makeRequest(
        this.bakery,
        url,
        'GET',
        null,
        _transformAuthObject.bind(this, callback),
        true,
        // turn off redirect, we want to silently fail
        // if the macaroon is valid.
        false
      );
    },

    /**
      Lists all the templates for cloud credentials for the currently
      authenticated user.

      @method listTemplates
      @param callback {Function} A callback to handle errors or accept the data
        from the request. Must accept an error message or null as its first
        parameter and the response data as its second.
    */
    listTemplates: function(callback) {
      var handler = function(error, response) {
        if (error !== null) {
          callback(error, null);
          return;
        }
        var data = response.templates.map(function(template) {
          return {
            path: template.path,
            schema: template.schema,
            config: template.config
          };
        });
        callback(null, data);
      };
      var url = this.url + '/template';
      return _makeRequest(this.bakery, url, 'GET', null, handler, true);
    },

    /**
      Adds a new template for the currently authenticated user in JEM.

      @method addTemplate
      @param ownerName the owner the template.
      @param templateName the name of the template.
      @param template A JavaScript object holding the information for the
        template - a 'controller' key, and a 'config' key with credentials.
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    addTemplate: function(ownerName, templateName, template, callback) {
      var handler = function(error, response) {
        callback(error || null);
      };
      var url = [this.url, 'template', ownerName, templateName].join('/');
      return _makeRequest(this.bakery, url, 'PUT', template, handler, false);
    },

    /**
      Deletes a given template for the currently authenticated user in JEM.

      @method deleteTemplate
      @param ownerName the owner the template.
      @param templateName the name of the template.
      @param callback {Function} A callback to handle errors. Must accept an
        error message or null as its first parameter.
    */
    deleteTemplate: function(ownerName, templateName, callback) {
      var handler = function(error, response) {
        callback(error || null);
      };
      var url = [this.url, 'template', ownerName, templateName].join('/');
      return _makeRequest(this.bakery, url, 'DELETE', null, handler, false);
    }
  };

  /**
     Charmstore object for jujulib.

     Provides access to the charmstore API.
   */

  /**
     Initializer

     @function charmstore
     @param url {String} The URL, including scheme and port, of the charmstore
     @param apiVersion {String} The api version, e.g. v4
     @param bakery {Object} A bakery object for communicating with the
         charmstore instance.
     @param processEnity {function} A function to massage entity data into the
        desired form (e.g. turning it into juju gui model objects.
     @returns {Object} A client object for making charmstore API calls.
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
      return this.url + this.version + '/' + endpoint + query;
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
        revisions: extraInfo['bzr-revisions'] || [],
        code_source: {
          location: extraInfo['bzr-url']
        }
      };
      if (meta['supported-series']) {
        processed.series = meta['supported-series']['SupportedSeries'];
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
      @param entityId {String} The id of the charm or bundle's file we want.
      @param filename {String} The path/name of the file to fetch.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getFile: function(entityId, filename, callback) {
      entityId = entityId.replace('cs:', '');
      return _makeRequest(
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
      Makes a request to the charmstore api for the supplied id. Whether that
      be a charm or bundle.

      @method getEntity
      @param entityId {String} The id of the charm or bundle to fetch.
      @params callback {Function} A callback to handle errors or accept the data
          from the request. Must accept an error message or null as its first
          parameter and the response data as its second.
    */
    getEntity: function(entityId, callback) {
      var filters = 'include=bundle-metadata&include=charm-metadata' +
                    '&include=charm-config&include=manifest&include=stats' +
                    '&include=extra-info&include=tags';
      return _makeRequest(
          this.bakery,
          this._generatePath(entityId, filters, '/meta/any'),
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
      qs = qs +
          '&limit=' + (limit || 30) + '&' +
          'include=charm-metadata&' +
          'include=charm-config&' +
          'include=bundle-metadata&' +
          'include=extra-info&' +
          'include=tags&' +
          'include=stats';
      var path = this._generatePath('search', qs);
      return _makeRequest(
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
      return _makeRequest(
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
      return _makeRequest(
        this.bakery,
        path,
        'GET',
        null,
        _transformAuthObject.bind(this, callback),
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
      return _makeRequest(
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
      return _makeRequest(
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
    }
  };


  /**
     The jujulib object, returned by this library.
   */
  var jujulib = {
    charmstore: charmstore,
    jem: jem,
    identity: function() {}
  };

  exports.jujulib = jujulib;

}((module && module.exports) ? module.exports : this));
