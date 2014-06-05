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
YUI.add('generic-cache', function(Y) {

  /**
    Generic cache object.

    @method GenericCache
    @param {Array} keys A set of keys to generate cache getters and
      setters for. A record can be in the following formats:
      ['interesting', ...]
        or
      [{
        key: 'interesting',
        getter: function(cachedValue) {
          return cachedValue;
        },
        setter: function(data) {
          return data;
        }
      }, ...]
  */
  function GenericCache(keys) {
    // The Object which stores all of the cached information.
    this.__storage = {};
    if (keys && keys.length && keys.length > 0) {
      this.generateGettersSetters(keys);
    }
  }

  GenericCache.prototype = {

    /**
      Generate the public cache getter and setters.

      @method generateGettersSetters
      @param {Array} keys The keys to generate getters and setters for.
    */
    generateGettersSetters: function(keys) {
      var key;
      keys.forEach(function(keyData) {
        key = (typeof keyData === 'object') ? keyData.key : keyData;
        this['set' + key] = this._generatePublicCacheSet(keyData);
        this['get' + key] = this._generatePublicCacheGet(keyData);
      }, this);
    },

    /**
      Returns a curried version of the _setCache method for the provide key.

      @method _generatePublicCacheSet
      @param {String|Object} keyData Either the key string value or an object
        with the key and the setter.
      @return {Function} The setter for this key in the cache.
    */
    _generatePublicCacheSet: function(keyData) {
      return this._setCache.bind(this, keyData.key || keyData, keyData.setter);
    },

    /**
      Returns a curried version of the _getCache method for the provided key.

      @method _generatePublicCacheGet
      @param {String|Object} keyData Either the key string value or an object
        with the key and the setter.
      @return {Function} The setter for this key in the cache.
    */
    _generatePublicCacheGet: function(keyData) {
      return this._getCache.bind(this, keyData.key || keyData, keyData.getter);
    },

    /**
      Sets the data in the cache based on the passed in key.

      @method _setCache
      @param {String} key The key to store the data under.
      @param {Function} setter [optional] The setter to run before setting the
        data.
      @param {Object} data The interesting data to store.
      @param {Boolean} merge [optional] Whether the passed in data should be
        merged into the existing results. If you provide your own setter this
        parameter will be ignored.
    */
    _setCache: function(key, setter, data, merge) {
      if (Y.Lang.isObject(data)) {
        data = Y.clone(data);
      }
      if (typeof setter === 'function') {
        this.__storage[key] = setter(data);
      } else if (merge) {
        Y.mix(this.__storage[key], data, true);
      } else {
        this.__storage[key] = data;
      }
      return this.__storage[key];
    },

    /**
      Gets the data in the cache based on the passed in key.

      @method _getCache
      @param {String} key The key to store the data under.
      @param {Function} getter [optional] The getter to run before returning
        the data.
    */
    _getCache: function(key, getter) {
      if (typeof getter === 'function') {
        return getter(this.__storage[key]);
      }
      return this.__storage[key];
    }
  };

  Y.GenericCache = GenericCache;
});
