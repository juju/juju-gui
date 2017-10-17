/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const d3 = require('d3');
const jsyaml = require('js-yaml');

const environmentUtils = require('./environment-utils');
const relationUtils = require('../relation-utils');
const topoUtils = require('./utils');
const zipUtils = require('../zip-utils');

class ServiceModule {
  constructor(options={}) {
    this.name = 'ServiceModule';
    this.useTransitions = options.useTransitions || false;
    this.DRAG_START = 1;
    this.DRAG_ACTIVE = 2;
    this.events = {
      scene: {
        '.service': {
          click: 'serviceClick',
          mouseover: 'serviceMouseEnter',
          mouseout: 'serviceMouseLeave',
          mousemove: 'serviceMouseMove'
        },
        // See _attachDragEvents for the drag and drop event registrations
        '.zoom-plane': {
          mouseup: 'canvasClick'
        }
      },
      d3: {
        '.service': {
          'mousedown.addrel': 'serviceAddRelMouseDown',
          'mouseup.addrel': 'serviceAddRelMouseUp'
        }
      },
      topo: {
        /**
          Highlight a service and, if specified, related services.

          @event highlight
          @param {Object} An object with a service name and a flag indicating
            whether or not to highlight related services.
        */
        highlight: 'highlight',
        /**
          Unhighlight a service and, if specified, related services.

          @event unhighlight
          @param {Object} An object with a service name and a flag indicating
            whether or not to unhighlight related services.
        */
        unhighlight: 'unhighlight',
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
          @param {Object} An object with a d3 selection attribute or a service
            name attribute.
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
          Clear view state as pertaining to services.

          @event clearState
        */
        clearState: 'clearStateHandler',
        /**
          Pans the environment view to the center.

          @event panToCenter
        */
        panToCenter: 'panToCenter',
        /**
          Pans the environment view to the bundle.

          @event panToCenter
        */
        bundleImportComplete: 'panToBundle'
      }
    };

    // Margins applied on update to Box instances.
    this.subordinate_margins = {
      top: 0.05,
      bottom: 0.1,
      left: 0.084848,
      right: 0.084848
    };
    // No drop-shadow to account for, currently, so set these to just far
    // enough in so that the corners of the relation line do not show.
    this.service_margins = {
      top: 0.01,
      bottom: 0.01,
      left: 0.01,
      right: 0.01
    };
    this.currentServiceClickAction = 'showServiceDetails';
    // Default to true, once centered this will be set to false.
    this.centerOnLoad = true;
  }

  /**
    Sync view models with current db.models.

    @method updateData
  */
  updateData() {
    //model data
    var topo = this.topo;
    var vis = topo.vis;
    var db = topo.db;
    var env = topo.env;

    var visibleServices = db.services.visible();
    environmentUtils.toBoundingBoxes(
      this, visibleServices, topo.service_boxes, env);
    // Store the size of the visibleServices model list because it gets
    // reset below.
    var serviceCount = visibleServices.size();
    // Break a reference cycle that results in uncollectable objects leaking.
    visibleServices.reset();

    // Nodes are mapped by modelId tuples.
    this.node = vis.selectAll('.service').data(
      Object.keys(topo.service_boxes).map(k => topo.service_boxes[k]),
      function(d) {return d.modelId;});
    // It takes a few update cycles to add the services to the database so
    // this checks to make sure we only center once we have some services to
    // center on.
    if (this.centerOnLoad && serviceCount > 0) {
      this.centerOnLoad = false;
      // Bounce this panToCenter to the top of the stack so that the async
      // d3 renderings complete before we try to pan.
      setTimeout(() => {
        this.panToCenter();
      });
    }
  }

