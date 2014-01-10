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
  var d3ns = Y.namespace('d3'),
      importHelpers = Y.namespace('juju').BundleHelpers,
      models = Y.namespace('juju.models'),
      topoUtils = Y.namespace('juju.topology.utils'),
      utils = Y.namespace('juju.views.utils'),
      views = Y.namespace('juju.views');

  var ServiceModuleCommon = function() {};
  /**
    Sync view models with current db.models.

    @method updateData
  */
  ServiceModuleCommon.prototype.updateData = function() {
    //model data
    var topo = this.get('component');
    var vis = topo.vis;
    var db = topo.get('db');
    var store = topo.get('store');

    var visibleServices = db.services.visible();
    views.toBoundingBoxes(this, visibleServices, topo.service_boxes, store);
    // Break a reference cycle that results in uncollectable objects leaking.
    visibleServices.reset();

    // Nodes are mapped by modelId tuples.
    this.node = vis.selectAll('.service')
                     .data(Y.Object.values(topo.service_boxes),
                           function(d) {return d.modelId;});
  };

  /**
    Fill the empty structures within a service node such that they
    match the db.

    @param {object} node the collection of nodes to update.
    @return {null} side effects only.
    @method updateServiceNodes
  */
  ServiceModuleCommon.prototype.updateServiceNodes = function(node) {
    if (node.empty()) {
      return;
    }
    var self = this,
        topo = this.get('component'),
        service_scale = this.service_scale,
        service_scale_width = this.service_scale_width,
        service_scale_height = this.service_scale_height;

    // Apply Position Annotations
    // This is done after the services_boxes
    // binding as the event handler will
    // use that index.
    var movedNodes = 0;
    node.each(function(d) {
      var service = d.model,
          annotations = service.get('annotations'),
          x, y;

      // If there are no annotations or the service is being dragged
      if (!annotations || d.inDrag) {
        return;
      }

      // If there are x/y annotations on the service model and they are
      // different from the node's current x/y coordinates, update the
      // node, as the annotations may have been set in another session.
      x = annotations['gui-x'];
      y = annotations['gui-y'];
      if (x === undefined || y === undefined) {
        return;
      }
      x = parseFloat(x);
      y = parseFloat(y);
      if ((x !== d.x) || (y !== d.y)) {
        // Only update position if we're not already in a drag state (the
        // current drag supercedes any previous annotations).
        if (!d.inDrag) {
          var useTransitions = self.get('useTransitions');
          self.drag.call(this, d, self, {x: x, y: y}, useTransitions);
          movedNodes += 1;
          topo.annotateBoxPosition(d);
        }
      }});
    if (movedNodes > 1) {
      this.findCentroid();
    }

    // Mark subordinates as such.  This is needed for when a new service
    // is created.
    node.filter(function(d) {
      return d.subordinate;
    })
        .classed('subordinate', true);

    node.classed('pending', function(d) { return d.pending; });

    // Size the node for drawing.
    node.attr({
      'width': function(box) { box.w = 190; return box.w;},
      'height': function(box) { box.h = 190; return box.h;}
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

    node.select('.name').text(function(d) { return d.displayName; });

    node.select('.network-name').text(function(d) { return d.networks; });

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
            'x': 145,
            'y': 79
          });
    });

    // Remove exposed indicator from nodes that are no longer exposed.
    node.filter(function(d) {
      return !d.exposed &&
          !d3.select(this)
                      .select('.exposed-indicator').empty();
    }).select('.exposed-indicator').remove();

    // Adds the relative health in the form of a percentage bar.
    node.each(function(d) {
      var status_graph = d3.select(this).select('.statusbar');
      var status_bar = status_graph.property('status_bar');
      if (status_bar && !d.subordinate) {
        status_bar.update(d.aggregated_status);
      }
    });
  };
  views.ServiceModuleCommon = ServiceModuleCommon;

  /**
    Manage service rendering and events.

    ## Emitted events:

    - *clearState:* clear all possible states that the environment view can be
      in as it pertains to actions (building a relation, viewing
      a service menu, etc.)
    - *snapToService:* fired when mousing over a service, causing the pending
      relation dragline to snap to the service rather than
      following the mouse.
    - *snapOutOfService:* fired when mousing out of a service, causing the
      pending relation line to follow the mouse again.
    - *addRelationDrag:*
    - *addRelationDragStart:*
    - *addRelationDragEnd:* fired when creating a relation through the long-
      click process, when moving the cursor over the environment, and when
      dropping the endpoint on a valid service.
    - *cancelRelationBuild:* fired when dropping a pending relation line
      started through the long-click method somewhere other than a valid
      service.
    - *serviceMoved:* fired when a service block is dragged so that relation
      endpoints can follow it.
    - *navigateTo:* fired when clicking the "View Service" menu item or when
      double-clicking a service.

    @class ServiceModule
   */
  var ServiceModule = Y.Base.create('ServiceModule', d3ns.Module, [
    ServiceModuleCommon
  ], {
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
        // See _attachDragEvents for the drag and drop event registrations
        '.zoom-plane': {
          click: 'canvasClick'
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
        panToCenter: 'panToCenter',
        /**
          Fade services that aren't in the network list

          @event fadeNotNetworks
        */
        fadeNotNetworks: 'fadeNotNetworks'
      }
    },

    // Margins applied on update to Box instances.
    subordinate_margins: {
      top: 0.05, bottom: 0.1, left: 0.084848, right: 0.084848},
    // No drop-shadow to account for, currently, so set these to just far
    // enough in so that the corners of the relation line do not show.
    service_margins: {
      top: 0.01, bottom: 0.01, left: 0.01, right: 0.01},

    initializer: function(options) {
      ServiceModule.superclass.constructor.apply(this, arguments);
      // Set a default
      this.set('currentServiceClickAction', 'showServiceMenu');
    },

    /**
      Attaches the drag and drop events for this view. These events need to be
      here because attaching them in the events object causes drag and drop
      events to stop bubbling at odd places cross browser.

      @method _attachDragEvents
    */
    _attachDragEvents: function() {
      var container = this.get('container'),
          ZP = '.zoom-plane',
          EC = 'i.sprite.empty_canvas';

      container.delegate('drop', this.canvasDropHandler, ZP, this);
      container.delegate('dragenter', this._ignore, ZP, this);
      container.delegate('dragover', this._ignore, ZP, this);

      // allows the user to drop the charm on the 'drop here' help text in
      // IE10.
      container.delegate('drop', this.canvasDropHandler, EC, this);
      container.delegate('dragenter', this._ignore, EC, this);
      container.delegate('dragover', this._ignore, EC, this);
    },

    /**
      * Ignore a drag event.
      * @method _ignore
      */
    _ignore: function(e) {
      e.halt();
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
      // If we're dragging with two fingers, ignore this as a tap and let
      // drag take over.
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
        // Touch events will also fire a click event about 300ms later. If
        // this event isn't ignored, the service menu will disappear 300ms
        // after it appears, so set a flag to ignore that event.
        box.ignoreNextClick = true;
      }

      if (box.ignoreNextClick) {
        box.ignoreNextClick = false;
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
      var service = box.model;
      // The browser sends a click event right before the dblclick one, and
      // it opens the service menu: close it before moving to the service
      // details.
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
        .classed('unit-count', true)
        .classed('hide-count', false)
        .classed('show-count', true);
    },

    serviceStatusMouseOut: function(box, context) {
      d3.select(this)
        .select('.unit-count')
         .classed('unit-count', true)
         .classed('show-count', false)
         .classed('hide-count', true);
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
     * Handle deploying services by dropping a charm onto the canvas or
     * dropping a yaml bundle deployer file from your file system.
     *
     * @method canvasDropHandler
     * @param {Y.EventFacade} e the drop event object.
     * @static
     * @return {undefined} Nothing.
     */
    canvasDropHandler: function(e) {
      // Prevent Ubuntu FF 22.0 from refreshing the page.
      e.halt();
      var topo = this.get('component');
      var evt = e._event;
      var dataTransfer = evt.dataTransfer;
      var fileSources = dataTransfer.files;
      var env = topo.get('env');
      var db = topo.get('db');
      if (fileSources && fileSources.length) {
        importHelpers.deployBundleFiles(fileSources, env, db);
      } else {
        // Handle dropping charm/bundle tokens from the left side bar.
        var dragData = JSON.parse(dataTransfer.getData('Text'));
        var translation = topo.get('translate');
        var scale = topo.get('scale');
        var ghostAttributes = { coordinates: [] };
        // The following magic number 71 is the height of the header and is
        // required to position the service in the proper y position.
        var dropXY = [evt.clientX, (evt.clientY - 71)];

        // Take the x,y offset (translation) of the topology view into
        // account.
        Y.Array.each(dropXY, function(_, index) {
          ghostAttributes.coordinates[index] =
              (dropXY[index] - translation[index]) / scale;
        });
        if (dragData.dataType === 'token-drag-and-drop') {
          // The entiy (charm or bundle) data was JSON encoded because the
          // dataTransfer mechanism only allows for string values.
          var entityData = Y.JSON.parse(dragData.data);
          if (utils.determineEntityDataType(entityData) === 'charm') {
            // Add the icon url to the ghost attributes for the ghost icon
            ghostAttributes.icon = dragData.iconSrc;
            var charm = new models.Charm(entityData);
            Y.fire('initiateDeploy', charm, ghostAttributes);
          } else {
            // The deployer format requires a top-level key to hold the bundle
            // data, so we wrap the entity data in a mapping.  The deployer
            // format is YAML, but JSON is a subset of YAML, so we can just
            // encode it this way.
            importHelpers.deployBundle(
                Y.JSON.stringify({
                  bundle: entityData.data
                }),
                entityData.id,
                env,
                db
            );
          }
        }
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
      Destroys the service inspector when it's service topo destroy
      button is clicked.

      @method destroyServiceInspector
    */
    destroyServiceInspector: function() {
      this.get('component').fire('destroyServiceInspector');
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
        if ((Math.abs(box.x - box.px) + Math.abs(box.y - box.py)) /
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
    /**
     * Handle drag events for a service.
     *
     * @param {Box} box A bounding box.
     * @param {Module} self Service Module.
     * @return {undefined} Side effects only.
     * @method dragstart
     */
    dragstart: function(box, self) {
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
      } else {
        // If the service hasn't been dragged (in the case of long-click to
        // add relation, or a double-fired event) or the old and new
        // coordinates are the same, exit.
        if (box.inDrag !== views.DRAG_ACTIVE) {
          return;
        }

        // If the service has been dragged, ignore the subsequent service
        // click event.
        topo.ignoreServiceClick = true;
        topo.annotateBoxPosition(box);
      }
    },

    /**
      Specialized drag event handler
      when called as an event handler it
      Allows optional extra param, pos
      which when used overrides the mouse
      handling. This method can then be
      though of as 'drag to position'.

      @method drag
      @param {Box} d viewModel BoundingBox.
      @param {ServiceModule} self ServiceModule.
      @param {Object} pos (optional) containing x/y numbers.
      @param {Boolean} includeTransition (optional) Use transition to drag.

      [At the time of this writing useTransition works in practice but
      introduces a timing issue in the tests.]
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
      // Translate the service (and, potentially, menu).  If a position was
      // provided, update the box's coordinates and the selection's bound
      // data.
      if (pos) {
        box.x = pos.x;
        box.y = pos.y;
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

    /**
      Attempt to reuse as much of the existing graph and view models as
      possible to re-render the graph.

      @method update
      */
    update: function() {
      var self = this,
          topo = this.get('component'),
          width = topo.get('width'),
          height = topo.get('height');

      // So that we only attach these events once regardless of how many
      // times this module is rendered.
      if (!this.rendered) {
        this._attachDragEvents();
        this.rendered = true;
      }

      if (!this.service_scale) {
        this.service_scale = d3.scale.log().range([150, 200]);
        this.service_scale_width = d3.scale.log().range([164, 200]);
        this.service_scale_height = d3.scale.log().range([64, 100]);
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
      // Pack doesn't honor existing positions and will re-layout the
      // entire graph. As a short term work around we layout only new
      // nodes. New nodes are those that haven't been positioned by drag
      // and drop, or those who don't have position attributes/annotations.
      var vertices = [];
      Y.each(topo.service_boxes, function(boundingBox) {
        if (!boundingBox.model.get('pending')) {
          var annotations = boundingBox.annotations,
              addToVertices = 0;
          if (annotations['gui-x'] && boundingBox.x === undefined) {
            boundingBox.x = annotations['gui-x'];
            addToVertices += 1;
          }
          if (annotations['gui-y'] && boundingBox.y === undefined) {
            boundingBox.y = annotations['gui-y'];
            addToVertices += 1;
          }
          if (addToVertices === 2) {
            vertices.push([boundingBox.x, boundingBox.y]);
          }
        }
      });

      // new_service_boxes are those w/o current x/y pos and no
      // annotations.
      var new_service_boxes = Y.Object.values(topo.service_boxes)
      .filter(function(boundingBox) {
            var annotations = boundingBox.model.get('annotations');
            return ((!Y.Lang.isNumber(boundingBox.x) &&
                !(annotations && annotations['gui-x'])));
          });

      if (new_service_boxes.length > 0) {
        // If the there is only one new service and it's pending (as in, it was
        // added via the charm panel as a ghost), position it intelligently and
        // set its position coordinates such that they'll be saved when the
        // service is actually created.  Otherwise, rely on our pack layout (as
        // in the case of opening an unannotated environment for the first
        // time).
        if (new_service_boxes.length === 1 &&
            new_service_boxes[0].model.get('pending') &&
            (new_service_boxes[0].x === undefined ||
            new_service_boxes[0].y === undefined)) {
          // Get a coordinate outside the cluster of existing services.
          var coords = topo.servicePointOutside();
          // Set the coordinates on both the box model and the service
          // model.
          new_service_boxes[0].x = coords[0];
          new_service_boxes[0].y = coords[1];
          // Set the centroid to the new service's position
          topo.fire('panToPoint', {point: coords});
        } else {
          d3.layout.unscaledPack()
                   .size([width, height])
                   .value(function(d) { return Math.max(d.unit_count, 1); })
                   .padding(300)
                   .nodes({children: new_service_boxes});
          if (new_service_boxes.length < Y.Object.size(topo.service_boxes)) {
            // If we have new services that do not have x/y coords and are
            // not pending, then they've likely been created from the CLI.
            // In this case, to avoid placing them overlaying any existing
            // services, make sure to translate all of them to a point
            // outside the existing services.  Setting these attributes
            // will result in annotations being set in the environment
            // below.
            var pointOutside;
            var newVertices = [];
            Y.each(new_service_boxes, function(boxModel) {
              pointOutside = topo.servicePointOutside(newVertices);
              boxModel.x += pointOutside[0] - boxModel.x;
              boxModel.y += pointOutside[1] - boxModel.y;
              // For each new service added, include the service coordinates
              // we re-calculating the box placement.
              newVertices.push([boxModel.x, boxModel.y]);
            });
          }

          Y.each(new_service_boxes, function(box) {
            var existing = box.model.get('annotations') || {};
            if (!existing || !existing['gui-x']) {
              vertices.push([box.x || 0, box.y || 0]);
              topo.annotateBoxPosition(box, false);
            } else {
              if (vertices.length > 0) {
                vertices.push([
                  existing['gui-x'] || (box.x || 0),
                  existing['gui-y'] || (box.y || 0)
                ]);
              }
            }
          });
        }
      }
      // Find the centroid of our hull of services and inform the
      // topology.
      if (vertices.length) {
        this.findCentroid(vertices);
      }

      // enter
      node
      .enter().append('g')
      .attr({
            'pointer-events': 'all', // IE needs this.
            'class': function(d) {
              return (d.subordinate ? 'subordinate ' : '') +
                  (d.pending ? 'pending ' : '') + 'service';
            }})
        .call(this.dragBehavior)
        .call(self.createServiceNode, self)
        .attr('transform', function(d) { return d.translateStr; });

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
      this.findCentroid(vertices);
    },

    /**
    Given a set of vertices, find the centroid and pan to that location.

    @method findCentroid
    @param {array} vertices A list of vertices in the form [x, y].
    @return {undefined} Side effects only.
    */
    findCentroid: function(vertices) {
      var topo = this.get('component'),
              centroid = topoUtils.centroid(vertices);
      topo.fire('panToPoint', {point: centroid});
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
      .classed('service-block-image', true);

      node.append('image')
       .classed('service-icon', true)
       .attr({
                'xlink:href': function(d) {
                  return d.icon;
                },
                width: 96,
                height: 96,
                transform: 'translate(47, 50)'
              });
      node.append('text').append('tspan')
        .attr('class', 'name')
        .text(function(d) { return d.displayName; });

      node.append('text').append('tspan')
        .attr('class', 'name network-name')
        .attr({
            'x': 40,
            'y': 175
          });

      // Append status charts to service nodes.
      var status_graph = node.append('g')
        .attr('transform', 'translate(15, 152)')
        .classed('service-status', true)
        .classed('statusbar', true);

      status_graph.each(function(d) {
        if (!d.subordinate) {
          d3.select(this).property('status_bar',
              new views.StatusBar({
                width: 160,
                target: this,
                height: 10,
                labels: false
              }).render());
        }
      });
      // Manually attach the touchstart event (see method for details)
      node.each(function(data) {
        self.attachTouchstartEvents(data, this);
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
      Fade all services that are not in the selected
      network.

      @method fadeNotNetworks
    */
    fadeNotNetworks: function(evt) {
      var topo = this.get('component');
      var vis = topo.vis;
      var selectedNetworks = evt.networks;
      topo.fire('show', {
        selection: vis.selectAll('.service')
          .filter(function(d) { return !d.pending; })
      });
      var sel = vis.selectAll('.service')
              .filter(function(d) {
                var serviceNetworks = d.model.get('networks');
                for (var i = 0; i < serviceNetworks.length; i += 1) {
                  if (selectedNetworks.indexOf(serviceNetworks[i]) === -1) {
                    return true;
                  }
                }
                return false;
              });
      topo.fire('fade', {
        selection: sel
      });
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
        var cpRect = cp.getDOMNode().getClientRects()[0],
                cpWidth = cpRect.width,
                serviceCenter = service.relativeCenter,
                menuLeft = (service.x * z + tr[0] + serviceCenter[0] * z <
                        topo.get('width') / 2),
                cpHeight = cpRect.height,
                arrowWidth = 16; // Hard coded for now for simplicity.

        if (menuLeft) {
          cp.removeClass('left')
            .addClass('right');
        } else {
          cp.removeClass('right')
            .addClass('left');
        }
        // Set the position of the div in the following way:
        // top: aligned to the scaled/panned service minus the
        //   location of the tip of the arrow such that the arrow always
        //   points at the service.
        // left: aligned to the scaled/panned service; if the
        //   service is left of the midline, display it to the
        //   right, and vice versa.
        cp.setStyles({
          'top': (
                  service.y * z + tr[1] +
                  (serviceCenter[1] * z) - (cpHeight / 2)),
          'left': (
              service.x * z +
                  (menuLeft ?
                  service.w * z + arrowWidth :
                  -(cpWidth) - arrowWidth) +
                  tr[0])
        });
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
      var triangle = serviceMenu.one('.triangle');

      this.show_service(service);

      if (service.get('pending')) {
        return true;
      }

      if (box && !serviceMenu.hasClass('active')) {
        topo.set('active_service', box);
        topo.set('active_context', box.node);
        serviceMenu.addClass('active');

        var menuHeight = serviceMenu.getDOMNode().getClientRects()[0].height;
        var triHeight = 18;
        triangle.setStyle('top', ((menuHeight - triHeight) / 2) + 'px');

        // Disable the 'Build Relation' link if the charm has not yet loaded.
        var addRelation = serviceMenu.one('.add-relation');
        if (this.allowBuildRelation(topo, service)) {
          addRelation.removeClass('disabled');
        } else {
          addRelation.addClass('disabled');
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
      }
    },

    /*
     * View a service
     *
     * @method show_service
     */
    show_service: function(service) {
      var topo = this.get('component');
      var createServiceInspector = topo.get('createServiceInspector');

      topo.detachContainer();
      createServiceInspector(service);
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
    'd3-statusbar',
    'juju-templates',
    'juju-models',
    'juju-env',
    'unscaled-pack-layout',
    'bundle-import-helpers'
  ]
});
