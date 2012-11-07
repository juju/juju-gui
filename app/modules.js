GlobalConfig = {
  debug: false,
  // YUI will not try to download already registered modules
  ignoreRegistered: true,

  groups: {
    juju: {
      modules: {
        'juju-views': {
          use: [
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
