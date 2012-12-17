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
      this.options = Y.mix(options || {});
    },

    /**
     * Called by render, conditionally attach container to the DOM if
     * it isn't already. The framework calls this before module
     * rendering so that d3 Events will have attached DOM elements. If
     * your application doesn't need this behavior feel free to override.
     *
     * @method attachContainer
     * @chainable
     **/
    attachContainer: function() {
      var container = this.get('container');
      if (container && !container.inDoc()) {
        Y.one('body').append(container);
     }
     if (this.topoNode && !this.topoNode.inDoc()) {
       container.detachAll(true);
       container.setHTML('');
       container.append(this.topoNode);
     }
     return this;
    },

    /**
     * Remove container from DOM returning container. This
     * is explicitly not chainable.
     *
     * @method detachContainer
     **/
    detachContainer: function() {
      var container = this.get('container');
      if (container.inDoc()) {
        this.topoNode = container.one('.topology');
        this.topoNode.remove();
      }
      return container;
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

      // Build out scale and zoom.
      // These are defaults, a Module
      // can implement policy around them.
      this.sizeChangeHandler();
      this.on('sizeChanged', this.sizeChangeHandler);

      Topology.superclass.renderOnce.apply(this, arguments);
      return this;
    },

    sizeChangeHandler: function() {
      var self = this,
          width = this.get('width'),
          height = this.get('height'),
          vis = this.vis;

      // Create a pan/zoom behavior manager.
      this.xScale = d3.scale.linear()
                      .domain([-width / 2, width / 2])
                      .range([0, width]),
      this.yScale = d3.scale.linear()
                      .domain([-height / 2, height / 2])
                      .range([height, 0]);

      // Include very basic behavior, fire
      // yui event for anything more complex.
      this.zoom = d3.behavior.zoom()
                    .x(this.xScale)
                    .y(this.yScale)
                    .scaleExtent([0.25, 2.0])
                    .on('zoom', function(evt) {
                      self.fire('zoom');
                    });
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
