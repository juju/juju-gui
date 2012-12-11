'use strict';

YUI.add('juju-topology-service', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * @module topology-service
   * @class ServiceModule
   * @namespace views
   **/
  var ServiceModule = Y.Base.create('ServiceModule', d3ns.Module, [], {
    subordinate_margin: {
      top: 0.05,
      bottom: 0.1,
      left: 0.084848,
      right: 0.084848},

    service_margin: {
      top: 0,
      bottom: 0.1667,
      left: 0.086758,
      right: 0.086758},

    initializer: function(options) {
      ServiceModule.superclass.constructor.apply(this, arguments);
      // Mapping of serviceId to BoundingBox of service.
      this.service_boxes = {};

    },

    componentBound: function() {
      var component = this.get('component');
      //component.on('sizeChange', this._scaleLayout);
      this._scaleLayout();
    },

    _scaleLayout: function() {
      this.layout = d3.layout.pack()
         .size(this.get('component').get('size'))
         .value(function(d) {return d.unit_count;})
         .padding(300);
    },

    render: function() {
      return this;
    },

    update: function() {
   }
  }, {
    ATTRS: {}

  });
  views.ServiceModule = ServiceModule;
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
