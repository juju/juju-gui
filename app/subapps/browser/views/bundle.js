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
      '.bundle .add': {
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
      this.get('deployBundle')(bundle.get('data'));
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
      Y.Object.each(services, function(service, key) {
        var charm = service._model.getAttrs();
        charm.size = 'tiny';
        charm.isDraggable = false;
        var token = new widgets.browser.Token(charm);
        var node = Y.one('[data-config="' + key + '"]');
        token.render(node);
        this._cleanup.tokens.push(token);
      }, this);
    },

    /**
      Build and order a list of charms.

      @method _buildCharmList
      @return the ordered list of charms in the bundle.

     */
    _buildCharmList: function() {
      var attrs = this.get('entity').getAttrs();
      var services = [];
      Y.Object.each(attrs.services, function(service, key) {
        var charm = attrs.charm_metadata[key];
        attrs.services[key]._model = new Y.juju.models.Charm(charm);
        service.service_name = key;
        services.push(service);
      }, this);
      services.sort(function(a, b) {
          return a._model.get('name') > b._model.get('name');
      });
      return services;
    },

    /**
      Renders the bundle view template into the DOM.

      @method _renderBundleView
    */
    _renderBundleView: function(bundleData) {
      var bundle = new models.Bundle(bundleData);
      this.set('entity', bundle);
      var attrs = bundle.getAttrs();
      attrs.charmIcons = utils.charmIconParser(attrs.charm_metadata);
      // Remove the svg files from the file list
      attrs.files = attrs.files.filter(function(fileName) {
        return !/\.svg$/.test(fileName);
      });
      attrs.services = this._buildCharmList();
      var content = this.template(attrs);
      var node = this.get('container').setHTML(content);
      var renderTo = this.get('renderTo');
      var options = {size: [480, 360]};
      this.hideIndicator(renderTo);

      var showTopo = true;
      // remove the flag in the test(test_bundle_details_view.js)
      // when this flag is no longer needed.
      if (window.flags && window.flags.strictBundle) {
        showTopo = this._positionAnnotationsIncluded(attrs.data.services);
      }
      if (showTopo) {
        // Setup the fake backend to create topology to display the canvas-like
        // rendering of the bundle.
        this._setupLocalFakebackend();
        this._parseData(bundle);

        this.environment = new views.BundleTopology(Y.mix({
          db: this.fakebackend.db,
          container: node.one('#bws-bundle'), // Id because of Y.TabView
          store: this.get('store')
        }, options));
        this.environment.render();
      } else {
        // Remove the bundle tab so it doesn't get PE'd when
        // we instantiate the tabview.
        node.one('#bws-bundle').remove();
        node.one('a[href=#bws-bundle]').get('parentNode').remove();
      }

      renderTo.setHTML(node);

      this._setupTabview();
      if (!showTopo) {
        // Select the charms tab as the landing tab if
        // we aren't showing the bundle topology.
        this.tabview.selectChild(2);
      }
      this._dispatchTabEvents(this.tabview);
      this._showActiveTab();
      this._renderCharmListing(attrs.services);

      this.set('rendered', true);
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
    render: function(bundleData) {
      this.showIndicator(this.get('renderTo'));
      if (bundleData) {
        this._renderBundleView(bundleData);
      } else {
        this.get('store').bundle(
          this.get('entityId'), {
            'success': function(data) {
              debugger;
              this._renderBundleView(data);
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
