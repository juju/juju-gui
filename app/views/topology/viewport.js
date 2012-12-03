'use strict';

YUI.add('juju-topology-viewport', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Utility function to get a number from a computed style.
   * @method styleToNumber
   * @return {Int}
   */
  function styleToNumber(selector, style, defaultSize) {
    style = style || 'height';
    defaultSize = defaultSize || 0;
    return parseInt(Y.one(selector).getComputedStyle(style) || defaultSize,
                    10);
  }


  /**
   * @module topology-service
   * @class Service
   * @namespace juju.views
   **/
  var ViewportModule = Y.Base.create('ViewportModule', d3ns.Module, [], {

    events: {
      yui: {
        windowresize: 'resized'
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
      // Build a slider to control zoom level
      if (currentScale) {
        value = currentScale * 100;
      }
      var slider = new Y.Slider({
        min: 25,
        max: 200,
        value: value
      });
      slider.render('#slider-parent');
      slider.after('valueChange', function(evt) {
        // Don't fire a zoom if there's a zoom event already in progress;
        // that will run rescale for us.
        if (d3.event && d3.event.scale && d3.event.translate) {
          return;
        }
        topology._fire_zoom((evt.newVal - evt.prevVal) / 100);
      });
      this.slider = slider;

      return this;
    },

    update: function() {
      ViewportModule.superclass.update.apply(this, arguments);
      return this;
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
          width = 800,
          height = 600;

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

      topology.width = width;
      topology.height = height;
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
