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
 * Provide the Topology class.
 *
 * @module topology
 */

YUI.add('juju-topology', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3'),
      utils = Y.namespace('juju.topology.utils');

  /**
   * Topology models and renders the SVG of the envionment topology
   * with its associated behaviors.
   *
   * The line of where to put code (in the Topology vs a Module) is not 100%
   * clear. The rule of thumb to follow is that shared state, policy and
   * configuration belong here. If the only shared requirement on shared state
   * is watch/event like behavior, fire an event and place the logic in a
   * module.
   *
   * ## Emitted events:
   *
   * - zoom: When the zoom level of the canvas changes a 'zoom'
   *   event is fired. Analogous to d3's zoom event.
   *
   * @class Topology
   */
  var Topology = Y.Base.create('Topology', d3ns.Component, [], {
    initializer: function(options) {
      this.options = Y.mix(options || {}, {
        minZoom: 0.25,
        maxZoom: 2,
        minSlider: 25,
        maxSlider: 200
      });
      Topology.superclass.constructor.apply(this, arguments);
      // Build a service.id -> BoundingBox map for services.
      this.service_boxes = {};
      this._subscriptions = [];
    },

    /**
     * Called by render, conditionally attach container to the DOM if
     * it isn't already. The framework calls this before module
     * rendering so that d3 Events will have attached DOM elements. If
     * your application doesn't need this behavior feel free to override.
     *
     * In this case we currently rely on app.showView to do all the
     * container management, this only works on a preserved view.
     *
     * @method attachContainer
     * @chainable
     */
    attachContainer: function() {
      return this;
    },

    /**
     * Remove container from DOM returning container. This
     * is explicitly not chainable.
     *
     * @method detachContainer
     */
    detachContainer: function() {
      return;
    },


    renderOnce: function() {
      var svg,
          vis,
          width = this.get('width'),
          height = this.get('height'),
          container = this.get('container'),
          templateName = this.options.template || 'overview';

      if (this._templateRendered) {
        return;
      }
      //container.setHTML(views.Templates[templateName]());
      // Take the first element.
      this._templateRendered = true;

      // These are defaults, a (Viewport) Module
      // can implement policy around them.
      this.computeScales();

      // Set up the visualization with a pack layout.
      var canvas = d3.select(container.getDOMNode());
      var base = canvas.select('.topology-canvas');
      if (base.empty()) {
        base = canvas.append('div')
              .classed('topology-canvas', true);
      }

      svg = base.append('svg:svg')
                .attr('width', width)
                .attr('height', height);
      this.svg = svg;

      this.zoomPlane = svg.append('rect')
                          .attr('class', 'zoom-plane')
                          .attr('width', width)
                          .attr('height', height)
                          .attr('pointer-events', 'all')
                          .call(this.zoom)
                          .on('dblclick.zoom', null);

      vis = svg.append('svg:g');
      this.vis = vis;
      Topology.superclass.renderOnce.apply(this, arguments);
      return this;
    },

    computeScales: function() {
      var self = this,
          width = this.get('width'),
          height = this.get('height');

      if (!this.xScale) {
        this.xScale = d3.scale.linear();
        this.yScale = d3.scale.linear();
        this.zoom = d3.behavior.zoom();
      }
      // Update the pan/zoom behavior manager.
      this.xScale.domain([-width / 2, width / 2])
        .range([0, width])
        .clamp(true)
        .nice();
      this.yScale.domain([-height / 2, height / 2])
        .range([height, 0])
        .clamp(true)
        .nice();

      this.zoom.x(this.xScale)
               .y(this.yScale)
               .scaleExtent([this.options.minZoom, this.options.maxZoom])
               .on('zoom', function(evt) {self.fire('zoom', d3.event);});
    },

    /*
     * Utility method to get a service object from the DB
     * given a BoundingBox.
     */
    serviceForBox: function(boundingBox) {
      var db = this.get('db');
      return db.services.getById(boundingBox.id);
    },

    /**
      Builds a coordinate which is outside of the current topology's service
      boxes.

      @method servicePointOutside
      @return {array} An x/y coordinate pair.
    */
    servicePointOutside: function() {
      // Existing service boxes are those with x/y attributes set.
      var existingBoxes = Y.Object.values(this.service_boxes)
        .filter(function(box) {
            return box.x !== undefined && !isNaN(box.center[0]);
          });
      // Find a point outside of the set of existing service boxes.
      return utils.pointOutside(
          utils.serviceBoxesToVertices(existingBoxes),
          this.get('servicePadding'));
    },

    /**
     Show the menu for a given service

     @method showMenu
     @param {String} serviceId
    */
    showMenu: function(serviceId) {
      var serviceModule = this.modules.ServiceModule;
      if (!serviceModule) { return;}
      var boxModel = this.service_boxes[serviceId];
      serviceModule.showServiceMenu(boxModel);
    },

    /**
     Record a new box position on the backend. This maintains the proper drag
     state. This method also transitions the viewModel to a DRAG_ENDING state
     with a timeout. During this window the box will behave as if its in a drag
     state refusing annotation updates. This masks certain classes of races.

     @method annotateBoxPosition
     @param {Object} box.
     @param {ms} timeout.
    */
    annotateBoxPosition: function(box, timeout) {
      if (box.pending) { return; }
      window = window || 1000;

      // This can happen in some tests.
      this.get('env').update_annotations(
          box.id, 'service', {'gui-x': box.x, 'gui-y': box.y},
          function() {
            if (timeout) {
              box.inDrag = views.DRAG_ENDING;
              Y.later(timeout, box, function() {
                // Provide (t) ms of protection from sending additional
                // annotations or applying them locally.
                box.inDrag = false;
              });
            } else {
              box.inDrag = false;
            }
          });
    }

  }, {
    ATTRS: {
      /**
       * @property {models.Database} db
       */
      db: {},
      /**
       * @property {store.Environment} env
       */
      env: {},
      /**
       * @property {Array} size
       * A [width, height] tuple representing canvas size.
       */
      size: {value: [640, 480]},
      servicePadding: {value: 300},
      width: {
        getter: function() {return this.get('size')[0];}
      },

      height: {
        getter: function() {return this.get('size')[1];}
      },
      /*
        Scale and translate are managed by an external module
        (PanZoom in this case). If that module isn't
        loaded nothing will modify these values.
       */
      scale: {
        getter: function() {
          if (!this.zoom) { return 1.0;}
          return this.zoom.scale();},
        setter: function(v) {this.zoom.scale(v);}
      },

      translate: {
        getter: function() {
          if (!this.zoom) {return [0, 0]; }
          return this.zoom.translate();},
        setter: function(v) {this.zoom.translate(v);}
      }
    }

  });
  views.Topology = Topology;

  /*
   * Some additional flags used in dragging.
   */
  views.DRAG_START = 1;
  views.DRAG_ACTIVE = 2;
  views.DRAG_ENDING = 3;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'node',
    'event',
    'juju-templates',
    'juju-models',
    'juju-env',
    'juju-topology-service',
    'juju-topology-relation',
    'juju-topology-panzoom',
    'juju-topology-viewport',
    'juju-topology-landscape',
    'juju-topology-importexport',
    'juju-topology-utils'
  ]
});
