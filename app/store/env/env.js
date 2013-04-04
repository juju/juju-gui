'use strict';

/**
 * The main entry point for store environments.
 *
 * @module env
 */

YUI.add('juju-env', function(Y) {

  // Default to the Python environment.
  var DEFAULT_BACKEND = 'python';

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
      'python': environments.PythonEnvironment,
      'sandbox': environments.SandboxEnvironment
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
