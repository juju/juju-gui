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

YUI.add('app-subapp-extension', function(Y) {

  /**
  Adds the ability to register sub applications with a parent Y.App instance by
  recording all instances in a subApps attribute and augmenting the parent
  routes with the sub applications.

  @class SubAppRegistration
  @extension App
  */
  function SubAppRegistration() {}

  SubAppRegistration.ATTRS = {
    subApps: {
      value: {}
    }
  };

  SubAppRegistration.prototype = {
    _blacklistedConfig: [
      'container',
      'html5',
      'serverRouting',
      'transitions',
      'viewContainer'
    ],

    /**
      A list of sub applications to be instantiated after initialization
      of the parent app.

      [{
        type: path.to.subapp
        config: {}
      }]

      @property subApplications
      @type {array}
    */
    subApplications: [],

    /**
      Adds all of the sub applications listed in the subApplications property.

      @method addSubApplications
      @param {Object} cfg Shared application configuration data.
    */
    addSubApplications: function(cfg) {
      this.addSubApps(this.subApplications, cfg);
      Y.on('*:subNavigate', function(e) {
        /* In order for the new namespace enabled router to
          parse this route correctly we need to navigate to the
          appropriate namespace and url */
        this.navigate(':' + e.namespace + ':' + e.url);
      }, this);
    },

    /**
      Adds the sub application and its routes to the parent application.

      @method addSubApp
      @param {object} SubApp instantiable Y.SubApp object.
      @param {object} config configuration properties for the subapp.
    */
    addSubApp: function(SubApp, config) {
      var subApps = this.get('subApps'),
          routes;

      SubApp = new SubApp(config);
      subApps[SubApp.get('urlNamespace')] = SubApp;

      routes = this._extractRoutes(SubApp);
      this._augmentRoutes(routes);
    },

    /**
      Wrapper for addSubApp to add multiple sub apps at once.

      [{
        type: 'path.to.subapplication'
        config: {}
      }]

      @method addSubApps
      @param {array} subApps an array of sub app objects and configs.
      @param {Object} cfg Shared application configuration data.
    */
    addSubApps: function(subApps, cfg) {
      if (cfg === undefined) {
        cfg = {};
      }

      Y.Array.each(subApps, function(subApp) {
        // Merge the shared application config data with the hard coded config
        // so that the hard coded values maintain precedence.
        // Note that black listed attributes are not passed into SubApps.
        Y.each(this._blacklistedConfig, function(blacklist) {
          if (cfg[blacklist]) {
            delete cfg[blacklist];
          }
        });

        var mergedCfg = Y.merge(cfg, subApp.config);
        this.addSubApp(subApp.type, mergedCfg);
      }, this);
    },

    /**
      Extract the routes out of the sub apps.

      @method _extractRoutes
      @protected
      @param {object | integer | undefined} subApp will extract the routes
        out of the supplied subApp, index, or all subApps if undefined.
      @return {array} array of sub app route data.
    */
    _extractRoutes: function(subApp) {
      var subApps = this.get('subApps'),
          routes, subRoutes, i, j;

      switch (typeof subApp) {
        case 'number': // If an index is passed in grab that subapp
          subApp = subApps[subApp];
        /* falls through */
        case 'object': // If subapp is passed in fetch it's routes
          routes = subApp.getSubAppRoutes();
          break;
        case 'undefined':
          routes = [];
          for (i = 0; i < subApps.length; i += 1) {
            subRoutes = subApps[i].getSubAppRoutes();
            for (j = 0; j < subRoutes.length; j += 1) {
              routes.push(subRoutes[j]);
            }
          }
          break;
        default:
          throw 'subApp valid types are integer, object, or undefined';
      }
      return routes;
    },

    /**
      Adds the sub app routes to the parent routes after the middleware

      @method _augmentRoutes
      @protected
      @param {array} array of route objects.
    */
    _augmentRoutes: function(routes) {
      var parentRoutes = this.get('routes'),
          middlewareIndex;

      Y.Array.some(parentRoutes, function(value, index, array) {
        if (value.path !== '*') {
          middlewareIndex = index;
          return true;
        }
      });

      routes.unshift(middlewareIndex, 0);
      Array.prototype.splice.apply(parentRoutes, routes);

      this.set('routes', parentRoutes);
      return parentRoutes;
    }
  };

  Y.namespace('juju').SubAppRegistration = SubAppRegistration;

}, '0.1.0');
