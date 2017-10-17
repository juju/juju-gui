/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

/**
  Provides utility methods for interacting with data from jujulib.
*/

/**
  Munge jujulib style entity data into juju GUI models.

  @function processEntityData
  @param {Object} entity Entity data from e.g. jujulib.
  @returns {Object} A charm or Bundle juju GUI model.
 */
const makeEntityModel = function(entity) {
  if (entity.entityType === 'charm') {
    return new window.models.Charm(entity);
  } else {
    return new window.models.Bundle(entity);
  }
};

module.exports = {makeEntityModel};
