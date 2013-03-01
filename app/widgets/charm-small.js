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

    TEMPLATE: Y.namespace('juju.views').Templates['charm-small-widget'],

    /**
     * Initializer.
     *
     * @method initialize
     * @return {undefined} Mutates only.
     */
    initializer: function(cfg) {},

    /**
     * Create the nodes required by this widget and attach them to the DOM.
     *
     * @method renderUI
     * @return {undefined} Mutates only.
     */
    renderUI: function() {
      var content = this.TEMPLATE(this.getAttrs());
      this.get('contentBox').append(content);
    },

    /**
     * Attach event listeners which bind the UI to the widget state.
     * Hover causes the "Add" button to display.
     * Clicking add fires the add signal.
     *
     * @method bindUI
     * @return {undefined} Mutates only.
     */
    bindUI: function() {
      var add_button = this.get('contentBox').one('button');
      this.on('mouseover', function() {
        add_button.removeClass('hidden');
      });
      this.on('mouseout', function() {
        add_button.addClass('hidden');
      });
      add_button.on('click', function() {
        this.fire(ns.CHARM_ADD);
      });
    }
  }, {
    ATTRS: {
      title: {value: ''},
      description: {value: ''},
      rating: {value: 0},
      iconfile: {value: ''},
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
