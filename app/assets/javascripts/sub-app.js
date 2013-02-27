'use strict';

YUI.add('sub-app', function(Y) {

  /**
    Base class to create sub apps.

    A Y.SubApp has the same API as Y.App with a few key differences:
      Routes are pulled into the parent application on registration
      Navigation calls are dispatched to the parent

    @module sub-app
    @class SubApp
    @namespace juju
  */
  Y.namespace('juju').SubApp = Y.Base.create('sub-app', Y.App.Base, [], {

    initializer: function() {
      this.publish('subNavigate', {
        emitFacade: true
      });
    },

    /**
      Overwrites the core Y.App.Base.navigate method to fire a navigation
      event with details to the parent application.

      @method navigate
      @param {string} url the sub apps path.
    */
    navigate: function(url, options) {
      this.fire('subNavigate', {
        url: url,
        options: options
      });
    },

    /**
      Fetches the sub apps routes and adds the namespace to each record.

      @method getSubAppRoutes
      @return {array} routes with namespace.
    */
    getSubAppRoutes: function() {
      var routes = this.get('routes'),
          namespace = this.get('urlNamespace'),
          i;

      Y.Array.each(routes, function(route) {
        route.namespace = namespace;
      });

      return routes;
    },

    destructor: function() {}

  }, {
    ATTRS: {
      /**
        The namespace of the sub-app to update the browser url under.

        @attribute urlNamespace
        @default undefined
        @type {string}
      */
      urlNamespace: {}
    }
  });

}, '0.1.0', {requires: ['app-base', 'base-build']});
