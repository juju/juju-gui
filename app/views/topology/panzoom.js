'use strict';

YUI.add('juju-topology-panzoom', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * @module topology-panzoom
   * @class PanZoomModule
   * @namespace views
   **/
  var PanZoomModule = Y.Base.create('PanZoomModule', d3ns.Module, [], {
    initializer: function(options) {
      PanZoomModule.superclass.constructor.apply(this, arguments);
    },

    render: function() {
      PanZoomModule.superclass.render.apply(this, arguments);
      return this;
    },

    update: function() {
      PanZoomModule.superclass.update.apply(this, arguments);
      return this;
    }

  }, {
    ATTRS: {}

  });
  views.PanZoomModule = PanZoomModule;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'node',
    'event',
    'juju-models',
    'juju-env'
  ]
});
