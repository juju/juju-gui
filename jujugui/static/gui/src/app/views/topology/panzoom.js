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
      yui: {
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
        panToPoint: 'panToPoint',
        panPointToScreen: 'panPointToScreen'
      }
    },

    componentBound: function() {
      var topo = this.get('component'),
          options = topo.options;

      this.toScale = d3.scale.linear()
                            .domain([options.minZoom, options.maxZoom])
                            .range([options.minZoom, options.maxZoom])
                            .clamp(true);
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
      topo.fire('panToCenter');
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
      topo.fire('rescaled');
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
      var point = evt.point,
          topo = this.get('component'),
          scale = topo.get('scale'),
          size = [window.innerWidth, window.innerHeight];
      this.rescale({
        scale: scale,
        translate: point.map(function(d, i) {
          return ((0 - d) * scale) + (size[i] / 2);
        })
      });
    },

    panPointToScreen: function(evt) {
      const point = evt.point,
          topo = this.get('component'),
          scale = topo.get('scale'),
          translate = topo.get('translate'),
          size = [window.innerWidth * scale, window.innerHeight * scale],
          servicePadding = 110, // Width of a service block.
          inspectorPadding = 310 / scale, // Width of the inspector.
          buttonPadding = 80 / scale, // Height of the commit buttons.
          leftSide = translate[0],
          rightSide = leftSide + size[0],
          topSide = translate[1],
          bottomSide = topSide + size[1];
      let newTranslate = [];
      if (point[0] > rightSide - servicePadding) {
        newTranslate[0] = point[0] - size[0] +  2 * servicePadding;
      } else if (point[0] < leftSide + inspectorPadding) {
        newTranslate[0] = point[0] - inspectorPadding;
      } else {
        newTranslate[0] = translate[0];
      }
      if (point[1] > bottomSide - servicePadding) {
        newTranslate[1] = point[1] - size[1] + 2 * servicePadding
          + buttonPadding;
      } else if (point[1] < topSide) {
        newTranslate[1] = point[1];
      } else {
        newTranslate[1] = translate[1];
      }
      if (newTranslate[0] !== translate[0] ||
          newTranslate[1] !== translate[1]) {
        this.rescale({
          scale: scale,
          translate: newTranslate.map(function(d, i) {
            return 0 - d;
          })
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
