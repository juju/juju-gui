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
 * The widget used across Browser view to manage the search box and the
 * controls for selecting which view you're in.
 *
 * @module widgets
 * @submodule browser
 *
 */
YUI.add('browser-search-widget', function(Y) {
  var ns = Y.namespace('juju.widgets.browser'),
      models = Y.namespace('juju.models.browser'),
      templates = Y.namespace('juju.views').Templates;

  /**
   * Search widget present in the Charm browser
   *
   * @class Search
   * @extends {Y.Widget}
   * @event EV_CLEAR_SEARCH the widget requests all search reset.
   * @event EV_SEARCH_CHANGED the widgets notifies that the search input has
   *   changed.
   * @event EV_SEARCH_GOHOME Signal that the user clicked the home button.
   */
  ns.Search = Y.Base.create('search-widget', Y.Widget, [
    Y.Event.EventTracker
  ], {
    EVT_CLEAR_SEARCH: 'clear_search',
    EVT_SEARCH_CHANGED: 'search_changed',
    EVT_SEARCH_GOHOME: 'go_home',
    EVT_DEPLOY: 'charm_deploy',

    TEMPLATE: templates['browser-search'],

    /**
     * Fetch, from the store, suggested options for the search autocomplete
     * widget.
     *
     * @method _fetchSuggestions
     * @param {String} query the search query terms.
     * @param {Function} callback the callback to the AC widget.
     *
     */
    _fetchSuggestions: function(query, callback) {
      var self = this;
      var filters = this.get('filters');
      filters.text = query;

      // If the query is empty, just show categories.
      if (query === '') {
        var catData = this._suggestCategoryOptions(query);
        callback({
          result: catData
        });
      } else {
        // Assign the autocomplete function to a variable and call from there;
        // required for IE10.
        var autocompleteSource = this.get('autocompleteSource');
        autocompleteSource(
            filters, {
              'success': function(data) {
                // Determine if the suggestions are still wished for. The user
                // might have clicked away or hit enter to search with what
                // they have already.
                if (self.ignoreInFlight) {
                  return;
                }

                var catData = this._suggestCategoryOptions(query);
                if (catData) {
                  data.result = catData.concat(data.result);
                }
                callback(data);
              },
              'failure': function() {
                // Autocomplete should not throw errors at the user or break
                // the application. Just silently fail to find results.
              }
            },
            this
        );
      }
    },

    /**
     * When the AC input has focus adjust css properties to note it's active.
     *
     * @method _handleInputFocus
     * @param {Event} ev the focus event from YUI.
     *
     */
    _handleInputFocus: function(ev) {
      // Make sure we reset to respond to suggestions coming in.
      this.ignoreInFlight = false;
      // Update the styling to represent an active input.
      this._setActive();
    },

    /**
     * Halt page reload from form submit and let the app know we have a new
     * search.
     *
     * @method _handleSubmit
     * @param {Event} ev the submit event.
     */
    _handleSubmit: function(ev) {
      ev.halt();
      this.ignoreInFlight = true;
      var form = this.get('boundingBox').one('form'),
          value = form.one('input').get('value');

      // Make sure we close the suggestions container.
      if (this.ac) {
        this.ac.hide();
      }

      this.fire(this.EVT_SEARCH_CHANGED, {
        newVal: value
      });
    },

    /**
     * When home is selected the event needs to be fired up to listeners.
     *
     * @method _onHome
     * @param {Event} ev The click event for the home button.
     *
     */
    _onHome: function(ev) {
      this.get('boundingBox').one('form input').set('value', '');
      ev.halt();
      this.fire(this.EVT_SEARCH_GOHOME);
    },

    /**
     * Set the form to active so that we can change the search appearance.
     *
     * @method _setActive
     * @private
     *
     */
    _setActive: function() {
      this.get('boundingBox').one('form').addClass('active');
    },

    /**
     * Manually append categories to the suggestion list.
     *
     * @method _suggestCategoryOptions
     * @param {String} query the current query string to match against.
     *
     */
    _suggestCategoryOptions: function(query) {
      // For now return all categories in a format we can get the model/charm
      // token to play nice with.
      var fakeModelData = [];
      var iconGenerator = this.get('categoryIconGenerator');
      Y.Object.each(models.FILTER_CATEGORIES, function(name, id) {
        if (name.substr(0, query.length).toLowerCase() === query) {
          fakeModelData.push({
            charm: {
              // A very fake storeId so we can use the charm-token to display
              // the categories in the results.
              id: 'cat:~gui/cat/' + id + '-1',
              description: '',
              shouldShowIcon: true,
              is_approved: false,
              iconUrl: iconGenerator(id),
              name: name
            }
          });
        }
      });

      return fakeModelData;
    },

    /**
     * Format the html that will be used in the AC widget results.
     *
     * Results need to be processed as charm tokens to get them to render
     * correctly with the right visual logic for reviewed/icons/etc.
     *
     * @method _suggestFormatter
     * @param {String} query the searched for query term.
     * @param {Array} results the list of objects from the AC processing of
     * the api results. Note: this is not the api json, but objects from the
     * AC processing.
     *
     */
    _suggestFormatter: function(query, results) {
      var dataprocessor = this.get('autocompleteDataFormatter');
      var charmlist = dataprocessor(Y.Array.map(results, function(res) {
        return res.raw;
      }));

      var res = [],
          lastCharmWasCategory = false;

      var isCategory = function(id) {
        if (id.substr(0, 4) === 'cat:') {
          return true;
        }
      };

      Y.Array.each(charmlist, function(charm, idx, list) {
        var container = Y.Node.create('<div class="yui3-token"/>');
        // Force the tokens to not show the is_approved star by force them to
        // be false.
        var tokenAttrs = Y.merge(charm.getAttrs(), {
          size: 'tiny',
          is_approved: false,
          deployButton: isCategory(charm.get('id')) ? false : true
        });
        var token = new ns.Token(tokenAttrs);
        var html = Y.Node.create(token.TEMPLATE(token.getAttrs()));

        // If there are categories at the top, we need them to have an
        // additional css class on the .yui3-token node.
        if (isCategory(charm.get('id'))) {
          lastCharmWasCategory = true;
          html.addClass('category');
        } else {
          // This charm is not a category charm. Was the last one?
          if (lastCharmWasCategory) {
            // If so, then update it with the .last-category class.
            var lastIdx = idx - 1;
            var lastHtml = res[lastIdx];
            lastHtml.addClass('last-category');
            res[lastIdx] = lastHtml;
          }

          // Reset that we're done with categories now.
          lastCharmWasCategory = false;
        }
        container.append(html);
        res.push(container);
      });

      return res;
    },

    /**
     * Setup an autocomplete widget around the search form's input control.
     *
     * @method _setupAutocomplete
     * @private
     *
     */
    _setupAutocomplete: function() {
      var self = this;
      // Bind out helpers to the current objects context, not the auto
      // complete widget context..
      var fetchSuggestions = Y.bind(this._fetchSuggestions, this);
      var suggestFormatter = Y.bind(this._suggestFormatter, this);

      // Create our autocomplete instance with all the config and handlers it
      // needs to function properly.
      this.ac = new Y.AutoComplete({
        inputNode: this.get('boundingBox').one('input[name=bws-search]'),
        minQueryLength: 0,
        queryDelay: 250,
        resultFormatter: suggestFormatter,
        resultListLocator: 'result',
        // resultTextLocator is quoted to hide it from the yuidoc linter.
        'resultTextLocator': function(result) {
          // The result can be either a charm or a bundle; either way, we want
          // its name.
          return (result.charm || result.bundle).name;
        },
        source: fetchSuggestions
      });

      // Holder for the deploy logic the AC uses when clicking on a deploy
      // icon from a result item.
      this.ac._onDeploy = function(ev) {
        var isBundle = false,
            data,
            found,
            id;

        // Fire an event up to the View with the charm information so that
        // it can proceed to build/send the deploy information out to
        // the environment.
        id = ev.target.getData('charmId');

        if (!id) {
          // try to see if this is a bundle clicked on.
          id = ev.target.getData('bundleId');
          isBundle = true;
        }
        // Find the charm data for the selected item from the set of
        // results.
        found = this.get('results').filter(function(result) {
          if (isBundle) {
            if (result.raw.bundle.id === id) {
              return result;
            }
          } else {
            if (result.raw.charm.id === id) {
              return result;
            }
          }
        });

        // Make sure that we've found a result before returning.
        if (found.length === 0) {
          console.error(
              'Clicked deploy on an item we could not find in results.');
        } else {
          if (isBundle) {
            data = found[0].raw.bundle;
          } else {
            data = found[0].raw.charm;
          }

          self.fire(self.EVT_DEPLOY, {
            id: id,
            data: data,
            entityType: isBundle ? 'bundle' : 'charm'
          });

        }

      };

      this.ac._onItemClick = function(ev) {
        // If the selection is coming from the deployButton then we kind of
        // ignore the way autocomplete works. It's more of a 'quick search'
        // with a deploy option. No search is really performed after the
        // deploy button is selected.
        if (ev.target.hasClass('search_add_to_canvas')) {
          // Hide the autocomplete widget. You've selected something
          // that's not really a suggestion, but it should still go away.
          this.hide();
          this._onDeploy(ev);
        } else {
          var itemNode = ev.currentTarget;
          this.set('active_item', itemNode);
          this.selectItem(itemNode, ev);
        }
      };

      this.ac.render();

      this.ac.get('inputNode').on('focus', function(ev) {
        this.ac.sendRequest(ev.currentTarget.get('value'));
      }, this);

      // Ensure that the widget is rendered position: absolute. For reasons
      // unknown, the widget is being set to position: relative in IE10 which
      // causes rendering errors in the header.
      this.ac.get('boundingBox').setStyle('position', 'absolute');

      // Stop clicking on charm-tokens <a> links from navigating.
      this.get('boundingBox').delegate('click', function(ev) {
        ev.halt();
      }, 'a', this);

    },

    /**
     * Handle selecting an AC suggestion and firing the correct events to
     * update the UI.
     *
     * @method _suggestionSelected
     * @param {Y.Event} ev The 'select' event from the AC widget.
     *
     */
    _suggestionSelected: function(ev) {
      ev.halt();

      var change,
          form = this.get('boundingBox').one('form'),
          id,
          isBundle = false,
          newVal;

      if (ev.result.raw.charm) {
        id = ev.result.raw.charm.id;
      } else {
        // Currently we have to pretend to be a charm.
        // XXX: We should support the idea of a bundle separate from charm? Go
        // with entity? Something to clean up.
        id = '/bundle/' + ev.result.raw.bundle.id;
      }

      if (id.substr(0, 4) === 'cat:') {
        form.one('input').set('value', '');
        var category = id.match(/([^\/]+)-\d\/?/);
        change = {
          charmID: null,
          search: true,
          filter: {
            categories: [category[1]],
            replace: true
          }
        };

        newVal = '';

      } else {
        // For a charm we need to use that charm name as the search term.
        // Make sure the input box is updated.
        form.one('input').set('value', ev.result.text);
        newVal = ev.result.text;
        change = {
          charmID: id,
          filter: {
            categories: [],
            text: newVal,
            replace: true
          }
        };
      }

      if (this.ac) {
        this.ac.hide();
      }
      this.fire(this.EVT_SEARCH_CHANGED, {
        change: change,
        newVal: newVal
      });

    },

    /**
     * Toggle the active state depending on the content in the search box.
     *
     * @method _toggleActive
     * @private
     *
     */
    _toggleActive: function() {
      var form = this.get('boundingBox').one('form'),
          value = form.one('input').get('value');

      if (value === '') {
        form.removeClass('active');
      }
      else {
        form.addClass('active');
      }
    },

    /**
     * bind the UI events to the DOM making up the widget control.
     *
     * @method bindUI
     *
     */
    bindUI: function() {
      var container = this.get('boundingBox');

      this.addEvent(
          container.one('form').on(
              'submit', this._handleSubmit, this)
      );
      this.addEvent(
          container.one('input').on('focus', this._handleInputFocus, this)
      );
      this.addEvent(
          container.one('input').on(
              'blur', this._toggleActive, this)
      );

      this.addEvent(
          container.one('.browser-nav').delegate(
              'click',
              this._onHome,
              '.home',
              this)
      );
      this.addEvent(
          container.one('i').on(
              'mouseenter',
              function(ev) {
                // Change the icon to hover on mounseenter.
                ev.target.removeClass('home-icon');
                ev.target.addClass('home-icon-hover');
              }, this)
      );
      this.addEvent(
          container.one('i').on(
              'mouseleave',
              function(ev) {
                // Change the icon to back on mouseleave.
                ev.target.removeClass('home-icon-hover');
                ev.target.addClass('home-icon');
              }, this)
      );

      // Setup autocomplete only if we're given an upstream source of data.
      if (this.get('autocompleteSource')) {
        this._setupAutocomplete();
        this.addEvent(
            this.ac.on('select', this._suggestionSelected, this)
        );
      }
    },

    /**
     * Clean up instances of objects we create
     *
     * @method destroy
     *
     */
    destroy: function() {
      if (this.ac) {
        this.ac.destroy();
      }
      this.get('boundingBox').remove().destroy();
    },

    /**
     * Generic initializer for the widget. Publish events we expose for
     * outside use.
     *
     * @method initializer
     * @param {Object} cfg configuration override object.
     *
     */
    initializer: function(cfg) {
      /*
       * Fires when the "Charm Browser" link is checked. Needs to communicate
       * with the parent view so that it can handle filters and the like. This
       * widget only needs to clear the search input box.
       *
       */
      this.publish(this.EVT_SEARCH_CHANGED);
      this.publish(this.EVT_SEARCH_GOHOME);

      // Make sure we default to responding to AC calls.
      this.ignoreInFlight = false;
    },

    /**
     * Render all the things!
     *
     * @method renderUI
     *
     */
    renderUI: function() {
      var data = this.getAttrs();
      this.get('contentBox').setHTML(
          this.TEMPLATE(data)
      );

      // If there's an existing search term, make sure we toggle active.
      if (data.filters.text) {
        this._toggleActive();
      }
    },

    /**
     * Update the search input to contain the string passed. This is meant to
     * be used by outside links that want to perform a pre-canned search and
     * display results.
     *
     * @method update_search
     * @param {String} newval the sting to update the input to.
     *
     */
    updateSearch: function(newval) {
      var input = this.get('contentBox').one('input');
      input.focus();
      input.set('value', newval);
    },

    /**
     * Show the home icons to the user.
     *
     * @method showHome
     *
     */
    showHome: function() {
      var homeNode = this.get('contentBox').one('.browser-nav');
      homeNode.removeClass('hidden');
    },

    /**
     * Hide the home links from the user.
     *
     * @method hideHome
     *
     */
    hideHome: function() {
      var homeNode = this.get('contentBox').one('.browser-nav');
      homeNode.addClass('hidden');
    }

  }, {
    ATTRS: {
      /**
        @attribute autocompleteSource
        @default {undefined} The api point for fetching the suggestions.
        @type {function}

      */
      autocompleteSource: {

      },

      /**
       * @attribute autoCompleteDataFormatter
       * @default {undefined}
       * @type {function}
       *
       */
      autocompleteDataFormatter: {

      },

      /**
       * @attribute categoryIconGenerator
       * @default {undefined}
       * @type {function}
       *
       */
      categoryIconGenerator: {

      },

      /**
         @attribute filters
         @default {Object} text: ''
         @type {Object}

       */
      filters: {
        value: {
          text: ''
        }
      },

      /**
       * @attribute withHome
       * @default false
       * @type {Boolean}
       *
       */
      withHome: {
        value: false
      }
    }
  });

}, '0.1.0', {
  requires: [
    'autocomplete',
    'base',
    'browser-token',
    'browser-filter-widget',
    'event',
    'event-delegate',
    'event-tracker',
    'event-mouseenter',
    'event-valuechange',
    'juju-browser-models',
    'juju-templates',
    'juju-views',
    'widget'
  ]
});
