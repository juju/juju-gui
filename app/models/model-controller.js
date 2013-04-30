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
      Returns a promise for a fully populated charm model.

      @method getCharm
      @param {String} charmId The charmId that you want to populate.
      @return {Y.Promise} A promise for the charm model.
    */
    getCharm: function(charmId) {
      var db = this.get('db'),
          env = this.get('env');

      return new Y.Promise(
          function(resolve, reject) {
            var charm = db.charms.getById(charmId);
            if (charm && charm.loaded) {
              resolve(charm);
            } else {
              charm = db.charms.add({id: charmId}).load(env,
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

      return new Y.Promise(
          function(resolve, reject) {
            // `this` points to the serviceList
            var service = db.services.getById(serviceId);
            // If the service and all data has already been loaded, resolve.
            if (service && service.get('loaded')) {
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
          mController = this;

      return new Y.Promise(
          // this is being bound to pass additional information into the fn
          function(resolve, reject) {
            mController.getService(serviceId).then(function(service) {
              mController.getCharm(service.get('charm')).then(function(charm) {
                resolve({service: service, charm: charm});
              }, reject);
            }, reject);
          });
    }

  }, {
    ATTRS: {
      /**
        Reference to the client env.

        @attribute env
        @type {Y.Base}
        @default undefined
      */
      env: {},

      /**
        Reference to the client db.

        @attribute db
        @type {Y.Base}
        @default undefined
      */
      db: {}
    }
  });

  Y.namespace('juju').ModelController = ModelController;

}, '', { requires: ['base-build', 'base', 'promise'] });
