/*global YUI:false*/
'use strict';


YUI.add('subapp-browser-fullscreen', function(Y) {
  var ns = Y.namespace('juju.browser.views');

  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class FullScreen
   * @extends {Y.View}
   *
   */
  ns.FullScreen = Y.Base.create('browser-view-fullscreen', Y.View, [], {
    // template: views.Templates.browser,

    /**
     * @attribute events
     *
     */
    events: {},

    /**
     * Gereral YUI initializer.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {},

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function() {
      console.log('rendered in view one');
      this.get('container').setHTML('Hey! I\'m view one');
      return this;
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {}

  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: ['view']
});
