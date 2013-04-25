'use strict';


/**
 * Provides the filter widget, for selecting filters on search.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser
 */
YUI.add('browser-filter-widget', function(Y) {
  var ns = Y.namespace('juju.widgets.browser');
  /**
   * Filter widget
   *
   * @class
   * @extends {Y.Widget}
   */
  ns.Filter = Y.Base.create('Filter', Y.Widget, [], {
//prototype
  }, {
//attrs
  });

}, '0.1.0', {
  requires: [
    'base-build',
    //'event-tracker',
    //'handlebars',
    //'juju-templates',
    'widget'
  ]
});
