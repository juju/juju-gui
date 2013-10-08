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
        click: '_addCharmEnvironment'
      },
      // Following handlers are provided by entity-base.js
      // Mixins do not mix properties so this has to be done manually
      '.changelog h3 .expandToggle': {
        click: '_toggleLog'
      },
      // '#bws-code select': {
      //   change: '_loadHookContent'
      // },
      '.bundle .back': {
        click: '_handleBack'
      }
      // '#sharing a': {
      //   click: '_openShareLink'
      // }
    },

    template: views.Templates.bundle,

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
      Renders the bundle view template into the DOM.

      @method _renderBundleView
    */
    _renderBundleView: function() {
      var bundleAttrs = this.get('entity').getAttrs();
      var content = this.template(bundleAttrs);
      var node = this.get('container').setHTML(content);
      var renderTo = this.get('renderTo');
      var options = {size: [480, 360]};

      this.hideIndicator(renderTo);
      this.environment = new views.BundleTopology(Y.mix({
        db: this.fakebackend.db,
        container: node.one('#bws-bundle'), // Id because of Y.TabView
        store: this.get('store')
      }, options));

      this.environment.render();
      renderTo.setHTML(node);

      this._setupTabview();
      this._dispatchTabEvents(this.tabview);

      this.set('rendered', true);
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
          then(this._renderBundleView.bind(this), this.apiFailure.bind(this));
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
    'view',
    'juju-env-fakebackend',
    'juju-view-bundle',
    'subapp-browser-entitybaseview',
    'browser-overlay-indicator',
    'juju-view-utils',
    'event-tracker'
  ]
});
