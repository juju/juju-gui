/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const d3 = require('d3');

/**
  Handle PanZoom within a Topology.
*/
class PanZoomModule {
  constructor() {
    this.name = 'PanZoomModule';
    this.events = {
      topo: {
        /**
          Fired when the canvas is zoomed.
          @event zoom
        */
        zoom: 'zoomHandler',
        /**
          Build pan and zoom functionality when the canvas is rendered.
          @event rendered
        */
        rendered: 'renderedHandler',
        zoom_in: 'zoom_in',
        zoom_out: 'zoom_out',
        panToPoint: 'panToPoint'
      }
    };
    this.STEP = 0.2;
  }

  componentBound() {
    const topo = this.topo;
    this.toScale = d3.scale.linear()
      .domain([topo.minZoom, topo.maxZoom])
      .range([topo.minZoom, topo.maxZoom])
      .clamp(true);
  }

  /**
    Handler for 'zoom_in' event.
  */
  zoom_in() {
    this._fire_zoom(this.topo.getScale() + this.STEP);
  }

  /**
    Handler for 'zoom_out' event.
  */
  zoom_out() {
    this._fire_zoom(this.topo.getScale() - this.STEP);
  }

  /**
    Handler for 'zoom' event.
  */
  zoomHandler(evt) {
    // Let rescale handle the actual transformation; evt.scale and
    // evt.translate have both been set by D3 at this point.
    this.rescale(evt);
  }

  /**
    Mouseover event handler.
  */
  add_hover_out(data, self) {
    this.className = this.className + ' zoom_m_h';
  }

  /**
    Mouseover event handler.
  */
  add_hover_in(data, self) {
    this.className = this.className + ' zoom_p_h';
  }

  /**
    Mouseout event handler
  */
  remove_hover_out(data, self) {
    this.className = this.className.replace(' zoom_m_h', '');
  }

  /**
    Mouseout event handler
  */
  remove_hover_in(data, self) {
    this.className = this.className.replace(' zoom_p_h', '');
  }

  /**
    Wrapper around the actual rescale method for zoom buttons.
  */
  _fire_zoom(scale) {
    var topo = this.topo,
        zoom = topo.zoom,
        size = topo.size,
        delta,
        evt = {};

    delta = scale - topo.getScale();

    // Build a temporary event that rescale can use of a similar
    // construction to d3.event.
    evt.scale = scale;
    // Update the scale in our zoom behavior manager to maintain state.
    zoom.scale(Math.floor(scale));
    // Update the translate so that we scale from the center
    // instead of the origin.
    evt.translate = zoom.translate();
    evt.translate[0] -= (size[0] / 2) * delta;
    evt.translate[1] -= (size[1] / 2) * delta;

    this.rescale(evt);
    // TODO Makyo - pan to center of canvas, card on board.
    document.dispatchEvent(new Event('topo.panToCenter'));
  }

  /**
    Rescale the visualization on a zoom/pan event.
  */
  rescale(evt) {
    // Make sure we don't scale outside of our bounds.
    // This check is needed because we're messing with d3's zoom
    // behavior outside of mouse events,
    // and can't trust that zoomExtent will play well.
    var topo = this.topo,
        vis = this.topo.vis;

    if (!vis) {
      return;
    }

    // Ensure that we're definitely within bounds by coercing the scale
    // to fit within our range.
    evt.scale = this.toScale(evt.scale);

    // Store the current value of scale so that it can be restored later.
    topo.setScale(evt.scale);
    // Store the current value of translate as well, by copying the event
    // array in order to avoid reference sharing.
    topo.setTranslate([...evt.translate]);
    vis.attr('transform', 'translate(' + topo.getTranslate() + ')' +
            ' scale(' + topo.getScale() + ')');
  }

  renderedHandler(evt) {
    // Preserve zoom when the scene is updated.
    var topo = this.topo,
        changed = false,
        currentScale = topo.getScale(),
        currentTranslate = topo.getTranslate();
    if (currentTranslate && currentTranslate !== topo.getTranslate()) {
      topo.zoom.translate(currentTranslate);
      changed = true;
    }
    if (currentScale && currentScale !== topo.zoom.scale()) {
      topo.zoom.scale(currentScale);
      changed = true;
    }
    if (changed) {
      this.rescale({scale: currentScale, translate: currentTranslate});
    }
  }

  /**
    Pans the environment so that the given point is in the center of the
    viewport.
    @param {object} evt The event handler with a 'point' attribute.
    @return {undefined} Side effects only.
  */
  panToPoint(evt) {
    const point = evt.point,
        topo = this.topo,
        scale = topo.getScale(),
        size = [window.innerWidth, window.innerHeight],
        translate = topo.getTranslate();
    const offset = topo.zoom.translate();
    const screenWidth = size[0];
    const screenHeight = size[1];
    // Translate the points to values that can be compared with the current
    // screen area.
    const pointX = (point[0] * scale) + offset[0];
    const pointY = (point[1] * scale) + offset[1];
    // Find out if the points we have are within the screen rectangle
    // (accounting for the size of the app circle).
    const circleSize = 200 * scale;
    // Set an extra space so the circles don't appear at the very edge.
    let newX = translate[0];
    let newY = translate[1];
    if (evt.center) {
      // If we do actually want to center the screen on the point then figure
      // out the new points.
      const newXY = point.map((d, i) => ((0 - d) * scale) + (size[i] / 2));
      newX = newXY[0];
      newY = newXY[1];
    } else {
      // If the point is outside the screen or the service is overlapping the
      // edge then move the circle to just within the viewport.
      const space = 40;
      if (pointX < 0) {
        // If the circle is outside the left edge of the screen move it.
        newX = (translate[0] - pointX) + space;
      } else if (pointX > screenWidth - circleSize) {
        // If the circle is outside the right edge of the screen move it.
        newX = translate[0] +
          ((screenWidth - (pointX + circleSize)) - space);
      }
      if (pointY < 0) {
        // If the circle is outside the top edge of the screen move it.
        newY = (translate[1] - pointY) + space;
      } else if (pointY > screenHeight - circleSize) {
        // If the circle is outside the bottom edge of the screen move it.
        newY = translate[1] +
          ((screenHeight - (pointY + circleSize)) - space);
      }
    }
    // If there are new coordinates then pan to them.
    if (newX !== translate[0] || newY !== translate[1]) {
      this.rescale({
        scale: scale,
        translate: [newX, newY]
      });
    }
  }
};

module.exports = PanZoomModule;
