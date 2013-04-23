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
       * @attribute icon
       * @default ''
       * @type {String}
       */
      icon: {
        value: ''
      },

      /**
        The id of the charm to render
        @default undefined
        @type {String}
      */
      id: {},

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
      recent_download_count: {}
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
