'use strict';


YUI.add('subapp-browser-fullscreen', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Browser Sub App for the Juju Gui.
   *
   * @class FullScreen
   * @extends {juju.browser.views.MainView}
   *
   */
  ns.FullScreen = Y.Base.create('browser-view-fullscreen', ns.MainView, [], {
    template: views.Templates.fullscreen,

    /**
     * Render out the view to the DOM.
     *
     * @method render
     * @param {Node} container optional specific container to render out to.
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
    'browser-tabview',
    'juju-charm-models',
    'juju-templates',
    'juju-views',
    'subapp-browser-charmview',
    'subapp-browser-mainview',
    'view'
  ]
});
