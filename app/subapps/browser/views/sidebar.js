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
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * Sidebar master view for the gui browser.
   *
   * @class Sidebar
   * @extends {juju.browser.views.MainView}
   *
   */
  ns.Sidebar = Y.Base.create('browser-view-sidebar', ns.MainView, [], {
    _fullscreenTarget: '/bws/fullscreen',

    template: views.Templates.sidebar,
    visible: true,

    events: {
      '.charm-token': {
        'click': '_handleTokenSelect'
      }
    },

    /**
     * Given a set of Charms generate a CharmSlider widget with that data.
     *
     * @method _generateSliderWidget
     * @param {Object} sliderCharms BrowserCharmList of Charms from the API.
     *
     */
    _generateSliderWidget: function(sliderCharms) {
      var sliderWidgets = [];

      sliderCharms.each(function(charm) {
        sliderWidgets.push(
            new Y.juju.widgets.browser.CharmToken(charm.getAttrs()));
      });

      if (sliderWidgets.length) {
        var slider = new Y.juju.widgets.browser.CharmSlider({
          items: Y.Array.map(sliderWidgets, function(widget) {
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
     * Event handler for selecting a charm from a list on the page. Forces a
     * render of the charm details view for the user.
     *
     * @method _handleTokenSelect
     * @param {Event} ev the click event from the charm token.
     *
     */
    _handleTokenSelect: function(ev) {
      var id = ev.currentTarget.getData('charmid');
      var model = this._cacheCharms.getById(id);

      // Show the details view for this model.
      this._renderCharmDetails(
          model,
          this.get('container')
      );
    },

    /**
     * Initially we load editorial content to populate the sidebar. Build this
     * content.
     *
     * @method _renderEditorialView
     * @param {Node} container A node to stick the rendered output into.
     *
     */
    _renderEditorialView: function(container) {
      var tpl = this.template(),
          tplNode = Y.Node.create(tpl),
          store = this.get('store');

      this._renderSearchWidget(tplNode);

      if (typeof container !== 'object') {
        container = this.get('container');
      } else {
        this.set('container', container);
      }

      container.setHTML(tplNode);

      // By default we grab the editorial content from the api to use for
      // display.
      this.get('store').sidebarEditorial({
        'success': function(data) {
          var sliderCharms = this.get('store').resultsToCharmlist(
              data.result.slider);
          var sliderContainer = container.one('.bws-left .slider');
          this.slider = this._generateSliderWidget(sliderCharms);
          if (this.slider) {
            this.slider.render(sliderContainer);
          }

          // Add in the charm tokens for the new as well.
          var newContainer = container.one('.bws-left .new');
          var newCharms = this.get('store').resultsToCharmlist(
              data.result['new']);
          newCharms.map(function(charm) {
            var node = Y.Node.create('<div>'),
                widget = new Y.juju.widgets.browser.CharmToken(
                charm.getAttrs());
            widget.render(node);
            newContainer.append(node);
          });

          // Add the charms to the cache for use in other views.
          // Start with a reset to empty any current cached models.
          this._cacheCharms.reset(newCharms);
          this._cacheCharms.add(sliderCharms);
        },

        'failure': function(data, request) {
          var message;
          if (data && data.type) {
            message = 'Charm API error of type: ' + data.type;
          } else {
            message = 'Charm API server did not respond';
          }
          this.get('db').notifications.add(
              new models.Notification({
                title: 'Failed to load sidebar content.',
                message: message,
                level: 'error'
              })
          );
        }
      }, this);
    },

    /**
     * Destroy this view and clear from the dom world.
     *
     * @method destructor
     *
     */
    destructor: function() {
      if (this.slider) {
        this.slider.destroy();
      }
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function(container) {
      if (this.get('charmID')) {
        this._renderCharmView(container);
      } else {
        this._renderEditorialView(container);
      }
      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();
    }

  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: [
    'browser-charm-slider',
    'browser-charm-token',
    'browser-search-widget',
    'juju-charm-store',
    'juju-models',
    'juju-templates',
    'subapp-browser-charmview',
    'subapp-browser-mainview',
    'view'
  ]
});
