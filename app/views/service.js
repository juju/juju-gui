YUI.add("juju-view-service", function(Y) {

var views = Y.namespace("juju.views"),
    Templates = views.Templates;

ServiceRelations = Y.Base.create('ServiceRelationsView', Y.View, [views.JujuBaseView], {

    initializer: function() {
        console.log("View: initialized: ServiceRelations");
    },

    template: Templates["service-relations"],

    render: function() {
        var container = this.get('container'),
                 self = this,
                    m = this.get('domain_models');
        var service = this.get('model');
        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'relations': service.get('rels'),
             'charm': service.get('charm').getAttrs()}
            ));
    }
});

views.service_relations = ServiceRelations;


ServiceConstraints = Y.Base.create("ServiceConstraintsView", Y.View, [views.JujuBaseView], {
    initializer: function() {
        console.log("View: initialized: ServiceConstraints");
    },

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
             'charm': service.get('charm').getAttrs()}
            ));
    }

});

views.service_constraints = ServiceConstraints;

ServiceConfigView = Y.Base.create('ServiceConfigView', Y.View, [views.JujuBaseView], {
    initializer: function () {
        console.log("View: initialized: ServiceConfig");
    },

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
        var charm_url = service.get('charm').get('id');
        console.log('charm', charm_url, m.charms.getById(charm_url));

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
             'charm': service.get('charm').getAttrs()}
            ));
    }
});

views.service_config = ServiceConfigView;

ServiceView = Y.Base.create('ServiceView', Y.View, [views.JujuBaseView], {

    initializer: function () {
        console.log("View: Initialized: Service");
    },

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
        var units = m.units.get_units_for_service(service),
            charm = m.charms.getById(service.get("charm"));
        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'charm': charm && charm.getAttrs() || {},
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
    },

    render_canvas: function() {
        var self = this,
            container = this.get('container'),
            m = this.get('domain_models'),
            service = this.get("model"),
            units = m.units.get_units_for_service(service),
            width = 800,
            height = 600;

        var pack = d3.layout.treemap()
            .sort(null)
            .size([256, 64])
            .value(function(d) { return 1; });


        var svg = d3.select(container.getDOMNode()).append("svg")
        .attr("width", width)
        .attr("height", height);

        var node = svg.selectAll("rect")
            .data(pack.nodes({children: units}).slice(1))
            .enter().append("g")
            .attr("class",  "unit")
            .attr("transform", function(d) {
                return "translate(" + d.x + ", " + d.y + ")";
        })
            .on("click", Y.bind(
                function(m) {
                    this.fire("showUnit", {unit: m})},
                this));

        node.append("rect")
            .attr("class", function(d) {
                    return self.stateToStyle(
                        d.get('agent_state'), 'unit-border');})
            .attr("width", function(d) {return d.dx;})
            .attr("height", function(d) {return d.dy;});

        var unit_labels = node.append("text").append("tspan")
            .attr("class", "name")
            .attr("x", 4)
            .attr("y", "1em")
            .text(function(d) {return d.get("id"); });

        var addr_labels = node.append("text").append("tspan")
            .attr("class", "address")
            .attr("x", 4)
            .attr("y", "3em")
            .text(function(d) {return d.get("public_address"); });

        return this;
    }
});

views.service = ServiceView;
}, "0.1.0", {
    requires: ['juju-views-utils',
               'd3',
               'base-build',
               'handlebars',
               'node',
               "view",
               "json-stringify"]
});
