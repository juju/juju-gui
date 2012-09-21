'use strict';

YUI.add('juju-view-unit', function(Y) {

  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      Templates = views.Templates;

  var UnitView = Y.Base.create('UnitView', Y.View, [], {
    initializer: function() {
      console.log('view.init.unit', this.get('unit'));
    },

    template: Templates.unit,

    render: function() {
      var container = this.get('container');
      console.log('view.render.unit');
      var unit = this.get('unit');
      if (!unit) {
        container.setHTML('<div class="alert">Loading...</div>');
        console.log('waiting on unit data');
        return this;
      }

      var db = this.get('db'),
          service = db.services.getById(unit.service);

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
          unit_running = unit.agent_state === 'started',
          unit_pending = !(unit_running || unit_error);

      container.setHTML(this.template({
        unit: unit,
        unit_ip_description: unit_ip_description,
        service: service.getAttrs(),
        disabled_remove: service.get('unit_count') <= 1,
        charm: charm.getAttrs(),
        machine: db.machines.getById(unit.machine).getAttrs(),
        unit_error: unit_error,
        unit_running: unit_running,
        unit_pending: unit_pending}));
      return this;
    },

    events: {
      '#resolved-unit-button': {click: 'confirmResolved'},
      '#retry-unit-button': {click: 'retry'},
      '#remove-unit-button': {click: 'confirmRemoved'}
    },

    confirmResolved: function(ev) {
      // We wait to make the panel until now, because in the render method
      // the container is not yet part of the document.
      if (Y.Lang.isUndefined(this.resolved_panel)) {
        this.resolved_panel = views.createModalPanel(
            'Are you sure you want to tell the system this problem has been ' +
            'resolved?  This action cannot be undone.',
            '#resolved-modal-panel',
            'Error Has Been Resolved',
            Y.bind(this.doResolvedUnit, this));
      }
      this.resolved_panel.show();
    },

    doResolvedUnit: function(ev) {
      ev.preventDefault();
      var env = this.get('env'),
          unit = this.get('unit');
      ev.target.set('disabled', true);
      env.resolved(unit.id, null, false,
                     Y.bind(this._doResolvedUnitCallback, this, ev.target));
    },

    _doResolvedUnitCallback: function(button, ev) {
      // XXX Once we have a way of showing notifications, if ev.err exists,
      // report it.
      button.set('disabled', false);
      this.resolved_panel.hide();
    },

    confirmRemoved: function(ev) {
      // We wait to make the panel until now, because in the render method
      // the container is not yet part of the document.
      ev.preventDefault();
      var unit = this.get('unit'),
          service = this.get('db').services.getById(unit.service);
      if (Y.Lang.isUndefined(this.remove_panel)) {
        this.remove_panel = views.createModalPanel(
            'Are you sure you want to remove this unit?  ' +
                'This action cannot be undone, though you can ' +
                'simply add another unit later.',
            '#remove-modal-panel',
            'Remove Unit',
            Y.bind(this.doRemoveUnit, this));
      }
      this.remove_panel.show();
    },

    doRemoveUnit: function(ev) {
      ev.preventDefault();
      var env = this.get('env'),
          unit = this.get('unit');
      ev.target.set('disabled', true);
      env.remove_units(
          [unit.id],
          Y.bind(this._doRemoveUnitCallback, this));
    },

    _doRemoveUnitCallback: function(ev) {
      // XXX Once we have a way of showing notifications, if ev.err exists,
      // report it.
      var unit = this.get('unit'),
          db = this.get('db'),
          service = db.services.getById(unit.service),
          unit_name = ev.unit_names[0];
      db.units.remove(db.units.getById(unit_name));
      service.set('unit_count', service.get('unit_count') - 1);
      this.remove_panel.destroy();
      this.fire('showService', {service: service});
    },

    retry: function(ev) {
      ev.preventDefault();
      var env = this.get('env'),
          unit = this.get('unit'),
          button = ev.target;
      button.set('disabled', true);
      env.resolved(unit.id, null, true,
          function(ev) {
            // XXX Once we have a way of showing notifications, if
            // ev.err exists, report it.  Similarly, otherwise,
            // generate a success notification.
            button.set('disabled', false);}
      );
    }

  });


  views.unit = UnitView;

}, '0.1.0', {
  requires: [
    'd3',
    'base',
    'handlebars',
    'node',
    'juju-view-utils',
    'view']});
