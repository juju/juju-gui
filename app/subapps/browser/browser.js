'use strict';


/**
 * SubApp for the Browser
 *
 * @module juju
 * @submodule subapps
 *
 */
YUI.add('subapp-browser', function(Y) {
  var ns = Y.namespace('juju.subapps'),
      models = Y.namespace('juju.models'),
      store = new Y.juju.Charmworld0({
        'apiHost': window.juju_config.charmworldURL
      });

  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class Browser
   * @extends {juju.SubApp}
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
        db: this.get('db'),
        store: store
      });
    },

    /**
     * The available Views run from this sub app.
     * @attribute views
     *
     */
    views: {
      charmDetails: {
        type: 'juju.browser.views.BrowserCharmView',
        preserve: false
      },
      fullscreen: {
        type: 'juju.browser.views.FullScreen',
        preserve: false
      },
      fullscreenCharm: {
        type: 'juju.browser.views.FullScreen',
        preserve: false
      },
      sidebar: {
        type: 'juju.browser.views.Sidebar',
        preserve: false
      }
    },

    destructor: function() {
      this._cacheCharms.destroy();
    },

    renderEditorial: function (req, res, next) {
      console.log('render editorial');
      if (!this._editorial) {
        this._editorial = new Y.juju.browser.views.EditorialView(
          this._getViewCfg()
        );
        this._editorial.render(Y.one('#subapp-browser .bws-content'));
        // Add any sidebar charms to the running cache.
        this._cacheCharms.add(this._editorial._cacheCharms);
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
      // Hold onto charm data so we can pass model instances to other views when
      // charms are selected.
      this._cacheCharms = new models.BrowserCharmList();
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
     * Handle the route for the sidebar view.
     *
     * @method sidebar
     * @param {Request} req current request object.
     * @param {Response} res current response object.
     * @param {function} next callable for the next route in the chain.
     *
     */
    sidebar: function(req, res, next) {
      // Clean up any details we've got.
      if (this._details) {
        this._details.destroy({remove: true});
      }

      if (!this._sidebar) {
        this._sidebar = this.showView('sidebar', this._getViewCfg(), {
          callback: function(view) {
            this.renderEditorial(req, res, next);
            next();
          }
        });
      } else {
        next();
      }
    },

    /**
     * Render the sidebar view of a specific charm to the client.
     *
     * @method sidebarCharm
     * @param {Request} req current request object.
     * @param {Response} res current response object.
     * @param {function} next callable for the next route in the chain.
     *
     */
    charmDetails: function(req, res, next) {
      console.log('render details');
      var charmID = req.params.id;
      var extraCfg = {
        charmID: charmID,
        container: Y.Node.create('<div class="charmview"/>')
      };
      // Gotten from the sidebar creating the cache.
      var model = this._cacheCharms.getById(charmID);

      if (model) {
        extraCfg.charm = model;
      }

      this._details = new Y.juju.browser.views.BrowserCharmView(
        this._getViewCfg(extraCfg)
      );
      this._details.render();
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

          { path: '/bws/sidebar/', callbacks: 'sidebar' },
          { path: '/bws/sidebar/*/', callbacks: 'sidebar' },
          { path: '/bws/sidebar/*id/', callbacks: 'charmDetails' }
        ]
      }
    }
  });

}, '0.1.0', {
  requires: [
    'juju-charm-store',
    'juju-models',
    'sub-app',
    'subapp-browser-charmview',
    'subapp-browser-editorial',
    'subapp-browser-fullscreen',
    'subapp-browser-sidebar'
  ]
});
