GlobalConfig = {
  debug: false,
  // YUI will not download the modules. They are supposed to be already loaded.
  ignoreRegistered: true,

  groups: {
    d3: {
      modules: {
        'd3': {
          'fullpath': '/juju-ui/assets/javascripts/d3.v2.min.js'
        },
        'd3-components': {
          fullpath: '/juju-ui/assets/javascripts/d3-components.js'
        }
      }
    },
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
        }
      }
    }
  }
};
