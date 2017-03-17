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
      components = Y.namespace('d3-components'),
      d3 = Y.namespace('d3'),
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
  var Topology = Y.Base.create('Topology', components.Component, [], {
    initializer: function(options) {
      this.options = Y.mix(options || {}, {
        minZoom: 0.25,
        maxZoom: 2
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

    /**
      Pass the mouse wheel event to the canvas.

      @method handleZoom
    */
    handleZoom: function() {
      this.zoomPlane[0][0].dispatchEvent(
        new WheelEvent(d3.event.type, d3.event));
    },

    renderOnce: function() {
      var svg,
          vis,
          width = this.get('width'),
          height = this.get('height'),
          container = this.get('container');

      if (this._templateRendered) {
        return;
      }
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

      // Cache the canvas element for style modifications.
      this.set('canvas', container.one('.topology-canvas'));

      svg = base.append('svg:svg')
                .attr('width', width)
                .attr('height', height)
                .attr('class', 'the-canvas');
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

      // Only add the plus service block when requested, leaving it out of
      // the bundle details view.
      if (this.options.includePlus) {
        // Disable max-len, in order to maintain an easy way to paste in new
        // assets from design should they arrive.
        /*eslint-disable max-len*/
        vis.html('<g class="plus-service included-plus" transform="translate(0,0)">' +
            '<circle cx="64" cy="64" r="80" stroke="#888888" stroke-width="1" fill="transparent" stroke-dasharray="5, 5" class="plus-service__halo" id="yui_3_11_0_1_1444041610389_7098"></circle>' +
            '<path class="plus-service__inner-circle" fill="#FAFBFB" d="M63.5 126.5c-34.738 0-63-28.262-63-63s28.262-63 63-63 63 28.262 63 63-28.262 63-63 63z"/>' +
            '<path fill="#CECDCD" d="M63.5 1C97.962 1 126 29.038 126 63.5S97.962 126 63.5 126 1 97.962 1 63.5 29.038 1 63.5 1m0-1C28.43 0 0 28.43 0 63.5S28.43 127 63.5 127 127 98.57 127 63.5 98.57 0 63.5 0z"/>' +
            '<circle fill="#38b44a" cx="63.5" cy="63.5" r="32.5" class="plus-service__plus-circle"/>' +
            '<g fill="none" stroke="#FFF" stroke-width="2" stroke-miterlimit="10">' +
            '<path d="M63.5 54.5v18M72.5 63.5h-18"/>' +
            '</g>' +
            '</g>');
        /*eslint-enable max-len*/
        var plusIndicator = vis.select('.included-plus');
        var self = this;
        plusIndicator.on('click', function() {
          if (d3.event.defaultPrevented) {
            // Don't allow the click if the element is being dragged.
            return;
          }
          self.get('state').changeState({
            root: 'store'
          });
          // Pass the wheel events to the canvas so that it can be zoomed.
        }).on('mousewheel.zoom', this.handleZoom.bind(this))
          .on('wheel.zoom', this.handleZoom.bind(this));
        var plusDrag = d3.behavior.drag()
          .on('drag', function(d) {
            var plus = d3.select(this);
            var oldCoords = plus.attr('transform')
              .split('(')[1]
              .split(')')[0]
              .split(',');
            plus
              .attr('transform',
                  'translate('
                    + [d3.event.dx + parseInt(oldCoords[0], 10),
                      d3.event.dy + parseInt(oldCoords[1], 10)] + ')');
          });
        plusIndicator.call(plusDrag);
      }

      // The service icon mask for displaying as circles.
      vis.append('circle')
        .attr({
          id: function(d) { return 'service-icon-mask'; },
          cx: 48,
          cy: 48,
          r: 43,
          fill: 'transparent'
        })
        .style('pointer-events', 'none');

      var clip = vis.append('clipPath')
        .attr({
          id: function(d) { return 'clip-mask'; },
        });

      clip.append('use')
        .attr({
          'xlink:href': function(d) { return '#service-icon-mask'; }
        });

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
               .on('zoom', function(evt) {
                 self.fire('zoom', d3.event);
                 // If the canvas has actually been moved then set the flag.
                 self.zoomed = true;
               })
               .on('zoomend', function(evt) {
                 // Reset the flag for checking if the canvas has been moved.
                 self.zoomed = false;
               });
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
      boxes. Include the optional includeVertices list of xy coordinates when
      calculating the resulting placement.

      @method servicePointOutside
      @param {Array} includeVertices Optional coordinates to be considered.
      @return {array} An x/y coordinate pair.
    */
    servicePointOutside: function(includeVertices) {
      // Existing service boxes are those with x/y attributes set.
      var existingBoxes = Object.keys(
        this.service_boxes).map(k => this.service_boxes[k])
        .filter(function(box) {
          return box.x !== undefined && !isNaN(box.center[0]);
        });
      // Find a point outside of the set of existing service boxes.
      var vertices = utils.serviceBoxesToVertices(existingBoxes);
      if (includeVertices && includeVertices.length) {
        includeVertices.forEach(function(item) {
          vertices.push(item);
        });
      }
      return utils.pointOutside(vertices, this.get('servicePadding'));
    },

    /**
     Record a new box position on the backend. This maintains the proper drag
     state. This method also transitions the viewModel to a DRAG_ENDING state.

     @method annotateBoxPosition
     @param {Object} box.
    */
    annotateBoxPosition: function(box) {
      if (box.pending) {
        // If the service is pending, bypass the environment and set the service
        // annotations directly.
        var service = this.get('db').services.getById(box.id);
        var annotations = service.get('annotations');
        annotations['gui-x'] = box.x;
        annotations['gui-y'] = box.y;
        service.set('annotations', annotations);
      } else {
        this.get('env').update_annotations(
            box.id, 'application', {'gui-x': box.x, 'gui-y': box.y});
        box.inDrag = views.DRAG_ENDING;
      }
    }

  }, {
    ATTRS: {
      /**
       * @property {Object} boundingBox
       * A bounding-box for all of the services
       */
      boundingBox: {},
      /**
       * @property {Y.Node} canvas
       */
      canvas: {},
      /**
       * @property {models.Database} db
       */
      db: {},
      /**
       * @property {utils.EnvironmentChangeSet} ecs
       */
      ecs: {},
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
      },

      zoomed: {value: false}
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
    'juju-topology-service',
    'juju-topology-relation',
    'juju-topology-panzoom',
    'juju-topology-viewport',
    'juju-topology-utils'
  ]
});
