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
 * Provide the PanZoomModule class.
 *
 * @module topology
 * @submodule topology.panzoom
 */

YUI.add('juju-topology-panzoom', function(Y) {
  var views = Y.namespace('juju.views'),
      d3 = Y.namespace('d3'),
      components = Y.namespace('d3-components');

  /**
   * Handle PanZoom within a Topology.
   *
   * ## Emitted events:
   *
   * - *rescaled:* post-zoom event, after the scene has been rescaled,
   *   queried object positions should be accurate.
   *
   * @class PanZoomModule
   */
  var PanZoomModule = Y.Base.create('PanZoomModule', components.Module, [], {

    events: {
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
    },

    STEP: 0.2,

    componentBound: function() {
      var topo = this.get('component'),
          options = topo.options;

      this.toScale = d3.scale.linear()
        .domain([options.minZoom, options.maxZoom])
        .range([options.minZoom, options.maxZoom])
        .clamp(true);
    },

    /**
     * Handler for 'zoom_in' event.
     *
     * @method zoom_in
     */
    zoom_in: function() {
      this._fire_zoom(this.get('component').get('scale') + this.STEP);
    },

    /**
     * Handler for 'zoom_out' event.
     *
     * @method zoom_out
     */
    zoom_out: function() {
      this._fire_zoom(this.get('component').get('scale') - this.STEP);
    },

    /**
     * Handler for 'zoom' event.
     *
     * @method zoomHandler
     */
    zoomHandler: function(evt) {
      // Let rescale handle the actual transformation; evt.scale and
      // evt.translate have both been set by D3 at this point.
      this.rescale(evt);
    },

    /**
     * Mouseover event handler.
     *
     * @method add_hover
     */
    add_hover_out: function(data, self) {
      this.className = this.className + ' zoom_m_h';
    },

    /**
     * Mouseover event handler.
     *
     * @method add_hover
     */
    add_hover_in: function(data, self) {
      this.className = this.className + ' zoom_p_h';
    },

    /**
     * Mouseout event handler
     *
     * @method remove_hover
     */
    remove_hover_out: function(data, self) {
      this.className = this.className.replace(' zoom_m_h', '');
    },

    /**
     * Mouseout event handler
     *
     * @method remove_hover
     */
    remove_hover_in: function(data, self) {
      this.className = this.className.replace(' zoom_p_h', '');
    },

    /**
     * Wrapper around the actual rescale method for zoom buttons.
     *
     * @method _fire_zoom
     */
    _fire_zoom: function(scale) {
      var topo = this.get('component'),
          zoom = topo.zoom,
          size = topo.get('size'),
          delta,
          evt = {};

      delta = scale - topo.get('scale');

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
    },

    /**
     * Rescale the visualization on a zoom/pan event.
     *
     * @method rescale
     */
    rescale: function(evt) {
      // Make sure we don't scale outside of our bounds.
      // This check is needed because we're messing with d3's zoom
      // behavior outside of mouse events,
      // and can't trust that zoomExtent will play well.
      var topo = this.get('component'),
          vis = topo.vis;

      if (!vis) {
        return;
      }

      // Ensure that we're definitely within bounds by coercing the scale
      // to fit within our range.
      evt.scale = this.toScale(evt.scale);

      // Store the current value of scale so that it can be restored later.
      topo.set('scale', evt.scale);
      // Store the current value of translate as well, by copying the event
      // array in order to avoid reference sharing.
      topo.set('translate', Y.mix(evt.translate));
      vis.attr('transform', 'translate(' + topo.get('translate') + ')' +
              ' scale(' + topo.get('scale') + ')');
    },

    renderedHandler: function(evt) {
      // Preserve zoom when the scene is updated.
      var topo = this.get('component'),
          changed = false,
          currentScale = topo.get('scale'),
          currentTranslate = topo.get('translate');
      if (currentTranslate && currentTranslate !== topo.get('translate')) {
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
    },

    /**
      Pans the environment so that the given point is in the center of the
      viewport.

      @method panToPoint
      @param {object} evt The event handler with a 'point' attribute.
      @return {undefined} Side effects only.
    */
    panToPoint: function(evt) {
      const point = evt.point,
          topo = this.get('component'),
          scale = topo.get('scale'),
          size = [window.innerWidth, window.innerHeight],
          translate = topo.get('translate');
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
  }, {
    ATTRS: {
      /**
        @property {d3ns.Component} component
      */
      component: {}
    }

  });
  views.PanZoomModule = PanZoomModule;
}, '0.1.0', {
  requires: [
    'node',
    'event',
    'd3',
    'd3-components'
  ]
});
