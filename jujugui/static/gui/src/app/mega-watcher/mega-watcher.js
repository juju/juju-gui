/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const deepmerge = require('deepmerge');

class MegaWatcher {
  constructor(config) {
    this.ALL_WATCHER_EVENT = config.changeEvent;
    this.ON_CHANGE = config.onChange;
    this._boundWatcherListener = this._watcherListener.bind(this);
    this.models = {};
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
      const modelType = delta[0];
      const changeType = delta[1];
      const model = delta[2];
      const key = this._getModelKey(modelType, model);
      if (!key) {
        // We don't know how to manage this model, so ignore it.
        return;
      }
      const modelGroup = this._getModelGroup(modelType);
      if (changeType === 'change') {
        if (!modelGroup[key]) {
          modelGroup[key] = {};
        }
        modelGroup[key] = deepmerge(modelGroup[key], model);
      } else if (changeType === 'remove') {
        delete modelGroup[key];
      }
    });
    this.ON_CHANGE(this.models);
  }

  _getModelGroup(modelType) {
    modelType = modelType + 's';
    if (!this.models[modelType]) {
      this.models[modelType] = {};
    }
    return this.models[modelType];
  }

  _getModelKey(modelType, model) {
    switch (modelType) {
      case 'application':
      case 'unit':
        return model.name;
      case 'machine':
      case 'relation':
        return model.id;
      case 'annotation':
        return model.tag;
      default:
        console.error('Unknown model type', modelType);
        return null;
    }
  }
}

module.exports = MegaWatcher;
