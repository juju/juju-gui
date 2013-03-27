'use strict';


YUI.add('browser-charm-container', function(Y) {
  var ns = Y.namespace('Y.juju.widgets.browser');

  ns.CharmContainer = Y.Base.create('browser-charm-container', Y.Widget, [
    Y.WidgetParent
  ], {
    _events: [],

    TEMPLATE: Y.namespace('juju.views').Templates['charm-small-widget'],

    initializer: function(cfg) {
      ns.CharmContainer.superclass.initializer.apply(this, cfg);
      var total = this.get('children').size,
          extra = total - this.get('cutoff');
      this.set('extra', extra);
      this.set(
          'cutoff_children',
          this.get('children').slize(0,this.get('cutoff')));
    },

    renderUI: function() {

    }
  }, {
    ATTRs: {
      defaultChildType: {
        value: Y.juju.widgets.browser.CharmSmall
      },

      cutoff: {
        value: 3
      },

      extra: {},

      name: {
        value: ''
      },

      cutoff_children: {
        value: []
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'browser-charm-small',
    'handlebars',
    'juju-templates',
    'widget',
    'widget-parent'
  ]
});
