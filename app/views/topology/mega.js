'use strict';

/**
 * IMPORTANT
 *
 * This module represents a single step in the refactor of the environment
 * view. This module is THROW AWAY CODE.  Each forthcoming branch should
 * begin by moving relevant code to the proper module, binding that
 * module to Topo and removing code from here.
 *
 * Any patch adding code here (minus some initial cross module callback changes)
 * is highly suspect.
 **/

YUI.add('juju-topology-mega', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils'),
      d3ns = Y.namespace('d3'),
      Templates = views.Templates;

  /**
   * @module topology-service
   * @class MegaModule
   * @namespace views
   **/
  var MegaModule = Y.Base.create('MegaModule', d3ns.Module, [], {
    events: {
      scene: {
        '.service': {
          click: 'serviceClick',
          dblclick: 'serviceDblClick',
          mouseenter: 'serviceMouseEnter',
          mouseleave: 'mousemove'
        },

        '.sub-rel-block': {
          mouseenter: 'subRelBlockMouseEnter',
          mouseleave: 'subRelBlockMouseLeave',
          click: 'subRelBlockClick'
        },
        '.service-status': {
          mouseover: {callback: function(d, self) {
            d3.select(this)
            .select('.unit-count')
            .attr('class', 'unit-count show-count');
          }},
          mouseout: {callback: function(d, self) {
            d3.select(this)
            .select('.unit-count')
            .attr('class', 'unit-count hide-count');
          }}
        },

        '.rel-label': {
          click: 'relationClick',
          mousemove: 'mousemove'
        },

        '.topology .crosshatch-background rect:first-child': {
          /**
           * If the user clicks on the background we cancel any active add
           * relation.
           */
          click: {callback: function(d, self) {
            var container = self.get('container');
            container.all('.environment-menu.active').removeClass('active');
            self.service_click_actions.toggleControlPanel(null, self);
            self.cancelRelationBuild();
            self.hideSubordinateRelations();
          }},
          mousemove: 'mousemove'
        },
        '.dragline': {
          /** The user clicked while the dragline was active. */
          click: {callback: function(d, self) {
            // It was technically the dragline that was clicked, but the
            // intent was to click on the background, so...
            self.backgroundClicked();
          }}
        },

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
          /** The user clicked on the "Build Relation" menu item. */
          click: {
            callback: function(data, context) {
              var box = context.get('active_service'),
                  service = context.serviceForBox(box),
                  origin = context.get('active_context');
              context.addRelationDragStart(box, context);
              context.service_click_actions
                .toggleControlPanel(box, context, origin);
              context.service_click_actions.addRelationStart(
                  box, context, origin);
            }}
        },
        '.view-service': {
          /** The user clicked on the "View" menu item. */
          click: {callback: function(data, context) {
            // Get the service element
            var box = context.get('active_service'),
                service = context.serviceForBox(box);
            context.service_click_actions
              .toggleControlPanel(box, context);
            context.service_click_actions
              .show_service(service, context);
          }}
        },
        '.destroy-service': {
          /** The user clicked on the "Destroy" menu item. */
          click: {callback: function(data, context) {
            // Get the service element
            var box = context.get('active_service'),
                service = context.serviceForBox(box);
            context.service_click_actions
              .toggleControlPanel(box, context);
            context.service_click_actions
              .destroyServiceConfirm(service, context);
          }}
        }
      },
      d3: {
        '.service': {
          'mousedown.addrel': {callback: function(d, self) {
            var evt = d3.event;
            self.longClickTimer = Y.later(750, this, function(d, e) {
              // Provide some leeway for accidental dragging.
              if ((Math.abs(d.x - d.oldX) + Math.abs(d.y - d.oldY)) /
                  2 > 5) {
                return;
              }

              // Sometimes mouseover is fired after the mousedown, so ensure
              // we have the correct event in d3.event for d3.mouse().
              d3.event = e;

              // Start the process of adding a relation
              self.addRelationDragStart(d, self);
            }, [d, evt], false);
          }},
          'mouseup.addrel': {callback: function(d, self) {
            // Cancel the long-click timer if it exists.
            if (self.longClickTimer) {
              self.longClickTimer.cancel();
            }
          }}
        }
      },
      yui: {
        windowresize: 'setSizesFromViewport'
      }
    },

    initializer: function(options) {
      MegaModule.superclass.constructor.apply(this, arguments);
      console.log('View: Initialized: Env');
      this.publish('navigateTo', {preventable: false});

      // Build a service.id -> BoundingBox map for services.
      this.service_boxes = {};

      // Set a default
      this.set('currentServiceClickAction', 'toggleControlPanel');
    },

    render: function() {
      MegaModule.superclass.render.apply(this, arguments);
      var container = this.get('container');
      container.setHTML(Templates['overview']());
      this.svg = container.one('.topology');

      this.renderOnce();

      return this;
    },
    /*
   * Construct a persistent scene that is managed in update.
   */
    renderOnce: function() {
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
      .select('.crosshatch-background')
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

      this.vis = vis;
      this.tree = d3.layout.pack()
      .size([width, height])
      .value(function(d) {
            return Math.max(d.unit_count, 1);
          })
      .padding(300);

      this.updateCanvas();
    },

    serviceClick: function(d, context) {
      // Ignore if we clicked outside the actual service node.
      console.log('serviceClick', arguments, this);
      var container = context.get('container'),
              mouse_coords = d3.mouse(container.one('svg').getDOMNode());
      if (!d.containsPoint(mouse_coords, context.zoom)) {
        return;
      }
      // Get the current click action
      var curr_click_action = context.get('currentServiceClickAction');
      // Fire the action named in the following scheme:
      //   service_click_action.<action>
      // with the service, the SVG node, and the view
      // as arguments.
      (context.service_click_actions[curr_click_action])(
          d, context, this);
    },

    serviceDblClick: function(d, self) {
      // Just show the service on double-click.
      var service = self.serviceForBox(d);
      (self.service_click_actions.show_service)(service, self);
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
      //console.log("mousemove", this, arguments);
      if (self.clickAddRelation) {
        var container = self.get('component').get('container'),
                node = container.one('.topology rect:first-child').getDOMNode(),
                mouse = d3.mouse(node);
        d3.event.x = mouse[0];
        d3.event.y = mouse[1];
        self.addRelationDrag
              .call(self, self.get('addRelationStart_service'), node);
      }
    },

    /*
         * Sync view models with current db.models.
         */
    updateData: function() {
      //model data
      var vis = this.vis,
          db = this.get('component').get('db'),
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
              })
            .on('drag', function(d, i) {
                if (self.buildingRelation) {
                  self.addRelationDrag(d, this);
                } else {
                  if (self.longClickTimer) {
                    self.longClickTimer.cancel();
                  }

                  // Translate the service (and, potentially, menu).
                  d.x += d3.event.dx;
                  d.y += d3.event.dy;
                  d3.select(this).attr('transform', function(d, i) {
                    return d.translateStr();
                  });
                  if (self.get('active_service') === d) {
                    self.updateServiceMenuLocation();
                  }

                  // Clear any state while dragging.
                  self.get('container').all('.environment-menu.active')
                    .removeClass('active');
                  self.service_click_actions.toggleControlPanel(null, self);
                  self.cancelRelationBuild();

                  // Update relation lines for just this service.
                  updateLinkEndpoints(d);
                }
              })
            .on('dragend', function(d, i) {
                if (self.buildingRelation) {
                  self.addRelationDragEnd();
                }
              });

      /**
           * Update relation line endpoints for a given service.
           *
           * @method updateLinkEndpoints
           * @param {Object} service The service module that has been moved.
           */
      function updateLinkEndpoints(service) {
        Y.each(Y.Array.filter(self.rel_pairs, function(relation) {
          return relation.source() === service ||
              relation.target() === service;
        }), function(relation) {
          var rel_group = d3.select('#' + relation.id),
                  connectors = relation.source()
                    .getConnectorPair(relation.target()),
                  s = connectors[0],
                  t = connectors[1];
          rel_group.select('line')
                .attr('x1', s[0])
                .attr('y1', s[1])
                .attr('x2', t[0])
                .attr('y2', t[1]);
          rel_group.select('.rel-label')
                .attr('transform', function(d) {
                // XXX: This has to happen on update, not enter
                return 'translate(' +
                    [Math.max(s[0], t[0]) -
                         Math.abs((s[0] - t[0]) / 2),
                         Math.max(s[1], t[1]) -
                         Math.abs((s[1] - t[1]) / 2)] + ')';
              });
        });
      }

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
                // Make sure it's exactly as wide as the mask with a bit
                // of leeway for the border.
                return parseInt(
                    d3.select(this.parentNode)
                      .select('image')
                      .attr('width'), 10) / 2.05;
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
                return utils.humanizeNumber(d.unit_count);
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
      var db = this.get('component').get('db');
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
      // Create a pending drag-line.
      var dragline = this.vis.append('line')
              .attr('class', 'relation pending-relation dragline dragging'),
              self = this;

      // Start the line between the cursor and the nearest connector
      // point on the service.
      var mouse = d3.mouse(Y.one('svg').getDOMNode());
      self.cursorBox = views.BoundingBox();
      self.cursorBox.pos = {x: mouse[0], y: mouse[1], w: 0, h: 0};
      var point = self.cursorBox.getConnectorPair(d);
      dragline.attr('x1', point[0][0])
              .attr('y1', point[0][1])
              .attr('x2', point[1][0])
              .attr('y2', point[1][1]);
      self.dragline = dragline;

      // Start the add-relation process.
      context.service_click_actions
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

    addRelationDragEnd: function() {
      // Get the line, the endpoint service, and the target <rect>.
      var self = this;
      var rect = self.get('potential_drop_point_rect');
      var endpoint = self.get('potential_drop_point_service');

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
      var env = this.get('component').get('env'),
              endpoints = d.endpoints,
              relationElement = Y.one(context.parentNode).one('.relation');
      utils.addSVGClass(relationElement, 'to-remove pending-relation');
      env.remove_relation(
          endpoints[0][0] + ':' + endpoints[0][1].name,
          endpoints[1][0] + ':' + endpoints[1][1].name,
          Y.bind(this._removeRelationCallback, this, view,
          relationElement, d.relation_id, confirmButton));
    },

    _removeRelationCallback: function(view,
            relationElement, relationId, confirmButton, ev) {
      var db = this.get('component').get('db'),
          service = this.get('model');
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

    cancelRelationBuild: function() {
      if (this.dragline) {
        // Get rid of our drag line
        this.dragline.remove();
        this.dragline = null;
      }
      this.clickAddRelation = null;
      this.set('currentServiceClickAction', 'toggleControlPanel');
      this.buildingRelation = false;
      this.show(this.vis.selectAll('.service'))
                  .classed('selectable-service', false);
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
      if (this.clickAddRelation) {
        this.cancelRelationBuild();
      }
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
      this.buildingRelation = true;
      this.clickAddRelation = true;

      this.show(this.vis.selectAll('.service'));

      console.log('startRelation', this, arguments);
      var db = this.get('component').get('db'),
          getServiceEndpoints = this.get('component')
                                    .get('getServiceEndpoints'),
          endpoints = models.getEndpoints(
          service, getServiceEndpoints(), db),
          // Transform endpoints into a list of relatable services (to the
          // service).
          possible_relations = Y.Array.map(
              Y.Array.flatten(Y.Object.values(endpoints)),
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
      // all services as selectable and then
      // removes the invalid ones.
      this.fade(this.vis.selectAll('.service')
              .classed('selectable-service', true)
              .filter(function(d) {
                return (d.id in invalidRelationTargets &&
                          d.id !== service.id);
              }))
              .classed('selectable-service', false);

      // Store possible endpoints.
      this.set('addRelationStart_possibleEndpoints', endpoints);
      // Set click action.
      this.set('currentServiceClickAction', 'ambiguousAddRelationCheck');
    },


    /*
         * Zoom in event handler.
         */
    zoom_out: function(data, context) {
      var slider = context.slider,
              val = slider.get('value');
      slider.set('value', val - 25);
    },

    /*
         * Zoom out event handler.
         */
    zoom_in: function(data, context) {
      var slider = context.slider,
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

    /*
         * Set the visualization size based on the viewport
         */
    setSizesFromViewport: function() {
      // This event allows other page components that may unintentionally
      // affect the page size, such as the charm panel, to get out of the
      // way before we compute sizes.  Note the
      // "afterPageSizeRecalculation" event at the end of this function.
      console.log('resize');
      Y.fire('beforePageSizeRecalculation');
      // start with some reasonable defaults
      var vis = this.vis,
              container = this.get('container'),
              xscale = this.xscale,
              yscale = this.yscale,
              svg = container.one('svg'),
              canvas = container.one('.crosshatch-background');
      // Get the canvas out of the way so we can calculate the size
      // correctly (the canvas contains the svg).  We want it to be the
      // smallest size we accept--no smaller or bigger--or else the
      // presence or absence of scrollbars may affect our calculations
      // incorrectly.
      canvas.setStyles({height: 600, width: 800});
      var dimensions = utils.getEffectiveViewportSize(true, 800, 600);
      // Set the svg sizes.
      svg.setAttribute('width', dimensions.width)
            .setAttribute('height', dimensions.height);

      // Set the internal rect's size.
      svg.one('rect')
            .setAttribute('width', dimensions.width)
            .setAttribute('height', dimensions.height);
      canvas
            .setStyle('height', dimensions.height)
            .setStyle('width', dimensions.width);

      // Reset the scale parameters
      this.xscale.domain([-dimensions.width / 2, dimensions.width / 2])
            .range([0, dimensions.width]);
      this.yscale.domain([-dimensions.height / 2, dimensions.height / 2])
            .range([dimensions.height, 0]);

      this.width = dimensions.width;
      this.height = dimensions.height;
      Y.fire('afterPageSizeRecalculation');
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
      if (service && cp) {
        var cp_width = cp.getClientRect().width,
                menu_left = service.x * z + service.w * z / 2 <
                this.width * z / 2,
                service_center = service.getRelativeCenter();
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

    serviceMouseEnter: function(d, context) {
      var rect = Y.one(this);
      // Do not fire if this service isn't selectable.
      if (!utils.hasSVGClass(rect, 'selectable-service')) {
        return;
      }

      // Do not fire unless we're within the service box.
      var container = self.get('container'),
          mouse_coords = d3.mouse(container.one('svg').getDOMNode());
      if (!d.containsPoint(mouse_coords, self.zoom)) {
        return;
      }

      // Do not fire if we're on the same service.
      if (d === self.get('addRelationStart_service')) {
        return;
      }

      self.set('potential_drop_point_service', d);
      self.set('potential_drop_point_rect', rect);
      utils.addSVGClass(rect, 'hover');

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

    serviceMouseLeave: function(d, self) {
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
      utils.removeSVGClass(rect, 'hover');

      if (self.dragline) {
        self.dragline.attr('class',
                         'relation pending-relation dragline dragging');
      }
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
      show_service: function(m, context) {
        context.get('component')
        .fire('navigateTo', {url: '/service/' + m.get('id') + '/'});
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
        var env = view.get('component').get('env'),
            service = view.get('destroy_service');
        env.destroy_service(
            service.get('id'),
            Y.bind(this._destroyCallback, view,
                   service, view, btn));
      },

      _destroyCallback: function(service, view, btn, ev) {
        console.log('dest callback', arguments, this);
        var getModelURL = view.get('getModelURL'),
                db = view.get('component').get('db');
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
        var service = view.serviceForBox(m);
        view.startRelation(service);
        // Store start service in attrs.
        view.set('addRelationStart_service', m);
      },

      /*
           * Test if the pending relation is ambiguous.  Display a menu if so,
           * create the relation if not.
           */
      ambiguousAddRelationCheck: function(m, view, context) {
        var endpoints = view
                  .get('addRelationStart_possibleEndpoints')[m.id],
                container = view.get('container');

        if (endpoints.length === 1) {
          // Create a relation with the only available endpoint.
          var ep = endpoints[0],
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
                env = view.get('component').get('env'),
                db = view.get('component').get('db'),
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
        var db = view.get('component').get('db');
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
    ATTRS: {}

  });
  views.MegaModule = MegaModule;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'juju-templates',
    'node',
    'event',
    'juju-models',
    'juju-env'
  ]
});
