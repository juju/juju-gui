/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const environmentUtils = require('./environment-utils');
const viewUtils = require('../../views/utils');

/**
  Manage panning and zooming events on the canvas.
*/
class ViewportModule {
  constructor() {
    this.name = 'ViewportModule';
    this.events = {
      window: {
        resize: 'resized'
      },
      topo: {
        rendered: 'resized'
      }
    };
  }

  /**
   * Retrieve the DOM element that contains the UI.  This exists primarily to
   * make it easy for tests to substitute their own container.
   *
   * @return {Object} A DOM node.
   * @method getContainer
   */
  getContainer() {
    // Get the DOM node if the container has been provided by YUI,
    // otherwise the container will be the DOM node already.
    const container = this.topo.container;
    return container.getDOMNode && container.getDOMNode() || container;
  }

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
  setAllTheDimensions(dimensions, canvas, svg, topo, zoomPlane) {
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
    canvas.style.width = dimensions.width + 'px';
    canvas.style.height = dimensions.height + 'px';
    // Reset the scale parameters
    var oldSize = topo.size;
    topo.size = [dimensions.width, dimensions.height];
    // If the size has actually changed (as this method is sometimes called
    // on deltas through the render method), pan to the center; otherwise,
    // leave the pan alone.
    if (oldSize[0] !== dimensions.width ||
        oldSize[1] !== dimensions.height) {
      document.dispatchEvent(new Event('topo.panToCenter'));
    }
  }

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
  resized() {
    var container = this.getContainer();
    var svg = container.querySelector('.the-canvas');
    var canvas = container.querySelector('.topology-canvas');
    // Early out for tests that do not provide a full rendering environment.
    if (!viewUtils.isValue(canvas) || !viewUtils.isValue(svg)) {
      return;
    }
    var topo = this.topo;
    var zoomPlane = container.querySelector('.zoom-plane');
    document.dispatchEvent(new Event('beforePageSizeRecalculation'));
    // This sets the minimum viewport size - y was reduced to 200 to render
    // properly on 7" tablets in horizontal view.
    var dimensions = environmentUtils.getEffectiveViewportSize(
      true, 800, 200);
    this.setAllTheDimensions(dimensions, canvas, svg, topo, zoomPlane);
    document.dispatchEvent(new Event('afterPageSizeRecalculation'));
  }
};

module.exports = ViewportModule;
