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
      Fetches and prepares the data for the bundle details page rendering.

      @method _fetchData
    */
    _fetchData: function() {
      var self = this;

      return new Y.Promise(function(resolve, reject) {
        var entity = self.get('entity');
        // An entity here is a fully populated charm/bundle model so
        // it's entirely possible that we have an id to load but
        // no model has been populated yet.
        if (entity) {
          resolve(entity);
        } else {
          self.get('store').bundle(self.get('entityId'), {
            'success': function(data) {
              var bundle = new models.Bundle(data);
              self.set('entity', bundle);
              resolve(bundle);
            },
            'failure': reject
          }, self);
        }
      });
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

     */
    _renderCharmListing: function() {
      var attrs = this.get('entity').getAttrs();
      Y.Object.each(attrs.charm_metadata, function(charm, key) {
        var charmModel = new Y.juju.models.Charm(charm);
        charm = charmModel.getAttrs();
        charm.size = 'tiny';
        charm.isDraggable = false;
        var token = new widgets.browser.Token(charm);
        var node = Y.one('[data-config="' + key + '"]');
        token.render(node);
        this._cleanup.tokens.push(token);
      }, this);
    },

    /**
      Renders the bundle view template into the DOM.

      @method _renderBundleView
    */
    _renderBundleView: function() {
      var entity = this.get('entity');
      var attrs = entity.getAttrs();
      attrs.charmIcons = utils.charmIconParser(attrs.charm_metadata);
      // Remove the svg files from the file list
      attrs.files = attrs.files.filter(function(fileName) {
        return !/\.svg$/.test(fileName);
      });
      var content = this.template(attrs);
      var node = this.get('container').setHTML(content);
      var renderTo = this.get('renderTo');
      var options = {size: [720, 500]};
      this.hideIndicator(renderTo);

      var showTopo = true;
      // remove the flag in the test(test_bundle_details_view.js)
      // when this flag is no longer needed.
      if (window.flags && window.flags.strictBundle) {
        showTopo = this._positionAnnotationsIncluded(attrs.data.services);
      }
      if (showTopo) {
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
      this._renderCharmListing();

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
    render: function() {
      this.showIndicator(this.get('renderTo'));
      this._setupLocalFakebackend();
      this._fetchData().
          then(this._parseData.bind(this)).
          then(this._renderBundleView.bind(this)).
          then(null, this.apiFailure.bind(this));
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
