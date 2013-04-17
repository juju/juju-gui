'use strict';


/**
 * Provides searching functionality for the charm browser.
 *
 * @namespace juju
 * @module browser
 * @submodule views
 */
YUI.add('subapp-browser-searchview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      models = Y.namespace('juju.models');

  ns.BrowserSearchView = Y.Base.create('browser-view-searchview', Y.View, [
    Y.Event.EventTracker
  ], {

    /**
     * Renders the search results from the the store query.
     *
     * @method _renderSearchResults
     * @param {Y.Node} container Optional container to render results to.
     */
    _renderSearchResults: function(container) {
      // Don't render search results if the view has never been rendered.
      if (!this.get('rendered')) {
        return;
      }
      if (!container) {
        container = this.get('container');
      }
      var text = this.get('text');
      this.get('store').search(text, {
        'success': function(data) {
          var results = this.get('store').resultsToCharmlist(data.result);
          container.empty();
          results.map(function(charm) {
            var ct = new widgets.browser.CharmToken(charm.getAttrs());
            ct.render(container);
          });
        },
        'failure': this.apiFailure
      }, this);
    },

    /**
     * Generates a message to the user based on a bad api call.
     *
     * @method apiFailure
     * @param {Object} data the json decoded response text.
     * @param {Object} request the original io_request object for debugging.
     *
     */
    apiFailure: function(data, request) {
      var message;
      if (data && data.type) {
        message = 'Charm API error of type: ' + data.type;
      } else {
        message = 'Charm API server did not respond';
      }
      this.get('db').notifications.add(
          new models.Notification({
            title: 'Failed to load search results.',
            message: message,
            level: 'error'
          })
      );
    },

    /**
     * Initializer
     *
     * @method initializer
     */
    initializer: function() {
      this.addEvent(
          this.after('textChange', function(e) {
            var container = e.currentTarget.get('container');
            this._renderSearchResults(container);
          }));
    },

    /**
     * Renders the searchview, rendering search results for the view's search
     * text.
     *
     * @method
     * @param {container} The view's container to render to.
     */
    render: function(container) {
      this.set('rendered', true);
      if (container) {
        this.set('container', container);
      }
      this._renderSearchResults();
    }
  }, {
    ATTRS: {
      /**
       * The container node for the view.
       *
       * @attribute container
       * @default undefined
       * @type {Y.Node}
       */
      container: {},

      /**
       * Whether the view had been rendered; used to avoid rendering before a
       * render call with the textChange event.
       *
       * @attribute rendered
       * @default false
       * @type {boolean}
       */
      rendered: {
        value: false
      },

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
       * The text being searched on
       *
       * @attribute text
       * @default ''
       * @type {String}
       */
      text: {}
    }
  });

}, '0.1.0', {
  requires: [
    'event-tracker',
    'browser-overlay-indicator',
    'base-build',
    'browser-charm-token',
    'view'
  ]
});
