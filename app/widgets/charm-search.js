'use strict';

/**
 * The widget used across Browser view to manage the search box and the
 * controls for selecting which view you're in.
 *
 */
YUI.add('browser-search-widget', function(Y) {
  var ns = Y.namespace('juju.widgets.browser'),
      templates = Y.namespace('juju.views').Templates;

  ns.Search = Y.Base.create('search-widget', Y.Widget, [], {
    _events: [],

    EVT_CLEAR_SEARCH: 'clear_search',
    EVT_TOGGLE_VIEWABLE: 'toggle_viewable',
    EVT_TOGGLE_FULLSCREEN: 'toggle_fullscreen',
    EVT_UPDATE_SEARCH: 'update_search',
    EVT_SEARCH_CHANGED: 'search_changed',

    TEMPLATE: templates['browser-search'],

    _toggle_fullscreen: function (ev) {
      this.fire(this.EVT_TOGGLE_FULLSCREEN);
    },

    _toggle_viewable: function (ev) {
      this.fire(this.EVT_TOGGLE_VIEWABLE);
    },

    /**
     * detach listeners for dom events.
     *
     * @method _unbind_events
     * @private
     * @return {undefined} mutates only.
     */
    _unbind_ui: function() {
      Y.array.each(this._events, function(item) {
        item.detach();
      });
    },

    bindUI: function() {
      var container = this.get('boundingBox');

      this._events.push(
        container.one('.bws-icon').on(
          'click', this._toggle_viewable, this)
      );
      this._events.push(
        container.one('.toggle-fullscreen').on(
          'click', this._toggle_fullscreen, this)
      );

      // Note that the search could be updated either from our internal input
      // control, or it could come from someone outside of the widget asking
      // it to update to a specific value. This is how things like clicking
      // categories can work.
      this._events.push(
        container.one('input').on('valuechange', function(ev) {
          this.fire(this.EVT_SEARCH_CHANGED);
        }, this)
      );
    },

    clear_search: function(ev) {
      this.get('contentBox').one('input').set('value', '');
    },

    destructor: function() {
      this._unbind_ui();
    },

    initializer: function(cfg) {
      /**
       * Fires when the "Charm Browser" link is checked. Needs to communicate
       * with the parent view so that it can handle filters and the like. This
       * widget only needs to clear the search input box.
       *
       */
      this.publish(this.EVT_TOGGLE_VIEWABLE);
      this.publish(this.EVT_TOGGLE_FULLSCREEN);
      this.publish(this.EVT_SEARCH_CHANGED);
    },

    renderUI: function() {
      this.get('contentBox').setHTML(
        this.TEMPLATE(this.getAttrs())
      );
    },

    syncUI: function() {
    },

    update_search: function (newval) {
      this.get('boundingBox').one('input').set('value', newval);
    },

  }, {
    ATTRS: {

      /**
       * @attribute term
       * @default undefined
       * @type {String}
       *
       */
      term: {}

    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'event-valuechange',
    'juju-templates',
    'widget'
  ]
});
