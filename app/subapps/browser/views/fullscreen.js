/*global YUI:false*/
'use strict';


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
