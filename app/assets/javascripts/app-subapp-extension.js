'use strict';

YUI.add('app-subapp-extension', function(Y) {

  function SubAppRegistration() {}

  SubAppRegistration.ATTRS = {
    subApps: {
      value: {}
    }
  };

  SubAppRegistration.prototype = {

    /**
      A list of sub applications to be instantiated after initialization
      of the parent app.

      [{
        type: 'path.to.subapplication'
        config: {}
      }]

      @property subApplications
      @type {array}
    */
    subApplications: [],

    /**
      Adds all of the sub applications listed in the subApplications property.

      @method addSubApplications
    */
    addSubApplications: function() {
      this.addSubApps(this.subApplications);
    },

    /**
      Adds the sub application and it's routes to the parent application.

      @method addSubApp
      @param {string} subApp string referance to an instantiable Y.App object.
      @param {object} config configuration properties for the subapp.
    */
    addSubApp: function(subApp, config) {
      var SubAppObject = Y.Object.getValue(Y, subApp.split('.')),
          subApps = this.get('subApps'),
          routes;

      subApp = new SubAppObject(config);

      subApps[subApp.get('urlNamespace')] = subApp;

      routes = this._extractRoutes(subApp);

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
    */
    addSubApps: function(subApps) {
      Y.Array.each(subApps, function(subApp) {
        this.addSubApp(subApp.type, subApp.config);
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
          middlewareIndex, groupedRoutes;

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
