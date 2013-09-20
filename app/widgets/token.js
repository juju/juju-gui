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
 * Provides the token widget, for display a small unit of charm/bundle
 * information.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser
 */
YUI.add('browser-token', function(Y) {

  var ns = Y.namespace('juju.widgets.browser');
  ns.EVENT_CHARM_ADD = 'charm-token-add'; // XXX Is this unused?
  ns.Token = Y.Base.create('Token', Y.Widget, [
    Y.Event.EventTracker,
    Y.WidgetChild
  ], {
    TEMPLATE: Y.namespace('juju.views').Templates['token'],

    /**
    * Default general initializer method.
    *
    * @method initializer
    * @param {Object} config The widget configuration options.
    * @return {undefined} Nothing.
    */
    initializer: function(cfg) {
      // At this point we don't know if the jumble of widget config options
      // contains a charm or a bundle, so we sniff the data to see if is
      // charm-like or bundle-like.
      var isCharm = true; // TODO When we have bundle models make this a real.
      var model;
      if (isCharm) {
        this.type = 'charm';
        model = Y.juju.models.Charm;
      } else { // Otherwise it is a bundle.
        throw 'We can not handle this code path yet.  We need a bundle model.';
        this.type = 'bundle';
        model = Y.juju.models.Bundle;
      }
      // Extract the charm/bundle configuration values from the jumble of
      // widget cfg options.
      var attributes = Y.Object.keys(model.ATTRS);
      // @property data Contains the extracted information.
      this.data = Y.aggregate({}, cfg, false, attributes);
    },

    /**
      Setter for the boundingBox attribute.

      Override default YUI behavior to prevent node ID setting based on the
      charm/bundle's ID.

      @method _setBB
      @private
      @param {Node|String} the node to use for the bounding box.
      @return {Node} the generated bounding box.
    */
    _setBB: function(node) {
      // Blank out the ID part of the boundingBox. We don't want the token ID
      // to be set based on the actual model data passed in.  The Y.Widget will
      // generate a YUID for the node automatically.
      return this._setBox(undefined, node, this.BOUNDING_TEMPLATE, true);
    },

    /**
     * Generate a function that records drag and drop data when a drag starts.
     *
     * @method _makeDragStartHandler
     * @param {String} data The JSON encoded charm/bundle attributes.
     * @return {undefined} Nothing.
     */
    _makeDragStartHandler: function(data) {
      var container = this.get('boundingBox');
      return function(evt) {
        var icon = container.one('.icon'),
            iconSrc;
        evt = evt._event; // We want the real event.
        var dataTransfer = evt.dataTransfer;
        iconSrc = icon.one('img').getAttribute('src');
        dataTransfer.effectAllowed = 'copy';
        var dragData = {
          data: data,
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
     * @param {String} data The JSON encoded charm/bundle attributes.
     * @return {undefined} Nothing.
     */
    _makeDraggable: function(element, data) {
      element.setAttribute('draggable', 'true');
      this.addEvent(element.on('dragstart',
          this._makeDragStartHandler(data)));
    },

    /**
     * Make the token draggable.
     *
     * @method _addDraggability
     * @param {Node} container The node which contains the token list.
     * @param {Node} dragImage The node which will be displayed during
     *   dragging.
     * @return {undefined}  Nothing; side-effects only.
    */
    _addDraggability: function() {
      var data,
          container = this.get('boundingBox');
      // Adjust the ID to meet model expectations.
      this.data.id = this.data.url;
      // Since the browser's dataTransfer mechanism only accepts string values
      // we have to JSON encode the data.  This passed-in config includes charm
      // attributes.
      data = Y.JSON.stringify(this.data);
      this._makeDraggable(container, data);
      // We need all the children to participate.
      container.all('*').each(function(element) {
        this._makeDraggable(element, data);
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
       * Should the token be draggable?
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
        the token.

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
