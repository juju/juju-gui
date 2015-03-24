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
      views = Y.namespace('juju.browser.views'),
      utils = Y.namespace('juju.views.utils');

  /**
     Browser Sub App for the Juju Gui.

     @class Browser
     @extends {juju.SubApp}

   */
  var extensions = [
    Y.juju.MachineViewPanel,
    Y.juju.browser.BrowserEventsExtension
  ];
  ns.Browser = Y.Base.create('subapp-browser', Y.juju.SubApp, extensions, {
    // Mark the entire subapp has hidden.
    hidden: false,

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
        charmstore: this.get('charmstore')
      });
    },

    /**
      Registers Handlebars helpers that need access to subapp data like the
      store instance.

      @method _registerSubappHelpers

     */
    _registerSubappHelpers: function() {
      var charmstore = this.get('charmstore');
      // Register a helper for generating the icon urls for charms.
      Y.Handlebars.registerHelper('charmIconPath', function(charmID, isBundle) {
        return utils.getIconPath(charmID, isBundle, charmstore);
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
       Cleanup after ourselves on destroy.

       @method destructor
     */
    destructor: function() {
      if (this._cache) {
        this._cache.empty();
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
      this._cache = new Y.juju.BrowserCache();

      this.state = new models.UIState({
        // Disallow routing to inspectors if we are in sandbox mode; the
        // model to be inspected will not be available.
        allowInspector: !cfg.sandbox,
        dispatchers: {
          app: {
            deployTarget: this._deployTargetDispatcher.bind(this)
          },
          sectionA: {
            charmbrowser: this._charmBrowserDispatcher.bind(this),
            inspector: this._inspectorDispatcher.bind(this),
            empty: this.emptySectionA.bind(this),
            services: this._addedServicesDispatcher.bind(this)
          },
          sectionB: {
            machine: this._machine.bind(this),
            empty: this.emptySectionB.bind(this)
          }
        }
      });

      this._registerSubappHelpers();

      // Setup event handlers.
      // These event handlers come from app/subapps/browser/events-extension.js
      this.on('*:changeState', this._onChangeState, this);
      this.on('*:serviceDeployed', this._onServiceDeployed, this);
    },

    /**
      Handles deploying the charm or bundle id passed in as a deploy-target
      as a query param on app load.

      Be sure to use the fully qualified urls like cs:precise/mysql-48 and
      bundle:mediawiki/7/single because it make it easy to check what type of
      entity the id is referring to.

      @method _deployTargetDispatcher
      @param {String} entityId The id of the charm or bundle to deploy.
    */
    _deployTargetDispatcher: function(entityId) {
      var charmstore = this.get('charmstore');
      /**
        Handles parsing and displaying the failure notification returned from
        the charmstore api.

        @method failureNotification
        @param {Object} error The XHR request object from the charmstore req.
      */
      var failureNotification = function(error) {
        var message = 'Unable to deploy target: ' + entityId;
        try {
          message = JSON.parse(error.currentTarget.responseText).Message;
        } catch (e) {
          console.error(e);
        }
        this.get('db').notifications.add({
          title: 'Error deploying target.',
          message: message,
          level: 'error'
        });
      };

      // The charmstore apiv4 format can have the bundle keyword either at the
      // start, for charmers bundles, or after the username, for namespaced
      // bundles. ex) bundle/swift & ~jorge/bundle/swift
      if (entityId.indexOf('bundle/') > -1) {
        charmstore.getBundleYAML(
            entityId,
            function(yaml) {
              var bundleYAML = charmstore.downConvertBundleYAML(yaml);
              this.get('deployBundle')(bundleYAML, entityId);
            }.bind(this),
            failureNotification.bind(this));
      } else {
        // If it's not a bundle then it's a charm.
        charmstore.getEntity(
            entityId.replace('cs:', ''),
            function(charm) {
              charm = charm[0];
              var config = {},
                  options = charm.get('options');
              Object.keys(options).forEach(function(key) {
                config[key] = options[key]['default'];
              });
              // We call the env deploy method directly because we don't want
              // the ghost inspector to open.
              this.get('env').deploy(
                  charm.get('id'),
                  charm.get('name'),
                  config,
                  undefined, //config file content
                  1, // number of units
                  {}, //constraints
                  null); // toMachine
              this.fire('autoplaceAndCommitAll');
            }.bind(this),
            failureNotification.bind(this));
      }
    },

    /**
      Handles rendering and/or updating the charmbrowser UI component.

      @method _charmBrowserDispatcher
      @param {Object|String} metadata The metadata to pass to the charmbrowser
        view.
    */
    _charmBrowserDispatcher: function(metadata) {
      this.renderCharmBrowser(metadata);
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
        this.renderOnboarding();
      }
    },

    /**
      Ensures we clean up all the various UX bits that need updating when we
      no longer need to display charm details

      @method _cleanupEntityDetails
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
       Gets the model from the services db, if it exists.

       @method _findModelInServices
       @param {String} clientID The model id we're looking for.
       @return {Object} model The found model.
     */
    _findModelInServices: function(clientId) {
      var model;
      this.get('db').services.some(function(service) {
        if ((service.get('clientId') === clientId) ||
            // In this case clientId is actually the real service id.
            (service.get('id') === clientId)) {
          model = service;
          return true;
        }
      });
      return model;
    },

    /**
       Retries the inspector.

       The inspector must have a means of retrying dispatch because it is
       dispatched to before services have necessarily loaded.

       @method _retryInspector
       @param {Object|String} metadata The metadata to pass to the inspector
         view.
     */
    _retryRenderServiceInspector: function(metadata) {
      var retries = this.get('inspectorRetries');
      if (retries < this.get('inspectorRetryLimit')) {
        retries = retries + 1;
        this.set(
            'inspectorRetryTimer',
            Y.later(100, this, '_inspectorDispatcher', metadata));
      } else {
        retries = 0;
        this.fire('changeState', {
          sectionA: {
            component: null,
            metadata: { id: null }
          }
        });
        this.get('db').notifications.add({
          title: 'Could not load service inspector.',
          message: 'There is no deployed service named ' + metadata.id + '.',
          level: 'error'
        });
      }
      this.set('inspectorRetries', retries);
    },

    /**
      Handles rendering and/or updating the inspector UI component.

      @method _inspectorDispatcher
      @param {Object|String} metadata The metadata to pass to the inspector
        view.
    */
    _inspectorDispatcher: function(metadata) {
      var inspectors;

      if (metadata.localType) {
        inspectors = this.renderLocalInspector(metadata);
      } else {
        inspectors = this.renderServiceInspector(metadata);
      }
      this._inspector = inspectors.active;
      if (inspectors.previous) {
        inspectors.previous.destroy();
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
      Handles rendering and/or updating the added services UI component.

      @method _addedServicesDispatcher
    */
    _addedServicesDispatcher: function() {
      this._detailsVisible(false);
      this.renderAddedServices();
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
      if (this._inspector) {
        this._inspector.destroy();
        this._inspector = null;
      }
      if (this._addedServices) {
        this._addedServices.destroy();
        this._addedServices = null;
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
      var hashChanged, charmIDChanged;
      // XXX until UIState supports dot notation for hasChanged, we'll need
      // to manually compare metadata attributes
      var current = state.getState('current', 'sectionA', 'metadata'),
          previous = state.getState('previous', 'sectionA', 'metadata');
      current = current || {};
      previous = previous || {};
      charmIDChanged = current.id !== previous.id;
      hashChanged = current.hash !== previous.hash;
      if (this._details && hashChanged && !charmIDChanged) {
        return;
      }
      var EntityView;
      if (entityId.indexOf('bundle') !== -1) {
        EntityView = views.BrowserBundleView;
        // XXX When we convert the BrowserCharmView to use apiv4 as well then
        // this assignment can move outside of is conditional.
        extraCfg.entity = this._cache.getEntity(entityId);
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

      var extraCfg = {
        deployService: this.get('deployService'),
        deployBundle: this.get('deployBundle'),
        cache: this._cache
      };
      // Charmbrowser needs the DB in order to update the service count in the
      // added services button.
      var cfg = this._getViewCfg(extraCfg);
      if (!this._charmbrowser) {
        this._charmbrowser = new views.CharmBrowser(cfg);
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
       Render added services view content into the parent view when required.

       @method renderAddedServices
     */
    renderAddedServices: function() {
      var extraCfg = {
        container: this._sidebar.get('container').one('.bws-content')
      };
      var cfg = this._getViewCfg(extraCfg);
      if (!this._addedServices) {
        this._addedServices = new views.AddedServices(cfg);
        this._addedServices.addTarget(this);
      }
      // Render is idempotent
      this._addedServices.render();
    },

    /**
      Create a 'welcome' message walkthrough for new users.

      Note: onboarding control and creation needs to stay in the charmbrowser
      code because we don't want to show the onboarding code if the
      browser is showing charm details or search results.

      @method renderOnboarding
    */
    renderOnboarding: function() {
      // The sidebar method which calls this method checks to make sure that
      // onboarding doesn't exist prior to calling this method due to the
      // double dispatch bug.
      if (!this._onboarding) {
        this._onboarding = new Y.juju.views.OnboardingView({
          'container': '#onboarding'
        });
      }
      if (localStorage.getItem('force-onboarding')) {
        localStorage.setItem('force-onboarding', '');
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
      Renders the machine view over the canvas.
      Route callback.

      @method machine
    */
    machine: function(req, res, next) {
      this._renderMachineViewPanelView(this.get('db'));
    },

    /**
       Renders a local charm deployment inspector

       @method renderLocalInspector
       @param {Object|String} metadata The metadata to pass to the inspector
       @return {Object} An object with the previous and active inspector.
     */
    renderLocalInspector: function(metadata) {
      var file = metadata.flash.file,
          services = metadata.flash.services,
          previousInspector = this._inspector,
          activeInspector;
      var cfg = {
        file: file,
        env: this.get('env'),
        db: this.get('db'),
        charmstore: this.get('charmstore')
      };
      if (metadata.localType === 'new') {
        activeInspector = new Y.juju.views.RequestSeriesInspector(cfg);
      } else {
        cfg.services = services;
        activeInspector = new Y.juju.views.LocalNewUpgradeInspector(cfg);
      }
      activeInspector.render();
      activeInspector.addTarget(this);
      return {
        active: activeInspector,
        previous: previousInspector
      };
    },

    /**
       Renders the service inspector, handling updates to the existing service
       inspector if necessary.

       @method renderServiceInspector
       @param {Object} metadata The dispatched view metadata.
       @return {Object} An object with the previous and active inspector.
     */
    renderServiceInspector: function(metadata) {
      var clientId = metadata.id,
          model = this._findModelInServices(clientId),
          hideHelp = (metadata.flash && metadata.flash.hideHelp) || false,
          charm,
          previousInspector,
          activeInspector;

      var db = this.get('db'),
          topo = this.get('topo');

      var cfg = {
        db: db,
        model: model,
        env: this.get('env'),
        ecs: this.get('ecs'),
        topo: topo,
        charmstore: this.get('charmstore'),
        activeTab: metadata.hash,
        hideHelp: hideHelp
      };

      if (model) {
        charm = db.charms.getById(model.get('charm'));
      }

      if (model && charm) {
        cfg.showCharm = metadata.charm || false;
        cfg.enableDatabinding = true;
        cfg.activeUnit = metadata.unit;

        if (!this._inspector ||
            this._inspector.name !== 'service-inspector' ||
            (this._inspector.get('model').get('id') !==
                model.get('id'))) {
          // This is a new service.
          previousInspector = this._inspector;
          activeInspector = new Y.juju.views.ServiceInspector(cfg);
          activeInspector.render();
          activeInspector.addTarget(this);
        } else {
          // This is a dispatch for the existing inspector
          activeInspector = this._inspector;
          activeInspector.setAttrs(cfg);
          activeInspector.renderUI();
        }
      } else {
        // If we found no model, begin the retry loop.
        this._retryRenderServiceInspector(metadata);
      }
      return {
        previous: previousInspector,
        active: activeInspector
      };
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
         A callable passsed in from the top level application which fetches the
         default env series.

         @attribute envSeries
         @default undefined
         @type {Function}
       */
      envSeries: {},

      /**
        @attribute charmstore
        @default juju.charmstore.APIv4
        @type {juju.charmstore.APIv4}
      */
      charmstore: {},

      /**
         @attribute routes
         @default Array of subapp routes.
         @type {Array}
       */
      routes: {
        value: [
          { path: '*', callbacks: 'routeDefault'}
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
      environmentHeader: {},

      /**
         A timer for retrying dispatch.

         @attribute inspectorRetryTimer
         @default undefined
         @type {Object}
       */
      inspectorRetryTimer: {},

      /**
         The number of current retries in dispatch.

         @attribute inspectorRetries
         @default 0
         @type {Int}
       */
      inspectorRetries: {
        value: 0
      },

      /**
         The number of retries in dispatch to allow. 5 100ms is more than is
         likely needed, but gives us a buffer and the error is usually resolved
         after one retry.

         @attribute inspectorRetryLimit
         @default 5
         @type {Int}
       */
      inspectorRetryLimit: {
        value: 5
      }
    }
  });

}, '0.1.0', {
  requires: [
    'browser-cache',
    'charmstore-api',
    'handlebars',
    'juju-added-services',
    'juju-app-state',
    'juju-browser-models',
    'juju-charmbrowser',
    'juju-models',
    'juju-view-onboarding',
    'juju-view-utils',
    'machine-view-panel-extension',
    'querystring',
    'sub-app',
    'subapp-browser-bundleview',
    'subapp-browser-charmview',
    'subapp-browser-events',
    'subapp-browser-sidebar'
  ]
});
