'use strict';

YUI.add('juju-view-environment', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates;

  function styleToNumber(selector, style) {
    style = style || 'height';
    return parseInt(Y.one(selector).getComputedStyle(style), 10);
  }

  function relationToId(d) {
      return d.source.get('modelId') + ':' + d.target.get('modelId');
  }

  var EnvironmentView = Y.Base.create('EnvironmentView',
      Y.View, [views.JujuBaseView], {
        events: {
          '#add-relation-btn': {click: 'add_relation'},
          '#zoom-out-btn': {click: 'zoom_out'},
          '#zoom-in-btn': {click: 'zoom_in'}
        },

        initializer: function() {
          console.log('View: Initialized: Env');
          this.publish('showService', {preventable: false});
        },

        render: function() {
          console.log('View: Render: Env');
          var container = this.get('container');
          EnvironmentView.superclass.render.apply(this, arguments);
          container.setHTML(Templates.overview());
          this.svg = container.one('#overview');
          this.build_scene();
          return this;
        },

        /*
     * Construct a persistent scene that is managed in update
     */
        build_scene: function() {
          var self = this, 
              container = this.get('container'),
              height = 600,
              width = 640,
              fill = d3.scale.category20(),
              xscale = d3.scale.linear()
                         .domain([-width / 2, width / 2])
                         .range([0, width]),
              yscale = d3.scale.linear()
                         .domain([-height / 2, height / 2])
                                 .range([height, 0]);

          this.service_scale_width = d3.scale.log().range([164, 200]),
          this.service_scale_height = d3.scale.log().range([64, 100]);

          // Create a pan/zoom behavior manager.
          var zoom = d3.behavior.zoom()
            .x(xscale)
            .y(yscale)
            .scaleExtent([0.25, 1.75])
            .on('zoom', function() {
                self.rescale(vis, d3.event);
              });
          this.set('zoom', zoom);

          function rescale() {
            vis.attr('transform', 
                    'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
          }

          // Set up the visualization with a pack layout
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
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'white');

          // Bind visualization resizing on window resize
          Y.on('windowresize', function() {
            self.setSizesFromViewport(vis, container, xscale, yscale);
          });

          // If the view is bound to the dom, set sizes from viewport
          if (Y.one('svg')) {
            self.setSizesFromViewport(vis, container, xscale, yscale);
          }
          this.vis = vis;
          this.tree = d3.layout.pack()
                .size([width, height])
                .padding(200);

          this.update_canvas(true);
        },

        attachView: function(target) {
            // attach view to target
            // if target is an ancestor of the view
            // this is a no-oop
            if (Y.Lang.isString(target)) {
                target = Y.one(target);
            } else if (!Y.Lang.isValue(target)) {
                target = this.get('container');
            }
            if (!this.svg.inDoc() || !this.svg.inRegion(target)) {
                target.append(this.svg);
            }
        },

        /*
         * Sync our data arrays to the current data
         */
        update_data: function() {
          //model data
          var vis = this.vis,
              db = this.get('db'),
              services = db.services.map(views.toBoundingBox).map(
              function(s) {
                    s.value = s.unit_count;
                    return s;
              }),
              relations = db.relations.map(views.toBoundingBox);

          this.services = services;
          this.rel_data = this.processRelations(relations);

          this.node = vis.selectAll('.service')
                       .data(services, function(d) {
                return d.get('modelId');});

          this.link = vis.selectAll('polyline.relation')
                .data(this.rel_data, relationToId);

        },

        update_canvas: function(initial) {
          var self = this,
              tree = this.tree,
              vis = this.vis;
            
          // If our container element isn't attached to the DOM
          // do so

          //Process any changed data
          this.update_data();

          var drag = d3.behavior.drag()
            .on('drag', function(d,i) {
                d.x += d3.event.dx;
                d.y += d3.event.dy;
                d3.select(this).attr('transform', function(d,i) {
                  return d.translateStr();
                });
                update_links();
              });

          // Generate a node for each service, draw it as a rect with
          // labels for service and charm
          var node = this.node;


          // rerun the pack layout
          this.tree.nodes({children: this.services});

          // enter
          node
            .enter().append('g')
            .attr('class', 'service')
            .on('click', function(m) {
                // Get the current click action
                var curr_click_action = self.get(
                    'current_service_click_action');
                // Fire the action named in the following scheme:
                //  service_click_action.<action>
                // with the service, the SVG node, and the view
                // as arguments
                (self.service_click_actions[curr_click_action])(
                    m, this, self);
              })
            .call(drag)
            .transition()
            .duration(500)
            .attr('transform', function(d) {
                return d.translateStr();});

          // Update
          this.draw_service(node);

          // Exit
          node.exit()
            .transition()
            .duration(500)
            .attr('x', 0)
            .remove();

          function update_links() {
            // Link persistence hasn't worked properly
            // this removes and redraws links
            self.link.remove();
            self.link = vis.selectAll('polyline.relation')
                .data(self.rel_data, relationToId);

            self.link.enter().insert('svg:polyline', 'g.service')
                .attr('class', 'relation')
                .attr('points', self.draw_relation);
          }
            
            if (initial) {
                Y.later(600, this, update_links);
            } else {
                update_links();                
            }

          self.set('tree', tree);
          self.set('vis', vis);

        },


        // Called to draw a service in the 'update' phase
        draw_service: function(node) {
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
                return h;});

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
            return d.get('exposed');
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

                for (var status_name in aggregate_map) {
                  aggregate_list.push({
                        name: status_name,
                        value: aggregate_map[status_name]
                  });
                }

                return status_chart_layout(aggregate_list);
              })
            .enter().append('path')
            .attr('d', status_chart_arc)
            .attr('class', function(d) { return 'status-' + d.data.name; })
            .attr('fill-rule', 'evenodd')
            .append('title').text(function(d) {
                return d.data.name;
              });

          // Add the unit counts, visible only on hover
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
        },

        processRelation: function(r) {
          var self = this,
              endpoints = r.endpoints,
              rel_services = [];
          Y.each(endpoints, function(ep) {
            console.log('Process EP', r, ep);
            rel_services.push(
                self.services.filter(function(d) {
                  return d.id == ep[0];
                })[0]);
          });
          return rel_services;
        },

        processRelations: function(rels) {
          var self = this,
              pairs = [];
          console.group('Process Rels');
          Y.each(rels, function(rel) {
            var pair = self.processRelation(rel);
            // skip peer for now
            if (pair.length == 2) {
              pairs.push({source: pair[0],
                target: pair[1]});
            }
          });
          console.groupEnd();
          return pairs;
        },

        /*
     * Draw a relation between services.  Polylines take a list of points
     * in the form 'x y,( x y,)* x y'
     *
     * TODO For now, just draw a straight line;
     */
        draw_relation: function(relation) {
          var connectors = relation.source.getConnectorPair(relation.target),
              s = connectors[0],
              t = connectors[1];
          return s[0] + ',' + s[1] + ' ' + t[0] + ',' + t[1];
        },

        /*
     * Event handler for the add relation button
     */
        add_relation: function(evt) {
          var curr_action = this.get('current_service_click_action'),
              container = this.get('container');
          if (curr_action == 'show_service') {
            this.set('current_service_click_action', 'add_relation_start');
            // add .selectable-service to all .service-border
            container.all('.service-border').each(function() {
              // cannot use addClass on SVG elements, so emulate it.
              var currClasses = this.getAttribute('class');
              this.setAttribute('class',
                  currClasses + ' selectable-service');
            });
            container.one('#add-relation-btn').addClass('active');
          } else if (curr_action == 'add_relation_start' ||
              curr_action == 'add_relation_end') {
            this.set('current_service_click_action', 'show_service');
            // remove selectable border from all nodes
            container.all('.service-border').each(function() {
              // Cannot use removeClass on SVG elements, so emulate it
              var currClasses = this.getAttribute('class');
              this.setAttribute('class',
                  currClasses.replace('selectable-service', ''));
            });
            container.one('#add-relation-btn').removeClass('active');
          } // Otherwise do nothing.
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
          var vis = this.get('vis'),
              zoom = this.get('zoom'),
              evt = {};

          // Build a temporary event that rescale can use of a similar
          // construction to d3.event.
          evt.translate = zoom.translate();
          evt.scale = zoom.scale() + delta;

          // Update the scale in our zoom behavior manager to maintain state.
          this.get('zoom').scale(evt.scale);

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
        setSizesFromViewport: function(vis, container, xscale, yscale) {
          // start with some reasonable defaults
          var viewport_height = '100%',
              viewport_width = parseInt(container.getComputedStyle('width'), 10),
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
                                  styleToNumber('#overview-tasks') -
                                  styleToNumber('.navbar') -
                                  styleToNumber('.navbar', 'margin-bottom');

            // Make sure we don't get sized any smaller than 800x600
            viewport_height = Math.max(viewport_height, height);
            if (container.get('winWidth') < width) {
              viewport_width = width;
            }
          }
          // Set the svg sizes
          svg.setAttribute('width', viewport_width)
            .setAttribute('height', viewport_height);

          // Get the resulting computed sizes (in the case of 100%)
          width = parseInt(svg.getComputedStyle('width'), 10);
          height = parseInt(svg.getComputedStyle('height'), 10);

          // Set the internal rect's size
          svg.one('rect')
            .setAttribute('width', width)
            .setAttribute('height', height);

          // Reset the scale parameters
          xscale.domain([-width / 2, width / 2])
            .range([0, width]);
          yscale.domain([-height / 2, height / 2])
            .range([height, 0]);
        },

        /*
     * Actions to be called on clicking a service.
     */
        service_click_actions: {
          /*
         * Default action: view a service
         */
          show_service: function(m, context, view) {
              var services = view.get('db').services,
                  service = services.getById(m.id);
            view.fire('showService', {service: service});
          },

          /*
         * Fired when clicking the first service in the add relation
         * flow.
         */
          add_relation_start: function(m, context, view) {
            // Remove selectable border from current node.
            var node = Y.one(context).one('.service-border');
            view.removeSVGClass(node, 'selectable-service');
            // Store start service in attrs.
            view.set('add_relation_start_service', m);
            // Set click action.
            view.set('current_service_click_action',
                'add_relation_end');
          },

          /*
         * Fired when clicking the second service is clicked in the
         * add relation flow.
         */
          add_relation_end: function(m, context, view) {
            // Remove selectable border from all nodes
            view.removeSVGClass('.selectable-service', 'selectable-service');

            // Get the vis, tree, and links, build the new relation.
            var vis = view.get('vis'),
                tree = view.get('tree'),
                env = view.get('env'),
                container = view.get('container'),
                rel = {
                  source: view.get('add_relation_start_service'),
                  target: m
                };

            // add temp relation between services
            var link = vis.selectAll('polyline.pending-relation')
                .data([rel]);
            link.enter().insert('svg:polyline', 'g.service')
                .attr('class', 'relation pending-relation')
                .attr('d', view.draw_relation(rel));

            // Fire event to add relation in juju.
            env.add_relation(
                rel.source.get('id'),
                rel.target.get('id'),
                function(resp) {
                  container.one('#add-relation-btn').removeClass('active');
                  if (resp.err) {
                    console.log('Error adding relation');
                  }
                });
            // For now, set back to show_service
            view.set('current_service_click_action', 'show_service');
          }
        }

      }, {
        ATTRS: {
          current_service_click_action: {value: 'show_service'}
        }
      });

views.EnvironmentView = EnvironmentView;
}, '0.1.0', {
  requires: ['juju-templates',
    'juju-view-utils',
    'd3',
    'base-build',
    'handlebars-base',
    'node',
    'event-resize',
    'view']
});
