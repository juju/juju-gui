YUI.add("juju-view-environment", function(Y) {

var views = Y.namespace("juju.views"),
    Templates = views.Templates;

EnvironmentView = Y.Base.create('EnvironmentView', Y.View, [views.JujuBaseView], {
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
        var relations = m.relations.getAttrs(["endpoints"]).endpoints;

        var tree = d3.layout.force()
            .on("tick", tick)
            .charge(-450)
            .distance(200)
            .friction(0)
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

        tree.nodes(services)
            .links(relations);

        var link = vis.selectAll("line.relation")
            .data(relations, function(d) {return d;});

        link.enter().insert("svg:line", "g.service")
            .attr("class", "relation")
            .attr("x1", function(d) {return d.source.x; })
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
        .attr("class", function(d) {
                  return self.stateToStyle(
                        d.get('agent_state'), 'service-border');})
        .attr("width", 164)
        .attr("height", 64);

        var service_labels = node.append("text").append("tspan")
            .attr("class", "name")
            .attr("x", 4)
            .attr("y", "1em")
            .text(function(d) {return d.get("id"); });

        var charm_labels = node.append("text").append("tspan")
            .attr("x", 4)
            .attr("y", "2.5em")
            .attr("dy", "3em")
            .attr("class", "charm-label")
            .text(function(d) {
                      return d.get("charm").get("id"); });

        var unit_count = node.append("text")
        .attr("class", "unit-count")
        .attr("dx", "4em")
        .attr("dy", "1em")
        .text(function(d) {
                  var units = m.units.get_units_for_service(d);
                  return units.length;
              });

        // console.log("charm labels", charm_labels[0]);
        // Y.each(charm_labels[0], function (e) {
        //         console.log("e", e.getBoundingClientRect());
        //         var node = Y.Node(e);
        //         console.log("node", node);
        //         console.log("rect", node.getClientRect());
        // });

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
