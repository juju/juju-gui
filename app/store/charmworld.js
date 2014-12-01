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

/**
 * Provide the Charmworld API datastore class.
 *
 * @module store
 * @submodule store.charm
 */

YUI.add('juju-charm-store', function(Y) {
  var juju = Y.namespace('juju'),
      ns = Y.namespace('juju.charmworld'),
      models = Y.namespace('juju.models');

  // Make Y.juju.charmworld refernce the "juju.charmworld" namespace.
  juju.charmworld = ns;

  ns.ApiHelper = Y.Base.create('ApiHelper', Y.Base, [], {

    /**
      Initializer for the class.

      @method initializer
      @param {Object} cfg The configuration for the API interface.
      @return {undefined} Nothing.
    */
    initializer: function(cfg) {
      this.sendRequest = cfg.sendRequest;
    },

    /**
      Send a request and handle the response from the API.

      @method makeRequest
      @param {Object} args any query params and arguments required.
      @return {undefined} Nothing.
    */
    makeRequest: function(apiEndpoint, callbacks, args) {
      // Any query string args need to be put onto the endpoint for calling.
      if (args) {
        apiEndpoint = apiEndpoint + '?' + Y.QueryString.stringify(args);
      }

      return this.sendRequest({
        request: apiEndpoint,
        callback: {
          'success': function(io_request) {
            var res = Y.JSON.parse(
                io_request.response.results[0].responseText
                );
            callbacks.success(res);
          },

          'failure': function(io_request) {
            var respText = io_request.response.results[0].responseText,
                res;
            if (respText) {
              res = Y.JSON.parse(respText);
            }
            callbacks.failure(res, io_request);
          }
        }
      });
    },

    /**
      Normalize a charm name so we can request its full data. Charm lookup
      requires a very specific form of the charm identifier.

      series/charm-revision

      where revision can currently (API v2) be any numeric placeholder.

      @method normalizeCharmId
      @param {String} charmId to normalize.
      @param {String} [defaultSeries='precise'] The series to use if none is
        specified in the charm ID.
      @return {String} normalized id.
    */
    normalizeCharmId: function(charmId, defaultSeries) {
      var result = charmId;
      if (/^(cs:|local:)/.exec(result)) {
        result = result.slice(result.indexOf(':') + 1);
      }

      if (result.indexOf('/') === -1) {
        if (!defaultSeries) {
          console.warn('No default series provided when normalizing charm ' +
              'ID.  Using "precise".');
          defaultSeries = 'precise';
        }
        result = defaultSeries + '/' + result;
      }
      return result;
    }

  }, {
    ATTRS: {
    }
  });

  /**
   * Charmworld API version 3 interface.
   *
   * @class APIv3
   * @extends {Base}
   *
   */
  ns.APIv3 = Y.Base.create('APIv3', Y.Base, [], {
    _apiRoot: 'api/3',

    /**
      * Send the actual request and handle response from the API.
      *
      * @method _makeRequest
      * @param {Object} args any query params and arguments required.
      * @private
      *
      */
    _makeRequest: function(apiEndpoint, callbacks, args) {
      // If we're in the noop state, just call the error callback.
      if (this.get('noop')) {
        callbacks.failure('noop failure');
        return;
      }
      // Delegate the request making to the helper object.
      return this.apiHelper.makeRequest(apiEndpoint, callbacks, args);
    },

    /**
      Public method to make an API call to fetch a bundle from Charmworld.

      @method bundle
      @param {String} bundleId The bundle to fetch This is the fully qualified
        bundle id.
      @param {Object} callbacks The success/failure callbacks to use.
      @param {Object} bindScope The scope of "this" in the callbacks.
    */
    bundle: function(bundleId, callbacks, bindScope) {
      this._bundle(bundleId, callbacks, bindScope);
    },

    /**
      API call to fetch a bundle's details.

      @method _bundle
      @param {String} bundleID the bundle to fetch.
      @param {Object} callbacks the success/failure callbacks to use.
      @param {Object} bindScope the scope of *this* in the callbacks.
    */
    _bundle: function(bundleID, callbacks, bindScope) {
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }
      this._makeRequest(bundleID, callbacks);
    },

    /**
     Fetch a bundle's details, returning a promise.

     @method promiseBundle
     @param {String} bundleId The ID of the charm to fetch.
     @param {Object} bindScope The scope of "this" in the callbacks.
     @return {Promise} Returns a promise. Triggered with the result of calling
       this.charm.
    */
    promiseBundle: function(bundleId, bindScope) {
      var self = this;
      return Y.Promise(function(resolve, reject) {
        self.bundle(bundleId,
                    { 'success': resolve, 'failure': reject },
                    bindScope);
      });
    },


    /**
     * API call to fetch a charm's details.
     *
     * @method charm
     * @param {String} charmID the charm to fetch.
     * @param {Object} callbacks the success/failure callbacks to use.
     * @param {Object} bindScope the scope of *this* in the callbacks.
     *
     */
    _charm: function(charmID, callbacks, bindScope) {
      var endpoint = 'charm/' + charmID;
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }

      this._makeRequest(endpoint, callbacks);
    },

    /**
     * API call to fetch a charm's details, with an optional local cache.
     *
     * @method charmWithCache
     * @param {String} charmID The charm to fetch This is the fully qualified
     *   charm name in the format scheme:series/charm-revision.
     * @param {Object} callbacks The success/failure callbacks to use.
     * @param {Object} bindScope The scope of "this" in the callbacks.
     * @param {ModelList} [cache] a local cache of browser charms.
     * @param {String} [defaultSeries='precise'] The series to use if none is
     *  specified in the charm ID.
     */
    charm: function(charmID, callbacks, bindScope, cache, defaultSeries) {
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
      }
      if (cache) {
        var charm = cache.getById(charmID);
        if (charm) {
          // If the charm was found in the cache, then we can declare success
          // without ever making a request to charmworld.
          Y.soon(function() {
            // Since there wasn't really a request, there is no data, so we
            // pass an empty object as the "data" parameter.
            callbacks.success({}, charm);
          });
          return;
        } else {
          var successCB = callbacks.success;
          callbacks.success = function(data) {
            var charm = new Y.juju.models.Charm(data.charm);
            if (data.metadata) {
              charm.set('metadata', data.metadata);
            }
            cache.add(charm);
            successCB(data, charm);
          };
        }
      }
      this._charm(this.apiHelper.normalizeCharmId(charmID, defaultSeries),
                  callbacks, bindScope);
    },

    /**
     Like the "charm" method but returning a Promise.

     @method promiseCharm
     @param {String} charmId The ID of the charm to fetch.
     @param {ModelList} cache A local cache of browser charms.
     @param {String} [defaultSeries='precise'] The series to use if none is
       specified in the charm ID.
     @return {Promise} Returns a promise. Triggered with the result of calling
       this.charm.
    */
    promiseCharm: function(charmId, cache, defaultSeries) {
      var self = this;
      return Y.Promise(function(resolve, reject) {
        self.charm(charmId, { 'success': resolve, 'failure': reject },
            self, cache, defaultSeries);
      });
    },

    /**
      Promises to return the latest charm ID for a given charm if a newer one
      exists; this also caches the newer charm if one is available.

      @method promiseUpgradeAvailability
      @param {Charm} charm An existing charm potentially in need of an upgrade.
      @param {ModelList} cache A local cache of browser charms.
      @return {Promise} A promise for a newer charm ID or undefined.
    */
    promiseUpgradeAvailability: function(charm, cache) {
      // Get the charm's store ID, then remove the version number to retrieve
      // the latest version of the charm.
      var storeId, revision;
      if (charm instanceof Y.Model) {
        storeId = charm.get('storeId');
        revision = parseInt(charm.get('revision'), 10);
      } else {
        storeId = charm.url;
        revision = parseInt(charm.revision, 10);
      }
      storeId = storeId.replace(/-\d+$/, '');
      // XXX By using a cache we hide charm versions that have become available
      // since we last requested the most recent version.
      return this.promiseCharm(storeId, cache)
        .then(function(latest) {
            var latestVersion = parseInt(latest.charm.id.split('-').pop(), 10);
            if (latestVersion > revision) {
              return latest.charm.id;
            }
          }, function(e) {
            throw e;
          });
    },

    /**
     * API call to search charms
     *
     * @method search
     * @param {Object} filters the filters data object for search.
     * @param {Object} callbacks the success/failure callbacks to use.
     * @param {Object} bindScope the scope of *this* in the callbacks.
     */
    search: function(filters, callbacks, bindScope) {
      var endpoint = 'search';
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }
      return this._makeRequest(endpoint, callbacks, filters);
    },

    /**
     * Fetch the contents of a charm's file.
     *
     * @method file
     * @param {String} entityId The id of the charm's file we want.
     * @param {String} filename The path/name of the file to fetch content.
     * @param {String} entityType Either 'charm' or 'bundle'.
     * @param {Object} callbacks The success/failure callbacks.
     * @param {Object} bindScope The scope for this in the callbacks.
     *
     */
    file: function(entityId, filename, entityType, callbacks, bindScope) {
      // If we're in the noop state, just call the error callback.
      if (this.get('noop')) {
        callbacks.failure('noop failure');
        return;
      }

      var endpoint = entityType + '/' + entityId + '/file/' + filename;
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }

      this.get('datasource').sendRequest({
        request: endpoint,
        callback: {
          'success': function(io_request) {
            callbacks.success(io_request.response.results[0].responseText);
          },
          'failure': function(io_request) {
            var respText = io_request.response.results[0].responseText,
                res;
            if (respText) {
              res = Y.JSON.parse(respText);
            }
            callbacks.failure(res, io_request);
          }
        }
      });
    },

    /**
     * Generate the url to an icon for the category specified.
     *
     * @method buildCategoryIconPath
     * @param {String} categoryID the id of the category to load an icon for.
     *
     */
    buildCategoryIconPath: function(categoryID) {
      return [
        this.get('apiHost'),
        'static/img/category-',
        categoryID,
        '-bw.svg'
      ].join('');
    },

    /**
     * Load the QA data for a specific charm.
     *
     * @method qa
     * @param {String} charmID The charm to fetch QA data for.
     * @param {Object} callbacks The success/failure callbacks to use.
     * @param {Object} bindScope The scope for 'this' in the callbacks.
     *
     */
    qa: function(charmID, callbacks, bindScope) {
      var endpoint = 'charm/' + charmID + '/qa';
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }
      this._makeRequest(endpoint, callbacks);
    },

    /**
     * Given a result list, metadata is appended to the charm or bundle
     * as the 'metadata' attribute and convert to objects.
     *
     * @method transformResults
     * @param {Object} JSON decoded data from response.
     * @return {Array} List of charm and bundle objects.
     *
     */
    transformResults: function(data) {
      // Append the metadata to the actual token object.
      var token;
      var tokens;
      tokens = Y.Array.map(data, function(entity) {
        if (Y.Lang.isValue(entity.charm)) {
          token = new Y.juju.models.Charm(entity.charm);
        } else {
          token = new Y.juju.models.Bundle(entity.bundle);
        }
        if (entity.metadata) {
          token.set('metadata', entity.metadata);
        }
        return token;
      });
      return tokens;
    },

    /**
     * Initialize the API helper. Constructs a reusable datasource for all
     * calls.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {
      // XXX This isn't set on initial load so we have to manually hit the
      // setter to get datasource filled in. Must be a better way.
      this.set('apiHost', cfg.apiHost);
    },

    /**
     * Fetch the interesting landing content from the charmworld API.
     *
     * @method interesting
     * @return {Object} data loaded from the API call.
     *
     */
    interesting: function(callbacks, bindScope) {
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }

      return this._makeRequest('search/interesting', callbacks);
    },

    /**
      Cancels the inflight datasource io request which is associated with the
      passed in request id.

      @method cancelInFlightRequest
      @param {Integer} requestId The requestId to cancel.
    */
    cancelInFlightRequest: function(requestId) {
      var transaction = Y.DataSource.Local.transactions[requestId];
      if (transaction) {
        transaction.abort();
      }
    },

    /**
      Fetch the related charm info from the charmworld API.

      @method related
      @param {String} charmID The charm to find related charms for.
      @param {Object} callbacks The success/failure callbacks to use.
      @param {Object} bindscope An object scope to perform callbacks in.
      @return {Object} data loaded from the API call.

     */
    related: function(charmID, callbacks, bindScope) {
      var endpoint = 'charm/' + charmID + '/related';
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }
      this._makeRequest(endpoint, callbacks);
    }
  }, {
    ATTRS: {
      /**
       * Required attribute for the host to talk to for API calls.
       *
       * @attribute apiHost
       * @default undefined
       * @type {String}
       *
       */
      apiHost: {
        required: true,
        'setter': function(val) {
          if (val && !val.match(/\/$/)) {
            val = val + '/';
          }
          // Make sure we update the datasource if our apiHost changes.
          var source = val + this._apiRoot + '/';
          this.set('datasource', new Y.DataSource.IO({ source: source }));
          return val;
        }
      },

      /**
       * Auto constructed datasource object based on the apiHost attribute.
       * @attribute datasource
       * @type {Datasource}
       *
       */
      datasource: {
        'setter': function(datasource) {
          // Construct an API helper using the new datasource.
          this.apiHelper = new ns.ApiHelper({
            sendRequest: Y.bind(datasource.sendRequest, datasource)
          });
          return datasource;
        }
      },

      /**
        If there's no config we end up setting noop on the store so that tests
        that don't need to worry about the browser can safely ignore it.

        We do log a console error, so those will occur on these tests to help
        make it easy to catch an issue when you don't mean to noop the store.

        @attribute noop
        @default false
        @type {Boolean}

       */
      noop: {
        value: false
      }
    }
  });

}, '0.1.0', {
  requires: [
    'datasource-io',
    'json-parse',
    'juju-charm-models',
    'juju-bundle-models',
    'promise',
    'querystring-stringify'
  ]
});
