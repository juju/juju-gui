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
  ns.TabView = Y.Base.create('juju-browser-tabview', Y.Widget, [], {

    /**
     * Switch the visible tab.
     *
     * @method _setTab
     * @param {String} The id of the tab to switch to.
     * @param {Node} The corresponding tab anchor.
     *
     */
    _setTab: function(tabId, link) {
      var container = this.get('contentBox'),
          tabCarousel = container.one('.tab-carousel'),
          tabs = container.all('.tab-panel'),
          selectedNode = container.one('nav .selected'),
          tab = container.one('#' + tabId),
          tabWidth = 750,
          position = -(parseInt(tabs.indexOf(tab)) * tabWidth),
          linkWidth = link.getComputedStyle('width'),
          linkPosition = link.getX() - container.getX();

      // Move the tab countainer to the requested tab.
      tabCarousel.setStyle('left', position + 'px');

      // Move the active tab indicator.
      selectedNode.setStyle('width', linkWidth);
      selectedNode.setStyle('left', linkPosition + 'px');

      // Fire the changed event.
      this.fire('selectionChange', {newVal: tabId});
    },

    /**
     * Renders the DOM nodes for the widget.
     *
     * @method renderUI
     */
    renderUI: function() {
      var container = this.get('contentBox');
      container.all('nav a').on('click', function(e) {
          // XXX: Need a better, more secure way of gettin the ID?
          var tabId = e.target.get('href').split('#')[1];
          this._setTab(tabId, e.target);
      }, this);
    }
  }, {
    ATTRS: {
    }
  });

}, '0.1.0', {
  requires: [
    'array-extras',
    'base'
  ]
});
