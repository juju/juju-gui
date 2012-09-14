'use strict';

YUI.add('juju-view-environment', function(Y) {

var views = Y.namespace('juju.views'),
    Templates = views.Templates;

var EnvironmentView = Y.Base.create('EnvironmentView', Y.View, [views.JujuBaseView], {
    events: {},

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
            m = this.get('domain_models'),
            height = 800,
            width = 640;

        var services = m.services.toArray().map(function(s) {
            s.value = s.get('unit_count');
            return s;
        });
        var relations = m.relations.toArray();
        var fill = d3.scale.category20();
        var zoom = d3.behavior.zoom();
        
        // Scales for unit sizes
        // XXX magic numbers will have to change; likely during
        // the pan/zoom work
        var service_scale_width = d3.scale.log().range([164, 200]);
        var service_scale_height = d3.scale.log().range([64, 100]);




        // Set up the visualization with a pack layout
        var vis = d3.select(container.getDOMNode())
            .selectAll('#canvas')
            .append('svg:svg')
            .attr('pointer-events', 'all')
            .attr('width', "100%")
            .attr('height', "100%")
            .append('svg:g')
            .call(d3.behavior.zoom().on('zoom', redraw))
            .append('svg:g');
        vis.append('svg:rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'white');

        function redraw() {
            vis.attr("transform", "translate(" + d3.event.translate + ")"
                     + " scale(" + d3.event.scale + ")");
        }

        var tree = d3.layout.pack()
            .size([width, height])
            .padding(200);

        var rel_data = processRelations(relations);

        function update_links() {
            var link = vis.selectAll('polyline.relation')
                .remove();
            link = vis.selectAll('polyline.relation')
                .data(rel_data);
            link.enter().insert('svg:polyline', 'g.service')
                .attr('class', 'relation')
                .attr('points', function(d) { return self.draw_relation(d); });
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
        // labels for service and charm
        var node = vis.selectAll('.service')
            .data(tree.nodes({children: services})
                .filter(function (d) { return !d.children; }))
            .enter().append('g')
            .attr('class', 'service')
            .attr('transform', function (d) { 
                return "translate(" + [d.x,d.y] + ")"; 
            })
            .on('click', function(m) {
                    self.fire('showService', {service: m});
            })
            .call(drag);

        node.append('rect')
            .attr('class', 'service-border')
            .attr('width', function(d) {
                return service_scale_width(d.get('unit_count')); })
            .attr('height', function(d) {
                return service_scale_height(d.get('unit_count')); });

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
                var aggregate_map = d.get('aggregated_status'),
                    aggregate_list = [];

                for (var idx in aggregate_map) {
                    aggregate_list.push({name: idx, value: aggregate_map[idx]});
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
                return self.humanizeNumber(d.get('unit_count'));
            });

        function processRelation(r) {
            var endpoints = r.get('endpoints'),
            rel_services = [];
            Y.each(endpoints, function(ep) {
                rel_services.push(services.filter(function(d) {
                    return d.get('id') == ep[0];
                })[0]);
            });
            return rel_services;
        }

        function processRelations(rels) {
            var pairs = [];
            Y.each(rels, function(rel) {
                var pair = processRelation(rel);
                // skip peer for now
                if (pair.length == 2) {
                    pairs.push({source: pair[0],
                               target: pair[1]});
                }

            });
            return pairs;
        }

        update_links();

    },

    /*
     * Draw a relation between services.  Polylines take a list of points
     * in the form "x y,( x y,)* x y"
     *
     * TODO For now, just draw a straight line; 
     * will eventually use A* to route around other services
     */
    draw_relation: function(relation) {
        return relation.source.x + ' ' +
            relation.source.y + ', ' +
            relation.target.x + ' ' + 
            relation.target.y;
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
