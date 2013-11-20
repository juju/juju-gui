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


YUI.add('subapp-browser-bundleview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      utils = views.utils,
      widgets = Y.namespace('juju.widgets');

  ns.BrowserBundleView = Y.Base.create('browser-view-bundleview', Y.View, [
    widgets.browser.IndicatorManager,
    Y.Event.EventTracker,
    ns.EntityBaseView,
    views.utils.apiFailingView
  ], {

    // XXX Commented out events are not yet handled for this view
    events: {
      // '.token': {
      //   click: '_handleCharmSelection'
      // },
      '.bundle .add.deploy': {
        click: '_confirmDeploy'
      },
      '.bundle .add.confirm': {
        click: '_deployBundle'
      },
      // Following handlers are provided by entity-base.js
      // Mixins do not mix properties so this has to be done manually
      '.changelog h3 .expandToggle': {
        click: '_toggleLog'
      },
      '#bws-code select': {
        change: '_loadHookContent'
      },
      '.bundle .back': {
        click: '_handleBack'
      }
      // '#sharing a': {
      //   click: '_openShareLink'
      // }
    },

    template: views.Templates.bundle,

    /**
      Changes the deploy button to be a confirmation

      @method _confirmDeploy
      @param {Object} e Click event object.
    */
    _confirmDeploy: function(e) {
      // This is required to stop the following event handlers from triggering.
      e.stopImmediatePropagation();
      e.preventDefault();
      var button = e.currentTarget;
      button.setHTML('Yes, I\'m sure');
      button.removeClass('deploy');
      button.addClass('confirm');
      this.get('container').one('.notifier-box').removeClass('hidden');
    },

    /**
      Deploys the bundle to the environment via the provided deploy method.

      @method _deployBundle
    */
    _deployBundle: function(e) {
      e.halt();
      var bundle = this.get('entity');
      if (this.get('isFullscreen')) {
        this.fire('viewNavigate',
            {change: {viewmode: 'sidebar', charmID: null}});
      } else {
        this.fire('viewNavigate', {change: {charmID: null}});
      }
      this.get('deployBundle')(bundle.get('data'), bundle.get('id'));
    },

    /**
      Sends the bundle data to the local fakebackend to
      import and then returns a promise when complete.

      @method _parseData
      @return {Y.Promise} A promise for the bundle data import.
    */
    _parseData: function(bundle) {
      return this.fakebackend.promiseImport({
        import: bundle.get('data')
      });
    },

    /**
      Creates a new fakebackend instance for the
      bundle topology.

      @method _setupLocalFakebackend
    */
    _setupLocalFakebackend: function() {
      /**
        Fakebackend database which contains the parsed bundle data
        to be used in the fake bundle topology.

        @property db
      */
      this.fakebackend = new Y.juju.environments.FakeBackend({
        store: this.get('store'),
        authenticated: true
      });
    },

    /**
      Render the list of charms in the bundle.

      @method _renderCharmListing
      @param {Object} services the services in the bundle.

     */
    _renderCharmListing: function(services) {
      services.forEach(function(service) {
        var charm = service.charmModel.getAttrs();
        charm.size = 'tiny';
        charm.isDraggable = false;
        var token = new widgets.browser.Token(charm);
        var node = Y.one('[data-config="' + service.origService.name + '"]');
        token.render(node);
        this._cleanup.tokens.push(token);
      }, this);
    },

    /**
      Build and order a list of charms.

      @method _buildCharmList
      @param {Object} the bundle entity attrs.
      @return {Array} the ordered list of charms in the bundle.

     */
    _buildCharmList: function(bundleData) {
      var services = [];
      Y.Object.each(bundleData.services, function(service, key) {
        var charm = bundleData.charm_metadata[key];
        services.push({
          origService: {
            name: key,
            data: service
          },
          charmModel: new Y.juju.models.Charm(charm)
        });
      }, this);
      services.sort(function(a, b) {
        return a.charmModel.get('name') > b.charmModel.get('name') ? 1 : -1;
      });
      return services;
    },

    /**
      Renders the bundle view template into the DOM.

      @method _renderBundleView
    */
    _renderBundleView: function() {
      var bundle = this.get('entity');
      var bundleData = bundle.getAttrs();
      // Copy the bundle for use in the template so we can modify the content
      // without manipulating the entity.
      var templateData = Y.merge(bundleData);
      templateData.charmIcons = utils.charmIconParser(
          templateData.charm_metadata);
      // Remove the svg files from the file list
      templateData.files = templateData.files.filter(function(fileName) {
        return !/\.svg$/.test(fileName);
      });
      templateData.services = this._buildCharmList(bundleData);
      templateData.sourceLink = this._getSourceLink(
          'lp:' + this.get('entity').get('branch_spec'));
      templateData.prettyCommits = this._formatCommitsForHtml(
          templateData.recentCommits, templateData.sourceLink);
      if (templateData.deployer_file_url) {
        templateData.deployer_file_url = decodeURI(
            templateData.deployer_file_url);
      }
      var content = this.template(templateData);
      var node = this.get('container').setHTML(content);
      var renderTo = this.get('renderTo');
      var options = {size: [720, 500]};
      this.hideIndicator(renderTo);

      options.positionServices = !this._positionAnnotationsIncluded(
          bundleData.data.services);

      this._setupLocalFakebackend();
      var self = this;
      this._parseData(bundle).then(function() {
        self.environment = new views.BundleTopology(Y.mix({
          db: self.fakebackend.db,
          container: node.one('#bws-bundle'), // Id because of Y.TabView
          store: self.get('store')
        }, options));
        self.environment.render();
        // Fire event to listen to during the tests so that we know when
        // it's rendered.
        self.fire('topologyRendered');
      }).then(null, function(error) {
        console.error(error.message, error);
      });

      renderTo.setHTML(node);

      this._setupTabview();
      this._dispatchTabEvents(this.tabview);
      this._showActiveTab();
      this._renderCharmListing(templateData.services);
    },

    /**
      Determines if all of the services in the bundle
      have position annotations.

      @method _positionAnnotationsIncluded
      @param {Object} services An object of all of the services in the bundle.
      @return {Boolean} Weather all services have position annotations or not.
    */
    _positionAnnotationsIncluded: function(services) {
      // Some returns true if it's stopped early, this inverts before returning.
      return !Object.keys(services).some(function(key) {
        var annotations = services[key].annotations;
        // If there is no annotations for the position coords
        // return true stopping the 'some' loop.
        if (!annotations ||
            !annotations['gui-x'] ||
            !annotations['gui-y']) {
          return true;
        }
      });
    },

    /**
      Destroy things when the view is destroyed.

      @method destructor

     */
    destructor: function() {
      this._cleanup.tokens.forEach(function(token) {
        token.destroy();
      });
    },

    /**
      Generic initializer method for the View.

      @method initializer
      @param {Object} cfg the config object to create the View with.

     */
    initializer: function(cfg) {
      this._cleanup = {
        tokens: []
      };
    },

    /**
      Renders the loading indicator into the DOM and then calls
      the _prepareData method to fetch/parse the bundle data for
      the real view rendering.

      @method render
    */
    render: function() {
      this.showIndicator(this.get('renderTo'));
      var entity = this.get('entity');
      if (entity) {
        this._renderBundleView();
      } else {
        this.get('store').bundle(
            this.get('entityId'), {
              'success': function(data) {
                this.set('entity', new models.Bundle(data));
                this._renderBundleView();
              },
              'failure': this.apiFailure
            },
            this);
      }
    }

  }, {
    ATTRS: {
      /**
        Used only for testing to determine when the rendering
        has been completed and appended to the DOM

        @attribute rendered
        @default false
      */
      rendered: {
        value: false
      }
    }
  });

}, '', {
  requires: [
    'browser-overlay-indicator',
    'juju-bundle-models',
    'juju-charm-models',
    'juju-view-utils',
    'view',
    'juju-env-fakebackend',
    'juju-view-bundle',
    'subapp-browser-entitybaseview',
    'browser-overlay-indicator',
    'event-tracker'
  ]
});
