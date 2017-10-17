/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const d3 = require('d3');
const React = require('react');
const ReactDOM = require('react-dom');

const endpointUtils = require('../endpoint-utils');
const relationUtils = require('../relation-utils');
const topoUtils = require('./utils');
const environmentUtils = require('./environment-utils');
const utils = require('../../views/utils');

const AmbiguousRelationMenu = require(
  '../../components/relation-menu/ambiguous-relation-menu');
const RelationMenu = require('../../components/relation-menu/relation-menu');

/**
 * Manage relation rendering and events.
 *
 * ## Emitted events:
 *
 * - *clearState:* clear all possible states that the environment view can
 *   be in as it pertains to actions (building a relation, viewing a service
 *   menu, etc.)
 * - *fade:* fade services that are not valid endpoints for a pending
 *   relation.
 * - *show:* show faded services at 100% opacity again.
 * - *resized:* ensure that menus are positioned properly.
 *
 * @class RelationModule
 */
class RelationModule {
  constructor() {
    this.name = 'RelationModule';
    this.relations = [];
    this.events = {
      scene: {
        '.rel-indicator': {
          click: 'relationClick',
          mousemove: 'mousemove'
        },
        '.relation-remove': {
          click: {callback: 'relationRemoveClick' }
        },
        '.inspect-relation': {
          click: {callback: 'inspectRelationClick' }
        },
        '.dragline': {
          /**
          * The user clicked while the dragline was active.
          *
          * @method events.scene.dragline.click
          */
          click: {callback: 'draglineClicked'}
        },
        '.zoom-plane': {
          mousemove: {callback: 'mousemove'}
        }
      },
      topo: {
        /**
        Ensure the dragline follows the cursor when moved.

        @event addRelationDrag
        */
        addRelationDrag: 'addRelationDrag',
        /**
        Complete adding a relation when dragging to create it.

        @event addRelationDragEnd
        @param {Object} box The starting service's BoxModel.
        */
        addRelationDragEnd: 'addRelationDragEnd',
        /**
        Begin the process of adding a relation when dragging to create it.

        @event addRelationDragStart
        @param {Object} box The ending service's BoxModel.
        */
        addRelationDragStart: 'addRelationDragStart',
        /**
        Cancel building a relation when dragging to create it.

        @event cancelRelationBuild
        @param {Object} box The starting service's BoxModel.
        */
        cancelRelationBuild: 'cancelRelationBuild',
        /**
        Clear view state as pertaining to relations.

        @event clearState
        */
        clearState: 'clearState',
        /**
        Fade relations related to a service.

        @event fade
        @param {Object} An object with a service name to hide
        */
        fade: 'hide',
        /**
        Ensure that mousemove events bubble to canvas when moving over a
        relation line/label.

        @event mouseMove
        */
        mouseMove: 'mouseMoveHandler',
        /**
        Render relations at an appropriate time.

        @event rendered
        */
        rendered: 'renderedHandler',
        /**
        Re-render relations on visualization update.

        @event rerenderRelations
        */
        rerenderRelations: 'rerender',
        /**
        Update the endpoints for relations when services are moved.

        @event updateLinkEndpoints
        @param {Object} service The service which has had its position
        updated.
        */
        serviceMoved: 'updateLinkEndpoints',
        /**
        Update relations after services are rendered.

        @event servicesRendered
        @param {Object} service The model for the service that was moved.
        */
        servicesRendered: 'updateLinks',
        /**
        Show relations.

        @event show
        */
        show: 'show',
        /**
        Ensure the dragline follows the cursor outside of services.

        @event snapOutOfService
        */
        snapOutOfService: 'snapOutOfService',
        /**
        Ensure the dragline snaps to service when the cursor is inside one.

        @event snapToService
        @param {Object} d The service model wrapped in a BoxModel object.
        @param {Object} rect The SVG rect element for the service.
        */
        snapToService: 'snapToService'
      }
    };
  }

  render() {
    return this;
  }

  update() {
    const topo = this.topo;
    const db = topo.db;
    const relations = db.relations.toArray();
    this.relations = this.decorateRelations(relations);
    this.updateLinks();
    this.updateSubordinateRelationsCount();
    this.updateRelationVisibility();

    return this;
  }

