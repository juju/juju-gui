/* Copyright (C) 2016 Canonical Ltd. */
'use strict';

var module = module;

(function (exports) {


  var jujulib = exports.jujulib;
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
  function bakeryFactory(cfg) {
    this.Bakery = cfg.Bakery;
    this.bakeries = new Map();
  };

  bakeryFactory.prototype = {
    /**
     Return a bakery instance associated with the cfg.serviceName provided.
     @method get
     @param cfg the config needed to create a new bakery instance.
     @return {Object} the bakery object associated with the cfg.serviceName i
     nstance, created if needed.
     */
    get: function (cfg) {
      return this.bakeries.get(cfg.serviceName);
    },

    create: function (cfg) {
      let bakery = new this.Bakery(cfg);
      this.bakeries.set(cfg.serviceName, bakery);
      return bakery;
    },

    /**
     Call clearCookie on all the bakery instances created by the factory.
     @method clearAllCookies
     */
    clearAllCookies: function () {
      for (var bakery of this.bakeries.values()) {
        bakery.clearCookie();
      }
    }
  };

  // Populate the library with the API client
  jujulib.bakeryFactory = bakeryFactory;

}((module && module.exports) ? module.exports : this));
