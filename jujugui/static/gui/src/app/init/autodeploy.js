/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const utils = require('./utils');

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
  const callback = resp => {
    db.machines.remove(machine);
    if (resp.err) {
      db.notifications.add({
        title: 'Error creating the new machine',
        message: 'Could not add the requested machine: '+ resp.err,
        level: 'error'
      });
    }
  };
  modelAPI.addMachines([{
    series: series,
    containerType: containerType,
    parentId: parentId,
    constraints: constraints || {}
  }], callback, {modelId: machine.id});
  return machine;
}

module.exports = {autoPlaceUnits, createMachine};
