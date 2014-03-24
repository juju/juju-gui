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
   Provide the Application State library.

   @module views
   @submodule views.state
 */

YUI.add('juju-app-state', function(Y) {

  var ns = Y.namespace('juju.models');

  ns.State = Y.Base.create('state', Y.Base, [], {
    /**
       Create an initial state for later url generation.

       @method initializer
     */
    initializer: function() {
      this.old = {
        charmID: null,
        querystring: null,
        hash: null,
        search: null,
        viewmode: null
      };
      this.view = Y.merge(this.old, {});
      this.filter = new ns.Filter();
    },

    /**
       Cleanup after ourselves on destroy.

       @method destructor
     */
    destructor: function() {
      delete this.view;
      this.filter.destroy();
    },

    /**
       Verify that a particular part of the state has changed.

       @method hasChanged
       @param {String} field the part of the state to check.
     */
    hasChanged: function(field) {
      return this.old[field] !== this.view[field];
    },

    /**
       Update the old state with the view state now that we're done processing
       the request.

       @method save
     */
    save: function() {
      this.old = Y.merge(
          this.old,
          this.view);
    },

    /**
      Given the current subapp state, generate a url to pass up to the
      routing code to route to.

      @method getUrl
      @param {Object} change the values to change in the current state.

     */
    getUrl: function(change) {
      var urlParts = [];

      // If there are changes to the filters, we need to update our filter
      // object first, and then generate a new query string for the state to
      // track.
      if (change.filter && change.filter.clear) {
        // If the filter is set to anything else, update it.
        this.filter.clear();
        // We manually force this so that there's not even an empty query
        // string generated to be visible to the user in the url.
        change.querystring = undefined;
      } else if (change.filter && change.filter.replace) {
        this.filter.clear();
        this.filter.update(change.filter);
        change.querystring = this.filter.genQueryString();
      } else if (change.filter) {
        this.filter.update(change.filter);
        change.querystring = this.filter.genQueryString();
      }

      this.view = Y.merge(this.view, change);

      if (this.view.viewmode !== 'sidebar' ||
          this.view.search) {
        // There's no need to add the default view if we
        // don't need it. However it's currently required for search views to
        // match our current routes.
        urlParts.push(this.view.viewmode);
      }

      if (this.view.search) {
        urlParts.push('search');
      } else if (this.old.search) {
        // We had a search, but are moving away; clear the old search.
        this.filter.clear();
      }

      if (this.view.charmID) {
        urlParts.push(this.view.charmID);
      }

      var url = urlParts.join('/');
      if (this.view.querystring) {
        url = Y.Lang.sub('{ url }?{ qs }', {
          url: url,
          qs: this.view.querystring
        });
      }
      if (this.view.hash) {
        url = url + this.view.hash;
      }
      return url;
    },

    /**
       Given the params in the route determine what the new state is going to
       be.

       @method update
       @param {Object} req the request payload.
     */
    update: function(req) {
      // Update the viewmode. Every request has a viewmode.
      var path = req.path,
          params = req.params,
          query = req.query,
          hash = window.location.hash;

      this.view.viewmode = params.viewmode;

      if (hash) {
        // If the hash starts with bws- then reset it to provide backwards
        // compatibility.
        if (hash.indexOf('#bws-') === 0) {
          hash = hash.replace('bws-', '');
        }

        this.view.hash = hash.replace('/', '');
        window.location.hash = this.view.hash;
      }

      // Check for a charm id in the request.
      if (params.id && params.id !== 'search') {
        this.view.charmID = params.id;
      } else {
        this.view.charmID = null;
      }

      // Check for search in the request.
      if (path.indexOf('search') !== -1) {
        this.view.search = true;
      } else {
        this.view.search = false;
      }

      // Check if there's a query string to set.
      if (query) {
        // Store it as a straight string.
        this.view.querystring = Y.QueryString.stringify(query);
      } else {
        this.view.querystring = null;
      }

      this.filter.update(query);

    }

  }, {
    ATTRS: {
    }
  });

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
       Clears all filter data

       @method clear
     */
    clear: function() {
      this.setAttrs({
        categories: [],
        provider: [],
        series: [],
        text: '',
        type: []
      });
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
        categories: this.get('categories'),
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
     * @return {undefined} nadda.
     *
     */
    initializer: function(cfg) {
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
       @return {undefined} nadda.

     */
    update: function(data) {
      // If you don't give a real object then pass.
      if (!data || typeof data !== 'object') {
        return;
      }

      // Update each manually as we might get an Array or a single value from
      // the query string update.
      var arrayVals = [
        'categories', 'provider', 'series', 'type'
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
      /**
        The categories of charm to search filter the search to.

        @attribute categories
        @default []
        @type {Array}
       */
      categories: {
        value: []
      },
      /**
        The providers for charms to filter to.

        @attribute provider
        @default []
        @type {Array}
       */
      provider: {
        value: []
      },
      /**
        The series to filter to for the search.

        @attribute series
        @default []
        @type {Array}
       */
      series: {
        value: []
      },
      /**
        The text to search for.

        @attribute text
        @default ''
        @type {String}
       */
      text: {
        value: ''
      },
      /**
        The type of charms to filter to.

        @attribute type
        @default []
        @type {Array}
       */
      type: {
        value: []
      }
    }
  });
}, '0.1.0', {
  requires: [
    'model'
  ]
});
