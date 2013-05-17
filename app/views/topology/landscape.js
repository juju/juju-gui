/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012  Canonical Ltd.
Copyright (C) 2013  Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
     * @return {undefined} Nothing.
     */
    update: function() {
      var topo = this.get('component');
      var db = topo.get('db');
      var env = db.environment;
      var container = this.get('container');

      views.utils.updateLandscapeBottomBar(topo.get('landscape'), env, env,
          container);
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
