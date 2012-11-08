'use strict';
/**
 * The unit view(s).
 *
 * @module views
 * @submodule unit
 */

YUI.add('juju-view-unit', function(Y) {

  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils'),
      Templates = views.Templates;

  /**
   * Display a unit.
   *
   * @class UnitView
   * @namespace views.unit
   */
  var UnitView = Y.Base.create('UnitView', Y.View, [], {
    initializer: function() {
      console.log('view.init.unit', this.get('unit'));
    },

    template: Templates.unit,

    /**
     * Render the view.
     *
     * @method render
     * @chainable
     */
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

      var relation_errors = unit.relation_errors || {},
          relations = utils.getRelationDataForService(db, service),
          querystring = this.get('querystring');

      Y.each(relations, function(rel) {
        // relation_errors example: {'website': ['haproxy'], 'db': ['mysql']}
        var match = relation_errors[rel.near.name],
            far = rel.far || rel.near;
        rel.has_error = !!(match && match.indexOf(far.service) > -1);
        rel.highlight = !!(
            querystring.rel_id && querystring.rel_id === rel.relation_id);
      });

      container.setHTML(this.template({
        unit: unit,
        unit_ip_description: unit_ip_description,
        service: service.getAttrs(),
        disabled_remove: service.get('unit_count') <= 1,
        charm: charm.getAttrs(),
        machine: db.machines.getById(unit.machine),
        unit_error: unit_error,
        unit_running: unit_running,
        unit_pending: unit_pending,
        relations: relations}));
      return this;
    },

    events: {
      '#resolved-unit-button': {click: 'confirmResolved'},
      '#retry-unit-button': {click: 'retry'},
      '#remove-unit-button': {click: 'confirmRemoved'},
      '.resolved-relation-button': {click: 'confirmResolvedRelation'},
      '.retry-relation-button': {click: 'retryRelation'}
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
                     Y.bind(this._resolvedUnitCallback, this, ev.target));
    },

    _resolvedUnitCallback: function(button, ev) {
      var unit = this.get('unit'),
          db = this.get('db'),
          getModelURL = this.get('getModelURL'),
          service = db.services.getById(unit.service);
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error resolving unit',
              message: 'Unit name: ' + ev.unit_name,
              level: 'error',
              link: getModelURL(unit),
              modelId: unit
            })
        );
      } else {
        this.resolved_panel.hide();
      }
      button.set('disabled', false);
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
          Y.bind(this._removeUnitCallback, this, ev.target));
    },

    _removeUnitCallback: function(btn, ev) {
      var unit = this.get('unit'),
          db = this.get('db'),
          getModelURL = this.get('getModelURL'),
          service = db.services.getById(unit.service),
          unit_name = ev.unit_names[0];

      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error removing unit',
              message: 'Unit name: ' + unit_name,
              level: 'error',
              link: getModelURL(unit),
              modelId: unit
            })
        );
      } else {
        db.units.remove(db.units.getById(unit_name));
        service.set('unit_count', service.get('unit_count') - 1);
        this.remove_panel.destroy();
        this.fire('navigateTo',
            {service: service, url: '/service/' + service.get('id') + '/'});
      }

      btn.set('disabled', false);
    },

    retry: function(ev) {
      ev.preventDefault();
      var env = this.get('env'),
          unit = this.get('unit'),
          db = this.get('db'),
          getModelURL = this.get('getModelURL'),
          service = db.services.getById(unit.service),
          button = ev.target;
      button.set('disabled', true);
      env.resolved(unit.id, null, true,
          function(ev) {
            if (ev.err) {
              db.notifications.add(
                  new models.Notification({
                    title: 'Error retrying unit',
                    message: 'Unit name: ' + ev.unit_name,
                    level: 'error',
                    link: getModelURL(unit),
                    modelId: unit
                  })
              );

            }
            button.set('disabled', false);
          }
      );
    },

    confirmResolvedRelation: function(ev) {
      // We wait to make the panel until now, because in the render method
      // the container is not yet part of the document.
      if (Y.Lang.isUndefined(this.resolved_relation_panel)) {
        this.resolved_relation_panel = views.createModalPanel(
            'Are you sure you want to tell the system this problem has been ' +
            'resolved?  This action cannot be undone.',
            '#resolved-relation-modal-panel');
      }
      // We set the buttons separately every time because we want to bind the
      // target, which can vary.
      views.setModalButtons(
          this.resolved_relation_panel,
          'Relation Error Has Been Resolved',
          Y.bind(this.doResolvedRelation, this, ev.target));
      this.resolved_relation_panel.show();
    },

    doResolvedRelation: function(button, ev) {
      ev.preventDefault();
      var env = this.get('env'),
          unit = this.get('unit'),
          relation_name = button.ancestor('form').get('id');
      ev.target.set('disabled', true);
      env.resolved(
          unit.id, relation_name, false,
          Y.bind(this._resolvedRelationCallback, this, button, ev.target));
    },

    _resolvedRelationCallback: function(button, confirm_button, ev) {
      views.highlightRow(button.ancestor('tr'), ev.err);
      if (ev.err) {
        var db = this.get('db'),
            getModelURL = this.get('getModelURL'),
            unit = this.get('unit'),
            relation_id = button.ancestor('tr').get('id'),
            relation = db.relations.getById(relation_id);
        db.notifications.add(
            new models.Notification({
              title: 'Error resolving relation',
              message: 'Could not resolve a unit relation',
              level: 'error',
              link: getModelURL(unit) + '?rel_id=' + relation_id,
              modelId: relation
            })
        );
      }
      confirm_button.set('disabled', false);
      this.resolved_relation_panel.hide();
    },

    retryRelation: function(ev) {
      ev.preventDefault();
      var env = this.get('env'),
          unit = this.get('unit'),
          db = this.get('db'),
          getModelURL = this.get('getModelURL'),
          button = ev.target,
          relation_name = button.ancestor('form').get('id');
      button.set('disabled', true);
      env.resolved(
          unit.id, relation_name, true,
          function(ev) {
            views.highlightRow(button.ancestor('tr'), ev.err);
            if (ev.err) {
              var relation_id = button.ancestor('tr').get('id'),
                  relation = db.relations.getById(relation_id);
              db.notifications.add(
                  new models.Notification({
                    title: 'Error retrying relation',
                    message: 'Could not retry a unit relation',
                    level: 'error',
                    link: getModelURL(unit) + '?rel_id=' + relation_id,
                    modelId: relation
                  })
              );
            }
            button.set('disabled', false);
          }
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
