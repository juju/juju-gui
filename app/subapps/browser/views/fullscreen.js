'use strict';


YUI.add('subapp-browser-fullscreen', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class FullScreen
   * @extends {Y.View}
   *
   */
  ns.FullScreen = Y.Base.create('browser-view-fullscreen', Y.View, [], {
    _events: [],
    _fullscreenTarget: '/bws/sidebar',

    template: views.Templates.fullscreen,

    /**
     * @attribute events
     *
     */
    events: {},

    /**
     * Bind the non native DOM events from within the View. This includes
     * watching widgets used for their exposed events.
     *
     * @method _bindEvents
     * @private
     *
     */
    _bindEvents: function() {
      // Watch the Search widget for changes to the search params.
      this._events.push(
          this.search.on(
              this.search.EVT_UPDATE_SEARCH, this._searchChanged, this)
      );

      this._events.push(
          this.search.on(
              this.search.EVT_TOGGLE_VIEWABLE, this._toggleSidebar, this)
      );
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
     * When the search term or filter is changed, fetch new data and redraw.
     *
     * @method _searchChanged
     * @param {Event} ev event object from catching changes.
     * @private
     *
     */
    _searchChanged: function(ev) {
      console.log('Fullscreen search changed.');
    },

    /**
     * Toggle the visibility of the sidebar. Bound to nav controls in the
     * view, however this will be expanded to be controlled from the new
     * constant nav menu outside of the view once it's completed.
     *
     * @method _toggle_sidebar
     * @param {Event} ev event to trigger the toggle.
     *
     */
    _toggleSidebar: function(ev) {
      var sidebar = Y.one('#bws-sidebar');

      if (this.visible) {
        sidebar.hide();
        this.visible = false;
      } else {
        sidebar.show();
        this.visible = true;
      }
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      console.log('sidebar view destructor');
      Y.Array.each(this._events, function(ev) {
        ev.detach();
      });

      if (this.slider) {
        this.slider.destroy();
      }
    },

    /**
     * Gereral YUI initializer.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {},

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      this._renderEditorialView(container);

      // Bind extra events that aren't covered by the Y.View events object.
      this._bindEvents();
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
    'view'
  ]
});
