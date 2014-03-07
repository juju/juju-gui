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
  The ghost inspector is the viewlet manager implementation of the ghost
  configuration view.

  @module views
  @submodule views.ghostInspector
 */

YUI.add('juju-ghost-inspector', function(Y) {

  var juju = Y.juju,
      views = juju.views,
      Templates = views.Templates,
      models = juju.models,
      utils = views.utils;

  /**
    JujuGUI app extension to add the ghost deployer method.

    @class GhostDeployer
    @extension App
  */
  function GhostDeployer() {}

  GhostDeployer.prototype = {

    /**
      Show the deploy/configuration panel for a charm.

      @method deployService
      @param {Y.Model} charm model to add to the charms database.
    */
    deployService: function(charm, ghostAttributes) {
      // This flag is still required because it comes fully populated from the
      // browser but won't be fully populated when coming in on the delta.
      charm.loaded = true;
      this.db.charms.add(charm);

      var ghostService = this.db.services.ghostService(charm);
      if (ghostAttributes !== undefined) {
        if (ghostAttributes.coordinates !== undefined) {
          var annotations = ghostService.get('annotations');
          annotations['gui-x'] = ghostAttributes.coordinates[0];
          annotations['gui-y'] = ghostAttributes.coordinates[1];
        }
        ghostService.set('icon', ghostAttributes.icon);
      }
      var environment = this.views.environment.instance;
      environment.createServiceInspector(ghostService);
    }
  };

  Y.namespace('juju').GhostDeployer = GhostDeployer;

  /**
    A collection of methods and properties which will be mixed into the
    prototype of the viewlet manager controller to add the functionality for
    the ghost inspector interactions

    @property ghostInspector
    @submodule juju.controller
    @type {Object}
  */
  Y.namespace('juju.controller').ghostInspector = {
    /**
      Handles deployment of the charm.

      @method handleDeploy
    */
    deployCharm: function() {
      var options = this.options,
          container = options.container,
          model = this.model,
          serviceName = container.one('input[name=service-name]').get('value'),
          isSubordinate = model.get('subordinate'),
          numUnits = (
              isSubordinate ? 0 :
              parseInt(
                  container.one('input[name=number-units]').get('value'), 10)),
          config;

      if (!utils.validateServiceName(serviceName, options.db)) {
        options.db.notifications.add(
            new models.Notification({
              title: 'Attempting to deploy service ' + serviceName,
              message: 'The requested service name is invalid.',
              level: 'error'
            }));
        return false;
      }

      // Check if a file has been uploaded and use that config.
      if (this.viewletManager.configFileContent) {
        config = null;
      } else {
        config = utils.getElementsValuesMapping(
            container, '.service-config .config-field');
        config = utils.getChangedConfigOptions(
            config, options.charmModel.get('options'));
      }

      // Deploy needs constraints in simple key:value object.
      var constraints = utils.getElementsValuesMapping(
          container, '.constraint-field');

      options.env.deploy(
          model.get('charm'),
          serviceName,
          config,
          this.viewletManager.configFileContent,
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
      this.model.set('displayName', '(' + this.model.get('packageName') + ')');
      this.viewletManager.destroy();
    },


    /**
      The callback handler from the env.deploy() of the charm.

      @method _deployCallbackHandler
      @param {String} serviceName The service name.
      @param {Object} config The configuration object of the service.
      @param {Y.EventFacade} e The event facade from the deploy event.
    */
    _deployCallbackHandler: function(serviceName, config, constraints, e) {
      var options = this.options,
          db = options.db,
          ghostService = this.model,
          environmentView = this.options.environment,
          topo = environmentView.topo;

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
      this.closeInspector();

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
    },

    /**
      Destroys the inspector.

      @method closeInspector
    */
    closeInspector: function() {
      this.viewletManager.destroy();
    }
  };

}, '0.1.0', {
  requires: [
  ]
});
