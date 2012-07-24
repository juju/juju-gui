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
            OverviewView.superclass.render.apply(this, arguments);

            var container = this.get('container');
            container.setHTML(this.template());
            var dd = new Y.DD.Drag({node: container});
            return this;
    },

    show_status: function(e) {
        this.fire("showStatus");
    }
});

views.overview = OverviewView;
}, "0.1.0", {
    requires: ['base-build', 'dd', 'handlebars', 'node', "view"]
});
