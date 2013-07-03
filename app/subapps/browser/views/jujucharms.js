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
 * Browser SubApp Jujucharms View handler.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-jujucharms', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      models = Y.namespace('juju.models');

  ns.JujucharmsLandingView = Y.Base.create('browser-jujucharms-view', Y.View,
      [], {
        template: views.Templates.jujucharms,

        /**
         * Renders the landing page.
         *
         * @method render
         */
        render: function(container) {
          //XXX j.c.sackett July 2, 2013: This is a placeholder, it just renders
          //a big hello world across the page.
          var tpl = this.template(),
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
    'juju-templates',
    'juju-views',
    'juju-view-utils',
    'node',
    'view'
  ]
});
