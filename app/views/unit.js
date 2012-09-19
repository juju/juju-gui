'use strict';

YUI.add('juju-view-unit', function(Y) {

var views = Y.namespace('juju.views'),
    models = Y.namespace('juju.models'),
    Templates = views.Templates;

var UnitView = Y.Base.create('UnitView', Y.View, [], {
    initializer: function () {
      console.log('view.init.unit', this.get('unit'));
    },

    template: Templates.unit,

    render: function () {
        var container = this.get('container');
        console.log('view.render.unit');
        var unit = this.get('unit');
        if (!unit) {
            container.setHTML('<div class="alert">Loading...</div>');
            console.log('waiting on unit data');
            return this;
        }

        var db = this.get('db'),
            service = db.services.getById(unit.get('service'));

        if (!service.get('loaded')) {
            container.setHTML('<div class="alert">Loading...</div>');
            console.log('waiting on service data');
            return this;
        }

        var charm = db.charms.getById(service.get('charm'));

        if (!charm) {
            container.setHTML('<div class="alert">Loading...</div>');
            console.log('waiting on charm data');
            return this;
        }

        UnitView.superclass.render.apply(this, arguments);

        var ip_description_chunks = [];
        if (unit.get('public_address')) {
            ip_description_chunks.push(unit.get('public_address'));
        }
        if (unit.get('private_address')) {
            ip_description_chunks.push(unit.get('private_address'));
        }
        if (unit.get('open_ports')) {
            ip_description_chunks.push(unit.get('open_ports').join());
        }
        var unit_ip_description;
        if (ip_description_chunks.length) {
            unit_ip_description = ip_description_chunks.join(' | ');
        }

        var unit_error = /-error/.test(unit.get('agent_state')),
            unit_running = unit.get('agent_state') == 'started',
            unit_pending = !(unit_running || unit_error);

        container.setHTML(this.template({
            unit: unit.getAttrs(),
            unit_ip_description: unit_ip_description,
            service: service.getAttrs(),
            charm: charm.getAttrs(),
            machine: db.machines.getById(unit.get('machine')).getAttrs(),
            unit_error: unit_error,
            unit_running: unit_running,
            unit_pending: unit_pending}));
        return this;
    },

    events: {
        '#resolved-unit-button': {click: 'confirmResolved'}
    },

    confirmResolved: function (ev) {
        // We wait to make the panel until now, because in the render method
        // the container is not yet part of the document.
        if (Y.Lang.isUndefined(this.resolved_panel)) {
            this.resolved_panel = views.createModalPanel(
                'Are you sure you want to tell the system this problem has been ' +
                    'resolved?  This action cannot be undone.',
                '#resolved-modal-panel',
                'Resolved Unit',
                Y.bind(this.resolvedUnit, this));
        }
        this.resolved_panel.show();
    },

    resolvedUnit: function(ev) {
        ev.preventDefault();
        var env = this.get('env'),
            unit = this.get('unit');
        ev.target.set('disabled', true);
        env.resolved(unit.get('id'), null, false,
                     Y.bind(this._resolvedUnitCallback, this));
    },

    _resolvedUnitCallback: function(ev) {
        this.resolved_panel.hide();
    }

});


views.unit = UnitView;

}, '0.1.0', {
    requires: [
        'd3',
        'base',
        'handlebars',
        'node',
        'panel',
        'juju-view-utils',
        'view']});
