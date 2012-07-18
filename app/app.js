YUI.add("juju-gui", function(Y) {
//   var JUJU = Y.JUJU,
       

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
            var container = this.get('container'),
                template = Y.Handlebars.compile(Y.one("#t-example").getHTML());
                        
            container.setHTML(template());
            var dd = new Y.DD.Drag({node: container});
            return this;
    }
});


JujuGUI = Y.Base.create("juju-gui", Y.App, [], {
    views: {
        overview: {
            type: OverviewView,
            preserve: true
        }
    },

    transitions: {
        navigate: 'fade',
        toChild: 'fade',
        toParent: 'fade'
    },
                         
    initializer: function () {        
        this.once('ready', function (e) {
            if (this.hasRoute(this.getPath())) {
                this.dispatch();
            } else {
                this.showOverview();
            }
        });
    },


    showOverview: function (req) {
        this.showView('overview', {});
    }

}, {
    ATTRS: {
        routes: [
            {path: "/", callback: 'showOverview'}
        ]
    }
});

}, "0.5.2", {
       requires: [
       'app-base',
       'app-transitions',
       'handlebars',
       'node',
       'base-build',
       'dd'
       ]
});