  /**
    Re-render the relations in the environment view. In the case of a bundle
    deployment, information such as subordinate status is not included until
    the state server knows about the service itself; once that arrives and
    the service blocks are updated, re-render the relations.

    @method rerender
  */
  rerender() {
    const topo = this.topo;
    topo.vis.selectAll('.rel-group').remove();
    this.update();
  }

  /**
    Get the DOM node if the container has been provided by YUI, otherwise the
    container will be the DOM node already.

    @method getContainer
    @return {Object} A DOM node.
  */
  getContainer() {
    const container = this.topo.container;
    return container.getDOMNode && container.getDOMNode() || container;
  }

  renderedHandler() {
    this.update();
  }

  processRelation(relation) {
    const self = this;
    const topo = self.topo;
    const endpoints = relation.get('endpoints');
    const rel_services = [];

    endpoints.forEach(endpoint => {
      rel_services.push([endpoint[1].name, topo.service_boxes[endpoint[0]]]);
    });
    return rel_services;
  }

  /**
   *
   * @method decorateRelations
   * @param {Array} relations The relations currently in effect.
   * @return {Array} Relation pairs.
   */
  decorateRelations(relations) {
    const self = this;
    const decorated = [];
    relations.forEach(relation => {
      const pair = self.processRelation(relation);

      // skip peer for now
      if (pair.length === 2) {
        const source = pair[0][1];
        const target = pair[1][1];
        // If it hasn't finished resolving the charm data then return
        // and wait for the next db update to update.
        if (!source || !target) {
          return;
        }
        const decoratedRelation = relationUtils.DecoratedRelation(
          relation, source, target);
        // Copy the relation type to the box.
        decorated.push(decoratedRelation);
      }
    });
    return relationUtils.toRelationCollections(decorated);
  }

  updateLinks() {
    // Enter.
    const g = this.drawRelationGroup();

    // Update (+ enter selection).
    g.each(this.drawRelation);
    if (this.relationMenuActive) {
      this.showRelationMenu(this.relationMenuRelation);
    }

    // Exit
    g.exit().remove();
  }

  /**
   * Update relation line endpoints for a given service.
   *
   * @method updateLinkEndpoints
   * @param {Object} evt The event facade that was fired.  This should have
   *                     a 'service' property mixed in when fired.
   */
  updateLinkEndpoints(evt) {
    const self = this;
    const service = evt.service;
    const topo = self.topo;
    const parentId = topo._yuid;
    if (!service.relations || service.relations.size() === 0) {
      return;
    }

    self.relations.filter(relation => {
      return relation.source.id === service.id ||
         relation.target.id === service.id;
    }).forEach(relation => {
      // Select only the pertinent relation groups.
      const rel_group = topo.vis.select(
        '#' + relationUtils.generateSafeDOMId(relation.id, parentId));
      const connectors = relation.source.getConnectorPair(relation.target);
      const s = connectors[0];
      const t = connectors[1];
      rel_group.select('line')
        .attr('x1', s[0])
        .attr('y1', s[1])
        .attr('x2', t[0])
        .attr('y2', t[1]);
    });
  }

