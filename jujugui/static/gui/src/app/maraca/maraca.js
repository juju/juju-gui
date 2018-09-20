/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const clonedeep = require('lodash.clonedeep');
const deepmerge = require('deepmerge');

const parsers = require('./parsers');

class Maraca {
  constructor(config) {
    this.ON_CHANGE = config.onChange;
    this._boundWatcherListener = this._watcherListener.bind(this);
    this._valueStore = {
      annotations: {},
      applications: {},
      machines: {},
      relations: {},
      remoteApplications: {},
      units: {}
    };
  }

  /**
    Get the frozen store of entities.
  */
  getValueStore() {
    return clonedeep(this._valueStore);
  }

  /**
    Start listening to the megawatcher event.
  */
  connect() {
    document.addEventListener('_rpc_response', this._boundWatcherListener);
  }

  /**
    Stop listening to the megawatcher event.
  */
  disconnect() {
    document.removeEventListener('_rpc_response', this._boundWatcherListener);
  }

  /**
    The function called when the megawatcher event fires.
    @param evt {Object} The megawatcher event.
  */
  _watcherListener(evt) {
    const data = evt.detail;
    if (!data.response || ! data.response.deltas) {
      // Ignore megawatcher responses that don't have deltas.
      return;
    }
    this._handleDeltas(data.response.deltas);
    this.ON_CHANGE();
  }

  /**
    Consolidate the deltas.
    @param deltas {Array} The list of deltas.
  */
  _handleDeltas(deltas) {
    deltas.forEach(delta => {
      const entityType = delta[0];
      const changeType = delta[1];
      const entity = delta[2];
      const key = this._getEntityKey(entityType, entity);
      if (!key) {
        // We don't know how to manage this entity, so ignore it.
        return;
      }
      const entityGroup = this._valueStore[this._getEntityGroup(entityType)];
      if (changeType === 'change') {
        if (!entityGroup[key]) {
          entityGroup[key] = {};
        }
        const parsedEntity = this._parseEntity(entityType, entity);
        entityGroup[key] = deepmerge(entityGroup[key], parsedEntity);
      } else if (changeType === 'remove') {
        delete entityGroup[key];
      }
    });
  }

  /**
    Get the identifier for the entity based upon its type.
    @param entityType {String} The type of entity.
    @param entity {Object} The entity details.
    @returns {String} The entity key.
  */
  _getEntityKey(entityType, entity) {
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
    @param entityType {String} The type of entity.
    @returns {String} The entity group.
  */
  _getEntityGroup(entityType) {
    switch (entityType) {
      case 'remote-application':
        return 'remoteApplications';
      default:
        return entityType + 's';
    }
  }

  /**
    Parse the entity response into a friendly format.
    @param entityType {String} The type of entity.
    @param entity {Object} The entity details.
    @returns {Object} The parsed entity.
  */
  _parseEntity(entityType, entity) {
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
}

module.exports = Maraca;
