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

  // XXX This is the new version of the State object which is used under
  // feature flag until it's complete, at which point it will be renamed
  // back to State.
  ns.UIState = Y.Base.create('state', Y.Base, [], {
    /**
     * Create an initial state for later url generation.
     *
     * @method initializer
     */
    initializer: function() {
      this.filter = new ns.Filter();
    },

    /**
     * Cleanup after ourselves on destroy.
     *
     * @method destructor
     */
    destructor: function() {
      this.filter.destroy();
    },

    /**
     * Verify that a particular part of the state has changed.
     *
     * @method hasChanged
     * @param {String} section the section that the field is in.
     * @param {String} field the part of the state to check.
     */
    hasChanged: function(section, field) {
      var previous = this.getState('previous', section, field);
      var current = this.getState('current', section, field);
      return previous !== current;
    },

    /**
      Get the value for the supplied state.

      @method getState
      @param {String} state 'current' or 'previous' state value.
      @param {String} section The section that the field is in.
      @param {String} field The part of the state to get.
    */
    getState: function(state, section, field) {
      var stateObj = this.get(state),
          sectionObj = stateObj[section],
          value;
      if (sectionObj) { value = sectionObj[field]; }
      return value;
    },

    /**
      This takes a full state object which was parsed in the `loadRequest`
      method and saves it in `_current` moving the `_current` value into
      `_previous`. Then dispatching the new state object to the UI section
      dispatchers.

      @method saveState
      @param {Object} state The state object from loadRequest
    */
    saveState: function(state) {
      this.set('previous', Y.clone(this.get('current'))); // clones the object.
      this.set('current', state);
      this.dispatch(state);
      return state;
    },

    /**
      Checks to see if the sections components have changed and then empties
      them out and then dispatches for the appropriate section.

      This method can be called from anywhere as long as it's passed a valid
      complete state object.

      @method dispatch
      @param {Object} state The current state object.
    */
    dispatch: function(state) {
      var sections = ['sectionA', 'sectionB'];
      // If the component of a section has changed then clean out that section.
      sections.forEach(function(section) {
        if (this.hasChanged(section, 'component')) {
          this._emptySection(section);
        }
        this._dispatchSection(section, state[section]);
      }, this);
    },

    /**
      Calls the appropriate dispatch method for the section.

      @method _dispatchSection
      @param {String} section The section to dispatch.
      @param {Object} state The current state object for the section.
    */
    _dispatchSection: function(section, state) {
      var sections = {
        sectionA: 'SectionA',
        sectionB: 'SectionB'
      };
      // calls _dispatchSectionA or _dispatchSectionB
      this['_dispatch' + sections[section]](state);
    },

    /**
      Calls the dispatcher subscribed on instantiation for the sectionA
      component.

      @method _dispatchSectionA
      @param {Object} state SectionA's state object.
    */
    _dispatchSectionA: function(state) {
      this.get('dispatchers').sectionA[state.component](state.metadata);
    },

    /**
      Calls the dispatcher subscribed on instantiation for the sectionB
      component.

      @method _dispatchSectionB
      @param {Object} state SectionB's state object.
    */
    _dispatchSectionB: function(state) {
      this.get('dispatchers').sectionB[state.component](state.metadata);
    },

    /**
      Calls the subscribed empty method for the passed in section.

      @method _emptySection
      @param {String} section The section to call the empty listener on.
    */
    _emptySection: function(section) {
      this.get('dispatchers')[section].empty();
    },

    /**
      Given a valud state change object, generate a url which the application
      can route to.

      @method generateUrl
      @param {Object} change A valid change object
        ex) {
          sectionA: {
            component: 'inspector',
            metadata: {}
          }
        }
    */
    generateUrl: function(change) {
      // Generate the new state temporarily.
      var newState = Y.mix(this.get('current'), change, true);
      var component, metadata, sectionState, searchQuery, id,
          genUrl = '',
          query = {},
          hash = '',
          urlParts = [];
      // Loop through each section in the state to generate the urls.
      Object.keys(newState).forEach(function(section) {
        sectionState = newState[section];
        component = sectionState.component;
        metadata = sectionState.metadata || {};
        id = metadata.id;
        // Compress the id to remove default values.
        if (id) { id = id.replace(/\/?~charmers/, ''); }
        // All pushes to the urlParts array needs to be in a truthy conditional
        // because no state parameters are required.
        if (component === 'charmbrowser') {
          // If the query params get more complex than just 'search' then
          // the query parsing should be split out into it's own method.
          searchQuery = metadata.search;
          if (searchQuery) { query.text = searchQuery; }
          hash = metadata.hash || '';
          if (id) { urlParts.push(id); }
        } else {
          if (component) { urlParts.push(component); }
          if (component === 'inspector') {
            if (id) { urlParts.push(id); }
            if (metadata.unit) { urlParts.push('unit/' + metadata.unit); }
            if (metadata.charm) { urlParts.push('charm'); }
          }
          if (component === 'machine') {
            // With machine view the id is optional.
            if (id) { urlParts.push(id); }
            if (metadata.container) { urlParts.push(metadata.container); }
          }
        }
      }, this);

      var url;
      // There will be no parts if all of the section state objects are empty.
      // So set the navigate url to root.
      if (urlParts.length === 0) {
        url = '/';
      } else {
        url = '/' + urlParts.join('/') + '/';
      }
      // Add the query string to the end of the url.
      if (Y.Object.size(query) > 0) {
        url = url.replace(/\/$/, '');
        url += '?' + Y.QueryString.stringify(query);
      }
      // Add the hash to the end of the url.
      if (hash.length > 0) { url += '#' + hash; }
      return url;
    },

    /**
      Takes the url request object from the Y.Router and parses it into the
      appropriate state object.

      @method loadRequest
      @param {Object} req Y.Router request object.
      @param {string} hash The hash from window.location.hash.
      @return {Object} The state object which outlines what the application
        should render.
    */
    loadRequest: function(req, hash) {
      var url = req.path,
          query = req.query,
          state = {};
      // Strip the leading and trailing slashes off the url if it has them.
      url = url.replace(/^\//, '').replace(/\/$/, '');
      // Strip any viewmodes which may be in the url from previous bookmarks.
      url = this._stripViewmode(url);
      // Strip the search param out of the url. It is an old path which is no
      // longer used. Instead any text=foo query param is treated as a
      // search query.
      url = url.replace(/^search\/?/, '');
      // Split the url into its sections for the state object.
      var paths = this._splitIntoComponents(url);
      // Organize the paths into their sections.
      state = this._buildSections(paths, query && query.text, hash);
      this.saveState(state);
      return state;
    },

    /**
      Takes the paths supplied by _splitIntoComponents and organizes them
      hierarchically by UI section.

      @method _buildSections
      @param {Array} paths The paths of the URL.
      @param {String} query The text of the search query value.
      @param {string} hash The hash from window.location.hash.
      @return {Object} The section delimited state object.
    */
    _buildSections: function(paths, query, hash) {
      var state = { sectionA: {}, sectionB: {} };
      // Loop through each part and dispatch each part to the appropriate url
      // parse method.
      paths.forEach(function(part) {
        // We check if it's at 0 index in case someone has a service/machine
        // called 'inspector' or 'machine' etc.
        if (part.indexOf('inspector') === 0) {
          state.sectionA = this._addToSection({
            component: 'inspector',
            metadata: this._parseInspectorUrl(part)
          });
        } else if (part.indexOf('machine') === 0) {
          state.sectionB = this._addToSection({
            component: 'machine',
            metadata: this._parseMachineUrl(part)
          });
        } else if (part.length > 0) {
          // If it's not an inspector or machine and it's more than 0 characters
          // then it's a charm url.
          // The window.location.hash property is '#undefined' if no hash is
          // set in phantomjs so this is a hack to workaround that bug.
          hash = hash || window.location.hash;
          if (hash === '#undefined') { hash = undefined; }
          // We only support hashes for the charm urls.
          state.sectionA = this._addToSection({
            component: 'charmbrowser',
            metadata: this._parseCharmUrl(part, hash)
          });
        }
      }, this);
      if (query) {
        // `state` is passed in by reference and modified in place.
        this._addQueryState(state, query);
      }
      return state;
    },
    /**
      Adds the query params to their appropriate sections in the state object.

      Because you can provide query params without specifying a base component
      we need to add the query param data into the state after the rest of the
      state has been parsed.

      @method _addQueryState
      @param {Object} state The built state object.
      @param {String} query The text of the search query value.
    */
    _addQueryState: function(state, query) {
      // Right now we only support a single query param 'text' and it's for
      // search. When more are added this method is where we can add the
      // additional complexity.
      Y.namespace.call(state, 'sectionA.metadata.search');
      Y.namespace.call(state, 'sectionA.component');
      state.sectionA.component = 'charmbrowser';
      state.sectionA.metadata.search = query;
    },

    /**
      Adds the supplied configuration parameters into the section defined.

      @method _addToSection
      @param {Object} config The config to generate the section parameters.
        ex) {
          component: 'charmbrowser',
          metadata: this._parseCharmUrl(part, hash);
        }
    */
    _addToSection: function(config) {
      var sectionState = {};
      var metadata = config.metadata;
      sectionState.component = config.component;
      if (metadata && Y.Object.size(metadata) > 0) {
        sectionState.metadata = metadata;
      }
      return sectionState;
    },

    /**
      Parse the inspector url into a state object.

      @method _parseInspectorUrl
      @param {String} url Inspector url to be parsed.
      @return {Object} State object to be added to the inspector state.
    */
    _parseInspectorUrl: function(url) {
      url = url.replace(/^inspector\/?/, '');
      var parts = url.split('/'),
          state = {};
      // If the url is only /inspector/ and that's stripped then just return
      // because it's an invalid url so it should render the charmstore.
      if (parts[0] === '') { return; }
      // The first index is always the service id except for above.
      state.id = parts[0];
      if (parts[1]) {
        state[parts[1]] = parts[2] || true;
      }
      return state;
    },

    /**
      Parse the machine url into a state object.

      @method _parseMachineUrl
      @param {String} url Machine url to be parsed.
      @return {Object} State object to be added to the machine state.
    */
    _parseMachineUrl: function(url) {
      url = url.replace(/^machine\/?/, '');
      var parts = url.split('/'),
          state = {};
      // If the url is 'machine' then there is no extra state.
      if (parts[0] !== '') {
        state.id = parts[0];
        if (parts[1]) {
          state.container = parts[1];
        }
      }
      return state;
    },

    /**
      Parse the charm url into a state object.

      @method _parseCharmUrl
      @param {String} url charm url to be parsed.
      @param {string} hash The hash from window.location.hash.
      @return {Object} State object to be added to the charm state.
    */
    _parseCharmUrl: function(url, hash) {
      var state = {};
      if (url) { state.id = url; }
      if (hash) {
        // There are legacy hashes which have a 'bws_' prefix. This strips the
        // bws to allow it to fall through to it's real value
        hash = hash.replace(/^bws_/, '');
        state.hash = hash;
      }
      return state;
    },

    /**
      Splits the url up into the various sections supported by the application.

      @method _splitintoComponents
      @param {String} url The req.path from the Y.router request object.
      @return {Array} The url split into it's sections.
    */
    _splitIntoComponents: function(url) {
      var sections = ['machine', 'inspector'],
          parts = [],
          indexes = [];
      sections.forEach(function(section) {
        var idx = url.indexOf(section);
        if (idx >= 0) {
          indexes.push(idx);
        }
      });
      indexes.sort();
      // If the first part of the url isn't part of a section then store it.
      if (indexes[0] !== 0) {
        parts.push(url.substr(0, indexes[0]));
      }
      // Split out and store the sections .
      indexes.forEach(function(index, arIndex) {
        var end = indexes[arIndex + 1] || url.length;
        var chars = end - index;
        parts.push(url.substr(index, chars));
      });
      // Strip any leading and trailing slashes off the sections.
      parts.forEach(function(part, idx) {
        parts[idx] = part.replace(/^\//, '').replace(/\/$/, '');
      });
      return parts;
    },

    /**
      Old urls which users may still have bookmarked may have a viewmode prefix.
      If it does we need to strip that viewmode from the path.

      The urls that are passed to this method should already have its leading
      and trailing slashes removed.

      @method _stripViewmode
      @param {String} path The path value from the Y.Router request object.
      @return {String} the path without a viewmode.
    */
    _stripViewmode: function(path) {
      // Remove the viewmode and any trailing slash if there is one
      return path.replace(/^fullscreen\/?|sidebar\/?|minimized\/?/, '');
    }

  }, {
    ATTRS: {
      /**
        The current state value

        @attribute current
        @type {Object}
        @default {}
      */
      current: {
        value: {}
      },
      /**
        The previous state value

        @attribute previous
        @type {Object}
        @default {}
      */
      previous: {
        value: {}
      },
      /**
        Supplied methods for section ui dispatching

        @attribute dispatchers
        @type {Object}
        @default {}
      */
      dispatchers: {
        value: {}
      }
    }
  });




  ns.State = Y.Base.create('state', Y.Base, [], {
    /**
     * Set the value for the current state. Protected because clients should
     * provide new values for the state via the
     * {{#crossLink "loadRequest:method"}} method.
     *
     * @method _setCurrent
     * @protected
     * @param {String} field the part of the state to set.
     * @param {String} value the new value.
     */
    _setCurrent: function(field, value) {
      this._current[field] = value;
    },

    /**
     * Set the value for the previous state. Protected because clients should
     * provide new values for the state via the
     * {{#crossLink "loadRequest:method"}} method.
     *
     * @method _setPrevious
     * @protected
     * @param {String} field the part of the state to set.
     * @param {String} value the new value.
     */
    _setPrevious: function(field, value) {
      this._previous[field] = value;
    },

    /**
     * Create an initial state for later url generation.
     *
     * @method initializer
     */
    initializer: function() {
      this._previous = {
        charmID: null,
        querystring: null,
        hash: null,
        search: null,
        viewmode: null
      };
      this._current = Y.merge(this._previous, {});
      this.filter = new ns.Filter();
    },

    /**
     * Cleanup after ourselves on destroy.
     *
     * @method destructor
     */
    destructor: function() {
      delete this._current;
      this.filter.destroy();
    },

    /**
     * Verify that a particular part of the state has changed.
     *
     * @method hasChanged
     * @param {String} field the part of the state to check.
     */
    hasChanged: function(field) {
      return this.getPrevious(field) !== this.getCurrent(field);
    },

    /**
     * Get the value for the current state.
     *
     * @method getCurrent
     * @param {String} field the part of the state to get.
     */
    getCurrent: function(field) {
      return this._current[field];
    },

    /**
     * Get the value for the previous state.
     *
     * @method getPrevious
     * @param {String} field the part of the state to get.
     */
    getPrevious: function(field) {
      return this._previous[field];
    },

    /**
     * Update the previous state with the view state now that we're done
     * processing the request.
     *
     * @method save
     */
    save: function() {
      this._previous = Y.merge(
          this._previous,
          this._current);
    },

    /**
     * Given the current subapp state, generate a url to pass up to the
     * routing code to route to.
     *
     * @method getUrl
     * @param {Object} change the values to change in the current state.
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

      this._current = Y.merge(this._current, change);
      // XXX This is a hack to get around the viewmode which will be removed.
      var skipViewmode = false;
      if (change.inspector) {
        urlParts.push('/inspector/' + change.inspector + '/');
        skipViewmode = true;
      }

      if (change.machine) {
        urlParts.push('/machine/');
        skipViewmode = true;
      }

      if (change.topology) {
        urlParts.push('/');
        skipViewmode = true;
      }

      if (!skipViewmode) {
        if (this.getCurrent('viewmode') !== 'sidebar' ||
            this.getCurrent('search')) {
          // There's no need to add the default view if we
          // don't need it. However it's currently required for search views to
          // match our current routes.
          urlParts.push(this.getCurrent('viewmode'));
        }
      }

      if (this.getCurrent('search')) {
        urlParts.push('search');
      } else if (this.getPrevious('search')) {
        // We had a search, but are moving away; clear the previous search.
        this.filter.clear();
      }

      if (this.getCurrent('charmID')) {
        urlParts.push(this.getCurrent('charmID'));
      }

      var url = urlParts.join('/');
      if (this.getCurrent('querystring')) {
        url = Y.Lang.sub('{ url }?{ qs }', {
          url: url,
          qs: this.getCurrent('querystring')
        });
      }
      if (this.getCurrent('hash')) {
        url = url + this.getCurrent('hash');
      }
      return url;
    },

    /**
     * Given the params in the route determine what the new state is going to
     * be.
     *
     * @method update
     * @param {Object} req the request payload.
     */
    loadRequest: function(req) {
      // Update the viewmode. Every request has a viewmode.
      var path = req.path,
          params = req.params,
          query = req.query,
          hash = window.location.hash;

      this._setCurrent('viewmode', params.viewmode);

      if (hash) {
        // If the hash starts with bws- then reset it to provide backwards
        // compatibility.
        if (hash.indexOf('#bws-') === 0) {
          hash = hash.replace('bws-', '');
        }

        this._setCurrent('hash', hash.replace('/', ''));
        window.location.hash = this.getCurrent('hash');
      }

      // Check for a charm id in the request.
      if (params.viewmode !== 'inspector') {
        if (params.id && params.id !== 'search') {
          this._setCurrent('charmID', params.id);
        } else {
          this._setCurrent('charmID', null);
        }
      }

      // Check for search in the request.
      if (path.indexOf('search') !== -1) {
        this._setCurrent('search', true);
      } else {
        this._setCurrent('search', false);
      }

      // Check if there's a query string to set.
      if (query) {
        // Store it as a straight string.
        this._setCurrent('querystring', Y.QueryString.stringify(query));
      } else {
        this._setCurrent('querystring', null);
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
     * Update the current filters given an update object that's keyed on the
     * property and the new values to use for it.
     *
     * This is used to help pre-populate the filters from the url on an
     * initial url load (a shared searc link) as well as updates from the
     * widgets that turn into change events that make sure we update the
     * current set of filters based on the changes detected in widgets lower
     * in the stack.
     *
     * @method update
     * @param {Object} data the properties to update.
     * @return {undefined} nadda.
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
       * The categories of charm to search filter the search to.
       *
       * @attribute categories
       * @default []
       * @type {Array}
       */
      categories: {
        value: []
      },
      /**
       * The providers for charms to filter to.
       *
       * @attribute provider
       * @default []
       * @type {Array}
       */
      provider: {
        value: []
      },
      /**
       * The series to filter to for the search.
       *
       * @attribute series
       * @default []
       * @type {Array}
       */
      series: {
        value: []
      },
      /**
       * The text to search for.
       *
       * @attribute text
       * @default ''
       * @type {String}
       */
      text: {
        value: ''
      },
      /**
       * The type of charms to filter to.
       *
       * @attribute type
       * @default []
       * @type {Array}
       */
      type: {
        value: []
      }
    }
  });
}, '0.1.0', {
  requires: [
    'model',
    'querystring'
  ]
});
