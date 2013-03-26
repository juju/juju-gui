'use strict';


YUI.add('browser-charm-container', function(Y) {
  var ns = Y.namespace('Y.juju.widgets.browser');

  ns.CharmContainer = Y.Base.create('browser-charm-container', Y.Widget, [
    Y.WidgetParent
  ], {
    TEMPLATE: '<div></div>'
  }, {
    ATTRs: {
      cutoff: {
        value: 3
      }
    }
  });
