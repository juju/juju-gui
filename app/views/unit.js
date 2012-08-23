YUI.add("juju-view-unit", function(Y) {

var views = Y.namespace("juju.views");

UnitView = Y.Base.create('UnitView', Y.View, [], {
    
    initializer: function () {
      console.log("view.init.unit", this.get('unit'));
    },

    render: function () {
      console.log("view.render.unit", this.get('unit').getAttrs());
      var container = this.get('container'),
          db = this.get('db'),
          unit = this.get("unit"),
          width = 800,
          height = 600;
      var svg = d3.select(container.getDOMNode()).append("svg")
        .attr("width", width)
        .attr("height", height);
    }
});


views.unit = UnitView;

}, "0.1.0", {
    requires: ['d3',
               'base',
               'handlebars',
               'node',
               "view"]

});
