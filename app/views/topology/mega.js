'use strict';

YUI.add('juju-topology-mega', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * @module topology-service
   * @class Service
   * @namespace juju.views
   **/
  var MegaModule = Y.Base.create('MegaModule', d3ns.Module, [], {

    events: {
      scene: {
        '.service': {
          click: 'serviceClick',
          dblclick: 'serviceDblClick',
          mouseenter: 'serviceMouseEnter',
          mouseleave: 'serviceMouseLeave',
          '.view-service': 'serviceViewClick',


          '#zoom-out-btn': {click: 'zoom_out'},
          '#zoom-in-btn': {click: 'zoom_in'},
          '.graph-list-picker .picker-button': {
            click: 'showGraphListPicker'
          },
          '.graph-list-picker .picker-expanded': {
            click: 'hideGraphListPicker'
          },

          '.add-relation': 'relationAddClick',
        }
      },
      d3: {
        '.service': {
          'mousedown.addrel': 'relationAddMouseDown',
          'mouseup.addrel': 'relationAddMouseUp'
        }
      },
      yui: {
        windowresize: 'viewportResized'
      }
    },

    initializer: function(options) {
      MegaModule.superclass.constructor.apply(this, arguments);
    },

    render: function() {
      MegaModule.superclass.render.apply(this, arguments);
      return this;
    },

    update: function() {
      MegaModule.superclass.update.apply(this, arguments);
      return this;
    },

    /* Event handler names are namespaced with future module
     * factoring in mind. When moved to modules the module name
     * prefix should be removed from the methods. This is done
     * here to avoid handler name conflicts
     */
    // Scene Event Handlers
    serviceClick: function(data, context) {},
    serviceDblClick: function(data, context) {},
    serviceMouseEnter: function(data, context) {},
    serviceMouseLeave: function(data, context) {},

    relationAddClick: function(data, context) {
      var box = this.get('active_service'),
      service = this.serviceForBox(box),
      context = this.get('active_context');
      this.addRelationDragStart(box, context);
      this.service_click_actions
      .toggleControlPanel(box, this, context);
      this.service_click_actions.addRelationStart(box, this, context);
    },

    // D3 Events
    relationAddMouseDown: function(data, context) {},
    relationAddMouseUp: function(data, context) {},

    // YUI custom events
    viewportResized: function(evt) {
    }

    /*
     * Zoom in event handler.
     */
    zoom_out: function(evt) {
      var slider = this.slider,
      val = slider.get('value');
      slider.set('value', val - 25);
    },

    /*
     * Zoom out event handler.
     */
    zoom_in: function(evt) {
      var slider = this.slider,
      val = slider.get('value');
      slider.set('value', val + 25);
    },

    /*
     * Wraper around the actual rescale method for zoom buttons.
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
      var new_scale = Math.floor(evt.scale * 100);
      if (new_scale < 25 || new_scale > 200) {
        evt.scale = this.get('scale');
      }
      // Store the current value of scale so that it can be restored later.
      this.set('scale', evt.scale);
      // Store the current value of translate as well, by copying the event
      // array in order to avoid reference sharing.
      this.set('translate', evt.translate.slice(0));
      vis.attr('transform', 'translate(' + evt.translate + ')' +
               ' scale(' + evt.scale + ')');
      this.updateServiceMenuLocation();
    }

  }, {
    ATTRS: {}
  });
  views.MegaModule = MegaModule;
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