  drawRelationGroup() {
    // Add a labelgroup.
    const self = this;
    const topo = this.topo;
    let staticURL = topo.staticURL || '';
    if (staticURL) {
      staticURL += '/';
    };
    const basePath = `${staticURL}static/gui/build/app`;
    const vis = topo.vis;
    const parentId = topo._yuid;
    const imageSize = 20;
    const g = vis.selectAll('g.rel-group')
      .data(self.relations,
        function(r) {
          return r.compositeId;
        });
    // If this is the initial creation of the relation group, add all of the
    // elements involved.
    const enter = g.enter()
      .insert('g', 'g.service')
      .attr('id', function(d) {
        return relationUtils.generateSafeDOMId(d.id, parentId);
      })
      .classed('rel-group', true);
    enter.append('svg:line', 'g.service')
      .attr('class', function(d) {
        // Style relation lines differently depending on status.
        return 'relation ' + d.aggregatedStatus;
      });

    // The knob connecting the relation line with the FROM service block
    enter.append('circle')
      .attr({
        'cx': 0,
        'cy': 0,
        'r': 4,
        'class'(d) {
          // Style relation connector differently depending on status.
          return 'connector1 ' + d.aggregatedStatus;
        }
      });

    // The knob connecting the relation line with the TO service block
    enter.append('circle')
      .attr({
        'cx': 0,
        'cy': 0,
        'r': 4,
        'class'(d) {
          // Style relation connector differently depending on status.
          return 'connector2 ' + d.aggregatedStatus;
        }
      });
    enter.append('g')
      .classed('rel-indicator', true)
      .append('image')
      .attr({
        'width': imageSize,
        'height': imageSize,
        'x': imageSize / -2,
        'y': imageSize / -2,
        'rx': imageSize / 2,
        'ry': imageSize / 2
      });
    enter.append('text')
      .append('tspan')
      .text(function(d) {return d.display_name; });

    g.filter(function(d) {
      let currStatus = d3.select(this).select('image')
        .attr('xlink:href') || '';
      currStatus = currStatus.split('relation-icon-')
        .reverse()[0]
        .split('.')[0];
      return currStatus !== d.aggregatedStatus;
    })
      .selectAll('image')
      .attr('xlink:href', function(d) {
        return (
          basePath + '/assets/svgs/relation-icon-' +
            d.aggregatedStatus + '.svg');
      });
    return g;
  }

  drawRelation(relation) {
    const connectors = relation.source
      .getConnectorPair(relation.target);
    const s = connectors[0];
    const t = connectors[1];
    const link = d3.select(this).select('line');
    const connector1 = d3.select(this).select('.connector1');
    const connector2 = d3.select(this).select('.connector2');
    const relationIcon = d3.select(this).select('.rel-indicator');
    const sRadius = (relation.source.w / 2) - 4;
    const tRadius = (relation.target.w / 2) - 4;

    link
      .attr('x1', s[0])
      .attr('y1', s[1])
      .attr('x2', t[0])
      .attr('y2', t[1])
      .attr('class', function(d) {
        // Style relation lines differently depending on status.
        return 'relation ' + relation.aggregatedStatus;
      });

    // Calculate the angle in radians from both service block
    const deg = Math.atan2(s[1] - t[1], s[0] - t[0]);

    // Convert the radian to a point[x, y] for the FROM knob
    const dot1 = [
      s[0] + -(Math.cos(deg) * sRadius),
      s[1] + -(Math.sin(deg) * sRadius)];

    // Convert the radian to a point[x, y] for the TO knob
    const dot2 = [
      t[0] + Math.cos(deg) * tRadius,
      t[1] + Math.sin(deg) * tRadius];

    // Position the TO knob
    connector1
      .attr('cx', dot1[0])
      .attr('cy', dot1[1]);

    // Position the FROM knob
    connector2
      .attr('cx', dot2[0])
      .attr('cy', dot2[1]);

    relationIcon.attr('transform', function(d) {
      return 'translate(' + [
        Math.max(dot1[0], dot2[0]) - Math.abs(((dot1[0] - dot2[0])) / 2),
        Math.max(dot1[1], dot2[1]) - Math.abs(((dot1[1] - dot2[1])) / 2)
      ] + ')';
    });

    return link;
  }

  updateSubordinateRelationsCount() {
    const topo = this.topo;
    const vis = topo.vis;
    const self = this;

    vis.selectAll('.service.subordinate')
      .selectAll('.sub-rel-block tspan')
      .text(function(d) {
        return self.subordinateRelationsForService(d).length;
      });
  }

  draglineClicked(d, self) {
    // It was technically the dragline that was clicked, but the
    // intent was to click on the background, so...
    document.dispatchEvent(new Event('topo.clearState'));
  }

  /**
   * If the mouse moves and we are adding a relation, then the dragline
   * needs to be updated.
   *
   * @method mousemove
   * @param {object} d Unused.
   * @param {object} self The environment view itself.
   * @return {undefined} Side effects only.
   */
  mousemove(d, self) {
    if (self.clickAddRelation) {
      self.addRelationDrag.call(self, {
        box: self.addRelationStart_service});
    }
  }

