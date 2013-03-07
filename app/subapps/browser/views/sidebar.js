'use strict';


YUI.add('subapp-browser-sidebar', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views');

  /**
   * Sidebar master view for the gui browser.
   *
   * @class Sidebar
   * @extends {Y.View}
   *
   */
  ns.Sidebar = Y.Base.create('browser-view-sidebar', Y.View, [], {
    template: views.Templates.sidebar,

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
    initializer: function(cfg) {
      // Create the CharmPanel instance.
      debugger;
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      if (!Y.Lang.isValue(container)) {
        container = this.get('container');
      }
      container.setHTML(this.template({}));
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
  requires: [
    'view',
  ]
});
