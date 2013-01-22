'use strict';

YUI.add('juju-topology-relation', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils'),
      d3ns = Y.namespace('d3'),
      Templates = views.Templates;

  /**
   * @module topology-relations
   * @class RelationModule
   * @namespace views
   **/
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
          /** The user clicked while the dragline was active. */
          click: {callback: 'draglineClicked'}
        },
        '.add-relation': {
          /** The user clicked on the "Build Relation" menu item. */
          click: {callback: 'addRelButtonClicked'}
        },
        '.topology .crosshatch-background rect:first-child': {
          mousemove: {callback: 'mousemove'}
        }
      },
      yui: {
        rendered: {callback: 'renderedHandler'},
        mouseMove: {callback: 'mouseMoveHandler'},
        clearState: {callback: 'clearState'},
        serviceMoved: {callback: 'updateLinkEndpoints'},
        servicesRendered: {callback: 'updateLinks'},
        snapToService: {callback: 'snapToService'},
        snapOutOfService: {callback: 'snapOutOfService'},
        cancelRelationBuild: {callback: 'cancelRelationBuild'},
        addRelationDragStart: {callback: 'addRelationDragStart'},
        addRelationDrag: {callback: 'addRelationDrag'},
        addRelationDragEnd: {callback: 'addRelationDragEnd'}
      }
    },

    initializer: function(options) {
      RelationModule.superclass.constructor.apply(this, arguments);
      this.relPairs = [];
    },

    render: function() {
      RelationModule.superclass.render.apply(this, arguments);
      return this;
    },

    update: function() {
      RelationModule.superclass.update.apply(this, arguments);

      var topo = this.get('component');
      var db = topo.get('db');
      var self = this;
      var relations = db.relations.toArray();
      this.relPairs = this.processRelations(relations);
      topo.relPairs = this.relPairs;
      this.updateLinks();
      this.updateSubordinateRelationsCount();

      // Ensure that link endpoints are up-to-date.
      Y.each(topo.service_boxes, function(svc, key) {
        self.updateLinkEndpoints({ service: svc });
      });

      return this;
    },

    renderedHandler: function() {
      this.update();
    },

    processRelation: function(r) {
      var self = this;
      var topo = self.get('component');
      var endpoints = r.get('endpoints');
      var rel_services = [];

      Y.each(endpoints, function(ep) {
        rel_services.push([ep[1].name, topo.service_boxes[ep[0]]]);
      });
      return rel_services;
    },

    processRelations: function(rels) {
      var self = this;
      var pairs = [];
      Y.each(rels, function(rel) {
        var pair = self.processRelation(rel);

        // skip peer for now
        if (pair.length === 2) {
          var bpair = views.BoxPair()
                                 .model(rel)
                                 .source(pair[0][1])
                                 .target(pair[1][1]);
          // Copy the relation type to the box.
          if (bpair.display_name === undefined) {
            bpair.display_name = pair[0][0];
          }
          pairs.push(bpair);
        }
      });
      return pairs;
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
     * @param {Object} service The service module that has been moved.
     */
    updateLinkEndpoints: function(evt) {
      var self = this;
      var service = evt.service;
      Y.each(Y.Array.filter(self.relPairs, function(relation) {
        return relation.source().id === service.id ||
            relation.target().id === service.id;
      }), function(relation) {
        var rel_group = d3.select('#' + relation.id);
        var connectors = relation.source()
                  .getConnectorPair(relation.target());
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
                 .data(self.relPairs, function(r) {
            return r.modelIds();
          });

      var enter = g.enter();

      enter.insert('g', 'g.service')
              .attr('id', function(d) {
            return d.id;
          })
              .attr('class', function(d) {
                // Mark the rel-group as a subordinate relation if need be.
                return (d.scope === 'container' ?
                    'subordinate-rel-group ' : '') +
                    'rel-group';
              })
              .append('svg:line', 'g.service')
              .attr('class', function(d) {
                // Style relation lines differently depending on status.
                return (d.pending ? 'pending-relation ' : '') +
                    (d.scope === 'container' ? 'subordinate-relation ' : '') +
                    'relation';
              });

      g.selectAll('.rel-label').remove();
      g.selectAll('text').remove();
      g.selectAll('rect').remove();
      var label = g.append('g')
              .attr('class', 'rel-label')
              .attr('transform', function(d) {
                // XXX: This has to happen on update, not enter
                var connectors = d.source().getConnectorPair(d.target());
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
      var connectors = relation.source()
                .getConnectorPair(relation.target());
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

      vis.selectAll('.service')
        .filter(function(d) {
            return d.subordinate;
          })
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
      var service = topo.serviceForBox(box);
      var origin = topo.get('active_context');
      var container = context.get('container');

      // Remove the service menu.
      topo.fire('hideServiceMenu');

      // Create the dragline and position its endpoints properly.
      context.addRelationDragStart({service: box});
      context.mousemove.call(
          container.one('.topology rect:first-child').getDOMNode(),
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
        var mouse = d3.mouse(this);
        var service = self.get('addRelationStart_service');
        d3.event.x = mouse[0];
        d3.event.y = mouse[1];
        self.addRelationDrag.call(self, {box: service});
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
          container.one('.topology rect:first-child').getDOMNode(),
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
      var mouse = d3.mouse(Y.one('.topology svg').getDOMNode());
      self.cursorBox = new views.BoundingBox();
      self.cursorBox.pos = {x: mouse[0], y: mouse[1], w: 0, h: 0};
      var point = self.cursorBox.getConnectorPair(d);
      dragline.attr('x3', point[0][0])
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
    },
    removeRelation: function(d, context, view, confirmButton) {
      var env = this.get('component').get('env');
      var endpoints = d.endpoints;
      var relationElement = Y.one(context.parentNode).one('.relation');
      utils.addSVGClass(relationElement, 'to-remove pending-relation');
      env.remove_relation(
          endpoints[0][0] + ':' + endpoints[0][1].name,
          endpoints[1][0] + ':' + endpoints[1][1].name,
          Y.bind(this._removeRelationCallback, this, view,
          relationElement, d.relation_id, confirmButton));
    },

    _removeRelationCallback: function(view,
            relationElement, relationId, confirmButton, ev) {
      var db = this.get('component').get('db');
      var service = this.get('model');
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
        db.fire('update');
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
            view.removeRelation(d, context, view, confirmButton);
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

      topo.fire('show', { selection: vis.selectAll('.service') });

      var db = this.get('component').get('db');
      var getServiceEndpoints = this.get('component')
                                    .get('getServiceEndpoints');
      var endpoints = models.getEndpoints(
          service, getServiceEndpoints(), db);
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
                return (d.id in invalidRelationTargets &&
                          d.id !== service.id);
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
        var ep = endpoints[0],
                endpoints_item = [
                  [ep[0].service, {
                    name: ep[0].name,
                    role: 'server' }],
                  [ep[1].service, {
                    name: ep[1].name,
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
      // relation.
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
     * Fired when clicking the second service is clicked in the
     * add relation flow.
     *
     * :param endpoints: array of two endpoints, each in the form
     *   ['service name', {
     *     name: 'endpoint type',
     *     role: 'client or server'
     *   }]
     */
    addRelationEnd: function(endpoints, view, context) {
      // Redisplay all services
      view.cancelRelationBuild();

      // Get the vis, and links, build the new relation.
      var vis = view.get('component').vis;
      var env = view.get('component').get('env');
      var db = view.get('component').get('db');
      var source = view.get('addRelationStart_service');
      var relation_id = 'pending-' + endpoints[0][0] + endpoints[1][0];

      if (endpoints[0][0] === endpoints[1][0]) {
        view.set('currentServiceClickAction', 'hideServiceMenu');
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
      //db.fire('update');
      view.get('component').bindAllD3Events();
      view.update();

      // Fire event to add relation in juju.
      // This needs to specify interface in the future.
      env.add_relation(
          endpoints[0][0] + ':' + endpoints[0][1].name,
          endpoints[1][0] + ':' + endpoints[1][1].name,
          Y.bind(this._addRelationCallback, this, view, relation_id)
      );
      view.set('currentServiceClickAction', 'hideServiceMenu');
    },

    _addRelationCallback: function(view, relation_id, ev) {
      console.log('addRelationCallback reached');
      var topo = view.get('component');
      var db = topo.get('db');
      var vis = topo.vis;
      // Remove our pending relation from the DB, error or no.
      db.relations.remove(
          db.relations.getById(relation_id));
      vis.select('#' + relation_id).remove();
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
          relation_id: ev.result.id,
          type: result['interface'],
          endpoints: endpoints,
          pending: false,
          scope: result.scope,
          // endpoints[1][1].name should be the same
          display_name: endpoints[0][1].name
        });
      }
      // Redraw the graph and reattach events.
      //db.fire('update');
      view.get('component').bindAllD3Events();
      view.update();
    },

    /*
         * Utility function to get subordinate relations for a service.
         */
    subordinateRelationsForService: function(service) {
      return this.relPairs.filter(function(p) {
        return p.modelIds().indexOf(service.modelId()) !== -1 &&
            p.scope === 'container';
      });
    },

    subRelBlockMouseEnter: function(d, self) {
      // Add an 'active' class to all of the subordinate relations
      // belonging to this service.
      self.subordinateRelationsForService(d)
    .forEach(function(p) {
            utils.addSVGClass('#' + p.id, 'active');
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
     **/
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

    relationClick: function(d, self) {
      if (d.scope === 'container') {
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
              classNames: ['btn']
            });
        subRelDialog.get('boundingBox').all('.yui3-button')
                .removeClass('yui3-button');
      } else {
        self.removeRelationConfirm(d, this, self);
      }
    }

  }, {
    ATTRS: {}

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
