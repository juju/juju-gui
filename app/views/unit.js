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
            service = db.services.getById(unit.service());

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
        if (unit.public_address) {
            ip_description_chunks.push(unit.public_address);
        }
        if (unit.private_address) {
            ip_description_chunks.push(unit.private_address);
        }
        if (unit.open_ports) {
            ip_description_chunks.push(unit.open_ports.join());
        }
        var unit_ip_description;
        if (ip_description_chunks.length) {
            unit_ip_description = ip_description_chunks.join(' | ');
        }

        var unit_error = /-error/.test(unit.agent_state),
            unit_running = unit.agent_state == 'started',
            unit_pending = !(unit_running || unit_error);

        container.setHTML(this.template({
            unit: unit,
            unit_ip_description: unit_ip_description,
            service: service.getAttrs(),
            charm: charm.getAttrs(),
            machine: db.machines.getById(unit.machine).getAttrs(),
            unit_error: unit_error,
            unit_running: unit_running,
            unit_pending: unit_pending}));

        return this;
    }
});


views.unit = UnitView;

}, '0.1.0', {
    requires: [
        'd3',
        'base',
        'handlebars',
        'node',
        'view']});
