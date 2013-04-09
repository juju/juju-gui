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
  ns.CharmToken = Y.Base.create('CharmToken', Y.Widget, [Y.WidgetChild], {

    _events: [],
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
      this._events.push(addClick);
    },

    /**
     * Detach listeners for DOM events.
     *
     * @method _unbindEvents
     */
    _unbindEvents: function() {
      Y.Array.each(this._events, function(item) {
        item.detach();
      });
    },

    /**
     * Attach event listeners which bind the UI to the widget state.
     * Clicking add fires the add signal.
     *
     * @method bindUI
     */
    bindUI: function() {
      this._unbindEvents();
      this._bindEvents();
    },

    /**
     * Destructor
     *
     * @method destructor
     */
    destructor: function() {
      this._unbindEvents();
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
       * @attribute recent_commits
       * @default undefined
       * @type {Number}
       */
      recent_commits: {},

      /**
       * @attribute recent_downloads
       * @default undefined
       * @type {Number}
       */
      recent_downloads: {}
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'widget',
    'widget-child'
  ]
});
