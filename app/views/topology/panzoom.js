'use strict';

YUI.add('juju-topology-panzoom', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Handle PanZoom within a Topology.
   *
   * Emitted events:
   *
   *  rescaled: post-zoom event, after the scene has been rescaled,
   *            queried object positions should be accurate.
   *
   * @module topology-panzoom
   * @class PanZoomModule
   * @namespace views
   **/
  var PanZoomModule = Y.Base.create('PanZoomModule', d3ns.Module, [], {

    events: {
      scene: {
        '#zoom-out-btn': {click: 'zoom_out'},
        '#zoom-in-btn': {click: 'zoom_in'}
      },
      yui: {
        zoom: 'zoomHandler',
        rendered: 'renderedHandler'
      }
    },

    componentBound: function() {
      var topo = this.get('component'),
          options = topo.options;

      this.toScale = d3.scale.linear()
                            .domain([options.minZoom, options.maxZoom])
                            .range([0.25, 2])
                            .clamp(true);
      this.toSlider = d3.scale.linear()
                            .domain([0.25, 2])
                            .range([options.minZoom, options.maxZoom])
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
        min: options.minZoom,
        max: options.maxZoom,
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

    // Handler for 'zoom' event.
    zoomHandler: function(evt) {
      var slider = this.slider,
          topo = this.get('component'),
          height = topo.get('height'),
          width = topo.get('width'),
          options = topo.options;

      if (!this.slider) {
        return;
      }
      slider.set('value', this.toSlider(evt.scale));
      this.rescale(d3.event);
    },

    /*
     * Zoom out event handler.
     */
    zoom_out: function(data, context) {
      var slider = context.slider,
          val = slider.get('value');
      slider.set('value', val - 25);
    },

    /*
     * Zoom in event handler.
     */
    zoom_in: function(data, context) {
      var slider = context.slider,
          val = slider.get('value');
      slider.set('value', val + 25);
    },

    /*
     * Wrapper around the actual rescale method for zoom buttons.
     */
    _fire_zoom: function(scale) {
      var topo = this.get('component'),
          vis = topo.vis,
          zoom = topo.zoom,
          rect = topo.zoomPlane,
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
      evt.translate[0] -= (parseInt(rect.attr('width'), 10) / 2) * delta;
      evt.translate[1] -= (parseInt(rect.attr('height'), 10) / 2) * delta;
      zoom.translate(evt.translate);

      this.rescale(evt);
    },

    /*
     * Rescale the visualization on a zoom/pan event.
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

      evt.scale = this.toSlider(evt.scale) / 100.0;

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
    }
  }, {
    ATTRS: {}

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
