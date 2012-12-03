'use strict';

YUI.add('juju-topology', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Topology models and renders the SVG of the envionment topology
   * with its associated behaviors.
   *
   * The line of where to put code (in the Topology vs a Module) isn't 100%
   * clear. The rule of thumb to follow is that shared state, policy and
   * configuration belong here. If the only shared requirement on shared state
   * is watch/event like behavior fire an event and place the logic in a module.
   *
   * @class Topology
   * @namespace juju.views
   **/
  var Topology = Y.Base.create('Topology', d3ns.Component, [], {
    initializer: function(options) {
      Topology.superclass.constructor.apply(this, arguments);
      this.options = Y.mix(options || {});
    },

    renderOnce: function() {
      var self = this,
          vis,
          width = this.get('width'),
          height = this.get('height'),
          container = this.get('container'),
          templateName = this.options.template || 'overview';

      if (this.svg) {
        return;
      }
      container.setHTML(views.Templates[templateName]());
      // Take the first element.
      this.svg = container.one(':first-child');

      // Set up the visualization with a pack layout.
      vis = d3.select(container.getDOMNode())
      .selectAll('.topology-canvas')
      .append('svg:svg')
      .attr('pointer-events', 'all')
      .attr('width', width)
      .attr('height', height)
      .append('svg:g')
      .append('g');

      vis.append('svg:rect')
      .attr('class', 'graph')
      .attr('fill', 'rgba(255,255,255,0)');

      this.vis = vis;

      this.zoom = d3.behaviors.zoom();


      return this;
    }

  }, {
    ATTRS: {
      /**
       * @property {models.Database} db
       **/
      db: {},
      /**
       * @property {store.Environment} env
       **/
      env: {},
      /**
       * @property {Array} size
       * A [width, height] tuple representing canvas size.
       **/
      size: {value: [640, 480]},
      /**
       * @property {Number} scale
       **/
      scale: {
        getter: function() {return this.zoom.scale();},
        setter: function(v) {this.zoom.scale(v);}
      },
      /**
       * @property {Array} transform
       **/
      transform: {
        getter: function() {return this.get('zoom').transform();},
        setter: function(v) {this.get('zoom').transform(v);}
      },

      width: {
        getter: function() {return this.get('size')[0];}
      },

      height: {
        getter: function() {return this.get('size')[1];}
      }
    }

  });
  views.Topology = Topology;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'node',
    'event',
    'juju-templates',
    'juju-models',
    'juju-env',
    'juju-topology-mega',
    'juju-topology-service',
    'juju-topology-relation',
    'juju-topology-panzoom',
    'juju-topology-viewport'
  ]
});
