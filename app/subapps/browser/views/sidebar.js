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
    _events: [],
    template: views.Templates.sidebar,
    visible: true,

    /**
     * @attribute events
     *
     */
    events: {
    },

    /**
     * Bind the non native DOM events from within the View. This includes
     * watching widgets used for their exposed events.
     *
     * @method _bindEvents
     * @private
     *
     */
    _bindEvents: function() {
      // Watch the Search widget for changes to the search params.
      this._events.push(
          this.search.on(
              this.search.EVT_UPDATE_SEARCH, this._searchChanged, this)
      );

      this._events.push(
          this.search.on(
              this.search.EVT_TOGGLE_VIEWABLE, this._toggleSidebar, this)
      );
    },

    _generate_slider_widget: function(results) {
      var slider_charms = this.get('store').results_to_charmlist(results),
          slider_widgets = [];

      slider_charms.each(function(charm) {
        slider_widgets.push(
            new Y.juju.widgets.browser.CharmSmall(charm.getAttrs()));
      });

      if (slider_widgets.length) {
        var slider = new Y.juju.widgets.browser.CharmSlider({
          items: Y.Array.map(slider_widgets, function(widget) {
            var node = Y.Node.create('<div>');
            widget.render(node);
            return node.getHTML();
          })
        });
        return slider;
      } else {
          return false;
      }
    },

    /**
     * When the search term or filter is changed, fetch new data and redraw.
     *
     * @method _searchChanged
     * @param {Event} ev event object from catching changes.
     * @private
     *
     */
    _searchChanged: function(ev) {
      console.log('Sidebar search changed.');
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
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      console.log('sidebar view destructor');
      Y.Array.each(this._events, function(ev) {
        ev.detach();
      });

      if (this.slider) {
        this.slider.destroy();
      }
    },

    /**
     * General YUI initializer.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {
      this.set('store', new Y.juju.Charmworld0({
        'api_host': window.juju_config.charmworld_url
      }));
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      var tpl = this.template(),
          tplNode = Y.Node.create(tpl),
          store = this.get('store');

      // build widgets used in the template.
      this.search = new widgets.browser.Search(),
      this.search.render(tplNode.one('.bws-search'));

      if (typeof container !== 'object') {
        container = this.get('container');
      }

      // By default we grab the editorial content from the api to use for
      // display.
      this.get('store').sidebar_editorial({
        'success': function(data) {
          var slider_container = container.one('.bws-left .slider');
          this.slider = this._generate_slider_widget(data.result.slider);
          if (this.slider) {
            this.slider.render(slider_container);
          }

          // Add in the charm-smalls for the new as well.
          var new_container = container.one('.bws-left .new');
          var new_charms = Y.Array.map(data.result['new'], function(charm) {
            var node = Y.Node.create('<div>'),
                widget = new Y.juju.widgets.browser.CharmSmall(charm);
            widget.render(node);
            new_container.append(node);
          });
        },

        'failure': function(data, request) {
        }
      }, this);

      container.setHTML(tplNode);

      // Bind extra events that aren't covered by the Y.View events object.
      this._bindEvents();
    }

  }, {
    ATTRS: {
      store: {}
    }
  });

}, '0.1.0', {
  requires: [
    'browser-charm-slider',
    'browser-charm-small',
    'browser-search-widget',
    'juju-charm-store',
    'view'
  ]
});
