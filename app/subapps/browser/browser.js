'use strict';


/**
 * SubApp for the Browser
 *
 * @module juju
 * @submodule subapps
 *
 */
YUI.add('subapp-browser', function(Y) {
  var ns = Y.namespace('juju.subapps');

  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class Browser
   * @extends {Y.juju.SubApp}
   *
   */
  ns.Browser = Y.Base.create('subapp-browser', Y.juju.SubApp, [], {

    /**
     * The available Views run from this sub app.
     * @attribute views
     *
     */
    views: {
      fullscreen: {
        type: 'juju.browser.views.FullScreen',
        preserve: true
      },
      fullscreenCharm: {
        type: 'juju.browser.views.FullScreen',
        preserve: true
      }
    },

    /**
     * General app initializer
     *
     * @method initializer
     * @param {Object} cfg general init config object.
     *
     */
    initializer: function(cfg) {
    },

    /**
     * Render the fullscreen view to the client.
     *
     * @method fullscreen
     * @param {Request} req current request object.
     * @param {Response} res current response object.
     * @param {function} next callable for the next route in the chain.
     *
     */
    fullscreen: function(req, res, next) {
      console.log('showing fullscreen', this.name);
      this.showView('fullscreen');
      next();
    },

    /**
     * Render the fullscreen view of a specific charm to the client.
     *
     * @method fullscreenCharm
     * @param {Request} req current request object.
     * @param {Response} res current response object.
     * @param {function} next callable for the next route in the chain.
     *
     */
    fullscreenCharm: function(req, res, next) {
      console.log('showing fullscreen charm', this.name);
      this.showView('fullscreenCharm');
      next();
    },

    /**
     * Destroy the subapp instance.
     *
     * @method destructor
     *
     */
    destructor: function() {}

  }, {
    ATTRS: {
      container: {
        value: '#subapp-browser'
      },
      urlNamespace: {
        value: 'charmstore'
      },
      routes: {
        value: [
          { path: '/bws/fullscreen/', callbacks: 'fullscreen' },
          { path: '/bws/fullscreen/:id/', callbacks: 'fullscreenCharm' }
          // { path: '/bws/sidebar/:id/', callbacks: 'sidebar_charm' },
        ]
      }
    }
  });

}, '0.1.0', {requires: ['sub-app', 'subapp-browser-fullscreen']});
