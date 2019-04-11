/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const parsers = require('./parsers');

/**
  Get the consolidated updates from the deltas.
  @param {Array} deltas - The list of deltas.
  @returns {Object} return - The delta updates.
  @returns {Object} return.changed - The entities to change.
  @returns {Object} return.removed - The entities to remove.
*/
function processDeltas(deltas) {
  let updates = {
    changed: {},
    removed: {}
  };
  deltas.forEach(delta => {
    const entityType = delta[0];
    const changeType = delta[1];
    const entity = delta[2];
    const key = _getEntityKey(entityType, entity);
    if (!key) {
      // We don't know how to manage this entity, so ignore it.
      return;
    }
    const entityGroup = _getEntityGroup(entityType);
    const updateCollection = updates[changeType + 'd'];
    if (!updateCollection[entityGroup]) {
      updateCollection[entityGroup] = {};
    }
    updateCollection[entityGroup][key] = _parseEntity(entityType, entity);
  });
  return updates;
}

/**
  Get the identifier for the entity based upon its type.
  @param {String} entityType - The type of entity.
  @param {Object} entity - The entity details.
  @returns {String} The entity key.
*/
function _getEntityKey(entityType, entity) {
  switch (entityType) {
    case 'remote-application':
    case 'application':
    case 'unit':
      return entity.name;
    case 'machine':
    case 'relation':
      return entity.id;
    case 'annotation':
      return entity.tag;
    default:
      // This is an unknown entity type so ignore it as we don't know how to
      // handle it.
      return null;
  }
}

/**
  Get the group entity belongs to.
  @param {String} entityType - The type of entity.
  @returns {String} The entity group.
*/
function _getEntityGroup(entityType) {
  switch (entityType) {
    case 'remote-application':
      return 'remoteApplications';
    default:
      return entityType + 's';
  }
}

/**
  Parse the entity response into a friendly format.
  @param {String} entityType - The type of entity.
  @param {Object} entity - The entity details.
  @returns {Object} The parsed entity.
*/
function _parseEntity(entityType, entity) {
  switch (entityType) {
    case 'remote-application':
      return parsers.parseRemoteApplication(entity);
    case 'application':
      return parsers.parseApplication(entity);
    case 'unit':
      return parsers.parseUnit(entity);
    case 'machine':
      return parsers.parseMachine(entity);
    case 'relation':
      return parsers.parseRelation(entity);
    case 'annotation':
      return parsers.parseAnnotation(entity);
    default:
      // This is an unknown entity type so ignore it as we don't know how to
      // handle it.
      return null;
  }
}

module.exports = {
  processDeltas
};
