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
      charm.set('options', charm.get('options'));
      this.db.charms.add(charm);

      var ghostService = this.db.services.ghostService(charm);
      if (ghostAttributes !== undefined) {
        if (ghostAttributes.coordinates !== undefined) {
          ghostService.set('x', ghostAttributes.coordinates[0]);
          ghostService.set('y', ghostAttributes.coordinates[1]);
        }
        ghostService.set('icon', ghostAttributes.icon);
        // Set the dragged attribute to true so that the x/y coords are
        // stored in annotations as well as on the service box.
        ghostService.set('hasBeenPositioned', true);
      }
      var self = this;
      var environment = this.views.environment.instance,
          ghostInspector = environment.createServiceInspector(ghostService);
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
          model = options.model,
          serviceName = container.one('input[name=service-name]').get('value'),
          isSubordinate = model.get('is_subordinate'),
          numUnits = (
              isSubordinate ? 0 :
              parseInt(
                  container.one('input[name=number-units]').get('value'), 10)),
          config;

      if (this.checkForExistingService(serviceName)) {
        options.db.notifications.add(
            new models.Notification({
              title: 'Attempting to deploy service ' + serviceName,
              message: 'A service with that name already exists.',
              level: 'error'
            }));
        return;
      }

      // Check if a file has been uploaded and use that config.
      if (this.configFileContent) {
        config = null;
      } else {
        config = utils.getElementsValuesMapping(
            container, '.service-config .config-field');
      }

      options.env.deploy(
          model.get('id'),
          serviceName, config, this.configFileContent,
          numUnits, Y.bind(
              this._deployCallbackHandler, this, serviceName, config));
    },

    /**
      Checks the database for an existing service with the same name.

      @method checkForExistingService
      @param {String} serviceName of the new service to deploy.
      @return {Boolean} true if it exists, false if doesn't.
    */
    checkForExistingService: function(serviceName) {
      var existingService = this.options.db.services.getById(serviceName);
      return (existingService) ? true : false;
    },

    /**
      Destroys the inspector.

      @method closeInspector
    */
    closeInspector: function() {
      this.viewletManager.destroy();
    },

    /**
      Updates the ghost service name when the user changes it in the inspector.

      @method updateGhostName
      @param {Y.EventFacade} e event object from valuechange.
    */
    updateGhostName: function(e) {
      // By updating the id of the ghost service model we are causing d3
      // to think that we have removed the old service and created a new
      // service which then causes the d3/topo to remove the old service
      // block and render the new service block.
      this.options.ghostService.set(
          'id', '(' + e.newVal + ')');
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
              '.service-configuration .ghost-config-content');

      var textareas = ghostConfigNode.all('textarea'),
          inputs = ghostConfigNode.all('input');

      if (useDefaults) {
        ghostConfigNode.addClass('use-defaults');
        textareas.setAttribute('disabled');
        inputs.each(function(input) {
          // Without this check you will disable the toggle button too
          if (input.get('id') !== 'use-default-toggle') {
            input.setAttribute('disabled');
          }
        });

        var viewlet = this.viewletManager.viewlets.ghostConfig,
            viewletContainer = viewlet.container;
        // Loop through the fields to set the values back to their defaults
        // We can't use the data binding because setting it to it's default
        // value doesn't trigger the databinding change events.
        Y.Object.each(viewlet.model.get('options'), function(opt, key) {
          var newVal = (opt['default'] === undefined) ? '' : opt['default'];
          var input = viewletContainer.one('#input-' + key);

          if (input.get('type') !== 'checkbox') {
            input.set('value', newVal);
          } else {
            input.set('checked', newVal);
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
      @param {Object} config The configuration oject of the service.
      @param {Y.EventFacade} e The event facade from the deploy event.
    */
    _deployCallbackHandler: function(serviceName, config, e) {
      var options = this.options,
          db = options.db,
          ghostService = options.ghostService;

      if (e.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error deploying ' + serviceName,
              message: 'Could not deploy the requested service.',
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

      // Update the annotations with the box's x/y coordinates if
      // they have been set by dragging the ghost.
      if (ghostService.get('hasBeenPositioned')) {
        options.env.update_annotations(
            serviceName, 'service',
            { 'gui-x': ghostService.get('x'),
              'gui-y': ghostService.get('y') },
            function() {
              // Make sure that annotations are set on the ghost
              // service before they come back from the delta to
              // prevent the service from jumping to the middle of
              // the canvas and back.
              var annotations = ghostService.get('annotations');
              if (!annotations) {
                annotations = {};
              }
              Y.mix(annotations, {
                'gui-x': ghostService.get('x'),
                'gui-y': ghostService.get('y')
              });
              ghostService.set('annotations', annotations);
              // The x/y attributes need to be removed to prevent
              // lingering position problems after the service is
              // positioned by the update code.
              ghostService.removeAttr('x');
              ghostService.removeAttr('y');
            });
      }

      ghostService.setAttrs({
        id: serviceName,
        pending: false,
        loading: false,
        config: config
      });

      this.closeInspector();
    }

  };

});
