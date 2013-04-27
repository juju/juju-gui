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
    'approved': 'Approved Charms',
    'community': 'Community Charms',
    'environment': 'Environment Charms'
  };

  ns.FILTER_CATEGORIES = {
    'databases': 'Databases',
    'file_servers': 'File Servers',
    'app_servers': 'App Servers',
    'cache_proxy': 'Cache/Proxy',
    'applications': 'Applications',
    'miscellaneous': 'Miscellaneous'
  };

  // Scopes are not in scope for current design.
  ns.FILTER_SCOPES = {
    'public': 'Public Charms',
    'deployed': 'Deployed to Environment'
  };

  ns.FILTER_SERIES = {
    'quantal': '12.10 Quantal Quetzal',
    'precise': '12.04 LTS Precise Pangolin'
  };

  ns.FILTER_PROVIDERS = {
    'aws': 'AWS/EC2',
    'openstack': 'Openstack',
    'hp': 'HP Cloud',
    'lxc': 'LXC'
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
      this.set('category', Y.Object.keys(ns.FILTER_CATEGORIES));
      this.set('provider', [
        'aws',
        'openstack'
      ]);
      this.set('scope', ['public']);
      this.set('series', ['precise']);
      this.set('type', ['approved']);
    },

    /**
     * Given the current filters, generate a query string to use for api
     * calls.
     *
     * @method genQueryString
     *
     */
    genQueryString: function() {
      var filterData = {
        category: this.get('category'),
        provider: this.get('provider'),
        scope: this.get('scope'),
        series: this.get('series'),
        text: this.get('text'),
        type: this.get('type')
      };

      return Y.QueryString.stringify(filterData);
    },

    /**
     * Model initialization method.
     *
     * @method initializer
     * @param {Object} cfg object attrs override.
     *
     */
    initializer: function(cfg) {
      this._setDefaults();
    }
  }, {
    ATTRS: {
      category: {
        value: []
      },
      provider: {
        value: []
      },
      scope: {
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

  ns._filter = null;
  ns.getFilter = function() {
    if (!ns._filter) {
      ns._filter = new ns.Filter();
    }
    return ns._filter;
  };

}, '0.1.0', {
  requires: [
    'model',
    'querystring-stringify'
  ]
});
