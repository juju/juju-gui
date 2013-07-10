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
 * Provide the CharmStore class.
 *
 * @module store
 * @submodule store.charm
 */

YUI.add('juju-charm-store', function(Y) {
  var ns = Y.namespace('juju'),
      models = Y.namespace('juju.models');

  /**
   * The CharmStore class.
   *
   * @class CharmStore
   */
  var CharmStore = Y.Base.create('charm', Y.Base, [], {

    loadByPath: function(path, options) {
      this.get('datasource').sendRequest({
        request: path,
        callback: {
          success: function(io_request) {
            options.success(
                Y.JSON.parse(io_request.response.results[0].responseText));
          },
          failure: options.failure
        }
      });
    },

    /**
     * @method find
     * @param {string} query Either a string that is passed directly to the
     *   search url, or a hash that is marshalled to the correct format (e.g.,
     *   {series:precise owner:charmers}).
     * @return {Object} CharmId instances grouped by series and ordered
     *   within the groups according to the CharmId compare function.
     */
    find: function(query, options) {
      if (!Y.Lang.isString(query)) {
        var operator = query.op || 'intersection',
            join_string = {union: ' OR ', intersection: ' '}[operator],
            tmp = [];
        delete query.op;
        if (!Y.Lang.isValue(join_string)) {
          throw 'Developer error: unknown operator ' + operator;
        }
        Y.each(query, function(val, key) {
          if (Y.Lang.isString(val)) {
            val = [val];
          }
          Y.each(val, function(v) {
            tmp.push(key + ':' + v);
          });
        });
        query = escape(tmp.join(join_string));
      }
      this.get('datasource').sendRequest({
        request: 'search/json?search_text=' + query,
        callback: {
          'success': Y.bind(function(io_request) {
            // To see an example of what is being obtained, look at
            // http://jujucharms.com/search/json?search_text=mysql .
            var result_set = Y.JSON.parse(
                io_request.response.results[0].responseText);
            options.success(
                this._normalizeCharms(
                result_set.results, options.list, options.defaultSeries));
          }, this),
          'failure': options.failure
        }});
    },

    /**
     * Convert the charm data into Charm instances, using only id and
     * relevance.  Group them into series.  The series are arranged with first
     * the defaultSeries, if any, and then all other available series arranged
     * from newest to oldest. Within each series, official charms come first,
     * sorted by relevance if available and package name otherwise; and then
     * owned charms follow, sorted again by relevance, if available, and
     * package name otherwise.
     *
     * @method _normalizeCharms
     */
    _normalizeCharms: function(results, list, defaultSeries) {
      var hash = {},
          relevances = {};
      Y.each(results, function(result) {
        var charm = list.getById(result.store_url);
        if (!charm) {
          charm = list.add(
              { id: result.store_url, summary: result.summary,
                is_subordinate: result.subordinate});
        }
        var series = charm.get('series');
        if (!Y.Lang.isValue(hash[series])) {
          hash[series] = [];
        }
        hash[series].push(charm);
        relevances[charm.get('id')] = result.relevance;
      });
      var series_names = Y.Object.keys(hash);
      series_names.sort(function(a, b) {
        if (a === defaultSeries && b !== defaultSeries) {
          return -1;
        } else if (a !== defaultSeries && b === defaultSeries) {
          return 1;
        } else {
          return -a.localeCompare(b);
        }
      });
      return Y.Array.map(series_names, function(name) {
        var charms = hash[name];
        charms.sort(function(a, b) {
          return a.compare(
              b, relevances[a.get('id')], relevances[b.get('id')]);
        });
        return {series: name, charms: hash[name]};
      });
    }
  }, {
    ATTRS: {
      datasource: {
        setter: function(val) {
          if (Y.Lang.isString(val)) {
            val = new Y.DataSource.IO({ source: val });
          }
          return val;
        }
      }
    }
  });
  Y.namespace('juju').CharmStore = CharmStore;


  /**
   * Api helper for the updated charmworld api v1.
   *
   * @class Charmworld2
   * @extends {Base}
   *
   */
  ns.Charmworld2 = Y.Base.create('charmworld2', Y.Base, [], {
    _apiRoot: 'api/2',

    /**
     * Send the actual request and handle response from the api.
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

      // Any query string args need to be put onto the endpoint for calling.
      if (args) {
        apiEndpoint = apiEndpoint + '?' + Y.QueryString.stringify(args);
      }

      this.get('datasource').sendRequest({
        request: apiEndpoint,
        callback: {
          success: function(io_request) {
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
     * Api call to fetch autocomplete suggestions based on the current term.
     *
     * @method autocomplete
     * @param {Object} query the filters data object for search.
     * @param {Object} filters the filters data object for search.
     * @param {Object} callbacks the success/failure callbacks to use.
     * @param {Object} bindScope the scope of *this* in the callbacks.
     */
    autocomplete: function(filters, callbacks, bindScope) {
      var endpoint = 'charms';
      // Force that this is an autocomplete call to perform matching on the
      // start of names vs a fulltext search.
      filters.autocomplete = true;
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }
      this._makeRequest(endpoint, callbacks, filters);
    },

    /**
     * Api call to fetch a charm's details.
     *
     * @method charm
     * @param {String} charmID the charm to fetch.
     * @param {Object} callbacks the success/failure callbacks to use.
     * @param {Object} bindScope the scope of *this* in the callbacks.
     *
     */
    charm: function(charmID, callbacks, bindScope) {
      var endpoint = 'charm/' + charmID;
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }

      this._makeRequest(endpoint, callbacks);
    },

    /**
     * Api call to search charms
     *
     * @method search
     * @param {Object} filters the filters data object for search.
     * @param {Object} callbacks the success/failure callbacks to use.
     * @param {Object} bindScope the scope of *this* in the callbacks.
     */
    search: function(filters, callbacks, bindScope) {
      var endpoint = 'charms';
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }
      this._makeRequest(endpoint, callbacks, filters);
    },

    /**
     * Fetch the contents of a charm's file.
     *
     * @method file
     * @param {String} charmID the id of the charm's file we want.
     * @param {String} filename the path/name of the file to fetch content.
     * @param {Object} callbacks the success/failure callbacks.
     * @param {Object} bindScope the scope for this in the callbacks.
     *
     */
    file: function(charmID, filename, callbacks, bindScope) {
      // If we're in the noop state, just call the error callback.
      if (this.get('noop')) {
        callbacks.failure('noop failure');
        return;
      }

      var endpoint = 'charm/' + charmID + '/file/' + filename;
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }

      this.get('datasource').sendRequest({
        request: endpoint,
        callback: {
          success: function(io_request) {
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
      Generate the API path to a file.
      This is useful when generating links and references in HTML to a file
      but not actually fetching the file itself.

      @method filepath
      @param {String} charmID The id of the charm to grab the file from.
      @param {String} filename The name of the file to generate a path to.

     */
    filepath: function(charmID, filename) {
      return this.get('apiHost') + [
        this._apiRoot,
        'charm',
        charmID,
        'file',
        filename].join('/');
    },

    /**
     * Load the QA data for a specific charm.
     *
     * @method qa
     * @param {String} charmID the charm to fetch qa data for.
     * @param {Object} callbacks the success/failure callbacks to use.
     * @param {Object} bindScope the scope for 'this' in the callbacks.
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
     * Given a result list, turn that into a BrowserCharmList object for the
     * application to use. Metadata is appended to the charm as data.
     *
     * @method _resultsToCharmlist
     * @param {Object} JSON decoded data from response.
     * @private
     *
     */
    resultsToCharmlist: function(data) {
      // Append the metadata to the actual charm object.
      var preppedData = Y.Array.map(data, function(charmData) {
        if (charmData.metadata) {
          charmData.charm.metadata = charmData.metadata;
        }
        return charmData.charm;
      });
      return new Y.juju.models.BrowserCharmList({
        items: preppedData
      });
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
      // @todo this isn't set on initial load so we have to manually hit the
      // setter to get datasource filled in. Must be a better way.
      this.set('apiHost', cfg.apiHost);
    },

    /**
     * Fetch the interesting landing content from the charmworld api.
     *
     * @method interesting
     * @return {Object} data loaded from the api call.
     *
     */
    interesting: function(callbacks, bindScope) {
      if (bindScope) {
        callbacks.success = Y.bind(callbacks.success, bindScope);
        callbacks.failure = Y.bind(callbacks.failure, bindScope);
      }

      this._makeRequest('charms/interesting', callbacks);
    },

    /**
      Fetch the related charm info from the charmworld api.

      @method related
      @param {String} charmID The charm to find related charms for.
      @param {Object} callbacks The success/failure callbacks to use.
      @param {Object} bindscope An object scope to perform callbacks in.
      @return {Object} data loaded from the api call.

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
       * Required attribute for the host to talk to for api calls.
       *
       * @attribute apiHost
       * @default undefined
       * @type {String}
       *
       */
      apiHost: {
        required: true,
        setter: function(val) {
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
      datasource: {},

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
    'querystring-stringify'
  ]
});
