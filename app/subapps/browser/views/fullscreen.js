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

      this.search = new widgets.browser.Search({
        fullscreenTarget: this._fullscreenTarget
      });
      this.search.render(tpl_node.one('.bws-search'));

      if (!Y.Lang.isValue(container)) {
        container = this.get('container');
      }
      container.setHTML(tpl_node);
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
    ATTRS: {
      /**
       * An instance of the Charmworld API object to hit for any data that
       * needs fetching.
       *
       * @attribute store
       * @default undefined
       * @type {Charmworld0}
       *
       */
      store: {}
    }
  });

}, '0.1.0', {
  requires: [
    'browser-search-widget',
    'subapp-browser-mainview',
    'view'
  ]
});
