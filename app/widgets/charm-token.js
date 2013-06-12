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
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @method renderUI
     */
    renderUI: function() {
      var content = this.TEMPLATE(this.getAttrs());
      var container = this.get('contentBox');
      container.setHTML(content);
      container.ancestor('.yui3-charmtoken').addClass('yui3-u');
    }

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
       * @attribute showIcon
       * @default false
       * @type {Boolean}
       */
      showIcon: {
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
