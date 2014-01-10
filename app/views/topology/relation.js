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
      d3ns = Y.namespace('d3'),
      Templates = views.Templates;

  /**
   * Manage relation rendering and events.
   *
   * ## Emitted events:
   *
   * - *clearState:* clear all possible states that the environment view can
   *   be in as it pertains to actions (building a relation, viewing a service
   *   menu, etc.)
   * - *hideServiceMenu:* hide the service menu after the 'Add Relation' item
   *   was clicked.
   * - *fade:* fade services that are not valid endpoints for a pending
   *   relation.
   * - *show:* show faded services at 100% opacity again.
   * - *resized:* ensure that menus are positioned properly.
   *
   * @class RelationModule
   */
  var RelationModule = Y.Base.create('RelationModule', d3ns.Module, [], {

    events: {
      scene: {
        '.sub-rel-block': {
          mouseenter: 'subRelBlockMouseEnter',
          mouseleave: 'subRelBlockMouseLeave',
          click: 'subRelBlockClick'
        },
        '.rel-label': {
          click: 'relationClick',
          mousemove: 'mousemove'
        },
        '.dragline': {
          /**
           * The user clicked while the dragline was active.
           *
           * @method events.scene.dragline.click
           */
          click: {callback: 'draglineClicked'}
        },
        '.add-relation': {
          /**
           * The user clicked on the "Build Relation" menu item.
           *
           * @method events.scene.add-relation.click
           */
          click: {callback: 'addRelButtonClicked'}
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

      return this;
    },

    renderedHandler: function() {
      this.update();
    },

    processRelation: function(relation) {
      var self = this;
      var topo = self.get('component');
      var endpoints = relation.get('endpoints');
      var rel_services = [];

      Y.each(endpoints, function(endpoint) {
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
      Y.each(relations, function(relation) {
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
          var decoratedRelation = views.DecoratedRelation(
              relation, source, target);
          // Copy the relation type to the box.
          decorated.push(decoratedRelation);
        }
      });
      return decorated;
    },

    updateLinks: function() {
      // Enter.
      var g = this.drawRelationGroup();
      var link = g.selectAll('line.relation');

      // Update (+ enter selection).
      link.each(this.drawRelation);

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

      if (!service.relations || service.relations.size() === 0) {
        return;
      }

      Y.each(Y.Array.filter(self.relations, function(relation) {
        return relation.source.id === service.id ||
            relation.target.id === service.id;
      }), function(relation) {
        var rel_group = d3.select('#' + utils.generateSafeDOMId(relation.id));
        var connectors = relation.source
                  .getConnectorPair(relation.target);
        var s = connectors[0];
        var t = connectors[1];
        rel_group.select('line')
              .attr('x1', s[0])
              .attr('y1', s[1])
              .attr('x2', t[0])
              .attr('y2', t[1]);
        rel_group.select('.rel-label')
              .attr('transform', function(d) {
              return 'translate(' +
                  [Math.max(s[0], t[0]) -
                       Math.abs((s[0] - t[0]) / 2),
                       Math.max(s[1], t[1]) -
                       Math.abs((s[1] - t[1]) / 2)] + ')';
            });
      });
    },

    drawRelationGroup: function() {
      // Add a labelgroup.
      var self = this;
      var vis = this.get('component').vis;
      var g = vis.selectAll('g.rel-group')
        .data(self.relations,
          function(r) {
            return r.compositeId;
          });

      var enter = g.enter();

      enter.insert('g', 'g.service')
              .attr('id', function(d) {
            return utils.generateSafeDOMId(d.id);
          })
              .attr('class', function(d) {
                // Mark the rel-group as a subordinate relation if need be.
                return (d.isSubordinate ? 'subordinate-rel-group ' : '') +
                    'rel-group';
              })
              .append('svg:line', 'g.service')
              .attr('class', function(d) {
                // Style relation lines differently depending on status.
                return (d.pending ? 'pending-relation ' : '') +
                    (d.isSubordinate ? 'subordinate-relation ' : '') +
                    'relation';
              });

      g.selectAll('.rel-label').remove();
      g.selectAll('text').remove();
      g.selectAll('rect').remove();
      var label = g.append('g')
              .attr('class', 'rel-label')
              .attr('transform', function(d) {
                // XXX: This has to happen on update, not enter
                var connectors = d.source.getConnectorPair(d.target);
                var s = connectors[0];
                var t = connectors[1];
                return 'translate(' +
                    [Math.max(s[0], t[0]) -
                     Math.abs((s[0] - t[0]) / 2),
                     Math.max(s[1], t[1]) -
                     Math.abs((s[1] - t[1]) / 2)] + ')';
              });
      label.append('text')
              .append('tspan')
              .text(function(d) {return d.display_name; });
      label.insert('rect', 'text')
              .attr('width', function(d) {
            return d.display_name.length * 10 + 10;
          })
              .attr('height', 20)
              .attr('x', function() {
                return -parseInt(d3.select(this).attr('width'), 10) / 2;
              })
              .attr('y', -10)
              .attr('rx', 10)
              .attr('ry', 10);

      return g;
    },

    drawRelation: function(relation) {
      var connectors = relation.source
                .getConnectorPair(relation.target);
      var s = connectors[0];
      var t = connectors[1];
      var link = d3.select(this);

      link
                .attr('x1', s[0])
                .attr('y1', s[1])
                .attr('x2', t[0])
                .attr('y2', t[1]);
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

    addRelButtonClicked: function(data, context) {
      var topo = context.get('component');
      var box = topo.get('active_service');
      var origin = topo.get('active_context');
      var container = context.get('container');
      var addRelationNode = container.one('.add-relation');

      // If the link is disabled, which can happen if the charm is not yet
      // loaded and we don't know the endpoints, then don't allow clicking on
      // it.
      if (addRelationNode.hasClass('disabled')) {
        return;
      }

      // Remove the service menu.
      topo.fire('hideServiceMenu');
      // Signify that a relation is being drawn.
      topo.fire('addRelationStart');

      // Create the dragline and position its endpoints properly.
      context.addRelationDragStart({service: box});
      context.mousemove.call(
          container.one('.topology g').getDOMNode(),
          null, context);
      context.addRelationStart(box, context, origin);
    },

    /*
     * Event handler for the add relation button.
     */
    addRelation: function(evt) {
      var curr_action = this.get('currentServiceClickAction');
      if (curr_action === 'show_service') {
        this.set('currentServiceClickAction', 'addRelationStart');
      } else if (curr_action === 'addRelationStart' ||
              curr_action === 'ambiguousAddRelationCheck') {
        this.set('currentServiceClickAction', 'hideServiceMenu');
      } // Otherwise do nothing.
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
        this.dragline.attr('x1', t[0])
        .attr('y1', t[1])
        .attr('x2', s[0])
        .attr('y2', s[1])
        .attr('class', 'relation pending-relation dragline');
        this.draglineOverService = true;
      }
    },

    snapOutOfService: function() {
      // Do not fire if we aren't looking for a relation endpoint.
      if (!this.get('potential_drop_point_rect')) {
        return;
      }

      this.set('potential_drop_point_service', null);
      this.set('potential_drop_point_rect', null);

      if (this.dragline) {
        this.dragline.attr('class',
            'relation pending-relation dragline dragging');
        this.draglineOverService = false;
      }
    },

    addRelationDragStart: function(evt) {
      var d = evt.service;
      // Create a pending drag-line.
      var vis = this.get('component').vis;
      var dragline = vis.append('line')
                        .attr('class',
                              'relation pending-relation dragline dragging');
      var self = this;

      // Start the line between the cursor and the nearest connector
      // point on the service.
      this.set('dragplane', Y.one('svg g').getDOMNode());
      var mouse = d3.mouse(this.get('dragplane'));
      self.cursorBox = new views.BoundingBox();
      self.cursorBox.pos = {x: mouse[0], y: mouse[1], w: 0, h: 0};
      var point = self.cursorBox.getConnectorPair(d);
      dragline.attr('x1', point[0][0])
              .attr('y1', point[0][1])
              .attr('x2', point[1][0])
              .attr('y2', point[1][1]);
      self.dragline = dragline;

      // Start the add-relation process.
      self.addRelationStart(d, self);
    },

    addRelationDrag: function(evt) {
      var d = evt.box;

      // Rubberband our potential relation line if we're not currently
      // hovering over a potential drop-point.
      if (!this.get('potential_drop_point_service') &&
          !this.draglineOverService) {
        // Create a BoundingBox for our cursor.
        this.cursorBox.pos = {x: d3.event.x, y: d3.event.y, w: 0, h: 0};

        // Draw the relation line from the connector point nearest the
        // cursor to the cursor itself.
        var connectors = this.cursorBox.getConnectorPair(d),
                s = connectors[1];
        this.dragline.attr('x1', s[0])
              .attr('y1', s[1])
              .attr('x2', d3.event.x)
              .attr('y2', d3.event.y);
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
        self.addRelation(); // Will clear the state.
      }
      // Signify that the relation drawing has ended.
      topo.fire('addRelationEnd');
    },
    removeRelation: function(relation, view, confirmButton) {
      var topo = this.get('component');
      var env = topo.get('env');
      var db = topo.get('db');
      // At this time, relations may have been redrawn, so here we have to
      // retrieve the relation DOM element again.
      var relationElement = view.get('container')
        .one('#' + utils.generateSafeDOMId(relation.relation_id));
      utils.addSVGClass(relationElement, 'to-remove pending-relation');
      // Because we keep a copy of the relation models on each service we
      // also need to remove the relation from those models.
      var service, serviceRelations;
      relation.endpoints.forEach(function(endpoint) {
        // Some of the tests pass fake data with invalid endpoints
        // this check just makes sure it doesn't blow up.
        // fixTests
        if (!endpoint) {
          console.error('invalid endpoints on relation');
          return;
        }
        service = db.services.getById(endpoint[0]);
        service.removeRelations(relation.relation_id);
      });
      env.remove_relation(relation.endpoints[0], relation.endpoints[1],
          Y.bind(this._removeRelationCallback, this, view,
          relationElement, relation.relation_id, confirmButton));
    },

    _removeRelationCallback: function(view,
            relationElement, relationId, confirmButton, ev) {
      var topo = this.get('component'),
          db = topo.get('db');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error deleting relation',
              message: 'Relation ' + ev.endpoint_a + ' to ' + ev.endpoint_b,
              level: 'error'
            })
        );
        utils.removeSVGClass(this.relationElement,
            'to-remove pending-relation');
      } else {
        // Remove the relation from the DB.
        db.relations.remove(db.relations.getById(relationId));
        // Redraw the graph and reattach events.
        topo.update();
      }
      view.get('rmrelation_dialog').hide();
      view.get('rmrelation_dialog').destroy();
      confirmButton.set('disabled', false);
    },

    removeRelationConfirm: function(d, context, view) {
      // Destroy the dialog if it already exists to prevent cluttering
      // up the DOM.
      if (!Y.Lang.isUndefined(view.get('rmrelation_dialog'))) {
        view.get('rmrelation_dialog').destroy();
      }
      view.set('rmrelation_dialog', views.createModalPanel(
          'Are you sure you want to remove this relation? ' +
              'This cannot be undone.',
          '#rmrelation-modal-panel',
          'Remove Relation',
          Y.bind(function(ev) {
            ev.preventDefault();
            var confirmButton = ev.target;
            confirmButton.set('disabled', true);
            view.removeRelation(d, view, confirmButton);
          },
          this)));
    },

    /**
     * Clear any states such as building a relation or showing
     * subordinate relations.
     *
     * @method clearState
     * @return {undefined} side effects only.
     */
    clearState: function() {
      this.cancelRelationBuild();
      this.hideSubordinateRelations();
    },

    cancelRelationBuild: function() {
      var topo = this.get('component');
      var vis = topo.vis;
      if (this.dragline) {
        // Get rid of our drag line
        this.dragline.remove();
        this.dragline = null;
      }
      this.clickAddRelation = null;
      this.set('currentServiceClickAction', 'hideServiceMenu');
      topo.buildingRelation = false;
      topo.fire('show', { selection: vis.selectAll('.service') });
      vis.selectAll('.service').classed('selectable-service', false);
      // Signify that the relation drawing has ended.
      topo.fire('addRelationEnd');
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

      // make sure all services are shown (not faded or hidden), except for
      // those in pending state, which are ghost services that have not been
      // created yet.
      topo.fire('show', {
        selection: vis.selectAll('.service')
          .filter(function(d) { return !d.pending; })
      });

      var db = topo.get('db');
      var endpointsController = topo.get('endpointsController');
      var endpoints = models.getEndpoints(service, endpointsController);

      // Transform endpoints into a list of relatable services (to the
      // service).
      var possible_relations = Y.Array.map(
          Y.Array.flatten(Y.Object.values(endpoints)),
          function(ep) {return ep.service;});
      var invalidRelationTargets = {};

      // Iterate services and invert the possibles list.
      db.services.each(function(s) {
        if (Y.Array.indexOf(possible_relations,
            s.get('id')) === -1) {
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
                return ((d.id in invalidRelationTargets &&
                          d.id !== service.id) ||
                          (topoUtils.intersect(service.get('networks'),
                          d.model.get('networks')).length === 0));
              });
      topo.fire('fade', { selection: sel });
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
     */
    ambiguousAddRelationCheck: function(m, view, context) {
      var endpoints = view.get(
          'addRelationStart_possibleEndpoints')[m.id];
      var container = view.get('container');
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

      // Stop rubberbanding on mousemove.
      view.clickAddRelation = null;

      // Display menu with available endpoints.
      var menu = container.one('#ambiguous-relation-menu');
      if (menu.one('.menu')) {
        menu.one('.menu').remove(true);
      }

      menu.append(Templates
              .ambiguousRelationList({endpoints: endpoints}));

      // For each endpoint choice, delegate a click event to add the specified
      // relation. Use event delegation in order to avoid weird behaviors
      // encountered when using "on" on a YUI NodeList: in some situations,
      // e.g. our production server, NodeList.on does not work.
      menu.one('.menu').delegate('click', function(evt) {
        var el = evt.target;
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

      // Display the menu at the service endpoint.
      var tr = topo.zoom.translate();
      var z = topo.zoom.scale();
      menu.setStyle('top', m.y * z + tr[1]);
      menu.setStyle('left', m.x * z + m.w * z + tr[0]);
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

      // Get the vis, and links, build the new relation.
      var topo = module.get('component');
      var env = topo.get('env');
      var db = topo.get('db');
      var relation_id = 'pending-' + endpoints[0][0] + endpoints[1][0];

      if (endpoints[0][0] === endpoints[1][0]) {
        module.set('currentServiceClickAction', 'hideServiceMenu');
        return;
      }

      // Create a pending relation in the database between the
      // two services.
      db.relations.create({
        relation_id: relation_id,
        display_name: 'pending',
        endpoints: endpoints,
        pending: true
      });

      // Firing the update event on the db will properly redraw the
      // graph and reattach events.
      topo.update();
      topo.bindAllD3Events();
      // Fire event to add relation in juju.
      // This needs to specify interface in the future.
      env.add_relation(endpoints[0], endpoints[1],
          Y.bind(this._addRelationCallback, this, module, relation_id)
      );
      module.set('currentServiceClickAction', 'hideServiceMenu');
    },

    _addRelationCallback: function(module, relation_id, ev) {
      var topo = module.get('component');
      var db = topo.get('db');
      var vis = topo.vis;
      // Remove our pending relation from the DB, error or no.
      db.relations.remove(
          db.relations.getById(relation_id));
      vis.select('#' + utils.generateSafeDOMId(relation_id)).remove();
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error adding relation',
              message: 'Relation ' + ev.endpoint_a +
                  ' to ' + ev.endpoint_b,
              level: 'error'
            })
        );
      } else {
        // Create a relation in the database between the two services.
        var result = ev.result;
        var endpoints = Y.Array.map(result.endpoints, function(item) {
          var id = Y.Object.keys(item)[0];
          return [id, item[id]];
        });
        db.relations.create({
          relation_id: result.id,
          type: result['interface'],
          endpoints: endpoints,
          pending: false,
          scope: result.scope
        });
      }
      topo.update();
      topo.bindAllD3Events();
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

    subRelBlockMouseEnter: function(d, self) {
      // Add an 'active' class to all of the subordinate relations
      // belonging to this service.
      self.subordinateRelationsForService(d)
    .forEach(function(p) {
            utils.addSVGClass('#' + utils.generateSafeDOMId(p.id), 'active');
          });
    },

    subRelBlockMouseLeave: function(d, self) {
      // Remove 'active' class from all subordinate relations.
      if (!self.keepSubRelationsVisible) {
        utils.removeSVGClass('.subordinate-rel-group', 'active');
      }
    },

    /**
     * Toggle the visibility of subordinate relations for visibility
     * or removal.
     * @param {object} d The data-bound object (the subordinate).
     * @param {object} self The view.
     * @method subRelBlockClick
     */
    subRelBlockClick: function(d, self) {
      if (self.keepSubRelationsVisible) {
        self.hideSubordinateRelations();
      } else {
        self.showSubordinateRelations(this);
      }
    },

    /**
     * Show subordinate relations for a service.
     *
     * @method showSubordinateRelations
     * @param {Object} subordinate The sub-rel-block g element in the form
     * of a DOM node.
     * @return {undefined} nothing.
     */
    showSubordinateRelations: function(subordinate) {
      this.keepSubRelationsVisible = true;
      utils.addSVGClass(Y.one(subordinate).one('.sub-rel-count'), 'active');
    },

    /**
     * Hide subordinate relations.
     *
     * @method hideSubordinateRelations
     * @return {undefined} nothing.
     */
    hideSubordinateRelations: function() {
      var container = this.get('container');
      utils.removeSVGClass('.subordinate-rel-group', 'active');
      this.keepSubRelationsVisible = false;
      utils.removeSVGClass(container.one('.sub-rel-count.active'),
          'active');
    },

    relationClick: function(relation, self) {
      if (self.get('disableRelationInteraction')) { return; }
      if (relation.isSubordinate) {
        var subRelDialog = views.createModalPanel(
            'You may not remove a subordinate relation.',
            '#rmsubrelation-modal-panel');
        subRelDialog.addButton(
            { value: 'Cancel',
              section: Y.WidgetStdMod.FOOTER,
              /**
               * @method action Hides the dialog on click.
               * @param {object} e The click event.
               * @return {undefined} nothing.
               */
              action: function(e) {
                e.preventDefault();
                subRelDialog.hide();
                subRelDialog.destroy();
              },
              classNames: ['button']
            });
        subRelDialog.get('boundingBox').all('.yui3-button')
                .removeClass('yui3-button');
      } else {
        self.removeRelationConfirm(relation, this, self);
      }
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
      disableRelationInteraction: {}
    }

  });
  views.RelationModule = RelationModule;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'node',
    'event',
    'juju-models',
    'juju-env'
  ]
});
