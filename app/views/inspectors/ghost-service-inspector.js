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

YUI.add('ghost-service-inspector', function(Y) {
  var ns = Y.namespace('juju.views'),
      viewlets = Y.namespace('juju.viewlets'),
      models = Y.namespace('juju.models'),
      utils = ns.utils;

  var name = 'ghost-service-inspector',
      extensions = [ns.ServiceInspectorUtilsExtension];

  ns.GhostServiceInspector = Y.Base.create(name, ns.Inspector, extensions, {

    template: Y.juju.views.Templates['ghost-config-wrapper'],

    slots: {
      'header': '.header-slot'
    },

    views: {
      inspectorHeader: viewlets.InspectorHeader,
      ghostConfig: viewlets.GhostConfig
    },

    events: {
      '.close': { click: 'resetCanvas' },
      '.cancel': { click: 'resetCanvas' },
      '.confirm': { click: 'deployCharm' },
      // The following event handlers are provided in the
      // ServiceInspectorUtilsExtension
      '.initiate-destroy': {click: '_onInitiateDestroy'},
      '.cancel-destroy': {click: '_onCancelDestroy'},
      '.destroy-service-trigger span': {click: '_onDestroyClick'},
      // Used by the config viewlet for keeping the checkbox values
      // in sync across the slider/checkbox/text representation.
      '.hidden-checkbox': {change: 'onCheckboxUpdate'}
    },

    /**
      Inspector subclass render method.

      @method renderUI
    */
    renderUI: function() {
      // We manually show this because it's in a slot so it isn't rendered
      // by default.
      this.showViewlet('inspectorHeader');
    },

    /**
      Resets the changes that the inspector made in the canvas before
      destroying the viewlet Manager on Cancel

      @method resetCanvas
    */
    resetCanvas: function() {
      // This code has a fragile dependency: the inspector-header.js render
      // method expects these parentheses around the model displayName.  If you
      // change this format, or this code, make sure you look at that method
      // too.  Hopefully the associated tests will catch it as well.
      // Also see(grep for) the updateGhostName method too.
      var model = this.get('model');
      model.set('displayName', '(' + model.get('packageName') + ')');
      this.destroy();
    },

    /**
      Handles deployment of the charm.

      @method handleDeploy
    */
    deployCharm: function() {
      var container = this.get('container'),
          model = this.get('model'),
          db = this.get('db'),
          serviceName = container.one('input[name=service-name]').get('value'),
          isSubordinate = model.get('subordinate'),
          numUnits = (
              isSubordinate ? 0 :
              parseInt(
                  container.one('input[name=number-units]').get('value'), 10)),
          config;

      if (!utils.validateServiceName(serviceName, db)) {
        db.notifications.add(
            new models.Notification({
              title: 'Attempting to deploy service ' + serviceName,
              message: 'The requested service name is invalid.',
              level: 'error'
            }));
        return false;
      }

      // Check if a file has been uploaded and use that config.
      if (this.configFileContent) {
        config = null;
      } else {
        config = utils.getElementsValuesMapping(
            container, '.service-config .config-field');
        config = utils.getChangedConfigOptions(
            config, this.get('charmModel').get('options'));
      }

      // Deploy needs constraints in simple key:value object.
      var constraints = utils.getElementsValuesMapping(
          container, '.constraint-field');

      this.get('env').deploy(
          model.get('charm'),
          serviceName,
          config,
          this.configFileContent,
          numUnits,
          constraints,
          null, // Always deploy units to new machines for now.
          Y.bind(this._deployCallbackHandler,
                 this,
                 serviceName,
                 config,
                 constraints));
    },

    /**
      The callback handler from the env.deploy() of the charm.

      @method _deployCallbackHandler
      @param {String} serviceName The service name.
      @param {Object} config The configuration object of the service.
      @param {Y.EventFacade} e The event facade from the deploy event.
    */
    _deployCallbackHandler: function(serviceName, config, constraints, e) {
      var db = this.get('db'),
          ghostService = this.get('model'),
          environmentView = this.get('environment'),
          topo = this.get('topo');

      if (e.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error deploying ' + serviceName,
              message: 'Could not deploy the requested service. Server ' +
                  'responded with: ' + e.err,
              level: 'error'
            }));
        return;
      }

      db.notifications.add(
          new models.Notification({
            title: 'Deployed ' + serviceName,
            message: 'Successfully deployed the requested service.',
            level: 'info'
          }));

      // Now that we are using the same model for the ghost and service views
      // we need to close the inspector to deactivate the databinding
      // before setting else we end up with a race condition on nodes which
      // no longer exist.
      this.destroy();

      var ghostId = ghostService.get('id');
      ghostService.setAttrs({
        id: serviceName,
        displayName: undefined,
        pending: false,
        loading: false,
        config: config,
        constraints: constraints
      });

      // Transition the ghost viewModel to the new
      // service. It's alive!
      var boxModel = topo.service_boxes[ghostId];
      boxModel.id = serviceName;
      boxModel.pending = false;
      delete topo.service_boxes[ghostId];
      topo.service_boxes[serviceName] = boxModel;

      // Set to initial UI state.
      environmentView.createServiceInspector(ghostService);
      topo.showMenu(serviceName);
      topo.annotateBoxPosition(boxModel);
    }
  });

}, '', {
  requires: [
    'inspector-base',
    'juju-templates',
    'juju-models',
    'service-inspector-utils-extension'
  ]
});
