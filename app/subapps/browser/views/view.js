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
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');

  /**
   * Base shared view for MainView sidebar and fullscreen.
   *
   * @class MainView
   * @extends {Y.View}
   *
   */
  ns.MainView = Y.Base.create('browser-view-mainview', Y.View, [
    Y.Event.EventTracker
  ], {

    /**
     * When we click the fullscreen toggle UX widget, what url do we route to.
     * We have to dump this into the template because we can't dynamically
     * showView/navigate from here.
     *
     * Views extending this should implement the url path.
     *
     * @attribute _fullscreenTarget
     * @default ''
     * @type {String}
     *
     */
    _fullscreenTarget: '',
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
      // Watch the Search widget for changes to the search params.
      this.addEvent(
          this.search.on(
              this.search.EVT_UPDATE_SEARCH, this._searchChanged, this)
      );

      this.addEvent(
          this.search.on(
              this.search.EVT_TOGGLE_VIEWABLE, this._toggleBrowser, this)
      );

      this.addEvent(
          this.search.on(
              this.search.EVT_TOGGLE_FULLSCREEN, this._toggleFullscreen, this)
      );
    },

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
      this.search.render(node.one('.bws-header'));
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
      // NB: This is temporary; eventually filtering will include categories,
      // and the Filter object will handle qs generation. But it's an unwieldy
      // url to parse while we only support text search.
      var qs = Y.QueryString.stringify({text: ev.details[0]});
      var change = {
        search: true,
        querystring: qs
      };
      this.fire('viewNavigate', {
        change: change
      });
    },

    /**
     * Toggle the visibility of the browser. Bound to nav controls in the
     * view, however this will be expanded to be controlled from the new
     * constant nav menu outside of the view once it's completed.
     *
     * @method _toggle_sidebar
     * @param {Event} ev event to trigger the toggle.
     *
     */
    _toggleBrowser: function(ev) {
      ev.halt();
      var sidebar = Y.one('.charmbrowser');

      if (this.visible) {
        sidebar.hide();
        this.visible = false;
      } else {
        sidebar.show();
        this.visible = true;
      }
    },

    /**
        Upon clicking the fullscreen toggle icon make sure we re-route to the
        new form of the UX.

        @method _toggleFullscreen
        @param {Event} ev the click event handler on the button.

     */
    _toggleFullscreen: function(ev) {
      ev.halt();
      var change = {
        viewmode: this.isFullscreen() ? 'sidebar' : 'fullscreen'
      };
      this.fire('viewNavigate', {
        change: change
      });
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      this._cacheCharms.destroy();

      // Clean up any details view we might have hanging around.
      if (this.details) {
        this.details.destroy(true);
      }
    },

    /**
     * General YUI initializer.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {
      this.set('store', new Y.juju.Charmworld0({
        'apiHost': window.juju_config.charmworldURL
      }));

      // Hold onto charm data so we can pass model instances to other views when
      // charms are selected.
      this._cacheCharms = new models.BrowserCharmList();
    },

    /**
     * Check if this view is the fullscreen version to help aid us in
     * template work.
     *
     * @method isFullscreen
     * @return {{Bool}}
     *
     */
    isFullscreen: function() {
      if (this.name.indexOf('fullscreen') === -1) {
        return false;
      } else {
        return true;
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
    'browser-charm-token',
    'browser-search-widget',
    'event-tracker',
    'juju-charm-store',
    'juju-models',
    'querystring-stringify',
    'view'
  ]
});
