'use strict';

YUI.add('charm-small', function(Y) {

  var ns = Y.namespace('juju.widgets');
  ns.CharmSmall = Y.Base.create('CharmSmall', Y.Widget, [], {
    initialize: function(cfg) {}, 
  }, {
    ATTRS: {
      charm_name: {value: ''},  
      description: {value: ''},
      rating: {value: 0},
      icon: {value: ''},
      container: {value: null}
    }  
  });

}, '0.1.0', {
  requires: [
    'base',
    'widget',
  ]
});
