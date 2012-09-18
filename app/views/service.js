'use strict';

YUI.add('juju-view-service', function(Y) {

var views = Y.namespace('juju.views'),
    Templates = views.Templates;

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


    events: {
        '#save-service-config': {click: 'saveConfig'},
        '.alert > .close': {click: 'closeAlert'}},


    render: function () {
        var container = this.get('container'),
          db = this.get('db'),
          service = this.get('service');

        if (!service || !service.get('loaded')) {
            console.log('not connected / maybe');
            return this;
        }

        console.log('config', service.get('config'));
        var charm_url = service.get('charm');

        // combine the charm schema and the service values for display.
        var charm = db.charms.getById(charm_url);
        var config = service.get('config');
        var schema = charm.get('config');

        var settings = [];
        var field_def;

        for (var field_name in schema) {
            field_def = schema[field_name];
            settings.push(Y.mix(
                {'name': field_name, 'value': config[field_name]}, field_def));
        }

        console.log('render view svc config', service.getAttrs(), settings);

        container.setHTML(this.template(
            {service: service.getAttrs(),
             settings: settings,
             charm: this.renderable_charm(service.get('charm'), db)}
            ));

        return this;
    },

    saveConfig: function() {
        var env = this.get('env'),
            container = this.get('container'),
            service = this.get('service'),
            config = {};

        // Disable the "Update" button while the RPC call is outstanding.
        container.one('#save-service-config').set('disabled', 'disabled');

        container.all('.config-field').each(function(el) {
            config[el.get('name')] = el.get('value');
        });

        env.set_config(service.get('id'), config,
            Y.bind(this._saveConfigCallback, this));

    },

    _addErrorMessage: function(container, message) {
        container.one('#message-area')
            .appendChild(Y.Node.create('<div/>'))
                .addClass('alert')
                .addClass('alert-error')
                .set('text', message)
            .appendChild(Y.Node.create('<a/>'))
                .addClass('close')
                .set('text', '×');
    },

    _serverErrorMessage: 'An error ocurred.',

    _saveConfigCallback: function(ev) {
        var service = this.get('service'),
            container = this.get('container'),
            db = this.get('db');

        if (ev && ev.err) {
            this._addErrorMessage(container, this._serverErrorMessage);
            return;
        }

        container.all('.config-field').each(function(el) {
            service.get('config')[el.get('name')] = el.get('value');
        });

        container.one('#save-service-config').removeAttribute('disabled');
    },

    closeAlert: function(ev) {
        ev.target.get('parentNode').remove();
    }
});

views.service_config = ServiceConfigView;

var ServiceView = Y.Base.create('ServiceView', Y.View, [views.JujuBaseView], {

    template: Templates.service,

    render: function () {
        console.log('service view render');

        var container = this.get('container'),
                 self = this,
                    m = this.get('domain_models');
        var service = this.get('model');
        if (!service) {
            console.log('not connected / maybe');
            return this;
        }
        var units = m.units.get_units_for_service(service);
        console.log('units', units);
        console.log('container', container);

        container.setHTML(this.template(
            {'service': service.getAttrs(),
             'charm': this.renderable_charm(service.get('charm'), m),
             'units': units.map(function(u) {
            return u.getAttrs();})
        }));
        container.all('div.thumbnail').each(function( el ) {
            el.on('click', function(evt) {
                console.log('Click', this.getData('charm-url'));
                self.fire('showUnit', {unit_id: this.get('id')});
            });
        });

        return this;
    }
});

views.service = ServiceView;
}, '0.1.0', {
    requires: ['juju-view-utils',
               'd3',
               'base-build',
               'handlebars',
               'node',
               'view',
               'json-stringify']
});
