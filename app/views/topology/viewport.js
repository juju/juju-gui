'use strict';

/**
 * Provide the ViewportModule class.
 *
 * @module topology
 * @submodule topology.viewport
 */

YUI.add('juju-topology-viewport', function(Y) {
  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Manage panning and zooming events on the canvas.
   *
   * ## Emitted events:
   *
   * - *beforePageSizeRecalculation:*
   * - *afterPageSizeRecalculation:* events fired before and after the
   *   environment graph is resized to allow other sized itemsto
   *   calculate what they need.
   *
   * @class ViewportModule
   */
  views.ViewportModule = Y.Base.create('ViewportModule', d3ns.Module, [], {

    events: {
      yui: {
        windowresize: 'resized',
        rendered: 'resized'
      }
    },

    /**
     * Retrieve the DOM element that contains the UI.  This exists primarily to
     * make it easy for tests to substitute their own container.
     *
     * @return {Object} A DOM node.
     * @method getContainer
     */
    getContainer: function() {
      return this.get('container');
    },

    /**
     * Propagate new dimensions to all the places that need them.
     *
     * @method setAllTheDimensions
     * @static
     * @param {Object} dimensions The new height and width.
     * @param {Object} canvas The canvas to which impute new dimensions.
     * @param {Object} svg The SVG container to which impute new dimensions.
     * @param {Object} topo The topology view to which impute new dimensions.
     * @param {Object} zoomPlane The zoomPlane to which impute new dimensions.
     * @return {undefined} Nothing.  This function generates only side effects.
     */
    setAllTheDimensions: function(dimensions, canvas, svg, topo, zoomPlane) {
      // Get the canvas out of the way so we can calculate the size
      // correctly (the canvas contains the svg).  We want it to be the
      // smallest size we accept--no smaller or bigger--or else the
      // presence or absence of scrollbars may affect our calculations
      // incorrectly.  The real canvas size will be set in a moment.
      canvas.setStyles({height: '600px', width: '800px'});
      svg.setAttribute('width', dimensions.width);
      svg.setAttribute('height', dimensions.height);
      topo.vis.attr('width', dimensions.width);
      topo.vis.attr('height', dimensions.height);
      zoomPlane.setAttribute('width', dimensions.width);
      zoomPlane.setAttribute('height', dimensions.height);
      canvas.setStyles({
        width: dimensions.width + 'px',
        height: dimensions.height + 'px'});
      // Reset the scale parameters
      topo.set('size', [dimensions.width, dimensions.height]);
    },

    /**
     * Set the visualization size based on the viewport.
     *
     * The beforePageSizeRecalculation and afterPageSizeRecalculation events
     * allow other page components that may unintentionally affect the page
     * size, such as the charm panel, to get out of the way before we compute
     * sizes.
     *
     * @return {undefined} Nothing, this function generates only side effects.
     * @method resized
     */
    resized: function() {
      var container = this.getContainer();
      var svg = container.one('svg');
      var canvas = container.one('.topology-canvas');
      // Early out for tests that do not provide a full rendering environment.
      if (!Y.Lang.isValue(canvas) || !Y.Lang.isValue(svg)) {
        return;
      }
      var topo = this.get('component');
      var zoomPlane = container.one('.zoom-plane');
      Y.fire('beforePageSizeRecalculation');
      // This sets the minimum viewport size - y was reduced to 200 to render
      // properly on 7" tablets in horizontal view.
      var dimensions = utils.getEffectiveViewportSize(true, 800, 200);
      this.setAllTheDimensions(dimensions, canvas, svg, topo, zoomPlane);
      Y.fire('afterPageSizeRecalculation');
    }

  }, {
    ATTRS: {}
  });
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
