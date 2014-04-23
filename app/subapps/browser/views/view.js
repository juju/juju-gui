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
 * Browser SubApp Sidebar View handler.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-mainview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      widgets = Y.namespace('juju.widgets');

  /**
   * Base view for MainView sidebar.
   *
   * @class MainView
   * @extends {Y.View}
   *
   */
  ns.MainView = Y.Base.create('browser-view-mainview', Y.View, [
    Y.Event.EventTracker
  ], {

    /**
     * Extending classes need to specify the template used to render display.
     *
     * @attribute template
     * @default ''
     * @type {Object}
     *
     */
    template: '',
    /**
     * Is this view currently visible? Tracked for use with the show/hide
     * toggle control in the Search widget.
     *
     * @attribute visible
     * @default true
     * @type {Boolean}
     *
     */
    visible: true,

    /**
     * Bind events watching for search widget changes.
     *
     * @method _bindSearchWidgetEvents
     * @private
     *
     */
    _bindSearchWidgetEvents: function() {
      var container = this.get('container');
      if (this.search) {
        this.addEvent(
            this.search.on(
                this.search.EVT_SEARCH_CHANGED, this._searchChanged, this)
        );

        this.addEvent(
            this.search.on(
                this.search.EVT_DEPLOY, this._deployEntity, this)
        );

        this.addEvent(
            this.search.on(
                this.search.EVT_SEARCH_GOHOME, this._goHome, this)
        );

        // If the showHome attribute is changed, update our html by adding the
        // with-home class to the widget.
        this.after('withHomeChange', function(ev) {
          if (ev.newVal) {
            // In the sidebar, the left panel needs the height adjusted to
            // make room for the home links to show up.
            container.one('#bws-sidebar').addClass('with-home');
          } else {
            // We need to adjust the height of the sidebar now to close
            // up the space by the home buttons.
            container.one('#bws-sidebar').removeClass('with-home');
          }
        }, this);
      }
    },

    /**
     * Deploy either a bundle or charm given by the quicksearch widget.
     *
     * @method _deployEntity
     * @param {Y.Event} ev the event object from the widget.
     *
     */
    _deployEntity: function(ev) {
      var entityType = ev.entityType,
          entity = ev.data,
          entityId = ev.id,
          deployer;

      if (entityType === 'bundle') {
        deployer = this.get('deployBundle');
        var bundle = new models.Bundle(entity);
        deployer(bundle.get('data'));
      } else {
        deployer = this.get('deployService');
        var charm = new models.Charm(entity);
        var ghostAttributes;
        ghostAttributes = {
          icon: this.get('store').iconpath(charm.get('storeId'))
        };
        deployer.call(null, charm, ghostAttributes);
      }
    },

    /**
     * Force a navigate event when the search widget says "Home" was clicked.
     *
     * @method _goHome
     * @param {Event} ev The event from the search widget.
     *
     */
    _goHome: function(ev) {
      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            metadata: null,
            component: null
          }
        });
      } else {
        var change = {
          charmID: undefined,
          hash: undefined,
          search: false,
          filter: {
            clear: true
          }
        };
        this.fire('viewNavigate', {change: change});
      }
    },

    /**
     * Render out the main search widget.
     *
     * @method _renderSearchWidget
     * @param {Node} node the node to render into.
     *
     */
    _renderSearchWidget: function(node) {
      // It only makes sense to render search if we have a store to use to
      // search against.
      if (this.get('store')) {
        var store = this.get('store');
        this.search = new widgets.browser.Search({
          autocompleteSource: Y.bind(
              store.autocomplete,
              store
          ),
          autocompleteDataFormatter: store.transformResults,
          categoryIconGenerator: Y.bind(store.buildCategoryIconPath, store),
          filters: this.get('filters')
        });
        this.search.render(node.one('.bws-header'));
      }
    },

    /**
       When search box text has changed navigate away.

       @method _searchChanged
       @param {Event} ev the form submit event.

     */
    _searchChanged: function(ev) {
      if (ev && ev.halt) {
        ev.halt();
      }
      var change = {
        search: true,
        filter: {
          text: ev.newVal
        }
      };

      // Perhaps there's more to this change than just a search change. This
      // might come from places, such as autocomplete, which are a search
      // change, but also want to select a charm id as well.
      if (ev.change) {
        change = Y.merge(change, ev.change);
      }
      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser',
            metadata: {
              search: change.filter,
              id: change.charmID
            }
          }});
      } else {
        this.fire('viewNavigate', {change: change});
      }

    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     */
    destructor: function() {
      // Clean up any details view we might have hanging around.
      if (this.details) {
        this.details.destroy(true);
      }
    }

  }, {
    ATTRS: {
      /**
       * If this view is called from the point of view of a specific charmId
       * it'll be set here.
       *
       * @attribute charmID
       * @default undefined
       * @type {String}
       *
       */
      charmID: {},

      /**
       * @attribute deployService
       * @default undefined
       * @type {Function}
       *
       */
      deployService: {},

      /**
       * @attribute deployBundle
       * @default undefined
       * @type {Function}
       *
       */
      deployBundle: {},

      /**
         The list of filters to be used in the rendering of the view.

         This is always handed down from the subapp, but default to something
         sane for tests and just in case.

         @attribute filters
         @default {Object}
         @type {Object}

       */
      filters: {
        value: {
          text: ''
        }
      },

      /**
       * An instance of the Charmworld API object to hit for any data that
       * needs fetching.
       *
       * @attribute store
       * @default undefined
       * @type {Object}
       *
       */
      store: {},

      withHome: {
        value: false
      }
    }
  });

}, '0.1.0', {
  requires: [
    'browser-token',
    'browser-search-widget',
    'event-tracker',
    'juju-charm-store',
    'juju-browser-models',
    'juju-models',
    'juju-bundle-models',
    'querystring-stringify',
    'view'
  ]
});
