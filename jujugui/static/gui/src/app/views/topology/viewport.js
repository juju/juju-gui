/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
      comp = Y.namespace('d3-components');

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
  views.ViewportModule = Y.Base.create('ViewportModule', comp.Module, [], {

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
      var oldSize = topo.get('size');
      topo.set('size', [dimensions.width, dimensions.height]);
      // If the size has actually changed (as this method is sometimes called
      // on deltas through the render method), pan to the center; otherwise,
      // leave the pan alone.
      if (oldSize[0] !== dimensions.width ||
          oldSize[1] !== dimensions.height) {
        topo.fire('panToCenter');
      }
    },

    /**
     * Set the visualization size based on the viewport.
     *
     * The beforePageSizeRecalculation and afterPageSizeRecalculation events
     * allow other page components that may unintentionally affect the page
     * size, such as the charm panel, to get out of the way before we compute
     * sizes.
     *
     * @method resized
     * @return {undefined} Nothing, this function generates only side effects.
     */
    resized: function() {
      var container = this.getContainer();
      var svg = container.one('.the-canvas');
      var canvas = container.one('.topology-canvas');
      // Early out for tests that do not provide a full rendering environment.
      if (!utils.isValue(canvas) || !utils.isValue(svg)) {
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
    ATTRS: {
      /**
        @property {d3ns.Component} component
      */
      component: {}
    }
  });
}, '0.1.0', {
  requires: [
    'd3-components',
    'node',
    'event',
  ]
});
