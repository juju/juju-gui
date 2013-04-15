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
    render: function() {

    }
  },{
    ATTRS: {}
  });

}, '0.1.0', {
  requires: [
    'view'
  ]
});
