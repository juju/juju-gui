YUI.add("juju-overview", function(Y) {

var JUJU = Y.namespace("juju"),
    views = Y.namespace("juju.views");
            

OverviewView = Y.Base.create('OverviewView', Y.View, [], {
   events: {
        'button': {
            click: 'changeUser'
        },

        'input': {
            keypress: 'enter'
        }
    },

    initializer: function () {
    },

    render: function () {
            OverviewView.superclass.render.apply(this, arguments);

            var container = this.get('container'),
                template = Y.Handlebars.compile(Y.one("#t-example").getHTML());
                        
            container.setHTML(template());
            var dd = new Y.DD.Drag({node: container});
            return this;
    }
});

JUJU.views.overview = OverviewView;
}, "0.1.0", {
    requires: ['base-build', 'dd', 'handlebars', 'node', "view"]
});
