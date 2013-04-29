'use strict';


/**
 * Provide data models used for the charm browser.
 *
 * @module models
 * @submodule models.browser
 */
YUI.add('juju-browser-models', function(Y) {

  var models = Y.namespace('juju.models'),
      ns = Y.namespace('juju.models.browser');

  /**
   * The filters are hard coded for now but will need to be updated. The
   * *right* place for them to live isn't obvious at the moment so they may
   * move. There are notes for an API call to provide a list, but we don't
   * want to make sure using that call is in an efficient way and that filters
   * aren't waiting to load and then another wait to get results.
   *
   */
  ns.FILTER_TYPES = {
    'approved': 'Reviewed Charms'
  };

  ns.FILTER_CATEGORIES = {
    'databases': 'Databases',
    'file_servers': 'File Servers',
    'app_servers': 'App Servers',
    'cache_proxy': 'Cache/Proxy',
    'applications': 'Applications',
    'miscellaneous': 'Miscellaneous'
  };

  ns.FILTER_SERIES = {
    'quantal': '12.10 Quantal Quetzal',
    'precise': '12.04 LTS Precise Pangolin'
  };

  ns.FILTER_PROVIDERS = {
    'aws': 'AWS/EC2',
    'hp': 'HP Cloud',
    'lxc': 'LXC',
    'openstack': 'Openstack'
  };


  /**
   * Filter is used for the Browser subapp to maintain the user's charm search
   * filter status across the various views and routes encountered during use.
   *
   * @class Filter
   * @extends {Y.Model}
   *
   */
  ns.Filter = Y.Base.create('filter', Y.Model, [], {
    /**
     * Set up the default filters used to load charms.
     *
     * @method _setDefaults
     * @private
     *
     */
    _setDefaults: function() {
      this.set('series', ['precise']);
      this.set('type', ['approved']);
    },

    /**
       Given the current filters, generate a query string to use for api
       calls.

       @method genQueryString
       @return {String} generated query string.

     */
    genQueryString: function() {
      return Y.QueryString.stringify(this.getFilterData());
    },

    /**
       Helper to generate a nice object from all of the properties we track as
       filters.

       @method getFilterData
       @return {Object} each filter and it's current list of values.

     */
    getFilterData: function() {
      var res = {
        category: this.get('category'),
        provider: this.get('provider'),
        series: this.get('series'),
        text: this.get('text'),
        type: this.get('type')
      };

      // We want to ignore filter properties that are empty to avoid
      // generating query strings that look like &&&type=approved.
      // text is exempt since we can have a text=&type=approved to search for
      // all reviewed charms.
      Y.Object.each(res, function(val, key) {
        // Ignore text.
        if (key !== 'text' && val.length === 0) {
          delete res[key];
        }
      });
      return res;
    },

    /**
     * Model initialization method.
     *
     * @method initializer
     * @param {Object} cfg object attrs override.
     * @return {undefined}
     *
     */
    initializer: function(cfg) {
      this._setDefaults();

      if (cfg) {
        // we've got initial data we need to load into proper arrays and
        // such. We use this update because it turns strings from the query
        // string into a proper array when there is only one selection from
        // the filter group.
        this.update(cfg);
      }
    },

    /**
       Update the current filters given an update object that's keyed on the
       property and the new values to use for it.

       This is used to help pre-populate the filters from the url on an
       initial url load (a shared searc link) as well as updates from the
       widgets that turn into change events that make sure we update the
       current set of filters based on the changes detected in widgets lower
       in the stack.

       @method update
       @param {Object} data the properties to update.
       @return {undefined} nadda

     */
    update: function(data) {
      // If you don't give a real object then pass.
      if (!data || typeof data !== 'object') {
        return;
      }

      // Update each manually as we might get an Array or a single value from
      // the query string update.
      var arrayVals = [
        'category', 'provider', 'series', 'type'
      ];

      Y.Array.each(arrayVals, function(key) {
        if (data[key]) {
          if (data[key] && typeof data[key] === 'string') {
            this.set(key, [data[key]]);
          } else {
            this.set(key, data[key]);
          }
        }
      }, this);

      if (Y.Object.hasKey(data, 'text')) {
        this.set('text', data.text);
      }
    }

  }, {
    ATTRS: {
      category: {
        value: []
      },
      provider: {
        value: []
      },
      series: {
        value: []
      },
      text: {
        value: ''
      },
      type: {
        value: []
      }
    }
  });


}, '0.1.0', {
  requires: [
    'model',
    'querystring-stringify'
  ]
});
