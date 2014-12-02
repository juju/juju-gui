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
     * When home is selected the event needs to be fired up to listeners.
     *
     * @method _onHome
     * @param {Event} ev The click event for the home button.
     *
     */
    _onHome: function(ev) {
      ev.preventDefault();
      this.get('boundingBox').one('form input').set('value', '');
      this.fire(this.EVT_SEARCH_GOHOME);
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
        this.get('boundingBox').one('form').addClass('active');
      }
    }

  }, {
    ATTRS: {
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
    // XXX Dec 1 2014 Jeff - The above autocomplete module must remain here else
    // we get a huge number of test failures around dom query selectors.
    'base',
    'browser-filter-widget',
    'event',
    'event-delegate',
    'event-tracker',
    'event-mouseenter',
    'juju-templates',
    'widget'
  ]
});
