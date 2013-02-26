'use strict';

/**
 * Provide the LandscapeModule class.
 *
 * @module topology
 * @submodule topology.landscape
 */

YUI.add('juju-topology-landscape', function(Y) {
  var views = Y.namespace('juju.views'),
      models = Y.namespace('juju.models'),
      d3ns = Y.namespace('d3');

  /**
   * Handle Landscape integration within a Topology.
   *
   * @class LandscapeModule
   */
  var LandscapeModule = Y.Base.create('LandscapeModule', d3ns.Module, [], {
    /**
     * Update Landscape links as needed.
     *
     * @method update
     * @returns {undefined} Nothing.
     */
    update: function() {
      var topo = this.get('component');
      var db = topo.get('db');
      var env = db.environment;
      var container = this.get('container');

      views.utils.updateLandscapeBottomBar(env, env, container, 'environment');
    }
  }, {
    ATTRS: {}

  });
  views.LandscapeModule = LandscapeModule;
}, '0.1.0', {
  requires: [
    'node',
    'event',
    'd3-components',
    'juju-models',
    'juju-env',
    'juju-view-utils'
  ]
});
