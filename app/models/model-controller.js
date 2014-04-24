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

YUI.add('model-controller', function(Y) {
  /**
    Provides a collection of utility methods to interact
    with the db and it's models.

    @class ModelController
    @constructor
  */
  var ModelController = Y.Base.create('juju-model-controller', Y.Base, [], {

    /**
      Inits promise object stores.

      @method initializer
    */
    initializer: function() {
      this._charmPromises = {};
      this._servicePromises = {};
      this._serviceCharmPromises = {};
    },

    /**
      Stores promises for a short period of time as a way to avoid multiple
      instantiations when the application dispatches before the promises return

      @method _getPromise
      @param {String} key The id of the charm/service which will be used to
        store and find the promise in the objects.
      @param {Object} store Object which stores the various promises of a
        specific type.
      @param {Function} fn Promise executor function.
      @return {Y.Promise} Stored promise matching the provided key.
    */
    _getPromise: function(key, store, fn) {
      var promise = store[key];
      if (!promise) {
        store[key] = promise = new Y.Promise(fn);
        var cleanUp = function() {
          delete store[key];
        };
        promise.then(cleanUp, cleanUp);
      }
      return promise;
    },


    /**
      Returns a promise for a fully populated charm model.

      @method getCharm
      @param {String} charmId The charmId that you want to populate.
      @return {Y.Promise} A promise for the charm model.
    */
    getCharm: function(charmId) {
      var db = this.get('db'),
          env = this.get('env');

      return this._getPromise(
          charmId, this._charmPromises,
          function(resolve, reject) {
            var charm = db.charms.getById(charmId);
            if (charm && charm.loaded) {
              resolve(charm);
            } else {
              charm = db.charms.add({url: charmId}).load(env,
                  // If views are bound to the charm model, firing "update" is
                  // unnecessary, and potentially even mildly harmful.
                  function(err, data) {
                    db.fire('update');
                    resolve(db.charms.getById(charmId));
                  });
            }
          });
    },

    /**
      Returns a promise for a fully populated service model or an error.

      @method getService
      @param {String} serviceId A string ID for the service to fetch.
      @return {Y.Promise} A promise for fully populated service data.
    */
    getService: function(serviceId) {
      var db = this.get('db'),
          env = this.get('env');

      return this._getPromise(
          serviceId, this._servicePromises,
          function(resolve, reject) {
            // `this` points to the serviceList
            var service = db.services.getById(serviceId);
            // If the service and all data has already been loaded, or if the
            // service is pending, resolve.
            if (service && (service.get('loaded') || service.get('pending'))) {
              resolve(service);
              return;
            }

            if (!service || !service.get('loaded')) {
              env.get_service(serviceId, function(result) {
                if (result.err) {
                  // The service doesn't exist
                  reject(result);
                } else {
                  var service = db.services.getById(result.service_name);
                  service.setAttrs({
                    'config': result.result.config,
                    'constraints': result.result.constraints,
                    'loaded': true
                  });
                  resolve(service);
                }
              });
            }
          });
    },

    /**
      Populates the service and charm data for the supplied service id and
      returns a promise that you can use to know when it's ready to go.

      @method getServiceWithCharm
      @param {String} serviceId The service id to populate.
    */
    getServiceWithCharm: function(serviceId) {
      var db = this.get('db'),
          env = this.get('env'),
          store = this.get('store'),
          mController = this;

      return this._getPromise(
          serviceId, this._serviceCharmPromises,
          function(resolve, reject) {
            mController.getService(serviceId).then(function(service) {
              mController.getCharm(service.get('charm')).then(function(charm) {
                // Check if a newer charm is available for this service so that
                // we can offer it as an upgrade.
                if (charm.get('scheme') === 'cs') {
                  store.promiseUpgradeAvailability(charm, db.charms)
                    .then(function(latestId) {
                        service.set('upgrade_available', !!latestId);
                        service.set('upgrade_to',
                            charm.get('scheme') + ':' + latestId);
                        resolve({service: service, charm: charm});
                      }, reject);
                } else {
                  resolve({service: service, charm: charm});
                }
              }, reject);
            }, reject);
          });
    }

  }, {
    ATTRS: {
      /**
        Reference to the client db.

        @attribute db
        @type {Y.Base}
        @default undefined
      */
      db: {},

      /**
        Reference to the client env.

        @attribute env
        @type {Y.Base}
        @default undefined
      */
      env: {},

      /**
        Reference to the client charm store.

        @attribute store
        @type {Object}
        @default undefined
      */
      store: {}
    }
  });

  Y.namespace('juju').ModelController = ModelController;

}, '', { requires: ['base-build', 'base', 'promise'] });
