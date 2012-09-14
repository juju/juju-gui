'use strict';


YUI.add('juju-view-service', function(Y) {

var ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;


var views = Y.namespace('juju.views'),
    Templates = views.Templates,
    models = Y.namespace('juju.models');

var BaseServiceView = Y.Base.create('BaseServiceView', Y.View, [views.JujuBaseView], {

    initializer: function() {
        console.log('View: initialized:', this.name);
        this.bindModelView();
    }

});


var ServiceRelations = Y.Base.create('ServiceRelationsView', Y.View, [views.JujuBaseView], {

    template: Templates['service-relations'],

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


var ServiceConstraints = Y.Base.create('ServiceConstraintsView', Y.View, [views.JujuBaseView], {

    template: Templates['service-constraints'],

    render: function() {
        var container = this.get('container'),
                 self = this,
                    m = this.get('domain_models');
        var service = this.get('model');
        var constraints = service.get('constraints');
        var display_constraints = [];

        for (var key in constraints) {
            display_constraints.push({'name': key, 'value': constraints[key]});
        }

        var generics = ['cpu', 'mem', 'arch'];
        for (var idx in generics) {
            var gkey = generics[idx];
            if (! (gkey in constraints)) {
                display_constraints.push({'name': gkey, 'value': ''});
            }
        }

        console.log('service constraints', display_constraints);
        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'constraints': display_constraints,
             'charm': this.renderable_charm(service.get('charm'), m)}
            ));
    }

});

views.service_constraints = ServiceConstraints;

var ServiceConfigView = Y.Base.create('ServiceConfigView', Y.View, [views.JujuBaseView], {

    template: Templates['service-config'],

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

        var settings = [];
        var field_def;

        for (var field_name in config) {
            field_def = schema[field_name];
            settings.push(Y.mix(
                {'name': field_name, 'value': config[field_name]}, field_def));
        }

        console.log('render view svc config', service.getAttrs(), settings);

        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'settings': settings,
             'charm': this.renderable_charm(service.get('charm'), m)}
            ));
    }
});

views.service_config = ServiceConfigView;

var ServiceView = Y.Base.create('ServiceView', Y.View, [views.JujuBaseView], {

    template: Templates.service,

    render: function () {
        var container = this.get('container'),
                   db = this.get('domain_models'),
              service = this.get('model'),
                  env = this.get('env');

        if (!service) {
            console.log('not connected / maybe');
            return this;
        }
        var units = db.units.get_units_for_service(service);
        units.sort(function(a,b) {
            return a.get('number') - b.get('number');
        });

        var charm_name = service.get('charm');
        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'charm': this.renderable_charm(charm_name, db),
             'units': units.map(function(u) {
                 return u.getAttrs();})
        }));
        container.all('div.thumbnail').each(function( el ) {
            el.on('click', function(evt) {
                console.log('Click', this.getData('charm-url'));
                this.fire('showUnit', {unit_id: this.get('id')});
            });
        });
        return this;
    },

    events: {
        '#add-service-unit': {click: 'addUnit'},
        '#rm-service-unit': {click: 'removeUnit'},
        '#num-service-units': {keydown: 'modifyUnits'}
    },

    applyUnitDeltas: function(prev_num_units, requested_num_units) {
        var num_delta = requested_num_units - prev_num_units,
            container = this.get('container'),
            field = container.one('#num-service-units'),
            service = this.get('model'),
            env = this.get('env');

        if (num_delta > 0) {
            // Add units.
            env.add_unit(
                service.get('id'), num_delta, Y.bind(this._addUnitCallback,
                                                     this));
            field.set('value', requested_num_units);
        } else if (num_delta < 0) {


            if (requested_num_units < 1) {
                console.log('Requested number of units < 1: ', requested);
                // Reset the field to the previous value.
                field.set('value', prev_num_units);
            } else {
                // Remove units.
                var db = this.get('domain_models'),
                    units = db.units.get_units_for_service(service),
                    units_to_remove = [],
                    delta = Math.abs(num_delta);

                for (var i=units.length;
                     units_to_remove.length < delta && i > 0;
                     i--) {
                    var unit = units[i - 1];
                    if (unit.get('agent_state') !== 'stopping') {
                        unit.set('agent_state', 'stopping');
                        units_to_remove.push(unit.get('id'));
                    }
                }

                // Set the widget value and the service unit count.
                service.set('unit_count', requested_num_units);
                field.set('value', requested_num_units);
                env.remove_units(unit_to_remove);
                db.fire('update');
            }
        }

    },

    addUnit: function(ev) {
        var container = this.get('container'),
            field = container.one('#num-service-units'),
            existing_value = parseInt(field.get('value'), 10),
            new_value = existing_value + 1;
        console.log('Click add-service-unit');
        this.applyUnitDeltas(existing_value, new_value);
    },

    _addUnitCallback: function(ev) {
        var db = this.get('domain_models'),
            service = this.get('model'),
            service_id = service.get('id'),
            unit_names = ev.result;
        console.log('_addUnitCallback with: ', arguments);
        // Received acknowledgement message for the 'add_units' operation.
        // ev.results is an array of the new units to be created.  Pro-actively
        // add them to the database so they display as soon as possible.
        db.units.add(
            Y.Array.map(unit_names, function(unit_name) {
                return new models.ServiceUnit(
                    {id: unit_name,
                     agent_state: 'pending',
                     service: service_id});
            })
        );
        // Set the (-) button to be enabled (whether it needs it or not).
        container.one('#rm-service-unit').set('disabled', false);
        service.set('unit_count', service.get('unit_count') + unit_names.length);
        db.fire('update');
    },

    removeUnit: function(ev) {
        var container = this.get('container'),
            field = container.one('#num-service-units'),
            existing_value = parseInt(field.get('value'), 10),
            env = this.get('env'),
            db = this.get('domain_models'),
            service = this.get('model'),
            units = db.units.get_units_for_service(service);
        if (existing_value > 1) {
            console.log('Click rm-service-unit');
            // This resets after a juju diff, which is not a good UX.
            // field.set('value', existing_value - 1);

            // Assuming units is sorted in ascending order.  Find the highest
            // numbered one that is not in 'stopping' state.
            var unit, u;
            while (Y.Lang.isUndefined(unit)) {
                u = units.pop();
                if (u.get('agent_state') != 'stopping') {
                    unit = u;
                }
            }
            this.applyUnitDeltas({remove_units: [unit.get('id')]});
        }
        // XXX else...notify the user that we won't do this! They should
        // delete the service instead.
    },

    modifyUnits: function (ev) {
        // XXX: see event-key module.
        if (ev && ev.keyCode != ENTER) { // If not Enter keyup...
            return;
        }
        ev.halt(true);
        var container = this.get('container'),
            field = container.one('#num-service-units'),
            requested = parseInt(field.get('value'), 10),
            service = this.get('model'),
            env = this.get('env'),
            db = this.get('domain_models'),
            units = db.units.get_units_for_service(service).reverse();

        this.applyUnitDeltas(service.get('unit_count'), requested);

    }
});

views.service = ServiceView;
}, '0.1.0', {
    requires: ['juju-view-utils',
               'juju-models',
               'base-build',
               'handlebars',
               'node',
               'view',
               'event-key',
               'json-stringify']
});
