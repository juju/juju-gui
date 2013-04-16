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
  ns.EditorialView = Y.Base.create('browser-view-sidebar', Y.View, [], {
    template: views.Templates.editorial,

    events: {
      '.charm-token': {
        click: '_handleCharmSelection'
      }
    },

    _handleCharmSelection: function(ev) {
      debugger;
      var charm = ev.currentTarget;
      var charmID = charm.getData('charmid');

      var newRoute = [
        'bws',
        this.get('isFullscreen') ? 'fullscreen' : 'sidebar',
        charmID
      ].join('/');

      this.fire('viewNavigate', {
        url: newRoute
      });
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

      // By default we grab the editorial content from the api to use for
      // display.
      this.get('store').sidebarEditorial({
        'success': function(data) {
          // Add featured charms
          var featuredCharms = this.get('store').resultsToCharmlist(
              data.result.featured);
          var featuredContainer = tplNode.one('.featured');
          var featuredCharmContainer = new widgets.browser.CharmContainer({
            name: 'Featured Charms',
            cutoff: 1,
            children: featuredCharms.map(function(charm) {
              return charm.getAttrs(); })
          });
          featuredCharmContainer.render(featuredContainer);

          // Add popular charms
          var popularCharms = this.get('store').resultsToCharmlist(
              data.result.popular);
          var popularContainer = tplNode.one('.popular');
          var popularCharmContainer = new widgets.browser.CharmContainer({
            name: 'Popular Charms',
            cutoff: 2,
            children: popularCharms.map(function(charm) {
              return charm.getAttrs(); })
          });
          popularCharmContainer.render(popularContainer);

          // Add in the charm tokens for the new as well.
          var newContainer = tplNode.one('.new');
          var newCharms = this.get('store').resultsToCharmlist(
              data.result['new']);
          var newCharmContainer = new widgets.browser.CharmContainer({
            name: 'New Charms',
            cutoff: 2,
            children: newCharms.map(function(charm) {
              return charm.getAttrs(); })
          });
          newCharmContainer.render(newContainer);

          var container = this.get('container')
          container.append(tplNode);
          this.get('renderTo').setHTML(container);

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
        },

        'failure': function(data, request) {
          var message;
          if (data && data.type) {
            message = 'Charm API error of type: ' + data.type;
          } else {
            message = 'Charm API server did not respond';
          }
          this.get('db').notifications.add(
              new models.Notification({
                title: 'Failed to load sidebar content.',
                message: message,
                level: 'error'
              })
          );
        }
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
      isFullscreen: {
        value: false
      },
      renderTo: {

      },
      store: {

      }
    }
  });

}, '0.1.0', {
  requires: [
    'browser-charm-container',
    'browser-charm-token',
    'browser-search-widget',
    'juju-charm-store',
    'juju-models',
    'juju-templates',
    'view'
  ]
});
