/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {

  const jujulib = exports.jujulib;
  /**
   * BakeryFactory to create and maintain bakery objects.
   *
   */

  /**
   Initialize.

   @method initializer
   @param {Object} cfg a config object containing the Bakery module
                   {Bakery: Y.juju.environments.web.Bakery}
   @return {undefined} Nothing.
   */
  function bakeryFactory(Bakery) {
    this.Bakery = Bakery;
    this._bakeries = new Map();
  };

  bakeryFactory.prototype = {
    /**
     Return a bakery instance associated with the serviceName provided.

     @method get
     @param serviceName the name of the service for the bakery instance.
     @return {Object} the bakery object associated with the serviceName
       instance, created if needed.
     */
    get: function (serviceName) {
      return this._bakeries.get(serviceName);
    },

    /**
     Return a bakery instance associated with the cfg.serviceName provided.

     @method create
     @param cfg the config needed to create a new bakery instance, including
       the service name it will be associated with.
     @return {Object} the bakery object just now created.
     */
    create: function (cfg) {
      let bakery = new this.Bakery(cfg);
      this._bakeries.set(cfg.serviceName, bakery);
      return bakery;
    },

    /**
     Call clearCookie on all the bakery instances created by the factory.

     @method clearAllCookies
     */
    clearAllCookies: function () {
      for (var bakery of this._bakeries.values()) {
        bakery.clearCookie();
      }
    }
  };

  // Populate the library with the bakery.
  jujulib.bakeryFactory = bakeryFactory;

}((module && module.exports) ? module.exports : this));