  /**
   * Handler for when the mouse is moved over a service.
   *
   * @method mouseMoveHandler
   * @param {object} evt Event facade.
   * @return {undefined} Side effects only.
   */
  mouseMoveHandler(evt) {
    const container = this.getContainer();
    this.mousemove.call(
      container.querySelector('.zoom-plane'),
      null, this);
  }

  snapToService(evt) {
    const d = evt.service;
    const rect = evt.rect;

    // Do not fire if we're on the same service.
    if (d === this.addRelationStart_service) {
      return;
    }
    this.potential_drop_point_service = d;
    this.potential_drop_point_rect = rect;
    topoUtils.addSVGClass(rect, 'hover');

    // If we have an active dragline, stop redrawing it on mousemove
    // and draw the line between the two nearest connector points of
    // the two services.
    if (this.dragline) {
      const connectors = d.getConnectorPair(
        this.addRelationStart_service);
      const s = connectors[0];
      const t = connectors[1];
      this.dragline.select('line').attr('x1', t[0])
        .attr('y1', t[1])
        .attr('x2', s[0])
        .attr('y2', s[1])
        .attr('class', 'relation pending-relation dragline');
      this.draglineOverService = true;
    }
  }

  snapOutOfService() {
    this.clearRelationSettings();

    if (this.dragline) {
      this.dragline.select('line').attr('class',
        'relation pending-relation dragline dragging');
      this.draglineOverService = false;
      this.clickAddRelation = true;
      this.topo.buildingRelation = true;
    }
  }

  addRelationDragStart(evt) {
    // Only start a new drag line if no an active dragline. Sometimes a line
    // a relation begins while dragging which shouldnt start a new line.
    if (!this.dragline) {
      let staticURL = this.topo.staticURL || '';
      if (staticURL) {
        staticURL += '/';
      }
      const basePath = `${staticURL}static/gui/build/app`;
      const d = evt.service;
      // Create a pending drag-line.
      const vis = this.topo.vis;
      const dragline = vis.insert('g', ':first-child')
        .attr('class', 'drag-relation-group');
      dragline.insert('line')
        .attr('class', 'relation pending-relation dragline dragging');
      dragline.append('circle')
        .attr('class', 'dragline__indicator')
        .attr({
          r: 15,
          fill: '#ffffff',
          stroke: '#888888',
          'stroke-width': 1.1
        });
      dragline.append('image')
        .attr('class', 'dragline__indicator-image')
        .attr({
          'xlink:href': `${basePath}/assets/svgs/build-relation_16.svg`,
          width: 16,
          height: 16,
          transform: 'translate(-8, -8)'
        });

      // Start the line between the cursor and the nearest connector
      // point on the service.
      this.dragplane = document.querySelector('.the-canvas g');
      const mouse = d3.mouse(this.dragplane);
      this.cursorBox = new environmentUtils.BoundingBox();
      this.cursorBox.pos = {x: mouse[0], y: mouse[1], w: 0, h: 0};
      const point = this.cursorBox.getConnectorPair(d);
      const imagePos = (point[0][0] - 8) + ', ' + (point[0][1] - 8);

      dragline.select('line')
        .classed('dragline__line', true)
        .attr('x1', point[0][0])
        .attr('y1', point[0][1])
        .attr('x2', point[1][0])
        .attr('y2', point[1][1]);
      dragline.select('circle')
        .attr('cx', point[0][0])
        .attr('cy', point[0][1]);
      dragline.select('image')
        .attr('transform',
          'translate(' + imagePos + ')');
      this.dragline = dragline;
      vis.select('.plus-service').classed('fade', true);
      // Start the add-relation process.
      this.addRelationStart(d, this);
    }
  }

