'use strict';

/**
 * Provide the CharmStore class.
 *
 * @module store
 * @submodule store.charm
 */

YUI.add('juju-charm-store', function(Y) {

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

}, '0.1.0', {
  requires: [
    'juju-charm-id',
    'datasource-io',
    'json-parse'
  ]
});
