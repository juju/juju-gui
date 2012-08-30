YUI.add("juju-view-utils", function(Y) {

var views = Y.namespace("juju.views");

JujuBaseView = Y.Base.create('JujuBaseView', Y.Base, [], {

    initializer: function() {
        console.log("View: initialized: ", this.name);
    },

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
        return Y.namespace("juju").AppInstance;
    },

    renderable_charm: function(charm_name) {
        var db = this.getApp().db, 
            charm = db.charms.getById(charm_name);
        if (charm) {
            console.log("RENDER CHARM", charm.getAttrs());
            return charm.getAttrs();
        }
        return null;
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
    },

    humanizeNumber: function(n) {
        var units = [ [1000, 'K'], 
                      [1000000, 'M'],
                      [1000000000, 'B']],
            result = n;

        Y.each(units, function(sizer) {
                var threshold = sizer[0],
                    unit = sizer[1];
                   if(n > threshold) {
                    result = (n / threshold);
                    if (n % threshold != 0) {
                        result = result.toFixed(1);
                    }
                    result = result + unit;
                }
        });
        return result;
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
