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
        type: Y.SubappInstance
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

      this._augmentParentRoutes(routes);
    },

    /**
      Wrapper for addSubApp to add multiple sub apps at once.

      [{
        app: Y.SubAppOne,
        cfg: {}
      }]

      @method addSubApps
      @param {array} subApps an array of sub abb objects and configs.
    */
    addSubApps: function(subApps) {
      for (var i = 0; i < subApps.length; i += 1) {
        this.addSubApp(subApps[i].type, subApps[i].config);
      }
    },

    /**
      Public method to refresh routes from the sub apps.

      @method refreshRoutes
      @param {integer} index index of the subapp to refresh if undefined
        it will refresh all.
      @return {array} array of sub app route data.
    */
    refreshRoutes: function(index) {
      return this._augmentParentRoutes(this._extractRoutes(index));
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
        case 'number':
          subApp = subApps[subApp];
        /* falls through */
        case 'object':
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

      @method _augmentParentRoutes
      @protected
      @param {array} array of route objects.
    */
    _augmentParentRoutes: function(routes) {
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
    }
  };

  Y.namespace('juju').SubAppRegistration = SubAppRegistration;

}, '0.1.0');
