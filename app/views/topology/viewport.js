'use strict';

YUI.add('juju-topology-viewport', function(Y) {
  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Utility function to get a number from a computed style.
   * @method styleToNumber
   */
  function styleToNumber(selector, style, defaultSize) {
    style = style || 'height';
    defaultSize = defaultSize || 0;
    return parseInt(
      Y.one(selector).getComputedStyle(style) || defaultSize,
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
        windowresize: 'resized',
        rendered: 'resized'
      }
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
          svg = container.one('svg'),
          canvas = container.one('.topology-canvas'),
          rect = container.one('rect'),
          newSize = {};

      if (!canvas || !svg) {
        return;
      }
      topo.fire('beforePageSizeRecalculation');
      // Get the canvas out of the way so we can calculate the size
      // correctly (the canvas contains the svg).  We want it to be the
      // smallest size we accept--no smaller or bigger--or else the
      // presence or absence of scrollbars may affect our calculations
      // incorrectly.
      canvas.setStyles({height: 600, width: 800});
      var dimensions = utils.getEffectiveViewportSize(true, 800, 600);
      console.log('resize viewport', dimensions);
      svg.setAttribute('width', dimensions.width);
      svg.setAttribute('height', dimensions.height);

      newSize.width = dimensions.width;
      newSize.height = dimensions.height;
      svg.one('.zoom-plane').setStyles(newSize);
      canvas.setStyles(newSize);
      rect.setStyles(newSize);
      // Reset the scale parameters
      topo.set('size', [dimensions.width, dimensions.height]);
      topo.fire('afterPageSizeRecalculation');
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
