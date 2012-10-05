'use strict';

YUI.add('juju-view-service', function(Y) {

  var ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
  var ESC = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.esc;


  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  var exposeButtonMixin = {
    events: {
      '.unexposeService': {click: 'unexposeService'},
      '.exposeService': {click: 'exposeService'}
    },

    unexposeService: function() {
      var service = this.get('model'),
          env = this.get('env');

      env.unexpose(service.get('id'),
          Y.bind(this._unexposeServiceCallback, this));
    },

    _unexposeServiceCallback: function() {
      var service = this.get('model'),
          db = this.get('db');
      service.set('exposed', false);
      db.fire('update');
    },

    exposeService: function() {
      var service = this.get('model'),
          env = this.get('env');
      env.expose(service.get('id'),
          Y.bind(this._exposeServiceCallback, this));
    },

    _exposeServiceCallback: function() {
      var service = this.get('model'),
          db = this.get('db');
      service.set('exposed', true);
      db.fire('update');
    }
  };

  var ServiceRelations = Y.Base.create(
      'ServiceRelationsView', Y.View, [views.JujuBaseView], {

        template: Templates['service-relations'],

        initializer: function() {
          Y.mix(this, exposeButtonMixin, undefined, undefined, undefined, true);
        },

        events: {
          '#service-relations .btn': {click: 'confirmRemoved'}
        },

        render: function() {
          var container = this.get('container'),
              db = this.get('db'),
              service = this.get('model'),
              querystring = this.get('querystring');
          if (!service) {
            container.setHTML('<div class="alert">Loading...</div>');
            console.log('waiting on service data');
            return this;
          }
          var relation_data = utils.getRelationDataForService(db, service);
          Y.each(relation_data, function(rel) {
            if (rel.relation_id === querystring.rel_id) {
              rel.highlight = true;
            }
          });

          container.setHTML(this.template(
              { service: service.getAttrs(),
                relations: relation_data,
                charm: this.renderable_charm(service.get('charm'), db)}
              ));
        },

        confirmRemoved: function(ev) {
          // We wait to make the panel until now, because in the render method
          // the container is not yet part of the document.
          ev.preventDefault();
          if (Y.Lang.isUndefined(this.remove_panel)) {
            this.remove_panel = views.createModalPanel(
                'Are you sure you want to remove this service relation?  ' +
                'This action cannot be undone, though you can ' +
                'recreate it later.',
                '#remove-modal-panel');
          }
          // We set the buttons separately every time because we want to bind
          // the target, which can vary.  Since the page is redrawn after a
          // relation is removed, this is technically unnecessary in this
          // particular case, but a good pattern to get into.
          views.setModalButtons(
              this.remove_panel,
              'Remove Service Relation',
              Y.bind(this.doRemoveRelation, this, ev.target));
          this.remove_panel.show();
        },

        doRemoveRelation: function(button, ev) {
          ev.preventDefault();
          var rel_id = button.get('value'),
              env = this.get('env'),
              db = this.get('db'),
              service = this.get('model'),
              relation = db.relations.getById(rel_id),
              endpoints = relation.get('endpoints'),
              endpoint_a = endpoints[0][0] + ':' + endpoints[0][1].name,
              endpoint_b;

          if (endpoints.length === 1) {
            // For a peer relationship, both endpoints are the same.
            endpoint_b = endpoint_a;
          } else {
            endpoint_b = endpoints[1][0] + ':' + endpoints[1][1].name;
          }

          ev.target.set('disabled', true);

          env.remove_relation(
              endpoint_a,
              endpoint_b,
              Y.bind(this._doRemoveRelationCallback, this,
                     relation, button, ev.target));
        },

        _doRemoveRelationCallback: function(relation, rm_button,
            confirm_button, ev) {
          var db = this.get('db'),
              app = this.get('app'),
              service = this.get('model');
          views.highlightRow(rm_button.ancestor('tr'), ev.err);
          if (ev.err) {
            db.notifications.add(
                new models.Notification({
                  title: 'Error deleting relation',
                  message: 'Relation ' + ev.endpoint_a + ' to ' + ev.endpoint_b,
                  level: 'error',
                  link: app.getModelURL(service) + 'relations?rel_id=' +
                      relation.get('id'),
                  modelId: relation
                })
            );
          } else {
            db.relations.remove(relation);
            db.fire('update');
          }
          confirm_button.set('disabled', false);
          this.remove_panel.hide();
        }
      });

  views.service_relations = ServiceRelations;

  var ServiceConstraints = Y.Base.create(
      'ServiceConstraintsView', Y.View, [views.JujuBaseView], {

        template: Templates['service-constraints'],

        initializer: function() {
          Y.mix(this, exposeButtonMixin, undefined, undefined, undefined, true);
        },

        events: {
          '#save-service-constraints': {click: 'updateConstraints'}
        },

        updateConstraints: function() {
          var service = this.get('model'),
              container = this.get('container'),
              env = this.get('env');

          var values = (function() {
            var result = [],
                map = utils.getElementsValuesMapping(
                    container, '.constraint-field');

            Y.Object.each(map, function(value, name) {
              result.push(name + '=' + value);
            });

            return result;
          })();

          // Disable the "Update" button while the RPC call is outstanding.
          container.one('#save-service-constraints')
            .set('disabled', 'disabled');
          env.set_constraints(service.get('id'),
              values,
              utils.buildRpcHandler({
                container: container,
                successHandler: function()  {
                  var service = this.get('model'),
                      env = this.get('env'),
                      app = this.get('app');

                  env.get_service(
                      service.get('id'), Y.bind(app.load_service, app));
                },
                errorHandler: function() {
                  container.one('#save-service-constraints')
                    .removeAttribute('disabled');
                },
                scope: this}
              ));
        },

        render: function() {
          var container = this.get('container'),
              db = this.get('db'),
              service = this.get('model');

          var constraints = service.get('constraints');
          var display_constraints = [];

          //these are read-only values
          var readOnlyConstraints = {
            'provider-type': constraints['provider-type'],
            'ubuntu-series': constraints['ubuntu-series']
          };

          Y.Object.each(constraints, function(value, name) {
            if (!(name in readOnlyConstraints)) {
              display_constraints.push({
                name: name,
                value: value});
            }
          });

          var generics = ['cpu', 'mem', 'arch'];
          Y.Object.each(generics, function(idx, gkey) {
            if (!(gkey in constraints)) {
              display_constraints.push({name: gkey, value: ''});
            }
          });

          console.log('service constraints', display_constraints);
          container.setHTML(this.template({
            service: service.getAttrs(),
            constraints: display_constraints,
            readOnlyConstraints: (function() {
              var arr = [];
              Y.Object.each(readOnlyConstraints, function(name, value) {
                arr.push({name: name, value: value});
              });
              return arr;
            })(),
            charm: this.renderable_charm(service.get('charm'), db)}
          ));
        }

      });

  views.service_constraints = ServiceConstraints;

  var ServiceConfigView = Y.Base.create(
      'ServiceConfigView', Y.View, [views.JujuBaseView], {

        template: Templates['service-config'],

        initializer: function() {
          Y.mix(this, exposeButtonMixin, undefined, undefined, undefined, true);
        },

        events: {
          '#save-service-config': {click: 'saveConfig'}
        },

        render: function() {
          var container = this.get('container'),
              db = this.get('db'),
              service = this.get('model');

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

          Y.Object.each(schema, function(field_def, field_name) {
            var entry = {
              'name': field_name
            };

            if (schema[field_name].type === 'boolean') {
              entry.isBool = true;

              if (config[field_name]) {
                // The "checked" string will be used inside an input tag
                // like <input id="id" type="checkbox" checked>
                entry.value = 'checked';
              } else {
                // The output will be <input id="id" type="checkbox">
                entry.value = '';
              }

            } else {
              entry.value = config[field_name];
            }

            settings.push(Y.mix(entry, field_def));
          });

          console.log('render view svc config', service.getAttrs(), settings);

          container.setHTML(this.template(
              {service: service.getAttrs(),
                settings: settings,
                charm: this.renderable_charm(service.get('charm'), db)}
              ));

          return this;
        },

        showErrors: function(errors) {
          var container = this.get('container');
          container.one('#save-service-config').removeAttribute('disabled');


          // Remove old error messages
          container.all('.help-inline').each(function(node) {
            node.remove();
          });

          // Remove remove the "error" class from the "div"
          // that previously had "help-inline" tags
          container.all('.error').each(function(node) {
            node.removeClass('error');
          });

          var firstErrorKey = null;
          Y.Object.each(errors, function(value, key) {
            var errorTag = Y.Node.create('<span/>')
              .set('id', 'error-' + key)
              .addClass('help-inline');

            var field = container.one('#input-' + key);
            // Add the "error" class to the wrapping "control-group" div
            field.get('parentNode').get('parentNode').addClass('error');

            errorTag.appendTo(field.get('parentNode'));

            errorTag.setHTML(value);
            if (!firstErrorKey) {
              firstErrorKey = key;
            }
          });

          if (firstErrorKey) {
            var field = container.one('#input-' + firstErrorKey);
            field.focus();
          }
        },

        saveConfig: function() {
          var env = this.get('env'),
              db = this.get('db'),
              service = this.get('model'),
              charm_url = service.get('charm'),
              charm = db.charms.getById(charm_url),
              container = this.get('container');

          // Disable the "Update" button while the RPC call is outstanding.
          container.one('#save-service-config').set('disabled', 'disabled');

          var new_values = utils.getElementsValuesMapping(
                                            container, '.config-field'),
              errors = utils.validate(new_values, charm.get('config'));

          if (Y.Object.isEmpty(errors)) {
            env.set_config(
                service.get('id'),
                new_values,
                utils.buildRpcHandler({
                  container: container,
                  successHandler: function()  {
                    var service = this.get('model'),
                        env = this.get('env'),
                        app = this.get('app');

                    env.get_service(
                        service.get('id'), Y.bind(app.load_service, app));
                  },
                  errorHandler: function() {
                    container.one('#save-service-config')
                      .removeAttribute('disabled');
                  },
                  scope: this}
                )
            );

          } else {
            this.showErrors(errors);
          }
        }
      });

  views.service_config = ServiceConfigView;

  var ServiceView = Y.Base.create('ServiceView', Y.View, [views.JujuBaseView], {

    template: Templates.service,

    initializer: function() {
      Y.mix(this, exposeButtonMixin, undefined, undefined, undefined, true);
    },

    render: function() {
      console.log('service view render');

      var container = this.get('container'),
          db = this.get('db'),
          service = this.get('model'),
          env = this.get('env'),
          filter_state = this.get('querystring').state,
          state_data = [{title: 'All', active: !filter_state, link: '.'}];

      if (!service) {
        container.setHTML('<div class="alert">Loading...</div>');
        console.log('waiting on service data');
        return this;
      }
      Y.each(['Running', 'Pending', 'Error'], function(title) {
        var lower = title.toLowerCase();
        state_data.push({
          title: title,
          active: lower === filter_state,
          link: '?state=' + lower});
      });
      container.setHTML(this.template({
        service: service.getAttrs(),
        charm: this.renderable_charm(service.get('charm'), db),
        state: filter_state,
        units: this.filterUnits(
            filter_state, db.units.get_units_for_service(service)),
        states: state_data,
        filtered: !!filter_state
      }));
      return this;
    },

    filterUnits: function(filter_state, units) {
      var state_matchers = {
        running: function(s) { return s === 'started'; },
        pending: function(s) {
          return ['installed', 'pending'].indexOf(s) > -1;
        },
        // Errors: install-, start-, stop-, charm-upgrade-, configure-.
        error: function(s) { return (/-error$/).test(s); }},
          matcher = filter_state && state_matchers[filter_state];
      if (matcher) {
        return Y.Array.filter(units, function(u) {
          return matcher(u.agent_state); });
      } else {
        return units;
      }
    },

    events: {
      '#num-service-units': {keydown: 'modifyUnits', blur: 'resetUnits'},
      'div.thumbnail': {click: function(ev) {
        console.log('Unit clicked', ev.currentTarget.get('id'));
        this.fire('showUnit', {unit_id: ev.currentTarget.get('id')});
      }},
      'a#destroy-service': {click: 'confirmDestroy'}
    },

    confirmDestroy: function(ev) {
      // We wait to make the panel until now, because in the render method
      // the container is not yet part of the document.
      ev.preventDefault();
      if (Y.Lang.isUndefined(this.panel)) {
        this.panel = views.createModalPanel(
            'Are you sure you want to destroy the service?  ' +
            'This cannot be undone.',
            '#destroy-modal-panel',
            'Destroy Service',
            Y.bind(this.destroyService, this)
            );
      }
      this.panel.show();
    },

    destroyService: function(ev) {
      ev.preventDefault();
      var env = this.get('env'),
          service = this.get('model');
      ev.target.set('disabled', true);
      env.destroy_service(
          service.get('id'), Y.bind(this._destroyCallback, this));
    },

    _destroyCallback: function(ev) {
      var db = this.get('db'),
          service = this.get('model'),
          service_id = service.get('id');
      db.services.remove(service);
      db.relations.remove(
          db.relations.filter(
          function(r) {
            return Y.Array.some(r.get('endpoints'), function(ep) {
              return ep[0] === service_id;
            });
          }
          ));
      this.panel.hide();
      this.panel.destroy();
      this.fire('showEnvironment');
    },

    resetUnits: function() {
      var container = this.get('container'),
          field = container.one('#num-service-units');
      field.set('value', this.get('model').get('unit_count'));
      field.set('disabled', false);
    },

    modifyUnits: function(ev) {
      if (ev.keyCode !== ESC && ev.keyCode !== ENTER) {
        return;
      }
      var container = this.get('container'),
          field = container.one('#num-service-units');

      if (ev.keyCode === ESC) {
        this.resetUnits();
      }
      if (ev.keyCode !== ENTER) { // If not Enter keyup...
        return;
      }
      ev.halt(true);

      if (/^\d+$/.test(field.get('value'))) {
        this._modifyUnits(parseInt(field.get('value'), 10));
      } else {
        this.resetUnits();
      }
    },

    _modifyUnits: function(requested_unit_count) {

      var service = this.get('model'),
          unit_count = service.get('unit_count'),
          field = this.get('container').one('#num-service-units'),
          env = this.get('env');

      if (requested_unit_count < 1) {
        console.log('You must have at least one unit');
        field.set('value', unit_count);
        return;
      }

      var delta = requested_unit_count - unit_count;
      if (delta > 0) {
        // Add units!
        env.add_unit(
            service.get('id'), delta,
            Y.bind(this._addUnitCallback, this));
      } else if (delta < 0) {
        delta = Math.abs(delta);
        var db = this.get('db'),
                units = db.units.get_units_for_service(service),
                unit_ids_to_remove = [];

        for (var i = units.length - 1;
            unit_ids_to_remove.length < delta;
            i -= 1) {
          unit_ids_to_remove.push(units[i].id);
        }
        env.remove_units(
            unit_ids_to_remove,
            Y.bind(this._removeUnitCallback, this)
        );
      }
      field.set('disabled', true);
    },

    _addUnitCallback: function(ev) {
      var service = this.get('model'),
          service_id = service.get('id'),
          db = this.get('db'),
          unit_names = ev.result || [];
      console.log('_addUnitCallback with: ', arguments);
      // Received acknowledgement message for the 'add_units' operation.
      // ev.results is an array of the new unit ids to be created.
      db.units.add(
          Y.Array.map(unit_names, function(unit_id) {
            return {id: unit_id,
              agent_state: 'pending'};
          }));
      service.set(
          'unit_count', service.get('unit_count') + unit_names.length);
      db.fire('update');
      // View is redrawn so we do not need to enable field.
    },

    _removeUnitCallback: function(ev) {
      var service = this.get('model'),
          db = this.get('db'),
          unit_names = ev.unit_names;
      console.log('_removeUnitCallback with: ', arguments);
      Y.Array.each(unit_names, function(unit_name) {
        db.units.remove(db.units.getById(unit_name));
      });
      service.set(
          'unit_count', service.get('unit_count') - unit_names.length);
      db.fire('update');
      // View is redrawn so we do not need to enable field.
    }
  });

  views.service = ServiceView;
}, '0.1.0', {
  requires: ['panel',
    'juju-view-utils',
    'juju-models',
    'base-build',
    'handlebars',
    'node',
    'view',
    'event-key',
    'transition',
    'json-stringify']
});
