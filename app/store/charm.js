'use strict';

YUI.add('juju-charm-store', function(Y) {

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
    // The query can be a string that is passed directly to the search url, or a
    // hash that is marshalled to the correct format (e.g., {series:precise,
    // owner:charmers}).
    find: function(query, options) {
      if (!Y.Lang.isString(query)) {
        var tmp = [];
        Y.each(query, function(val, key) {
          tmp.push(key + ':' + val);
        });
        query = escape(tmp.join(' '));
      }
      this.get('datasource').sendRequest({
        request: 'search/json?search_text=' + query,
        callback: {
          'success': Y.bind(function(io_request) {
            // To see an example of what is being obtained, look at
            // http://jujucharms.com/search/json?search_text=mysql .
            var result_set = Y.JSON.parse(
                io_request.response.results[0].responseText);
            console.log('results update', result_set);
            options.success(
                this._normalizeCharms(
                result_set.results, options.defaultSeries));
          }, this),
          'failure': options.failure
        }});
    },
    // Stash the base id on each charm, convert the official "charmers" owner to
    // an empty owner, and group the charms within series.  The series are
    // arranged with first the defaultSeries, if any, and then all other
    // available series arranged from newest to oldest. Within each series,
    // official charms come first, sorted by relevance if available and package
    // name otherwise; and then owned charms follow, sorted again by relevance
    // if available and package name otherwise.
    _normalizeCharms: function(charms, defaultSeries) {
      var hash = {};
      Y.each(charms, function(charm) {
        charm.baseId = charm.series + '/' + charm.name;
        if (charm.owner === 'charmers') {
          charm.owner = null;
        } else {
          charm.baseId = '~' + charm.owner + '/' + charm.baseId;
        }
        charm.baseId = 'cs:' + charm.baseId;
        if (!Y.Lang.isValue(hash[charm.series])) {
          hash[charm.series] = [];
        }
        hash[charm.series].push(charm);
      });
      var series_names = Y.Object.keys(hash);
      series_names.sort(function(a, b) {
        if (a === defaultSeries && b !== defaultSeries) {
          return -1;
        } else if (a !== defaultSeries && b === defaultSeries) {
          return 1;
        } else if (a > b) {
          return -1;
        } else if (a < b) {
          return 1;
        } else {
          return 0;
        }
      });
      return Y.Array.map(series_names, function(name) {
        var charms = hash[name];
        charms.sort(function(a, b) {
          // If !a.owner, that means it is owned by charmers.
          if (!a.owner && b.owner) {
            return -1;
          } else if (a.owner && !b.owner) {
            return 1;
          } else if (a.relevance < b.relevance) {
            return 1; // Higher relevance comes first.
          } else if (a.relevance > b.relevance) {
            return -1;
          } else if (a.name < b.name) {
            return -1;
          } else if (a.name > b.name) {
            return 1;
          } else if (a.owner < b.owner) {
            return -1;
          } else if (a.owner > b.owner) {
            return 1;
          } else {
            return 0;
          }
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
    'datasource-io',
    'json-parse'
  ]
});
