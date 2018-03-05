/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const utils = require('../views/utils');

/**
  Place all the unplaced units on new machines.
*/
function autoPlaceUnits(db, modelAPI) {
  const unplacedUnits = db.units.filterByMachine(null);
  unplacedUnits.forEach(unit => {
    // Get the application name from the unit id then grab the series
    // for that application.
    const series = db.services.getById(unit.id.split('/')[0]).get('series');
    const machine = createMachine(db, modelAPI, null, null, series, null);
    modelAPI.placeUnit(unit, machine.id);
  });
}

/**
  Create a new machine/container.
  @param {String} containerType The container type to create.
  @param {String} parentId The parent for the container.
  @param {String} series The series of the machine.
  @param {Object} constraints The machine/container constraints.
  @return {Object} The newly created ghost machine model instance.
*/
function createMachine(db, modelAPI, containerType, parentId, series, constraints) {
  const cons = utils.formatConstraints(constraints);
  const machine = db.machines.addGhost(
    parentId, containerType, {series: series, constraints: cons});
  // XXX A callback param MUST be provided even if it's just an
  // empty function, the ECS relies on wrapping this function so if
  // it's null it'll just stop executing. This should probably be
  // handled properly on the ECS side. Jeff May 12 2014
  const callback = _onMachineCreated.bind(this, db, machine);
  modelAPI.addMachines([{
    series: series,
    containerType: containerType,
    parentId: parentId,
    constraints: constraints || {}
  }], callback, {modelId: machine.id});
  return machine;
}

/**
  Callback called when a new machine is created.
  @param {Object} machine The corresponding ghost machine.
  @param {Object} response The juju-core response. The response is an
    object like the following:
    {
      err: 'only defined if a global error occurred'
      machines: [
        {name: '1', err: 'a machine error occurred'},
      ]
    }
*/
function _onMachineCreated(db, machine, response) {
  var errorTitle;
  var errorMessage;
  var shouldDestroy = false;
  var createdMachine = {};
  // Ensure the addMachines call executed successfully.
  if (response.err) {
    errorTitle = 'Error creating the new machine';
    errorMessage = response.err;
  } else {
    createdMachine = response.machines[0];
    if (createdMachine.err) {
      errorTitle = 'Error creating machine ' + createdMachine.name;
      errorMessage = createdMachine.err;
    }
  }
  // Add an error notification if adding a machine failed.
  if (errorTitle) {
    db.notifications.add({
      title: errorTitle,
      message: 'Could not add the requested machine. Server ' +
          'responded with: ' + errorMessage,
      level: 'error'
    });
    shouldDestroy = true;
  }
  const createdMachineName = createdMachine.name;
  if (createdMachineName) {
    const updatedMachine = db.machines.updateModelId(machine, createdMachineName, true);
    // We need to revive the model so that the change event triggers
    // the token UI to re-render.
    const machineModel = db.machines.revive(updatedMachine);
    var parentId;
    // The createdMachineName may be a container so it will be in the format
    // machine/type/number. If it is then we just need the parent machine
    // id which we extract by splitting and grabbing the first element.
    var parts = createdMachineName.split('/');
    if (parts.length === 3) {
      parentId = parts[0];
    }
    machineModel.setAttrs({
      displayName: createdMachineName,
      // The parentId needs to be set when the machine is created so that
      // the machine token will be properly rendered with it's assigned
      // units.
      parentId: parentId
    });
    db.machines.free(machineModel);
  } else {
    shouldDestroy = true;
  }
  // If there was an error creating the machine OR if the newly
  // created machine doesn't have an ID yet then we need to remove
  // the model and have the deltas take over.
  if (shouldDestroy === true) {
    db.machines.remove(machine);
  }
}

module.exports = {autoPlaceUnits, createMachine};
