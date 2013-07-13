/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
 * Provide the service views and mixins.
 *
 * @module views
 * @submodule views.services
 */

YUI.add('juju-view-service', function(Y) {

  var ENTER = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.enter;
  var ESC = Y.Node.DOM_EVENTS.key.eventDef.KEY_MAP.esc;


  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      models = Y.namespace('juju.models'),
      plugins = Y.namespace('juju.plugins'),
      utils = Y.namespace('juju.views.utils');

  /**
   * @class manageUnitsMixin
   */
  var manageUnitsMixin = {
    // Mixin attributes
    // XXX Makyo - this will need to be removed when the serviceInspector flag
    // goes away.
    events: {
      '.num-units-control': {
        keydown: 'modifyUnits',
        blur: 'resetUnits'
      }
    },

    /*
     * XXX Makyo - all instances of testing for the flag will go away once
     * the inspector becomes the default, rather than internal pages.
     */
    /**
     * No-Op function to replace getModelURL for the time being.
     * XXX Makyo - remove when inspector becomes the default.
     *
     * @method noop
     * @return {undefined} Nothing.
     */
    noop: function() { return; },

    resetUnits: function() {
      var container, model, flags = window.flags;
      if (flags.serviceInspector) {
        container = this.inspector.get('container');
        model = this.inspector.get('model');
      } else {
        container = this.get('container');
        model = this.get('model');
      }
      var field = container.one('.num-units-control');
      field.set('value', model.get('unit_count'));
      field.set('disabled', false);
    },

    modifyUnits: function(ev) {
      if (ev.keyCode !== ESC && ev.keyCode !== ENTER) {
        return;
      }
      var container, flags = window.flags;
      if (flags.serviceInspector) {
        container = this.inspector.get('container');
      } else {
        container = this.get('container');
      }
      var field = container.one('.num-units-control');

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
      var container, env, flags = window.flags;
      if (flags.serviceInspector) {
        container = this.inspector.get('container');
        env = this.inspector.get('env');
      } else {
        container = this.get('container');
        env = this.get('env');
      }
      var service = this.model || this.get('model');
      var unit_count = service.get('unit_count');
      var field = container.one('.num-units-control');

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
        var db;
        if (flags.serviceInspector) {
          db = this.inspector.get('db');
        } else {
          db = this.get('db');
        }
        var units = db.units.get_units_for_service(service),
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
      var service, getModelURL, db, flags = window.flags;
      if (flags.serviceInspector) {
        service = this.inspector.get('model');
        getModelURL = this.noop;
        db = this.inspector.get('db');
      } else {
        service = this.get('model');
        getModelURL = this.get('getModelURL');
        db = this.get('db');
      }
      var unit_names = ev.result || [];
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error adding unit',
              message: ev.num_units + ' units',
              level: 'error',
              link: getModelURL(service),
              modelId: service
            })
        );
      } else {
        db.units.add(
            Y.Array.map(unit_names, function(unit_id) {
              return {id: unit_id,
                agent_state: 'pending'};
            }));
        service.set(
            'unit_count', service.get('unit_count') + unit_names.length);
      }
      db.fire('update');
      // View is redrawn so we do not need to enable field.
    },

    _removeUnitCallback: function(ev) {
      var service, getModelURL, db, flags = window.flags;
      if (flags.serviceInspector) {
        service = this.inspector.get('model');
        getModelURL = this.noop;
        db = this.inspector.get('db');
      } else {
        service = this.get('model');
        getModelURL = this.get('getModelURL');
        db = this.get('db');
      }
      var unit_names = ev.unit_names;

      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: (function() {
                if (!ev.unit_names || ev.unit_names.length < 2) {
                  return 'Error removing unit';
                }
                return 'Error removing units';
              })(),
              message: (function() {
                if (!ev.unit_names || ev.unit_names.length === 0) {
                  return '';
                }
                if (ev.unit_names.length > 1) {
                  return 'Unit names: ' + ev.unit_names.join(', ');
                }
                return 'Unit name: ' + ev.unit_names[0];
              })(),
              level: 'error',
              link: getModelURL(service),
              modelId: service
            })
        );
      } else {
        Y.Array.each(unit_names, function(unit_name) {
          db.units.remove(db.units.getById(unit_name));
        });
        service.set(
            'unit_count', service.get('unit_count') - unit_names.length);
      }
      db.fire('update');
      // View is redrawn so we do not need to enable field.
    }
  };

  var removeServiceMixin = {
    // Mixin attributes
    events: {
      '#destroy-service': {
        click: 'confirmDestroy'
      }
    },

    confirmDestroy: function(ev) {
      ev.preventDefault();
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
          getModelURL = this.get('getModelURL'),
          service = this.get('model'),
          service_id = service.get('id');

      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error destroying service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: getModelURL(service),
              modelId: service
            })
        );
      } else {
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
        this.fire('navigateTo', {url: this.get('nsRouter').url({gui: '/'})});
        db.fire('update');
      }
    }
  };

  /**
   * @class exposeButtonMixin
   */
  var exposeButtonMixin = {
    events: {
      '.unexposeService': {mousedown: 'unexposeService'},
      '.exposeService': {mousedown: 'exposeService'}
    },

    /**
     * Unexpose the service stored in this view.
     * Pass this._unexposeServiceCallback as callback to be called when
     * the response is returned by the backend.
     *
     * @method unexposeService
     * @return {undefined} Nothing.
     */
    unexposeService: function() {
      var svcInspector = window.flags && window.flags.serviceInspector;
      var dataSource = svcInspector ? this.inspector : this;
      var service = dataSource.get('model'),
          env = dataSource.get('env');
      env.unexpose(service.get('id'),
          Y.bind(this._unexposeServiceCallback, this));
    },

    /**
     * Callback called when the backend returns a response to a service
     * unexpose call. Update the service model instance or, if an error
     * occurred, add a failure notification.
     *
     * @method _unexposeServiceCallback
     * @param {Object} ev An event object (with "err" and "service_name"
     *  attributes).
     * @return {undefined} Nothing.
     */
    _unexposeServiceCallback: function(ev) {
      var service = this.get('model'),
          db = this.get('db'),
          getModelURL = this.get('getModelURL');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error un-exposing service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: getModelURL(service),
              modelId: service
            })
        );
      } else {
        service.set('exposed', false);
        db.fire('update');
      }
    },

    /**
     * Expose the service stored in this view.
     * Pass this._exposeServiceCallback as callback to be called when
     * the response is returned by the backend.
     *
     * @method exposeService
     * @return {undefined} Nothing.
     */
    exposeService: function() {
      var svcInspector = window.flags && window.flags.serviceInspector;
      var dataSource = svcInspector ? this.inspector : this;
      var service = dataSource.get('model'),
          env = dataSource.get('env');
      env.expose(service.get('id'),
          Y.bind(this._exposeServiceCallback, this));
    },

    /**
     * Callback called when the backend returns a response to a service
     * expose call. Update the service model instance or, if an error
     * occurred, add a failure notification.
     *
     * @method _exposeServiceCallback
     * @param {Object} ev An event object (with "err" and "service_name"
     *  attributes).
     * @return {undefined} Nothing.
     */
    _exposeServiceCallback: function(ev) {
      var service = this.get('model'),
          db = this.get('db'),
          getModelURL = this.get('getModelURL');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error exposing service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: getModelURL(service),
              modelId: service
            })
        );
      } else {
        service.set('exposed', true);
        db.fire('update');
      }
    }
  };

  /**
   * @class ServiceViewBase
   */
  var ServiceViewBase = Y.Base.create('ServiceViewBase', Y.View,
      [views.JujuBaseView], {

        initializer: function() {
          Y.mix(this, exposeButtonMixin, undefined, undefined, undefined, true);
          Y.mix(this, manageUnitsMixin, undefined, undefined, undefined, true);
          Y.mix(this, removeServiceMixin, undefined, undefined, undefined,
              true);

          // Bind visualization resizing on window resize.
          Y.on('windowresize', Y.bind(function() {
            this.fitToWindow();
          }, this));
        },

        getServiceTabs: function(href) {
          var db = this.get('db'),
              service = this.get('model'),
              getModelURL = this.get('getModelURL'),
              charmId = service.get('charm'),
              charm = db.charms.getById(charmId),
              charmUrl = (charm ? getModelURL(charm) : '#');

          var tabs = [{
            href: getModelURL(service),
            title: 'Units',
            active: false
          }, {
            href: getModelURL(service, 'relations'),
            title: 'Relations',
            active: false
          }, {
            href: getModelURL(service, 'config'),
            title: 'Settings',
            active: false
          }, {
            href: charmUrl,
            title: 'Charm',
            active: false
          }, {
            href: getModelURL(service, 'constraints'),
            title: 'Constraints',
            active: false
          }];

          Y.each(tabs, function(value) {
            if (value.href === href) {
              value.active = true;
            }
          });

          return tabs;
        },

        /**
        Fit to window.  Must be called after the container
        has been added to the DOM.

        @method containerAttached
        */
        containerAttached: function() {
          this.fitToWindow();
        },

        fitToWindow: function() {
          function getHeight(node) {
            if (!node) {
              return 0;
            }
            return node.get('clientHeight');
          }
          var container = this.get('container'),
              viewContainer = container.one('.view-container');
          if (viewContainer) {
            Y.fire('beforePageSizeRecalculation');
            var navbarHeight = getHeight(Y.one('.navbar')),
                windowHeight = container.get('winHeight'),
                headerHeight = getHeight(container.one(
                    '.service-header-partial')),
                footerHeight = getHeight(container.one('.bottom-navbar')),
                size = (Math.max(windowHeight, 600) - navbarHeight -
                        headerHeight - footerHeight - 19);
            viewContainer.set('offsetHeight', size);
            Y.fire('afterPageSizeRecalculation');
          }
        },

        /**
          Reject callback for the model promise which creates an error
          notification and then redirects the user to the evironment view

          @method noServiceAvailable
        */
        noServiceAvailable: function() {
          this.get('db').notifications.add(
              new Y.juju.models.Notification({
                title: 'Service is not available',
                message: 'The service you are trying to view does not exist',
                level: 'error'
              })
          );

          this.fire('navigateTo', {
            url: this.get('nsRouter').url({gui: '/'})
          });
        },

        /**
          Shared rendering method to render the loading service data view

          @method renderLoading
        */
        renderLoading: function() {
          var container = this.get('container');
          container.setHTML(
              '<div class="alert">Loading service details...</div>');
          console.log('waiting on service data');
        },

        /**
          Shared rendering method to render the service data view

          @method renderData
        */
        renderData: function() {
          var container = this.get('container');
          var service = this.get('model');
          var db = this.get('db');
          var env = db.environment.get('annotations');
          container.setHTML(this.template(this.gatherRenderData()));
          // to be able to use this same method for all service views
          if (container.one('.landscape-controls')) {
            Y.juju.views.utils.updateLandscapeBottomBar(this.get('landscape'),
                env, service, container);
          }
        },

        /**
          Shared render method to be used in service detail views

          @method render
          @return {Object} view instance.
        */
        render: function() {
          var model = this.get('model');
          if (!model) {
            this.renderLoading();
          } else {
            this.renderData();
          }
          return this;
        }

      });
  views.serviceBase = ServiceViewBase;

  /**
   * @class ServiceRelationsView
   */
  views.service_relations = Y.Base.create(
      'ServiceRelationsView', ServiceViewBase, [
        views.JujuBaseView], {

        template: Templates['service-relations'],

        events: {
          '#service-relations .btn': {click: 'confirmRemoved'}
        },

        /**
         * Gather up all of the data required for the template.
         *
         * Aside from a nice separation of concerns, this method also
         * facilitates testing.
         *
         * @method gatherRenderData
         * @return {Object} The data the template will render.
         */
        gatherRenderData: function() {
          var container = this.get('container'),
              service = this.get('model'),
              db = this.get('db'),
              querystring = this.get('querystring');
          var relation_data = utils.getRelationDataForService(db, service);
          Y.each(relation_data, function(rel) {
            if (rel.elementId === querystring.rel_id) {
              rel.highlight = true;
            }
          });
          var charm_id = service.get('charm'),
              charm = db.charms.getById(charm_id),
              charm_attrs = charm ? charm.getAttrs() : undefined;
          return {
            viewName: 'relations',
            tabs: this.getServiceTabs('relations'),
            service: service.getAttrs(),
            landscape: this.get('landscape'),
            serviceModel: service,
            relations: relation_data,
            charm: charm_attrs,
            charm_id: charm_id,
            serviceIsJujuGUI: utils.isGuiCharmUrl(charm_id),
            serviceRemoteUri: this.get('nsRouter').url({ gui: '/service/'})
          };
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
              db = this.get('db'),
              env = this.get('env'),
              service = this.get('model'),
              relation = db.relations.getById(rel_id),
              endpoints = relation.get('endpoints'),
              endpoint_a = endpoints[0],
              endpoint_b;

          if (endpoints.length === 1) {
            // For a peer relationship, both endpoints are the same.
            endpoint_b = endpoint_a;
          } else {
            endpoint_b = endpoints[1];
          }

          ev.target.set('disabled', true);

          env.remove_relation(
              endpoint_a,
              endpoint_b,
              Y.bind(this._removeRelationCallback, this,
                     relation, button, ev.target));
        },

        _removeRelationCallback: function(relation, rm_button,
            confirm_button, ev) {
          var db = this.get('db'),
              getModelURL = this.get('getModelURL'),
              service = this.get('model');
          views.highlightRow(rm_button.ancestor('tr'), ev.err);
          if (ev.err) {
            db.notifications.add(
                new models.Notification({
                  title: 'Error deleting relation',
                  message: 'Relation ' + ev.endpoint_a + ' to ' + ev.endpoint_b,
                  level: 'error',
                  link: getModelURL(service) + 'relations?rel_id=' +
                      rm_button.get('id'),
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

  /**
   * @class ServiceConstraintsView
   */
  views.service_constraints = Y.Base.create(
      'ServiceConstraintsView', ServiceViewBase, [
        views.JujuBaseView], {

        template: Templates['service-constraints'],

        events: {
          '#save-service-constraints': {click: 'updateConstraints'}
        },

        updateConstraints: function() {
          var service = this.get('model'),
              container = this.get('container'),
              env = this.get('env');
          var constraints = utils.getElementsValuesMapping(
              container, '.constraint-field');

          // Disable the "Update" button while the RPC call is outstanding.
          container.one('#save-service-constraints')
            .set('disabled', 'disabled');
          env.set_constraints(service.get('id'),
              constraints,
              Y.bind(this._setConstraintsCallback, this, container)
          );
        },

        _setConstraintsCallback: function(container, ev) {
          var service = this.get('model'),
              env = this.get('env'),
              getModelURL = this.get('getModelURL'),
              db = this.get('db');

          if (ev.err) {
            db.notifications.add(
                new models.Notification({
                  title: 'Error setting service constraints',
                  message: 'Service name: ' + ev.service_name,
                  level: 'error',
                  link: getModelURL(service) + 'constraints',
                  modelId: service
                })
            );
            container.one('#save-service-constraints')
              .removeAttribute('disabled');

          } else {
            // The usual result of a successful request is a page refresh.
            // Therefore, we need to set this delay in order to show the
            // "success" message after the page page refresh.
            setTimeout(function() {
              utils.showSuccessMessage(container, 'Constraints updated');
            }, 1000);
          }
        },

        /**
         * Gather up all of the data required for the template.
         *
         * Aside from a nice separation of concerns, this method also
         * facilitates testing.
         *
         * @method gatherRenderData
         * @return {Object} The data the template will render.
         */
        gatherRenderData: function() {
          var service = this.get('model'),
              env = this.get('env'),
              constraints = service.get('constraints'),
              display_constraints = [];

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

          Y.Array.each(env.genericConstraints, function(gkey) {
            if (!(gkey in constraints)) {
              display_constraints.push({name: gkey, value: ''});
            }
          });

          console.log('service constraints', display_constraints);
          var charm_id = service.get('charm');
          return {
            viewName: 'constraints',
            tabs: this.getServiceTabs('constraints'),
            service: service.getAttrs(),
            landscape: this.get('landscape'),
            serviceModel: service,
            constraints: display_constraints,
            readOnlyConstraints: (function() {
              var arr = [];
              Y.Object.each(readOnlyConstraints, function(name, value) {
                arr.push({name: name, value: value});
              });
              return arr;
            })(),
            charm_id: charm_id,
            serviceIsJujuGUI: utils.isGuiCharmUrl(charm_id)
          };
        }

      });

  /**
   * @class ServiceConfigView
   */
  views.service_config = Y.Base.create(
      'ServiceConfigView', ServiceViewBase, [
        views.JujuBaseView], {

        template: Templates['service-config'],

        events: {
          '#save-service-config': {click: 'saveConfig'}
        },

        /**
         * Gather up all of the data required for the template.
         *
         * Aside from a nice separation of concerns, this method also
         * facilitates testing.
         *
         * @method gatherRenderData
         * @return {Object} The data the template will render.
         */
        gatherRenderData: function() {
          var container = this.get('container');
          var db = this.get('db');
          var service = this.get('model');
          var charm = db.charms.getById(service.get('charm'));
          var config = service.get('config');
          var getModelURL = this.get('getModelURL');
          var charm_config = charm.get('config');
          var schema = charm_config && charm_config.options;
          var charm_id = service.get('charm');
          var field_def;

          var settings = utils.extractServiceSettings(schema, config);

          return {
            viewName: 'config',
            tabs: this.getServiceTabs('config'),
            service: service.getAttrs(),
            settings: settings,
            charm_id: charm_id,
            landscape: this.get('landscape'),
            serviceModel: service,
            serviceIsJujuGUI: utils.isGuiCharmUrl(charm_id)
          };
        },

        /**
         Attach the plugins.  Must be called after the container
         has been added to the DOM.

         @method containerAttached
         */
        containerAttached: function() {
          this.constructor.superclass.containerAttached.call(this);
          var container = this.get('container');
          container.all('textarea.config-field').plug(plugins.ResizingTextarea,
              { max_height: 200,
                min_height: 18,
                single_line: 18});
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
              getModelURL = this.get('getModelURL'),
              service = this.get('model'),
              charm_url = service.get('charm'),
              charm = db.charms.getById(charm_url),
              charm_config = charm.get('config'),
              schema = charm_config && charm_config.options,
              container = this.get('container');

          // Disable the "Update" button while the RPC call is outstanding.
          container.one('#save-service-config').set('disabled', 'disabled');

          var new_values = utils.getElementsValuesMapping(
              container, '.config-field');
          var errors = utils.validate(new_values, schema);

          if (Y.Object.isEmpty(errors)) {
            env.set_config(
                service.get('id'),
                new_values,
                null,
                Y.bind(this._setConfigCallback, this, container)
            );

          } else {
            this.showErrors(errors);
          }
        },

        _setConfigCallback: function(container, ev) {
          var service = this.get('model'),
              env = this.get('env'),
              getModelURL = this.get('getModelURL'),
              db = this.get('db');

          if (ev.err) {
            db.notifications.add(
                new models.Notification({
                  title: 'Error setting service config',
                  message: 'Service name: ' + ev.service_name,
                  level: 'error',
                  link: getModelURL(service) + 'config',
                  modelId: service
                })
            );
            container.one('#save-service-config')
              .removeAttribute('disabled');

          } else {
            // The usual result of a successful request is a page refresh.
            // Therefore, we need to set this delay in order to show the
            // "success" message after the page page refresh.
            setTimeout(function() {
              utils.showSuccessMessage(container, 'Settings updated');
            }, 1000);
          }
        }
      });

  // Display a unit grid based on the total number of units.
  Y.Handlebars.registerHelper('show_units', function(units) {
    var template;
    var numUnits = units.length;
    // TODO: different visualization based on the viewport size.
    if (numUnits <= 25) {
      template = Templates.show_units_large;
    } else if (numUnits <= 50) {
      template = Templates.show_units_medium;
    } else if (numUnits <= 250) {
      template = Templates.show_units_small;
    } else {
      template = Templates.show_units_tiny;
    }
    return template({units: units});
  });

  // Translate the given state to the matching style.
  Y.Handlebars.registerHelper('state_to_style', function(state) {
    // Using a closure to avoid the second argument to be passed through.
    return utils.stateToStyle(state);
  });

  /**
   * @class ServiceView
   */
  var ServiceView = Y.Base.create('ServiceView', ServiceViewBase, [
    views.JujuBaseView], {

    template: Templates.service,

    /**
     * Gather up all of the data required for the template.
     *
     * Aside from a nice separation of concerns, this method also
     * facilitates testing.
     *
     * @method gatherRenderData
     * @return {Object} The data the template will render.
     */
    gatherRenderData: function() {
      var db = this.get('db');
      var service = this.get('model');
      var filter_state = this.get('querystring').state;
      var units = db.units.get_units_for_service(service);
      var charm_id = service.get('charm');
      var charm = db.charms.getById(charm_id);
      var charm_attrs = charm ? charm.getAttrs() : undefined;
      var state_data = [{
        title: 'All',
        link: '.',
        active: !filter_state,
        count: this.filterUnits(null, units).length
      }];
      Y.each(['Running', 'Pending', 'Error'], function(title) {
        var lower = title.toLowerCase();
        state_data.push({
          title: title,
          active: lower === filter_state,
          count: this.filterUnits(lower, units).length,
          link: '?state=' + lower});
      }, this);
      return {
        viewName: 'units',
        landscape: this.get('landscape'),
        serviceModel: service,
        tabs: this.getServiceTabs('.'),
        service: service.getAttrs(),
        charm_id: charm_id,
        charm: charm_attrs,
        serviceIsJujuGUI: utils.isGuiCharmUrl(charm_id),
        state: filter_state,
        units: this.filterUnits(filter_state, units),
        states: state_data
      };
    },

    filterUnits: function(filter_state, units) {
      // If filtering was requested, do it.
      if (filter_state) {
        // Build a matcher that will identify units of the requested state.
        var matcher = function(unit) {
          // Is this unit's (simplified) state the one we are looking for?
          return utils.simplifyState(unit) === filter_state;
        };
        return Y.Array.filter(units, matcher);
      } else { // Otherwise just return all the units we were given.
        return units;
      }
    },

    events: {
      'div.unit': {click: function(ev) {
        var id = ev.currentTarget.get('id');
        console.log('Unit clicked', id);
        this.fire('navigateTo', {
          url: this.get('nsRouter').url({
            gui: '/unit/' + id.replace('/', '-') + '/'
          })
        });
      }}
    }
  }, {
    ATTRS: {
      /**
        Applications router utility methods

        @attribute nsRouter
      */
      nsRouter: {}
    }
  });

  views.service = ServiceView;

  /**
    A collection of methods and properties which will be mixed into the
    prototype of the view container controller to add the functionality for
    the ghost inspector interactions.

    @property serviceInspector
    @submodule juju.controller
    @type {Object}
  */
  Y.namespace('juju.controller').serviceInspector = {
    'getName': function() {
      return this.inspector.getName();
    },
    'bind': function(model, viewlet) {
      this.inspector.bindingEngine.bind(model, viewlet);
      return this;
    },
    'render': function() {
      this.inspector.render();
      return this;
    },

    /**
      Handles showing/hiding the configuration settings descriptions.

      @method toggleSettingsHelp
      @param {Y.EventFacade} e An event object.
    */
    toggleSettingsHelp: function(e) {
      var button = e.currentTarget,
          descriptions = e.container.all('.settings-description'),
          btnString = 'Hide settings help';

      if (e.currentTarget.getHTML().indexOf('Hide') < 0) {
        button.setHTML(btnString);
        descriptions.show();
      } else {
        button.setHTML('Show settings help');
        descriptions.hide();
      }
    },

    /**
      Display the "do you really want to destroy this service?" prompt.

      @method showDestroyPrompt
      @param {Y.Node} container The container of the prompt.
    */
    showDestroyPrompt: function(container) {
      container.one('.destroy-service-prompt').removeClass('closed');
    },

    /**
      Hide the "do you really want to destroy this service?" prompt.

      @method hideDestroyPrompt
      @param {Y.Node} container The container of the prompt.
    */
    hideDestroyPrompt: function(container) {
      container.one('.destroy-service-prompt').addClass('closed');
    },

    /**
      Start the process of destroying the service represented by this
      inspector.

      @method initiateServiceDestroy
      @return {undefined} Nothing.
    */
    initiateServiceDestroy: function() {
      var svcInspector = window.flags && window.flags.serviceInspector;
      // When the above flag is removed we won't need the dataSource variable
      // any more and can refactor this accordingly.
      var dataSource = svcInspector ? this.inspector : this;
      var model = dataSource.get('model');
      var db = this.inspector.get('db');
      if (model.name === 'service') {
        var env = dataSource.get('env');
        env.destroy_service(model.get('id'),
            Y.bind(this._destroyServiceCallback, this, model, db));
      } else if (model.name === 'charm') {
        db.services.remove(this.options.ghostService);
      } else {
        throw new Error('Unexpected model type: ' + model.name);
      }
    },

    /**
      React to a service being destroyed (or not).

      @method _destroyServiceCallback
      @param {Object} service The service we attempted to destroy.
      @param {Object} db The database responsible for storing the service.
      @param {Object} evt The event describing the destruction (or lack
        thereof).
    */
    _destroyServiceCallback: function(service, db, evt) {
      if (evt.err) {
        // If something bad happend we need to alert the user.
        db.notifications.add(
            new models.Notification({
              title: 'Error destroying service',
              message: 'Service name: ' + evt.service_name,
              level: 'error',
              link: undefined, // XXX See note below about getModelURL.
              modelId: service
            })
        );
      } else {
        // If the removal succeeded on the server side, we need to remove the
        // service from the database.  (Why wouldn't we get an update from the
        // server side that would do this for us?).
        db.services.remove(service);
        db.relations.remove(db.relations.filter(
            function(r) {
              return Y.Array.some(r.get('endpoints'), function(ep) {
                return ep[0] === service.get('id');
              });
            }));
      }
    },

    /* Event handlers for service/ghost destroy UI */

    /**
      React to the user clicking on or otherwise activating the "destroy this
      service" icon.

      @method onDestroyIcon
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    onDestroyIcon: function(evt) {
      evt.halt();
      this.showDestroyPrompt(evt.container);
    },

    /**
      React to the user clicking on or otherwise activating the cancel button
      on the "destroy this service" prompt.

      @method onCancelDestroy
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    onCancelDestroy: function(evt) {
      evt.halt();
      this.hideDestroyPrompt(evt.container);
    },

    /**
      React to the user clicking on or otherwise activating the "do it now"
      button on the "destroy this service" prompt.

      @method onInitiateDestroy
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    onInitiateDestroy: function(evt) {
      evt.halt();
      this.closeInspector();
      this.initiateServiceDestroy();
    },

    /**
      Handles exposing the service.

      @method toggleExpose
      @param {Y.EventFacade} e An event object.
      @return {undefined} Nothing.
    */
    toggleExpose: function(e) {
      var service = this.inspector.get('model');
      var env = this.inspector.get('db').environment;
      var exposed;
      if (service.get('exposed')) {
        this.unexposeService();
        exposed = false;
      } else {
        this.exposeService();
        exposed = true;
      }
      service.set('exposed', exposed);
    },

    /**
      Handles the click on the file input and dispatches to the proper function
      depending if a file has been previously loaded or not.

      @method handleFileClick
      @param {Y.EventFacade} e An event object.
    */
    handleFileClick: function(e) {
      if (e.currentTarget.getHTML().indexOf('Remove') < 0) {
        // Because we can't style file input buttons properly we style a normal
        // element and then simulate a click on the real hidden input when our
        // fake button is clicked.
        e.container.one('input[type=file]').getDOMNode().click();
      } else {
        this.onRemoveFile(e);
      }
    },

    /**
      Handle the file upload click event. Creates a FileReader instance to
      parse the file data.


      @method onFileChange
      @param {Y.EventFacade} e An event object.
    */
    handleFileChange: function(e) {
      var file = e.currentTarget.get('files').shift(),
          reader = new FileReader();
      reader.onerror = Y.bind(this.onFileError, this);
      reader.onload = Y.bind(this.onFileLoaded, this);
      reader.readAsText(file);
      e.container.one('.fakebutton').setHTML(file.name + ' - Remove file');
    },

    /**
      Callback called when an error occurs during file upload.
      Hide the charm configuration section.

      @method onFileError
      @param {Object} e An event object (with a "target.error" attr).
    */
    onFileError: function(e) {
      var error = e.target.error, msg;
      switch (error.code) {
        case error.NOT_FOUND_ERR:
          msg = 'File not found';
          break;
        case error.NOT_READABLE_ERR:
          msg = 'File is not readable';
          break;
        case error.ABORT_ERR:
          break; // noop
        default:
          msg = 'An error occurred reading this file.';
      }
      if (msg) {
        var db = this.inspector.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Error reading configuration file',
              message: msg,
              level: 'error'
            }));
      }
    },

    /**
      Callback called when a file is correctly uploaded.
      Hide the charm configuration section.

      @method onFileLoaded
      @param {Object} e An event object.
    */
    onFileLoaded: function(e) {
      //set the fileContent on the view-container so we can have access to it
      // when the user submit their config.
      this.inspector.fileContent = e.target.result;
      if (!this.inspector.fileContent) {
        // Some file read errors do not go through the error handler as
        // expected but instead return an empty string.  Warn the user if
        // this happens.
        var db = this.inspector.get('db');
        db.notifications.add(
            new models.Notification({
              title: 'Configuration file error',
              message: 'The configuration file loaded is empty.  ' +
                  'Do you have read access?',
              level: 'error'
            }));
      }
      var container = this.inspector.get('container');
      container.all('.settings-wrapper').hide();
      container.one('.toggle-settings-help').hide();
    },

    /**
      Handle the file remove click event by clearing out the input
      and resetting the UI.

      @method onRemoveFile
      @param {Y.EventFacade} e an event object from click.
    */
    onRemoveFile: function(e) {
      var container = this.inspector.get('container');
      this.inspector.fileContent = null;
      container.one('.fakebutton').setHTML('Import config file...');
      container.all('.settings-wrapper').show();
      // Replace the file input node.  There does not appear to be any way
      // to reset the element, so the only option is this rather crude
      // replacement.  It actually works well in practice.
      container.one('input[type=file]')
               .replace(Y.Node.create('<input type="file"/>'));
    },

    /**
      Pulls the content from each configuration field and sends the values
      to the environment

      @method saveConfig
    */
    saveConfig: function() {
      var inspector = this.inspector,
          env = inspector.get('env'),
          db = inspector.get('db'),
          service = inspector.get('model'),
          charmUrl = service.get('charm'),
          charm = db.charms.getById(charmUrl),
          schema = charm.get('config').options,
          container = inspector.get('container'),
          button = container.one('button.confirm');

      button.set('disabled', 'disabled');

      var newVals = utils.getElementsValuesMapping(container, '.config-field');
      var errors = utils.validate(newVals, schema);

      if (Y.Object.isEmpty(errors)) {
        env.set_config(
            service.get('id'),
            newVals,
            null,
            Y.bind(this._setConfigCallback, this, container)
        );
      } else {
        db.notifications.add(
            new models.Notification({
              title: 'Error saving service config',
              message: 'Error saving service config',
              level: 'error'
            })
        );
        // We don't have a story for passing the full error messages
        // through so will log to the console for now.
        console.log('Error setting config', errors);
      }
    },

    /**
      Handles the success or failure of setting the new config values

      @method _setConfigCallback
      @param {Y.Node} container of the view-container.
      @param {Y.EventFacade} e yui event object.
    */
    _setConfigCallback: function(container, e) {
      container.one('.controls .confirm').removeAttribute('disabled');
      // If the user has conflicted fields and still choose to
      // save then we will be overwriting the values in Juju.
      var bindingEngine = this.inspector.bindingEngine;
      bindingEngine.clearChangedValues.call(bindingEngine, 'config');
      var db = this.inspector.get('db');
      if (e.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error setting service config',
              message: 'Service name: ' + e.service_name,
              level: 'error'
            })
        );
      } else {
        // XXX show saved notification
        // we have no story for this yet
        db.notifications.add(
            new models.Notification({
              title: 'Config saved successfully ',
              message: e.service_name + ' config set successfully.',
              level: 'info'
            })
        );
      }
    },

    /**
      Handle saving the service constraints.
      Make the corresponding environment call, passing _saveConstraintsCallback
      as callback (see below).

      @method saveConstraints
      @param {Y.EventFacade} ev An event object.
      @return {undefined} Nothing.
    */
    saveConstraints: function(ev) {
      var inspector = this.inspector;
      var container = inspector.get('container');
      var env = inspector.get('env');
      var service = inspector.get('model');
      // Retrieve constraint values.
      var constraints = utils.getElementsValuesMapping(
          container, '.constraint-field');
      // Disable the "Save" button while the RPC call is outstanding.
      container.one('.save-constraints').set('disabled', 'disabled');
      // Set up the set_constraints callback and execute the API call.
      var callback = Y.bind(this._saveConstraintsCallback, this, container);
      env.set_constraints(service.get('id'), constraints, callback);
    },

    /**
      Callback for saveConstraints.
      React to responses arriving from the API server.

      @method _saveConstraintsCallback
      @private
      @param {Y.Node} container The inspector container.
      @param {Y.EventFacade} ev An event object.
      @return {undefined} Nothing.
    */
    _saveConstraintsCallback: function(container, ev) {
      var inspector = this.inspector;
      var bindingEngine = inspector.bindingEngine;
      bindingEngine.clearChangedValues('constraints');
      var db = inspector.get('db');
      var service = inspector.get('model');
      if (ev.err) {
        // Notify an error occurred while updating constraints.
        db.notifications.add(
            new models.Notification({
              title: 'Error setting service constraints',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              modelId: service
            })
        );
      } else {
        // XXX frankban: show success notification.
        // We have no story for this yet.
        db.notifications.add(
            new models.Notification({
              title: 'Constraints saved successfully',
              message: ev.service_name + ' constraints set successfully.',
              level: 'info'
            })
        );
      }
      container.one('.save-constraints').removeAttribute('disabled');
    }

  };

  /**
    Service Inspector View Container Controller

    @class ServiceInspector
   */
  var ServiceInspector = (function() {
    var juju = Y.namespace('juju');

    var DEFAULT_VIEWLETS = {
      overview: {
        name: 'overview',
        template: Templates.serviceOverview,
        bindings: {
          aggregated_status: {
            'update': function(node, value) {
              var bar = this._statusbar;
              if (!bar) {
                bar = this._statusbar = new views.StatusBar({
                  target: node.getDOMNode()
                }).render();
              }
              bar.update(value);
            }
          },
          icon: {
            'update': function(node, value) {
              // XXX: Icon is only present on services that pass through
              // the Ghost phase of the GUI. Once we have better integration
              // with the charm browser API services handling of icon
              // can be improved.
              var icon = Y.one(node).one('img');
              if (!icon) {
                icon = Y.one(node).append('<img>');
              }
              icon.set('src', value);
            }
          },
          units: {
            depends: ['aggregated_status'],
            'update': function(node, value) {
              var units = {units: value.toArray()};
              node.setHTML(Templates.serviceOverviewUnitList(units));
            }
          }
        }
      },
      config: {
        name: 'config',
        template: Templates['service-configuration'],
        'render': function(service, viewContainerAttrs) {
          var settings = [];
          var db = viewContainerAttrs.db;
          var charm = db.charms.getById(service.get('charm'));
          var charmConfig = charm.get('config');
          var charmOptions = charmConfig && charmConfig.options;
          Y.Object.each(charmConfig, function(value, key) {
            var setting = {
              name: key,
              value: value
            };
            var option = charmOptions[key];
            if (option) {
              setting.description = option.description;
              setting.type = option.type;
            }
            settings.push(setting);
          });
          this.container = Y.Node.create(this.templateWrapper);
          this.container.setHTML(
              this.template({
                service: service,
                settings: settings,
                exposed: service.get('exposed')}));
          this.container.all('textarea.config-field')
                        .plug(plugins.ResizingTextarea,
                              { max_height: 200,
                                min_height: 18,
                                single_line: 18});
        },
        bindings: {
          exposed: {
            'update': function(node, value) {
              var img = node.one('img');
              var span = node.one('span');
              if (value) {
                img.set('src', '/juju-ui/assets/images/slider_on.png');
                span.set('text', 'Yes');
                span.removeClass('off');
                span.addClass('on');
              } else {
                img.set('src', '/juju-ui/assets/images/slider_off.png');
                span.set('text', 'No');
                span.removeClass('on');
                span.addClass('off');
              }
            }
          }
        },
        'conflict': function(node, model, viewletName, resolve) {
          /**
            Calls the databinding resolve method
            @method sendResolve
          */
          function sendResolve(e) {
            handler.detach();
            if (e.currentTarget.hasClass('conflicted-confirm')) {
              node.setStyle('borderColor', 'black');
              resolve(node, viewletName, newVal);
            }
            // if they don't accept the new value then do nothing.
            message.setStyle('display', 'none');
          }

          node.setStyle('borderColor', 'red');

          var message = node.ancestor('.settings-wrapper').one('.conflicted'),
              newVal = model.get(node.getData('bind'));

          message.one('.newval').setHTML(newVal);
          message.setStyle('display', 'block');

          var handler = message.delegate('click', sendResolve, 'button', this);
        },
        'unsyncedFields': function(dirtyFields) {
          this.container.one('.controls .confirm').setHTML('Overwrite');
        },
        'syncedFields': function() {
          this.container.one('.controls .confirm').setHTML('Confirm');
        }
      },
      // Service constraints viewlet.
      constraints: {
        name: 'constraints',
        template: Templates['service-constraints-viewlet'],
        readOnlyConstraints: ['provider-type', 'ubuntu-series'],
        constraintDescriptions: {
          arch: {title: 'Architecture'},
          cpu: {title: 'CPU', unit: 'Ghz'},
          'cpu-cores': {title: 'CPU Cores'},
          'cpu-power': {title: 'CPU Power', unit: 'Ghz'},
          mem: {title: 'Memory', unit: 'GB'}
        },

        bindings: {
          'constraints': {
            'format': function(value) {
              // Display undefined constraints as empty strings.
              return value || '';
            }
          }
        },

        'render': function(service, options) {
          var constraints = utils.getConstraints(
              service.get('constraints') || {},
              options.env.genericConstraints,
              this.readOnlyConstraints,
              this.constraintDescriptions);
          var contents = this.template({
            service: service,
            constraints: constraints
          });
          this.container = Y.Node.create(this.templateWrapper);
          this.container.setHTML(contents);
        },

        'conflict': function(node, model, viewletName, resolve) {
          /**
            Calls the databinding resolve method.
            @method sendResolve
          */
          function sendResolve(ev) {
            handler.detach();
            if (ev.currentTarget.hasClass('conflicted-confirm')) {
              resolve(node, viewletName, newValue);
            }
            // If the user does not accept the new value then do nothing.
            message.hide();
          }
          var newValue = model.get(node.getData('bind'));
          if (newValue !== node.get('value')) {
            // If the value changed, give the user the possibility to
            // select which value to preserve.
            var message = node.ancestor('.control-group').one('.conflicted');
            message.one('.newval').setHTML(newValue);
            message.show();
            var handler = message.delegate(
                'click', sendResolve, 'button', this);
          } else {
            // Otherwise, just resolve this conflict.
            resolve(node, viewletName, newValue);
          }
        }
      },
      //relations: {},
      ghostConfig: {
        name: 'ghostConfig',
        template: Templates['ghost-config-viewlet'],
        'render': function(model) {
          this.container = Y.Node.create(this.templateWrapper);

          var options = model.getAttrs();
          // XXX - Jeff
          // not sure this should be done like this
          // but this will allow us to use the old template.

          options.settings = utils.extractServiceSettings(options.options);

          this.container.setHTML(this.template(options));
        }
      }
    };

    // This variable is assigned an aggregate collection of methods and
    // properties provided by various controller objects in the
    // ServiceInspector constructor.
    var controllerPrototype = {};
    /**
      Constructor for View Container Controller

      @method ServiceInspector
      @constructor
    */
    function ServiceInspector(model, options) {
      this.model = model;
      this.options = options;
      options = options || {};
      options.viewlets = {};
      options.templateConfig = options.templateConfig || {};

      var container = Y.Node.create('<div>')
          .addClass('panel')
          .addClass('yui3-juju-inspector')
          .appendTo(Y.one('#content'));

      var self = this;
      options.container = container;
      options.viewletContainer = '.viewlet-container';

      // Build a collection of viewlets from the list of required viewlets.
      var viewlets = {};
      options.viewletList.forEach(function(viewlet) {
        viewlets[viewlet] = DEFAULT_VIEWLETS[viewlet];
      });
      // Mix in any custom viewlet configuration options provided by the config.
      options.viewlets = Y.mix(
          viewlets, options.viewlets, true, undefined, 0, true);

      options.model = model;

      // Merge the various prototype objects together.  Additionally, merge in
      // mixins that provide functionality used in the inspector's events.
      var c = Y.juju.controller;
      [c.ghostInspector,
        c.serviceInspector,
        manageUnitsMixin,
        exposeButtonMixin]
        .forEach(function(controller) {
            controllerPrototype = Y.mix(controllerPrototype, controller);
          });

      // Bind the viewletEvents to this class.
      Y.Object.each(options.viewletEvents, function(
          handlers, selector, collection) {
            // You can have multiple listeners per selector.
            Y.Object.each(handlers, function(callback, event, obj) {
              options.viewletEvents[selector][event] = Y.bind(
                  controllerPrototype[callback], self);
            });
          });

      options.events = Y.mix(options.events, options.viewletEvents);

      this.inspector = new views.ViewContainer(options);
      this.inspector.render();
      this.inspector.showViewlet(options.viewletList[0]);
    }

    ServiceInspector.prototype = controllerPrototype;

    return ServiceInspector;
  })();

  views.ServiceInspector = ServiceInspector;
}, '0.1.0', {
  requires: ['panel',
    'dd',
    'd3-statusbar',
    'juju-databinding',
    'juju-view-container',
    'juju-view-utils',
    'juju-models',
    'base-build',
    'handlebars',
    'node',
    'view',
    'event-key',
    'transition',
    'event-resize',
    'json-stringify']
});
