/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012  Canonical Ltd.
Copyright (C) 2013  Canonical Ltd.

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
 * Provides new tab and tabview widgets with some additional functions for
 * jujugui.
 *
 * @namespace juju
 * @module browser
 * @submodule widgets
 */
YUI.add('browser-tabview', function(Y) {
  var ns = Y.namespace('juju.widgets.browser');

  /**
   * Tabview provides extra rendering options--it can be rendered with the
   * tabs horizontally rendered like Y.TabView, or vertically.
   *
   * @class Y.juju.widgets.browser.TabView
   * @extends {Y.TabView}
   */
  ns.TabView = Y.Base.create('juju-browser-tabview', Y.TabView, [], {

    /**
     * Renders the DOM nodes for the widget.
     *
     * @method renderUI
     */
    renderUI: function() {
      ns.TabView.superclass.renderUI.apply(this);
      if (this.get('vertical')) {
        this.get('contentBox').addClass('vertical');
      }
    }
  }, {
    ATTRS: {

      /**
       * @attribute vertical
       * @default false
       * @type {boolean}
       */
      vertical: {
        value: false
      }
    }
  });

}, '0.1.0', {
  requires: [
    'array-extras',
    'base',
    'tabview'
  ]
});