  addRelationDrag(evt) {
    const d = evt.box;

    if (!d || !this.dragline) {
      this.clearRelationSettings();
      return;
    }

    // Rubberband our potential relation line if we're not currently
    // hovering over a potential drop-point.
    if (!this.draglineOverService) {
      const mouse = d3.mouse(this.dragplane);
      const mouseX = mouse[0];
      const mouseY = mouse[1];
      // Create a BoundingBox for our cursor. If one doesn't exist, events
      // bubbled improperly, and we didn't have addRelationDragStart called
      // first; so ensure that is called.
      if (!this.cursorBox) {
        this.addRelationDragStart(evt);
        if (!this.cursorBox) {
          // If the cursorBox still doesn't exist that means a relation is
          // already in progress and we don't need to drag it around e.g. when
          // the ambiguous relation selection box is visible.
          return;
        }
      }
      this.cursorBox.pos = {x: mouseX, y: mouseY, w: 0, h: 0};

      const imagePos = (mouseX - 8) + ', ' + (mouseY - 8);
      // Draw the relation line from the connector point nearest the
      // cursor to the cursor itself.
      const connectors = this.cursorBox.getConnectorPair(d),
          s = connectors[1];
      this.dragline.select('line')
        .attr('x1', s[0])
        .attr('y1', s[1])
        .attr('x2', mouseX)
        .attr('y2', mouseY);
      this.dragline.select('circle')
        .attr('cx', mouseX)
        .attr('cy', mouseY);
      this.dragline.select('image')
        .attr('transform',
          'translate(' + imagePos + ')');
    }
  }

  addRelationDragEnd() {
    // Get the line, the endpoint service, and the target <rect>.
    const self = this;
    const topo = self.topo;
    const rect = self.potential_drop_point_rect;
    const endpoint = self.potential_drop_point_service;

    topo.buildingRelation = false;
    self.cursorBox = null;

    // If we landed on a rect, add relation, otherwise, cancel.
    if (rect) {
      self.ambiguousAddRelationCheck(endpoint, self, rect);
    } else {
      // TODO clean up, abstract
      self.cancelRelationBuild();
    }
  }

  /**
   * Clear any states such as building a relation or showing
   * relation menu.
   *
   * @method clearState
   * @return {undefined} side effects only.
   */
  clearState() {
    this.clearRelationSettings();
    this.cancelRelationBuild();
    this.relationMenuActive = false;
    this.relationMenuRelation = undefined;
  }

  /**
    Stop the process of building a relation between two services.

    @method cancelRelationBuild
  */
  cancelRelationBuild() {
    const topo = this.topo;
    const vis = topo.vis;
    if (this.dragline) {
      // Get rid of our drag line
      this.dragline.remove();
      this.dragline = null;
    }
    this.clickAddRelation = null;
    topo.buildingRelation = false;
    topo.update();
    vis.selectAll('.service').classed('selectable-service', false);
    vis.selectAll('.plus-service').classed('fade', false);
  }

  /**
    Clear sigils and constiables used when creating a relation.

    @method clearRelationSettings
  */
  clearRelationSettings() {
    const topo = this.topo;
    topo.buildingRelation = false;
    this.clickAddRelation = null;
    this.draglineOverService = false;
    this.potential_drop_point_service = undefined;
    this.potential_drop_point_rect = undefined;
  }

  /**
    Sorts then updates the visibility of the relation lines based on their
    related services visibility settings.

    @method updateRelationVisibility
  */
  updateRelationVisibility() {
    const db = this.topo.db;
    const actions = {
      fade: [],
      show: [],
      hide: []
    };
    let name;
    db.services.each(function(service) {
      name = service.get('id');
      if (service.get('fade')) {
        actions.fade.push(name);
      }
      if (service.get('hide')) {
        actions.hide.push(name);
      }
      if (!service.get('fade') && !service.get('hide')) {
        actions.show.push(name);
      }
    });
    if (actions.fade.length > 0) {
      this.fade({serviceNames: actions.fade});
    }
    if (actions.hide.length > 0) {
      this.hide({serviceNames: actions.hide});
    }
    if (actions.show.length > 0) {
      this.show({serviceNames: actions.show});
    }
  }

  /**
    Show faded relations for a given service or services.

    @method show
    @param {Object} evt The event facade.
  */
  show(evt) {
    let serviceNames = evt.serviceNames;
    const topo = this.topo;
    if (!serviceNames || serviceNames.length === 0) {
      serviceNames = Object.keys(topo.service_boxes);
    }
    const selection = topo.vis.selectAll('.rel-group')
      .filter(function(d) {
        return (serviceNames.indexOf(d.source.id) > -1 ||
            serviceNames.indexOf(d.target.id) > -1) &&
            (d.target.hide === false && d.source.hide === false) &&
            (d.target.fade === false && d.source.fade === false);
      });
    selection.classed(topoUtils.getVisibilityClasses('show'));
  }

