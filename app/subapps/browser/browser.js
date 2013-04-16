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
      models = Y.namespace('juju.models');


  var StateManager =

  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class Browser
   * @extends {juju.SubApp}
   *
   */
  ns.Browser = Y.Base.create('subapp-browser', Y.juju.SubApp, [], {

    _getStateUrl: function(change) {
        var urlParts = ['/bws'];

        this._viewState = Y.merge(this._viewState, change);

        urlParts.push(this._viewState.viewmode);
        if (this._viewState.search) {
          urlParts.push('search');
        }
        if(this._viewState.charmID) {
          urlParts.push(this._viewState.charmID);
        }

        // Always end on a /
        return urlParts.join('/');
    },

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
        store: this.get('store')
      });
    },

    _initState: function() {
      this._viewState = {
        viewmode: 'sidebar',
        search: false,
        charmID: undefined,
        query: {}
  };
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
      sidebar: {
        type: 'juju.browser.views.Sidebar',
        preserve: false
      }
    },

    /**
       Cleanup after ourselves on destroy.

       @method destructor

     */
    destructor: function() {
      this._cacheCharms.destroy();

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

      this._initState();

      // Listen for navigate events from any views we're rendering.
      this.on('*:viewNavigate', function(ev) {
        var url;
        if (ev.url) {
          url = ev.url;
        } else if (ev.change) {
          url = this._getStateUrl(ev.change);
        }
        this.navigate(url);
      });
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
      this._viewState.viewmode = 'fullscreen';
      if (this._sidebar) {
        this._sidebar.destroy();
      }

      if (!this._fullscreen) {
        this._fullscreen = this.showView('fullscreen', this._getViewCfg(), {
          'callback': function(view) {
            // if the fullscreen isn't the last part of the path, then ignore
            // the editorial content.
            if (this._getSubPath(req.path) === 'fullscreen') {
              this.renderEditorial(req, res, next);
            }
            next();
          }
        });
      } else {
        next();
      }
    },

    /**
      Render editorial content into the parent view when required.

      The parent view is either fullscreen/sidebar which determines how the
      editorial content is to be rendered.

      @method renderEditorial
      @param {Request} req current request object.
      @param {Response} res current response object.
      @param {function} next callable for the next route in the chain.

     */
    renderEditorial: function(req, res, next) {
      this._viewState.search = false;
      var container = this.get('container'),
          editorialContainer,
          extraCfg = {};

      if (req.path.indexOf('fullscreen') !== -1) {
        // The fullscreen view requires that there be no editorial content if
        // we're looking at a specific charm. The div we dump our content into
        // is shared. So if the url is /fullscreen show editorial content, but
        // if it's not, there's something else handling displaying the
        // view-data.
        extraCfg.renderTo = container.one('.bws-view-data');
        extraCfg.isFullscreen = true;
      } else {
        // If this is the sidebar view, then the editorial content goes into a
        // different div since we can view both editorial content and
        // view-data (such as a charm details) side by side.
        extraCfg.renderTo = container.one('.bws-content');
      }

      if (!this._editorial) {
        this._editorial = new Y.juju.browser.views.EditorialView(
            this._getViewCfg(extraCfg));

        this._editorial.render();
        this._editorial.addTarget(this);

        // Add any sidebar charms to the running cache.
        this._cacheCharms.add(this._editorial._cacheCharms);
      }
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
      this._viewState.viewmode = 'sidebar';
      if (this._fullscreen) {
        this._fullscreen.destroy();
      }
      // Clean up any details we've got.
      if (this._details) {
        this._details.destroy({remove: true});
      }

      // If the sidebar is the final part of the route, then hide the div for
      // viewing the charm details.
      if (this._getSubPath(req.path) === 'sidebar') {
        var detailsNode = Y.one('.bws-view-data');
        if (detailsNode) {
          detailsNode.hide();
        }
      }

      if (!this._sidebar) {
        // Whenever the sidebar view is rendered it needs some editorial
        // content to display to the user. We only need once instance though,
        // so only render it on the first view. As users click on charm to
        // charm and we generate urls /sidebar/precise/xxx we don't want to
        // re-render the sidebar content.
        this._sidebar = this.showView('sidebar', this._getViewCfg(), {
          'callback': function(view) {
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
      var charmID = req.params.id;
      this._viewState.charmID = charmID;
      var extraCfg = {
        charmID: charmID,
        container: Y.Node.create('<div class="charmview"/>')
      };

      // The details view needs to know if we're using a fullscreen template
      // or the sidebar version.
      if (req.params.viewmode === 'fullscreen') {
        extraCfg.isFullscreen = true;
      }

      // Gotten from the sidebar creating the cache.
      var model = this._cacheCharms.getById(charmID);

      if (model) {
        extraCfg.charm = model;
      }

      this._details = new Y.juju.browser.views.BrowserCharmView(
          this._getViewCfg(extraCfg));
      this._details.render();
      this._details.addTarget(this);
      // Make sure we show the bws-view-data div that the details renders
      // into.
      Y.one('.bws-view-data').show();
      next();
    },

    routeView: function(req, res, next) {
      this[req.params.viewmode](req, res, next);
    }

  }, {
    ATTRS: {
      /**
         @attribute container
         @default '#subapp-browser'
         @type {String}

       */
      container: {
        value: '#subapp-browser'
      },

      /**
         @attribute store
         @default Charmworld0
         @type {Charmworld0}

       */
      store: {
        /**
          We keep one instance of the store and will work on caching results
          at the app level so that routes can share api calls. However, in
          tests there's no config for talking to the api so we have to watch
          out in test runs and allow the store to be broken.

          method store.valueFn

        */
        valueFn: function() {
          var url = '';
          if (!window.juju_config || ! window.juju_config.charmworldURL) {
            console.error('No juju config to fetch charmworld store url');
          } else {
            url = window.juju_config.charmworldURL;
          }
          return new Y.juju.Charmworld0({
            'apiHost': url
          });
        }
      },

      /**
         @attribute routes
         @default Array of subapp routes.
         @type {Array}

       */
      routes: {
        value: [
          // Double routes are needed to catch /fullscreen and /fullscreen/
          { path: '/bws/:viewmode/*', callbacks: 'routeView' },
          { path: '/bws/:viewmode/*id/', callbacks: 'charmDetails'}
        ]
      },

      /**
         @attribute urlNamespace
         @default 'charmstore'
         @type {String}

       */
      urlNamespace: {
        value: 'charmstore'
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
