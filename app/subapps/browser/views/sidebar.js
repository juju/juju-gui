'use strict';


/**
 * Browser SubApp Sidebar View handler.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-sidebar', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Sidebar master view for the gui browser.
   *
   * @class Sidebar
   * @extends {juju.browser.views.MainView}
   *
   */
  ns.Sidebar = Y.Base.create('browser-view-sidebar', ns.MainView, [], {
    _fullscreenTarget: '/bws/fullscreen',

    template: views.Templates.sidebar,
    visible: true,

    events: {
      '.charm-token': {
        'click': '_handleTokenSelect'
      }
    },

    /**
     * Event handler for selecting a charm from a list on the page. Forces a
     * render of the charm details view for the user.
     *
     * @method _handleTokenSelect
     * @param {Event} ev the click event from the charm token.
     *
     */
    _handleTokenSelect: function(ev) {
      var id = ev.currentTarget.getData('charmid');
      var model = this._cacheCharms.getById(id);
      var container = this.get('container');

      // Deselect the currently selected charm and highlight the new one.
      var selected_charm = container.one('.yui3-charmtoken.active');
      if (selected_charm) {
        selected_charm.removeClass('active');
      }
      ev.currentTarget.ancestor('.yui3-charmtoken').addClass('active');

      // Show the details view for this model.
      this._renderCharmDetails(
          model,
          container
      );
    },

    /**
     * Initially we load editorial content to populate the sidebar. Build this
     * content.
     *
     * @method _renderEditorialView
     * @param {Node} container A node to stick the rendered output into.
     *
     */
    _renderEditorialView: function(container) {
      var tpl = this.template(),
          tplNode = Y.Node.create(tpl),
          store = this.get('store');

      this._renderSearchWidget(tplNode);

      if (typeof container !== 'object') {
        container = this.get('container');
      } else {
        this.set('container', container);
      }

      container.setHTML(tplNode);
      Y.one('#subapp-browser').append(container);

      // By default we grab the editorial content from the api to use for
      // display.
      this.get('store').sidebarEditorial({
        'success': function(data) {

          // Add featured charms
          var featuredCharms = this.get('store').resultsToCharmlist(
              data.result.featured);
          var featuredContainer = container.one('.bws-left .featured');
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
          var popularContainer = container.one('.bws-left .popular');
          var popularCharmContainer = new widgets.browser.CharmContainer({
            name: 'Popular Charms',
            cutoff: 2,
            children: popularCharms.map(function(charm) {
              return charm.getAttrs(); })
          });
          popularCharmContainer.render(popularContainer);

          // Add in the charm tokens for the new as well.
          var newContainer = container.one('.bws-left .new');
          var newCharms = this.get('store').resultsToCharmlist(
              data.result['new']);
          var newCharmContainer = new widgets.browser.CharmContainer({
            name: 'New Charms',
            cutoff: 2,
            children: newCharms.map(function(charm) {
              return charm.getAttrs(); })
          });
          newCharmContainer.render(newContainer);

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
      // if (this.charmContainers) {
      //   Y.Array.each(this.charmContainers, function(container) {
      //     container.destroy();
      //   });
      // }
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      this._renderEditorialView(container);
      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();
    }

  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: [
    'browser-charm-container',
    'browser-charm-token',
    'browser-search-widget',
    'juju-charm-store',
    'juju-models',
    'juju-templates',
    'subapp-browser-charmview',
    'subapp-browser-mainview',
    'view'
  ]
});
