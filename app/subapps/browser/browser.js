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


/**
   SubApp for the Browser

   @module juju.subapps
 */
YUI.add('subapp-browser', function(Y) {
  var ns = Y.namespace('juju.subapps'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.browser.views');

  /**
     Browser Sub App for the Juju Gui.

     @class Browser
     @extends {juju.SubApp}

   */
  var extensions = [Y.juju.MachineViewPanel];
  ns.Browser = Y.Base.create('subapp-browser', Y.juju.SubApp, extensions, {
    /**
     * Destroy and remove any lingering views.
     *
     * Make sure they don't linger and hold UX bound events on us when they
     * should be gone.
     *
     * @method _clearViews
     *
     */
    _clearViews: function() {
      if (this._sidebar) {
        this._sidebar.destroy();
        delete this._sidebar;
      }
      if (this._onboarding) {
        this._onboarding.destroy();
        delete this._onboarding;
      }
    },

    /**
      Show or hide the details panel.

      @method _detailsVisible
      @param {Boolean} visible set the panel to hide or show.

     */
    _detailsVisible: function(visible) {
      var detailsNode = Y.one('.bws-view-data'),
          container = Y.one('.charmbrowser');
      if (detailsNode) {
        if (visible) {
          detailsNode.show();
          container.addClass('content-visible');
        }
        else {
          detailsNode.hide();
          container.removeClass('content-visible');
        }
      }
    },

    /**
     Generate a standard shared set of cfg all Views can expect to see.

     @method _getViewCfg
     @param {Object} cfg additional config to merge into the default view
     config.

     */
    _getViewCfg: function(cfg) {
      // We always add the filter data to every request because most of them
      // need to know if there's a search term for rendering the search
      // input and later the charm details will need to know for selecting
      // the proper backup icon.
      return Y.merge(cfg, {
        envSeries: this.get('envSeries'),
        db: this.get('db'),
        filters: this.state.filter.getFilterData(),
        store: this.get('store')
      });
    },

    /**
      Registers Handlebars helpers that need access to subapp data like the
      store instance.

      @method _registerSubappHelpers

     */
    _registerSubappHelpers: function() {
      var store = this.get('store');
      // Register a helper for generating the icon urls for charms.
      Y.Handlebars.registerHelper('charmIconPath', function(charmID, isBundle) {
        return store.iconpath(charmID, isBundle);
      });

    },

    /**
       Determine if we should render the charm details based on the current
       state.

       @method _shouldShowCharm
       @return {Boolean} true if should show.
     */
    _shouldShowCharm: function(req) {
      // XXX Only here until state is set up.
      if (req.path.indexOf('inspector') > -1) { return false; }
      if (req.path.indexOf('machine') > -1) { return false; }
      return (

          this.state.getCurrent('charmID') && (
              !this._details ||
              this.state.hasChanged('charmID')
          )
      );
    },

    /**
       Determine if we should render the editorial content based on the current
       state.

       @method _shouldShowEditorial
       @return {Boolean} true if should show.
     */
    _shouldShowEditorial: function() {
      var should = false;
      if (!this.state.getCurrent('search')) {
        should = true;
      }
      if (!this.state.getCurrent('search') &&
          this.state.hasChanged('search')
      ) {
        should = true;
      }

      return should;
    },

    /**
       Determine if we should render the search results based on the current
       state.

       @method _shouldShowSearch
       @return {Boolean} true if should show.
     */
    _shouldShowSearch: function() {
      if (
          this.state.getCurrent('search') &&
          (
           this.state.hasChanged('search') ||
           this.state.hasChanged('querystring') ||
           (this.state.hasChanged('charmID') &&
            !this.state.getCurrent('charmID'))
          )
      ) {
        return true;
      } else {
        return false;
      }
    },

    /**
       Determine if search changed, so we know how to handle the cache.

       @method _searchChanged
       @return {Boolean} true If search changed.
     */
    _searchChanged: function() {
      if (this.state.getCurrent('search') && (
          this.state.hasChanged('search') ||
          this.state.hasChanged('querystring'))) {
        return true;
      } else {
        return false;
      }
    },

    /**
      Does our app instance have a valid store? If not, then we should ignore
      a lot of work since we can't do it anyway. Sanity check our
      information. During test running, for instance, we don't have a valid
      store to work with and that's ok.

      @method _hasValidStore
      @return {Boolean} do we have a valid store or not.

     */
    _hasValidStore: function() {
      var store = this.get('store');
      return !store.get('noop');
    },

    /**
       The available Views run from this sub app.
       @attribute views
     */
    views: {
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
      this._cache.charms.destroy();
      if (this._cache.search) {
        this._cache.search.destroy();
      }
      if (this._cache.interesting) {
        this._cache.interesting.newCharms.destroy();
        this._cache.interesting.popularCharms.destroy();
        this._cache.interesting.featuredCharms.destroy();
      }
      this.state.destroy();

      // If we've got any views hanging around wipe them.
      if (this._sidebar) {
        this._sidebar.destroy();
      }
      if (this._details) {
        this._details.destroy();
      }
      if (this._onboarding) {
        this._onboarding.destroy();
      }
      if (this.machineViewPanel) {
        this.destroyMachineViewPanel();
      }
    },

    /**
       General app initializer

       @method initializer
       @param {Object} cfg general init config object.
     */
    initializer: function(cfg) {
      // Hold onto charm data so we can pass model instances to other views when
      // charms are selected.
      this._cache = {
        charms: new models.CharmList(),
        search: null,
        interesting: null
      };
      this.state = new models.State();
      this._clearViews();

      this._registerSubappHelpers();

      // Listen for navigate events from any views we're rendering.
      this.on('*:viewNavigate', function(ev) {
        var url;
        if (ev.url) {
          url = ev.url;
        } else if (ev.change) {
          url = this.state.getUrl(ev.change);
        }
        this.navigate(url);
      });

    },

    /**
       Render the charm details view

       @method renderEntityDetails
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    renderEntityDetails: function(req, res, next) {
      var entityId = this.state.getCurrent('charmID');

      var extraCfg = {
        activeTab: this.state.getCurrent('hash'),
        entityId: entityId,
        container: Y.Node.create('<div class="charmview"/>'),
        deployBundle: this.get('deployBundle'),
        deployService: this.get('deployService')
      };

      // If the only thing that changed was the hash, then don't redraw. It's
      // just someone clicking a tab in the UI.
      if (this._details && this.state.hasChanged('hash') &&
          !(this.state.hasChanged('charmID'))) {
        return;
      }

      // Gotten from the sidebar creating the cache.
      var model = this._cache.charms.getById(entityId);

      if (model) {
        extraCfg.charm = model;
      }

      var EntityView;
      if (entityId.indexOf('bundle') !== -1) {
        EntityView = views.BrowserBundleView;
      } else {
        EntityView = views.BrowserCharmView;
      }

      this._details = new EntityView(this._getViewCfg(extraCfg));
      this._details.render();
      this._details.addTarget(this);
    },

    /**
       Render editorial content into the parent view when required.

       @method renderEditorial
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    renderEditorial: function(req, res, next) {
      // If loading the interesting content then it's not a search going on.
      var container = this.get('container'),
          extraCfg = {};

      // The editorial content goes into a
      // different div since we can view both editorial content and
      // view-data (such as a charm details) side by side.
      extraCfg.renderTo = container.one('.bws-content');


      // If there's a selected charm we need to pass that info onto the View
      // to render it selected.
      if (this.state.getCurrent('charmID')) {
        extraCfg.activeID = this.state.getCurrent('charmID');
      }

      this._editorial = new views.EditorialView(
          this._getViewCfg(extraCfg));

      this._editorial.on(this._editorial.EV_CACHE_UPDATED, function(ev) {
        // Add any sidebar charms to the running cache.
        this._cache = Y.merge(this._cache, ev.cache);
      }, this);
      this._editorial.render(this._cache.interesting);
      this._editorial.addTarget(this);
    },

    /**
      Create a 'welcome' message walkthrough for new users.

      Note: onboarding control and creation needs to stay in the charmbrowser
      code because we don't want to show the onboarding code if the
      browser is showing charm details or search results.

      @method renderOnboarding
      @param {Boolean} force Whether it should force render the onboarding.
    */
    renderOnboarding: function(force) {
      // The sidebar method which calls this method checks to make sure that
      // onboarding doesn't exist prior to calling this method due to the
      // double dispatch bug.
      this._onboarding = new Y.juju.views.OnboardingView({
        'container': '#onboarding'
      });

      if (force) {
        this._onboarding.reset();
      }

      if (!this._onboarding.get('seen')) {
        this._onboarding.render();
      }
    },

    /**
       Render search results

       @method renderSearchResults
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    renderSearchResults: function(req, res, next) {
      var container = this.get('container'),
          extraCfg = {};

      extraCfg.renderTo = container.one('.bws-content');

      // If there's a selected charm we need to pass that info onto the View
      // to render it selected.
      if (this.state.getCurrent('charmID')) {
        extraCfg.activeID = this.state.getCurrent('charmID');
      }

      this._search = new views.BrowserSearchView(
          this._getViewCfg(extraCfg));

      // Prepare to handle cache
      this._search.on(this._search.EV_CACHE_UPDATED, function(ev) {
        this._cache = Y.merge(this._cache, ev.cache);
      }, this);

      if (!this._searchChanged()) {
        this._search.render(this._cache.search);
      } else {
        this._search.render();
      }
      this._search.addTarget(this);
    },

    /**
       Handle the route for the sidebar view.

       @method sidebar
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    sidebar: function(req, res, next) {
      // If there is no sidebar, we need to render it.
      if (!this._sidebar) {
        this._sidebar = new views.Sidebar(
            this._getViewCfg({
              container: this.get('container'),
              deployService: this.get('deployService'),
              deployBundle: this.get('deployBundle')
            }));
        this._sidebar.render();
        this._sidebar.addTarget(this);
      }

      // Even if we've got an existing View, check if Home should be displayed
      // or not based on the current view state.
      if (this._sidebar) {
        if (this.state.getCurrent('search')) {
          this._sidebar.set('withHome', true);
        } else {
          this._sidebar.set('withHome', false);
        }
      }

      if (this.machineViewPanel) {
        this.machineViewPanel.destroy();
      }

      // Render search results if search is in the url and the search has been
      // changed in the state.
      if (this._shouldShowSearch()) {
        // Showing search implies that other sidebar content is destroyed.
        if (this._editorial) {
          this._editorial.destroy();
        }

        this.renderSearchResults(req, res, next);
      } else if (this._shouldShowEditorial() || !this._sidebar) {
        // Showing editorial implies that other sidebar content is destroyed.
        if (this._search) {
          this._search.destroy();
        }

        this.renderEditorial(req, res, next);
      }

      // If we've changed the charmID and we have a charmID, render
      // charmDetails.
      if (this._shouldShowCharm(req)) {
        this._detailsVisible(true);
        this.renderEntityDetails(req, res, next);
      }

      // If there are no details in the route then hide the div for
      // viewing the charm details.
      if (!this.state.getCurrent('charmID')) {
        this._detailsVisible(false);
        var detailsNode = Y.one('.bws-view-data');
        if (detailsNode) {
          detailsNode.hide();
        }
        // Clean up any details we've got.
        if (this._details) {
          this._details.destroy({remove: true});
        }

        // Update the activeID on the editorial/search results.
        if (this._editorial) {
          this._editorial.set('activeID', null);
        }
        if (this._search) {
          this._search.set('activeID', null);
        }
      }

      // Only show the onboarding messaging if we're hitting the sidebar view
      // without any extra url bits to the user. It's meant for a fresh user
      // to see, not someone doing what they know they want to do.
      var force = localStorage.getItem('force-onboarding');
      // Reset force-onboarding so that the next request to /sidebar acts normal
      localStorage.setItem('force-onboarding', '');

      if (!this._onboarding || force) {
        if (!this.state.getCurrent('search') &&
            !this.state.getCurrent('charmID')) {
          this.renderOnboarding(force);
        }
      }

      // Sync that the state has changed.
      this.state.save();
      // This can be called as a route callback or as a utility method.
      if (typeof next === 'function') {
        next();
      }
    },

    /**
      Renders the inspector into the sidebar container.
      Route callback.

      @method inspector
    */
    inspector: function(req, res, next) {
      // We need the sidebar rendered so that we can show the inspector in it.
      this.sidebar(req, null, function() {});
      var clientId = req.params.id.replace('/', ''),
          model;
      this.get('db').services.some(function(service) {
        if (service.get('clientId') === clientId) {
          model = service;
          return true;
        }
      });
      // If there is no config set then it's a ghost service model and not
      // a deployed service yet.
      if (!model.get('config')) {
        this.createGhostInspector(model);
      } else {
        this.createServiceInspector(model);
      }
    },

    /**
      Renders the machine view over the canvas.
      Route callback.

      @method machine
    */
    machine: function(req, res, next) {
      if (window.flags.mv) {
        this._renderMachineViewPanelView();
      }
      this.machineViewPanel.setWidthFull();
    },

    /**
      Creates the ghost inspector.

      @method createGhostInspector
      @param {Object} model The ghost service model.
    */
    createGhostInspector: function(model) {
      var db = this.get('db');
      // topo is passed in to the charmbrowser after
      // the environment view is rendered.
      var topo = this.get('topo');
      var editorial = this._editorial;
      var search = this._search;
      // Clear out whatever charm list is in the inspector
      // XXX This clean up will be handled by the state
      // system once that's implemented.
      if (editorial) { editorial.destroy(); }
      if (search) { search.destroy(); }
      // Render the ghost inspector
      var inspector = new Y.juju.views.GhostServiceInspector({
        db: db,
        model: model,
        env: this.get('env'),
        ecs: this.get('ecs'),
        charmModel: db.charms.getById(model.get('charm')),
        topo: topo,
        store: topo.get('store')
      }).render();
      // Add charmbrowser as bubble target for the inspector
      // for the service inspector navigate event.
      inspector.addTarget(this);
      return inspector;
    },

    /**
      Creates a service inspector.

      @method createServiceInspector
      @param {String} model The service model.
    */
    createServiceInspector: function(model) {
      // XXX Placeholder for after the state system can render inspectors
    },

    /**
      When the url is the root path.

      @method routeDefault
      @param {Request} req current request object.
      @param {Response} res current response object.
      @param {function} next callable for the next route in the chain.

     */
    routeDefault: function(req, res, next) {
      // If the url isn't the root path then continue on.
      if (req.path.replace(/\//, '') !== '') {
        next();
        return;
      }
      // Update the state for the rest of things to figure out what to do.
      this.state.loadRequest(req);
      this.sidebar(req, res, next);
    },

    /**
      A url direct to a charm id works.

      Almost any url with a component to it matches this route. We need to
      check if there are exactly *two* parts and if so, check if they're a
      valid id-able segment. (Not /sidebar/search for instance)

      @method routeDirectCharmId
      @param {Request} req current request object.
      @param {Response} res current response object.
      @param {function} next callable for the next route in the chain.

     */
    routeDirectCharmId: function(req, res, next) {
      // If we don't have a valid store we can't do any work here.
      if (!this._hasValidStore()) {
        return;
      }
      // Split the id portion of the url into it's bits so that we can easily
      // parse the type of url that it is.
      var idBits = req.path.replace(/^\//, '').replace(/\/$/, '').split('/');
      // If it doesn't have 2 parts then it's not a charm Id and if it doesn't
      // start with bundle then it's not a bundle id.
      if (idBits[0][0] !== '~' &&
          idBits.length !== 2 && idBits[0] !== 'bundle') {
        next();
        return;
      } else {
        // Strip any extra slashes off the start/end of the id.
        var id = req.path.replace(/^\//, '');
        id = id.replace(/\/$/, '');
        req.params = {
          id: id
        };
      }

      // Update the state for the rest of things to figure out what to do.
      this.state.loadRequest(req);
      this.sidebar(req, res, next);
    },

    /**
       Dispatch to the correct views based on the route that was hit.

       @method routeView
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    routeView: function(req, res, next) {
      if (!req.params) {
        req.params = {};
      }
      // Update the state for the rest of things to figure out what to do.
      this.state.loadRequest(req);
      // This redirects any requests coming in to fullscreen to their
      // sidebar equivelent. It gets done here because we are relying
      // on the current routing code to switch from fullscreen to sidebar
      // to take advantage of its double dispatch mitigation code.
      if ((req.path.indexOf('fullscreen') > -1) ||
          (req.path.indexOf('minimized') > -1)) {
        var self = this;
        // This setTimeout is required because the double dispatch events
        // happen in an unpredictable order so we simply let them complete
        // then navigate away to avoid issues where we are trying to render
        // while other views are in the middle of being torn down.
        setTimeout(function() {
          self.fire('viewNavigate', {
            change: {
              viewmode: 'sidebar'
            }
          });
        }, 0);
        return;
      } else {
        this.sidebar(req, res, next);
      }
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
         The series in the environment, e.g. 'precise'

         @attribute envSeries
         @default undefined
         @type {String}
       */
      envSeries: {},

      /**
         @attribute store
         @default juju.charmworld.APIv3
         @type {Object}
       */
      store: {},

      /**
         @attribute routes
         @default Array of subapp routes.
         @type {Array}
       */
      routes: {
        value: [
          // Show the sidebar on all places if its not manually shut off
          { path: '*', callbacks: 'routeDefault'},
          { path: '/*id/', callbacks: 'routeDirectCharmId'},
          { path: '/search/', callbacks: 'routeView' },
          { path: '/search/*id/', callbacks: 'routeView' },
          { path: '/inspector/*id', callbacks: 'inspector' },
          { path: '/machine/*id', callbacks: 'machine' },
          // Leave these routes here so that if people visit a url with
          // minimized or fullscreen in it they still get the sidebar rendered.
          // But all params after minimized will be ignored.
          { path: '/minimized/*', callbacks: 'routeView' },
          { path: '/fullscreen/*', callbacks: 'routeView' }
        ]
      },

      /**
         @attribute urlNamespace
         @default 'charmbrowser'
         @type {String}
       */
      urlNamespace: {
        value: 'charmbrowser'
      },

      /**
         The "deploy" function prompts the user for service configuration and
         deploys a service.

         @attribute deployService
         @default undefined
         @type {Function}
       */
      deployService: {},

      /**
       * @attribute deployBundle
       * @default undefined
       * @type {Function}
       *
       */
      deployBundle: {}
    }
  });

}, '0.1.0', {
  requires: [
    'handlebars',
    'juju-app-state',
    'juju-browser-models',
    'juju-charm-store',
    'juju-models',
    'juju-view-onboarding',
    'querystring',
    'sub-app',
    'subapp-browser-charmview',
    'subapp-browser-bundleview',
    'subapp-browser-charmresults',
    'subapp-browser-editorial',
    'subapp-browser-jujucharms',
    'subapp-browser-searchview',
    'subapp-browser-sidebar',
    'machine-view-panel-extension'
  ]
});
