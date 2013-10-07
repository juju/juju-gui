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
    ns.EntityBaseView,
    views.utils.apiFailingView
  ], {

    events: {
      '.token': {
        click: '_handleCharmSelection'
      },
      '.charm .add': {
        click: '_addCharmEnvironment'
      },
      // Following handlers are provided by entity-base.js
      // Mixins do not mix properties so this has to be done manually
      '.changelog h3 .expandToggle': {
        click: '_toggleLog'
      },
      '#bws-code select': {
        change: '_loadHookContent'
      },
      '.charm .back': {
        click: '_handleBack'
      },
      '#sharing a': {
        click: '_openShareLink'
      }
    },

    template: views.Templates.bundle,

    /**
      Fetches the bundle data and imports it into
      the local fakebackend for the fake topology.

      @method initializer
      @param {Object} config The configuration object passed to the view.
    */
    initializer: function(config) {
      var store = config.store,
          self = this;

      /**
        Flag used to indicate if the data has been fully
        prepared to display in the local topology instance.

        @property dataPrepared
        @type {Boolean}
        @default false
      */
      this.dataPrepared = false;

      /**
        Flag used to indicate if the view has been rendered.

        @property rendered
        @type {Boolean}
        @default false
      */
      this.rendered = false;

      var fakebackend = new Y.juju.environments.FakeBackend({
        store: store,
        authenticated: true
      });

      /**
        Fakebackend database which contains the parsed bundle data
        to be used in the fake bundle topology.

        @property db
      */
      this.db = fakebackend.db;

      new Y.Promise(function(resolve, reject) {
        var entity = config.entity;
        // An entity here is a fully populated charm/bundle model so
        // it's entirely possible that we have an id to load but
        // no model has been populated yet.
        if (entity) {
          resolve(entity);
        } else {
          store.bundle(config.entityId, {
            'success': function(data) {
              var bundle = new models.Bundle(data);
              self.set('entity', bundle);
              resolve(bundle);
            },
            'failure': reject
          }, self);
        }
      }).then(function(bundle) {
        fakebackend.promiseImport({
          import: bundle.get('data')
        }).then(function() {
          self.dataPrepared = true;
          // If the view has been rendered then render
          // the fake topology into the view.
          if (self.rendered) {
            self._renderBundleView.call(self);
          }
        });
      }, self.apiFailure);
    },

    /**
      Renders the bundle view template into the DOM.

      @method _renderBundleView
    */
    _renderBundleView: function() {
      if (!this.dataPrepared || !this.rendered) {
        console.error(
            'Cannot render bundle data without container or prepared data.');
      }
      var bundleAttrs = this.get('entity').getAttrs();
      var content = this.template(bundleAttrs);
      var node = this.get('container').setHTML(content);
      var store = this.get('store'),
          renderTo = this.get('renderTo'),
          options = {size: [480, 360]},
          self = this;

      this.hideIndicator(renderTo);
      self.environment = new views.BundleTopology(Y.mix({
        db: self.db,
        container: node.one('#bundle'),
        store: store
      }, options));

      self.environment.render();
      renderTo.setHTML(node);
    },

    /**
       Render out the view to the DOM.

       The View might be given either a entityId, which means go fetch the
       charm data, or a charm model instance, in which case the view has the
       data it needs to render.

       @method render
     */
    render: function() {
      this.showIndicator(this.get('renderTo'));
      // Y.View's don't have a rendered flag
      this.rendered = true;
      // If the data has already been prepared
      // then render the fake bundle topology.
      if (this.dataPrepared) {
        this._renderBundleView();
      }
    }

  }, {
    ATTRS: {}
  });

}, '', {
  requires: [
    'view',
    'juju-env-fakebackend',
    'juju-view-bundle'
  ]
});
