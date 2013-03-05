'use strict';


/**
 * Provide the Charm Small widget.
 *
 * @module widgets
 * @submodule juju.widgets.browser.charm-small
 */
YUI.add('browser-charm-slider', function(Y) {

  var ns = Y.namespace('juju.widgets.browser');
  ns.CharmSlider = Y.Base.create('CharmSlider', Y.Widget, [], {
  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: [
    'base',
    //'handlebars',
    //'juju-templates',
    'widget'
  ]
});
