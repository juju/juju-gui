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
 * Provide the EnvironmentView class.
 *
 * @module views
 * @submodule views.environment
 */

YUI.add('juju-view-environment', function(Y) {

  var views = Y.namespace('juju.views'),
      utils = Y.namespace('juju.views.utils'),
      models = Y.namespace('juju.models'),
      Templates = views.Templates;

  /**
   * Display an environment.
   *
   * @class EnvironmentView
   */
  var EnvironmentView = Y.Base.create('EnvironmentView', Y.View,
                                      [views.JujuBaseView],
      {
        /**
         * @method EnvironmentView.initializer
         */
        initializer: function() {
          this.publish('navigateTo', {
            broadcast: true,
            preventable: false});

          this._inspectors = {};
        },

        /**
         * Wrapper around topo.update. Rather than re-rendering a whole
         * topology, the view can require data updates when needed.
         * Ideally even this should not be needed, as we can observe
         * ModelList change events and debounce update calculations
         * internally.
         *
         * @method update
         * @chainable
         */
        update: function() {
          this.topo.update();
          return this;
        },

        /**
          @method getInspector
          @return {Object} inspector.
        */
        getInspector: function(name) {
          return this._inspectors[name];
        },

        /**
          @method setInspector
          @param {ViewletManager} inspector instance.
          @param {Boolean} remove flag to remove the instance.
          @chainable
        */
        setInspector: function(inspector, remove) {
          var name = inspector.getName();
          if (this._inspectors[name] !== undefined && !remove) {
            // Close the old inspector and remove it.
            var existing = this._inspectors[name];
            existing.bindingEngine.unbind();
            existing.container.remove(true);
          }
          if (remove) {
            delete this._inspectors[name];
          } else {
            this._inspectors[name] = inspector;
          }
          return this;
        },

        /**
          Creates a new service inspector instance of the passed in type.

          @method createServiceInspector
          @param {Y.Model} model service or charm depending on inspector type.
          @param {Object} config object of options to overwrite default config.
          @return {Object} The created service inspector.
        */
        createServiceInspector: function(model, config) {
          config = config || {};
          var type = 'service',
              charm = this.get('db').charms.getById(model.get('charm'));

          // This method is called with a charm or service depending on if it's
          // called from the charm browser or from the environment. If it is
          // called from the environment with a ghost it still needs access to
          // the charm so that's what this switcheroo is doing here.
          if (model.get('pending')) {
            type = 'ghost';
            model.set('packageName', charm.get('package_name'));
            config.charmModel = charm;
          }

          // If the user is trying to open the same inspector twice
          var serviceInspector = this.getInspector(model.get('id'));
          if (serviceInspector) {
            return serviceInspector;
          }

          var combinedConfig = {};
          var configs = this._generateConfigs(model);

          if (type === 'ghost') {
            combinedConfig = Y.mix(configs.configBase, configs.configGhost,
                                   true, undefined, 0, true);
          } else if (type === 'service') {
            combinedConfig = Y.mix(configs.configBase, configs.configService,
                                   true, undefined, 0, true);
          }

          Y.mix(combinedConfig, config, true, undefined, 0, true);

          serviceInspector = new views.ServiceInspector(model, combinedConfig);

          // Because the inspector can trigger it's own destruction we need to
          // listen for the event and remove it from the list of open inspectors
          serviceInspector.viewletManager.after('destroy', function(e) {
            this.setInspector(e.currentTarget, true);
            // We want the service menu to hide when the inspector does.
            // For now, at least, with only one inspector, we can simply close
            // all service menus.  We expect the service menus to go away
            // soon-ish anyway in favor of a new approach.
            this.topo.fire('hideServiceMenu');
          }, this);

          // If the service is destroyed from the console then we need to
          // destroy the inspector and hide the service menu.
          model.on('destroy', function(e) {
            var service = e.currentTarget;
            var inspector = this.getInspector(service.get('id'));
            if (inspector) { inspector.viewletManager.destroy(); }
            this.topo.fire('hideServiceMenu');
          }, this);

          // Restrict to a single inspector instance
          if (Y.Object.size(this._inspectors) >= 1) {
            Y.Object.each(this._inspectors, function(inspector) {
              inspector.viewletManager.destroy();
            });
          }

          this.setInspector(serviceInspector);
          return serviceInspector;
        },

        /**
          Basic method to return a populated configuration object for all of the
          different service inspector view types

          @method _generateConfigs
          @param {Y.Model} model of the service.
          @return {Object} an object containing the configuration objects.
        */
        _generateConfigs: function(model) {
          var configs = {
            configBase: {
              db: this.topo.get('db'),
              env: this.topo.get('env'),
              environment: this,
              store: this.topo.get('store'),
              events: {
                '.close-slot': {'click': 'hideSlot'}
              }
            },
            configService: {
              events: {
                '.close': {'click': 'destroy'},
                '.tab': {'click': 'switchTab'}
              },
              viewletEvents: {
                // Viewlet wrapper viewlet.
                '.charm-url': {click: 'onShowCharmDetails'},
                '.destroy-service-trigger span': {click: '_onDestroyClick'},
                '.initiate-destroy': {click: '_onInitiateDestroy'},
                '.cancel-destroy': {click: '_onCancelDestroy'},
                '.rerender-config': {click: 'reloadInspector'},
                // Overview viewlet.
                '.num-units-control': {
                  keydown: 'modifyUnits'
                },
                '.cancel-num-units': { click: '_closeUnitConfirm'},
                '.confirm-num-units': { click: '_confirmUnitChange'},
                'a.edit-constraints': { click: '_showEditUnitConstraints'},
                // Settings viewlet.
                '.settings-config button.confirm': { click: 'saveConfig'},
                '.settings-config button.cancel': { click: 'cancelConfig'},
                'input.expose-toggle': { click: 'toggleExpose' },
                '.config-file .fakebutton': { click: 'handleFileClick'},
                '.config-file input[type=file]': { change: 'handleFileChange'},
                // Constraints viewlet.
                '.save-constraints': {click: 'saveConstraints'},
                '.settings-constraints button.cancel': {
                  click: 'cancelConstraints'},
                // Overview units viewlet.
                '.status-unit-header': {click: 'toggleUnitHeader'},
                '.unit-details': { click: 'showUnit'},
                '.toggle-select-all': {click: 'toggleSelectAllUnits'},
                'a[data-unit]': { click: 'showUnitDetails'},
                'button.unit-action-button': { click: '_unitActionButtonClick'},
                '.upgrade-link': { click: 'upgradeService' },
                // Used by the config viewlet for keeping the checkbox values
                // in sync across the slider/checkbox/text representation.
                '.hidden-checkbox': {change: 'onCheckboxUpdate'}
              },
              viewletList: [
                'overview', // Default viewlet first.
                'charmDetails',
                'config',
                'constraints',
                'unitDetails',
                'inspectorHeader',
                'relations'
              ],
              template: Y.juju.views.Templates['service-config-wrapper'],
              // Define the context for the view manager template.
              templateConfig: {subordinate: model.get('subordinate')}
            },
            configGhost: {
              // controller will show the first one in this array by default
              viewletList: ['ghostConfig', 'inspectorHeader', 'charmDetails'],
              // the viewlet manager template
              template: Y.juju.views.Templates['ghost-config-wrapper'],
              // these events are for the viewlet manager
              events: {},
              // these events are for the viewlets and have their callbacks
              // bound to the controllers prototype and are then mixed with the
              // manager's events for final binding
              viewletEvents: {
                '.close': { 'click': 'resetCanvas' },
                '.cancel': { 'click': 'resetCanvas' },
                '.charm-url': {click: 'onShowCharmDetails'},
                '.confirm': { click: 'deployCharm' },
                '.config-file .fakebutton': { click: 'handleFileClick'},
                '.config-file input[type=file]': { change: 'handleFileChange'},
                'input[name=service-name]': { valuechange: 'updateGhostName' },
                '.initiate-destroy': {click: '_onInitiateDestroy'},
                '.cancel-destroy': {click: '_onCancelDestroy'},
                '.destroy-service-trigger span': {click: '_onDestroyClick'},
                'input#use-default-toggle': {change: 'setDefaultSettings'},
                // Used by the config viewlet for keeping the checkbox values
                // in sync across the slider/checkbox/text representation.
                '.hidden-checkbox': {change: 'onCheckboxUpdate'}
              },
              // the configuration for the view manager template
              templateConfig: {
                packageName: model.get('package_name'),
                id: model.get('id')
              }
            }
          };
          return configs;
        },

        /**
         * @method render
         * @chainable
         */
        render: function() {
          var container = this.get('container'),
              topo = this.topo,
              db = this.get('db'),
              self = this;

          // If we need the initial HTML template, take care of that.
          if (!this._rendered) {
            EnvironmentView.superclass.render.apply(this, arguments);
            container.setHTML(Templates.overview());
            this._rendered = true;
          }

          topo = this.createTopology();
          topo.recordSubscription(
              'ServiceModule',
              db.services.after('remove',
                                Y.bind(this.updateHelpIndicator, this)));

          topo.recordSubscription(
              'ServiceModule',
              db.services.after('add', Y.bind(this.updateHelpIndicator, this)));

          topo.render();
          topo.once('rendered', Y.bind(this.updateHelpIndicator, this));
          return this;
        },

        /**
          createTopology, called automatically.

          @method createTopology
         */
        createTopology: function() {
          var container = this.get('container'),
              topo = this.topo;
          if (!topo) {
            topo = new views.Topology();
            topo.setAttrs({
              size: [640, 480],
              env: this.get('env'),
              db: this.get('db'),
              store: this.get('store'),
              getInspector: Y.bind(this.getInspector, this),
              setInspector: Y.bind(this.setInspector, this),
              createServiceInspector: Y.bind(this.createServiceInspector, this),
              getModelURL: this.get('getModelURL'),
              container: container,
              endpointsController: this.get('endpointsController'),
              nsRouter: this.get('nsRouter')});
            // Bind all the behaviors we need as modules.
            topo.addModule(views.ServiceModule, {useTransitions: true});
            topo.addModule(views.PanZoomModule);
            topo.addModule(views.ViewportModule);
            topo.addModule(views.RelationModule);

            topo.addTarget(this);
            this.topo = topo;
            this._attachTopoEvents();
          }
          return topo;
        },

        /**
         * Support for canvas help function (when canvas is empty).
         *
         * @method updateHelpIndicator
         */
        updateHelpIndicator: function(evt) {
          var helpText = this.get('container').one('#environment-help'),
              db = this.get('db'),
              services = db.services;
          if (helpText) {
            if (services.size() === 0) {
              helpText.show(true);
            } else {
              helpText.hide(true);
            }
          }
        },
        /**
         * Render callback handler, triggered from app when the view renders.
         *
         * @method render.rendered
         */
        rendered: function() {
          this.topo.fire('rendered');
          // Bind d3 events (manually).
          this.topo.bindAllD3Events();
        },

        /**
          Loops through the inspectors and destroys them all

          @method destroyInspector
        */
        destroyInspector: function() {
          // We only have a single inspector - this will need to be
          // expanded on when/if this changes.
          Y.Object.each(this._inspectors, function(inspector) {
            inspector.viewletManager.destroy();
          });
        },

        /**
          Shrinks any open inspectors

          @method shrinkInspector
        */
        shrinkInspector: function() {
          Y.Object.each(this._inspectors, function(inspector) {
            inspector.viewletManager.get('container')
                .one('.viewlet-manager-wrapper')
                .setStyle('max-height', '100px');
          });
        },

        /**
          Expands any open inspectors

          @method expandInspector
        */
        expandInspector: function() {
          Y.Object.each(this._inspectors, function(inspector) {
            inspector.viewletManager.recalculateHeight();
          });
        },

        /**
          Attaches events after the topology has been created.

          @method _attachTopoEvents
        */
        _attachTopoEvents: function() {
          this.topo.on(
              '*:destroyServiceInspector', this.destroyInspector, this);
          this.topo.on(
              '*:addRelationStart', this.shrinkInspector, this);
          this.topo.on(
              '*:addRelationEnd', this.expandInspector, this);
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

  views.environment = EnvironmentView;

}, '0.1.0', {
  requires: [
    'base-build',
    'handlebars-base',
    'juju-models',
    'juju-templates',
    'juju-topology',
    'juju-view-inspector',
    'juju-view-utils',
    'node',
    'view'
  ]
});
