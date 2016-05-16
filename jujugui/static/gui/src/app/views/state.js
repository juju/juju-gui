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
     * Verify that a particular part of the state has changed.
     *
     * @method hasChanged
     * @param {String} section the section that the field is in.
     * @param {String} field the part of the state to check.
     */
    hasChanged: function(section, field) {
      var previous = this.getState('previous', section, field);
      var current = this.getState('current', section, field);
      // If a new state event is fired which causes the defaults to be set
      // to the same value as the default then don't trigger a change.
      if (section === 'sectionA') {
        if (previous === undefined) { previous = 'charmbrowser'; }
        if (current === undefined) { current = 'charmbrowser'; }
      }
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
          sectionObj = stateObj && stateObj[section],
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
      @param {Boolean} dispatch If it should dispatch the request or just add
        it to the state.
    */
    saveState: function(state, dispatch) {
      this.set('previous', Y.clone(this.get('current'))); // clones the object.
      this.set('current', state);
      if (dispatch) {
        this.dispatch(state);
      }
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
      var sections = ['app', 'sectionA', 'sectionB', 'sectionC'];
      if (!state) {
        state = this.get('current');
      }
      // If the component of a section has changed then clean out that section.
      sections.forEach(function(section) {
        if (this.hasChanged(section, 'component')) {
          this._emptySection(section);
        }
        if (state[section]) {
          this._dispatchSection(section, state[section]);
        }
      }, this);
      // Reset flash, because we don't want arbitrary potentially large objects
      // (e.g. files from local charm upload) hanging out.
      this.set('flash', undefined);
    },

    /**
      Calls the appropriate dispatch method for the section.

      @method _dispatchSection
      @param {String} section The section to dispatch.
      @param {Object} state The current state object for the section.
    */
    _dispatchSection: function(section, state) {
      var sections = {
        app: 'App',
        sectionA: 'SectionA',
        sectionB: 'SectionB',
        sectionC: 'SectionC'
      };
      // calls _dispatchSectionA or _dispatchSectionB
      this['_dispatch' + sections[section]](state);
    },

    /**
      Calls the dispatcher subscribed on instantiation for the overall app.

      @method _dispatchApp
      @param {Object} state App's state object.
    */
    _dispatchApp: function(state) {
      var component = state.component;
      var dispatchers = this.get('dispatchers');
      if (!component) {
        // If there is no component then there might be a deploy-target.
        if (state.deployTarget) {
          dispatchers.app.deployTarget(state.deployTarget);
        }
        return;
      }
      dispatchers.app[component](state.metadata);
    },

    /**
      Calls the dispatcher subscribed on instantiation for the sectionA
      component.

      @method _dispatchSectionA
      @param {Object} state SectionA's state object.
    */
    _dispatchSectionA: function(state) {
      var component = state.component;
      // The default component is the charmbrowser.
      if (!component) {
        component = 'services';
      }
      this.get('dispatchers').sectionA[component](state.metadata);
    },

    /**
      Calls the dispatcher subscribed on instantiation for the sectionB
      component.

      @method _dispatchSectionB
      @param {Object} state SectionB's state object.
    */
    _dispatchSectionB: function(state) {
      var component = state.component;
      // The default for this pane is to see through to the canvas so don't
      // dispatch if there is no component provided.
      if (!component) { return; }
      this.get('dispatchers').sectionB[state.component](state.metadata);
    },

    /**
      Calls the dispatcher subscribed on instantiation for the sectionC
      component.

      @method _dispatchSectionC
      @param {Object} state SectionB's state object.
    */
    _dispatchSectionC: function(state) {
      var component = state.component;
      var metadata = state.metadata;
      if (!component) {
        if (metadata && metadata.search && metadata.search.text) {
          component = 'charmbrowser';
        } else {
          return;
        }
      }
      this.get('dispatchers').sectionC[component](state.metadata);
    },

    /**
      Calls the subscribed empty method for the passed in section.

      @method _emptySection
      @param {String} section The section to call the empty listener on.
    */
    _emptySection: function(section) {
      var dispatcher = this.get('dispatchers')[section];
      if (dispatcher && dispatcher.empty) {
        dispatcher.empty();
      }
    },

    /**
      Given a valid state change object, generate a url which the application
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
      var newState = Y.mix(
          Y.clone(this.get('current')), change, true, null, 0, true);
      var component,
          id,
          metadata,
          sectionState,
          hash = '',
          urlParts = [];
      var queryValues = {};
      // Loop through each section in the state to generate the urls.
      Object.keys(newState).forEach(function(section) {
        sectionState = newState[section];
        component = sectionState.component;
        metadata = sectionState.metadata || {};

        // Compress the id to remove default values.
        id = metadata.id;
        if (id) {
          id = id.replace(/~charmers\//, '');
        }

        // If metadata contains any flash data, store it.
        if (metadata.flash) {
          this.set('flash', metadata.flash);
        }

        // All pushes to the urlParts array needs to be in a truthy conditional
        // because no state parameters are required.
        if (component === 'charmbrowser') {
          hash = metadata.hash || '';
          var activeComponent = metadata.activeComponent;
          if (activeComponent === 'search-results') {
            queryValues.search = metadata.search;
            if (metadata.tags) {
              queryValues.tags = metadata.tags;
            }
            if (metadata.type) {
              queryValues.type = metadata.type;
            }
            if (metadata.sort) {
              queryValues.sort = metadata.sort;
            }
            if (metadata.series) {
              queryValues.series = metadata.series;
            }
            if (metadata.provides) {
              queryValues.provides = metadata.provides;
            }
            if (metadata.requires) {
              queryValues.requires = metadata.requires;
            }
            if (metadata.owner) {
              queryValues.owner = metadata.owner;
            }
          }
          if (activeComponent === 'mid-point') {
            queryValues.midpoint = '';
          }
          if (activeComponent === 'entity-details') {
            queryValues.store = id || '';
          }
          if (activeComponent === 'store') {
            queryValues.store = '';
          }
        } else {
          if (component) {
            urlParts.push(component);
          }
          if (component === 'inspector') {
            if (id) {
              urlParts.push(id);
            }
            if (metadata.activeComponent) {
              urlParts.push(metadata.activeComponent);
            }
            if (metadata.activeComponent === 'units' && metadata.unitStatus) {
              urlParts.push(metadata.unitStatus);
            }
            if (metadata.unit) {
              urlParts.push(metadata.unit);
            }
            if (metadata.charm) {
              urlParts.push('charm');
            }
            if (metadata.localType) {
              urlParts.push('local/' + metadata.localType);
            }
          }
          if (component === 'machine') {
            // With machine view the id is optional.
            if (id) {
              urlParts.push(id);
            }
            if (metadata.container) {
              urlParts.push(metadata.container);
            }
          }
          if (component === 'deploy') {
            if (metadata.activeComponent) {
              urlParts.push(metadata.activeComponent);
            }
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
      if (Object.keys(queryValues).length > 0) {
        url = url.replace(/\/$/, '');
        var keys = Object.keys(queryValues);
        if (keys.length > 0) {
          url += '?';
          keys.forEach((key, i) => {
            var value = queryValues[key];
            if (i > 0) {
              url += '&';
            }
            url += key;
            if (value && value !== '') {
              url += '=' + value;
            }
          });
        }
      }
      // Add the hash to the end of the url.
      if (hash.length > 0) {
        hash = (hash.indexOf('#') === 0) ? hash : '#' + hash;
        url += hash;
      }
      // Prepend the baseUrl to the returned url so we don't lose it.
      return this.get('baseUrl') + url;
    },

    /**
      Takes the url request object from the Y.Router and parses it into the
      appropriate state object.

      @method loadRequest
      @param {Object} req Y.Router request object.
      @param {string} hash The hash from window.location.hash.
      @param {Object} options A collection of options for loading the request
        object into state.
        'dispatch': true/false - whether it should dispatch.
      @return {Object} The state object which outlines what the application
        should render.
    */
    loadRequest: function(req, hash, options) {
      var url = req.path,
          query = req.query,
          state = {};
      // Strip the baseUrl before attempting to read the url's other parts.
      url = url.replace(this.get('baseUrl'), '');
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
      // The window.location.hash property is '#undefined' if no hash is
      // set in phantomjs so this is a hack to workaround that bug.
      hash = this._sanitizeHash(hash);
      // Organize the paths into their sections.
      state = this._buildSections(paths, query, hash);
      this.saveState(state, false);
      return state;
    },

    /**
       Sanitizes the hash; there are issues both in tests and with legacy hashes
       we want to cleanup before we dispatch.

       @method _sanitizeHash
       @param {String} hash The url hash
       @return {String} The sanitized hash
     */
    _sanitizeHash: function(hash) {
      hash = hash || window.location.hash;
      if (hash) {
        // There are legacy hashes which have a 'bws_' prefix. This strips the
        // bws to allow it to fall through to it's real value
        hash = hash.replace(/^bws_/, '');
        // Testing tools set the hash to "#undefined" if there's no hash; this
        // cleans that up.
        if (hash === '' || hash === '#undefined') {
          hash = undefined;
        }
      }
      return hash;
    },

    /**
      Takes the paths supplied by _splitIntoComponents and organizes them
      hierarchically by UI section.

      @method _buildSections
      @param {Array} paths The paths of the URL.
      @param {Object} query The search query value.
      @param {string} hash The hash from window.location.hash.
      @return {Object} The section delimited state object.
    */
    _buildSections: function(paths, query, hash) {
      var state = { sectionA: {}, sectionB: {}, sectionC: {} };
      // Loop through each part and dispatch each part to the appropriate url
      // parse method.
      paths.forEach(function(part) {
        // We check if it's at 0 index in case someone has a service/machine
        // called 'inspector' or 'machine' etc.
        if (part.indexOf('inspector') === 0) {
          state.sectionA = this._addToSection({
            component: 'inspector',
            metadata: this._parseInspectorUrl(part, hash)
          });
        } else if (part.indexOf('machine') === 0) {
          state.sectionB = this._addToSection({
            component: 'machine',
            metadata: this._parseMachineUrl(part)
          });
        } else if (part.indexOf('services') === 0) {
          state.sectionA = this._addToSection({
            component: 'services'
          });
        } else if (part.indexOf('login') === 0) {
          state.app = this._addToSection({
            component: 'login'
          });
        } else if (part.indexOf('profile') === 0) {
          state.sectionB = this._addToSection({
            component: 'profile'
          });
        } else if (part.indexOf('account') === 0) {
          state.sectionB = this._addToSection({
            component: 'account'
          });
        } else if (part.indexOf('deploy') === 0) {
          state.sectionC = this._addToSection({
            component: 'deploy',
            metadata: this._parseDeployUrl(part)
          });
        } else if (part.length > 0) {
          // If it's not an inspector or machine and it's more than 0 characters
          // then it's a charm url.
          var section = 'sectionC';
          state[section] = this._addToSection({
            component: 'charmbrowser',
            metadata: this._parseCharmUrl(part, hash)
          });
        }
      }, this);
      // There's always a query component, if it reflects a search.
      if (query) {
        // midpoint doesn't typically have a value, just the key existing.
        if (query.midpoint !== undefined) {
          state.sectionC = {
            component: 'charmbrowser',
            metadata: {
              activeComponent: 'mid-point'
            }
          };
        }
        if (query.search !== undefined) {
          var metadata = {
            activeComponent: 'search-results',
            search: query.search
          };
          if (query.tags) {
            metadata.tags = query.tags;
          }
          if (query.type) {
            metadata.type = query.type;
          }
          if (query.sort) {
            metadata.sort = query.sort;
          }
          if (query.series) {
            metadata.series = query.series;
          }
          if (query.provides) {
            metadata.provides = query.provides;
          }
          if (query.requires) {
            metadata.requires = query.requires;
          }
          if (query.owner) {
            metadata.owner = query.owner;
          }
          state.sectionC = {
            component: 'charmbrowser',
            metadata: metadata
          };
        }
        if (query.store === '') {
          state.sectionC = {
            component: 'charmbrowser',
            metadata: {
              activeComponent: 'store'
            }
          };
        } else if (query.store) {
          state.sectionC = {
            component: 'charmbrowser',
            metadata: {
              activeComponent: 'entity-details',
              id: query.store
            }
          };
        }
      }
      // For demonstration purposes it's nice to open the GUI to an already
      // deployed bundle or charm.
      if (query && query['deploy-target']) {
        this._addDeployTarget(state, query);
      }
      return state;
    },

    /**
      Add the deploy target into the state object. This
      adds the deploy-target component to the deployTarget component in the
      state object.

      @method _addDeployTarget
      @param {Object} state The built state object.
      @param {Object} query The query param object.
    */
    _addDeployTarget: function(state, query) {
      Y.namespace.call(state, 'app.deployTarget');
      state.app.deployTarget = query['deploy-target'];
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
      @param {string} hash The hash from window.location.hash.
      @return {Object} Metadata object to be added to the inspector state.
    */
    _parseInspectorUrl: function(url, hash) {
      url = url.replace(/^inspector\/?/, '');
      var parts = url.split('/'),
          metadata = {};
      if (parts[0] === '') {
        // If the url is only /inspector/ and that's stripped then just return
        // because it's an invalid url so it should render the charmstore.
        return;
      } else if (parts[0] === 'local') {
        metadata.localType = parts[1];
      } else {
        // The first index is the service id except in the above cases.
        metadata.id = parts[0];
        if (parts[1]) {
          metadata.activeComponent = parts[1];
          metadata[parts[1]] = parts[2] || true;
        }
      }
      metadata.flash = this.get('flash');
      if (hash) {
        metadata.hash = hash;
      }
      return metadata;
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
      Parse the deploy url into a state object.

      @method _parseDeployUrl
      @param {String} url Deploy url to be parsed.
      @return {Object} State object to be added to the deploy state.
    */
    _parseDeployUrl: function(url) {
      url = url.replace(/^deploy\/?/, '');
      var parts = url.split('/'),
          state = {};
      // If the url is 'deploy' then there is no extra state.
      if (parts[0] !== '') {
        state.activeComponent = parts[0];
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
      // We don't want to parse the login/logout urls as charms.
      if (url === 'login' || url === 'logout') {
        return state;
      }
      if (url) { state.id = url; }
      if (hash) {
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
      var sections = [
        'services',
        'machine',
        'inspector',
        'profile',
        'account',
        'deploy'
      ];
      var parts = [],
          indexes = [];
      sections.forEach(function(section) {
        var idx = url.indexOf(section);
        if (idx >= 0) {
          indexes.push(idx);
        }
      });
      // JavaScript array sort sorts alphabetically which causes issues if
      // you have multiple default sections ie) [0, 9, 17] gets sorted as
      // [0, 17, 9]. So we must pass a custom sorter to it so that it sorts
      // numerically.
      indexes.sort((a, b) => a-b);
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
       * The baseurl for dispatching.
       *
       * @attribute baseUrl
       * @default ''
       * @type {String}
       */
      baseUrl: {
        value: ''
      },
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
      },
      /**
        Temporary memory for dispatching some views

        @attribute flash
        @type {Oobject}
        @default {}
      */
      flash: {
        value: {}
      }
    }
  });
}, '0.1.0', {
  requires: [
    'model',
    'querystring'
  ]
});
