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

      // If there are no annotations or the service is being dragged
      if (!annotations || service.inDrag === views.DRAG_ACTIVE) {
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
        // Delete gui-x and gui-y from annotations as we use the values.
        // This is to prevent deltas coming in on a service while it is
        // being dragged from resetting its position during the drag.

        delete annotations['gui-x'];
        delete annotations['gui-y'];
        // Only update position if we're not already in a drag state (the
        // current drag supercedes any previous annotations).
        var fromGhost = d.model.get('placeFromGhostPosition');
        if (!d.inDrag) {
          var useTransitions = self.get('useTransitions') && !fromGhost;
          self.drag.call(this, d, self, {x: x, y: y}, useTransitions);
        }
      }});

    // Mark subordinates as such.  This is needed for when a new service
    // is created.
    node.filter(function(d) {
      return d.subordinate;
    })
        .classed('subordinate', true);

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

    // Handle the last step of models that were made locally from ghosts.
    node.filter(function(d) {
      return d.model.get('placeFromGhostPosition');
    }).each(function(d) {
      // Show the service menu from the start.
      self.showServiceMenu(d);
      // This flag has served its purpose, at initialization time on the
      // canvas.  Remove it, so future changes will have the usual
      // behavior.
      d.model.set('placeFromGhostPosition', false);
    });

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
            'x': 13,
            'y': 79
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
    ServiceModuleCommon], {
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
        panToCenter: 'panToCenter'
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

      // If the service box is pending, ensure that the charm panel is
      // visible, but don't do anything else.
      if (box.pending) {
        // Prevent the clickoutside event from firing and immediately
        // closing the panel.
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
     * Handle deploying a services by dropping a charm onto the canvas.
     *
     * @method canvasDropHandler
     * @param {Y.EventFacade} e the drop event object.
     * @static
     * @return {undefined} Nothing.
     */
    canvasDropHandler: function(e) {
      // Required - causes Ubuntu FF 22.0 to refresh without.
      e.halt();
      var topo = this.get('component');
      var evt = e._event;
      var dataTransfer = evt.dataTransfer;
      var fileSources = dataTransfer.files;
      if (fileSources && fileSources.length) {
        // Path for dumping Deployer files on canvas.
        var db = topo.get('db');
        var store = topo.get('store');
        var notifications = db.notifications;
        Y.Array.each(fileSources, function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            // Import each into the environment
            db.importDeployer(jsyaml.safeLoad(e.target.result),
                store, {useGhost: false})
                              .then(function() {
                  notifications.add({
                    title: 'Imported Environment',
                    message: 'Import from "' + file.name + '" successful',
                    level: 'important'
                  });
                }, function(err) {
                  notifications.add({
                    title: 'Import Environment Failed',
                    message: 'Import from "' + file.name +
                                    '" failed.<br/>' + err,
                    level: 'error'
                  });
                });
          };
          reader.readAsText(file);
        });
      } else {
        // Path for dropping tokens from browser.
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
        if (dragData.dataType === 'charm-token-drag-and-drop') {
          // The charm data was JSON encoded because the dataTransfer
          // mechanism only allows for string values.
          var charmData = Y.JSON.parse(dragData.charmData);
          // Add the icon url to the ghost attributes for the ghost icon
          ghostAttributes.icon = dragData.iconSrc;
          var charm = new models.Charm(charmData);
          Y.fire('initiateDeploy', charm, ghostAttributes);
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
    /**
     * Handle drag events for a service.
     *
     * @param {Box} box A bounding box.
     * @param {Module} self Service Module.
     * @return {undefined} Side effects only.
     * @method dragstart
     */
    dragstart: function(box, self) {
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

        // If the service hasn't been dragged (in the case of long-click to
        // add relation, or a double-fired event) or the old and new
        // coordinates are the same, exit.
        if (!box.inDrag ||
                (box.oldX === box.x &&
                box.oldY === box.y)) {
          return;
        }

        // If the service is still pending, persist x/y coordinates in
        // order to set them as annotations when the service is created.
        if (box.pending) {
          box.model.set('hasBeenPositioned', true);
          box.model.set('x', box.x);
          box.model.set('y', box.y);
          return;
        }

        // If the service has been dragged, ignore the subsequent service
        // click event.
        topo.ignoreServiceClick = true;

        topo.get('env').update_annotations(
            box.id, 'service', {'gui-x': box.x, 'gui-y': box.y},
            function() {
              box.inDrag = false;
            });
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
      // Pack doesn't honor existing positions and will re-layout the
      // entire graph. As a short term work around we layout only new
      // nodes. This has the side effect that service blocks can overlap
      // and will be fixed later.
      var vertices;
      var fromGhost = false;
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
        if (new_services.length === 1 &&
            new_services[0].model.get('pending')) {
          pendingServicePlaced = true;
          // Get a coordinate outside the cluster of existing services.
          var coords = topo.servicePointOutside();
          // Set the coordinates on both the box model and the service
          // model.
          new_services[0].x = coords[0];
          new_services[0].y = coords[1];
          new_services[0].model.set('x', coords[0]);
          new_services[0].model.set('y', coords[1]);
          // This ensures that the x/y coordinates will be saved as
          // annotations.
          new_services[0].model.set('hasBeenPositioned', true);
          // Set the centroid to the new service's position
          topo.centroid = coords;
          topo.fire('panToPoint', {point: topo.centroid});
        } else {
          this.tree.nodes({children: new_services});
        }
        // Update annotations settings position on backend (but only do
        // this if there is no existing annotations).
        if (!pendingServicePlaced) {
          vertices = [];
        }
        Y.each(new_services, function(box) {
          if (box.model.get('placeFromGhostPosition')) {
            fromGhost = true;
          }
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
        // Find the centroid of our hull of services and inform the
        // topology.
        if (!vertices) {
          vertices = topoUtils.serviceBoxesToVertices(topo.service_boxes);
        }
        this.findAndSetCentroid(vertices, fromGhost);
      }
      // enter
      node
      .enter().append('g')
      .attr({
            'pointer-events': 'all', // IE needs this.
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
    findAndSetCentroid: function(vertices, preventPan) {
      var topo = this.get('component'),
              centroid = topoUtils.centroid(vertices);
      // The centroid is set on the topology object due to the fact that it is
      // used as a sigil to tell whether or not to pan to the point after the
      // first delta.
      topo.centroid = centroid;
      if (!preventPan) {
        topo.fire('panToPoint', {point: topo.centroid});
      }
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
        .text(function(d) {return d.displayName; });

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
      var landscape = topo.get('landscape');
      var landscapeReboot = serviceMenu.one('.landscape-reboot').hide();
      var landscapeSecurity = serviceMenu.one('.landscape-security').hide();
      var triangle = serviceMenu.one('.triangle');
      var securityURL, rebootURL;

      this.show_service(service);

      if (service.get('pending')) {
        return true;
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
    'd3-statusbar',
    'juju-view-service',
    'juju-templates',
    'juju-models',
    'juju-env',
    'unscaled-pack-layout'
  ]
});
