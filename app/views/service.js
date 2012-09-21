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

  var getElementsValuesMap = function(container, cls, originalMap) {
    var result = (originalMap ? originalMap : {});
    container.all(cls).each(function(el) {
      result[el.get('name')] = el.get('value');
    });

    return result;
  };

  var buildServerCallbackHandler = function(config) {
    var utils = Y.namespace('juju.views.utils'),
        _serverErrorMessage = utils._serverErrorMessage,
        container = config.container,
        scope = config.scope,
        initHandler = config.initHandler,
        finalizeHandler = config.finalizeHandler,
        successHandler = config.successHandler,
        errorHandler = config.errorHandler;

    function _addErrorMessage(message) {
      var div = container.one('#message-area')
            .appendChild(Y.Node.create('<div/>'))
            .addClass('alert')
            .addClass('alert-error')
            .set('text', message);

      var close = div.appendChild(Y.Node.create('<a/>'))
           .addClass('close')
           .set('text', '×');

      close.on('click', function() {
        div.remove();
      });
    }

    function invokeCallback(callback) {
      if (callback) {
        if (scope) {
          callback.apply(scope);
        } else {
          callback();
        }
      }
    }

    return function(ev) {
      if (ev && ev.err) {
        _addErrorMessage(_serverErrorMessage);
        invokeCallback(errorHandler);
      } else {
        invokeCallback(successHandler);
      }
      invokeCallback(finalizeHandler);
    };
  };

  utils.buildServerCallbackHandler = buildServerCallbackHandler;
  utils._serverErrorMessage = 'An error ocurred.';

  var ServiceRelations = Y.Base.create(
      'ServiceRelationsView', Y.View, [views.JujuBaseView], {

        template: Templates['service-relations'],

        initializer: function() {
          Y.mix(this, exposeButtonMixin, undefined, undefined, undefined, true);
        },

        render: function() {
          var container = this.get('container'),
              db = this.get('db'),
              service = this.get('model');
          container.setHTML(this.template(
              {'service': service.getAttrs(),
                'relations': service.get('rels'),
                'charm': this.renderable_charm(service.get('charm'), db)}
              ));
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
                map = getElementsValuesMap(container, '.constraint-field');

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
              buildServerCallbackHandler({
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
                'name': name,
                'value': value});
            }
          });

          var generics = ['cpu', 'mem', 'arch'];
          Y.Object.each(generics, function(idx, gkey) {
            if (!(gkey in constraints)) {
              display_constraints.push({'name': gkey, 'value': ''});
            }
          });

          console.log('service constraints', display_constraints);
          container.setHTML(this.template({
            service: service.getAttrs(),
            constraints: display_constraints,
            readOnlyConstraints: (function() {
              var arr = [];
              Y.Object.each(readOnlyConstraints, function(name, value) {
                arr.push({'name': name, 'value': value});
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
            settings.push(Y.mix(
                {'name': field_name, 'value': config[field_name]}, field_def));
          });

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
              service = this.get('model');

          // Disable the "Update" button while the RPC call is outstanding.
          container.one('#save-service-config').set('disabled', 'disabled');

          env.set_config(service.get('id'),
              getElementsValuesMap(container, '.config-field'),
              buildServerCallbackHandler({
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
              ));
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
          env = this.get('env');

      if (!service) {
        console.log('not connected / maybe');
        return this;
      }
      var units = db.units.get_units_for_service(service);
      var charm_name = service.get('charm');
      container.setHTML(this.template(
          {'service': service.getAttrs(),
            'charm': this.renderable_charm(charm_name, db),
            'units': units.map(function(u) {
              return u.getAttrs();})
          }));
      return this;
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

    resetUnits: function(ev) {
      var container = this.get('container'),
          field = container.one('#num-service-units');
      field.set('value', this.get('model').get('unit_count'));
    },

    modifyUnits: function(ev) {
      if (ev.keyCode !== ESC && ev.keyCode !== ENTER) {
        return;
      }
      var container = this.get('container'),
          field = container.one('#num-service-units');
      if (ev.keyCode === ESC) {
        field.set('value', this.get('model').get('unit_count'));
      }
      if (ev.keyCode !== ENTER) { // If not Enter keyup...
        return;
      }
      ev.halt(true);
      this._modifyUnits(parseInt(field.get('value'), 10));
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
          unit_ids_to_remove.push(units[i].get('id'));
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
            return new models.ServiceUnit(
                {id: unit_id,
                  agent_state: 'pending',
                  service: service_id});
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
    'json-stringify']
});
