/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/*
  Application level cache object

  @module juju
*/
YUI.add('browser-cache', function(Y) {

  /**
    Provides an object for storing data in the juju browser.

    @method BrowserCache
  */
  function BrowserCache() {
    this.init();
  }

  BrowserCache.prototype = {
    /**
      Sets up the cache.

      @method init
    */
    init: function() {
      this._storage = {};
      this._storage._entities = new Y.ModelList();
    },

    /**
      Fetch the data associated with a key from the storage cache.

      @method get
      @param {String} key The key associated with the data.
      @return {Any} Returns whatever data was stored under that key.
    */
    get: function(key) {
      return this._storage[key];
    },

    /**
      Sets the supplied data into the storage cache under the supplied key.

      @method set
      @param {String} key The key to be associated with the data.
      @param {Any} data The data to store in the storage cache.
    */
    set: function(key, data) {
      this._storage[key] = Y.clone(data);
      return this._storage[key];
    },

    /**
      Updates the internal charm model cache.

      @method updateEntityList
      @param {Object} entityList Either a single charm/bundle model or an object
        of models from the charmstore transformed results.
    */
    updateEntityList: function(entityList) {
      // Check to see if this is a single charm model or not
      if (entityList instanceof Y.Model) {
        this._storage._entities.add(entityList);
      } else {
        Object.keys(entityList).forEach(function(key) {
          var entities = entityList[key];
          // The charmworld transform method can return a single charm model
          // or an array of them.
          if (!Y.Lang.isArray(entities)) {
            entities = [entities];
          }
          entities.forEach(function(charm) {
            this._storage._entities.add(charm);
          }, this);
        }, this);
      }
    },

    /**
      Fetches the charm from the charm cache if it exists.

      @method getEntity
      @param {String} entityId The charm or bundle id to fetch from the cache.
      @return {CharmModel | null} The charm model or null if it doesn't exist.
    */
    getEntity: function(entityId) {
      var bundleIndex = entityId.indexOf('bundle');
      var bundle;
      if (bundleIndex !== -1) {
        this._storage._entities.some(function(entity) {
          if (entity.get('stateId') === entityId) {
            bundle = entity;
          }
        });
        return bundle;
      } else {
        return this._storage._entities.getById('cs:' + entityId);
      }
    },

    /**
      Empty the cache. This is a nuclear option, there's no going back.

      @method empty
    */
    empty: function() {
      var storage = this._storage;
      storage._entities.destroy();
      this._destroyModels(storage);
      this._storage = null;
      // Set the cache back to a functional state
      this.init();
    },

    /**
      Recursive function to loop through the cache and destroy any existing
      models.

      @method _destroyModels
      @param {Object} storage A storage object. Starts with the parent cache
        object.
    */
    _destroyModels: function(storage) {
      Object.keys(storage).forEach(function(key) {
        var model = storage[key];
        if (!(model instanceof Y.Model || model instanceof Y.ModelList) &&
            (typeof model === 'object')) {
          this._destroyModels(model);
        } else {
          // In case items which are not models are stored in here and do not
          // have a destroy method.
          if (model.destroy) {
            model.destroy();
          }
        }
      }, this);
    }
  };

  Y.namespace('juju').BrowserCache = BrowserCache;
}, '', {
  requires: [
    'model',
    'model-list'
  ]
});
