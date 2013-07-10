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
      templates = Y.namespace('juju.views').Templates;


  /**
   * Search widget present in the Charm browser across both fullscreen and
   * sidebar views.
   *
   * @class Search
   * @extends {Y.Widget}
   * @event EV_CLEAR_SEARCH the widget requests all search reset.
   * @event EV_SEARCH_CHANGED the widgets notifies that the search input has
   * changed.
   *
   */
  ns.Search = Y.Base.create('search-widget', Y.Widget, [
    Y.Event.EventTracker
  ], {
    EVT_CLEAR_SEARCH: 'clear_search',
    EVT_SEARCH_CHANGED: 'search_changed',

    TEMPLATE: templates['browser-search'],

    /**
     * Halt page reload from form submit and let the app know we have a new
     * search.
     *
     * @method _handleSubmit
     * @param {Event} ev the submit event.
     */
    _handleSubmit: function(ev) {
      ev.halt();
      var form = this.get('boundingBox').one('form'),
          value = form.one('input').get('value');

      this.fire(this.EVT_SEARCH_CHANGED, {
        newVal: value
      });
    },

    /**
     * Set the form to active so that we can change the search appearance.
     *
     * @method _setActive
     * @private
     *
     */
    _setActive: function() {
      var form = this.get('boundingBox').one('form').addClass('active');
    },

    /**
     * We need to setup the autocomplete onto out input widget.
     *
     * @method _setupAutocomplete
     * @private
     *
     */
    _setupAutocomplete: function () {
      var that = this;
      var fetchResults = function(query, callback) {
        var filters = this.get('filters');
        // filters.autocomplete = true;
        filters.text = query;
        this.get('autocompleteSource')(
          filters, {
            success: callback
          },
          this
        );
      };
      fetchResults = Y.bind(fetchResults, this);
      this.ac = new Y.AutoComplete({
        inputNode: this.get('boundingBox').one('input'),
        queryDelay: 150,
        resultFormatter: function(query, results) {
           var dataprocessor = that.get('autocompleteDataFormatter');
           var charmlist = dataprocessor(Y.Array.map(results, function(res) {
             return res.raw;
           }));
           return charmlist.map(function (charm) {
              var container = Y.Node.create('<div class="yui3-charmtoken"/>');
              var tokenAttrs = Y.merge(charm.getAttrs(), {
                size: 'tiny'
              });
              var token = new ns.CharmToken(tokenAttrs);
              return container.append(token.TEMPLATE(token.getAttrs()));
          });
        },
        resultListLocator: 'result',
        resultTextLocator: function (result) {
          return result.charm.name;
        },
        source: fetchResults
      });
      this.ac.render();
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
          container.one('input').on(
              'focus', this._setActive, this)
      );
      this.addEvent(
          container.one('input').on(
              'blur', this._toggleActive, this)
      );

      // Make sure the UI around the autocomplete search input is setup.
      this._setupAutocomplete();
    },

    destroy: function() {
      if (this.ac) {
        this.ac.destroy();
      }
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
    }

  }, {
    ATTRS: {
      /**
        @attribute autocompleteSource
        @default {undefined} The api point for fetching the suggestions.
        @type {Charmworld2}

      */
      autocompleteSource: {

      },

      autocompleteDataFormatter: {

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
      }
    }
  });

}, '0.1.0', {
  requires: [
    'autocomplete',
    'base',
    'browser-charm-token',
    'browser-filter-widget',
    'event',
    'event-tracker',
    'event-valuechange',
    'juju-templates',
    'juju-views',
    'widget'
  ]
});
