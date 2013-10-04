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


YUI.add('subapp-browser-fullscreen', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class FullScreen
   * @extends {juju.browser.views.MainView}
   *
   */
  ns.FullScreen = Y.Base.create('browser-view-fullscreen', ns.MainView, [], {
    template: views.Templates.fullscreen,

    /**
     * Render out the view to the DOM.
     *
     * @method render
     * @param {Node} container optional specific container to render out to.
     *
     */
    render: function(container) {
      var tpl = this.template(),
          tplNode = Y.Node.create(tpl);

      this._renderSearchWidget(tplNode);

      if (typeof container !== 'object') {
        container = this.get('container');
      } else {
        this.set('container', container);
      }
      container.setHTML(tplNode);
      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();
    }

  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: [
    'browser-search-widget',
    'browser-tabview',
    'juju-charm-models',
    'juju-templates',
    'juju-views',
    'subapp-browser-charmview',
    'subapp-browser-bundleview',
    'subapp-browser-mainview',
    'view'
  ]
});
