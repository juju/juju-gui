YUI.add("juju-view-charm-collection", function(Y) {

CharmCollectionView = Y.Base.create('CharmCollectionView', Y.View, [], {

    initializer: function () {
	console.log("View: Initialized: Charm Collection");
        this.set("charms", []);
    },

    template: Y.Handlebars.compile(Y.one("#t-charm-collection").getHTML()),

    render: function () {
	var container = this.get('container');
        CharmCollectionView.superclass.render.apply(this, arguments);
	container.setHTML(this.template());
        return this;
    }


});

Y.namespace("juju.views").charm_collection = CharmCollectionView;

}, "0.1.0", {
    requires: ['node', 
               'handlebars',
               'view']
});

