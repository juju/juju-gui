/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const deepmerge = require('deepmerge');

class MegaWatcher {
  constructor(config) {
    this.ALL_WATCHER_EVENT = config.changeEvent;
    this.ON_CHANGE = config.onChange;
    this._boundWatcherListener = this._watcherListener.bind(this);
    this.entities = {
      annotations: {},
      applications: {},
      machines: {},
      relations: {},
      'remote-applications': {},
      units: {}
    };
  }

  getEntities() {
    return JSON.parse(JSON.stringify(this.entities));
  }

  connect() {
    document.addEventListener(this.ALL_WATCHER_EVENT, this._boundWatcherListener);
  }

  disconnect() {
    document.removeEventListener(this.ALL_WATCHER_EVENT, this._boundWatcherListener);
  }

  _watcherListener(evt) {
    const data = evt.detail;
    if (!data.response || ! data.response.deltas) {
      return;
    }
    const deltas = data.response.deltas;
    deltas.forEach(delta => {
      const entityType = delta[0];
      const changeType = delta[1];
      const entity = delta[2];
      const key = this._getEntityKey(entityType, entity);
      if (!key) {
        // We don't know how to manage this entity, so ignore it.
        return;
      }
      const entityGroup = this.entities[entityType + 's'];
      if (changeType === 'change') {
        if (!entityGroup[key]) {
          entityGroup[key] = {};
        }
        entityGroup[key] = deepmerge(entityGroup[key], entity);
      } else if (changeType === 'remove') {
        delete entityGroup[key];
      }
    });
    this.ON_CHANGE(JSON.parse(JSON.stringify(this.entities)));
  }

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
}

module.exports = MegaWatcher;
