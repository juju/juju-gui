'use strict';

YUI.add('juju-view-environment', function(Y) {

var views = Y.namespace('juju.views'),
    Templates = views.Templates;

function styleToNumber(selector, style) {
    style = style || 'height';
    return parseInt(Y.one(selector).getComputedStyle(style), 10);
}

var EnvironmentView = Y.Base.create('EnvironmentView', 
    Y.View, [views.JujuBaseView], {
    events: {
        '#add-relation-btn': {click: 'add_relation'},
        '#zoom-out-btn': {click: 'zoom_out'},
        '#zoom-in-btn': {click: 'zoom_in'}
    },

    initializer: function () {
        console.log('View: Initialized: Env');
        this.publish('showService', {preventable: false});
    },

    render: function () {
        console.log('View: Render: Env');
        var container = this.get('container');
        EnvironmentView.superclass.render.apply(this, arguments);
        container.setHTML(Templates.overview());
        this.render_canvas();
        return this;
    },

    render_canvas: function(){
        var self = this,
            container = this.get('container'),
            m = this.get('db'),
            height = 600,
            width = 640;

        var services = m.services.map(function(s) {
            s.value = s.get('unit_count');
            return s;
        });
        var relations = m.relations.toArray();
        var fill = d3.scale.category20();

        var xscale = d3.scale.linear()
            .domain([-width / 2, width / 2])
            .range([2, width]);

        var yscale = d3.scale.linear()
            .domain([-height / 2, height / 2])
            .range([height, 0]);

        // Create a pan/zoom behavior manager.
        var zoom = d3.behavior.zoom()
            .x(xscale)
            .y(yscale)
            .scaleExtent([0.25, 1.75])
            .on('zoom', function() {
                self.rescale(vis, d3.event);
            });
        self.set('zoom', zoom);

        // Scales for unit sizes.
        // XXX magic numbers will have to change; likely during
        // the UI work
        var service_scale_width = d3.scale.log().range([164, 200]);
        var service_scale_height = d3.scale.log().range([64, 100]);

        // Set up the visualization with a pack layout.
        var vis = d3.select(container.getDOMNode())
            .selectAll('#canvas')
            .append('svg:svg')
            .attr('pointer-events', 'all')
            .append('svg:g')
            .call(zoom)
            .append('g');
        vis.append('svg:rect')
            .attr('fill', 'white');

        // Bind visualization resizing on window resize
        Y.on('windowresize', function() {
            self.setSizesFromViewport(vis, container, xscale, yscale);
        });

        // If the view is bound to the dom, set sizes from viewport
        if (Y.one('svg')) {
            self.setSizesFromViewport(vis, container, xscale, yscale);
        }

        var tree = d3.layout.pack()
            .size([width, height])
            .padding(200);

        var rel_data = process_relations(relations);

        function update_links() {
            var link = vis.selectAll('polyline.relation')
                .remove();
            link = vis.selectAll('polyline.relation')
                .data(rel_data);
            link.enter().insert('svg:polyline', 'g.service')
                .attr('class', 'relation')
                .attr('points', function(d) { 
                          return self.draw_relation(d); });
        }

        var drag = d3.behavior.drag()
            .on('drag', function(d,i) {
                d.x += d3.event.dx;
                d.y += d3.event.dy;
                d3.select(this).attr('transform', function(d,i){
                    return 'translate(' + [ d.x,d.y ] + ')';
                });
                update_links();
            });

        // Generate a node for each service, draw it as a rect with
        // labels for service and charm.
        var node = vis.selectAll('.service')
            .data(self._saved_coords(services) ?
                services :
                self._generate_coords(services, tree))
            .enter().append('g')
            .attr('class', 'service')
            .attr('transform', function (d) {
                return 'translate(' + [d.x,d.y] + ')';
            })
            .on('click', function(m) {
                // Get the current click action.
                var curr_click_action =
                    self.get('current_service_click_action');

                // Fire the action named in the following scheme:
                //  service_click_action.<action>
                // with the service, the SVG node, and the view
                // as arguments.
                (self.service_click_actions[curr_click_action])(m, this, self);
            })
            .call(drag);

        node.append('rect')
            .attr('class', 'service-border')
            .attr('width', function(d) {
                var w = service_scale_width(d.get('unit_count'));
                d.set('width', w);
                return w;
                })
            .attr('height', function(d) {
                var h = service_scale_height(d.get('unit_count'));
                d.set('height', h);
                return h;});

        var service_labels = node.append('text').append('tspan')
            .attr('class', 'name')
            .attr('x', 54)
            .attr('y', '1em')
            .text(function(d) {return d.get('id'); });

        var charm_labels = node.append('text').append('tspan')
            .attr('x', 54)
            .attr('y', '2.5em')
            .attr('dy', '3em')
            .attr('class', 'charm-label')
            .text(function(d) { return d.get('charm'); });

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
                return d.get('exposed') ? 'Exposed' : '';
            });

        // Add the relative health of a service in the form of a pie chart
        // comprised of units styled appropriately.
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
                var aggregate_map = d.get('aggregated_status'),
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
                return self.humanizeNumber(d.get('unit_count'));
            });

        function process_relation(r) {
            var endpoints = r.get('endpoints'),
            rel_services = [];
            Y.each(endpoints, function(ep) {
                rel_services.push(services.filter(function(d) {
                    return d.get('id') == ep[0];
                })[0]);
            });
            return rel_services;
        }

        function process_relations(rels) {
            var pairs = [];
            Y.each(rels, function(rel) {
                var pair = process_relation(rel);
                // skip peer for now
                if (pair.length == 2) {
                    pairs.push({source: pair[0],
                               target: pair[1]});
                }

            });
            return pairs;
        }

        self.set('tree', tree);
        self.set('vis', vis);
        update_links();
    },

    /*
     * Check to make sure that every service has saved coordinates.
     */
    _saved_coords: function(services) {
        var saved_coords = true;
        services.forEach(function(service) {
            if (!service.x || !service.y) {
                saved_coords = false;
            }
        });
        return saved_coords;
    },

    /*
     * Generates coordinates for those services that are missing them.
     */
    _generate_coords: function(services, tree) {
        services.forEach(function(service) {
            if (service.x && service.y) {
                service.set('x', service.x);
                service.set('y', service.y);
            }
        });
        var services_with_coords = tree.nodes({children: services})
            .filter(function(d) { return !d.children; });
        services_with_coords.forEach(function(service) {
            if (service.get('x') && service.get('y')) {
                service.x = service.get('x');
                service.y = service.get('y');
            }
        });
        return services_with_coords;
    },

    /*
     * Draw a relation between services.  Polylines take a list of points
     * in the form 'x y,( x y,)* x y'.
     *
     * TODO For now, just draw a straight line;
     */
    draw_relation: function(relation) {
        return (relation.source.x  + (
                    relation.source.get('width') / 2)) + ' ' +
            relation.source.y + ', ' +
            (relation.target.x + (relation.target.get('width') / 2)) + ' ' +
            relation.target.y;
    },

    /*
     * Event handler for the add relation button.
     */
    add_relation: function(evt) {
        var curr_action = this.get('current_service_click_action'),
            container = this.get('container');
        if (curr_action == 'show_service') {
            this.set('current_service_click_action', 'add_relation_start');

            // Add .selectable-service to all .service-border.
            this.addSVGClass('.service-border', 'selectable-service');
            container.one('#add-relation-btn').addClass('active');
        } else if (curr_action == 'add_relation_start' ||
                curr_action == 'add_relation_end') {
            this.set('current_service_click_action', 'show_service');

            // Remove selectable border from all nodes.
            this.removeSVGClass('.service-border', 'selectable-service');
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
            view.fire('showService', {service: m});
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

            // Add temp relation between services.
            var link = vis.selectAll('path.pending-relation')
                .data([rel]);
            link.enter().insert('svg:polyline', 'g.service')
                .attr('class', 'relation pending-relation')
                .attr('points', view.draw_relation(rel));

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
            // For now, set back to show_service.
            view.set('current_service_click_action', 'show_service');
        }
    }

}, {
    ATTRS: {
        current_service_click_action: { value: 'show_service' }
    }
});

views.environment = EnvironmentView;
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