  /**
    Fill the empty structures within a service node such that they
    match the db.

    @param {object} node the collection of nodes to update.
    @return {null} side effects only.
    @method updateServiceNodes
  */
  updateServiceNodes(node) {
    if (node.empty()) {
      return;
    }
    var self = this,
        topo = this.topo;

    // Apply Position Annotations
    // This is done after the services_boxes
    // binding as the event handler will
    // use that index.
    var movedNodes = 0;
    node.each(function(d) {
      var service = d.model,
          annotations = service.get('annotations'),
          x, y;

      // Set widths and heights.
      d.subordinate ? d.w = d.h = 130 : d.w = d.h = 190;

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
          var useTransitions = self.useTransitions;
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

    // Size the node for drawing.
    node.attr({
      'width': function(box) {
        return box.w;
      },
      'height': function(box) {
        return box.h;
      }
    });
    node.select('.service-block')
      .attr({
        'cx': function(d) { return d.subordinate ? 65 : 95; },
        'cy': function(d) { return d.subordinate ? 65 : 95; },
        'r': function(d) { return d.subordinate ? 60 : 90; }
      });
    node.select('.service-block__halo')
      .attr({
        'cx': function(d) { return d.subordinate ? 65 : 95; },
        'cy': function(d) { return d.subordinate ? 65 : 95; },
        'r': function(d) { return d.subordinate ? 80 : 110; }
      });
    node.select('.service-icon')
      .attr('transform', function(d) {
        return d.subordinate ? 'translate(17, 17)' : 'translate(47, 47)';
      });
    node.select('.relation-button')
      .attr('transform', function(d) {
        return 'translate(' + [d.subordinate ? 65 : 95, 30] + ')';
      });

    var rerenderRelations = false;
    node.select('.service-block').each(function(d) {
      var curr_node = d3.select(this),
          parent_node = d3.select(this.parentNode),
          is_pending = false,
          is_uncommitted = false,
          is_erroring = false;

      // The stroke attributes need to be set for when the service first
      // appears on the canvas. Just setting the class is not sufficient.
      if (d.subordinate) {
        curr_node.attr({
          'stroke': '#888888',
          'stroke-width': 1
        });
      } else if ((d.pending || d.deleted)) {
        curr_node.attr({
          'stroke': '#19b6ee',
          'stroke-width': 3
        });
        is_uncommitted = true;
        rerenderRelations = true;
      } else if (d.highlighted) {
        rerenderRelations = true;
      } else {
        var units = d.units._items;
        units.forEach(function(unit) {
          if (unit.agent_state === 'installing'
              || unit.agent_state === 'pending') {
            is_pending = true;
          } else if (unit.agent_state === 'error') {
            is_erroring = true;
          } else if (!unit.agent_state) {
            is_uncommitted = true;
          }
        });
        rerenderRelations = true;
      }

      // Add the current state class
      if (is_erroring) {
        parent_node.classed('is-erroring', true)
          .classed('is-pending', false)
          .classed('is-uncommitted', false)
          .classed('is-running', false);
      } else if (is_pending) {
        parent_node.classed('is-pending', true)
          .classed('is-erroring', false)
          .classed('is-uncommitted', false)
          .classed('is-running', false);
      } else if (is_uncommitted) {
        parent_node.classed('is-uncommitted', true)
          .classed('is-erroring', false)
          .classed('is-pending', false)
          .classed('is-running', false);
      } else {
        parent_node.classed('is-running', true)
          .classed('is-erroring', false)
          .classed('is-uncommitted', false)
          .classed('is-pending', false);
      }

      curr_node.attr({
        'width': d.w,
        'height': d.h
      });
    });

    if (rerenderRelations) {
      document.dispatchEvent(new Event('topo.rerenderRelations'));
    }

    // Draw a subordinate relation indicator.
    var subRelationIndicator = node.filter(function(d) {
      return d3.select(this)
        .select('.sub-rel-block').empty() &&
        d.subordinate;
    })
      .insert('g', ':first-child')
      .attr('class', 'sub-rel-block')
      .attr('transform', function(d) {
        // Position the block so that the relation indicator will
        // appear at the right connector.
        return 'translate(' + [d.w - 5, d.h / 2 - 26] + ')';
      });

    subRelationIndicator.append('line')
      .attr({
        'x1': 0,
        'y1': 30,
        'x2': 20,
        'y2': 30
      })
      .attr('stroke-width', 1)
      .attr('stroke', '#888888');
    subRelationIndicator.append('circle')
      .attr({
        'cx': 0,
        'cy': 30,
        'r': 4
      })
      .attr('fill', '#888888');
    subRelationIndicator.append('circle')
      .attr({
        'cx': 35,
        'cy': 30,
        'r': 15
      })
      .attr('stroke-width', 1.1) // Extra .1 fix for antialiased jittery edges
      .attr('stroke', '#888888')
      .attr('fill', '#f5f5f5');
    subRelationIndicator.append('text').append('tspan')
      .attr({
        'class': 'sub-rel-count',
        'x': 30,
        'y': 45 * 0.8
      });

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

    node.select('.name').text(
      function(d) {
        return self.truncateServiceName(d);
      });

    node.select('.charm-label').attr({
      'style': function(d) {
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
      d3.select(this).classed('is-exposed', true);
    });

    // Remove exposed indicator from nodes that are no longer exposed.
    var unexposed = node.filter(function(d) {
      return !d.exposed;
    });
    unexposed.each(function(d) {
      d3.select(this).classed('is-exposed', false);
    });
  }

  /**
    Get the DOM node if the container has been provided by YUI, otherwise the
    container will be the DOM node already.

    @method getContainer
    @param {Object} context The context to get the container for.
    @return {Object} A DOM node.
  */
  getContainer(context) {
    context = context ? context : this;
    const container = context.topo.container;
    return container.getDOMNode && container.getDOMNode() || container;
  }

  /**
    Handle delegated events.

    @method _delegate
    @param {String} event The event to attach.
    @param {Function} handler The function to call when the event fires.
    @param {Function} target The class to use for the delegated events.
  */
  _delegate(event, handler, target) {
    const container = this.getContainer(this);
    container.addEventListener(event, evt => {
      if (evt.target.classList.contains(target) ||
        evt.target.closest(`.${target}`)) {
        handler(evt);
      }
    });
  }

  /**
    Attaches the drag and drop events for this view. These events need to be
    here because attaching them in the events object causes drag and drop
    events to stop bubbling at odd places cross browser.

    @method _attachDragEvents
  */
  _attachDragEvents() {
    const ZP = 'zoom-plane';
    const EC = 'environment-help';

    this._delegate('drop', this.canvasDropHandler.bind(this), ZP);
    this._delegate('dragenter', this._ignore.bind(this), ZP);
    this._delegate('dragover', this._ignore.bind(this), ZP);

    // allows the user to drop the charm on the 'drop here' help text in
    // IE10.
    this._delegate('drop', this.canvasDropHandler.bind(this), EC);
    this._delegate('dragenter', this._ignore.bind(this), EC);
    this._delegate('dragover', this._ignore.bind(this), EC);
  }

  /**
    Center a newly deployed bundle in the viewport when processing of the
    changeset has completed and entities have been added to the ECS.

    @param {Object} Event facade containing a list of the services deployed.
    @method panToBundle
  */
  panToBundle(evt) {
    var topo = this.topo;
    var services = evt.services;
    var vertices = [];
    services.forEach(function(service) {
      var box = topo.service_boxes[service.get('id')];
      if (box) {
        vertices.push([
          box.x,
          box.y
        ]);
      }
    });
    this.findCentroid(vertices);
  }

  /**
    * Ignore a drag event.
    * @method _ignore
    */
  _ignore(e) {
    // This used to be an e.halt() which also stops event propogation but
    // that prevented listening to any drag events above the canvas.
    e.preventDefault();
  }

  /**
    Attaches the touchstart event handlers for the service elements. This is
    required because touchstart does not appear to bubble in Chrome for
    Android 4.2.2.

    @method attachTouchstartEvents
    @param {Object} data D3 data object.
    @param {DOM Element} node SVG DOM element.
  */
  attachTouchstartEvents(data, node) {
    const topo = this.topo;

    // Do not attach the event to the ghost nodes
    if (!d3.select(node).classed('pending')) {
      node.addEventListener(
        'touchstart', this._touchstartServiceTap, this, topo);
    }
  }

  /**
    Callback for the touchstart event handlers on the service svg elements

    @method _touchstartServiceClick
    @param {Object} e event object from tap.
    @param {Object} topo topography instance reference.
  */
  _touchstartServiceTap(e, topo) {
    // To execute the serviceClick method under the same context as
    // click we call it under the touch target context
    var node = e.currentTarget,
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
  }

  /**
    Show the service as hovered.

    @method hoverService
    @param {String} id The service id.
    @param {Boolean} hover Whether the state is hovered or not.
  */
  hoverService(id, hover) {
    var node = this.getServiceNode(id);
    if (node) {
      if (hover) {
        topoUtils.addSVGClass(node, 'hover');
      } else {
        this.unhoverServices();
      }
    }
  }

  /**
    Clear all hovers on services.

    @method unhoverServices
  */
  unhoverServices() {
    this.topo.vis.selectAll('.hover').classed('hover', false);
  }

  /**
    Deselect all tokens.

    @method deselectNodes
  */
  deselectNodes() {
    var topo = this.topo;
    topo.vis.selectAll('.is-selected').classed('is-selected', false);
  }

  /**
    Select the token for the provided element.

    @method selectNode
    @param {Object} node The service node to select.
  */
  selectNode(node) {
    this.deselectNodes();
    topoUtils.addSVGClass(node, 'is-selected');
  }

  /**
    Select the token for the provided service.

    @method selectService
    @param {String} id The service id.
  */
  selectService(id) {
    var node = this.getServiceNode(id);
    if (node) {
      this.selectNode(node);
    }
  }

  /**
    Center the viewport on the service token.

    @method panToService
    @param {String} id The service id.
  */
  panToService(id) {
    var node = this.getServiceNode(id);
    if (node) {
      var box = d3.select(node).datum();
      document.dispatchEvent(new CustomEvent('topo.panToPoint', {
        detail: [{point: [box.x, box.y]}]
      }));
    }
  }

  /**
    Reorder the services with the selected service at the top.

    @method _raiseToTop
    @param {String} id The selected service id.
  */
  _raiseToTop(selectedId) {
    d3.selectAll('.the-canvas .service').sort((a, b) => {
      if (a.id === selectedId) {
        return 1;
      } else if (b.id === selectedId) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  /**
    Handles the click or tap on the service svg elements.

    It is executed under the context of the clicked/tapped DOM element

    @method serviceClick
    @param {Object} box service object model instance.
    @param {Object} self this service module instance.
    @param {String} eType string representing if it's 'touch' or not.
  */
  serviceClick(box, self, eType) {
    // Ignore if we clicked outside the actual service node.
    var topo = self.topo;
    const container = self.getContainer(self);

    // This check is required because d3.mouse() throws an internal error
    // on touch events
    if (eType !== 'touch') {
      var mouse_coords = d3.mouse(container.querySelector('.the-canvas'));
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
    var curr_click_action = self.currentServiceClickAction;

    // Remove is-selected class from all services and add to the currently
    // clicked service.
    if (box.node) {
      self.selectNode(box.node);
    }

    // Fire the action named in the following scheme:
    //   <action>
    // with the service, the SVG node, and the view
    // as arguments.
    self[curr_click_action](box, topo);
    self._raiseToTop(box.id);
  }

  serviceMouseEnter(box, context) {
    document.dispatchEvent(new CustomEvent('topo.hoverService', {
      detail: {id: box.id}
    }));
    var rect = this.closest('.service');
    if (!topoUtils.hasSVGClass(rect, 'selectable-service')) {
      return;
    }
    document.dispatchEvent(new CustomEvent('topo.snapToService', {
      detail: [{service: box, rect: rect}]
    }));
  }

  serviceMouseLeave(box, context) {
    var topo = context.topo;
    document.dispatchEvent(new CustomEvent('topo.hoverService', {
      detail: {id: null}
    }));
    context.unhoverServices();

    const container = context.getContainer(context);
    // Do not fire if we're within the service box.
    var mouse_coords = d3.mouse(container.querySelector('.the-canvas'));
    if (box.containsPoint(mouse_coords, topo.zoom)) {
      return;
    }

    document.dispatchEvent(new Event('topo.snapOutOfService'));
  }

  /**
   * Handle a mouse moving over a service.
   *
   * @method serviceMouseMove
   * @param {object} d Unused.
   * @param {object} context Unused.
   * @return {undefined} Side effects only.
   */
  serviceMouseMove(box, context) {
    document.dispatchEvent(new Event('topo.mouseMove'));
  }

  /**
   * If the user clicks on the background we cancel any active add
   * relation.
   *
   * @method canvasClick
   */
  canvasClick(box, self) {
    var topo = self.topo;
    // Don't clear the canvas state if the click event was from dragging the
    // canvas around.
    if (!topo.zoomed) {
      document.dispatchEvent(new Event('topo.clearState'));
    }
  }

  /**
   * This is a shim around _canvasDropHandler which does the real work.
   *
   * @method canvasDropHandler
   * @param {Y.EventFacade} evt The drop event object.
   * @return {Object} Either undefined or the string "event ignored" (for
   *   testing purposes).
   */
  canvasDropHandler(evt) {
    // Prevent Ubuntu FF 22.0 from refreshing the page.
    evt.preventDefault();
    var files = evt.dataTransfer.files;
    var topo = this.topo;
    var env = topo.env;
    var db = topo.db;
    return this._canvasDropHandler(files, topo, env, db, evt);
  }

  /**
   * Handle deploying services by dropping a charm from the charm browser,
   * a bundle yaml deployer file, or zip containing a local charm
   * onto the canvas.
   *
   * @method _canvasDropHandler
   * @param {Array} files The files dropped on the browser (if any).
   * @param {Object} topo The topology.
   * @param {Object} env The environment.
   * @param {Object} db The database.
   * @param {Object} evt The browser-generated (non-YUI) drop event.
   * @return {Object} Either undefined or the string "event ignored" (for
   *   testing purposes).
   */
  _canvasDropHandler(files, topo, env, db, evt) {
    var self = this;
    if (files && files.length) {
      // If it is a file from the users file system being dropped.
      Array.prototype.forEach.call(files, function(file) {
        // In order to support the user dragging and dropping multiple files
        // of mixed types we handle each file individually.
        var ext = file.name.split('.').slice(-1).toString();

        if ((file.type === 'application/zip' ||
             file.type === 'application/x-zip-compressed') &&
            ext === 'zip') {
          self._extractCharmMetadata.call(self, file, topo, env, db);
        } else {
          // To support easier development of the GUI without having
          // to have it deployed to the charm for changeset bundle
          // deployments we support dropping a changeset export onto
          // the canvas.
          self.topo.bundleImporter.importBundleFile(file);
        }
      });
    } else {
      // Handle dropping charm/bundle tokens from the left side bar.
      this._deployFromCharmbrowser(evt, topo);
      return;
    }
    return 'event ignored';
  }

  /**
   * Deploy a local charm.
   *
   * @method _deployLocalCharm
   * @param {Object} env The environment.
   * @param {Object} db The database.
   * @return {undefined} Nothing.
   */
  _deployLocalCharm(file, env, db) {
    // Store the local file in the global store.
    window.localCharmFile = file;
    this.topo.state.changeState({
      gui: {
        inspector: {
          id: null,
          localType: 'new'
        }}
    });
  }

  /**
    Extracts the needed charm data from the zip file in the browser.

    @method _extractCharmMetadata
    @param {Object} file The dropped charm zip.
    @param {Object} topo The topology.
    @param {Object} env The environment.
    @param {Object} db reference to the app db.
    @return {Object} The charm metadata.
  */
  _extractCharmMetadata(file, topo, env, db) {
    zipUtils.getEntries(
      file,
      this._findCharmEntries.bind(this, file, topo, env, db),
      this._zipExtractionError.bind(this, db, topo, file));
  }

  /**
    Finds the file entries in the charm zip.

    @method _findCharmEntries

    @param {Object} file The dropped charm zip.
    @param {Object} topo The topology.
    @param {Object} env The environment.
    @param {Obhect} db reference to the app db.
    @param {Object} allEntries all of the file contents.
  */
  _findCharmEntries(file, topo, env, db, allEntries) {
    var entries = zipUtils.findCharmEntries(allEntries);
    // We strictly need only the charm's metadata: see
    // juju-core/state/apiserver/charms.go:findArchiveRootDir.
    if (!entries.metadata) {
      db.notifications.add({
        title: 'Import failed',
        message: 'Import from "' + file.name + '" failed. Invalid charm ' +
            'file, missing metadata.yaml',
        level: 'error'
      });
      // Hide the file drop overlay.
      topo.environmentView.fadeHelpIndicator(false);
      return;
    }
    this._readCharmEntries(file, topo, env, db, entries);
  }

  /**
    Calls the zipUtils.readCharmEntries method to get the contents of the
    necessary charm files.

    @method _readCharmEntries
    @param {Object} file The dropped charm zip.
    @param {Object} topo The topology.
    @param {Object} env The environment.
    @param {Obhect} db reference to the app db.
    @param {Object} entries parsed file entries from the zip.
  */
  _readCharmEntries(file, topo, env, db, entries) {
    zipUtils.readCharmEntries(
      entries,
      this._checkForExistingServices.bind(this, file, topo, env, db),
      this._zipExtractionError.bind(this, db, topo, file));
  }

  /**
    Checks to see if there are any deployed services which were deployed
    from the same charm that is being dropped.

    Callback from the zipUtils.getEntries() call

    @method _checkForExistingServices
    @param {Object} file The dropped charm zip.
    @param {Object} topo The topology.
    @param {Object} env The environment.
    @param {Obhect} db Reference to the app db.
    @param {Object} contents Maps names to contents. This usually
      includes at least the "metadata" key, and one or more of the following
      keys: "config", "revision" and "readme".
  */
  _checkForExistingServices(file, topo, env, db, contents) {
    const charmName = jsyaml.safeLoad(contents.metadata).name;
    const services = db.services.getServicesFromCharmName(charmName);
    if (services.length > 0) {
      this._showUpgradeOrNewInspector(file, env, db);
    } else {
      this._deployLocalCharm(file, env, db);
    }
  }

  /**
    Creates a notification for the error from the zip extraction failure.

    @method _zipExtractError
    @param {Object} db Reference to the app db.
    @param {Object} topo The topology.
    @param {Object} file The dropped file.
    @param {Object} error The error returned from the zip lib.
  */
  _zipExtractionError(db, topo, file, error) {
    db.notifications.add({
      title: 'Import failed',
      message: 'Import from "' + file.name + '" failed. See console for ' +
          'error object',
      level: 'error'
    });
    console.error(error);
    // Hide the file drop overlay.
    topo.environmentView.fadeHelpIndicator(false);
  }

  /**
    Shows an inspector allowing the user to decide if they want to upgrade
    an existing service with a local charm or deploy a new service. Or calls
    _deployLocalCharm if there are no existing services.
    @param {Object} file The file that was dropped on the canvas.
    @param {Object} env A reference to the app env.
    @param {Object} db A reference to the apps db.
  */
  _showUpgradeOrNewInspector(file, env, db) {
    // Store the local file in the global store.
    window.localCharmFile = file;
    this.topo.state.changeState({
      gui: {
        inspector: {
          id: null,
          localType: 'update'
        }}
    });
  }

  /**
    Called from canvasDropHandler.

    Handles deploying a charm or bundle from the charmbrowser.

    @method _deployFromCharmbrowser
    @param {Object} evt The drop event.
    @param {Object} topo The environment.
  */
  _deployFromCharmbrowser(evt, topo) {
    var dragData = JSON.parse(evt.dataTransfer.getData('Text'));
    var translation = topo.getTranslate();
    var scale = topo.getScale();
    var ghostAttributes = { coordinates: [] };
    // The following magic number 71 is the height of the header and is
    // required to position the service in the proper y position.
    var dropXY = [evt.clientX, (evt.clientY - 71)];

    // Take the x,y offset (translation) of the topology view into account.
    dropXY.forEach((_, index) => {
      ghostAttributes.coordinates[index] =
          (dropXY[index] - translation[index]) / scale;
    });
    if (dragData.dataType === 'token-drag-and-drop') {
      // The entiy (charm or bundle) data was JSON encoded because the
      // dataTransfer mechanism only allows for string values.
      var entityData = JSON.parse(dragData.data);
      let entityType = 'charm';
      if (entityData && entityData.id && entityData.id.indexOf('bundle') > -1) {
        entityType = 'bundle';
      }
      if (entityType === 'charm') {
        // Add the icon url to the ghost attributes for the ghost icon
        ghostAttributes.icon = dragData.iconSrc;
        var charm = new window.models.Charm(entityData);
        document.dispatchEvent(new CustomEvent('initiateDeploy', {'detail': {
          charm: charm,
          ghostAttributes: ghostAttributes
        }}));
      } else {
        this.topo.db.notifications.add({
          title: 'Processing File',
          message: 'Changeset processing started.',
          level: 'important'
        });
        var charmstore = topo.charmstore;
        charmstore.getBundleYAML(
          entityData.id.replace('cs:', ''),
          function(error, bundleYAML) {
            if (error) {
              console.error(error);
              return;
            }
            topo.bundleImporter.importBundleYAML(bundleYAML);
          }.bind(this));
      }
    }
  }

  /**
   * Clear any stateful actions (menus, etc.) when a clearState event is
   * received.
   *
   * @method clearStateHandler
   * @return {undefined} Side effects only.
   */
  clearStateHandler() {
    var topo = this.topo;
    const container = this.getContainer();
    container.querySelectorAll('.environment-menu.active').forEach(node => {
      node.classList.remove('active');
    });
    this.deselectNodes();
    this.unhoverServices();
    topo.state.changeState({
      root: null,
      user: null,
      gui: {
        machines: null,
        inspector: null
      },
      hash: null,
      search: null,
      store: null
    });
  }

  /**
   Is building relations allowed at this time?

   @method allowBuildRelation
   @param {Object} topo The topology.
   @param {Object} service The service to be tested.
   @return {Boolean} True if building of relation is allowed.
   */
  allowBuildRelation(topo, service) {
    var charm = topo.db.charms.getById(service.get('charm'));
    return charm && charm.loaded;
  }

  /**
   Service add relation mouse down handler.

   @method serviceAddRelMouseDown
   @param {Object} box The service box that's been clicked.
   @param {Object} context The current context.
   */
  serviceAddRelMouseDown(box, context) {
    var evt = d3.event;
    var topo = context.topo;
    context.longClickTimer = window.setTimeout((d, e) => {
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
      if (!topo.buildingRelation) {
        // Start the process of adding a relation if not already building a
        // relation
        document.dispatchEvent(new CustomEvent('topo.addRelationDragStart', {
          detail: [{service: box}]
        }));
      }
    }, 250, box, evt);
  }

  /**
   Service add relation mouse up handler.

   @method serviceAddRelMouseUp
   @param {Object} box The service box that's been clicked.
   @param {Object} context The current context.
   */
  serviceAddRelMouseUp(box, context) {
    // Cancel the long-click timer if it exists.
    if (context.longClickTimer) {
      window.clearInterval(context.longClickTimer);
    }
  }

  /**
   * Handle drag events for a service.
   *
   * @param {Box} box A bounding box.
   * @param {Module} self Service Module.
   * @return {undefined} Side effects only.
   * @method dragstart
   */
  dragstart(box, self) {
    var topo = self.topo;
    box.inDrag = self.DRAG_START;
    self._raiseToTop(box.id);
    this.clickTimer = false;
    // Clicking on a different appliaction skips the timeout
    if (topo.lastBoxClicked && box.id !== topo.lastBoxClicked) {
      this.clickTimer = true;
      topo.lastBoxClicked = box.id;
      return;
    }

    window.clearTimeout(this.timeout);
    // Timer to block the dragend on click
    this.timeout = setTimeout(() => {
      this.clickTimer = true;
      topo.lastBoxClicked = box.id;
    }, 100);
  }

  dragend(box, self) {
    var topo = self.topo;
    if (box.tapped) {
      box.tapped = false;
      if (!topo.buildingRelation) {
        return;
      }
    }
    if (topo.buildingRelation && this.clickTimer) {
      topo.ignoreServiceClick = true;
      document.dispatchEvent(new Event('topo.addRelationDragEnd'));
      topo.lastBoxClicked = undefined;
    } else {
      // If the service hasn't been dragged (in the case of long-click to
      // add relation, or a double-fired event) or the old and new
      // coordinates are the same, exit.
      if (box.inDrag !== self.DRAG_ACTIVE) {
        return;
      }

      // If the service has been dragged, ignore the subsequent service
      // click event.
      topo.ignoreServiceClick = true;
      topo.annotateBoxPosition(box);
    }
  }

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
  drag(box, self, pos, includeTransition) {
    if (box.tapped) {
      return;
    }
    var topo = self.topo;
    var selection = d3.select(this);

    if (topo.buildingRelation) {
      if (box) {
        document.dispatchEvent(new CustomEvent('topo.addRelationDrag', {
          detail: [{box: box}]
        }));
        return;
      } else {
        topo.buildingRelation = false;
      }
    }
    if (self.longClickTimer) {
      window.clearInterval(self.longClickTimer);
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

    const container = self.getContainer();
    // Remove any active menus.
    container.querySelectorAll('.environment-menu.active').forEach(node => {
      node.classList.remove('active');
    });
    if (box.inDrag === self.DRAG_START) {
      box.inDrag = self.DRAG_ACTIVE;
    }
    document.dispatchEvent(new Event('topo.cancelRelationBuild'));
    // Update relation lines for just this service.
    document.dispatchEvent(new CustomEvent('topo.serviceMoved', {
      detail: [{service: box}]
    }));
  }

  /**
    Attempt to reuse as much of the existing graph and view models as
    possible to re-render the graph.

    @method update
    */
  update() {
    var self = this,
        topo = this.topo,
        width = topo.getWidth(),
        height = topo.getHeight();

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
    // Pass the wheel events to the canvas so that it can be zoomed.
    node.on('mousewheel.zoom', topo.handleZoom.bind(topo))
      .on('wheel.zoom', topo.handleZoom.bind(topo));

    // Rerun the pack layout.
    // Pack doesn't honor existing positions and will re-layout the
    // entire graph. As a short term work around we layout only new
    // nodes. New nodes are those that haven't been positioned by drag
    // and drop, or those who don't have position attributes/annotations.
    var vertices = [];
    Object.keys(topo.service_boxes).forEach(key => {
      const boundingBox = topo.service_boxes[key];
      // Ensure each box has position attributes set.
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
      if (addToVertices === 2 && !boundingBox.model.get('pending')) {
        vertices.push([boundingBox.x, boundingBox.y]);
      }
    });

    // new_service_boxes are those w/o current x/y pos and no
    // annotations.
    var new_service_boxes = Object.keys(topo.service_boxes).map(
      k => topo.service_boxes[k]).filter(function(boundingBox) {
      // In the case where a model has been removed from the database
      // and update runs before exit, boundingBox.model will be empty;
      // these can automatically be ignored.
      if (boundingBox.model) {
        var annotations = boundingBox.model.get('annotations');
        return (isNaN(boundingBox.x) &&
                !(annotations && annotations['gui-x']));
      }
      return false;
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
        document.dispatchEvent(new CustomEvent('topo.panToPoint', {
          detail: [{point: coords}]
        }));
      } else {
        d3.layout.pack()
        // Set the size of the visualization to the size of the
        // viewport (unscaledPack discards this, but it is
        // convention).
          .size([width, height])
        // Set the value function for the size of each child node
        // to the number of units within that node.
          .value(function(d) { return Math.max(d.unit_count, 1); })
        // Set the padding space around each node.
          .padding(300)
        // Set a sensible radius to prevent nodes from overlapping.
          .radius(50)
        // Run the pack layout on the new service boxes.
          .nodes({children: new_service_boxes});
        if (new_service_boxes.length <
          Object.keys(topo.service_boxes).length) {
          // If we have new services that do not have x/y coords and are
          // not pending, then they've likely been created from the CLI.
          // In this case, to avoid placing them overlaying any existing
          // services, make sure to translate all of them to a point
          // outside the existing services.  Setting these attributes
          // will result in annotations being set in the environment
          // below.
          var pointOutside;
          var newVertices = [];
          new_service_boxes.forEach(boxModel => {
            pointOutside = topo.servicePointOutside(newVertices);
            boxModel.x += pointOutside[0] - boxModel.x;
            boxModel.y += pointOutside[1] - boxModel.y;
            // For each new service added, include the service coordinates
            // we re-calculating the box placement.
            newVertices.push([boxModel.x, boxModel.y]);
          });
        }

        new_service_boxes.forEach(box => {
          var existing = box.model.get('annotations') || {};
          if (!existing || !existing['gui-x']) {
            vertices.push([box.x || 0, box.y || 0]);
            topo.annotateBoxPosition(box);
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

    // enter
    node
      .enter().append('g')
      .attr({
        'pointer-events': 'all', // IE needs this.
        'class': function(d) {
          return (d.subordinate ? 'subordinate ' : '') + 'service';
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

    this.updateElementVisibility();
  }

  /**
    Pans the environment view to the center all the services on the canvas.

    @method panToCenter
    @param {object} evt The event fired.
    @return {undefined} Side effects only.
  */
  panToCenter(evt) {
    var topo = this.topo;
    var vertices = topoUtils.serviceBoxesToVertices(topo.service_boxes);
    this.findCentroid(vertices);
  }

  /**
  Given a set of vertices, find the centroid and pan to that location.

  @method findCentroid
  @param {array} vertices A list of vertices in the form [x, y].
  @return {undefined} Side effects only.
  */
  findCentroid(vertices) {
    const centroid = topoUtils.centroid(vertices);
    document.dispatchEvent(new CustomEvent('topo.panToPoint', {
      detail: [{
        point: centroid,
        center: true
      }]
    }));
  }

  /**
   * Get a d3 selected node for a given service by id.
   *
   * @method getServiceNode
   * @return  {d3.selection} selection || null.
   */
  getServiceNode(id) {
    if (this.node === undefined) {
      return null;
    }
    var node = this.node.filter(function(d, i) {
      return d.id === id;
    });
    return node && node[0][0] || null;
  }

  /**
    Returns a service name which is a maximum of 10 characters wide.

    @method truncateServiceName
    @param {Object} service The service model
    @return {String} The truncated service display name.
  */
  truncateServiceName(service) {
    var name = service.displayName;
    if (service.pending) {
      // It will have parens added in the model.
      name = name.match(/^\(?(.{0,}?)\)?$/)[1];
    }
    if (name.length > 10) {
      name = name.substr(0, 9) + '…';
    }
    if (service.pending) {
      // Add the parens back.
      name = '(' + name + ')';
    }
    return name;
  }

  /**
   * Fill a service node with empty structures that will be filled out
   * in the update stage.
   *
   * @param {object} node the node to construct.
   * @param {object} self reference to the view instance.
   * @return {null} side effects only.
   * @method createServiceNode
   */
  createServiceNode(node, self) {
    var staticURL = self.topo.staticURL || '';
    if (staticURL) {
      staticURL += '/';
    }
    var basePath = `${staticURL}static/gui/build/app`;
    node.attr({'data-name':  function(d) { return d.name; }});

    // Draw a relation button.
    var relationButton = node.filter(function(d) {
      return d3.select(this)
        .select('.relation-button').empty();
    })
      .insert('g', ':first-child')
      .attr('class', 'relation-button')
      .attr('transform', function(d) {
        // Position the block so that the relation indicator will
        // appear at the top.
        return 'translate(' + [d.subordinate ? 65 : 95, 30] + ')';
      });

    relationButton.append('line')
      .attr({
        'x1': 0,
        'y1': 0,
        'x2': 0,
        'y2': 30
      })
      .attr('stroke-width', 1)
      .attr('stroke', '#888888');
    relationButton.append('circle')
      .attr({
        'cx': 0,
        'cy': 34,
        'r': 4
      })
      .attr('fill', '#888888');

    relationButton.append('circle')
      .classed('relation-button__link', true)
      .attr({
        cx: 0,
        cy: 0,
        r: 15,
        fill: '#f8f8f8',
        stroke: '#888888',
        'stroke-width': 1.1
      })
      .on('mousedown', function(d) {
        document.dispatchEvent(new CustomEvent('topo.addRelationDragStart', {
          detail: [{service: d}]
        }));
      })
      .on('click', function(d) {
        document.dispatchEvent(new CustomEvent('topo.addRelationDragStart', {
          detail: [{service: d}]
        }));
      });

    relationButton.append('image')
      .classed('relation-button__image', true)
      .attr({
        'xlink:href': `${basePath}/assets/svgs/build-relation_16.svg`,
        width: 16,
        height: 16,
        transform: 'translate(-8, -8)'
      });

    node.append('circle')
      .attr({
        cx: function(d) {
          return (d.subordinate ? 65 : 95);
        },
        cy: function(d) {
          return (d.subordinate ? 65 : 95);
        },
        r: function(d) {
          return (d.subordinate ? 80 : 110);
        },
        fill: 'transparent',
        'stroke-dasharray': '5, 5'
      })
      .classed('service-block__halo', true);

    node.append('circle')
      .attr({
        cx: function(d) {
          return (d.subordinate ? 65 : 95);
        },
        cy: function(d) {
          return (d.subordinate ? 65 : 95);
        },
        r: function(d) {
          return (d.subordinate ? 60 : 90);
        },
        fill: '#f5f5f5',
        'stroke-width': 1,
        stroke: '#888888'
      })
      .classed('service-block', true);

    node.append('image')
      .classed('service-icon', true)
      .attr({
        'xlink:href': function(d) {
          return d.icon;
        },
        width: 96,
        height: 96,
        transform: function(d) {
          return (d.subordinate ? 'translate(17, 17)' : 'translate(47, 47)');
        },
        'clip-path': function(d) { return 'url(#clip-mask)'; }
      });

    // Manually attach the touchstart event (see method for details)
    node.each(function(data) {
      self.attachTouchstartEvents(data, this);
    });
  }

  /*
   * Show/hide/fade selection.
   */
  /**
    Determines what services and relations need to be faded or highlighted
    then calls the appropriate methods to update the UI.

    @method updateElementVisibility
  */
  updateElementVisibility() {
    // Loop through services and organize them into lists of
    // faded, highlighted
    var actions = {
      fade: [],
      highlight: [],
      hide: [],
      show: []
    };
    var db = this.topo.db;
    var fade, hide, highlight, name;
    db.services.each(function(service) {
      fade = service.get('fade');
      highlight = service.get('highlight');
      hide = service.get('hide');
      name = service.get('id');
      if (fade) { actions.fade.push(name); }
      if (highlight) { actions.highlight.push(name); }
      if (hide) { actions.hide.push(name); }
      if (!fade && !highlight && !hide) { actions.show.push(name); }
    });
    if (actions.fade.length > 0) {
      // If any services are highlighted we need to make sure we unhighlight
      // them before fading. If any services are hidden we need to show them
      // first before we can fade them.
      this.show({serviceNames: actions.fade});
      this.unhighlight({serviceName: actions.fade});
      this.fade({serviceNames: actions.fade});
    }
    if (actions.highlight.length > 0) {

      this.show({serviceNames: actions.highlight});
      this.highlight({serviceName: actions.highlight});
    }
    if (actions.hide.length > 0) {
      this.unhighlight({serviceName: actions.hide});
      this.hide({serviceNames: actions.hide});
    }
    if (actions.show.length > 0) {
      this.unhighlight({serviceName: actions.show});
      this.show({serviceNames: actions.show});
    }
  }

  /**
    Add the highlight attribute from a service and, optionally, related
    services.

    @method highlight
    @param {Object} evt The event facade.
  */
  highlight(evt) {
    var serviceNames = [evt.serviceName];
    if (Array.isArray(evt.serviceName)) {
      serviceNames = evt.serviceName;
    }
    var topo = this.topo;
    // Get related services and add to serviceNames.
    if (evt.highlightRelated) {
      var service = topo.service_boxes[serviceNames[0]].model;
      var relationData = relationUtils.getRelationDataForService(
        topo.db, service);
      relationData.forEach(function(relation) {
        serviceNames.push(relation.far.service);
      });
    }
    serviceNames.forEach(function(service) {
      topo.service_boxes[service].highlighted = true;
    });
    var selection = this.selectionFromServiceNames(serviceNames);
    selection.classed(topoUtils.getVisibilityClasses('highlight'));
  }

  /**
    Remove the highlight attribute from a service and, optionally, related
    services.

    @method unhighlight
    @param {Object} evt The event facade.
  */
  unhighlight(evt) {
    var serviceNames = [evt.serviceName];
    if (Array.isArray(evt.serviceName)) {
      serviceNames = evt.serviceName;
    }

    var topo = this.topo;
    // Get related services and add to serviceNames.
    if (evt.unhighlightRelated) {
      var service = topo.service_boxes[serviceNames[0]].model;
      var relationData = relationUtils.getRelationDataForService(
        topo.db, service);
      relationData.forEach(function(relation) {
        serviceNames.push(relation.far.service);
      });
    }
    serviceNames.forEach(function(service) {
      topo.service_boxes[service].highlighted = false;
    });
    var selection = this.selectionFromServiceNames(serviceNames);
    selection.classed(topoUtils.getVisibilityClasses('unhighlight'));
    var image, href;
    selection.each(function(d) {
      image = d3.select(this).select('.service-block-image');
      href = 'static/gui/build/app/assets/svgs/service_module.svg';
      if (d.pending || d.deleted) {
        href = 'static/gui/build/app/assets/svgs/service_module_pending.svg';
      }
      image.attr('href', href);
    });
  }

  show(evt) {
    var selection = evt.selection;
    if (!selection) {
      var serviceNames = evt.serviceNames;
      if (!serviceNames || serviceNames.length === 0) {
        serviceNames = Object.keys(this.topo.service_boxes);
      }
      selection = this.selectionFromServiceNames(serviceNames);
    }
    selection.classed(topoUtils.getVisibilityClasses('show'));
  }

  hide(evt) {
    var selection = evt.selection;
    if (!selection) {
      var serviceNames = evt.serviceNames;
      if (!serviceNames) {
        return;
      }
      selection = this.selectionFromServiceNames(serviceNames);
    }
    selection.classed(topoUtils.getVisibilityClasses('hide'));
  }

  fade(evt) {
    var selection = evt.selection;
    if (!selection) {
      var serviceNames = evt.serviceNames;
      if (!serviceNames) {
        return;
      }
      selection = this.selectionFromServiceNames(serviceNames);
    }
    selection.classed(topoUtils.getVisibilityClasses('fade'));
  }


  /**
    Given a list of service names, return a D3 selection of those service
    blocks.

    @method selectionFromServiceNames
    @param {Array} serviceNames A list of service names.
  */
  selectionFromServiceNames(serviceNames) {
    var topo = this.topo;
    return topo.vis.selectAll('.service')
      .filter(function(d) {
        return serviceNames.indexOf(d.id) > -1;
      });
  }

  /**
   * The user clicked on the environment view background.
   *
   * If we are in the middle of adding a relation, cancel the relation
   * adding.
   *
   * @method backgroundClicked
   * @return {undefined} Side effects only.
   */
  backgroundClicked() {
    document.dispatchEvent(new Event('topo.clearState'));
  }

  /**
    Shows the inspector and popup service menu.

    @method showServiceDetails
    @param {object} box The presentation state for the service.
    @param {Object} topo The reference to the topology object.
  */
  showServiceDetails(box, topo) {
    // Navigate to the app in the inspector, clearing the state so that the
    // app overview is shown.
    topo.state.changeState({
      gui: {
        inspector: {
          id: box.id,
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }
      }});
  }

  /*
   * View a service
   *
   * @method show_service
   */
  show_service(service) {
    var topo = this.topo;
    var createServiceInspector = topo.createServiceInspector;

    topo.detachContainer();
    createServiceInspector(service);
  }
};

module.exports = ServiceModule;