  /**
    Fade relations for a given service or services.

    @method fade
    @param {Object} evt The event facade
  */
  fade(evt) {
    const serviceNames = evt.serviceNames;
    if (!serviceNames) {
      return;
    }
    const topo = this.topo;
    const selection = topo.vis.selectAll('.rel-group')
      .filter(function(d) {
        return serviceNames.indexOf(d.source.id) > -1 ||
              serviceNames.indexOf(d.target.id) > -1;
      });
    selection.classed(topoUtils.getVisibilityClasses('fade'));
  }

  /**
    Hides the relations for a given service or services. Respecting the
    hidden status of the 'far' service relation

    @method hide
    @param {Object} evt The event object which contains the serviceNames.
  */
  hide(evt) {
    const serviceNames = evt.serviceNames;
    if (!serviceNames) {
      return;
    }
    const topo = this.topo;
    const selection = topo.vis.selectAll('.rel-group')
      .filter(function(d) {
        return serviceNames.indexOf(d.source.id) > -1 ||
            serviceNames.indexOf(d.target.id) > -1;
      });
    selection.classed(topoUtils.getVisibilityClasses('hide'));
  }

  /**
   * An "add relation" action has been initiated by the user.
   *
   * @method startRelation
   * @param {object} service The service that is the source of the
   *  relation.
   * @return {undefined} Side effects only.
   */
  startRelation(service) {
    // Set flags on the view that indicate we are building a relation.
    const topo = this.topo;
    const vis = topo.vis;

    topo.buildingRelation = true;
    this.clickAddRelation = true;

    // make sure all services are shown (not faded or hidden)
    document.dispatchEvent(new CustomEvent('topo.show', {
      detail: [{selection: vis.selectAll('.service')}]
    }));

    const db = topo.db;
    const endpointsController = topo.endpointsController;
    const endpoints = endpointUtils.getEndpoints(service, endpointsController);

    // Transform endpoints into a list of relatable services (to the
    // service).
    const possible_relations = utils.arrayFlatten(
      Object.keys(endpoints).map(k => endpoints[k])).map(
      ep => {return ep.service;});
    const invalidRelationTargets = {};

    // Iterate services and invert the possibles list.
    db.services.each(function(s) {
      if (possible_relations.indexOf(s.get('id')) === -1) {
        invalidRelationTargets[s.get('id')] = true;
      }
    });

    // Fade elements to which we can't relate.
    // Rather than two loops this marks
    // all services as selectable and then
    // removes the invalid ones.
    const sel = vis.selectAll('.service')
      .classed('selectable-service', true)
      .filter(function(d) {
        return (d.id in invalidRelationTargets &&
                        d.id !== service.get('id'));
      });
    document.dispatchEvent(new CustomEvent('topo.fade', {
      detail: [{
        selection: sel,
        serviceNames: Object.keys(invalidRelationTargets)
      }]
    }));
    sel.classed('selectable-service', false);

    // Store possible endpoints.
    this.addRelationStart_possibleEndpoints = endpoints;
    // Set click action.
    this.currentServiceClickAction = 'ambiguousAddRelationCheck';
  }

  /*
   * Fired when clicking the first service in the add relation
   * flow.
   */
  addRelationStart(m, view, context) {
    const topo = view.topo;
    const service = topo.serviceForBox(m);
    view.startRelation(service);
    // Store start service in attrs.
    view.addRelationStart_service = m;
  }

  /*
   * Test if the pending relation is ambiguous.  Display a menu if so,
   * create the relation if not.
   *
   * @param {Object} m The endpoint for the drop point on the service.
   * @param {Object} view The current view context.
   * @param {Object} context The target rectangle.
   */
  ambiguousAddRelationCheck(m, view, context) {
    let endpoints = view.addRelationStart_possibleEndpoints[m.id];
    const topo = view.topo;

    if (endpoints && endpoints.length === 1) {
      // Create a relation with the only available endpoint.
      const ep = endpoints[0];
      const endpoints_item = [
        [ep[0].service,
          { name: ep[0].name,
            role: 'server' }],
        [ep[1].service,
          { name: ep[1].name,
            role: 'client' }]];
      view.addRelationEnd(endpoints_item, view, context);
      return;
    }

    // Sort the endpoints alphabetically by relation name.
    endpoints = endpoints.sort(function(a, b) {
      return a[0].name + a[1].name < b[0].name + b[1].name;
    });

    // If the endpoints contain ghost services then we need to display their
    // display name instead of their id's
    endpoints = this._getServiceDisplayName(endpoints, topo);

    // Stop rubberbanding on mousemove.
    view.clickAddRelation = null;

    // Display menu with available endpoints.
    const menu = this._renderAmbiguousRelationMenu(endpoints);
    this._attachAmbiguousReleationSelect(menu, view, context);
    this._positionAmbiguousRelationMenu(menu, topo, m, context);
  }

