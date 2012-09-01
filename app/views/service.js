YUI.add("juju-view-service", function(Y) {

var views = Y.namespace("juju.views"),
    Templates = views.Templates;

BaseServiceView = Y.Base.create("BaseServiceView", Y.View, [views.JujuBaseView], {

    initializer: function() {
        console.log("View: initialized:", this.name);
        this.bindModelView();
    }

});
            

ServiceRelations = Y.Base.create('ServiceRelationsView', Y.View, [views.JujuBaseView], {

    template: Templates["service-relations"],

    render: function() {
        var container = this.get('container'),
                 self = this,
                    m = this.get('domain_models');
        var service = this.get('model');
        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'relations': service.get('rels'),
             'charm': this.renderable_charm(service.get('charm'), m)}
            ));
    }
});

views.service_relations = ServiceRelations;


ServiceConstraints = Y.Base.create("ServiceConstraintsView", Y.View, [views.JujuBaseView], {

    template: Templates["service-constraints"],

    render: function() {
        var container = this.get('container'),
                 self = this,
                    m = this.get('domain_models');
        service = this.get('model');
        var constraints = service.get('constraints');
        var display_constraints = [];

        for (var key in constraints) {
            display_constraints.push({'name': key, 'value': constraints[key]});
        }

        var generics = ["cpu", "mem", "arch"];
        for (var idx in generics) {
            var gkey = generics[idx];
            if (! (gkey in constraints)) {
                display_constraints.push({'name': gkey, 'value': ""});
            }
        }

        console.log('service constraints', display_constraints);
        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'constraints': display_constraints,
             "charm": this.renderable_charm(service.get('charm'), m)}
            ));
    }

});

views.service_constraints = ServiceConstraints;

ServiceConfigView = Y.Base.create('ServiceConfigView', Y.View, [views.JujuBaseView], {

    template: Templates["service-config"],

    render: function () {
        var container = this.get('container'),
                 self = this,
                    m = this.get('domain_models');
        var service = this.get('model');

        if (!service || !service.get('loaded')) {
            console.log('not connected / maybe');
            return this;
        }

        console.log('config', service.get('config'));
        var charm_url = service.get('charm');

        // combine the charm schema and the service values for display.
        var charm =  m.charms.getById(charm_url);
        var config = service.get('config');
        var schema = charm.get('config');

        settings = [];
        var field_def;

        for (var field_name in config) {
            field_def = schema[field_name];
            settings.push(Y.mix(
                {'name': field_name, 'value': config[field_name]}, field_def));
        }

        console.log("render view svc config", service.getAttrs(), settings);

        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'settings': settings,
             'charm': this.renderable_charm(service.get("charm"), m)}
            ));
    }
});

views.service_config = ServiceConfigView;

ServiceView = Y.Base.create('ServiceView', Y.View, [views.JujuBaseView], {

    template: Templates.service,

    render: function () {
        var container = this.get('container'),
                 self = this,
                    m = this.get('domain_models');
        var service = this.get('model');
        if (!service) {
            console.log('not connected / maybe');
            return this;
        }
        var units = m.units.get_units_for_service(service);

        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'charm': this.renderable_charm(service.get("charm"), m),
             'units': units.map(function(u) {
            return u.getAttrs();})
        }));
        //console.log(service.charm.getAttrs(), service.getAttrs())
        container.all('div.thumbnail').each(function( el ) {
            el.on("click", function(evt) {
                console.log("Click", this.getData('charm-url'));
                self.fire("showUnit", {unit_id: this.get('id')});
            });
        });
        return this;
    }
});

views.service = ServiceView;
}, "0.1.0", {
    requires: ['juju-view-utils',
               'd3',
               'base-build',
               'handlebars',
               'node',
               "view",
               "json-stringify"]
});
