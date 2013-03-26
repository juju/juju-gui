'use strict';


YUI.add('subapp-browser-fullscreen', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class FullScreen
   * @extends {juju.browser.views.MainView}
   *
   */
  ns.FullScreen = Y.Base.create('browser-view-fullscreen', ns.MainView, [], {
    _fullscreenTarget: '/bws/sidebar',

    template: views.Templates.fullscreen,

    _renderSearchWidget: function(node) {
      this.search = new widgets.browser.Search({
        fullscreenTarget: this._fullscreenTarget
      });
      this.search.render(node.one('.bws-search'));
    },

    /**
     * The default view is the editorial rendering. Render this view out.
     *
     * @method _renderEditorialView
     * @param {Node} container node to render out to.
     *
     */
    _renderEditorialView: function(container) {
      var tpl = this.template(),
          tpl_node = Y.Node.create(tpl);

      this._renderSearchWidget(tpl_node);

      if (!Y.Lang.isValue(container)) {
        container = this.get('container');
      }
      container.setHTML(tpl_node);
    },

    /**
     * Render the view of a single charm details page.
     *
     * @method _renderCharmView
     * @param {Node} container node to render out to.
     *
     */
    _renderCharmView: function(container) {
      var tpl = this.template(),
          tpl_node = Y.Node.create(tpl);
      this._renderSearchWidget(tpl_node);

      // fetch the charm data from the api.
      var charmData = this.get('store').

      if (!Y.Lang.isValue(container)) {
        container = this.get('container');
      }
      container.setHTML(tpl_node);
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     * @param {Node} container optional specific container to render out to.
     *
     */
    render: function(container) {
      if (this.get('charmID')) {
        this._renderCharmView(container);
      } else {
        this._renderEditorialView(container);
      }

      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();
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
       * An instance of the Charmworld API object to hit for any data that
       * needs fetching.
       *
       * @attribute store
       * @default undefined
       * @type {Charmworld0}
       *
       */
      store: {},

      /**
       * If this were a route that had a subpath component it's passed into
       * the view to aid in rendering.
       *
       * e.g. /bws/fullscreen/*charmid/hooks to load the hooks tab correctly.
       *
       * @attribute subpath
       * @default undefined
       * @type {String}
       *
       */
      subpath: {}
    }
  });

}, '0.1.0', {
  requires: [
    'browser-search-widget',
    'subapp-browser-mainview',
    'view'
  ]
});
