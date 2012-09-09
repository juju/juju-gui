"use strict";

YUI.add("juju-view-environment", function(Y) {

var views = Y.namespace("juju.views"),
    Templates = views.Templates;

var EnvironmentView = Y.Base.create('EnvironmentView', Y.View, [views.JujuBaseView], {
    events: {},

    initializer: function () {
        console.log("View: Initialized: Env");
        this.publish("showService", {preventable: false});
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
            height = 600,
            width = 800;

        var fill = d3.scale.category20();
        var services = m.services.toArray();
        var relations = m.relations.toArray();

        // Scales for unit sizes
        // XXX magic numbers will have to change; likely during
        // the pan/zoom work
        var service_scale_width = d3.scale.log().range([164, 200]);
        var service_scale_height = d3.scale.log().range([64, 100]);

        var tree = d3.layout.force()
            .on("tick", tick)
            .charge(-450)
            .gravity(0.05)
            .distance(200)
            .friction(0.5)
            .size([width, height]);

        var vis = d3.select(container.getDOMNode())
            .selectAll("#canvas")
            .append("svg:svg")
            .attr("pointer-events", "all")
            .attr("width", width)
            .attr("height", height);


        function tick() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("transform", function(d) {
                          return "translate(" + d.x + "," + d.y + ")"; });
        }

        function processRelation(r) {
            var endpoints = r.get('endpoints'),
            rel_services = [];
            Y.each(endpoints, function(ep) {
                rel_services.push(m.services.getById(ep[0]));
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

        var rel_data = processRelations(relations);
        tree.nodes(services)
            .links(rel_data);

        var link = vis.selectAll("path.relation")
            .data(rel_data,
                  function(d) {return d;});

        link.enter().insert("svg:line", "g.service")
            .attr("class", "relation")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        var node = vis.selectAll(".service")
            .data(services)
            .enter().append("g")
            .call(tree.drag)
            .attr("class", "service")
            .on("click", function(m) {
                    self.fire("showService", {service: m});
            });


        node.append("rect")
        .attr("class", "service-border")
        .attr("width", function(d) {
            return service_scale_width(d.get('unit_count')); })
        .attr("height", function(d) {
            return service_scale_height(d.get('unit_count')); });

        var service_labels = node.append("text").append("tspan")
            .attr("class", "name")
            .attr("x", 54)
            .attr("y", "1em")
            .text(function(d) {return d.get("id"); });

        var charm_labels = node.append("text").append("tspan")
            .attr("x", 54)
            .attr("y", "2.5em")
            .attr("dy", "3em")
            .attr("class", "charm-label")
            .text(function(d) {
                      return d.get("charm"); });

        var status_chart_arc = d3.svg.arc()
            .innerRadius(10)
            .outerRadius(25);
        var status_chart_layout = d3.layout.pie()
            .value(function(d) { return (d.value ? d.value : 1); });

        var status_chart = node.append("g")
            .attr("class", "service-status")
            .attr("transform", "translate(30,32)");
        var status_arcs = status_chart.selectAll("path")
            .data(function(d) {
                var aggregate_map = d.get('aggregated_status'),
                    aggregate_list = [];

                for (var idx in aggregate_map) {
                    aggregate_list.push({name: idx, value: aggregate_map[idx]});
                }

                return status_chart_layout(aggregate_list);
            })
            .enter().append("path")
            .attr("d", status_chart_arc)
            .attr("class", function(d) { return "status-" + d.data.name; })
            .attr("fill-rule", "evenodd")
            .append("title").text(function(d) {
                return d.data.name;
            });

        // Add the unit counts, visible only on hover
        var unit_count = status_chart.append("text")
            .attr("class", "unit-count hide-count")
            .on("mouseover", function() {
                d3.select(this).attr("class", "unit-count show-count");
            })
            .on("mouseout", function() {
                d3.select(this).attr("class", "unit-count hide-count");
            })
            .text(function(d) {
                return self.humanizeNumber(d.get('unit_count'));
            });

        tree.start();
    }

});

views.environment = EnvironmentView;
}, "0.1.0", {
    requires: ['juju-templates',
               'juju-view-utils',
               'd3',
               'base-build',
               'handlebars-base',
               'node',
               'view']
});
