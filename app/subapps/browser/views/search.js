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
      widgets = Y.namespace('juju.widgets');

  ns.BrowserSearchView = Y.Base.create('browser-view-searchview', Y.View, [
    widgets.browser.IndicatorManager,
    Y.Event.EventTracker
  ], {

    _renderSearchResults: function(container) {
      // Don't render search results if the view has never been rendered.
      if (!this.get('rendered')) {
        return;
      }
      if(!container) {
        container = this.get('container');
      }
      var text = this.get('text');
      this.get('store').search(text, {
        'success': function(data) {
          var results = this.get('store').resultsToCharmlist(data.result);
          results.map(function(charm) {
            var ct = new widgets.browser.CharmToken(charm.getAttrs());
            ct.render(container);
          });
        }
      }, this);
    },

    initializer: function() {
      this.addEvent(this.after('textChange', this._renderSearchResults));
    },

    render: function(container) {
      this.set('rendered', true);
      if(container) {
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
