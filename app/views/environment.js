'use strict';

YUI.add('juju-view-environment', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      models = Y.namespace('juju.models');

  /*
   * Utility function to get a number from a computed style.
   */
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
          '#zoom-in-btn': {click: 'zoom_in'},
          '.graph-list-picker .picker-button': {
            click: 'showGraphListPicker'
          },
          '.graph-list-picker .picker-expanded': {
            click: 'hideGraphListPicker'
          },
          // Menu/Controls
          '.add-relation': {
            click: function() {
              var box = this.get('active_service'),
                  service = this.serviceForBox(box),
                  context = this.get('active_context');
              this.service_click_actions
                        .toggleControlPanel(box, this, context);
              this.service_click_actions
                        .addRelationStart(box, this, context);
            }
          },
          '.view-service': {
            click: function() {
              // Get the service element
              var box = this.get('active_service'),
                  service = this.serviceForBox(box);
              this.service_click_actions
                        .toggleControlPanel(box, this);
              this.service_click_actions
                        .show_service(service, this);
            }
          },
          '.destroy-service': {
            click: function() {
              // Get the service element
              var box = this.get('active_service'),
                  service = this.serviceForBox(box);
              this.service_click_actions
                        .toggleControlPanel(box, this);
              this.service_click_actions
                        .destroyServiceConfirm(service, this);
            }
          }
        },

        sceneEvents: {
          // Service Related
          '.service': {
            click: 'serviceClick',
            dblclick: 'serviceDblClick',
            mouseenter: function(d, self) {
              var rect = Y.one(this);
              // Do not fire if this service isn't selectable.
              if (!self.hasSVGClass(rect, 'selectable-service')) {
                return;
              }

              // Do not fire unless we're within the service box.
              var container = self.get('container'),
                  mouse_coords = d3.mouse(container.one('svg').getDOMNode());
              if (!d.containsPoint(mouse_coords, self.zoom)) {
                return;
              }
              self.set('potential_drop_point_service', d);
              self.set('potential_drop_point_rect', rect);
              self.addSVGClass(rect, 'hover');

              // If we have an active dragline, stop redrawing it on mousemove
              // and draw the line between the two nearest connector points of
              // the two services.
              if (self.dragline) {
                var connectors = d.getConnectorPair(
                    self.get('addRelationStart_service')),
                    s = connectors[0],
                    t = connectors[1];
                self.dragline.attr('x1', t[0])
                  .attr('y1', t[1])
                  .attr('x2', s[0])
                  .attr('y2', s[1])
                  .attr('class', 'relation pending-relation dragline');
              }
            },
            mouseleave: function(d, self) {
              // Do not fire if we aren't looking for a relation endpoint.
              if (!self.get('potential_drop_point_rect')) {
                return;
              }

              // Do not fire if we're within the service box.
              var container = self.get('container'),
                  mouse_coords = d3.mouse(container.one('svg').getDOMNode());
              if (d.containsPoint(mouse_coords, self.zoom)) {
                return;
              }
              var rect = Y.one(this).one('.service-border');
              self.set('potential_drop_point_service', null);
              self.set('potential_drop_point_rect', null);
              self.removeSVGClass(rect, 'hover');

              if (self.dragline) {
                self.dragline.attr('class',
                    'relation pending-relation dragline dragging');
              }
            }
          },
          '.sub-rel-block': {
            mouseenter: function(d, self) {
              // Add an 'active' class to all of the subordinate relations
              // belonging to this service.
              self.subordinateRelationsForService(d)
                .forEach(function(p) {
                    self.addSVGClass('#' + p.id, 'active');
                  });
            },
            mouseleave: function(d, self) {
              // Remove 'active' class from all subordinate relations.
              self.removeSVGClass('.subordinate-rel-group', 'active');
            }
          },
          '.service-status': {
            mouseover: function(d, self) {
              d3.select(this)
                .select('.unit-count')
                .attr('class', 'unit-count show-count');
            },
            mouseout: function(d, self) {
              d3.select(this)
                .select('.unit-count')
                .attr('class', 'unit-count hide-count');
            }
          },

          // Relation Related
          '.rel-label': {
            click: 'relationClick'
          },

          // Canvas related
          '#canvas rect:first-child': {
            click: function(d, self) {
              var container = self.get('container');
              container.all('.environment-menu.active').removeClass('active');
              self.service_click_actions.toggleControlPanel(null, self);
              self.cancelRelationBuild();
            }
          }
        },

        d3Events: {
          '.service': {
            'mousedown.addrel': function(d, self) {
              var evt = d3.event;
              self.longClickTimer = Y.later(750, this, function(d, e) {
                // Provide some leeway for accidental dragging.
                if ((Math.abs(d.x - d.oldX) + Math.abs(d.y - d.oldY)) /
                    2 > 5) {
                  return;
                }

                // set a flag on the view that we're building a relation
                self.buildingRelation = true;

                // Sometimes mouseover is fired after the mousedown, so ensure
                // we have the correct event in d3.event for d3.mouse().
                d3.event = e;

                // Flash an indicator around the center of the service block.
                var center = d.getCenter();
                self.vis.append('circle')
                  .attr('cx', center[0])
                  .attr('cy', center[1])
                  .attr('r', 100)
                  .attr('class', 'mouse-down-indicator')
                  .transition()
                  .duration(750)
                  .ease('bounce')
                  .attr('r', 0)
                  .remove();

                // Start the process of adding a relation
                self.addRelationDragStart.call(self, d, this);
              }, [d, evt], false);
            },
            'mouseup.addrel': function(d, self) {
              // Cancel the long-click timer if it exists.
              if (self.longClickTimer) {
                self.longClickTimer.cancel();
              }
            }
          }
        },

        initializer: function() {
          console.log('View: Initialized: Env');
          this.publish('showService', {preventable: false});

          // Build a service.id -> BoundingBox map for services.
          this.service_boxes = {};

          // Track events bound to the canvas
          this._sceneEvents = [];
        },

        render: function() {
          var container = this.get('container');
          EnvironmentView.superclass.render.apply(this, arguments);
          container.setHTML(Templates.overview());
          this.svg = container.one('#overview');

          // Setup delegated event handlers.
          this.attachSceneEvents();
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

          this.service_scale = d3.scale.log().range([150, 200]);
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
        .scaleExtent([0.25, 2.0])
        .on('zoom', function() {
                // Keep the slider up to date with the scale on other sorts
                // of zoom interactions
                var s = self.slider;
                s.set('value', Math.floor(d3.event.scale * 100));
                self.rescale(vis, d3.event);
              });
          self.zoom = zoom;

          // Set up the visualization with a pack layout.
          var vis = d3.select(container.getDOMNode())
            .selectAll('#canvas')
            .append('svg:svg')
            .attr('pointer-events', 'all')
            .attr('width', width)
            .attr('height', height)
            .append('svg:g')
            .call(zoom)
              // Disable zoom on double click.
            .on('dblclick.zoom', null)
            .append('g');

          vis.append('svg:rect')
            .attr('class', 'graph')
            .attr('fill', 'rgba(255,255,255,0)');

          // Bind visualization resizing on window resize.
          Y.on('windowresize', function() {
            self.setSizesFromViewport();
          });

          this.vis = vis;
          this.tree = d3.layout.pack()
                .size([width, height])
                .value(function(d) {return d.unit_count;})
                .padding(300);

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
        //   this.attachSceneEvents();
        // },

        /*
         * Bind declarative events to the root of the scene.
         * This is both more efficient and easier to refresh.
         * Inspired by View.attachEvents
         */
        attachSceneEvents: function(events) {
          var container = this.get('container'),
              self = this,
              owns = Y.Object.owns,
              selector,
              name,
              handlers,
              handler;

          function _bindEvent(name, handler, container, selector, context) {
            // Call event handlers with:
            //   this = DOMNode of currentTarget
            //   handler(d, view)
            var d3Adaptor = function(evt) {
              var selection = d3.select(evt.currentTarget.getDOMNode()),
                  d = selection.data()[0];
              // This is a minor violation (extension)
              // of the interface, but suits us well.
              d3.event = evt;
              return handler.call(
                  evt.currentTarget.getDOMNode(), d, context);
            };
            context._sceneEvents.push(
                Y.delegate(name, d3Adaptor, container, selector, context));
          }

          this.detachSceneEvents();
          events = events || this.sceneEvents;

          for (selector in events) {
            if (owns(events, selector)) {
              handlers = events[selector];
              for (name in handlers) {
                if (owns(handlers, name)) {
                  handler = handlers[name];
                  if (typeof handler === 'string') {
                    handler = this[handler];
                  }
                  if (!handler) {
                    console.error(
                        'No Event handler for',
                        selector,
                        name);
                    continue;
                  }
                  _bindEvent(name, handler, container, selector, this);
                }
              }
            }
          }
          return this;
        },

        detachSceneEvents: function() {
          Y.each(this._sceneEvents, function(handle) {
            if (handle) {
              handle.detach();
            }
          });

          this._sceneEvents = [];
          return this;
        },

        serviceClick: function(d, self) {
          // Ignore if we clicked on a control panel image.
          if (self.hasSVGClass(d3.event.target, 'cp-button')) {
            return;
          }
          // Get the current click action
          var curr_click_action = self.get('currentServiceClickAction');
          // Fire the action named in the following scheme:
          //   service_click_action.<action>
          // with the service, the SVG node, and the view
          // as arguments.
          (self.service_click_actions[curr_click_action])(
              d, self, this);
        },

        serviceDblClick: function(d, self) {
          // Just show the service on double-click.
          var service = self.serviceForBox(d);
          (self.service_click_actions.show_service)(service, self);
        },

        relationClick: function(d, self) {
          self.removeRelationConfirm(d, this, self);
        },

        /*
         * Sync view models with current db.models.
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
            service.margins(service.subordinate ?
                {
                  top: 0.05,
                  bottom: 0.1,
                  left: 0.084848,
                  right: 0.084848} :
                {
                  top: 0,
                  bottom: 0.1667,
                  left: 0.086758,
                  right: 0.086758});
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
            .on('dragstart', function(d) {
                d.oldX = d.x;
                d.oldY = d.y;
                self.get('container').all('.environment-menu.active')
                  .removeClass('active');
                self.service_click_actions.toggleControlPanel(null, self);
                self.cancelRelationBuild();
              })
            .on('drag', function(d, i) {
                if (self.buildingRelation) {
                  self.addRelationDrag.call(self, d, this);
                } else {
                  if (self.longClickTimer) {
                    self.longClickTimer.cancel();
                  }
                  d.x += d3.event.dx;
                  d.y += d3.event.dy;
                  d3.select(this).attr('transform', function(d, i) {
                    return d.translateStr();
                  });
                  if (self.get('active_service') === d) {
                    self.updateServiceMenuLocation();
                  }
                  self.get('container').all('.environment-menu.active')
                    .removeClass('active');
                  self.service_click_actions.toggleControlPanel(null, self);
                  self.cancelRelationBuild();
                  updateLinks();
                }
              })
            .on('dragend', function(d, i) {
                if (self.buildingRelation) {
                  self.addRelationDragEnd.call(self, d, this);
                }
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
            .attr('class', function(d) {
                    return (d.subordinate ? 'subordinate ' : '') + 'service';
                  })
            .call(drag)
            .on('mousedown.addrel', function(d) {
                self.d3Events['.service']['mousedown.addrel']
                .call(this, d, self, d3.event);
              })
            .on('mouseup.addrel', function(d) {
                self.d3Events['.service']['mouseup.addrel']
                .call(this, d, self, d3.event);
              })
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
              });
          label.append('text')
              .append('tspan')
              .text(function(d) {return d.display_name; });
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
              service_scale = this.service_scale,
              service_scale_width = this.service_scale_width,
              service_scale_height = this.service_scale_height;

          // Size the node for drawing.
          node
            .attr('width', function(d) {
                // NB: if a service has zero units, as is possible with
                // subordinates, then default to 1 for proper scaling, as
                // a value of 0 will return a scale of 0 (this does not
                // affect the unit count, just the scale of the service).
                var w = service_scale(d.unit_count || 1);
                d.w = w;
                return w;
              })
            .attr('height', function(d) {
                var h = service_scale(d.unit_count || 1);
                d.h = h;
                return h;
              });

          // Draw subordinate services
          node.filter(function(d) {
            return d.subordinate;
          })
            .append('image')
            .attr('xlink:href', '/juju-ui/assets/svgs/sub_module.svg')
            .attr('width', function(d) {
                    return d.w;
                  })
            .attr('height', function(d) {
                    return d.h;
                  });

          // Draw a subordinate relation indicator.
          var sub_relation = node.filter(function(d) {
            return d.subordinate;
          })
            .append('g')
            .attr('class', 'sub-rel-block')
            .attr('transform', function(d) {
                // Position the block so that the relation indicator will
                // appear at the right connector.
                return 'translate(' + [d.w, d.h / 2 - 26] + ')';
              });

          sub_relation.append('image')
            .attr('xlink:href', '/juju-ui/assets/svgs/sub_relation.svg')
            .attr('width', 87)
            .attr('height', 47);
          sub_relation.append('text').append('tspan')
            .attr('class', 'sub-rel-count')
            .attr('x', 64)
            .attr('y', 47 * 0.8)
            .text(function(d) {
                return self.subordinateRelationsForService(d).length;
              });
          // Draw non-subordinate services services
          node.filter(function(d) {
            return !d.subordinate;
          })
            .append('image')
            .attr('xlink:href', '/juju-ui/assets/svgs/service_module.svg')
            .attr('width', function(d) {
                    return d.w;
                  })
            .attr('height', function(d) {
                    return d.h;
                  });

          // The following are sizes in pixels of the SVG assets used to
          // render a service, and are used to in calculating the vertical
          // positioning of text down along the service block.
          var service_height = 224,
              name_size = 22,
              charm_label_size = 16,
              name_padding = 26,
              charm_label_padding = 118;

          var service_labels = node.append('text').append('tspan')
            .attr('class', 'name')
            .attr('style', function(d) {
                // Programmatically size the font.
                // Number derived from service assets:
                // font-size 22px when asset is 224px.
                return 'font-size:' + d.h *
                    (name_size / service_height) + 'px';
              })
            .attr('x', function(d) {
                    return d.w / 2;
                  })
            .attr('y', function(d) {
                // Number derived from service assets:
                // padding-top 26px when asset is 224px.
                return d.h * (name_padding / service_height) + d.h *
                    (name_size / service_height) / 2;
                  })
            .text(function(d) {return d.id; });

          var charm_labels = node.append('text').append('tspan')
            .attr('class', 'charm-label')
            .attr('style', function(d) {
                // Programmatically size the font.
                // Number derived from service assets:
                // font-size 16px when asset is 224px.
                return 'font-size:' + d.h *
                    (charm_label_size / service_height) + 'px';
              })
            .attr('x', function(d) {
                    return d.w / 2;
                  })
            .attr('y', function(d) {
                // Number derived from service assets:
                // padding-top: 118px when asset is 224px.
                return d.h * (charm_label_padding / service_height) - d.h *
                    (charm_label_size / service_height) / 2;
                  })
            .attr('dy', '3em')
            .text(function(d) { return d.charm; });

          // Show whether or not the service is exposed using an
          // indicator (currently a simple circle).
          // TODO this will likely change to an image with UI uodates.
          var exposed_indicator = node.filter(function(d) {
            return d.exposed;
          })
            .append('image')
            .attr('xlink:href', '/juju-ui/assets/svgs/exposed.svg')
            .attr('width', function(d) {
                return d.w / 6;
              })
            .attr('height', function(d) {
                return d.w / 6;
              })
            .attr('x', function(d) {
                return d.w / 10 * 7;
              })
            .attr('y', function(d) {
                return d.getRelativeCenter()[1] - (d.w / 6) / 2;
              })
            .attr('class', 'exposed-indicator on');
          exposed_indicator.append('title')
            .text(function(d) {
                return d.exposed ? 'Exposed' : '';
              });

          // Add the relative health of a service in the form of a pie chart
          // comprised of units styled appropriately.
          var status_chart_arc = d3.svg.arc()
            .innerRadius(0)
            .outerRadius(function(d) {
                // Make sure it's exactly as wide as the mask
                return parseInt(
                    d3.select(this.parentNode)
                      .select('image')
                      .attr('width'), 10) / 2;
              });

          var status_chart_layout = d3.layout.pie()
            .value(function(d) { return (d.value ? d.value : 1); })
            .sort(function(a, b) {
                // Ensure that the service health graphs will be renders in
                // the correct order: error - pending - running.
                var states = {error: 0, pending: 1, running: 2};
                return states[a.name] - states[b.name];
              });

          // Append to status charts to non-subordinate services
          var status_chart = node.append('g')
            .attr('class', 'service-status')
            .attr('transform', function(d) {
                return 'translate(' + d.getRelativeCenter() + ')';
              });

          // Add a mask svg
          status_chart.append('image')
            .attr('xlink:href', '/juju-ui/assets/svgs/service_health_mask.svg')
            .attr('width', function(d) {
                return d.w / 3;
              })
            .attr('height', function(d) {
                return d.h / 3;
              })
            .attr('x', function() {
                return -d3.select(this).attr('width') / 2;
              })
            .attr('y', function() {
                return -d3.select(this).attr('height') / 2;
              });

          // Add the path after the mask image (since it requires the mask's
          // width to set its own).
          var status_arcs = status_chart.selectAll('path')
            .data(function(d) {
                var aggregate_map = d.aggregated_status,
                    aggregate_list = [];
                Y.Object.each(aggregate_map, function(count, state) {
                  aggregate_list.push({name: state, value: count});
                });

                return status_chart_layout(aggregate_list);
              }).enter().insert('path', 'image')
            .attr('d', status_chart_arc)
            .attr('class', function(d) { return 'status-' + d.data.name; })
            .attr('fill-rule', 'evenodd')
            .append('title').text(function(d) {
                return d.data.name;
              });

          // Add the unit counts, visible only on hover.
          var unit_count = status_chart.append('text')
            .attr('class', 'unit-count hide-count')
            .text(function(d) {
                return self.humanizeNumber(d.unit_count);
              });


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
              if (bpair.display_name === undefined) {
                bpair.display_name = pair[0][0];
              }
              pairs.push(bpair);
            }
          });
          return pairs;
        },

        /*
         * Utility function to get subordinate relations for a service.
         */
        subordinateRelationsForService: function(service) {
          return this.rel_pairs.filter(function(p) {
            return p.modelIds().indexOf(service.modelId()) !== -1 &&
                p.scope === 'container';
          });
        },
        renderSlider: function() {
          var self = this,
              value = 100,
              currentScale = this.get('scale');
          // Build a slider to control zoom level
          if (currentScale) {
            value = currentScale * 100;
          }
          var slider = new Y.Slider({
            min: 25,
            max: 200,
            value: value
          });
          slider.render('#slider-parent');
          slider.after('valueChange', function(evt) {
            // Don't fire a zoom if there's a zoom event already in progress;
            // that will run rescale for us.
            if (d3.event && d3.event.scale && d3.event.translate) {
              return;
            }
            self._fire_zoom((evt.newVal - evt.prevVal) / 100);
          });
          self.slider = slider;
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
         * Show/hide/fade selection.
         */
        show: function(selection) {
          selection.attr('opacity', '1.0')
                .style('display', 'block');
          return selection;
        },

        hide: function(selection) {
          selection.attr('opacity', '0')
            .style('display', 'none');
          return selection;
        },

        fade: function(selection, alpha) {
          selection.transition()
            .duration(400)
            .attr('opacity', alpha !== undefined && alpha || '0.2');
          return selection;
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

          // Preserve zoom when the scene is updated.
          var changed = false,
              currentScale = this.get('scale'),
              currentTranslate = this.get('translate');
          if (currentTranslate && currentTranslate !== this.zoom.translate()) {
            this.zoom.translate(currentTranslate);
            changed = true;
          }
          if (currentScale && currentScale !== this.zoom.scale()) {
            this.zoom.scale(currentScale);
            changed = true;
          }
          if (changed) {
            this._fire_zoom(0);
          }

          // Render the slider after the view is attached.
          // Although there is a .syncUI() method on sliders, it does not
          // seem to play well with the app framework: the slider will render
          // the first time, but on navigation away and back, will not
          // re-render within the view.
          this.renderSlider();

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
          } else if (curr_action === 'addRelationStart' ||
              curr_action === 'ambiguousAddRelationCheck') {
            this.set('currentServiceClickAction', 'toggleControlPanel');
          } // Otherwise do nothing.
        },

        addRelationDragStart: function(d, context) {
          // Create a pending drag-line behind services.
          var dragline = this.vis.insert('line', '.service')
              .attr('class', 'relation pending-relation dragline dragging'),
              self = this;

          // Start the line in the middle of the service.
          var point = d.getCenter();
          dragline.attr('x1', point[0])
              .attr('y1', point[1])
              .attr('x2', point[0])
              .attr('y2', point[1]);
          self.dragline = dragline;
          self.cursorBox = views.BoundingBox();

          // Start the add-relation process.
          self.service_click_actions
          .addRelationStart(d, self, context);
        },

        addRelationDrag: function(d, context) {
          // Rubberband our potential relation line if we're not currently
          // hovering over a potential drop-point.
          if (!this.get('potential_drop_point_service')) {
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

        addRelationDragEnd: function(d, context) {
          // Get the line, the endpoint service, and the target <rect>.
          var self = this;
          var rect = self.get('potential_drop_point_rect');
          var endpoint = self.get('potential_drop_point_service');

          // Get rid of our drag line
          self.dragline.remove();
          self.buildingRelation = false;
          self.cursorBox = null;

          // If we landed on a rect, add relation, otherwise, cancel.
          if (rect) {
            self.service_click_actions
            .ambiguousAddRelationCheck(endpoint, self, rect);
          } else {
            // TODO clean up, abstract
            self.cancelRelationBuild();
            self.addRelation(); // Will clear the state.
          }
        },
        removeRelation: function(d, context, view, confirmButton) {
          var env = this.get('env'),
              endpoints = d.endpoints,
              relationElement = Y.one(context.parentNode).one('.relation');
          view.addSVGClass(relationElement, 'to-remove pending-relation');
          env.remove_relation(
              endpoints[0][0] + ':' + endpoints[0][1].name,
              endpoints[1][0] + ':' + endpoints[1][1].name,
              Y.bind(this._removeRelationCallback, this, view,
                  relationElement, d.relation_id, confirmButton));
        },

        _removeRelationCallback: function(view,
            relationElement, relationId, confirmButton, ev) {
          var db = this.get('db'),
              service = this.get('model');
          if (ev.err) {
            db.notifications.add(
                new models.Notification({
                  title: 'Error deleting relation',
                  message: 'Relation ' + ev.endpoint_a + ' to ' + ev.endpoint_b,
                  level: 'error'
                })
            );
            view.removeSVGClass(this.relationElement,
                'to-remove pending-relation');
          } else {
            // Remove the relation from the DB.
            db.relations.remove(db.relations.getById(relationId));
            // Redraw the graph and reattach events.
            db.fire('update');
          }
          view.get('rmrelation_dialog').hide();
          confirmButton.set('disabled', false);
        },

        removeRelationConfirm: function(d, context, view) {
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

        cancelRelationBuild: function() {
          this.set('currentServiceClickAction', 'toggleControlPanel');
          this.show(this.vis.selectAll('.service'))
                  .classed('selectable-service', false);
        },


        /*
         * Zoom in event handler.
         */
        zoom_out: function(evt) {
          var slider = this.slider,
              val = slider.get('value');
          slider.set('value', val - 25);
        },

        /*
         * Zoom out event handler.
         */
        zoom_in: function(evt) {
          var slider = this.slider,
              val = slider.get('value');
          slider.set('value', val + 25);
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
          zoom.scale(evt.scale);

          // Update the translate so that we scale from the center
          // instead of the origin.
          var rect = vis.select('rect');
          evt.translate[0] -= parseInt(rect.attr('width'), 10) / 2 * delta;
          evt.translate[1] -= parseInt(rect.attr('height'), 10) / 2 * delta;
          zoom.translate(evt.translate);

          this.rescale(vis, evt);
        },

        /*
         * Rescale the visualization on a zoom/pan event.
         */
        rescale: function(vis, evt) {
          // Make sure we don't scale outside of our bounds.
          // This check is needed because we're messing with d3's zoom
          // behavior outside of mouse events (e.g.: with the slider),
          // and can't trust that zoomExtent will play well.
          var new_scale = Math.floor(evt.scale * 100);
          if (new_scale < 25 || new_scale > 200) {
            evt.scale = this.get('scale');
          }
          // Store the current value of scale so that it can be restored later.
          this.set('scale', evt.scale);
          // Store the current value of translate as well, by copying the event
          // array in order to avoid reference sharing.
          this.set('translate', evt.translate.slice(0));
          vis.attr('transform', 'translate(' + evt.translate + ')' +
              ' scale(' + evt.scale + ')');
          this.updateServiceMenuLocation();
        },

        /*
         * Event handler to show the graph-list picker
         */
        showGraphListPicker: function(evt) {
          var container = this.get('container'),
              picker = container.one('.graph-list-picker');
          picker.addClass('inactive');
          picker.one('.picker-expanded').addClass('active');
        },

        /*
         * Event handler to hide the graph-list picker
         */
        hideGraphListPicker: function(evt) {
          var container = this.get('container'),
              picker = container.one('.graph-list-picker');
          picker.removeClass('inactive');
          picker.one('.picker-expanded').removeClass('active');
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
              viewport_width = '100%',
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
                styleToNumber('.navbar', 'height', 87) - 1;

            // Attempt to get the viewport width from the overview-tasks bar.
            viewport_width = styleToNumber('#viewport', 'width', 800);

            // Make sure we don't get sized any smaller than 800x600
            viewport_height = Math.max(viewport_height, height);
            viewport_width = Math.max(viewport_width, width);
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
          container.one('#canvas').setStyle('height', height);
          container.one('#canvas').setStyle('width', width);

          // Reset the scale parameters
          this.xscale.domain([-width / 2, width / 2])
            .range([0, width]);
          this.yscale.domain([-height / 2, height / 2])
            .range([height, 0]);
        },

        /*
         * Update the location of the active service panel
         */
        updateServiceMenuLocation: function() {
          var container = this.get('container'),
              cp = container.one('.environment-menu.active'),
              service = this.get('active_service'),
              tr = this.zoom.translate(),
              z = this.zoom.scale();
          if (service) {
            cp.setStyle('top', service.y * z + tr[1]);
            cp.setStyle('left', service.x * z + service.w * z + tr[0]);
          }
        },


        /*
         * Actions to be called on clicking a service.
         */
        service_click_actions: {
          /*
           * Default action: show or hide control panel.
           */
          toggleControlPanel: function(m, view, context) {
            var container = view.get('container'),
                cp = container.one('#service-menu');

            if (cp.hasClass('active') || !m) {
              cp.removeClass('active');
              view.set('active_service', null);
              view.set('active_context', null);
            } else {
              view.set('active_service', m);
              view.set('active_context', context);
              cp.addClass('active');
              view.updateServiceMenuLocation();
            }
          },

          /*
           * View a service
           */
          show_service: function(m, view) {
            view.fire('showService', {service: m});
          },

          /*
           * Show a dialog before destroying a service
           */
          destroyServiceConfirm: function(m, view) {
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
                  var btn = ev.target;
                  btn.set('disabled', true);
                  view.service_click_actions
                      .destroyService(m, view, btn);
                },
                this)));
          },

          /*
           * Destroy a service.
           */
          destroyService: function(m, view, btn) {
            var env = view.get('env'),
                service = view.get('destroy_service');
            env.destroy_service(
                service.get('id'), Y.bind(this._destroyCallback, this,
                    service, view, btn));
          },

          _destroyCallback: function(service, view, btn, ev) {
            var getModelURL = view.get('getModelURL'),
                db = view.get('db');
            if (ev.err) {
              db.notifications.add(
                  new models.Notification({
                    title: 'Error destroying service',
                    message: 'Service name: ' + ev.service_name,
                    level: 'error',
                    link: getModelURL(service),
                    modelId: service
                  })
              );
            } else {
              var relations = db.relations.get_relations_for_service(service);
              Y.each(relations, function(relation) {
                relation.destroy();
              });
              service.destroy();
              view.get('destroy_dialog').hide();
              db.fire('update');
            }
            btn.set('disabled', false);
          },


          /*
           * Fired when clicking the first service in the add relation
           * flow.
           */
          addRelationStart: function(m, view, context) {
            view.show(view.vis.selectAll('.service'));

            var db = view.get('db'),
                getServiceEndpoints = view.get('getServiceEndpoints'),
                service = view.serviceForBox(m),
                endpoints = models.getEndpoints(
                    service, getServiceEndpoints(), db),

                /* Transform endpoints into a list of
                 * relatable services (to the service in m)
                 */
                possible_relations = Y.Array.map(
                    Y.Array.flatten(Y.Object.values(
                        endpoints)),
                    function(ep) {return ep.service;}),
                invalidRelationTargets = {};

            // Iterate services and invert the possibles list.
            db.services.each(function(s) {
              if (Y.Array.indexOf(possible_relations,
                  s.get('id')) === -1) {
                invalidRelationTargets[s.get('id')] = true;
              }
            });

            // Fade elements to which we can't relate.
            // Rather than two loops this marks
            // all services as selecable and then
            // removes the invalid ones
            view.fade(view.vis.selectAll('.service')
              .classed('selectable-service', true)
              .filter(function(d) {
                  return (d.id in invalidRelationTargets &&
                          d.id !== m.id);
                }))
              .classed('selectable-service', false);



            // Store start service in attrs.
            view.set('addRelationStart_service', m);
            // Store possible endpoints.
            view.set('addRelationStart_possibleEndpoints', endpoints);
            // Set click action.
            view.set('currentServiceClickAction', 'ambiguousAddRelationCheck');
          },

          /*
           * Test if the pending relation is ambiguous.  Display a menu if so,
           * create the relation if not.
           */
          ambiguousAddRelationCheck: function(m, view, context) {
            var endpoints = view.get('addRelationStart_possibleEndpoints'),
                container = view.get('container');

            if (endpoints[m.id].length === 1) {
              // Create a relation with the only available endpoint.
              var ep = endpoints[m.id][0],
                  endpoints_item = [
                    [ep[0].service, {
                      name: ep[0].name,
                      role: 'server' }],
                    [ep[1].service, {
                      name: ep[1].name,
                      role: 'client' }]];
              view.service_click_actions
                .addRelationEnd(endpoints_item, view, context);
              return;
            }

            // Display menu with available endpoints.
            var menu = container.one('#ambiguous-relation-menu');
            if (menu.one('.menu')) {
              menu.one('.menu').remove(true);
            }

            menu.append(Templates
                .ambiguousRelationList({endpoints: endpoints[m.id]}));

            // For each endpoint choice, bind an an event to 'click' to
            // add the specified relation.
            menu.all('li').on('click', function(evt) {
              if (evt.currentTarget.hasClass('cancel')) {
                return;
              }
              var el = evt.currentTarget,
                  endpoints_item = [
                    [el.getData('startservice'), {
                      name: el.getData('startname'),
                      role: 'server' }],
                    [el.getData('endservice'), {
                      name: el.getData('endname'),
                      role: 'client' }]];
              menu.removeClass('active');
              view.service_click_actions
                .addRelationEnd(endpoints_item, view, context);
            });

            // Add a cancel item.
            menu.one('.cancel').on('click', function(evt) {
              menu.removeClass('active');
              view.cancelRelationBuild();
            });

            // Display the menu at the service endpoint.
            var tr = view.zoom.translate(),
                z = view.zoom.scale();
            menu.setStyle('top', m.y * z + tr[1]);
            menu.setStyle('left', m.x * z + m.w * z + tr[0]);
            menu.addClass('active');
            view.set('active_service', m);
            view.set('active_context', context);
            view.updateServiceMenuLocation();
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
            var vis = view.vis,
                env = view.get('env'),
                db = view.get('db'),
                source = view.get('addRelationStart_service'),
                relation_id = 'pending:' + endpoints[0][0] + endpoints[1][0];

            if (endpoints[0][0] === endpoints[1][0]) {
              view.set('currentServiceClickAction', 'toggleControlPanel');
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
            db.fire('update');

            // Fire event to add relation in juju.
            // This needs to specify interface in the future.
            env.add_relation(
                endpoints[0][0] + ':' + endpoints[0][1].name,
                endpoints[1][0] + ':' + endpoints[1][1].name,
                Y.bind(this._addRelationCallback, this, view, relation_id)
            );
            view.set('currentServiceClickAction', 'toggleControlPanel');
          },

          _addRelationCallback: function(view, relation_id, ev) {
            var db = view.get('db');
            // Remove our pending relation from the DB, error or no.
            db.relations.remove(
                db.relations.getById(relation_id));
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
              var result = ev.result,
                  endpoints = Y.Array.map(result.endpoints, function(item) {
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
            db.fire('update');
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
    'slider',
    'view']
});
