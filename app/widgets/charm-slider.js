'use strict';


/**
 * Provide the Charm Slider widget.
 *
 * @module widgets
 * @submodule juju.widgets.browser.charm-slider
 */
YUI.add('browser-charm-slider', function(Y) {

  var ns = Y.namespace('juju.widgets.browser');
  ns.CharmSlider = Y.Base.create('CharmSlider', Y.Widget, [], {

    TEMPLATE: Y.namespace('juju.views').Templates['charm-slider'],

    /**
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @method renderUI
     * @return {undefined} Mutates only.
     */
    renderUI: function() {
      var content = this.TEMPLATE;
      var cb = this.get('contentBox');
      cb.setHTML(content);

      var charmContainer = cb.one('.charm-small-container');
      Y.Array.each(this.get('charms'), function(charm) {
        charm.render(charmContainer);
      });
    }
  }, {
    ATTRS: {
      charms: {
        value: []
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'handlebars',
    'juju-templates',
    'widget'
  ]
});
