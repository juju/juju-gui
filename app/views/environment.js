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
  var EnvironmentView = Y.Base.create('EnvironmentView', Y.View, [
    views.JujuBaseView, Y.Event.EventTracker
  ], {
    /**
     * @method EnvironmentView.initializer
     */
    initializer: function() {
      this.publish('navigateTo', {
        broadcast: true,
        preventable: false});

      this.inspector = null;
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
      Creates a new service inspector instance of the passed in type.

      @method createServiceInspector
      @param {Y.Model} model service or charm depending on inspector type.
      @param {Object} config object of options to overwrite default config.
      @return {Object} The created service inspector.
    */
    createServiceInspector: function(model, config) {
      config = config || {};
      // If the user is trying to open the same inspector twice
      if (this.inspector) {
        if (this.inspector.get('model').get('clientId') ===
            model.get('clientId')) {
          return this.inspector;
        }
      }

      var db = this.get('db'),
          env = this.get('env'),
          ecs = this.get('ecs'),
          topo = this.topo,
          charm = db.charms.getById(model.get('charm')),
          inspector = {};

      // This method is called with a charm or service. If it's called with a
      // charm then it needs to show the ghost inspector instead of the service
      // inspector.
      if (model.get('pending')) {
        model.set('packageName', charm.get('package_name'));
        // XXX In order to support the events below we need to use the same
        // object structure. Once the Service inspector is converted to
        // an inspector subclass the following events can be fixed.
        inspector = new Y.juju.views.GhostServiceInspector({
          db: db,
          model: model,
          env: env,
          ecs: ecs,
          environment: this,
          charmModel: charm,
          topo: topo,
          store: topo.get('store')
        }).render();
      } else {
        var inspectorConfig = Y.mix({
          db: db,
          model: model,
          env: env,
          ecs: ecs,
          environment: this,
          enableDatabinding: true,
          topo: topo,
          store: topo.get('store')
        }, config, true);
        inspector = new Y.juju.views.ServiceInspector(inspectorConfig).render();
      }

      // Because the inspector can trigger it's own destruction we need to
      // listen for the event and remove it from the list of open inspectors
      inspector.after('destroy', function(e) {
        delete this.inspector;
        // We want the service menu to hide when the inspector does.
        // For now, at least, with only one inspector, we can simply close
        // all service menus.  We expect the service menus to go away
        // soon-ish anyway in favor of a new approach.
        this.topo.fire('hideServiceMenu');
      }, this);


      // If the service is destroyed from the console then we need to
      // destroy the inspector and hide the service menu.
      model.on('destroy', function(e) {
        var inspector = this.inspector;
        if (inspector) { inspector.destroy(); }
        this.topo.fire('hideServiceMenu');
      }, this);

      if (this.inspector) { this.inspector.destroy(); }

      this.inspector = inspector;
      return inspector;
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
          ecs: this.get('ecs'),
          env: this.get('env'),
          db: this.get('db'),
          store: this.get('store'),
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
      if (this.inspector) {
        this.inspector.destroy();
      }
    },

    /**
      Attaches events after the topology has been created.

      @method _attachTopoEvents
    */
    _attachTopoEvents: function() {
      this.topo.on(
          '*:destroyServiceInspector', this.destroyInspector, this);
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
    'event-tracker',
    'handlebars-base',
    'juju-models',
    'juju-templates',
    'juju-topology',
    'juju-view-utils',
    'service-inspector',
    'ghost-service-inspector',
    'node',
    'view'
  ]
});