  /**
    Loops through the supplied endpoints and updates the displayName
    property then returns a new endpoints array.

    @method _getServiceDisplayName
    @param {Array} endpoints The possible endpoints for the relation.
    @param {Object} topo A reference to the topology instance.
    @return {Array} The new endpoints array with a displayName property on
      each endpoint.
  */
  _getServiceDisplayName(endpoints, topo) {
    let serviceName, displayName;
    return endpoints.map(function(endpoint) {
      endpoint.forEach(function(handle) {
        serviceName = handle.service;
        if (serviceName.indexOf('$') > 0) {
          displayName = topo.db.services
            .getById(serviceName)
            .get('displayName')
            .replace(/^\(/, '').replace(/\)$/, '');
        } else {
          displayName = serviceName;
        }
        handle.displayName = displayName;
      });
      return [endpoint[0], endpoint[1]];
    }, this);
  }

  /**
    Renders the ambiguous relation menu into the container populated with the
    supplied endpoints data.

    @method _renderAmbiguousRelationMenu
    @param {Array} endpoints The possible endpoints for the relation.
    @return {Object} A node instance from the menu which was added to the
      DOM.
  */
  _renderAmbiguousRelationMenu(endpoints) {
    const container = this.getContainer();
    const menu = container.querySelector('#ambiguous-relation-menu');
    ReactDOM.render(
      <AmbiguousRelationMenu
        endpoints={endpoints} />,
      menu.querySelector('#ambiguous-relation-menu-content'));
    return menu;
  }

  /**
    Attaches the click events for the ambiguous relation menu so that the user
    is able to select which relation they want.

    @method _attachAmbiguousRelationSelcet
    @param {Object} menu A reference to the popup menu node.
    @param {Object} view A reference to the relation view.
    @param {Object} context The target rectangle.
  */
  _attachAmbiguousReleationSelect(menu, view, context) {
    menu.querySelectorAll('.menu li').forEach(node => {
      node.addEventListener('click', function(evt) {
        const el = evt.currentTarget;
        const endpoints_item = [
          [el.getAttribute('data-startservice'), {
            name: el.getAttribute('data-startname'),
            role: 'server' }],
          [el.getAttribute('data-endservice'), {
            name: el.getAttribute('data-endname'),
            role: 'client' }]
        ];
        menu.classList.remove('active');
        view.addRelationEnd(endpoints_item, view, context);
      });
    });
    // Add a cancel item.
    menu.querySelector('.cancel').addEventListener('click', function(evt) {
      menu.classList.remove('active');
      view.cancelRelationBuild();
    });
  }

  /**
    Positions the ambiguous relation menu at the endpoint where the
    relationship is beimg terminated.

    @method _positionAmbiguousRelationMenu
    @param {Object} menu A reference to the menu node.
    @param {Object} topo A reference to the topology instance.
    @param {Object} m The endpoint for the drop point on the service.
    @param {Object} context The target rectangle.
  */
  _positionAmbiguousRelationMenu(menu, topo, m, context) {
    const tr = topo.zoom.translate();
    const z = topo.zoom.scale();
    const locateAt = topoUtils.locateRelativePointOnCanvas(m, tr, z);
    menu.style.left = `${locateAt[0]}px`;
    menu.style.top = `${locateAt[1]}px`;
    menu.classList.add('active');
    topo.active_service = m;
    topo.active_context = context;
  }

