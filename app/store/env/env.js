/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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
 * The main entry point for store environments.
 *
 * @module env
 */

YUI.add('juju-env', function(Y) {

  // Default to the Go environment.
  var DEFAULT_BACKEND = 'go';

  /**
   * Create and return a store environment suitable for connecting to the
   * provided API backend.
   *
   * @method newEnvironment
   * @static
   * @param {Object} options Attributes used for instantiating the environment.
   * @param {String} apiBackend The name of the API backend this environment
   *   connects to.
   * @return {Object} The environment instance.
   */
  Y.namespace('juju').newEnvironment = function(options, apiBackend) {
    var environments = Y.namespace('juju.environments');
    var apiBackends = {
      'go': environments.GoEnvironment,
      'python': environments.PythonEnvironment
    };
    var backend = apiBackend || DEFAULT_BACKEND;
    var Environment = apiBackends[backend] || apiBackends[DEFAULT_BACKEND];
    return new Environment(options);
  };

}, '0.1.0', {
  requires: [
    'base',
    'juju-env-go',
    'juju-env-python'
  ]
});
