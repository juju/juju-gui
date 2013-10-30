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
 * Provide the BundleTopology class.
 *
 * @module views
 * @submodule views.BundleTopology
 */

YUI.add('juju-view-bundle', function(Y) {

  var juju = Y.namespace('juju'),
      views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3'),
      templates = views.Templates,
      topoUtils = Y.namespace('juju.topology.utils');

  // The width/height dimensions of each service within a bundle.
  var SERVICE_SIZE = 96;

  /**
    Manage service rendering and events.

    @class BundleModule
   */

  var BundleModule = Y.Base.create('BundleModule', d3ns.Module, [
    views.ServiceModuleCommon], {

    events: {
      scene: {
        '.service': {
          click: 'showServiceDetails'
        },
        '.close-panel': {
          click: 'hideServiceDetails'
        }
      }
    },

    /**
     Show service details for indicated service block.

     @method showServiceDetails
     @param {Object} d Service View Model.
    */
    showServiceDetails: function(box, self) {
      var container = self.get('container'),
          details = container.one('.topo-info');
      //Template band-aid
      var context = Y.mix(box, {
        num_units: box.units.size(),
        settings: box.config
      });

      var topo = self.get('component');
      topo.vis.selectAll('.selected').classed('selected', false);
      d3.select(this).classed('selected', true);

      details.setHTML(templates['bundle-service-details'](context));
      details.show();
    },

    /**
     Hide service details panel.

     @method hideServiceDetails
     @param {Object} d Service View Model.
    */
    hideServiceDetails: function(box, self) {
      d3.event.halt();
      self.get('container').one('.topo-info').hide();
    },

    /**
      Attempt to reuse as much of the existing graph and view models
      as possible to re-render the graph.

      @method update
     */
    update: function() {
      var self = this,
              topo = this.get('component'),
              width = topo.get('width'),
              height = topo.get('height');

      // Process any changed data.
      this.updateData();

      // Generate a node for each service, draw it as a rect with
      // labels for service and charm.
      var node = this.node;

      // enter
      node
        .enter().append('g')
        .attr({
                'class': function(d) {
                  return (d.subordinate ? 'subordinate ' : '') +
                      (d.pending ? 'pending ' : '') + 'service';
                },
                'transform': function(d) { return d.translateStr;}})
        .call(self.createServiceNode, self);

      // Update all nodes.
      self.updateServiceNodes(node);
    },

    /**
      Fill a service node with empty structures that will be filled out
      in the update stage.

      @param {object} node the node to construct.
      @param {object} self reference to the view instance.
      @return {null} side effects only.
      @method createServiceNode
     */
    createServiceNode: function(node, self) {
      // Add the highlight svg image to each element
      node.append('image')
          .attr({
            class: 'highlight',
            width: SERVICE_SIZE + 10,
            height: SERVICE_SIZE + 10,
            transform: 'translate(-5,-5)',
            'xlink:href':
                '/juju-ui/assets/images/non-sprites/service-highlight.svg'
          });
      node.append('image')
       .classed('service-icon', true)
       .attr({
                'xlink:href': function(d) {
                  return d.icon;
                },
                width: SERVICE_SIZE,
                height: SERVICE_SIZE
              });
    },

    /**
      Fill the empty structures within a service node such that they
      match the db.

      @param {object} node the collection of nodes to update.
      @return {null} side effects only.
      @method updateServiceNodes
     */
    updateServiceNodes: function(node) {
      if (node.empty()) {
        return;
      }

      // Apply Position Annotations
      // This is done after the services_boxes
      // binding as the event handler will
      // use that index.
      node.each(function(d) {
        var service = d.model,
                annotations = service.get('annotations'),
                x, y;

        if (!annotations) {
          return;
        }

        // If there are x/y annotations on the service model and they are
        // different from the node's current x/y coordinates, update the
        // node, as the annotations may have been set in another session.
        x = annotations['gui-x'];
        y = annotations['gui-y'];
        if (!d ||
                (x !== undefined && x !== d.x) ||
                (y !== undefined && y !== d.y)) {
          d.x = x;
          d.y = y;
          d3.select(this).attr({
            x: x,
            y: y,
            transform: d.translateStr});

        }});

      // Mark subordinates as such.  This is needed for when a new service
      // is created.
      node.filter(function(d) {
        return d.subordinate;
      }).classed('subordinate', true);

      // Size the node for drawing.
      node.attr({
        'width': function(box) { box.w = SERVICE_SIZE; return box.w;},
        'height': function(box) { box.h = SERVICE_SIZE; return box.h;}
      });

      // Draw a subordinate relation indicator.
      var subRelationIndicator = node.filter(function(d) {
        return d.subordinate &&
            d3.select(this)
                  .select('.sub-rel-block').empty();
      })
        .append('g')
        .attr('class', 'sub-rel-block')
        .attr('transform', function(d) {
                // Position the block so that the relation indicator will
                // appear at the right connector.
                return 'translate(' + [d.w, d.h / 2 - 26] + ')';
              });

      subRelationIndicator.append('image')
        .attr({'xlink:href': '/juju-ui/assets/svgs/sub_relation.svg',
            'width': 87,
            'height': 47});
      subRelationIndicator.append('text').append('tspan')
        .attr({'class': 'sub-rel-count',
            'x': 64,
            'y': 47 * 0.8});

      // The following are sizes in pixels of the SVG assets used to
      // render a service, and are used to in calculating the vertical
      // positioning of text down along the service block.
      var service_height = 224,
              name_size = 22,
              charm_label_size = 16,
              name_padding = 26,
              charm_label_padding = 150;

      node.select('.name')
        .attr({'style': function(d) {
            // Programmatically size the font.
            // Number derived from service assets:
            // font-size 22px when asset is 224px.
            return 'font-size:' + d.h *
                (name_size / service_height) + 'px';
          },
          'x': function(d) { return d.w / 2; },
          'y': function(d) {
            // Number derived from service assets:
            // padding-top 26px when asset is 224px.
            return d.h * (name_padding / service_height) + d.h *
                (name_size / service_height) / 2;
          }
          });

      // Show whether or not the service is exposed using an indicator.
      var exposed = node.filter(function(d) {
        return d.exposed;
      });
      exposed.each(function(d) {
        var existing = Y.one(this).one('.exposed-indicator');
        if (!existing) {
          existing = d3.select(this).append('image')
        .attr({'class': 'exposed-indicator on',
                    'xlink:href': '/juju-ui/assets/svgs/exposed.svg',
                    'width': 32,
                    'height': 32
                  })
        .append('title')
        .text(function(d) {
                    return d.exposed ? 'Exposed' : '';
                  });
        }
        existing = d3.select(this).select('.exposed-indicator')
        .attr({ 'x': 64, 'y': 64 });
      });
    },


    /**
      Pans the environment view to the center all the services on the canvas.

      @method panToCenter
      @param {object} evt The event fired.
      @return {undefined} Side effects only.
    */
    panToCenter: function(evt) {
      var topo = this.get('component');
      var vertices = topoUtils.serviceBoxesToVertices(topo.service_boxes);
      this.findAndSetCentroid(vertices);
    },
    /**
      Given a set of vertices, find the centroid and pan to that location.

      @method findAndSetCentroid
      @param {array} vertices A list of vertices in the form [x, y].
      @return {undefined} Side effects only.
    */
    findAndSetCentroid: function(vertices) {
      var topo = this.get('component');
      var centroid = topoUtils.centroid(vertices);
      /* The centroid is set on the topology object due to the fact that it
             is used as a sigil to tell whether or not to pan to the point
             after the first delta. */
      topo.centroid = centroid;
      topo.fire('panToPoint', {point: topo.centroid});
    }
  }, {
    ATTRS: {
      /**
        @property {d3ns.Component} component
      */
      component: {}
    }
  });
  views.BundleModule = BundleModule;

  /**
    Display a Bundle using an internal topology.

    @class BundleTopology
   */
  function BundleTopology(options) {
    // Options and Init
    var self = this;
    options = options || {};
    this.options = options;
    this._cleanups = [];
    this.db = options.db;
    if (!this.db) {
      this.db = new models.Database();
      this._cleanups.push(this.db.destroy);
    }
    this.store = options.store;
    if (!this.store) {
      this.store = new juju.charmworld.APIv2({});
      this._cleanups.push(this.store.destroy);
    }
    this.container = options.container;
    if (!this.container) {
      this.container = Y.Node.create('<div>');
      this.container.addClass('topology-canvas');
      this._cleanups.push(function() {
        self.container.remove(true);
      });
    }
    // Add the popup div used for details.
    this.container.append(
        Y.Node.create('<div>')
     .addClass('topo-info').hide());


    var topo = this.topology = new views.Topology();
    topo.setAttrs(Y.mix(options, {
      interactive: true,
      container: this.container,
      db: this.db,
      store: this.store
    }, true));

    // Service view doesn't support Level Of Detail views.
    // BundleModule provides an icon centric view
    // of services till service module can support this directly.
    topo.addModule(views.BundleModule);
    topo.addModule(views.RelationModule, { disableRelationInteraction: true });
    topo.addModule(views.PanZoomModule);
  }

  BundleTopology.prototype.centerViewport = function(scale) {
    // _fire_zoom does a translated scale based on the
    // delta of the two settings, we prime the pump
    // here but setting scale to our target value first.
    this.topology.set('scale', scale);
    this.topology.modules.PanZoomModule._fire_zoom(scale);
    // Pan to the centroid of it all after the zoom
    this.panToCenter();
    return this;
  };

  /**
    Pans the canvas to the center all the services.

    @method panToCenter
    @param {object} evt The event fired.
    @return {undefined} Side effects only.
  */
  BundleTopology.prototype.panToCenter = function() {
    var topo = this.topology;
    var vertices = topoUtils.serviceBoxesToVertices(topo.service_boxes);
    var centroid = topoUtils.centroid(vertices);
    var scale = topo.get('scale'),
        width = topo.get('width'),
        height = topo.get('height');
    var bb = topo.get('bundleBoundingBox');
    centroid[0] += Math.abs(width - bb.w) * scale;
    centroid[1] += Math.abs(height - bb.h) * scale;
    this.topology.modules.PanZoomModule.panToPoint({point: centroid});
  };


  /**
     Pan/Zoom the view to fit the in the height/width of the container.

     @method zoomToFit
     @chainable
     */
  BundleTopology.prototype.zoomToFit = function() {
    var topo = this.topology;
    var vertices = topoUtils.serviceBoxesToVertices(topo.service_boxes);
    var bb = topoUtils.getBoundingBox(vertices, SERVICE_SIZE, SERVICE_SIZE);
    topo.set('bundleBoundingBox', bb);
    var width = topo.get('width'),
        height = topo.get('height');

    // Zoom to Fit
    var maxScale = Math.min(width / bb.w, height / bb.h);
    maxScale -= 0.1; // Margin
    // Clamp Scale
    maxScale = Math.min(1.0, maxScale);
    this.centerViewport(maxScale);
  };


  BundleTopology.prototype.render = function() {
    this.topology.render();
    this.zoomToFit();
    // Pass the first service data to the showServiceDetails to select it.
    var topo = this.topology;
    var firstService = topo.vis.select('.service');
    var bundleModule = topo.modules.BundleModule;
    // We need the actual svg dom node out of the d3 selection
    // If for whatever reason this node isn't in the DOM we don't want
    // to try and select it and have the whole application fall over.
    if (firstService.node()) {
      bundleModule.showServiceDetails.call(
          firstService.node(), firstService.datum(), bundleModule);
    }

    return this;
  };

  BundleTopology.prototype.destroy = function() {
    this._cleanups.forEach(function(cleanupFunc) {
      cleanupFunc();
    });
  };

  views.BundleTopology = BundleTopology;

}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'juju-charm-store',
    'juju-models',
    'juju-topology',
    'juju-view-utils'
  ]
});
