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

        // Identify all networks that the service could connect to.
        var availableNetworks = [];
        this.db.networks.each(function(net) {
          availableNetworks.push(net.getAttrs());
        });
        ghostService.set('availableNetworks', availableNetworks);
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

      // Get networks with true/false values indicating service connection.
      var networks = utils.getElementsValuesMapping(
          container, '.hidden-checkbox');

      // Turn networks hash into an array of true networks.
      var networksList = [];
      for (var network in networks) {
        if (networks[network]) {
          networksList.push(network);
        }
      }
      networks = networksList;

      // Override the service networks attribute with the correct networks.
      // Hacky solution for UI prototype.
      model.setAttrs({networks: networks});

      options.env.deploy(
          model.get('charm'),
          serviceName,
          config,
          this.viewletManager.configFileContent,
          numUnits,
          constraints,
          Y.bind(this._deployCallbackHandler,
                 this,
                 serviceName,
                 config,
                 constraints));
    },

    /**
      Destroys the inspector.

      @method closeInspector
    */
    closeInspector: function() {
      this.viewletManager.destroy();
    },

    /**
      Updates the status of the service name input.

      @method serviceNameInputStatus
      @param {Boolean} valid status of the service name check.
      @param {Y.Node} input a reference to the input node instance.
    */
    serviceNameInputStatus: function(valid, input) {
      if (valid) {
        input.removeClass('invalid');
        input.addClass('valid'); // add checkmark
      } else {
        input.removeClass('valid');
        input.addClass('invalid'); // add x
      }
    },

    /**
      Updates the ghost service name when the user changes it in the inspector.

      @method updateGhostName
      @param {Y.EventFacade} e event object from valuechange.
    */
    updateGhostName: function(e) {
      // This code has a fragile dependency: the inspector-header.js render
      // method expects these parentheses around the model displayName.  If you
      // change this format, or this code, make sure you look at that method
      // too.  Hopefully the associated tests will catch it as well.
      // Also see resetCanvas, below.
      var name = e.newVal,
          db = this.options.db,
          serviceName = '(' + name + ')';

      var isValid = utils.validateServiceName(name, db);

      this.model.set('displayName', serviceName);
      this.serviceNameInputStatus(isValid, e.currentTarget);
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
      // Also see updateGhostName, above.
      this.model.set('displayName', '(' + this.model.get('packageName') + ')');
      this.viewletManager.destroy();
    },

    /**
      Toggles the settings configuration in the ghost inspector to
      the default values.

      @method setDefaultSettings
      @param {Y.EventFacade} e change event from the checkbox.
    */
    setDefaultSettings: function(e) {
      var useDefaults = true;
      // This allows us to call this method to set to default as
      // well as use it as a callback.
      if (e.type) {
        useDefaults = e.currentTarget.get('checked');
      }

      var container = this.viewletManager.get('container'),
          ghostConfigNode = container.one(
              '.service-configuration .charm-settings');

      var textareas = ghostConfigNode.all('textarea'),
          inputs = ghostConfigNode.all('input');

      if (useDefaults) {
        ghostConfigNode.addClass('use-defaults');
        textareas.setAttribute('disabled');
        inputs.setAttribute('disabled');

        var charmModel = this.viewletManager.get('charmModel');
        // Loop through the fields to set the values back to their defaults
        // We can't use the data binding because setting it to it's default
        // value doesn't trigger the databinding change events.
        Y.Object.each(charmModel.get('options'), function(opt, key) {
          var newVal = (opt['default'] === undefined) ? '' : opt['default'];
          var input = container.one('#input-' + key);

          if (input) {
            if (input.get('type') !== 'checkbox') {
              input.set('value', newVal);
            } else {
              input.set('checked', newVal);
            }
          }
        });
      } else {
        ghostConfigNode.removeClass('use-defaults');
        textareas.removeAttribute('disabled');
        inputs.removeAttribute('disabled');
      }
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
    }

  };

}, '0.1.0', {
  requires: [
  ]
});
