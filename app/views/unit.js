YUI.add("juju-view-unit", function(Y) {

var views = Y.namespace("juju.views"),
    Templates = views.Templates;

UnitView = Y.Base.create('UnitView', Y.View, [], {
    initializer: function () {
      console.log("view.init.unit", this.get('unit'));
    },

    template: Templates["unit"],

    render: function () {
	console.log("view.render.unit", this.get('unit'));
	var container = this.get('container'),
            db = this.get('db'),
            unit = this.get("unit");
	UnitView.superclass.render.apply(this, arguments);

	if (! this.get('unit')) {
            container.setHTML('<div class="alert">Loading...</div>');
	    return this;
	}; 

	container.setHTML(this.template(
	    {'unit': this.get('unit')}));
	return this;
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
