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

YUI.add('ghost-deployer-extension', function(Y) {

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
      @param {Object} ghostAttributes The attributes used by the ghost.
      @param {Array} plans The list of plans available for this service.
      @param {String} activePlan The selected plan for this service.
    */
    deployService: function(charm, ghostAttributes, plans, activePlan) {
      // This flag is still required because it comes fully populated from the
      // browser but won't be fully populated when coming in on the delta.
      charm.loaded = true;
      charm.set('plans', plans);
      var db = this.db;
      db.charms.add(charm);
      var ghostService = db.services.ghostService(charm);

      this._setupXYAnnotations(ghostAttributes, ghostService);

      var config = {};
      var ghostServiceId = ghostService.get('id');
      const charmOptions = charm.get('options') || {};
      Object.keys(charmOptions).forEach(k => {
        const v = charmOptions[k];
        config[k] = v['default'];
      });
      var series = charm.get('series');
      // If series is an array then pick the first one. This will be the
      // case if it is a multi-series charm and we're picking the default
      // and preferred series.
      var activeSeries = Array.isArray(series) ? series[0] : series;
      ghostService.set('config', config);
      ghostService.set('activePlan', activePlan);
      ghostService.set('series', activeSeries);
      var serviceName = ghostService.get('name');
      var charmId = charm.get('id');
      if (charm.get('id').indexOf('local:') === -1) {
        // TODO frankban: add support for fetching delegatable macaroons that
        // can be used to add private charms.
        this.env.addCharm(
          charmId, null, this._addCharmCallbackHandler.bind(this, charm),
          // Options used by ECS, ignored by environment.
          {applicationId: ghostServiceId});
      }
      const options = {modelId: ghostServiceId};
      // Add the resources to the Juju controller if we have any.
      const charmResources = charm.get('resources');
      if (charmResources) {
        this.env.addPendingResources({
          applicationName: serviceName,
          charmURL: charmId,
          channel: 'stable',
          resources: charmResources
        }, (error, ids) => {
          if (error !== null) {
            db.notifications.add({
              title: 'Error adding resources',
              message: `Could not add requested resources for ${charmId}. ` +
                'Server responded with: ' + error,
              level: 'error'
            });
            return;
          }
          // Store the id map in the application model for use by the ecs
          // during deploy.
          ghostService.set('resourceIds', ids);
        });
      }

      this.env.deploy({
        charmURL: charmId,
        applicationName: serviceName,
        series: activeSeries,
        config: config
      }, this._deployCallbackHandler.bind(this, ghostService), options);

      // Add an unplaced unit to this service if it is not a subordinate
      // (subordinate units reside alongside non-subordinate units).
      if (!charm.get('is_subordinate')) {
        // The service is not yet deployed (we just added it to ECS), so we
        // can safely assume the first unit to be unit 0. Each subsequent
        // unit added to the ghost service would have number
        // `ghostService.get('units').size()`.
        var unitId = ghostServiceId + '/0';
        var ghostUnit = db.addUnits({
          id: unitId,
          displayName: serviceName + '/0',
          charmUrl: charmId,
          subordinate: charm.get('is_subordinate')
        });
        // Add an ECS add_unit record. Attach a callback that, when called,
        // removes the ghost unit from the database. The real unit should then
        // be created reacting to the mega-watcher changes.
        this.env.add_unit(
            ghostServiceId, // The service to which the unit is added.
            1, // Add a single unit.
            null, // For now the unit is unplaced.
            Y.bind(this._addUnitCallback, this, ghostUnit), // The callback.
            // Options used by ECS, ignored by environment.
            {modelId: unitId}
        );
      }
      this.state.changeState({
        store: null,
        gui: {
          inspector: {
            id: ghostService.get('id'),
            localType: null
          }
        }
      });
    },

    /**
      Sets up the gui-x, gui-y annotations on the passed in ghost service.

      @method _setupXYAnnotations
      @param {Object} ghostAttributes The attrs to set on the ghost service.
      @param {Object} ghostService The ghost service model.
    */
    _setupXYAnnotations: function(ghostAttributes, ghostService) {
      if (ghostAttributes !== undefined) {
        if (ghostAttributes.coordinates !== undefined) {
          var annotations = ghostService.get('annotations');
          annotations['gui-x'] = ghostAttributes.coordinates[0];
          annotations['gui-y'] = ghostAttributes.coordinates[1];
        }
        ghostService.set('icon', ghostAttributes.icon);
      }
    },

    /**
      The callback handler for the env.addCharm call.

      @method _addCharmCallbackHandler
      @param {Object} charm The added charm model.
      @param {Object} response The response from Juju.
    */
    _addCharmCallbackHandler: function(charm, response) {
      var db = this.db;
      var charmId = charm.get('id');
      if (response.err) {
        db.notifications.add({
          title: `Error adding ${charmId}`,
          message: 'Could not add requested charm. Server responded with: ' +
            response.err,
          level: 'error'
        });
        return;
      }

      db.notifications.add({
        title: `Added ${charmId} successfully`,
        message: `Successfully added ${charmId}`,
        level: 'info'
      });
    },

    /**
      The callback handler from the env.deploy() of the charm.

      @method _deployCallbackHandler
      @param {Object} ghostService The model of the ghost service.
      @param {String} err The error message from the deploy event, or null.
    */
    _deployCallbackHandler: function(ghostService, err) {
      var db = this.db;
      var serviceName = ghostService.get('name');

      if (err) {
        db.notifications.add({
          title: 'Error deploying ' + serviceName,
          message: 'Could not deploy the requested application. Server ' +
              'responded with: ' + err,
          level: 'error'
        });
        return;
      }

      db.notifications.add({
        title: 'Deployed ' + serviceName,
        message: 'Successfully deployed the requested application.',
        level: 'info'
      });

      // Transition the ghost viewModel to the new service. It's alive!
      var ghostId = ghostService.get('id');

      ghostService.setAttrs({
        id: serviceName,
        displayName: undefined,
        pending: false,
        loading: false,
        config: ghostService.get('config'),
        constraints: {}
      });

      var topo = this.views.environment.instance.topo;
      // Without this following code on a real environment the service icons
      // would disappear and then re-appear when deploying services.
      var boxModel = topo.service_boxes[ghostId];
      boxModel.id = serviceName;
      boxModel.pending = false;
      delete topo.service_boxes[ghostId];
      topo.service_boxes[serviceName] = boxModel;

      topo.annotateBoxPosition(boxModel);
    },

    /**
      The callback handler from the env.add_unit() call.

      @method _addUnitCallback
      @param {Object} ghostUnit The ghost unit model instance.
      @param {Y.EventFacade} evt The event facade from the add_unit call.
    */
    _addUnitCallback: function(ghostUnit, evt) {
      var db = this.db;
      if (evt.err) {
        // Add a notification and exit if the API call failed.
        db.notifications.add({
          title: 'Error adding unit ' + ghostUnit.displayName,
          message: 'Could not add the requested unit. Server ' +
              'responded with: ' + evt.err,
          level: 'error'
        });
        return;
      }
      // Notify the unit has been successfully created.
      db.notifications.add({
        title: 'Added unit ' + ghostUnit.displayName,
        message: 'Successfully created the requested unit.',
        level: 'info'
      });
      // Remove the ghost unit: the real unit will be re-added by the
      // mega-watcher handlers.
      ghostUnit.service = evt.applicationName;
      db.removeUnits(ghostUnit);
    }
  };

  Y.namespace('juju').GhostDeployer = GhostDeployer;

}, '0.1.0', {
  requires: []
});
