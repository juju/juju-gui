'use strict';


/**
 * Provides new tab and tabview widgets with some additional functions for
 * jujugui.
 *
 * @namespace juju
 * @module browser
 * @submodule widgets
 */
YUI.add('browser-tabview', function(Y) {
  var ns = Y.namespace('juju.widgets.browser');

  /**
   * Tabview provides extra rendering options--it can be rendered with the
   * tabs horizontally rendered like Y.TabView, or vertically.
   *
   * @class Y.juju.widgets.browser.TabView
   * @extends {Y.TabView}
   */
  ns.TabView = Y.Base.create('juju-browser-tabview', Y.TabView, [], {

    /**
     * Renders the DOM nodes for the widget.
     *
     * @method renderUI
     */
    renderUI: function() {
      ns.TabView.superclass.renderUI.apply(this);
      if (this.get('vertical')) {
        this.get('contentBox').addClass('vertical');
      }
    }
  }, {
    ATTRS: {

      /**
       * @attribute vertical
       * @default false
       * @type {boolean}
       */
      vertical: {
        value: false
      }
    }
  });

}, '0.1.0', {
  requires: [
    'array-extras',
    'base',
    'tabview'
  ]
});
