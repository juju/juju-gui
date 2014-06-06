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
    this._storage = {};
  }

  BrowserCache.prototype = {

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
    }

  };

  Y.namespace('juju').BrowserCache = BrowserCache;

});
