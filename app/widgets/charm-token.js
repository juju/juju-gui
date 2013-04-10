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
     * Set up and bind DOM events.
     *
     * @method _bindEvents
     */
    _bindEvents: function() {
      var addButton = this.get('contentBox').one('button'),
          addClick = addButton.on('click', function() {
            this.fire(ns.EVENT_CHARM_ADD);
          });
      this.addEvent(addClick);
    },

    /**
     * Attach event listeners which bind the UI to the widget state.
     * Clicking add fires the add signal.
     *
     * @method bindUI
     */
    bindUI: function() {
      this._detachEvents();
      this._bindEvents();
    },

    /**
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @method renderUI
     */
    renderUI: function() {
      var content = this.TEMPLATE(this.getAttrs());
      this.get('contentBox').setHTML(content);
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
