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
  var SubApp = Y.Base.create('sub-app', Y.App.Base, [], {

    initializer: function() {
      this.publish('subNavigate', {
        emitFacade: true,
        broadcast: 1
      });
    },

    /*
      Middleware that is called on every namespaced path to ensure that the
      sub app is rendered before calling any other callbacks

      @method verifyRendered
    */
    verifyRendered: function() {
      if (this.get('rendered') === false) {
        this.render();
      }
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
        options: options,
        namespace: this.get('urlNamespace')
      });
    },

    /**
      Overwrites the core Y.App.Base render method to toggle an attribute
      once the application has been rendered

      @method render
    */
    render: function() {
      SubApp.superclass.render.call(this);
      this.set('rendered', true);
    },

    /**
      Because the native Y.App.Base includes Router which automatically adds
      this callback handler in its initalizer we need to blank it out to
      avoid throwing errors on history change events

      When YUI splits Router and Pjax from the Y.App.Base then we should be
      able to simply delete this method and have it function appropriately

      @method _afterHistoryChange
      @protected
      @return {undefined} Clobbers old function so returns undefined.
    */
    _afterHistoryChange: function() {},

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
      urlNamespace: {},

      /**
        Whether the sub app is rendered or not

        @attribute rendered
        @default false
        @type {boolean}
      */
      rendered: {
        value: false
      }
    }
  });

  Y.namespace('juju').SubApp = SubApp;

}, '0.1.0', {requires: ['app-base', 'base-build']});
