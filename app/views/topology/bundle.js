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
      topoUtils = Y.namespace('juju.topology.utils');

  /**
    Manage service rendering and events.

    @class BundleModule
   */

  var BundleModule = Y.Base.create('BundleModule', d3ns.Module, [
    views.ServiceModuleCommon], {

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
      node.append('image')
       .classed('service-icon', true)
       .attr({
                'xlink:href': function(d) {
                  return d.icon;
                },
                width: 96,
                height: 96
              });
      node.append('text').append('tspan')
        .attr('class', 'name')
        .text(function(d) { return d.displayName; });
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
      var topo = this.get('component'),
          landscape = topo.get('landscape');

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
        'width': function(box) { box.w = 96; return box.w;},
        'height': function(box) { box.h = 96; return box.h;}
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

    var topo = this.topology = new views.Topology();
    topo.setAttrs(Y.mix(options, {
      interactive: false,
      container: this.container,
      db: this.db,
      store: this.store
    }, true));

    // Service view doesn't support Level Of Detail views.
    // BundleModule provides an icon centric view
    // of services till service module can support this directly.
    topo.addModule(views.BundleModule);
    topo.addModule(views.RelationModule);
    topo.addModule(views.PanZoomModule);
  }

  BundleTopology.prototype.centerViewport = function(scale) {
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
    this.topology.modules.PanZoomModule.panToPoint({point: centroid});
  };


  BundleTopology.prototype.render = function() {
    this.topology.render();
    this.centerViewport(0.66);
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
