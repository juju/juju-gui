"use strict";

YUI.add("juju-view-unit", function(Y) {

var views = Y.namespace('juju.views'),
    models = Y.namespace("juju.models"),
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

        UnitView.superclass.render.apply(this, arguments);

        container.setHTML(this.template({
            unit: unit.getAttrs(),
            unit_ip_description: unit_ip_description,
            service: service.getAttrs(),
            machine: db.machines.getById(unit.get('machine')).getAttrs(),
            unit_running: unit.get('agent_state') == 'started'}));

        return this;
    }
});


views.unit = UnitView;

}, "0.1.0", {
    requires: ['d3',
               'base',
               'handlebars',
               'node',
               'view']

});
