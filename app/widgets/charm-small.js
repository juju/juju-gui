'use strict';

YUI.add('charm-small', function(Y) {

  var ns = Y.namespace('juju.widgets');
  ns.CharmSmall = Y.Base.create('CharmSmall', Y.Widget, [], {

    TEMPLATE: Y.namespace('juju.views').Templates['charm-small-widget'],

    initialize: function(cfg) {}, 

    renderUI: function() {
      var content = this.TEMPLATE({
        iconfile: this.get('iconfile'),
        title: this.get('title'),
        description: this.get('description'),
        rating: this.get('rating'),
      });
      this.get('contentBox').append(content);
      this.get('container').append(this.get('boundingBox'));
    },
  }, {
    ATTRS: {
      title: {value: ''},  
      description: {value: ''},
      rating: {value: 0},
      iconfile: {value: ''},
      container: {value: null}
    }  
  });

}, '0.1.0', {
  requires: [
    'base',
    'handlebars',
    'juju-templates',
    'widget',
  ]
});
