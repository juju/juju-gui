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
     * Some routes might have sub parts that hint to where a user wants focus.
     * In particular we've got the tabs that might have focus. They are the
     * last optional component of some of the routes.
     *
     * @method _getSubPath
     * @param {String} path the full path to search for the sub path.
     *
     */
    _getSubPath: function(path) {
      var reLastWord = /[^\/]*\/?$/,
          lastWords = path.match(reLastWord);
      if (lastWords.length) {
        return lastWords[0].replace('/', '');
      } else {
        return undefined;
      }
    },

    /**
     * Generate a standard shared set of cfg all Views can expect to see.
     *
     * @method _getViewCfg
     * @param {Object} cfg additional config to merge into the default view
     * config.
     *
     */
    _getViewCfg: function(cfg) {
      return Y.merge(cfg, {
        db: this.get('db')
      });
    },

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
        preserve: false
      },
      sidebar: {
        type: 'juju.browser.views.Sidebar',
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
    initializer: function(cfg) {},

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
      this.showView('fullscreen', this._getViewCfg());
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
      var subpath = this._getSubPath(req.path);
      this.showView('fullscreenCharm', this._getViewCfg({
        charmID: req.params.id,
        subpath: subpath
      }));
      next();
    },

    /**
     * Destroy the subapp instance.
     *
     * @method destructor
     *
     */
    destructor: function() {},

    /**
     * Handle the route for the sidebar view.
     *
     * @method sidebar
     * @param {Request} req current request object.
     * @param {Response} res current response object.
     * @param {function} next callable for the next route in the chain.
     *
     */
    sidebar: function(req, res, next) {
      this.showView('sidebar', this._getViewCfg());
      next();
    }

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
          { path: '/bws/fullscreen/*id/configuration/',
            callbacks: 'fullscreenCharm' },
          { path: '/bws/fullscreen/*id/hooks/', callbacks: 'fullscreenCharm' },
          { path: '/bws/fullscreen/*id/interfaces/',
            callbacks: 'fullscreenCharm' },
          { path: '/bws/fullscreen/*id/qa/', callbacks: 'fullscreenCharm' },
          { path: '/bws/fullscreen/*id/readme/', callbacks: 'fullscreenCharm' },
          { path: '/bws/fullscreen/*id/', callbacks: 'fullscreenCharm' },
          { path: '/bws/sidebar/', callbacks: 'sidebar' }
        ]
      }
    }
  });

}, '0.1.0', {
  requires: [
    'sub-app',
    'subapp-browser-fullscreen',
    'subapp-browser-sidebar'
  ]
});
