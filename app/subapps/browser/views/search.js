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

    _renderSearchResults: function(text, container) {
      if(!container) {
        container = this.get('container');
      }
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

    render: function(container) {
      if(container) {
        this.set('container', container);
      }
      var text = this.get('text');
      this._renderSearchResults(text);
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
