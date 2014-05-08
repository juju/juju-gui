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
      widgets = Y.namespace('juju.widgets'),
      DEFAULT_SEARCH_SERIES = 'precise';

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

    interestingTemplate: views.Templates.editorial,
    searchTemplate: views.Templates.search,

    events: {
      '.token': {
        click: '_handleCharmSelection'
      }
    },

    // How many of each charm container do we show by default.
    cutoffs: {
      sidebar: {
        featured: 3,
        popular: 2,
        'new': 2
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
            Y.one('#bws-sidebar').addClass('with-home');
          } else {
            // We need to adjust the height of the sidebar now to close
            // up the space by the home buttons.
            Y.one('#bws-sidebar').removeClass('with-home');
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
            metadata: {
              search: {
                clear: true
              }
            },
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
          filters: this.get('filter')
        });
        this.search.render(node.one('.bws-header'));
      }
    },

    /**
       Renders the search results from the the store query.

       @method _renderSearchResults

     */
    _renderSearchResults: function(renderTo, results) {
      var target = renderTo,
          tpl = this.searchTemplate({
            count: results.recommended.length + results.more.length
          }),
          tplNode = Y.Node.create(tpl),
          results_container = tplNode.one('.search-results');

      var recommendedContainer = new widgets.browser.TokenContainer(
          Y.merge({
            name: 'Recommended',
            cutoff: 4,
            children: results.recommended.map(function(entity) {
              return entity.getAttrs();
            })}, {
            additionalChildConfig: {
              size: 'small',
              isDraggable: true
            }
          }));

      var moreContainer = new widgets.browser.TokenContainer(
          Y.merge({
            name: 'More',
            cutoff: 4,
            children: results.more.map(function(entity) {
              return entity.getAttrs();
            })}, {
            additionalChildConfig: {
              size: 'small',
              isDraggable: true
            }
          }));

      var recommend_node = results_container.one('.recommended'),
          more_node = results_container.one('.more');
      recommendedContainer.render(recommend_node);
      moreContainer.render(more_node);
      renderTo.setHTML(tplNode);
      // XXX: We shouldn't have to do this; calling .empty before rending
      // should reset where the node's overflow is scrolled to, but it
      // doesn't. Se we scroll the heading into view to ensure the view
      // renders at the top of the content.
      target._node.scrollTop = 0;
      this.hideIndicator(renderTo);

      // Set the active charm if available.
      var active = this.get('activeID');
      if (active) {
        this.updateActive(
            renderTo.one(
                '.token[data-charmid="' + active + '"]')
        );
      }
      var cache = {
        search: results,
        charms: new models.CharmList()
      };
      cache.charms.add(results.recommended);
      cache.charms.add(results.more);
      this.fire(this.EV_CACHE_UPDATED, {cache: cache});
      this.tokenContainers = [
        recommendedContainer,
        moreContainer
      ];
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
     * Generates a message to the user based on a bad api call.
     * @method apiFailure
     * @param {Object} data the json decoded response text.
     * @param {Object} request the original io_request object for debugging.
     */
    apiFailure: function(data, request) {
      this._apiFailure(data, request, 'Failed to load editorial content.');
    },

    /**
       Renders the editorial, "interesting" data to the view.

       @private
       @method _renderInteresting
       @param {Object} data The interesting data, cached or returned from
       the API.
     */
    _renderInteresting: function(renderTo, results) {
      var cutoffs;

      // Add featured charms
      var featuredCharms = results.featuredCharms;
      var featuredContainer = renderTo.one('.featured');

      cutoffs = this.cutoffs.sidebar;

      var featuredCharmObjects = featuredCharms.map(function(charm) {
        return charm.getAttrs();
      });
      var featuredCount = featuredCharmObjects.length;
      var featuredTokenContainer = new widgets.browser.TokenContainer(
          Y.merge({
            name: 'Featured',
            cutoff: featuredCount,
            children: featuredCharmObjects
          }, {
            additionalChildConfig: {
              size: 'small',
              isDraggable: true
            }
          }));
      featuredTokenContainer.render(featuredContainer);

      // Add popular charms
      var popularCharms = results.popularCharms;
      var popularContainer = renderTo.one('.popular');
      var popularTokenContainer = new widgets.browser.TokenContainer(
          Y.merge({
            name: 'Popular',
            cutoff: cutoffs.popular,
            children: popularCharms.map(function(charm) {
              return charm.getAttrs();
            })}, {
            additionalChildConfig: {
              size: 'small',
              isDraggable: true
            }
          }));
      popularTokenContainer.render(popularContainer);

      // Add in the charm tokens for the new as well.
      var newCharms = results.newCharms;
      var newContainer = renderTo.one('.new');
      var newTokenContainer = new widgets.browser.TokenContainer(
          Y.merge({
            name: 'New',
            cutoff: cutoffs['new'],
            children: newCharms.map(function(charm) {
              return charm.getAttrs();
            })}, {
            additionalChildConfig: {
              size: 'small',
              isDraggable: true
            }
          }));
      newTokenContainer.render(newContainer);

      this.hideIndicator(renderTo);

      this.tokenContainers = [
        featuredTokenContainer,
        newTokenContainer,
        popularTokenContainer
      ];

      // Set the active charm if available.
      var active = this.get('activeID');
      if (active) {
        this.updateActive(
            renderTo.one('.token[data-charmid="' + active + '"]')
        );
      }

      // Send updated cache data to the app
      var cache = {
        interesting: results,
        charms: new models.CharmList()
      };
      cache.charms.add(newCharms);
      cache.charms.add(popularCharms);
      cache.charms.add(featuredCharms);
      this.fire(this.EV_CACHE_UPDATED, {cache: cache});
    },

    /**
     * Load the editorial content into the container specified. Implements
     * an abstract method in CharmResults.
     *
     * @method _renderResults
     * @param {Node} container An optional node to override where it's
     * going.
     *
     */
    renderInterestingResults: function(renderTo) {
      var store = this.get('store'),
          cachedResults = this.get('cachedResults');
      this.showIndicator(renderTo);

      // By default we grab the editorial content from the api to use for
      // display.
      if (cachedResults) {
        this._renderInteresting(renderTo, cachedResults);
      } else {
        store.interesting({
          'success': function(data) {
            var results = {
              featuredCharms: store.transformResults(
                  data.result.featured),
              newCharms: store.transformResults(
                  data.result['new']),
              popularCharms: store.transformResults(
                  data.result.popular)
            };
            this._renderInteresting(renderTo, results);
          },
          'failure': this.apiFailure
        }, this);
      }
    },

    /**
       Renders the searchview, rendering search results for the view's
       search text. Implements an abstract method in CharmResults.

       @method _renderResults
     */
    renderSearchResults: function(renderTo) {
      var store = this.get('store');
      var cachedResults = this.get('cachedResults');
      this.showIndicator(renderTo);
      // This is only rendered once from the subapp and so the filter is
      // the initial set from the application. All subsequent renders go
      // through the subapp so we don't have to keep the filter in sync
      // here.  If caching/reusing comes into play though an event to
      // track the change of the filter ATTR would make sense to re-draw.
      if (cachedResults) {
        this._renderSearchResults(renderTo, cachedResults);
      } else {
        var filter = this.get('filter');
        store.search(filter, {
          'success': function(data) {
            var results = store.transformResults(data.result);
            var recommended = [],
                more = [];
            var series = this.get('envSeries');
            if (!series) {
              series = DEFAULT_SEARCH_SERIES;
            }
            results.map(function(entity) {
              // If this is a charm, make sure it's approved and is of the
              // correct series to be recommended.
              if (entity.entityType === 'bundle') {
                if (entity.get('is_approved')) {
                  recommended.push(entity);
                } else {
                  more.push(entity);
                }
              } else {
                if (entity.get('is_approved') &&
                    entity.get('series') === series) {
                  recommended.push(entity);
                } else {
                  more.push(entity);
                }
              }
            }, this);

            this._renderSearchResults(renderTo, {
              recommended: recommended,
              more: more
            });
          },
          'failure': this.apiFailure
        }, this);
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
    makeStickyHeaders: function(renderTo) {
      var charmContainer = Y.one('.bws-content');
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
      var sidebarNode = Y.one('#bws-sidebar');

      this._renderSearchWidget(sidebarNode);

      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();

      if (typeof container !== 'object') {
        container = this.get('container');
      } else {
        this.set('container', container);
      }

      var charmResultsNode = this.updateResultsView();
      // Add the container to the sidebar div. Future updates will empty the
      // container and refill it.
      sidebarNode.one('.bws-content').append(charmResultsNode);
      this.makeStickyHeaders(this.get('container'));

      this.after('filterChange', function(ev) {
        this.updateResultsView();
        this.makeStickyHeaders(this.get('container'));
      }, this);

    },

    updateResultsView: function() {
      var tpl,
          tplNode,
          container = this.get('container'),
          filter = this.get('filter');

      // For each render make sure to clean up any sticky headers so the next
      // render can function properly
      if (this._stickyEvent) {
        this._stickyEvent.detach();
      }

      if (filter.text === '' || filter.text) {
        // Search needs to get some data for the template it uses so we just
        // pass the container for it to render into.
        this.set('withHome', true);
        this.renderSearchResults(container);

      } else {
        tpl = this.interestingTemplate(this.getAttrs());
        tplNode = Y.Node.create(tpl);
        container.setHTML(tplNode);
        this.set('withHome', false);

        this.renderInterestingResults(tplNode);
      }

      return container;
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

      if (this.tokenContainers) {
        Y.Array.each(this.tokenContainers, function(container) {
          container.destroy();
        });
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
       * Cached API results.
       *
       * @attribute cachedResults
       * @default {Object}
       * @type {Object}
       */
      cachedResults: {},

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
         The series in the environment, e.g. 'precise'

         @attribute envSeries
         @default undefined
         @type {String}
       */
      envSeries: {},

      /**
         The list of filter to be used in the rendering of the view.

         This is always handed down from the subapp, but default to something
         sane for tests and just in case.

         @attribute filter
         @default {Object}
         @type {Object}

       */
      filter: {
        value: {
          text: null
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
    'browser-token-container',
    'browser-search-widget',
    'event-tracker',
    'juju-charm-store',
    'juju-browser-models',
    'juju-bundle-models',
    'juju-models',
    'juju-templates',
    'juju-view-utils',
    'querystring-stringify',
    'view'
  ]
});
