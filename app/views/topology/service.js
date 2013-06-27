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
 * Provide the ServiceModule class.
 *
 * @module topology
 * @submodule topology.service
 */

YUI.add('juju-topology-service', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils'),
      topoUtils = Y.namespace('juju.topology.utils'),
      d3ns = Y.namespace('d3'),
      Templates = views.Templates;

  /**
   * Manage service rendering and events.
   *
   * ## Emitted events:
   *
   * - *clearState:* clear all possible states that the environment view can be
   *   in as it pertains to actions (building a relation, viewing
   *   a service menu, etc.)
   * - *snapToService:* fired when mousing over a service, causing the pending
   *   relation dragline to snap to the service rather than
   *   following the mouse.
   * - *snapOutOfService:* fired when mousing out of a service, causing the
   *   pending relation line to follow the mouse again.
   * - *addRelationDrag:*
   * - *addRelationDragStart:*
   * - *addRelationDragEnd:* fired when creating a relation through the long-
   *   click process, when moving the cursor over the environment, and when
   *   dropping the endpoint on a valid service.
   * - *cancelRelationBuild:* fired when dropping a pending relation line
   *   started through the long-click method somewhere other than a valid
   *   service.
   * - *serviceMoved:* fired when a service block is dragged so that relation
   *   endpoints can follow it.
   * - *navigateTo:* fired when clicking the "View Service" menu item or when
   *   double-clicking a service.
   *
   * @class ServiceModule
   */
  var ServiceModule = Y.Base.create('ServiceModule', d3ns.Module, [], {
    events: {
      scene: {
        '.service': {
          click: 'serviceClick',
          dblclick: 'serviceDblClick',
          mouseenter: 'serviceMouseEnter',
          mouseleave: 'serviceMouseLeave',
          mousemove: 'serviceMouseMove'
        },

        '.service-status': {
          mouseover: 'serviceStatusMouseOver',
          mouseout: 'serviceStatusMouseOut'
        },
        '.zoom-plane': {
          click: 'canvasClick',
          drop: 'canvasDropHandler'
        },
        // Menu/Controls
        '.view-service': {
          click: 'viewServiceClick',
          touchstart: 'viewServiceClick'
        },
        '.destroy-service': {
          click: 'destroyServiceClick'
        }
      },
      d3: {
        '.service': {
          'mousedown.addrel': 'serviceAddRelMouseDown',
          'mouseup.addrel': 'serviceAddRelMouseUp'
        }
      },
      yui: {
        /**
          Show a hidden service (set opacity to 1.0).

          @event show
          @param {Object} An object with a d3 selection attribute.
        */
        show: 'show',
        /**
          Hide a given service (set opacity to 0).

          @event hide
          @param {Object} An object with a d3 selection attribute.
        */
        hide: 'hide',
        /**
          Fade a given service (set opacity to 0.2).

          @event fade
          @param {Object} An object with a d3 selection attribute.
        */
        fade: 'fade',
        /**
          Start the service drag process or the add-relation dragline process.

          @event dragstart
          @param {Object} box The service box that's being dragged.
          @param {Object} self This class.
        */
        dragstart: 'dragstart',
        /**
          Event fired while a service is being dragged or dragline being moved.

          @event drag
          @param {Object} box The service box that's being dragged.
          @param {Object} self This class.
        */
        drag: 'drag',
        /**
          Event fired after a service is being dragged or dragline being moved.

          @event dragend
          @param {Object} box The service box that's being dragged.
          @param {Object} self This class.
        */
        dragend: 'dragend',
        /**
          Hide a service's click-actions menu.

          @event hideServiceMenu
        */
        hideServiceMenu: 'hideServiceMenu',
        /**
          Clear view state as pertaining to services.

          @event clearState
        */
        clearState: 'clearStateHandler',
        /**
          Update the service menu location.

          @event rescaled
        */
        rescaled: 'updateServiceMenuLocation',
        /**
          Pans the environment view to the center.

          @event panToCenter
        */
        panToCenter: 'panToCenter'
      }
    },

    // Margins applied on update to Box instances.
    subordinate_margins: {
      top: 0.05, bottom: 0.1, left: 0.084848, right: 0.084848},
    service_margins: {
      top: 0, bottom: 0.1667, left: 0.086758, right: 0.086758},

    initializer: function(options) {
      ServiceModule.superclass.constructor.apply(this, arguments);

      // Set a default
      this.set('currentServiceClickAction', 'toggleServiceMenu');
    },

    /**
      Attaches the touchstart event handlers for the service elements. This is
      required because touchstart does not appear to bubble in Chrome for
      Android 4.2.2.

      @method attachTouchstartEvents
      @param {Object} data D3 data object.
      @param {DOM Element} node SVG DOM element.
    */
    attachTouchstartEvents: function(data, node) {
      var topo = this.get('component'),
          yuiNode = Y.Node(node);

      // Do not attach the event to the ghost nodes
      if (!d3.select(node).classed('pending')) {
        yuiNode.on('touchstart', this._touchstartServiceTap, this, topo);
      }
    },

    /**
      Callback for the touchstart event handlers on the service svg elements

      @method _touchstartServiceClick
      @param {Object} e event object from tap.
      @param {Object} topo topography instance reference.
    */
    _touchstartServiceTap: function(e, topo) {
      // To execute the serviceClick method under the same context as
      // click we call it under the touch target context
      var node = e.currentTarget.getDOMNode(),
          box = d3.select(node).datum();
      // If we're dragging with two fingers, ignore this as a tap and let drag
      // take over.
      if (e.touches.length > 1) {
        box.tapped = false;
        return;
      }
      box.tapped = true;
      this.serviceClick.call(
          node,
          box,
          this,
          // Specifying the event type to avoid d3.mouse() error
          'touch'
      );
    },

    /**
      Handles the click or tap on the service svg elements.

      It is executed under the context of the clicked/tapped DOM element

      @method serviceClick
      @param {Object} box service object model instance.
      @param {Object} self this service module instance.
      @param {String} eType string representing if it's 'touch' or not.
    */
    serviceClick: function(box, self, eType) {
      // Ignore if we clicked outside the actual service node.
      var topo = self.get('component');
      var container = self.get('container');

      // This check is required because d3.mouse() throws an internal error
      // on touch events
      if (eType !== 'touch') {
        var mouse_coords = d3.mouse(container.one('svg').getDOMNode());
        if (!box.containsPoint(mouse_coords, topo.zoom)) {
          return;
        }
      } else {
        // Touch events will also fire a click event about 300ms later. If this
        // event isn't ignored, the service menu will disappear 300ms after it
        // appears, so set a flag to ignore that event.
        box.ignoreNextClick = true;
      }

      if (box.ignoreNextClick) {
        box.ignoreNextClick = false;
        return;
      }

      // If the service box is pending, ensure that the charm panel is
      // visible, but don't do anything else.
      if (box.pending && !window.flags.serviceInspector) {
        // Prevent the clickoutside event from firing and immediately closing
        // the panel.
        d3.event.halt();
        // Ensure service menus are closed.
        topo.fire('clearState');
        views.CharmPanel.getInstance().show();
        return;
      }
      // serviceClick is being called after dragend is processed.  In those
      // cases the current click action should not be invoked.
      if (topo.ignoreServiceClick) {
        topo.ignoreServiceClick = false;
        return;
      }
      // Get the current click action
      var curr_click_action = self.get('currentServiceClickAction');

      // Fire the action named in the following scheme:
      //   <action>
      // with the service, the SVG node, and the view
      // as arguments.
      self[curr_click_action](box);
    },

    serviceDblClick: function(box, self) {
      if (box.pending) {
        return;
      }
      // Just show the service on double-click.
      var topo = self.get('component'),
          service = box.model;
      // The browser sends a click event right before the dblclick one, and it
      // opens the service menu: close it before moving to the service details.
      self.hideServiceMenu();
      self.show_service(service);
    },

    serviceMouseEnter: function(box, context) {
      var rect = Y.one(this);
      // Do not fire if this service isn't selectable.
      if (box.pending || !utils.hasSVGClass(rect, 'selectable-service')) {
        return;
      }

      // Do not fire unless we're within the service box.
      var topo = context.get('component');
      var container = context.get('container');
      var mouse_coords = d3.mouse(container.one('svg').getDOMNode());
      if (!box.containsPoint(mouse_coords, topo.zoom)) {
        return;
      }

      topo.fire('snapToService', { service: box, rect: rect });
    },

    serviceMouseLeave: function(box, context) {
      // Do not fire if we're within the service box.
      var topo = context.get('component');
      var container = context.get('container');
      var mouse_coords = d3.mouse(container.one('svg').getDOMNode());
      if (box.pending || box.containsPoint(mouse_coords, topo.zoom)) {
        return;
      }
      var rect = Y.one(this).one('.service-border');
      utils.removeSVGClass(rect, 'hover');

      topo.fire('snapOutOfService');
    },

    /**
     * Handle a mouse moving over a service.
     *
     * @method serviceMouseMove
     * @param {object} d Unused.
     * @param {object} context Unused.
     * @return {undefined} Side effects only.
     */
    serviceMouseMove: function(box, context) {
      if (box.pending) {
        return;
      }
      var topo = context.get('component');
      topo.fire('mouseMove');
    },

    /**
     * Handle mouseover service status
     *
     * @method serviceStatusMouseOver
     */
    serviceStatusMouseOver: function(box, context) {
      d3.select(this)
        .select('.unit-count')
        .attr('class', 'unit-count show-count');
    },

    serviceStatusMouseOut: function(box, context) {
      d3.select(this)
        .select('.unit-count')
        .attr('class', 'unit-count hide-count');
    },

    /**
     * If the user clicks on the background we cancel any active add
     * relation.
     *
     * @method canvasClick
     */
    canvasClick: function(box, self) {
      var topo = self.get('component');
      topo.fire('clearState');
    },

    /**
     * Handle deploying a services by dropping a charm onto the canvas.
     *
     * @method canvasDropHandler
     * @static
     * @return {undefined} Nothing.
     */
    canvasDropHandler: function() {
      var evt = d3.event._event;  // So well hidden.
      var dataType = evt.dataTransfer.getData('dataType');
      if (dataType === 'charm-token-drag-and-drop') {
        // The charm data was JSON encoded because the dataTransfer mechanism
        // only allows for string values.
        var charmData = Y.JSON.parse(evt.dataTransfer.getData('charmData'));
        var charm = new models.Charm(charmData);
        Y.fire('initiateDeploy', charm);
      }
    },

    /**
     * Clear any stateful actions (menus, etc.) when a clearState event is
     * received.
     *
     * @method clearStateHandler
     * @return {undefined} Side effects only.
     */
    clearStateHandler: function() {
      var container = this.get('container'),
          topo = this.get('component');
      container.all('.environment-menu.active').removeClass('active');
      this.hideServiceMenu();
    },

    /**
     * The user clicked on the "View" menu item.
     *
     * @method viewServiceClick
     */
    viewServiceClick: function(_, context) {
      // Get the service element
      var topo = context.get('component');
      var box = topo.get('active_service');
      var service = box.model;
      context.hideServiceMenu();
      context.show_service(service);
    },

    /**
     * The user clicked on the "Destroy" menu item.
     *
     * @method destroyServiceClick
     */
    destroyServiceClick: function(_, context) {
      // Get the service element
      var topo = context.get('component');
      var box = topo.get('active_service');
      context.hideServiceMenu();
      context.destroyServiceConfirm(box);
    },

    /**
     Is building relations allowed at this time?

     @method allowBuildRelation
     @param {Object} topo The topology.
     @param {Object} service The service to be tested.
     @return {Boolean} True if building of relation is allowed.
     */
    allowBuildRelation: function(topo, service) {
      var charm = topo.get('db').charms.getById(service.get('charm'));
      return charm && charm.loaded;
    },

    /**
     Service add relation mouse down handler.

     @method serviceAddRelMouseDown
     @param {Object} box The service box that's been clicked.
     @param {Object} context The current context.
     */
    serviceAddRelMouseDown: function(box, context) {
      if (box.pending) {
        return;
      }
      var evt = d3.event;
      var topo = context.get('component');
      context.longClickTimer = Y.later(750, this, function(d, e) {
        // Provide some leeway for accidental dragging.
        if ((Math.abs(box.x - box.oldX) + Math.abs(box.y - box.oldY)) /
            2 > 5) {
          return;
        }

        if (!context.allowBuildRelation(topo, box.model)) {
          return;
        }

        // Sometimes mouseover is fired after the mousedown, so ensure
        // we have the correct event in d3.event for d3.mouse().
        d3.event = e;

        // Start the process of adding a relation
        topo.fire('addRelationDragStart', {service: box});
      }, [box, evt], false);
    },

    /**
     Service add relation mouse up handler.

     @method serviceAddRelMouseUp
     @param {Object} box The service box that's been clicked.
     @param {Object} context The current context.
     */
    serviceAddRelMouseUp: function(box, context) {
      // Cancel the long-click timer if it exists.
      if (context.longClickTimer) {
        context.longClickTimer.cancel();
      }
    },
    /*
     * Sync view models with current db.models.
     *
     * @method updateData
     */
    updateData: function() {
      //model data
      var topo = this.get('component');
      var vis = topo.vis;
      var db = topo.get('db');

      var visibleServices = db.services.visible();
      views.toBoundingBoxes(this, visibleServices, topo.service_boxes);
      // Break a reference cycle that results in uncollectable objects leaking.
      visibleServices.reset();

      // Nodes are mapped by modelId tuples.
      this.node = vis.selectAll('.service')
                     .data(Y.Object.values(topo.service_boxes),
                           function(d) {return d.modelId;});
    },

    /**
     * Handle drag events for a service.
     *
     * @param {Box} box A bounding box.
     * @param {Module} self Service Module.
     * @return {undefined} Side effects only.
     * @method dragstart
     */
    dragstart: function(box, self) {
      var topo = self.get('component');
      box.oldX = box.x;
      box.oldY = box.y;
      box.inDrag = views.DRAG_START;
    },

    dragend: function(box,  self) {
      var topo = self.get('component');
      if (box.tapped) {
        box.tapped = false;
        if (!topo.buildingRelation) {
          return;
        }
      }
      if (topo.buildingRelation) {
        topo.ignoreServiceClick = true;
        topo.fire('addRelationDragEnd');
      }
      else {
        // If the service hasn't been dragged (in the case of long-click to add
        // relation, or a double-fired event) or the old and new coordinates
        // are the same, exit.
        if (!box.inDrag ||
            (box.oldX === box.x &&
             box.oldY === box.y)) {
          return;
        }
        // If the service is still pending, persist x/y coordinates in order
        // to set them as annotations when the service is created.
        if (box.pending) {
          box.model.set('dragged', true);
          box.model.set('x', box.x);
          box.model.set('y', box.y);
          return;
        }
        topo.get('env').update_annotations(
            box.id, 'service', {'gui-x': box.x, 'gui-y': box.y},
            function() {
              box.inDrag = false;
            });
      }
    },

    /**
     * Specialized drag event handler
     * when called as an event handler it
     * Allows optional extra param, pos
     * which when used overrides the mouse
     * handling. This method can then be
     * though of as 'drag to position'.
     *
     * @method drag
     * @param {Box} d viewModel BoundingBox.
     * @param {ServiceModule} self ServiceModule.
     * @param {Object} pos (optional) containing x/y numbers.
     * @param {Boolean} includeTransition (optional) Use transition to drag.
     *
     * [At the time of this writing useTransition works in practice but
     * introduces a timing issue in the tests.]
     */
    drag: function(box, self, pos, includeTransition) {
      if (box.tapped) {
        return;
      }
      var topo = self.get('component');
      var selection = d3.select(this);

      if (topo.buildingRelation) {
        topo.fire('addRelationDrag', { box: box });
        return;
      }
      if (self.longClickTimer) {
        self.longClickTimer.cancel();
      }
      // Translate the service (and, potentially, menu).
      // If a position was provided, update the box's coordinates and the
      // selection's bound data.
      if (pos) {
        box.x = pos.x;
        box.y = pos.y;
        // Explicitly reassign data.
        selection = selection.data([box]);
      } else {
        box.x += d3.event.dx;
        box.y += d3.event.dy;
      }

      if (includeTransition) {
        selection = selection.transition()
                             .duration(500)
                             .ease('elastic');
      }

      selection.attr('transform', function(d, i) {
        return d.translateStr;
      });
      if (topo.get('active_service') === box) {
        self.updateServiceMenuLocation();
      }

      // Remove any active menus.
      self.get('container').all('.environment-menu.active')
          .removeClass('active');
      if (box.inDrag === views.DRAG_START) {
        self.hideServiceMenu();
        box.inDrag = views.DRAG_ACTIVE;
      }
      topo.fire('cancelRelationBuild');
      // Update relation lines for just this service.
      topo.fire('serviceMoved', { service: box });
    },

    /*
     * Attempt to reuse as much of the existing graph and view models
     * as possible to re-render the graph.
     *
     * @method update
     */
    update: function() {
      var self = this,
          topo = this.get('component'),
          width = topo.get('width'),
          height = topo.get('height');

      if (!this.service_scale) {
        this.service_scale = d3.scale.log().range([150, 200]);
        this.service_scale_width = d3.scale.log().range([164, 200]),
        this.service_scale_height = d3.scale.log().range([64, 100]);
      }

      if (!this.tree) {
        this.tree = d3.layout.unscaledPack()
                      .size([width, height])
                      .value(function(d) {
                          return Math.max(d.unit_count, 1);
                        })
                      .padding(300);
      }

      if (!this.dragBehavior) {
        this.dragBehavior = d3.behavior.drag()
            .on('dragstart', function(d) { self.dragstart.call(this, d, self);})
            .on('drag', function(d) { self.drag.call(this, d, self);})
            .on('dragend', function(d) { self.dragend.call(this, d, self);});
      }

      //Process any changed data.
      this.updateData();

      // Generate a node for each service, draw it as a rect with
      // labels for service and charm.
      var node = this.node;

      // Rerun the pack layout.
      // Pack doesn't honor existing positions and will
      // re-layout the entire graph. As a short term work
      // around we layout only new nodes. This has the side
      // effect that service blocks can overlap and will
      // be fixed later.
      var vertices;
      var new_services = Y.Object.values(topo.service_boxes)
                          .filter(function(boundingBox) {
                            return !Y.Lang.isNumber(boundingBox.x);
                          });
      if (new_services.length > 0) {
        // If the there is only one new service and it's pending (as in, it was
        // added via the charm panel as a ghost), position it intelligently and
        // set its position coordinates such that they'll be saved when the
        // service is actually created.  Otherwise, rely on our pack layout (as
        // in the case of opening an unannotated environment for the first
        // time).
        var pendingServicePlaced = false;
        if (new_services.length === 1 && new_services[0].model.get('pending')) {
          pendingServicePlaced = true;
          // Get a coordinate outside the cluster of existing services.
          var coords = topo.servicePointOutside();
          // Set the coordinates on both the box model and the service model.
          new_services[0].x = coords[0];
          new_services[0].y = coords[1];
          new_services[0].model.set('x', coords[0]);
          new_services[0].model.set('y', coords[1]);
          // This ensures that the x/y coordinates will be saved as annotations.
          new_services[0].model.set('dragged', true);
          // Set the centroid to the new service's position
          topo.centroid = coords;
          topo.fire('panToPoint', {point: topo.centroid});
        } else {
          this.tree.nodes({children: new_services});
        }
        // Update annotations settings position on backend
        // (but only do this if there is no existing annotations).
        if (!pendingServicePlaced) {
          vertices = [];
        }
        Y.each(new_services, function(box) {
          var existing = box.model.get('annotations') || {};
          if (!existing && !existing['gui-x']) {
            topo.get('env').update_annotations(
                box.id, 'service', {'gui-x': box.x, 'gui-y': box.y},
                function() {
                  box.inDrag = false;
                });
            vertices.push([box.x || 0, box.y || 0]);
          } else {
            if (vertices) {
              vertices.push([
                existing['gui-x'] || (box.x || 0),
                existing['gui-y'] || (box.y || 0)
              ]);
            }
          }
        });
      }
      if (!topo.centroid || vertices) {
        // Find the centroid of our hull of services and inform the topology.
        if (!vertices) {
          vertices = topoUtils.serviceBoxesToVertices(topo.service_boxes);
        }
        this.findAndSetCentroid(vertices);
      }
      // enter
      node
        .enter().append('g')
        .attr({
            'pointer-events': 'all', // IE doesn't drag properly without this.
            'class': function(d) {
              return (d.subordinate ? 'subordinate ' : '') +
                  (d.pending ? 'pending ' : '') + 'service';
            },
            'transform': function(d) {return d.translateStr;}})
        .call(this.dragBehavior)
        .call(self.createServiceNode, self);

      // Update all nodes.
      self.updateServiceNodes(node);

      // Remove old nodes.
      node.exit()
          .each(function(d) {
            delete topo.service_boxes[d.id];
          })
          .remove();
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
      var topo = this.get('component'),
          centroid = topoUtils.centroid(vertices);
      // The centroid is set on the topology object due to the fact that it is
      // used as a sigil to tell whether or not to pan to the point after the
      // first delta.
      topo.centroid = centroid;
      topo.fire('panToPoint', {point: topo.centroid});
    },

    /**
     * Get a d3 selected node for a given service by id.
     *
     * @method getServiceNode
     * @return  {d3.selection} selection || null.
     */
    getServiceNode: function(id) {
      if (this.node === undefined) {
        return null;
      }
      var node = this.node.filter(function(d, i) {
        return d.id === id;
      });
      return node && node[0][0] || null;
    },

    /**
     * Fill a service node with empty structures that will be filled out
     * in the update stage.
     *
     * @param {object} node the node to construct.
     * @param {object} self reference to the view instance.
     * @return {null} side effects only.
     * @method createServiceNode
     */
    createServiceNode: function(node, self) {
      node.append('image')
        .attr('class', 'service-block-image');

      node.append('text').append('tspan')
        .attr('class', 'name')
        .text(function(d) {return d.displayName; });

      node.append('text').append('tspan')
        .attr({'class': 'charm-label',
            'dy': '3em'})
        .text(function(d) { return d.charm; });

      // Append status charts to service nodes.
      var status_chart = node.append('g')
        .attr('class', 'service-status');

      // Add a mask svg
      status_chart.append('image')
        .attr({'xlink:href': '/juju-ui/assets/svgs/service_health_mask.svg',
            'class': 'service-health-mask'});

      // Add the unit counts, visible only on hover.
      status_chart.append('text')
        .attr('class', 'unit-count hide-count');

      // Manually attach the touchstart event (see method for details)
      node.each(function(data) {
        self.attachTouchstartEvents(data, this);
      });
    },

    /**
     * Fill the empty structures within a service node such that they
     * match the db.
     *
     * @param {object} node the collection of nodes to update.
     * @return {null} side effects only.
     * @method updateServiceNodes
     */
    updateServiceNodes: function(node) {
      var self = this,
          topo = this.get('component'),
          landscape = topo.get('landscape'),
          service_scale = this.service_scale,
          service_scale_width = this.service_scale_width,
          service_scale_height = this.service_scale_height;

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
        x = annotations['gui-x'],
        y = annotations['gui-y'];
        if (!d ||
            (x !== undefined && x !== d.x) ||
            (y !== undefined && y !== d.y)) {
          // Delete gui-x and gui-y from annotations as we use the values.
          // This is to prevent deltas coming in on a service while it is
          // being dragged from resetting its position during the drag.

          delete annotations['gui-x'];
          delete annotations['gui-y'];
          // Only update position if we're not already in a drag state (the
          // current drag supercedes any previous annotations).
          if (!d.inDrag) {
            self.drag.call(this, d, self, {x: x, y: y},
                           self.get('useTransitions'));
          }
        }});

      // Mark subordinates as such.  This is needed for when a new service
      // is created.
      node.filter(function(d) {
        return d.subordinate;
      })
        .classed('subordinate', true);

      // Size the node for drawing.
      node.attr({'width': function(d) {
        // NB: if a service has zero units, as is possible with
        // subordinates, then default to 1 for proper scaling, as
        // a value of 0 will return a scale of 0 (this does not
        // affect the unit count, just the scale of the service).
        var w = service_scale(d.unit_count || 1);
        d.w = w;
        return w;},
      'height': function(d) {
        var h = service_scale(d.unit_count || 1);
        d.h = h;
        return h;
      }
      });
      node.select('.service-block-image').each(function(d) {
        var curr_node = d3.select(this);
        var curr_href = curr_node.attr('xlink:href');
        var new_href = d.subordinate ?
            '/juju-ui/assets/svgs/sub_module.svg' :
            '/juju-ui/assets/svgs/service_module.svg';

        // Only set 'xlink:href' if not already set to the new value,
        // thus avoiding redundant requests to the server. #1182135
        if (curr_href !== new_href) {
          curr_node.attr({'xlink:href': new_href});
        }
        curr_node.attr({
          'width': d.w,
          'height': d.h
        });
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

      // Landscape badge
      if (landscape) {
        node.each(function(d) {
          var landscapeAsset;
          var securityBadge = landscape.getLandscapeBadge(
              d.model, 'security', 'round');
          var rebootBadge = landscape.getLandscapeBadge(
              d.model, 'reboot', 'round');

          if (securityBadge && rebootBadge) {
            landscapeAsset =
                '/juju-ui/assets/images/landscape_restart_round.png';
          } else if (securityBadge) {
            landscapeAsset =
                '/juju-ui/assets/images/landscape_security_round.png';
          } else if (rebootBadge) {
            landscapeAsset =
                '/juju-ui/assets/images/landscape_restart_round.png';
          }
          if (landscapeAsset === undefined) {
            // Remove any existing badge.
            d3.select(this).select('.landscape-badge').remove();
          } else {
            var existing = Y.one(this).one('.landscape-badge'),
                curr_href, target;

            if (!existing) {
              existing = d3.select(this).append('image');
              existing.attr({
                'class': 'landscape-badge',
                'width': 32,
                'height': 32
              });
            }
            existing = d3.select(this).select('.landscape-badge');
            existing.attr({
              'x': function(box) {return box.w * 0.13;},
              'y': function(box) {return box.relativeCenter[1] - (32 / 2);}
            });

            // Only set 'xlink:href' if not already set to the new value,
            // thus avoiding redundant requests to the server. #1182135
            curr_href = existing.attr('xlink:href');
            if (curr_href !== landscapeAsset) {
              existing.attr({'xlink:href': landscapeAsset});
            }
          }
        });
      }
      // The following are sizes in pixels of the SVG assets used to
      // render a service, and are used to in calculating the vertical
      // positioning of text down along the service block.
      var service_height = 224,
          name_size = 22,
          charm_label_size = 16,
          name_padding = 26,
          charm_label_padding = 118;

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
      node.select('.charm-label')
        .attr({'style': function(d) {
            // Programmatically size the font.
            // Number derived from service assets:
            // font-size 16px when asset is 224px.
            return 'font-size:' + d.h *
                (charm_label_size / service_height) + 'px';
          },
          'x': function(d) { return d.w / 2;},
          'y': function(d) {
            // Number derived from service assets:
            // padding-top: 118px when asset is 224px.
            return d.h * (charm_label_padding / service_height) - d.h *
                (charm_label_size / service_height) / 2;
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
        .attr({
              'x': function(d) { return d.w / 10 * 7;},
              'y': function(d) { return d.relativeCenter[1] - (32 / 2);}
            });
      });

      // Remove exposed indicator from nodes that are no longer exposed.
      node.filter(function(d) {
        return !d.exposed &&
            !d3.select(this)
                .select('.exposed-indicator').empty();
      }).select('.exposed-indicator').remove();

      // Add the relative health of a service in the form of a pie chart
      // comprised of units styled appropriately.
      var status_chart_arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(function(d) {
            // Make sure it's exactly as wide as the mask with a bit
            // of leeway for the border.
            var outerRadius = parseInt(
                d3.select(this.parentNode)
                  .select('.service-health-mask')
                  .attr('width'), 10) / 2.05;

            // NB: although this causes a calculation function to have
            // side effects, it does allow us to test that the health
            // graph was sized properly by accessing this attribute.
            d3.select(this.parentNode)
              .attr('data-outerradius', outerRadius);
            return outerRadius;
          });

      var status_chart_layout = d3.layout.pie()
        .value(function(d) { return (d.value ? d.value : 1); })
        .sort(function(a, b) {
            // Ensure that the service health graphs will be renders in
            // the correct order: error - pending - running.
            var states = {error: 0, pending: 1, running: 2};
            return states[a.name] - states[b.name];
          });

      node.select('.service-status')
        .attr('transform', function(d) {
            return 'translate(' + d.relativeCenter + ')';
          });
      node.select('.service-health-mask')
        .attr({'width': function(d) {return d.w / 3;},
            'height': function(d) { return d.h / 3;},
            'x': function() { return -d3.select(this).attr('width') / 2;},
            'y': function() { return -d3.select(this).attr('height') / 2;}
          });

      // Remove the path object as the data bound to it will cause some
      // updates to fail because the test in enter() will not pass.
      node.select('.service-status')
        .selectAll('path')
        .remove();

      // Add the path after the mask image (since it requires the mask's
      // width to set its own).
      node.select('.service-status')
        .selectAll('path')
        .data(function(d) {
            var aggregate_map = d.aggregated_status,
                aggregate_list = [];
            Y.Object.each(aggregate_map, function(count, state) {
              aggregate_list.push({name: state, value: count});
            });

            return status_chart_layout(aggregate_list);
          })
        .enter().insert('path', 'image')
        .attr({'d': status_chart_arc,
            'class': function(d) { return 'status-' + d.data.name;},
            'fill-rule': 'evenodd'})
        .append('title').text(function(d) {
            return d.data.name;
          });

      node.select('.unit-count')
        .text(function(d) {
            return utils.humanizeNumber(d.unit_count);
          });
    },


    /*
     * Show/hide/fade selection.
     */
    show: function(evt) {
      var selection = evt.selection;
      selection.attr('opacity', '1.0')
                .style('display', 'block');
    },

    hide: function(evt) {
      var selection = evt.selection;
      selection.attr('opacity', '0')
            .style('display', 'none');
    },

    fade: function(evt) {
      var selection = evt.selection,
          alpha = evt.alpha;
      selection.transition()
            .duration(400)
            .attr('opacity', alpha !== undefined && alpha || '0.2');
    },

    /**
     * The user clicked on the environment view background.
     *
     * If we are in the middle of adding a relation, cancel the relation
     * adding.
     *
     * @method backgroundClicked
     * @return {undefined} Side effects only.
     */
    backgroundClicked: function() {
      var topo = this.get('component');
      topo.fire('clearState');
    },

    updateServiceMenuLocation: function() {
      var topo = this.get('component'),
          container = this.get('container'),
          cp = container.one('.environment-menu.active'),
          service = topo.get('active_service'),
          tr = topo.get('translate'),
          z = topo.get('scale');

      if (service && cp) {
        var cp_width = cp.getDOMNode().getClientRects()[0].width,
            menu_left = (service.x * z + service.w * z / 2 <
                         topo.get('width') * z / 2),
            service_center = service.relativeCenter;

        if (menu_left) {
          cp.removeClass('left')
            .addClass('right');
        } else {
          cp.removeClass('right')
            .addClass('left');
        }
        // Set the position of the div in the following way:
        // top: aligned to the scaled/panned service minus the
        //   location of the tip of the arrow (68px down the menu,
        //   via css) such that the arrow always points at the service.
        // left: aligned to the scaled/panned service; if the
        //   service is left of the midline, display it to the
        //   right, and vice versa.
        cp.setStyles({
          'top': service.y * z + tr[1] + (service_center[1] * z) - 68,
          'left': service.x * z +
              (menu_left ? service.w * z : -(cp_width)) + tr[0]
        });
      }
    },

    /**
     * Show (if hidden) or hide (if shown) the service menu.
     *
     * @method toggleServiceMenu
     * @param {object} box The presentation state for the service.
     * @return {undefined} Side effects only.
     */
    toggleServiceMenu: function(box) {
      var serviceMenu = this.get('container').one('#service-menu');

      if (serviceMenu.hasClass('active') || !box) {
        this.hideServiceMenu();
      } else {
        this.showServiceMenu(box);
      }
    },

    /**
     * Show the service menu.
     *
     * @method showServiceMenu
     * @param {object} box The presentation state for the service.
     * @return {undefined} Side effects only.
     */
    showServiceMenu: function(box) {
      var serviceMenu = this.get('container').one('#service-menu');
      var topo = this.get('component');
      var service = box.model;
      var landscape = topo.get('landscape');
      var landscapeReboot = serviceMenu.one('.landscape-reboot').hide();
      var landscapeSecurity = serviceMenu.one('.landscape-security').hide();
      var securityURL, rebootURL;
      var flags = window.flags;

      if (flags.serviceInspector) {
        this.show_service(service);
        return;
      }

      // Update landscape links and show/hide as needed.
      if (landscape) {
        rebootURL = landscape.getLandscapeURL(service, 'reboot');
        securityURL = landscape.getLandscapeURL(service, 'security');

        if (rebootURL && service['landscape-needs-reboot']) {
          landscapeReboot.show().one('a').set('href', rebootURL);
        }
        if (securityURL && service['landscape-security-upgrades']) {
          landscapeSecurity.show().one('a').set('href', securityURL);
        }
      }

      if (box && !serviceMenu.hasClass('active')) {
        topo.set('active_service', box);
        topo.set('active_context', box.node);
        serviceMenu.addClass('active');

        // Disable the 'Build Relation' link if the charm has not yet loaded.
        var addRelation = serviceMenu.one('.add-relation');
        if (this.allowBuildRelation(topo, service)) {
          addRelation.removeClass('disabled');
        } else {
          addRelation.addClass('disabled');
        }

        // We do not want the user destroying the Juju GUI service.
        if (utils.isGuiService(service)) {
          serviceMenu.one('.destroy-service').addClass('disabled');
        }
        this.updateServiceMenuLocation();
      }
    },

    /**
     * Hide the service menu.
     *
     * @method hideServiceMenu
     * @param {object} box The presentation state for the service (unused).
     * @return {undefined} Side effects only.
     */
    hideServiceMenu: function(box) {
      var serviceMenu = this.get('container').one('#service-menu');
      var topo = this.get('component');

      if (serviceMenu.hasClass('active')) {
        serviceMenu.removeClass('active');
        topo.set('active_service', null);
        topo.set('active_context', null);
        // Most services can be destroyed via the GUI.
        serviceMenu.one('.destroy-service').removeClass('disabled');
      }
    },

    /*
     * View a service
     *
     * @method show_service
     */
    show_service: function(service) {
      var topo = this.get('component');
      var setInspector = topo.get('setInspector');
      var getInspector = topo.get('getInspector');
      var nsRouter = topo.get('nsRouter');
      var getModelURL = topo.get('getModelURL');
      // to satisfy linter;
      var flags = window.flags;

      topo.detachContainer();
      if (flags.serviceInspector) {
        // XXX: switch on pending to handle ghost config.
        var serviceInspector = getInspector(service.get('id'));
        if (!serviceInspector) {
          serviceInspector = new views.ServiceInspector(service, {
            db: topo.get('db'),
            events: {
              '.tab': {'click': 'showViewlet'},
              '.close': {'click': 'destroy'}
            },
            viewletList: ['overview', 'units', 'config'],
            template: Y.juju.views.Templates['view-container']
          });
          serviceInspector.inspector.after('destroy', function(e) {
            setInspector(e.currentTarget, true);
          });
          setInspector(serviceInspector);
        }
      } else {
        topo.fire('navigateTo', {
          url: getModelURL(service)
        });
      }
    },

    /*
     * Show a dialog before destroying a service
     *
     * @method destroyServiceConfirm
     */
    destroyServiceConfirm: function(box) {
      // Set service in view.
      this.set('destroy_service', box.model);

      // Show dialog.
      this.set('destroy_dialog', views.createModalPanel(
          'Are you sure you want to destroy the service? ' +
          'This cannot be undone.',
          '#destroy-modal-panel',
          'Destroy Service',
          Y.bind(function(ev) {
            ev.preventDefault();
            var btn = ev.target;
            btn.set('disabled', true);
            this.destroyService(btn);
          }, this)));
    },

    /*
     * Destroy a service.
     *
     * @method destroyService
     */
    destroyService: function(btn) {
      var env = this.get('component').get('env'),
          service = this.get('destroy_service');
      env.destroy_service(service.get('id'),
                          Y.bind(this._destroyCallback, this,
                                 service, btn));
    },

    _destroyCallback: function(service, btn, ev) {
      var getModelURL = this.get('component').get('getModelURL'),
          topo = this.get('component'),
          db = topo.get('db');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error destroying service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: getModelURL(service),
              modelId: service
            }));
      } else {
        var relations = db.relations.get_relations_for_service(service);
        Y.each(relations, function(relation) {
          relation.destroy();
        });
        service.destroy();
        topo.update();
      }
      this.get('destroy_dialog').hide();
      btn.set('disabled', false);
    }
  }, {
    ATTRS: {
      /**
        @property {d3ns.Component} component
      */
      component: {}
    }
  });

  views.ServiceModule = ServiceModule;

}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'juju-view-service',
    'juju-templates',
    'juju-models',
    'juju-env',
    'unscaled-pack-layout'
  ]
});
