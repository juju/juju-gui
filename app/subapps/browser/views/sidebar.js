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
 * Browser SubApp Sidebar View handler.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-sidebar', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views');


  /**
   * Sidebar master view for the gui browser.
   *
   * @class Sidebar
   * @extends {juju.browser.views.MainView}
   *
   */
  ns.Sidebar = Y.Base.create('browser-view-sidebar', ns.MainView, [], {
    template: views.Templates.sidebar,

    events: {
    },

    /**
     * Remove the HTML contents for the sidebar.
     *
     * @method destructor
     *
     */
    destructor: function() {
      this.get('container').setHTML('');
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      var tpl = this.template(this.getAttrs()),
          tplNode = Y.Node.create(tpl);

      if (typeof container !== 'object') {
        container = this.get('container');
      } else {
        this.set('container', container);
      }
      container.setHTML(tplNode);
    }

  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: [
    'browser-search-widget',
    'juju-templates',
    'subapp-browser-mainview',
    'view'
  ]
});
