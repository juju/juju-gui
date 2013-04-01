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

    TEMPLATE: Y.namespace('juju.views').Templates['charm-token'],

    /**
     * Set up and bind DOM events.
     *
     * @method _bind_events
     * @private
     */
    _bind_ui: function() {
      var addButton = this.get('contentBox').one('button'),
          addClick = addButton.on('click', function() {
            this.fire(ns.EVENT_CHARM_ADD);
          });
      this._events.push(addClick);
    },

    /**
     * Detach listeners for DOM events.
     *
     * @method _unbind_events
     * @private
     */
    _unbind_ui: function() {
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
      this._unbind_ui();
      this._bind_ui();
    },

    /**
     * Destructor
     *
     * @method destructor
     */
    destructor: function() {
      this._unbind_ui();
    },
    /**
     * Initializer
     *
     * @method initializer
     */
    initializer: function(cfg) {
      this._events = [];
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
      commits: {},
      description: {
        value: ''
      },
      recent_commits: {},
      recent_downloads: {},
      icon: {},
      name: {
        value: ''
      },
      tested_providers: {
        value: []
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'handlebars',
    'juju-templates',
    'widget',
    'widget-child'
  ]
});
