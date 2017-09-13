/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

/**
  A mixin for the JujuGUI class.
  Adds methods to handle deploying an application.
*/
const DeployerMixin = (superclass) => class extends superclass {
  /**
    Show the deploy/configuration panel for a charm.
    @param {Y.Model} charm model to add to the charms database.
    @param {Object} ghostAttributes The attributes used by the ghost.
    @param {Array} plans The list of plans available for this service.
    @param {String} activePlan The selected plan for this service.
  */
  deployService(charm, ghostAttributes, plans, activePlan) {
    // This flag is still required because it comes fully populated from the
    // browser but won't be fully populated when coming in on the delta.
    charm.loaded = true;
    charm.set('plans', plans);
    const db = this.db;
    db.charms.add(charm);
    const ghostService = db.services.ghostService(charm);

    this._setupXYAnnotations(ghostAttributes, ghostService);

    const config = {};
    const ghostServiceId = ghostService.get('id');
    const charmOptions = charm.get('options') || {};
    Object.keys(charmOptions).forEach(k => {
      const v = charmOptions[k];
      config[k] = v['default'];
    });
    const series = charm.get('series');
    // If series is an array then pick the first one. This will be the
    // case if it is a multi-series charm and we're picking the default
    // and preferred series.
    const activeSeries = Array.isArray(series) ? series[0] : series;
    ghostService.set('config', config);
    ghostService.set('activePlan', activePlan);
    ghostService.set('series', activeSeries);
    const serviceName = ghostService.get('name');
    const charmId = charm.get('id');
    if (charm.get('id').indexOf('local:') === -1) {
      this.modelAPI.addCharm(
        charmId, this.charmstoreAPI,
        this._addCharmCallbackHandler.bind(this, charm),
        // Options used by ECS, ignored by environment.
        {applicationId: ghostServiceId});
    }
    const options = {modelId: ghostServiceId};
    // Add the resources to the Juju controller if we have any.
    const charmResources = charm.get('resources');
    if (charmResources) {
      this.modelAPI.addPendingResources({
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

    this.modelAPI.deploy({
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
      const unitId = ghostServiceId + '/0';
      const ghostUnit = db.addUnits({
        id: unitId,
        displayName: serviceName + '/0',
        charmUrl: charmId,
        subordinate: charm.get('is_subordinate')
      });
      // Add an ECS add_unit record. Attach a callback that, when called,
      // removes the ghost unit from the database. The real unit should then
      // be created reacting to the mega-watcher changes.
      this.modelAPI.add_unit(
        ghostServiceId, // The service to which the unit is added.
        1, // Add a single unit.
        null, // For now the unit is unplaced.
        this._addUnitCallback.bind(this, ghostUnit), // The callback.
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
  }

  /**
    Sets up the gui-x, gui-y annotations on the passed in ghost service.
    @param {Object} ghostAttributes The attrs to set on the ghost service.
    @param {Object} ghostService The ghost service model.
  */
  _setupXYAnnotations(ghostAttributes, ghostService) {
    if (ghostAttributes !== undefined) {
      if (ghostAttributes.coordinates !== undefined) {
        const annotations = ghostService.get('annotations');
        annotations['gui-x'] = ghostAttributes.coordinates[0];
        annotations['gui-y'] = ghostAttributes.coordinates[1];
      }
      ghostService.set('icon', ghostAttributes.icon);
    }
  }

  /**
    The callback handler for the env.addCharm call.
    @param {Object} charm The added charm model.
    @param {Object} response The response from Juju.
  */
  _addCharmCallbackHandler(charm, response) {
    const db = this.db;
    const charmId = charm.get('id');
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
  }

  /**
    The callback handler from the env.deploy() of the charm.
    @param {Object} ghostService The model of the ghost service.
    @param {String} err The error message from the deploy event, or null.
  */
  _deployCallbackHandler(ghostService, err) {
    const db = this.db;
    const serviceName = ghostService.get('name');

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
    const ghostId = ghostService.get('id');

    ghostService.setAttrs({
      id: serviceName,
      displayName: undefined,
      pending: false,
      loading: false,
      config: ghostService.get('config'),
      constraints: {}
    });

    var topo = this.topology.topo;
    // Without this following code on a real environment the service icons
    // would disappear and then re-appear when deploying services.
    const boxModel = topo.service_boxes[ghostId];
    boxModel.id = serviceName;
    boxModel.pending = false;
    delete topo.service_boxes[ghostId];
    topo.service_boxes[serviceName] = boxModel;

    topo.annotateBoxPosition(boxModel);
  }

  /**
    The callback handler from the env.add_unit() call.
    @param {Object} ghostUnit The ghost unit model instance.
    @param {Y.EventFacade} evt The event facade from the add_unit call.
  */
  _addUnitCallback(ghostUnit, evt) {
    const db = this.db;
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

module.exports = DeployerMixin;
