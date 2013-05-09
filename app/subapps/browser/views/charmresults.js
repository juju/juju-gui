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
   * Charm results view.
   *
   * The Editorial and the Search results view share some basic info.
   *
   * @class CharmReults
   * @extends {juju.browser.views.CharmResults}
   *
   */
  ns.CharmResults = Y.Base.create('browser-view-charmresults', Y.View, [
    views.utils.apiFailingView,
    widgets.browser.IndicatorManager
  ], {
    events: {
      '.charm-token': {
        click: '_handleCharmSelection'
      }
    },

    _bindEvents: function() {
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
      this._apiFailure(data, request, 'Failed to load editorial content.');
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
      this._bindEvents();
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
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
    'juju-models',
    'browser-overlay-indicator',
    'juju-view-utils',
    'view'
  ]
});
