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
          @param {ViewContainer} inspector instance.
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
          @param {String} type of inspector to create (ghost, service).
          @param {Y.Model} model service or charm depending on inspector type.
          @param {Object} config object of options to overwrite default config.
        */
        createServiceInspector: function(type, model, config) {
          console.log('pending: ', model.get('pending'));
          var serviceInspector = this.getInspector(model.get('id'));
          if (serviceInspector) { return serviceInspector; }

          var combinedConfig = {}
          var configBase = {
            db: this.topo.get('db'),
            events: {
              '.close': {'click': 'destroy'}
            },
          };

          var configService = {
            events: {
              '.tab': {'click': 'showViewlet'}
            },
            viewletList: ['overview', 'units', 'config'],
            template: Y.juju.views.Templates['view-container']
          };

          var configGhost = {
            env: this.topo.get('env'),
            // controller will show the first one in this array by default
            viewletList: ['ghostConfig'],
            // the view container template
            template: Y.juju.views.Templates['ghost-config-wrapper'],
            // these events are for the viewlet container
            events: {
              '.cancel': { 'click': 'destroy' }
            },
            // these events are for the viewlets and have their callbacks bound to
            // the controllers prototype and are then mixed with the containers
            // events for final binding
            viewletEvents: {
              '.deploy': { 'click': 'deployCharm' },
              'input.config-file-upload': { 'change': 'handleFileUpload' },
              'span.config-file-upload': { 'click': '_showFileDialogue' },
              'input[name=service-name]': { 'valuechange': 'updateGhostName' }
            },
            // the configuration for the view container template
            templateConfig: {
              packageName: model.get('package_name'),
              id: model.get('id')
            }
          };

          if (type === 'ghost') {
            combinedConfig = Y.mix(
                configBase, configGhost, true, undefined, 0, true);
          } else if (type === 'service') {
            combinedConfig = Y.mix(
                configBase, configService, true, undefined, 0, true);
          } else {
            console.log('Service inspector type not supported.');
            return;
          }

          Y.mix(combinedConfig, config, true, undefined, 0, true);

          serviceInspector = new views.ServiceInspector(model, combinedConfig);

          serviceInspector.inspector.after('destroy', function(e) {
            this.setInspector(e.currentTarget, true);
          }, this);
          this.setInspector(serviceInspector);
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
              getInspector: Y.bind(this.getInspector, this),
              setInspector: Y.bind(this.setInspector, this),
              createServiceInspector: Y.bind(this.createServiceInspector, this),
              landscape: this.get('landscape'),
              getModelURL: this.get('getModelURL'),
              container: container,
              endpointsController: this.get('endpointsController'),
              nsRouter: this.get('nsRouter')});
            // Bind all the behaviors we need as modules.
            topo.addModule(views.ServiceModule, {useTransitions: true});
            topo.addModule(views.PanZoomModule);
            topo.addModule(views.ViewportModule);
            topo.addModule(views.RelationModule);
            topo.addModule(views.LandscapeModule);
            if (this.get('useDragDropImport')) {
              topo.addModule(views.ImportExportModule);
            }

            topo.addTarget(this);
            this.topo = topo;
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
  requires: ['juju-templates',
             'juju-view-utils',
             'juju-models',
             'juju-topology',
             'base-build',
             'handlebars-base',
             'node',
             'view']
});
