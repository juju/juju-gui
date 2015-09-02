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
 * Provides the Token widget, for displaying a small amount of charm/bundle
 * information.
 *
 * @namespace juju
 * @module widgets
 * @submodule browser
 */
YUI.add('browser-token', function(Y) {

  var ns = Y.namespace('juju.widgets.browser');
  var utils = Y.namespace('juju.views.utils');
  ns.EVENT_CHARM_ADD = 'charm-token-add';  // XXX Is this used?
  ns.Token = Y.Base.create('Token', Y.Widget, [
    Y.Event.EventTracker,
    Y.WidgetChild
  ], {
    /**
    * Default general initializer method.
    *
    * @method initializer
    * @param {Object} config The widget configuration options.
    * @return {undefined} Nothing.
    */
    initializer: function(cfg) {
      var templates = Y.namespace('juju.views').Templates;
      // Extract the charm/bundle values from the jumble of widget
      // cfg options.
      var attributes;
      var type;
      if (utils.determineEntityDataType(cfg) === 'charm') {
        attributes = Y.Object.keys(Y.juju.models.Charm.ATTRS);
        this.TEMPLATE = templates['charm-token'];
        type = 'charm';
      } else {
        attributes = Y.Object.keys(Y.juju.models.Bundle.ATTRS);
        this.TEMPLATE = templates['bundle-token'];
        type = 'bundle';
      }
      // @property tokenData Contains the extracted information.
      this.tokenData = Y.aggregate({}, cfg, false, attributes);
      this.tokenData.type = type;
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
      // Blank out the ID part of the boundingBox. We don't want the token ID
      // to be set based on the actual model data passed in.
      // The Y.Widget will generate a YUID for the node automatically.
      return this._setBox(undefined, node, this.BOUNDING_TEMPLATE, true);
    },

    /**
     * Generate a function that records drag and drop data when a drag starts.
     *
     * @method _makeDragStartHandler
     * @param {String} tokenData The JSON encoded attributes.
     * @return {Function} The drag start handler function.
     */
    _makeDragStartHandler: function(tokenData) {
      var container = this.get('boundingBox');
      return function(evt) {
        var icon = container.one('.icon'),
            iconSrc;
        evt = evt._event; // We want the real event.
        var dataTransfer = evt.dataTransfer;
        iconSrc = icon.one('img').getAttribute('src');
        dataTransfer.effectAllowed = 'copy';
        var dragData = {
          data: tokenData,
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
     * @param {String} tokenData The JSON encoded attributes.
     * @return {undefined} Nothing.
     */
    _makeDraggable: function(element, tokenData) {
      element.setAttribute('draggable', 'true');
      this.addEvent(element.on('dragstart',
          this._makeDragStartHandler(tokenData)));
    },

    /**
     * Make the token draggable.
     *
     * @method _addDraggability
     * @param {Node} container The node which contains the token container.
     * @param {Node} dragImage The node which will be displayed during
     *   dragging.
     * @return {undefined}  Nothing; side-effects only.
    */
    _addDraggability: function() {
      var tokenData,
          container = this.get('boundingBox');
      // Since the browser's dataTransfer mechanism only accepts string values
      // we have to JSON encode the data.  This passed-in config includes
      // charm/bundle attributes.
      tokenData = Y.JSON.stringify(this.tokenData);
      this._makeDraggable(container, tokenData);
      // We need all the children to participate.
      container.all('*').each(function(element) {
        this._makeDraggable(element, tokenData);
      }, this);
    },

    /**
      Setter for the charmIcons attribute. Strips only the
      required data from the charm_metadata which
      was passed in and sorts it into the proper order.

      @method setter
      @param {Object} data The charm metadata
    */
    _charmIconsSetter: function(data) {
      if (data) {
        return utils.charmIconParser(data);
      }
      return [];
    },

    /**
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @param {Node} container The contaner to render into.  Mainly for
     *   testing.
     * @method renderUI
     */
    renderUI: function() {
      var attrs = this.getAttrs();
      attrs.id = attrs.id.replace(/^cs:/, '');
      var content = this.TEMPLATE(attrs);
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
        Bundle charm metadata

        @attribute services
        @default undefined
        @type {Object}
      */
      services: {
        /**
          Sets the charmIcons attribute with the services.

          @method setter
          @param {Object} data The charm metadata.
          @return {Object} The original value passed in.
        */
        setter: function(data) {
          if (data) { this.set('charmIcons', data); }
          return data;
        }
      },
      /**
        An array of the data required to display the appropriate
        number of charm icons in the proper order for bundle tokens.
        This value is set by the setter for the services
        attribute.

        @attribute charmIcons
        @default []
        @type {Array}
      */
      charmIcons: {
        setter: '_charmIconsSetter'
      },

      /**
       * @attribute deployButton
       * @default false
       * @type {Boolean}
       */
      deployButton: {
        value: false
      },

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
       * Bundle specific attribute for the number of services in a bundle.
       * @attribute serviceCount
       * @default undefined
       * @type {Number}
       *
       */
      serviceCount: {},

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
        The ID used for querying the charmworld data store.

        @attribute storeId
        @default undefined
        @type {String}
      */
      storeId: {},

      /**
        The kind of item represented by this token.  The value can be either
        "charm" or "bundle".

        @attribute type
        @default undefined
        @type {String}
      */
      type: {
        // The function name is quoted to keep the yuidoc linter happy.
        'getter': function() {
          return utils.determineEntityDataType(this.tokenData);
        }
      },

      /**
       * Bundle specific count of the number of units a bundle is expected to
       * bring up.
       *
       * @attribute unitCount
       * @default undefined
       * @type {Number}
       *
       */
      unitCount: {}

    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'event-tracker',
    'handlebars',
    'juju-charm-models',
    'juju-bundle-models',
    'juju-templates',
    'juju-view-utils',
    'widget',
    'widget-child'
  ]
});
