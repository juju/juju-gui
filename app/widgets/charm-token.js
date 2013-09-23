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
  ns.Token = Y.Base.create('Token', Y.Widget, [
    Y.Event.EventTracker,
    Y.WidgetChild
  ], {
    TEMPLATE: Y.namespace('juju.views').Templates['charm-token'],

    /**
    * Default general initializer method.
    *
    * @method initializer
    * @param {Object} config The widget configuration options.
    * @return {undefined} Nothing.
    */
    initializer: function(cfg) {
      // Extract the charm configuration values from the jumble of widget
      // cfg options.
      var charmAttributes = Y.Object.keys(Y.juju.models.Charm.ATTRS);
      // @property charmData Contains the extracted charm information.
      this.charmData = Y.aggregate({}, cfg, false, charmAttributes);
    },

    /**
      Setter for the boundingBox attribute

      **Override vs YUI to prevent node id setting based on Charm**

      @method _setBB
      @private
      @param {Node|String} the node to use for the bounding box.
      @return {Node} the generated bounding box.
    */
    _setBB: function(node) {
      // Blank out the ID part of the boundingBox. We don't want the
      // charm-token id="" to be set based on the actual Charm model
      // data passed in.
      // The Y.Widget will generate a YUID for the node automatically.
      return this._setBox(undefined, node, this.BOUNDING_TEMPLATE, true);
    },

    /**
     * Generate a function that records drag and drop data when a drag starts.
     *
     * @method _makeDragStartHandler
     * @param {String} charmData The JSON encoded charm attributes.
     * @return {undefined} Nothing.
     */
    _makeDragStartHandler: function(charmData) {
      var container = this.get('boundingBox');
      return function(evt) {
        var icon = container.one('.icon'),
            iconSrc;
        evt = evt._event; // We want the real event.
        var dataTransfer = evt.dataTransfer;
        iconSrc = icon.one('img').getAttribute('src');
        dataTransfer.effectAllowed = 'copy';
        var dragData = {
          charmData: charmData,
          dataType: 'token-drag-and-drop',
          iconSrc: iconSrc
        };
        // Must be 'Text' because IE10 doesn't treat this as key/value pair
        dataTransfer.setData('Text', JSON.stringify(dragData));
        if (dataTransfer.setDragImage) {
          dataTransfer.setDragImage(icon.getDOMNode(), 0, 0);
        }
        // This event is registered on many nested elements, but we only have
        // to handle the drag start once, so stop now.
        evt.stopPropagation();
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
    _makeDraggable: function(element, charmData) {
      element.setAttribute('draggable', 'true');
      this.addEvent(element.on('dragstart',
          this._makeDragStartHandler(charmData)));
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
      var charmData,
          container = this.get('boundingBox');
      // Adjust the id to meet Charm model expectations.
      this.charmData.id = this.charmData.url;
      // Since the browser's dataTransfer mechanism only accepts string values
      // we have to JSON encode the charm data.  This passed-in config includes
      // charm attributes.
      charmData = Y.JSON.stringify(this.charmData);
      this._makeDraggable(container, charmData);
      // We need all the children to participate.
      container.all('*').each(function(element) {
        this._makeDraggable(element, charmData);
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
      container.ancestor('.yui3-token').addClass('yui3-u');
      container.setHTML(content);
      if (this.get('isDraggable')) {
        this._addDraggability();
      }
    }

  }, {
    ATTRS: {
      /**
       * @attribute downloads
       * @default undefined
       * @type {Number}
       */
      downloads: {},

      /**
       * Force a specific icon url to be used.
       *
       * @attribute iconUrl
       * @default undefined
       * @type {String}
       *
       */
      iconUrl: {},

      /**
         @attribute is_approved
         @default undefined
         @type {Boolean}

       */
      is_approved: {},

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
       * @attribute owner
       * @default undefined
       * @type {String}
       *
       */
      owner: {},

      /**
       * @attribute series
       * @default undefined
       * @type {String}
       *
       */
      series: {},

      /**
       * @attribute shouldShowIcon
       * @default false
       * @type {Boolean}
       */
      shouldShowIcon: {
        value: false
      },

      /**
        Supports size attribute that is in turn used as the CSS class around
        the charm token.

        Sizes include tiny, small, large.

        @attribute size
        @default SIZE_SMALL
        @type {String}
      */
      size: {
        value: 'small'
      },

      /**
        The id used for querying the charmworld data store.
        @attribute id
        @default undefined
        @type {String}
      */
      storeId: {}

    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'event-tracker',
    'handlebars',
    'juju-charm-models',
    'juju-templates',
    'juju-view-utils',
    'widget',
    'widget-child'
  ]
});
