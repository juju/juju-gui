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
        var container = this.get('container'),
            m = this.get('domain'),
            height = 640,
            width = 480;

        // container.one("#canvas").setHTML(
        //     m.services.getAsHTML("id").toString());

        var fill = d3.scale.category20();

        var tree = d3.layout.tree()
        .separation(function(a, b) { return a.parent === b.parent ? 1 : .5; })
        //.children(function(d) { return d.parents; })
        .size([height, width]);
        
        var services = m.services.toArray();
        
        var vis = d3.select("#canvas")
            .append("svg:svg")
            .attr("pointer-events", "all")
            .attr("width", width)
            .attr("height", height)
            .append("g");

        console.log("services", services);
        var node = vis.selectAll(".service")
            .data(services, function(d) {
                      console.log("Data", d);
                      return d;
                  })
            .enter().append("g")
            .attr("class", "service")
            .attr("transform", function(d) { 
                      return "translate(" + d.y + "," + d.x + ")"; });

        console.log(node);

        node.append("text")
            .attr("class", "name")
            .attr("x", 8)
            .attr("y", -6)
            .text(function(d) { 
                      console.log("text", d); 
                      return d.get("id"); });
        
        node.append("text")
            .attr("x", 8)
            .attr("y", 8)
            .attr("dy", ".71em")
            .text(function(d) { return d.get("charm").get("name"); });
        
                        
    },

    show_status: function(e) {
        this.fire("showStatus");
    }
});

views.overview = OverviewView;
}, "0.1.0", {
    requires: ['d3', 'base-build', 'handlebars', 'node', 'view']
});
