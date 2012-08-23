YUI.add("juju-view-utils", function(Y) {

var views = Y.namespace("juju.views");

JujuBaseView = Y.Base.create('JujuBaseView', Y.Base, [], {

    bindModelView: function(model) {
        model = model || this.get('model');
        // If this view has a model, bubble model events to the view.
        model && model.addTarget(this);

        // If the model gets swapped out, reset targets accordingly.
        this.after('modelChange', function (ev) {
            ev.prevVal && ev.prevVal.removeTarget(this);
            ev.newVal && ev.newVal.addTarget(this);
        });

        // Re-render this view when the model changes.
        this.after('*:change', this.render, this);
    },

    getApp: function() {
        var event_targets = this.getTargets();
        console.log(event_targets)
        for (var et in event_targets) {
            if (et.name == "juju-gui") {
                return et;
            }
        }

    },

    stateToStyle: function(state, current) {
        // todo also check relations
        var classes;
        switch (state) {
        case "pending":
            classes = "state-pending";
                break;
        case "started":
                classes = "state-started";
                break;
        case "start_error":
            classes = "state-error";
                break;
        case "install_error":
            classes = "state-error";
                break;
        default:
            Y.log("Unhandled agent state: " + state, "debug");
        }
        classes = current && classes + " " + current || classes;
        return classes;
    }
});

views.JujuBaseView = JujuBaseView;
}, "0.1.0", {
    requires: ['base-build',
               'handlebars',
               'node',
               "view",
               "json-stringify"]
});
