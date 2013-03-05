YUI.add('subapp-browser-fullscreen', function(Y) {
  var ns = Y.namespace('juju.browser.views');

  ns.FullScreen = Y.Base.create('browser-view-fullscreen', Y.View, [], {
    // template: views.Templates.browser,

    events: {},

    initializer: function() {},

    render: function() {
      console.log('rendered in view one');
      this.get('container').setHTML('Hey! I\'m view one');
      return this;
    },

    destructor: function() {}

  }, {
    ATTRS: {}
  });

}, '0.1.0', {
  requires: ['view']
});


// 'use strict';

/*
 * Main Gui Browser module.
 *
 * Init the browser into the DOM via
 *
 * var bws = Y.juju.views.browser;
 * var browser = new bws.BrowserView();
 * browser.render(Y.one('#browser_container'));
 *
 * Force a redraw into a specific view mode via the EVENT_DRAW
 *
 * browser.fire(bws.EVENT_DRAW, {
 *   display_mode: bws.SIDEPANEL
 * });
 *
 * @module juju.views.browser
 * @namespace juju.views
 * @module browser
 *
 */
// YUI.add('juju-browser', function(Y) {
// 
//   var views = Y.namespace('juju.views'),
//       utils = Y.namespace('juju.views.utils'),
//       models = Y.namespace('juju.models'),
//       ns = Y.namespace('juju.views.browser');
// 
// 
//   // Constants referenced for working with the view. Use these vs string
//   // values when calling out to render, update, etc.
//   ns.SIDEPANEL = 'sidepanel';
//   ns.WIDESCREEN = 'wide';
//   ns.HIDDEN = 'hidden';
// 
// 
//   // EVENTS to be triggered by outside code.
//   ns.EVENT_DRAW = 'draw';
//   ns.EVENT_CLEARFILTER = 'clear_filter';
// 
// 
//   /**
//    * Provide a master View managing the CharmBrowser functionality of the gui.
//    *
//    * @class BrowserView
//    * @extends {Y.View}
//    *
//    */
//   views.BrowserView = Y.Base.create('BrowserView', Y.View, [], {
//     template: views.Templates.browser,
// 
//     /**
//      * Bind hooks for any non-dom events in our control.
//      *
//      * @method _bind_events
//      * @private
//      *
//      */
//     _bind_events: function() {
//       var that = this;
// 
//       // Pass in an updated display_mode to update render or to show/hide.
//       that.on(ns.EVENT_DRAW, that._draw, that);
//       that.on(ns.EVENT_CLEARFILTER, that._clear_filter, that);
//     },
// 
//     /**
//      * Reset the browsing filter in place.
//      *
//      * @method _clear_filter
//      * @private
//      *
//      */
//     _clear_filter: function() {
//       var that = this;
//       this.filter_control = new models.browser.Filter();
//       // and watch this filter control for changes.
//       that.filter_control.on('change', this._draw, that);
//     },
// 
//     /**
//      * Draw or redraw the display based on the current config. This is meant
//      * to be interacted with via events so made private. It expects to get the
//      * event facade as an argument to determine changes to things like the
//      * display mode at event time vs the current instance value.
//      *
//      * @method draw
//      * @param {Event} ev a YUI event to redraw.
//      * @private
//      *
//      */
//     _draw: function(ev) {
//       if (ev.display_mode) {
//         this.set('display_mode', ev.display_mode);
//       }
//     },
// 
//     /**
//      * Bound DOM related events. Note that there are other events handled in
//      * bind_events.
//      *
//      */
//     events: {
//       '.hide': {
//         'click': function(ev) {
//           this.fire(ns.EVENT_DRAW, {
//             display_model: ns.HIDDEN
//           });
//         }
//       }
//     },
// 
//     /**
//      * Default initializer
//      *
//      * @method initialize
//      * @param {Ojbect} cfg Object of configuration data for the object.
//      *
//      */
//     initializer: function(cfg) {
//       // Monitor the filter control for changes and update the view as
//       // required.
//       this._clear_filter();
//       this._bind_events();
//     },
// 
//     /**
//      * Render View to the DOM.
//      *
//      * @method render
//      * @param {Node} parent A Node instance to render into.
//      *
//      */
//     render: function(parent) {
//       this.set('container', parent);
//       parent.setHTML(this.template({
// 
//       }));
//     }
// 
//   }, {
//     ATTRS: {
//       /**
//        * @attribute display_model
//        * @default ns.WIDESCREEN
//        * @type {String}
//        *
//        */
//       display_mode: {
//         value: ns.WIDESCREEN
//       }
//     }
//   });
// 
// 
// }, '0.1.0', {
//   requires: [
//     'base',
//     'view',
//     'juju-browser-models',
//     'juju-views',
//     'juju-view-utils',
//     'juju-templates',
//     'handlebars'
//   ]
// });
