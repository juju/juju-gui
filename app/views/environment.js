'use strict';

YUI.add('juju-view-environment', function(Y) {


/* 
 * ViewModel container for a model object
 * This object allows d3 to annotate it while leaving the 
 * unerlying domain pristine. This provides additional support
 * for view specific functionality including such things as:
 *   - where to place connection points
 *   - computing the connection target relative to another bounding box
 *   - detecting collision with another bounding box
 */
var views = Y.namespace('juju.views'),
    Templates = views.Templates;

var EnvironmentView = Y.Base.create('EnvironmentView', Y.View, 
    [views.JujuBaseView], {
    events: {
        '#add-relation-btn': {click: 'add_relation'}
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
        this.build_scene();
        return this;
    },
    
    /*
     * Construct a persistent scene that is managed in update
     */
    build_scene: function() {
        var container= this.get('container'),
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
      
        function rescale() {
            vis.attr("transform", "translate(" + d3.event.translate + ")"
                     + " scale(" + d3.event.scale + ")");
        }

        // Set up the visualization with a pack layout
        var vis = d3.select(container.getDOMNode())
            .selectAll('#canvas')
            .append('svg:svg')
            .attr('pointer-events', 'all')
            .attr('width', "100%")
            .attr('height', "100%")
            .append('svg:g')
            .call(d3.behavior.zoom()
                  .x(xscale)
                  .y(yscale)
                  .scaleExtent([0.25, 1.75])
                  .on('zoom', rescale))
            .append('svg:g');
        vis.append('svg:rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'white');

        this.vis = vis;
        this.tree = d3.layout.pack()
                .size([width, height])
                .padding(200);

        this.update_canvas();
    },
        
    /* 
     * Sync our data arrays to the current data
     */
    update_data: function() {
        //model data
        var vis = this.vis,
            m = this.get('domain_models'),
            services = m.services.map(views.toBoundingBox).map(
                function(s) {
                    s.value = s.unit_count;
                    return s;
                }),
            relations = m.relations.map(views.toBoundingBox);

        this.services = services;
        this.rel_data = this.processRelations(relations);
        
        this.node = vis.selectAll('.service')
                       .data(services, function(d) {
                           return d.get("modelId");});

        this.link = vis.selectAll('polyline.relation')
                        .data(this.rel_data, function(d) {
                                  return d.source.get('modelId') 
                                  + ':' 
                                  + d.target.get('modelId');
                        });
    },

    update_canvas: function(){
        var self = this,
            tree = this.tree,
            vis = this.vis;

        // Process any changed data
        this.update_data();

        var drag = d3.behavior.drag()
            .on('drag', function(d,i) {
                d.x += d3.event.dx;
                d.y += d3.event.dy;
                d3.select(this).attr('transform', function(d,i){
                    return d.translateStr();
                });
                update_links();                            
            });

        // Generate a node for each service, draw it as a rect with
        // labels for service and charm
        var node = this.node,
            link = this.link;

        // rerun the pack layout
        this.tree.nodes({children: this.services});

        // enter
        node
            .enter().append('g')
            .attr("class", "service")
            .on("click", function(m) {
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
            .attr('transform', function (d) {
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
                .data(self.rel_data, function(d) {
                          return d.source.get('modelId') + ':' + d.target.get('modelId');});

            self.link.enter().insert('svg:polyline', 'g.service')
                .attr('class', 'relation')
                .attr('points', self.draw_relation);
        }

        update_links();
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
            console.log("Process EP", r, ep);
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
        console.group("Process Rels");
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
     * in the form "x y,( x y,)* x y"
     *
     * TODO For now, just draw a straight line; 
     */
    draw_relation: function(relation) {
        console.log("draw_relation", relation);
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
        } // otherwise do nothing
    },

    /*
     * Actions to be called on clicking a service.
     */
    service_click_actions: {
        /*
         * Default action: view a service
         */
        show_service: function(m, context, view) {
            view.fire("showService", {service: m});
        },

        /*
         * Fired when clicking the first service in the add relation
         * flow.
         */
        add_relation_start: function(m, context, view) {
            // remove selectable border from current node
            // Cannot use removeClass on SVG elements, so emulate it
            var node = Y.one(context).one('.service-border');
            var currClasses = node.getAttribute('class');
            node.setAttribute('class', 
                    currClasses.replace('selectable-service', ''));
            // store start service in attrs
            view.set('add_relation_start_service', m);
            // set click action
            view.set('current_service_click_action', 
                    'add_relation_end');
        },

        /*
         * Fired when clicking the second service is clicked in the
         * add relation flow
         */
        add_relation_end: function(m, context, view) {
            // remove selectable border from all nodes
            var container = view.get('container');
            container.all('.service-border').each(function() {
                // Cannot use removeClass on SVG elements, so emulate it
                var currClasses = this.getAttribute('class');
                this.setAttribute('class',
                    currClasses.replace('selectable-service', ''));
            });

            // Get the vis, tree, and links, build the new relation
            var vis = view.get('vis'),
                tree = view.get('tree'),
                env = view.get('env'),
                rel = {
                    source: view.get('add_relation_start_service'),
                    target: m
                };

            // add temp relation between services
            var link = vis.selectAll("polyline.pending-relation")
                .data([rel]);
            link.enter().insert("svg:polyline", "g.service")
                .attr("class", "relation pending-relation")
                .attr('d', view.draw_relation(rel));

            // fire event to add relation in juju
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

views.environment = EnvironmentView;
}, '0.1.0', {
    requires: ['juju-templates',
               'juju-view-utils',
               'd3',
               'base-build',
               'handlebars-base',
               'node',
               'view']
});