  /*
   *
   * Fired when the second service is clicked in the
   * add relation flow.
   *
   * @method addRelationEnd
   * @param endpoints {Array} array of two endpoints, each in the form
   *   ['service name', {
   *     name: 'endpoint type',
   *     role: 'client or server'
   *   }].
   * @param module {RelationModule}
   * @return undefined Side-effects only.
   */
  addRelationEnd(endpoints, module) {
    // Redisplay all services
    module.cancelRelationBuild();
    module.clearRelationSettings();
    // Get the vis, and links, build the new relation.
    const topo = module.topo;
    // Ignore peer relations
    if (endpoints[0][0] === endpoints[1][0]) {
      return;
    }
    relationUtils.createRelation(topo.db, topo.env, endpoints);
  }

  /*
   * Utility function to get subordinate relations for a service.
   */
  subordinateRelationsForService(service) {
    return this.relations.filter(function(relation) {
      return (relation.source.modelId === service.modelId ||
          relation.target.modelId === service.modelId) &&
          relation.isSubordinate;
    });
  }

  /**
   * Event handler for when the relation indicator or label is clicked.
   *
   * @method relationClick
   * @param {Object} relation The relation or relation collection associated
   *   with that relation line.
   * @param {Object} self The relation module.
   */
  relationClick(relation, self) {
    self.showRelationMenu(relation);
  }

  /**
   * Show the menu containing all of the relations for a given relation
   * collection.
   *
   * @method showRelationMenu
   * @param {object} relation The relation collection associated with the
   *   relation line.
   */
  showRelationMenu(relation) {
    const menu = document.querySelector('#relation-menu');
    ReactDOM.render(
      <RelationMenu
        relations={relation.relations} />,
      menu);
    menu.classList.add('active');
    this.relationMenuActive = true;
    this.relationMenuRelation = relation;
    const topo = this.topo;
    const tr = topo.zoom.translate();
    const z = topo.zoom.scale();
    const line = relation.source.getConnectorPair(relation.target);
    const coords = topoUtils.findCenterPoint(line[0], line[1]);
    const point = { x: coords[0], y: coords[1], w: 0, h: 0 };
    const locateAt = topoUtils.locateRelativePointOnCanvas(point, tr, z);
    // Shift the menu to the left by half its width, and up by its height
    // plus the height of the arrow (16px).
    locateAt[0] -= menu.clientWidth / 2;
    locateAt[1] -= menu.clientHeight + 16;
    menu.style.left = `${locateAt[0]}px`;
    menu.style.top = `${locateAt[1]}px`;
    // Shift the arrow to the left by half the menu's width minus half the
    // width of the arrow itself (10px).
    menu.querySelector('.triangle').style.left = menu.clientWidth / 2 - 5;
  }

  /**
   * Event handler for when the remove icon in the relation menu is clicked.
   *
   * @method relationRemoveClick
   * @param {undefined} _ Artifact of the d3-component event binding.
   * @param {object} self The relation module.
   */
  relationRemoveClick(_, self) {
    const topo = self.topo;
    const db = topo.db;
    const relationId = this.closest('.relation-container').getAttribute(
      'data-relationid');
    let relation = db.relations.getById(relationId);
    relation = self.decorateRelations([relation])[0];
    document.dispatchEvent(new Event('topo.clearState'));
    if (relation.isSubordinate && !relation.relations[0].pending) {
      db.notifications.add({
        title: 'Subordinate relations can\'t be removed',
        message: 'Subordinate relations can\'t be removed',
        level: 'error'
      });
    } else {
      relationUtils.destroyRelations(
        topo.db, topo.env, [relationId]);
    }
    // The state needs to be cleared after the relation is destroyed as well
    // to hide the destroy relation popup.
    document.dispatchEvent(new Event('topo.clearState'));
  }

  /**
   * Event handler for when a relation in the relation menu is clicked.
   *
   * @method inspectRelationClick
   * @param {undefined} _ Artifact of the d3-component event binding.
   * @param {object} self The relation module.
   */
  inspectRelationClick(_, self) {
    const topo = self.topo;
    const endpoint = this.getAttribute('data-endpoint');
    const serviceId = endpoint.split(':')[0].trim();
    topo.state.changeState({
      gui: {
        inspector: {
          id: serviceId
        }
      }
    });
  }
};

module.exports = RelationModule;
