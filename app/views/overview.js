YUI.add("juju-overview", function(Y) {

var views = Y.namespace("juju.views");
            
OverviewView = Y.Base.create('OverviewView', Y.View, [], {
   events: {
        '#show-status': {
            click: 'show_status'
        }
    },

    initializer: function () {
        this.publish("showStatus", {preventable: false});
    },
        
    template: Y.Handlebars.compile(Y.one("#t-example").getHTML()),

    render: function () {
        var container = this.get('container');
        OverviewView.superclass.render.apply(this, arguments);
                
        container.setHTML(this.template());
        this.render_canvas();
        return this;
    },

    render_canvas: function(){
	console.log('render canvas');
        var container = this.get('container'),
            m = this.get('domain_models'),
            height = 640,
            width = 480;

        var fill = d3.scale.category20();

        
        var services = m.services.toArray();
        
        var tree = d3.layout.force()
            .on("tick", tick)
            .charge(-400)
            .distance(25)
            .size([height, width]);

        var vis = d3.select(container.getDOMNode())
            .selectAll("#canvas")
            .append("svg:svg")
            .attr("pointer-events", "all")
            .attr("width", width)
            .attr("height", height);


        function tick() {
            // link.attr("x1", function(d) { return d.source.x; })
            //     .attr("y1", function(d) { return d.source.y; })
            //     .attr("x2", function(d) { return d.target.x; })
            //     .attr("y2", function(d) { return d.target.y; });
            
            node.attr("transform", function(d) { 
                          return "translate(" + d.x + "," + d.y + ")"; });

        };

        
        tree.nodes(services);
        var node = vis.selectAll(".service")
            .data(services)
            .enter().append("g")
            .call(tree.drag)
            .attr("class", "service");

        node.append("rect")
        .style("stroke", "black")
        .style("fill", "#c9c9c9")
        .attr("width", 120)
        .attr("height", 48);

        node.append("text")
            .attr("class", "name")
            .attr("x", 4)
            .attr("y", "1em")
            .text(function(d) {return d.get("id"); });
        
        node.append("text")
            .attr("x", 8)
            .attr("y", "2em")
            .attr("dy", ".71em")
            .text(function(d) {return d.get("charm").get("id"); });
        
        tree.start();
    },

    show_status: function(e) {
        this.fire("showStatus");
    }
});

views.overview = OverviewView;
}, "0.1.0", {
    requires: ['d3', 'base-build', 'handlebars', 'node', 'view']
});
