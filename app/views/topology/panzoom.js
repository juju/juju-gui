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
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

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
  var PanZoomModule = Y.Base.create('PanZoomModule', d3ns.Module, [], {

    events: {
      scene: {
        '#zoom-out-btn': {
          click: 'zoom_out',
          mouseover: 'add_hover_out',
          mouseout: 'remove_hover_out'
        },
        '#zoom-in-btn': {
          click: 'zoom_in',
          mouseover: 'add_hover_in',
          mouseout: 'remove_hover_in'
        }
      },
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
        panToPoint: 'panToPoint'
      }
    },

    componentBound: function() {
      var topo = this.get('component'),
          options = topo.options;

      this.toScale = d3.scale.linear()
                            .domain([options.minSlider, options.maxSlider])
                            .range([options.minZoom, options.maxZoom])
                            .clamp(true);
      this.toSlider = d3.scale.linear()
                            .domain([options.minZoom, options.maxZoom])
                            .range([options.minSlider, options.maxSlider])
                            .clamp(true);
    },

    renderSlider: function() {
      var self = this,
          topo = this.get('component'),
          options = topo.options,
          currentScale = topo.get('scale'),
          slider;

      if (self.slider) {
        return;
      }

      slider = new Y.Slider({
        // Vertical sliders normally have min at the top and max at the
        // bottom.  Switch them in the definition for our needs.
        min: options.maxSlider,
        max: options.minSlider,
        axis: 'y',
        length: '300px',
        thumbUrl: '/juju-ui/assets/images/non-sprites/zoom-handle.png',
        value: this.toSlider(currentScale)
      });
      // XXX: selection to module option
      slider.render('#slider-parent');
      topo.recordSubscription(this,
                              slider.after('valueChange', function(evt) {
                                if (d3.event && d3.event.scale &&
                                    d3.event.translate) {
                                  return;
                                }
                                self._fire_zoom(self.toScale(evt.newVal));
                              }));
      this.slider = slider;
    },

    /**
     * Handler for 'zoom' event.
     *
     * @method zoomHandler
     */
    zoomHandler: function(evt) {
      var slider = this.slider;

      // Don't zoom if we don't have a slider yet.
      if (!slider) {
        return;
      }
      // Set the slider value to match our new zoom level.
      slider._set('value', this.toSlider(evt.scale));
      // Let rescale handle the actual transformation; evt.scale and
      // evt.translate have both been set by D3 at this point.
      this.rescale(evt);
    },

    /**
     * Zoom out event handler.
     *
     * @method zoom_out
     */
    zoom_out: function(data, self) {
      var slider = this.slider || self.slider,
          val = slider.get('value');
      slider.set('value', val - 25);
    },

    /**
     * Zoom in event handler.
     *
     * @method zoom_in
     */
    zoom_in: function(data, self) {
      var slider = this.slider || self.slider,
          val = slider.get('value');
      slider.set('value', val + 25);
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
          vis = topo.vis,
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
      // behavior outside of mouse events (e.g.: with the slider),
      // and can't trust that zoomExtent will play well.
      var topo = this.get('component'),
          options = topo.options,
          vis = topo.vis;

      if (!vis) {
        return;
      }

      // Ensure that we're definitely within bounds by coercing the scale
      // to fit within our range.
      evt.scale = this.toScale(this.toSlider(evt.scale));

      // Store the current value of scale so that it can be restored later.
      topo.set('scale', evt.scale);
      // Store the current value of translate as well, by copying the event
      // array in order to avoid reference sharing.
      topo.set('translate', Y.mix(evt.translate));
      vis.attr('transform', 'translate(' + topo.get('translate') + ')' +
              ' scale(' + topo.get('scale') + ')');
      var canvas = Y.one('.topology-canvas');
      if (canvas) {
        var bgPosition = evt.translate[0] + 'px ' + evt.translate[1] + 'px';
        canvas.setStyle('backgroundPosition', bgPosition);
      }
      topo.fire('rescaled');
    },

    renderedHandler: function(evt) {
      // Preserve zoom when the scene is updated.
      var topo = this.get('component'),
          changed = false,
          currentScale = topo.get('scale'),
          currentTranslate = topo.get('translate');

      this.renderSlider();
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
          size = topo.get('size');
      this.rescale({
        scale: scale,
        translate: point.map(function(d, i) {
          return ((0 - d) * scale) + (size[i] / 2);
        })
      });
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
    'slider',
    'd3',
    'd3-components',
    'juju-models',
    'juju-env'
  ]
});
