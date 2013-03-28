'use strict';


YUI.add('subapp-browser-fullscreen', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
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
     * Render out the main search widget and controls shared across various
     * views.
     *
     * @method _renderSearchWidget
     * @param {Node} node the node to render into.
     *
     */
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
          tplNode = Y.Node.create(tpl);

      this._renderSearchWidget(tplNode);

      if (!Y.Lang.isValue(container)) {
        container = this.get('container');
      }
      container.setHTML(tplNode);
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
          tplNode = Y.Node.create(tpl);

      this._renderSearchWidget(tplNode);
      // We need to have the template in the DOM for sub views to be able to
      // expect proper structure.
      if (!Y.Lang.isValue(container)) {
        container = this.get('container');
      }
      container.setHTML(tplNode);

      this.get('store').charm(this.get('charmID'), {
        'success': function(data) {
          var charmView = new ns.BrowserCharmView({
                charm: new models.BrowserCharm(data),
                store: this.get('store')
              });
          charmView.render(tplNode.one('.bws-view-data'));
          container.setHTML(tplNode);
        },
        'failure': this.apiFailure
      }, this);

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
    'browser-tabview',
    'juju-charm-models',
    'subapp-browser-charmview',
    'subapp-browser-mainview',
    'view'
  ]
});
