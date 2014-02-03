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
 * Provides tabview widget with sliding carousel functionality. It requires an
 * existing HTML structure (an example of the markup can be found in
 * test/test_tabview.js) and enhances that HTML to animate between tabs.
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
     */
    clickTab: function(e) {
      this.setTab(e.currentTarget);
      if (this.get('skipAnchorNavigation')) {
        e.halt();
      }
    },

    /**
     * Switch the visible tab.
     *
     * @method setTab
     * @param {Node} The corresponding tab anchor.
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
          newHeight = Math.max(tabHeight, this.panelsHeight);
      otherTabs.setStyle('height', newHeight);

      // Once the animation is complete reduce the height of all tabs except
      // the visible tab so the container only scrolls for the visible tab.
      var handler = this.tabCarousel.on('transitionend', function() {
        // Because this event will fire shortly after this method completes we
        // can detach it here instead of setting up a destructor sequence.
        handler.detach();
        var activeTab = container.one(tabId);
        if (activeTab) {
          activeTab.setStyle('height', 'auto');
          otherTabs.setStyle('height', '1px');
        }
        this.fire('selectionChangeComplete');
      }, this);

      // Set the selected tab.
      this.set('selection', link);
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
      this.panelsHeight = this.tabPanels.getComputedStyle('height');
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
      },

      /**
       * The links for the tabview are #anchor tags. These will navigate by
       * default. Setting this to true will kill the click event and prevent
       * it from navigating while still processing the change and selection
       * events.
       *
       * This is primarily used in testing but could be used to create tabview
       * widget that did not effect the current url. If you had 3 tabviews on
       * the screen you might only want one of them to set a hash setting and
       * be sharable state information.
       *
       * @attribute skipAnchorNavigation
       * @default false
       * @type {Boolean}
       *
       */
      skipAnchorNavigation: {
        value: false
      }
    }
  });

}, '0.1.0', {
  requires: [
    'array-extras',
    'base'
  ]
});
