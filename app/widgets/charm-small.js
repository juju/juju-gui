'use strict';


/**
 * Provide the Charm Small widget.
 *
 * @module widgets
 * @submodule widgets.charm-small
 */
YUI.add('browser-charm-small', function(Y) {

  var ns = Y.namespace('juju.widgets.browser');
  ns.EVENT_CHARM_ADD = 'charm-small-add';
  ns.CharmSmall = Y.Base.create('CharmSmall', Y.Widget, [], {

    _events: [],
    TEMPLATE: Y.namespace('juju.views').Templates['charm-small-widget'],

    /**
     * Set up and bind DOM events.
     *
     * @method _bind_events
     * @private
     * @return {undefined} Mutates only.
     */
    _bind_ui: function() {
      var addButton = this.get('contentBox').one('button');
      var addClick = addButton.on('click', function() {
        this.fire(ns.EVENT_CHARM_ADD);
      });
      this._events.push(addClick);
    },

    /**
     * Detach listeners for DOM events.
     *
     * @method _unbind_events
     * @private
     * @return {undefined} Mutates only.
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
     * @return {undefined} Mutates only.
     */
    bindUI: function() {
      this._unbind_ui();
      this._bind_ui();
    },

    /**
     * Desctructor
     *
     * @method destructor
     * @return {undefined} Mutates only.
     */
    destructor: function(cfg) {
      this._unbind_ui();
    },

    /**
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @method renderUI
     * @return {undefined} Mutates only.
     */
    renderUI: function() {
      var content = this.TEMPLATE(this.getAttrs());
      this.get('contentBox').setHTML(content);
    }

  }, {
    ATTRS: {
      title: {value: ''},
      description: {value: ''},
      rating: {value: 0},
      iconfile: {value: ''}
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'handlebars',
    'juju-templates',
    'widget'
  ]
});
