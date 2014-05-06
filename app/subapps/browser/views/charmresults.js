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
 * Charm Results View.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-charmresults', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');

  /**
     Charm results view.

     The Editorial and the Search results view share some basic info. This
     View is there to provide common handling of events shared in both uses.
     Since this view is incomplete (has no render, template, etc.) it's not
     tested directly, but through the SearchView and the EditorialView which
     verify both rendering and expected event behavior.

     @class CharmReults
     @extends {juju.browser.views.CharmResults}
     @event EV_CACHE_UPDATED when the cache has been updated this is fired
   */
  ns.CharmResults = Y.Base.create('browser-view-charmresults', Y.View, [
    views.utils.apiFailingView,
    widgets.browser.IndicatorManager,
    Y.Event.EventTracker
  ], {
    EV_CACHE_UPDATED: 'cache-updated',
    events: {
      '.token': {
        click: '_handleCharmSelection'
      }
    },

    /**
       Watch for selecting a charm in the results.

       @method _bindEvents

     */
    _bindEvents: function() {
      // Watch for changse to the activeID so that we can mark/unmark active
      // as required.
      this.addEvent(
          this.on('activeIDChange', function(ev) {
            var id = ev.newVal;
            if (id) {
              id = this.get('container').one(
                  '.token[data-charmid="' + id + '"]');
            }
            this.updateActive(id);
          })
      );
    },

    /**
        When selecting a charm from the list make sure we re-route the app to
        the details view with that charm selected.

        @method _handleCharmSelection
        @param {Event} ev the click event handler for the charm selected.

     */
    _handleCharmSelection: function(ev) {
      ev.halt();
      var charm = ev.currentTarget;
      var charmID = charm.getData('charmid');

      // Update the UI for the active one.
      this.updateActive(ev.currentTarget);

      var change = {
        charmID: charmID,
        hash: undefined
      };

      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser',
            metadata: { id: charmID }
          }});
      } else {
        this.fire('viewNavigate', {change: change});
      }
    },

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
      Shows the sidebar search widget and removes the class on the sidebar
      container.

      @method showSearch
    */
    showSearch: function() {
      this.search.show();
      this.get('container').removeClass('no-search');
    },

    /**
      Hides the sidebar search widget and adds the class on the sidebar
      container.

      @method hideSearch
    */
    hideSearch: function() {
      this.search.hide();
      // addClass() is idempotent.
      this.get('container').addClass('no-search', true);
    },

    /**
      Update the node in the editorial list marked as 'active'.

      @method updateActive
      @param {Node} clickTarget the token clicked on to activate.

    */
    updateActive: function(clickTarget) {
      // Remove the active class from any nodes that have it.
      Y.all('.yui3-token.active').removeClass('active');

      // Add it to the current node.
      if (clickTarget) {
        clickTarget.ancestor('.yui3-token').addClass('active');
      }
    },

    /**
      Makes the headers in the charm lists sticky

      @method makeStickyHeaders
    */
    makeStickyHeaders: function() {
      var charmContainer = this.get('renderTo');
      var headings = charmContainer.all('.section-title');
      var headingHeight = 53; // The height of the heading block in pixels

      headings.each(function(heading) {
        // In order to get Firefox to display the headers with the proper width
        // we need to set the headings width to the width of its parent.
        // Firefox in OSX with a trackpad does not include any scrollbar
        // dimensions so the scroll indicator appears under the headings.
        heading.setStyle('width',
            heading.get('parentNode').getComputedStyle('width'));
      });

      var stickyHeaders = charmContainer.all('.stickable');
      // To avoid a flash in Chrome on Ubuntu we need to add the sticky
      // class to the first element before the user scrolls.
      stickyHeaders.item(0).addClass('sticky');

      this._stickyEvent = charmContainer.on('scroll', function(e) {
        // The number of pixels that the charmContainer is scrolled upward.
        var scrollTop = this.get('scrollTop');
        stickyHeaders.each(function(heading, index) {
          // Need to get offset for the in place header, not the fixed one.
          // The number of pixels that the heading--in its normal, non-sticky
          // placement--is offset from the charmContainer, irrespective of
          // scrolling.
          var offsetTop = heading.get('parentNode').get('offsetTop');

          // Reset the header to its original position
          heading.one('.section-title').setStyle('marginTop', 0);
          heading.removeClass('current');

          // Apply the calculations to determine where the
          // header should be positioned relative to the scroll and container
          if (scrollTop > offsetTop) {
            heading.addClass('sticky');
            // The currently visible sticky heading is the
            // last with the class 'sticky'.
            charmContainer.all('.sticky:last-child').addClass('current');
          } else if (heading.hasClass('sticky')) {
            // If it is not scrolled up then remove the sticky classes
            // We need to leave the first one with the sticky class because
            // without it Chrome on Ubuntu will flash when it jumps from
            // position relaive to position fixed.
            if (index > 0) {
              heading.removeClass('sticky');
            }
          } else if (scrollTop > offsetTop - headingHeight) {
            // If a new heading is coming in, push the previous one up
            var newOffset = -(headingHeight - (offsetTop - scrollTop));
            // Get the currently visible sticky heading.
            // Because the browser sometimes scrolls the container to the top
            // when switching between search and editorial views the above code
            // which adds the sticky class to the first header is required to
            // avoid throwing an error here.
            charmContainer.one('.sticky:last-child .section-title')
                          .setStyle('marginTop', newOffset + 'px');
          }
        });
      });

    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      var tpl = this.template(this.getAttrs()),
          tplNode = Y.Node.create(tpl);

      if (window.flags && window.flags.il) {
        // Render then immediately hide the search widget to allow the state
        // to control the show/hide of the search widget.
        this._renderSearchWidget(tplNode);
        this.search.hide();
      } else {
        this._renderSearchWidget(tplNode);
      }


      if (typeof container !== 'object') {
        container = this.get('container');
      } else {
        this.set('container', container);
      }
      container.setHTML(tplNode);
      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();
    },

    /**
     * General YUI initializer.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {
      // Hold onto charm data so we can pass model instances to other views when
      // charms are selected.
      this._cache = {
        charms: new models.CharmList()
      };
      this._bindEvents();
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      if (this._stickyEvent) {
        // If the sticky headers weren't created then
        // this event won't be around to detach.
        this._stickyEvent.detach();
      }
      this._cache.charms.destroy();
      // Clean up any details view we might have hanging around.
      if (this.details) {
        this.details.destroy(true);
      }
    }
  }, {
    ATTRS: {
      /**
       * The charm id to start out selected as active.
       *
       * @attribute setActive
       * @default undefined
       * @type {String}
       *
       */
      activeID: {},

      /**
       * What is the container node we should render our container into?
       *
       * @attribute renderTo
       * @default undefined
       * @type {Node}
       */
      renderTo: {},

      /**
       * The Charmworld API store instance for loading content.
       *
       * @attribute store
       * @default undefined
       * @type {Object}
       */
      store: {},

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

      withHome: {
        value: false
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'browser-overlay-indicator',
    'browser-token',
    'browser-search-widget',
    'event-tracker',
    'juju-charm-store',
    'juju-browser-models',
    'juju-bundle-models',
    'juju-models',
    'juju-view-utils',
    'querystring-stringify',
    'view'
  ]
});
