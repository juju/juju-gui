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
 * Provide the RelationModule class.
 *
 * @module topology
 * @submodule topology.relation
 */

YUI.add('juju-topology-relation', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils'),
      topoUtils = Y.namespace('juju.topology.utils'),
      d3 = Y.namespace('d3'),
      components = Y.namespace('d3-components'),
      relationUtils = window.juju.utils.RelationUtils;

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
  var RelationModule = Y.Base.create('RelationModule', components.Module, [], {

    events: {
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
      yui: {
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
    },

    initializer: function(options) {
      RelationModule.superclass.constructor.apply(this, arguments);
      this.relations = [];
    },

    render: function() {
      RelationModule.superclass.render.apply(this, arguments);
      return this;
    },

    update: function() {
      RelationModule.superclass.update.apply(this, arguments);

      var topo = this.get('component');
      var db = topo.get('db');
      var relations = db.relations.toArray();
      this.relations = this.decorateRelations(relations);
      this.updateLinks();
      this.updateSubordinateRelationsCount();
      this.updateRelationVisibility();

      return this;
    },

    /**
      Re-render the relations in the environment view. In the case of a bundle
      deployment, information such as subordinate status is not included until
      the state server knows about the service itself; once that arrives and
      the service blocks are updated, re-render the relations.

      @method rerender
    */
    rerender: function() {
      var topo = this.get('component');
      topo.vis.selectAll('.rel-group').remove();
      this.update();
    },

    renderedHandler: function() {
      this.update();
    },

    processRelation: function(relation) {
      var self = this;
      var topo = self.get('component');
      var endpoints = relation.get('endpoints');
      var rel_services = [];

      endpoints.forEach(endpoint => {
        rel_services.push([endpoint[1].name, topo.service_boxes[endpoint[0]]]);
      });
      return rel_services;
    },

    /**
     *
     * @method decorateRelations
     * @param {Array} relations The relations currently in effect.
     * @return {Array} Relation pairs.
     */
    decorateRelations: function(relations) {
      var self = this;
      var decorated = [];
      relations.forEach(relation => {
        var pair = self.processRelation(relation);

        // skip peer for now
        if (pair.length === 2) {
          var source = pair[0][1];
          var target = pair[1][1];
          // If it hasn't finished resolving the charm data then return
          // and wait for the next db update to update.
          if (!source || !target) {
            return;
          }
          var decoratedRelation = relationUtils.DecoratedRelation(
              relation, source, target);
          // Copy the relation type to the box.
          decorated.push(decoratedRelation);
        }
      });
      return relationUtils.toRelationCollections(decorated);
    },

    updateLinks: function() {
      // Enter.
      var g = this.drawRelationGroup();

      // Update (+ enter selection).
      g.each(this.drawRelation);
      if (this.get('relationMenuActive')) {
        this.showRelationMenu(this.get('relationMenuRelation'));
      }

      // Exit
      g.exit().remove();
    },

    /**
     * Update relation line endpoints for a given service.
     *
     * @method updateLinkEndpoints
     * @param {Object} evt The event facade that was fired.  This should have
     *                     a 'service' property mixed in when fired.
     */
    updateLinkEndpoints: function(evt) {
      var self = this;
      var service = evt.service;
      var topo = self.get('component');
      var parentId = topo._yuid;

      if (!service.relations || service.relations.size() === 0) {
        return;
      }

      self.relations.filter(relation => {
        return relation.source.id === service.id ||
           relation.target.id === service.id;
      }).forEach(relation => {
        // Select only the pertinent relation groups.
        var rel_group = topo.vis.select(
            '#' + relationUtils.generateSafeDOMId(relation.id, parentId));
        var connectors = relation.source.getConnectorPair(relation.target);
        var s = connectors[0];
        var t = connectors[1];
        rel_group.select('line')
                 .attr('x1', s[0])
                 .attr('y1', s[1])
                 .attr('x2', t[0])
                 .attr('y2', t[1]);
      });
    },

    drawRelationGroup: function() {
      // Add a labelgroup.
      var self = this;
      var topo = this.get('component');
      var staticURL = topo.get('staticURL') || '';
      if (staticURL) {
        staticURL += '/';
      };
      var basePath = `${staticURL}static/gui/build/app`;
      var vis = topo.vis;
      var parentId = topo._yuid;
      var imageSize = 20;
      var g = vis.selectAll('g.rel-group')
        .data(self.relations,
          function(r) {
            return r.compositeId;
          });

      // If this is the initial creation of the relation group, add all of the
      // elements involved.
      var enter = g.enter()
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
              'class': function(d) {
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
              'class': function(d) {
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
        var currStatus = d3.select(this).select('image')
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
    },

    drawRelation: function(relation) {
      var connectors = relation.source
                .getConnectorPair(relation.target);
      var s = connectors[0];
      var t = connectors[1];
      var link = d3.select(this).select('line');
      var connector1 = d3.select(this).select('.connector1');
      var connector2 = d3.select(this).select('.connector2');
      var relationIcon = d3.select(this).select('.rel-indicator');
      var sRadius = (relation.source.w / 2) - 4;
      var tRadius = (relation.target.w / 2) - 4;

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
      var deg = Math.atan2(s[1] - t[1], s[0] - t[0]);

      // Convert the radian to a point[x, y] for the FROM knob
      var dot1 = [
        s[0] + -(Math.cos(deg) * sRadius),
        s[1] + -(Math.sin(deg) * sRadius)];

      // Convert the radian to a point[x, y] for the TO knob
      var dot2 = [
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
    },

    updateSubordinateRelationsCount: function() {
      var topo = this.get('component');
      var vis = topo.vis;
      var self = this;

      vis.selectAll('.service.subordinate')
        .selectAll('.sub-rel-block tspan')
        .text(function(d) {
          return self.subordinateRelationsForService(d).length;
        });
    },

    draglineClicked: function(d, self) {
      // It was technically the dragline that was clicked, but the
      // intent was to click on the background, so...
      var topo = self.get('component');
      topo.fire('clearState');
    },

    /**
     * If the mouse moves and we are adding a relation, then the dragline
     * needs to be updated.
     *
     * @method mousemove
     * @param {object} d Unused.
     * @param {object} self The environment view itself.
     * @return {undefined} Side effects only.
     */
    mousemove: function(d, self) {
      if (self.clickAddRelation) {
        var mouse = d3.mouse(self.get('dragplane'));
        var box = self.get('addRelationStart_service');
        d3.event.x = mouse[0];
        d3.event.y = mouse[1];
        self.addRelationDrag.call(self, {box: box});
      }
    },

    /**
     * Handler for when the mouse is moved over a service.
     *
     * @method mouseMoveHandler
     * @param {object} evt Event facade.
     * @return {undefined} Side effects only.
     */
    mouseMoveHandler: function(evt) {
      var container = this.get('container');
      this.mousemove.call(
          container.one('.zoom-plane').getDOMNode(),
          null, this);
    },

    snapToService: function(evt) {
      var d = evt.service;
      var rect = evt.rect;

      // Do not fire if we're on the same service.
      if (d === this.get('addRelationStart_service')) {
        return;
      }
      this.set('potential_drop_point_service', d);
      this.set('potential_drop_point_rect', rect);
      utils.addSVGClass(rect, 'hover');

      // If we have an active dragline, stop redrawing it on mousemove
      // and draw the line between the two nearest connector points of
      // the two services.
      if (this.dragline) {
        var connectors = d.getConnectorPair(
            this.get('addRelationStart_service'));
        var s = connectors[0];
        var t = connectors[1];
        this.dragline.select('line').attr('x1', t[0])
        .attr('y1', t[1])
        .attr('x2', s[0])
        .attr('y2', s[1])
        .attr('class', 'relation pending-relation dragline');
        this.draglineOverService = true;
      }
    },

    snapOutOfService: function() {
      this.clearRelationSettings();

      if (this.dragline) {
        this.dragline.select('line').attr('class',
            'relation pending-relation dragline dragging');
        this.draglineOverService = false;
        this.clickAddRelation = true;
        this.get('component').buildingRelation = true;
      }
    },

    addRelationDragStart: function(evt) {
      // Only start a new drag line if no an active dragline. Sometimes a line
      // a relation begins while dragging which shouldnt start a new line.
      if (!this.dragline) {
        var staticURL = this.get('component').get('staticURL') || '';
        if (staticURL) {
          staticURL += '/';
        }
        var basePath = `${staticURL}static/gui/build/app`;
        var d = evt.service;
        // Create a pending drag-line.
        var vis = this.get('component').vis;
        var dragline = vis.insert('g', ':first-child')
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
        var self = this;

        // Start the line between the cursor and the nearest connector
        // point on the service.
        this.set('dragplane', Y.one('.the-canvas g').getDOMNode());
        var mouse = d3.mouse(this.get('dragplane'));
        self.cursorBox = new views.BoundingBox();
        self.cursorBox.pos = {x: mouse[0], y: mouse[1], w: 0, h: 0};
        var point = self.cursorBox.getConnectorPair(d);
        var imagePos = (point[0][0] - 8) + ', ' + (point[0][1] - 8);

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
        self.dragline = dragline;
        vis.select('.plus-service').classed('fade', true);
        // Start the add-relation process.
        self.addRelationStart(d, self);
      }
    },

    addRelationDrag: function(evt) {
      var d = evt.box;

      if (!d || !this.dragline) {
        this.clearRelationSettings();
        return;
      }

      // Rubberband our potential relation line if we're not currently
      // hovering over a potential drop-point.
      if (!this.draglineOverService) {
        // Create a BoundingBox for our cursor. If one doesn't exist, events
        // bubbled improperly, and we didn't have addRelationDragStart called
        // first; so ensure that is called.
        if (!this.cursorBox) {
          this.addRelationDragStart(evt);
        }
        this.cursorBox.pos = {x: d3.event.x, y: d3.event.y, w: 0, h: 0};

        var imagePos = (d3.event.x - 8) + ', ' + (d3.event.y - 8);
        // Draw the relation line from the connector point nearest the
        // cursor to the cursor itself.
        var connectors = this.cursorBox.getConnectorPair(d),
            s = connectors[1];
        this.dragline.select('line')
              .attr('x1', s[0])
              .attr('y1', s[1])
              .attr('x2', d3.event.x)
              .attr('y2', d3.event.y);
        this.dragline.select('circle')
              .attr('cx', d3.event.x)
              .attr('cy', d3.event.y);
        this.dragline.select('image')
              .attr('transform',
                'translate(' + imagePos + ')');
      }
    },
    addRelationDragEnd: function() {
      // Get the line, the endpoint service, and the target <rect>.
      var self = this;
      var topo = self.get('component');
      var rect = self.get('potential_drop_point_rect');
      var endpoint = self.get('potential_drop_point_service');

      topo.buildingRelation = false;
      self.cursorBox = null;

      // If we landed on a rect, add relation, otherwise, cancel.
      if (rect) {
        self.ambiguousAddRelationCheck(endpoint, self, rect);
      } else {
        // TODO clean up, abstract
        self.cancelRelationBuild();
      }
      // Signify that the relation drawing has ended.
      topo.fire('addRelationEnd');
    },

    /**
     * Clear any states such as building a relation or showing
     * relation menu.
     *
     * @method clearState
     * @return {undefined} side effects only.
     */
    clearState: function() {
      this.clearRelationSettings();
      this.cancelRelationBuild();
      this.set('relationMenuActive', false);
      this.set('relationMenuRelation', undefined);
    },

    /**
      Stop the process of building a relation between two services.

      @method cancelRelationBuild
    */
    cancelRelationBuild: function() {
      var topo = this.get('component');
      var vis = topo.vis;
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
      // Signify that the relation drawing has ended.
      topo.fire('addRelationEnd');

    },

    /**
      Clear sigils and variables used when creating a relation.

      @method clearRelationSettings
    */
    clearRelationSettings: function() {
      var topo = this.get('component');
      topo.buildingRelation = false;
      this.clickAddRelation = null;
      this.draglineOverService = false;
      this.set('potential_drop_point_service', undefined);
      this.set('potential_drop_point_rect', undefined);
    },

    /**
      Sorts then updates the visibility of the relation lines based on their
      related services visibility settings.

      @method updateRelationVisibility
    */
    updateRelationVisibility: function() {
      var db = this.get('component').get('db');
      var actions = {
        fade: [],
        show: [],
        hide: []
      };
      var name;
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
    },

    /**
      Show faded relations for a given service or services.

      @method show
      @param {Object} evt The event facade.
    */
    show: function(evt) {
      var serviceNames = evt.serviceNames;
      var topo = this.get('component');
      if (!serviceNames || serviceNames.length === 0) {
        serviceNames = Object.keys(topo.service_boxes);
      }
      var selection = topo.vis.selectAll('.rel-group')
        .filter(function(d) {
          return (serviceNames.indexOf(d.source.id) > -1 ||
              serviceNames.indexOf(d.target.id) > -1) &&
              (d.target.hide === false && d.source.hide === false) &&
              (d.target.fade === false && d.source.fade === false);
        });
      selection.classed(topoUtils.getVisibilityClasses('show'));
    },

    /**
      Fade relations for a given service or services.

      @method fade
      @param {Object} evt The event facade
    */
    fade: function(evt) {
      var serviceNames = evt.serviceNames;
      if (!serviceNames) {
        return;
      }
      var topo = this.get('component');
      var selection = topo.vis.selectAll('.rel-group')
        .filter(function(d) {
          return serviceNames.indexOf(d.source.id) > -1 ||
                serviceNames.indexOf(d.target.id) > -1;
        });
      selection.classed(topoUtils.getVisibilityClasses('fade'));
    },

    /**
      Hides the relations for a given service or services. Respecting the
      hidden status of the 'far' service relation

      @method hide
      @param {Object} evt The event object which contains the serviceNames.
    */
    hide: function(evt) {
      var serviceNames = evt.serviceNames;
      if (!serviceNames) {
        return;
      }
      var topo = this.get('component');
      var selection = topo.vis.selectAll('.rel-group')
        .filter(function(d) {
          return serviceNames.indexOf(d.source.id) > -1 ||
              serviceNames.indexOf(d.target.id) > -1;
        });
      selection.classed(topoUtils.getVisibilityClasses('hide'));
    },

    /**
     * An "add relation" action has been initiated by the user.
     *
     * @method startRelation
     * @param {object} service The service that is the source of the
     *  relation.
     * @return {undefined} Side effects only.
     */
    startRelation: function(service) {
      // Set flags on the view that indicate we are building a relation.
      var topo = this.get('component');
      var vis = topo.vis;

      topo.buildingRelation = true;
      this.clickAddRelation = true;

      // make sure all services are shown (not faded or hidden)
      topo.fire('show', { selection: vis.selectAll('.service') });

      var db = topo.get('db');
      var endpointsController = topo.get('endpointsController');
      var endpoints = models.getEndpoints(service, endpointsController);

      // Transform endpoints into a list of relatable services (to the
      // service).
      var possible_relations = Y.Array.flatten(
        Object.keys(endpoints).map(k => endpoints[k])).map(
        ep => {return ep.service;});
      var invalidRelationTargets = {};

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
      var sel = vis.selectAll('.service')
              .classed('selectable-service', true)
              .filter(function(d) {
                return (d.id in invalidRelationTargets &&
                          d.id !== service.get('id'));
              });
      topo.fire('fade', { selection: sel,
        serviceNames: Object.keys(invalidRelationTargets) });
      sel.classed('selectable-service', false);

      // Store possible endpoints.
      this.set('addRelationStart_possibleEndpoints', endpoints);
      // Set click action.
      this.set('currentServiceClickAction', 'ambiguousAddRelationCheck');
    },

    /*
     * Fired when clicking the first service in the add relation
     * flow.
     */
    addRelationStart: function(m, view, context) {
      var topo = view.get('component');
      var service = topo.serviceForBox(m);
      view.startRelation(service);
      // Store start service in attrs.
      view.set('addRelationStart_service', m);
    },

    /*
     * Test if the pending relation is ambiguous.  Display a menu if so,
     * create the relation if not.
     *
     * @param {Object} m The endpoint for the drop point on the service.
     * @param {Object} view The current view context.
     * @param {Object} context The target rectangle.
     */
    ambiguousAddRelationCheck: function(m, view, context) {
      var endpoints = view.get(
          'addRelationStart_possibleEndpoints')[m.id];
      var topo = view.get('component');

      if (endpoints && endpoints.length === 1) {
        // Create a relation with the only available endpoint.
        var ep = endpoints[0];
        var endpoints_item = [
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
      var menu = this._renderAmbiguousRelationMenu(endpoints);
      this._attachAmbiguousReleationSelect(menu, view, context);
      this._positionAmbiguousRelationMenu(menu, topo, m, context);
    },

    /**
      Loops through the supplied endpoints and updates the displayName
      property then returns a new endpoints array.

      @method _getServiceDisplayName
      @param {Array} endpoints The possible endpoints for the relation.
      @param {Object} topo A reference to the topology instance.
      @return {Array} The new endpoints array with a displayName property on
        each endpoint.
    */
    _getServiceDisplayName: function(endpoints, topo) {
      var serviceName, displayName;
      return endpoints.map(function(endpoint) {
        endpoint.forEach(function(handle) {
          serviceName = handle.service;
          if (serviceName.indexOf('$') > 0) {
            displayName = topo.get('db').services
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
    },

    /**
      Renders the ambiguous relation menu into the container populated with the
      supplied endpoints data.

      @method _renderAmbiguousRelationMenu
      @param {Array} endpoints The possible endpoints for the relation.
      @return {Object} A Y.Node instance from the menu which was added to the
        DOM.
    */
    _renderAmbiguousRelationMenu: function(endpoints) {
      var menu = this.get('container').one('#ambiguous-relation-menu');
      ReactDOM.render(
        <juju.components.AmbiguousRelationMenu
          endpoints={endpoints} />,
        menu.one('#ambiguous-relation-menu-content').getDOMNode());
      return menu;
    },

    /**
      Attaches the click events for the ambiguous relation menu so that the user
      is able to select which relation they want.

      @method _attachAmbiguousRelationSelcet
      @param {Object} menu A reference to the popup menu node.
      @param {Object} view A reference to the relation view.
      @param {Object} context The target rectangle.
    */
    _attachAmbiguousReleationSelect: function(menu, view, context) {
      // For each endpoint choice, delegate a click event to add the specified
      // relation. Use event delegation in order to avoid weird behaviors
      // encountered when using "on" on a YUI NodeList: in some situations,
      // e.g. our production server, NodeList.on does not work.
      menu.one('.menu').delegate('click', function(evt) {
        var el = evt.currentTarget;
        var endpoints_item = [
          [el.getData('startservice'), {
            name: el.getData('startname'),
            role: 'server' }],
          [el.getData('endservice'), {
            name: el.getData('endname'),
            role: 'client' }]
        ];
        menu.removeClass('active');
        view.addRelationEnd(endpoints_item, view, context);
      }, 'li');
      // Add a cancel item.
      menu.one('.cancel').on('click', function(evt) {
        menu.removeClass('active');
        view.cancelRelationBuild();
      });
    },

    /**
      Positions the ambiguous relation menu at the endpoint where the
      relationship is beimg terminated.

      @method _positionAmbiguousRelationMenu
      @param {Object} menu A reference to the menu node.
      @param {Object} topo A reference to the topology instance.
      @param {Object} m The endpoint for the drop point on the service.
      @param {Object} context The target rectangle.
    */
    _positionAmbiguousRelationMenu: function(menu, topo, m, context) {
      var tr = topo.zoom.translate();
      var z = topo.zoom.scale();
      var locateAt = topoUtils.locateRelativePointOnCanvas(m, tr, z);
      menu.setStyle('left', locateAt[0]);
      menu.setStyle('top', locateAt[1]);
      menu.addClass('active');
      topo.set('active_service', m);
      topo.set('active_context', context);
      // Firing resized will ensure the menu's positioned properly.
      topo.fire('resized');
    },

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
    addRelationEnd: function(endpoints, module) {
      // Redisplay all services
      module.cancelRelationBuild();
      module.clearRelationSettings();
      // Get the vis, and links, build the new relation.
      var topo = module.get('component');
      // Ignore peer relations
      if (endpoints[0][0] === endpoints[1][0]) {
        return;
      }
      relationUtils.createRelation(topo.get('db'), topo.get('env'), endpoints);
    },

    /*
     * Utility function to get subordinate relations for a service.
     */
    subordinateRelationsForService: function(service) {
      return this.relations.filter(function(relation) {
        return (relation.source.modelId === service.modelId ||
            relation.target.modelId === service.modelId) &&
            relation.isSubordinate;
      });
    },

    /**
     * Event handler for when the relation indicator or label is clicked.
     *
     * @method relationClick
     * @param {Object} relation The relation or relation collection associated
     *   with that relation line.
     * @param {Object} self The relation module.
     */
    relationClick: function(relation, self) {
      if (self.get('disableRelationInteraction')) { return; }
      self.showRelationMenu(relation);
    },

    /**
     * Show the menu containing all of the relations for a given relation
     * collection.
     *
     * @method showRelationMenu
     * @param {object} relation The relation collection associated with the
     *   relation line.
     */
    showRelationMenu: function(relation) {
      var menu = Y.one('#relation-menu');
      ReactDOM.render(
        <juju.components.RelationMenu
          relations={relation.relations} />,
        menu.getDOMNode());
      menu.addClass('active');
      this.set('relationMenuActive', true);
      this.set('relationMenuRelation', relation);
      var topo = this.get('component');
      var tr = topo.zoom.translate();
      var z = topo.zoom.scale();
      var line = relation.source.getConnectorPair(relation.target);
      var coords = topoUtils.findCenterPoint(line[0], line[1]);
      var point = { x: coords[0], y: coords[1], w: 0, h: 0 };
      var locateAt = topoUtils.locateRelativePointOnCanvas(point, tr, z);
      // Shift the menu to the left by half its width, and up by its height
      // plus the height of the arrow (16px).
      locateAt[0] -= menu.get('clientWidth') / 2;
      locateAt[1] -= menu.get('clientHeight') + 16;
      menu.setStyle('left', locateAt[0]);
      menu.setStyle('top', locateAt[1]);
      // Shift the arrow to the left by half the menu's width minus half the
      // width of the arrow itself (10px).
      menu.one('.triangle').setStyle('left', menu.get('clientWidth') / 2 - 5);

      // Firing resized will ensure the menu's positioned properly.
      topo.fire('resized');
    },

    /**
     * Event handler for when the remove icon in the relation menu is clicked.
     *
     * @method relationRemoveClick
     * @param {undefined} _ Artifact of the d3-component event binding.
     * @param {object} self The relation module.
     */
    relationRemoveClick: function(_, self) {
      var topo = self.get('component');
      var db = topo.get('db');
      var relationId = Y.one(this).get('parentNode').getData('relationid');
      var relation = db.relations.getById(relationId);
      relation = self.decorateRelations([relation])[0];
      topo.fire('clearState');
      if (relation.isSubordinate && !relation.relations[0].pending) {
        db.notifications.add({
          title: 'Subordinate relations can\'t be removed',
          message: 'Subordinate relations can\'t be removed',
          level: 'error'
        });
      } else {
        relationUtils.destroyRelations(
          topo.get('db'), topo.get('env'), [relationId]);
      }
      // The state needs to be cleared after the relation is destroyed as well
      // to hide the destroy relation popup.
      topo.fire('clearState');
    },

    /**
     * Event handler for when a relation in the relation menu is clicked.
     *
     * @method inspectRelationClick
     * @param {undefined} _ Artifact of the d3-component event binding.
     * @param {object} self The relation module.
     */
    inspectRelationClick: function(_, self) {
      var topo = self.get('component');
      var endpoint = Y.one(this).getAttribute('data-endpoint');
      var serviceId = endpoint.split(':')[0].trim();
      topo.get('state').changeState({
        gui: {
          inspector: {
            id: serviceId
          }
        }
      });
    }

  }, {
    ATTRS: {
      /**
        @attribute {d3ns.Component} component
      */
      component: {},
      /**
        @attribute {DOMNode} dragplane

        Stores an element used for retrieving the cursor's position on drag.
      */
      dragplane: {},
      /**
        Disabled user interactions on the relation lines and labels.

        @attribute disableRelationInteraction
        @default undefined
        @type {Boolean}
      */
      disableRelationInteraction: {},
      /**
        Whether or not the relation menu is visible.

        @attribute relationMenuActive
        @default false
        @type {Boolean}
      */
      relationMenuActive: {
        value: false
      },
      /**
        The relation for which the menu is currently showing.

        @attribute relationMenuRElation
        @default undefined
        @type {Object}
      */
      relationMenuRelation: {}
    }

  });
  views.RelationModule = RelationModule;
}, '0.1.0', {
  requires: [
    'ambiguous-relation-menu',
    'd3',
    'd3-components',
    'node',
    'event',
    'juju-models',
    'juju-topology-utils',
    'relation-menu',
    'relation-utils'
  ]
});
