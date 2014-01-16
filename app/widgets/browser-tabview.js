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
   * @extends {Y.View}
   */
  ns.TabView = Y.Base.create('juju-browser-tabview', Y.View, [], {
    events: {
      'nav a': {
        click: 'clickTab'
      }
    },

    /**
     * Switch the visible tab.
     *
     * @method clickTab
     * @param {Event} ev the click event created.
     *
     */
    clickTab: function(e) {
      this.setTab(e.target);
    },

    /**
     * Switch the visible tab.
     *
     * @method setTab
     * @param {Node} The corresponding tab anchor.
     *
     */
    setTab: function(link) {
      var container = this.get('container'),
          tabId = link.get('hash'),
          otherTabs = container.all('.tab-panel:not(' + tabId + ')'),
          tab = container.one(tabId),
          position = -(this.tabs.indexOf(tab) * this.tabWidth),
          linkWidth = link.getComputedStyle('width'),
          linkPosition = link.getX() - container.getX();

      // Move the tab countainer to the requested tab.
      this.tabCarousel.setStyle('left', position + 'px');

      // Set the active link.
      this.links.removeClass('active');
      link.addClass('active');

      // Move the active tab indicator.
      this.selectedNode.setStyle('width', linkWidth);
      this.selectedNode.setStyle('left', linkPosition + 'px');

      // All tabs should be visible during the animation, but we want the
      // scrollbar to be the height of the new tab or the height of the visible
      // area, whichever is bigger.
      tab.setStyle('height', 'auto');
      var tabHeight = tab.getComputedStyle('height'),
          newHeight = this.tabPanelsHeight > tabHeight ? this.tabPanelsHeight : tabHeight;
      otherTabs.setStyle('height', newHeight);

      // Once the animation is complete reduce the height of all tabs except
      // the visible tab so the container only scrolls for the visible tab.
      Y.later(300, this, function() {
        var activeTab = container.one(tabId);
        if (activeTab) {
          activeTab.setStyle('height', 'auto');
          otherTabs.setStyle('height', '1px');
        }
        this.fire('selectionChangeComplete');
      }, [], false);

      // Set the selected tab.
      this.set('selection', link);

      // Fire the changed event.
      this.fire('selectionChange');
    },

    /**
     * Renders the DOM nodes for the widget.
     *
     * @method render
     */
    render: function() {
      var container = this.get('container');

      // Cache node references.
      this.links = container.all('nav a');
      this.tabCarousel = container.one('.tab-carousel');
      this.tabPanels = container.one('.tab-panels');
      this.tabPanelsHeight = this.tabPanels.getComputedStyle('height');
      this.tabs = container.all('.tab-panel');
      this.selectedNode = container.one('nav .selected');
      this.tabWidth = 750;

      // Set the base class.
      container.addClass('yui3-juju-browser-tabview');

      // Set the current selection to the first tab.
      this.setTab(container.one('nav a'));
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
