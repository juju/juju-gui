/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const clonedeep = require('lodash.clonedeep');
const deepmerge = require('deepmerge');

const {processDeltas} = require('./delta-handlers');

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
    Update the store with the changes from the deltas.
    @param evt {Object} The megawatcher event.
  */
  _updateStore(updates, updateType) {
    Object.keys(updates).forEach(collectionKey => {
      const collection = updates[collectionKey];
      Object.keys(collection).forEach(entityKey => {
        const entity = collection[entityKey];
        const storeCollection = this._valueStore[collectionKey];
        if (updateType === 'changed') {
          if (!storeCollection[entityKey]) {
            storeCollection[entityKey] = {};
          }
          storeCollection[entityKey] = deepmerge(storeCollection[entityKey], entity);
        } else {
          delete storeCollection[entityKey];
        }
      });
    });
  }

  /**
    Consolidate the deltas.
    @param deltas {Array} The list of deltas.
  */
  _handleDeltas(deltas) {
    const updates = processDeltas(deltas);
    this._updateStore(updates.changed, 'changed');
    this._updateStore(updates.removed, 'removed');
  }
}

module.exports = Maraca;
