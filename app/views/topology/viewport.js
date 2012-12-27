'use strict';

YUI.add('juju-topology-viewport', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Utility function to get a number from a computed style.
   * @method styleToNumber
   */
  function styleToNumber(selector, style, defaultSize) {
    style = style || 'height';
    defaultSize = defaultSize || 0;
    return parseInt(Y.one(selector).getComputedStyle(style) || defaultSize,
                    10);
  }


  /**
   * @module topology-viewport
   * @class ViewportModule
   * @namespace views
   **/
  var ViewportModule = Y.Base.create('ViewportModule', d3ns.Module, [], {

    events: {
      yui: {
         windowresize: {
          callback: 'resized',
          context: 'module'},
        rescaled: {
          callback: 'resized',
        },
        rendered: 'renderedHandler'
      }
    },

    initializer: function(options) {
      ViewportModule.superclass.constructor.apply(this, arguments);
    },

    render: function() {
      var topology = this.get('component'),
          value = 100,
          currentScale = topology.get('scale');

      ViewportModule.superclass.render.apply(this, arguments);
     return this;
    },

    update: function() {
      ViewportModule.superclass.update.apply(this, arguments);
      return this;
    },

    /*
     * Set the visualization size based on the viewport
     */
    resized: function() {
      // This event allows other page components that may unintentionally
      // affect the page size, such as the charm panel, to get out of the
      // way before we compute sizes.  Note the
      // "afterPageSizeRecalculation" event at the end of this function.
      // start with some reasonable defaults
      var topo = this.get('component'),
          container = this.get('container'),
          vis = topo.vis,
          xscale = topo.xScale,
          yscale = topo.yScale,
          svg = container.one('svg'),
          canvas = container.one('.topology-canvas');

      if (!canvas) {
        return;
      }
      topo.fire('beforePageSizeRecalculation');
      // Get the canvas out of the way so we can calculate the size
      // correctly (the canvas contains the svg).  We want it to be the
      // smallest size we accept--no smaller or bigger--or else the
      // presence or absence of scrollbars may affect our calculations
      // incorrectly.
      canvas.setStyles({height: height, width: width});
      var dimensions = utils.getEffectiveViewportSize(true, 800, 600);
      // Set the svg sizes.
      svg.setAttribute('width', dimensions.width)
            .setAttribute('height', dimensions.height);

      // Set the internal rect's size.
      svg.one('rect')
            .setAttribute('width', dimensions.width)
            .setAttribute('height', dimensions.height);
      canvas
            .setStyle('height', dimensions.height)
            .setStyle('width', dimensions.width);

      // Reset the scale parameters
      topo.xScale.domain([-dimensions.width / 2, dimensions.width / 2])
            .range([0, dimensions.width]);
      topo.yScale.domain([-dimensions.height / 2, dimensions.height / 2])
            .range([dimensions.height, 0]);

      topo.set('size', [dimensions.width, dimensions.height]);
      topo.fire('afterPageSizeRecalculation');
    },


    /**
     * Event handler for windowresize events.
     *
     * Properly scale the component to take advantage of all the space
     * provided by the viewport.
     *
     * @method resized
     **/
    resized: function(evt) {
      // start with some reasonable defaults
      var topology = this.get('component'),
          vis = topology.vis,
          container = this.get('container'),
          viewport_height = '100%',
          viewport_width = '100%',
          svg = container.one('svg'),
          width = topo.get('width'),
          height = topo.get('height');

      if (container.get('winHeight') &&
          Y.one('#overview-tasks') &&
          Y.one('.navbar')) {
        // Attempt to get the viewport height minus the navbar at top and
        // control bar at the bottom. Use Y.one() to ensure that the
        // container is attached first (provides some sensible defaults)

        viewport_height = container.get('winHeight') -
            styleToNumber('#overview-tasks', 'height', 22) - //XXX
            styleToNumber('.navbar', 'height', 87) - 1; //XXX

        // Attempt to get the viewport width from the overview-tasks bar.
        viewport_width = styleToNumber('#viewport', 'width', 800); //XXX

        // Make sure we don't get sized any smaller than 800x600
        viewport_height = Math.max(viewport_height, height);
        viewport_width = Math.max(viewport_width, width);
      }
      // Set the svg sizes.
      svg.setAttribute('width', viewport_width)
        .setAttribute('height', viewport_height);

      // Get the resulting computed sizes (in the case of 100%).
      width = parseInt(svg.getComputedStyle('width'), 10);
      height = parseInt(svg.getComputedStyle('height'), 10);

      // Set the internal rect's size.
      svg.one('rect')
        .setAttribute('width', width)
        .setAttribute('height', height);
      container.one('#canvas').setStyle('height', height);
      container.one('#canvas').setStyle('width', width);

      // Reset the scale parameters
      topology.xscale.domain([-width / 2, width / 2])
        .range([0, width]);
      topology.yscale.domain([-height / 2, height / 2])
        .range([height, 0]);

      topology.set('size', [width, height]);
    }
  }, {
    ATTRS: {}
  });
  views.ViewportModule = ViewportModule;
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
