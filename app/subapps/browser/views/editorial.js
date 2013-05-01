'use strict';


/**
 * Browser Editorial View.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-editorial', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Editorial view for landing pages.
   *
   * @class Editorial
   * @extends {juju.browser.views.Editorial}
   *
   */
  ns.EditorialView = Y.Base.create('browser-view-sidebar', Y.View, [
    views.utils.apiFailingView,
    widgets.browser.IndicatorManager
  ], {
    // How many of each charm container do we show by default.
    cutoffs: {
      sidebar: {
        featured: 2,
        popular: 2,
        'new': 2
      },
      fullscreen: {
        featured: 6,
        popular: 3,
        'new': 3
      }
    },
    template: views.Templates.editorial,

    events: {
      '.charm-token': {
        click: '_handleCharmSelection'
      }
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
      if (!this.get('isFullscreen')) {
        this._updateActive(ev.currentTarget);
      }

      var change = {
        charmID: charmID
      };

      this.fire('viewNavigate', {change: change});
    },

    /**
      Update the node in the editorial list marked as 'active'.

      @method _updateActive
      @param {Node} clickTarget the charm-token clicked on to activate.

    */
    _updateActive: function(clickTarget) {
      // Remove the active class from any nodes that have it.
      Y.all('.yui3-charmtoken.active').removeClass('active');

      // Add it to the current node.
      if (clickTarget) {
        clickTarget.ancestor('.yui3-charmtoken').addClass('active');
      }
    },

    /**
     * Generates a message to the user based on a bad api call.
     * @method apiFailure
     * @param {Object} data the json decoded response text.
     * @param {Object} request the original io_request object for debugging.
     */
    apiFailure: function(data, request) {
      this._apiFailure(data, request, 'Failed to load sidebar content.');
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
      this._cacheCharms = new models.BrowserCharmList();

      // Watch for changse to the activeID so that we can mark/unmark active
      // as required.
      this.on('activeIDChange', function(ev) {
        var id = ev.newVal;
        if (id) {
          id = this.get('container').one(
              '.charm-token[data-charmid="' + id + '"]');
        }
        this._updateActive(id);
      });
    },

    /**
     * Load the editorial content into the container specified.
     *
     * @method render
     * @param {Node} container An optional node to override where it's going.
     *
     */
    render: function() {
      var tpl = this.template(this.getAttrs()),
          tplNode = Y.Node.create(tpl),
          store = this.get('store');

      this.showIndicator(this.get('renderTo'));

      // By default we grab the editorial content from the api to use for
      // display.
      this.get('store').interesting({
        'success': function(data) {
          var cutoffs;
          // Add featured charms
          var featuredCharms = this.get('store').resultsToCharmlist(
              data.result.featured);
          var featuredContainer = tplNode.one('.featured');
          if (this.get('isFullscreen')) {
            cutoffs = this.cutoffs.fullscreen;
          } else {
            cutoffs = this.cutoffs.sidebar;
          }
          var featuredCharmContainer = new widgets.browser.CharmContainer({
            name: 'Featured Charms',
            cutoff: cutoffs.featured,
            children: featuredCharms.map(function(charm) {
              return charm.getAttrs();
            }),
            additionalChildConfig: {
              size: this.get('isFullscreen') ? 'large' : 'small'
            }
          });
          featuredCharmContainer.render(featuredContainer);

          // Add popular charms
          var popularCharms = this.get('store').resultsToCharmlist(
              data.result.popular);
          var popularContainer = tplNode.one('.popular');
          var popularCharmContainer = new widgets.browser.CharmContainer({
            name: 'Popular Charms',
            cutoff: cutoffs.popular,
            children: popularCharms.map(function(charm) {
              return charm.getAttrs();
            }),
            additionalChildConfig: {
              size: this.get('isFullscreen') ? 'large' : 'small'
            }
          });
          popularCharmContainer.render(popularContainer);

          // Add in the charm tokens for the new as well.
          var newContainer = tplNode.one('.new');
          var newCharms = this.get('store').resultsToCharmlist(
              data.result['new']);
          var newCharmContainer = new widgets.browser.CharmContainer({
            name: 'New Charms',
            cutoff: cutoffs['new'],
            children: newCharms.map(function(charm) {
              return charm.getAttrs();
            }),
            additionalChildConfig: {
              size: this.get('isFullscreen') ? 'large' : 'small'
            }
          });
          newCharmContainer.render(newContainer);

          var container = this.get('container');
          container.append(tplNode);
          this.get('renderTo').setHTML(container);
          this.hideIndicator(this.get('renderTo'));

          // Add the charms to the cache for use in other views.
          // Start with a reset to empty any current cached models.
          this._cacheCharms.reset(newCharms);
          this._cacheCharms.add(popularCharms);
          this._cacheCharms.add(featuredCharms);
          this.charmContainers = [
            featuredCharmContainer,
            newCharmContainer,
            popularCharmContainer
          ];

          // Set the active charm if available.
          var active = this.get('activeID');
          if (active) {
            this._updateActive(
                container.one('.charm-token[data-charmid="' + active + '"]')
            );
          }
        },

        'failure': this.apiFailure
      }, this);
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      if (this.charmContainers) {
        Y.Array.each(this.charmContainers, function(container) {
          container.destroy();
        });
      }
      this._cacheCharms.destroy();
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
      activeID: {

      },

      /**
       * Is this rendering of the editorial view for fullscreen or sidebar
       * purposes?
       *
       * @attribute isFullscreen
       * @default false
       * @type {Boolean}
       */
      isFullscreen: {
        value: false
      },

      /**
       * What is the container node we should render our container into?
       *
       * @attribute renderTo
       * @default undefined
       * @type {Node}
       */
      renderTo: {},

      /**
       * The Charmworld0 Api store instance for loading content.
       *
       * @attribute store
       * @default undefined
       * @type {Charmworld0}
       */
      store: {}
    }
  });

}, '0.1.0', {
  requires: [
    'browser-charm-container',
    'browser-charm-token',
    'browser-overlay-indicator',
    'browser-search-widget',
    'juju-charm-store',
    'juju-models',
    'juju-templates',
    'juju-view-utils',
    'view'
  ]
});
