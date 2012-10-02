'use strict';

YUI.add('juju-view-environment', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      models = Y.namespace('juju.models');

  function styleToNumber(selector, style, defaultSize) {
    style = style || 'height';
    defaultSize = defaultSize || 0;
    return parseInt(Y.one(selector).getComputedStyle(style) || defaultSize,
                    10);
  }

  var EnvironmentView = Y.Base.create('EnvironmentView', Y.View,
                                      [views.JujuBaseView], {
        events: {
          '#zoom-out-btn': {click: 'zoom_out'},
          '#zoom-in-btn': {click: 'zoom_in'}
        },

        initializer: function() {
          console.log('View: Initialized: Env');
          this.publish('showService', {preventable: false});

          // Build a service.id -> BoundingBox map for services.
          this.service_boxes = {};
        },

        render: function() {
          console.log('View: Render: Env');
          var container = this.get('container');
          EnvironmentView.superclass.render.apply(this, arguments);
          container.setHTML(Templates.overview());
          this.svg = container.one('#overview');
          this.buildScene();
          return this;
        },

        /*
         * Construct a persistent scene that is managed in update.
         */
        buildScene: function() {
          var self = this,
              container = this.get('container'),
              height = 600,
              width = 640,
              fill = d3.scale.category20();

          this.service_scale_width = d3.scale.log().range([164, 200]),
          this.service_scale_height = d3.scale.log().range([64, 100]);
          this.xscale = d3.scale.linear()
              .domain([-width / 2, width / 2])
              .range([0, width]),
          this.yscale = d3.scale.linear()
              .domain([-height / 2, height / 2])
              .range([height, 0]);

          // Create a pan/zoom behavior manager.
          var zoom = d3.behavior.zoom()
              .x(this.xscale)
              .y(this.yscale)
              .scaleExtent([0.25, 1.75])
              .on('zoom', function() {
                    self.rescale(vis, d3.event);
              });
          self.zoom = zoom;

          function rescale() {
            vis.attr('transform',
                'translate(' + d3.event.translate + ')' +
                     ' scale(' + d3.event.scale + ')');
          }

          // Set up the visualization with a pack layout.
          var vis = d3.select(container.getDOMNode())
            .selectAll('#canvas')
            .append('svg:svg')
            .attr('pointer-events', 'all')
            .attr('width', '100%')
            .attr('height', '100%')
            .append('svg:g')
            .call(zoom)
            .append('g');
          vis.append('svg:rect')
        .attr('fill', 'rgba(255,255,255,0)')
        .on('click', function() {
                self.removeSVGClass('.service-control-panel.active', 'active');
              });

          // Bind visualization resizing on window resize.
          Y.on('windowresize', function() {
            self.setSizesFromViewport();
          });

          this.vis = vis;
          this.tree = d3.layout.pack()
                .size([width, height])
                .value(function(d) {return d.unit_count;})
                .padding(200);

          this.updateCanvas();
        },

        /*
         * Attach view to target, if target is an ancestor of the view
         * this is a no-oop.
         *
         */
        // attachView: function(target) {
        //   if (Y.Lang.isString(target)) {
        //     target = Y.one(target);
        //   } else if (!Y.Lang.isValue(target)) {
        //     target = this.get('container');
        //   }
        //   if (!this.svg.inDoc() || !this.svg.inRegion(target)) {
        //     target.append(this.svg);
        //   }
        // },

        /*
         * Sync view models with curent db.models.
         */
        updateData: function() {
          //model data
          var vis = this.vis,
              db = this.get('db'),
              relations = db.relations.toArray(),
              services = db.services.map(views.toBoundingBox);

          this.services = services;

          Y.each(services, function(service) {
            // Update services  with existing positions.
            var existing = this.service_boxes[service.id];
            if (existing) {
              service.pos = existing.pos;
            }
            this.service_boxes[service.id] = service;
          }, this);

          this.rel_pairs = this.processRelations(relations);

          // Nodes are mapped by modelId tuples.
          this.node = vis.selectAll('.service')
                       .data(services, function(d) {
                return d.modelId();});
        },

        /*
         * Attempt to reuse as much of the existing graph and view models
         * as possible to re-render the graph.
         */
        updateCanvas: function() {
          var self = this,
              tree = this.tree,
              vis = this.vis;

          //Process any changed data.
          this.updateData();

          var drag = d3.behavior.drag()
            .on('drag', function(d, i) {
                d.x += d3.event.dx;
                d.y += d3.event.dy;
                d3.select(this).attr('transform', function(d, i) {
                  return d.translateStr();
                });
                updateLinks();
              });

          // Generate a node for each service, draw it as a rect with
          // labels for service and charm.
          var node = this.node;

          // Rerun the pack layout.
          // Pack doesn't honor existing positions and will
          // re-layout the entire graph. As a short term work
          // around we layout only new nodes. This has the side
          // effect that node nodes can overlap and will
          // be fixed later.
          var new_services = this.services.filter(function(boundingBox) {
            return !Y.Lang.isNumber(boundingBox.x);
          });
          this.tree.nodes({children: new_services});

          // enter
          node
            .enter().append('g')
            .attr('class', 'service')
            .on('click', function(d) {
                // Ignore if we clicked on a control panel image.
                if (self.hasSVGClass(d3.event.target, 'cp-button')) {
                  return;
                }
                // Get the current click action
                var curr_click_action = self.get(
                    'currentServiceClickAction');
                // Fire the action named in the following scheme:
                //   service_click_action.<action>
                // with the service, the SVG node, and the view
                // as arguments.
                (self.service_click_actions[curr_click_action])(
                    d, this, self);
              })
            .on('dblclick', function(d) {
                // Just show the service on double-click.
                var service = self.serviceForBox(d);
                (self.service_click_actions.show_service)(service, this, self);
              })
            .call(drag)
            .transition()
            .duration(500)
            .attr('transform', function(d) {
                return d.translateStr();});

          // Update
          this.drawService(node);

          // Exit
          node.exit()
            .call(function(d) {
                // TODO: update the service_boxes
                // removing the bound data
              })
            .transition()
            .duration(500)
            .attr('x', 0)
            .remove();

          function updateLinks() {
            // Enter.
            var g = self.drawRelationGroup(),
                link = g.selectAll('line.relation');

            // Update (+ enter selection).
            link.each(self.drawRelation);

            // Exit
            g.exit().remove();
          }

          // Draw or schedule redraw of links.
          updateLinks();

        },

        /*
         * Draw a new relation link with label and controls.
         */
        drawRelationGroup: function() {
          // Add a labelgroup.
          var self = this,
              g = self.vis.selectAll('g.rel-group')
                  .data(self.rel_pairs, function(r) {
                    return r.modelIds();
                  });

          var enter = g.enter();

          enter.insert('g', 'g.service')
              .attr('class', 'rel-group')
              .append('svg:line', 'g.service')
              .attr('class', 'relation');

          // TODO:: figure out a clean way to update position
          g.selectAll('rel-label').remove();
          g.selectAll('text').remove();
          g.selectAll('rect').remove();
          var label = g.append('g')
              .attr('class', 'rel-label')
              .attr('transform', function(d) {
                // XXX: This has to happen on update, not enter
                var connectors = d.source().getConnectorPair(d.target()),
                    s = connectors[0],
                    t = connectors[1];
                return 'translate(' +
                    [Math.max(s[0], t[0]) -
                     Math.abs((s[0] - t[0]) / 2),
                     Math.max(s[1], t[1]) -
                     Math.abs((s[1] - t[1]) / 2)] + ')';
              })
              .on('click', function(d) {
                // On click, offer to remove the relation
                self.removeRelationConfirm(d, this, self);
              });
          label.append('text')
              .append('tspan')
              .text(function(d) {return d.type; });
          label.insert('rect', 'text')
              .attr('width', function(d) {
                return (Y.one(this.parentNode)
                  .one('text').getClientRect() || {width: 0}).width + 10;
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

        /*
         * Draw a relation between services.
         */
        drawRelation: function(relation) {
          var connectors = relation.source()
                .getConnectorPair(relation.target()),
              s = connectors[0],
              t = connectors[1],
              link = d3.select(this);

          link
                .attr('x1', s[0])
                .attr('y1', s[1])
                .attr('x2', t[0])
                .attr('y2', t[1]);
          return link;
        },

        // Called to draw a service in the 'update' phase
        drawService: function(node) {
          var self = this,
              service_scale_width = this.service_scale_width,
              service_scale_height = this.service_scale_height;

          node.append('rect')
            .attr('class', 'service-border')
            .attr('width', function(d) {
                var w = service_scale_width(d.unit_count);
                d.w = w;
                return w;
              })
            .attr('height', function(d) {
                var h = service_scale_height(d.unit_count);
                d.h = h;
                return h;})
            .on('mouseover', function(d) {
                // Save this as the current potential drop-point for drag
                // targets if it's selectable.
                if ((d3.event.relatedTarget &&
                    d3.event.relatedTarget.nodeName === 'rect') &&
                    self.hasSVGClass(this, 'selectable-service')) {
                  self.set('potential_drop_point_service', d);
                  self.set('potential_drop_point_rect', this);
                  self.addSVGClass(this, 'hover');
                }
              })
            .on('mouseout', function(d) {
                // Remove this node as the current potential drop-point
                // for drag targets.
                if (d3.event.relatedTarget.nodeName === 'rect' &&
                    self.hasSVGClass(this, 'hover')) {
                  self.set('potential_drop_point_service', null);
                  self.set('potential_drop_point_rect', null);
                  self.removeSVGClass(this, 'hover');
                }
              });


          var service_labels = node.append('text').append('tspan')
            .attr('class', 'name')
            .attr('x', 54)
            .attr('y', '1em')
            .text(function(d) {return d.id; });

          var charm_labels = node.append('text').append('tspan')
            .attr('x', 54)
            .attr('y', '2.5em')
            .attr('dy', '3em')
            .attr('class', 'charm-label')
            .text(function(d) { return d.charm; });

          // Show whether or not the service is exposed using an
          // indicator (currently a simple circle).
          // TODO this will likely change to an image with UI uodates.
          var exposed_indicator = node.filter(function(d) {
            return d.exposed;
          })
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 10)
            .attr('r', 5)
            .attr('class', 'exposed-indicator on');
          exposed_indicator.append('title')
            .text(function(d) {
                return d.exposed ? 'Exposed' : '';
              });

          // Add the relative health of a service in the form of a pie chart
          // comprised of units styled appropriately
          // TODO aggregate statuses into good/bad/pending
          var status_chart_arc = d3.svg.arc()
            .innerRadius(10)
            .outerRadius(25);
          var status_chart_layout = d3.layout.pie()
            .value(function(d) { return (d.value ? d.value : 1); });


          var status_chart = node.append('g')
            .attr('class', 'service-status')
            .attr('transform', 'translate(30,32)');
          var status_arcs = status_chart.selectAll('path')
            .data(function(d) {
                var aggregate_map = d.aggregated_status,
                    aggregate_list = [];

                Y.Object.each(aggregate_map, function(value, key) {
                  aggregate_list.push({name: key, value: value});
                });

                return status_chart_layout(aggregate_list);
              })
            .enter().append('path')
            .attr('d', status_chart_arc)
            .attr('class', function(d) { return 'status-' + d.data.name; })
            .attr('fill-rule', 'evenodd')
            .append('title').text(function(d) {
                return d.data.name;
              });

          // Add the unit counts, visible only on hover.
          var unit_count = status_chart.append('text')
            .attr('class', 'unit-count hide-count')
            .on('mouseover', function() {
                d3.select(this).attr('class', 'unit-count show-count');
              })
            .on('mouseout', function() {
                d3.select(this).attr('class', 'unit-count hide-count');
              })
            .text(function(d) {
                return self.humanizeNumber(d.unit_count);
              });

          this.addControlPanel(node);

        },

        addControlPanel: function(node) {
          // Add a control panel around the service.
          var self = this;
          var control_panel = node.append('g')
                .attr('class', 'service-control-panel');

          // A button to add a relation between two services.
          var add_rel = control_panel.append('g')
                .attr('class', 'add-relation')
                .on('click.cp', function(d) {
                // Get the service element
                var context = this.parentNode.parentNode,
                    service = self.serviceForBox(d);
                self.service_click_actions
                    .toggleControlPanel(d, context, self);
                self.service_click_actions
                    .addRelationStart(d, context, self);
              });

          // Drag controls on the add relation button, allowing
          // one to drag a line to create a relation.
          var drag_relation = add_rel.append('line')
              .attr('class', 'relation pending-relation unused');
          var drag_relation_behavior = d3.behavior.drag()
              .on('dragstart', function(d) {
                // Get our line, the image, and the current service.
                var dragline = d3.select(this.parentNode)
                    .select('.relation');
                var img = d3.select(this.parentNode)
                    .select('image');
                var context = this.parentNode.parentNode.parentNode,
                    service = self.serviceForBox(d);

                // Start the line at our image
                dragline.attr('x1', parseInt(img.attr('x'), 10) + 16)
                    .attr('y1', parseInt(img.attr('y'), 10) + 16);
                self.removeSVGClass(dragline.node(), 'unused');

                // Start the add-relation process.
                self.service_click_actions
                .addRelationStart(service, context, self);
              })
              .on('drag', function() {
                // Rubberband our potential relation line.
                var dragline = d3.select(this.parentNode)
                    .select('.relation');
                dragline.attr('x2', d3.event.x)
                    .attr('y2', d3.event.y);
              })
              .on('dragend', function(d) {
                // Get the line, the endpoint service, and the target <rect>.
                var dragline = d3.select(this.parentNode)
                    .select('.relation');
                var context = self.get('potential_drop_point_rect');
                var endpoint = self.get('potential_drop_point_service');

                // Get rid of our drag line
                dragline.attr('x2', dragline.attr('x1'))
                    .attr('y2', dragline.attr('y1'));
                self.addSVGClass(dragline.node(), 'unused');

                // If we landed on a rect, add relation, otherwise, cancel.
                if (context) {
                  self.service_click_actions
                  .addRelationEnd(endpoint, context, self);
                } else {
                  // TODO clean up, abstract
                  self.addRelation(); // Will clear the state.
                }
              });
          add_rel.append('image')
        .attr('xlink:href',
              '/assets/images/icons/icon_noshadow_relation.png')
        .attr('class', 'cp-button')
        .attr('x', function(d) {
                return d.w + 8;
              })
        .attr('y', function(d) {
                return (d.h / 2) - 16;
              })
        .attr('width', 32)
        .attr('height', 32)
        .call(drag_relation_behavior);

          // Add a button to view the service.
          var view_service = control_panel.append('g')
        .attr('class', 'view-service')
        .on('click.cp', function(d) {
                // Get the service element
                var context = this.parentNode.parentNode,
                    service = self.serviceForBox(d);
                self.service_click_actions
            .toggleControlPanel(d, context, self);
                self.service_click_actions
            .show_service(service, context, self);
              });
          view_service.append('image')
        .attr('xlink:href', '/assets/images/icons/icon_noshadow_view.png')
        .attr('class', 'cp-button')
        .attr('x', -40)
        .attr('y', function(d) {
                return (d.h / 2) - 16;
              })
        .attr('width', 32)
        .attr('height', 32);

          // Add a button to destroy a service
          var destroy_service = control_panel.append('g')
        .attr('class', 'destroy-service')
        .on('click.cp', function(d) {
                // Get the service element
                var context = this.parentNode.parentNode,
                    service = self.serviceForBox(d);
                self.service_click_actions
            .toggleControlPanel(d, context, self);
                self.service_click_actions
            .destroyServiceConfirm(service, context, self);
              });
          destroy_service.append('image')
        .attr('xlink:href', '/assets/images/icons/icon_noshadow_destroy.png')
        .attr('class', 'cp-button')
        .attr('x', function(d) {
                return (d.w / 2) - 16;
              })
        .attr('y', -40)
        .attr('width', 32)
        .attr('height', 32);
          var add_rm_units = control_panel.append('g')
        .attr('class', 'add-rm-units');

        },

        processRelation: function(r) {
          var self = this,
              endpoints = r.get('endpoints'),
              rel_services = [];

          Y.each(endpoints, function(ep) {
            rel_services.push([ep[1].name, self.service_boxes[ep[0]]]);
          });
          return rel_services;
        },

        processRelations: function(rels) {
          var self = this,
              pairs = [];
          Y.each(rels, function(rel) {
            var pair = self.processRelation(rel);

            // skip peer for now
            if (pair.length === 2) {
              var bpair = views.BoxPair()
                                 .model(rel)
                                 .source(pair[0][1])
                                 .target(pair[1][1]);
              // Copy the relation type to the box.
              if (bpair.type === undefined) {
                bpair.type = pair[0][0];
              }
              pairs.push(bpair);
            }
          });
          return pairs;
        },

        /*
         * Utility method to get a service object from the DB
         * given a BoundingBox.
         */
        serviceForBox: function(boundingBox) {
          var db = this.get('db');
          return db.services.getById(boundingBox.id);
        },
        /*
         * Finish DOM-dependent rendering
         *
         * Some portions of the visualization require information pulled
         * from the DOM, such as the clientRects used for sizing relation
         * labels and the viewport size used for sizing the whole graph. This
         * is called after the view is attached to the DOM in order to
         * perform all of that work.  In the app, it's called as a callback
         * in app.showView(), and in testing, it needs to be called manually,
         * if the test relies on any of this data.
         */
        postRender: function() {
          var container = this.get('container');

          // Set the sizes from the viewport.
          this.setSizesFromViewport();

          // Ensure relation labels are sized properly.
          container.all('.rel-label').each(function(label) {
            var width = label.one('text').getClientRect().width + 10;
            label.one('rect').setAttribute('width', width)
              .setAttribute('x', -width / 2);
          });

          // Chainable method.
          return this;
        },

        /*
         * Event handler for the add relation button.
         */
        addRelation: function(evt) {
          var curr_action = this.get('currentServiceClickAction'),
              container = this.get('container');
          if (curr_action === 'show_service') {
            this.set('currentServiceClickAction', 'addRelationStart');
            // Add .selectable-service to all .service-border.
            this.addSVGClass('.service-border', 'selectable-service');
          } else if (curr_action === 'addRelationStart' ||
              curr_action === 'addRelationEnd') {
            this.set('currentServiceClickAction', 'toggleControlPanel');

            // Remove selectable border from all nodes.
            this.removeSVGClass('.service-border', 'selectable-service');
          } // Otherwise do nothing.
        },

        removeRelation: function(d, context, view) {
          var env = this.get('env');
          view.addSVGClass(Y.one(context.parentNode).one('.relation'),
              'to-remove pending-relation');
          env.remove_relation(
              d.source().id,
              d.target().id,
              Y.bind(function(ev) {
                view.get('rmrelation_dialog').hide();
              }, this));
        },

        removeRelationConfirm: function(d, context, view) {
          view.set('rmrelation_dialog', views.createModalPanel(
              'Are you sure you want to remove this relation? ' +
              'This cannot be undone.',
              '#rmrelation-modal-panel',
              'Remove Relation',
              Y.bind(function(ev) {
                ev.preventDefault();
                ev.target.set('disabled', true);
                view.removeRelation(d, context, view);
              },
              this)));
        },

        /*
         * Zoom in event handler.
         */
        zoom_out: function(evt) {
          this._fire_zoom(-0.2);
        },

        /*
         * Zoom out event handler.
         */
        zoom_in: function(evt) {
          this._fire_zoom(0.2);
        },

        /*
         * Wraper around the actual rescale method for zoom buttons.
         */
        _fire_zoom: function(delta) {
          var vis = this.vis,
              zoom = this.zoom,
              evt = {};

          // Build a temporary event that rescale can use of a similar
          // construction to d3.event.
          evt.translate = zoom.translate();
          evt.scale = zoom.scale() + delta;

          // Update the scale in our zoom behavior manager to maintain state.
          this.zoom.scale(evt.scale);

          this.rescale(vis, evt);
        },

        /*
         * Rescale the visualization on a zoom/pan event.
         */
        rescale: function(vis, evt) {
          this.set('scale', evt.scale);
          vis.attr('transform', 'translate(' + evt.translate + ')' +
              ' scale(' + evt.scale + ')');
        },

        /*
         * Set the visualization size based on the viewport
         */
        setSizesFromViewport: function() {
          // start with some reasonable defaults
          var vis = this.vis,
              container = this.get('container'),
              xscale = this.xscale,
              yscale = this.yscale,
              viewport_height = '100%',
              viewport_width = parseInt(
              container.getComputedStyle('width'), 10),
              svg = container.one('svg'),
              width = 800,
              height = 600;

          if (container.get('winHeight') &&
              Y.one('#overview-tasks') &&
              Y.one('.navbar')) {
            // Attempt to get the viewport height minus the navbar at top and
            // control bar at the bottom. Use Y.one() to ensure that the
            // container is attached first (provides some sensible defaults)

            viewport_height = container.get('winHeight') -
                styleToNumber('#overview-tasks', 'height', 22) -
                styleToNumber('.navbar', 'height', 87);

            // Make sure we don't get sized any smaller than 800x600
            viewport_height = Math.max(viewport_height, height);
            if (container.getComputedStyle('width') < width) {
              viewport_width = width;
            }
          }
          // Set the svg sizes.
          svg.setAttribute('width', viewport_width)
            .setAttribute('height', viewport_height);

          // Get the resulting computed sizes (in the case of 100%).
          width = parseInt(svg.getComputedStyle('width'), 10);
          height = parseInt(svg.getComputedStyle('height'), 10);

          // Set the internal rect's size.
          svg.one('rect')
            .setAttribute('width', width)
            .setAttribute('height', height);

          // Reset the scale parameters
          this.xscale.domain([-width / 2, width / 2])
            .range([0, width]);
          this.yscale.domain([-height / 2, height / 2])
            .range([height, 0]);
        },

        /*
         * Actions to be called on clicking a service.
         */
        service_click_actions: {
          /*
           * Default action: show or hide control panel.
           */
          toggleControlPanel: function(m, context, view) {
            var cp = Y.one(context).one('.service-control-panel');

            // If we're toggling another element, remove all .actives
            if (!view.hasSVGClass(cp, 'active')) {
              view.removeSVGClass('.service-control-panel.active', 'active');
            }

            // Toggle the current node's class.
            view.toggleSVGClass(cp, 'active');
          },

          /*
           * View a service
           */
          show_service: function(m, context, view) {
            view.fire('showService', {service: m});
          },

          /*
           * Show a dialog before destroying a service
           */
          destroyServiceConfirm: function(m, context, view) {
            // Set service in view.
            view.set('destroy_service', m);

            // Show dialog.
            view.set('destroy_dialog', views.createModalPanel(
                'Are you sure you want to destroy the service? ' +
                'This cannot be undone.',
                '#destroy-modal-panel',
                'Destroy Service',
                Y.bind(function(ev) {
                  ev.preventDefault();
                  ev.target.set('disabled', true);
                  view.service_click_actions
                      .destroyService(m, context, view);
                },
                this)));
          },

          /*
           * Destroy a service.
           */
          destroyService: function(m, context, view) {
            var env = view.get('env'),
                service = view.get('destroy_service');
            env.destroy_service(
                service.get('id'), Y.bind(function(ev) {
                  view.get('destroy_dialog').hide();
                }, this));
          },

          /*
           * Fired when clicking the first service in the add relation
           * flow.
           */
          addRelationStart: function(m, context, view) {
            // Add .selectable-service to all .service-border.
            view.addSVGClass('.service-border', 'selectable-service');
            // Remove selectable border from current node.
            var node = Y.one(context).one('.service-border');
            view.removeSVGClass(node, 'selectable-service');
            // Store start service in attrs.
            view.set('addRelationStart_service', m);
            // Set click action.
            view.set('currentServiceClickAction',
                'addRelationEnd');
          },

          /*
           * Fired when clicking the second service is clicked in the
           * add relation flow.
           */
          addRelationEnd: function(m, context, view) {
            // Remove selectable border from all nodes.
            view.removeSVGClass('.selectable-service', 'selectable-service');

            // Get the vis, and links, build the new relation.
            var vis = view.vis,
                env = view.get('env'),
                container = view.get('container'),
                rel = views.BoxPair();

            rel.source(view.get('addRelationStart_service'));
            rel.target(m);

            // Add temp relation between services.
            var link = vis.selectAll('line.pending-relation')
                .data([rel]);
            link.enter().insert('svg:line', 'g.service')
                .attr('class', 'relation pending-relation');
            // Unwrap the <line> obj and use it as this
            // for drawRelation. Mimics the traditional call interface
            view.drawRelation.call(link[0][0], rel);

            // Fire event to add relation in juju.
            // This needs to specify interface in the future.
            env.add_relation(
                rel.source().id,
                rel.target().id,
                Y.bind(this._doAddRelationCallback, view)
            );
            // For now, set back to show_service.
            view.set('currentServiceClickAction', 'toggleControlPanel');
          },

          _doAddRelationCallback: function(ev) {
            var db = this.get('db');

            if (ev.err) {
              db.notifications.add(
                new models.Notification({
                  title: 'Error adding relation',
                  message: 'Relation ' + ev.endpoint_a + ' to ' + ev.endpoint_b,
                  level: 'error',
                  link: '/'
                })
              );
            }
          }
        }

      }, {
        ATTRS: {
          currentServiceClickAction: { value: 'toggleControlPanel' }
        }
      });

  views.environment = EnvironmentView;
}, '0.1.0', {
  requires: ['juju-templates',
    'juju-view-utils',
    'juju-models',
    'd3',
    'base-build',
    'handlebars-base',
    'node',
    'svg-layouts',
    'event-resize',
    'view']
});
