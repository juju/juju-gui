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
      Renders the bundle view template into the DOM

      @method _renderBundleView
      @param {Y.Model} bundle The bundle model instance.
      @param {Boolean} isFullscreen a trigger to display the fullscreen or not.
    */
    _renderBundleView: function(bundle, isFullscreen) {
      var bundleAttrs = bundle.getAttrs();
      var template = this.template(bundleAttrs);
      this.get('renderTo').setHTML(this.get('container').setHTML(template));
    },

    /**
       Render out the view to the DOM.

       The View might be given either a entityId, which means go fetch the
       charm data, or a charm model instance, in which case the view has the
       data it needs to render.

       @method render

     */
    render: function() {
      var isFullscreen = this.get('isFullscreen');
      this.showIndicator(this.get('renderTo'));

      if (this.get('entity')) {
        this._renderBundleView(this.get('entity'), isFullscreen);
        this.hideIndicator(this.get('renderTo'));
      } else {
        this.get('store').bundle(this.get('entityId'), {
          'success': function(data) {
            var bundle = new models.Bundle(data);
            this.set('entity', bundle);
            this._renderBundleView(bundle, isFullscreen);
            this.hideIndicator(this.get('renderTo'));
          },
          'failure': this.apiFailure
        }, this);
      }
    }

  }, {
    ATTRS: {}
  });

}, '', {
  requires: [
    'view'
  ]
});
