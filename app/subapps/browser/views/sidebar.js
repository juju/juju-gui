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
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');

  /**
   * Sidebar master view for the gui browser.
   *
   * @class Sidebar
   * @extends {Y.View}
   *
   */
  ns.Sidebar = Y.Base.create('browser-view-sidebar', Y.View, [], {
    template: views.Templates.sidebar,
    visible: true,

    /**
     * @attribute events
     *
     */
    events: {
      '.sidebar-toggle': {
        click: '_toggleSidebar'
      }
    },

    /**
     * Toggle the visibility of the sidebar. Bound to nav controls in the
     * view, however this will be expanded to be controlled from the new
     * constant nav menu outside of the view once it's completed.
     *
     * @method _toggle_sidebar
     * @param {Event} ev event to trigger the toggle.
     *
     */
    _toggleSidebar: function(ev) {
      var sidebar = Y.one('#bws-sidebar');

      if (this.visible) {
        sidebar.hide();
        this.visible = false;
      } else {
        sidebar.show();
        this.visible = true;
      }
    },

    /**
     * General YUI initializer.
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
    render: function(container) {
      // build widgets used in the template.
      var search = new widgets.browser.Search(),
          tpl = this.template(),
          tpl_node = Y.Node.create(tpl);

      search.render(tpl_node.one('.bws-search'));

      if (typeof container !== 'object') {
        container = this.get('container');
      }
      container.setHTML(tpl_node);
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
    'browser-search-widget',
    'view'
  ]
});
