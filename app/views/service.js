YUI.add("juju-view-service", function(Y) {

var views = Y.namespace("juju.views");
            

ServiceView = Y.Base.create('ServiceView', Y.View, [views.JujuBaseView], {

    initializer: function () {
	console.log("View: Initialized: Service");
        this.bindModelView();
    },

    render: function () {
        var self = this, 
            container = this.get('container'),
            m = this.get('domain_models'),
            service = this.get("model"),
            units = m.units.get_units_for_service(service),
            width = 800,
            height = 600;

        var pack = d3.layout.treemap()
            .sort(null)
            .size([256, 64])
            .value(function(d) { return 1; });


        var svg = d3.select(container.getDOMNode()).append("svg")
        .attr("width", width)
        .attr("height", height);

        var node = svg.selectAll("rect")
            .data(pack.nodes({children: units}).slice(1))
            .enter().append("g")
            .attr("class",  "unit")
            .attr("transform", function(d) {
                return "translate(" + d.x + ", " + d.y + ")";
	    })
	    .on("click", Y.bind(
		function(m) {
		    console.log("clicked me", this, m);
		    this.fire("showUnit", {unit: m})},
		this));

        node.append("rect")
            .attr("class", function(d) {
                    return self.stateToStyle(
                        d.get('agent_state'), 'unit-border');})
            .attr("width", function(d) {return d.dx;})
            .attr("height", function(d) {return d.dy;});

        var unit_labels = node.append("text").append("tspan")
            .attr("class", "name")
            .attr("x", 4)
            .attr("y", "1em")
            .text(function(d) {return d.get("id"); });

        var addr_labels = node.append("text").append("tspan")
            .attr("class", "address")
            .attr("x", 4)
            .attr("y", "3em")
            .text(function(d) {return d.get("public_address"); });

        return this;
    }
});

views.service = ServiceView;
}, "0.1.0", {
    requires: ['juju-views-utils',
               'd3', 
               'base-build', 
               'handlebars', 
               'node', 
               "view",
               "json-stringify"]
});
