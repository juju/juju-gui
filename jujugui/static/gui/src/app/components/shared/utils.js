/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const utils = {};
/**
  Normalised statuses for use with the status components.
*/
utils.STATUSES = {
  ERROR: 'error',
  PENDING: 'pending',
  OK: 'ok'
};

/**
  The order of priority for displaying a status.
*/
utils.STATUS_ORDER = [utils.STATUSES.ERROR, utils.STATUSES.PENDING, utils.STATUSES.OK];

/**
  Get the highest status from a list of statuses.
  @param statuses {Ȧrray} A list of statuses.
  @returns {String} The status.
*/
utils.getHighestStatus = statuses => {
  const normalised = statuses.map(status => utils.normaliseStatus(status));
  let status;
  // Loop through the order of priority until there is a matching status.
  utils.STATUS_ORDER.some(val => {
    if (normalised.indexOf(val) > -1) {
      status = val;
      return true;
    }
  });
  return status;
};

/**
  Normalise the status value.
  @param status {String} The raw value.
  @returns {String} The normalised status ('ok', 'error' or 'pending').
*/
(utils.normaliseStatus = value => {
  switch (value) {
    case 'active':
    case 'idle':
    case 'started':
    case 'waiting':
      return utils.STATUSES.OK;
    case 'blocked':
    case 'down':
    case 'error':
      return utils.STATUSES.ERROR;
    case 'pending':
    case 'installing':
    case 'executing':
    case 'allocating':
    case 'maintenance':
      return utils.STATUSES.PENDING;
    default:
      return utils.STATUSES.OK;
  }
}),
  /**
  Return an element class name suitable for the given value.
  @param {String} prefix The class prefix.
  @param {String} value The provided value.
  @returns {String} The class name ('ok', 'error' or '').
*/
  (utils.getStatusClass = (prefix, value) => {
    if (!value) {
      // If there is no value then ignore it. This might be the case when an
      // entity's state property only has a value for pending/error states.
      return '';
    }
    if (!Array.isArray(value)) {
      value = [value];
    }
    const normalised = value.map(val => utils.normaliseStatus(val));
    return prefix + utils.getHighestStatus(normalised);
  });

/**
  Filter units by those that have been committed.
  @param units {Array} The list of units.
  @returns {Array} The list of filtered units..
*/
utils.getRealUnits = units => {
  // Unplaced units have no machine defined. Subordinate units have an empty
  // string machine.
  return units.filter(unit => unit.machine !== undefined && unit.machine.indexOf('new') !== 0);
};

module.exports = utils;
