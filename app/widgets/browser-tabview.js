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
 * Provides tabview widget with sliding carousel functionality.
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
   * @extends {Y.Widget}
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
    _setTab: function(link) {
      var container = this.get('contentBox'),
          links = container.all('nav a'),
          tabCarousel = container.one('.tab-carousel'),
          tabs = container.all('.tab-panel'),
          selectedNode = container.one('nav .selected'),
          tab = container.one(link.get('hash')),
          tabWidth = 750,
          position = -(tabs.indexOf(tab) * tabWidth),
          linkWidth = link.getComputedStyle('width'),
          linkPosition = link.getX() - container.getX();

      // Move the tab countainer to the requested tab.
      tabCarousel.setStyle('left', position + 'px');

      // Set the active link.
      links.removeClass('active');
      link.addClass('active');

      // Move the active tab indicator.
      selectedNode.setStyle('width', linkWidth);
      selectedNode.setStyle('left', linkPosition + 'px');

      // Set the selected tab.
      this.set('selection', link);

      // Fire the changed event.
      this.fire('selectionChange');
    },

    /**
     * Renders the DOM nodes for the widget.
     *
     * @method renderUI
     */
    renderUI: function() {
      var container = this.get('contentBox');

      // Set the current selection to the first tab
      this._setTab(container.one('nav a'));

      container.all('nav a').on('click', function(e) {
        this._setTab(e.target);
      }, this);
    }
  }, {
    ATTRS: {
      /**
        The current tab link node.

        @attribute selection
        @default ''
      */
      selection: {
        value: ''
      }
    }
  });

}, '0.1.0', {
  requires: [
    'array-extras',
    'base'
  ]
});
