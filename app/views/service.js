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

  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      inspector = Y.namespace('juju.views.inspector'),
      models = Y.namespace('juju.models'),
      plugins = Y.namespace('juju.plugins'),
      utils = Y.namespace('juju.views.utils'),
      viewletNS = Y.namespace('juju.viewlets');

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
   * @class ServiceViewBase
   */
  var ServiceViewBase = Y.Base.create('ServiceViewBase', Y.View,
      [views.JujuBaseView], {

        initializer: function() {
          Y.mix(this, inspector.exposeButtonMixin,
              undefined, undefined, undefined, true);
          Y.mix(this, inspector.manageUnitsMixin,
              undefined, undefined, undefined, true);
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
          var schema = charm.get('options');
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
              schema = charm.get('options'),
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

}, '0.1.0', {
  requires: [
    'base-build',
    'd3-statusbar',
    'dd',
    'event-key',
    'event-resize',
    'handlebars',
    'json-stringify',
    'juju-databinding',
    'juju-models',
    'juju-view-container',
    'juju-view-inspector',
    'juju-view-utils',
    'node',
    'panel',
    'transition',
    'view'
  ]
});
