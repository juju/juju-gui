// This is a temp view to get the router working
// remove later, testing basic routing in App

YUI.add("juju-service", function(Y) {

var views = Y.namespace("juju.views");
            

ServiceView = Y.Base.create('ServiceView', Y.View, [], {

    initializer: function () {
        var template_src = Y.one("#t-service").getHTML();
        this.template = Y.Handlebars.compile(template_src); 
    },

    render: function () {
        var container = this.get('container'),
            m = this.get('domain_models'),
            service = this.get("service"),
            units = m.units.get_units_for_service(
                    service, true);
        console.log("ser", service.getAttrs());
        console.log("units", units.getAttrs());
        container.setHTML(this.template({
                service: service.getAttrs(),
                units: units.getAttrs()
        }));

        return this;
    }
});

views.service = ServiceView;
}, "0.1.0", {
    requires: ['d3', 
               'base-build', 
               'handlebars', 
               'node', 
               "view", 
               "json-stringify"]
});
