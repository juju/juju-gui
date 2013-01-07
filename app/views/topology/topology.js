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
   * Emmitted Events:
   *
   *  zoom: When the zoom level of the canvas changes a 'zoom'
   *        event is fired. Analogous to d3's zoom event.
   *
   * @class Topology
   * @namespace juju.views
   **/
  var Topology = Y.Base.create('Topology', d3ns.Component, [], {
    initializer: function(options) {
      Topology.superclass.constructor.apply(this, arguments);
      this.options = Y.mix(options || {
        minZoom: 25,
        maxZoom: 200
      });

      this._subscriptions = [];
    },

    /**
     * Called by render, conditionally attach container to the DOM if
     * it isn't already. The framework calls this before module
     * rendering so that d3 Events will have attached DOM elements. If
     * your application doesn't need this behavior feel free to override.
     *
     * In this case we currently rely on app.showView to do all the
     * container management, this only works on a preserved view.
     *
     * @method attachContainer
     * @chainable
     **/
    attachContainer: function() {
      return this;
    },

    /**
     * Remove container from DOM returning container. This
     * is explicitly not chainable.
     *
     * @method detachContainer
     **/
    detachContainer: function() {
      return;
    },


    renderOnce: function() {
      var self = this,
          vis,
          width = this.get('width'),
          height = this.get('height'),
          container = this.get('container'),
          templateName = this.options.template || 'overview';

      if (this._templateRendered) {
        return;
      }
      //container.setHTML(views.Templates[templateName]());
      // Take the first element.
      this._templateRendered = true;

      // These are defaults, a (Viewport) Module
      // can implement policy around them.
      this.computeScales();

      // Set up the visualization with a pack layout.
      vis = d3.select(container.getDOMNode())
              .selectAll('.topology-canvas')
              .append('svg:svg')
              .attr('pointer-events', 'all')
              .attr('width', width)
              .attr('height', height)
              .append('svg:g')
              .attr('class', 'zoom-plane')
              .call(this.zoom) // Set by computeScales.
              .append('g');

      vis.append('svg:rect')
         .attr('class', 'graph')
         .attr('fill', 'rgba(255,255,255,0)');

      this.vis = vis;

     Topology.superclass.renderOnce.apply(this, arguments);
      return this;
    },

    computeScales: function() {
      var self = this,
          width = this.get('width'),
          height = this.get('height');

      if (!this.xScale) {
        this.xScale = d3.scale.linear();
        this.yScale = d3.scale.linear();
        this.zoom = d3.behavior.zoom();
      }
      // Update the pan/zoom behavior manager.
      this.xScale.domain([-width / 2, width / 2])
        .range([0, width])
        .clamp(true)
        .nice();
      this.yScale.domain([-height / 2, height / 2])
        .range([height, 0])
        .clamp(true)
        .nice();

      this.zoom.x(this.xScale)
               .y(this.yScale)
               .scaleExtent([this.options.minZoom, this.options.maxZoom])
               .on('zoom', function(evt) {
                 // This will add the d3 properties to the
                 // eventFacade
                 self.fire('zoom', d3.event);
               });

      // After updating scale allow modules to perform any needed updates.
      this.fire('rescaled');
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
      translate: {
        getter: function() {return this.zoom.translate();},
        setter: function(v) {this.zoom.translate(v);}
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
