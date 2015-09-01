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

    events: {
      '.bundle .add.deploy': {
        click: '_deployBundle'
      },
      // Following handlers are provided by entity-base.js
      // Mixins do not mix properties so this has to be done manually
      '.changelog h3 .expandToggle': {
        click: '_toggleLog'
      },
      '#code select': {
        change: '_loadHookContent'
      },
      '.bundle .back': {
        click: '_handleBack'
      }
    },

    template: views.Templates.bundle,

    /**
      Deploys the bundle to the environment via the provided deploy method.

      @method _deployBundle
    */
    _deployBundle: function(e) {
      e.halt();
      var bundle = this.get('entity');
      this.fire('changeState', {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: null }
        }});
      var charmstore = this.get('charmstore');
      var bundleId = bundle.get('id').replace('cs:', '');
      charmstore.getBundleYAML(
          bundleId,
          function(bundleYAML) {
            this.get('bundleImporter').importBundleYAML(bundleYAML);
          }.bind(this));
    },

    /**
      Sends the bundle data to the local fakebackend to
      import and then returns a promise when complete.

      @method _parseData
      @return {Y.Promise} A promise for the bundle data import.
    */
    _parseData: function(bundle) {
      return this.fakebackend.promiseImport({
        import: {
          relations: bundle.get('relations'),
          series: bundle.get('series'),
          services: bundle.get('services')
        }
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
        charmstore: this.get('charmstore'),
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
      @param {Object} services The services collection from the bundle data.
      @return {Array} the ordered list of charms in the bundle.
     */
    _buildCharmList: function(services) {
      var serviceData = [];
      Object.keys(services).forEach(function(key) {
        var service = services[key];
        serviceData.push({
          origService: {
            name: key,
            data: service
          },
          charmModel: new Y.juju.models.Charm({
            id: service.charm,
            name: key
          })
        });
      });
      serviceData.sort(function(a, b) {
        return a.charmModel.get('name') > b.charmModel.get('name') ? 1 : -1;
      });
      return serviceData;
    },

    /**
      Renders the bundle view template into the DOM.

      @method _renderBundleView
    */
    _renderBundleView: function() {
      var bundle = this.get('entity');
      var templateData = bundle.getAttrs();
      var sourceLocation = templateData.code_source.location;
      templateData.charmIcons = utils.charmIconParser(templateData.services);
      // Remove the svg files from the file list
      templateData.files = templateData.files.filter(function(fileName) {
        return !/\.svg$/.test(fileName);
      });
      templateData.services = this._buildCharmList(templateData.services);
      templateData.sourceLink = this._getSourceLink(sourceLocation);
      templateData.bugsLink = this._getBugsLink(sourceLocation);
      templateData.prettyCommits = this._formatCommitsForHtml(
          templateData.revisions, templateData.sourceLink);
      templateData.quickstartId = templateData.id.replace('cs:', '')
                                  // Add u/ if there is a username in the id.
                                                 .replace('~', 'u/')
                                                 .replace('bundle/', '')
                                  // Grab the last - and replace it with a /
                                  // because the following value is the revno.
                                                 .replace(/-(?!.*-)/g, '/');
      var content = this.template(templateData);
      var node = this.get('container').setHTML(content);
      var renderTo = this.get('renderTo');
      var options = {size: [720, 500]};
      this.hideIndicator(renderTo);

      options.positionServices = !this._positionAnnotationsIncluded(
          templateData.services);

      this._setupLocalFakebackend();
      var self = this;
      this._parseData(bundle).then(function() {
        self.environment = new views.BundleTopology(Y.mix({
          db: self.fakebackend.db,
          container: node.one('#bundle'), // Id because of Y.TabView
          charmstore: self.get('charmstore')
        }, options));
        self.environment.render();
        // Fire event to listen to during the tests so that we know when
        // it's rendered.
        self.fire('topologyRendered');
      }).then(null, function(error) {
        console.error(error.message, error, error.stack);
      });

      renderTo.setHTML(node);

      this._setupTabview();
      this._dispatchTabEvents(this.tabview);
      this._showActiveTab();
      this._renderCharmListing(templateData.services);
      this._setCollapsableHeader();
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
        var annotations = services[key].origService.data.annotations;
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
       Creates the bugs link.

       @method _getBugsLink
       @private
       @param {String} sourceLocation The bundle's source URL.
       @return {String} Launchpad bugs URL.
     */
    _getBugsLink: function(sourceLocation) {
      var locationParts = sourceLocation.split('/');
      // Get the basket name from the source url as the v4 API does not
      // contain the basket name.
      var basketName = locationParts[locationParts.length - 2];
      return 'https://bugs.launchpad.net/charms/+source/' + basketName;
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
        this.get('charmstore').getEntity(
            this.get('entityId'),
            function(bundles) {
              this.set('entity', bundles[0]);
              this._renderBundleView();
            }.bind(this),
            this.apiFailure.bind(this));
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
