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

    /**
     * Given a set of Charms generate a CharmSlider widget with that data.
     *
     * @method _generateSliderWidget
     * @param {Object} results Object of Charm Data from the API.
     *
     */
    _generateSliderWidget: function(results) {
      var sliderCharms = this.get('store').resultsToCharmlist(results),
          sliderWidgets = [];

      sliderCharms.each(function(charm) {
        sliderWidgets.push(
            new Y.juju.widgets.browser.CharmSmall(charm.getAttrs()));
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

      // build widgets used in the template.
      this.search = new widgets.browser.Search({
        fullscreenTarget: this._fullscreenTarget
      });
      this.search.render(tplNode.one('.bws-search'));

      if (typeof container !== 'object') {
        container = this.get('container');
      }

      // By default we grab the editorial content from the api to use for
      // display.
      this.get('store').sidebarEditorial({
        'success': function(data) {
          var sliderContainer = container.one('.bws-left .slider');
          this.slider = this._generateSliderWidget(data.result.slider);
          if (this.slider) {
            this.slider.render(sliderContainer);
          }

          // Add in the charm-smalls for the new as well.
          var newContainer = container.one('.bws-left .new');
          var newCharms = this.get('store').resultsToCharmlist(
              data.result['new']);
          newCharms.map(function(charm) {
            var node = Y.Node.create('<div>'),
                widget = new Y.juju.widgets.browser.CharmSmall(
                charm.getAttrs());
            widget.render(node);
            newContainer.append(node);
          });
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

      container.setHTML(tplNode);
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
      this._renderEditorialView(container);

      // Bind our view to the events from the search widget used for controls.
      this._bindSearchWidgetEvents();
    }

  }, {
    ATTRS: {
      /**
       * An instance of the Charmworld API object to hit for any data that
       * needs fetching.
       *
       * @attribute store
       * @default undefined
       * @type {Charmworld0}
       *
       */
      store: {}
    }
  });

}, '0.1.0', {
  requires: [
    'browser-charm-slider',
    'browser-charm-small',
    'browser-search-widget',
    'juju-charm-store',
    'juju-models',
    'juju-templates',
    'subapp-browser-mainview',
    'view'
  ]
});
