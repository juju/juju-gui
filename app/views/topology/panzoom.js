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
        zoom: {callback: 'zoomHandler'},
        rendered: {callback: 'renderedHandler'}
      }
    },

    initializer: function(options) {
      PanZoomModule.superclass.constructor.apply(this, arguments);
      this._translate = [0, 0];
      this._scale = 1.0;
    },

    // Handler for 'zoom' event.
    zoomHandler: function(evt) {
      var s = this.slider,
          vis = this.get('component').vis;

      s.set('value', Math.floor(evt.scale * 100));
      this.rescale(vis, evt);
    },

    renderSlider: function() {
      var self = this,
          topo = this.get('component'),
          contianer = topo.get('container'),
          value = 100,
          currentScale = topo.get('scale');

      if (self.slider) {
        return;
      }
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
      topo.recordSubscription(this,
                              slider.after('valueChange', function(evt) {
                                // Don't fire a zoom if there's a zoom event
                                // already in progress; that will run rescale
                                // for us.
                                if (d3.event && d3.event.scale &&
                                    d3.event.translate) {
                                  return;
                                }
                                self._fire_zoom((
                                    evt.newVal - evt.prevVal) / 100);
                              }));
      self.slider = slider;
    },

    update: function() {
      PanZoomModule.superclass.update.apply(this, arguments);
      return this;
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
    _fire_zoom: function(delta) {
      var topo = this.get('component'),
          vis = topo.vis,
          zoom = topo.zoom,
          evt = {};

      // Build a temporary event that rescale can use of a similar
      // construction to d3.event.
      evt.translate = zoom.translate();
      evt.scale = zoom.scale() + delta;

      // Update the scale in our zoom behavior manager to maintain state.
      zoom.scale(evt.scale);

      // Update the translate so that we scale from the center
      // instead of the origin.
      var rect = vis.select('rect');
      evt.translate[0] -= parseInt(rect.attr('width'), 10) / 2 * delta;
      evt.translate[1] -= parseInt(rect.attr('height'), 10) / 2 * delta;
      zoom.translate(evt.translate);

      this.rescale(vis, evt);
    },

    /*
     * Rescale the visualization on a zoom/pan event.
     */
    rescale: function(vis, evt) {
      // Make sure we don't scale outside of our bounds.
      // This check is needed because we're messing with d3's zoom
      // behavior outside of mouse events (e.g.: with the slider),
      // and can't trust that zoomExtent will play well.
      var new_scale = Math.floor(evt.scale * 100),
          topo = this.get('component');

      if (new_scale < 25 || new_scale > 200) {
        evt.scale = topo.get('scale');
      }
      // Store the current value of scale so that it can be restored later.
      this._scale = evt.scale;
      // Store the current value of translate as well, by copying the event
      // array in order to avoid reference sharing.
      this._translate = Y.mix(evt.translate);
      vis.attr('transform', 'translate(' + evt.translate + ')' +
              ' scale(' + evt.scale + ')');
      topo.fire('rescaled');
    },

    renderedHandler: function(evt) {
      // Preserve zoom when the scene is updated.
      var topo = this.get('component'),
          changed = false,
          currentScale = this._scale,
          currentTranslate = this._translate;

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
        this._fire_zoom(0);
      }
    }
  }, {
    ATTRS: {}

  });
  views.PanZoomModule = PanZoomModule;
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
