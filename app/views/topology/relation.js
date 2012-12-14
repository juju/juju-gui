'use strict';

YUI.add('juju-topology-relation', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * @module topology-relations
   * @class RelationModule
   * @namespace views
   **/
  var RelationModule = Y.Base.create('RelationModule', d3ns.Module, [], {
    initializer: function(options) {
      RelationModule.superclass.constructor.apply(this, arguments);
    },

    render: function() {
      RelationModule.superclass.render.apply(this, arguments);
      return this;
    },

    update: function() {
      RelationModule.superclass.update.apply(this, arguments);
      return this;
    }

  }, {
    ATTRS: {}

  });
  views.RelationModule = RelationModule;
}, '0.1.0', {
  requires: [
    'd3',
    'd3-components',
    'node',
    'event',
    'juju-models',
    'juju-env'
  ]
});
