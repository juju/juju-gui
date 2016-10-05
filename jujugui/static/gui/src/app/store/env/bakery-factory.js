/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2015 Canonical Ltd.

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

/**
 * Bakery Factory returns the bakery for the service name provided, either by 
 * creating a new one or returning the one created for this seervice name.
 *
 * @module env
 * @submodule env.bakery
 */

YUI.add('juju-env-bakery-factory', function(Y) {

  var module = Y.namespace('juju.environments.web');
  /**
   * Bakery client inspired by the equivalent GO code.
   *
   * This object exposes the ability to perform requests
   * that automatically acquire and discharge macaroons.
   *
   * @class Bakery
   */
  
  var BakeryFactory = Y.Base.create('BakeryFactory',
    Y.Base, [], {

      /**
        Instantiate the internal map for the bakeries maintained in here.
        @method initializer
      */
      initializer: function () {
        this.bakeries = new Map();
      },

      /**
        Return a bakery instance associated with the cfg.serviceName provided.
        @method get
        @param cfg the config needed to create a new bakery instance.
        @return {Object} the bakery object associated with the cfg.serviceName i
                         nstance
      */
      bakery: function(cfg) {
        let bakery = this.bakeries.get(cfg.serviceName);
        if (bakery) {
          return bakery;
        }
        bakery = new Y.juju.environments.web.Bakery(cfg);
        this.bakeries.set(cfg.serviceName, bakery);
        return bakery;
      },

      /**
        Call clearCookie on all the bakery instances created by the factory.
        @method clear
      */
      clear: function() {
        for (var bakery of this.bakeries.values()) {
          bakery.clearCookie();
        }
      },
    }
  );

  module.BakeryFactory = BakeryFactory;

}, '0.1.0', {
  requires: [
    'base',
    'cookie',
    'node',
    'juju-env-base',
    'juju-env-bakery',
    'macaroon'
  ]
});
