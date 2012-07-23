YUI.add("juju-gui", function(Y) {

var models = Y.namespace("juju.models");

JujuGUI = Y.Base.create("juju-gui", Y.App, [], {
    views: {
        overview: {
            type: "juju.views.overview",
            preserve: true
        }
    },

    transitions: {
        navigate: 'fade',
        toChild: 'fade',
        toParent: 'fade'
    },
                         
    initializer: function () {        
        this.get_sample_data();

        this.once('ready', function (e) {
            if (this.hasRoute(this.getPath())) {
                this.dispatch();
            } else {
                this.show_overview();
            }
        });
    },

    get_sample_data: function() {
        Y.io("status.json", {on: {
        complete: function(id, response) {
            this.status = Y.JSON.parse(response.responseText);
        }}});

        var c1 = new models.Charm({name: "mysql"}),
            c2 = new models.Charm({name: "logger"});
        var list = new models.CharmList().add([c1, c2]);
        this.charms = list;


    },

    show_overview: function (req) {
        this.showView('overview', {});
    }


}, {
    ATTRS: {
        routes: [
            {path: "/", callback: 'show_overview'}
        ]
    }
});

Y.namespace("juju").App = JujuGUI;

}, "0.5.2", {
       requires: [
       'app-base',
       'app-transitions',
       'node',
       'base',
       "json-parse",
       "io",
       "juju-models",
       "juju-views"
       ]
});