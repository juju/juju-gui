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
 * Provides the Charm Token widget, for display a small unit of charm
 * information.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser
 */
YUI.add('browser-charm-token', function(Y) {

  var ns = Y.namespace('juju.widgets.browser');
  ns.EVENT_CHARM_ADD = 'charm-token-add';
  ns.CharmToken = Y.Base.create('CharmToken', Y.Widget, [
    Y.Event.EventTracker,
    Y.WidgetChild
  ], {
    TEMPLATE: Y.namespace('juju.views').Templates['charm-token'],

    /**
    * Default general initializer method.
    *
    * @method initializer
    * @param {Object} cfg the config for the widget.
    * @return {undefined} Nothing.
    */
    initializer: function(charmAttributes) {
      // This passed-in config is made up of charm attributes.
      this.charmAttributes = charmAttributes;
      if (this.get('isDraggable')) {
        var func = Y.bind(this._addDraggability, this);
        setTimeout(func, 1000);
      }
    },

    /**
      Setter for the boundingBox attribute

      **Override vs YUI to prevent node id setting based on BrowserCharm**

      @method _setBB
      @private
      @param {Node|String} the node to use for the bounding box.
      @return {Node} the generated bounding box.
    */
    _setBB: function(node) {
      // Blank out the ID part of the boundingBox. We don't want the
      // charm-token id="" to be set based on the actual BrowserCharm model
      // data passed in.
      // The Y.Widget will generate a YUID for the node automatically.
      return this._setBox(undefined, node, this.BOUNDING_TEMPLATE, true);
    },

    /**
     * Generate a function that records drag and drop data when a drag starts.
     *
     * @method _makeDragStartHandler
     * @param {Node} dragImage The node to show during the drag.
     * @param {String} charmData The JSON encoded charm attributes.
     * @return {undefined} Nothing.
     */
    _makeDragStartHandler: function(dragImage, charmData) {
      return function(evt) {
        evt = evt._event; // We want the real event.
        evt.dataTransfer.effectAllowed = 'copy';
        evt.dataTransfer.setData('charmData', charmData);
        evt.dataTransfer.setData('dataType', 'charm-token-drag-and-drop');
        evt.dataTransfer.setDragImage(dragImage.getDOMNode(), 0, 0);
      };
    },

    /**
     * Make an element draggable.
     *
     * @method _makeDraggable
     * @param {Node} element The node which is to be made draggable.
     * @param {Node} dragImage The node which will be displayed during
     *   dragging.
     * @param {String} charmData The JSON encoded charm attributes.
     * @return {undefined} Nothing.
     */
    _makeDraggable: function(element, dragImage, charmData) {
      element.setAttribute('draggable', 'true');
      this.addEvent(element.on('dragstart',
          this._makeDragStartHandler(dragImage, charmData)));
    },

    /**
     * Make the charm token draggable.
     *
     * @method _addDraggability
     * @param {Node} container The node which contains the charm list.
     * @param {Node} dragImage The node which will be displayed during
     *   dragging.
     * @return {undefined}  Nothing; side-effects only.
    */
    _addDraggability: function() {
      var container = this.get('boundingBox');
      var dragImage;
      var icon = container.one('.icon');
      debugger;
      // Chome creates drag images in a silly way, so CSS background
      // tranparency doesn't work and if part of the drag image is off-screen,
      // that part is simply white.  Therefore, we clone the image and place it
      // safely on-screen but burried at a very low z-index.
      if (icon) {
        dragImage = Y.one('body')
          .appendChild(icon.cloneNode(true))
            .setStyle('z-index', -1000)
            .setStyle('height', icon.one('img').get('height'))
            .setStyle('width', icon.one('img').get('width'));
      } else {
        dragImage =
          container.one('.icon') ||
          container.one('.charm-icon') ||
          container.one('.category-icon');
      }
      // Since the browser's dataTransfer mechanism only accepts string values
      // we have to JSON encode the charm data.
      var charmData = Y.JSON.stringify(this.charmAttributes);
      this._makeDraggable(container, dragImage, charmData);
      // We need all the children to participate.
      container.all('*').each(function(element) {
          this._makeDraggable(element, dragImage, charmData);
      }, this);
    },

    /**
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @param {Node} container The contaner to render into.  Mainly for
     *   testing.
     * @method renderUI
     */
    renderUI: function() {
      var content = this.TEMPLATE(this.getAttrs());
      var container = this.get('contentBox');
      var outerContainer = container.ancestor('.yui3-charmtoken')
        .addClass('yui3-u');
      container.setHTML(content);
    },

  }, {
    ATTRS: {
      /**
       * @attribute description
       * @default ''
       * @type {String}
       */
      description: {
        value: ''
      },

      /**
       * @attribute shouldShowIcon
       * @default false
       * @type {Boolean}
       */
      shouldShowIcon: {
        value: false
      },

      /**
        The id of the charm to render
        @attribute id
        @default undefined
        @type {String}
      */
      id: {},

      /**
         @attribute is_approved
         @default undefined
         @type {Boolean}

       */
      is_approved: {},

      /**
       * @attribute mainCategory
       * @default null
       * @type {String}
       *
       */
      mainCategory: {
        value: null
      },

      /**
       * @attribute name
       * @default ''
       * @type {String}
       */
      name: {
        value: ''
      },

      /**
       * @attribute recent_commit_count
       * @default undefined
       * @type {Number}
       */
      recent_commit_count: {},

      /**
       * @attribute recent_download_count
       * @default undefined
       * @type {Number}
       */
      recent_download_count: {},

      /**
         Supports size attributes of small and large that turn into the css
         class around the charm token.

         @attribute size
         @default SIZE_SMALL
         @type {String}

       */
      size: {
        value: 'small'
      },
      /**
       * Should the charm token be draggable?
       *
       * @attribute isDraggable
       * @default true
       * @type {Boolean}
       *
       */
      isDraggable: {
        value: true
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'event-tracker',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'widget',
    'widget-child'
  ]
});
