'use strict';


/**
 * Browser SubApp Sidebar View handler.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-sidebar', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views');


  /**
   * Sidebar master view for the gui browser.
   *
   * @class Sidebar
   * @extends {juju.browser.views.MainView}
   *
   */
  ns.Sidebar = Y.Base.create('browser-view-sidebar', ns.MainView, [], {
    template: views.Templates.sidebar,

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      var tpl = this.template(),
          tplNode = Y.Node.create(tpl);

      this._renderSearchWidget(tplNode);

      if (typeof container !== 'object') {
        container = this.get('container');
      } else {
        this.set('container', container);
      }

      container.setHTML(tplNode);
      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();
    }

  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: [
    'browser-search-widget',
    'juju-templates',
    'subapp-browser-mainview',
    'view'
  ]
});
