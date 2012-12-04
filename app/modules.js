var GlobalConfig = {
  debug: false,
  // YUI will not download the modules. They are supposed to be already loaded.
  ignoreRegistered: true,
  base: '/juju-ui/assets/',

  // Please use this object only for defining new aliases.
  // You can add the fullpath to the libraries in "modules-debug.js".
  groups: {
    juju: {
      modules: {
        'juju-views': {
          use: [
            'd3-components',
            'juju-templates',
            'juju-notifications',
            'juju-view-utils',
            'juju-view-environment',
            'juju-view-service',
            'juju-view-unit',
            'juju-view-charm',
            'juju-view-charm-collection'
          ]
        },

        // 'juju-controllers' is just an alias for the modules defined by 'use'
        // If we use "requires: ['juju-controllers']" that means
        // "requires: ['juju-env', 'juju-charm-store',
        // 'juju-notification-controller']"
        'juju-controllers': {
          use: ['juju-env', 'juju-charm-store', 'juju-notification-controller']
        },

        'juju-gui': {
          fullpath: '/juju-ui/assets/app.js'
        }
      }
    }
  }
};
