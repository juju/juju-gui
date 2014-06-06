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
    // Mark the entire subapp has hidden.
    hidden: false,
    // Even though fullscreen is no longer a valid mode we need it in the list
    // so that the routing code still knows how to redirect fullscreen
    // requests to the sidebar views.
    // XXX Removing 'fullscreen' stops the fullscreen redirects from working.
    // XXX viewmodes need to go away they are only here as a hack for now.
    viewmodes: ['sidebar', 'fullscreen', 'inspector', 'machine'],

    /**
     * Make sure we destroy views no long used.
     *
     * @method _cleanOldViews
     *
     */
    _cleanOldViews: function() {
      var oldViewmode = this.state.getPrevious('viewmode');
      if (this.state.hasChanged('viewmode') && oldViewmode) {
        var viewAttr = '_' + oldViewmode;
        if (this[viewAttr]) {
          this[viewAttr].destroy();
          delete this[viewAttr];
        }
        if (oldViewmode === 'sidebar' && this._details) {
          this._details.destroy();
          delete this._details;
        }
      }
    },

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
          container.addClass('animate-in');
        }
        else {
          detailsNode.hide();
          container.removeClass('animate-in');
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
    _shouldShowCharm: function() {
      var state = this.state,
          current = state.getState('current', 'sectionA', 'metadata'),
          previous = state.getState('previous', 'sectionA', 'metadata');
      current = current || {};
      previous = previous || {};
      return current.id && (!this._details || current.id !== previous.id);
    },

    /**
       Determine if we should render the curated content based on the current
       state.

       @method _shouldShowCurated
       @return {Boolean} true if should show.
     */
    _shouldShowCurated: function() {
      var should = false;
      // If the viewmode has changed, and seach is not enabled then yes
      if (!this.state.getCurrent('search') &&
          this.state.hasChanged('viewmode')
      ) {
        should = true;
      }

      // Even if viewmode hasn't changed, but search has changed and is false
      // then yes
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
           this.state.hasChanged('viewmode') ||
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
      var state = this.state,
          sectionA = 'sectionA',
          metadata = 'metadata',
          current = state.getState('current', sectionA, metadata),
          previous = state.getState('previous', sectionA, metadata),
          newSearch = current && current.search,
          oldSearch = previous && previous.search;
      if (newSearch &&
          (JSON.stringify(newSearch) !== JSON.stringify(oldSearch))) {
        return true;
      } else {
        return false;
      }
    },

    /**
       Strip the viewmode from the charmid when processing to check for proper
       routing.

       @method _stripViewMode
       @param {String} id the req.param.id found.
     */
    _stripViewMode: function(id) {
      // Clear out any parts of /sidebar/search, /sidebar, or /search from the
      // id. See if we still really have an id.
      var match =
          /^\/?(sidebar|search|test\/index\.html)\/?(search)?\/?/;

      if (id && id.match(match)) {
        // Strip it out.
        id = id.replace(match, '');
        // if the id is now empty, set it to null.
        if (id === '') {
          id = null;
        }
      }

      if (id) {
        // Strip any extra slashes off the start/end of the id.
        id = id.replace(/^\//, '');
        id = id.replace(/\/$/, '');
      }

      return id;
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
      },
      jujucharms: {
        type: 'juju.browser.views.JujucharmsLandingView',
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
        this.machineViewPanel.destroy();
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

      this.state = new models.UIState({
        // Disallow routing to inspectors if we are in sandbox mode; the
        // model to be inspected will not be available.
        allowInspector: !cfg.sandbox,
        dispatchers: {
          sectionA: {
            charmbrowser: this._charmBrowserDispatcher.bind(this),
            inspector: this._inspector.bind(this),
            empty: this.emptySectionA.bind(this)
          },
          sectionB: {
            machine: this._machine.bind(this),
            empty: this.emptySectionB.bind(this)
          }
        }
      });

      this._clearViews();

      this._registerSubappHelpers();

      // Listen for navigate events from any views we're rendering.
      // window.flags.il
      this.on('*:viewNavigate', function(ev) {
        var url;
        if (ev.url) {
          url = ev.url;
        } else if (ev.change) {
          url = this.state.getUrl(ev.change);
        }
        this.navigate(url);
      }, this);

      this.on('*:changeState', function(e) {
        this.state.set('allowInspector', true);
        var state = e.details[0];
        var url = this.state.generateUrl(state);
        // Make sure that any inspectors or charm listings are cleaned up.
        this.emptySectionA();
        this.navigate(url);
      }, this);

      this.on('*:serviceDeployed', function(e) {
        if (this._activeInspector) {
          var activeClientId = this._activeInspector.get('model')
            .get('clientId');
          // Because multiple services can be deployed at once we only want to
          // switch to a deployed inspector if there is currently one open.
          // And we only want to switch to that specific inspector.
          if (activeClientId === e.clientId) {
            this.fire('changeState', {
              sectionA: {
                component: 'inspector',
                metadata: { id: e.serviceName }
              }});
          }
        }
      }, this);
    },

    /**
      Handles rendering and/or updating the charmbrowser UI component.

      @method _charmBrowserDispatcher
      @param {Object|String} metadata The metadata to pass to the charmbrowser
        view.
    */
    _charmBrowserDispatcher: function(metadata) {
      this.renderCharmBrowser(metadata);

      // XXX Won't be needed once window.flags.il becomes the norm. The details
      // template should be updated to hide by default.
      if (this._shouldShowCharm()) {
        // The entity rendering views need to handle the new state format
        // before this can be hooked up.
        this._detailsVisible(true);
        this.renderEntityDetails();
      }
      // If there are no details in the route then hide the div for
      // viewing the charm details.
      if (!metadata || !metadata.id) {
        this._cleanupEntityDetails();
      }
    },

    /**
      Ensures we clean up all the various UX bits that need updating when we
      no longer need to display charm details

      @method _inspector
      @param {Object|String} metadata The metadata to pass to the inspector
        view.
    */
    _cleanupEntityDetails: function() {
      this._detailsVisible(false);
      var detailsNode = Y.one('.bws-view-data');
      if (detailsNode) {
        detailsNode.hide();
      }
      // Clean up any details we've got.
      if (this._details) {
        this._details.destroy({remove: true});
      }

      // Update the activeID on the charmbrowser view.
      if (this._charmbrowser) {
        this._charmbrowser.set('activeID', null);
      }
    },

    /**
      Handles rendering and/or updating the inspector UI component.

      @method _inspector
      @param {Object|String} metadata The metadata to pass to the inspector
        view.
    */
    _inspector: function(metadata) {
      var clientId = metadata.id,
          model;
      this.get('db').services.some(function(service) {
        if ((service.get('clientId') === clientId) ||
            // In this case clientId is actually the real service id.
            (service.get('id') === clientId)) {
          model = service;
          return true;
        }
      });
      var previousInspector = this._activeInspector;
      if (metadata.localType) {
        var file = metadata.flash.file;
        var services = metadata.flash.services;
        if (metadata.localType === 'new') {
          this._activeInspector = this.createRequestSeriesInspector(file);
        } else if (metadata.localType) {
          this._activeInspector = this.createUpgradeOrNewInspector(
              file, services);
        }
      } else if (!model.get('config')) {
        // If there is no config set then it's a ghost service model and not
        // a deployed service yet.
        this._activeInspector = this.createGhostInspector(model);
      } else {
        this._activeInspector = this.createServiceInspector(model);
      }
      // In the instance of updating, destroy the existing inspector.
      if (previousInspector) {
        previousInspector.destroy();
      }
    },

    /**
      Handles rendering and/or updating the machine UI component.

      @method _machine
      @param {Object|String} metadata The metadata to pass to the machine
        view.
    */
    _machine: function(metadata) {
      this._renderMachineViewPanelView(this.get('db'), this.get('env'));
      this.get('environmentHeader').setSelectedTab('machines');
    },

    /**
      Empties out the sectionA UI making sure to properly clean up.

      @method emptySectionA
    */
    emptySectionA: function() {
      if (this._charmbrowser) {
        this._charmbrowser.destroy();
        this._charmbrowser = null;
      }
      if (this._sidebar.search) {
        this._sidebar.hideSearch();
      }
      if (this._details) {
        this._details.destroy({ remove: true });
        var detailsNode = Y.one('.bws-view-data');
        // XXX window.flags.il the details node is shown by default. When we
        // switch to the new state object it should be hidden by default in the
        // template.
        if (detailsNode) {
          this._detailsVisible(false);
          detailsNode.empty();
        }
      }
      if (this._activeInspector) {
        this._activeInspector.destroy();
      }
    },

    /**
      Empties out the sectionB UI making sure to properly clean up.

      @method emptySectionB
    */
    emptySectionB: function() {
      if (this.machineViewPanel) {
        this.machineViewPanel.destroy();
        this.machineViewPanel = null;
      }
    },

    /**
       Render the charm details view

       @method renderEntityDetails
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    renderEntityDetails: function(req, res, next) {
      var state = this.state,
          entityId,
          hash;

      entityId = state.getState('current', 'sectionA', 'metadata').id;
      hash = state.getState('current', 'sectionA', 'metadata').hash;

      var extraCfg = {
        activeTab: hash,
        entityId: entityId,
        container: Y.Node.create('<div class="charmview"/>'),
        deployBundle: this.get('deployBundle'),
        deployService: this.get('deployService')
      };

      // If the only thing that changed was the hash, then don't redraw. It's
      // just someone clicking a tab in the UI.
      var hashChanged, charmIDChanged, viewmodeChanged;
      // XXX until UIState supports dot notation for hasChanged, we'll need
      // to manually compare metadata attributes
      var current = state.getState('current', 'sectionA', 'metadata'),
          previous = state.getState('previous', 'sectionA', 'metadata');
      current = current || {};
      previous = previous || {};
      charmIDChanged = current.id !== previous.id;
      hashChanged = current.hash !== previous.hash;
      viewmodeChanged = false; // no longer supported so just hard code

      // XXX viewmode can be eliminated from this condition once
      // window.flags.il becomes standard
      if (this._details &&
          hashChanged &&
          !(charmIDChanged || viewmodeChanged)) {
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
       Render charmbrowser view content into the parent view when required.

       @method renderCharmBrowser
       @param {Object} metadata The state metadata for the charmbrowser.
     */
    renderCharmBrowser: function(metadata) {
      var activeID;
      // If there's a selected charm we need to pass that info onto the View
      // to render it selected.
      var meta = this.state.getState('current', 'sectionA', 'metadata');
      if (meta) { activeID = meta.id; }

      if (!this._charmbrowser) {
        this._charmbrowser = new views.CharmBrowser({
          deployService: this.get('deployService'),
          deployBundle: this.get('deployBundle')
        });
        this._charmbrowser.addTarget(this);
      }
      // See the _getViewCfg method for the extra objects which are passed in
      // every time the charmbrowser is rendered.
      this._charmbrowser.setAttrs(this._getViewCfg({
        parentContainer: this._sidebar.get('container').one('.bws-content'),
        activeID: activeID
      }));
      // Render is idempotent
      this._charmbrowser.render(metadata, this._searchChanged());
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
       Handle the route for the sidebar view.

       @method sidebar
     */
    sidebar: function() {
      if (!this._sidebar) {
        this._sidebar = new views.Sidebar(
            this._getViewCfg({
              container: this.get('container')
            }));
        this._sidebar.render();
        this._sidebar.addTarget(this);
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
      var clientId = req.params.id,
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
        this._renderMachineViewPanelView(this.get('db'));
      }
    },

    /**
      Creates the request series inspector for local charms.

      @method createUpgradeOrNewInspector
      @param {Object} file The local charm data file.
      @param {Array} services The list of existing services that can be updated.
    */
    createUpgradeOrNewInspector: function(file, services) {
      var inspector = new Y.juju.views.LocalNewUpgradeInspector({
        services: services,
        file: file,
        env: this.get('env'),
        db: this.get('db')
      }).render();
      inspector.recalculateHeight();
      inspector.addTarget(this);
      return inspector;
    },

    /**
      Creates the request series inspector for local charms.

      @method createRequestSeriesInspector
      @param {Object} file The local charm data file.
    */
    createRequestSeriesInspector: function(file) {
      var inspector = new Y.juju.views.RequestSeriesInspector({
        file: file,
        env: this.get('env'),
        db: this.get('db')
      }).render();
      inspector.recalculateHeight();
      inspector.addTarget(this);
      return inspector;
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

      inspector.addTarget(this);
      return inspector;
    },

    /**
      Creates a service inspector.

      @method createServiceInspector
      @param {String} model The service model.
    */
    createServiceInspector: function(model) {
      var db = this.get('db'),
          topo = this.get('topo');

      var inspector = new Y.juju.views.ServiceInspector({
        db: db,
        model: model,
        env: this.get('env'),
        ecs: this.get('ecs'),
        enableDatabinding: true,
        topo: topo,
        store: topo.get('store')
      }).render();

      inspector.addTarget(this);
      return inspector;
    },

    /**
      When there's no charm or viewmode default to the default viewmode for all
      pages.

      @method routeDefault
      @param {Request} req current request object.
      @param {Response} res current response object.
      @param {function} next callable for the next route in the chain.

     */
    routeDefault: function(req, res, next) {
      // The new state object takes the request, parses it and then dispatches
      // so this method only needs these lines once switched over.
      // We need to render the sidebar view as default. This is the new design
      // in the near future we will likely just render it in the initializer.
      this.sidebar();
      this.state.loadRequest(req);
      next();
    },

    /**
      A url direct to a charm id works, however it needs to default the
      viewmode to sidebar in that case.

      Almost any url with a component to it matches this route. We need to
      check if there are exactly *two* parts and if so, check if they're a
      valid id-able segment. (Not /sidebar/search for instance)

      @method routeDirectCharmId
      @param {Request} req current request object.
      @param {Response} res current response object.
      @param {function} next callable for the next route in the chain.

     */
    routeDirectCharmId: function(req, res, next) {
      var viewmode = 'sidebar';

      // If we don't have a valid store we can't do any work here.
      if (!this._hasValidStore()) {
        return;
      }

      // Check if we have exactly two url parts in our path.
      // The best way to count the parts is to strip the start/end slash and
      // then split on the rest. We only care if there are exactly two parts.
      var idBits = req.path.replace(/^\//, '').replace(/\/$/, '').split('/'),
          id = null;

      if (idBits.length > 1 &&
          ((idBits[0] !== 'inspector') || (idBits[0] !== 'machine'))) {
        id = this._stripViewMode(req.path);
      }
      if (!id) {
        next();
        return;
      } else {

        // We only want to handle urls without a viwemode calling a specific
        // id for a charm such as /precise/mysql and not
        // /sidebar/precise/mysql.
        if (this.viewmodes.indexOf(idBits[0]) !== -1) {
          next();
          return;
        }

        req.params = {
          id: id,
          viewmode: viewmode
        };
      }

      // Update the state for the rest of things to figure out what to do.
      this.state.loadRequest(req);
      this._cleanOldViews(req.params.viewmode);

      // Don't bother routing if we're hidden.
      if (!this.hidden) {
        this[viewmode](req, res, next);
      } else {
        // Update the app state even though we're not showing anything.
        this.state.save();
        // Let the next route go on.
        next();
      }
    },

    /**
       Dispatch to the correct viewmode based on the route that was hit.

       @method routeView
       @param {Request} req current request object.
       @param {Response} res current response object.
       @param {function} next callable for the next route in the chain.
     */
    routeView: function(req, res, next) {
      var self = this;
      // If there is no viewmode, assume it's sidebar.
      if (!req.params) {
        req.params = {};
      }

      // Support redirecting the minimized view.
      if (req.params.viewmode === 'minimized') {
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
      }


      if (!req.params.viewmode) {
        req.params.viewmode = 'sidebar';
      }

      // If the viewmode isn't found, it's not one of our urls. Show the
      // sidebar anyway.
      if (this.viewmodes.indexOf(req.params.viewmode) === -1) {
        next();
        return;
      }

      // for the route /sidebar it picks up the *id route
      // as well. Catch that here and make sure we set that to viewmode and no
      // id in the params.
      var id = this._stripViewMode(req.params.id);
      req.params.id = id;

      // Update the state for the rest of things to figure out what to do.
      this.state.loadRequest(req);
      this._cleanOldViews(req.params.viewmode);
      // Don't bother routing if we're hidden.
      if (!this.hidden) {
        // This redirects any requests coming in to fullscreen to their
        // sidebar equivelent. It gets done here because we are relying
        // on the current routing code to switch from fullscreen to sidebar
        // to take advantage of its double dispatch mitigation code.
        if (req.params.viewmode === 'fullscreen') {
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
          this[req.params.viewmode](req, res, next);
        }
      } else {
        // Update the app state even though we're not showing anything.
        this.state.save();
        // Let the next route go on.
        next();
      }
    },

    /**
      Return the current viewmode.

      @method getViewMode
      @return {undefined} Nothing.
    */
    getViewMode: function() {
      // If no view mode is set, "sidebar" is the default.
      return this.state.getCurrent('viewmode') || 'sidebar';
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
          { path: '*', callbacks: 'routeDefault'}
          // XXX window.flags.il
          // Leaving these here so they can easily be found for the cleanup.
          // { path: '/*id/', callbacks: 'routeDirectCharmId'},
          // { path: '/:viewmode/', callbacks: 'routeView' },
          // { path: '/:viewmode/search/', callbacks: 'routeView' },
          // { path: '/:viewmode/search/*id/', callbacks: 'routeView' },
          // { path: '/:viewmode/*id/', callbacks: 'routeView' }
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
      deployBundle: {},

      /**
       * @attribute environmentHeader
       * @default undefined
       * @type {Object}
       *
       */
      environmentHeader: {}
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
    'subapp-browser-searchview',
    'subapp-browser-charmresults',
    'subapp-browser-bundleview',
    'subapp-browser-jujucharms',
    'subapp-browser-sidebar',
    'machine-view-panel-extension',
    'juju-charmbrowser'
  ]
});
